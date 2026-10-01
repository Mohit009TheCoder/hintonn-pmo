const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('🔑 VERIFYING EMAIL ID AND PASSWORD LOGIN IN HINTONN PMO');
console.log('================================================================\n');

// Set up mock browser environment
const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
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
  'toast-container': { innerHTML: '', appendChild: ()=>{} }
};

const mockDocument = {
  getElementById: (id) => domElements[id] || { value: '', style: {}, innerHTML: '', classList: { add: ()=>{}, remove: ()=>{} } },
  querySelector: (sel) => null,
  querySelectorAll: () => []
};

const windowObj = {
  location: { hash: '#login' },
  localStorage: mockLocalStorage,
  document: mockDocument,
  navigator: { userAgent: 'node' }
};

const context = vm.createContext({
  window: windowObj,
  document: mockDocument,
  localStorage: mockLocalStorage,
  location: windowObj.location,
  navigator: windowObj.navigator,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Toast: { show: (msg, type) => console.log(`   [Toast ${type || 'info'}]: ${msg}`) },
  Utils: {
    escapeHtml: (s) => String(s || ''),
    timeAgo: () => 'just now'
  },
  firebase: {
    apps: [{ name: '[DEFAULT]' }],
    auth: () => ({
      currentUser: null,
      signInWithEmailAndPassword: async (email, pass) => {
        // Mock Firebase Auth check
        if (pass === 'wrongpass') {
          const err = new Error('Wrong password');
          err.code = 'auth/wrong-password';
          throw err;
        }
        return { user: { uid: 'uid_' + email.split('@')[0], email: email, displayName: email.split('@')[0] } };
      }
    }),
    firestore: () => ({
      collection: () => ({
        doc: () => ({ get: async () => ({ exists: false }) }),
        where: () => ({ get: async () => ({ empty: true, docs: [] }) })
      })
    })
  }
});

// Load auth.js, store.js, firebase-auth.js, login.js
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
vm.runInContext(authCode, context);

const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
vm.runInContext(storeCode, context);

const fbAuthCode = fs.readFileSync(path.join(__dirname, '../js/firebase-auth.js'), 'utf8');
vm.runInContext(fbAuthCode, context);

const loginCode = fs.readFileSync(path.join(__dirname, '../js/screens/login.js'), 'utf8');
vm.runInContext(loginCode, context);

(async () => {
  const Auth = context.Auth;
  const LoginScreen = context.LoginScreen;

  Auth.init();

  // Test 1: Mohit Jain Admin Email Login
  console.log('--- Test 1: Admin Email Login (mohithintonn@gmail.com) ---');
  let res = await Auth.login('mohithintonn@gmail.com', 'Mohit@123');
  assert(res.success === true, 'mohithintonn@gmail.com should login successfully');
  assert(res.user.role === 'Admin', 'User should have Admin role');
  console.log('  ✓ mohithintonn@gmail.com logged in as Admin successfully');

  // Test 2: Admin Alias Email Login
  console.log('\n--- Test 2: Admin Alias Login (admin@hintonn.com) ---');
  res = await Auth.login('admin@hintonn.com', 'admin@123');
  assert(res.success === true, 'admin@hintonn.com should login successfully');
  assert(res.user.role === 'Admin', 'User should have Admin role');
  console.log('  ✓ admin@hintonn.com logged in as Admin successfully');

  // Test 3: Preet Bhavsar Email Login
  console.log('\n--- Test 3: Developer Email Login (preethintonn@gmail.com) ---');
  res = await Auth.login('preethintonn@gmail.com', 'Preet@123');
  assert(res.success === true, 'preethintonn@gmail.com should login successfully');
  assert(res.user.role === 'AI Developer', 'preethintonn should have AI Developer role');
  console.log('  ✓ preethintonn@gmail.com logged in as AI Developer successfully');

  // Test 4: Hirvi Sanghavi Email Login
  console.log('\n--- Test 4: Developer Email Login (hirvihintonn@gmail.com) ---');
  res = await Auth.login('hirvihintonn@gmail.com', 'Hirvi@123');
  assert(res.success === true, 'hirvihintonn@gmail.com should login successfully');
  assert(res.user.role === 'AI Developer', 'hirvihintonn should have AI Developer role');
  console.log('  ✓ hirvihintonn@gmail.com logged in as AI Developer successfully');

  // Test 5: Username / Login ID Logins
  console.log('\n--- Test 5: Username / Login ID Logins ---');
  res = await Auth.login('Mohit', 'Mohit@123');
  assert(res.success === true, 'Login ID Mohit should work');
  assert(res.user.role === 'Admin', 'Mohit should be Admin');
  console.log('  ✓ Login ID "Mohit" logged in successfully');

  res = await Auth.login('admin', 'admin@123');
  assert(res.success === true, 'Login ID admin should work');
  assert(res.user.role === 'Admin', 'admin should be Admin');
  console.log('  ✓ Login ID "admin" logged in successfully');

  res = await Auth.login('Preet', 'Preet@123');
  assert(res.success === true, 'Login ID Preet should work');
  console.log('  ✓ Login ID "Preet" logged in successfully');

  res = await Auth.login('Hirvi', 'Hirvi@123');
  assert(res.success === true, 'Login ID Hirvi should work');
  console.log('  ✓ Login ID "Hirvi" logged in successfully');

  // Test 6: Incorrect Password Rejection
  console.log('\n--- Test 6: Password Validation ---');
  res = await Auth.login('mohithintonn@gmail.com', 'WrongPass123!');
  assert(res.success === false, 'Wrong password must fail');
  assert(res.error.includes('Incorrect password'), 'Error should state incorrect password');
  console.log('  ✓ Wrong password correctly rejected: ' + res.error);

  // Test 7: Non-existent User Rejection
  console.log('\n--- Test 7: Non-existent Account Rejection ---');
  res = await Auth.login('nobody@unknown.com', 'anypass');
  assert(res.success === false, 'Unknown account must fail');
  console.log('  ✓ Unknown account correctly rejected: ' + res.error);

  // Test 8: LoginScreen UI Form Submission with Email & Password
  console.log('\n--- Test 8: LoginScreen Form Submission ---');
  domElements['login-id'].value = 'mohithintonn@gmail.com';
  domElements['login-password'].value = 'Mohit@123';
  await LoginScreen.handleLogin();
  assert(windowObj.location.hash === '#dashboard', 'Successful form login should route to #dashboard');
  console.log('  ✓ LoginScreen.handleLogin() successfully routed to #dashboard');

  // Test 9: LoginScreen Quick Fill Credentials
  console.log('\n--- Test 9: LoginScreen.fillCredentials ---');
  LoginScreen.fillCredentials('admin@hintonn.com', 'admin@123');
  assert.strictEqual(domElements['login-id'].value, 'admin@hintonn.com');
  assert.strictEqual(domElements['login-password'].value, 'admin@123');
  console.log('  ✓ LoginScreen.fillCredentials correctly populated inputs');

  // Test 10: Phone Number Rejection
  console.log('\n--- Test 10: Phone Number Rejection in UI ---');
  domElements['login-id'].value = '+919876543210';
  domElements['login-password'].value = 'pass123';
  await LoginScreen.handleLogin();
  assert(LoginScreen._errorMessage.includes('Mobile/phone login is not supported'), 'Phone login should be rejected with clear notice');
  console.log('  ✓ Phone number rejection verified: ' + LoginScreen._errorMessage);

  console.log('\n================================================================');
  console.log('🎉 ALL 10 EMAIL ID AND PASSWORD LOGIN TESTS PASSED PERFECTLY!');
  console.log('================================================================');
})();
