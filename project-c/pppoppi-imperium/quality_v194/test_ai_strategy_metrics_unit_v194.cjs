'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { net, summarize, aggregate, SCENARIOS, SEEDS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const point = (cashCent, debtCent = 0) => ({
  cashCent, debtCent, netCent: cashCent - debtCent, fields: 2, rescues: 0
});
test('net liquidity allows debt but rejects invalid cash/debt', () => {
  assert.equal(net(point(0, 3000000)), -3000000);
  assert.throws(() => net({ cashCent: -1, debtCent: 0 }), /cash/);
  assert.throws(() => net({ cashCent: 0, debtCent: 0.5 }), /debt/);
});
test('drawdown uses prior peak; buffer and final change use exact cents', () => {
  const history = Array.from({ length: MONTHS + 1 }, () => point(9000000));
  history[0] = point(10000000);
  history[2] = point(12000000);
  history[3] = point(4000000);
  const result = summarize(history, 'vorsichtig', 4, 2);
  assert.equal(result.startNetCent, 10000000);
  assert.equal(result.finalNetCent, 9000000);
  assert.equal(result.liquidNetChangeCent, -1000000);
  assert.equal(result.maximumNetDrawdownCent, 8000000);
  assert.equal(result.minimumCashCent, 4000000);
  assert.equal(result.monthsBelowProfileBuffer, 1);
  assert.equal(result.strategicDecisions, 4);
  assert.equal(result.logisticsDecisions, 2);
});
test('scenario coverage and incomplete time series are rejected', () => {
  assert.deepEqual(SCENARIOS.map(x => x.name), [
    'passive_normal', 'active_normal', 'active_low_demand', 'active_low_price'
  ]);
  assert.equal(SEEDS.length, 3);
  assert.throws(() => summarize([point(100)], 'vorsichtig', 0, 0), /snapshots/);
});

test('same economic outcome for different seeds is counted once', () => {
  const rows = SCENARIOS.flatMap(scenario => SEEDS.map(seed => ({
    scenario: scenario.name, seed,
    firms: ['A1', 'A2', 'A3'].map(id => ({
      id, liquidNetChangeCent: 100, finalCashCent: 100,
      maximumDebtCent: 0, maximumNetDrawdownCent: 10,
      rescueCount: 0, finalFields: 1, monthsBelowProfileBuffer: 0
    }))
  })));
  assert.equal(aggregate(rows).find(x => x.id === 'A1').distinctFirmOutcomes, 1);
  rows[1].firms[0].liquidNetChangeCent = 101;
  assert.equal(aggregate(rows).find(x => x.id === 'A1').distinctFirmOutcomes, 2);
});
