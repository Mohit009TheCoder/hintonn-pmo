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
loadScript('js/screens/team.js');

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

console.log('=== TEST SUITE: ADMIN PERSONAL TASKS OMISSION & TEAM CARD TRUNCATION FIX ===');
Store.init();

// Seed members
Store.createMember({ id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', email: 'preet@hintonn.com', color: '#10B981' });
Store.createMember({ id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', email: 'hirvi@hintonn.com', color: '#8B5CF6' });
Store.createMember({ id: 'm5', name: 'Mohit Jain', role: 'AI Developer', email: 'mohit.dev@hintonn.com', color: '#3B82F6' });

// Seed project
Store.createProject({
  id: 'p1',
  name: 'Alpha PMO Platform',
  memberIds: ['m2', 'm4', 'm5']
});

// Seed personal and project tasks
Store.createTask({
  id: 'test-personal-task-1',
  title: 'Preet Personal Checklist Item',
  description: 'Personal notes',
  status: 'todo',
  completed: false,
  priority: 'medium',
  dueDate: '2026-10-01',
  projectId: '',
  isPersonal: true,
  assigneeId: 'm2'
});

Store.createTask({
  id: 'test-project-task-1',
  title: 'Project Engineering Task',
  description: 'Official project work',
  status: 'todo',
  completed: false,
  priority: 'high',
  dueDate: '2026-10-02',
  projectId: 'p1',
  isPersonal: false,
  assigneeId: 'm2',
  assigneeIds: ['m2']
});

// PART 1: Standard User Role (#tasks)
console.log('\n--- 1. Standard User Role Personal Tasks in #tasks ---');
Auth.currentUser = {
  id: 'preet',
  memberId: 'm2',
  name: 'Preet Bhavsar',
  email: 'preet@company.com',
  role: 'Developer'
};

TasksScreen._filter = { project: '', priority: '', status: '', assignee: '', search: '' };
const standardUserTasks = TasksScreen._getFilteredTasks();
assert(standardUserTasks.some(t => t.isPersonal), 'Standard user has personal tasks in filtered tasks');

const standardKanbanHtml = TasksScreen._renderKanban(standardUserTasks);
assert(standardKanbanHtml.includes('PERSONAL TASKS'), 'Standard user Kanban To Do column contains PERSONAL TASKS sub-section');
assert(standardKanbanHtml.includes('add-personal-btn') || standardKanbanHtml.includes('promptAddPersonalTask'), 'Standard user has + Add personal task button');

// Empty state for standard user
const standardEmptyState = TasksScreen._renderContent([]);
assert(standardEmptyState.includes('Add Personal Task'), 'Standard user empty state includes "+ Add Personal Task" button');

// In Progress / Review / Done do NOT contain personal tasks
const todoPart = standardKanbanHtml.split('To Do')[1]?.split('In Progress')[0] || '';
const ipPart = standardKanbanHtml.split('In Progress')[1]?.split('Review')[0] || '';
const reviewPart = standardKanbanHtml.split('Review')[1]?.split('Done')[0] || '';
const donePart = standardKanbanHtml.split('Done')[1] || '';

assert(todoPart.includes('PERSONAL TASKS'), 'To Do column has PERSONAL TASKS sub-section');
assert(!ipPart.includes('PERSONAL TASKS'), 'In Progress column omits PERSONAL TASKS');
assert(!reviewPart.includes('PERSONAL TASKS'), 'Review column omits PERSONAL TASKS');
assert(!donePart.includes('PERSONAL TASKS'), 'Done column omits PERSONAL TASKS');

// PART 2: Admin Role (#tasks)
console.log('\n--- 2. Admin Role Personal Tasks Removal in #tasks ---');
Auth.currentUser = {
  id: 'admin',
  memberId: 'm1',
  name: 'Alex Rivera',
  email: 'alex@company.com',
  role: 'Admin'
};

TasksScreen._filter = { project: '', priority: '', status: '', assignee: '', search: '' };
const adminFilteredTasks = TasksScreen._getFilteredTasks();
assert(!adminFilteredTasks.some(t => t.isPersonal), 'Admin filtered tasks completely omit personal tasks');

const adminKanbanHtml = TasksScreen._renderKanban(adminFilteredTasks);
assert(!adminKanbanHtml.includes('PERSONAL TASKS'), 'Admin Kanban MUST NOT contain "PERSONAL TASKS" sub-section or label');
assert(!adminKanbanHtml.includes('add-personal-btn'), 'Admin Kanban MUST NOT contain add-personal-btn');
assert(!adminKanbanHtml.includes('promptAddPersonalTask'), 'Admin Kanban MUST NOT contain promptAddPersonalTask in cards');

// Empty state for admin
const adminEmptyState = TasksScreen._renderContent([]);
assert(!adminEmptyState.includes('Add Personal Task'), 'Admin empty state MUST NOT include "+ Add Personal Task" button');
assert(adminEmptyState.includes('Create Project Task'), 'Admin empty state retains "+ Create Project Task" button');

// PART 3: Team Card Truncation Fix & 3-Dots Menu (#team)
console.log('\n--- 3. Team Member Name Truncation & 3-Dots Menu in #team ---');
const teamHtmlAdmin = TeamScreen.render();

// Check for 3-dots context menu button and dropdown
assert(teamHtmlAdmin.includes('team-card-menu-btn'), 'Team card includes compact 3-dots menu button (.team-card-menu-btn)');
assert(teamHtmlAdmin.includes('team-card-menu-dropdown'), 'Team card includes dropdown container (.team-card-menu-dropdown)');

// Ensure inline buttons are replaced (not in card header row outside dropdown)
assert(!teamHtmlAdmin.includes('class="btn btn-ghost btn-xs">Profile</button>'), 'Inline Profile text button removed from card header row');
assert(!teamHtmlAdmin.includes('class="btn btn-ghost btn-xs">Role</button>'), 'Inline Role text button removed from card header row');
assert(!teamHtmlAdmin.includes('class="btn btn-ghost btn-xs">Remove</button>'), 'Inline Remove text button removed from card header row');

// Ensure member names occupy 100% width and have non-truncated styling
assert(teamHtmlAdmin.includes('team-member-name'), 'Member name uses team-member-name class');
assert(teamHtmlAdmin.includes('white-space:normal') || teamHtmlAdmin.includes('white-space: normal'), 'Member name styling specifies white-space: normal');
assert(teamHtmlAdmin.includes('overflow:visible') || teamHtmlAdmin.includes('overflow: visible'), 'Member name styling specifies overflow: visible');
assert(teamHtmlAdmin.includes('text-overflow:unset') || teamHtmlAdmin.includes('text-overflow: unset'), 'Member name styling specifies text-overflow: unset');

// Verify full names render cleanly
assert(teamHtmlAdmin.includes('Preet Bhavsar'), 'Preet Bhavsar full name rendered cleanly');
assert(teamHtmlAdmin.includes('Hirvi Sanghavi'), 'Hirvi Sanghavi full name rendered cleanly');
assert(teamHtmlAdmin.includes('Mohit Jain'), 'Mohit Jain full name rendered cleanly');

// Verify dropdown menu options for Admin
assert(teamHtmlAdmin.includes('openMemberProfile'), 'Dropdown includes Profile action');
assert(teamHtmlAdmin.includes('openEditRoleModal'), 'Admin dropdown includes Role action');
assert(teamHtmlAdmin.includes('openRemoveMemberModal'), 'Admin dropdown includes Remove action');

// Test as Standard User (shared project collaborator)
Auth.currentUser = {
  id: 'preet',
  memberId: 'm2',
  name: 'Preet Bhavsar',
  email: 'preet@company.com',
  role: 'Developer'
};

const teamHtmlUser = TeamScreen.render();
assert(teamHtmlUser.includes('team-card-menu-btn'), 'Standard user team card also uses 3-dots menu button');
assert(teamHtmlUser.includes('openMemberProfile'), 'Standard user dropdown includes Profile action');
assert(!teamHtmlUser.includes('openRemoveMemberModal'), 'Standard user dropdown does NOT include Remove action');

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL VERIFICATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
