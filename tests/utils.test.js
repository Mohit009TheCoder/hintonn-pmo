/** Utils (js/app.js) — pure helper functions. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { freshApp } = require('./helpers/browser');

const { Utils } = freshApp();

describe('Utils.escapeHtml', () => {
  test('escapes XSS payload characters', () => {
    const payload = `<img src=x onerror="alert('xss')"> & more`;
    const out = Utils.escapeHtml(payload);
    assert.ok(!out.includes('<'));
    assert.ok(!out.includes('>'));
    assert.ok(!out.includes('"'));
    assert.ok(!out.includes("'"));
    assert.ok(out.includes('&lt;img'));
    assert.ok(out.includes('&amp;'));
  });
  test('handles null/undefined', () => {
    assert.strictEqual(Utils.escapeHtml(null), '');
    assert.strictEqual(Utils.escapeHtml(undefined), '');
  });
  test('non-strings are stringified', () => {
    assert.strictEqual(Utils.escapeHtml(42), '42');
  });
});

describe('Utils.formatDate', () => {
  test('null/invalid → em dash', () => {
    assert.strictEqual(Utils.formatDate(null), '—');
    assert.strictEqual(Utils.formatDate('not-a-date'), '—');
  });
  test('YYYY-MM-DD is parsed as a local date (no timezone shift)', () => {
    const out = Utils.formatDate('2026-01-15');
    assert.strictEqual(out, 'Jan 15, 2026');
  });
  test('Date instances work', () => {
    assert.strictEqual(Utils.formatDate(new Date(2026, 5, 1)), 'Jun 1, 2026');
  });
});

describe('Utils.timeAgo', () => {
  test('recent timestamps', () => {
    assert.strictEqual(Utils.timeAgo(new Date().toISOString()), 'just now');
    const m5 = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    assert.strictEqual(Utils.timeAgo(m5), '5m ago');
    const h2 = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    assert.strictEqual(Utils.timeAgo(h2), '2h ago');
  });
  test('null → em dash', () => {
    assert.strictEqual(Utils.timeAgo(null), '—');
  });
});

describe('Utils.humanize / truncate / isOverdue', () => {
  test('humanize capitalizes dash-separated words', () => {
    assert.strictEqual(Utils.humanize('project-detail'), 'Project Detail');
    assert.strictEqual(Utils.humanize(''), '');
  });
  test('truncate adds ellipsis past the limit', () => {
    assert.strictEqual(Utils.truncate('abcdef', 3), 'abc…');
    assert.strictEqual(Utils.truncate('ab', 3), 'ab');
    assert.strictEqual(Utils.truncate(null, 3), '');
  });
  test('isOverdue: past date true, future false, invalid false', () => {
    assert.strictEqual(Utils.isOverdue('2020-01-01'), true);
    assert.strictEqual(Utils.isOverdue('2999-01-01'), false);
    assert.strictEqual(Utils.isOverdue('garbage'), false);
    assert.strictEqual(Utils.isOverdue(''), false);
  });
});
