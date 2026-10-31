'use strict';
// BAL-01 / WIR-04: repeated AI insolvency across actual monthly engine transitions.
// Artificial debt shocks are test fixtures, NOT naturally earned game debt.
const assert = require('node:assert/strict');
for (const file of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + file + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
function company(state, id) {
  const firm = state.companies.find(item => item.id === id);
  assert.ok(firm, 'missing company ' + id);
  return firm;
}
function countRestarts(state, id) {
  return state.events.filter(event =>
    event.type === 'SANIERUNGSNEUSTART' && event.company === id).length;
}
function advance(state, type, requestId) {
  const before = copy(state);
  const result = E.transition(state, {
    type, companyId: 'H1', requestId
  });
  assert.equal(result.duplicate, false, 'unexpected duplicate: ' + requestId);
  assert.deepEqual(state, before, 'transition mutated input state: ' + requestId);
  assert.equal(E.validate(result.state), true, 'invalid state: ' + requestId);
  return result.state;
}
function run() {
  let state = E.fresh({
    humans: 1, ais: 2, seed: 'BAL01-AI-MULTIMONTH-20261030'
  });
  const rows = [];
  assert.equal(E.validate(state), true);
  for (let month = 1; month <= 3; month++) {
    assert.equal(state.phase, 'TURN');
    assert.equal(state.month, month);
    // Two separate, explicitly injected financial shocks. No real save is changed.
    if (month <= 2) {
      company(state, 'A1').cashCent = 0;
      company(state, 'A1').debtCent = 100000000;
    }
    if (month === 1) {
      company(state, 'A2').cashCent = 0;
      company(state, 'A2').debtCent = 0;
    }
    assert.equal(E.validate(state), true, 'invalid synthetic fixture');
    const id = 'BAL01-MULTIMONTH-END-' + month;
    const report = advance(state, 'END_TURN', id);
    assert.equal(report.phase, 'REPORT', 'AI must resolve without a human prompt');
    assert.deepEqual(report.rescueIds, []);
    assert.equal(report.month, month);
    assert.equal(report.lastReport.month, month);
    assert.equal(report.reports.length, month, 'missing or doubled month report');
    const a1 = company(report, 'A1');
    const expectedRestarts = Math.min(month, 2);
    assert.equal(a1.generation, 1 + expectedRestarts);
    assert.equal(a1.stats.rescues, expectedRestarts);
    assert.equal(countRestarts(report, 'A1'), expectedRestarts);
    assert.equal(E.pending(a1), 0, 'A1 arrears not cleared');
    if (month <= 2) {
      assert.equal(a1.cashCent, E.CFG.restart, 'restart balance');
      assert.equal(a1.debtCent, 0, 'old debt survived restart');
    }
    if (month === 1) {
      const a2 = company(report, 'A2');
      assert.equal(a2.generation, 1, 'small wage invoice must not restart');
      assert.equal(a2.debtCent, E.CFG.credit);
      assert.equal(a2.ledger.filter(entry =>
        entry.code === 'KI_RETTUNGSKREDIT').length, 1);
      assert.equal(E.pending(a2), 0);
    }
    const duplicate = E.transition(report, {
      type: 'END_TURN', companyId: 'H1', requestId: id
    });
    assert.equal(duplicate.duplicate, true, 'duplicate monthly closure accepted');
    assert.deepEqual(duplicate.state, report, 'duplicate altered state');
    const restored = copy(report);
    assert.equal(E.validate(restored), true, 'JSON roundtrip invalid');
    assert.deepEqual(restored, report, 'JSON roundtrip altered balances');
    rows.push({
      month, reports: restored.reports.length,
      a1Generation: company(restored, 'A1').generation,
      a1Rescues: company(restored, 'A1').stats.rescues,
      a1RestartEvents: countRestarts(restored, 'A1'),
      a1DebtCent: company(restored, 'A1').debtCent,
      a2Generation: company(restored, 'A2').generation,
      a2DebtCent: company(restored, 'A2').debtCent
    });
    if (month < 3) {
      state = advance(restored, 'NEXT_MONTH',
        'BAL01-MULTIMONTH-NEXT-' + (month + 1));
      assert.equal(state.phase, 'TURN');
      assert.equal(state.month, month + 1);
      assert.equal(state.reports.length, month);
      assert.equal(company(state, 'A1').stats.rescues, expectedRestarts);
      assert.equal(company(state, 'A2').loanUsed, false,
        'monthly loan flag not reset');
    } else {
      state = restored;
    }
  }
  assert.equal(state.reports.length, 3);
  assert.equal(countRestarts(state, 'A1'), 2);
  assert.equal(company(state, 'A1').generation, 3);
  return rows;
}
const first = run();
assert.deepEqual(run(), first, 'three-month AI crisis is not reproducible');
console.log(JSON.stringify({
  schema: 'pppoppi.ai-multimonth-rescue/1',
  engine: 'unchanged V1.9.3 core / V1.9.4 test fixture',
  repeatedRuns: 2, monthsPerRun: 3, totalSimulatedMonths: 6,
  injectedA1DebtShocks: 2, a1Restarts: 2,
  duplicateMonthClosuresRejected: 6, jsonRoundtrips: 6,
  rows: first,
  limitations: [
    'Debt shocks are deliberately injected at the start of months 1 and 2.',
    'This is not a naturally accumulated AI debt crisis or historical C64 evidence.',
    'Profit, asset value, asset-bearing insolvency and full release remain unverified.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
