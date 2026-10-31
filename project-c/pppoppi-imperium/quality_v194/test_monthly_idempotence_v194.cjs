'use strict';
// LOG-05: Monatsgrenzen, wiederholte Befehle und genau einmalige Buchungen.
const assert = require('node:assert/strict');
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
let serial = 0;
let passed = 0;
const make = () => E.fresh({humans: 2, ais: 0, seed: 'LOG05-MONATSENDE-42'});
const command = (type, companyId = 'H1', extra = {}) =>
  ({type, companyId, requestId: 'LOG05-' + (++serial), ...extra});
const move = (s, type, companyId = 'H1', extra = {}) =>
  E.transition(s, command(type, companyId, extra)).state;
function check(label, fn) { fn(); console.log('PASS LOG-05', ++passed, label); }
function close(s) {
  s = move(s, 'END_TURN');
  assert.equal(s.phase, 'TURN');
  assert.equal(s.turnIndex, 1);
  s = move(s, 'END_TURN', 'H2');
  assert.equal(s.phase, 'REPORT');
  return s;
}
const next = s => move(s, 'NEXT_MONTH');
const monthEvents = s => s.events.filter(e => e.type === 'MONATSABSCHLUSS');

check('Erster Spielerwechsel ist kein verfruehter Monatsabschluss', () => {
  let s = make();
  s = move(s, 'END_TURN');
  assert.equal(s.month, 1);
  assert.equal(s.phase, 'TURN');
  assert.equal(s.turnIndex, 1);
  assert.equal(s.reports.length, 0);
  assert.equal(monthEvents(s).length, 0);
  for (const f of s.companies) assert.equal(f.ledger.length, 0);
});

check('Letzter Spieler bucht Erloes, Gehaelter und Monatsabschluss einmal', () => {
  let s = make();
  const p = s.refinery.plants.H1.BERLIN;
  p.built = true; p.route = true; p.productMilli = 9000;
  E.validate(s);
  s = move(s, 'REFINED_SELL', 'H1', {region: 'BERLIN'});
  s = move(s, 'END_TURN');
  const closing = command('END_TURN', 'H2');
  s = E.transition(s, closing).state;
  assert.equal(s.phase, 'REPORT');
  assert.equal(s.month, 1);
  assert.equal(s.reports.length, 1);
  assert.equal(monthEvents(s).length, 1);
  assert.equal(s.refinery.monthly.length, 1);
  assert.equal(s.publicNetwork.monthly.length, 1);
  assert.equal(s.companies[0].ledger.filter(e => e.code === 'RAFFINIERT_MONATSVERKAUF').length, 1);
  for (const f of s.companies) {
    assert.equal(f.ledger.filter(e => e.code === 'ZAHLUNG_PERSONAL').length, 1);
  }
  const retry = E.transition(s, closing);
  assert.equal(retry.duplicate, true);
  assert.deepEqual(retry.state, s);
  assert.throws(() => E.transition(s, command('END_TURN', 'H2')), /Falscher Zug|Monat nicht|Spielphase/);
  const loaded = JSON.parse(JSON.stringify(s));
  E.validate(loaded);
  assert.deepEqual(E.transition(loaded, closing), {state: loaded, duplicate: true});
});

check('NEXT_MONTH schaltet genau einmal um und setzt Monatszaehler zurueck', () => {
  let s = close(make());
  const first = command('NEXT_MONTH');
  s = E.transition(s, first).state;
  assert.equal(s.month, 2);
  assert.equal(s.phase, 'TURN');
  assert.equal(s.reports.length, 1);
  assert.equal(monthEvents(s).length, 1);
  for (const f of s.companies) {
    assert.equal(f.daysUsed, 0);
    assert.equal(f.monthRevenueCent, 0);
    assert.equal(f.monthSoldMilli, 0);
  }
  assert.equal(E.transition(s, first).duplicate, true);
  assert.deepEqual(E.transition(s, first).state, s);
  assert.throws(() => E.transition(s, command('NEXT_MONTH')), /Erst Monatsabrechnung/);
});

check('Zeitgrenze 30 Spieltage sperrt teure Aktion atomar und wird zurueckgesetzt', () => {
  let s = make();
  s.companies[0].daysUsed = 29;
  E.validate(s);
  const before = structuredClone(s);
  assert.throws(() => E.transition(s, command('SURVEY', 'H1', {claimId: 'BERLIN-1'})), /Spieltage/);
  assert.deepEqual(s, before);
  s = next(close(s));
  assert.equal(s.companies[0].daysUsed, 0);
  assert.equal(s.companies[1].daysUsed, 0);
});

check('Gleicher Startstand und dieselbe Aktion ergeben identischen Monatsbericht', () => {
  const s = make();
  const afterH1 = move(s, 'END_TURN');
  const before = structuredClone(afterH1);
  const cmd = command('END_TURN', 'H2');
  const a = E.transition(afterH1, cmd).state;
  const b = E.transition(afterH1, cmd).state;
  assert.deepEqual(a, b);
  assert.deepEqual(afterH1, before);
  assert.equal(a.reports.length, 1);
});

check('Oeffentliche Fracht wird nicht doppelt reserviert oder angeliefert', () => {
  let s = make();
  const p = s.refinery.plants.H1.BERLIN;
  p.built = true; p.route = true;
  s.transport.firms.H1.BERLIN.enabled = true;
  s.transport.firms.H1.BERLIN.marketMilli = 18000;
  E.validate(s);
  s = move(s, 'PUBLIC_CONNECT', 'H1', {from: 'BERLIN', to: 'BRANDENBURG'});
  const cmd = command('PUBLIC_QUEUE', 'H1', {from: 'BERLIN', to: 'BRANDENBURG', qtyMilli: 9000});
  s = E.transition(s, cmd).state;
  assert.equal(E.transition(s, cmd).duplicate, true);
  assert.deepEqual(E.transition(s, cmd).state, s);
  assert.equal(s.publicNetwork.queued.length, 1);
  assert.equal(s.companies[0].ledger.filter(e => e.code === 'PUBLIC_FREIGHT_HOLD').length, 1);
  s = close(s);
  assert.equal(s.lastReport.publicNetwork.freight.length, 1);
  s = next(s);
  assert.equal(s.publicNetwork.received.H1.BRANDENBURG, 9000);
  assert.equal(s.publicNetwork.inTransit.length, 0);
  s = next(close(s));
  assert.equal(s.publicNetwork.received.H1.BRANDENBURG, 9000);
  assert.equal(s.companies[0].ledger.filter(e => e.code === 'PUBLIC_FREIGHT_HOLD').length, 1);
});

check('Privater Rohtransport kommt auch nach Speicherung genau einmal an', () => {
  let s = make();
  const c = s.claims['BERLIN-1'];
  c.owner = 'H1'; c.drilled = true; c.inventoryMilli = 20000;
  const p = s.refinery.plants.H1.BERLIN;
  p.built = true; p.route = true;
  E.validate(s);
  s = move(s, 'NETWORK_ENABLE', 'H1', {region: 'BERLIN'});
  s = move(s, 'NETWORK_BUILD', 'H1', {region: 'BERLIN', kind: 'RAW', claimId: 'BERLIN-1'});
  const cmd = command('NETWORK_RAW', 'H1', {region: 'BERLIN', claimId: 'BERLIN-1', qtyMilli: 10000});
  s = E.transition(s, cmd).state;
  assert.equal(E.transition(s, cmd).duplicate, true);
  assert.equal(s.transport.shipments.length, 1);
  assert.equal(s.companies[0].ledger.filter(e => e.code === 'FRACHT').length, 1);
  s = JSON.parse(JSON.stringify(s));
  E.validate(s);
  s = next(close(s));
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 10000);
  assert.equal(s.transport.shipments.length, 0);
  s = next(close(s));
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli, 10000);
});

check('36 Monate: pro Firma und Monat genau ein Gehalt und ein Abschluss', () => {
  let s = make();
  for (let month = 1; month <= 36; month++) {
    s = close(s);
    assert.equal(s.lastReport.month, month);
    assert.equal(monthEvents(s).length, month);
    assert.equal(s.reports.length, month);
    s = next(s);
    assert.equal(s.month, month + 1);
    E.validate(s);
  }
  assert.equal(s.publicNetwork.monthly.length, 36);
  assert.equal(s.refinery.monthly.length, 36);
  for (const f of s.companies) {
    const wages = f.ledger.filter(e => e.code === 'ZAHLUNG_PERSONAL');
    assert.deepEqual(wages.map(e => e.month), Array.from({length: 36}, (_, i) => i + 1));
    assert.equal(new Set(wages.map(e => e.id)).size, 36);
    assert.equal(f.daysUsed, 0);
  }
});

assert.equal(passed, 8);
console.log('RESULT LOG-05', passed, 'Monats- und Doppelbuchungspruefungen bestanden');
