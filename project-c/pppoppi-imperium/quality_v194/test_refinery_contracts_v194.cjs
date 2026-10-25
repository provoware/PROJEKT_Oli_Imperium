'use strict';
// WIR-03: Mengen- und Vertragskonsistenz auf dem unveraenderten V1.9.3-Kern.
const assert = require('node:assert/strict');
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const refinery = globalThis.PPProfi.COSTS;
let serial = 0, passed = 0;
function check(label, fn) { fn(); console.log('PASS WIR-03', ++passed, label); }
function act(s, type, extra = {}, who = 'H1') {
  return E.transition(s, {type, companyId: who, requestId: 'WIR03-' + (++serial), ...extra}).state;
}
function fixture(rawMilli = 50000, productMilli = 0, built = true) {
  const s = E.fresh({humans: 2, ais: 0, seed: 'WIR03-REFINERY'});
  const c = s.claims['BERLIN-1'];
  c.owner = 'H1'; c.drilled = true; c.inventoryMilli = rawMilli;
  const p = s.refinery.plants.H1.BERLIN;
  p.built = built; p.route = built; p.productMilli = productMilli;
  E.validate(s);
  return s;
}
function close(s) {
  s = act(s, 'END_TURN');
  s = act(s, 'END_TURN', {}, 'H2');
  assert.equal(s.phase, 'REPORT');
  return s;
}
const next = s => act(s, 'NEXT_MONTH');
const count = (s, code) => s.companies[0].ledger.filter(x => x.code === code).length;

check('Werk und Vertriebsweg nur nach eigenem Claim und mit Einzelkosten', () => {
  let s = fixture(50000, 0, false);
  const f = s.companies[0];
  const initial = f.cashCent;
  assert.throws(() => act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'}), /Raffinerie/);
  s = act(s, 'REFINERY_BUILD', {claimId: 'BERLIN-1'});
  assert.equal(s.companies[0].cashCent, initial - refinery.buildCent);
  assert.equal(s.refinery.plants.H1.BERLIN.built, true);
  s = act(s, 'ROUTE_BUILD', {region: 'BERLIN'});
  assert.equal(s.companies[0].cashCent, initial - refinery.buildCent - refinery.routeCent);
  assert.equal(count(s, 'RAFFINERIE_BAU'), 1);
  assert.equal(count(s, 'VERTRIEBSROUTE'), 1);
  assert.equal(s.companies[0].daysUsed, 6);
});

check('Eine reale Verarbeitung: 10 Barrel roh werden 9 Barrel Fertigware', () => {
  let s = fixture();
  const beforeCash = s.companies[0].cashCent;
  s = act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'});
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 50000 - refinery.rawBatchMilli);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, refinery.yieldMilli);
  assert.equal(s.refinery.plants.H1.BERLIN.processedMilli, refinery.rawBatchMilli);
  assert.equal(beforeCash - s.companies[0].cashCent, refinery.refineCent);
  assert.equal(count(s, 'RAFFINERIE_VERARBEITUNG'), 1);
  E.validate(s);
});

check('Vier Chargen bleiben unter 45 Barrel Monatsgrenze; fuenfte blockiert atomar', () => {
  let s = fixture(60000);
  for (let i = 0; i < 4; i++) s = act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'});
  assert.equal(s.refinery.plants.H1.BERLIN.processedMilli, 40000);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 36000);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 20000);
  const before = structuredClone(s);
  assert.throws(() => act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'}), /Verarbeitungskapazität/);
  assert.deepEqual(s, before);
  E.validate(s);
});

check('Vier Produktauftraege: 36 Barrel angeboten, 27 verkauft, 9 zurueck', () => {
  let s = fixture(0, 36000);
  for (let i = 0; i < 4; i++) s = act(s, 'REFINED_SELL', {region: 'BERLIN'});
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 0);
  assert.equal(s.refinery.offers.length, 4);
  assert.equal(count(s, 'RAFFINIERT_MONATSVERKAUF'), 0);
  s = close(s);
  const r = s.lastReport.refinery.regions.BERLIN;
  assert.equal(r.soldMilli, refinery.saleLimitMilli);
  assert.equal(r.allocations.H1.offeredMilli, 36000);
  assert.equal(r.allocations.H1.soldMilli, 27000);
  assert.equal(r.allocations.H1.returnedMilli, 9000);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 9000);
  assert.equal(s.refinery.offers.length, 0);
  assert.equal(count(s, 'RAFFINIERT_MONATSVERKAUF'), 1);
  E.validate(s);
});

check('Vertrag wird nicht vor Faelligkeit und dann genau 40 Barrel beliefert', () => {
  let s = fixture();
  s = act(s, 'SIGN', {region: 'BERLIN'});
  assert.equal(s.companies[0].contracts[0].qtyMilli, E.CFG.contractQty);
  assert.equal(s.companies[0].contracts[0].dueMonth, 2);
  s = next(close(s));
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 50000);
  assert.equal(s.companies[0].contracts[0].status, 'OPEN');
  s = close(s);
  const v = s.companies[0].contracts[0];
  assert.equal(v.status, 'DONE');
  assert.equal(v.soldMilli, 40000);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 10000);
  assert.equal(count(s, 'VERTRAGSERLÖS'), 1);
  assert.equal(count(s, 'ZAHLUNG_VERTRAGSTRANSPORT'), 1);
  E.validate(s);
});

check('Teilbelieferung 30/40 Barrel erzeugt genau eine Vertragsstrafe', () => {
  let s = fixture(30000);
  s = act(s, 'SIGN', {region: 'BERLIN'});
  s = next(close(s));
  s = close(s);
  const v = s.companies[0].contracts[0];
  assert.equal(v.status, 'BREACH');
  assert.equal(v.soldMilli, 30000);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 0);
  assert.equal(count(s, 'VERTRAGSERLÖS'), 1);
  assert.equal(count(s, 'ZAHLUNG_VERTRAGSSTRAFE'), 1);
  assert.equal(count(s, 'ZAHLUNG_VERTRAGSTRANSPORT'), 1);
  E.validate(s);
});

check('Vertrag und raffinierter Regionalmarkt verbrauchen getrennte Bestaende', () => {
  let s = fixture(50000, 9000);
  s = act(s, 'SIGN', {region: 'BERLIN'});
  s = next(close(s));
  s = act(s, 'REFINED_SELL', {region: 'BERLIN'});
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 50000);
  s = close(s);
  assert.equal(s.companies[0].contracts[0].soldMilli, 40000);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 10000);
  assert.equal(s.lastReport.refinery.regions.BERLIN.allocations.H1.soldMilli, 9000);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 0);
  assert.equal(count(s, 'VERTRAGSERLÖS'), 1);
  assert.equal(count(s, 'RAFFINIERT_MONATSVERKAUF'), 1);
  E.validate(s);
});

check('Ungültige Lager und zu wenig Rohöl werden ohne Buchung verworfen', () => {
  const s = fixture(9000);
  const before = structuredClone(s);
  assert.throws(() => act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'}), /Rohöl/);
  assert.deepEqual(s, before);
  const brokenStock = structuredClone(s);
  brokenStock.claims['BERLIN-1'].inventoryMilli = -1;
  assert.throws(() => E.validate(brokenStock), /Feldwert/);
  const brokenProduct = structuredClone(s);
  brokenProduct.refinery.plants.H1.BERLIN.productMilli = -1;
  assert.throws(() => E.validate(brokenProduct), /Produktmenge/);
});

check('Monatswechsel setzt Verarbeitungszaehler und Verkaufsquote zurueck', () => {
  let s = fixture(50000, 9000);
  s = act(s, 'REFINE_BATCH', {claimId: 'BERLIN-1'});
  s = act(s, 'REFINED_SELL', {region: 'BERLIN'});
  s = close(s);
  const remaining = s.refinery.plants.H1.BERLIN.productMilli;
  assert.equal(s.refinery.plants.H1.BERLIN.processedMilli, 10000);
  assert.equal(s.refinery.salesMilli.BERLIN, 9000);
  s = next(s);
  assert.equal(s.refinery.plants.H1.BERLIN.processedMilli, 0);
  assert.equal(s.refinery.salesMilli.BERLIN, 0);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, remaining);
  E.validate(s);
});

check('Aktives Logistiknetz verarbeitet nur angeliefertes Rohöl einmal', () => {
  let s = fixture(50000);
  s = act(s, 'NETWORK_ENABLE', {region: 'BERLIN'});
  s = act(s, 'NETWORK_BUILD', {region: 'BERLIN', kind: 'RAW', claimId: 'BERLIN-1'});
  s = act(s, 'NETWORK_RAW', {region: 'BERLIN', claimId: 'BERLIN-1', qtyMilli: 10000});
  const afterDispatch = s.claims['BERLIN-1'].inventoryMilli;
  assert.equal(afterDispatch, 40000);
  assert.throws(() => act(s, 'NETWORK_REFINE', {region: 'BERLIN', claimId: 'BERLIN-1'}), /angeliefert/);
  s = next(close(s));
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 10000);
  s = act(s, 'NETWORK_REFINE', {region: 'BERLIN', claimId: 'BERLIN-1'});
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 0);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, afterDispatch);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 9000);
  assert.equal(count(s, 'FRACHT'), 1);
  assert.equal(count(s, 'RAFFINERIE_VERARBEITUNG'), 1);
  E.validate(s);
});

assert.equal(passed, 10);
console.log('RESULT WIR-03', passed, 'Raffinerie-, Lager- und Vertragspruefungen bestanden');
