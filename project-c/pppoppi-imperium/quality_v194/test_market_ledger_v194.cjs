'use strict';
// WIR-01: Preise, Ein-/Auszahlungen und Zahlungsjournal des echten Spielkerns.
// Unveraenderte, SHA-256-gepruefte Spielquellen aus ../SPIEL werden geladen.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
require('../SPIEL/src/v082_engine.js');
require('../SPIEL/src/profi_economy.js');
const E = globalThis.OliV082;
const berlin = E.REGIONS.find(r => r.id === 'BERLIN');
const roundDiv = (n, d) => Math.floor((n + Math.floor(d / 2)) / d);
let serial = 0;
let passed = 0;

function check(label, fn) {
  fn();
  console.log('PASS WIR-01', ++passed, label);
}
function fresh() { return E.fresh({humans: 2, ais: 0, seed: 'WIR01-LEDGER-42'}); }
function send(state, type, extra = {}, companyId = 'H1') {
  return E.transition(state, {type, companyId, requestId: `WIR01-${++serial}`, ...extra}).state;
}
function prepareSale() {
  let state = fresh();
  for (const type of ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP', 'OFFER']) {
    state = send(state, type, {claimId: 'BERLIN-1'});
  }
  return state;
}
function closeMonth(state) {
  state = send(state, 'END_TURN');
  assert.equal(state.phase, 'TURN');
  state = send(state, 'END_TURN', {}, 'H2');
  assert.equal(state.phase, 'REPORT');
  return state;
}

check('Gutachten und Feldkauf belasten genau die ausgewiesenen Preise', () => {
  let state = fresh();
  const start = state.companies[0].cashCent;
  state = send(state, 'SURVEY', {claimId: 'BERLIN-1'});
  assert.equal(state.companies[0].cashCent, start - berlin.survey);
  assert.equal(state.companies[0].ledger.at(-1).code, 'GUTACHTEN');
  assert.equal(state.companies[0].ledger.at(-1).deltaCent, -berlin.survey);
  const beforeRejected = structuredClone(state);
  assert.throws(() => send(state, 'SURVEY', {claimId: 'BERLIN-1'}), /Gutachten/);
  assert.deepEqual(state, beforeRejected, 'Abgelehnte Zweitzahlung veraendert nichts');
  state = send(state, 'BUY', {claimId: 'BERLIN-1'});
  assert.equal(state.companies[0].cashCent, start - berlin.survey - berlin.buy);
  assert.equal(state.companies[0].ledger.at(-1).code, 'FELDKAUF');
  assert.equal(state.companies[0].ledger.at(-1).deltaCent, -berlin.buy);
});

check('Bohrung, Foerderung und Fracht sind getrennte, einmalige Ausgaben', () => {
  const state = prepareSale();
  const firm = state.companies[0];
  const expected = [
    ['GUTACHTEN', berlin.survey], ['FELDKAUF', berlin.buy],
    ['FACHBOHRUNG', berlin.drill], ['FOERDERUNG', E.CFG.pumpCost],
    ['TRANSPORT', E.CFG.shippingCost]
  ];
  assert.deepEqual(firm.ledger.map(e => [e.code, -e.deltaCent]), expected);
  assert.equal(firm.cashCent, E.CFG.startCash - expected.reduce((sum, [, amount]) => sum + amount, 0));
  assert.equal(state.claims['BERLIN-1'].preparedMilli, E.CFG.pumpMilli);
  assert.equal(state.claims['BERLIN-1'].inventoryMilli, 0);
});

check('Verkauf ist vor Monatsabschluss ausschliesslich vorgemerkt', () => {
  const state = prepareSale();
  const firm = state.companies[0];
  assert.equal(firm.ledger.filter(e => e.code === 'MARKTERLÖS').length, 0);
  assert.equal(firm.monthRevenueCent, 0);
  assert.equal(state.claims['BERLIN-1'].order, true);
});

check('Markterloes, Monatskosten und Kassenjournal stimmen centgenau', () => {
  const state = closeMonth(prepareSale());
  const firm = state.companies[0];
  const sold = state.lastReport.allocations.BERLIN['BERLIN-1'];
  assert.equal(sold, E.CFG.pumpMilli);
  const revenue = roundDiv(sold * berlin.price, 1000);
  assert.equal(firm.ledger.filter(e => e.code === 'MARKTERLÖS').length, 1);
  assert.equal(firm.ledger.find(e => e.code === 'MARKTERLÖS').deltaCent, revenue);
  assert.equal(firm.monthRevenueCent, revenue);
  assert.equal(state.lastReport.companies.find(c => c.id === 'H1').revenueCent, revenue);
  assert.equal(firm.ledger.filter(e => e.code === 'ZAHLUNG_PERSONAL').length, 1);
  assert.equal(firm.ledger.filter(e => e.code === 'ZAHLUNG_WARTUNG').length, 1);
  assert.equal(firm.ledger.find(e => e.code === 'ZAHLUNG_PERSONAL').deltaCent, -E.CFG.wage);
  assert.equal(firm.ledger.find(e => e.code === 'ZAHLUNG_WARTUNG').deltaCent, -E.CFG.upkeep);
  assert.equal(firm.cashCent, E.CFG.startCash + firm.ledger.reduce((sum, e) => sum + e.deltaCent, 0));
  E.validate(state);
});

check('Marktpreise reagieren auf Absatz und bleiben innerhalb des Preiskorridors', () => {
  let state = closeMonth(prepareSale());
  const oldBerlin = state.prices.BERLIN;
  const other = E.REGIONS.find(r => r.id !== 'BERLIN');
  const oldOther = state.prices[other.id];
  assert.equal(state.lastReport.regions.BERLIN.priceCent, oldBerlin);
  state = send(state, 'NEXT_MONTH');
  // Berlin verkauft 100/120 Barrel Nachfrage: +1%; unbelegter Markt: -3%.
  assert.equal(state.prices.BERLIN, roundDiv(oldBerlin * 10100, 10000));
  assert.equal(state.prices[other.id], roundDiv(oldOther * 9700, 10000));
  for (const r of E.REGIONS) {
    assert.ok(state.prices[r.id] >= roundDiv(r.price * 40, 100));
    assert.ok(state.prices[r.id] <= roundDiv(r.price * 140, 100));
  }
});

check('Raffinierter Markt rechnet mit eigenem Preis und genau einer Gutschrift', () => {
  let state = fresh();
  const plant = state.refinery.plants.H1.BERLIN;
  plant.built = true;
  plant.route = true;
  plant.productMilli = 9000; // gueltiger, isolierter Verkaufs-Testbestand
  E.validate(state);
  const before = state.companies[0].cashCent;
  state = send(state, 'REFINED_SELL', {region: 'BERLIN'});
  assert.equal(state.companies[0].cashCent, before);
  state = closeMonth(state);
  const allocation = state.lastReport.refinery.regions.BERLIN.allocations.H1;
  const priceCent = roundDiv(berlin.price * 130, 100);
  assert.equal(state.lastReport.refinery.regions.BERLIN.priceCent, priceCent);
  assert.equal(allocation.soldMilli, 9000);
  const expected = roundDiv(allocation.soldMilli * priceCent, 1000);
  assert.equal(allocation.revenueCent, expected);
  const entries = state.companies[0].ledger.filter(e => e.code === 'RAFFINIERT_MONATSVERKAUF');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].deltaCent, expected);
  E.validate(state);
});

assert.equal(passed, 6);
console.log('RESULT WIR-01', passed, 'Preis-, Einnahmen-, Ausgaben- und Journalpruefungen bestanden');
