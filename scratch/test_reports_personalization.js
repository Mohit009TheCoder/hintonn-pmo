// Verification Test Suite for Reports & Analytics Personalization
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('RUNNING REPORTS & ANALYTICS ROLE-BASED PERSONALIZATION TEST SUITE');
console.log('================================================================\n');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let pageContentHtml = '';

global.document = {
  body: { style: {}, classList: { add(){}, remove(){}, contains(){ return false; } } },
  getElementById(id) {
    if (id === 'page-content') {
      return {
        get innerHTML() { return pageContentHtml; },
        set innerHTML(val) { pageContentHtml = val; },
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
    return {
      innerHTML: '',
      value: '',
      style: {},
      classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
      querySelector(){ return null; },
      focus(){},
      scrollIntoView(){},
      scrollTo(){}
    };
  },
  querySelector(sel) { return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} }; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#reports' },
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

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

Store.init();
Auth.init();

// Helper to extract text from simple HTML
function extractText(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log('--- 1. Testing AI Developer View: Preet Bhavsar ---');
Auth.login('Preet', 'preet@123');
const preetReports = ReportsScreen.render();

// Check KPI Values for Preet
// Preet has 7 tasks: t1, t4, t6, t10, t13, t14, t15
// Projects: p1, p2, p4 (3 projects)
// Completed: 3 tasks (43% completion rate)
// Overdue: 0 tasks
if (!preetReports.includes('<div class="kpi-value">3</div>')) {
  throw new Error('Preet reports missing Total Projects KPI value of 3!');
}
if (!preetReports.includes('<div class="kpi-value">7</div>')) {
  throw new Error('Preet reports missing Total Tasks KPI value of 7!');
}
if (!preetReports.includes('43% completion rate')) {
  throw new Error('Preet reports missing 43% completion rate!');
}
console.log('✔ Preet KPI Cards verified: 3 Projects, 7 Tasks, 43% Completion Rate');

// Check Workload panel for Preet: "My Workload & Performance"
if (!preetReports.includes('My Workload & Performance')) {
  throw new Error('Preet reports missing "My Workload & Performance" header!');
}
if (preetReports.includes('Team Workload</h3>')) {
  throw new Error('Preet reports should NOT show "Team Workload" header!');
}
// Ensure other developer names are NOT shown in Preet's workload panel
if (preetReports.includes('Mohit Jain') || preetReports.includes('Hirvi Sanghavi') || preetReports.includes('Ayush Desai')) {
  throw new Error('Preet reports leaked other team members in developer view!');
}
console.log('✔ Preet workload panel strictly isolated to "My Workload & Performance"');

// Check that Marketing Campaign Q4 (p3) and Website Redesign (p5) are NOT in Preet's projects table
if (preetReports.includes('Marketing Campaign Q4') || preetReports.includes('Website Redesign')) {
  throw new Error('Preet reports table contains unassigned projects (p3 or p5)!');
}
if (!preetReports.includes('Hintonn AI Platform') || !preetReports.includes('Client Onboarding Portal') || !preetReports.includes('Research: LLM Fine-tuning')) {
  throw new Error('Preet reports table missing assigned projects (p1, p2, or p4)!');
}
console.log('✔ Preet assigned projects strictly filtered to p1, p2, p4');

// Check Project Status Breakdown for Preet (3 active, no planning or completed)
if (!preetReports.includes('<span class="badge badge-active" style="min-width:90px">Active</span>')) {
  throw new Error('Preet reports missing Active status in Project Status breakdown!');
}
if (preetReports.includes('<span class="badge badge-planning"') || preetReports.includes('<span class="badge badge-completed"')) {
  throw new Error('Preet reports leaked unassigned project statuses (planning/completed)!');
}
console.log('✔ Preet project status distribution strictly calculated from assigned projects');

// Check Task Priority Breakdown for Preet (4 high, 3 medium)
const preetHighMatch = preetReports.match(/badge-high[\s\S]*?>(\d+)<\/span>/);
const preetMedMatch = preetReports.match(/badge-medium[\s\S]*?>(\d+)<\/span>/);
if (!preetHighMatch || preetHighMatch[1] !== '4') {
  throw new Error(`Preet High Priority task count mismatch: expected 4, got ${preetHighMatch ? preetHighMatch[1] : 'none'}`);
}
if (!preetMedMatch || preetMedMatch[1] !== '3') {
  throw new Error(`Preet Medium Priority task count mismatch: expected 3, got ${preetMedMatch ? preetMedMatch[1] : 'none'}`);
}
console.log('✔ Preet Task Priority distribution strictly verified (4 High, 3 Medium)');

// Check Task Status Breakdown for Preet (3 done, 2 in-progress, 1 review, 1 todo)
const preetDoneMatch = preetReports.match(/badge-done[\s\S]*?>(\d+)<\/span>/);
const preetInProgressMatch = preetReports.match(/badge-in-progress[\s\S]*?>(\d+)<\/span>/);
const preetReviewMatch = preetReports.match(/badge-review[\s\S]*?>(\d+)<\/span>/);
const preetTodoMatch = preetReports.match(/badge-todo[\s\S]*?>(\d+)<\/span>/);
if (!preetDoneMatch || preetDoneMatch[1] !== '3') {
  throw new Error(`Preet Done task count mismatch: expected 3, got ${preetDoneMatch ? preetDoneMatch[1] : 'none'}`);
}
if (!preetInProgressMatch || preetInProgressMatch[1] !== '2') {
  throw new Error(`Preet In-Progress task count mismatch: expected 2, got ${preetInProgressMatch ? preetInProgressMatch[1] : 'none'}`);
}
if (!preetReviewMatch || preetReviewMatch[1] !== '1') {
  throw new Error(`Preet Review task count mismatch: expected 1, got ${preetReviewMatch ? preetReviewMatch[1] : 'none'}`);
}
if (!preetTodoMatch || preetTodoMatch[1] !== '1') {
  throw new Error(`Preet Todo task count mismatch: expected 1, got ${preetTodoMatch ? preetTodoMatch[1] : 'none'}`);
}
console.log('✔ Preet Task Status distribution strictly verified (3 Done, 2 In Progress, 1 Review, 1 Todo)');


console.log('\n--- 2. Testing AI Developer View: Mohit Jain ---');
Auth.login('Mohit', 'mohit@123');
const mohitReports = ReportsScreen.render();

// Mohit has 6 tasks: t3, t5, t7, t9, t11, t17
// Projects: p1, p2, p3, p5 (4 projects - p4 excluded)
// Completed: 2 tasks (33% completion rate)
if (!mohitReports.includes('<div class="kpi-value">4</div>')) {
  throw new Error('Mohit reports missing Total Projects KPI value of 4!');
}
if (!mohitReports.includes('<div class="kpi-value">6</div>')) {
  throw new Error('Mohit reports missing Total Tasks KPI value of 6!');
}
if (!mohitReports.includes('33% completion rate')) {
  throw new Error('Mohit reports missing 33% completion rate!');
}
if (!mohitReports.includes('My Workload & Performance')) {
  throw new Error('Mohit reports missing "My Workload & Performance" header!');
}
if (mohitReports.includes('Preet Bhavsar') || mohitReports.includes('Hirvi Sanghavi') || mohitReports.includes('Ayush Desai')) {
  throw new Error('Mohit reports leaked other team members!');
}
// Ensure Research: LLM Fine-tuning (p4) is NOT in Mohit's projects table
if (mohitReports.includes('Research: LLM Fine-tuning')) {
  throw new Error('Mohit reports contains unassigned project p4!');
}
console.log('✔ Mohit KPI Cards & privacy verified: 4 Projects, 6 Tasks, 33% Completion Rate');


console.log('\n--- 3. Testing AI Developer View: Hirvi Sanghavi ---');
Auth.login('Hirvi', 'hirvi@123');
const hirviReports = ReportsScreen.render();

// Hirvi has 4 tasks: t2, t8, t12, t16
// Projects: p1, p2, p3, p5 (4 projects - p4 excluded)
// Completed: 3 tasks (75% completion rate)
if (!hirviReports.includes('<div class="kpi-value">4</div>')) {
  throw new Error('Hirvi reports missing Total Projects KPI value of 4!');
}
if (!hirviReports.includes('<div class="kpi-value">4</div>')) {
  throw new Error('Hirvi reports missing Total Tasks KPI value of 4!');
}
if (!hirviReports.includes('75% completion rate')) {
  throw new Error('Hirvi reports missing 75% completion rate!');
}
if (!hirviReports.includes('My Workload & Performance')) {
  throw new Error('Hirvi reports missing "My Workload & Performance" header!');
}
if (hirviReports.includes('Preet Bhavsar') || hirviReports.includes('Mohit Jain') || hirviReports.includes('Ayush Desai')) {
  throw new Error('Hirvi reports leaked other team members!');
}
if (hirviReports.includes('Research: LLM Fine-tuning')) {
  throw new Error('Hirvi reports contains unassigned project p4!');
}
console.log('✔ Hirvi KPI Cards & privacy verified: 4 Projects, 4 Tasks, 75% Completion Rate');


console.log('\n--- 4. Testing Admin View: Ayush Desai ---');
Auth.login('Ayush', 'ayush@123');
const adminReports = ReportsScreen.render();

// Ayush Desai has full portfolio analytics:
// 5 projects, 17 tasks, 8 completed (47% completion rate)
if (!adminReports.includes('<div class="kpi-value">5</div>')) {
  throw new Error('Admin reports missing Total Projects KPI value of 5!');
}
if (!adminReports.includes('<div class="kpi-value">17</div>')) {
  throw new Error('Admin reports missing Total Tasks KPI value of 17!');
}
if (!adminReports.includes('47% completion rate')) {
  throw new Error('Admin reports missing 47% completion rate!');
}

// Check Team Workload panel for Admin
if (!adminReports.includes('Team Workload</h3>')) {
  throw new Error('Admin reports missing "Team Workload" panel header!');
}
if (adminReports.includes('My Workload & Performance')) {
  throw new Error('Admin reports should NOT show "My Workload & Performance"!');
}

// Verify Team Workload contains Preet Bhavsar, Mohit Jain, Hirvi Sanghavi
if (!adminReports.includes('Preet Bhavsar') || !adminReports.includes('Mohit Jain') || !adminReports.includes('Hirvi Sanghavi')) {
  throw new Error('Admin Team Workload panel missing developer members!');
}

// Verify Ayush Desai is NOT listed as a developer task performer in Team Workload
// (Ayush is Admin and excluded from developer assignees)
const workloadMatch = adminReports.match(/Team Workload[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (workloadMatch && workloadMatch[0].includes('Ayush Desai')) {
  throw new Error('Admin Team Workload panel erroneously contains Ayush Desai as developer!');
}
console.log('✔ Admin Reports verified: 5 Projects, 17 Tasks, 47% Completion Rate, Full Team Workload with all 3 AI Developers');

// Verify all 5 projects are in Admin project details table
['Hintonn AI Platform', 'Client Onboarding Portal', 'Marketing Campaign Q4', 'Research: LLM Fine-tuning', 'Website Redesign'].forEach(pName => {
  if (!adminReports.includes(pName)) {
    throw new Error(`Admin reports table missing project ${pName}!`);
  }
});
console.log('✔ Admin project details table contains all 5 projects');

console.log('\n================================================================');
console.log('ALL REPORTS & ANALYTICS PERSONALIZATION TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
