const fs = require('fs');
const path = require('path');

async function syncAllToFirebase() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
  try {
    admin.initializeApp({
      credential: cert(sa),
      projectId: 'hintonn-pmo'
    });
  } catch (e) {}

  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  console.log('🚀 Saving & synchronizing all system data in Firebase Firestore...\n');

  const now = new Date().toISOString();

  // 1. Projects - ensure project codes and essential fields are properly saved
  const projectsUpdates = [
    {
      id: 'mumju70dn5go1w',
      code: 'HIN-CRM',
      name: 'Hintonn CRM',
      description: 'Customer relationship management system with enterprise lead pipeline & quotation workflows.',
      priority: 'high',
      status: 'active',
      type: 'Software',
      startDate: '2026-09-01',
      endDate: '2026-10-30',
      updatedAt: now
    },
    {
      id: 'mumjvzybq3bxzg',
      code: 'HIN-PMO',
      name: 'Hintonn PMO',
      description: 'Full-stack enterprise PMO platform with commercial ledger, AI copilot & Firestore cloud sync.',
      priority: 'critical',
      status: 'active',
      type: 'Software',
      startDate: '2026-09-15',
      endDate: '2026-10-31',
      updatedAt: now
    },
    {
      id: 'munmwa1kg6ryq6',
      code: 'HIN-AIQR',
      name: 'Hintonn AI-QR',
      description: 'AI-powered QR code generation & analytics engine with computer vision verification.',
      priority: 'medium',
      status: 'active',
      type: 'Software',
      startDate: '2026-09-20',
      endDate: '2026-10-30',
      updatedAt: now
    }
  ];

  for (const p of projectsUpdates) {
    await db.collection('projects').doc(p.id).set(p, { merge: true });
    console.log(`✅ Project updated: ${p.name} (${p.code})`);
  }

  // 2. Retention Records - save proper records for all 3 projects
  const retentionRecords = [
    {
      id: 'mup4p57zhge5iz',
      projectId: 'mumju70dn5go1w',
      projectName: 'Hintonn CRM',
      packageCode: 'PKG-CRM-01',
      contractValue: '₹50,00,000',
      retentionPct: '5%',
      retentionPercent: 5,
      retentionHeld: '₹2,50,000',
      pendingRelease: 250000,
      tranchePhase: 'Tranche 1 (50% Handover / 50% DLP Exit)',
      releaseDueDate: '2027-10-01',
      releaseTrigger: 'Commercial Handover Acceptance & Final Defect Liability Clearance Certificate',
      status: 'on-schedule',
      statusLabel: 'Active / On Schedule',
      badgeClass: 'badge-active',
      createdAt: '2026-10-01T06:03:46.223Z',
      updatedAt: now
    },
    {
      id: 'ret-pmo-01',
      projectId: 'mumjvzybq3bxzg',
      projectName: 'Hintonn PMO',
      packageCode: 'PKG-PMO-01',
      contractValue: '₹75,00,000',
      retentionPct: '5%',
      retentionPercent: 5,
      retentionHeld: '₹3,75,000',
      pendingRelease: 375000,
      tranchePhase: 'Tranche 1 (50% Handover / 50% DLP Exit)',
      releaseDueDate: '2027-11-15',
      releaseTrigger: 'Milestone M3 Sign-off & Production Acceptance Certificate',
      status: 'on-schedule',
      statusLabel: 'Active / On Schedule',
      badgeClass: 'badge-active',
      createdAt: '2026-09-29T10:45:41.699Z',
      updatedAt: now
    },
    {
      id: 'ret-aiqr-01',
      projectId: 'munmwa1kg6ryq6',
      projectName: 'Hintonn AI-QR',
      packageCode: 'PKG-AIQR-01',
      contractValue: '₹35,00,000',
      retentionPct: '5%',
      retentionPercent: 5,
      retentionHeld: '₹1,75,000',
      pendingRelease: 175000,
      tranchePhase: 'Tranche 1 (50% Handover / 50% DLP Exit)',
      releaseDueDate: '2027-08-30',
      releaseTrigger: 'Commercial Acceptance & Security Compliance Sign-off',
      status: 'on-schedule',
      statusLabel: 'Active / On Schedule',
      badgeClass: 'badge-active',
      createdAt: '2026-09-30T04:57:39.800Z',
      updatedAt: now
    }
  ];

  for (const ret of retentionRecords) {
    await db.collection('retentionRecords').doc(ret.id).set(ret, { merge: true });
    console.log(`✅ Retention Record saved: ${ret.projectName} (${ret.packageCode}) - ${ret.retentionHeld}`);
  }

  // 3. Bank Guarantees - save BG records for projects
  const bankGuarantees = [
    {
      id: 'bg-crm-01',
      ref: 'BG/HIN/CRM/001',
      projectId: 'mumju70dn5go1w',
      projectName: 'Hintonn CRM',
      type: 'Performance BG',
      bank: 'HDFC Bank Ltd.',
      branch: 'Ahmedabad Main Branch',
      amount: '₹5,00,000',
      amountNum: 500000,
      issueDate: '2026-09-01',
      expiryDate: '2027-09-01',
      claimPeriod: '30 Days post expiry',
      status: 'active',
      daysLeft: 335,
      risk: 'safe',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: now
    },
    {
      id: 'bg-pmo-01',
      ref: 'BG/HIN/PMO/001',
      projectId: 'mumjvzybq3bxzg',
      projectName: 'Hintonn PMO',
      type: 'Advance BG',
      bank: 'ICICI Bank Ltd.',
      branch: 'Nariman Point, Mumbai',
      amount: '₹7,50,000',
      amountNum: 750000,
      issueDate: '2026-09-15',
      expiryDate: '2027-03-31',
      claimPeriod: '30 Days post expiry',
      status: 'active',
      daysLeft: 181,
      risk: 'safe',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: now
    },
    {
      id: 'bg-aiqr-01',
      ref: 'BG/HIN/AIQR/001',
      projectId: 'munmwa1kg6ryq6',
      projectName: 'Hintonn AI-QR',
      type: 'Retention BG',
      bank: 'State Bank of India',
      branch: 'C.G. Road, Ahmedabad',
      amount: '₹1,75,000',
      amountNum: 175000,
      issueDate: '2026-09-20',
      expiryDate: '2027-08-30',
      claimPeriod: '60 Days post expiry',
      status: 'active',
      daysLeft: 333,
      risk: 'safe',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: now
    }
  ];

  for (const bg of bankGuarantees) {
    await db.collection('bankGuarantees').doc(bg.id).set(bg, { merge: true });
    console.log(`✅ Bank Guarantee saved: ${bg.ref} (${bg.projectName}) - ${bg.amount}`);
  }

  // 4. DLP Records - save defect liability period timelines
  const dlpRecords = [
    {
      id: 'dlp-crm-01',
      projectId: 'mumju70dn5go1w',
      projectName: 'Hintonn CRM',
      packageCode: 'PKG-CRM-01',
      warrantyMonths: 12,
      dlpDuration: '12 Months (DLP)',
      startDate: '2026-10-30',
      endDate: '2027-10-30',
      warrantyValue: '₹50,00,000',
      retentionAmount: '₹2,50,000',
      status: 'active',
      claimsCount: 0,
      createdAt: '2026-09-29T10:44:17.533Z',
      updatedAt: now
    },
    {
      id: 'dlp-pmo-01',
      projectId: 'mumjvzybq3bxzg',
      projectName: 'Hintonn PMO',
      packageCode: 'PKG-PMO-01',
      warrantyMonths: 12,
      dlpDuration: '12 Months (DLP)',
      startDate: '2026-10-31',
      endDate: '2027-10-31',
      warrantyValue: '₹75,00,000',
      retentionAmount: '₹3,75,000',
      status: 'active',
      claimsCount: 0,
      createdAt: '2026-09-29T10:45:41.699Z',
      updatedAt: now
    },
    {
      id: 'dlp-aiqr-01',
      projectId: 'munmwa1kg6ryq6',
      projectName: 'Hintonn AI-QR',
      packageCode: 'PKG-AIQR-01',
      warrantyMonths: 6,
      dlpDuration: '6 Months (DLP)',
      startDate: '2026-10-30',
      endDate: '2027-04-30',
      warrantyValue: '₹35,00,000',
      retentionAmount: '₹1,75,000',
      status: 'active',
      claimsCount: 0,
      createdAt: '2026-09-30T04:57:39.800Z',
      updatedAt: now
    }
  ];

  for (const dlp of dlpRecords) {
    await db.collection('dlpRecords').doc(dlp.id).set(dlp, { merge: true });
    console.log(`✅ DLP Record saved: ${dlp.projectName} (${dlp.dlpDuration})`);
  }

  // 5. Milestones - ensure key milestones exist for projects
  const milestones = [
    {
      id: 'munne2b1hyvjcm',
      projectId: 'munmwa1kg6ryq6',
      name: 'LAUNCH PROJECT',
      description: 'Complete production deployment & user sign-off',
      dueDate: '2026-10-30',
      status: 'in-progress',
      taskIds: ['munn6ogojq47hp', 'munnlsx8u1zftu'],
      createdAt: '2026-09-30T05:11:29.581Z',
      updatedAt: now
    },
    {
      id: 'ms-crm-01',
      projectId: 'mumju70dn5go1w',
      name: 'CRM Module Delivery & Handover',
      description: 'Lead management, customer portal & quotation generator delivery',
      dueDate: '2026-10-25',
      status: 'in-progress',
      taskIds: ['munn9dr2qy6tif', 'munna3zf6jfius'],
      createdAt: '2026-09-29T10:44:17.533Z',
      updatedAt: now
    },
    {
      id: 'ms-pmo-01',
      projectId: 'mumjvzybq3bxzg',
      name: 'PMO Architecture & Cloud Sync Go-Live',
      description: 'Firebase real-time synchronization, commercial ledger & user RBAC',
      dueDate: '2026-10-20',
      status: 'in-progress',
      taskIds: ['mumjyi5zzpz9wy'],
      createdAt: '2026-09-29T10:45:41.699Z',
      updatedAt: now
    }
  ];

  for (const ms of milestones) {
    await db.collection('milestones').doc(ms.id).set(ms, { merge: true });
    console.log(`✅ Milestone saved: ${ms.name}`);
  }

  // 6. Settings - ensure workspace settings are properly configured
  await db.collection('settings').doc('workspace_settings').set({
    workspaceName: 'Hintonn AI',
    tagline: 'Enterprise Project Management Office Platform',
    currency: 'INR (₹)',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    updatedAt: now
  }, { merge: true });
  console.log(`✅ Workspace settings saved.`);

  // 7. Verify counts
  console.log('\n📊 Updated Firestore System Status:');
  for (const c of ['projects', 'tasks', 'retentionRecords', 'bankGuarantees', 'dlpRecords', 'milestones', 'issues', 'companies', 'members', 'settings']) {
    const snap = await db.collection(c).get();
    console.log(`   ${c.padEnd(20)}: ${snap.size} docs`);
  }
}

syncAllToFirebase().then(() => {
  console.log('\n✨ ALL SYSTEM DATA SUCCESSFULLY SAVED IN FIREBASE FIRESTORE!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Failed to save system data:', err);
  process.exit(1);
});
