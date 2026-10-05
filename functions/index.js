/**
 * Hintonn PMO — Cloud Functions (Phase 6)
 *
 * 10 Cloud Functions covering:
 *   Stage 6.1 — Core: health score, invoice notifications, BG expiry alerts
 *   Stage 6.2 — Scheduled: daily/weekly audits, portfolio aggregation, cleanup
 *
 * Runtime: firebase-functions v6.3.0 (2nd gen), firebase-admin v13 (Node 22)
 * Module:  ES ("type": "module" in package.json)
 */

import { initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

import {
  onDocumentWritten,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

// ---------------------------------------------------------------------------
// Configuration / Environment Variables
// ---------------------------------------------------------------------------
const NOTIFICATION_EXPIRY_THRESHOLD_DAYS =
  Number(process.env.NOTIFICATION_EXPIRY_THRESHOLD_DAYS) || 30;
const HEALTH_SCORE_AT_RISK_THRESHOLD =
  Number(process.env.HEALTH_SCORE_AT_RISK_THRESHOLD) || 60;
const HEALTH_SCORE_PORTFOLIO_ALERT_THRESHOLD =
  Number(
    process.env.HEALTH_SCORE_PORTFOLIO_ALERT_THRESHOLD ||
      process.env.HEALTH_SCORE_PORTFALERT_THRESHOLD
  ) || 50;
const SESSION_INACTIVE_DAYS =
  Number(process.env.SESSION_INACTIVE_DAYS) || 30;
const ACTIVITIES_RETAIN_DAYS =
  Number(process.env.ACTIVITIES_RETAIN_DAYS) || 90;
const AUDIT_LOGS_RETAIN_DAYS =
  Number(process.env.AUDIT_LOGS_RETAIN_DAYS) || 180;

// ---------------------------------------------------------------------------
// Admin bootstrap
// ---------------------------------------------------------------------------
initializeApp();
const db = getFirestore();

/** Safe accessor for FCM Messaging instance */
let _messagingInstance = null;
export function getMessagingSafe() {
  if (_messagingInstance) return _messagingInstance;
  try {
    _messagingInstance = getMessaging();
    return _messagingInstance;
  } catch (err) {
    console.warn("FCM getMessaging() initialization warning:", err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a sanitized clone — strips sensitive keys. */
function sanitize(doc) {
  const STRIP = new Set(["password", "token", "secret", "apiKey", "accessToken"]);
  if (!doc) return null;
  const out = { ...doc };
  for (const k of Object.keys(out)) {
    if (STRIP.has(k)) delete out[k];
    // Recurse into nested maps
    if (out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = sanitize(out[k]);
    }
  }
  return out;
}

/** Classify BG risk from days remaining. */
function classifyRisk(days) {
  if (days <= 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "warning";
  return "safe";
}

/** Days remaining from now to a Firestore Timestamp. */
function daysUntil(timestamp) {
  if (!timestamp) return Infinity;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return Infinity;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Batch manager to prevent exceeding Firestore's 500 operations per batch limit. */
class BatchManager {
  constructor(firestore, maxOps = 400) {
    this.db = firestore;
    this.maxOps = maxOps;
    this.batch = firestore.batch();
    this.opCount = 0;
  }
  async update(ref, data) {
    this.batch.update(ref, data);
    this.opCount++;
    if (this.opCount >= this.maxOps) await this.flush();
  }
  async set(ref, data, options) {
    if (options) this.batch.set(ref, data, options);
    else this.batch.set(ref, data);
    this.opCount++;
    if (this.opCount >= this.maxOps) await this.flush();
  }
  async delete(ref) {
    this.batch.delete(ref);
    this.opCount++;
    if (this.opCount >= this.maxOps) await this.flush();
  }
  async flush() {
    if (this.opCount > 0) {
      await this.batch.commit();
      this.batch = this.db.batch();
      this.opCount = 0;
    }
  }
}

/**
 * Dispatches push notifications to both a topic and active users' device tokens.
 */
async function dispatchPushNotification({ topic, role, notification, data }) {
  const messaging = getMessagingSafe();
  if (!messaging) return;

  // 1. Topic broadcast
  if (topic) {
    try {
      await messaging.send({ topic, notification, data });
    } catch (topicErr) {
      console.warn(`Topic send to ${topic} warning:`, topicErr.message);
    }
  }

  // 2. Multicast to active users' fcmTokens
  try {
    let query = db.collection("users").where("isActive", "==", true);
    if (role) {
      query = query.where("role", "==", role);
    }
    const usersSnap = await query.get();
    const tokens = usersSnap.docs
      .map((d) => d.data().fcmToken)
      .filter((t) => typeof t === "string" && t.trim().length > 0);

    const uniqueTokens = [...new Set(tokens)];
    if (uniqueTokens.length > 0) {
      for (let i = 0; i < uniqueTokens.length; i += 400) {
        const chunk = uniqueTokens.slice(i, i + 400);
        const res = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification,
          data,
        });
        res.responses.forEach((resp, idx) => {
          if (
            !resp.success &&
            resp.error?.code === "messaging/registration-token-not-registered"
          ) {
            const staleToken = chunk[idx];
            const docToClean = usersSnap.docs.find(
              (d) => d.data().fcmToken === staleToken
            );
            if (docToClean) {
              docToClean.ref.update({ fcmToken: FieldValue.delete() }).catch(() => {});
            }
          }
        });
      }
    }
  } catch (tokenErr) {
    console.warn(`Multicast send error for ${topic || "notification"}:`, tokenErr.message);
  }
}

// ---------------------------------------------------------------------------
// 1 & 2. computeHealthScore  (merged with recalcCompletionPercent)
// ---------------------------------------------------------------------------
/**
 * Computes the project health score and completion percent whenever a project
 * document is written.
 *
 * Scoring weights:
 *   40 % — task completion ratio
 *   30 % — milestone completion ratio
 *   20 % — schedule adherence (on-time vs overdue)
 *   10 % — open-issue penalty
 */
export const computeHealthScore = onDocumentWritten(
  "/projects/{projectId}",
  async (event) => {
    const projectId = event.params.projectId;
    try {
      const after = event.data?.after?.data();
      if (!after) return; // document was deleted
      const before = event.data?.before?.data();

      // --- Tasks ---
      // NOTE: the client stores tasks in the TOP-LEVEL `tasks` collection
      // with a `projectId` field (see js/store.js) — not as subcollections.
      const tasksSnap = await db
        .collection("tasks")
        .where("projectId", "==", projectId)
        .get();
      const tasks = tasksSnap.docs.map((d) => d.data());
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t) => t.status === "done").length;

      // Schedule adherence — overdue = done but dueDate < now AND not done,
      // plus tasks due today that are not done count as at risk.
      const now = Timestamp.now();
      const overdueTasks = tasks.filter((t) => {
        if (t.status === "done") return false;
        if (!t.dueDate) return false;
        const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return due < now.toDate();
      }).length;
      const onTimeTasks = totalTasks - overdueTasks;

      // --- Milestones ---
      const milestonesSnap = await db
        .collection("milestones")
        .where("projectId", "==", projectId)
        .get()
        .catch(() => ({ docs: [] }));
      // We also accept milestoneIds on the project doc as a fallback
      let totalMilestones = milestonesSnap.docs.length;
      let completedMilestones = milestonesSnap.docs.filter((d) => {
        const m = d.data();
        return m.status === "completed" || m.status === "done";
      }).length;

      // Fallback: if no subcollection, try the milestoneIds array on the project doc
      if (totalMilestones === 0 && after.milestoneIds?.length) {
        const msDocs = await Promise.all(
          after.milestoneIds.map((id) =>
            db.collection("milestones").doc(id).get().catch(() => null)
          )
        );
        const valid = msDocs.filter((d) => d && d.exists);
        totalMilestones = valid.length;
        completedMilestones = valid.filter((d) => {
          const m = d.data();
          return m.status === "completed" || m.status === "done";
        }).length;
      }

      // --- Issues ---
      let openIssues = 0;
      const issuesSnap = await db
        .collection("issues")
        .where("projectId", "==", projectId)
        .get()
        .catch(() => ({ docs: [] }));
      if (issuesSnap.docs.length > 0) {
        openIssues = issuesSnap.docs.filter((d) => {
          const iss = d.data();
          return iss.status !== "closed" && iss.status !== "resolved";
        }).length;
      } else if (after.issueIds?.length) {
        const issDocs = await Promise.all(
          after.issueIds.map((id) =>
            db.collection("issues").doc(id).get().catch(() => null)
          )
        );
        openIssues = issDocs.filter((d) => {
          if (!d || !d.exists) return false;
          const iss = d.data();
          return iss.status !== "closed" && iss.status !== "resolved";
        }).length;
      }

      // --- Weighted health score ---
      const taskRatio = totalTasks > 0 ? doneTasks / totalTasks : 0;
      const milestoneRatio =
        totalMilestones > 0 ? completedMilestones / totalMilestones : 0;
      const scheduleRatio =
        totalTasks > 0 ? onTimeTasks / totalTasks : 1; // perfect if no tasks
      const issuePenalty =
        totalTasks > 0
          ? Math.max(0, 1 - openIssues / Math.max(totalTasks, 1))
          : 1;

      const raw =
        taskRatio * 0.4 +
        milestoneRatio * 0.3 +
        scheduleRatio * 0.2 +
        issuePenalty * 0.1;
      const healthScore = Math.round(raw * 100);
      const completionPercent =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // ── GUARD AGAINST INFINITE SELF-TRIGGER LOOP ──
      // If the computed healthScore and completionPercent have not changed,
      // skip writing to the watched document to prevent recursive invocation.
      if (
        before &&
        before.healthScore === healthScore &&
        before.completionPercent === completionPercent
      ) {
        return;
      }

      await db
        .collection("projects")
        .doc(projectId)
        .update({
          healthScore,
          completionPercent,
          updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error(`computeHealthScore failed for ${projectId}:`, err);
    }
  }
);

// ---------------------------------------------------------------------------
// 3. sendInvoiceNotification
// ---------------------------------------------------------------------------
/** Sends a notification and activity log when a new invoice is created. */
export const sendInvoiceNotification = onDocumentCreated(
  "/invoices/{invoiceId}",
  async (event) => {
    const invoiceId = event.params.invoiceId;
    try {
      const invoice = event.data?.data();
      if (!invoice) return;

      const billNumber = invoice.billNumber || "N/A";
      const projectName = invoice.projectName || "Unknown Project";
      // Prefer the numeric total — amountDue is stored as a formatted
      // display string (e.g. "₹1,25,000") by the client.
      const amountNum =
        typeof invoice.totals?.payable === "number"
          ? invoice.totals.payable
          : Number(String(invoice.amountDue ?? 0).replace(/[^0-9.-]/g, "")) || 0;
      const amountLabel = amountNum.toLocaleString("en-IN");

      // Notification
      await db.collection("notifications").add({
        type: "invoice",
        text: `New invoice created: ${billNumber} for ${projectName} — ₹${amountLabel}`,
        read: false,
        userId: "all",
        invoiceId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Activity log
      await db.collection("activities").add({
        type: "invoice",
        html: `<strong>New Invoice</strong> — ${billNumber} created for <em>${projectName}</em> (₹${amountLabel})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // FCM push for new invoice (topic + active admin users multicast)
      await dispatchPushNotification({
        topic: "invoice-alerts",
        role: "Admin",
        notification: {
          title: "📄 New Invoice Created",
          body: `${billNumber} for ${projectName} (₹${amountLabel})`,
        },
        data: { invoiceId, type: "invoice", amount: String(amountNum) },
      });
    } catch (err) {
      console.error(`sendInvoiceNotification failed for ${invoiceId}:`, err);
    }
  }
);

// ---------------------------------------------------------------------------
// 4. scheduleExpiryCheck (BG created → immediate alert if ≤ threshold)
// ---------------------------------------------------------------------------
/** Alerts when a newly created bank guarantee is nearing expiry. */
export const scheduleExpiryCheck = onDocumentCreated(
  "/bankGuarantees/{bgId}",
  async (event) => {
    const bgId = event.params.bgId;
    try {
      const bg = event.data?.data();
      if (!bg || !bg.expiryDate) return;

      const daysLeft = daysUntil(bg.expiryDate);
      if (
        !Number.isFinite(daysLeft) ||
        daysLeft > NOTIFICATION_EXPIRY_THRESHOLD_DAYS ||
        daysLeft <= 0
      ) {
        return; // only alert within threshold
      }

      await db.collection("notifications").add({
        type: "bankGuarantee",
        text: `BG ${bg.ref || bgId} expires in ${daysLeft} days — Action needed`,
        read: false,
        userId: "all",
        bgId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // FCM push for approaching BG expiry
      await dispatchPushNotification({
        topic: "bg-alerts",
        role: "Admin",
        notification: {
          title: "⚠️ BG Expiry Approaching",
          body: `BG ${bg.ref || bgId} expires in ${daysLeft} days — Action required`,
        },
        data: { bgId, type: "bankGuarantee", daysLeft: String(daysLeft) },
      });
    } catch (err) {
      console.error(`scheduleExpiryCheck failed for ${bgId}:`, err);
    }
  }
);

// ---------------------------------------------------------------------------
// 5. checkBgExpiry  (daily @ 9 AM IST = 3:30 AM UTC)
// ---------------------------------------------------------------------------
/**
 * Runs every day at 09:30 IST. Updates all active bank guarantees:
 * recalculates daysLeft, classifies risk, pushes FCM for critical ones.
 * Uses BatchManager to chunk batches safely under 500 ops.
 */
export const checkBgExpiry = onSchedule(
  "30 3 * * *",
  async (_event) => {
    try {
      const snap = await db
        .collection("bankGuarantees")
        .where("status", "==", "active")
        .get();

      const batchMgr = new BatchManager(db, 400);
      const criticalAlerts = [];

      for (const doc of snap.docs) {
        const bg = doc.data();
        if (!bg.expiryDate) continue; // Skip docs with missing expiry dates

        const daysLeft = daysUntil(bg.expiryDate);
        if (!Number.isFinite(daysLeft)) continue;

        const risk = classifyRisk(daysLeft);
        const newStatus = daysLeft <= 0 ? "expired" : bg.status;

        // Guard against write amplification: update document ONLY if values changed
        if (
          bg.daysLeft !== daysLeft ||
          bg.risk !== risk ||
          bg.status !== newStatus
        ) {
          await batchMgr.update(doc.ref, {
            daysLeft,
            risk,
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // Notification for warning / critical:
        // Alert on risk transitions or milestone countdowns to eliminate daily spam
        const isMilestone =
          risk === "critical"
            ? [30, 15, 7, 3, 1, 0].includes(daysLeft) || bg.risk !== risk
            : daysLeft % 7 === 0 || bg.risk !== risk;

        if ((risk === "critical" || risk === "warning") && isMilestone) {
          const notifRef = db.collection("notifications").doc();
          await batchMgr.set(notifRef, {
            type: "bankGuarantee",
            text: `BG ${bg.ref || doc.id} expires in ${daysLeft} days — ${risk.toUpperCase()}`,
            read: false,
            userId: "all",
            bgId: doc.id,
            createdAt: FieldValue.serverTimestamp(),
          });

          if (risk === "critical") {
            criticalAlerts.push({
              title: "⚠️ BG Critical Alert",
              body: `BG ${bg.ref || doc.id} expires in ${daysLeft} days!`,
              bgId: doc.id,
            });
          }
        }
      }

      await batchMgr.flush();

      // FCM push for critical BGs
      for (const alert of criticalAlerts) {
        await dispatchPushNotification({
          topic: "bg-alerts",
          role: "Admin",
          notification: {
            title: alert.title,
            body: alert.body,
          },
          data: { bgId: alert.bgId, type: "bankGuarantee" },
        });
      }

      console.log(
        `checkBgExpiry: processed ${snap.size} BGs, ${criticalAlerts.length} critical alerts sent.`
      );
    } catch (err) {
      console.error("checkBgExpiry failed:", err);
    }
  }
);

// ---------------------------------------------------------------------------
// 6. checkDlpExpiry  (weekly Monday @ 9 AM IST = 3:30 AM UTC)
// ---------------------------------------------------------------------------
/** Runs every Monday at 09:30 IST. Checks DLP records for approaching expiry. */
export const checkDlpExpiry = onSchedule(
  "30 3 * * 1",
  async (_event) => {
    try {
      const snap = await db.collection("dlpRecords").get();
      const batchMgr = new BatchManager(db, 400);
      let alerts = 0;

      for (const doc of snap.docs) {
        const rec = doc.data();
        if (!rec.dlpExpiry) continue; // Skip docs with missing expiry dates

        const daysLeft = daysUntil(rec.dlpExpiry);
        if (!Number.isFinite(daysLeft)) continue;

        // Update countdown only if changed
        if (rec.countdownDays !== daysLeft) {
          await batchMgr.update(doc.ref, {
            countdownDays: daysLeft,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // Notify ONCE per expiry date when the record first enters the
        // threshold window — no weekly spam for the whole countdown.
        const expiryRaw = rec.dlpExpiry;
        const expiryKey = expiryRaw?.toDate
          ? expiryRaw.toDate().toISOString()
          : String(expiryRaw ?? "");
        if (
          daysLeft <= NOTIFICATION_EXPIRY_THRESHOLD_DAYS &&
          daysLeft > 0 &&
          rec.dlpNotifiedFor !== expiryKey
        ) {
          const notifRef = db.collection("notifications").doc();
          await batchMgr.set(notifRef, {
            type: "dlpExpiry",
            text: `DLP record for ${rec.projectName || doc.id} expires in ${daysLeft} days`,
            read: false,
            userId: "all",
            dlpId: doc.id,
            createdAt: FieldValue.serverTimestamp(),
          });
          await batchMgr.update(doc.ref, { dlpNotifiedFor: expiryKey });
          alerts++;
        }
      }

      await batchMgr.flush();

      // FCM push for DLP records nearing expiry
      if (alerts > 0) {
        await dispatchPushNotification({
          topic: "dlp-alerts",
          role: "Admin",
          notification: {
            title: "⚠️ DLP Expiry Alert",
            body: `${alerts} DLP warranty record(s) expire within ${NOTIFICATION_EXPIRY_THRESHOLD_DAYS} days`,
          },
          data: { type: "dlp", count: String(alerts) },
        });
      }

      console.log(`checkDlpExpiry: processed ${snap.size} records, ${alerts} alerts.`);
    } catch (err) {
      console.error("checkDlpExpiry failed:", err);
    }
  }
);

// ---------------------------------------------------------------------------
// 7. updateDlpStatus
// ---------------------------------------------------------------------------
/** Auto-computes the statusLabel on every DLP record write. */
export const updateDlpStatus = onDocumentWritten(
  "/dlpRecords/{dlpId}",
  async (event) => {
    const dlpId = event.params.dlpId;
    try {
      const after = event.data?.after?.data();
      if (!after) return; // deleted

      const openDefects = after.openDefects ?? 0;
      const readiness = after.readiness ?? 0;
      const now = Timestamp.now();
      const expiry = after.dlpExpiry;
      const expired =
        expiry &&
        (expiry.toDate ? expiry.toDate() : new Date(expiry)) < now.toDate();

      let statusLabel;
      if (expired) {
        statusLabel = "Completed";
      } else if (openDefects === 0) {
        statusLabel = "Exit Ready";
      } else if (openDefects > 0 && readiness >= 90) {
        statusLabel = "Exit Pending";
      } else {
        statusLabel = "In Progress";
      }

      // Only write if changed
      if (after.statusLabel !== statusLabel) {
        await db
          .collection("dlpRecords")
          .doc(dlpId)
          .update({
            statusLabel,
            updatedAt: FieldValue.serverTimestamp(),
          });
      }
    } catch (err) {
      console.error(`updateDlpStatus failed for ${dlpId}:`, err);
    }
  }
);

// ---------------------------------------------------------------------------
// 8. auditLogger
// ---------------------------------------------------------------------------
/**
 * Logs every write on major collections to audit_logs/.
 * Skips audit_logs and settings to prevent infinite loops.
 */
const AUDITED_COLLECTIONS = [
  "projects",
  "invoices",
  "bankGuarantees",
  "dlpRecords",
  "retentionRecords",
  "tasks",
  "issues",
  "milestones",
  "members",
  "companies",
];

/**
 * Creates a Firestore function that watches one collection path.
 * We export one function per collection for tree-shaking & clarity.
 */
function makeAuditFn(collectionName) {
  return onDocumentWritten(`/${collectionName}/{docId}`, async (event) => {
    try {
      const docId = event.params.docId;
      const before = event.data?.before?.data() ?? null;
      const after = event.data?.after?.data() ?? null;

      let action;
      if (!before && after) action = "created";
      else if (before && !after) action = "deleted";
      else action = "updated";

      // Determine userId from auth context if available, else from doc
      const userId =
        event.data?.before?.data()?.userId ||
        event.data?.after?.data()?.userId ||
        "system";

      await db.collection("audit_logs").add({
        userId,
        action,
        collection: collectionName,
        documentId: docId,
        before: sanitize(before),
        after: sanitize(after),
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error(
        `auditLogger (${collectionName}) failed for ${event.params.docId}:`,
        err
      );
    }
  });
}

/** Audit: projects */
export const auditProjects = makeAuditFn("projects");
/** Audit: invoices */
export const auditInvoices = makeAuditFn("invoices");
/** Audit: bankGuarantees */
export const auditBankGuarantees = makeAuditFn("bankGuarantees");
/** Audit: dlpRecords */
export const auditDlpRecords = makeAuditFn("dlpRecords");
/** Audit: retentionRecords */
export const auditRetentionRecords = makeAuditFn("retentionRecords");
/** Audit: tasks */
export const auditTasks = makeAuditFn("tasks");
/** Audit: issues */
export const auditIssues = makeAuditFn("issues");
/** Audit: milestones */
export const auditMilestones = makeAuditFn("milestones");
/** Audit: members */
export const auditMembers = makeAuditFn("members");
/** Audit: companies */
export const auditCompanies = makeAuditFn("companies");

// ---------------------------------------------------------------------------
// 9. aggregatePortfolioHealth  (every 6 hours)
// ---------------------------------------------------------------------------
/**
 * Aggregates all project health scores into workspace_settings for the
 * portfolio dashboard.
 */
export const aggregatePortfolioHealth = onSchedule(
  "0 */6 * * *",
  async (_event) => {
    try {
      const projectsSnap = await db.collection("projects").get();
      const projects = projectsSnap.docs.map((d) => d.data());

      if (projects.length === 0) {
        await db.doc("settings/workspace_settings").set(
          {
            portfolioHealthScore: 0,
            onTrackCount: 0,
            atRiskCount: 0,
            criticalCount: 0,
            totalProjects: 0,
            lastCalculated: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      let totalScore = 0;
      let onTrack = 0;
      let atRisk = 0;
      let critical = 0;

      for (const p of projects) {
        const score = p.healthScore ?? 0;
        totalScore += score;
        if (score >= 80) onTrack++;
        else if (score >= HEALTH_SCORE_AT_RISK_THRESHOLD) atRisk++;
        else critical++;
      }

      const portfolioHealthScore = Math.round(totalScore / projects.length);

      await db.doc("settings/workspace_settings").set(
        {
          portfolioHealthScore,
          onTrackCount: onTrack,
          atRiskCount: atRisk,
          criticalCount: critical,
          totalProjects: projects.length,
          lastCalculated: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `aggregatePortfolioHealth: avg=${portfolioHealthScore}, onTrack=${onTrack}, atRisk=${atRisk}, critical=${critical}`
      );
    } catch (err) {
      console.error("aggregatePortfolioHealth failed:", err);
    }
  }
);

// ---------------------------------------------------------------------------
// 10. cleanupExpiredSessions  (daily @ 3 AM IST = 9:30 PM UTC prev day)
// ---------------------------------------------------------------------------
/**
 * Purges old documents:
 *   notifications — older than SESSION_INACTIVE_DAYS (default 30 days)
 *   activities    — older than ACTIVITIES_RETAIN_DAYS (default 90 days)
 *   audit_logs    — older than AUDIT_LOGS_RETAIN_DAYS (default 180 days)
 *
 * Supports both Firestore Timestamp and client ISO 8601 strings to ensure
 * cleanups succeed regardless of whether documents originated from server SDK
 * or web client.
 */
export const cleanupExpiredSessions = onSchedule(
  "30 21 * * *",
  async (_event) => {
    try {
      const stats = {};

      async function purgeOldDocs(collectionName, fieldName, cutoffDate, maxTotal = 2000) {
        let deletedTotal = 0;
        const cutoffTs = Timestamp.fromDate(cutoffDate);
        const cutoffIso = cutoffDate.toISOString();

        // Support both Firestore Timestamp and client ISO string representations
        const queries = [
          db.collection(collectionName).where(fieldName, "<", cutoffTs).limit(400),
          db.collection(collectionName).where(fieldName, "<", cutoffIso).limit(400),
        ];

        for (const q of queries) {
          while (deletedTotal < maxTotal) {
            const snap = await q.get().catch(() => null);
            if (!snap || snap.empty) break;

            const batch = db.batch();
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
            deletedTotal += snap.size;

            if (snap.size < 400) break;
          }
        }
        return deletedTotal;
      }

      // Notifications > SESSION_INACTIVE_DAYS (default 30)
      const cutoffNotifications = new Date(Date.now() - SESSION_INACTIVE_DAYS * 24 * 60 * 60 * 1000);
      stats.notificationsDeleted = await purgeOldDocs("notifications", "createdAt", cutoffNotifications);

      // Activities > ACTIVITIES_RETAIN_DAYS (default 90)
      const cutoffActivities = new Date(Date.now() - ACTIVITIES_RETAIN_DAYS * 24 * 60 * 60 * 1000);
      stats.activitiesDeleted = await purgeOldDocs("activities", "createdAt", cutoffActivities);

      // Audit logs > AUDIT_LOGS_RETAIN_DAYS (default 180)
      const cutoffAudit = new Date(Date.now() - AUDIT_LOGS_RETAIN_DAYS * 24 * 60 * 60 * 1000);
      stats.auditLogsDeleted = await purgeOldDocs("audit_logs", "timestamp", cutoffAudit);

      console.log("cleanupExpiredSessions:", JSON.stringify(stats));
    } catch (err) {
      console.error("cleanupExpiredSessions failed:", err);
    }
  }
);
