'use strict';
// Zwei natuerliche Insolvenzen derselben Firma ueber drei Generationen.
// Keine manipulierten Spielstaende, keine Endspiel- oder C64-Freigabe.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

let serial = 0;
const copy = x => JSON.parse(JSON.stringify(x));
function send(state, type, companyId, extra = {}) {
  const result = E.transition(state, {
    type, companyId, requestId: 'MULTIGEN-V194-' + (++serial), ...extra
  });
  assert.equal(result.duplicate, false, type + ': keine unerwartete Wiederholung');
  assert.equal(E.validate(result.state), true, type + ': gueltiger Spielstand');
  return result.state;
}
function check(label, callback) {
  callback();
  console.log('PASS:', label);
}
function rescueEvents(state) {
  return state.events.filter(e => e.type === 'SANIERUNGSNEUSTART' && e.company === 'H1');
}
function reports(state) {
  return state.events.filter(e => e.type === 'MONATSABSCHLUSS').length;
}

let game = E.fresh({humans: 2, ais: 0, seed: 'MULTIGEN-RESCUE-V194'});
for (const [type, claimId] of [
  ['SURVEY', 'BERLIN-1'], ['BUY', 'BERLIN-1'],
  ['DRILL', 'BERLIN-1'], ['SURVEY', 'NORD-1'],
  ['BUY', 'NORD-1'], ['TANK_UPGRADE', 'BERLIN-1'],
  ['SECURITY', 'BERLIN-1'], ['SECURITY', 'BERLIN-1']
]) game = send(game, type, 'H1', {claimId});
check('Erste Insolvenz aus acht regulaeren Wirtschaftsaktionen vorbereitet', () => {
  assert.equal(game.companies[0].cashCent, 60000);
  assert.equal(game.companies[0].generation, 1);
  assert.equal(game.companies[0].daysUsed, 15);
});
game = send(game, 'END_TURN', 'H1');
game = send(game, 'END_TURN', 'H2');
check('Erster Monatsabschluss mit echtem H1-Zahlungsrueckstand', () => {
  assert.equal(game.phase, 'RESCUE');
  assert.deepEqual(game.rescueIds, ['H1']);
  assert.equal(E.pending(game.companies[0]), 80000);
  assert.equal(reports(game), 1);
});
game = send(game, 'RESTART', 'H1');
check('Erste Sanierung fuehrt zu Generation 2 und gibt eigene Felder frei', () => {
  assert.equal(game.phase, 'REPORT');
  assert.equal(game.companies[0].generation, 2);
  assert.equal(game.companies[0].cashCent, E.CFG.restart);
  assert.equal(game.companies[0].stats.rescues, 1);
  assert.equal(game.claims['BERLIN-1'].owner, null);
  assert.equal(game.claims['NORD-1'].owner, null);
  assert.equal(rescueEvents(game).length, 1);
});
const afterFirstRescue = copy(game);
game = copy(game);
check('Erster Sanierungsbericht nach JSON-Rundlauf exakt identisch', () => {
  assert.deepEqual(game, afterFirstRescue);
  assert.equal(E.validate(game), true);
});

let monthSteps = 0;
while (game.phase === 'REPORT' && monthSteps < 240) {
  game = send(game, 'NEXT_MONTH');
  game = send(game, 'END_TURN', 'H1');
  game = send(game, 'END_TURN', 'H2');
  monthSteps++;
  assert.equal(game.month, monthSteps + 1);
  assert.equal(game.companies[0].generation, 2);
  assert.equal(E.validate(game), true);
}
check('Zweite natuerliche H1-Insolvenz durch wiederholte Monatskosten', () => {
  assert.ok(monthSteps > 1 && monthSteps <= 240);
  assert.equal(game.phase, 'RESCUE');
  assert.deepEqual(game.rescueIds, ['H1']);
  assert.ok(E.pending(game.companies[0]) > 0);
  assert.equal(game.companies[0].stats.rescues, 1);
  assert.equal(game.companies[1].generation, 1);
  assert.equal(reports(game), game.month);
});
const beforeSecondRescue = copy(game);
game = copy(game);
check('Offene zweite Sanierung nach JSON-Rundlauf verlustfrei', () => {
  assert.deepEqual(game, beforeSecondRescue);
  assert.equal(E.validate(game), true);
});
const secondId = 'MULTIGEN-V194-SECOND-RESTART';
const second = E.transition(game, {type: 'RESTART', companyId: 'H1', requestId: secondId});
assert.equal(second.duplicate, false);
game = second.state;
check('Zweite Sanierung erzeugt Generation 3 ohne H2-Verlust', () => {
  assert.equal(game.phase, 'REPORT');
  assert.deepEqual(game.rescueIds, []);
  assert.equal(game.companies[0].generation, 3);
  assert.equal(game.companies[0].stats.rescues, 2);
  assert.equal(game.companies[0].cashCent, E.CFG.restart);
  assert.equal(game.companies[1].generation, 1);
  assert.equal(rescueEvents(game).length, 2);
  assert.equal(reports(game), game.month);
  assert.equal(E.validate(game), true);
});
const repeated = E.transition(game, {type: 'RESTART', companyId: 'H1', requestId: secondId});
check('Wiederholter Neustartbefehl aendert keine Buchung oder Generation', () => {
  assert.equal(repeated.duplicate, true);
  assert.deepEqual(repeated.state, game);
});
const afterSecondRescue = copy(game);
game = copy(game);
check('Generation 3 nach erneutem JSON-Rundlauf exakt erhalten', () => {
  assert.deepEqual(game, afterSecondRescue);
  assert.equal(E.validate(game), true);
});
const beforeNext = reports(game);
game = send(game, 'NEXT_MONTH');
check('Folgemonat ohne doppelte Sanierung oder Monatsabrechnung', () => {
  assert.equal(game.phase, 'TURN');
  assert.equal(game.month, beforeNext + 1);
  assert.equal(game.companies[0].generation, 3);
  assert.equal(game.companies[0].stats.rescues, 2);
  assert.equal(rescueEvents(game).length, 2);
  assert.equal(reports(game), beforeNext);
  assert.equal(E.validate(game), true);
});
console.log('MEHRGENERATIONEN-TEILNACHWEIS:', JSON.stringify({
  humans: 2, real_initial_actions: 8, subsequent_months: monthSteps,
  generations_reached: 3, natural_insolvencies_h1: 2,
  json_roundtrips: 3, duplicate_restart_rejected: true,
  browser_tested: false, historical_c64_verified: false,
  full_endgame_tested: false, prerelease_gate: 'BLOCKED'
}));
