const fs = require('fs');

async function check() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
// Service-account credentials come from the environment — the key file is
// NOT committed to the repo (see .gitignore). Set:
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
// or rely on Application Default Credentials.
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

  const snapshot = await db.collection('projects').get();
  console.log(`Projects in Firestore: ${snapshot.docs.length}`);
  
  if (snapshot.docs.length > 0) {
    console.log("Project names:");
    snapshot.docs.forEach(doc => console.log(doc.data().name || doc.data().title));
  }
}

check().then(() => process.exit(0)).catch(console.error);
