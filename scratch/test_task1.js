// Task 1 Verification Suite
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

// Initialize
Store.init();
Auth.init();

console.log('--- 1. Testing User Database ---');
const users = Auth.users;
if (users.length !== 4) throw new Error(`Expected 4 users, got ${users.length}`);

const expectedUsers = [
  { id: 'ayush', loginId: 'Ayush', password: 'ayush@123', role: 'Admin', name: 'Ayush Desai' },
  { id: 'preet', loginId: 'Preet', password: 'preet@123', role: 'AI Developer', name: 'Preet Bhavsar' },
  { id: 'mohit', loginId: 'Mohit', password: 'mohit@123', role: 'AI Developer', name: 'Mohit Jain' },
  { id: 'hirvi', loginId: 'Hirvi', password: 'hirvi@123', role: 'AI Developer', name: 'Hirvi Sanghavi' },
];

expectedUsers.forEach(exp => {
  const match = users.find(u => u.id === exp.id);
  if (!match) throw new Error(`Missing user: ${exp.id}`);
  if (match.loginId !== exp.loginId) throw new Error(`Mismatch loginId for ${exp.id}`);
  if (match.password !== exp.password) throw new Error(`Mismatch password for ${exp.id}`);
  if (match.role !== exp.role) throw new Error(`Mismatch role for ${exp.id}`);
  if (match.name !== exp.name) throw new Error(`Mismatch name for ${exp.id}`);
  console.log(`✔ User [${match.name}] verified (Login ID: ${match.loginId}, Role: ${match.role})`);
});

console.log('\n--- 2. Testing Case-Insensitive Login ID & Strict Password ---');
// Case insensitivity of Login ID
const testAyushUpper = Auth.login('AYUSH', 'ayush@123');
if (!testAyushUpper.success || testAyushUpper.user.id !== 'ayush') throw new Error('Uppercase AYUSH failed');
console.log('✔ Case-insensitive login ID works (AYUSH)');

const testAyushSpaced = Auth.login('  ayush  ', 'ayush@123');
if (!testAyushSpaced.success) throw new Error('Trimmed login ID failed');
console.log('✔ Trimmed login ID works ("  ayush  ")');

// Password case sensitivity
const testWrongPassCase = Auth.login('ayush', 'Ayush@123');
if (testWrongPassCase.success) throw new Error('Password case sensitivity check failed!');
if (testWrongPassCase.error !== 'Invalid Login ID or Password') {
  throw new Error(`Expected exact error 'Invalid Login ID or Password', got '${testWrongPassCase.error}'`);
}
console.log('✔ Password case sensitivity enforced with exact error message');

const testUnknownUser = Auth.login('nonexistent', 'ayush@123');
if (testUnknownUser.success || testUnknownUser.error !== 'Invalid Login ID or Password') {
  throw new Error('Unknown user did not return exact error message');
}
console.log('✔ Non-existent user returns exact error message');

// Test all 4 users can login successfully
expectedUsers.forEach(u => {
  const r = Auth.login(u.loginId, u.password);
  if (!r.success || r.user.id !== u.id) throw new Error(`Failed to login as ${u.loginId}`);
  console.log(`✔ Login successful for ${u.name} (${u.loginId})`);
});

console.log('\n--- 3. Testing Global Session & Logout ---');
Auth.logout();
if (Auth.isAuthenticated()) throw new Error('User still authenticated after logout');
if (Auth.currentUser !== null) throw new Error('currentUser is not null after logout');
if (window.location.hash !== '#login' && window.location.hash !== 'login') throw new Error('Logout did not set hash to #login');
console.log('✔ Logout clears currentUser and sets hash to #login');

console.log('\n--- 4. Testing Unauthenticated Route Guarding ---');
// Unauthenticated user attempting to access #dashboard or #projects
window.location.hash = '#dashboard';
App.handleRoute();
if (App.currentScreen !== 'login') throw new Error(`Route guarding failed: currentScreen is ${App.currentScreen}`);
if (window.location.hash !== '#login') throw new Error(`Hash was not set to #login, got ${window.location.hash}`);
if (!document.body.classList.contains('login-active')) throw new Error('login-active class missing on body');
console.log('✔ Route guarding prevents unauthenticated access and redirects to #login');

window.location.hash = '#projects';
App.handleRoute();
if (App.currentScreen !== 'login') throw new Error(`Route guarding failed for #projects`);
console.log('✔ Route guarding protects #projects');

console.log('\n--- 5. Testing Login Screen UI & Logo ---');
const loginHtml = LoginScreen.render();
if (!loginHtml.includes('assets/hintonn-official-logo.png')) throw new Error('Login screen missing official logo image');
if (!loginHtml.includes('max-height:44px') && !loginHtml.includes('max-height: 44px')) throw new Error('Logo missing max-height 44px constraint');
if (!loginHtml.includes('Sign in to your PMO workspace')) throw new Error('Missing title "Sign in to your PMO workspace"');
if (!loginHtml.includes('Login ID')) throw new Error('Missing "Login ID" input label');
if (!loginHtml.includes('Password')) throw new Error('Missing "Password" input label');
if (!loginHtml.includes('Sign In')) throw new Error('Missing "Sign In" button');
if (!loginHtml.includes('Invalid Login ID or Password')) throw new Error('Missing error container with "Invalid Login ID or Password"');
if (!loginHtml.includes('#FFFFFF')) throw new Error('Missing pure white background styling');
console.log('✔ Login screen UI verified with official logo, labels, inputs, button, and error container');

console.log('\n--- 6. Testing Authenticated Access ---');
Auth.login('Preet', 'preet@123');
window.location.hash = '#dashboard';
App.handleRoute();
if (App.currentScreen !== 'dashboard') throw new Error(`Authenticated navigation failed, got ${App.currentScreen}`);
if (document.body.classList.contains('login-active')) throw new Error('login-active class not removed after login');
console.log('✔ Authenticated user (Preet) successfully accesses #dashboard');

console.log('\n ALL TASK 1 TESTS PASSED! 🚀\n');
