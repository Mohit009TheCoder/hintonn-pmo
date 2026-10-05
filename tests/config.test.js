/** Repo configuration regression guards — rules, gitignore, html, literals. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('firestore.rules', () => {
  const rules = read('firestore.rules');
  test('no allow-all rules', () => {
    assert.ok(!/allow\s+read,\s*write:\s*if\s+true/.test(rules), 'open rules must never return');
  });
  test('default deny present', () => {
    assert.ok(rules.includes('allow read, write: if false'), 'catch-all deny required');
  });
  test('commercial collections are admin-only', () => {
    for (const col of ['invoices', 'bankGuarantees', 'dlpRecords', 'retentionRecords', 'companies']) {
      const re = new RegExp(`match /${col}/\\{docId\\}\\s*\\{\\s*allow read, write: if isAdmin\\(\\);`);
      assert.ok(re.test(rules), `${col} must be admin-only`);
    }
  });
  test('approved user requirement on shared workspace data', () => {
    for (const col of ['projects', 'tasks', 'milestones', 'issues']) {
      assert.ok(rules.includes(`match /${col}/{docId}`), `${col} rule missing`);
    }
    assert.ok(/match \/tasks\/\{docId\}\s*\{\s*allow read, write: if isApprovedUser\(\);/.test(rules));
  });
  test('users self-signup guard requires own uid + pending state', () => {
    assert.ok(rules.includes('request.auth.uid == userId'));
    assert.ok(rules.includes('request.resource.data.isActive == false'));
  });
  test('audit_logs deny client writes', () => {
    assert.ok(/match \/audit_logs\/\{docId\}[\s\S]*?allow write: if false;/.test(rules));
  });
});

describe('.gitignore', () => {
  const gi = read('.gitignore');
  test('ignores secrets and dependencies', () => {
    for (const pat of ['node_modules/', 'service-account.json', '.env', '_backups/', '.DS_Store']) {
      assert.ok(gi.includes(pat), `.gitignore must cover ${pat}`);
    }
  });
});

describe('index.html', () => {
  const html = read('index.html');
  test('pinch-zoom not blocked (a11y)', () => {
    assert.ok(!html.includes('user-scalable=no'));
    assert.ok(!html.includes('maximum-scale=1.0'));
  });
  test('every first-party script has a cache-bust token', () => {
    const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
    assert.ok(scripts.length >= 25, `expected many scripts, got ${scripts.length}`);
    for (const s of scripts) {
      assert.ok(s.includes('?v='), `${s} missing cache-bust`);
    }
  });
  test('unified cache-bust token across files', () => {
    const tokens = new Set([...html.matchAll(/\?v=(pmo\d+)/g)].map(m => m[1]));
    assert.strictEqual(tokens.size, 1, 'all assets should share one version token');
  });
});

describe('secret regression sweep (first-party code)', () => {
  const targets = [];
  // NB: tests/ is deliberately excluded — the regression tests themselves
  // reference the literals in order to assert their absence.
  for (const dir of ['js']) {
    const walk = (d) => {
      for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.js')) targets.push(p);
      }
    };
    walk(dir);
  }
  for (const f of ['make-admin.js', 'wipe-db.js', 'check-db.js', 'firebase-seed.js', 'cleanup-seed-billing.js', 'index.html']) {
    targets.push(f);
  }
  test('no hardcoded passwords in any first-party file', () => {
    for (const t of targets) {
      const src = read(t);
      for (const lit of ['Mohit@123', 'admin@123', 'Preet@123', 'Hirvi@123', 'user@123']) {
        assert.ok(!src.includes(lit), `${t} contains password literal ${lit}`);
      }
    }
  });
  test('no absolute service-account key paths in scripts', () => {
    for (const t of ['make-admin.js', 'wipe-db.js', 'check-db.js', 'firebase-seed.js', 'cleanup-seed-billing.js']) {
      assert.ok(!read(t).includes('/Users/mohitjain/Desktop/hintonn-pmo-firebase'), `${t} hardcodes a key path`);
    }
  });
});

describe('package.json', () => {
  const pkg = JSON.parse(read('package.json'));
  test('wired scripts', () => {
    assert.match(pkg.scripts.test, /^node --test/);
    assert.ok(pkg.scripts.lint);
  });
  test('eslint present as devDependency', () => {
    assert.ok(pkg.devDependencies && pkg.devDependencies.eslint);
  });
});
