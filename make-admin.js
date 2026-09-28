const fs = require('fs');
const path = require('path');

async function makeAdmin() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8'));

  admin.initializeApp({
    credential: cert(serviceAccount)
  });

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
