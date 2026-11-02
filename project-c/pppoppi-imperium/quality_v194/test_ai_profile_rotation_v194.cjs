'use strict';
// BAL-01: isolated diagnostic of strategic planner profile mapping by fixed AI company ID.
// Original game files are read only. This is NOT a full profile-fairness or profit test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { run, SCENARIOS, MONTHS } = require('./test_ai_strategy_metrics_v194.cjs');

const IDS = ['A1', 'A2', 'A3'];
const PROFILES = ['vorsichtig', 'wachstumsorientiert', 'handelsorientiert'];
const VARIANTS = [
  { name: 'original', profiles: ['vorsichtig', 'wachstumsorientiert', 'handelsorientiert'] },
  { name: 'rotation_1', profiles: ['wachstumsorientiert', 'handelsorientiert', 'vorsichtig'] },
  { name: 'rotation_2', profiles: ['handelsorientiert', 'vorsichtig', 'wachstumsorientiert'] }
];
const CASES = SCENARIOS.filter(s => ['active_normal', 'active_low_price'].includes(s.name));
const sourcePath = path.join(__dirname, '..', 'SPIEL', 'src', 'strategy_ai_v192.js');
const ANCHOR = "const profiles=Object.freeze({A1:'vorsichtig',A2:'wachstumsorientiert',A3:'handelsorientiert',A4:'ausgewogen'});";

function profileMap(variant) {
  assert.equal(variant.profiles.length, IDS.length, 'three profiles required');
  assert.deepEqual([...variant.profiles].sort(), [...PROFILES].sort(), 'invalid profile permutation');
  return Object.fromEntries([...IDS.map((id, i) => [id, variant.profiles[i]]), ['A4', 'ausgewogen']]);
}

function loadPlanner(variant) {
  const original = fs.readFileSync(sourcePath, 'utf8');
  assert.equal(original.split(ANCHOR).length, 2, 'protected AI source profile anchor changed');
  const mapping = profileMap(variant);
  const changed = original.replace(ANCHOR, 'const profiles=Object.freeze(' + JSON.stringify(mapping) + ');');
  const sandbox = { OliV082: globalThis.OliV082, module: { exports: {} } };
  vm.runInNewContext(changed, sandbox, { filename: 'strategy_ai_v192.js [test-only]', timeout: 2000 });
  const planner = sandbox.module.exports;
  assert.ok(planner && planner.ready() && typeof planner.rank === 'function', 'planner did not initialize');
  for (const id of IDS) assert.equal(planner.profile(id), mapping[id], 'profile mapping mismatch');
  return planner;
}

function project(row, planner) {
  return {
    acceptedHumanActions: row.acceptedHumanActions,
    rejectedHumanActions: row.rejectedHumanActions,
    firms: row.firms.map(f => ({
      id: f.id, assignedStrategicProfile: planner.profile(f.id),
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
  assert.equal(CASES.length, 2, 'controlled scenario set changed');
  const originalPlanner = globalThis.PPStrategicAI;
  assert.ok(originalPlanner && originalPlanner.ready(), 'baseline planner unavailable');
  const rows = [];
  try {
    for (const scenario of CASES) {
      for (const variant of VARIANTS) {
        const planner = loadPlanner(variant);
        globalThis.PPStrategicAI = planner;
        const first = run('BAL01-PROFILE-ROTATION', scenario);
        const repeat = run('BAL01-PROFILE-ROTATION', scenario);
        assert.deepEqual(repeat, first, 'non-reproducible rotation: ' + scenario.name + '/' + variant.name);
        rows.push({ scenario: scenario.name, variant: variant.name, ...project(first, planner) });
      }
    }
  } finally {
    globalThis.PPStrategicAI = originalPlanner;
  }
  assert.strictEqual(globalThis.PPStrategicAI, originalPlanner, 'baseline planner not restored');
  assert.equal(rows.length, 6);
  const comparisons = [];
  for (const scenario of CASES) {
    const baseline = rows.find(r => r.scenario === scenario.name && r.variant === 'original');
    for (const variant of VARIANTS.slice(1)) {
      const other = rows.find(r => r.scenario === scenario.name && r.variant === variant.name);
      for (const id of IDS) {
        const before = baseline.firms.find(f => f.id === id);
        const after = other.firms.find(f => f.id === id);
        comparisons.push({
          scenario: scenario.name, companyId: id, variant: variant.name,
          beforeProfile: before.assignedStrategicProfile,
          afterProfile: after.assignedStrategicProfile,
          changeInLiquidNetCent: after.liquidNetChangeCent - before.liquidNetChangeCent,
          changeInFinalFields: after.finalFields - before.finalFields,
          changeInMaximumDebtCent: after.maximumDebtCent - before.maximumDebtCent,
          changeInRescueCount: after.rescueCount - before.rescueCount
        });
      }
    }
  }
  assert.equal(comparisons.length, 12);
  assert.ok(comparisons.every(c => c.beforeProfile !== c.afterProfile), 'rotation failed');
  return {
    schema: 'pppoppi.ai-profile-rotation/1',
    scope: 'Test-only permutation of strategic planner profiles, same AI IDs and turn order',
    scenarios: CASES.map(x => x.name), variants: VARIANTS.map(x => x.name),
    monthsPerRun: MONTHS, repeatedRuns: rows.length * 2,
    totalSimulatedMonths: rows.length * 2 * MONTHS,
    caveats: [
      'Original game files are unchanged; the test loads an in-memory profile-map variant.',
      'Logistics reserve thresholds are still bound to A1/A2/A3; this isolates only strategic planner assignment, not the entire AI profile.',
      'Turn order and firm IDs remain fixed; competitor reactions are downstream consequences.',
      'Cash minus debt is not profit; field and inventory values are not included.',
      'Only two scripted-human scenarios; no randomized independent trials or C64 comparison.'
    ],
    rows, comparisons, prereleaseGate: 'BLOCKED'
  };
}
if (require.main === module) console.log(JSON.stringify(execute(), null, 2));
module.exports = { profileMap, loadPlanner, project, execute, VARIANTS, CASES, IDS };
