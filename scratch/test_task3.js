// Task 3 Verification Suite: Admin Identity Rules & Task Assignee Exclusion
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let pageContentHtml = '';
let modalOpenData = null;

global.document = {
  body: { style: {}, classList: { add(){}, remove(){}, contains(){ return false; } } },
  getElementById(id) {
    if (id === 'page-content') {
      return {
        get innerHTML() { return pageContentHtml; },
        set innerHTML(val) { pageContentHtml = val; },
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
    return {
      innerHTML: '',
      value: '',
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      querySelector(){ return null; },
      focus(){},
      scrollIntoView(){},
      scrollTo(){}
    };
  },
  querySelector(sel) { return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} }; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#dashboard' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts in order
const files = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/components/topbar.js',
  'js/components/modal.js',
  'js/components/toast.js',
  'js/components/command.js',
  'js/screens/login.js',
  'js/screens/dashboard.js',
  'js/screens/billing.js',
  'js/screens/retention.js',
  'js/screens/bank-guarantees.js',
  'js/screens/dlp.js',
  'js/screens/projects.js',
  'js/screens/project-detail.js',
  'js/screens/tasks.js',
  'js/screens/timeline.js',
  'js/screens/team.js',
  'js/screens/calendar.js',
  'js/screens/reports.js',
  'js/screens/issues.js',
  'js/screens/milestones.js',
  'js/screens/ai-assistant.js',
  'js/screens/notifications.js',
  'js/screens/settings.js',
  'js/app.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

Store.init();
Auth.init();

// Intercept Modal.open to capture modal markup
Modal.open = function(title, body, footer, opts) {
  modalOpenData = { title, body, footer, opts };
};

console.log('--- 1. Testing Store Assignee Exclusion ---');
const assignees = Store.getAssignees();
console.log('Assignees found:', assignees.map(a => `${a.name} (${a.role})`));

if (assignees.length !== 3) {
  throw new Error(`Expected exactly 3 assignees, found ${assignees.length}`);
}
const hasAyush = assignees.some(a => a.id === 'm1' || a.name.includes('Ayush') || a.role === 'Admin');
if (hasAyush) {
  throw new Error('Ayush Desai (Admin) was found in Store.getAssignees()!');
}
const expectedNames = ['Preet Bhavsar', 'Mohit Jain', 'Hirvi Sanghavi'];
expectedNames.forEach(name => {
  if (!assignees.some(a => a.name === name)) {
    throw new Error(`Expected developer ${name} missing from assignees!`);
  }
});
console.log('✔ Verified Store.getAssignees() strictly returns 3 AI Developers and excludes Ayush Desai');

console.log('\n--- 2. Testing Task Assignment Guard in Store (createTask & updateTask) ---');
// Try to create a task assigning Ayush (m1)
const task1 = Store.createTask({
  projectId: 'p1',
  title: 'Test Admin Assignment Attempt',
  assigneeId: 'm1'
});
if (task1.assigneeId === 'm1') {
  throw new Error('Store.createTask allowed assigning task directly to Ayush Desai (m1)!');
}
console.log('✔ Verified Store.createTask prevented task assignment to Ayush Desai');

// Try to update a task to assign Ayush (m1)
Store.updateTask(task1.id, { assigneeId: 'm1' });
const updatedTask1 = Store.getTask(task1.id);
if (updatedTask1.assigneeId === 'm1') {
  throw new Error('Store.updateTask allowed reassigning task to Ayush Desai (m1)!');
}
console.log('✔ Verified Store.updateTask prevented reassigning task to Ayush Desai');

// Verify Ayush CAN assign/reassign tasks to the 3 developers
Store.updateTask(task1.id, { assigneeId: 'm2' });
if (Store.getTask(task1.id).assigneeId !== 'm2') {
  throw new Error('Failed to assign task to Preet Bhavsar (m2)');
}
Store.updateTask(task1.id, { assigneeId: 'm3' });
if (Store.getTask(task1.id).assigneeId !== 'm3') {
  throw new Error('Failed to reassign task to Mohit Jain (m3)');
}
Store.updateTask(task1.id, { assigneeId: 'm4' });
if (Store.getTask(task1.id).assigneeId !== 'm4') {
  throw new Error('Failed to reassign task to Hirvi Sanghavi (m4)');
}
console.log('✔ Verified tasks can be freely created and reassigned to any of the 3 AI Developers');

// Verify Store.getMyTasks('m1') returns empty
const myTasksAyush = Store.getMyTasks('m1');
if (myTasksAyush.length > 0) {
  throw new Error('Store.getMyTasks(m1) returned tasks for Admin!');
}
console.log('✔ Verified Store.getMyTasks("m1") returns empty array for Admin');

// Clean up test task
Store.deleteTask(task1.id);

console.log('\n--- 3. Testing UI Assignee Dropdowns & Filters ---');
// TasksScreen Render (Filter Bar)
const tasksHtml = TasksScreen.render();
if (tasksHtml.includes('>Ayush Desai</option>')) {
  throw new Error('TasksScreen assignee filter dropdown contains Ayush Desai!');
}
console.log('✔ Verified TasksScreen filter dropdown excludes Ayush Desai');

// TasksScreen Create Task Modal
TasksScreen.openCreateModal('p1');
if (modalOpenData.body.includes('>Ayush Desai</option>')) {
  throw new Error('TasksScreen create modal contains Ayush Desai in assignee dropdown!');
}
console.log('✔ Verified TasksScreen create modal excludes Ayush Desai');

// TasksScreen Detail / Edit Modal
const firstTaskId = Store.getTasks()[0].id;
TasksScreen.openDetailModal(firstTaskId);
if (modalOpenData.body.includes('>Ayush Desai</option>')) {
  throw new Error('TasksScreen detail modal contains Ayush Desai in assignee dropdown!');
}
console.log('✔ Verified TasksScreen detail/edit modal excludes Ayush Desai');

// IssuesScreen Create Modal
IssuesScreen.openCreateModal('p1');
if (modalOpenData.body.includes('>Ayush Desai</option>')) {
  throw new Error('IssuesScreen create modal contains Ayush Desai in assignee dropdown!');
}
console.log('✔ Verified IssuesScreen create modal excludes Ayush Desai');

// ReportsScreen Workload Chart
const reportsHtml = ReportsScreen.render();
if (reportsHtml.includes('Ayush Desai') && reportsHtml.includes('Task Workload')) {
  throw new Error('ReportsScreen task workload chart contains Ayush Desai!');
}
console.log('✔ Verified ReportsScreen member workload chart excludes Ayush Desai');

console.log('\n--- 4. Testing Team Page (#team) Overhaul ---');
// Render Team page
const teamHtml = TeamScreen.render();

// Header check: "3 active AI Developers"
if (!teamHtml.includes('3 active AI Developers')) {
  throw new Error('Team page missing "3 active AI Developers" header!');
}
console.log('✔ Verified Team page header displays "3 active AI Developers"');

// Admin excluded
if (teamHtml.includes('Ayush Desai')) {
  throw new Error('Admin Ayush Desai should not be on Team page!');
}
console.log('✔ Verified Ayush Desai excluded from Team page');

// All 3 AI Developers present
const devMembers = ['Preet Bhavsar', 'Mohit Jain', 'Hirvi Sanghavi'];
devMembers.forEach(name => {
  if (!teamHtml.includes(name)) {
    throw new Error(`Team developer ${name} missing from Team page!`);
  }
});
console.log('✔ Verified all 3 AI Developers rendered on Team page');

// Verify Developer cards have task stats intact
const cards = teamHtml.split('class="section-card');
const preetCard = cards.find(c => c.includes('Preet Bhavsar'));
if (!preetCard || !preetCard.includes('Total') || !preetCard.includes('Active') || !preetCard.includes('Overdue')) {
  throw new Error('Developer card for Preet Bhavsar missing task statistics!');
}
console.log('✔ Verified Developer cards retain task metrics and active task lists');

console.log('\n--- 5. Testing "You" Badge on Preet Bhavsar Card ---');
// When logged in as Preet
Auth.login('Preet', 'preet@123');
const teamHtmlPreet = TeamScreen.render();
const preetCardWhenPreet = teamHtmlPreet.split('class="section-card').find(c => c.includes('Preet Bhavsar'));
if (!preetCardWhenPreet.includes('>You</span>')) {
  throw new Error('Preet Bhavsar card missing "You" badge when logged in as Preet!');
}
console.log('✔ Verified Preet Bhavsar card displays "You" badge when logged in as Preet');

// When logged in as Ayush Desai
Auth.login('Ayush', 'ayush@123');
const teamHtmlAyush = TeamScreen.render();
const preetCardWhenAyush = teamHtmlAyush.split('class="section-card"').find(c => c.includes('Preet Bhavsar'));
if (preetCardWhenAyush.includes('>You</span>')) {
  throw new Error('Preet Bhavsar card incorrectly shows "You" badge when logged in as Ayush!');
}
console.log('✔ Verified Preet Bhavsar card does NOT display "You" badge when logged in as Ayush');

console.log('\n ALL TASK 3 TESTS PASSED SUCCESSFULLY! 🚀\n');
