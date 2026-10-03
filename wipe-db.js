const fs = require('fs');

async function wipe() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
// Service-account credentials come from the environment — the key file is
// NOT committed to the repo (see .gitignore). Set:
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
// or rely on Application Default Credentials. If neither is available the
// helper returns null and firebase-admin falls back to ADC.
function loadServiceAccount() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const local = __dirname + '/service-account.json';
  if (fs.existsSync(local)) return JSON.parse(fs.readFileSync(local, 'utf8'));
  return null;
}

  const serviceAccount = loadServiceAccount();

  try {
    if (serviceAccount) admin.initializeApp({ credential: cert(serviceAccount) });
    else admin.initializeApp(); // ADC
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
