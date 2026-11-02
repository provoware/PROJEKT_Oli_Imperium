'use strict';
// BAL-03: Vier reproduzierte Krisenabläufe, inklusive tatsaechlicher Sanierung.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'SPIEL', 'evidence_v193', 'KRISEN_LANGZEIT_V194.json');
const report = JSON.parse(fs.readFileSync(source, 'utf8'));
const expected = [
  ['Basis mit drei KI-Firmen', 48],
  ['Monatlicher Nachfrageeinbruch', 36],
  ['Preisverfall und Ressourcenknappheit', 36],
  ['Erzwungener Forderungsausfall und Sanierung', 36]
];
assert.equal(report.runs.length, expected.length);
let completed = 0;
for (const [index, run] of report.runs.entries()) {
  const [name, months] = expected[index];
  assert.equal(run.scenario, name);
  assert.equal(run.months, months);
  assert.equal(run.completed, months);
  assert.equal(run.valid, true);
  assert.ok(Number.isSafeInteger(run.cashMinCent) && run.cashMinCent >= 0);
  assert.ok(Number.isSafeInteger(run.aiLogisticsActions) && run.aiLogisticsActions >= 0);
  assert.ok(Number.isSafeInteger(run.aiBankruptcies) && run.aiBankruptcies >= 0);
  assert.ok(Number.isSafeInteger(run.humanRescues) && run.humanRescues >= 0);
  completed += run.completed;
}
assert.equal(completed, 156);
assert.equal(report.totalMonths, 156);
assert.ok(report.runs[0].aiLogisticsActions > 0);
assert.ok(report.runs[1].aiLogisticsActions > 0);
assert.ok(report.runs[3].humanRescues > 0, 'Sanierungsfall ohne tatsaechliche Rettung');
console.log('PASS BAL-03: 4/4 Krisen-Szenarien, 156 Monate, Sanierung tatsaechlich durchlaufen');
