// Comprehensive Integration & Unit Test Suite for Calendar & Search Redesign
const fs = require('fs');
const path = require('path');

// Simple DOM environment simulation
const elementsMap = new Map();

class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this._id = id;
    if (id) elementsMap.set(id, this);
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(' ') : []),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === true) this.classList._classes.add(c);
        else if (force === false) this.classList._classes.delete(c);
        else if (this.classList._classes.has(c)) this.classList._classes.delete(c);
        else this.classList._classes.add(c);
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.innerHTML = '';
    this.value = '';
    this.textContent = '';
    this.children = [];
    this.style = {};
    this.attributes = {};
  }
  get id() { return this._id; }
  set id(val) {
    this._id = val;
    if (val) elementsMap.set(val, this);
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return this.id === id ? this : (elementsMap.get(id) || null);
    }
    return null;
  }
  appendChild(el) {
    this.children.push(el);
    if (el.id) elementsMap.set(el.id, el);
  }
  remove() {
    if (this._id) elementsMap.delete(this._id);
  }
  focus() { this._focused = true; }
  blur() { this._focused = false; }
}

const mockDoc = {
  elements: elementsMap,
  getElementById(id) {
    if (!this.elements.has(id)) {
      this.elements.set(id, new MockElement('div', id));
    }
    return this.elements.get(id);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      for (const el of this.elements.values()) {
        if (el.classList.contains(cls)) return el;
      }
      const el = new MockElement('div', '', cls);
      this.elements.set(cls, el);
      return el;
    }
    return new MockElement('div');
  },
  querySelectorAll(sel) {
    return [];
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  body: new MockElement('body'),
  addEventListener() {}
};

global.document = mockDoc;
global.window = {
  location: { hash: '#dashboard' },
  addEventListener() {},
  innerWidth: 1200
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};

const vm = require('vm');

// Load code files into global context
function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/store.js');
loadScript('js/auth.js');
loadScript('js/components/icons.js');
loadScript('js/components/modal.js');
loadScript('js/components/toast.js');
loadScript('js/components/command.js');
loadScript('js/screens/calendar.js');
loadScript('js/screens/tasks.js');
loadScript('js/screens/issues.js');
loadScript('js/screens/projects.js');
loadScript('js/components/sidebar.js');
loadScript('js/components/topbar.js');
loadScript('js/screens/timeline.js');
loadScript('js/screens/billing.js');
loadScript('js/screens/dashboard.js');
loadScript('js/screens/milestones.js');
loadScript('js/screens/ai-assistant.js');
loadScript('js/screens/team.js');
loadScript('js/screens/project-detail.js');
loadScript('js/screens/login.js');
loadScript('js/app.js');

console.log('--- Initializing Store and App ---');
Store.init();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ─── TEST 1: Calendar View ───
console.log('\n[TEST 1: Calendar View & Readability Redesign]');
const calHtml = CalendarScreen.render();
assert(calHtml.includes('calendar-grid'), 'Calendar renders grid container');
assert(calHtml.includes('today'), 'Calendar has today cell highlight');
assert(calHtml.includes('today-indicator-tag') || calHtml.includes('calendar-day-badge'), 'Calendar renders today indicator badge');
assert(calHtml.includes('calendar-event task') || calHtml.includes('calendar-event milestone'), 'Calendar renders color-coded event cards');
assert(calHtml.includes('Legend:'), 'Calendar renders legend with status color codes');

// Test Day modal
let openedDayModal = false;
CalendarScreen.openDayModal('2026-09-23');
const modalEl = document.getElementById('modal-' + (Modal._stack[Modal._stack.length - 1] || '').replace('modal-', ''));
assert(Modal._stack.length > 0, 'openDayModal successfully opens modal');
Modal.closeAll();

// ─── TEST 2: Tasks Screen Search & Persistent DOM ───
console.log('\n[TEST 2: Tasks Screen Universal Search & Persistent DOM]');
const tasksHtml = TasksScreen.render();
assert(tasksHtml.includes('task-search-input'), 'Tasks screen renders search input with unique ID');
assert(tasksHtml.includes('search-input-wrap'), 'Tasks screen search input is wrapped in .search-input-wrap');
assert(tasksHtml.includes('task-search-clear'), 'Tasks screen has search clear button');

// Setup mock container for Tasks
document.getElementById('tasks-container').innerHTML = TasksScreen._renderContent(TasksScreen._getFilteredTasks());

// Search by title substring
TasksScreen.handleSearch('fine-tuning');
const filteredTasks1 = TasksScreen._getFilteredTasks();
assert(filteredTasks1.length > 0 && filteredTasks1.some(t => t.title.toLowerCase().includes('fine-tuning')), 'Search matches task title substring');

// Search by project name
TasksScreen.handleSearch('Hintonn AI Platform');
const filteredTasks2 = TasksScreen._getFilteredTasks();
assert(filteredTasks2.length > 0, 'Search matches task by associated project name');

// Search by assignee name
TasksScreen.handleSearch('Preet');
const filteredTasks3 = TasksScreen._getFilteredTasks();
assert(filteredTasks3.length > 0, 'Search matches task by assignee name (Preet)');

// Test clearSearch
TasksScreen.clearSearch();
assert(TasksScreen._filter.search === '', 'clearSearch resets search filter to empty string');
assert(TasksScreen._getFilteredTasks().length === Store.getTasks().length, 'Full task list restored after clearSearch');

// Test empty state
TasksScreen.handleSearch('nonexistentquery123');
const emptyTasksHtml = TasksScreen._renderContent(TasksScreen._getFilteredTasks());
assert(emptyTasksHtml.includes('No matching results found for "nonexistentquery123"'), 'Styled empty state rendered for unmatched search query');
assert(emptyTasksHtml.includes('Clear Search'), 'Empty state includes Clear Search button');
TasksScreen.clearSearch();

// ─── TEST 3: Issues Screen Search & Persistent DOM ───
console.log('\n[TEST 3: Issues Screen Universal Search & Persistent DOM]');
const issuesHtml = IssuesScreen.render();
assert(issuesHtml.includes('issue-search-input'), 'Issues screen renders search input with unique ID');
assert(issuesHtml.includes('issue-search-clear'), 'Issues screen has search clear button');

// Setup mock container for Issues
document.getElementById('issues-container').innerHTML = IssuesScreen._renderContent(IssuesScreen._getFilteredIssues());

// Search by issue title / severity
IssuesScreen.handleSearch('high');
const filteredIssues1 = IssuesScreen._getFilteredIssues();
assert(filteredIssues1.length > 0 && filteredIssues1.some(i => i.priority === 'high' || i.title.toLowerCase().includes('high')), 'Issues search matches severity/priority');

// Search empty state
IssuesScreen.handleSearch('nomatch999');
const emptyIssuesHtml = IssuesScreen._renderContent(IssuesScreen._getFilteredIssues());
assert(emptyIssuesHtml.includes('No matching results found for "nomatch999"'), 'Issues empty state displays query message');
IssuesScreen.clearSearch();
assert(IssuesScreen._filter.search === '', 'Issues clearSearch resets filter');

// ─── TEST 4: Projects Screen Search & Persistent DOM ───
console.log('\n[TEST 4: Projects Screen Universal Search & Persistent DOM]');
const projectsHtml = ProjectsScreen.render();
assert(projectsHtml.includes('project-search-input'), 'Projects screen renders search input with unique ID');
assert(projectsHtml.includes('project-search-clear'), 'Projects screen has search clear button');

// Setup mock container for Projects
document.getElementById('projects-list').innerHTML = ProjectsScreen._renderContent(ProjectsScreen._getFilteredProjects());

// Search by category / type
ProjectsScreen.handleSearch('AI/ML');
const filteredProjects1 = ProjectsScreen._getFilteredProjects();
assert(filteredProjects1.length > 0 && filteredProjects1.some(p => p.type === 'AI/ML'), 'Projects search matches type/category');

// Search empty state
ProjectsScreen.handleSearch('unknownproj404');
const emptyProjHtml = ProjectsScreen._renderContent(ProjectsScreen._getFilteredProjects());
assert(emptyProjHtml.includes('No matching results found for "unknownproj404"'), 'Projects empty state displays query message');
ProjectsScreen.clearSearch();

// ─── TEST 5: Global Search & Command Palette ───
console.log('\n[TEST 5: Global Search (Store.search & Command Palette)]');
const searchResults = Store.search('research');
assert(searchResults.projects.length > 0, 'Store.search finds projects matching query');
assert(searchResults.tasks.length > 0, 'Store.search finds tasks matching query');

// Command render results
Command.renderResults('fine');
const commandResultsEl = document.getElementById('command-results');
assert(commandResultsEl.innerHTML.length > 0, 'Command palette renders matching results');

Command.renderResults('nomatchatallxyz');
assert(commandResultsEl.innerHTML.includes('No matching results found for "nomatchatallxyz"'), 'Command palette renders styled empty state');

// ─── TEST 6: Executive Multi-Scale Gantt Chart Timeline (#timeline) ───
console.log('\n[TEST 6: Executive Multi-Scale Gantt Chart Timeline (#timeline)]');

// 1. Admin Authentication & Screen Rendering
Auth.login('Ayush', 'ayush@123'); // Admin login
assert(Auth.isAdmin(), 'Ayush is authenticated as Admin');

TimelineScreen.setScale('month');
const timelineHtml = TimelineScreen.render();
assert(timelineHtml.includes('id="timeline"'), 'Timeline screen mounts with container id="timeline"');
assert(timelineHtml.includes('timeline-scale-tabs'), 'Timeline toolbar contains Time Scale Selector [ Day | Week | Month ]');
assert(timelineHtml.includes('timeline-macro-card'), 'Timeline renders Executive Gantt Chart container');
assert(timelineHtml.includes('timeline-macro-sidebar'), 'Timeline includes fixed 300px left sidebar');
assert(timelineHtml.includes('timeline-macro-canvas'), 'Timeline includes right viewport canvas');
assert(timelineHtml.includes('timeline-macro-today-line'), 'Timeline canvas includes vertical Today marker line');
assert(timelineHtml.includes('timeline-search-input'), 'Timeline has instant search input');

// 2. Multi-Scale Time Views (Day, Week, Month)
// Day View
TimelineScreen.setScale('day');
assert(TimelineScreen._viewScale === 'day', 'Timeline switched to Day view');
const dayGridHtml = TimelineScreen._renderGanttGrid(TimelineScreen._projects);
assert(dayGridHtml.includes('timeline-day-view') && dayGridHtml.includes('timeline-day-col-header'), 'Day view renders 30-day granular daily grid');
assert(dayGridHtml.includes('today-badge') && dayGridHtml.includes('23'), 'Day view highlights Today (Day 23)');

// Week View
TimelineScreen.setScale('week');
assert(TimelineScreen._viewScale === 'week', 'Timeline switched to Week view');
const weekGridHtml = TimelineScreen._renderGanttGrid(TimelineScreen._projects);
assert(weekGridHtml.includes('timeline-week-view') && weekGridHtml.includes('timeline-week-col-header'), 'Week view renders 12-week roadmap');
assert(weekGridHtml.includes('Week 4') && weekGridHtml.includes('Sep 22 - Sep 28'), 'Week view identifies Week 4 as current week');

// Month View (Default)
TimelineScreen.setScale('month');
assert(TimelineScreen._viewScale === 'month', 'Timeline switched to Month view (default)');
const monthGridHtml = TimelineScreen._renderGanttGrid(TimelineScreen._projects);
assert(monthGridHtml.includes('timeline-month-view') && monthGridHtml.includes('timeline-month-grid-header'), 'Month view renders 6-month horizon (Sep 2026 - Feb 2027)');
assert(monthGridHtml.includes('SEP 2026') && monthGridHtml.includes('FEB 2027'), 'Month view columns cover Sep 2026 through Feb 2027');

// 3. Left Sidebar (300px) & Commercial EPC Package Data
const firstProject = TimelineScreen._projects[0];
assert(firstProject.packageNo === 'PKG-01' && firstProject.name === 'Main Substation EPC', 'Package 1 data matches EPC Substation');
assert(firstProject.phases.length === 3, 'Package 1 has 3 breakdown workstream phases');
assert(firstProject.milestones.length === 2, 'Package 1 has 2 critical milestone deliverables');

const sidebarHtml = TimelineScreen._renderLeftSidebar(TimelineScreen._projects);
assert(sidebarHtml.includes('PKG-01') && sidebarHtml.includes('Main Substation EPC'), 'Sidebar renders package badge and name');
assert(sidebarHtml.includes('timeline-assignees-stack'), 'Sidebar renders assignee avatar stack');

// 4. Clean Gantt Bars, Inner Progress Fills, and Zero Overlay Icons
const canvasHtml = TimelineScreen._renderCanvasRows(TimelineScreen._projects);
assert(canvasHtml.includes('timeline-bar-slim') && canvasHtml.includes('timeline-bar-fill'), 'Canvas renders color-coded Gantt bars with inner progress fill');
assert(!canvasHtml.includes('timeline-milestone-marker'), 'Canvas does not render milestone vertical marker overlay clutter');
assert(!canvasHtml.includes('timeline-milestone-pulse'), 'Canvas does not render glowing red diamond icons on bars');

// Verify clean legend (only 3 core phase categories)
assert(timelineHtml.includes('Execution / Construction') && timelineHtml.includes('Handover & DLP') && timelineHtml.includes('Planning / Design'), 'Legend includes 3 core phase categories');
assert(!timelineHtml.includes('Critical Milestone'), 'Legend does not contain Critical Milestone');

// 5. Stage Filtering (all, execution, dlp, planning)
TimelineScreen.setStage('execution');
assert(TimelineScreen._activeStage === 'execution', 'setStage("execution") sets filter to execution');
const execData = TimelineScreen._getFilteredData();
assert(execData.list.length > 0 && execData.list.every(p => p.stage === 'execution'), 'All filtered packages have stage=execution');

TimelineScreen.setStage('dlp');
const dlpData = TimelineScreen._getFilteredData();
assert(dlpData.list.length > 0 && dlpData.list.every(p => p.stage === 'dlp'), 'All filtered packages have stage=dlp');

TimelineScreen.setStage('planning');
const planData = TimelineScreen._getFilteredData();
assert(planData.list.length > 0 && planData.list.every(p => p.stage === 'planning'), 'All filtered packages have stage=planning');

TimelineScreen.setStage('all');
assert(TimelineScreen._getFilteredData().list.length === TimelineScreen._projects.length, 'setStage("all") restores all 5 commercial packages');

// 6. Instant Search & Clear Search
TimelineScreen.setSearch('Substation');
const searchData1 = TimelineScreen._getFilteredData();
assert(searchData1.list.length > 0 && searchData1.list.some(p => p.name.includes('Substation')), 'Timeline search matches package name');

TimelineScreen.setSearch('PKG-04');
const searchData2 = TimelineScreen._getFilteredData();
assert(searchData2.list.length === 1 && searchData2.list[0].packageNo === 'PKG-04', 'Timeline search matches package number PKG-04');

TimelineScreen.setSearch('Preet');
const searchData3 = TimelineScreen._getFilteredData();
assert(searchData3.list.length > 0, 'Timeline search matches package assignee (Preet)');

TimelineScreen.clearSearch();
assert(TimelineScreen._search === '', 'Timeline clearSearch resets search filter');
assert(TimelineScreen._getFilteredData().list.length === TimelineScreen._projects.length, 'Full package list restored after clearSearch');

// 7. Coordinate Helpers
const todayPct = TimelineScreen._getTodayPositionPercent();
assert(todayPct > 0 && todayPct < 100, `_getTodayPositionPercent calculated valid percent: ${todayPct.toFixed(2)}%`);

const datePct = TimelineScreen._dateToPercent('2026-09-28');
assert(datePct > 0 && datePct < 100, `_dateToPercent calculated valid percent: ${datePct.toFixed(2)}%`);

const rangePct = TimelineScreen._rangeToPercent('2026-07-01', '2026-12-31');
assert(rangePct.visible && rangePct.width > 0, 'Range percent calculated visible bar with positive width');

// 8. Role-based Route Protection
Auth.login('Preet', 'preet@123'); // Developer login
const restrictedTimelineHtml = TimelineScreen.render();
assert(restrictedTimelineHtml.includes('Access Restricted'), 'Non-admin user (AI Developer) receives Access Restricted message for Timeline');

// 9. CSS Verification for Gantt Chart High-Readability Polish
const compCssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'components.css'), 'utf8');
assert(compCssContent.includes('min-height: 56px') && compCssContent.includes('padding: 14px 16px'), 'Timeline rows have 56px min-height with 14px 16px padding');
assert(compCssContent.includes('height: 12px') && compCssContent.includes('border-radius: 6px'), 'Timeline bars have 12px height with 6px border-radius');
assert(compCssContent.includes('#2563EB') && compCssContent.includes('#7C3AED') && compCssContent.includes('#475569'), 'High-contrast palette applied for Exec (#2563EB), Handover/DLP (#7C3AED), and Planning (#475569)');
assert(compCssContent.includes('border-right: 1px solid #F3F4F6'), 'Subtle column grid dividers (#F3F4F6) configured');
assert(compCssContent.includes('border-left: 1px dashed #2563EB'), 'Vertical dashed line Today marker (1px dashed #2563EB) configured');

// ─── TEST 7: Universal Fuzzy Search Engine & Navigation Mapping ───
console.log('\n[TEST 7: Universal Fuzzy Search Engine & Navigation Mapping]');

// 1. Milestones navigation & entity stemming
const resMilestoneSingular = Store.search('milestone');
assert(resMilestoneSingular.pages.some(p => p.route === 'milestones'), 'Search "milestone" (singular) maps to #milestones page');
assert(resMilestoneSingular.milestones.length > 0, 'Search "milestone" returns database milestones');

const resMilestonePlural = Store.search('milestones');
assert(resMilestonePlural.pages.some(p => p.route === 'milestones'), 'Search "milestones" (plural) maps to #milestones page');
assert(resMilestonePlural.milestones.length > 0, 'Search "milestones" returns database milestones');

// 2. Issues & Bug synonyms
const resIssue = Store.search('issue');
assert(resIssue.pages.some(p => p.route === 'issues'), 'Search "issue" maps to #issues page');
assert(resIssue.issues.length > 0, 'Search "issue" returns database issues');

const resIssues = Store.search('issues');
assert(resIssues.pages.some(p => p.route === 'issues'), 'Search "issues" maps to #issues page');

const resBug = Store.search('bug');
assert(resBug.pages.some(p => p.route === 'issues'), 'Search "bug" synonym maps to #issues page');

// 3. Projects, Tasks, and Todo synonyms
const resProj = Store.search('projects');
assert(resProj.pages.some(p => p.route === 'projects'), 'Search "projects" maps to #projects page');

const resTask = Store.search('task');
assert(resTask.pages.some(p => p.route === 'tasks'), 'Search "task" maps to #tasks page');

const resTodo = Store.search('todo');
assert(resTodo.pages.some(p => p.route === 'tasks'), 'Search "todo" maps to #tasks page');

// 4. Calendar & Schedule
const resCal = Store.search('calendar');
assert(resCal.pages.some(p => p.route === 'calendar'), 'Search "calendar" maps to #calendar page');

const resSched = Store.search('schedule');
assert(resSched.pages.some(p => p.route === 'calendar'), 'Search "schedule" maps to #calendar page');

// 5. Team, Members, and Developers
const resTeam = Store.search('team');
assert(resTeam.pages.some(p => p.route === 'team'), 'Search "team" maps to #team page');

const resMembers = Store.search('members');
assert(resMembers.pages.some(p => p.route === 'team'), 'Search "members" maps to #team page');

// 6. Reports & Analytics
const resReports = Store.search('reports');
assert(resReports.pages.some(p => p.route === 'reports'), 'Search "reports" maps to #reports page');

const resAnalytics = Store.search('analytics');
assert(resAnalytics.pages.some(p => p.route === 'reports'), 'Search "analytics" maps to #reports page');

// 7. Commercial Views (BG, Retention, DLP, Billing)
const resBG = Store.search('bg');
assert(resBG.pages.some(p => p.route === 'bg'), 'Search "bg" maps to #bg page');
assert(resBG.commercial.bGs.length > 0, 'Search "bg" returns commercial Bank Guarantee records');

const resGuarantee = Store.search('bank guarantee');
assert(resGuarantee.pages.some(p => p.route === 'bg'), 'Search "bank guarantee" maps to #bg page');

const resRetention = Store.search('retention');
assert(resRetention.pages.some(p => p.route === 'retention'), 'Search "retention" maps to #retention page');

const resDLP = Store.search('dlp');
assert(resDLP.pages.some(p => p.route === 'dlp'), 'Search "dlp" maps to #dlp page');

const resWarranty = Store.search('warranty');
assert(resWarranty.pages.some(p => p.route === 'dlp'), 'Search "warranty" maps to #dlp page');

const resBilling = Store.search('billing');
assert(resBilling.pages.some(p => p.route === 'billing'), 'Search "billing" maps to #billing page');

const resInvoice = Store.search('invoice');
assert(resInvoice.pages.some(p => p.route === 'billing'), 'Search "invoice" maps to #billing page');
assert(resInvoice.commercial.invoices.length > 0, 'Search "invoice" returns commercial invoice records');

// ─── TEST 8: Milestones Screen Universal Search & Persistent DOM ───
console.log('\n[TEST 8: Milestones Screen Universal Search & Persistent DOM]');
Auth.login('Ayush', 'ayush@123'); // Admin login
const milestonesHtml = MilestonesScreen.render();
assert(milestonesHtml.includes('milestone-search-input'), 'Milestones screen renders search input with unique ID');
assert(milestonesHtml.includes('milestone-search-clear'), 'Milestones screen has search clear button');

// Setup mock container for Milestones
document.getElementById('milestones-container').innerHTML = MilestonesScreen._renderContent(MilestonesScreen._getFilteredMilestones());

// Search by milestone name
MilestonesScreen.handleSearch('Alpha');
const filteredMilestones1 = MilestonesScreen._getFilteredMilestones();
assert(filteredMilestones1.length > 0 && filteredMilestones1.some(m => m.name.includes('Alpha')), 'Milestones search matches milestone name (Alpha)');

// Search empty state
MilestonesScreen.handleSearch('nomatchmilestone999');
const emptyMilestonesHtml = MilestonesScreen._renderContent(MilestonesScreen._getFilteredMilestones());
assert(emptyMilestonesHtml.includes('No matching results found for "nomatchmilestone999"'), 'Milestones empty state displays query message');
MilestonesScreen.clearSearch();
assert(MilestonesScreen._filter.search === '', 'Milestones clearSearch resets filter');
assert(MilestonesScreen._getFilteredMilestones().length === Store.getMilestones().length, 'Full milestone list restored after clearSearch');

// ─── TEST 9: AI Assistant Dynamic User Greeting & Role Scoping ───
console.log('\n[TEST 9: AI Assistant Dynamic User Greeting & Role Scoping]');

// 1. Admin Login (Ayush Desai)
Auth.login('Ayush', 'ayush@123');
assert(Auth.getCurrentUser().name === 'Ayush Desai', 'Ayush Desai is active user');
AIAssistantScreen._messages = null; // Reset to test fresh greeting
const aiAdminHtml = AIAssistantScreen.render();
assert(aiAdminHtml.includes('Hello Ayush!'), 'AI Assistant greeting addresses active Admin user as "Hello Ayush!"');
assert(!aiAdminHtml.includes('Hello Preet!'), 'AI Assistant does not contain hardcoded "Hello Preet!" when Ayush is logged in');
assert(aiAdminHtml.includes('Workspace Health Overview'), 'AI Assistant renders Health Overview card for Admin');
const adminUserMsgHtml = AIAssistantScreen._renderMessage({ sender: 'user', time: '10:00 AM', text: 'Hello Copilot' });
assert(adminUserMsgHtml.includes('AD') && adminUserMsgHtml.includes('Ayush Desai'), 'AI Assistant user bubble contains AD initials and Ayush Desai name');

// 2. Developer Login (Preet Bhavsar)
Auth.login('Preet', 'preet@123');
assert(Auth.getCurrentUser().name === 'Preet Bhavsar', 'Preet Bhavsar is active user');
AIAssistantScreen._messages = null; // Reset to test fresh greeting
const aiDevHtml = AIAssistantScreen.render();
assert(aiDevHtml.includes('Hello Preet!'), 'AI Assistant greeting dynamically addresses active Developer user as "Hello Preet!"');
assert(!aiDevHtml.includes('Hello Ayush!'), 'AI Assistant does not greet Ayush when Preet is logged in');
const devUserMsgHtml = AIAssistantScreen._renderMessage({ sender: 'user', time: '10:00 AM', text: 'Hello Copilot' });
assert(devUserMsgHtml.includes('PB') && devUserMsgHtml.includes('Preet Bhavsar'), 'AI Assistant user bubble contains PB initials and Preet Bhavsar name');

// 3. Developer Login (Mohit Jain)
Auth.login('Mohit', 'mohit@123');
assert(Auth.getCurrentUser().name === 'Mohit Jain', 'Mohit Jain is active user');
AIAssistantScreen._messages = null; // Reset to test fresh greeting
const aiMohitHtml = AIAssistantScreen.render();
assert(aiMohitHtml.includes('Hello Mohit!'), 'AI Assistant greeting dynamically addresses Mohit Jain as "Hello Mohit!"');
const mohitUserMsgHtml = AIAssistantScreen._renderMessage({ sender: 'user', time: '10:00 AM', text: 'Hello Copilot' });
assert(mohitUserMsgHtml.includes('MJ') && mohitUserMsgHtml.includes('Mohit Jain'), 'AI Assistant user bubble contains MJ initials and Mohit Jain name');

// ─── TEST 10: Sidebar Header 3-Dots Removal & Layout Alignment ───
console.log('\n[TEST 10: Sidebar Header 3-Dots Removal & Layout Alignment]');

// 1. Verify index.html template DOM
const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(!indexHtmlContent.includes('sidebar-menu-btn'), 'index.html does not contain sidebar-menu-btn in sidebar header');
assert(!indexHtmlContent.includes('circle cx="12" cy="12" r="1"'), 'index.html does not contain 3-dots svg icon in sidebar header');

// 2. Verify Sidebar.render() output
const brandHeaderEl = document.querySelector('.sidebar-header') || document.getElementById('top-brand-area');
brandHeaderEl.innerHTML = '';
Sidebar.render();
const renderedBrandHeader = brandHeaderEl.innerHTML;
assert(!renderedBrandHeader.includes('sidebar-menu-btn'), 'Sidebar.render() does not inject 3-dots menu button');
assert(!renderedBrandHeader.includes('moreHorizontal'), 'Sidebar.render() does not contain moreHorizontal icon');
assert(renderedBrandHeader.includes('brand-logo-img'), 'Sidebar header cleanly renders Hintonn AI brand logo asset');

// 3. Verify CSS layout rules
const layoutCssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'layout.css'), 'utf8');
assert(layoutCssContent.includes('justify-content: flex-start'), 'layout.css re-aligns sidebar-header with justify-content: flex-start');
assert(layoutCssContent.includes('.sidebar-header .dots-btn') && layoutCssContent.includes('display: none !important'), 'layout.css enforces display: none !important on any sidebar header dots buttons');

// ─── TEST 11: Portfolio Health Score Segmented Bar Component (#dashboard) ───
console.log('\n[TEST 11: Portfolio Health Score Segmented Bar Component (#dashboard)]');

// 1. Authenticate as Admin
Auth.login('Ayush', 'ayush@123');
assert(Auth.isAdmin(), 'Ayush is authenticated as Admin');

// 2. Render Admin Dashboard
const adminDashHtml = DashboardScreen.render();
assert(adminDashHtml.includes('portfolio-health-card'), 'Dashboard renders .portfolio-health-card at the top of Executive Overview');
assert(adminDashHtml.includes('portfolio-health-header'), 'Dashboard renders .portfolio-health-header flex container');
assert(adminDashHtml.includes('Portfolio Health Score:'), 'Dashboard displays "Portfolio Health Score:" title');
assert(adminDashHtml.includes('88.0% Optimal'), 'Dashboard dynamically computes and displays health score with status label');
assert(adminDashHtml.includes('3 On-Track'), 'Dashboard displays On-Track count');
assert(adminDashHtml.includes('1 At-Risk'), 'Dashboard displays At-Risk count');
assert(adminDashHtml.includes('1 In DLP'), 'Dashboard displays In DLP count');

// 3. Segmented Bar & Custom Colors (Brand Blue #2563EB, Slate #475569, Purple #7C3AED)
assert(adminDashHtml.includes('portfolio-health-bar'), 'Dashboard renders .portfolio-health-bar container with 10px height');
assert(adminDashHtml.includes('portfolio-health-segment on-track') && adminDashHtml.includes('#2563EB'), 'On-Track segment styled with Vibrant Brand Blue (#2563EB)');
assert(adminDashHtml.includes('portfolio-health-segment at-risk') && adminDashHtml.includes('#475569'), 'At-Risk segment styled with Solid Dark Slate (#475569)');
assert(adminDashHtml.includes('portfolio-health-segment dlp') && adminDashHtml.includes('#7C3AED'), 'In DLP segment styled with Deep Violet Purple (#7C3AED)');

// 4. Dynamic Width Assertions
assert(adminDashHtml.includes('width:60.0%') || adminDashHtml.includes('width:60%'), 'On-Track segment has proportional 60% width');
assert(adminDashHtml.includes('width:20.0%') || adminDashHtml.includes('width:20%'), 'At-Risk segment has proportional 20% width');

// 5. CSS Rules Verification
const componentsCssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'components.css'), 'utf8');
assert(componentsCssContent.includes('.portfolio-health-card'), 'components.css defines .portfolio-health-card');
assert(componentsCssContent.includes('.portfolio-health-bar'), 'components.css defines .portfolio-health-bar with 10px height and gap: 3px');
assert(componentsCssContent.includes('.portfolio-health-segment.on-track') && componentsCssContent.includes('#2563EB'), 'components.css defines on-track segment blue #2563EB');
assert(componentsCssContent.includes('.portfolio-health-segment.at-risk') && componentsCssContent.includes('#475569'), 'components.css defines at-risk segment slate #475569');
assert(componentsCssContent.includes('.portfolio-health-segment.dlp') && componentsCssContent.includes('#7C3AED'), 'components.css defines dlp segment purple #7C3AED');

// ─── TEST 12: Bill Version Control & Multi-Bill Company Grouping (#billing) ───
console.log('\n[TEST 12: Bill Version Control & Multi-Bill Company Grouping (#billing)]');

// 1. Initial State & Screen Render
BillingScreen._invoices = null; // Reset dataset
BillingScreen._filter = 'all';
BillingScreen._companyFilter = 'all';
BillingScreen._viewMode = 'company';
BillingScreen._search = '';

const billingHtml = BillingScreen.render();
assert(billingHtml.includes('id="billing"'), 'Billing screen renders with container id="billing"');
assert(billingHtml.includes('Bill Version Control Active'), 'Billing screen displays Bill Version Control Active badge');
assert(billingHtml.includes('billing-company-groups-container'), 'Billing screen renders company grouped accordion container');
assert(billingHtml.includes('Apex Power & Energy Corp'), 'Billing screen renders Apex Power company card');
assert(billingHtml.includes('Vertex Grid Utilities Ltd'), 'Billing screen renders Vertex Grid company card');
assert(billingHtml.includes('Northern Powertech Systems'), 'Billing screen renders Northern Powertech company card');
assert(billingHtml.includes('Solaris Infra Concessions'), 'Billing screen renders Solaris Infra company card');
assert(billingHtml.includes('Metro Rail Transmission Authority'), 'Billing screen renders Metro Rail company card');

// 2. Multi-Bill Company Grouping & Accordion Metrics
const companies = BillingScreen._getCompanies();
assert(companies.length === 5, '5 client companies configured in commercial PMO ledger');
assert(billingHtml.includes('3 Bills Issued'), 'Apex Power displays "3 Bills Issued" count');
assert(billingHtml.includes('$1,920,000') && billingHtml.includes('$720,000'), 'Apex Power displays Total Billed ($1.92M) and Pending Due ($720K)');
assert(billingHtml.includes('Partially Paid') && billingHtml.includes('Pending Release') && billingHtml.includes('Paid'), 'All payment status indicators rendered');

// 3. Version Tracking Badges & Multi-Version Invoices
const invoices = BillingScreen._getInvoices();
const inv104 = invoices.find(i => i.id === 'INV-2026-104');
assert(inv104 && inv104.version === 'v2.0', 'Invoice INV-2026-104 is tracked as v2.0 (Re-negotiated)');
assert(inv104.versionHistory.length === 3, 'Invoice INV-2026-104 has 3 complete revision records (v1.0 -> v1.1 -> v2.0)');
assert(inv104.isRevised === true, 'Invoice INV-2026-104 is flagged as revised');

const inv103 = invoices.find(i => i.id === 'INV-2026-103');
assert(inv103 && inv103.version === 'v1.1', 'Invoice INV-2026-103 is tracked as v1.1 (Minor Adjustment)');

const inv092 = invoices.find(i => i.id === 'INV-2026-092');
assert(inv092 && inv092.version === 'v1.0', 'Invoice INV-2026-092 is tracked as v1.0 (Original Baseline)');

assert(billingHtml.includes('version-pill-v2') && billingHtml.includes('v2.0'), 'Rendered HTML contains v2.0 version pill badge');
assert(billingHtml.includes('version-pill-v1-1') && billingHtml.includes('v1.1'), 'Rendered HTML contains v1.1 version pill badge');
assert(billingHtml.includes('version-pill-v1') && billingHtml.includes('v1.0'), 'Rendered HTML contains v1.0 version pill badge');

// 4. Version History Drawer / Modal
Modal.closeAll();
BillingScreen.openVersionHistory('INV-2026-104');
assert(Modal._stack.length > 0, 'openVersionHistory opens version history modal');
const lastModalId = Modal._stack[Modal._stack.length - 1];
const modalDiv = document.getElementById('modal-' + lastModalId.replace('modal-', ''));
const modalBodyHtml = modalDiv.innerHTML;

assert(modalBodyHtml.includes('v1.0') && modalBodyHtml.includes('v1.1') && modalBodyHtml.includes('v2.0'), 'Version history contains chronological versions v1.0, v1.1, and v2.0');
assert(modalBodyHtml.includes('CURRENT ACTIVE BASELINE'), 'Version history highlights CURRENT ACTIVE BASELINE');
assert(modalBodyHtml.includes('ARCHIVED HISTORICAL REVISION'), 'Version history tags ARCHIVED HISTORICAL REVISION');
assert(modalBodyHtml.includes('Change Reason:') && modalBodyHtml.includes('Modified Fields:'), 'Version history displays Change Reason and Modified Fields diff tags');
assert(modalBodyHtml.includes('Side-by-Side Diff'), 'Version history includes Side-by-Side Diff action button');
Modal.closeAll();

// 5. Side-by-Side Version Diff Comparison
BillingScreen.compareVersions('INV-2026-104');
assert(Modal._stack.length > 0, 'compareVersions opens Side-by-Side Version Comparison modal');
const compModalDiv = document.getElementById('modal-' + Modal._stack[Modal._stack.length - 1].replace('modal-', ''));
const compModalHtml = compModalDiv.innerHTML;
assert(compModalHtml.includes('Baseline') && compModalHtml.includes('v1.0'), 'Comparison modal contains Baseline v1.0 card');
assert(compModalHtml.includes('Active') && compModalHtml.includes('v2.0'), 'Comparison modal contains Active v2.0 card');
assert(compModalHtml.includes('Base Due:') && compModalHtml.includes('Tax (GST):') && compModalHtml.includes('Retention:'), 'Comparison modal details Base, Tax, and Retention breakdown');
Modal.closeAll();

// 6. Create Revised Version Flow (Revise Bill Action)
BillingScreen.openReviseModal('INV-2026-104');
assert(Modal._stack.length > 0, 'openReviseModal opens revision form modal');
// Mock input values for saving revision
const mockVersionSelect = new MockElement('select', 'revise-version-select');
mockVersionSelect.value = 'v2.1';
mockDoc.elements.set('revise-version-select', mockVersionSelect);

const mockBaseAmount = new MockElement('input', 'revise-base-amount');
mockBaseAmount.value = '430,000';
mockDoc.elements.set('revise-base-amount', mockBaseAmount);

const mockTaxAmount = new MockElement('input', 'revise-tax-amount');
mockTaxAmount.value = '77,400';
mockDoc.elements.set('revise-tax-amount', mockTaxAmount);

const mockRetAmount = new MockElement('input', 'revise-retention-amount');
mockRetAmount.value = '21,500';
mockDoc.elements.set('revise-retention-amount', mockRetAmount);

const mockReason = new MockElement('textarea', 'revise-reason');
mockReason.value = 'Phase 3 commissioning test reconciliation.';
mockDoc.elements.set('revise-reason', mockReason);

BillingScreen._saveRevision('INV-2026-104');
const updatedInv104 = BillingScreen._getInvoices().find(i => i.id === 'INV-2026-104');
assert(updatedInv104.version === 'v2.1', 'Invoice version successfully incremented to v2.1 in memory');
assert(updatedInv104.amountDue === '$430,000', 'Invoice base amount updated to $430,000');
assert(updatedInv104.versionHistory.length === 4, 'New revision appended to versionHistory audit log (total 4 revisions)');
assert(updatedInv104.versionHistory[3].version === 'v2.1' && updatedInv104.versionHistory[3].isCurrent === true, 'Latest revision marked as current active');
assert(updatedInv104.versionHistory[2].isCurrent === false, 'Previous revision archived as isCurrent=false');

// 7. View Mode Switching & Search / Filtering
// Switch to Flat Table View
BillingScreen.setViewMode('table');
assert(BillingScreen._viewMode === 'table', 'View mode switched to table');
const tableHtml = BillingScreen._renderTable(BillingScreen._getFilteredInvoices());
assert(tableHtml.includes('commercial-table') && tableHtml.includes('Invoice #'), 'Table view renders full commercial invoicing table');

// Switch back to Company Accordion View
BillingScreen.setViewMode('company');
assert(BillingScreen._viewMode === 'company', 'View mode switched back to company');

// Filter by Company
BillingScreen.setCompanyFilter('c2');
assert(BillingScreen._companyFilter === 'c2', 'Company filter set to Vertex Grid (c2)');
const comp2Invoices = BillingScreen._getFilteredInvoices();
assert(comp2Invoices.every(i => i.companyId === 'c2'), 'Filtered invoices strictly contain companyId=c2');

// Filter by Status & Revisions
BillingScreen.setCompanyFilter('all');
BillingScreen.setFilter('revised');
const revisedInvoices = BillingScreen._getFilteredInvoices();
assert(revisedInvoices.every(i => i.isRevised), 'Filtered invoices strictly contain revised bills (isRevised=true)');

BillingScreen.setFilter('paid');
const paidInvoices = BillingScreen._getFilteredInvoices();
assert(paidInvoices.every(i => i.status === 'paid'), 'Filtered invoices strictly contain paid bills (status=paid)');

BillingScreen.setFilter('all');

// Real-time Search
BillingScreen.onSearch('Solaris');
const searchSolaris = BillingScreen._getFilteredInvoices();
assert(searchSolaris.length > 0 && searchSolaris.every(i => i.companyName.includes('Solaris')), 'Search "Solaris" filters to Solaris Infra records');

BillingScreen.onSearch('v2.1');
const searchVer = BillingScreen._getFilteredInvoices();
assert(searchVer.length === 1 && searchVer[0].id === 'INV-2026-104', 'Search version tag "v2.1" matches revised invoice');

BillingScreen.clearSearch();
assert(BillingScreen._search === '', 'Billing clearSearch resets search term');
assert(BillingScreen._getFilteredInvoices().length === BillingScreen._getInvoices().length, 'Full invoice list restored');

// ─── TEST 13: Team +1 More Expansion, Project Issues Card Interactivity, Invalid Date Fix, and Header Notifications Dropdown ───
console.log('\n[TEST 13: Team +1 More Expansion, Project Issues Card Interactivity, Invalid Date Fix, and Notifications]');

// 1. Team Member Card "+1 More" Task Expansion Fix (#team)
TeamScreen._expandedMembers = {};
const initialTeamHtml = TeamScreen.render();
assert(initialTeamHtml.includes('team-grid'), 'Team screen renders team member grid');
assert(initialTeamHtml.includes('team-task-more-btn') || initialTeamHtml.includes('+'), 'Team card renders "+N more" task expansion button when tasks exceed limit');

// Toggle expand member m2 (Preet)
TeamScreen.toggleMemberTasks('m2');
assert(TeamScreen._expandedMembers['m2'] === true, 'toggleMemberTasks toggles m2 state to expanded (true)');
const expandedTeamHtml = TeamScreen.render();
assert(expandedTeamHtml.includes('Show less'), 'Expanded team card transforms button state to "Show less"');

// Toggle collapse member m2
TeamScreen.toggleMemberTasks('m2');
assert(TeamScreen._expandedMembers['m2'] === false, 'toggleMemberTasks collapses m2 state back to false');
const collapsedTeamHtml = TeamScreen.render();
assert(collapsedTeamHtml.includes('+') && !collapsedTeamHtml.includes('Show less'), 'Collapsed team card restores "+N more" button state');

// 2. Project Issues Card Interactivity & Metric Card Routes (#projects)
Auth.login('Ayush', 'ayush@123');
const p1DetailHtml = ProjectDetailScreen.render('p1');
assert(p1DetailHtml.includes('onclick="ProjectDetailScreen.switchTab(\'p1\', \'tasks\')"'), 'Progress and Tasks KPI cards have click handler targeting tasks tab');
assert(p1DetailHtml.includes('onclick="ProjectDetailScreen.switchTab(\'p1\', \'issues\', \'open\')"'), 'Issues KPI card and open badge have click handler targeting issues tab with open filter');
assert(p1DetailHtml.includes('onclick="ProjectDetailScreen.switchTab(\'p1\', \'milestones\')"'), 'Timeline KPI card has click handler targeting milestones tab');

// Switch to Tasks Tab
ProjectDetailScreen.switchTab('p1', 'tasks');
assert(ProjectDetailScreen._tab === 'tasks', 'switchTab switches active tab to "tasks"');

// Switch to Milestones Tab
ProjectDetailScreen.switchTab('p1', 'milestones');
assert(ProjectDetailScreen._tab === 'milestones', 'switchTab switches active tab to "milestones"');

// Switch to Issues Tab with "open" filter
ProjectDetailScreen.switchTab('p1', 'issues', 'open');
assert(ProjectDetailScreen._tab === 'issues', 'switchTab switches active tab to "issues"');
assert(ProjectDetailScreen._issueFilter === 'open', 'switchTab activates "open" issue filter');
const issuesTabOpenHtml = ProjectDetailScreen._renderIssues('p1', Store.getIssues('p1'));
assert(issuesTabOpenHtml.includes('Open ('), 'Issues tab renders Open filter button');
assert(issuesTabOpenHtml.includes('All Issues ('), 'Issues tab renders All Issues filter button');
assert(issuesTabOpenHtml.includes('Resolved ('), 'Issues tab renders Resolved filter button');

// 3. Date Formatting Sanity & "Invalid Date" Prevention
const isoFormatted = Utils.formatDate('2026-09-15T14:00:00Z');
assert(isoFormatted !== 'Invalid Date' && isoFormatted.includes('Sep 15, 2026'), 'Utils.formatDate correctly parses ISO string without returning "Invalid Date"');

const standardDate = Utils.formatDate('2026-10-15');
assert(standardDate !== 'Invalid Date' && standardDate.includes('Oct 15, 2026'), 'Utils.formatDate correctly parses YYYY-MM-DD date');

const nullDate = Utils.formatDate(null);
assert(nullDate === '—', 'Utils.formatDate gracefully returns "—" for null');

const undefinedDate = Utils.formatDate(undefined);
assert(undefinedDate === '—', 'Utils.formatDate gracefully returns "—" for undefined');

const oldTimeAgo = Utils.timeAgo('2026-07-01T00:00:00Z');
assert(oldTimeAgo !== 'Invalid Date' && !oldTimeAgo.includes('Invalid Date'), 'Utils.timeAgo for past dates renders formatted date without "Invalid Date"');

const renderedIssuesHtml = IssuesScreen.render();
assert(!renderedIssuesHtml.includes('Invalid Date'), 'IssuesScreen render contains zero instances of "Invalid Date"');

const renderedProjDetailIssuesHtml = ProjectDetailScreen.render('p1');
assert(!renderedProjDetailIssuesHtml.includes('Invalid Date'), 'ProjectDetailScreen render contains zero instances of "Invalid Date"');

// 4. Notifications Dropdown Open / Close Toggle & Unread Sync
const notifPanelEl = new MockElement('div', 'notification-panel', 'notification-panel hidden');
const notifListEl = new MockElement('div', 'notification-list');
const notifDotEl = new MockElement('div', 'notif-dot', 'notif-dot hidden');
const notifPanelCountEl = new MockElement('span', 'notif-panel-count');
elementsMap.set('notification-panel', notifPanelEl);
elementsMap.set('notification-list', notifListEl);
elementsMap.set('notif-dot', notifDotEl);
elementsMap.set('notif-panel-count', notifPanelCountEl);

// Initial Toggle Open
assert(notifPanelEl.classList.contains('hidden'), 'Notification panel is initially hidden');
App.toggleNotifications();
assert(!notifPanelEl.classList.contains('hidden'), 'App.toggleNotifications() opens notification panel (hidden class removed)');
assert(notifListEl.innerHTML.length > 0, 'Notification list is populated with notification items');

// Toggle Close
App.toggleNotifications();
assert(notifPanelEl.classList.contains('hidden'), 'App.toggleNotifications() toggles panel closed (hidden class added)');

// Open and Close via closeNotifications() (ESC key / click outside)
App.toggleNotifications();
assert(!notifPanelEl.classList.contains('hidden'), 'Panel opened again');
App.closeNotifications();
assert(notifPanelEl.classList.contains('hidden'), 'App.closeNotifications() cleanly closes panel');

// Mark All Read
Store.markAllRead();
App.updateNotifDot();
assert(Store.getUnreadCount() === 0, 'Store unread count reset to 0');
assert(notifDotEl.classList.contains('hidden'), 'Notification unread dot indicator is hidden when all read');

// ─── TEST 14: Full Authentication Suite & Google OAuth Account Integration ───
console.log('\n[TEST 14: Full Authentication Suite & Google OAuth Integration]');

// 1. ROUTING & MULTI-VIEW RENDERING
const signInHtml = LoginScreen.render('signin');
assert(signInHtml.includes('Sign in to your PMO workspace'), 'Sign In view renders title correctly');
assert(signInHtml.includes('Continue with Google'), 'Sign In view renders Google OAuth button');
assert(signInHtml.includes('id="google-login-btn"'), 'Google OAuth button has explicit id="google-login-btn"');
assert(signInHtml.includes('placeholder="Enter your Login ID or Email"'), 'Login ID or Email has neutral placeholder "Enter your Login ID or Email"');
assert(!signInHtml.includes('e.g. Ayush'), 'Sign In view contains zero hardcoded name references');
assert(!signInHtml.includes('ayush@hintonn.com'), 'Sign In view contains zero hardcoded email examples in placeholder');
assert(signInHtml.includes('login-id') && signInHtml.includes('login-password'), 'Sign In view contains login ID and password fields');
assert(signInHtml.includes('Forgot password?'), 'Sign In view contains Forgot Password link');
assert(signInHtml.includes('Sign Up'), 'Sign In view contains Sign Up link');

// Verify DOM element order follows standard authentication hierarchy
const formIndex = signInHtml.indexOf('id="login-form"');
const dividerIndex = signInHtml.indexOf('OR');
const googleBtnIndex = signInHtml.indexOf('id="google-login-btn"');
const signupLinkIndex = signInHtml.indexOf('href="#signup"');
assert(formIndex !== -1 && dividerIndex !== -1 && googleBtnIndex !== -1 && signupLinkIndex !== -1, 'All key elements present in Sign In view');
assert(formIndex < dividerIndex && dividerIndex < googleBtnIndex && googleBtnIndex < signupLinkIndex, 'Sign In layout follows standard hierarchy: Form -> OR divider -> Google Button -> Sign Up Link');

const signUpHtml = LoginScreen.render('signup');
assert(signUpHtml.includes('Create an Account'), 'Sign Up view renders title correctly');
assert(signUpHtml.includes('placeholder="Enter your full name"'), 'Sign Up name field has neutral placeholder "Enter your full name"');
assert(!signUpHtml.includes('e.g. Maya Patel'), 'Sign Up view contains zero hardcoded name references');
assert(signUpHtml.includes('placeholder="Enter your email address"'), 'Sign Up email field has neutral placeholder "Enter your email address"');
assert(signUpHtml.includes('signup-name') && signUpHtml.includes('signup-email'), 'Sign Up view contains name and email fields');
assert(signUpHtml.includes('signup-password') && signUpHtml.includes('signup-confirm-password'), 'Sign Up view contains password and confirm password fields');

const forgotHtml = LoginScreen.render('forgot');
assert(forgotHtml.includes('Reset your password'), 'Forgot Password view renders title correctly');
assert(forgotHtml.includes('forgot-email'), 'Forgot Password view contains registered email field');
assert(forgotHtml.includes('placeholder="Enter your registered email address"'), 'Forgot Password email has neutral placeholder');
assert(forgotHtml.includes('Send Reset Link'), 'Forgot Password view contains Send Reset Link button');

const resetHtml = LoginScreen.render('reset');
assert(resetHtml.includes('Set new password'), 'Reset Password view renders title correctly');
assert(resetHtml.includes('reset-password') && resetHtml.includes('reset-confirm-password'), 'Reset Password view contains new password fields');
assert(resetHtml.includes('Update Password'), 'Reset Password view contains Update Password button');

// 2. GOOGLE OAUTH INTEGRATION & DIRECT CLICK INTERACTION
assert(typeof LoginScreen.openGoogleModal === 'undefined', 'Custom modal function openGoogleModal is removed from codebase');
assert(typeof LoginScreen.closeGoogleModal === 'undefined', 'Custom modal function closeGoogleModal is removed from codebase');
assert(signInHtml.includes('onclick="LoginScreen.handleGoogleLogin()"'), 'Google button directly calls handleGoogleLogin()');

// Direct Google Login execution
Auth.logout();
assert(!Auth.isAuthenticated(), 'User is logged out before Google click test');
LoginScreen.handleGoogleLogin();
assert(Auth.isAuthenticated(), 'handleGoogleLogin() directly authenticates user into session');
assert(Auth.getCurrentUser().name === 'Ayush Desai', 'handleGoogleLogin() sets active user session context');
assert(window.location.hash === '#dashboard', 'handleGoogleLogin() immediately redirects to #dashboard');

assert(Array.isArray(Auth.googleAccounts) && Auth.googleAccounts.length === 4, 'Auth provides 4 pre-configured Google enterprise profiles');

// Admin mapping
const adminGoogleRes = Auth.googleLogin('ayushhintonn@gmail.com');
assert(adminGoogleRes.success === true, 'Google login succeeds for ayushhintonn@gmail.com');
assert(adminGoogleRes.user.name === 'Ayush Desai' && adminGoogleRes.user.role === 'Admin', 'ayushhintonn@gmail.com maps to Ayush Desai with Admin role');

const adminCompanyGoogleRes = Auth.googleLogin('ayush@hintonn.com');
assert(adminCompanyGoogleRes.success === true && adminCompanyGoogleRes.user.name === 'Ayush Desai', 'ayush@hintonn.com also maps to Ayush Desai');

// AI Developer 1 mapping
const dev1GoogleRes = Auth.googleLogin('preethintonn@gmail.com');
assert(dev1GoogleRes.success === true, 'Google login succeeds for preethintonn@gmail.com');
assert(dev1GoogleRes.user.name === 'Preet Bhavsar' && dev1GoogleRes.user.role === 'AI Developer', 'preethintonn@gmail.com maps to Preet Bhavsar with AI Developer role');

// AI Developer 2 mapping
const dev2GoogleRes = Auth.googleLogin('mohithintonn@gmail.com');
assert(dev2GoogleRes.success === true, 'Google login succeeds for mohithintonn@gmail.com');
assert(dev2GoogleRes.user.name === 'Mohit Jain' && dev2GoogleRes.user.role === 'AI Developer', 'mohithintonn@gmail.com maps to Mohit Jain with AI Developer role');

// AI Developer 3 mapping
const dev3GoogleRes = Auth.googleLogin('hirvihintonn@gmail.com');
assert(dev3GoogleRes.success === true, 'Google login succeeds for hirvihintonn@gmail.com');
assert(dev3GoogleRes.user.name === 'Hirvi Sanghavi' && dev3GoogleRes.user.role === 'AI Developer', 'hirvihintonn@gmail.com maps to Hirvi Sanghavi with AI Developer role');

// Unknown Google account creates AI Developer profile
const newGoogleRes = Auth.googleLogin('alex.j@gmail.com');
assert(newGoogleRes.success === true, 'Unknown google email auto-provisions AI Developer account');
assert(newGoogleRes.user.role === 'AI Developer', 'New google user role is AI Developer');

// 3. PASSWORD VISIBILITY TOGGLE
const testPassInput = new MockElement('input', 'test-pass-field');
testPassInput.type = 'password';
const testEyeBtn = new MockElement('button', 'test-eye-btn');
elementsMap.set('test-pass-field', testPassInput);

LoginScreen.togglePasswordVisibility('test-pass-field', testEyeBtn);
assert(testPassInput.type === 'text', 'togglePasswordVisibility changes input type from "password" to "text"');

LoginScreen.togglePasswordVisibility('test-pass-field', testEyeBtn);
assert(testPassInput.type === 'password', 'togglePasswordVisibility toggles back from "text" to "password"');

// 4. SIGN UP FLOW & VALIDATION
const signupNameEl = new MockElement('input', 'signup-name');
const signupEmailEl = new MockElement('input', 'signup-email');
const signupPassEl = new MockElement('input', 'signup-password');
const signupConfirmEl = new MockElement('input', 'signup-confirm-password');
const authErrorAlertEl = new MockElement('div', 'auth-error-alert');
const authErrorTextEl = new MockElement('span', 'auth-error-text');

elementsMap.set('signup-name', signupNameEl);
elementsMap.set('signup-email', signupEmailEl);
elementsMap.set('signup-password', signupPassEl);
elementsMap.set('signup-confirm-password', signupConfirmEl);
elementsMap.set('auth-error-alert', authErrorAlertEl);
elementsMap.set('auth-error-text', authErrorTextEl);

// Empty name validation
signupNameEl.value = '';
LoginScreen.handleSignUp();
assert(LoginScreen._errorMessage === 'Please enter your full name.', 'Validation catches missing name on sign up');

// Invalid email format validation
signupNameEl.value = 'Rohan Verma';
signupEmailEl.value = 'rohaninvalidemail';
LoginScreen.handleSignUp();
assert(LoginScreen._errorMessage === 'Please enter a valid email address.', 'Validation catches invalid email syntax');

// Weak password validation (missing special character / numbers / short)
signupEmailEl.value = 'rohan@hintonn.com';
signupPassEl.value = 'weakpass';
signupConfirmEl.value = 'weakpass';
LoginScreen.handleSignUp();
assert(LoginScreen._errorMessage.includes('Password must be at least 8 characters long'), 'Validation enforces 8+ chars, number, and special character');

// Password mismatch validation
signupPassEl.value = 'Secret@123';
signupConfirmEl.value = 'Secret@456';
LoginScreen.handleSignUp();
assert(LoginScreen._errorMessage === 'Passwords do not match.', 'Validation detects mismatched password confirmation');

// Successful Sign Up
signupPassEl.value = 'Secret@123';
signupConfirmEl.value = 'Secret@123';
LoginScreen.handleSignUp();
assert(LoginScreen._errorMessage === '', 'Error cleared on valid sign up');
assert(Auth.isAuthenticated() && Auth.getCurrentUser().name === 'Rohan Verma', 'New user registered and authenticated into workspace');
assert(Auth.getCurrentUser().role === 'AI Developer', 'New user registered with AI Developer role');

// 5. FORGOT & RESET PASSWORD FLOW
const forgotEmailEl = new MockElement('input', 'forgot-email');
elementsMap.set('forgot-email', forgotEmailEl);

// Invalid email on forgot password
forgotEmailEl.value = 'notanemail';
LoginScreen.handleForgotPassword();
assert(LoginScreen._errorMessage === 'Please enter a valid email address.', 'Forgot password validates email format');

// Valid email on forgot password
forgotEmailEl.value = 'rohan@hintonn.com';
LoginScreen.handleForgotPassword();
assert(LoginScreen._resetEmail === 'rohan@hintonn.com', 'Forgot password records reset email');
assert(LoginScreen._currentView === 'reset', 'Forgot password transitions view to "reset"');

// Reset password with valid password
const resetPassEl = new MockElement('input', 'reset-password');
const resetConfirmPassEl = new MockElement('input', 'reset-confirm-password');
elementsMap.set('reset-password', resetPassEl);
elementsMap.set('reset-confirm-password', resetConfirmPassEl);

resetPassEl.value = 'NewPass@999';
resetConfirmPassEl.value = 'NewPass@999';
LoginScreen.handleResetPassword();
assert(LoginScreen._currentView === 'signin', 'Successful password reset redirects back to sign in view');

// Verify login with new password
const newLoginRes = Auth.login('rohan@hintonn.com', 'NewPass@999');
assert(newLoginRes.success === true && newLoginRes.user.name === 'Rohan Verma', 'User successfully signs in with updated password');

console.log(`\n================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`================================`);

if (failed > 0) process.exit(1);





