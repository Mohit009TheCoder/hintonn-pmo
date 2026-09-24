// Comprehensive Test Suite for Calendar Personalization, Timeline Admin Restriction, and End-to-End Data Isolation
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('RUNNING CALENDAR, TIMELINE RESTRICTION & FULL DATA ISOLATION SUITE');
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
let sidebarNavHtml = '';
let userDropdownHtml = '';
let commandResultsHtml = '';
let commandOverlayClasses = new Set(['hidden']);
let bodyClasses = new Set();

global.document = {
  body: {
    style: {},
    classList: {
      add(c) { bodyClasses.add(c); },
      remove(c) { bodyClasses.delete(c); },
      contains(c) { return bodyClasses.has(c); }
    }
  },
  getElementById(id) {
    if (id === 'page-content') {
      return {
        get innerHTML() { return pageContentHtml; },
        set innerHTML(val) { pageContentHtml = val; },
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
    if (id === 'sidebar-nav') {
      return {
        get innerHTML() { return sidebarNavHtml; },
        set innerHTML(val) { sidebarNavHtml = val; },
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
    if (id === 'command-results') {
      return {
        get innerHTML() { return commandResultsHtml; },
        set innerHTML(val) { commandResultsHtml = val; },
        style: {},
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
    if (id === 'command-overlay') {
      return {
        classList: {
          add(c) { commandOverlayClasses.add(c); },
          remove(c) { commandOverlayClasses.delete(c); },
          contains(c) { return commandOverlayClasses.has(c); }
        }
      };
    }
    if (id === 'command-input') {
      return { value: '', focus(){} };
    }
    if (id === 'profileDropdown' || id === 'topbar-user-dropdown') {
      return {
        get innerHTML() { return userDropdownHtml; },
        set innerHTML(val) { userDropdownHtml = val; },
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
  querySelector(sel) {
    return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#dashboard' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts in dependency order
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

// ----------------------------------------------------
// 1. Calendar View Personalization (#calendar)
// ----------------------------------------------------
console.log('--- 1. Testing Calendar Personalization ---');

// Preet Bhavsar
Auth.login('Preet', 'preet@123');
CalendarScreen.goToday();
const preetCalHtml = CalendarScreen.render();

// Preet should see Preet tasks on September calendar (t1: Sept 15, t6: Sept 25, t14: Sept 10)
if (!preetCalHtml.includes('Implement agent orchestration engine') || !preetCalHtml.includes('Implement lead scoring AI model')) {
  throw new Error('Preet is missing assigned tasks on the calendar!');
}
// Preet MUST NOT see Mohit's or Hirvi's tasks
if (preetCalHtml.includes('Set up CI/CD pipeline') ||             // Mohit (t7)
    preetCalHtml.includes('Create Q4 content calendar') ||         // Mohit (t11)
    preetCalHtml.includes('Design conversation UI components') || // Hirvi (t2)
    preetCalHtml.includes('Design onboarding flow wireframes')) {  // Hirvi (t8)
  throw new Error('Calendar privacy leak: Preet can see tasks belonging to Mohit or Hirvi!');
}
console.log('✔ Preet Bhavsar ONLY sees Preet\'s tasks on the calendar (Mohit/Hirvi tasks hidden)');

// Mohit Jain
Auth.login('Mohit', 'mohit@123');
const mohitCalHtml = CalendarScreen.render();
if (!mohitCalHtml.includes('Set up CI/CD pipeline') || !mohitCalHtml.includes('Create Q4 content calendar')) {
  throw new Error('Mohit is missing assigned tasks on the calendar!');
}
if (mohitCalHtml.includes('Implement agent orchestration engine') || // Preet (t1)
    mohitCalHtml.includes('Implement lead scoring AI model') ||      // Preet (t6)
    mohitCalHtml.includes('Design conversation UI components')) {   // Hirvi (t2)
  throw new Error('Calendar privacy leak: Mohit can see tasks belonging to Preet or Hirvi!');
}
console.log('✔ Mohit Jain ONLY sees Mohit\'s tasks on the calendar (Preet/Hirvi tasks hidden)');

// Hirvi Sanghavi
Auth.login('Hirvi', 'hirvi@123');
const hirviCalHtml = CalendarScreen.render();
if (!hirviCalHtml.includes('Design conversation UI components') || !hirviCalHtml.includes('Design onboarding flow wireframes')) {
  throw new Error('Hirvi is missing assigned tasks on the calendar!');
}
if (hirviCalHtml.includes('Implement agent orchestration engine') || // Preet (t1)
    hirviCalHtml.includes('Build automation workflow builder')) {   // Mohit (t3)
  throw new Error('Calendar privacy leak: Hirvi can see tasks belonging to Preet or Mohit!');
}
console.log('✔ Hirvi Sanghavi ONLY sees Hirvi\'s tasks on the calendar (Preet/Mohit tasks hidden)');

// Ayush Desai (Admin)
Auth.login('Ayush', 'ayush@123');
const adminCalHtml = CalendarScreen.render();
if (!adminCalHtml.includes('Implement agent orchestration engine') || // Preet (Sept 15)
    !adminCalHtml.includes('Set up CI/CD pipeline') ||                 // Mohit (Sept 10)
    !adminCalHtml.includes('Design conversation UI components')) {   // Hirvi (Sept 20)
  throw new Error('Admin is missing team tasks on calendar!');
}
console.log('✔ Ayush Desai (Admin) has full portfolio calendar visibility across all team members');

// ----------------------------------------------------
// 2. Timeline / Executive Gantt View Restriction (#timeline)
// ----------------------------------------------------
console.log('\n--- 2. Testing Timeline / Gantt Restriction for AI Developers ---');

// Preet Bhavsar (AI Developer)
Auth.login('Preet', 'preet@123');
Sidebar.render();
if (sidebarNavHtml.includes('href="#timeline"') || sidebarNavHtml.includes('>Timeline<')) {
  throw new Error('Timeline link is visible in sidebar for AI Developer!');
}
console.log('✔ Timeline link is completely hidden from sidebar for AI Developer (Preet)');

// Direct route access attempt
window.location.hash = '#timeline';
App.handleRoute();
if (pageContentHtml.includes('timeline-macro-canvas') || pageContentHtml.includes('Executive Gantt Chart')) {
  throw new Error('AI Developer was able to access the Timeline Gantt canvas directly via URL!');
}
if (!pageContentHtml.includes('Access Restricted') || !pageContentHtml.includes('Executive Timeline & Gantt view is reserved for Admin')) {
  throw new Error('Access Restricted screen not displayed with expected message for AI Developer on #timeline');
}
console.log('✔ Direct URL access to #timeline is strictly blocked with "Access Restricted: Executive Timeline & Gantt view is reserved for Admin."');

// Ayush Desai (Admin)
Auth.login('Ayush', 'ayush@123');
Sidebar.render();
if (!sidebarNavHtml.includes('href="#timeline"')) {
  throw new Error('Admin sidebar is missing Timeline link!');
}
window.location.hash = '#timeline';
App.handleRoute();
if (!pageContentHtml.includes('Timeline & Executive Gantt')) {
  throw new Error('Admin was blocked from accessing #timeline!');
}
console.log('✔ Ayush Desai (Admin) has unrestricted access to #timeline and sidebar link');

// ----------------------------------------------------
// 3. Issues Module Data Isolation (#issues)
// ----------------------------------------------------
console.log('\n--- 3. Testing Issues Module Data Isolation ---');

// Preet (issues i1, i2, i4 assigned to Preet)
Auth.login('Preet', 'preet@123');
const preetIssuesHtml = IssuesScreen.render();
if (!preetIssuesHtml.includes('Agent memory leak in long conversations') || // i1
    !preetIssuesHtml.includes('WhatsApp API rate limiting') ||               // i2
    !preetIssuesHtml.includes('GPU memory overflow on 7B model')) {          // i4
  throw new Error('Preet is missing assigned issues!');
}
if (preetIssuesHtml.includes('Form validation bug on step 3')) {             // i3 (Mohit)
  throw new Error('Issue privacy leak: Preet can see Mohit\'s issue (i3)!');
}
console.log('✔ Preet Bhavsar ONLY sees issues assigned to Preet (i1, i2, i4; Mohit\'s issue hidden)');

// Mohit (issue i3 assigned to Mohit)
Auth.login('Mohit', 'mohit@123');
const mohitIssuesHtml = IssuesScreen.render();
if (!mohitIssuesHtml.includes('Form validation bug on step 3')) {
  throw new Error('Mohit is missing assigned issue i3!');
}
if (mohitIssuesHtml.includes('Agent memory leak in long conversations') ||
    mohitIssuesHtml.includes('GPU memory overflow on 7B model')) {
  throw new Error('Issue privacy leak: Mohit can see Preet\'s issues!');
}
console.log('✔ Mohit Jain ONLY sees issues assigned to Mohit (i3; Preet\'s issues hidden)');

// Hirvi (0 issues assigned to Hirvi)
Auth.login('Hirvi', 'hirvi@123');
const hirviIssuesHtml = IssuesScreen.render();
if (hirviIssuesHtml.includes('Agent memory leak in long conversations') ||
    hirviIssuesHtml.includes('Form validation bug on step 3')) {
  throw new Error('Issue privacy leak: Hirvi can see other members\' issues!');
}
console.log('✔ Hirvi Sanghavi sees zero issues from other members');

// Admin (all 4 issues)
Auth.login('Ayush', 'ayush@123');
const adminIssuesHtml = IssuesScreen.render();
if (!adminIssuesHtml.includes('Agent memory leak in long conversations') ||
    !adminIssuesHtml.includes('Form validation bug on step 3') ||
    !adminIssuesHtml.includes('GPU memory overflow on 7B model')) {
  throw new Error('Admin is missing issues!');
}
console.log('✔ Ayush Desai (Admin) sees all 4 issues across all team members');

// ----------------------------------------------------
// 4. Projects Module Data Isolation (#projects & #project-detail)
// ----------------------------------------------------
console.log('\n--- 4. Testing Projects Module Data Isolation ---');

// Hirvi has tasks in p1, p2, p3, p5. Does NOT have tasks in p4 (Research: LLM Fine-tuning).
Auth.login('Hirvi', 'hirvi@123');
const hirviProjectsHtml = ProjectsScreen.render();
if (!hirviProjectsHtml.includes('Hintonn AI Platform') ||     // p1
    !hirviProjectsHtml.includes('Client Onboarding Portal') || // p2
    !hirviProjectsHtml.includes('Marketing Campaign Q4') ||   // p3
    !hirviProjectsHtml.includes('Website Redesign')) {         // p5
  throw new Error('Hirvi is missing assigned projects!');
}
if (hirviProjectsHtml.includes('Research: LLM Fine-tuning')) { // p4 (Preet only)
  throw new Error('Project privacy leak: Hirvi can see project p4 (which has zero Hirvi tasks)!');
}
console.log('✔ Hirvi Sanghavi ONLY sees projects containing assigned tasks (p4 cleanly excluded)');

// Mohit has tasks in p1, p2, p3, p5. Does NOT have tasks in p4.
Auth.login('Mohit', 'mohit@123');
const mohitProjectsHtml = ProjectsScreen.render();
if (mohitProjectsHtml.includes('Research: LLM Fine-tuning')) {
  throw new Error('Project privacy leak: Mohit can see project p4!');
}
console.log('✔ Mohit Jain ONLY sees projects containing assigned tasks (p4 cleanly excluded)');

// Preet has tasks in p1 (Hintonn AI), p2 (Client Onboarding - t10), p4 (Research - t13, t14, t15). Does NOT have tasks in p3 or p5.
Auth.login('Preet', 'preet@123');
const preetProjectsHtml = ProjectsScreen.render();
if (!preetProjectsHtml.includes('Research: LLM Fine-tuning') || !preetProjectsHtml.includes('Hintonn AI Platform') || !preetProjectsHtml.includes('Client Onboarding Portal')) {
  throw new Error('Preet is missing assigned projects!');
}
if (preetProjectsHtml.includes('Marketing Campaign Q4') || preetProjectsHtml.includes('Website Redesign')) {
  throw new Error('Project privacy leak: Preet can see projects p3 or p5 (which have zero Preet tasks)!');
}
console.log('✔ Preet Bhavsar ONLY sees projects containing Preet tasks (p1, p2, p4; p3 & p5 cleanly excluded)');

// Admin sees all 5 projects
Auth.login('Ayush', 'ayush@123');
const adminProjectsHtml = ProjectsScreen.render();
if (!adminProjectsHtml.includes('Hintonn AI Platform') ||
    !adminProjectsHtml.includes('Client Onboarding Portal') ||
    !adminProjectsHtml.includes('Marketing Campaign Q4') ||
    !adminProjectsHtml.includes('Research: LLM Fine-tuning') ||
    !adminProjectsHtml.includes('Website Redesign')) {
  throw new Error('Admin is missing projects!');
}
console.log('✔ Ayush Desai (Admin) sees all 5 projects without restriction');

// Project Detail Direct URL Guarding (p3 has zero Preet tasks)
Auth.login('Preet', 'preet@123');
const preetP3Detail = ProjectDetailScreen.render('p3');
if (!preetP3Detail.includes('Access Restricted') && !preetP3Detail.includes('You do not have any tasks assigned in this project')) {
  throw new Error('Preet was allowed to view project detail for p3 (where Preet has no tasks)!');
}
console.log('✔ ProjectDetailScreen blocks AI Developer access to unassigned projects (p3)');

// ----------------------------------------------------
// 5. Milestones Module Data Isolation (#milestones)
// ----------------------------------------------------
console.log('\n--- 5. Testing Milestones Module Data Isolation ---');

// Preet (has tasks in p1, p2, p4):
// Milestones: ms1 (p1), ms2 (p1), ms3 (p2). Does NOT include ms4 (p5 - Website Launch).
Auth.login('Preet', 'preet@123');
const preetMilestonesHtml = MilestonesScreen.render();
if (!preetMilestonesHtml.includes('Alpha Release') || !preetMilestonesHtml.includes('Onboarding MVP')) {
  throw new Error('Preet is missing connected milestones!');
}
if (preetMilestonesHtml.includes('Website Launch')) { // ms4 on p5
  throw new Error('Milestone privacy leak: Preet can see ms4 on p5!');
}
console.log('✔ Preet Bhavsar ONLY sees milestones belonging to assigned projects (ms4 excluded)');

// Admin sees all milestones
Auth.login('Ayush', 'ayush@123');
const adminMilestonesHtml = MilestonesScreen.render();
if (!adminMilestonesHtml.includes('Onboarding MVP') || !adminMilestonesHtml.includes('Alpha Release')) {
  throw new Error('Admin is missing milestones!');
}
console.log('✔ Ayush Desai (Admin) sees all milestones across all projects');

// ----------------------------------------------------
// 6. Global Search & Notifications Isolation
// ----------------------------------------------------
console.log('\n--- 6. Testing Command Palette Search & Notifications Isolation ---');

// Command Quick Navigation for Preet
Auth.login('Preet', 'preet@123');
Command.renderResults('');
if (commandResultsHtml.includes('Timeline / Gantt')) {
  throw new Error('Command palette quick navigation includes Timeline for AI Developer!');
}
console.log('✔ Command palette quick navigation hides Timeline for AI Developer');

// Command Quick Navigation for Admin
Auth.login('Ayush', 'ayush@123');
Command.renderResults('');
if (!commandResultsHtml.includes('Timeline / Gantt')) {
  throw new Error('Command palette quick navigation missing Timeline for Admin!');
}
console.log('✔ Command palette quick navigation includes Timeline for Admin');

// Command Search Isolation for Preet
Auth.login('Preet', 'preet@123');
Command.renderResults('orchestration'); // Preet task
if (!commandResultsHtml.includes('Implement agent orchestration engine')) {
  throw new Error('Preet cannot search for Preet tasks in Command palette');
}
Command.renderResults('workflow'); // Mohit task (t3)
if (commandResultsHtml.includes('Build automation workflow builder')) {
  throw new Error('Command palette search leak: Preet can search for Mohit\'s task!');
}
console.log('✔ Command palette search strictly restricts task results to assigned tasks');

// Notifications Isolation
Auth.login('Preet', 'preet@123');
const preetNotifs = Store.getNotifications();
const preetNotifsText = preetNotifs.map(n => n.text).join(' | ');
if (preetNotifsText.includes('assigned to Mohit')) {
  throw new Error('Notification leak: Preet received notification assigned to Mohit!');
}
console.log('✔ Notifications strictly filtered to exclude other developers\' assignments');

Auth.login('Ayush', 'ayush@123');
const adminNotifs = Store.getNotifications();
if (adminNotifs.length < 5) {
  throw new Error('Admin is missing notifications!');
}
console.log('✔ Ayush Desai (Admin) receives all notifications across portfolio');

console.log('\n================================================================');
console.log('🎉 ALL ISOLATION, PRIVACY, AND ROUTE RESTRICTION TESTS PASSED!');
console.log('================================================================\n');
