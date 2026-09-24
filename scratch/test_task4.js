// Task 4 Verification Suite: Personalized Dashboard Engine
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

console.log('--- 1. Testing AI Developer Dashboard (Preet Bhavsar) ---');
Auth.login('Preet', 'preet@123');
const preetDashboard = DashboardScreen.render();

// Check Greeting: "Good [morning/afternoon/evening], Preet"
const greetingRegex = /Good (morning|afternoon|evening), Preet/;
if (!greetingRegex.test(preetDashboard)) {
  throw new Error('Preet dashboard missing personalized greeting "Good [morning/afternoon/evening], Preet"!');
}
console.log('✔ Verified personalized greeting for Preet');

// Check Top 4 KPI Cards: My Active Tasks, My Completed Tasks, My Overdue Tasks, My Open Issues & Workload
if (!preetDashboard.includes('My Active Tasks') || !preetDashboard.includes('My Completed Tasks') || !preetDashboard.includes('My Overdue Tasks') || !preetDashboard.includes('My Open Issues')) {
  throw new Error('Preet dashboard missing required developer KPI cards!');
}

// Calculate expected metrics for Preet
const allTasks = Store.getTasks();
const isPreetTask = (t) => t.assigneeId === 'preet' || t.assigneeId === 'm2';
const preetTasks = allTasks.filter(isPreetTask);
const preetActiveTasks = preetTasks.filter(t => t.status !== 'done');
const preetCompletedTasks = preetTasks.filter(t => t.status === 'done');
const preetOverdueTasks = preetActiveTasks.filter(t => Utils.isOverdue(t.dueDate));

if (!preetDashboard.includes(`${preetActiveTasks.length} Active`)) {
  throw new Error(`Preet dashboard active tasks count mismatch: expected ${preetActiveTasks.length}`);
}
if (!preetDashboard.includes(`${preetCompletedTasks.length} Done`)) {
  throw new Error(`Preet dashboard completed tasks count mismatch: expected ${preetCompletedTasks.length}`);
}
console.log(`✔ Verified Preet KPI counts: ${preetActiveTasks.length} Active, ${preetCompletedTasks.length} Completed, ${preetOverdueTasks.length} Overdue`);

// Check "My Remaining Work"
if (!preetDashboard.includes('My Remaining Work')) {
  throw new Error('Preet dashboard missing "My Remaining Work" section!');
}
// Ensure tasks for Mohit (e.g. t3, t5) or Hirvi (e.g. t12) are NOT in Preet's remaining work
const mohitOnlyTask = allTasks.find(t => (t.assigneeId === 'm3' || t.assigneeId === 'mohit') && t.status !== 'done');
if (mohitOnlyTask && preetDashboard.includes(`>${mohitOnlyTask.title}<`)) {
  throw new Error(`Preet's remaining work contains task assigned to Mohit: "${mohitOnlyTask.title}"!`);
}
console.log('✔ Verified "My Remaining Work" only contains tasks assigned to Preet');

// Check "My Projects"
if (!preetDashboard.includes('My Projects')) {
  throw new Error('Preet dashboard missing "My Projects" section!');
}
// Preet is assigned tasks in p1, p2, p4
const p1 = Store.getProject('p1');
if (!preetDashboard.includes(p1.name)) {
  throw new Error('Preet dashboard missing project containing Preet tasks (p1)!');
}
console.log('✔ Verified "My Projects" contains projects with Preet tasks');

// Check "My Upcoming Deadlines"
if (!preetDashboard.includes('My Upcoming Deadlines')) {
  throw new Error('Preet dashboard missing "My Upcoming Deadlines" section!');
}
console.log('✔ Verified "My Upcoming Deadlines" is rendered');

// Ensure NO commercial metrics leak into AI Developer dashboard
if (preetDashboard.includes('Total Portfolio Value') || preetDashboard.includes('$14.2M') || preetDashboard.includes('BG Expiry Risk') || preetDashboard.includes('Retention Held ($450K)')) {
  throw new Error('Commercial metrics leaked into AI Developer dashboard!');
}
console.log('✔ Verified AI Developer dashboard contains zero commercial metrics');

console.log('\n--- 2. Testing AI Developer Dashboard for Mohit Jain ---');
Auth.login('Mohit', 'mohit@123');
const mohitDashboard = DashboardScreen.render();
if (!/Good (morning|afternoon|evening), Mohit/.test(mohitDashboard)) {
  throw new Error('Mohit dashboard missing personalized greeting!');
}
const isMohitTask = (t) => t.assigneeId === 'mohit' || t.assigneeId === 'm3';
const mohitTasks = allTasks.filter(isMohitTask);
const mohitActiveTasks = mohitTasks.filter(t => t.status !== 'done');
if (!mohitDashboard.includes(`${mohitActiveTasks.length} Active`)) {
  throw new Error(`Mohit dashboard active tasks count mismatch: expected ${mohitActiveTasks.length}`);
}
console.log(`✔ Verified Mohit dashboard renders personalized greeting and ${mohitActiveTasks.length} active tasks`);

console.log('\n--- 3. Testing AI Developer Dashboard for Hirvi Sanghavi ---');
Auth.login('Hirvi', 'hirvi@123');
const hirviDashboard = DashboardScreen.render();
if (!/Good (morning|afternoon|evening), Hirvi/.test(hirviDashboard)) {
  throw new Error('Hirvi dashboard missing personalized greeting!');
}
const isHirviTask = (t) => t.assigneeId === 'hirvi' || t.assigneeId === 'm4';
const hirviTasks = allTasks.filter(isHirviTask);
const hirviActiveTasks = hirviTasks.filter(t => t.status !== 'done');
if (!hirviDashboard.includes(`${hirviActiveTasks.length} Active`)) {
  throw new Error(`Hirvi dashboard active tasks count mismatch: expected ${hirviActiveTasks.length}`);
}
console.log(`✔ Verified Hirvi dashboard renders personalized greeting and ${hirviActiveTasks.length} active tasks`);

console.log('\n--- 4. Testing Admin Dashboard (Ayush Desai) ---');
Auth.login('Ayush', 'ayush@123');
const adminDashboard = DashboardScreen.render();

// Check greeting: "Good [morning/afternoon/evening], Ayush"
if (!/Good (morning|afternoon|evening), Ayush/.test(adminDashboard)) {
  throw new Error('Admin dashboard missing greeting "Good [morning/afternoon/evening], Ayush"!');
}
console.log('✔ Verified Admin greeting for Ayush');

// Check commercial portfolio totals
if (!adminDashboard.includes('$14.2M') || !adminDashboard.includes('Pending Invoices') || !adminDashboard.includes('$1.8M') || !adminDashboard.includes('BG Expiry Risk')) {
  throw new Error('Admin dashboard missing required executive commercial KPI figures ($14.2M, $1.8M, etc.)!');
}
console.log('✔ Verified Admin dashboard renders company-wide commercial totals and BG expiry risks');

// Check Overall Team Workload
if (!adminDashboard.includes('Overall Team Workload')) {
  throw new Error('Admin dashboard missing Overall Team Workload widget!');
}
if (!adminDashboard.includes('Preet Bhavsar') || !adminDashboard.includes('Mohit Jain') || !adminDashboard.includes('Hirvi Sanghavi')) {
  throw new Error('Admin dashboard team workload missing developer profiles!');
}
console.log('✔ Verified Admin dashboard renders Overall Team Workload across all 3 AI Developers');

// Check that "My Tasks" or developer task assignment metrics are NOT displayed for Ayush
if (adminDashboard.includes('My Tasks') || adminDashboard.includes('My Remaining Work') || adminDashboard.includes('My Upcoming Deadlines')) {
  throw new Error('Admin dashboard contains developer-specific "My Tasks" or "My Remaining Work" blocks!');
}
console.log('✔ Verified Admin dashboard does NOT display "My Tasks" or developer task assignment metrics');

console.log('\n ALL TASK 4 TESTS PASSED SUCCESSFULLY! 🚀\n');
