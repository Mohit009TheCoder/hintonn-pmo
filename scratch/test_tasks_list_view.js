/**
 * Unit Test: Tasks Screen List View Verification
 * Tests the "List" toggle functionality, table rendering, role-based controls,
 * and status updates for both standard Users and Admins.
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser environment
const domElements = {};
globalThis.window = globalThis;
globalThis.document = {
  getElementById: (id) => domElements[id] || null,
  querySelector: (sel) => null
};

// Mock store and data
const mockTasks = [
  {
    id: 't-proj-1',
    title: 'Build Authentication Module',
    projectId: 'p1',
    assigneeId: 'm2',
    assigneeIds: ['m2'],
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-10-15',
    subtasks: [{ id: 'st1', title: 'Sub 1', completed: true }, { id: 'st2', title: 'Sub 2', completed: false }]
  },
  {
    id: 't-proj-review',
    title: 'Review PR for Database Migration',
    projectId: 'p1',
    assigneeId: 'm2',
    assigneeIds: ['m2', 'm3'],
    status: 'review',
    priority: 'medium',
    dueDate: '2026-10-12',
    subtasks: []
  },
  {
    id: 't-pers-1',
    title: 'Prep for 1-on-1 Sync',
    isPersonal: true,
    creatorId: 'preet',
    userId: 'preet',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-10-05',
    subtasks: []
  }
];

const mockMembers = {
  'm2': { id: 'm2', name: 'Preet Bhavsar', color: '#2563EB', initials: 'PB' },
  'm3': { id: 'm3', name: 'Mohit Jain', color: '#10B981', initials: 'MJ' }
};

const mockProjects = {
  'p1': { id: 'p1', name: 'Hintonn Core Platform', memberIds: ['m2', 'm3'] }
};

let currentStoreTasks = [...mockTasks];
let notifications = [];

globalThis.Store = {
  getTasks: (projId) => projId ? currentStoreTasks.filter(t => t.projectId === projId && !t.isPersonal) : currentStoreTasks,
  getTask: (id) => currentStoreTasks.find(t => t.id === id),
  updateTask: (id, updates) => {
    const idx = currentStoreTasks.findIndex(t => t.id === id);
    if (idx !== -1) currentStoreTasks[idx] = { ...currentStoreTasks[idx], ...updates };
  },
  getMember: (id) => mockMembers[id],
  getMembers: () => Object.values(mockMembers),
  getProject: (id) => mockProjects[id],
  getProjects: () => Object.values(mockProjects),
  getAssignees: () => Object.values(mockMembers),
  addNotification: (n) => notifications.push(n)
};

globalThis.Utils = {
  escapeHtml: (s) => s || '',
  humanize: (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''),
  isOverdue: (d) => false,
  formatDate: (d) => d || '',
  truncate: (s, n) => s
};

globalThis.Icons = {
  plus: '+',
  search: '[search]',
  clock: '[clock]',
  edit: '[edit]',
  checkSquare: '[check]'
};

globalThis.Toast = {
  show: (msg) => console.log('   Toast:', msg)
};

// Load TasksScreen
const tasksCode = fs.readFileSync('js/screens/tasks.js', 'utf8');
vm.runInThisContext(tasksCode);

console.log('=== TEST SUITE: TASKS SCREEN LIST VIEW VERIFICATION ===\n');

// 1. STANDARD USER TESTING
console.log('--- 1. Standard User List View ---');
globalThis.Auth = {
  getCurrentUser: () => ({ id: 'preet', name: 'Preet Bhavsar', role: 'User', memberId: 'm2' })
};

// Mock DOM elements for view switcher
domElements['tasks-view-board-btn'] = { style: {}, classList: { add: () => {}, remove: () => {} } };
domElements['tasks-view-list-btn'] = { style: {}, classList: { add: () => {}, remove: () => {} } };
domElements['tasks-container'] = { innerHTML: '' };
domElements['tasks-subtitle'] = { textContent: '' };

// Switch view to list
TasksScreen.handleViewChange('list');
assert.strictEqual(TasksScreen._view, 'list', 'TasksScreen view updated to "list"');

// Render content in list view
const userListHtml = TasksScreen._renderContent(TasksScreen._getFilteredTasks());
assert(userListHtml.includes('<table class="table">'), 'List view renders an HTML table');
assert(userListHtml.includes('Build Authentication Module'), 'Project task rendered in table');
assert(userListHtml.includes('Prep for 1-on-1 Sync'), 'Personal task rendered in table');
assert(userListHtml.includes('personal-task-tag'), 'Personal task displays Personal badge in Scope column');
assert(userListHtml.includes('personal-task-checkbox'), 'Personal task has toggle checkbox');
assert(userListHtml.includes('Hintonn Core Platform'), 'Project task displays project name in Scope column');
assert(userListHtml.includes('updateStatus'), 'Standard user has interactive status select');
console.log('  ✓ Standard user successfully switches to List view and renders table with all tasks');

// 2. STATUS UPDATE IN LIST VIEW
console.log('\n--- 2. Interactive Status Update in List View ---');
TasksScreen.updateStatus('t-proj-1', 'review');
const updatedTask = Store.getTask('t-proj-1');
assert.strictEqual(updatedTask.status, 'review', 'Task status updated to "review"');
assert(notifications.some(n => n.taskId === 't-proj-1'), 'Admin review notification triggered');
console.log('  ✓ updateStatus successfully updates task status and triggers review notification');

// Personal task completion toggle
TasksScreen.togglePersonalTaskComplete(null, 't-pers-1');
const updatedPersonalTask = Store.getTask('t-pers-1');
assert.strictEqual(updatedPersonalTask.status, 'done', 'Personal task marked done');
assert.strictEqual(updatedPersonalTask.completed, true, 'Personal task completed flag set to true');
console.log('  ✓ togglePersonalTaskComplete toggles personal task completion');

// 3. ADMIN LIST VIEW TESTING
console.log('\n--- 3. Admin Role List View ---');
globalThis.Auth = {
  getCurrentUser: () => ({ id: 'admin', name: 'Admin User', role: 'Admin' })
};

const adminTasks = TasksScreen._getFilteredTasks();
assert(!adminTasks.some(t => t.isPersonal), 'Admin task list strictly excludes personal tasks');

const adminListHtml = TasksScreen._renderContent(adminTasks);
assert(adminListHtml.includes('<table class="table">'), 'Admin list view renders HTML table');
assert(adminListHtml.includes('Review Changes'), 'Admin list view renders Review Changes button for tasks in review');
assert(!adminListHtml.includes('Prep for 1-on-1 Sync'), 'Admin list view omits personal tasks');
console.log('  ✓ Admin list view renders with observer mode badges & review action button');

console.log('\n========================================');
console.log('ALL TASKS LIST VIEW TESTS PASSED!');
console.log('========================================\n');
