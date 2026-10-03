/** Live-sync regression tests: pre-auth listener failure → re-attach on sign-in,
 *  and localStorage quota hardening. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { makeSandbox, loadScript, ROOT } = require('./helpers/browser');

/** Controllable firebase stub: listeners fail until `authed` flips true. */
function makeFirebaseStub(state) {
  return {
    firestore: () => ({
      collection: (name) => ({
        onSnapshot: (ok, err) => {
          state.attempts.push(name);
          if (!state.authed) {
            if (err) err({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });
            return () => state.detached.push(name);
          }
          state.attached.push(name);
          return () => state.detached.push(name);
        },
        doc: () => ({
          onSnapshot: (ok, err) => {
            state.attempts.push('settings/doc');
            if (!state.authed) { if (err) err({ code: 'permission-denied' }); return () => state.detached.push('settings/doc'); }
            return () => {};
          }
        })
      })
    }),
    auth: () => ({
      onAuthStateChanged: (cb) => { state.authCb = cb; }
    })
  };
}

describe('Store Firestore sync vs auth-required rules', () => {
  test('pre-auth listener failures re-attach after sign-in (no reload needed)', () => {
    const state = { authed: false, attempts: [], attached: [], detached: [], authCb: null };
    const sb = makeSandbox();
    sb.firebase = makeFirebaseStub(state);
    loadScript(sb, 'js/store.js', ['Store']);
    const { Store } = sb;

    Store.init(); // runs BEFORE any Firebase session exists

    assert.ok(state.attempts.length >= 13, 'listeners attempted pre-auth');
    assert.strictEqual(Store._listenersFailed, true, 'permission-denied marks sync failed');

    // User signs in now — auth state change must re-attach listeners
    state.authed = true;
    state.authCb({ email: 'dev@x.com', uid: 'u1' });

    assert.strictEqual(Store._firestoreInitialized, true);
    assert.ok(state.attached.length >= 13, `listeners must re-attach after sign-in (got ${state.attached.length})`);
    assert.ok(state.detached.length >= 13, 'failed listeners must be detached first');
    assert.strictEqual(Store._listenersFailed, false);
  });

  test('already-authenticated startup attaches once, no churn', () => {
    const state = { authed: true, attempts: [], attached: [], detached: [], authCb: null };
    const sb = makeSandbox();
    sb.firebase = makeFirebaseStub(state);
    loadScript(sb, 'js/store.js', ['Store']);

    sb.Store.init();
    assert.ok(state.attached.length >= 13);
    const attachedAfterInit = state.attached.length;

    // Auth event with no prior failure → no detach/re-attach churn
    state.authCb({ email: 'dev@x.com', uid: 'u1' });
    assert.strictEqual(state.attached.length, attachedAfterInit);
    assert.strictEqual(state.detached.length, 0);
  });
});

describe('Store localStorage quota hardening', () => {
  test('quota-exceeded storage does not crash mutations', () => {
    const sb = makeSandbox();
    sb.localStorage.setItem = () => { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; };
    loadScript(sb, 'js/store.js', ['Store']);
    const { Store } = sb;
    Store._firestoreInitialized = true; // skip firebase retry timer (no stub here)

    Store.init(); // must not throw
    const p = Store.createProject({ name: 'Big data' }); // must not throw
    assert.ok(p.id);
    assert.strictEqual(Store.getProject(p.id).name, 'Big data');
    assert.strictEqual(Store._storageWarned, true, 'warned exactly once');
  });
});
