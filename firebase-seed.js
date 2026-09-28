// ─── Hintonn PMO — Firebase Firestore Seed Script ───
// Seeds ALL 15 collections with realistic EPC/PMO data
// Usage: node firebase-seed.js

const fs = require('fs');
const path = require('path');

let admin, db, FieldValue;

async function initFirebase() {
  const mod = await import('firebase-admin');
  admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8'));

  admin.initializeApp({
    credential: cert(serviceAccount),
    projectId: 'hintonn-pmo'
  });

  const firestoreMod = await import('firebase-admin/firestore');
  db = firestoreMod.getFirestore();
  FieldValue = firestoreMod.FieldValue;
}

// Helper: batch write
async function seedCollection(collectionName, items) {
  const batch = db.batch();
  items.forEach(item => {
    const ref = db.collection(collectionName).doc(String(item.id));
    batch.set(ref, item);
  });
  await batch.commit();
  console.log(`  ✅ ${collectionName}: ${items.length} documents`);
}

async function seedSingleDoc(collectionName, docId, data) {
  await db.collection(collectionName).doc(docId).set(data);
  console.log(`  ✅ ${collectionName}/${docId}: 1 document`);
}

async function main() {
  await initFirebase();
  console.log('\n🔥 Hintonn PMO — Seeding Firestore (hintonn-pmo)\n');

  // ═══════════════════════════════════════════════
  // 1. MEMBERS
  // ═══════════════════════════════════════════════
  const members = [];
  await seedCollection('members', members);

  // ═══════════════════════════════════════════════
  // 2. PROJECTS
  // ═══════════════════════════════════════════════
  const projects = [];
  await seedCollection('projects', projects);

  // ═══════════════════════════════════════════════
  // 3. TASKS (comprehensive Kanban data)
  // ═══════════════════════════════════════════════
  const tasks = [];
  await seedCollection('tasks', tasks);

  // Update project taskIds
  const taskIdsByProject = {};
  tasks.forEach(t => {
    if (!taskIdsByProject[t.projectId]) taskIdsByProject[t.projectId] = [];
    taskIdsByProject[t.projectId].push(t.id);
  });
  for (const [pid, tids] of Object.entries(taskIdsByProject)) {
    await db.collection('projects').doc(pid).update({ taskIds: tids });
  }
  console.log('  ✅ Project taskIds linked');

  // ═══════════════════════════════════════════════
  // 4. MILESTONES
  // ═══════════════════════════════════════════════
  const milestones = [];
  await seedCollection('milestones', milestones);

  const msIdsByProject = {};
  milestones.forEach(m => {
    if (!msIdsByProject[m.projectId]) msIdsByProject[m.projectId] = [];
    msIdsByProject[m.projectId].push(m.id);
  });
  for (const [pid, mids] of Object.entries(msIdsByProject)) {
    await db.collection('projects').doc(pid).update({ milestoneIds: mids });
  }
  console.log('  ✅ Project milestoneIds linked');

  // ═══════════════════════════════════════════════
  // 5. ISSUES
  // ═══════════════════════════════════════════════
  const issues = [];
  await seedCollection('issues', issues);

  const issueIdsByProject = {};
  issues.forEach(i => {
    if (!issueIdsByProject[i.projectId]) issueIdsByProject[i.projectId] = [];
    issueIdsByProject[i.projectId].push(i.id);
  });
  for (const [pid, iids] of Object.entries(issueIdsByProject)) {
    await db.collection('projects').doc(pid).update({ issueIds: iids });
  }
  console.log('  ✅ Project issueIds linked');

  // ═══════════════════════════════════════════════
  // 6. COMPANIES
  // ═══════════════════════════════════════════════
  const companies = [];
  await seedCollection('companies', companies);

  // ═══════════════════════════════════════════════
  // 7. INVOICES
  // ═══════════════════════════════════════════════
  const invoices = [];
  await seedCollection('invoices', invoices);

  // ═══════════════════════════════════════════════
  // 8. BANK GUARANTEES
  // ═══════════════════════════════════════════════
  const bankGuarantees = [];
  await seedCollection('bankGuarantees', bankGuarantees);

  // ═══════════════════════════════════════════════
  // 9. DLP RECORDS
  // ═══════════════════════════════════════════════
  const dlpRecords = [];
  await seedCollection('dlpRecords', dlpRecords);

  // ═══════════════════════════════════════════════
  // 10. RETENTION RECORDS
  // ═══════════════════════════════════════════════
  const retentionRecords = [];
  await seedCollection('retentionRecords', retentionRecords);

  // ═══════════════════════════════════════════════
  // 11. COMMENTS
  // ═══════════════════════════════════════════════
  const comments = [];
  await seedCollection('comments', comments);

  // ═══════════════════════════════════════════════
  // 12. ACTIVITIES
  // ═══════════════════════════════════════════════
  const activities = [];
  await seedCollection('activities', activities);

  // ═══════════════════════════════════════════════
  // 13. NOTIFICATIONS
  // ═══════════════════════════════════════════════
  const notifications = [];
  await seedCollection('notifications', notifications);

  // ═══════════════════════════════════════════════
  // 14. SETTINGS
  // ═══════════════════════════════════════════════
  await seedSingleDoc('settings', 'workspace_settings', {
    workspaceName: 'Hintonn AI',
    currentUser: 'm3',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD-MMM-YYYY',
    language: 'en',
    theme: 'light',
    notifications: { email: true, push: true, slack: false },
    integrations: { n8n: true, firebase: true, deepgram: true, groq: true },
    updatedAt: new Date().toISOString()
  });

  // ═══════════════════════════════════════════════
  // 15. USERS (auth records)
  // ═══════════════════════════════════════════════
  const users = [
    { uid: 'seed_mohit2', name: 'Mohit Jain', email: 'mohitsjain12104@gmail.com', photoURL: null, role: 'Admin', isActive: true, provider: 'google', createdAt: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() },
  ];
  await seedCollection('users', users);

  console.log('\n🎉 All 15 Firestore collections seeded successfully!');
  console.log('   Collections: members, projects, tasks, milestones, issues, companies, invoices, bankGuarantees, dlpRecords, retentionRecords, comments, activities, notifications, settings, users\n');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});