/**
 * Test harness: evaluates the app's classic browser scripts inside a vm
 * sandbox with minimal browser stubs, exporting the top-level objects.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function makeStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { for (const k of Object.keys(data)) delete data[k]; },
    _dump: () => ({ ...data })
  };
}

function makeSandbox() {
  const sandbox = {
    console,
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    location: { hash: '' },
    setTimeout, clearTimeout, setInterval, clearInterval,
    // Host intrinsics so instanceof checks behave across the boundary
    Date, JSON, Math, Promise, isNaN, parseInt, parseFloat,
    String, Number, Boolean, Array, Object, Set, Map, WeakMap, RegExp,
    Error, TypeError, RangeError, Intl, Symbol, BigInt, Proxy, Reflect,
    encodeURIComponent, decodeURIComponent, encodeURI, decodeURI
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

/**
 * Load a browser script into the sandbox, rewriting `const X =` top-level
 * declarations to `globalThis.X =` so the object is reachable afterwards.
 */
function loadScript(sandbox, relPath, exportsList) {
  let src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  for (const name of exportsList) {
    src = src.replace(new RegExp(`^const ${name} =`, 'm'), `globalThis.${name} =`);
  }
  vm.runInContext(src, sandbox, { filename: relPath });
  return sandbox[name0(exportsList)];
}
function name0(list) { return list[0]; }

/** Fresh sandbox with Utils + App loaded (no document → App.init skipped). */
function freshApp() {
  const sb = makeSandbox();
  loadScript(sb, 'js/app.js', ['Utils', 'App']);
  return sb;
}

/** Fresh sandbox with Store loaded; firestore sync suppressed (no timers). */
function freshStore() {
  const sb = makeSandbox();
  loadScript(sb, 'js/store.js', ['Store']);
  sb.Store._firestoreInitialized = true; // prevent the firebase-retry timer
  return sb;
}

/** Fresh sandbox with Auth loaded. */
function freshAuth() {
  const sb = makeSandbox();
  loadScript(sb, 'js/auth.js', ['Auth']);
  return sb;
}

module.exports = { ROOT, makeSandbox, makeStorage, loadScript, freshApp, freshStore, freshAuth };
