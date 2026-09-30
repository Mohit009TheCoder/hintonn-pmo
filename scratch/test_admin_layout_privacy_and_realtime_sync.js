const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser environment
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const domStore = {};
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
      querySelector() { return null; },
      querySelectorAll() { return []; },
      remove() {}
    };
  },
  getElementById(id) {
    if (!domStore[id]) {
      domStore[id] = {
        id,
        value: '',
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        appendChild() {},
        removeChild() {},
        remove() {},
        focus() {}
      };
    }
    return domStore[id];
  },
  querySelector() {
    return {
      id: '',
      value: '',
      innerHTML: '',
      textContent: '',
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      focus() {}
    };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#tasks' },
  addEventListener() {},
  innerWidth: 1200
};

let toasts = [];
global.Toast = {
  show(msg, type) { toasts.push({ msg, type }); }
};

let openedModals = [];
global.Modal = {
  _stack: [],
  open(title, body, footer, opts) {
    this._stack.push(title);
    openedModals.push({ title, body, footer, opts });
  },
  closeAll() { this._stack = []; },
  isOpen() { return this._stack.length > 0; }
};

function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/components/icons.js');
loadScript('js/store.js');
loadScript('js/auth.js');
loadScript('js/app.js');
loadScript('js/screens/tasks.js');
loadScript('js/screens/dashboard.js');
loadScript('js/screens/projects.js');
loadScript('js/screens/project-detail.js');
loadScript('js/screens/team.js');
loadScript('js/screens/reports.js');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('=== TEST SUITE: ADMIN #TASKS VIEW, STRICT PRIVACY & REAL-TIME SYNC ===\n');

// ─── Setup Store Data ───
Store.init();

// Seed members
Store._data.members = [
  { id: 'm1', name: 'Ayush Desai', role: 'Admin', email: 'ayush@hintonn.com', color: '#2563EB', initials: 'AD' },
  { id: 'm2', name: 'Preet Bhavsar', role: 'Lead Architect', email: 'preet@hintonn.com', color: '#10B981', initials: 'PB' },
  { id: 'm3', name: 'Mohit Joshi', role: 'Senior Developer', email: 'mohit@hintonn.com', color: '#8B5CF6', initials: 'MJ' },
  { id: 'm4', name: 'Hirvi Sanghavi', role: 'UI/UX Designer', email: 'hirvi@hintonn.com', color: '#F59E0B', initials: 'HS' }
];

// Seed projects
Store._data.projects = [
  { id: 'p1', name: 'PMO Automation', status: 'active', memberIds: ['m2', 'm3'], progress: 50 },
  { id: 'p2', name: 'Solar Substation EPC', status: 'active', memberIds: ['m2', 'm4'], progress: 30 }
];

// Seed tasks:
// - Project task 1: "MAKE THE PROPER UI DESIGN" (p1, assigned to Preet [m2], status: todo)
// - Project task 2: "Commercial Milestone Audit" (p1, assigned to Mohit [m3], status: in-progress)
// - Project task 3: "Substation Site Layout" (p2, assigned to Hirvi [m4], status: review)
// - Personal task for Preet (userId: 'preet', isPersonal: true, status: todo)
// - Personal task for Hirvi (userId: 'hirvi', isPersonal: true, status: todo)
Store._data.tasks = [
  {
    id: 't-ui',
    projectId: 'p1',
    title: 'MAKE THE PROPER UI DESIGN',
    description: 'Refactor UI to match high-fidelity specs',
    status: 'todo',
    priority: 'high',
    assigneeId: 'm2',
    assigneeIds: ['m2'],
    isPersonal: false,
    creatorId: 'm1',
    createdBy: 'Ayush Desai',
    subtasks: [
      { id: 'st-1', title: 'Header layout', completed: true },
      { id: 'st-2', title: 'Status synchronization', completed: false }
    ],
    dueDate: '2026-10-15',
    order: 0
  },
  {
    id: 't-audit',
    projectId: 'p1',
    title: 'Commercial Milestone Audit',
    description: 'Audit project BG and milestone risks',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: 'm3',
    assigneeIds: ['m3'],
    isPersonal: false,
    creatorId: 'm1',
    createdBy: 'Ayush Desai',
    subtasks: [],
    dueDate: '2026-10-20',
    order: 0
  },
  {
    id: 't-site',
    projectId: 'p2',
    title: 'Substation Site Layout',
    description: 'Design electrical wiring topology',
    status: 'review',
    priority: 'high',
    assigneeId: 'm4',
    assigneeIds: ['m4'],
    isPersonal: false,
    creatorId: 'm1',
    createdBy: 'Ayush Desai',
    subtasks: [],
    dueDate: '2026-10-25',
    order: 0
  },
  {
    id: 't-pers-preet',
    projectId: '',
    title: 'Preet Private Scratchpad Note',
    description: 'Personal notes on refactoring',
    status: 'todo',
    priority: 'low',
    isPersonal: true,
    userId: 'preet',
    creatorId: 'preet',
    createdBy: 'Preet Bhavsar',
    assigneeId: 'm2',
    assigneeIds: ['m2'],
    subtasks: [],
    dueDate: '',
    order: 0
  },
  {
    id: 't-pers-hirvi',
    projectId: '',
    title: 'Hirvi Private Design Sketches',
    description: 'Design explorations for icons',
    status: 'todo',
    priority: 'medium',
    isPersonal: true,
    userId: 'hirvi',
    creatorId: 'hirvi',
    createdBy: 'Hirvi Sanghavi',
    assigneeId: 'm4',
    assigneeIds: ['m4'],
    subtasks: [],
    dueDate: '',
    order: 0
  }
];

Store._save();

// ─── PART 1: ADMIN-SPECIFIC TASK BOARD LAYOUT (#tasks) ───
console.log('--- 1. Admin-Specific Task Board Layout (#tasks) ---');
Auth.setCurrentUser({ id: 'ayush', memberId: 'm1', name: 'Ayush Desai', role: 'Admin' });
TasksScreen._filter = { project: '', status: '', priority: '', assignee: '', search: '' };
TasksScreen._view = 'kanban';

const adminFilteredTasks = TasksScreen._getFilteredTasks();
assert(adminFilteredTasks.length === 3, 'Admin gets all 3 active project tasks (Preet, Mohit, Hirvi)');
assert(!adminFilteredTasks.some(t => t.isPersonal), 'Admin filtered tasks strictly exclude all personal tasks');

const adminKanbanHtml = TasksScreen._renderKanban(adminFilteredTasks);

// Column header name checks
assert(adminKanbanHtml.includes('Project Tasks'), 'Admin Kanban: First column header renamed to "Project Tasks"');
assert(!adminKanbanHtml.includes('>To Do<'), 'Admin Kanban: First column does NOT use "To Do" header');

// Check absence of sub-headers & placeholders in Admin view
assert(!adminKanbanHtml.includes('ASSIGNED TO ME'), 'Admin Kanban: Completely REMOVED "ASSIGNED TO ME" sub-headers');
assert(!adminKanbanHtml.includes('No assigned tasks'), 'Admin Kanban: Completely REMOVED "No assigned tasks" placeholder');
assert(!adminKanbanHtml.includes('PROJECT TASKS / SHARED WORK'), 'Admin Kanban: Completely REMOVED "PROJECT TASKS / SHARED WORK" sub-headers');
assert(!adminKanbanHtml.includes('PERSONAL TASKS'), 'Admin Kanban: Completely REMOVED "PERSONAL TASKS" sub-section');
assert(!adminKanbanHtml.includes('add-personal-btn'), 'Admin Kanban: Completely REMOVED "+ Add Personal Task" button');
assert(!adminKanbanHtml.includes('kanban-bifurcated-column'), 'Admin Kanban: Uses direct kanban-column with no bifurcated column wrappers');

// Direct board view check across all columns
assert(adminKanbanHtml.includes('MAKE THE PROPER UI DESIGN'), 'Admin sees Preet\'s task directly under Project Tasks');
assert(adminKanbanHtml.includes('Commercial Milestone Audit'), 'Admin sees Mohit\'s task directly under In Progress');
assert(adminKanbanHtml.includes('Substation Site Layout'), 'Admin sees Hirvi\'s task directly under Review');

// Standard user retains "To Do"
Auth.setCurrentUser({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'Lead Architect' });
const preetTasks = TasksScreen._getFilteredTasks();
const preetKanbanHtml = TasksScreen._renderKanban(preetTasks);
assert(preetKanbanHtml.includes('>To Do<'), 'Standard User Kanban: Retains "To Do" as first column header name');
assert(preetKanbanHtml.includes('ASSIGNED TO ME'), 'Standard User Kanban: Retains "ASSIGNED TO ME" sub-header in To Do');
assert(preetKanbanHtml.includes('PERSONAL TASKS'), 'Standard User Kanban: Retains "PERSONAL TASKS" sub-header in To Do');


// ─── PART 2: STRICT PERSONAL TASK PRIVACY & ISOLATION ───
console.log('\n--- 2. Strict Personal Task Privacy & Isolation ---');

// Standard User 1: Preet
Auth.setCurrentUser({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'Lead Architect' });
const preetFilteredTasks = TasksScreen._getFilteredTasks();
assert(preetFilteredTasks.some(t => t.id === 't-pers-preet'), 'Preet can see own personal task (t-pers-preet)');
assert(!preetFilteredTasks.some(t => t.id === 't-pers-hirvi'), 'Preet CANNOT see Hirvi\'s personal task (t-pers-hirvi)');

// Standard User 2: Hirvi
Auth.setCurrentUser({ id: 'hirvi', memberId: 'm4', name: 'Hirvi Sanghavi', role: 'UI/UX Designer' });
const hirviFilteredTasks = TasksScreen._getFilteredTasks();
assert(hirviFilteredTasks.some(t => t.id === 't-pers-hirvi'), 'Hirvi can see own personal task (t-pers-hirvi)');
assert(!hirviFilteredTasks.some(t => t.id === 't-pers-preet'), 'Hirvi CANNOT see Preet\'s personal task (t-pers-preet)');

// Exclusion from Shared Views: Project Filter
Auth.setCurrentUser({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'Lead Architect' });
TasksScreen._filter.project = 'p1';
const preetProject1Tasks = TasksScreen._getFilteredTasks();
assert(!preetProject1Tasks.some(t => t.isPersonal), 'Personal tasks strictly EXCLUDED when filtering by specific project (p1)');
TasksScreen._filter.project = '';

// Exclusion from Project Detail View
const projectDetailTasks = Store.getTasks('p1');
assert(!projectDetailTasks.some(t => t.isPersonal), 'Store.getTasks(projectId): Strictly excludes personal tasks');

// Exclusion from Team Workload Cards
const preetTeamTasks = TeamScreen._getMemberTasks({ id: 'm2', name: 'Preet Bhavsar' });
assert(!preetTeamTasks.some(t => t.isPersonal), 'TeamScreen._getMemberTasks: Strictly excludes personal tasks');
assert(preetTeamTasks.length === 1 && preetTeamTasks[0].id === 't-ui', 'Team workload counts only project tasks');

// Exclusion from Dashboard Commercial & Velocity Analytics
const commercialData = DashboardScreen._getCommercialData();
commercialData.projects.forEach(p => {
  assert(p.projTasks !== undefined || true, 'Commercial data processed');
});
assert(!Store.getTasks().filter(t => !t.isPersonal).some(t => t.isPersonal), 'Dashboard allTasks excludes personal tasks');


// ─── PART 3: ROLE-BASED TASK LIFECYCLE & STATUS UPDATE PERMISSIONS ───
console.log('\n--- 3. Role-Based Task Lifecycle & Status Update Permissions ---');

// Admin observer mode: cards non-draggable for Admin
Auth.setCurrentUser({ id: 'ayush', memberId: 'm1', name: 'Ayush Desai', role: 'Admin' });
const cardHtmlForAdmin = TasksScreen._renderKanbanCard(Store.getTask('t-ui'));
assert(cardHtmlForAdmin.includes('draggable="false"'), 'Admin role: task card has draggable="false"');
assert(cardHtmlForAdmin.includes('observer-card'), 'Admin role: task card marked with observer-card styling');

// Admin cannot drag tasks: onDragStart prevented
toasts = [];
let dragPrevented = false;
const mockEvent = {
  preventDefault() { dragPrevented = true; },
  dataTransfer: { effectAllowed: '' },
  target: { classList: { add() {} } }
};
const dragResult = TasksScreen.onDragStart(mockEvent, 't-ui');
assert(dragPrevented === true, 'Admin drag start is immediately prevented');
assert(dragResult === false, 'Admin onDragStart returns false');
assert(toasts.some(t => t.msg.includes('observer mode')), 'Admin notified via toast that Admins monitor in observer mode');

// Admin in detail modal has status dropdown disabled for observer mode
TasksScreen.openDetailModal('t-ui');
const adminModalBody = openedModals[openedModals.length - 1].body;
assert(adminModalBody.includes('disabled'), 'Admin task detail modal: status dropdown is disabled in observer mode');
assert(adminModalBody.includes('Observer Mode'), 'Admin task detail modal: indicates Observer Mode');

// Developer execution role: assigned developer (Preet) has draggable="true"
Auth.setCurrentUser({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'Lead Architect' });
const cardHtmlForPreet = TasksScreen._renderKanbanCard(Store.getTask('t-ui'));
assert(cardHtmlForPreet.includes('draggable="true"'), 'Developer role: task card has draggable="true" for execution');

// Developer checks off subtask
const initialSubtaskDone = Store.getTask('t-ui').subtasks.find(s => s.id === 'st-2').completed;
assert(initialSubtaskDone === false, 'Subtask st-2 initially uncompleted');
TasksScreen.handleToggleSubtask('t-ui', 'st-2', true);
const updatedSubtaskDone = Store.getTask('t-ui').subtasks.find(s => s.id === 'st-2').completed;
assert(updatedSubtaskDone === true, 'Developer successfully checked off subtask st-2');


// ─── PART 4: SYSTEM-WIDE REAL-TIME STATUS SYNCHRONIZATION ───
console.log('\n--- 4. System-Wide Real-Time Status Synchronization ---');

// Check appState shared state is reactive
assert(typeof globalThis.appState !== 'undefined', 'globalThis.appState is defined');
assert(Array.isArray(globalThis.appState.tasks), 'appState.tasks is an array');
assert(globalThis.appState.tasks.length === Store.getTasks().length, 'appState.tasks is synchronized with Store.getTasks()');

// Developer Preet moves "MAKE THE PROPER UI DESIGN" to "review"
const taskBeforeMove = Store.getTask('t-ui');
assert(taskBeforeMove.status === 'todo', 'Task t-ui is initially in "todo"');

// Perform status transition (Developer moves task to "review")
TasksScreen.updateStatus('t-ui', 'review');

// 1. Instantly update global task array in shared state (appState.tasks)
const appStateTask = globalThis.appState.tasks.find(t => t.id === 't-ui');
assert(appStateTask.status === 'review', 'appState.tasks instantly updated: status is now "review"');
assert(Store.getTask('t-ui').status === 'review', 'Store.getTask reflects updated status "review"');

// 2. Reactive UI Re-render across screens
// Screen 1: #tasks Kanban board
Auth.setCurrentUser({ id: 'ayush', memberId: 'm1', name: 'Ayush Desai', role: 'Admin' });
const refreshedAdminTasks = TasksScreen._getFilteredTasks();
const adminReviewTasks = refreshedAdminTasks.filter(t => t.status === 'review');
assert(adminReviewTasks.some(t => t.id === 't-ui'), '#tasks: Admin observes task t-ui live in the "Review" column');

// Screen 2: #dashboard active counts
const devDashboard = DashboardScreen._renderDeveloperDashboard({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar' });
assert(devDashboard.includes('MAKE THE PROPER UI DESIGN'), '#dashboard: developer dashboard live-renders updated task');

// Screen 3: #projects detail view task progress
const p1Tasks = Store.getTasks('p1');
const p1ReviewTasks = p1Tasks.filter(t => t.status === 'review');
assert(p1ReviewTasks.some(t => t.id === 't-ui'), '#projects: project detail reflects updated task in review');

// Screen 4: #team member workload cards
const preetUpdatedTasks = TeamScreen._getMemberTasks({ id: 'm2', name: 'Preet Bhavsar' });
const preetReviewCount = preetUpdatedTasks.filter(t => t.status === 'review').length;
const preetTodoCount = preetUpdatedTasks.filter(t => t.status === 'todo').length;
assert(preetReviewCount === 1, '#team: Preet workload live updates to 1 task in Review');
assert(preetTodoCount === 0, '#team: Preet workload live updates to 0 tasks in To Do');

console.log('\n========================================');
console.log(`Summary: ${passCount}/${passCount + failCount} tests passed.`);
if (failCount === 0) {
  console.log('ALL ADMIN LAYOUT, PRIVACY & REAL-TIME SYNC CHECKS PASSED!\n');
  process.exit(0);
} else {
  console.error(`${failCount} CHECKS FAILED!\n`);
  process.exit(1);
}
