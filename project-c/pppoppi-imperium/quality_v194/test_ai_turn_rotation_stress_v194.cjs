'use strict';
// BAL-01: independent market stress test for monthly AI turn rotation.
// Test-only adapters. No change to game rules or protected source files.
const assert = require('node:assert/strict');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');
const { controlledRun, orderFor, fieldMetrics } = require('./test_ai_turn_rotation_v194.cjs');

const CASES = SCENARIOS.filter(s => ['passive_normal', 'active_low_demand'].includes(s.name));
const IDS = ['A1', 'A2', 'A3'];
const SEED = 'ROTATION-CONTROL';

function execute() {
  assert.equal(CASES.length, 2, 'two independent market conditions');
  const rows = [], comparisons = [];
  let campaigns = 0, exactRepeats = 0;
  for (const scenario of CASES) {
    const baseline = run(SEED, scenario);
    campaigns++;
    for (let offset = 0; offset < 3; offset++) {
      const fixed = controlledRun(scenario, offset, 0);
      assert.deepEqual(controlledRun(scenario, offset, 0), fixed,
        'fixed order is not deterministic');
      campaigns += 2;
      exactRepeats++;
      if (offset === 0) assert.deepEqual(fixed, baseline,
        'test adapter must reproduce original engine exactly');
      const fixedMetrics = fieldMetrics(fixed.firms);
      rows.push({ scenario: scenario.name, offset, direction: 0,
        order: orderFor(offset, 0, 1), firms: fixed.firms, metrics: fixedMetrics });
      for (const direction of [-1, 1]) {
        const rotated = controlledRun(scenario, offset, direction);
        assert.deepEqual(controlledRun(scenario, offset, direction), rotated,
          'rotated order is not deterministic');
        campaigns += 2;
        exactRepeats++;
        const metrics = fieldMetrics(rotated.firms);
        rows.push({ scenario: scenario.name, offset, direction,
          order: orderFor(offset, direction, 1), firms: rotated.firms, metrics });
        const byId = id => {
          const a = fixed.firms.find(f => f.id === id);
          const b = rotated.firms.find(f => f.id === id);
          assert.ok(a && b, 'missing AI company');
          return { id, deltaFields: b.finalFields - a.finalFields,
            deltaLiquidNetCent: b.liquidNetChangeCent - a.liquidNetChangeCent,
            deltaDebtCent: b.finalDebtCent - a.finalDebtCent,
            deltaRescues: b.rescueCount - a.rescueCount };
        };
        comparisons.push({ scenario: scenario.name, offset, direction,
          fixedTotalFields: fixedMetrics.totalFields,
          rotatedTotalFields: metrics.totalFields,
          deltaTotalFields: metrics.totalFields - fixedMetrics.totalFields,
          fixedZeroFieldFirms: fixedMetrics.zeroFieldFirms,
          rotatedZeroFieldFirms: metrics.zeroFieldFirms,
          deltaTotalLiquidNetCent: metrics.totalLiquidNetChangeCent -
            fixedMetrics.totalLiquidNetChangeCent,
          firms: IDS.map(byId) });
      }
    }
  }
  assert.equal(rows.length, 18);
  assert.equal(comparisons.length, 12);
  assert.equal(comparisons.flatMap(x => x.firms).length, 36);
  assert.equal(exactRepeats, 18);
  assert.equal(campaigns, 38);
  assert.equal(MONTHS, 36);
  return {
    schema: 'pppoppi.ai-monthly-turn-rotation-stress/1',
    scope: 'Passive human and low-demand market; unchanged V1.9.3 engine',
    scenarios: CASES.map(x => x.name),
    fixedControls: 6, rotationVariants: 12, exactRepeats,
    originalControls: 2, totalCampaigns: campaigns,
    monthsPerCampaign: MONTHS, totalSimulatedMonths: campaigns * MONTHS,
    aggregate: {
      moreFields: comparisons.filter(x => x.deltaTotalFields > 0).length,
      equalFields: comparisons.filter(x => x.deltaTotalFields === 0).length,
      fewerFields: comparisons.filter(x => x.deltaTotalFields < 0).length,
      moreLiquidNet: comparisons.filter(x => x.deltaTotalLiquidNetCent > 0).length,
      equalLiquidNet: comparisons.filter(x => x.deltaTotalLiquidNetCent === 0).length,
      lessLiquidNet: comparisons.filter(x => x.deltaTotalLiquidNetCent < 0).length,
      fewerZeroFieldFirms: comparisons.filter(x =>
        x.rotatedZeroFieldFirms < x.fixedZeroFieldFirms).length
    },
    caveats: [
      'Two additional deterministic markets, not independent random samples.',
      'Monthly strategic and logistics order rotate together.',
      'Human always moves first; starting order can establish a lasting advantage.',
      'Cash minus debt is not accounting profit or total asset value.',
      'Passing invariants does not prove that rotation improves every firm or market.',
      'No C64 historical equivalence, rights clearance or release approval.'
    ],
    rows, comparisons, prereleaseGate: 'BLOCKED'
  };
}

if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute };
