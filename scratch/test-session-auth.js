const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('🔒 VERIFYING TAB-BASED SESSION & LOGIN-ON-START REQUIREMENT');
console.log('================================================================\n');

function createEnvironment(initialSessionData = {}, initialLocalData = {}) {
  const sessionStorageData = { ...initialSessionData };
  const localStorageData = { ...initialLocalData };

  const mockSessionStorage = {
    getItem: (k) => (k in sessionStorageData ? sessionStorageData[k] : null),
    setItem: (k, v) => { sessionStorageData[k] = String(v); },
    removeItem: (k) => { delete sessionStorageData[k]; },
    clear: () => { Object.keys(sessionStorageData).forEach(k => delete sessionStorageData[k]); }
  };

  const mockLocalStorage = {
    getItem: (k) => (k in localStorageData ? localStorageData[k] : null),
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
  };

  const domElements = {
    'login-id': { value: '', trim() { return this.value.trim(); }, focus() {} },
    'login-password': { value: '', type: 'password' },
    'login-btn': { disabled: false, textContent: 'Sign In' },
    'auth-error-alert': { style: { display: 'none' }, classList: { add: ()=>{}, remove: ()=>{} } },
    'auth-error-text': { textContent: '' },
    'page-content': { innerHTML: '' },
    'sidebar-nav': { innerHTML: '' },
    'breadcrumb': { innerHTML: '' },
    'toast-container': { innerHTML: '', appendChild: ()=>{} }
  };

  const mockDocument = {
    getElementById: (id) => domElements[id] || { value: '', style: {}, innerHTML: '', classList: { add: ()=>{}, remove: ()=>{} } },
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false } },
    addEventListener: () => {}
  };

  const windowObj = {
    location: { hash: '' },
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
    document: mockDocument,
    navigator: { userAgent: 'node' },
    addEventListener: () => {},
    innerWidth: 1200
  };

  const ctx = vm.createContext({
    window: windowObj,
    document: mockDocument,
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
    location: windowObj.location,
    navigator: windowObj.navigator,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: clearTimeout,
    Toast: { show: () => {} },
    Modal: { closeAll: () => {}, confirm: () => {} },
    Icons: { logout: '<svg></svg>', chevronDown: '<svg></svg>' },
    Sidebar: { render: () => {} },
    Topbar: { render: () => {}, closeUserMenu: () => {} },
    Command: { close: () => {} },
    firebase: {
      apps: [{ name: '[DEFAULT]' }],
      auth: () => ({
        currentUser: null,
        setPersistence: async () => {},
        signInWithEmailAndPassword: async () => ({ user: { uid: 'm3', email: 'mohithintonn@gmail.com' } }),
        signOut: async () => {},
        onAuthStateChanged: () => () => {}
      }),
      firestore: () => ({
        collection: () => ({
          onSnapshot: () => () => {},
          doc: () => ({ get: async () => ({ exists: false }), set: async () => {} }),
          where: () => ({ get: async () => ({ empty: true, docs: [] }) })
        })
      })
    }
  });

  // Load app scripts in order
  const pmoDir = path.resolve(__dirname, '..');
  const storeCode = fs.readFileSync(path.join(pmoDir, 'js/store.js'), 'utf8');
  const authCode = fs.readFileSync(path.join(pmoDir, 'js/auth.js'), 'utf8');
  const loginCode = fs.readFileSync(path.join(pmoDir, 'js/screens/login.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(pmoDir, 'js/app.js'), 'utf8');

  vm.runInContext(storeCode, ctx);
  vm.runInContext(authCode, ctx);
  vm.runInContext(loginCode, ctx);
  vm.runInContext(appCode, ctx);

  return { ctx, windowObj, sessionStorageData, localStorageData, domElements };
}

async function runTests() {
  console.log('--- Test 1: Fresh System Start Without Session ---');
  {
    const { ctx, windowObj } = createEnvironment({}, {});
    ctx.Store.init();
    ctx.Auth.init();
    assert.strictEqual(ctx.Auth.currentUser, null, 'Auth.currentUser must be null on fresh start');
    assert.strictEqual(ctx.Auth.isAuthenticated(), false, 'Auth.isAuthenticated() must be false on fresh start');

    // Route check: User tries to directly access dashboard
    windowObj.location.hash = '#dashboard';
    ctx.App.handleRoute();

    assert.strictEqual(windowObj.location.hash, '#login', 'Direct access to #dashboard must be blocked and redirected to #login');
    assert.strictEqual(ctx.App.currentScreen, 'login', 'App currentScreen must be login');
    console.log('  ✓ System starts with login, direct access blocked');
  }

  console.log('\n--- Test 2: Legacy LocalStorage Purge On Start ---');
  {
    // Simulate an old build that left user in localStorage
    const fakeLegacyUser = { id: 'mohit', name: 'Mohit Jain', email: 'mohithintonn@gmail.com', role: 'Admin', approved: true };
    const { ctx, windowObj, localStorageData } = createEnvironment({}, {
      'hintonn-current-user': JSON.stringify(fakeLegacyUser)
    });

    ctx.Store.init();
    ctx.Auth.init();

    assert.strictEqual(ctx.Auth.currentUser, null, 'Legacy localStorage session must NOT be restored on fresh start');
    assert.strictEqual(localStorageData['hintonn-current-user'], undefined, 'Legacy localStorage user must be purged on start');

    windowObj.location.hash = '#projects';
    ctx.App.handleRoute();
    assert.strictEqual(windowObj.location.hash, '#login', 'Legacy user cannot bypass login on start');
    console.log('  ✓ Legacy localStorage session purged and login enforced');
  }

  console.log('\n--- Test 3: Successful Login Establishes Tab Session ---');
  {
    const { ctx, windowObj, sessionStorageData, localStorageData } = createEnvironment({}, {});
    ctx.Store.init();
    ctx.Auth.init();

    const loginRes = await ctx.Auth.login('Mohit', 'Mohit@123');
    assert.strictEqual(loginRes.success, true, 'Admin login should succeed');
    assert.ok(ctx.Auth.currentUser, 'Auth.currentUser should be set');
    assert.strictEqual(ctx.Auth.currentUser.role, 'Admin', 'Logged in user is Admin');
    assert.strictEqual(ctx.Auth.isAuthenticated(), true, 'Auth.isAuthenticated() should be true');

    // Verify session storage has user and localStorage does NOT
    assert.ok(sessionStorageData['hintonn-current-user'], 'User MUST be stored in sessionStorage');
    assert.strictEqual(localStorageData['hintonn-current-user'], undefined, 'User must NOT be stored in localStorage');

    windowObj.location.hash = '#dashboard';
    ctx.App.handleRoute();
    assert.strictEqual(ctx.App.currentScreen, 'dashboard', 'Should successfully route to dashboard after login');
    console.log('  ✓ Login succeeds and session is stored exclusively in sessionStorage');
  }

  console.log('\n--- Test 4: Session Continuation (Refresh / Internal Navigation) ---');
  {
    // User is logged in within the active tab
    const activeUser = { id: 'mohit', memberId: 'm3', loginId: 'Mohit', name: 'Mohit Jain', email: 'mohithintonn@gmail.com', role: 'Admin', approved: true };
    const { ctx, windowObj } = createEnvironment({
      'hintonn-current-user': JSON.stringify(activeUser)
    }, {});

    // Simulate page reload in the active tab (sessionStorage remains intact)
    ctx.Store.init();
    ctx.Auth.init();

    assert.ok(ctx.Auth.currentUser, 'Auth.currentUser restored from active tab session');
    assert.strictEqual(ctx.Auth.currentUser.email, 'mohithintonn@gmail.com', 'Restored correct user');
    assert.strictEqual(ctx.Auth.isAuthenticated(), true, 'User remains authenticated');

    // Navigating to projects or retention
    windowObj.location.hash = '#retention';
    ctx.App.handleRoute();
    assert.strictEqual(ctx.App.currentScreen, 'retention', 'Access to internal screen allowed while session continues');

    windowObj.location.hash = '#projects';
    ctx.App.handleRoute();
    assert.strictEqual(ctx.App.currentScreen, 'projects', 'Access to projects allowed while session continues');
    console.log('  ✓ Active session continues seamlessly across page reloads and internal routes');
  }

  console.log('\n--- Test 5: Tab Close and Reopen Requires Login Again ---');
  {
    // Tab 1 closes -> browser clears sessionStorage!
    // User opens new tab -> starts with empty sessionStorage
    const { ctx, windowObj } = createEnvironment({}, {});
    ctx.Store.init();
    ctx.Auth.init();

    assert.strictEqual(ctx.Auth.currentUser, null, 'After tab close, Auth.currentUser must be null');
    assert.strictEqual(ctx.Auth.isAuthenticated(), false, 'After tab close, user is not authenticated');

    windowObj.location.hash = '#tasks';
    ctx.App.handleRoute();
    assert.strictEqual(windowObj.location.hash, '#login', 'Must redirect to #login when tab is reopened');
    assert.strictEqual(ctx.App.currentScreen, 'login', 'Must ask for login again');
    console.log('  ✓ After tab close, reopening tab asks for login again as required');
  }

  console.log('\n--- Test 6: Explicit Logout Clears Tab Session ---');
  {
    const activeUser = { id: 'mohit', memberId: 'm3', loginId: 'Mohit', name: 'Mohit Jain', email: 'mohithintonn@gmail.com', role: 'Admin', approved: true };
    const { ctx, windowObj, sessionStorageData } = createEnvironment({
      'hintonn-current-user': JSON.stringify(activeUser)
    }, {});

    ctx.Store.init();
    ctx.Auth.init();
    assert.strictEqual(ctx.Auth.isAuthenticated(), true);

    ctx.Auth.logout();
    assert.strictEqual(ctx.Auth.currentUser, null, 'currentUser is null after logout');
    assert.strictEqual(ctx.Auth.isAuthenticated(), false, 'isAuthenticated is false after logout');
    assert.strictEqual(sessionStorageData['hintonn-current-user'], undefined, 'sessionStorage is cleared on logout');
    assert.strictEqual(windowObj.location.hash, '#login', 'Routed to #login on logout');
    console.log('  ✓ Explicit logout wipes tab session and routes to #login');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 6 TAB SESSION & LOGIN-ON-START VERIFICATIONS PASSED 100%!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
