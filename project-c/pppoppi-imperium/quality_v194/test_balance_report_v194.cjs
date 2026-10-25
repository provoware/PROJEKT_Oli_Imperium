'use strict';
// BAL-02: Nur die technische Langzeit-Abdeckung, keine Aussage zu Spielspass.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const reportPath = path.join(__dirname, '..', 'SPIEL', 'evidence_v194', 'BALANCE_V194.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const cases = ['passive_normal', 'active_normal', 'active_low_demand', 'active_low_price'];
assert.equal(report.version, '1.9.4');
assert.match(report.source, /actual V1\.9\.3 game engine/);
assert.equal(report.results.length, cases.length);

let months = 0;
for (const [index, result] of report.results.entries()) {
  assert.equal(result.name, cases[index]);
  assert.equal(result.passed, true);
  assert.equal(result.months, 36);
  months += result.months;
  assert.equal(result.annual.length, 3);
  for (const [year, snapshot] of result.annual.entries()) {
    assert.equal(snapshot.month, (year + 1) * 12);
    assert.equal(snapshot.firms.length, 4);
    for (const company of snapshot.firms) {
      assert.ok(Number.isSafeInteger(company.cashCent) && company.cashCent >= 0);
      assert.ok(Number.isSafeInteger(company.debtCent) && company.debtCent >= 0);
      assert.ok(Number.isSafeInteger(company.fields) && company.fields >= 0);
      assert.ok(Number.isSafeInteger(company.rescues) && company.rescues >= 0);
    }
  }
  assert.deepEqual(result.final, result.annual.at(-1).firms);
  assert.ok(result.metrics.strategicDecisions > 0);
  assert.ok(result.metrics.logisticDecisions > 0);
}
assert.equal(months, 144);
console.log('PASS BAL-02: 4/4 Balance-Szenarien, 144 Monate, 12 Jahresbelege');
