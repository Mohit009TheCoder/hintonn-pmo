// Headless verification: Timeline Day view renders real task bars + milestone markers
const fs = require('fs');
const path = require('path');

// ── Browser / app stubs ──
const mem = {};
globalThis.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
globalThis.firebase = {
  firestore: () => ({ collection: () => ({ onSnapshot: () => {}, doc: () => ({ set: async () => {}, delete: async () => {} }) }) }),
  auth: () => ({ currentUser: null, signInAnonymously: () => ({ then: () => ({ catch: () => {} }) }), onAuthStateChanged: () => {} })
};
globalThis.Utils = {
  escapeHtml: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  formatDate: d => d || '',
  humanize: s => String(s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  isOverdue: () => false
};
globalThis.Icons = { download: '<svg/>', check: '<svg/>', shield: '<svg/>', plus: '<svg/>', search: '<svg/>', clock: '<svg/>', calendar: '<svg/>', target: '<svg/>', folder: '<svg/>', fileText: '<svg/>' };
globalThis.Auth = { getCurrentUser: () => ({ id: 'm3', name: 'Mohit Jain', role: 'Admin' }) };
globalThis.Toast = { show: () => {} };
globalThis.Modal = { open: () => {}, closeAll: () => {} };
globalThis.App = { currentScreen: 'timeline', navigate: () => {} };
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  head: { appendChild() {} },
  body: { appendChild() {} }
};
globalThis.requestAnimationFrame = fn => fn();

// ── Load Store + TimelineScreen ──
const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'js', 'store.js'), 'utf8') + '\n;globalThis.Store = Store;');
eval(fs.readFileSync(path.join(root, 'js', 'screens', 'timeline.js'), 'utf8') + '\n;globalThis.TimelineScreen = TimelineScreen;');

// ── Seed REAL data via Store API (no fabricated fields) ──
Store.init();
const proj = Store.createProject({ name: 'Hintonn PMO' }); // no startDate/endDate on purpose
const today = new Date().toISOString().split('T')[0];
const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
Store.createTask({ projectId: proj.id, title: 'Dashboard QA pass', status: 'in-progress', startDate: today, dueDate: plus(2), assigneeIds: ['m3'] });
Store.createTask({ projectId: proj.id, title: 'Invoice engine tests', status: 'todo', startDate: plus(1), dueDate: plus(5), assigneeIds: ['m4'] });
Store.createMilestone({ projectId: proj.id, name: 'Phase 1 sign-off', dueDate: today });
Store.createMilestone({ projectId: proj.id, name: 'Go-live', dueDate: plus(10) });

// ── Render Day view ──
TimelineScreen._viewScale = 'day';
const data = TimelineScreen._getFilteredData();
const dayHtml = TimelineScreen._renderDayView(data.list);
const sidebarHtml = TimelineScreen._renderLeftSidebar(data.list);

let fail = 0;
const check = (label, cond) => { console.log((cond ? '✅' : '❌') + ' ' + label); if (!cond) fail++; };

// Collapsed: project bar spans from createdAt (real fallback) + milestone diamonds on the grid
check('project bar rendered (fallback startDate=createdAt)', dayHtml.includes('timeline-bar-wrapper'));
check('milestone diamond markers rendered on project row', (dayHtml.match(/timeline-ms-marker/g) || []).length >= 2);
check('ms-up class used for upcoming milestone', dayHtml.includes('ms-up'));
check('today marker in day view', dayHtml.includes('timeline-macro-today-line'));
check('day header shows today badge', dayHtml.includes('today-badge'));
check('task title NOT in collapsed canvas (only in expanded rows)', !dayHtml.includes('Dashboard QA pass'));

// Expanded: real task bars + milestone sub-rows
TimelineScreen._expandedProjects[proj.id] = true;
const dayExpanded = TimelineScreen._renderDayView(data.list);
const sideExpanded = TimelineScreen._renderLeftSidebar(data.list);
check('expanded canvas renders task bars', dayExpanded.includes('timeline-task-bar'));
check('expanded canvas task bar has real title', dayExpanded.includes('Dashboard QA pass'));
check('task status class st-prog used', dayExpanded.includes('st-prog'));
check('task status class st-todo used', dayExpanded.includes('st-todo'));
check('expanded canvas milestone sub-row markers', (dayExpanded.match(/timeline-ms-marker/g) || []).length >= 4);
check('sidebar expanded lists real task', sideExpanded.includes('Dashboard QA pass'));
check('sidebar expanded lists milestone', sideExpanded.includes('Phase 1 sign-off'));
check('sidebar task due-date chip', sideExpanded.includes('timeline-task-due'));
check('sidebar milestone date chip', sideExpanded.includes('timeline-ms-date'));

// Week + Month views also carry the new rendering
TimelineScreen._viewScale = 'week';
const weekHtml = TimelineScreen._renderWeekView(data.list);
check('week view has task bars when expanded', weekHtml.includes('timeline-task-bar'));
TimelineScreen._viewScale = 'month';
const monthHtml = TimelineScreen._renderMonthView(data.list);
check('month view has milestone markers', monthHtml.includes('timeline-ms-marker'));

// Fallback date sanity: project without dates must span createdAt → milestone due
const p = data.list[0];
check('fallback startDate is real createdAt date', /^\d{4}-\d{2}-\d{2}$/.test(p.startDate));
check('fallback endDate picked from latest milestone due', p.endDate === plus(10));

// ── Team-on-day + completion checks (task-driven timeline) ──
check('task bars carry assignee mini-avatars', dayExpanded.includes('timeline-avatar-mini'));
check('avatar shows member initials (MJ)', dayExpanded.includes('MJ'));
check('due-today task bar highlighted (tk-today)', dayExpanded.includes('tk-today'));
check('project row assigneeIds include task assignees (union)', p.assigneeIds.includes('m3') && p.assigneeIds.includes('m4'));
check('sidebar collapsed shows task-assignee avatar (MJ/HS)', sidebarHtml.includes('timeline-assignee-avatar'));

// Done task: create one completed task and verify proper completion rendering
Store.createTask({ projectId: proj.id, title: 'Old research spike', status: 'done', completed: true, startDate: plus(-3), dueDate: plus(-1), assigneeIds: ['m3'] });
const data2 = TimelineScreen._getFilteredData();
const dayDone = TimelineScreen._renderDayView(data2.list);
const sideDone = TimelineScreen._renderLeftSidebar(data2.list);
check('done task renders with tk-done class', dayDone.includes('tk-done'));
check('done task label prefixed with check', dayDone.includes('✓ Old research spike'));
check('sidebar done task struck through', sideDone.includes('tk-done-name'));

console.log(`\n${fail === 0 ? '✅ All timeline render checks passed' : '❌ ' + fail + ' checks failed'}`);
process.exit(fail === 0 ? 0 : 1);
