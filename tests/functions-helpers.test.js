/** Cloud Functions pure helpers (functions/index.js) — extracted & tested. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Extract the pure helper functions from the ESM source and evaluate them.
const src = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');

function extractFn(name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `${name} not found in functions/index.js`);
  let i = src.indexOf('{', start), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 1);
}

const sandboxFn = new Function(
  extractFn('sanitize') + '\n' +
  extractFn('classifyRisk') + '\n' +
  extractFn('daysUntil') + '\n' +
  'return { sanitize, classifyRisk, daysUntil };'
);
const { sanitize, classifyRisk, daysUntil } = sandboxFn();

describe('sanitize', () => {
  test('strips sensitive keys at top level and nested', () => {
    const out = sanitize({
      name: 'Acme', password: 'p', token: 't', secret: 's', apiKey: 'k', accessToken: 'a',
      nested: { deep: { password: 'x', keep: 1 }, ok: 2 }
    });
    assert.strictEqual(out.name, 'Acme');
    for (const k of ['password', 'token', 'secret', 'apiKey', 'accessToken']) {
      assert.ok(!(k in out), `${k} must be stripped`);
    }
    assert.ok(!('password' in out.nested.deep));
    assert.strictEqual(out.nested.deep.keep, 1);
    assert.strictEqual(out.nested.ok, 2);
  });
  test('handles null input', () => {
    assert.strictEqual(sanitize(null), null);
  });
});

describe('classifyRisk', () => {
  test('boundary classification', () => {
    assert.strictEqual(classifyRisk(-5), 'expired');
    assert.strictEqual(classifyRisk(0), 'expired');
    assert.strictEqual(classifyRisk(1), 'critical');
    assert.strictEqual(classifyRisk(30), 'critical');
    assert.strictEqual(classifyRisk(31), 'warning');
    assert.strictEqual(classifyRisk(90), 'warning');
    assert.strictEqual(classifyRisk(91), 'safe');
  });
});

describe('daysUntil', () => {
  const DAY = 24 * 60 * 60 * 1000;
  test('null/undefined → Infinity', () => {
    assert.strictEqual(daysUntil(null), Infinity);
    assert.strictEqual(daysUntil(undefined), Infinity);
  });
  test('accepts Date, ISO strings and Timestamp-like objects', () => {
    const future = new Date(Date.now() + 5 * DAY);
    assert.strictEqual(daysUntil(future), 5);
    assert.strictEqual(daysUntil(future.toISOString()), 5);
    assert.strictEqual(daysUntil({ toDate: () => future }), 5);
  });
  test('past dates are negative', () => {
    assert.ok(daysUntil(new Date(Date.now() - 2 * DAY)) < 0);
  });
});
