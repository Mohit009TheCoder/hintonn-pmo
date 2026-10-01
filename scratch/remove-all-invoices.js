const fs = require('fs');
const path = require('path');

async function removeAllInvoices() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));

  try {
    admin.initializeApp({
      credential: cert(sa),
      projectId: 'hintonn-pmo'
    });
  } catch (e) {}

  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  console.log('🚀 Starting removal of all invoices...');

  // 1. Delete all invoices
  const invSnap = await db.collection('invoices').get();
  console.log(`Found ${invSnap.size} invoices in Firestore.`);

  if (invSnap.size > 0) {
    for (let i = 0; i < invSnap.docs.length; i += 400) {
      const batch = db.batch();
      invSnap.docs.slice(i, i + 400).forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log(`✅ Deleted ${invSnap.size} invoices.`);
  }

  // 2. Delete invoice-related notifications
  const notifSnap = await db.collection('notifications').get();
  const invNotifs = notifSnap.docs.filter(d => {
    const data = d.data();
    return data.invoiceId || data.type === 'invoice' || String(data.text || '').toLowerCase().includes('invoice');
  });
  console.log(`Found ${invNotifs.length} invoice-related notifications.`);

  if (invNotifs.length > 0) {
    for (let i = 0; i < invNotifs.length; i += 400) {
      const batch = db.batch();
      invNotifs.slice(i, i + 400).forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log(`✅ Deleted ${invNotifs.length} invoice-related notifications.`);
  }

  // 3. Delete invoice-related activities
  const actSnap = await db.collection('activities').get();
  const invActs = actSnap.docs.filter(d => {
    const data = d.data();
    return data.type === 'invoice' || String(data.html || '').toLowerCase().includes('invoice') || String(data.text || '').toLowerCase().includes('invoice');
  });
  console.log(`Found ${invActs.length} invoice-related activities.`);

  if (invActs.length > 0) {
    for (let i = 0; i < invActs.length; i += 400) {
      const batch = db.batch();
      invActs.slice(i, i + 400).forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log(`✅ Deleted ${invActs.length} invoice-related activities.`);
  }

  // 4. Verify counts
  const invAfter = await db.collection('invoices').count().get();
  const notifAfter = await db.collection('notifications').count().get();
  const actAfter = await db.collection('activities').count().get();

  console.log('\n📊 Final Firestore status:');
  console.log(`   Invoices:      ${invAfter.data().count}`);
  console.log(`   Notifications: ${notifAfter.data().count}`);
  console.log(`   Activities:    ${actAfter.data().count}`);
}

removeAllInvoices()
  .then(() => {
    console.log('\n✨ All invoices have been successfully removed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error removing invoices:', err);
    process.exit(1);
  });
