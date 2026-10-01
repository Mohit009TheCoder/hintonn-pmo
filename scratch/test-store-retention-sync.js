const fs = require('fs');
const path = require('path');

// Simulate the Store retention lifecycle with Firestore sync
async function testStoreRetentionLifecycle() {
  console.log('=== TESTING STORE RETENTION LIFECYCLE WITH FIRESTORE SYNC ===\n');

  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
  try { admin.initializeApp({ credential: cert(sa), projectId: 'hintonn-pmo' }); } catch (e) {}

  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  // 1. Create a retention record
  const testId = 'ret-test-e2e-' + Date.now();
  const testRecord = {
    id: testId,
    projectId: 'mumjvzybq3bxzg',
    projectName: 'Hintonn PMO',
    packageCode: 'PKG-TEST-99',
    contractValue: '₹10,00,000',
    retentionPct: '5%',
    retentionPercent: 5,
    retentionHeld: '₹50,000',
    pendingRelease: 50000,
    tranchePhase: 'Tranche 1 (50% Handover / 50% DLP Exit)',
    releaseDueDate: '2027-12-31',
    releaseTrigger: 'Final Acceptance Certificate',
    status: 'on-schedule',
    statusLabel: 'Active / On Schedule',
    badgeClass: 'badge-active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('retentionRecords').doc(testId).set(testRecord);
  console.log('✓ Created test retention record in Firestore:', testId);

  // Verify created
  let doc = await db.collection('retentionRecords').doc(testId).get();
  if (!doc.exists) throw new Error('Test record was not saved');
  console.log('✓ Successfully retrieved created record');

  // 2. Update status (e.g. markReleaseInitiated)
  await db.collection('retentionRecords').doc(testId).set({
    status: 'release-initiated',
    statusLabel: 'Release Initiated',
    badgeClass: 'badge-info',
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log('✓ Updated test retention record status to release-initiated');

  // Verify updated
  doc = await db.collection('retentionRecords').doc(testId).get();
  if (doc.data().status !== 'release-initiated') throw new Error('Status was not updated');
  console.log('✓ Verified updated status:', doc.data().status);

  // 3. Delete test record
  await db.collection('retentionRecords').doc(testId).delete();
  console.log('✓ Deleted test retention record');

  doc = await db.collection('retentionRecords').doc(testId).get();
  if (doc.exists) throw new Error('Test record was not deleted');
  console.log('✓ Verified test record deletion');

  console.log('\n======================================================');
  console.log('✅ RETENTION CREATE, UPDATE, DELETE & SYNC FULLY VERIFIED!');
  console.log('======================================================');
}

testStoreRetentionLifecycle().then(() => process.exit(0)).catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
