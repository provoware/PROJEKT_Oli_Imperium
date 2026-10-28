'use strict';
// Zwei menschliche Firmen: natuerlicher Vertragsbruch vs. fristgerechte Lieferung,
// Export/Import vor der Faelligkeit, exakte Rechnungen und Idempotenz.
// Engine-Teiltest: keine Browser-Endpartie und kein historischer C64-Beleg.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

const clone = value => JSON.parse(JSON.stringify(value));
const round = (n, d) => Math.floor((n + Math.floor(d / 2)) / d);
let serial = 0;
function move(state, type, companyId, extra = {}) {
  const command = {
    type, companyId, requestId: 'CONTRACT-V194-' + (++serial), ...extra
  };
  const result = E.transition(state, command);
  assert.equal(result.duplicate, false, 'Unbeabsichtigte Wiederholung: ' + type);
  assert.equal(E.validate(result.state), true, 'Ungueltiger Zustand: ' + type);
  return result.state;
}
function pass(name, fn) {
  fn();
  console.log('PASS:', name);
}

let state = E.fresh({humans: 2, ais: 0, seed: 'CONTRACT-BREACH-ROUNDTRIP-V194'});
for (const type of ['SURVEY', 'BUY']) {
  state = move(state, type, 'H1', {claimId: 'BERLIN-1'});
}
state = move(state, 'SIGN', 'H1', {region: 'BERLIN'});
state = move(state, 'END_TURN', 'H1');
for (const type of ['SURVEY', 'BUY', 'DRILL', 'PUMP']) {
  state = move(state, type, 'H2', {claimId: 'NORD-2'});
}
state = move(state, 'SIGN', 'H2', {region: 'NORD'});
state = move(state, 'END_TURN', 'H2');
pass('Zwei echte Vertraege aus erlaubten Aktionen im ersten Monat', () => {
  assert.equal(state.phase, 'REPORT');
  assert.equal(state.month, 1);
  assert.equal(state.reports.length, 1);
  assert.equal(state.companies[0].contracts[0].status, 'OPEN');
  assert.equal(state.companies[1].contracts[0].status, 'OPEN');
  assert.equal(state.companies[0].contracts[0].dueMonth, 2);
  assert.equal(state.companies[1].contracts[0].dueMonth, 2);
  assert.equal(state.claims['BERLIN-1'].inventoryMilli, 0);
  assert.equal(state.claims['NORD-2'].inventoryMilli, E.CFG.pumpMilli);
});
state = move(state, 'NEXT_MONTH');
const checkpoint = clone(state);
const exported = JSON.stringify(checkpoint);
pass('Vor Faelligkeit exportierter Spielstand ist unveraendert importierbar', () => {
  assert.equal(checkpoint.month, 2);
  assert.equal(checkpoint.phase, 'TURN');
  assert.equal(E.validate(JSON.parse(exported)), true);
  assert.deepEqual(JSON.parse(exported), checkpoint);
});
pass('Falscher Spielerzug wird ohne Datenveraenderung abgewiesen', () => {
  assert.throws(() => E.transition(state, {
    type: 'END_TURN', companyId: 'H2', requestId: 'CONTRACT-WRONG-TURN'
  }), /Falscher Zug/);
  assert.deepEqual(state, checkpoint);
});

function finishMonthTwo(input) {
  let s = E.transition(input, {
    type: 'END_TURN', companyId: 'H1', requestId: 'CONTRACT-M2-H1'
  }).state;
  return E.transition(s, {
    type: 'END_TURN', companyId: 'H2', requestId: 'CONTRACT-M2-H2'
  }).state;
}
const direct = finishMonthTwo(state);
const restored = finishMonthTwo(JSON.parse(exported));
pass('Gleiche Abrechnung nach Import vor Vertragsfaelligkeit', () => {
  assert.deepEqual(restored, direct);
  assert.equal(E.validate(restored), true);
  assert.equal(restored.month, 2);
  assert.equal(restored.phase, 'REPORT');
  assert.equal(restored.reports.length, 2);
  assert.equal(restored.events.filter(x => x.type === 'MONATSABSCHLUSS').length, 2);
});
state = restored;
const h1 = state.companies[0], h2 = state.companies[1];
const failed = h1.contracts[0], fulfilled = h2.contracts[0];
const berlinPrice = round(checkpoint.prices.BERLIN * E.CFG.contractBonusBps, 10000);
const nordPrice = round(checkpoint.prices.NORD * E.CFG.contractBonusBps, 10000);
const expectedPenalty = round(
  round(E.CFG.contractQty * berlinPrice, 1000) * E.CFG.contractPenaltyBps, 10000
);
const expectedRevenue = round(E.CFG.contractQty * nordPrice, 1000);
pass('H1-Vertragsbruch erzeugt exakt eine richtig gerundete Strafe', () => {
  assert.equal(failed.status, 'BREACH');
  assert.equal(failed.soldMilli, 0);
  assert.equal(failed.profitCent, 0);
  assert.equal(h1.stats.contractsDone, 0);
  const penalties = h1.obligations.filter(x => x.kind === 'VERTRAGSSTRAFE');
  assert.equal(penalties.length, 1);
  assert.equal(penalties[0].dueCent, expectedPenalty);
  assert.equal(penalties[0].paidCent, expectedPenalty);
  assert.equal(h1.ledger.filter(x => x.code === 'ZAHLUNG_VERTRAGSSTRAFE').length, 1);
  assert.equal(h1.ledger.filter(x => x.code === 'VERTRAGSERLÖS').length, 0);
});
pass('H2 liefert fristgerecht und verbucht Erloes und Transport einmal', () => {
  assert.equal(fulfilled.status, 'DONE');
  assert.equal(fulfilled.soldMilli, E.CFG.contractQty);
  assert.equal(h2.stats.contractsDone, 1);
  assert.equal(h2.stats.contractsOnTime, 1);
  assert.equal(h2.monthContractMilli, E.CFG.contractQty);
  assert.equal(state.claims['NORD-2'].inventoryMilli,
    E.CFG.pumpMilli - E.CFG.contractQty);
  const revenues = h2.ledger.filter(x => x.code === 'VERTRAGSERLÖS');
  assert.equal(revenues.length, 1);
  assert.equal(revenues[0].deltaCent, expectedRevenue);
  const deliveries = h2.obligations.filter(x => x.kind === 'VERTRAGSTRANSPORT');
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].dueCent, E.CFG.contractDeliveryFee);
  assert.equal(deliveries[0].paidCent, E.CFG.contractDeliveryFee);
  assert.equal(h2.obligations.filter(x => x.kind === 'VERTRAGSSTRAFE').length, 0);
});
pass('Wiederholte Monatsabschluss-Kennung bucht kein zweites Mal', () => {
  const duplicate = E.transition(state, {
    type: 'END_TURN', companyId: 'H2', requestId: 'CONTRACT-M2-H2'
  });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.state, state);
});
const afterReport = JSON.stringify(state);
state = move(JSON.parse(afterReport), 'NEXT_MONTH');
pass('Folgemonat behaelt abgeschlossene Vertraege ohne neue Rechnungen', () => {
  assert.equal(state.month, 3);
  assert.equal(state.phase, 'TURN');
  assert.equal(state.companies[0].contracts[0].status, 'BREACH');
  assert.equal(state.companies[1].contracts[0].status, 'DONE');
  assert.equal(state.companies[0].obligations.filter(x => x.kind === 'VERTRAGSSTRAFE').length, 1);
  assert.equal(state.companies[1].ledger.filter(x => x.code === 'VERTRAGSERLÖS').length, 1);
  assert.equal(state.reports.length, 2);
  assert.equal(E.validate(state), true);
});
console.log('TEILNACHWEIS:', JSON.stringify({
  humans: 2, contracts: 2, natural_breaches: 1, natural_fulfilments: 1,
  export_import_before_due: 'PASS', exact_penalty_and_revenue: 'PASS',
  duplicate_booking_guard: 'PASS', full_endgame: false, prerelease_gate: 'BLOCKED'
}));
