'use strict';
// Zwei menschliche Firmen: natuerliche Insolvenz, Notverkauf, Neustart,
// JSON-Wiederherstellung und Schutz vor doppelten Rettungsbuchungen.
// Reiner Engine-Teiltest; kein Browser- oder vollstaendiger Endpartienbeleg.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

let serial = 0;
const snapshot = value => JSON.parse(JSON.stringify(value));
function send(state, type, companyId, extra = {}) {
  return E.transition(state, {
    type, companyId, requestId: 'SALE-V194-' + (++serial), ...extra
  }).state;
}
function check(name, fn) {
  fn();
  console.log('PASS:', name);
}
function spendToInsolvency(state, firmId, berlin, nord) {
  for (const [type, claimId] of [
    ['SURVEY', berlin], ['BUY', berlin], ['DRILL', berlin],
    ['SURVEY', nord], ['BUY', nord], ['TANK_UPGRADE', berlin],
    ['SECURITY', berlin], ['SECURITY', berlin]
  ]) state = send(state, type, firmId, {claimId});
  assert.equal(E.validate(state), true);
  return state;
}

let game = E.fresh({humans: 2, ais: 0, seed: 'SALE-ROUNDTRIP-V194'});
game = spendToInsolvency(game, 'H1', 'BERLIN-1', 'NORD-1');
check('H1 zahlt acht echte Aktionen ohne kuenstliche Schulden', () => {
  assert.equal(game.companies[0].cashCent, 60000);
  assert.equal(game.companies[0].daysUsed, 15);
});
game = send(game, 'END_TURN', 'H1');
game = spendToInsolvency(game, 'H2', 'BERLIN-2', 'NORD-2');
game = send(game, 'END_TURN', 'H2');
check('Zwei unabhaengige, natuerliche Sanierungsfaelle', () => {
  assert.equal(game.phase, 'RESCUE');
  assert.deepEqual(game.rescueIds, ['H1', 'H2']);
  assert.equal(game.reports.length, 1);
  assert.equal(E.pending(game.companies[0]), 80000);
  assert.equal(E.pending(game.companies[1]), 80000);
});

const beforeSale = snapshot(game);
const saleId = 'SALE-V194-REAL-H1';
const result = E.transition(game, {
  type: 'RESCUE_SALE', companyId: 'H1', claimId: 'BERLIN-1',
  requestId: saleId
});
game = result.state;
check('Notverkauf loest nur H1-Sanierung, H2 bleibt offen', () => {
  assert.equal(result.duplicate, false);
  assert.equal(E.validate(game), true);
  assert.deepEqual(game.rescueIds, ['H2']);
  assert.equal(game.phase, 'RESCUE');
  assert.equal(E.pending(game.companies[0]), 0);
  assert.equal(E.pending(game.companies[1]), 80000);
  assert.equal(game.claims['BERLIN-1'].owner, null);
  assert.equal(game.claims['NORD-1'].owner, 'H1');
  assert.equal(game.claims['BERLIN-2'].owner, 'H2');
  assert.equal(game.companies[0].generation, 1);
  assert.deepEqual(beforeSale.rescueIds, ['H1', 'H2']);
});
check('Notverkauf und Zahlung sind genau einmal verbucht', () => {
  const firm = game.companies[0];
  const sales = firm.ledger.filter(x => x.code === 'NOTVERKAUF');
  assert.equal(sales.length, 1);
  assert.equal(sales[0].info, 'BERLIN-1');
  const region = E.REGIONS.find(r => r.id === 'BERLIN');
  assert.equal(sales[0].deltaCent, Math.floor((region.buy * 60 + 50) / 100));
  assert.equal(firm.cashCent, beforeSale.companies[0].cashCent +
    sales[0].deltaCent - 80000);
  assert.equal(firm.obligations.filter(x => x.dueCent !== x.paidCent).length, 0);
});
check('Doppelte Verkaufskennung veraendert weder Feld noch Journal', () => {
  const repeated = E.transition(game, {
    type: 'RESCUE_SALE', companyId: 'H1', claimId: 'BERLIN-1',
    requestId: saleId
  });
  assert.equal(repeated.duplicate, true);
  assert.deepEqual(repeated.state, game);
});
check('Fremdes Feld darf nicht im Namen von H2 verkauft werden', () => {
  const unchanged = snapshot(game);
  assert.throws(() => E.transition(game, {
    type: 'RESCUE_SALE', companyId: 'H2', claimId: 'NORD-1',
    requestId: 'SALE-V194-FOREIGN'
  }), /Kein eigenes Feld/);
  assert.deepEqual(game, unchanged);
});

const exported = JSON.stringify(game);
game = JSON.parse(exported);
check('Sanierungszwischenstand nach JSON-Rundlauf exakt erhalten', () => {
  assert.equal(E.validate(game), true);
  assert.equal(JSON.stringify(game), exported);
  assert.deepEqual(game.rescueIds, ['H2']);
});
game = send(game, 'RESTART', 'H2');
check('H2-Neustart respektiert H1-Eigentum und Notverkauf', () => {
  assert.equal(game.phase, 'REPORT');
  assert.deepEqual(game.rescueIds, []);
  assert.equal(game.companies[1].generation, 2);
  assert.equal(game.companies[1].stats.rescues, 1);
  assert.equal(game.claims['BERLIN-2'].owner, null);
  assert.equal(game.claims['NORD-2'].owner, null);
  assert.equal(game.claims['NORD-1'].owner, 'H1');
  assert.equal(game.claims['BERLIN-1'].owner, null);
  assert.equal(game.companies[0].ledger.filter(x => x.code === 'NOTVERKAUF').length, 1);
  assert.equal(E.validate(game), true);
});
const finishedRescue = snapshot(game);
check('Notverkauf ausserhalb der Rettungsphase abgewiesen', () => {
  assert.throws(() => E.transition(game, {
    type: 'RESCUE_SALE', companyId: 'H1', claimId: 'NORD-1',
    requestId: 'SALE-V194-AFTER-REPORT'
  }), /Kein eigener Rettungsfall/);
  assert.deepEqual(game, finishedRescue);
});
game = send(game, 'NEXT_MONTH', undefined);
check('Folgemonat ohne zweite Verkaufs- oder Monatsbuchung', () => {
  assert.equal(game.month, 2);
  assert.equal(game.phase, 'TURN');
  assert.equal(game.reports.length, 1);
  assert.equal(game.events.filter(x => x.type === 'MONATSABSCHLUSS').length, 1);
  assert.equal(game.companies[0].ledger.filter(x => x.code === 'NOTVERKAUF').length, 1);
  assert.equal(game.companies[1].generation, 2);
  assert.equal(E.validate(game), true);
});
console.log('TEILNACHWEIS:', JSON.stringify({
  humans: 2, natural_rescues: 2, sale_bookings: 1,
  json_roundtrip: 'PASS', foreign_sale_rejected: true,
  duplicate_sale_rejected: true, full_endgame: false,
  prerelease_gate: 'BLOCKED'
}));
