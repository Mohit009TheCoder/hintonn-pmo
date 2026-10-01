const fs = require('fs');
const path = require('path');

async function testRetentionAndFirebase() {
  console.log('=== VERIFYING RETENTION & FIREBASE SYSTEM DATA ===\n');

  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
  try {
    admin.initializeApp({ credential: cert(sa), projectId: 'hintonn-pmo' });
  } catch (e) {}

  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  // 1. Verify Retention Records in Firestore
  const retSnap = await db.collection('retentionRecords').get();
  console.log(`✓ Total Retention Records in Firestore: ${retSnap.size}`);
  if (retSnap.size !== 3) {
    throw new Error(`Expected 3 retention records, found ${retSnap.size}`);
  }

  retSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`  - [${d.id}] ${data.projectName}: Held = ${data.retentionHeld}, Due = ${data.releaseDueDate}, Status = ${data.status}`);
    if (!data.projectName || !data.retentionHeld || !data.releaseDueDate) {
      throw new Error(`Invalid retention record schema in doc ${d.id}`);
    }
  });

  // 2. Verify Bank Guarantees in Firestore
  const bgSnap = await db.collection('bankGuarantees').get();
  console.log(`\n✓ Total Bank Guarantees in Firestore: ${bgSnap.size}`);
  if (bgSnap.size !== 3) {
    throw new Error(`Expected 3 bank guarantees, found ${bgSnap.size}`);
  }

  // 3. Verify DLP Records in Firestore
  const dlpSnap = await db.collection('dlpRecords').get();
  console.log(`\n✓ Total DLP Records in Firestore: ${dlpSnap.size}`);
  if (dlpSnap.size !== 3) {
    throw new Error(`Expected 3 DLP records, found ${dlpSnap.size}`);
  }

  // 4. Verify Projects in Firestore
  const projSnap = await db.collection('projects').get();
  console.log(`\n✓ Total Projects in Firestore: ${projSnap.size}`);
  if (projSnap.size !== 3) {
    throw new Error(`Expected 3 projects, found ${projSnap.size}`);
  }

  console.log('\n======================================================');
  console.log('✅ ALL RETENTION AND SYSTEM DATA VERIFIED IN FIREBASE!');
  console.log('======================================================');
}

testRetentionAndFirebase().then(() => process.exit(0)).catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
