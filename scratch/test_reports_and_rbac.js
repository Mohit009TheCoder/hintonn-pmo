// Verification test for Reports Custom Report Builder and RBAC in Projects & Tasks
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
    removeChild(el) {},
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
      querySelectorAll(s) { return []; },
      click() {},
      remove() {}
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
      appendChild(el) {},
      removeChild(el) {},
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
      appendChild(el) {},
      removeChild(el) {},
      focus() {}
    };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  addEventListener() {},
  innerWidth: 1200,
  print() {}
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
loadScript('js/screens/projects.js');
loadScript('js/screens/project-detail.js');
loadScript('js/screens/tasks.js');
loadScript('js/screens/reports.js');

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

console.log('=== INITIALIZING MOCK STORE DATA ===');
Store.init();

// Setup team members
const devPreet = Store.createMember({ id: 'm2', name: 'Preet B', role: 'AI Developer', email: 'preet@hintonn.com', color: '#10B981' });
const devHirvi = Store.createMember({ id: 'm4', name: 'Hirvi AI Dev', role: 'AI Developer', email: 'hirvi@hintonn.com', color: '#8B5CF6' });
const adminMohit = Store.getMember('m3') || Store.createMember({ id: 'm3', name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com', color: '#4F46E5' });

// Setup projects:
// Project 1: Alpha Project (Preet and Hirvi are members)
const projectAlpha = Store.createProject({
  name: 'Alpha AI Automation',
  description: 'AI model training pipeline',
  type: 'AI/ML',
  memberIds: ['m2', 'm4']
});

// Project 2: Beta Project (Only Hirvi is member)
const projectBeta = Store.createProject({
  name: 'Beta Cloud Migration',
  description: 'Infrastructure cloud migration',
  type: 'Software',
  memberIds: ['m4']
});

// Project 3: Gamma Secret Project (Admin only)
const projectGamma = Store.createProject({
  name: 'Gamma Financial Audit',
  description: 'Confidential commercial review',
  type: 'Business',
  memberIds: ['m3']
});

// Setup tasks
const task1 = Store.createTask({
  title: 'Preet Data Preparation',
  projectId: projectAlpha.id,
  assigneeId: 'm2',
  status: 'done',
  priority: 'high',
  dueDate: '2026-10-01'
});

const task2 = Store.createTask({
  title: 'Hirvi Model Fine-tuning',
  projectId: projectAlpha.id,
  assigneeId: 'm4',
  status: 'in-progress',
  priority: 'medium',
  dueDate: '2026-10-10'
});

const task3 = Store.createTask({
  title: 'Hirvi Cloud Backup Sync',
  projectId: projectBeta.id,
  assigneeId: 'm4',
  status: 'todo',
  priority: 'low',
  dueDate: '2026-10-20'
});

console.log('\n=== TEST SUITE 1: CUSTOM REPORT BUILDER (#reports) ===');
// 1. Header Button check
Auth.currentUser = { id: 'preet', memberId: 'm2', name: 'Preet B', role: 'AI Developer' };
const reportsHtml = ReportsScreen.render();
assert(reportsHtml.includes('reports-create-btn'), 'Reports & Analytics header contains "+ Create Report" button (#reports-create-btn)');
assert(reportsHtml.includes('Create Report'), 'Header button has text "Create Report"');

// 2. Non-Admin Report Calculation (locked to My Data Only)
const preetReport = ReportsScreen._calculateReportData({
  title: 'Preet Performance Report',
  dateRange: 'this-month',
  scopeType: 'my',
  scopeLabel: 'Preet B (Personal Activity)',
  targetMemberIds: ['m2'],
  metrics: { velocity: true, completion: true, workload: true, overdue: true, milestones: true, priority: true },
  isAdmin: false,
  currentUser: Auth.currentUser
});

assert(preetReport.totalTasks === 1, 'Standard user report strictly contains only personal tasks (1 task)');
assert(preetReport.completedTasks === 1, 'Standard user report calculates 1 completed task');
assert(preetReport.completionRate === 100, 'Standard user report calculates 100% completion rate');
assert(preetReport.tasks[0].title === 'Preet Data Preparation', 'Task in report is Preet Data Preparation');

// 3. Admin Report Calculation (All Employees company-wide)
Auth.currentUser = { id: 'mohit', memberId: 'm3', name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com' };
const adminAllReport = ReportsScreen._calculateReportData({
  title: 'Company-wide Executive Report',
  dateRange: 'this-month',
  scopeType: 'all',
  scopeLabel: 'All Employees (Company-wide)',
  targetMemberIds: ['m2', 'm4'],
  metrics: { velocity: true, completion: true, workload: true, overdue: true, milestones: true, priority: true },
  isAdmin: true,
  currentUser: Auth.currentUser
});

assert(adminAllReport.totalTasks >= 3, 'Admin company-wide report includes all employee tasks');
assert(adminAllReport.memberBreakdown.length === 2, 'Admin report breaks down workload for all team members (2 developers)');

// 4. Admin Custom Multi-Employee Group Report (Preet + Hirvi squad)
const adminSquadReport = ReportsScreen._calculateReportData({
  title: 'AI Dev Squad Combined Report',
  dateRange: 'this-month',
  scopeType: 'group',
  scopeLabel: 'Custom Squad (Preet B + Hirvi AI Dev)',
  targetMemberIds: ['m2', 'm4'],
  metrics: { velocity: true, completion: true, workload: true, overdue: true, milestones: true, priority: true },
  isAdmin: true,
  currentUser: Auth.currentUser
});
assert(adminSquadReport.totalTasks === 3, 'Custom Multi-Employee Group report aggregates tasks of selected members');

console.log('\n=== TEST SUITE 2: ROLE-BASED ACCESS CONTROL FOR PROJECTS (#projects) ===');
// Non-Admin User (Preet B - only member of Alpha Project)
Auth.currentUser = { id: 'preet', memberId: 'm2', name: 'Preet B', role: 'AI Developer' };
const preetProjects = ProjectsScreen._getFilteredProjects();
assert(preetProjects.length === 1, 'Non-admin user only sees projects they are a member of (Alpha Project)');
assert(preetProjects[0].id === projectAlpha.id, 'Non-admin sees Alpha AI Automation');

const preetProjectsHtml = ProjectsScreen.render();
assert(!preetProjectsHtml.includes('New Project</button>'), 'Non-admin view hides "+ New Project" button');
assert(!preetProjectsHtml.includes('title="Delete project"'), 'Non-admin view hides Delete project buttons');

// Project Detail view for Non-Admin
const projectAlphaDetailHtml = ProjectDetailScreen.render(projectAlpha.id);
assert(projectAlphaDetailHtml.includes('Alpha AI Automation'), 'Non-admin can view details of their assigned project');
assert(!projectAlphaDetailHtml.includes('ProjectsScreen.openCreateModal'), 'Non-admin project detail view hides Edit Project button');

const projectGammaDetailHtml = ProjectDetailScreen.render(projectGamma.id);
assert(projectGammaDetailHtml.includes('Access Restricted'), 'Non-admin accessing non-member project gets Access Restricted');

// Admin User (Mohit Jain - Unrestricted access)
Auth.currentUser = { id: 'mohit', memberId: 'm3', name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com' };
const adminProjects = ProjectsScreen._getFilteredProjects();
assert(adminProjects.length === 3, 'Admin user has unrestricted visibility across all 3 company projects');

const adminProjectsHtml = ProjectsScreen.render();
assert(adminProjectsHtml.includes('New Project'), 'Admin view shows "+ New Project" button');
assert(adminProjectsHtml.includes('title="Edit project"'), 'Admin view shows Edit project buttons');
assert(adminProjectsHtml.includes('title="Delete project"'), 'Admin view shows Delete project buttons');

console.log('\n=== TEST SUITE 3: TASKS VIEW REFACTOR & BIFURCATED KANBAN (#tasks) ===');
// Non-Admin User (Preet B)
Auth.currentUser = { id: 'preet', memberId: 'm2', name: 'Preet B', role: 'AI Developer' };

// 1. UI Cleanliness & Removal of Oversized Toggle Blocks
TasksScreen._filter = { project: '', status: '', priority: '', assignee: '', search: '' };
const cleanTasksHtml = TasksScreen.render();
assert(!cleanTasksHtml.includes('tasks-scope-toggle-group'), 'Oversized toggle blocks are completely removed from Tasks toolbar');
assert(cleanTasksHtml.includes('task-filter-project'), 'Clean filter bar contains All Projects dropdown');
assert(cleanTasksHtml.includes('task-filter-priority'), 'Clean filter bar contains All Priority dropdown');
assert(cleanTasksHtml.includes('task-filter-status'), 'Clean filter bar contains All Status dropdown');
assert(cleanTasksHtml.includes('tasks-create-btn'), 'Header contains "+ Create Task" button');

// 2. Personal Task Creation & Independence from Project Metrics
const personalTask = Store.createTask({
  title: 'Draft Sprint Retro Notes',
  description: 'Personal notes for Friday sync',
  status: 'todo',
  priority: 'low',
  isPersonal: true,
  assigneeId: 'm2'
});

assert(personalTask.isPersonal === true, 'Store.createTask creates personal task with isPersonal: true');
assert(personalTask.projectId === '', 'Personal task has empty projectId');

const projAlphaAfter = Store.getProject(projectAlpha.id);
assert(projAlphaAfter.progress === 50, 'Personal tasks do not skew or alter project progress metrics');

// 3. Bifurcated Column Rendering ("To Do" ONLY vs Clean Single Layout for "In Progress", "Review", "Done")
const allPreetTasks = TasksScreen._getFilteredTasks();
const kanbanHtml = TasksScreen._renderKanban(allPreetTasks);
assert(kanbanHtml.includes('kanban-bifurcated-column'), 'Kanban renders bifurcated column for To Do');
assert(kanbanHtml.includes('Assigned to Me'), 'Top sub-section of To Do displays "Assigned to Me" header');
assert(kanbanHtml.includes('Personal Tasks'), 'Bottom sub-section of To Do displays "Personal Tasks" header');
assert(kanbanHtml.includes('promptAddPersonalTask'), 'Personal Tasks sub-header in To Do includes "+ Add" action triggering promptAddPersonalTask');
assert(kanbanHtml.includes('personal-task-card'), 'Personal task card renders with personal-task-card class');
assert(kanbanHtml.includes('Draft Sprint Retro Notes'), 'Personal task title is rendered in Personal Tasks section');
assert(kanbanHtml.includes('personal-task-checkbox'), 'Personal task card includes interactive checkbox button');

// 3b. Verify Cleaned Up Personal Tasks Card & Sub-section UI
assert(!kanbanHtml.includes('personal-task-tag'), 'Personal task card does NOT contain "Personal" tag/pill badge');
assert(!kanbanHtml.includes('personal-tasks-counter-badge'), 'Sub-header does NOT contain purple counter pill badge');
assert(!kanbanHtml.includes('quick-add-personal-container'), 'Sub-section does NOT contain bottom dashed input box container');
assert(!kanbanHtml.includes('quick-add-personal-input'), 'Sub-section does NOT contain bottom input element');

// Test minimal card layout: Self-managed and checkbox are present
assert(kanbanHtml.includes('Self-managed'), 'Card displays Self-managed footer indicator');
assert(!kanbanHtml.includes('text-decoration:line-through'), 'Unchecked personal task title does not have line-through style');

// Toggle completion to checked
TasksScreen.togglePersonalTaskComplete(null, personalTask.id);
const updatedPersonalTask = Store.getTask(personalTask.id);
assert(updatedPersonalTask.completed === true, 'Toggling checkbox sets task.completed to true');
assert(updatedPersonalTask.status === 'done', 'Toggling checkbox sets task.status to done');

const kanbanHtmlAfterCheck = TasksScreen._renderKanban(TasksScreen._getFilteredTasks());
assert(kanbanHtmlAfterCheck.includes('personal-task-checkbox checked'), 'Checked state adds .checked class to checkbox');
assert(kanbanHtmlAfterCheck.includes('#2563EB'), 'Checked state fills checkbox with brand blue #2563EB');
assert(kanbanHtmlAfterCheck.includes('text-decoration:line-through'), 'Checked state applies line-through style to task title');
assert(kanbanHtmlAfterCheck.includes('opacity:0.65'), 'Checked state applies soft opacity 0.65');

// Toggle back to unchecked
TasksScreen.togglePersonalTaskComplete(null, personalTask.id);
const uncheckedTask = Store.getTask(personalTask.id);
assert(uncheckedTask.completed === false, 'Toggling checkbox again sets task.completed to false');
assert(uncheckedTask.status === 'todo', 'Toggling checkbox again resets status to todo');

// 3c. Test Clean Creation Flow via promptAddPersonalTask
TasksScreen._createPersonalTaskDirect('Review Commercial Proposal');

const preetTasksAfterAdd = TasksScreen._getFilteredTasks().filter(t => t.isPersonal);
assert(preetTasksAfterAdd.some(t => t.title === 'Review Commercial Proposal'), 'Direct creation flow successfully appends personal task');

// 3d. Verify Personal Tasks are strictly static inside To Do and drag-and-drop is disabled
const dummyDragEvent = { preventDefaultCalled: false, preventDefault() { this.preventDefaultCalled = true; }, target: { classList: { add() {} } }, dataTransfer: { effectAllowed: '' } };
const dragResult = TasksScreen.onDragStart(dummyDragEvent, personalTask.id);
assert(dummyDragEvent.preventDefaultCalled || dragResult === false, 'Drag start on personal task prevents drag movement (disabled for personal tasks)');

// Verify In Progress, Review, Done columns have NO personal tasks headers or redundant sub-headers
const inProgressSection = kanbanHtml.split('In Progress')[1]?.split('Review')[0] || '';
const reviewSection = kanbanHtml.split('Review')[1]?.split('Done')[0] || '';
const doneSection = kanbanHtml.split('Done')[1] || '';

assert(!inProgressSection.includes('Personal Tasks'), 'In Progress column does NOT contain Personal Tasks sub-header');
assert(!inProgressSection.includes('Assigned to Me'), 'In Progress column does NOT contain redundant Assigned to Me sub-header');
assert(!inProgressSection.includes('openAddPersonalTaskModal'), 'In Progress column does NOT contain "+ Add Personal Task" action');
assert(inProgressSection.includes('kanban-full-cards'), 'In Progress column renders direct full-height cards container');

assert(!reviewSection.includes('Personal Tasks'), 'Review column does NOT contain Personal Tasks sub-header');
assert(!reviewSection.includes('Assigned to Me'), 'Review column does NOT contain redundant Assigned to Me sub-header');
assert(!reviewSection.includes('openAddPersonalTaskModal'), 'Review column does NOT contain "+ Add Personal Task" action');
assert(reviewSection.includes('kanban-full-cards'), 'Review column renders direct full-height cards container');

assert(!doneSection.includes('Personal Tasks'), 'Done column does NOT contain Personal Tasks sub-header');
assert(!doneSection.includes('Assigned to Me'), 'Done column does NOT contain redundant Assigned to Me sub-header');
assert(!doneSection.includes('openAddPersonalTaskModal'), 'Done column does NOT contain "+ Add Personal Task" action');
assert(doneSection.includes('kanban-full-cards'), 'Done column renders direct full-height cards container');

// 4. Strict Role-Based Task Visibility: Non-admin only sees tasks assigned to them
TasksScreen._filter.project = projectAlpha.id;
const sharedProjectTasks = TasksScreen._getFilteredTasks();
assert(sharedProjectTasks.some(t => t.id === task1.id), 'Shared project filter includes Preet task (task1)');
assert(!sharedProjectTasks.some(t => t.id === task2.id), 'Shared project filter strictly excludes other user Hirvi task (task2)');
assert(!sharedProjectTasks.some(t => t.id === task3.id), 'Shared project filter strictly excludes unassigned project tasks (task3)');

const sharedKanbanHtml = TasksScreen._renderKanban(sharedProjectTasks);
assert(sharedKanbanHtml.includes('Preet Data Preparation'), 'Assigned task renders in Kanban');
assert(!sharedKanbanHtml.includes('Hirvi Model Fine-tuning'), 'Other team member tasks do NOT leak into standard user Kanban');

// 5. Admin project-level tasks visibility (Personal tasks omitted for Admin)
Auth.currentUser = { id: 'mohit', memberId: 'm3', name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com' };
TasksScreen._filter.project = '';
const adminTasks = TasksScreen._getFilteredTasks();
assert(adminTasks.length === 3 && !adminTasks.some(t => t.isPersonal), 'Admin strictly manages project-level tasks and omits personal tasks');

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL VERIFICATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
