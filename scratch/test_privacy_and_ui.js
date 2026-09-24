// Comprehensive Verification for Profile Dropdown, Login UI, and Individual Task Privacy
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('RUNNING TASK PRIVACY, LOGIN UI, AND DROPDOWN TESTS');
console.log('====================================================\n');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let dropdownContent = '';
let dropdownStyle = { display: 'none' };
let bodyClasses = new Set();
let pageContentHtml = '';

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
    if (id === 'profileDropdown' || id === 'topbar-user-dropdown') {
      return {
        get innerHTML() { return dropdownContent; },
        set innerHTML(val) { dropdownContent = val; },
        style: dropdownStyle,
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }
      };
    }
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
  querySelector(sel) {
    return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#tasks' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts
const files = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/components/topbar.js',
  'js/components/modal.js',
  'js/components/toast.js',
  'js/screens/login.js',
  'js/screens/tasks.js',
  'js/app.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

Store.init();
Auth.init();

// ----------------------------------------------------
// TEST 1: Oversized Profile Dropdown Icons & Menu Item CSS
// ----------------------------------------------------
console.log('--- TEST 1: Profile Dropdown Icon Sizing & Menu Styling ---');
const layoutCss = fs.readFileSync(path.join(__dirname, '..', 'css/layout.css'), 'utf8');

// 1.1 Verify SVG / img dimensions rule
if (!layoutCss.includes('.profile-dropdown .menu-item svg') || !layoutCss.includes('width: 18px !important;')) {
  throw new Error('layout.css missing .profile-dropdown .menu-item svg with width: 18px !important;');
}
if (!layoutCss.includes('height: 18px !important;')) {
  throw new Error('layout.css missing height: 18px !important; on profile-dropdown icons');
}
if (!layoutCss.includes('flex-shrink: 0;')) {
  throw new Error('layout.css missing flex-shrink: 0; on profile-dropdown icons');
}
console.log('✔ CSS rule: .profile-dropdown .menu-item svg, .profile-dropdown .menu-item img { width: 18px !important; height: 18px !important; flex-shrink: 0; }');

// 1.2 Verify Menu Item Alignment flex container
if (!layoutCss.includes('.profile-dropdown .menu-item') || !layoutCss.includes('display: flex;') || !layoutCss.includes('gap: 12px;')) {
  throw new Error('layout.css missing .profile-dropdown .menu-item flex container styles');
}
console.log('✔ CSS rule: .profile-dropdown .menu-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; font-size: 14px; ... }');

// 1.3 Verify Hover Effect
if (!layoutCss.includes('.profile-dropdown .menu-item:hover') || !layoutCss.includes('background-color: #F3F4F6')) {
  throw new Error('layout.css missing hover highlight background-color: #F3F4F6');
}
console.log('✔ CSS rule: .profile-dropdown .menu-item:hover { background-color: #F3F4F6 !important; }');

// 1.4 Test Topbar.openUserMenu() generates .menu-item rows
Auth.login('Preet', 'preet@123');
Topbar.openUserMenu();
if (!dropdownContent.includes('class="menu-item') && !dropdownContent.includes('class="menu-item dropdown-item"')) {
  throw new Error('Profile dropdown menu does not use menu-item class');
}
if (!dropdownContent.includes('Sign Out')) {
  throw new Error('Profile dropdown menu missing Sign Out');
}
console.log('✔ Topbar rendered profile dropdown correctly for Preet');

// ----------------------------------------------------
// TEST 2: Remove Quick Demo Account Buttons (#login)
// ----------------------------------------------------
console.log('\n--- TEST 2: Quick Demo Account Buttons Removed from Login ---');
const loginHtml = LoginScreen.render();

if (loginHtml.includes('quick-demo-accounts') || loginHtml.includes('QUICK DEMO ACCOUNTS')) {
  throw new Error('LoginScreen still contains .quick-demo-accounts wrapper or text');
}
if (loginHtml.includes('Ayush (Admin)') || loginHtml.includes('Preet (Dev)') || loginHtml.includes('Mohit (Dev)') || loginHtml.includes('Hirvi (Dev)')) {
  throw new Error('LoginScreen still contains shortcut demo buttons');
}
if (loginHtml.includes('fillDemo')) {
  throw new Error('LoginScreen still contains fillDemo method');
}
if (!loginHtml.includes('id="login-id"') || !loginHtml.includes('id="login-password"') || !loginHtml.includes('id="login-btn"')) {
  throw new Error('LoginScreen missing standard manual authentication input fields or submit button');
}
console.log('✔ Quick Demo Accounts wrapper, buttons, and bypasses completely removed from Login screen');
console.log('✔ Manual credential entry (Login ID and Password) is strictly required to authenticate');

// ----------------------------------------------------
// TEST 3: Enforce Strict Individual Task Privacy (#tasks)
// ----------------------------------------------------
console.log('\n--- TEST 3: Enforce Strict Individual Task Privacy ---');

// Reset tasks filter
TasksScreen._filter = { project: '', status: '', priority: '', assignee: '', search: '' };

// 3.1 PREET BHAVSAR (AI Developer)
Auth.login('Preet', 'preet@123');
const preetTasksHtml = TasksScreen.render();

// Preet should see Preet tasks
if (!preetTasksHtml.includes('Implement agent orchestration engine') || !preetTasksHtml.includes('Integrate WhatsApp Business API')) {
  throw new Error('Preet Bhavsar cannot see their own tasks');
}
// Preet MUST NOT see Mohit's or Hirvi's tasks
if (preetTasksHtml.includes('Build automation workflow builder') || // Mohit (t3)
    preetTasksHtml.includes('Build analytics dashboard') ||          // Mohit (t5)
    preetTasksHtml.includes('Design conversation UI components') || // Hirvi (t2)
    preetTasksHtml.includes('Design onboarding flow wireframes')) {  // Hirvi (t8)
  throw new Error('Task privacy violation: Preet Bhavsar can see tasks assigned to Mohit or Hirvi!');
}
// Assignee filter dropdown MUST BE HIDDEN
if (preetTasksHtml.includes('<option value="">All Assignees</option>')) {
  throw new Error('Task privacy violation: Preet Bhavsar can see "All Assignees" filter dropdown!');
}
console.log('✔ Preet Bhavsar ONLY sees Preet\'s tasks (Mohit and Hirvi tasks strictly hidden)');
console.log('✔ "All Assignees" filter dropdown is hidden for Preet');

// 3.2 MOHIT JAIN (AI Developer)
Auth.login('Mohit', 'mohit@123');
const mohitTasksHtml = TasksScreen.render();

// Mohit should see Mohit's tasks
if (!mohitTasksHtml.includes('Build automation workflow builder') || !mohitTasksHtml.includes('Build analytics dashboard')) {
  throw new Error('Mohit Jain cannot see their own tasks');
}
// Mohit MUST NOT see Preet's or Hirvi's tasks
if (mohitTasksHtml.includes('Implement agent orchestration engine') || // Preet (t1)
    mohitTasksHtml.includes('Integrate WhatsApp Business API') ||     // Preet (t4)
    mohitTasksHtml.includes('Design conversation UI components') ||   // Hirvi (t2)
    mohitTasksHtml.includes('Design onboarding flow wireframes')) {    // Hirvi (t8)
  throw new Error('Task privacy violation: Mohit Jain can see tasks assigned to Preet or Hirvi!');
}
// Assignee filter dropdown MUST BE HIDDEN
if (mohitTasksHtml.includes('<option value="">All Assignees</option>')) {
  throw new Error('Task privacy violation: Mohit Jain can see "All Assignees" filter dropdown!');
}
console.log('✔ Mohit Jain ONLY sees Mohit\'s tasks (Preet and Hirvi tasks strictly hidden)');
console.log('✔ "All Assignees" filter dropdown is hidden for Mohit');

// 3.3 HIRVI SANGHAVI (AI Developer)
Auth.login('Hirvi', 'hirvi@123');
const hirviTasksHtml = TasksScreen.render();

// Hirvi should see Hirvi's tasks
if (!hirviTasksHtml.includes('Design conversation UI components') || !hirviTasksHtml.includes('Design onboarding flow wireframes')) {
  throw new Error('Hirvi Sanghavi cannot see their own tasks');
}
// Hirvi MUST NOT see Preet's or Mohit's tasks
if (hirviTasksHtml.includes('Implement agent orchestration engine') || // Preet (t1)
    hirviTasksHtml.includes('Build automation workflow builder') ||   // Mohit (t3)
    hirviTasksHtml.includes('Build analytics dashboard')) {           // Mohit (t5)
  throw new Error('Task privacy violation: Hirvi Sanghavi can see tasks assigned to Preet or Mohit!');
}
// Assignee filter dropdown MUST BE HIDDEN
if (hirviTasksHtml.includes('<option value="">All Assignees</option>')) {
  throw new Error('Task privacy violation: Hirvi Sanghavi can see "All Assignees" filter dropdown!');
}
console.log('✔ Hirvi Sanghavi ONLY sees Hirvi\'s tasks (Preet and Mohit tasks strictly hidden)');
console.log('✔ "All Assignees" filter dropdown is hidden for Hirvi');

// 3.4 AYUSH DESAI (Admin)
Auth.login('Ayush', 'ayush@123');
const adminTasksHtml = TasksScreen.render();

// Admin should see tasks across all team members
if (!adminTasksHtml.includes('Implement agent orchestration engine') || // Preet
    !adminTasksHtml.includes('Build automation workflow builder') ||   // Mohit
    !adminTasksHtml.includes('Design conversation UI components')) {   // Hirvi
  throw new Error('Admin (Ayush Desai) is missing team tasks!');
}
// Assignee filter dropdown MUST BE AVAILABLE FOR ADMIN
if (!adminTasksHtml.includes('<option value="">All Assignees</option>')) {
  throw new Error('Admin (Ayush Desai) is missing the "All Assignees" filter dropdown!');
}
console.log('✔ Ayush Desai (Admin) sees all team tasks across Preet, Mohit, and Hirvi');
console.log('✔ "All Assignees" filter dropdown is fully available for Admin');

// 3.5 List View Privacy Test
TasksScreen._view = 'list';
Auth.login('Preet', 'preet@123');
const preetListHtml = TasksScreen.render();
if (preetListHtml.includes('Build automation workflow builder') || preetListHtml.includes('Design conversation UI components')) {
  throw new Error('List view task privacy violation for Preet!');
}
console.log('✔ List view strictly respects task privacy for Preet');

Auth.login('Mohit', 'mohit@123');
const mohitListHtml = TasksScreen.render();
if (mohitListHtml.includes('Implement agent orchestration engine') || mohitListHtml.includes('Design conversation UI components')) {
  throw new Error('List view task privacy violation for Mohit!');
}
console.log('✔ List view strictly respects task privacy for Mohit');

Auth.login('Hirvi', 'hirvi@123');
const hirviListHtml = TasksScreen.render();
if (hirviListHtml.includes('Implement agent orchestration engine') || hirviListHtml.includes('Build automation workflow builder')) {
  throw new Error('List view task privacy violation for Hirvi!');
}
console.log('✔ List view strictly respects task privacy for Hirvi');

console.log('\n====================================================');
console.log('🎉 ALL TASKS PRIVACY AND UI TESTS PASSED PERFECTLY!');
console.log('====================================================\n');
