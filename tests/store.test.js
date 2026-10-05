/** Store (js/store.js) — data layer: CRUD, invoice engine, notifications, search. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { freshStore } = require('./helpers/browser');

let sb, Store;
beforeEach(() => {
  ({ Store } = sb = freshStore());
  Store.init();
});

const admin = () => Store.getMembers()[0]; // seed: m3 Mohit Jain (Admin)

describe('Store.init / seed', () => {
  test('seeds the admin member and empty collections', () => {
    assert.strictEqual(Store.getMembers().length, 1);
    assert.strictEqual(admin().role, 'Admin');
    // NB: arrays created inside the vm sandbox have a different prototype —
    // assert on shape, not reference equality.
    assert.strictEqual(Store.getProjects().length, 0);
    assert.ok(Array.isArray(Store.getProjects()));
    assert.strictEqual(Store.getTasks().length, 0);
    assert.strictEqual(Store.getSettings().workspaceName, 'Hintonn AI');
  });
});

describe('Projects & progress', () => {
  test('create/get/update/delete project', () => {
    const p = Store.createProject({ name: 'Alpha', priority: 'high' });
    assert.strictEqual(Store.getProject(p.id).name, 'Alpha');
    Store.updateProject(p.id, { status: 'active' });
    assert.strictEqual(Store.getProject(p.id).status, 'active');
    Store.deleteProject(p.id);
    assert.strictEqual(Store.getProject(p.id), undefined);
  });
  test('progress recalculates from non-personal tasks only', () => {
    const p = Store.createProject({ name: 'Beta' });
    Store.createTask({ projectId: p.id, title: 'T1', assigneeIds: ['m3'] });
    Store.createTask({ projectId: p.id, title: 'T2', assigneeIds: ['m3'] });
    Store.createTask({ projectId: p.id, title: 'P1', isPersonal: true });
    let proj = Store.getProject(p.id);
    assert.strictEqual(proj.progress, 0);
    const [t1] = Store.getTasks(p.id).filter(t => t.title === 'T1');
    Store.updateTask(t1.id, { status: 'done', completed: true });
    proj = Store.getProject(p.id);
    assert.strictEqual(proj.progress, 50); // personal task excluded from ratio
  });
  test('deleteProject cascades tasks, issues, milestones', () => {
    const p = Store.createProject({ name: 'Gamma' });
    Store.createTask({ projectId: p.id, title: 'X' });
    Store.createIssue({ projectId: p.id, title: 'Bug' });
    Store.createMilestone({ projectId: p.id, name: 'M1' });
    Store.deleteProject(p.id);
    assert.strictEqual(Store.getTasks(p.id).length, 0);
    assert.strictEqual(Store.getIssues(p.id).length, 0);
    assert.strictEqual(Store.getMilestones(p.id).length, 0);
  });
});

describe('Tasks', () => {
  test('multi-assignee: dedupe and admin exclusion', () => {
    const t = Store.createTask({ title: 'Multi', assigneeIds: ['m3', 'm9', 'm9', 'm2'] });
    // m3 is Admin (seed) → filtered; m9 unknown → filtered; m2 kept... but m2
    // doesn't exist yet → getMember returns null → kept (only Admins excluded)
    assert.ok(!t.assigneeIds.includes('m3'), 'admin member must be excluded');
    assert.strictEqual(t.assigneeIds.filter(id => id === 'm9').length, 1, 'duplicates removed');
    assert.strictEqual(t.assigneeId, t.assigneeIds[0]);
  });
  test('assigneeId fallback populates assigneeIds', () => {
    const t = Store.createTask({ title: 'Solo', assigneeId: 'm3' });
    assert.strictEqual(t.assigneeIds.length, 0, 'admin assignee filtered → empty');
    const t2 = Store.createTask({ title: 'Solo2', assigneeId: 'dev1' });
    assert.strictEqual(t2.assigneeIds.length, 1);
    assert.strictEqual(t2.assigneeIds[0], 'dev1');
  });
  test('no projectId → personal task', () => {
    const t = Store.createTask({ title: 'Personal one' });
    assert.strictEqual(t.isPersonal, true);
  });
  test('subtask lifecycle', () => {
    const t = Store.createTask({ title: 'With subs' });
    const st = Store.addSubtask(t.id, 'Step 1');
    assert.strictEqual(Store.getTask(t.id).subtasks.length, 1);
    Store.toggleSubtask(t.id, st.id, true);
    assert.strictEqual(Store.getTask(t.id).subtasks[0].completed, true);
    Store.deleteSubtask(t.id, st.id);
    assert.strictEqual(Store.getTask(t.id).subtasks.length, 0);
  });
  test('activity text escapes HTML in task titles (XSS guard)', () => {
    Store.createTask({ title: `<script>alert(1)</script>` });
    const act = Store.getActivities()[0];
    assert.ok(!act.html.includes('<script>'), 'raw script tag must not survive');
    assert.ok(act.html.includes('&lt;script&gt;'));
  });
  test('updateTask logs status moves', () => {
    const t = Store.createTask({ title: 'Move me', status: 'todo' });
    Store.updateTask(t.id, { status: 'in-progress' });
    const texts = Store.getActivities().map(a => a.html);
    assert.ok(texts.some(x => x.includes('in progress')), 'status move logged');
  });
});

describe('Members', () => {
  test('create/update/delete member; deleteMember unassigns tasks', () => {
    const m = Store.createMember({ name: 'Dev One', role: 'AI Developer', email: 'd@x.com' });
    assert.strictEqual(Store.getMember(m.id).name, 'Dev One');
    Store.createTask({ title: 'For dev', assigneeId: m.id });
    Store.deleteMember(m.id);
    assert.strictEqual(Store.getMember(m.id), undefined);
    assert.strictEqual(Store.getTasks().filter(t => t.assigneeId === m.id).length, 0);
  });
  test('getMember resolves legacy aliases (preet→m2)', () => {
    Store.createMember({ id: 'm2', name: 'Preet B' });
    assert.strictEqual(Store.getMember('preet').id, 'm2');
    assert.strictEqual(Store.getMember('nope'), undefined, 'find() miss → undefined');
    assert.strictEqual(Store.getMember(''), null, 'empty id → null guard');
  });
  test('getAssignees excludes Admin', () => {
    Store.createMember({ id: 'm2', name: 'Dev' });
    const ids = Store.getAssignees().map(m => m.id);
    assert.ok(!ids.includes('m3') && !ids.includes('m1'));
    assert.ok(ids.includes('m2'));
  });
});

describe('Companies & invoice engine', () => {
  test('ensureCompany finds existing by name (case-insensitive) or creates', () => {
    const c1 = Store.createCompany({ name: 'Acme Pvt Ltd' });
    const idAgain = Store.ensureCompany({ legalName: 'ACME PVT LTD' });
    assert.strictEqual(idAgain, c1.id);
    const idNew = Store.ensureCompany({ legalName: 'Beta LLC' });
    assert.ok(idNew && idNew !== c1.id);
  });
  test('generateInvoice: totals, 40/40/20 schedule, version history', () => {
    const inv = Store.generateInvoice(null, {
      clientDetails: { legalName: 'Zenith Corp' },
      items: [
        { name: 'R1', gross: 100000, discountPct: 10 },
        { name: 'R2', gross: 50000, discountPct: 0 }
      ],
      gstRate: 18, tdsRate: 10
    });
    assert.ok(inv, 'invoice created');
    // taxable 1,40,000 · GST 25,200 · payable 1,65,200 · TDS 14,000
    assert.strictEqual(inv.totals.taxable, 140000);
    assert.strictEqual(inv.totals.gst, 25200);
    assert.strictEqual(inv.totals.payable, 165200);
    assert.strictEqual(inv.totals.netPayable, 151200);
    const sched = inv.paymentSchedule;
    assert.strictEqual(sched.length, 3);
    assert.strictEqual(sched.reduce((s, x) => s + x.amount, 0), 165200, 'schedule sums to payable');
    assert.strictEqual(inv.versionHistory.length, 1);
    assert.strictEqual(inv.versionHistory[0].isCurrent, true);
    assert.strictEqual(inv.status, 'pending-client');
    assert.match(inv.billNumber, /^HIN-PI-ZENITH-\d{4}-001$/);
  });
  test('sequential bill numbers per client', () => {
    const a = Store.generateInvoice(null, { clientDetails: { legalName: 'Acme' }, items: [{ name: 'x', gross: 1000 }] });
    const b = Store.generateInvoice(null, { clientDetails: { legalName: 'Acme' }, items: [{ name: 'x', gross: 1000 }] });
    assert.ok(a.billNumber.endsWith('-001'));
    assert.ok(b.billNumber.endsWith('-002'));
  });
  test('zero-gross invoice rejected', () => {
    assert.strictEqual(Store.generateInvoice(null, { clientDetails: { legalName: 'Z' }, items: [{ name: 'x', gross: 0 }] }), null);
  });
  test('invoice CRUD + delete', () => {
    const inv = Store.createInvoice({ billNumber: 'HIN-PI-T-2026-001', amountDue: '₹1,000' });
    assert.strictEqual(Store.getInvoice(inv.id).billNumber, 'HIN-PI-T-2026-001');
    Store.updateInvoice(inv.id, { status: 'paid' });
    assert.strictEqual(Store.getInvoice(inv.id).status, 'paid');
    Store.deleteInvoice(inv.id);
    assert.strictEqual(Store.getInvoice(inv.id), undefined);
  });
});

describe('Bank guarantees / DLP / retention', () => {
  test('BG CRUD round-trip by id and ref', () => {
    const bg = Store.createBankGuarantee({ ref: 'BG-001', projectName: 'Bridge' });
    assert.strictEqual(Store.getBankGuarantee('BG-001').projectName, 'Bridge');
    Store.updateBankGuarantee('BG-001', { status: 'active' });
    assert.strictEqual(Store.getBankGuarantees()[0].status, 'active');
    Store.deleteBankGuarantee('BG-001');
    assert.strictEqual(Store.getBankGuarantees().length, 0);
  });
  test('DLP + retention CRUD', () => {
    const r1 = Store.createDlpRecord({ projectName: 'P1', openDefects: 2 });
    Store.updateDlpRecord(r1.id, { openDefects: 0 });
    assert.strictEqual(Store.getDlpRecord(r1.id).openDefects, 0);
    Store.deleteDlpRecord(r1.id);
    const r2 = Store.createRetentionRecord({ projectName: 'P2', retentionAmount: 100 });
    assert.strictEqual(Store.getRetentionRecords().length, 1);
    Store.deleteRetentionRecord(r2.id);
    assert.strictEqual(Store.getRetentionRecords().length, 0);
  });
});

describe('Notifications', () => {
  test('add/markRead/markAllRead + 100 cap', () => {
    Store.addNotification({ type: 'system', text: 'hello' });
    Store.addNotification({ type: 'system', text: 'world' });
    const [n1] = Store.getNotifications();
    Store.markRead(n1.id);
    assert.strictEqual(Store.getUnreadCount(), 1);
    Store.markAllRead();
    assert.strictEqual(Store.getUnreadCount(), 0);
    for (let i = 0; i < 120; i++) Store.addNotification({ type: 'system', text: 'x' + i });
    assert.ok(Store.getNotifications().length <= 100, 'capped at 100');
  });
  test('developer visibility: targeted + own-task matches; others excluded', () => {
    Store.createTask({ title: 'Preet special task', assigneeIds: ['m2'] });
    Store.addNotification({ type: 'task', text: 'You have a new assignment', targetMemberIds: ['m2'] });
    Store.addNotification({ type: 'task', text: 'Something about Preet special task updated' });
    Store.addNotification({ type: 'task', text: 'Other thing assigned to mohit' });
    Store.addNotification({ type: 'user-approval', text: 'admin only please' });

    sb.Auth = { getCurrentUser: () => ({ id: 'preet', memberId: 'm2', name: 'Preet Bhavsar', role: 'AI Developer' }) };
    const visible = Store.getNotifications().map(n => n.text);
    assert.ok(visible.includes('You have a new assignment'), 'targeted notification visible');
    assert.ok(visible.some(t => t.includes('Preet special task')), 'own-task match visible');
    assert.ok(!visible.some(t => t.includes('assigned to mohit')), 'other dev assignment hidden');
    assert.ok(!visible.includes('admin only please'), 'admin-only type hidden from devs');
  });
  test('admin sees everything', () => {
    Store.addNotification({ type: 'user-approval', text: 'approval ping' });
    sb.Auth = { getCurrentUser: () => ({ id: 'mohit', name: 'Mohit Jain', role: 'Admin' }) };
    assert.ok(Store.getNotifications().some(n => n.text === 'approval ping'));
  });
});

describe('Search engine', () => {
  test('empty query returns empty shape', () => {
    const r = Store.search('');
    assert.deepStrictEqual(Object.keys(r).sort(), ['commercial', 'issues', 'milestones', 'pages', 'projects', 'tasks']);
  });
  test('direct match on project name', () => {
    Store.createProject({ name: 'Quantum Portal' });
    const r = Store.search('quantum');
    assert.strictEqual(r.projects.length, 1);
  });
  test('synonym expansion: "invoice" surfaces billing page + invoices', () => {
    Store.createInvoice({ billNumber: 'HIN-PI-Q-2026-001', projectName: 'Whatever' });
    const r = Store.search('invoice');
    assert.ok(r.pages.some(p => p.route === 'billing'), 'billing page matched via synonym');
    assert.strictEqual(r.commercial.invoices.length, 1);
  });
  test('task matches by assignee name', () => {
    Store.createMember({ id: 'm2', name: 'Preet Bhavsar' });
    Store.createTask({ title: 'Fix login', assigneeIds: ['m2'] });
    const r = Store.search('preet');
    assert.ok(r.tasks.length >= 1);
  });
});

describe('Store._esc & _sanitizeForFirestore', () => {
  test('_esc escapes markup', () => {
    assert.strictEqual(Store._esc('<b>'), '&lt;b&gt;');
    assert.strictEqual(Store._esc(null), '');
  });
  test('sanitize strips undefined, converts Dates', () => {
    const out = Store._sanitizeForFirestore({ a: 1, b: undefined, d: new Date('2026-01-01T00:00:00Z'), arr: [1, undefined, 2] });
    assert.ok(!('b' in out));
    assert.strictEqual(out.d, '2026-01-01T00:00:00.000Z');
    assert.strictEqual(out.arr.length, 2);
    assert.strictEqual(out.arr[0], 1);
    assert.strictEqual(out.arr[1], 2);
  });
});

describe('Stats', () => {
  test('counts projects/tasks/issues/milestones', () => {
    const p = Store.createProject({ name: 'S' });
    Store.createTask({ projectId: p.id, title: 'a' });
    Store.createTask({ projectId: p.id, title: 'b', status: 'done', completed: true });
    Store.createIssue({ projectId: p.id, title: 'i' });
    Store.createMilestone({ projectId: p.id, name: 'm', status: 'completed' });
    const s = Store.getStats();
    assert.strictEqual(s.totalProjects, 1);
    assert.strictEqual(s.totalTasks, 2);
    assert.strictEqual(s.completedTasks, 1);
    assert.strictEqual(s.openIssues, 1);
    assert.strictEqual(s.completedMilestones, 1);
  });
});
