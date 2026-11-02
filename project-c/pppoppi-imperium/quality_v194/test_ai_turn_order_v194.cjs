'use strict';
// BAL-01: controlled order permutation; protected V1.9.3 game files stay read-only.
// This changes the AI company order in isolated freshly-created test states only.
const assert = require('node:assert/strict');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const E = globalThis.OliV082;
const IDS = ['A1', 'A2', 'A3'];
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const ORDERS = [
  ['A1', 'A2', 'A3'], ['A1', 'A3', 'A2'],
  ['A2', 'A1', 'A3'], ['A2', 'A3', 'A1'],
  ['A3', 'A1', 'A2'], ['A3', 'A2', 'A1']
];
const SEED = 'ORDER-CONTROL';
const clone = x => JSON.parse(JSON.stringify(x));

function permutedRun(scenario, order) {
  const originalFresh = E.fresh;
  let freshCalls = 0;
  try {
    E.fresh = function(options) {
      const state = originalFresh(options);
      assert.ok(options.seed.startsWith('BAL01-' + SEED + '-'));
      assert.equal(state.turnIndex, 0, 'human must play first');
      assert.equal(state.companies[0].id, 'H1');
      assert.deepEqual(state.companies.slice(1).map(x => x.id), IDS);
      const initial = clone(state);
      state.companies = [state.companies[0], ...order.map(id =>
        state.companies.find(f => f.id === id))];
      const normalized = clone(state);
      normalized.companies.sort((a, b) => a.id.localeCompare(b.id));
      initial.companies.sort((a, b) => a.id.localeCompare(b.id));
      assert.deepEqual(normalized, initial,
        'only company array order may differ in the initial state');
      assert.deepEqual(state.companies.map(x => x.id), ['H1', ...order]);
      E.validate(state);
      freshCalls++;
      return state;
    };
    const result = run(SEED, scenario);
    assert.equal(freshCalls, 1, 'one new game per campaign');
    return result;
  } finally {
    E.fresh = originalFresh;
  }
}

function execute() {
  assert.equal(CASES.length, 2);
  assert.equal(ORDERS.length, 6);
  assert.equal(new Set(ORDERS.map(o => o.join(','))).size, 6);
  const originalFresh = E.fresh;
  const rows = [];
  const comparisons = [];
  try {
    for (const scenario of CASES) {
      const baseline = run(SEED, scenario);
      for (const order of ORDERS) {
        const first = permutedRun(scenario, order);
        const repeat = permutedRun(scenario, order);
        assert.deepEqual(repeat, first,
          'non-reproducible AI order ' + scenario.name + '/' + order.join(','));
        if (order.join(',') === IDS.join(',')) {
          assert.deepEqual(first, baseline, 'original AI order differs from baseline');
        }
        const firms = IDS.map(id => {
          const firm = first.firms.find(f => f.id === id);
          const control = baseline.firms.find(f => f.id === id);
          assert.ok(firm && control, 'missing AI firm');
          return {
            id, slot: order.indexOf(id) + 1,
            finalFields: firm.finalFields,
            strategicDecisions: firm.strategicDecisions,
            liquidNetChangeCent: firm.liquidNetChangeCent,
            finalDebtCent: firm.finalDebtCent,
            rescueCount: firm.rescueCount,
            deltaNetCent: firm.liquidNetChangeCent - control.liquidNetChangeCent,
            deltaActions: firm.strategicDecisions - control.strategicDecisions
          };
        });
        rows.push({ scenario: scenario.name, order: [...order], firms });
      }
      for (const id of IDS) {
        const subset = rows.filter(r => r.scenario === scenario.name)
          .map(r => r.firms.find(f => f.id === id));
        assert.equal(subset.length, 6);
        comparisons.push({
          scenario: scenario.name, companyId: id,
          distinctStrategicActionCounts: new Set(subset.map(f => f.strategicDecisions)).size,
          distinctLiquidNetOutcomes: new Set(subset.map(f => f.liquidNetChangeCent)).size,
          actionsBySlot: subset.map(f => ({slot: f.slot, actions: f.strategicDecisions,
            fields: f.finalFields, netCent: f.liquidNetChangeCent}))
            .sort((a, b) => a.slot - b.slot)
        });
      }
    }
    assert.equal(rows.length, 12);
    assert.equal(comparisons.length, 6);
    return {
      schema: 'pppoppi.ai-turn-order/1',
      scope: 'Controlled permutation of three AI company slots; unchanged IDs, profiles, seed, game core and initial assets',
      monthsPerRun: MONTHS, scenarios: CASES.map(x => x.name),
      permutations: ORDERS.length, repeatedCampaigns: rows.length * 2,
      baselineCampaigns: CASES.length,
      totalSimulatedMonths: (rows.length * 2 + CASES.length) * MONTHS,
      caveats: [
        'AI strategy and logistics both use company ordering; the test cannot isolate their individual effects.',
        'The scripted human moves before every AI; only relative AI slots change.',
        'Same seed and deterministic start, not independent randomized samples.',
        'Liquid net position is cash minus debt, not profit or total asset value.',
        'No historical C64 evidence, rights clearance, user acceptance or release approval.'
      ],
      rows, comparisons, prereleaseGate: 'BLOCKED'
    };
  } finally {
    E.fresh = originalFresh;
  }
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute, permutedRun };
