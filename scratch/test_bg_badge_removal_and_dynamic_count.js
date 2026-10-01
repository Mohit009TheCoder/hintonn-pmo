const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem(k) { return storage[k] || null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; },
  clear() { for (const k in storage) delete storage[k]; }
};

// Mock DOM
let navInnerHtml = '';
const mockNav = {
  set innerHTML(val) { navInnerHtml = val; },
  get innerHTML() { return navInnerHtml; },
  querySelector(sel) {
    if (sel === 'a[href="#bg"]') {
      return {
        querySelector(subSel) {
          if (subSel === '.badge-count' && navInnerHtml.includes('badge-count')) {
            return { remove() { navInnerHtml = navInnerHtml.replace(/<span class="badge-count">.*?<\/span>/g, ''); } };
          }
          return null;
        }
      };
    }
    return null;
  }
};

global.document = {
  getElementById(id) {
    if (id === 'sidebar-nav') return mockNav;
    return null;
  },
  querySelector() { return null; }
};

global.Icons = {
  home: '', folder: '', checkSquare: '', alertCircle: '', flag: '', calendar: '',
  timeline: '', users: '', fileText: '', dollarSign: '', shield: '', clock: '',
  assistant: '', connectors: '', barChart: '', settings: '', hexagonSm: '', x: '', refresh: '', plus: ''
};

global.Utils = {
  formatDate(d) { return d || ''; }
};

global.Auth = {
  getCurrentUser() { return { role: 'Admin' }; },
  hasAccess() { return true; },
  getPendingUsers() { return []; }
};

let currentBGs = [
  { id: 'bg1', ref: 'BG/P1/PBG/001', projectName: 'Project 1', issuingBank: 'SBI', amount: '₹10,00,000' },
  { id: 'bg2', ref: 'BG/P2/ABG/002', projectName: 'Project 2', issuingBank: 'HDFC', amount: '₹20,00,000' }
];

global.Store = {
  getBankGuarantees() { return currentBGs; },
  getSettings() { return { workspaceName: 'Hintonn AI' }; },
  getIssues() { return []; },
  getProjects() { return []; },
  getProject() { return null; },
  createBankGuarantee(b) { currentBGs.push(b); return b; }
};

global.App = {
  currentScreen: 'dashboard'
};

// Load BankGuaranteesScreen and Sidebar
const bgCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'screens', 'bank-guarantees.js'), 'utf8');
eval(bgCode + '\n;global.BankGuaranteesScreen = BankGuaranteesScreen;');

const sidebarCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'components', 'sidebar.js'), 'utf8');
eval(sidebarCode + '\n;global.Sidebar = Sidebar;');

console.log('=== TEST 1: STATIC NUMBER 2 IS REMOVED INITIALLY ===');
// Clean slate test
localStorage.clear();
App.currentScreen = 'dashboard';

// Initial unseen count should initialize seen list and return 0 (removing static 2)
const initialUnseen = BankGuaranteesScreen.getUnseenCount();
assert.strictEqual(initialUnseen, 0, 'Initial unseen count is 0');

Sidebar.render();
assert(!navInnerHtml.includes('badge-count'), 'Sidebar navigation does NOT contain any badge-count initially');
console.log('✓ Successfully verified badge "2" is completely removed from Bank Guarantees in sidebar');

console.log('\n=== TEST 2: NEW BGs ADDED SHOWS UNSEEN COUNT (e.g. 5) ===');
// Simulate 5 new BGs being registered
for (let i = 3; i <= 7; i++) {
  currentBGs.push({
    id: `bg${i}`,
    ref: `BG/P${i}/PBG/00${i}`,
    projectName: `Project ${i}`,
    issuingBank: 'Canara Bank',
    amount: '₹50,00,000'
  });
}

// User is still on dashboard
App.currentScreen = 'dashboard';
const newCount = BankGuaranteesScreen.getUnseenCount();
assert.strictEqual(newCount, 5, 'Unseen count is 5 after 5 new BGs added');

Sidebar.render();
assert(navInnerHtml.includes('<span class="badge-count">5</span>'), 'Sidebar displays dynamic badge <span class="badge-count">5</span>');
console.log('✓ Successfully verified new BGs display correct badge count (5)');

console.log('\n=== TEST 3: OPENING BANK GUARANTEES REMOVES THE NUMBER ===');
// User clicks / opens Bank Guarantees screen
App.currentScreen = 'bg';

// BankGuaranteesScreen.render() marks all BGs as seen
BankGuaranteesScreen.render();

// Badge count should now be 0
const countAfterOpen = BankGuaranteesScreen.getUnseenCount();
assert.strictEqual(countAfterOpen, 0, 'Unseen count is 0 after viewing screen');

Sidebar.render();
assert(!navInnerHtml.includes('badge-count'), 'Badge is removed from sidebar after opening Bank Guarantees');
console.log('✓ Successfully verified badge is removed when user opens Bank Guarantees screen');

console.log('\n=== TEST 4: SUBSEQUENT VISITS REMAIN CLEAN ===');
// User navigates back to dashboard
App.currentScreen = 'dashboard';
assert.strictEqual(BankGuaranteesScreen.getUnseenCount(), 0, 'Unseen count remains 0 on other screens');
Sidebar.render();
assert(!navInnerHtml.includes('badge-count'), 'Badge remains absent on subsequent visits');
console.log('✓ Successfully verified badge only appears when NEW BGs arrive');

console.log('\n🎉 ALL BG BADGE TESTS PASSED 100%!');
