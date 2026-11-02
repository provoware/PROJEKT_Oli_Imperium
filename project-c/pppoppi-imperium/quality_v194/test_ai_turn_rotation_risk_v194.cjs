'use strict';
// BAL-01: independent accounting/risk cross-check of the existing stress JSON.
// Test-only: does not alter the V1.9.3 game engine or claim historical accuracy.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const IDS = ['A1', 'A2', 'A3'];
const CENT_FIELDS = ['startNetCent', 'finalNetCent', 'finalCashCent',
  'finalDebtCent', 'liquidNetChangeCent', 'maximumNetDrawdownCent'];
const COUNT_FIELDS = ['finalFields', 'rescueCount', 'monthsBelowProfileBuffer'];


function verifyMetrics(row) {
  assert.ok(row && Array.isArray(row.firms) && row.firms.length === 3,
    'exactly three company rows required');
  assert.deepEqual(row.firms.map(x => x.id).sort(), IDS, 'invalid company IDs');
  const fields = row.firms.map(x => x.finalFields);
  const changes = row.firms.map(x => x.liquidNetChangeCent);
  for (const value of [...fields, ...changes])
    assert.ok(Number.isSafeInteger(value), 'unsafe aggregate input');
  assert.ok(fields.every(value => value >= 0), 'negative aggregate field count');
  const expected = {
    totalFields: fields.reduce((a, b) => a + b, 0),
    minimumFields: Math.min(...fields),
    maximumFields: Math.max(...fields),
    fieldRange: Math.max(...fields) - Math.min(...fields),
    zeroFieldFirms: fields.filter(value => value === 0).length,
    totalLiquidNetChangeCent: changes.reduce((a, b) => a + b, 0),
    minimumLiquidNetChangeCent: Math.min(...changes)
  };
  for (const [field, value] of Object.entries(expected))
    assert.equal(row.metrics?.[field], value, 'aggregate metric mismatch: ' + field);
  return expected;
}

function compareFirm(fixed, rotated) {
  assert.equal(fixed.id, rotated.id, 'company ID changed');
  assert.ok(IDS.includes(fixed.id), 'unknown company');
  for (const firm of [fixed, rotated]) {
    for (const key of [...CENT_FIELDS, ...COUNT_FIELDS]) {
      assert.ok(Number.isSafeInteger(firm[key]), 'unsafe or missing ' + key);
    }
    for (const key of ['finalCashCent', 'finalDebtCent', ...COUNT_FIELDS]) {
      assert.ok(firm[key] >= 0, 'negative ' + key);
    }
    assert.equal(firm.finalNetCent, firm.finalCashCent - firm.finalDebtCent,
      'cash minus debt identity');
    assert.equal(firm.liquidNetChangeCent, firm.finalNetCent - firm.startNetCent,
      'net change identity');
  }
  assert.equal(fixed.startNetCent, rotated.startNetCent,
    'different starting liquidity invalidates paired comparison');
  const diff = key => {
    const value = rotated[key] - fixed[key];
    assert.ok(Number.isSafeInteger(value), 'delta overflow: ' + key);
    return value;
  };
  return {
    id: fixed.id,
    deltaFields: diff('finalFields'),
    deltaLiquidNetCent: diff('liquidNetChangeCent'),
    deltaFinalCashCent: diff('finalCashCent'),
    deltaDebtCent: diff('finalDebtCent'),
    deltaRescues: diff('rescueCount'),
    deltaDrawdownCent: diff('maximumNetDrawdownCent'),
    deltaMonthsBelowBuffer: diff('monthsBelowProfileBuffer')
  };
}
function countOutcomes(rows) {
  const count = predicate => rows.filter(predicate).length;
  return {
    comparisons: rows.length,
    moreFields: count(x => x.deltaFields > 0),
    fewerFields: count(x => x.deltaFields < 0),
    worseLiquidity: count(x => x.deltaLiquidNetCent < 0),
    betterLiquidity: count(x => x.deltaLiquidNetCent > 0),
    moreDebt: count(x => x.deltaDebtCent > 0),
    moreRescues: count(x => x.deltaRescues > 0),
    higherDrawdown: count(x => x.deltaDrawdownCent > 0),
    moreMonthsBelowBuffer: count(x => x.deltaMonthsBelowBuffer > 0),
    moreFieldsButWorseLiquidity: count(x => x.deltaFields > 0 && x.deltaLiquidNetCent < 0),
    moreFieldsAndMoreDebt: count(x => x.deltaFields > 0 && x.deltaDebtCent > 0)
  };
}
function analyze(report) {
  assert.equal(report.schema, 'pppoppi.ai-monthly-turn-rotation-stress/1');
  assert.equal(report.prereleaseGate, 'BLOCKED');
  assert.equal(report.rows.length, 18);
  assert.equal(report.comparisons.length, 12);
  assert.equal(report.totalSimulatedMonths, 1368);
  const rows = new Map();
  const key = (scenario, offset, direction) => [scenario, offset, direction].join('|');
  for (const row of report.rows) {
    assert.ok(['active_low_demand', 'passive_normal'].includes(row.scenario), 'unknown scenario');
    assert.ok(Number.isInteger(row.offset) && row.offset >= 0 && row.offset <= 2,
      'invalid starting offset');
    assert.ok([-1, 0, 1].includes(row.direction), 'invalid direction');
    assert.deepEqual(row.order, IDS.map((_, i) => IDS[(i + row.offset) % 3]),
      'incorrect first-month company order');
    verifyMetrics(row);
    const k = key(row.scenario, row.offset, row.direction);
    assert.ok(!rows.has(k), 'duplicate rotation case');
    assert.deepEqual([...row.firms.map(x => x.id)].sort(), IDS, 'missing company');
    rows.set(k, row);
  }
  const results = [];
  const used = new Set();
  for (const item of report.comparisons) {
    const k = key(item.scenario, item.offset, item.direction);
    assert.ok(!used.has(k), 'duplicate paired comparison');
    used.add(k);
    assert.ok([-1, 1].includes(item.direction), 'rotation direction');
    const fixed = rows.get(key(item.scenario, item.offset, 0));
    const rotated = rows.get(k);
    assert.ok(fixed && rotated, 'missing fixed or rotated case');
    assert.equal(item.firms.length, 3);
    assert.deepEqual(item.firms.map(x => x.id).sort(), IDS,
      'duplicate or missing recorded company');
    assert.equal(item.fixedTotalFields, fixed.metrics.totalFields, 'wrong fixed fields');
    assert.equal(item.rotatedTotalFields, rotated.metrics.totalFields, 'wrong rotated fields');
    assert.equal(item.fixedZeroFieldFirms, fixed.metrics.zeroFieldFirms, 'wrong fixed zero count');
    assert.equal(item.rotatedZeroFieldFirms, rotated.metrics.zeroFieldFirms, 'wrong rotated zero count');
    const firms = IDS.map(id => {
      const f = fixed.firms.find(x => x.id === id);
      const r = rotated.firms.find(x => x.id === id);
      const delta = compareFirm(f, r);
      const recorded = item.firms.find(x => x.id === id);
      assert.ok(recorded, 'missing recorded comparison');
      for (const field of ['deltaFields', 'deltaLiquidNetCent', 'deltaDebtCent', 'deltaRescues']) {
        assert.equal(delta[field], recorded[field], 'recorded delta mismatch: ' + field);
      }
      return delta;
    });
    const sum = field => firms.reduce((total, f) => total + f[field], 0);
    assert.equal(sum('deltaFields'), item.deltaTotalFields, 'field sum mismatch');
    assert.equal(sum('deltaLiquidNetCent'), item.deltaTotalLiquidNetCent,
      'liquidity sum mismatch');
    assert.equal(rotated.metrics.totalFields - fixed.metrics.totalFields,
      item.deltaTotalFields, 'field metric mismatch');
    assert.equal(rotated.metrics.totalLiquidNetChangeCent -
      fixed.metrics.totalLiquidNetChangeCent, item.deltaTotalLiquidNetCent,
      'liquidity metric mismatch');
    results.push({ scenario: item.scenario, offset: item.offset,
      direction: item.direction, deltaTotalFields: item.deltaTotalFields,
      deltaTotalLiquidNetCent: item.deltaTotalLiquidNetCent, firms });
  }
  assert.equal(used.size, 12);
  for (const scenario of ['active_low_demand', 'passive_normal']) {
    for (const offset of [0, 1, 2]) {
      for (const direction of [-1, 0, 1])
        assert.ok(rows.has(key(scenario, offset, direction)), 'missing scenario/offset/direction');
    }
  }
  const allFirms = results.flatMap(x => x.firms);
  assert.equal(allFirms.length, 36);
  const scenarios = [...new Set(results.map(x => x.scenario))].sort();
  assert.deepEqual(scenarios, ['active_low_demand', 'passive_normal']);
  const perScenario = scenarios.map(scenario => {
    const subset = results.filter(x => x.scenario === scenario);
    assert.equal(subset.length, 6, 'six paired cases per market');
    return { scenario, ...countOutcomes(subset.flatMap(x => x.firms)),
      totalLiquidityImproved: subset.filter(x => x.deltaTotalLiquidNetCent > 0).length,
      totalLiquidityWorsened: subset.filter(x => x.deltaTotalLiquidNetCent < 0).length };
  });
  return {
    schema: 'pppoppi.ai-monthly-turn-rotation-risk/1',
    sourceSchema: report.schema,
    checkedPairs: results.length,
    checkedCompanyComparisons: allFirms.length,
    accountingIdentitiesChecked: 4 * allFirms.length,
    aggregate: countOutcomes(allFirms), perScenario, results,
    caveats: [
      'The paired cash-minus-debt metric is NOT accounting profit or asset value.',
      'The 12 paired cases share deterministic market assumptions; not random samples.',
      'More fields can coincide with lower liquidity, greater debt or greater drawdown.',
      'The original engine and game rules remain unchanged.',
      'This diagnostic does not clear BAL-01 or authorize a release.'
    ],
    prereleaseGate: 'BLOCKED'
  };
}
if (require.main === module) {
  assert.equal(process.argv.length, 3, 'usage: node test_ai_turn_rotation_risk_v194.cjs ai_turn_rotation_stress.json');
  const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(analyze(report), null, 2));
}
module.exports = { compareFirm, countOutcomes, verifyMetrics, analyze };
