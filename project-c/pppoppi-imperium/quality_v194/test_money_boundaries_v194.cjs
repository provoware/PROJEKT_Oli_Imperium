'use strict';
// WIR-04: Geldgrenzen der eigenständigen Berliner Technikfassung.
// Kein Original-C64-Vergleich, keine Veränderung der 110 geschützten Quelldateien.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

const copy = value => JSON.parse(JSON.stringify(value));
const seed = () => E.fresh({humans: 2, ais: 0, seed: 'MONEY-BOUNDARY-V194'});
let checks = 0;
function pass(label, action) {
  action();
  checks++;
  console.log('PASS', checks, label);
}
function send(state, type, requestId, extra = {}) {
  return E.transition(state, {type, companyId: 'H1', requestId, ...extra});
}
function unchanged(original, snapshot) {
  assert.deepEqual(original, snapshot, 'Fehlgeschlagene Aktion veraendert den Quellspielstand');
}

pass('Unveraenderter Ausgangsstand ist gueltig', () => {
  assert.equal(E.validate(seed()), true);
});

// Importgrenzen: niemals auf gerundete/negative Geldwerte vertrauen.
for (const field of ['cashCent', 'debtCent', 'monthRevenueCent',
                     'monthSoldMilli', 'monthProducedMilli', 'monthContractMilli']) {
  for (const [kind, invalid] of [
    ['negativ', -1], ['Bruchzahl', 0.5],
    ['unsichere Ganzzahl', Number.MAX_SAFE_INTEGER + 1],
    ['Text', '100'], ['null', null]
  ]) {
    pass(field + ': ' + kind + ' abgewiesen', () => {
      const s = seed();
      s.companies[0][field] = invalid;
      assert.throws(() => E.validate(s), /Firmenwert/);
    });
  }
}
for (const [field, invalid] of [
  ['dueCent', -1], ['dueCent', Number.MAX_SAFE_INTEGER + 1],
  ['paidCent', -1], ['paidCent', 101]
]) {
  pass('Rechnung ' + field + '=' + invalid + ' abgewiesen', () => {
    const s = seed();
    s.companies[0].obligations = [{
      id: 'BOUND-INVOICE', priority: 1, kind: 'PERSONAL', dueCent: 100, paidCent: 0
    }];
    s.companies[0].obligations[0][field] = invalid;
    assert.throws(() => E.validate(s), /Rechnung/);
  });
}
pass('Ungültiger negativer Marktpreis abgewiesen', () => {
  const s = seed();
  s.prices.BERLIN = -1;
  assert.throws(() => E.validate(s), /Marktpreis/);
});
pass('Unsichere Nachfragemenge abgewiesen', () => {
  const s = seed();
  s.demand.BERLIN = Number.MAX_SAFE_INTEGER + 1;
  assert.throws(() => E.validate(s), /Nachfrage/);
});

const region = E.REGIONS.find(r => r.id === 'BERLIN');
pass('Exakt ausreichendes Guthaben: Gutachten bucht bis auf null', () => {
  const s = seed();
  s.companies[0].cashCent = region.survey;
  const result = send(s, 'SURVEY', 'MONEY-EXACT-1', {claimId: 'BERLIN-1'});
  assert.equal(result.duplicate, false);
  assert.equal(result.state.companies[0].cashCent, 0);
  assert.equal(result.state.companies[0].daysUsed, 2);
  assert.equal(E.validate(result.state), true);
  assert.equal(s.companies[0].cashCent, region.survey);
  const again = send(result.state, 'SURVEY', 'MONEY-EXACT-1', {claimId: 'BERLIN-1'});
  assert.equal(again.duplicate, true);
  assert.deepEqual(again.state, result.state, 'Doppelte Anfrage belastet nicht erneut');
});
pass('Ein Cent zu wenig: Aktion scheitert ohne Zustandsaenderung', () => {
  const s = seed();
  s.companies[0].cashCent = region.survey - 1;
  const before = copy(s);
  assert.throws(() => send(s, 'SURVEY', 'MONEY-LOW-1', {claimId: 'BERLIN-1'}),
                /Nicht genügend/);
  unchanged(s, before);
});
pass('Maximal sicherer Kontostand bleibt nach Zahlung und JSON-Rundlauf exakt', () => {
  const s = seed();
  s.companies[0].cashCent = Number.MAX_SAFE_INTEGER;
  const result = send(s, 'SURVEY', 'MONEY-MAX-1', {claimId: 'BERLIN-1'}).state;
  assert.equal(result.companies[0].cashCent, Number.MAX_SAFE_INTEGER - region.survey);
  const restored = copy(result);
  assert.deepEqual(restored, result);
  assert.equal(E.validate(restored), true);
  assert.equal(s.companies[0].cashCent, Number.MAX_SAFE_INTEGER);
});

function rescueState() {
  const s = seed();
  s.phase = 'RESCUE';
  s.rescueIds = ['H1'];
  s.companies[0].obligations = [{
    id: 'BOUND-ARREARS', priority: 1, dueCent: 100, paidCent: 0, kind: 'PERSONAL'
  }];
  return s;
}
pass('Rettungskredit darf den sicheren Bargeldbereich nicht ueberschreiten', () => {
  const s = rescueState();
  s.companies[0].cashCent = Number.MAX_SAFE_INTEGER - E.CFG.credit + 1;
  assert.equal(E.validate(s), true);
  const before = copy(s);
  assert.throws(() => send(s, 'RESCUE_LOAN', 'MONEY-CASH-OVER-1'));
  unchanged(s, before);
});
pass('Rettungskredit darf den sicheren Schuldenbereich nicht ueberschreiten', () => {
  const s = rescueState();
  s.companies[0].cashCent = 0;
  s.companies[0].debtCent = Number.MAX_SAFE_INTEGER - E.CFG.credit + 1;
  assert.equal(E.validate(s), true);
  const before = copy(s);
  assert.throws(() => send(s, 'RESCUE_LOAN', 'MONEY-DEBT-OVER-1'));
  unchanged(s, before);
});

console.log('WIR-04:', JSON.stringify({
  result: 'PASS', assertions: checks, protected_sources_changed: false,
  historical_c64_equivalence: 'NOT_TESTED', full_economic_campaign: 'OPEN',
  release_gate: 'BLOCKED'
}));
