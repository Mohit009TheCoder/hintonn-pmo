const fs = require('fs');
const path = require('path');

async function makeAdmin() {
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

  if (serviceAccount) admin.initializeApp({ credential: cert(serviceAccount), projectId: 'hintonn-pmo' });
  else admin.initializeApp({ projectId: 'hintonn-pmo' }); // ADC — pinned to the real project

  const firestoreMod = await import('firebase-admin/firestore');
  const db = firestoreMod.getFirestore();

  const emailToMakeAdmin = 'mohithintonn@gmail.com';
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', emailToMakeAdmin).get();
  
  let found = false;

  if (!snapshot.empty) {
    for (const doc of snapshot.docs) {
      await doc.ref.update({
        role: 'Admin',
        approved: true
      });
      console.log(`Updated user ${doc.id} (email match) to Admin and approved.`);
      found = true;
    }
  }

  // Also try googleEmail if standard email didn't match or in addition
  const gSnapshot = await usersRef.where('googleEmail', '==', emailToMakeAdmin).get();
  if (!gSnapshot.empty) {
    for (const doc of gSnapshot.docs) {
      await doc.ref.update({
        role: 'Admin',
        approved: true
      });
      console.log(`Updated user ${doc.id} (googleEmail match) to Admin and approved.`);
      found = true;
    }
  }

  if (!found) {
    console.log(`User ${emailToMakeAdmin} not found in Firestore users collection.`);
  }
}

makeAdmin().then(() => process.exit(0)).catch(console.error);
