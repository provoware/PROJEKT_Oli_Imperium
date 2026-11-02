'use strict';
// BAL-01: counterfactual logistics cash reserves. Original game modules stay unchanged.
// One strategy profile, company ID and turn order per company; only reserve thresholds vary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');

const E = globalThis.OliV082;
const IDS = ['A1', 'A2', 'A3'];
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const VARIANTS = [
  { name: 'original', reserves: { A1: 5800000, A2: 3000000, A3: 4000000 } },
  { name: 'rotation_1', reserves: { A1: 3000000, A2: 4000000, A3: 5800000 } },
  { name: 'rotation_2', reserves: { A1: 4000000, A2: 5800000, A3: 3000000 } },
  { name: 'neutral_40k', reserves: { A1: 4000000, A2: 4000000, A3: 4000000 } }
];
const sourcePath = path.join(__dirname, '..', 'SPIEL', 'src', 'strategy_logistics_v193.js');
const ANCHOR = 'const RESERVE={A1:5800000,A2:3000000,A3:4000000};';

function loadLogistics(variant) {
  const original = fs.readFileSync(sourcePath, 'utf8');
  assert.equal(original.split(ANCHOR).length, 2, 'protected logistics source changed');
  assert.deepEqual(Object.keys(variant.reserves).sort(), IDS, 'invalid company IDs');
  for (const value of Object.values(variant.reserves)) {
    assert.ok(Number.isSafeInteger(value) && value >= 0, 'invalid reserve');
  }
  const replacement = 'const RESERVE=' + JSON.stringify(variant.reserves) + ';';
  const sandbox = {
    OliV082: E, PPPublicNetwork: globalThis.PPPublicNetwork,
    PPTransport: globalThis.PPTransport, PPProfi: globalThis.PPProfi,
    PPStrategicAI: globalThis.PPStrategicAI,
    module: { exports: {} }
  };
  const before = E.transition;
  vm.runInNewContext(original.replace(ANCHOR, replacement), sandbox,
    { filename: 'strategy_logistics_v193.js [test-only]', timeout: 2000 });
  assert.notStrictEqual(E.transition, before, 'logistics wrapper not installed');
  assert.ok(sandbox.PPLogisticsAI && sandbox.PPLogisticsAI.enabled === true);
  return sandbox.PPLogisticsAI;
}

function compact(result) {
  return {
    acceptedHumanActions: result.acceptedHumanActions,
    rejectedHumanActions: result.rejectedHumanActions,
    firms: result.firms.map(f => ({
      id: f.id, strategicProfile: globalThis.PPStrategicAI.profile(f.id),
      liquidNetChangeCent: f.liquidNetChangeCent,
      finalCashCent: f.finalCashCent,
      finalDebtCent: f.finalDebtCent,
      maximumDebtCent: f.maximumDebtCent,
      maximumNetDrawdownCent: f.maximumNetDrawdownCent,
      finalFields: f.finalFields,
      rescueCount: f.rescueCount,
      strategicDecisions: f.strategicDecisions,
      logisticsDecisions: f.logisticsDecisions
    }))
  };
}

function execute() {
  assert.equal(CASES.length, 2, 'scenario set changed');
  assert.ok(E && globalThis.PPLogisticsAI && globalThis.PPStrategicAI);
  const baselineTransition = E.transition;
  const baselineLogistics = globalThis.PPLogisticsAI;
  assert.equal(baselineLogistics.enabled, true, 'baseline logistics disabled');
  const rows = [], comparisons = [];
  const seed = 'RESERVE-COUNTERFACTUAL';
  try {
    for (const scenario of CASES) {
      const control = run(seed, scenario);
      for (const variant of VARIANTS) {
        assert.strictEqual(E.transition, baselineTransition, 'transition not restored');
        // The old wrapper must remain inert while the isolated variant is active.
        // Its reference to globalThis.PPLogisticsAI is distinct from the VM sandbox's.
        baselineLogistics.enabled = false;
        try {
          loadLogistics(variant);
          const first = run(seed, scenario);
          const repeat = run(seed, scenario);
          assert.deepEqual(repeat, first, 'non-reproducible: ' + scenario.name + '/' + variant.name);
          if (variant.name === 'original') {
            assert.deepEqual(first, control,
              'in-memory logistics wrapper is not equivalent to unchanged production logic');
          }
          rows.push({
            scenario: scenario.name, variant: variant.name,
            reservesCent: variant.reserves, ...compact(first)
          });
        } finally {
          E.transition = baselineTransition;
          baselineLogistics.enabled = true;
        }
      }
      const original = rows.find(r => r.scenario === scenario.name && r.variant === 'original');
      for (const variant of VARIANTS.slice(1)) {
        const other = rows.find(r => r.scenario === scenario.name && r.variant === variant.name);
        for (const id of IDS) {
          const before = original.firms.find(f => f.id === id);
          const after = other.firms.find(f => f.id === id);
          comparisons.push({
            scenario: scenario.name, variant: variant.name, companyId: id,
            originalReserveCent: original.reservesCent[id],
            alternativeReserveCent: other.reservesCent[id],
            deltaLiquidNetCent: after.liquidNetChangeCent - before.liquidNetChangeCent,
            deltaFields: after.finalFields - before.finalFields,
            deltaStrategicDecisions: after.strategicDecisions - before.strategicDecisions,
            deltaLogisticsDecisions: after.logisticsDecisions - before.logisticsDecisions,
            deltaMaximumDebtCent: after.maximumDebtCent - before.maximumDebtCent
          });
        }
      }
    }
  } finally {
    E.transition = baselineTransition;
    baselineLogistics.enabled = true;
  }
  assert.strictEqual(E.transition, baselineTransition, 'production transition not restored');
  assert.equal(rows.length, 8);
  assert.equal(comparisons.length, 18);
  return {
    schema: 'pppoppi.ai-logistics-reserve/1',
    scope: 'Test-only logistics reserve permutations with fixed company IDs and strategic profiles',
    monthsPerRun: MONTHS, repeatedRuns: rows.length * 2,
    totalSimulatedMonths: rows.length * 2 * MONTHS,
    caveats: [
      'Original logistics and game sources are not edited; reserve changes exist only in an isolated VM wrapper.',
      'Control parity is asserted against unchanged production logic for each scenario.',
      'Company ID, strategic profile and turn order are fixed; competitor responses are downstream effects.',
      'Cash minus debt is not accounting profit or asset value.',
      'Only two scripted-human scenarios; no independent randomized trials, C64 comparison or legal asset clearance.'
    ],
    rows, comparisons, prereleaseGate: 'BLOCKED'
  };
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { execute, VARIANTS, CASES };
