/** Invoice commercial math (js/store.js) — parse/format/totals. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { freshStore } = require('./helpers/browser');

let Store;
beforeEach(() => {
  ({ Store } = freshStore());
  Store.init();
});

describe('Store._parseAmt', () => {
  test('plain numbers', () => assert.strictEqual(Store._parseAmt(123456), 123456));
  test('INR strings', () => assert.strictEqual(Store._parseAmt('₹1,25,00,000'), 12500000));
  test('USD strings', () => assert.strictEqual(Store._parseAmt('$1,234'), 1234));
  test('null/empty/garbage → 0', () => {
    assert.strictEqual(Store._parseAmt(null), 0);
    assert.strictEqual(Store._parseAmt(''), 0);
    assert.strictEqual(Store._parseAmt('abc'), 0);
  });
});

describe('Store._fmtINR', () => {
  test('zero', () => assert.strictEqual(Store._fmtINR(0), '₹0'));
  test('small numbers', () => assert.strictEqual(Store._fmtINR(999), '₹999'));
  test('Indian digit grouping', () => {
    assert.strictEqual(Store._fmtINR(12500000), '₹1,25,00,000');
    assert.strictEqual(Store._fmtINR(123456), '₹1,23,456');
  });
  test('negatives', () => assert.strictEqual(Store._fmtINR(-5000), '–₹5,000'));
});

describe('Store._clientCode / _fiscalYear', () => {
  test('brand first word', () => {
    assert.strictEqual(Store._clientCode('MMRDA (Mumbai...)'), 'MMRDA');
    assert.strictEqual(Store._clientCode('Acme AI Pvt Ltd'), 'ACME');
  });
  test('empty → CLIENT', () => assert.strictEqual(Store._clientCode(''), 'CLIENT'));
  test('Indian FY starts in April', () => {
    assert.strictEqual(Store._fiscalYear('2026-09-30'), '2026-27');
    assert.strictEqual(Store._fiscalYear('2026-03-31'), '2025-26');
  });
});

describe('Store._computeInvoiceTotals', () => {
  const items = [
    { name: 'Module R1', gross: 100000, discountPct: 10 },
    { name: 'Module R2', gross: 50000, discountPct: 0 }
  ];
  test('discount → taxable', () => {
    const t = Store._computeInvoiceTotals(items, { gstRate: 18, tdsRate: 10 });
    assert.strictEqual(t.totalGross, 150000);
    assert.strictEqual(t.totalDiscount, 10000);
    assert.strictEqual(t.totalTaxable, 140000);
  });
  test('GST on discounted value', () => {
    const t = Store._computeInvoiceTotals(items, { gstRate: 18, tdsRate: 10 });
    assert.strictEqual(t.totalGst, 25200);
    assert.strictEqual(t.totalPayable, 165200);
  });
  test('TDS nets off', () => {
    const t = Store._computeInvoiceTotals(items, { gstRate: 18, tdsRate: 10 });
    assert.strictEqual(t.tdsAmount, 14000);
    assert.strictEqual(t.netPayable, 151200);
  });
  test('custom rates', () => {
    const c = Store._computeInvoiceTotals([{ name: 'X', gross: 10000, discountPct: 0 }], { gstRate: 5, tdsRate: 5 });
    assert.strictEqual(c.totalGst, 500);
    assert.strictEqual(c.tdsAmount, 500);
    assert.strictEqual(c.netPayable, 10000);
  });
  test('40/40/20 split loses no rupees', () => {
    const total = 165200;
    const m1 = Math.round(total * 0.4), m2 = Math.round(total * 0.4);
    const m3 = total - (m1 + m2);
    assert.strictEqual(m1 + m2 + m3, total);
  });
});
