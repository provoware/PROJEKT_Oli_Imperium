'use strict';
// BAL-01 / WIR-01 / WIR-04: independent cash/ledger reconciliation.
// No modification of game state, production source, historical evidence or user saves.
const assert = require('node:assert/strict');
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const MONTHS = 24;
const CONFIGS = [{name: 'two_ai', ais: 2}, {name: 'three_ai', ais: 3}];
// These are explicitly known booking codes, not a claim of accounting profit.
// Every other inflow/outflow stays visible in its own residual category.
const SALES = new Set(['MARKTERLÖS', 'VERTRAGSERLÖS', 'AUSSENMARKT', 'RAFFINIERT_MONATSVERKAUF']);
const INVESTMENTS = new Set(['FELDKAUF', 'FACHBOHRUNG', 'TANKAUSBAU',
  'STRECKENBAU', 'RAFFINERIE_BAU', 'VERTRIEBSROUTE', 'PUBLIC_CONNECT']);
const LOANS = new Set(['RETTUNGSKREDIT', 'KI_RETTUNGSKREDIT']);
// Known action costs are cash payments, NOT accounting expenses or profit.
const ACTION_COSTS = new Set([
  'GUTACHTEN', 'FOERDERUNG', 'TRANSPORT', 'FRACHT',
  'RAFFINERIE_VERARBEITUNG', 'TRANSPORT_REPARATUR',
  'BRANDBEKÄMPFUNG_PROFI', 'ZAHLUNG_PERSONAL', 'ZAHLUNG_WARTUNG'
]);
// Public freight holds are prepayments; their refunds are not sales.
const CATEGORIES = ['salesCent', 'investmentCent', 'loanCent', 'principalCent',
  'actionCostCent', 'freightHoldCent', 'freightRefundCent',
  'otherIncomingCent', 'otherOutgoingCent'];
function classify(entry) {
  const amount = entry.deltaCent;
  if (SALES.has(entry.code)) {
    assert.ok(amount >= 0, 'sales booking has negative sign');
    return 'salesCent';
  }
  if (INVESTMENTS.has(entry.code)) {
    assert.ok(amount <= 0, 'investment booking has positive sign');
    return 'investmentCent';
  }
  if (LOANS.has(entry.code)) {
    assert.ok(amount >= 0, 'loan booking has negative sign');
    return 'loanCent';
  }
  if (entry.code === 'ZAHLUNG_TILGUNG') {
    assert.ok(amount <= 0, 'principal repayment has positive sign');
    return 'principalCent';
  }
  if (ACTION_COSTS.has(entry.code)) {
    assert.ok(amount <= 0, 'action cost has positive sign');
    return 'actionCostCent';
  }
  if (entry.code === 'PUBLIC_FREIGHT_HOLD') {
    assert.ok(amount <= 0, 'freight hold has positive sign');
    return 'freightHoldCent';
  }
  if (entry.code === 'FRACHT_RUECKGABE') {
    assert.ok(amount >= 0, 'freight refund has negative sign');
    return 'freightRefundCent';
  }
  return amount >= 0 ? 'otherIncomingCent' : 'otherOutgoingCent';
}
function move(state, type, requestId) {
  const original = copy(state);
  const result = E.transition(state, {type, companyId: 'H1', requestId});
  assert.equal(result.duplicate, false, 'unexpected duplicate ' + requestId);
  assert.deepEqual(state, original, 'transition mutated input ' + requestId);
  assert.equal(E.validate(result.state), true, 'invalid result ' + requestId);
  return result.state;
}
function reconcile(before, after) {
  assert.equal(before.id, after.id, 'company identity changed');
  assert.equal(before.generation, after.generation, 'restart requires separate audit');
  assert.ok(Array.isArray(before.ledger) && Array.isArray(after.ledger));
  assert.ok(after.ledger.length >= before.ledger.length, 'ledger shrank without restart');
  assert.deepEqual(after.ledger.slice(0, before.ledger.length), before.ledger,
    'old ledger entries were modified');
  const entries = after.ledger.slice(before.ledger.length);
  let net = 0, incoming = 0, outgoing = 0;
  const categories = Object.fromEntries(CATEGORIES.map(key => [key, 0]));
  const codeCounts = {};
  const seen = new Set(before.ledger.map(entry => entry.id));
  for (const entry of entries) {
    assert.ok(entry && typeof entry.id === 'string' && !seen.has(entry.id),
      'missing or repeated booking ID');
    seen.add(entry.id);
    assert.ok(Number.isSafeInteger(entry.deltaCent), 'unsafe ledger amount');
    assert.ok(typeof entry.code === 'string' && entry.code.length > 0,
      'booking has no code');
    net += entry.deltaCent;
    assert.ok(Number.isSafeInteger(net), 'ledger sum overflow');
    if (entry.deltaCent >= 0) incoming += entry.deltaCent;
    else outgoing -= entry.deltaCent;
    const category = classify(entry);
    categories[category] += Math.abs(entry.deltaCent);
    codeCounts[entry.code] = (codeCounts[entry.code] || 0) + 1;
    assert.ok(Number.isSafeInteger(categories[category]), 'classified total overflow');
    assert.ok(Number.isSafeInteger(incoming) && Number.isSafeInteger(outgoing),
      'cash-flow totals overflow');
  }
  assert.ok(Number.isSafeInteger(after.cashCent - before.cashCent),
    'unsafe cash delta');
  assert.equal(after.cashCent - before.cashCent, net,
    'cash delta does not match ledger');
  assert.equal(incoming - outgoing, net, 'cash-flow totals do not reconcile');
  assert.equal(categories.salesCent + categories.loanCent +
    categories.freightRefundCent + categories.otherIncomingCent -
    categories.investmentCent - categories.principalCent -
    categories.actionCostCent - categories.freightHoldCent -
    categories.otherOutgoingCent, net,
    'classified cash-flow does not reconcile');
  return {bookings: entries.length, netCent: net, incomingCent: incoming,
    outgoingCent: outgoing, ...categories, codeCounts};
}
function run(config) {
  let state = E.fresh({humans: 1, ais: config.ais,
    seed: 'BAL01-CASHFLOW-' + config.name});
  const stats = Object.fromEntries(state.companies.map(f => [f.id, {
    months: 0, reconciledMonths: 0, restartMonths: 0,
    bookings: 0, incomingCent: 0, outgoingCent: 0,
    reportedRevenueCent: 0, monthsWithDebt: 0, finalFields: 0,
    ...Object.fromEntries(CATEGORIES.map(key => [key, 0])), codeCounts: {}
  }]));
  let checks = 0, humanRescues = 0;
  for (let month = 1; month <= MONTHS; month++) {
    assert.equal(state.month, month);
    assert.equal(state.phase, 'TURN');
    const before = state;
    let report = move(before, 'END_TURN', 'BAL01-CASH-END-' + config.name + '-' + month);
    let rescueAttempts = 0;
    while (report.phase === 'RESCUE') {
      assert.ok(++rescueAttempts <= 8, 'human rescue loop');
      assert.deepEqual(report.rescueIds, ['H1']);
      report = move(report, 'RESTART',
        'BAL01-CASH-HUMAN-RESTART-' + config.name + '-' + month + '-' + rescueAttempts);
      humanRescues++;
    }
    assert.equal(report.phase, 'REPORT');
    assert.equal(report.lastReport.month, month);
    assert.equal(report.reports.length, month);
    for (const oldFirm of before.companies) {
      const firm = report.companies.find(f => f.id === oldFirm.id);
      const monthly = report.lastReport.companies.find(f => f.id === oldFirm.id);
      assert.ok(firm && monthly, 'company/report missing');
      const row = stats[firm.id];
      row.months++;
      row.monthsWithDebt += Number(firm.debtCent > 0);
      row.finalFields = Object.values(report.claims)
        .filter(claim => claim.owner === firm.id).length;
      if (firm.generation !== oldFirm.generation) {
        assert.equal(firm.generation, oldFirm.generation + 1,
          'multiple restarts in one month');
        assert.equal(firm.stats.rescues, oldFirm.stats.rescues + 1,
          'restart counter mismatch');
        assert.equal(firm.debtCent, 0, 'restart retained debt');
        assert.equal(E.pending(firm), 0, 'restart retained invoices');
        row.restartMonths++;
        continue; // Restart replaces the entire ledger; cash is not continuous.
      }
      const audit = reconcile(oldFirm, firm);
      row.reconciledMonths++;
      row.bookings += audit.bookings;
      row.incomingCent += audit.incomingCent;
      row.outgoingCent += audit.outgoingCent;
      row.reportedRevenueCent += monthly.revenueCent;
      assert.equal(audit.salesCent, monthly.revenueCent,
        'monthly reported revenue differs from independent sales bookings');
      for (const key of CATEGORIES) row[key] += audit[key];
      for (const [code, count] of Object.entries(audit.codeCounts))
        row.codeCounts[code] = (row.codeCounts[code] || 0) + count;
      assert.ok([row.incomingCent, row.outgoingCent, row.reportedRevenueCent,
        ...CATEGORIES.map(key => row[key])].every(Number.isSafeInteger),
        'aggregate overflow');
      assert.equal(monthly.cashCent, firm.cashCent, 'report cash differs from engine');
      assert.equal(monthly.debtCent, firm.debtCent, 'report debt differs from engine');
      assert.equal(monthly.revenueCent, firm.monthRevenueCent,
        'report revenue differs from engine');
      checks++;
    }
    state = move(report, 'NEXT_MONTH', 'BAL01-CASH-NEXT-' + config.name + '-' + month);
    assert.equal(state.phase, 'TURN');
    assert.equal(state.month, month + 1);
    assert.equal(state.reports.length, month);
  }
  for (const row of Object.values(stats)) {
    assert.equal(row.months, MONTHS);
    assert.equal(row.reconciledMonths + row.restartMonths, MONTHS);
    assert.equal(row.salesCent, row.reportedRevenueCent,
      'cumulative sales and reported revenue differ');
    assert.equal(row.salesCent + row.loanCent + row.freightRefundCent +
      row.otherIncomingCent, row.incomingCent,
      'classified incoming cash differs');
    assert.equal(row.investmentCent + row.principalCent + row.actionCostCent +
      row.freightHoldCent + row.otherOutgoingCent, row.outgoingCent,
      'classified outgoing cash differs');
  }
  return {name: config.name, months: MONTHS, companies: Object.keys(stats).length,
    accountingChecks: checks, humanRescues, stats};
}
// The auditor must fail on independent cash and ledger corruption.
const negativeBefore = E.fresh({humans: 1, ais: 2, seed: 'BAL01-CASH-NEGATIVE'});
const negativeAfter = move(negativeBefore, 'END_TURN', 'BAL01-CASH-NEGATIVE-END');
const beforeAi = negativeBefore.companies.find(f => f.id === 'A1');
const afterAi = negativeAfter.companies.find(f => f.id === 'A1');
assert.ok(afterAi.ledger.length > beforeAi.ledger.length,
  'negative control requires a real booking');
reconcile(beforeAi, afterAi);
const badCash = copy(afterAi);
badCash.cashCent++;
assert.throws(() => reconcile(beforeAi, badCash),
  /cash delta does not match ledger/);
const badLedger = copy(afterAi);
badLedger.ledger[beforeAi.ledger.length].deltaCent++;
assert.throws(() => reconcile(beforeAi, badLedger),
  /cash delta does not match ledger/);
// Deliberately corrupted booking signs must not be accepted as valid categories.
assert.throws(() => classify({code: 'MARKTERLÖS', deltaCent: -1}),
  /sales booking has negative sign/);
assert.throws(() => classify({code: 'FELDKAUF', deltaCent: 1}),
  /investment booking has positive sign/);
assert.throws(() => classify({code: 'RETTUNGSKREDIT', deltaCent: -1}),
  /loan booking has negative sign/);
assert.throws(() => classify({code: 'ZAHLUNG_PERSONAL', deltaCent: 1}),
  /action cost has positive sign/);
assert.throws(() => classify({code: 'PUBLIC_FREIGHT_HOLD', deltaCent: 1}),
  /freight hold has positive sign/);
assert.throws(() => classify({code: 'FRACHT_RUECKGABE', deltaCent: -1}),
  /freight refund has negative sign/);
// Unknown codes must never silently become sales or confirmed costs.
assert.equal(classify({code: 'UNBEKANNT', deltaCent: 1}), 'otherIncomingCent');
assert.equal(classify({code: 'UNBEKANNT', deltaCent: -1}), 'otherOutgoingCent');
const rows = CONFIGS.map(config => {
  const first = run(config);
  assert.deepEqual(run(config), first, 'non-reproducible ' + config.name);
  return first;
});
console.log(JSON.stringify({
  schema: 'pppoppi.ai-cashflow-audit/1',
  engine: 'unchanged V1.9.3 core / V1.9.4 test fixture',
  configurations: CONFIGS.length, repeatedRuns: 2,
  monthsPerRun: MONTHS, totalSimulatedMonths: 96,
  accountingChecks: rows.reduce((n, r) => n + r.accountingChecks, 0),
  negativeTests: 8, classificationUnitChecks: 2,
  knownActionCostCodes: ACTION_COSTS.size, noInjectedCashOrDebt: true,
  revenueChecks: rows.reduce((n, r) => n + r.accountingChecks, 0),
  classifications: Object.fromEntries(CATEGORIES.map(key =>
    [key, rows.reduce((n, r) => n + Object.values(r.stats)
      .reduce((m, f) => m + f[key], 0), 0)])),
  rows,
  limitations: [
    'Sales are independently matched to booking codes and monthly revenue reports.',
    'Investment means selected acquisition/build bookings, not an approved asset value.',
    'Known action cash costs, public freight prepayments and refunds are separate cash categories, not profit.',
    'Other inflows and outflows remain separately visible, with exact booking-code counts.',
    'Ledger/cash reconciliation measures cash flow, not accounting profit.',
    'Field value, inventory valuation and historical C64 rules are not established.',
    'Restart months are separately checked because the ledger resets.',
    'Deterministic passive-human scenarios do not establish overall game balance.'
  ],
  prereleaseGate: 'BLOCKED'
}, null, 2));
