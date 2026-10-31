'use strict';
// BAL-01: separate strategic turn order from logistics preparation order.
// The 110 protected source files remain untouched; only an isolated VM copy
// of the logistics adapter has its AI iteration order changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const { permutedRun } = require('./test_ai_turn_order_v194.cjs');
const E = globalThis.OliV082;
const IDS = ['A1', 'A2', 'A3'];
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const ORDERS = [
  ['A1', 'A2', 'A3'], ['A1', 'A3', 'A2'], ['A2', 'A1', 'A3'],
  ['A2', 'A3', 'A1'], ['A3', 'A1', 'A2'], ['A3', 'A2', 'A1']
];
const SEED = 'ORDER-CONTROL';
const sourcePath = path.join(__dirname, '..', 'SPIEL', 'src', 'strategy_logistics_v193.js');
const ANCHOR = "for(const company of work.companies.filter(x=>x.type==='ai')){";
const clone = x => JSON.parse(JSON.stringify(x));

function assertOrder(order) {
  assert.deepEqual([...order].sort(), IDS);
  assert.equal(new Set(order).size, IDS.length);
}
function isolatedRun(scenario, strategyOrder, logisticsOrder) {
  assertOrder(strategyOrder);
  assertOrder(logisticsOrder);
  const originalTransition = E.transition;
  const originalFresh = E.fresh;
  const originalLogistics = globalThis.PPLogisticsAI;
  assert.ok(originalLogistics && originalLogistics.enabled === true);
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.equal(source.split(ANCHOR).length, 2,
    'protected logistics iteration anchor changed');
  const orderLiteral = JSON.stringify(logisticsOrder);
  const replacement = "for(const company of work.companies.filter(x=>x.type==='ai')" +
    ".sort((a,b)=>" + orderLiteral + ".indexOf(a.id)-" +
    orderLiteral + ".indexOf(b.id))){";
  const sandbox = {
    OliV082: E, PPPublicNetwork: globalThis.PPPublicNetwork,
    PPTransport: globalThis.PPTransport, PPProfi: globalThis.PPProfi,
    PPStrategicAI: globalThis.PPStrategicAI,
    module: { exports: {} }
  };
  let freshCalls = 0;
  try {
    E.fresh = function(options) {
      const state = originalFresh(options);
      assert.equal(state.turnIndex, 0);
      assert.deepEqual(state.companies.map(f => f.id), ['H1', ...IDS]);
      const initial = clone(state);
      state.companies = [state.companies[0],
        ...strategyOrder.map(id => state.companies.find(f => f.id === id))];
      const normalized = clone(state);
      normalized.companies.sort((a, b) => a.id.localeCompare(b.id));
      initial.companies.sort((a, b) => a.id.localeCompare(b.id));
      assert.deepEqual(normalized, initial,
        'only the strategic company iteration order may change');
      E.validate(state);
      freshCalls++;
      return state;
    };
    // The original wrapper is kept in the call chain, but disabled.
    // The VM wrapper uses its own sandbox-local PPLogisticsAI switch.
    originalLogistics.enabled = false;
    vm.runInNewContext(source.replace(ANCHOR, replacement), sandbox,
      { filename: 'strategy_logistics_v193.js [test-only order]', timeout: 2000 });
    assert.ok(sandbox.PPLogisticsAI?.enabled === true);
    assert.notStrictEqual(E.transition, originalTransition);
    const result = run(SEED, scenario);
    assert.equal(freshCalls, 1, 'expected exactly one new game');
    return result;
  } finally {
    E.transition = originalTransition;
    E.fresh = originalFresh;
    originalLogistics.enabled = true;
  }
}
function compact(result) {
  return result.firms.map(f => ({
    id: f.id, strategicDecisions: f.strategicDecisions,
    logisticsDecisions: f.logisticsDecisions, finalFields: f.finalFields,
    liquidNetChangeCent: f.liquidNetChangeCent,
    finalDebtCent: f.finalDebtCent, rescueCount: f.rescueCount
  }));
}
function execute() {
  assert.equal(CASES.length, 2);
  assert.equal(ORDERS.length, 6);
  assert.equal(new Set(ORDERS.map(x => x.join(','))).size, 6);
  const originalTransition = E.transition;
  const originalFresh = E.fresh;
  const originalLogistics = globalThis.PPLogisticsAI;
  const rows = [], comparisons = [];
  let campaigns = 0;
  try {
    for (const scenario of CASES) {
      const baseline = run(SEED, scenario);
      campaigns++;
      for (const strategyOrder of ORDERS) {
        const matchedControl = permutedRun(scenario, strategyOrder);
        campaigns++;
        const cases = [];
        for (const logisticsOrder of [IDS, strategyOrder]) {
          const first = isolatedRun(scenario, strategyOrder, logisticsOrder);
          const repeat = isolatedRun(scenario, strategyOrder, logisticsOrder);
          campaigns += 2;
          assert.deepEqual(repeat, first, 'non-deterministic isolated order');
          if (logisticsOrder.join(',') === strategyOrder.join(',')) {
            assert.deepEqual(first, matchedControl,
              'VM wrapper with matched order differs from protected original');
          }
          if (strategyOrder.join(',') === IDS.join(',') &&
              logisticsOrder.join(',') === IDS.join(',')) {
            assert.deepEqual(first, baseline, 'unchanged baseline differs');
          }
          const entry = {
            scenario: scenario.name,
            strategicOrder: [...strategyOrder],
            logisticsOrder: [...logisticsOrder],
            firms: compact(first)
          };
          rows.push(entry);
          cases.push(entry);
        }
        const fixed = cases[0], matched = cases[1];
        for (const id of IDS) {
          const a = fixed.firms.find(f => f.id === id);
          const b = matched.firms.find(f => f.id === id);
          comparisons.push({
            scenario: scenario.name, strategicOrder: [...strategyOrder], companyId: id,
            fixedLogisticsOrder: [...IDS], matchedLogisticsOrder: [...strategyOrder],
            deltaStrategicDecisions: b.strategicDecisions - a.strategicDecisions,
            deltaLogisticsDecisions: b.logisticsDecisions - a.logisticsDecisions,
            deltaFields: b.finalFields - a.finalFields,
            deltaLiquidNetCent: b.liquidNetChangeCent - a.liquidNetChangeCent,
            deltaDebtCent: b.finalDebtCent - a.finalDebtCent
          });
        }
      }
    }
    assert.equal(rows.length, 24);
    assert.equal(comparisons.length, 36);
    assert.equal(campaigns, 62);
    assert.ok(comparisons.filter(x => x.strategicOrder.join(',') === IDS.join(','))
      .every(x => x.deltaStrategicDecisions === 0 &&
        x.deltaLogisticsDecisions === 0 && x.deltaLiquidNetCent === 0),
      'identical strategic/logistics order must be unchanged');
    return {
      schema: 'pppoppi.ai-order-isolation/1',
      scope: 'Fixed strategic order vs fixed/matched logistics order; same company identities and seed',
      scenarios: CASES.map(x => x.name), strategyOrders: ORDERS.length,
      logisticsConfigurationsPerStrategy: 2,
      repeatedIsolatedCampaigns: rows.length * 2,
      protectedMatchedControls: CASES.length * ORDERS.length,
      originalControls: CASES.length, totalCampaigns: campaigns,
      monthsPerCampaign: MONTHS, totalSimulatedMonths: campaigns * MONTHS,
      caveats: [
        'Logistics order is modified only in a VM-loaded copy; original sources are unchanged.',
        'Matched-order parity is checked against the unchanged original adapter for every permutation.',
        'Strategy ordering is held constant within each fixed-vs-matched logistics comparison.',
        'The human player always acts first; deterministic worlds are not independent samples.',
        'Cash minus debt is not profit or enterprise value; no C64, rights or user acceptance claim.'
      ],
      rows, comparisons, prereleaseGate: 'BLOCKED'
    };
  } finally {
    E.transition = originalTransition;
    E.fresh = originalFresh;
    originalLogistics.enabled = true;
    assert.strictEqual(E.transition, originalTransition);
    assert.strictEqual(E.fresh, originalFresh);
  }
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute, isolatedRun };
