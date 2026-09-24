// Verification Test Suite for Sidebar Collapsed Logo Behavior & Login Logo Background Blend
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING SIDEBAR COLLAPSED LOGO & LOGIN LOGO BLEND');
console.log('================================================================\n');

// 1. Test CSS Rules in css/layout.css
const layoutCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'layout.css'), 'utf8');

console.log('--- 1. Testing Collapsed Sidebar CSS Rules ---');

// Check .sidebar-collapsed / .sidebar.collapsed rules
const requiredCollapsedRules = [
  'max-width: 40px',
  'object-fit: cover',
  'object-position: left',
  'overflow: hidden',
  'width: 32px',
  'height: 32px'
];

requiredCollapsedRules.forEach(rule => {
  if (!layoutCss.includes(rule)) {
    throw new Error(`layout.css missing expected collapsed rule containing: "${rule}"`);
  }
});
console.log('✔ Verified collapsed sidebar rules: 32px/40px constrained width/height, object-fit: cover, object-position: left, overflow: hidden');

// Verify .sidebar-header-actions is hidden when collapsed
if (!layoutCss.includes('.sidebar.collapsed .sidebar-header-actions') || !layoutCss.includes('display: none !important')) {
  throw new Error('layout.css missing rule to hide sidebar-header-actions when collapsed!');
}
console.log('✔ Verified sidebar-header-actions is hidden when collapsed');

console.log('\n--- 2. Testing Login Page Logo Blend CSS Rules ---');
const requiredLoginRules = [
  '.login-card,',
  '.login-logo-wrapper',
  'background-color: #FFFFFF',
  'mix-blend-mode: multiply !important',
  'background: transparent !important',
  'filter: contrast(108%)'
];

requiredLoginRules.forEach(rule => {
  if (!layoutCss.includes(rule)) {
    throw new Error(`layout.css missing login blend rule: "${rule}"`);
  }
});
console.log('✔ Verified Login card & logo wrapper pure white background and mix-blend-mode: multiply, filter: contrast(108%)');

// 3. Test LoginScreen.render() output
console.log('\n--- 3. Testing LoginScreen Component Render ---');
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.document = {
  body: { style: {}, classList: { add(){}, remove(){}, contains(){ return false; } } },
  getElementById() { return { innerHTML: '', value: '', classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } }; },
  querySelector() { return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, style: {} }; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#login' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts
const files = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/screens/login.js',
  'js/app.js'
];
files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

const loginHtml = LoginScreen.render();
if (!loginHtml.includes('login-logo-wrapper')) {
  throw new Error('LoginScreen.render() does not include class "login-logo-wrapper"!');
}
if (!loginHtml.includes('mix-blend-mode:multiply') && !loginHtml.includes('mix-blend-mode: multiply')) {
  throw new Error('LoginScreen.render() missing mix-blend-mode: multiply on logo img!');
}
if (!loginHtml.includes('filter:contrast(108%)') && !loginHtml.includes('filter: contrast(108%)')) {
  throw new Error('LoginScreen.render() missing filter: contrast(108%) on logo img!');
}
console.log('✔ LoginScreen.render() output contains .login-logo-wrapper and blend styles');

console.log('\n--- 4. Testing App.toggleSidebar() & Toggle Button ---');
let sidebarClasses = new Set();
let bodyClasses = new Set();

const mockSidebar = {
  classList: {
    add(c) { sidebarClasses.add(c); },
    remove(c) { sidebarClasses.delete(c); },
    toggle(c) { if (sidebarClasses.has(c)) sidebarClasses.delete(c); else sidebarClasses.add(c); },
    contains(c) { return sidebarClasses.has(c); }
  }
};

global.document.getElementById = function(id) {
  if (id === 'sidebar') return mockSidebar;
  return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } };
};

global.document.body = {
  classList: {
    add(c) { bodyClasses.add(c); },
    remove(c) { bodyClasses.delete(c); },
    toggle(c) { if (bodyClasses.has(c)) bodyClasses.delete(c); else bodyClasses.add(c); },
    contains(c) { return bodyClasses.has(c); }
  }
};

// Test initial state (expanded)
if (mockSidebar.classList.contains('collapsed') || mockSidebar.classList.contains('sidebar-collapsed')) {
  throw new Error('Sidebar should start expanded!');
}

// First click: should collapse
App.toggleSidebar();
if (!mockSidebar.classList.contains('collapsed') || !mockSidebar.classList.contains('sidebar-collapsed')) {
  throw new Error('App.toggleSidebar() did not add collapsed and sidebar-collapsed classes to sidebar!');
}
if (!global.document.body.classList.contains('sidebar-collapsed')) {
  throw new Error('App.toggleSidebar() did not add sidebar-collapsed class to document.body!');
}
console.log('✔ App.toggleSidebar() successfully toggled sidebar to collapsed state');

// Second click: should expand
App.toggleSidebar();
if (mockSidebar.classList.contains('collapsed') || mockSidebar.classList.contains('sidebar-collapsed')) {
  throw new Error('App.toggleSidebar() did not remove collapsed and sidebar-collapsed classes on expand!');
}
if (global.document.body.classList.contains('sidebar-collapsed')) {
  throw new Error('App.toggleSidebar() did not remove sidebar-collapsed class from document.body on expand!');
}
console.log('✔ App.toggleSidebar() successfully toggled sidebar back to expanded state');

// 5. Test Sidebar.render() produces .brand-container and App.toggleSidebar() button
Store.init();
Auth.init();
let renderedHeader = '';
global.document.querySelector = function(sel) {
  if (sel === '.sidebar-header' || sel === '#top-brand-area') {
    return {
      get innerHTML() { return renderedHeader; },
      set innerHTML(val) { renderedHeader = val; }
    };
  }
  return { innerHTML: '', classList: { add(){}, remove(){}, toggle(){} } };
};

Sidebar.render();
if (!renderedHeader.includes('brand-container')) {
  throw new Error('Sidebar.render() branding anchor missing class "brand-container"!');
}
if (!renderedHeader.includes('App.toggleSidebar()')) {
  throw new Error('Sidebar.render() toggle button does not call App.toggleSidebar()!');
}
console.log('✔ Sidebar.render() branding container has class .brand-container and 3-dots button calls App.toggleSidebar()');

console.log('\n================================================================');
console.log('🎉 ALL COLLAPSED LOGO & LOGIN BLEND TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
