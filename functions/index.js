/**
 * Hintonn PMO — Cloud Functions (Phase 6)
 *
 * 10 Cloud Functions covering:
 *   Stage 6.1 — Core: health score, invoice notifications, BG expiry alerts
 *   Stage 6.2 — Scheduled: daily/weekly audits, portfolio aggregation, cleanup
 *
 * Runtime: firebase-functions v6.3.0 (2nd gen), firebase-admin v14
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
import { params } from "firebase-functions/v2";

// ---------------------------------------------------------------------------
// Admin bootstrap
// ---------------------------------------------------------------------------
initializeApp();
const db = getFirestore();

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
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

      // --- Tasks ---
      const tasksSnap = await db
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
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
        .collection("projects")
        .doc(projectId)
        .collection("milestones")
        .get()
        .catch(() => ({ docs: [] })); // subcollection may not exist yet
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
        .collection("projects")
        .doc(projectId)
        .collection("issues")
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
      const amountDue = invoice.amountDue ?? 0;

      // Notification
      await db.collection("notifications").add({
        type: "invoice",
        text: `New invoice created: ${billNumber} for ${projectName} — ₹${amountDue.toLocaleString()}`,
        read: false,
        userId: invoice.assigneeId || "all",
        invoiceId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Activity log
      await db.collection("activities").add({
        type: "invoice",
        html: `<strong>New Invoice</strong> — ${billNumber} created for <em>${projectName}</em> (₹${amountDue.toLocaleString()})`,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error(`sendInvoiceNotification failed for ${invoiceId}:`, err);
    }
  }
);

// ---------------------------------------------------------------------------
// 4. scheduleExpiryCheck (BG created → immediate alert if ≤30 days)
// ---------------------------------------------------------------------------
/** Alerts when a newly created bank guarantee is nearing expiry. */
export const scheduleExpiryCheck = onDocumentCreated(
  "/bankGuarantees/{bgId}",
  async (event) => {
    const bgId = event.params.bgId;
    try {
      const bg = event.data?.data();
      if (!bg) return;

      const daysLeft = daysUntil(bg.expiryDate);
      if (daysLeft > 30 || daysLeft <= 0) return; // only alert within 30 days

      await db.collection("notifications").add({
        type: "bankGuarantee",
        text: `BG ${bg.ref || bgId} expires in ${daysLeft} days — Action needed`,
        read: false,
        userId: "all",
        bgId,
        createdAt: FieldValue.serverTimestamp(),
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
 */
export const checkBgExpiry = onSchedule(
  "30 3 * * *",
  async (_event) => {
    try {
      const snap = await db
        .collection("bankGuarantees")
        .where("status", "==", "active")
        .get();

      const batch = db.batch();
      const criticalAlerts = [];

      for (const doc of snap.docs) {
        const bg = doc.data();
        const daysLeft = daysUntil(bg.expiryDate);
        const risk = classifyRisk(daysLeft);
        const newStatus = daysLeft <= 0 ? "expired" : bg.status;

        batch.update(doc.ref, {
          daysLeft,
          risk,
          status: newStatus,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Notification for warning / critical
        if (risk === "critical" || risk === "warning") {
          const notifRef = db.collection("notifications").doc();
          batch.set(notifRef, {
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

      await batch.commit();

      // FCM push for critical BGs (topic broadcast)
      if (criticalAlerts.length > 0) {
        for (const alert of criticalAlerts) {
          try {
            await getMessaging().send({
              topic: "bg-alerts",
              notification: {
                title: alert.title,
                body: alert.body,
              },
              data: { bgId: alert.bgId, type: "bankGuarantee" },
            });
          } catch (fcmErr) {
            console.error("FCM send failed:", fcmErr.message);
          }
        }
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
      const batch = db.batch();
      let alerts = 0;

      for (const doc of snap.docs) {
        const rec = doc.data();
        const daysLeft = daysUntil(rec.dlpExpiry);

        // Update countdown
        batch.update(doc.ref, {
          countdownDays: daysLeft,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Notify if within 30 days
        if (daysLeft <= 30 && daysLeft > 0) {
          const notifRef = db.collection("notifications").doc();
          batch.set(notifRef, {
            type: "dlpExpiry",
            text: `DLP record for ${rec.projectName || doc.id} expires in ${daysLeft} days`,
            read: false,
            userId: "all",
            dlpId: doc.id,
            createdAt: FieldValue.serverTimestamp(),
          });
          alerts++;
        }
      }

      await batch.commit();
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
        else if (score >= 50) atRisk++;
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
 *   notifications — older than 30 days
 *   activities    — older than 90 days
 *   audit_logs    — older than 180 days
 */
export const cleanupExpiredSessions = onSchedule(
  "30 21 * * *",
  async (_event) => {
    try {
      const now = Timestamp.now();
      const stats = {};

      // Notifications > 30 days
      const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const notifSnap = await db
        .collection("notifications")
        .where("createdAt", "<", Timestamp.fromDate(cutoff30))
        .limit(500)
        .get();
      stats.notificationsDeleted = notifSnap.size;
      const notifBatch = db.batch();
      notifSnap.docs.forEach((d) => notifBatch.delete(d.ref));
      if (notifSnap.size > 0) await notifBatch.commit();

      // Activities > 90 days
      const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const actSnap = await db
        .collection("activities")
        .where("createdAt", "<", Timestamp.fromDate(cutoff90))
        .limit(500)
        .get();
      stats.activitiesDeleted = actSnap.size;
      const actBatch = db.batch();
      actSnap.docs.forEach((d) => actBatch.delete(d.ref));
      if (actSnap.size > 0) await actBatch.commit();

      // Audit logs > 180 days
      const cutoff180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const auditSnap = await db
        .collection("audit_logs")
        .where("timestamp", "<", Timestamp.fromDate(cutoff180))
        .limit(500)
        .get();
      stats.auditLogsDeleted = auditSnap.size;
      const auditBatch = db.batch();
      auditSnap.docs.forEach((d) => auditBatch.delete(d.ref));
      if (auditSnap.size > 0) await auditBatch.commit();

      console.log("cleanupExpiredSessions:", JSON.stringify(stats));
    } catch (err) {
      console.error("cleanupExpiredSessions failed:", err);
    }
  }
);
