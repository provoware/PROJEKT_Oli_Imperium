'use strict';
// SPE-02: unabhängige alte Gutachten bleiben bei V0.8-Migration erhalten.
// Nur eine erzeugte Technikvorschau; keine Originalquellen oder Nutzerdaten ändern.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 3, 'Aufruf: node test_legacy_survey_allocation_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const moduleName of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, moduleName + '.js'));
const E = globalThis.OliV082;
const old = globalThis.OliV08;
const clone = value => JSON.parse(JSON.stringify(value));
let passed = 0;
function check(label, action) {
  action();
  console.log('PASS SPE-02', ++passed, label);
}
function make(humans) {
  return old.fresh({humans, ais: 0, seed: 'SPE02-SURVEY-GUARD'});
}
function migrate(source) {
  old.validate(source);
  const copy = clone(source);
  const migrated = E.migrateV08(source);
  E.validate(migrated);
  assert.deepEqual(source, copy, 'Die Migration darf den Altspeicher nicht verändern');
  return migrated;
}
check('Zwei Firmen behalten unterschiedliche Gutachten in Berlin', () => {
  const source = make(2);
  for (const f of source.companies) f.fields.BERLIN.surveyed = true;
  const newState = migrate(source);
  assert.deepEqual(newState.claims['BERLIN-1'].surveyedBy, ['H1']);
  assert.deepEqual(newState.claims['BERLIN-2'].surveyedBy, ['H2']);
  assert.equal(newState.claims['BERLIN-1'].owner, null);
  assert.equal(newState.claims['BERLIN-2'].owner, null);
});
check('Drei Firmen behalten Gutachten, Eigentum und Rohöl unabhängig', () => {
  const source = make(3);
  for (const f of source.companies) f.fields.BERLIN.surveyed = true;
  source.companies[1].fields.BERLIN.owned = true;
  source.companies[1].fields.BERLIN.drilled = true;
  source.companies[1].fields.BERLIN.inventoryMilli = 10000;
  const newState = migrate(source);
  const all = Object.values(newState.claims).filter(c => c.region === 'BERLIN');
  assert.deepEqual(all.map(c => c.surveyedBy), [['H1'], ['H2'], ['H3']]);
  assert.equal(newState.claims['BERLIN-2'].owner, 'H2');
  assert.equal(newState.claims['BERLIN-2'].inventoryMilli, 10000);
});
check('Vier Altgutachten bei nur drei Claims werden atomar abgelehnt', () => {
  const source = make(4);
  for (const f of source.companies) f.fields.BERLIN.surveyed = true;
  old.validate(source);
  const before = clone(source);
  assert.throws(() => E.migrateV08(source), /zu viele Konzessionen oder Gutachten/);
  assert.deepEqual(source, before);
});
check('Unbekanntes Altschema überschreibt keine Ausgangsdaten', () => {
  const source = make(2);
  source.ruleset = 'fremde-regeln';
  const before = clone(source);
  assert.throws(() => E.migrateV08(source));
  assert.deepEqual(source, before);
});
assert.equal(passed, 4);
console.log('ERGEBNIS', passed, '/', passed, 'Legacy-Gutachten-/Migrationspruefungen bestanden');
