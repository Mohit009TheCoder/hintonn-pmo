// Task 2 Verification Suite: Commercial Views & Hard Route Protection
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

global.document = {
  body: {
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
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
    if (id === 'topbar-user-dropdown' || id === 'profileDropdown') {
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
  querySelector(sel) { return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} }; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#dashboard' },
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

console.log('--- 1. Testing AI Developer Sidebar Restrictions (Preet) ---');
Auth.login('Preet', 'preet@123');
Sidebar.render();

if (sidebarNavHtml.includes('COMMERCIAL')) {
  throw new Error('Sidebar still contains COMMERCIAL section for AI Developer!');
}
if (sidebarNavHtml.includes('#billing') || sidebarNavHtml.includes('#retention') || sidebarNavHtml.includes('#bg') || sidebarNavHtml.includes('#dlp')) {
  throw new Error('Sidebar still contains commercial links (#billing, #retention, #bg, #dlp) for AI Developer!');
}
if (sidebarNavHtml.includes('#settings')) {
  throw new Error('Sidebar still contains #settings link for AI Developer!');
}
console.log('✔ Verified COMMERCIAL section and Settings completely hidden from AI Developer sidebar');

console.log('\n--- 2. Testing Hard Route Protection for AI Developer (Preet) ---');
const commercialRoutes = ['billing', 'invoices', 'retention', 'bg', 'bank-guarantees', 'dlp', 'dlp-timelines'];

commercialRoutes.forEach(r => {
  window.location.hash = `#${r}`;
  App.handleRoute();
  
  if (!pageContentHtml.includes('Access Restricted')) {
    throw new Error(`Route #${r} failed to render Access Restricted for AI Developer!`);
  }
  if (!pageContentHtml.includes('You do not have permission to view commercial or financial administration records. Please contact Ayush Desai (Admin) for elevated access.')) {
    throw new Error(`Route #${r} missing required restriction message!`);
  }
  if (!pageContentHtml.includes('Back to Dashboard')) {
    throw new Error(`Route #${r} missing "Back to Dashboard" button!`);
  }
  console.log(`✔ Route #${r} is hard-protected and renders "Access Restricted" screen`);
});

console.log('\n--- 3. Testing Admin Access (Ayush Desai) ---');
Auth.login('Ayush', 'ayush@123');
Sidebar.render();

if (!sidebarNavHtml.includes('COMMERCIAL')) {
  throw new Error('Sidebar missing COMMERCIAL section for Admin!');
}
if (!sidebarNavHtml.includes('#billing') || !sidebarNavHtml.includes('#retention') || !sidebarNavHtml.includes('#bg') || !sidebarNavHtml.includes('#dlp')) {
  throw new Error('Sidebar missing commercial links for Admin!');
}
if (!sidebarNavHtml.includes('#settings')) {
  throw new Error('Sidebar missing #settings link for Admin!');
}
console.log('✔ Verified Admin sidebar shows all items without restriction');

console.log('\n--- 4. Testing Admin Route Access ---');
commercialRoutes.forEach(r => {
  window.location.hash = `#${r}`;
  App.handleRoute();
  
  if (pageContentHtml.includes('Access Restricted')) {
    throw new Error(`Admin was improperly blocked from route #${r}!`);
  }
  console.log(`✔ Admin has full access to route #${r}`);
});

console.log('\n--- 5. Testing Topbar Settings visibility for AI Developer vs Admin ---');
Auth.login('Preet', 'preet@123');
Topbar.openUserMenu();
if (userDropdownHtml.includes('#settings')) {
  throw new Error('User dropdown still shows #settings link for AI Developer!');
}
console.log('✔ Verified Settings & Profile hidden from AI Developer topbar dropdown');

Auth.login('Ayush', 'ayush@123');
Topbar.openUserMenu();
if (!userDropdownHtml.includes('#settings')) {
  throw new Error('User dropdown missing #settings link for Admin!');
}
console.log('✔ Verified Settings & Profile visible to Admin in topbar dropdown');

console.log('\n ALL TASK 2 TESTS PASSED! 🚀\n');
