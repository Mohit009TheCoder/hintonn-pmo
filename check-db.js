const fs = require('fs');

async function check() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(fs.readFileSync('/Users/mohitjain/Desktop/hintonn-pmo-firebase-adminsdk-fbsvc-07f21d6fc3.json', 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: cert(serviceAccount)
    });
  }

  const firestoreMod = await import('firebase-admin/firestore');
  const db = firestoreMod.getFirestore();

  const snapshot = await db.collection('projects').get();
  console.log(`Projects in Firestore: ${snapshot.docs.length}`);
}

check().then(() => process.exit(0)).catch(console.error);
