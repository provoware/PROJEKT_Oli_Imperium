'use strict';
// Diagnose eines echten, unveränderten Spielverlaufs; KEIN Nachweis eines Spielendes.
// Die geschützten Spielquellen werden nur geladen, nicht verändert.
const assert = require('node:assert/strict');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');

const MONTHS = 240;
let request = 0;
function move(state, type, companyId) {
  const result = E.transition(state, {
    type, companyId, requestId: 'END-AUDIT-' + (++request)
  });
  assert.equal(result.duplicate, false, 'Aktion wurde unerwartet dupliziert');
  assert.equal(E.validate(result.state), true, 'Spielstand nach Aktion ungueltig');
  return result.state;
}

let state = E.fresh({humans: 2, ais: 0, seed: 'ENDSTATE-AUDIT-V194'});
const phases = new Set([state.phase]);
const checkpoints = [];
let rescues = 0;
let monthsWithRescue = 0;
for (let month = 1; month <= MONTHS; month++) {
  assert.equal(state.month, month, 'Monat vor dem Spielzug');
  assert.equal(state.phase, 'TURN', 'Zugphase vor dem Monatsabschluss');
  state = move(state, 'END_TURN', 'H1');
  assert.equal(state.phase, 'TURN', 'Zweiter menschlicher Spieler bleibt am Zug');
  state = move(state, 'END_TURN', 'H2');
  phases.add(state.phase);
  let monthRescues = 0;
  while (state.phase === 'RESCUE') {
    assert.ok(state.rescueIds.length > 0, 'Rettungsphase ohne Betroffenen');
    assert.ok(++monthRescues <= 2, 'Rettungsphase haengt');
    state = move(state, 'RESTART', state.rescueIds[0]);
    rescues++;
    phases.add(state.phase);
  }
  if (monthRescues) monthsWithRescue++;
  assert.equal(state.phase, 'REPORT', 'Monatsbericht nach allen Sanierungen');
  assert.equal(state.lastReport.month, month, 'Monatsbericht gehoert zum richtigen Monat');
  assert.equal(state.reports.length, Math.min(month, 120), 'Begrenzte Berichtshistorie');
  phases.add(state.phase);
  if ([1, 120, 200, MONTHS].includes(month)) {
    checkpoints.push({
      month,
      phase: state.phase,
      generations: state.companies.map(c => c.generation),
      reports_kept: state.reports.length,
      rescues
    });
  }
  if (month !== MONTHS) {
    state = move(state, 'NEXT_MONTH');
    phases.add(state.phase);
  }
}
assert.ok(rescues > 0, 'Keine natuerliche Zahlungsunfaehigkeit innerhalb von 240 Monaten beobachtet');
assert.ok(phases.has('RESCUE'), 'Rettungsphase wurde nicht erreicht');
assert.ok([...phases].every(p => ['TURN', 'RESCUE', 'REPORT'].includes(p)), 'Unbekannte Phase');
assert.equal(state.month, MONTHS, 'Endmonat');
assert.equal(state.phase, 'REPORT', 'Kein behaupteter Sieg-/Endzustand');
assert.equal(E.validate(state), true);
console.log('PASS: 240 reguläre Monate, zwei menschliche Firmen, natürliche Sanierungen und Berichte geprüft');
console.log('ENDZUSTAND-DIAGNOSE:', JSON.stringify({
  checked_months: MONTHS,
  human_companies: 2,
  observed_phases: [...phases].sort(),
  rescue_actions: rescues,
  months_with_rescue: monthsWithRescue,
  checkpoints,
  terminal_state_observed: false,
  conclusion: 'BLOCKED: Im geprüften Verlauf kein regulärer Sieg- oder Endzustand; keine Spielende-Freigabe.',
  scope: 'Nur Engine, ohne Browser, KI und historischen C64-Vergleich.'
}));
