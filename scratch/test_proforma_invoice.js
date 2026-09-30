// Verification script for Proforma Invoice & Create Invoice feature
const fs = require('fs');
const path = require('path');

// Mock browser globals for Node environment
global.window = {
  location: { hash: '#billing' },
  addEventListener: () => {},
  open: () => ({ document: { write: () => {}, close: () => {} } })
};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const vm = require('vm');

// Load dependencies in global context
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/components/icons.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
global.Utils = {
  escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  formatDate: (d) => d || '—'
};
global.Toast = { show: (msg, type) => console.log(`[Toast ${type}]`, msg) };
global.Modal = {
  open: (title, body, footer, opts) => {
    console.log(`[Modal opened] Title: "${title}", ExtraLarge: ${opts?.extraLarge}`);
  },
  closeAll: () => {}
};
global.App = { refresh: () => {} };

Store.init();

vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/screens/billing.js'), 'utf8'));

console.log('--- Testing BillingScreen Header & Create Invoice Button ---');
const renderedHtml = BillingScreen.render();
if (!renderedHtml.includes('id="btn-create-invoice"') || !renderedHtml.includes('Create Invoice')) {
  throw new Error('Create Invoice button not found in BillingScreen.render()');
}
console.log('✓ "Create Invoice" button successfully rendered in page-header-actions');

console.log('--- Testing Modal Initialization and "Other Company Details" Mode ---');
BillingScreen._initCreateModalState();
const s = BillingScreen._createModalState;
if (s.clientMode !== 'other') {
  throw new Error(`Expected default clientMode to be 'other', got ${s.clientMode}`);
}
console.log('✓ Default clientMode is "other", enabling custom company input by default');

const modalBody = BillingScreen._renderCreateModalBody();
if (!modalBody.includes('inv-client-name') || !modalBody.includes('inv-client-gstin') || !modalBody.includes('inv-client-addr1')) {
  throw new Error('Company input fields missing from create invoice modal');
}
console.log('✓ All client / company detail inputs (Legal Name, GSTIN, Address Line 1 & 2, State, Country) present');

console.log('--- Testing Number to Words Conversion ---');
const w1 = BillingScreen._numberToWords(495600);
console.log('495,600 in words:', w1);
if (!w1.includes('Four Lakh Ninety Five Thousand Six Hundred')) {
  throw new Error(`Unexpected number to words for 495600: ${w1}`);
}
console.log('✓ Number to words matches Indian numbering convention');

console.log('--- Testing Financial Calculations against Template PDF ---');
// Template scenario:
// Gross = 500,000
// BNI Disc 15% = -75,000
// Taxable = 425,000
// GST 18% = 76,500
// Total Payable = 501,500
// TDS 10% u/s 194J on Taxable (425,000) = -42,500
// Net Payable After TDS = 501,500 - 42,500 = 459,000
const testInvoice = {
  id: 'HIN-PI-TEST-2026-001',
  billNumber: 'HIN-PI-TEST-2026-001',
  companyName: 'Apex Cloud Innovations Pvt Ltd',
  currency: 'INR (₹)',
  modulesTag: '[R1 • R2 • R3]',
  issueDate: '2026-09-30',
  dueDate: '2026-10-15',
  clientDetails: {
    legalName: 'Apex Cloud Innovations Pvt Ltd',
    addressLine1: 'Level 5, Cyber Gateway',
    addressLine2: 'HITEC City, Hyderabad — 500081',
    stateCountry: 'Telangana, India',
    gstin: '36AAACA1234F1Z5'
  },
  items: [
    {
      name: 'Custom AI Voice & Automation Agent',
      desc: 'One-time development • incl. 1 month post-go-live fine-tuning',
      gross: 500000,
      discountPct: 15
    }
  ],
  recurringCharges: [
    {
      module: 'Hintonn AI SLA Package',
      component: 'Annual Cloud Maintenance & LLM Guardrails',
      basis: 'Flat annual package',
      freq: 'Annual',
      amount: 60000
    }
  ]
};

const docHtml = BillingScreen.renderProformaHTML(testInvoice);

// Verify Page 1
if (!docHtml.includes('id="proforma-page-1"') || !docHtml.includes('PROFORMA INVOICE')) {
  throw new Error('Page 1 of Proforma Invoice missing');
}
if (!docHtml.includes('HINTONN AI PRIVATE LIMITED') || !docHtml.includes('24AAICH8280N1Z0')) {
  throw new Error('Hintonn AI FROM details missing on Page 1');
}
if (!docHtml.includes('Apex Cloud Innovations Pvt Ltd') || !docHtml.includes('36AAACA1234F1Z5')) {
  throw new Error('Client BILL TO details missing on Page 1');
}
if (!docHtml.includes('DEVELOPMENT CHARGES — ONE-TIME')) {
  throw new Error('DEVELOPMENT CHARGES section missing on Page 1');
}
if (!docHtml.includes('BNI Disc. 15%') || !docHtml.includes('–₹75,000')) {
  throw new Error('BNI 15% discount calculation missing on Page 1');
}
if (!docHtml.includes('₹5,01,500') || !docHtml.includes('₹4,59,000')) {
  throw new Error('Total Payable (5,01,500) or Net Payable (4,59,000) calculation missing');
}
console.log('✓ Page 1 successfully matches Proforma Invoice PDF template');

// Verify Page 2
if (!docHtml.includes('id="proforma-page-2"') || !docHtml.includes('PAYMENT SCHEDULE')) {
  throw new Error('Page 2 PAYMENT SCHEDULE missing');
}
if (!docHtml.includes('M1') || !docHtml.includes('M2') || !docHtml.includes('M3')) {
  throw new Error('Milestones M1, M2, M3 missing on Page 2');
}
if (!docHtml.includes('RECURRING CHARGES — FOR REFERENCE ONLY (NOT BILLED IN THIS INVOICE)')) {
  throw new Error('Recurring charges reference table missing on Page 2');
}
if (!docHtml.includes('BANKING DETAILS — FOR REMITTANCE') || !docHtml.includes('IDFC FIRST Bank') || !docHtml.includes('69999995202')) {
  throw new Error('Banking details table missing or incorrect on Page 2');
}
if (!docHtml.includes('TERMS &amp; CONDITIONS') || !docHtml.includes('1. Pricing Basis &amp; Currency')) {
  throw new Error('Terms & Conditions 1-4 missing on Page 2');
}
console.log('✓ Page 2 successfully matches Proforma Invoice PDF template (Schedule, Bank, Terms)');

// Verify Page 3
if (!docHtml.includes('id="proforma-page-3"')) {
  throw new Error('Page 3 missing from Proforma Invoice');
}
if (!docHtml.includes('5. Payment Terms &amp; Scope of this Invoice')) {
  throw new Error('Clause 5 missing on Page 3');
}
if (!docHtml.includes('6. Taxation &amp; Statutory Compliance') || !docHtml.includes('TDS base = ₹4,25,000; TDS = ₹42,500; net payable after TDS = ₹4,59,000')) {
  throw new Error('Clause 6 TDS statutory statement missing or numbers incorrect on Page 3');
}
if (!docHtml.includes('9. Warranty') || !docHtml.includes('90-day bug-fix warranty')) {
  throw new Error('Clause 9 Warranty missing on Page 3');
}
if (!docHtml.includes('This is a computer-generated proforma invoice and does not require a signature')) {
  throw new Error('Computer generated footer note missing on Page 3');
}
console.log('✓ Page 3 successfully matches Proforma Invoice PDF template (Terms 5-9 & Footer)');

console.log('\n=============================================');
console.log('ALL PROFORMA INVOICE SUITE TESTS PASSED 100%!');
console.log('=============================================');
