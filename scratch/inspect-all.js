const fs = require('fs');
const path = require('path');

async function inspectAll() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
  try { admin.initializeApp({ credential: cert(sa), projectId: 'hintonn-pmo' }); } catch (e) {}
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  const collections = ['users', 'members', 'projects', 'tasks', 'milestones', 'issues', 'companies', 'invoices', 'bankGuarantees', 'dlpRecords', 'retentionRecords', 'comments', 'activities', 'notifications', 'settings'];

  for (const c of collections) {
    const snap = await db.collection(c).get();
    console.log(`=== Collection: ${c} (${snap.size} docs) ===`);
    snap.docs.forEach(d => {
      const data = d.data();
      const summary = data.name || data.title || data.text || data.projectName || data.email || data.workspaceName || d.id;
      console.log(`  [${d.id}] ${summary}`);
    });
  }
}

inspectAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
