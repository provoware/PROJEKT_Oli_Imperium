'use strict';
// Grenzfallregression fuer den unveraenderten V0.8.2-Spielkern.
// Die 100000-Monats-Probe ist ein synthetischer Grenzzustand,
// keine natuerliche Partie und kein Nachweis einer Siegbedingung.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

function command(state, type, companyId, requestId) {
  return E.transition(state, {type, companyId, requestId});
}
function identical(actual, expected, label) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected), label);
}

let state = E.fresh({humans: 2, ais: 0, seed: 'END-BOUNDARY-V194'});
const initial = structuredClone(state);
assert.throws(
  () => command(state, 'END_TURN', 'H2', 'BOUND-WRONG-1'),
  /Falscher Zug/,
  'Falscher Spieler darf keinen Zug abschliessen'
);
identical(state, initial, 'Fehlversuch veraendert den Eingabezustand nicht');

const first = command(state, 'END_TURN', 'H1', 'BOUND-H1-1');
assert.equal(first.duplicate, false);
const repeated = command(first.state, 'END_TURN', 'H1', 'BOUND-H1-1');
assert.equal(repeated.duplicate, true, 'Doppelte Befehlskennung erkannt');
identical(repeated.state, first.state, 'Wiederholung bucht nichts erneut');

state = command(first.state, 'END_TURN', 'H2', 'BOUND-H2-1').state;
assert.equal(state.phase, 'REPORT', 'Regulaerer Monatsbericht');
assert.equal(state.lastReport.month, 1);
const saved = JSON.parse(JSON.stringify(state));
assert.equal(E.validate(saved), true, 'Berichtszustand kann wieder geladen werden');
identical(saved, state, 'JSON-Rundlauf bleibt identisch');
state = command(saved, 'NEXT_MONTH', undefined, 'BOUND-NEXT-1').state;
assert.equal(state.month, 2);
assert.equal(state.phase, 'TURN');

// Technische Obergrenze der Engine: kein erfundener Sieg oder Spielende.
const limit = E.fresh({humans: 2, ais: 0, seed: 'MAX-MONTH-V194'});
limit.month = 100000;
assert.equal(E.validate(limit), true, 'Letzter gueltiger Monatswert');
let last = command(limit, 'END_TURN', 'H1', 'BOUND-LIMIT-H1').state;
last = command(last, 'END_TURN', 'H2', 'BOUND-LIMIT-H2').state;
assert.equal(last.phase, 'REPORT', 'Am Limit noch kein Endzustand');
assert.equal(last.lastReport.month, 100000);
const beforeOverflow = structuredClone(last);
assert.throws(
  () => command(last, 'NEXT_MONTH', undefined, 'BOUND-LIMIT-NEXT'),
  /Monat ungültig/,
  'Monatswechsel oberhalb der technischen Grenze wird abgewiesen'
);
identical(last, beforeOverflow, 'Abgewiesener Wechsel veraendert den letzten gueltigen Stand nicht');

const fabricatedEnd = structuredClone(last);
fabricatedEnd.phase = 'FINISHED';
assert.throws(
  () => E.validate(fabricatedEnd),
  /Spielphase ungültig/,
  'Nicht definierte Endphase darf nicht als gueltiger Spielstand gelten'
);
console.log('PASS: falscher Zug, Duplikatschutz, JSON-Rundlauf, Monatsgrenze 100000 und unveraenderter Zustand nach Ablehnung');
console.log('ENDGRENZE:', JSON.stringify({
  natural_game_end_tested: false,
  synthetic_limit_month: 100000,
  valid_phases: ['TURN', 'RESCUE', 'REPORT'],
  month_overflow: 'BLOCKED / kontrolliert abgewiesen',
  release_gates: ['VER-01', 'VER-02', 'FEH-02'],
  prerelease_ready: false
}));
