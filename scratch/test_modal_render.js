// Headless render harness: renders BillingScreen modal HTML with stubs, asserts functional IDs
const fs = require('fs');
const path = require('path');

// ── Browser / app stubs ──
const mem = {};
globalThis.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
globalThis.firebase = {
  firestore: () => ({ collection: () => ({ onSnapshot: () => {}, doc: () => ({ set: async () => {}, delete: async () => {} }) }) }),
  auth: () => ({ currentUser: null, signInAnonymously: () => ({ then: () => ({ catch: () => {} }) }), onAuthStateChanged: () => {} })
};
globalThis.Utils = { escapeHtml: s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'), formatDate: d => d || '' };
globalThis.Icons = { fileText: '<svg id="ic-file"></svg>', check: '<svg id="ic-check"></svg>', clock: '<svg id="ic-clock"></svg>', shield: '<svg id="ic-shield"></svg>', plus: '<svg id="ic-plus"></svg>', search: '<svg id="ic-search"></svg>', x: '<svg id="ic-x"></svg>' };
globalThis.Toast = { show: () => {} };
globalThis.Modal = { open: () => {}, closeAll: () => {} };
globalThis.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  head: { appendChild() {} },
  body: { appendChild() {} }
};

// ── Load Store + BillingScreen ──
const load = p => eval(fs.readFileSync(p, 'utf8') + `\n;globalThis.__X_${path.basename(p, '.js')} = typeof Store!=='undefined'?Store:(typeof BillingScreen!=='undefined'?BillingScreen:null);`);
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8') + '\n;globalThis.Store = Store;');
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'screens', 'billing.js'), 'utf8') + '\n;globalThis.BillingScreen = BillingScreen;');

// Seed a REAL project + milestone so the modal has live data to render
Store.init();
const proj = Store.createProject({ name: 'client ERP Modernisation', status: 'active' });
Store.createMilestone({ projectId: proj.id, name: 'Phase 1 — Discovery sign-off', dueDate: '2026-11-30' });

// Existing client + selected project → exercises populated branches of the modal
Store.createCompany({ name: 'Acme AI Pvt Ltd', gstin: '24AAACA1234A1Z5' });
BillingScreen._initCreateModalState();
const ms = Store.getMilestones(proj.id)[0];
BillingScreen._createModalState.projectId = proj.id;
BillingScreen._createModalState.milestoneId = ms.id;
BillingScreen._createModalState.clientMode = 'existing';
const html = BillingScreen._renderCreateModalBody();

// ── Assertions ──
const requiredIds = [
  'inv-existing-company-row', 'inv-existing-select', 'inv-other-company-fields',
  'inv-client-name', 'inv-client-gstin', 'inv-client-addr1', 'inv-client-addr2', 'inv-client-state',
  'inv-save-company-wrap', 'inv-save-company-check',
  'inv-project', 'inv-milestone', 'inv-project-info',
  'inv-number', 'inv-date', 'inv-valid-until', 'inv-ref-quotation', 'inv-currency', 'inv-modules-tag',
  'inv-items-tbody', 'item-name-0',
  'inv-words-preview', 'inv-sum-gross', 'inv-sum-discount', 'inv-sum-taxable', 'inv-sum-gst',
  'inv-sum-total', 'inv-sum-tds', 'inv-sum-net',
  'inv-sched-m1', 'inv-sched-m2', 'inv-sched-m3',
  'inv-include-recurring', 'inv-recurring-inputs', 'inv-rec-module', 'inv-rec-amount'
];
const requiredHandlers = [
  'BillingScreen._toggleClientMode', 'BillingScreen._onSelectExistingClient', 'BillingScreen._onClientNameInput',
  'BillingScreen._onProjectChange', 'BillingScreen._onMilestoneChange', 'BillingScreen._addModuleItemRow',
  'BillingScreen._onItemFieldChange', 'BillingScreen._toggleRecurring'
];
const forbidden = ['PROFORMA INVOICE GENERATOR', 'Official 3-Page Format Template', '#DC2626', '#059669', '#7C3AED', 'style="padding:12px 16px;background:#EFF6FF'];

let fail = 0;
requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) { fail++; console.log('❌ missing id:', id); }
});
requiredHandlers.forEach(h => {
  if (!html.includes(h)) { fail++; console.log('❌ missing handler:', h); }
});
forbidden.forEach(f => {
  if (html.includes(f)) { fail++; console.log('❌ stale token present:', f); }
});
// Live project data must appear
if (!html.includes('client ERP Modernisation')) { fail++; console.log('❌ real project name not in dropdown'); }
if (!html.includes('Phase 1 — Discovery sign-off')) { fail++; console.log('❌ real milestone not in dropdown'); }
if (!html.includes('inv-existing-select')) { fail++; console.log('❌ existing-client select missing when companies exist'); }
// Theme tokens must be used, raw hexes in app markup should be gone
if (!html.includes('var(--color-')) { fail++; console.log('❌ no theme tokens used'); }

console.log(`\nRendered modal HTML: ${html.length} chars`);
console.log(fail === 0 ? '✅ All render assertions passed' : `❌ ${fail} assertions failed`);
process.exit(fail === 0 ? 0 : 1);
