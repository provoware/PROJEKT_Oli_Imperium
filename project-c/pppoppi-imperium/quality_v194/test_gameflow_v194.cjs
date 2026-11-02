'use strict';
// Technischer Spielablauf ohne Browser; keine Aussage über Balance, Spaß oder C64-Treue.
const assert = require('node:assert/strict');
for (const moduleName of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192', 'strategy_logistics_v193'
]) require('../SPIEL/src/' + moduleName + '.js');
const E = globalThis.OliV082;
let serial = 0, passed = 0;

function send(state, type, companyId = 'H1', other = {}) {
  return E.transition(state, {
    type, companyId, requestId: 'FULL-V194-' + (++serial), ...other
  }).state;
}
function check(name, fn) {
  fn();
  console.log('PASS', ++passed, name);
}
function solve(state) {
  let stageCount = 0;
  while (state.minigame) {
    assert.ok(++stageCount <= 3, 'Minispiel muss nach drei Abschnitten enden');
    const target = E.target(state, state.minigame);
    for (let safety = 0; state.minigame.dial !== target; safety++) {
      assert.ok(safety < 110, 'Wert lässt sich nicht einstellen');
      const diff = target - state.minigame.dial;
      const delta = Math.abs(diff) >= 10 ? (diff > 0 ? 10 : -10) : (diff > 0 ? 1 : -1);
      state = send(state, 'MINI_ADJUST', 'H1', {delta});
    }
    state = send(state, 'MINI_CHECK');
    E.validate(state);
  }
  return state;
}

let game = E.fresh({humans: 1, ais: 2, seed: 'GAMEFLOW-V194'});
check('Neues Spiel startet mit geprüftem Zustand und Firmenkonkurrenz', () => {
  assert.equal(game.phase, 'TURN');
  assert.equal(game.companies.length, 3);
  assert.equal(Object.keys(game.claims).length, 9);
  assert.equal(E.validate(game), true);
});

check('Vom Gutachten über Bohrung und Förderung bis zum Marktangebot', () => {
  for (const type of ['SURVEY', 'BUY', 'DRILL', 'PUMP', 'SHIP']) {
    game = send(game, type, 'H1', {claimId: 'BERLIN-1'});
    E.validate(game);
  }
  assert.equal(game.claims['BERLIN-1'].owner, 'H1');
  assert.equal(game.claims['BERLIN-1'].drilled, true);
  assert.ok(game.claims['BERLIN-1'].preparedMilli > 0);
  const cashBefore = game.companies[0].cashCent;
  game = send(game, 'OFFER', 'H1', {claimId: 'BERLIN-1'});
  assert.equal(game.companies[0].cashCent, cashBefore, 'Angebot darf nicht sofort bezahlt werden');
});

check('Monatsabschluss mit KI-Firmen bucht den Absatz genau einmal', () => {
  game = send(game, 'END_TURN');
  assert.equal(game.phase, 'REPORT');
  assert.ok(game.lastReport);
  assert.ok(game.events.some(e => e.type === 'KI_ENTSCHEIDUNG'));
  assert.ok(game.companies[0].cashCent > 0);
  E.validate(game);
});

check('Bericht, Folgemonat und Speicher-Roundtrip bleiben gültig', () => {
  game = send(game, 'NEXT_MONTH');
  assert.equal(game.month, 2);
  const serialized = JSON.stringify(game);
  const restored = JSON.parse(serialized);
  assert.equal(E.validate(restored), true);
  assert.deepEqual(restored, game);
  assert.equal(restored.reports.length, 1);
});

check('Manipulierter Geldbestand im Spielstand wird abgewiesen', () => {
  const invalid = JSON.parse(JSON.stringify(game));
  invalid.companies[0].cashCent = -1;
  assert.throws(() => E.validate(invalid));
});

check('Lokaler Wechsel zwischen zwei menschlichen Firmen bleibt turnbasiert', () => {
  let state = E.fresh({humans: 2, ais: 0, seed: 'HUMAN-V194'});
  state = send(state, 'END_TURN', 'H1');
  assert.equal(state.phase, 'TURN');
  assert.equal(state.companies[state.turnIndex].id, 'H2');
  state = send(state, 'END_TURN', 'H2');
  assert.equal(state.phase, 'REPORT');
  E.validate(state);
});

check('Eigenbohrung, Pipeline und Brandbekämpfung haben funktionierende Abschlusswege', () => {
  let state = E.fresh({humans: 2, ais: 0, seed: 'MINI-V194'});
  state = send(state, 'SURVEY', 'H1', {claimId: 'BERLIN-1'});
  state = send(state, 'BUY', 'H1', {claimId: 'BERLIN-1'});
  state = send(state, 'DRILL_SELF_START', 'H1', {claimId: 'BERLIN-1'});
  assert.equal(state.minigame.kind, 'DRILL');
  assert.throws(() => send(state, 'PUMP', 'H1', {claimId: 'BERLIN-1'}), /Minispiel/);
  state = solve(state);
  assert.equal(state.claims['BERLIN-1'].drilled, true);
  state = send(state, 'PIPE_START', 'H1', {claimId: 'BERLIN-1'});
  state = solve(state);
  assert.equal(state.claims['BERLIN-1'].pipeline, true);
  state.claims['BERLIN-1'].burning = true;
  E.validate(state);
  state = send(state, 'FIRE_START', 'H1', {claimId: 'BERLIN-1'});
  state = solve(state);
  assert.equal(state.claims['BERLIN-1'].burning, false);
  E.validate(state);
});

check('Zwölf zusätzliche Monate überstehen Engine, KI und Bilanzvalidierung', () => {
  for (let month = 0; month < 12; month++) {
    game = send(game, 'END_TURN');
    assert.equal(game.phase, 'REPORT');
    game = send(game, 'NEXT_MONTH');
    E.validate(game);
    assert.ok(game.companies.every(c => c.cashCent >= 0 && c.debtCent >= 0));
  }
  assert.equal(game.month, 14);
});

console.log('ERGEBNIS', passed, '/', passed, 'technische Spielablaufprüfungen bestanden');
