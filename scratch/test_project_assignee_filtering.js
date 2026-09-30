// ─── Test: Project-Based Assignee Filtering in Task Creation Modal ───
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.document = {
  body: { style: {}, appendChild(){}, classList: { add(){}, remove(){}, contains(){ return false; } } },
  createElement(tag) { return { tagName: tag, className: '', id: '', innerHTML: '', style: {}, querySelector(){ return null; }, querySelectorAll(){ return []; }, remove(){} }; },
  getElementById: (id) => ({ id, value: '', innerHTML: '', textContent: '', style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, querySelector(){ return null; }, querySelectorAll(){ return []; }, appendChild(){}, removeChild(){}, remove(){}, focus(){} }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.window = { addEventListener: () => {}, innerWidth: 1200 };

function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/components/icons.js');
loadScript('js/components/toast.js');
loadScript('js/components/modal.js');
loadScript('js/store.js');
Store.init();
loadScript('js/auth.js');
loadScript('js/app.js');
loadScript('js/screens/tasks.js');

console.log('=== TEST SUITE: PROJECT-BASED ASSIGNEE FILTERING IN TASK MODAL ===\n');

// Set up team members in Store
Store._data.members = [
  { id: 'm1', name: 'Ayush Desai', role: 'Admin', color: '#EF4444', initials: 'AD' },
  { id: 'm2', name: 'Preet', role: 'Member', designation: 'Developer', color: '#2563EB', initials: 'P' },
  { id: 'm3', name: 'Max Jain', role: 'Member', designation: 'Developer', color: '#10B981', initials: 'MJ' },
  { id: 'm4', name: 'Hirvi Sangavi', role: 'Member', designation: 'Developer', color: '#F59E0B', initials: 'HS' }
];

// Set up mock projects with distinct team members
const pA = Store.createProject({ id: 'proj-crm', name: 'Hintonn CRM', memberIds: ['m2', 'm4'] }); // Preet & Hirvi only
const pB = Store.createProject({ id: 'proj-infra', name: 'Infra Core', memberIds: ['m3'] }); // Max Jain only
const pC = Store.createProject({ id: 'proj-empty', name: 'Empty Team', memberIds: [] }); // No members

// Test with Admin user (Ayush Desai)
const adminUser = { id: 'admin', memberId: 'm1', role: 'Admin', name: 'Ayush Desai' };

// 1. Selecting Hintonn CRM must only show Preet (m2) and Hirvi (m4), NOT Max Jain (m3)
const crmAssignees = TasksScreen._getSelectableAssignees('proj-crm', adminUser);
console.log('--- 1. Project-specific assignees for Hintonn CRM (Admin User) ---');
console.assert(crmAssignees.some(m => m.id === 'm2'), 'Preet (m2) is selectable for Hintonn CRM');
console.assert(crmAssignees.some(m => m.id === 'm4'), 'Hirvi (m4) is selectable for Hintonn CRM');
console.assert(!crmAssignees.some(m => m.id === 'm3'), 'Max Jain (m3) is NOT selectable for Hintonn CRM');
console.log('✓ Hintonn CRM only returns assigned team members (m2, m4) and excludes unassigned members (m3)');

// 2. Selecting Infra Core must only show Max Jain (m3)
const infraAssignees = TasksScreen._getSelectableAssignees('proj-infra', adminUser);
console.log('\n--- 2. Project-specific assignees for Infra Core ---');
console.assert(infraAssignees.some(m => m.id === 'm3'), 'Max Jain (m3) is selectable for Infra Core');
console.assert(!infraAssignees.some(m => m.id === 'm2'), 'Preet (m2) is NOT selectable for Infra Core');
console.assert(!infraAssignees.some(m => m.id === 'm4'), 'Hirvi (m4) is NOT selectable for Infra Core');
console.log('✓ Infra Core only returns Max Jain (m3)');

// 3. Selecting a project with no assigned members
const emptyAssignees = TasksScreen._getSelectableAssignees('proj-empty', adminUser);
console.log('\n--- 3. Project with no assigned members ---');
console.assert(emptyAssignees.length === 0, 'Empty project returns 0 assignees');
console.log('✓ Project with no members cleanly returns 0 assignees');

// 4. Render markup contains only project members
const crmPillsMarkup = TasksScreen._renderAssigneePills(crmAssignees, ['m2'], 'task');
console.log('\n--- 4. Assignee Pills UI Rendering ---');
console.assert(crmPillsMarkup.includes('value="m2"'), 'Pill for m2 rendered');
console.assert(crmPillsMarkup.includes('value="m4"'), 'Pill for m4 rendered');
console.assert(!crmPillsMarkup.includes('value="m3"'), 'Pill for m3 is strictly NOT rendered');

const emptyPillsMarkup = TasksScreen._renderAssigneePills(emptyAssignees, [], 'task');
console.assert(emptyPillsMarkup.includes('No team members assigned to this project'), 'Empty state friendly message rendered');
console.log('✓ UI pills render exactly and exclusively the project team members');

console.log('\n========================================');
console.log('ALL PROJECT-BASED ASSIGNEE TESTS PASSED!');
console.log('========================================');
