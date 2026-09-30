/**
 * Targeted cleanup: remove SEED billing artifacts from live Firestore (hintonn-pmo).
 * Deletes ONLY precisely-identified seed docs — never real user-created data:
 *   - invoices with the 3 known seed IDs (MMRDA/Pune/Nagpur demo bills)
 *   - companies c1–c5 ONLY when the name matches the known seed company names
 *   - seed activity a4 + notification n2 (invoice seed artifacts)
 * Usage: node cleanup-seed-billing.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry-run');

const SEED_INVOICE_IDS = new Set([
  'HIN-PI-MMRDA-2026-001',
  'HIN-PI-PUNE-2026-001',
  'HIN-PI-NAGPUR-2026-001'
]);
const SEED_COMPANY_NAMES = new Set([
  'MMRDA (Mumbai Metropolitan Region Development Authority)',
  'Pune Metropolitan Region Development Authority',
  'Nagpur Smart & Sustainable City Development Corporation',
  'Hintonn AI (Internal)',
  'Indian Railways — Western Zone'
]);
const SEED_COMPANY_IDS = new Set(['c1', 'c2', 'c3', 'c4', 'c5']);

async function main() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8'));
  try { admin.initializeApp({ credential: cert(sa), projectId: 'hintonn-pmo' }); } catch (e) {}
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  console.log(`\n🔎 Seed billing cleanup for hintonn-pmo ${DRY ? '(DRY RUN — nothing deleted)' : ''}\n`);

  // 1. Invoices — report + delete exact seed IDs
  const invSnap = await db.collection('invoices').get();
  console.log(`invoices collection: ${invSnap.size} docs`);
  const invDeletes = [];
  invSnap.docs.forEach(d => {
    const isSeed = SEED_INVOICE_IDS.has(d.id) ||
      (d.data().billNumber && [...SEED_INVOICE_IDS].some(id => String(d.data().billNumber).includes(id.replace('HIN-PI-', '').replace('-2026-001', ''))));
    if (isSeed) { invDeletes.push(d); console.log(`  🗑 seed invoice: ${d.id}`); }
  });

  // 2. Companies — report + delete only id AND name match
  const coSnap = await db.collection('companies').get();
  console.log(`\ncompanies collection: ${coSnap.size} docs`);
  const coDeletes = [];
  coSnap.docs.forEach(d => {
    const data = d.data() || {};
    const isSeed = SEED_COMPANY_IDS.has(d.id) && SEED_COMPANY_NAMES.has(data.name);
    if (isSeed) { coDeletes.push(d); console.log(`  🗑 seed company: ${d.id} — ${data.name}`); }
  });

  // 3. Seed activity + notification artifacts
  const a4 = await db.collection('activities').doc('a4').get();
  const n2 = await db.collection('notifications').doc('n2').get();
  const extraDeletes = [];
  if (a4.exists) { extraDeletes.push(a4.ref); console.log(`\n  🗑 seed activity: a4`); }
  if (n2.exists && (n2.data().invoiceId === 'inv1' || String(n2.data().text || '').includes('MMRDA/INV'))) {
    extraDeletes.push(n2.ref); console.log(`  🗑 seed notification: n2`);
  }

  const total = invDeletes.length + coDeletes.length + extraDeletes.length;
  console.log(`\n${total === 0 ? 'Nothing to delete — Firestore is already clean of seed billing data.' : `Docs to delete: ${total}`}`);

  if (!DRY && total > 0) {
    // Batch in groups of 400
    const all = [...invDeletes.map(d => d.ref), ...coDeletes.map(d => d.ref), ...extraDeletes];
    for (let i = 0; i < all.length; i += 400) {
      const batch = db.batch();
      all.slice(i, i + 400).forEach(ref => batch.delete(ref));
      await batch.commit();
    }
    console.log('✅ Deleted.');
  }

  // Final counts
  const invAfter = await db.collection('invoices').count().get();
  const coAfter = await db.collection('companies').count().get();
  console.log(`\nRemaining — invoices: ${invAfter.data().count}, companies: ${coAfter.data().count}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Cleanup failed:', err); process.exit(1); });
