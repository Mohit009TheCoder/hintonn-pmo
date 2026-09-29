// Comprehensive verification test for Multi-Assignee Task Assignment and Cross-Member Shared Project Visibility
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
    return {
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
  addEventListener() {},
  innerWidth: 1200
};

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
loadScript('js/screens/project-detail.js');

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

console.log('=== TEST SUITE 1: MULTI-ASSIGNEE DATA MODEL IN STORE ===');
Store.init();

// Setup team members
Store._data.members = [
  { id: 'm1', name: 'Ayush Desai', role: 'Admin', color: '#EF4444', initials: 'AD' },
  { id: 'm2', name: 'Preet Banga', role: 'Member', designation: 'Civil Lead', color: '#2563EB', initials: 'PB' },
  { id: 'm3', name: 'Mohit Joshi', role: 'Member', designation: 'Structural Engineer', color: '#10B981', initials: 'MJ' },
  { id: 'm4', name: 'Hirvi Shah', role: 'Member', designation: 'Electrical Engineer', color: '#F59E0B', initials: 'HS' }
];

// Setup project with Preet and Mohit
const project1 = Store.createProject({
  name: 'Metro Line 4 Extension',
  description: 'Transit corridor engineering',
  memberIds: ['m2', 'm3']
});

// Setup project with Mohit and Hirvi
const project2 = Store.createProject({
  name: 'Solar Grid Phase 2',
  description: 'Renewable power plant',
  memberIds: ['m3', 'm4']
});

// 1. Create multi-assignee task
const multiTask = Store.createTask({
  title: 'Tunnel Alignment & Soil Mechanics',
  projectId: project1.id,
  assigneeIds: ['m2', 'm3'],
  creatorId: 'm2',
  createdBy: 'Preet Banga',
  status: 'todo',
  priority: 'high'
});

assert(Array.isArray(multiTask.assigneeIds), 'multiTask.assigneeIds is an array');
assert(multiTask.assigneeIds.length === 2, 'multiTask has 2 assignees');
assert(multiTask.assigneeIds.includes('m2') && multiTask.assigneeIds.includes('m3'), 'multiTask assigned to Preet and Mohit');
assert(multiTask.assigneeId === 'm2', 'multiTask.assigneeId primary fallback correctly set to m2');
assert(multiTask.creatorId === 'm2', 'multiTask tracks creatorId');
assert(multiTask.createdBy === 'Preet Banga', 'multiTask tracks createdBy');

// 2. Admin cannot be assigned a task
const adminTask = Store.createTask({
  title: 'Admin exclusion check',
  projectId: project1.id,
  assigneeIds: ['m1', 'm2', 'm4']
});
assert(!adminTask.assigneeIds.includes('m1'), 'Admin m1 is strictly excluded from assigneeIds');
assert(adminTask.assigneeIds.length === 2, 'Task only assigned to non-admin members');

// 3. Update task assignees
Store.updateTask(multiTask.id, {
  assigneeIds: ['m2', 'm3', 'm4']
});
const updatedMulti = Store.getTask(multiTask.id);
assert(updatedMulti.assigneeIds.length === 3, 'Task updated to 3 assignees: Preet, Mohit, Hirvi');
assert(updatedMulti.assigneeIds.includes('m4'), 'Hirvi added as third assignee');

console.log('\n=== TEST SUITE 2: KANBAN CARD OVERLAPPING AVATAR STACK ===');

// Render card with 3 assignees
const cardHtml3 = TasksScreen._renderKanbanCard(updatedMulti);
assert(cardHtml3.includes('avatar-stack'), 'Kanban card HTML contains .avatar-stack container');
assert(cardHtml3.includes('avatar-stack-item'), 'Kanban card HTML contains .avatar-stack-item badges');
assert(cardHtml3.includes('PB') && cardHtml3.includes('MJ') && cardHtml3.includes('HS'), 'Avatar stack contains PB, MJ, and HS initials');
assert(cardHtml3.includes('margin-left:-8px') || cardHtml3.includes('margin-left: -8px'), 'Avatar stack applies overlapping margin-left: -8px');

// Render card with 1 assignee
const singleTask = Store.createTask({
  title: 'Single member task',
  projectId: project1.id,
  assigneeIds: ['m2']
});
const cardHtml1 = TasksScreen._renderKanbanCard(singleTask);
assert(!cardHtml1.includes('avatar-stack-item'), 'Single assignee card does not render overlapping stack item');
assert(cardHtml1.includes('PB'), 'Single assignee card renders member initials');

console.log('\n=== TEST SUITE 3: MODAL ASSIGNEE SELECTOR & RBAC SELECTION ===');

// Preet (standard user) creates task for project1
Auth.getCurrentUser = () => ({ id: 'preet', memberId: 'm2', name: 'Preet Banga', role: 'Member' });
const standardUser = Auth.getCurrentUser();

const preetSelectable = TasksScreen._getSelectableAssignees(project1.id, standardUser);
assert(preetSelectable.some(m => m.id === 'm2'), 'Preet is selectable for project1');
assert(preetSelectable.some(m => m.id === 'm3'), 'Mohit (collaborator) is selectable for project1');
assert(!preetSelectable.some(m => m.id === 'm4'), 'Hirvi (not in project1) is NOT selectable for project1 by standard user');
assert(!preetSelectable.some(m => m.id === 'm1'), 'Admin Ayush Desai is NOT selectable');

// Admin creates task
Auth.getCurrentUser = () => ({ id: 'admin', memberId: 'm1', name: 'Ayush Desai', role: 'Admin' });
const adminUser = Auth.getCurrentUser();
const adminSelectable = TasksScreen._getSelectableAssignees(project1.id, adminUser);
assert(adminSelectable.some(m => m.id === 'm2') && adminSelectable.some(m => m.id === 'm3') && adminSelectable.some(m => m.id === 'm4'),
  'Admin can select any team member across all projects (Preet, Mohit, Hirvi)');

// Assignee pill selector markup
const pillsHtml = TasksScreen._renderAssigneePills(preetSelectable, ['m2'], 'task');
assert(pillsHtml.includes('assignee-pill-btn'), 'Pills markup renders .assignee-pill-btn');
assert(pillsHtml.includes('task-assignee-cb'), 'Pills markup renders hidden checkbox input');
assert(pillsHtml.includes('selected'), 'Preet pill has .selected class');

console.log('\n=== TEST SUITE 4: SHARED PROJECT VISIBILITY & TO DO BIFURCATION ===');

// Set user back to Preet
Auth.getCurrentUser = () => ({ id: 'preet', memberId: 'm2', name: 'Preet Banga', role: 'Member' });

// Create tasks in project 1:
// Task A: Assigned to Preet
const taskAssignedToPreet = Store.createTask({
  title: 'Foundation Piling Works',
  projectId: project1.id,
  assigneeIds: ['m2'],
  creatorId: 'm2',
  createdBy: 'Preet Banga',
  status: 'todo'
});

// Task B: Assigned to Mohit (collaborator on project 1)
const taskAssignedToMohit = Store.createTask({
  title: 'Steel Girders Quality Check',
  projectId: project1.id,
  assigneeIds: ['m3'],
  creatorId: 'm3',
  createdBy: 'Mohit Joshi',
  status: 'todo'
});

// Task C: Assigned to Preet + Mohit (multi-assigned)
const taskMultiAssigned = Store.createTask({
  title: 'Environmental Impact Assessment',
  projectId: project1.id,
  assigneeIds: ['m2', 'm3'],
  creatorId: 'm2',
  createdBy: 'Preet Banga',
  status: 'todo'
});

// Task D: Personal task of Preet
const personalTaskPreet = Store.createTask({
  title: 'Personal Safety Equipment Audit',
  projectId: '',
  isPersonal: true,
  assigneeId: 'm2',
  creatorId: 'm2',
  createdBy: 'Preet Banga',
  status: 'todo'
});

// Task E: Task in project 2 (Preet is NOT a member of project 2)
const project2Task = Store.createTask({
  title: 'Solar Inverter Calibration',
  projectId: project2.id,
  assigneeIds: ['m3', 'm4'],
  creatorId: 'm3',
  createdBy: 'Mohit Joshi',
  status: 'todo'
});

// Filter by project 1
TasksScreen._filter.project = project1.id;
let filteredTasks = TasksScreen._getFilteredTasks();

assert(filteredTasks.some(t => t.id === taskAssignedToPreet.id), 'Project filter includes task assigned to Preet');
assert(filteredTasks.some(t => t.id === taskAssignedToMohit.id), 'Project filter includes task assigned to Mohit (shared project collaborator)');
assert(filteredTasks.some(t => t.id === taskMultiAssigned.id), 'Project filter includes multi-assigned task (Preet + Mohit)');
assert(!filteredTasks.some(t => t.id === project2Task.id), 'Project 1 filter strictly excludes project 2 task');

// Test Kanban To Do sections
const kanbanHtml = TasksScreen._renderKanban(filteredTasks);
assert(kanbanHtml.includes('ASSIGNED TO ME'), 'To Do column has "ASSIGNED TO ME" sub-section');
assert(kanbanHtml.includes('PROJECT TASKS / SHARED WORK'), 'To Do column has "PROJECT TASKS / SHARED WORK" sub-section');
assert(kanbanHtml.includes('PERSONAL TASKS'), 'To Do column has "PERSONAL TASKS" sub-section');

// Verify categorization
assert(TasksScreen._isUserTask(taskAssignedToPreet, standardUser) === true, 'taskAssignedToPreet is categorized as user task');
assert(TasksScreen._isUserTask(taskMultiAssigned, standardUser) === true, 'taskMultiAssigned is categorized as user task (multi-assignee includes Preet)');
assert(TasksScreen._isUserTask(taskAssignedToMohit, standardUser) === false, 'taskAssignedToMohit is NOT a user task (assigned only to Mohit)');

console.log('\n=== TEST SUITE 5: INTERACTIVE PERMISSIONS & DELETION RBAC ===');

// All collaborators can view details and toggle subtasks
const subtaskTask = Store.createTask({
  title: 'Collaborative Signoff',
  projectId: project1.id,
  assigneeIds: ['m3'],
  creatorId: 'm3',
  createdBy: 'Mohit Joshi',
  subtasks: [{ id: 'st-collab-1', title: 'Verify site clearance', completed: false }]
});

// Preet checks off subtask on Mohit\'s task in project1
TasksScreen.handleToggleSubtask(subtaskTask.id, 'st-collab-1', true);
const updatedSubtaskTask = Store.getTask(subtaskTask.id);
assert(updatedSubtaskTask.subtasks[0].completed === true, 'Collaborator Preet can check off subtask on teammate\'s shared project task');

// Task deletion RBAC:
let toastMsg = '';
Toast.show = (m, type) => { toastMsg = m; };

TasksScreen.deleteTask(taskAssignedToMohit.id);
assert(toastMsg.includes('creator') || toastMsg.includes('administrator'), 'Standard user who is not creator cannot delete teammate task');
assert(Store.getTask(taskAssignedToMohit.id) !== undefined, 'Teammate task was NOT deleted');

// 2. Preet deletes taskAssignedToPreet (created by Preet)
Modal.confirm = (title, desc, onConfirm) => { onConfirm(); };
Modal.closeAll = () => {};
TasksScreen.deleteTask(taskAssignedToPreet.id);
assert(Store.getTask(taskAssignedToPreet.id) === undefined, 'Task Creator (Preet) can delete their own task');

// 3. Admin can delete any task
Auth.getCurrentUser = () => ({ id: 'admin', memberId: 'm1', name: 'Ayush Desai', role: 'Admin' });
TasksScreen.deleteTask(taskAssignedToMohit.id);
assert(Store.getTask(taskAssignedToMohit.id) === undefined, 'Admin can delete any task');

console.log('\n========================================');
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL MULTI-ASSIGNEE & SHARED VISIBILITY CHECKS PASSED!');
  process.exit(0);
} else {
  process.exit(1);
}
