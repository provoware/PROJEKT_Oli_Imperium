'use strict';
// BAL-01 / WIR-04: real AI debt and rescue transitions on the unchanged engine.
// Synthetic initial balances are explicitly test fixtures, not real player saves.
const assert = require('node:assert/strict');
for (const file of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + file + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const company = (state, id) => {
  const firm = state.companies.find(f => f.id === id);
  assert.ok(firm, 'missing firm: ' + id);
  return firm;
};

function run() {
  const original = E.fresh({ humans: 1, ais: 2, seed: 'BAL01-AI-DEBT-RESCUE-20261030' });
  const heavilyIndebted = company(original, 'A1');
  const withoutCash = company(original, 'A2');
  heavilyIndebted.cashCent = 0;
  heavilyIndebted.debtCent = 100000000;
  withoutCash.cashCent = 0;
  withoutCash.debtCent = 0;
  assert.equal(E.validate(original), true, 'fixture must be a valid save');
  const initial = copy(original);
  const requestId = 'BAL01-DEBT-H1-END-M1';
  const result = E.transition(original, {
    type: 'END_TURN', companyId: 'H1', requestId
  });
  assert.equal(result.duplicate, false);
  const state = result.state;
  assert.equal(E.validate(state), true);
  assert.deepEqual(original, initial, 'transition mutated input save');
  assert.equal(state.phase, 'REPORT', 'AI rescue must finish without human prompt');
  assert.deepEqual(state.rescueIds, []);
  assert.equal(state.month, 1);
  assert.equal(state.reports.length, 1);
  const report = id => {
    const item = state.lastReport.companies.find(f => f.id === id);
    assert.ok(item, 'missing monthly report: ' + id);
    return item;
  };
  assert.ok(report('A1').arrearsCent > E.CFG.credit,
    'high debt must exceed the automatic rescue credit');
  assert.equal(report('A2').arrearsCent, E.CFG.wage,
    'cashless debt-free firm must owe exactly one wage invoice');
  const a1 = company(state, 'A1');
  const a2 = company(state, 'A2');
  assert.equal(a1.generation, 2, 'unaffordable debt must trigger restart');
  assert.equal(a1.stats.rescues, 1);
  assert.equal(a1.cashCent, E.CFG.restart);
  assert.equal(a1.debtCent, 0);
  assert.equal(E.pending(a1), 0);
  assert.equal(a2.generation, 1, 'small wage arrears must not trigger restart');
  assert.equal(a2.stats.rescues, 0);
  assert.equal(a2.debtCent, E.CFG.credit, 'one AI rescue loan only');
  assert.equal(a2.cashCent, E.CFG.credit - E.CFG.wage);
  assert.equal(E.pending(a2), 0);
  assert.equal(a2.ledger.filter(x => x.code === 'KI_RETTUNGSKREDIT').length, 1);
  assert.equal(a2.ledger.filter(x => x.code === 'ZAHLUNG_PERSONAL').length, 1);
  assert.equal(state.events.filter(x =>
    x.type === 'SANIERUNGSNEUSTART' && x.company === 'A1').length, 1);
  assert.equal(state.events.filter(x =>
    x.type === 'SANIERUNGSNEUSTART' && x.company === 'A2').length, 0);
  const duplicated = E.transition(state, {
    type: 'END_TURN', companyId: 'H1', requestId
  });
  assert.equal(duplicated.duplicate, true, 'request ID must be idempotent');
  assert.deepEqual(duplicated.state, state, 'duplicate request changed save');
  const restored = copy(state);
  assert.equal(E.validate(restored), true, 'JSON restored save must validate');
  assert.deepEqual(restored, state);
  const next = E.transition(restored, {
    type: 'NEXT_MONTH', requestId: 'BAL01-DEBT-NEXT-M2'
  }).state;
  assert.equal(E.validate(next), true);
  assert.equal(next.phase, 'TURN');
  assert.equal(next.month, 2);
  assert.equal(next.reports.length, 1, 'no double monthly report');
  assert.equal(company(next, 'A1').stats.rescues, 1, 'restart repeated on next month');
  assert.equal(company(next, 'A2').debtCent, E.CFG.credit,
    'AI loan changed during month advance');
  assert.equal(company(next, 'A2').loanUsed, false, 'new month must reset loan flag');
  return {
    highDebtInitialCent: initial.companies.find(f => f.id === 'A1').debtCent,
    highDebtArrearsCent: report('A1').arrearsCent,
    wageArrearsCent: report('A2').arrearsCent,
    aiRestarts: 1, aiLoansWithoutRestart: 1,
    duplicateTurnRejected: true, jsonRoundtrip: true, nextMonthPreserved: true
  };
}
const first = run();
assert.deepEqual(run(), first, 'AI debt/rescue scenario not reproducible');
console.log(JSON.stringify({
  schema: 'pppoppi.ai-debt-rescue-stress/1',
  engine: 'unchanged V1.9.3 core / V1.9.4 test fixture',
  repeatedRuns: 2, monthsPerRun: 1, scenario: first,
  caveats: [
    'Synthetic cash and debt are explicitly injected into valid fresh test states.',
    'This tests one monthly AI rescue boundary, not all crisis conditions.',
    'No accounting profit, asset valuation, C64 equivalence or release clearance.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
