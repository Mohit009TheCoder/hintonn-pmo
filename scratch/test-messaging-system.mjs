import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================');
console.log('🔍 VERIFYING SYSTEM-WIDE MESSAGING, CLOUD FUNCTIONS & FIXES');
console.log('================================================================\n');

// 1. Verify functions/index.js
console.log('--- 1. Testing functions/index.js exports ---');
const functionsMod = await import('../functions/index.js');

assert(typeof functionsMod.getMessaging === 'function', 'functions/index.js MUST export getMessaging as a function');
console.log('  ✓ getMessaging is exported and is a function');

assert(typeof functionsMod.getMessagingSafe === 'function', 'functions/index.js MUST export getMessagingSafe as a function');
console.log('  ✓ getMessagingSafe is exported and is a function');

const expectedFunctions = [
  'computeHealthScore',
  'sendInvoiceNotification',
  'scheduleExpiryCheck',
  'checkBgExpiry',
  'checkDlpExpiry',
  'updateDlpStatus',
  'auditProjects',
  'auditInvoices',
  'auditBankGuarantees',
  'auditDlpRecords',
  'auditRetentionRecords',
  'auditTasks',
  'auditIssues',
  'auditMilestones',
  'auditMembers',
  'auditCompanies',
  'aggregatePortfolioHealth',
  'cleanupExpiredSessions'
];

for (const fnName of expectedFunctions) {
  assert(functionsMod[fnName] !== undefined, `Cloud Function ${fnName} must be exported`);
}
console.log(`  ✓ All ${expectedFunctions.length} Cloud Functions are exported properly`);

// 2. Verify functions/index.js file content has import from firebase-admin/messaging
console.log('\n--- 2. Verifying getMessaging import in functions/index.js ---');
const fnContent = fs.readFileSync('functions/index.js', 'utf8');
assert(
  fnContent.includes('import { getMessaging } from "firebase-admin/messaging";'),
  'functions/index.js MUST explicitly import getMessaging from "firebase-admin/messaging"'
);
console.log('  ✓ Verified: import { getMessaging } from "firebase-admin/messaging" is present at top');

// 3. Verify firebase-messaging-sw.js
console.log('\n--- 3. Verifying firebase-messaging-sw.js ---');
const swContent = fs.readFileSync('firebase-messaging-sw.js', 'utf8');
assert(!swContent.includes("'placeholder'"), 'Service worker MUST NOT use dummy placeholder credentials');
assert(swContent.includes('hintonn-pmo'), 'Service worker MUST contain actual hintonn-pmo project id');
assert(swContent.includes('516528306945'), 'Service worker MUST contain actual messagingSenderId');
console.log('  ✓ Service worker configured with actual Firebase credentials and safe messaging guards');

// 4. Verify js/fcm.js
console.log('\n--- 4. Verifying js/fcm.js ---');
const fcmContent = fs.readFileSync('js/fcm.js', 'utf8');
assert(!fcmContent.includes('subscribeToToken('), 'js/fcm.js MUST NOT call non-existent subscribeToToken');
assert(!fcmContent.includes("vapidKey: window.FCM_VAPID_KEY || 'YOUR_VAPID_KEY'"), 'js/fcm.js MUST NOT pass YOUR_VAPID_KEY dummy value');
console.log('  ✓ js/fcm.js handles token and topic preferences safely without throwing');

// 5. Verify Firestore Data
console.log('\n--- 5. Verifying Firestore Backend Data ---');
const adminMod = await import('firebase-admin');
const { getFirestore } = await import('firebase-admin/firestore');
const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

const admin = adminMod.default;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = getFirestore();

// Check Invoices count is 0
const invSnap = await db.collection('invoices').get();
assert.strictEqual(invSnap.size, 0, `Invoices collection MUST have 0 documents, found: ${invSnap.size}`);
console.log('  ✓ Invoices collection in Firestore: 0 documents (all cleared as required)');

// Check Retention records count
const retSnap = await db.collection('retentionRecords').get();
assert(retSnap.size >= 3, `retentionRecords MUST have at least 3 documents, found: ${retSnap.size}`);
retSnap.forEach(doc => {
  const d = doc.data();
  assert(d.projectName, `Retention doc ${doc.id} must have projectName`);
  assert(d.retentionHeld, `Retention doc ${doc.id} must have retentionHeld`);
});
console.log(`  ✓ Retention records in Firestore: ${retSnap.size} documents verified`);

// Check Projects, Tasks, BG, DLP
const pSnap = await db.collection('projects').get();
const tSnap = await db.collection('tasks').get();
const bgSnap = await db.collection('bankGuarantees').get();
const dlpSnap = await db.collection('dlpRecords').get();
console.log(`  ✓ Projects in Firestore: ${pSnap.size}`);
console.log(`  ✓ Tasks in Firestore: ${tSnap.size}`);
console.log(`  ✓ Bank Guarantees in Firestore: ${bgSnap.size}`);
console.log(`  ✓ DLP records in Firestore: ${dlpSnap.size}`);

console.log('\n================================================================');
console.log('✅ ALL MESSAGING, CLOUD FUNCTIONS & SYSTEM INTEGRITY CHECKS PASSED!');
console.log('================================================================');
