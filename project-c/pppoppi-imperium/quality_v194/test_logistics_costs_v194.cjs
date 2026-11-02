'use strict';
// WIR-02: Unabhaengige Kosten- und Mengenpruefung fuer zwei Transportnetze.
const assert = require('node:assert/strict');
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const T = globalThis.PPTransport;
const P = globalThis.PPPublicNetwork;
const A = globalThis.PPLogisticsAI;
const cent = (quantity, fee) => Math.floor((quantity * fee + 500) / 1000);
let sequence = 0;
let passed = 0;
function check(name, fn) { fn(); console.log('PASS WIR-02', ++passed, name); }
function act(s, type, extra = {}, companyId = 'H1') {
  return E.transition(s, {type, companyId, requestId: 'WIR02-' + (++sequence), ...extra}).state;
}
function monthEnd(s) {
  s = act(s, 'END_TURN');
  s = act(s, 'END_TURN', {}, 'H2');
  assert.equal(s.phase, 'REPORT');
  return s;
}
function next(s) { return act(monthEnd(s), 'NEXT_MONTH'); }
function privateStart() {
  const s = E.fresh({humans: 2, ais: 0, seed: 'WIR02-PRIVATE'});
  const c = s.claims['BERLIN-1'];
  c.owner = 'H1'; c.drilled = true; c.inventoryMilli = 50000;
  const plant = s.refinery.plants.H1.BERLIN;
  plant.built = true; plant.route = true; plant.productMilli = 27000;
  E.validate(s);
  return act(s, 'NETWORK_ENABLE', {region: 'BERLIN'});
}
function privateBuilt() {
  let s = privateStart();
  for (const kind of ['RAW', 'PIPE', 'FINAL']) {
    s = act(s, 'NETWORK_BUILD', {region: 'BERLIN', kind, claimId: 'BERLIN-1'});
  }
  return s;
}
function publicStart() {
  const s = E.fresh({humans: 2, ais: 0, seed: 'WIR02-PUBLIC'});
  for (const id of ['H1', 'H2']) {
    const plant = s.refinery.plants[id].BERLIN;
    plant.built = true; plant.route = true;
    s.transport.firms[id].BERLIN.enabled = true;
    s.transport.firms[id].BERLIN.marketMilli = 30000;
  }
  E.validate(s);
  return s;
}
function connection(s, to = 'BRANDENBURG', id = 'H1') {
  return act(s, 'PUBLIC_CONNECT', {from: 'BERLIN', to}, id);
}
function dispatch(s, qtyMilli, to = 'BRANDENBURG', id = 'H1') {
  return act(s, 'PUBLIC_QUEUE', {from: 'BERLIN', to, qtyMilli}, id);
}

check('Drei private Strecken: Baukosten und Spieltage einzeln verbucht', () => {
  const s = privateBuilt(), f = s.companies[0];
  const prices = ['RAW', 'PIPE', 'FINAL'].map(kind => T.SPECS[kind].build);
  const lines = f.ledger.filter(x => x.code === 'STRECKENBAU');
  assert.deepEqual(lines.map(x => x.deltaCent), prices.map(x => -x));
  assert.equal(f.cashCent, E.CFG.startCash - prices.reduce((a, b) => a + b, 0));
  assert.equal(f.daysUsed, 6);
});

check('Rohöl: exakte Fracht, Kapazitätsreservierung, erst späterer Eingang', () => {
  let s = privateBuilt();
  const before = s.companies[0].cashCent;
  s = act(s, 'NETWORK_RAW', {region: 'BERLIN', claimId: 'BERLIN-1', qtyMilli: 10000});
  const freight = cent(10000, T.SPECS.RAW.fee);
  assert.equal(before - s.companies[0].cashCent, freight);
  assert.equal(s.companies[0].ledger.at(-1).deltaCent, -freight);
  assert.equal(s.transport.shipments[0].freightCent, freight);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli, 40000);
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 0);
  s = next(s);
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 10000);
  assert.equal(s.transport.shipments.length, 0);
});

check('Fertigware: zwei reale Strecken kosten zusammen nur eine Fracht', () => {
  let s = privateBuilt();
  const before = s.companies[0].cashCent;
  s = act(s, 'NETWORK_PRODUCT', {region: 'BERLIN', qtyMilli: 9000});
  const freight = cent(9000, T.SPECS.PIPE.fee) + cent(9000, T.SPECS.FINAL.fee);
  assert.equal(before - s.companies[0].cashCent, freight);
  assert.equal(s.companies[0].ledger.filter(x => x.code === 'FRACHT').length, 1);
  assert.equal(s.transport.shipments[0].freightCent, freight);
  assert.equal(s.transport.shipments[0].path.length, 2);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli, 18000);
  s = next(s);
  assert.equal(s.transport.firms.H1.BERLIN.marketMilli, 9000);
});

check('Oeffentlicher Anschluss und Frachthinterlegung centgenau', () => {
  let s = publicStart();
  const initial = s.companies[0].cashCent;
  s = connection(s);
  assert.equal(initial - s.companies[0].cashCent, P.CONNECT);
  assert.equal(s.companies[0].ledger.at(-1).code, 'PUBLIC_CONNECT');
  s = dispatch(s, 9000);
  const expectedFreight = cent(9000, P.RATE);
  assert.equal(s.companies[0].ledger.at(-1).code, 'PUBLIC_FREIGHT_HOLD');
  assert.equal(s.companies[0].ledger.at(-1).deltaCent, -expectedFreight);
  assert.equal(s.publicNetwork.queued[0].quotedFreight, expectedFreight);
  assert.equal(s.transport.firms.H1.BERLIN.marketMilli, 21000);
  assert.equal(s.companies[0].cashCent, initial - P.CONNECT - expectedFreight);
});

check('Gemeinsamer Engpass: 12/12 Barrel, anteilige Fracht zurueck', () => {
  let s = dispatch(connection(publicStart()), 18000);
  s = act(s, 'END_TURN');
  s = dispatch(connection(s, 'BRANDENBURG', 'H2'), 18000, 'BRANDENBURG', 'H2');
  s = act(s, 'END_TURN', {}, 'H2');
  assert.equal(s.phase, 'REPORT');
  const freight = s.lastReport.publicNetwork.freight;
  assert.equal(freight.length, 2);
  assert.equal(s.lastReport.publicNetwork.capacity['B-BB'].usedMilli, 24000);
  for (const id of ['H1', 'H2']) {
    const allocation = freight.find(x => x.companyId === id);
    const company = s.companies.find(x => x.id === id);
    assert.equal(allocation.requestedMilli, 18000);
    assert.equal(allocation.acceptedMilli, 12000);
    assert.equal(allocation.returnedMilli, 6000);
    assert.equal(allocation.freightCent, cent(12000, P.RATE));
    assert.equal(company.ledger.filter(x => x.code === 'PUBLIC_FREIGHT_HOLD')[0].deltaCent, -cent(18000, P.RATE));
    assert.equal(company.ledger.filter(x => x.code === 'FRACHT_RUECKGABE')[0].deltaCent, cent(6000, P.RATE));
    assert.equal(s.transport.firms[id].BERLIN.marketMilli, 18000);
  }
  s = act(s, 'NEXT_MONTH');
  assert.equal(s.publicNetwork.received.H1.BRANDENBURG, 12000);
  assert.equal(s.publicNetwork.received.H2.BRANDENBURG, 12000);
  E.validate(s);
});

check('Zwei Netzkanten: doppelte Fracht, Ankunft nach zwei Monaten', () => {
  let s = connection(publicStart(), 'NORD');
  assert.deepEqual(P.routeFor('BERLIN', 'NORD'), ['B-BB', 'BB-N']);
  s = dispatch(s, 9000, 'NORD');
  assert.equal(s.publicNetwork.queued[0].quotedFreight, cent(9000, P.RATE * 2));
  s = next(s);
  assert.equal(s.publicNetwork.received.H1.NORD, 0);
  s = next(s);
  assert.equal(s.publicNetwork.received.H1.NORD, 9000);
  assert.equal(s.publicNetwork.inTransit.length, 0);
});

check('Strategie-KI kalkuliert den Preisabstand abzüglich realer Fracht', () => {
  const s = publicStart();
  const origin = 'BERLIN', target = 'NORD', qty = 9000;
  const sourcePrice = Math.floor((s.prices[origin] * 130 + 50) / 100);
  const targetPrice = Math.floor((s.prices[target] * 115 + 50) / 100);
  const path = P.routeFor(origin, target);
  const expected = Math.floor((targetPrice - sourcePrice) * qty / 1000) - cent(qty, P.RATE * path.length);
  assert.equal(A.margin(s, origin, target, qty), expected);
  assert.equal(P.freight(qty, path), cent(qty, P.RATE * path.length));
});

assert.equal(passed, 7);
console.log('RESULT WIR-02', passed, 'private und oeffentliche Logistik-Kostenpruefungen bestanden');
