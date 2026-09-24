// Simulation Test for Hintonn PMO
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.document = {
  getElementById(id) { return { innerHTML: '', value: '', classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, querySelector(){ return null; }, focus(){}, scrollIntoView(){}, scrollTo(){} }; },
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

const vm = require('vm');

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

// Initialize Store and Auth
Store.init();
Auth.init();
// Log in as Ayush (Admin) to test all screen rendering
Auth.login('Ayush', 'ayush@123');
console.log('✔ Store initialized with', Store.getProjects().length, 'projects,', Store.getTasks().length, 'tasks,', Store.getMilestones().length, 'milestones,', Store.getIssues().length, 'issues');
console.log('✔ Authenticated as', Auth.getCurrentUser().name, `(${Auth.getCurrentUser().role})`);

// Test Render all screens
const screens = [
  { name: 'Dashboard', render: () => DashboardScreen.render() },
  { name: 'Billing & Invoices', render: () => BillingScreen.render() },
  { name: 'Retention Summary', render: () => RetentionScreen.render() },
  { name: 'Bank Guarantees', render: () => BankGuaranteesScreen.render() },
  { name: 'DLP Timelines', render: () => DLPTimelinesScreen.render() },
  { name: 'Projects', render: () => ProjectsScreen.render() },
  { name: 'Project Detail (p1)', render: () => ProjectDetailScreen.render('p1') },
  { name: 'Tasks (Kanban)', render: () => { TasksScreen._view = 'kanban'; return TasksScreen.render(); } },
  { name: 'Tasks (List)', render: () => { TasksScreen._view = 'list'; return TasksScreen.render(); } },
  { name: 'Timeline (Phase-Progress)', render: () => TimelineScreen.render() },
  { name: 'Team', render: () => TeamScreen.render() },
  { name: 'Calendar', render: () => CalendarScreen.render() },
  { name: 'Reports', render: () => ReportsScreen.render() },
  { name: 'Issues', render: () => IssuesScreen.render() },
  { name: 'Milestones', render: () => MilestonesScreen.render() },
  { name: 'AI Assistant', render: () => AIAssistantScreen.render() },
  { name: 'Notifications', render: () => NotificationsScreen.render() },
  { name: 'Settings', render: () => SettingsScreen.render() }
];

screens.forEach(s => {
  const html = s.render();
  if (typeof html !== 'string' || html.length < 50) {
    throw new Error(`Screen ${s.name} failed to render properly (output length: ${html ? html.length : 0})`);
  }
  console.log(`✔ Screen [${s.name}] rendered successfully (${html.length} chars)`);
});

// Test AI Assistant Inquiries
const inquiries = [
  'What needs my attention?',
  'Show overdue tasks',
  'Summarize my projects',
  'Show upcoming deadlines',
  'Show blocked tasks',
  'Summarize today\'s activity',
  'Show project progress',
  'Find fine-tuning'
];

inquiries.forEach(q => {
  const res = AIAssistantScreen._processQuery(q);
  if (!res.text) throw new Error(`Query "${q}" returned empty response`);
  console.log(`✔ AI Query [${q}] -> response text: "${res.text.slice(0, 50)}..." | Cards: ${res.cards ? res.cards.length : 0}`);
});

// Verify Admin Profile & Task Assignees
const members = Store.getMembers();
const admin = members.find(m => m.id === 'm1');
if (!admin || admin.name !== 'Ayush Desai' || admin.initials !== 'AD' || admin.role !== 'Admin' || admin.email !== 'ayush@hintonn.com') {
  throw new Error(`Admin profile mismatch: ${JSON.stringify(admin)}`);
}
console.log('✔ Admin member profile verified: Ayush Desai (AD) | Admin | ayush@hintonn.com');

const assignees = Store.getAssignees();
if (assignees.length !== 3) {
  throw new Error(`Expected 3 developer assignees, got ${assignees.length}`);
}
const assigneeNames = assignees.map(a => a.name);
if (!assigneeNames.includes('Preet Bhavsar') || !assigneeNames.includes('Mohit Jain') || !assigneeNames.includes('Hirvi Sanghavi')) {
  throw new Error(`Assignees mismatch: ${JSON.stringify(assigneeNames)}`);
}
if (assignees.some(a => a.id === 'm1' || a.name.includes('Ayush') || a.role === 'Admin')) {
  throw new Error(`Ayush Desai found in getAssignees()!`);
}
console.log('✔ Task assignees strictly restricted to 3 AI Developers:', assigneeNames.join(', '));

// Verify no task assigned to Admin
const tasksWithAdmin = Store.getTasks().filter(t => t.assigneeId === 'm1');
if (tasksWithAdmin.length > 0) {
  throw new Error(`Found ${tasksWithAdmin.length} tasks assigned to Admin m1: ${tasksWithAdmin.map(t=>t.id).join(', ')}`);
}
console.log('✔ Verified zero tasks assigned to Admin (Ayush Desai)');

// Verify Team Screen Excludes Admin and Shows Only AI Developers
const teamHtml = TeamScreen.render();
if (teamHtml.includes('Ayush Desai') || teamHtml.includes('AD')) {
  throw new Error('Team screen should exclude Admin (Ayush Desai)!');
}
if (!teamHtml.includes('Preet Bhavsar') || !teamHtml.includes('Mohit Jain') || !teamHtml.includes('Hirvi Sanghavi')) {
  throw new Error('Team screen missing active AI Developers');
}
console.log('✔ Team screen verified: Admin excluded and only AI Developers rendered');

// Verify Tasks Screen Assignee Filter
const tasksHtml = TasksScreen.render();
if (tasksHtml.includes('<option value="m1">Ayush Desai</option>') || tasksHtml.includes('>Ayush Desai</option>')) {
  throw new Error('Ayush Desai found in TasksScreen assignee filter options!');
}
if (!tasksHtml.includes('Preet Bhavsar') || !tasksHtml.includes('Mohit Jain') || !tasksHtml.includes('Hirvi Sanghavi')) {
  throw new Error('TasksScreen filter missing developer assignee options');
}
console.log('✔ TasksScreen filter excludes Ayush Desai and contains only AI Developers');

console.log('\n ALL TESTS PASSED SUCCESSFULLY! 🚀');
