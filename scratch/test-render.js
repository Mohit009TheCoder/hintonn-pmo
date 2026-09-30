// Diagnostic script to test JS loading and rendering
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Create mock browser environment
const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const domElements = {
  'page-content': { innerHTML: '', classList: { add: ()=>{}, remove: ()=>{} } },
  'sidebar-nav': { innerHTML: '' },
  'breadcrumb': { innerHTML: '' },
  'sidebar': { classList: { add: ()=>{}, remove: ()=>{} } },
  'notification-panel': { innerHTML: '', classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false } },
  'notification-list': { innerHTML: '' },
  'notif-dot': { classList: { add: ()=>{}, remove: ()=>{} } },
  'notif-panel-count': { textContent: '', className: '' },
  'toast-container': { innerHTML: '', appendChild: ()=>{} },
  'command-overlay': { classList: { add: ()=>{}, remove: ()=>{} } },
  'command-input': { value: '' },
  'command-results': { innerHTML: '' },
  'searchModal': { innerHTML: '' },
  'profileDropdown': { style: { display: 'none' }, innerHTML: '' },
  'topbar-avatar': { textContent: '', innerHTML: '' },
  'mobile-bottom-nav': { querySelectorAll: () => [] }
};

const mockDocument = {
  getElementById: (id) => domElements[id] || { innerHTML: '', style: {}, classList: { add: ()=>{}, remove: ()=>{} }, querySelectorAll: () => [] },
  querySelector: (sel) => {
    if (sel === '.sidebar-header' || sel === '#top-brand-area') return { innerHTML: '' };
    return { innerHTML: '', style: {}, classList: { add: ()=>{}, remove: ()=>{} } };
  },
  querySelectorAll: (sel) => [],
  addEventListener: (event, handler) => {},
  createElement: (tag) => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, appendChild: ()=>{} }),
  body: { classList: { add: ()=>{}, remove: ()=>{} } }
};

const mockFirebase = {
  apps: [],
  initializeApp: () => {},
  auth: () => ({
    currentUser: null,
    signInAnonymously: () => Promise.resolve(),
    onAuthStateChanged: (cb) => {}
  }),
  firestore: () => ({
    collection: (name) => ({
      doc: (id) => ({
        onSnapshot: (cb) => {},
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        get: () => Promise.resolve({ exists: false, data: () => null })
      }),
      onSnapshot: (cb) => {},
      add: () => Promise.resolve()
    })
  })
};

const sandbox = {
  navigator: { serviceWorker: { register: () => Promise.resolve() } },
  window: {
    location: { hash: '#dashboard' },
    addEventListener: (event, handler) => {},
    innerWidth: 1200
  },
  document: mockDocument,
  localStorage: mockLocalStorage,
  firebase: mockFirebase,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  Date: Date,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  RegExp: RegExp,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

const context = vm.createContext(sandbox);

const scriptFiles = [
  'js/firebase-auth.js',
  'js/fcm.js',
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
  'js/screens/connectors.js',
  'js/screens/notifications.js',
  'js/screens/settings.js',
  'js/screens/user-approvals.js',
  'js/app.js'
];

console.log('Loading scripts in VM...');
for (const relPath of scriptFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, context, { filename: relPath });
    console.log(`  Loaded: ${relPath}`);
  } catch (err) {
    console.error(`❌ Error in ${relPath}:`, err);
    process.exit(1);
  }
}

console.log('\nTesting App.init()...');
try {
  vm.runInContext('App.init();', context);
  console.log('✅ App.init() passed without error');
} catch (err) {
  console.error('❌ Error during App.init():', err);
}

console.log('\nTesting screens rendering...');
const screens = [
  'dashboard', 'projects', 'tasks', 'timeline', 'team', 'calendar',
  'reports', 'issues', 'milestones', 'ai-assistant', 'connectors',
  'notifications', 'settings', 'user-approvals', 'billing',
  'retention', 'bg', 'dlp'
];

for (const screen of screens) {
  try {
    vm.runInContext(`
      App.currentScreen = '${screen}';
      App.render();
    `, context);
    console.log(`  ✅ Screen ${screen}: rendered ok (length: ${domElements['page-content'].innerHTML.length})`);
  } catch (err) {
    console.error(`  ❌ Screen ${screen} render error:`, err);
  }
}
