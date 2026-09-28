const fs = require('fs');

async function wipe() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(fs.readFileSync('/Users/mohitjain/Desktop/hintonn-pmo-firebase-adminsdk-fbsvc-07f21d6fc3.json', 'utf8'));

  try {
    admin.initializeApp({ credential: cert(serviceAccount) });
  } catch(e) {}

  const firestoreMod = await import('firebase-admin/firestore');
  const db = firestoreMod.getFirestore();

  const collections = ['users', 'members', 'projects', 'tasks', 'milestones', 'issues', 'companies', 'invoices', 'bankGuarantees', 'dlpRecords', 'retentionRecords', 'comments', 'activities', 'notifications'];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Wiped ${snapshot.docs.length} docs from ${collection}`);
  }
}

wipe().then(() => process.exit(0)).catch(console.error);
