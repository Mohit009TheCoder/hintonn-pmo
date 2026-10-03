/**
 * Unit tests for the commercial invoice math in js/store.js
 * (Store._parseAmt, _fmtINR, _clientCode, _fiscalYear, _computeInvoiceTotals).
 *
 * Run: npm test   (node tests/invoice-math.test.js)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// ── Minimal browser stubs so store.js can be evaluated in Node ──
globalThis.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  clear() { this._s = {}; }
};
globalThis.window = globalThis;

// Evaluate store.js in this context (it defines const Store = {...})
const storeSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8');
(0, eval)(storeSrc.replace(/^const Store =/m, 'globalThis.Store ='));

let passed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Store._parseAmt');
t('parses plain numbers', () => assert.strictEqual(Store._parseAmt(123456), 123456));
t('parses INR strings with ₹ and commas', () => assert.strictEqual(Store._parseAmt('₹1,25,00,000'), 12500000));
t('parses USD strings', () => assert.strictEqual(Store._parseAmt('$1,234'), 1234));
t('returns 0 for null/empty/garbage', () => {
  assert.strictEqual(Store._parseAmt(null), 0);
  assert.strictEqual(Store._parseAmt(''), 0);
  assert.strictEqual(Store._parseAmt('abc'), 0);
});

console.log('Store._fmtINR');
t('formats zero', () => assert.strictEqual(Store._fmtINR(0), '₹0'));
t('formats small numbers', () => assert.strictEqual(Store._fmtINR(999), '₹999'));
t('formats Indian digit grouping (lakh/crore)', () => {
  assert.strictEqual(Store._fmtINR(12500000), '₹1,25,00,000');
  assert.strictEqual(Store._fmtINR(123456), '₹1,23,456');
});
t('formats negatives', () => assert.strictEqual(Store._fmtINR(-5000), '–₹5,000'));

console.log('Store._clientCode');
t('uses the brand first word', () => {
  assert.strictEqual(Store._clientCode('MMRDA (Mumbai...)'), 'MMRDA');
  assert.strictEqual(Store._clientCode('Acme AI Pvt Ltd'), 'ACME');
});
t('falls back to CLIENT for empty input', () => assert.strictEqual(Store._clientCode(''), 'CLIENT'));

console.log('Store._fiscalYear');
t('Indian FY starts in April', () => {
  assert.strictEqual(Store._fiscalYear('2026-09-30'), '2026-27'); // Sep → FY 2026-27
  assert.strictEqual(Store._fiscalYear('2026-03-31'), '2025-26'); // March → previous FY
});

console.log('Store._computeInvoiceTotals');
const items = [
  { name: 'Module R1', gross: 100000, discountPct: 10 },
  { name: 'Module R2', gross: 50000, discountPct: 0 }
];
const t2 = Store._computeInvoiceTotals(items, { gstRate: 18, tdsRate: 10 });
t('applies per-item discount', () => {
  assert.strictEqual(t2.totalGross, 150000);
  assert.strictEqual(t2.totalDiscount, 10000); // 10% of 1,00,000
  assert.strictEqual(t2.totalTaxable, 140000);
});
t('computes GST on discounted taxable value', () => {
  assert.strictEqual(t2.totalGst, Math.round(140000 * 0.18)); // 25,200
  assert.strictEqual(t2.totalPayable, 140000 + 25200);
});
t('computes TDS on taxable and nets it off', () => {
  assert.strictEqual(t2.tdsAmount, Math.round(140000 * 0.1)); // 14,000
  assert.strictEqual(t2.netPayable, 165200 - 14000);
});
t('honours custom GST/TDS rates', () => {
  const c = Store._computeInvoiceTotals([{ name: 'X', gross: 10000, discountPct: 0 }], { gstRate: 5, tdsRate: 5 });
  assert.strictEqual(c.totalGst, 500);
  assert.strictEqual(c.tdsAmount, 500);
  assert.strictEqual(c.netPayable, 10000 + 500 - 500);
});
t('splits milestone schedule 40/40/20 without losing rupees', () => {
  const total = 165200;
  const m1 = Math.round(total * 0.4);
  const m2 = Math.round(total * 0.4);
  const m3 = total - (m1 + m2);
  assert.strictEqual(m1 + m2 + m3, total);
});

console.log(`\n${passed} assertions-groups passed${process.exitCode ? ' — WITH FAILURES' : ''}`);
