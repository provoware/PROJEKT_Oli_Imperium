'use strict';
// BAL-01: test-only monthly AI turn rotation. Never changes the protected game.
const assert = require('node:assert/strict');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const E = globalThis.OliV082;
const IDS = Object.freeze(['A1', 'A2', 'A3']);
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const SEED = 'ROTATION-CONTROL';
const clone = x => JSON.parse(JSON.stringify(x));

function orderFor(offset, direction, month) {
  assert.ok(Number.isInteger(offset) && offset >= 0 && offset < 3, 'offset');
  assert.ok([-1, 0, 1].includes(direction), 'direction');
  assert.ok(Number.isInteger(month) && month >= 1, 'month');
  const shift = ((offset + direction * (month - 1)) % 3 + 3) % 3;
  return IDS.map((_, i) => IDS[(i + shift) % 3]);
}
function fieldMetrics(firms) {
  assert.equal(firms.length, 3, 'three AI firms');
  assert.deepEqual([...firms.map(f => f.id)].sort(), [...IDS]);
  const fields = firms.map(f => f.finalFields);
  const liquid = firms.map(f => f.liquidNetChangeCent);
  for (const value of [...fields, ...liquid]) assert.ok(Number.isSafeInteger(value), 'unsafe metric');
  assert.ok(fields.every(x => x >= 0), 'negative field count');
  return {
    totalFields: fields.reduce((a, b) => a + b, 0),
    minimumFields: Math.min(...fields),
    maximumFields: Math.max(...fields),
    fieldRange: Math.max(...fields) - Math.min(...fields),
    zeroFieldFirms: fields.filter(x => x === 0).length,
    totalLiquidNetChangeCent: liquid.reduce((a, b) => a + b, 0),
    minimumLiquidNetChangeCent: Math.min(...liquid)
  };
}
function controlledRun(scenario, offset, direction) {
  const originalFresh = E.fresh, originalTransition = E.transition;
  let freshCalls = 0, monthTransitions = 0;
  try {
    E.fresh = function(options) {
      const state = originalFresh(options);
      assert.ok(options.seed.startsWith('BAL01-' + SEED + '-'), 'unexpected seed');
      assert.equal(state.phase, 'TURN');
      assert.equal(state.turnIndex, 0);
      assert.deepEqual(state.companies.map(f => f.id), ['H1', ...IDS]);
      const before = clone(state);
      const order = orderFor(offset, direction, 1);
      state.companies = [state.companies[0], ...order.map(id =>
        state.companies.find(f => f.id === id))];
      const normalized = clone(state);
      normalized.companies.sort((a, b) => a.id.localeCompare(b.id));
      before.companies.sort((a, b) => a.id.localeCompare(b.id));
      assert.deepEqual(normalized, before, 'initial state changed beyond company order');
      E.validate(state);
      freshCalls++;
      return state;
    };
    E.transition = function(input, command) {
      const out = originalTransition(input, command);
      if (command.type === 'NEXT_MONTH' && !out.duplicate) {
        assert.equal(out.state.month, input.month + 1, 'month advance');
        assert.equal(out.state.phase, 'TURN');
        assert.equal(out.state.turnIndex, 0);
        const before = clone(out.state);
        const order = orderFor(offset, direction, out.state.month);
        out.state.companies = [out.state.companies.find(f => f.id === 'H1'),
          ...order.map(id => out.state.companies.find(f => f.id === id))];
        const normalized = clone(out.state);
        normalized.companies.sort((a, b) => a.id.localeCompare(b.id));
        before.companies.sort((a, b) => a.id.localeCompare(b.id));
        assert.deepEqual(normalized, before, 'month rotation changed economic state');
        E.validate(out.state);
        monthTransitions++;
      }
      return out;
    };
    const result = run(SEED, scenario);
    assert.equal(freshCalls, 1, 'expected one fresh game');
    assert.equal(monthTransitions, MONTHS, 'every month must rotate exactly once');
    return result;
  } finally {
    E.fresh = originalFresh;
    E.transition = originalTransition;
  }
}
function execute() {
  assert.equal(CASES.length, 2);
  const originalFresh = E.fresh, originalTransition = E.transition;
  const rows = [], comparisons = [];
  let campaigns = 0;
  try {
    for (const scenario of CASES) {
      const baseline = run(SEED, scenario);
      campaigns++;
      for (let offset = 0; offset < 3; offset++) {
        const fixed = controlledRun(scenario, offset, 0);
        assert.deepEqual(controlledRun(scenario, offset, 0), fixed, 'fixed-order repeat');
        campaigns += 2;
        if (offset === 0) assert.deepEqual(fixed, baseline, 'original-order parity');
        rows.push({ scenario: scenario.name, initialOrder: orderFor(offset, 0, 1),
          direction: 0, firms: fixed.firms, metrics: fieldMetrics(fixed.firms) });
        for (const direction of [-1, 1]) {
          const rotated = controlledRun(scenario, offset, direction);
          assert.deepEqual(controlledRun(scenario, offset, direction), rotated,
            'rotation repeat mismatch');
          campaigns += 2;
          const metrics = fieldMetrics(rotated.firms);
          rows.push({ scenario: scenario.name, initialOrder: orderFor(offset, direction, 1),
            direction, firms: rotated.firms, metrics });
          const baseMetrics = fieldMetrics(fixed.firms);
          for (const id of IDS) {
            const a = fixed.firms.find(f => f.id === id);
            const b = rotated.firms.find(f => f.id === id);
            comparisons.push({
              scenario: scenario.name, initialOffset: offset, direction, companyId: id,
              fixedFields: a.finalFields, rotatedFields: b.finalFields,
              deltaFields: b.finalFields - a.finalFields,
              deltaLiquidNetCent: b.liquidNetChangeCent - a.liquidNetChangeCent,
              deltaStrategicActions: b.strategicDecisions - a.strategicDecisions,
              deltaLogisticsActions: b.logisticsDecisions - a.logisticsDecisions,
              deltaDebtCent: b.finalDebtCent - a.finalDebtCent,
              fixedZeroFieldFirms: baseMetrics.zeroFieldFirms,
              rotatedZeroFieldFirms: metrics.zeroFieldFirms,
              deltaTotalLiquidNetCent: metrics.totalLiquidNetChangeCent -
                baseMetrics.totalLiquidNetChangeCent
            });
          }
        }
      }
    }
    assert.equal(rows.length, 18);
    assert.equal(comparisons.length, 36);
    assert.equal(campaigns, 38);
    return {
      schema: 'pppoppi.ai-monthly-turn-rotation/1',
      scope: 'Controlled test-only company ordering, never a production gameplay change',
      scenarios: CASES.map(x => x.name), initialOffsets: 3, directions: [-1, 1],
      fixedControls: 6, rotationVariants: 12, repeatedCampaigns: 36,
      originalControls: 2, totalCampaigns: campaigns,
      monthsPerCampaign: MONTHS, totalSimulatedMonths: campaigns * MONTHS,
      caveats: [
        'Company order is changed only in cloned test states at the start of each month.',
        'The human always moves first; strategic and logistics order rotate together.',
        'This test measures field distribution and liquid net position, not profit or asset value.',
        'A first-month field advantage can persist even when later months rotate.',
        'Deterministic scripted markets are not independent random samples.',
        'No historical C64 equivalence, legal rights clearance or release approval.'
      ],
      rows, comparisons, prereleaseGate: 'BLOCKED'
    };
  } finally {
    E.fresh = originalFresh;
    E.transition = originalTransition;
    assert.strictEqual(E.fresh, originalFresh);
    assert.strictEqual(E.transition, originalTransition);
  }
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { orderFor, fieldMetrics, controlledRun, execute };
