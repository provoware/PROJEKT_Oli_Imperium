'use strict';
// Deterministische Teillieferung durch echte Foerderung und regulären Marktverkauf.
// Nur Engine-Teiltest, keine Browser-Endpartie und kein historischer C64-Nachweis.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

const copy = value => JSON.parse(JSON.stringify(value));
const round = (n, d) => Math.floor((n + Math.floor(d / 2)) / d);
let serial = 0;
function action(state, type, companyId, extra = {}) {
  const result = E.transition(state, {
    type, companyId, requestId: 'PARTIAL-V194-' + (++serial), ...extra
  });
  assert.equal(result.duplicate, false);
  assert.equal(E.validate(result.state), true);
  return result.state;
}
function check(label, fn) {
  fn();
  console.log('PASS:', label);
}

let state = E.fresh({humans: 2, ais: 0, seed: 'PARTIAL-DELIVERY-V194'});
for (const type of ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER']) {
  state = action(state, type, 'H1', {claimId: 'NORD-1'});
}
state = action(state, 'SIGN', 'H1', {region: 'NORD'});
state = action(state, 'END_TURN', 'H1');
state = action(state, 'END_TURN', 'H2');

check('Marktverkauf laesst natuerlich 20.000 von 100.000 Mengeneinheiten uebrig', () => {
  assert.equal(state.phase, 'REPORT');
  assert.equal(state.month, 1);
  assert.equal(state.reports.length, 1);
  assert.equal(E.CFG.pumpMilli, 100000);
  assert.equal(E.CFG.contractQty, 40000);
  assert.equal(state.lastReport.regions.NORD.soldMilli, 80000);
  assert.equal(state.companies[0].monthSoldMilli, 80000);
  assert.equal(state.claims['NORD-1'].inventoryMilli, 20000);
  assert.equal(state.claims['NORD-1'].preparedMilli, 0);
  assert.equal(state.claims['NORD-1'].order, false);
  assert.equal(state.companies[0].contracts[0].status, 'OPEN');
  assert.equal(state.companies[0].contracts[0].dueMonth, 2);
});

state = action(state, 'NEXT_MONTH');
const checkpoint = copy(state);
const exported = JSON.stringify(state);
check('Unveraenderter JSON-Spielstand vor der Teillieferung', () => {
  assert.equal(checkpoint.month, 2);
  assert.equal(checkpoint.phase, 'TURN');
  assert.equal(E.validate(JSON.parse(exported)), true);
  assert.deepEqual(JSON.parse(exported), checkpoint);
});
check('Falscher Spielerzug veraendert keine Daten', () => {
  assert.throws(() => E.transition(state, {
    type: 'END_TURN', companyId: 'H2', requestId: 'PARTIAL-WRONG-TURN'
  }), /Falscher Zug/);
  assert.deepEqual(state, checkpoint);
});

function finishMonth(input) {
  const first = E.transition(input, {
    type: 'END_TURN', companyId: 'H1', requestId: 'PARTIAL-M2-H1'
  }).state;
  return E.transition(first, {
    type: 'END_TURN', companyId: 'H2', requestId: 'PARTIAL-M2-H2'
  }).state;
}
const direct = finishMonth(state);
const restored = finishMonth(JSON.parse(exported));
check('Direkte und importierte Teillieferung rechnen bytegleich ab', () => {
  assert.deepEqual(restored, direct);
  assert.equal(E.validate(restored), true);
  assert.equal(restored.phase, 'REPORT');
  assert.equal(restored.reports.length, 2);
  assert.equal(restored.events.filter(x => x.type === 'MONATSABSCHLUSS').length, 2);
});

const firm = restored.companies[0];
const contract = firm.contracts[0];
const price = round(checkpoint.prices.NORD * E.CFG.contractBonusBps, 10000);
const expectedRevenue = round(20000 * price, 1000);
const expectedPenalty = round(round(20000 * price, 1000) * E.CFG.contractPenaltyBps, 10000);
const expectedProfit = expectedRevenue -
  round(20000 * E.CFG.contractUnitCost, 1000) - E.CFG.contractDeliveryFee;
check('Teillieferung ist BREACH mit korrekter Reststrafe und genau einer Liefergebuehr', () => {
  assert.equal(contract.status, 'BREACH');
  assert.equal(contract.qtyMilli, 40000);
  assert.equal(contract.soldMilli, 20000);
  assert.equal(contract.profitCent, expectedProfit);
  assert.equal(firm.monthContractMilli, 20000);
  assert.equal(firm.monthRevenueCent, expectedRevenue);
  assert.equal(firm.stats.contractsDone, 0);
  assert.equal(restored.claims['NORD-1'].inventoryMilli, 0);
  assert.equal(restored.claims['NORD-1'].preparedMilli, 0);
  const revenues = firm.ledger.filter(x => x.code === 'VERTRAGSERLÖS');
  assert.equal(revenues.length, 1);
  assert.equal(revenues[0].deltaCent, expectedRevenue);
  const penalties = firm.obligations.filter(x => x.kind === 'VERTRAGSSTRAFE');
  assert.equal(penalties.length, 1);
  assert.equal(penalties[0].dueCent, expectedPenalty);
  assert.equal(penalties[0].paidCent, expectedPenalty);
  const fees = firm.obligations.filter(x => x.kind === 'VERTRAGSTRANSPORT');
  assert.equal(fees.length, 1);
  assert.equal(fees[0].dueCent, E.CFG.contractDeliveryFee);
  assert.equal(fees[0].paidCent, E.CFG.contractDeliveryFee);
  assert.equal(firm.ledger.filter(x => x.code === 'ZAHLUNG_VERTRAGSSTRAFE').length, 1);
  assert.equal(firm.ledger.filter(x => x.code === 'ZAHLUNG_VERTRAGSTRANSPORT').length, 1);
});

check('Wiederholter Abschluss kann keine zweite Vertragsbuchung erzeugen', () => {
  const replay = E.transition(restored, {
    type: 'END_TURN', companyId: 'H2', requestId: 'PARTIAL-M2-H2'
  });
  assert.equal(replay.duplicate, true);
  assert.deepEqual(replay.state, restored);
});
state = action(copy(restored), 'NEXT_MONTH');
check('Dritter Monat bewahrt Teillieferung und Rechnungen ohne Duplikate', () => {
  assert.equal(state.month, 3);
  assert.equal(state.phase, 'TURN');
  assert.equal(state.companies[0].contracts[0].status, 'BREACH');
  assert.equal(state.companies[0].contracts[0].soldMilli, 20000);
  assert.equal(state.companies[0].ledger.filter(x => x.code === 'VERTRAGSERLÖS').length, 1);
  assert.equal(state.companies[0].obligations.filter(x => x.kind === 'VERTRAGSSTRAFE').length, 1);
  assert.equal(state.reports.length, 2);
  assert.equal(E.validate(state), true);
});
console.log('TEILNACHWEIS:', JSON.stringify({
  humans: 2, natural_partial_deliveries: 1, delivered_milli: 20000,
  missing_milli: 20000, pre_due_json_roundtrip: 'PASS',
  exact_revenue_penalty_and_fee: 'PASS', duplicate_guard: 'PASS',
  full_browser_endgame: false, prerelease_gate: 'BLOCKED'
}));
