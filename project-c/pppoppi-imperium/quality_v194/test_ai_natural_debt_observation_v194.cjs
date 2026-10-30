'use strict';
// BAL-01 / WIR-04: natural AI cash/debt/field trajectories, no balance injections.
// Observational regression, not a guaranteed insolvency scenario or asset valuation.
const assert = require('node:assert/strict');
for (const file of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + file + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const MONTHS = 48;
const CONFIGS = [
  {name: 'two_ai', ais: 2},
  {name: 'three_ai', ais: 3}
];
function aiCompanies(state) {
  return state.companies.filter(firm => firm.type === 'ai');
}
function claimsOf(state, id) {
  return Object.values(state.claims).filter(claim => claim.owner === id).length;
}
function move(state, type, requestId, companyId = 'H1') {
  const before = copy(state);
  const result = E.transition(state, {type, requestId, companyId});
  assert.equal(result.duplicate, false, 'unexpected duplicate: ' + requestId);
  assert.deepEqual(state, before, 'engine mutated source: ' + requestId);
  assert.equal(E.validate(result.state), true, 'invalid engine result: ' + requestId);
  return result.state;
}
function run(config) {
  let state = E.fresh({
    humans: 1, ais: config.ais, seed: 'BAL01-NATURAL-48M-' + config.name
  });
  assert.equal(E.validate(state), true);
  const ids = aiCompanies(state).map(firm => firm.id);
  assert.equal(ids.length, config.ais);
  const histories = Object.fromEntries(ids.map(id => [id, {
    maximumDebtCent: 0, monthsWithDebt: 0, monthsWithFields: 0,
    naturalRestarts: 0, finalFields: 0, finalDebtCent: 0
  }]));
  let humanRescues = 0;
  let observedNaturalAiRestarts = 0;
  for (let month = 1; month <= MONTHS; month++) {
    assert.equal(state.phase, 'TURN', 'expected TURN at month ' + month);
    assert.equal(state.month, month, 'month sequence');
    const before = Object.fromEntries(aiCompanies(state).map(firm =>
      [firm.id, {generation: firm.generation, rescues: firm.stats.rescues}]
    ));
    const requestId = 'BAL01-NATURAL-END-' + config.name + '-' + month;
    let report = move(state, 'END_TURN', requestId);
    let rescueAttempts = 0;
    while (report.phase === 'RESCUE') {
      assert.ok(++rescueAttempts <= 8, 'unexpected rescue loop');
      assert.deepEqual(report.rescueIds, ['H1'], 'unexpected AI in human rescue queue');
      report = move(report, 'RESTART',
        'BAL01-NATURAL-HUMAN-RESTART-' + config.name + '-' + month + '-' + rescueAttempts);
      humanRescues++;
    }
    assert.equal(report.phase, 'REPORT', 'missing report: ' + month);
    assert.equal(report.month, month);
    assert.equal(report.reports.length, month, 'monthly report count');
    assert.equal(report.lastReport.month, month, 'last report month');
    for (const firm of aiCompanies(report)) {
      const previous = before[firm.id];
      assert.ok(previous, 'new AI ID in report');
      assert.ok(Number.isSafeInteger(firm.cashCent) && firm.cashCent >= 0, 'unsafe cash');
      assert.ok(Number.isSafeInteger(firm.debtCent) && firm.debtCent >= 0, 'unsafe debt');
      assert.ok(Number.isSafeInteger(firm.cashCent - firm.debtCent), 'unsafe liquid net');
      assert.ok(Number.isSafeInteger(E.pending(firm)) && E.pending(firm) >= 0,
        'unsafe outstanding invoice');
      const delta = firm.generation - previous.generation;
      assert.ok(delta === 0 || delta === 1, 'more than one AI restart per month');
      assert.equal(firm.stats.rescues - previous.rescues, delta,
        'AI restart and rescue counter disagree');
      if (delta === 1) {
        assert.equal(claimsOf(report, firm.id), 0,
          'naturally insolvent AI kept fields after restart');
        assert.equal(firm.debtCent, 0, 'natural restart kept old debt');
        assert.equal(E.pending(firm), 0, 'natural restart kept invoices');
        observedNaturalAiRestarts++;
      }
      const h = histories[firm.id];
      h.maximumDebtCent = Math.max(h.maximumDebtCent, firm.debtCent);
      h.monthsWithDebt += Number(firm.debtCent > 0);
      h.monthsWithFields += Number(claimsOf(report, firm.id) > 0);
      h.naturalRestarts += delta;
      h.finalFields = claimsOf(report, firm.id);
      h.finalDebtCent = firm.debtCent;
    }
    const duplicate = E.transition(report, {
      type: 'END_TURN', companyId: 'H1', requestId
    });
    assert.equal(duplicate.duplicate, true, 'duplicate monthly request accepted');
    assert.deepEqual(duplicate.state, report, 'duplicate changed report');
    const restored = copy(report);
    assert.equal(E.validate(restored), true, 'JSON save invalid');
    assert.deepEqual(restored, report, 'JSON roundtrip changed report');
    state = move(restored, 'NEXT_MONTH',
      'BAL01-NATURAL-NEXT-' + config.name + '-' + month);
    assert.equal(state.phase, 'TURN', 'next month did not start');
    assert.equal(state.month, month + 1);
    assert.equal(state.reports.length, month, 'report lost after NEXT_MONTH');
  }
  assert.equal(state.reports.length, MONTHS);
  return {
    name: config.name, ais: config.ais, months: MONTHS,
    humanRescues, observedNaturalAiRestarts, histories
  };
}
const rows = CONFIGS.map(config => {
  const first = run(config);
  assert.deepEqual(run(config), first, 'non-deterministic natural run: ' + config.name);
  return first;
});
assert.equal(rows.length, 2);
assert.equal(rows.reduce((sum, row) => sum + row.months, 0), 96);
console.log(JSON.stringify({
  schema: 'pppoppi.ai-natural-debt-observation/1',
  engine: 'unchanged V1.9.3 core / V1.9.4 test fixture',
  configurations: rows.length, repeatedRuns: 2,
  monthsPerRun: MONTHS, totalSimulatedMonths: 192,
  noInjectedCashOrDebt: true,
  observedNaturalAiRestarts: rows.reduce((sum, row) =>
    sum + row.observedNaturalAiRestarts, 0),
  rows,
  limitations: [
    'Observational natural campaigns: zero observed insolvencies would not prove the rescue branch.',
    'No synthetic debt injection, no historical C64 equivalence, no accounting profit.',
    'Cash minus debt is not total assets; fields have no monetary valuation here.',
    'Passive scripted human and fixed deterministic seeds do not establish overall balance.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
