// Verification test for Task Creation, Subtask Checklist, and Role-Based Webhooks
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.document = {
  body: {
    style: {},
    appendChild(el) {},
    classList: { add(){}, remove(){}, contains(){ return false; } }
  },
  createElement(tag) {
    return {
      tagName: tag,
      className: '',
      id: '',
      innerHTML: '',
      style: {},
      querySelector(s) { return null; },
      querySelectorAll(s) { return []; }
    };
  },
  getElementById(id) {
    return {
      id,
      value: '',
      innerHTML: '',
      textContent: '',
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      querySelector(s) { return null; },
      querySelectorAll(s) { return []; },
      focus() {}
    };
  },
  querySelector(sel) {
    return {
      id: '',
      value: '',
      innerHTML: '',
      textContent: '',
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      querySelector(s) { return null; },
      querySelectorAll(s) { return []; },
      focus() {}
    };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  addEventListener() {},
  innerWidth: 1200
};

// Load components and screens
function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/components/icons.js');
loadScript('js/components/toast.js');
loadScript('js/components/modal.js');
loadScript('js/store.js');
loadScript('js/auth.js');
loadScript('js/app.js');
loadScript('js/screens/tasks.js');
loadScript('js/screens/connectors.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('=== TEST SUITE 1: USER TASK CREATION & SUBTASKS DATA SCHEMA ===');
Store.init();
const project = Store.createProject({ name: 'Alpha Infrastructure PMO', description: 'Testing' });

// Create a task with subtasks
const initialSubtasks = [
  { id: 'st-1', title: 'Draft Architectural Blueprint', completed: true },
  { id: 'st-2', title: 'Engineering Review', completed: false },
  { id: 'st-3', title: 'Procurement Sign-off', completed: false }
];

const createdTask = Store.createTask({
  title: 'Setup Core Substation Feed',
  projectId: project.id,
  description: 'Initial electrical grid connection',
  assigneeId: 'm3',
  priority: 'high',
  status: 'in-progress',
  dueDate: '2026-10-15',
  subtasks: initialSubtasks
});

assert(createdTask && createdTask.id, 'Store.createTask creates task with unique ID');
assert(Array.isArray(createdTask.subtasks), 'Task has subtasks array');
assert(createdTask.subtasks.length === 3, 'Task has 3 subtasks loaded');
assert(createdTask.subtasks[0].completed === true, 'Subtask 1 is completed');
assert(createdTask.subtasks[1].completed === false, 'Subtask 2 is not completed');

// Test toggleSubtask
Store.toggleSubtask(createdTask.id, 'st-2', true);
const updatedT = Store.getTask(createdTask.id);
assert(updatedT.subtasks.find(s => s.id === 'st-2').completed === true, 'Store.toggleSubtask toggled subtask completion to true');

// Test addSubtask
const newSt = Store.addSubtask(createdTask.id, 'Safety Compliance Audit');
assert(newSt && newSt.title === 'Safety Compliance Audit', 'Store.addSubtask adds new subtask');
assert(Store.getTask(createdTask.id).subtasks.length === 4, 'Task now has 4 subtasks');

// Test deleteSubtask
Store.deleteSubtask(createdTask.id, 'st-3');
assert(Store.getTask(createdTask.id).subtasks.length === 3, 'Store.deleteSubtask removed st-3');

console.log('\n=== TEST SUITE 2: TASKS SCREEN RENDERING & BADGES ===');
// Non-admin user check for task creation button in header
Auth.currentUser = { id: 'hirvi', memberId: 'm4', name: 'Hirvi AI Dev', role: 'AI Developer' };
const tasksHtml = TasksScreen.render();
assert(tasksHtml.includes('tasks-create-btn'), 'Tasks header contains #tasks-create-btn for all users');
assert(tasksHtml.includes('Create Task'), 'Header button text includes "Create Task"');

// Kanban card subtask progress badge check
const cardHtml = TasksScreen._renderKanbanCard(Store.getTask(createdTask.id));
assert(cardHtml.includes('kanban-card-subtask-badge'), 'Kanban card contains subtask badge class');
assert(cardHtml.includes('2/3'), 'Kanban card shows compact progress indicator (2/3 completed)');

// Detail modal subtasks checklist HTML
const subtasksDetailHtml = TasksScreen._buildSubtasksHtml(createdTask.id, Store.getTask(createdTask.id).subtasks);
assert(subtasksDetailHtml.includes('subtasks-progress-track'), 'Detail view includes visual progress track');
assert(subtasksDetailHtml.includes('subtasks-progress-fill'), 'Detail view includes visual progress fill');
assert(subtasksDetailHtml.includes('67%'), 'Detail view calculates and renders completion percentage (67%)');
assert(subtasksDetailHtml.includes('detail-new-subtask-input'), 'Detail view includes inline + Add Subtask input');
assert(subtasksDetailHtml.includes('Draft Architectural Blueprint'), 'Detail view renders subtask titles');

console.log('\n=== TEST SUITE 3: WEBHOOKS ROLE-BASED ACCESS CONTROL (#connectors) ===');
// Non-Admin view
Auth.currentUser = { id: 'dev_user', name: 'Developer User', role: 'AI Developer' };
const nonAdminConnectorsHtml = ConnectorsScreen.render();

assert(!nonAdminConnectorsHtml.includes("onclick=\"ConnectorsScreen.setTab('webhooks')\""), 'Non-Admin does not see Webhooks filter tab');
assert(nonAdminConnectorsHtml.includes('All Connectors (5)'), 'Non-Admin sees "All Connectors (5)" dynamic count');
assert(!nonAdminConnectorsHtml.includes('id="connector-card-webhooks"'), 'Non-Admin view omits System Alerts / Webhooks connector card');
assert(nonAdminConnectorsHtml.includes('5 Data Streams'), 'Non-Admin sees 5 Data Streams in Knowledge Layer');

// Admin view
Auth.currentUser = { id: 'mohit', name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com' };
const adminConnectorsHtml = ConnectorsScreen.render();

assert(adminConnectorsHtml.includes("onclick=\"ConnectorsScreen.setTab('webhooks')\""), 'Admin sees Webhooks filter tab');
assert(adminConnectorsHtml.includes('All Connectors (6)'), 'Admin sees "All Connectors (6)" dynamic count');
assert(adminConnectorsHtml.includes('id="connector-card-webhooks"'), 'Admin view includes System Alerts / Webhooks card');
assert(adminConnectorsHtml.includes('6 Data Streams'), 'Admin sees 6 Data Streams in Knowledge Layer');

console.log('\n=== TEST SUITE 4: CONNECTORS REORDERING & FIREBASE REMOVAL (#connectors) ===');
Auth.currentUser = { id: 'dev_user', name: 'Developer User', role: 'AI Developer' };
const reorderedHtml = ConnectorsScreen.render();

// Check tab order in rendered HTML
const allPos = reorderedHtml.indexOf('All Connectors');
const dataSourcesPos = reorderedHtml.indexOf('Data Sources (4)');
const notificationsPos = reorderedHtml.indexOf('Notifications (1)');

assert(allPos < dataSourcesPos && dataSourcesPos < notificationsPos, 'Tab order is All Connectors -> Data Sources -> Notifications');

// Check section order in rendered HTML
const dataSourcesSecPos = reorderedHtml.indexOf('Data Sources</h2>');
const notificationsSecPos = reorderedHtml.indexOf('Notifications</h2>');
assert(dataSourcesSecPos < notificationsSecPos, 'Data Sources section is rendered before Notifications section');

// Check Firebase badge removal
assert(!reorderedHtml.includes('FIREBASE CLOUD MESSAGING'), 'Header badge "FIREBASE CLOUD MESSAGING" is completely removed');
assert(!reorderedHtml.includes('Firebase Cloud Messaging'), 'Description does not mention Firebase Cloud Messaging');
assert(reorderedHtml.includes('Push critical project notifications, milestone alerts, and high-priority commercial triggers across team channels.'), 'Notifications card contains updated description text');

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL VERIFICATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
