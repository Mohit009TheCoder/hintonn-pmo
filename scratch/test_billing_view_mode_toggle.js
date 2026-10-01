const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple DOM environment mock
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  contains(cls) { return this.classes.has(cls); }
  toString() { return Array.from(this.classes).join(' '); }
}

class MockElement {
  constructor(tag, id, classes = []) {
    this.tagName = tag;
    this.id = id;
    this.classList = new MockClassList(classes);
    this.attrs = {};
    this.innerHTML = '';
    this.value = '';
    this.style = {};
  }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
}

const elements = new Map();

global.document = {
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelectorAll(sel) {
    const res = [];
    for (const el of elements.values()) {
      if (sel.includes('[data-billing-filter]')) {
        if (el.getAttribute('data-billing-filter')) res.push(el);
      }
    }
    return res;
  }
};

global.Icons = {
  dollarSign: '', plus: '', download: '', fileText: '', check: '', clock: '', shield: '',
  chevronDown: '', chevronRight: '', eye: '', edit: '', alertCircle: '', search: '',
  calendar: '', mail: ''
};
global.Utils = {
  formatDate(d) { return d || ''; }
};
global.App = {
  refresh() {}
};
global.Store = {
  getProjects() { return [{ id: 'p1', name: 'Project 1' }]; },
  getCompanies() { return [{ id: 'c1', name: 'Company 1' }]; },
  getInvoices() { return []; },
  saveInvoice() {},
  updateInvoice() {},
  getCurrentUser() { return { name: 'Admin', role: 'admin' }; }
};
global.Modal = { open() {}, closeAll() {} };
global.Toast = { show() {} };

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'screens', 'billing.js'), 'utf8');
eval(billingCode + '\n;global.BillingScreen = BillingScreen;');

console.log('Testing BillingScreen view mode toggle & zero-shift button switching...');

// 1. Initial render test
BillingScreen._viewMode = 'company';
BillingScreen._filter = 'all';
const html = BillingScreen.render();

assert(html.includes('id="billing-view-mode-group"'), 'HTML contains #billing-view-mode-group');
assert(html.includes('id="billing-btn-group-company"'), 'HTML contains #billing-btn-group-company');
assert(html.includes('id="billing-btn-all-invoices"'), 'HTML contains #billing-btn-all-invoices');
assert(html.includes('transform:none!important'), 'Buttons have inline transform:none!important to prevent click shifting');
assert(html.includes('flex-shrink:0'), 'Button group has flex-shrink:0 to prevent width wrapping shift');

// Setup mock DOM elements to simulate browser screen
const btnCompany = new MockElement('button', 'billing-btn-group-company', ['btn', 'btn-xs', 'btn-primary']);
const btnTable = new MockElement('button', 'billing-btn-all-invoices', ['btn', 'btn-xs', 'btn-ghost']);
const billingContent = new MockElement('div', 'billing-content-view');
const tabAll = new MockElement('button', 'tab-all', ['timeline-stage-tab', 'active']);
tabAll.setAttribute('data-billing-filter', 'all');
const tabPaid = new MockElement('button', 'tab-paid', ['timeline-stage-tab']);
tabPaid.setAttribute('data-billing-filter', 'paid');

elements.set('billing-btn-group-company', btnCompany);
elements.set('billing-btn-all-invoices', btnTable);
elements.set('billing-content-view', billingContent);
elements.set('tab-all', tabAll);
elements.set('tab-paid', tabPaid);

// 2. Test switching to 'table'
BillingScreen.setViewMode('table');
assert.strictEqual(BillingScreen._viewMode, 'table', 'BillingScreen._viewMode updated to table');
assert(btnTable.classList.contains('btn-primary'), 'All Invoices button now has btn-primary (blue highlight shifted to All Invoices)');
assert(btnTable.classList.contains('btn-ghost') === false, 'All Invoices button no longer has btn-ghost');
assert(btnCompany.classList.contains('btn-ghost'), 'Group by Company button now has btn-ghost');
assert(btnCompany.classList.contains('btn-primary') === false, 'Group by Company button no longer has btn-primary');
assert.strictEqual(btnTable.getAttribute('aria-pressed'), 'true', 'All Invoices aria-pressed is true');
assert.strictEqual(btnCompany.getAttribute('aria-pressed'), 'false', 'Group by Company aria-pressed is false');
console.log('✓ Successfully shifted blue button from Group by Company -> All Invoices on click/change');

// 3. Test switching back to 'company'
BillingScreen.setViewMode('company');
assert.strictEqual(BillingScreen._viewMode, 'company', 'BillingScreen._viewMode updated to company');
assert(btnCompany.classList.contains('btn-primary'), 'Group by Company button now has btn-primary (blue highlight shifted back)');
assert(btnCompany.classList.contains('btn-ghost') === false, 'Group by Company button no longer has btn-ghost');
assert(btnTable.classList.contains('btn-ghost'), 'All Invoices button now has btn-ghost');
assert(btnTable.classList.contains('btn-primary') === false, 'All Invoices button no longer has btn-primary');
assert.strictEqual(btnCompany.getAttribute('aria-pressed'), 'true', 'Group by Company aria-pressed is true');
assert.strictEqual(btnTable.getAttribute('aria-pressed'), 'false', 'All Invoices aria-pressed is false');
console.log('✓ Successfully shifted blue button from All Invoices -> Group by Company on click/change');

// 4. Test filter switching
BillingScreen.setFilter('paid');
assert.strictEqual(BillingScreen._filter, 'paid');
assert(tabPaid.classList.contains('active'), 'Paid filter tab is active');
assert(tabAll.classList.contains('active') === false, 'All filter tab is no longer active');
console.log('✓ Status filter active states update dynamically without reload');

console.log('\n🎉 ALL BILLING BUTTON SHIFTING TESTS PASSED!');
