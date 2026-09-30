/**
 * Verification test suite for Admin Review, Changes Request, and Assignee Notifications
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const domStore = {};
global.document = {
  body: {
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild() {},
    removeChild() {}
  },
  createElement() {
    return {
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      setAttribute() {},
      appendChild() {},
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

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
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
loadScript('js/app.js');
loadScript('js/store.js');
loadScript('js/auth.js');
loadScript('js/screens/tasks.js');

global.Sidebar = { render() {} };
global.Topbar = { render() {}, updateBreadcrumb() {} };
App.currentScreen = 'tasks';

console.log('=== TEST SUITE: ADMIN TASK REVIEW, STATUS CYCLE & ASSIGNEE NOTIFICATIONS ===\n');

// Initialize Store
Store.init();

// Ensure test members exist
if (!Store.getMember('m2')) Store.createMember({ id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', email: 'preet@test.com' });
if (!Store.getMember('m4')) Store.createMember({ id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', email: 'hirvi@test.com' });

// Ensure test project exists
let proj = Store.getProject('p-test-rev');
if (!proj) {
  proj = Store.createProject({ id: 'p-test-rev', name: 'Hintonn CRM', code: 'CRM' });
}

// ─── 1. DEVELOPER MOVES TASK TO REVIEW PHASE ───
console.log('--- 1. Developer Submits Task for Review ---');
const task1 = Store.createTask({
  id: 'task-rev-1',
  title: 'UI fixes',
  description: 'Fix the responsive layout on mobile',
  projectId: 'p-test-rev',
  assigneeId: 'm4',
  assigneeIds: ['m4', 'm2'], // Multi-assigned to Hirvi and Preet
  status: 'in-progress',
  priority: 'medium',
  dueDate: '2026-10-02'
});

assert(task1.status === 'in-progress', 'Task initially in in-progress');

// Hirvi (developer) moves task to review
Auth.setCurrentUser({ id: 'hirvi', memberId: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', email: 'hirvi@test.com' });
TasksScreen.updateStatus(task1.id, 'review');

const updatedToReview = Store.getTask(task1.id);
assert(updatedToReview.status === 'review', 'Task status is now review');

// Verify notification was sent to Admin
const allNotifs = Store._data.notifications;
const reviewSubmittedNotif = allNotifs.find(n => n.text.includes('submitted for review by Hirvi Sanghavi'));
assert(Boolean(reviewSubmittedNotif), 'Notification dispatched when developer moves task to review');
console.log('  ✓ Task successfully transitioned to review');
console.log('  ✓ Admin notification dispatched upon moving to review');


// ─── 2. ADMIN OBSERVATION & REVIEW INTERFACE ───
console.log('\n--- 2. Admin Observation & Review Interface ---');
// Switch session to Admin
Auth.setCurrentUser({
  id: 'mohit',
  memberId: 'm3',
  name: 'Mohit Jain',
  role: 'Admin',
  email: 'mohithintonn@gmail.com'
});

// Kanban card render for Admin in Review column
const cardHtml = TasksScreen._renderKanbanCard(updatedToReview);
assert(cardHtml.includes('Review Changes'), 'Admin card in Review column renders Review Changes button');
assert(!cardHtml.includes('#FFFBEB') && !cardHtml.includes('#FCD34D'), 'Admin card uses theme colors (no yellow styles)');
assert(cardHtml.includes('observer-card'), 'Admin card retains observer-card styling');
console.log('  ✓ Kanban card renders in-theme "Review Changes" button for Admin');

// Admin opens detail modal
TasksScreen.openDetailModal(task1.id);
const lastModal = openedModals[openedModals.length - 1];
assert(lastModal !== null, 'Detail modal opened');
// 1) Verify comment section is entirely removed from task modal
assert(!lastModal.body.includes('Comments ('), 'Detail modal entirely removes Comments section');
assert(!lastModal.body.includes('new-comment'), 'Detail modal does not contain new-comment input');
// 2) Verify inline yellow card & approve action from 2nd image are entirely removed
assert(!lastModal.body.includes('admin-review-section'), 'Detail modal omits inline admin-review-section from 2nd image');
assert(!lastModal.body.includes('Approve & Mark Done'), 'Detail modal omits Approve & Mark Done action');
assert(!lastModal.body.includes('#FFFBEB') && !lastModal.body.includes('#FCD34D'), 'Detail modal contains no yellow colors');
// 3) Verify status select remains disabled and footer provides clean Review Changes action
assert(lastModal.body.includes('disabled'), 'Status select remains in observer mode (disabled)');
assert(lastModal.footer.includes('Review Changes'), 'Footer includes in-theme Review Changes action');
console.log('  ✓ Detail modal omits comments section entirely (Photo 1 fix)');
console.log('  ✓ Detail modal omits inline review box & approve button (Photo 2 fix)');
console.log('  ✓ Footer provides clean in-theme "Review Changes" option');


// ─── 3. ADMIN REQUESTS CHANGES WITH REVIEW NOTES VIA REVIEW MODAL ───
console.log('\n--- 3. Admin Submitting Review & Moving Task to In Progress ---');

// Open dedicated Review Changes modal
TasksScreen.openReviewModal(task1.id);
const reviewModal = openedModals[openedModals.length - 1];
assert(reviewModal.title === 'Review Changes', 'Review Changes modal has correct title');
assert(reviewModal.body.includes('admin-review-input'), 'Review modal contains admin-review-input');
assert(reviewModal.footer.includes('Submit Changes'), 'Review modal contains Submit Changes button');

// Mock empty submission validation
document.getElementById('admin-review-input').value = '   ';
TasksScreen.submitAdminReview(task1.id);
assert(document.getElementById('admin-review-error').textContent.includes('Please enter'), 'Empty review is blocked with error message');
console.log('  ✓ Empty review text submission is validated and prevented');

// Submit valid review feedback
document.getElementById('admin-review-input').value = 'Please adjust button padding and fix mobile alignment.';
TasksScreen.submitAdminReview(task1.id);

const taskAfterReview = Store.getTask(task1.id);
assert(taskAfterReview.status === 'in-progress', 'Task moved back to in-progress phase');
assert(taskAfterReview.completed === false, 'Task completed is false');
assert(taskAfterReview.reviewNotes === 'Please adjust button padding and fix mobile alignment.', 'Task saved review notes');
assert(taskAfterReview.lastReviewedBy === 'Mohit Jain', 'Task tracks lastReviewedBy');
assert(Array.isArray(taskAfterReview.reviewHistory) && taskAfterReview.reviewHistory.length === 1, 'Task tracks reviewHistory');
console.log('  ✓ Task status moved back to "in-progress"');
console.log('  ✓ Review notes and reviewHistory recorded on task');


// ─── 4. ASSIGNEE RECEIVES REAL-TIME NOTIFICATION ───
console.log('\n--- 4. Assignee Notification Verification ---');

// Check notifications generated
const changeReqNotif = Store._data.notifications.find(n => n.text.includes('Changes requested on "UI fixes"') && n.text.includes('Please adjust button padding'));
assert(Boolean(changeReqNotif), 'Notification for requested changes created in Store');
assert(changeReqNotif.text.includes('<strong>"Please adjust button padding and fix mobile alignment."</strong>'), 'Notification highlights review text in bold');
assert(Array.isArray(changeReqNotif.targetMemberIds), 'Notification contains targetMemberIds');
assert(changeReqNotif.targetMemberIds.includes('m4'), 'Hirvi (m4) is in targetMemberIds');
assert(changeReqNotif.targetMemberIds.includes('m2'), 'Preet (m2) is in targetMemberIds');

// Log in as Hirvi (assignee)
Auth.setCurrentUser({ id: 'hirvi', memberId: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', email: 'hirvi@test.com' });
const hirviNotifs = Store.getNotifications();
const hirviReceived = hirviNotifs.find(n => n.id === changeReqNotif.id);
assert(Boolean(hirviReceived), 'Hirvi (assignee 1) receives the review changes notification');

// Log in as Preet (assignee 2)
Auth.setCurrentUser({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', email: 'preet@test.com' });
const preetNotifs = Store.getNotifications();
const preetReceived = preetNotifs.find(n => n.id === changeReqNotif.id);
assert(Boolean(preetReceived), 'Preet (assignee 2) receives the review changes notification');
console.log('  ✓ Assignee 1 (Hirvi) receives the notification');
console.log('  ✓ Assignee 2 (Preet) receives the notification');


// ─── 5. DEVELOPER VIEW: CALLOUT BANNER & KANBAN BADGE ───
console.log('\n--- 5. Developer Task View & Badge in In-Progress ---');
// Hirvi opens task modal
TasksScreen.openDetailModal(task1.id);
const devModal = openedModals[openedModals.length - 1];
assert(devModal.body.includes('Review Changes Requested'), 'Developer modal displays review feedback callout banner');
assert(devModal.body.includes('Please adjust button padding and fix mobile alignment.'), 'Developer modal displays exact review notes');
assert(!devModal.body.includes('#FEF2F2') && !devModal.body.includes('#FECACA'), 'Banner uses in-theme styling');

// Kanban card in In-Progress displays Changes Requested badge
const devCardHtml = TasksScreen._renderKanbanCard(taskAfterReview);
assert(devCardHtml.includes('Changes Requested'), 'Kanban card in In Progress displays Changes Requested badge');
assert(!devCardHtml.includes('#FEF3C7') && !devCardHtml.includes('#FDE68A'), 'Changes Requested badge uses in-theme styling (no yellow)');
console.log('  ✓ Developer modal displays prominent in-theme Review Feedback callout banner');
console.log('  ✓ Kanban card in "In Progress" displays in-theme "Changes Requested" badge');

console.log('\n========================================');
console.log('ALL ADMIN TASK REVIEW & NOTIFICATION CHECKS PASSED!');
console.log('========================================\n');
process.exit(0);
