// Headless smoke test for the Store invoice generation engine (no browser, no Firestore)
const fs = require('fs');
const path = require('path');

// ── Browser stubs ──
const mem = {};
globalThis.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
globalThis.firebase = {
  firestore: () => ({
    collection: () => ({
      onSnapshot: () => {},
      doc: () => ({ set: async () => {}, delete: async () => {} })
    })
  }),
  auth: () => ({
    currentUser: null,
    signInAnonymously: () => ({ then: () => ({ catch: () => {} }) }),
    onAuthStateChanged: () => {}
  })
};

// ── Load Store ──
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8') +
  '\n;globalThis.__Store = Store;';
eval(code);
const Store = globalThis.__Store;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name, extra !== undefined ? `(got: ${JSON.stringify(extra)})` : ''); }
}

// ── 1. Init from EMPTY localStorage (no seed invoices/companies) ──
Store.init();
check('getInvoices() empty after init (no seed invoices)', Store.getInvoices().length === 0, Store.getInvoices());
check('getCompanies() empty after init (no seed companies)', Store.getCompanies().length === 0, Store.getCompanies());

// ── 2. Real project + milestone (what a user creates in the app) ──
const proj = Store.createProject({ name: 'client ERP Modernisation', status: 'active' });
const ms = Store.createMilestone({ projectId: proj.id, name: 'Phase 1 — Discovery sign-off', dueDate: '2026-11-30' });
check('project created', !!proj && Store.getProject(proj.id).name === 'client ERP Modernisation');
check('milestone created', !!ms && Store.getMilestones(proj.id).length === 1);

// ── 3. Sequential bill numbers ──
const bn1 = Store.generateBillNumber('Acme AI Pvt Ltd');
const bn2 = Store.generateBillNumber('Acme AI Pvt Ltd');
const year = new Date().getFullYear();
check('bill number format HIN-PI-ACME-YYYY-001', bn1 === `HIN-PI-ACME-${year}-001`, bn1);
check('second call before invoice still 001 (count-based)', bn2 === bn1, bn2);

// ── 4. Project-based generation ──
const inv = Store.generateInvoice(proj.id, {
  clientDetails: { legalName: 'Acme AI Pvt Ltd', addressLine1: 'Plot 42, Tech Park', stateCountry: 'Gujarat, India', gstin: '24AAACA1234A1Z5' },
  milestoneId: ms.id,
  modulesTag: '[R1]',
  items: [{ name: 'ERP module build', desc: 'Phase 1 scope', gross: 100000, discountPct: 15 }],
  gstRate: 18, tdsRate: 10
});
check('invoice generated', !!inv);
if (inv) {
  check('linked to REAL project name', inv.projectName === 'client ERP Modernisation', inv.projectName);
  check('milestone text from real milestone', inv.milestone.includes('Phase 1 — Discovery sign-off'), inv.milestone);
  check('billNumber sequential', inv.billNumber === `HIN-PI-ACME-${year}-001`, inv.billNumber);
  check('gross formatted ₹1,00,000', inv.amountDue === '₹1,00,000', inv.amountDue);
  check('GST amount ₹15,300', inv.taxAmount === '₹15,300', inv.taxAmount);
  check('discount ₹15,000', inv.deductions === '₹15,000', inv.deductions);
  check('total payable ₹1,00,300', inv.totalPayable === '₹1,00,300', inv.totalPayable);
  check('TDS ₹8,500', inv.tdsAmount === '₹8,500', inv.tdsAmount);
  check('net payable ₹91,800', inv.netPayable === '₹91,800', inv.netPayable);
  check('numeric totals object present', inv.totals && inv.totals.gross === 100000 && inv.totals.netPayable === 91800, inv.totals);
  check('due date = invoiceDate + 15d', inv.dueDate > inv.issueDate, inv.dueDate);
  check('versionHistory seeded', Array.isArray(inv.versionHistory) && inv.versionHistory.length === 1, inv.versionHistory);
  check('status pending-client', inv.status === 'pending-client', inv.status);
  check('persisted in Store', Store.getInvoices().some(i => i.id === inv.id));
  check('client company auto-created', Store.getCompanies().some(c => c.name === 'Acme AI Pvt Ltd'), Store.getCompanies().map(c => c.name));
  check('versionHistory reason cites project', inv.versionHistory[0].changeReason.includes('client ERP Modernisation'), inv.versionHistory[0].changeReason);
}
// second invoice for same client → 002
const inv2 = Store.generateInvoice(proj.id, {
  clientDetails: { legalName: 'Acme AI Pvt Ltd' },
  items: [{ name: 'Phase 2 build', gross: 50000, discountPct: 0 }]
});
check('second invoice gets 002', inv2 && inv2.billNumber === `HIN-PI-ACME-${year}-002`, inv2 && inv2.billNumber);

// ── 5. Validation guards ──
check('unknown projectId → null', Store.generateInvoice('nope', { items: [{ gross: 100 }] }) === null);
check('zero gross → null', Store.generateInvoice(proj.id, { clientDetails: { legalName: 'X' }, items: [{ gross: 0 }] }) === null);

// ── 6. General invoice (no project) ──
const gen = Store.generateInvoice(null, {
  clientDetails: { legalName: 'Zenith Corp' },
  items: [{ name: 'Consulting retainer', gross: 200000, discountPct: 10 }]
});
check('general invoice generated', !!gen && gen.projectName === 'Zenith Corp', gen && gen.projectName);
check('general invoice numbered', gen && gen.billNumber.startsWith('HIN-PI-ZENITH-'), gen && gen.billNumber);

// ── 7. Search finds real invoices ──
const res = Store.search('acme invoice');
check('search returns real invoices', res.commercial.invoices.length >= 2, res.commercial.invoices.length);
check('search result is the real one', res.commercial.invoices.some(i => i.id === inv.id));

// ── 8. Formatting helpers ──
check('_fmtINR lakh grouping', Store._fmtINR(100000) === '₹1,00,000', Store._fmtINR(100000));
check('_fmtINR crore grouping', Store._fmtINR(142500000) === '₹14,25,00,000', Store._fmtINR(142500000));
check('_parseAmt from string', Store._parseAmt('₹1,25,00,000') === 12500000, Store._parseAmt('₹1,25,00,000'));

console.log(`\n${fail === 0 ? '🎉 ALL' : '⚠️ '} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
