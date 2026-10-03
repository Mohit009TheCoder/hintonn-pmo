/** Auth (js/auth.js) — RBAC, login hardening, session lifecycle. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { freshAuth } = require('./helpers/browser');

let sb, Auth;
beforeEach(() => {
  ({ Auth } = sb = freshAuth());
});

const OK_USER = {
  id: 'u1', memberId: 'm9', name: 'Dev User', email: 'dev@x.com',
  role: 'AI Developer', approved: true
};

describe('Registry hygiene (regression guards)', () => {
  test('seeded users carry no password fields', () => {
    for (const u of Auth.users) {
      assert.ok(!('password' in u), `user ${u.id} must not store a password`);
    }
  });
  test('no password literals anywhere in auth.js source', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'auth.js'), 'utf8');
    for (const lit of ['Mohit@123', 'admin@123', 'Preet@123', 'Hirvi@123', 'user@123']) {
      assert.ok(!src.includes(lit), `literal ${lit} must not appear in auth.js`);
    }
  });
});

describe('Auth.login — credential verification', () => {
  test('rejects non-email login IDs', async () => {
    const res = await Auth.login('Mohit', 'anything');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /email/i);
  });
  test('rejects when FirebaseAuth is unavailable (no registry fallback)', async () => {
    const res = await Auth.login('dev@x.com', 'whatever');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /unavailable/i);
  });
  test('WRONG PASSWORD must fail even for a registered approved user', async () => {
    sb.FirebaseAuth = {
      signInEmail: async () => { const e = new Error('Invalid email or password.'); e.code = 'auth/wrong-password'; throw e; }
    };
    Auth.users.push({ ...OK_USER });
    const res = await Auth.login('dev@x.com', 'wrong-password');
    assert.strictEqual(res.success, false, 'wrong password must never fall through to the registry');
    assert.strictEqual(Auth.currentUser, null, 'no session may be granted');
  });
  test('network failure during sign-in also fails closed', async () => {
    sb.FirebaseAuth = { signInEmail: async () => { throw new Error('Network error. Check your connection.'); } };
    Auth.users.push({ ...OK_USER });
    const res = await Auth.login('dev@x.com', 'any');
    assert.strictEqual(res.success, false);
    assert.strictEqual(Auth.currentUser, null);
  });
  test('successful Firebase sign-in grants session + syncs settings', async () => {
    sb.FirebaseAuth = { signInEmail: async () => ({ user: { ...OK_USER } }) };
    sb.Store = { _data: { settings: {}, members: [] }, _save() {}, getMembers: () => [], createMember() {} };
    const res = await Auth.login('dev@x.com', 'good');
    assert.strictEqual(res.success, true);
    assert.strictEqual(Auth.getCurrentUser().id, 'u1');
    assert.strictEqual(Auth._getSessionUser().email, 'dev@x.com');
    assert.strictEqual(sb.Store._data.settings.currentUser, 'm9');
  });
  test('pending approval blocks the session', async () => {
    sb.FirebaseAuth = { signInEmail: async () => ({ user: { ...OK_USER, approved: false } }) };
    const res = await Auth.login('dev@x.com', 'good');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.pendingApproval, true);
    assert.strictEqual(Auth.isAuthenticated(), false);
  });
  test('revoked user is blocked', async () => {
    sb.FirebaseAuth = { signInEmail: async () => ({ user: { ...OK_USER, revoked: true } }) };
    const res = await Auth.login('dev@x.com', 'good');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /revoked/i);
  });
});

describe('Auth RBAC', () => {
  test('hasAccess per role matrix', () => {
    Auth.currentUser = { ...OK_USER, role: 'Admin' };
    assert.strictEqual(Auth.hasAccess('billing'), true);
    assert.strictEqual(Auth.hasAccess('user-approvals'), true);
    Auth.currentUser = { ...OK_USER, role: 'AI Developer' };
    assert.strictEqual(Auth.hasAccess('dashboard'), true);
    assert.strictEqual(Auth.hasAccess('billing'), false, 'devs cannot reach billing');
    assert.strictEqual(Auth.hasAccess('settings'), false);
  });
  test('unknown module defaults to allowed', () => {
    Auth.currentUser = { ...OK_USER };
    assert.strictEqual(Auth.hasAccess('nonexistent-module'), true);
  });
  test('_enforceAdminRole forces admin emails to Admin + approved', () => {
    const u = { email: 'mohithintonn@gmail.com', role: 'AI Developer', approved: false };
    Auth._enforceAdminRole(u);
    assert.strictEqual(u.role, 'Admin');
    assert.strictEqual(u.approved, true);
    const v = { email: 'someone@else.com', role: 'AI Developer' };
    Auth._enforceAdminRole(v);
    assert.strictEqual(v.role, 'AI Developer');
  });
  test('isAuthenticated respects approval + revocation', () => {
    Auth.currentUser = { ...OK_USER };
    assert.strictEqual(Auth.isAuthenticated(), true);
    Auth.currentUser = { ...OK_USER, approved: false };
    assert.strictEqual(Auth.isAuthenticated(), false);
    Auth.currentUser = { ...OK_USER, revoked: true };
    assert.strictEqual(Auth.isAuthenticated(), false);
    Auth.currentUser = null;
    assert.strictEqual(Auth.isAuthenticated(), false);
  });
});

describe('Auth.signUp / reset / logout', () => {
  test('signUp creates a Firebase Auth account and stores NO password locally', async () => {
    let captured = null;
    sb.FirebaseAuth = { signUpEmail: async (n, e, p) => { captured = { n, e, p }; return { user: { uid: 'fb1' } }; } };
    const res = await Auth.signUp('New User', 'new@x.com', 'Sup3rSecret!');
    assert.deepStrictEqual(captured, { n: 'New User', e: 'new@x.com', p: 'Sup3rSecret!' });
    assert.strictEqual(res.pendingApproval, true);
    const local = Auth.users.find(u => u.email === 'new@x.com');
    assert.ok(local, 'pending profile registered');
    assert.ok(!('password' in local), 'no password retained client-side');
  });
  test('signUp failure propagates the mapped error', async () => {
    sb.FirebaseAuth = { signUpEmail: async () => { throw new Error('An account with this email already exists.'); } };
    const res = await Auth.signUp('X', 'dup@x.com', 'Sup3rSecret!');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /already exists/i);
  });
  test('resetPassword sends Firebase reset email (lowercased), returns success', () => {
    let sentTo = null;
    sb.FirebaseAuth = { sendResetEmail: async (e) => { sentTo = e; } };
    const res = Auth.resetPassword('User@Example.com');
    assert.strictEqual(res.success, true);
    assert.strictEqual(sentTo, 'user@example.com');
  });
  test('forgotPassword validates the email shape', () => {
    assert.strictEqual(Auth.forgotPassword('not-an-email').success, false);
  });
  test('logout clears user + session storage', () => {
    Auth.currentUser = { ...OK_USER };
    Auth._setSessionUser(Auth.currentUser);
    Auth.logout();
    assert.strictEqual(Auth.currentUser, null);
    assert.strictEqual(Auth._getSessionUser(), null);
  });
  test('adminAddUser registers a pre-approved profile WITHOUT a password param', () => {
    sb.Store = { getMembers: () => [], createMember() {}, addNotification() {} };
    const res = Auth.adminAddUser('Team Mate', 'tm@x.com', 'AI Developer');
    assert.strictEqual(res.success, true);
    assert.ok(!('password' in res.user));
  });
});

describe('loginWithApprovedGoogle hardening', () => {
  test('approval alone never grants a session without a real Google sign-in', () => {
    Auth.users.push({
      id: 'goog_1', email: 'g@x.com', name: 'G User', approved: true,
      requestSource: 'Google OAuth'
    });
    // Stub getGoogleApprovalRequests path: directly test the guard
    sb.FirebaseAuth = { getCurrentUser: () => null };
    const res = Auth.loginWithApprovedGoogle('goog_1');
    // request lookup: id match on users → approved request via getGoogleApprovalRequests
    if (res.success !== true) {
      assert.strictEqual(res.success, false);
      assert.match(res.error, /sign in/i);
    } else {
      assert.fail('must not succeed without an active Firebase session');
    }
  });
});
