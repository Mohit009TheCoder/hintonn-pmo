const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock environment
global.Icons = {
  shield: '', alertCircle: '', clock: '', folder: '', refresh: '', plus: ''
};
global.Utils = {
  formatDate(d) { return d || ''; }
};
global.App = {
  refresh() {}
};

let bgs = [
  { id: 'bg1', ref: 'BG/MTR3/PBG/101', projectName: 'Mumbai Metro Line 3', issuingBank: 'State Bank of India', amount: '₹14,250,000', status: 'active', risk: 'safe', type: 'Performance BG', issueDate: '2025-06-01', expiryDate: '2027-06-01', daysLeft: 600, badgeClass: 'badge-success', statusLabel: 'Active' },
  { id: 'bg2', ref: 'BG/MTR3/ABG/102', projectName: 'Mumbai Metro Line 3', issuingBank: 'HDFC Bank', amount: '₹28,500,000', status: 'active', risk: 'warning', type: 'Advance BG', issueDate: '2025-06-15', expiryDate: '2026-11-15', daysLeft: 45, badgeClass: 'badge-warning', statusLabel: 'Warning' },
  { id: 'bg3', ref: 'BG/PUN2/PBG/103', projectName: 'Pune IT Park', issuingBank: 'ICICI Bank', amount: '₹8,720,000', status: 'active', risk: 'safe', type: 'Performance BG', issueDate: '2025-09-15', expiryDate: '2027-09-15', daysLeft: 700, badgeClass: 'badge-success', statusLabel: 'Active' },
  { id: 'bg4', ref: 'BG/NGP1/PBG/104', projectName: 'Nagpur Smart City', bank: 'Bank of Baroda', amount: '₹5,680,000', status: 'active', risk: 'critical', type: 'Performance BG', issueDate: '2025-01-10', expiryDate: '2026-10-15', daysLeft: 14, badgeClass: 'badge-high', statusLabel: 'Critical' },
  { id: 'bg5', ref: 'BG/NGP1/RBG/105', projectName: 'Nagpur Smart City', issuingBank: 'Punjab National Bank', amount: '₹2,840,000', status: 'active', risk: 'safe', type: 'Retention BG', issueDate: '2025-07-01', expiryDate: '2027-01-01', daysLeft: 450, badgeClass: 'badge-success', statusLabel: 'Active' },
  { id: 'bg6', ref: 'BG/PUN2/ABG/106', projectName: 'Pune IT Park', bank: 'Axis Bank', amount: '₹17,440,000', status: 'active', risk: 'critical', type: 'Advance BG', issueDate: '2025-09-20', expiryDate: '2026-10-20', daysLeft: 19, badgeClass: 'badge-high', statusLabel: 'Critical' }
];

let projects = [
  { id: 'p1', name: 'Mumbai Metro Line 3', code: 'MTR3', packageCode: 'PKG-01' },
  { id: 'p2', name: 'Pune IT Park', code: 'PUN2', packageCode: 'PKG-02' },
  { id: 'p3', name: 'Nagpur Smart City', code: 'NGP1', packageCode: 'PKG-03' }
];

global.Store = {
  getBankGuarantees() { return bgs; },
  getProjects() { return projects; },
  getProject(id) { return projects.find(p => p.id === id); },
  createBankGuarantee(data) {
    const newBg = { id: 'bg_' + Date.now(), ...data };
    bgs.push(newBg);
    return newBg;
  }
};

let lastModalTitle = '';
let lastModalHtml = '';
global.Modal = {
  open(title, html) {
    lastModalTitle = title;
    lastModalHtml = html;
  },
  closeAll() {}
};

let lastToast = null;
global.Toast = {
  show(msg, type) {
    lastToast = { msg, type };
  }
};

// Load BankGuaranteesScreen
const bgCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'screens', 'bank-guarantees.js'), 'utf8');
eval(bgCode + '\n;global.BankGuaranteesScreen = BankGuaranteesScreen;');

console.log('=== TEST 1: DYNAMIC ISSUING BANKS CARD (NO STATIC TEXT) ===');

// Render screen with 6 initial banks
const renderedHtml1 = BankGuaranteesScreen.render();

// Check that old static text is completely gone
assert(!renderedHtml1.includes('Standard Chartered, HSBC, Barclays, Citi'), 'Static banks list is removed');
assert(!renderedHtml1.includes('5 Institutions'), 'Static "5 Institutions" is removed');

// Check that dynamic institution count is rendered
assert(renderedHtml1.includes('6 Institutions'), 'Renders dynamic "6 Institutions" based on actual data');
assert(renderedHtml1.includes('State Bank of India'), 'Includes State Bank of India');
assert(renderedHtml1.includes('HDFC Bank'), 'Includes HDFC Bank');
assert(renderedHtml1.includes('ICICI Bank'), 'Includes ICICI Bank');
assert(renderedHtml1.includes('Amount (₹)'), 'Table header specifies Amount in INR (₹)');
console.log('✓ Successfully verified dynamic Card 4 renders actual 6 institutions from dataset');

console.log('\n=== TEST 2: REGISTER NEW BG MODAL & INDIAN BANKS DROPDOWN ===');
BankGuaranteesScreen.openNewBGModal();

assert.strictEqual(lastModalTitle, 'Register Bank Guarantee');
assert(lastModalHtml.includes('select class="form-control" id="new-bg-bank"'), 'Issuing bank is a <select> dropdown element');
assert(lastModalHtml.includes('Public Sector Banks (PSU)'), 'Includes Public Sector Banks optgroup');
assert(lastModalHtml.includes('Leading Private Sector Banks'), 'Includes Private Sector Banks optgroup');
assert(lastModalHtml.includes('State Bank of India (SBI)'), 'Includes SBI in dropdown');
assert(lastModalHtml.includes('Punjab National Bank (PNB)'), 'Includes PNB in dropdown');
assert(lastModalHtml.includes('Bank of Baroda (BOB)'), 'Includes BOB in dropdown');
assert(lastModalHtml.includes('Canara Bank'), 'Includes Canara Bank in dropdown');
assert(lastModalHtml.includes('Union Bank of India'), 'Includes Union Bank of India in dropdown');
assert(lastModalHtml.includes('HDFC Bank'), 'Includes HDFC Bank in dropdown');
assert(lastModalHtml.includes('ICICI Bank'), 'Includes ICICI Bank in dropdown');
assert(lastModalHtml.includes('Axis Bank'), 'Includes Axis Bank in dropdown');
assert(lastModalHtml.includes('Kotak Mahindra Bank'), 'Includes Kotak Mahindra Bank in dropdown');
assert(lastModalHtml.includes('Export-Import Bank of India (EXIM)'), 'Includes EXIM Bank');
assert(lastModalHtml.includes('Other Indian Scheduled Bank'), 'Includes Other Indian Scheduled Bank option');
console.log('✓ Successfully verified all Indian Banks are available in dropdown format');

console.log('\n=== TEST 3: REGISTER NEW BG & REAL-TIME CARD 4 DYNAMIC UPDATE ===');

// Mock DOM elements for registration form
const mockElements = {
  'new-bg-proj': { value: 'p2', selectedIndex: 0, options: [{ text: 'Pune IT Park (PUN2)' }] },
  'new-bg-bank': { value: 'Canara Bank' },
  'new-bg-custom-bank': { value: '' },
  'new-bg-amount': { value: '12500000' },
  'new-bg-type': { value: 'Performance BG' },
  'new-bg-expiry': { value: '2027-12-31' }
};

global.document = {
  getElementById(id) {
    return mockElements[id] || null;
  }
};

BankGuaranteesScreen._saveBG();

assert(lastToast && lastToast.type === 'success', 'Toast emitted success message');
assert(bgs.some(b => b.issuingBank === 'Canara Bank'), 'New BG from Canara Bank saved in Store');
const newBgObj = bgs.find(b => b.issuingBank === 'Canara Bank');
assert.strictEqual(newBgObj.amount, '₹1,25,00,000', 'Amount correctly formatted in Indian currency format');
assert(newBgObj.ref.startsWith('BG/PUN2/PBG/'), 'BG reference auto-generated with project code and type code');
assert.strictEqual(newBgObj.status, 'active');

// Re-render screen to verify Card 4 updated dynamically from 6 -> 7 Institutions
const renderedHtml2 = BankGuaranteesScreen.render();
assert(renderedHtml2.includes('7 Institutions'), 'Card 4 dynamically updated to 7 Institutions after registering Canara Bank');
assert(renderedHtml2.includes('Canara Bank'), 'Card 4 includes Canara Bank in title/summary');
console.log('✓ Successfully verified Card 4 dynamically increments to 7 Institutions when Canara Bank BG is registered');

console.log('\n🎉 ALL BANK GUARANTEES DYNAMIC CARD & INDIAN BANKS DROPDOWN TESTS PASSED!');
