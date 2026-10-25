'use strict';
// SPE-02: Reale V0.8-Migration und der UI-Import aus dem technischen Build.
// Ältere V0.7-Stände sowie offene V0.8-Minigames/Verträge sind nicht kompatibel.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {Blob} = require('node:buffer');
assert.equal(process.argv.length, 3, 'Aufruf: node test_save_migration_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, name + '.js'));
const E = globalThis.OliV082, old = globalThis.OliV08;
let serial = 0, passed = 0;
const make = (humans = 2, ais = 0) => old.fresh({humans, ais, seed: 'SPE02-MIGRATION'});
const round = s => JSON.parse(JSON.stringify(s));
const check = async (label, fn) => {await fn(); console.log('PASS SPE-02', ++passed, label);};
const act = (s, type, who = 'H1', extra = {}) => E.transition(s, {
  type, companyId: who, requestId: 'SPE02-' + (++serial), ...extra}).state;
function checkConverted(source) {
  old.validate(source);
  const converted = E.migrateV08(round(source));
  E.validate(converted);
  assert.equal(converted.schema, E.SCHEMA);
  assert.equal(converted.lineage.source, old.SCHEMA);
  assert.equal(converted.lineage.sourceMonth, source.month);
  return converted;
}

// Kein Bildaufbau: nur die echten Datei-Change- und Export-Click-Handler.
const nodes = new Map(), notices = [], downloaded = [], links = new Map();
function element(id = '') {
  const handlers = new Map();
  return {id, textContent: '', style: {}, files: [], value: '', classList: {toggle() {}, add() {}},
    appendChild() {}, remove() {}, setAttribute() {}, querySelector() {return null;},
    addEventListener(event, fn) {const a = handlers.get(event) || []; a.push(fn); handlers.set(event, a);},
    emit(event, e = {}) {for (const fn of handlers.get(event) || []) fn(e);},
    click() {this.emit('click');}};
}
function get(id) {if (!nodes.has(id)) nodes.set(id, element(id)); return nodes.get(id);}
const document = {getElementById: get, querySelectorAll: () => [], hidden: false,
  documentElement: {classList: {toggle() {}}}, body: {appendChild() {}},
  createElement(tag) {const x = element(); if (tag === 'a') x.click = () => downloaded.push(links.get(x.href)); return x;}};
const window = {OliV082: E, PPProfi: globalThis.PPProfi,
  PPTransport: globalThis.PPTransport, PPPublicNetwork: globalThis.PPPublicNetwork,
  matchMedia: () => ({matches: false})};
vm.runInNewContext(fs.readFileSync(path.join(root, 'neo_bridge.js'), 'utf8'), {
  window, document, Blob,
  URL: {createObjectURL(blob) {const u = 'blob:mock-' + links.size; links.set(u, blob); return u;}, revokeObjectURL() {}},
  scenes: {}, show() {}, toast: msg => notices.push(msg), active: null,
  setTimeout() {}, setInterval() {}, localStorage: {getItem() {return null;}, setItem() {}}
}, {filename: 'neo_bridge.js', timeout: 5000});
const ui = window.NeoEconomy;
const state = () => round(ui.getState());
async function importText(text) {
  get('loadEconFile').emit('change', {target: {files: [{size: Buffer.byteLength(text), text: async () => text}], value: 'old.json'}});
  await new Promise(resolve => setImmediate(resolve));
}

(async () => {
  await check('V0.8 wird mit korrekter neuer Schema-, Regel- und Herkunftskennung übernommen', () => {
    const source = make(); const migrated = checkConverted(source);
    assert.equal(migrated.ruleset, E.RULESET);
    assert.equal(migrated.companies.length, source.companies.length);
    assert.equal(migrated.seed, source.seed);
    assert.equal(migrated.companies[0].cashCent, source.companies[0].cashCent);
    assert.equal(migrated.turnIndex, source.turnIndex);
  });

  await check('Zwei getrennte alte Gutachten in einer Region bleiben beide erhalten', () => {
    const source = make();
    source.companies[0].fields.BERLIN.surveyed = true;
    source.companies[1].fields.BERLIN.surveyed = true;
    const migrated = checkConverted(source);
    assert.deepEqual(migrated.claims['BERLIN-1'].surveyedBy, ['H1']);
    assert.deepEqual(migrated.claims['BERLIN-2'].surveyedBy, ['H2']);
    assert.equal(migrated.claims['BERLIN-1'].owner, null);
    assert.equal(migrated.claims['BERLIN-2'].owner, null);
  });

  await check('Gutachten und Konzessionen verschiedener Firmen werden nicht kollidierend zugeteilt', () => {
    const source = make(3);
    for (const f of source.companies) f.fields.BERLIN.surveyed = true;
    source.companies[1].fields.BERLIN.owned = true;
    source.companies[1].fields.BERLIN.drilled = true;
    source.companies[1].fields.BERLIN.inventoryMilli = 10000;
    const migrated = checkConverted(source);
    assert.deepEqual(Object.values(migrated.claims).filter(c => c.region === 'BERLIN').map(c => c.surveyedBy),
      [['H1'], ['H2'], ['H3']]);
    assert.equal(migrated.claims['BERLIN-2'].owner, 'H2');
    assert.equal(migrated.claims['BERLIN-2'].inventoryMilli, 10000);
  });

  await check('Feld-, Pipeline- und Lagerzustand bleibt beim Wechsel je Region erhalten', () => {
    const source = make();
    const f = source.companies[0].fields.NORD;
    f.surveyed = true; f.owned = true; f.drilled = true;
    f.v08.pipeline = true; f.v08.securityUntil = 3;
    f.inventoryMilli = 12000; f.preparedMilli = 3000; f.order = true;
    source.companies[0].cashCent -= 12345;
    const migrated = checkConverted(source), x = migrated.claims['NORD-1'];
    assert.equal(x.owner, 'H1'); assert.equal(x.drilled, true);
    assert.equal(x.inventoryMilli, 12000); assert.equal(x.preparedMilli, 3000);
    assert.equal(x.order, true); assert.equal(x.pipeline, true);
    assert.equal(x.securityUntil, 3);
    assert.equal(migrated.companies[0].cashCent, source.companies[0].cashCent);
  });

  await check('Aktueller Spieler, Prozesskennungen und Buchungen werden übernommen', () => {
    let source = make();
    source = old.transition(source, {type: 'SURVEY', region: 'BERLIN', companyId: 'H1', requestId: 'legacy-01'}).state;
    source = old.transition(source, {type: 'END_TURN', companyId: 'H1', requestId: 'legacy-02'}).state;
    const migrated = checkConverted(source);
    assert.equal(migrated.turnIndex, 1);
    assert.deepEqual(migrated.processedIds, source.processedIds);
    assert.deepEqual(migrated.companies[0].ledger, source.companies[0].ledger);
    assert.equal(migrated.companies[0].daysUsed, source.companies[0].daysUsed);
  });

  await check('Migrierter Stand läuft mit aktuellen Aktionen und Nachrüstungen weiter', () => {
    const source = make();
    source.companies[0].fields.BERLIN.surveyed = true;
    let migrated = checkConverted(source);
    migrated = act(migrated, 'BUY', 'H1', {claimId: 'BERLIN-1'});
    assert.equal(migrated.claims['BERLIN-1'].owner, 'H1');
    assert.equal(migrated.refinery.version, 'pppoppi.refinery/1.1');
    assert.ok(migrated.transport);
    E.validate(migrated);
  });

  await check('Altstand mit offenem Vertrag wird nicht heimlich verändert', () => {
    const source = make();
    source.companies[0].contracts.push({id: 'LEG-OPEN', region: 'BERLIN',
      qtyMilli: 40000, dueMonth: 2, status: 'OPEN', soldMilli: 0, profitCent: 0});
    const before = round(source);
    old.validate(source);
    assert.throws(() => E.migrateV08(source), /Verträge vor Übernahme abschließen/);
    assert.deepEqual(source, before);
  });

  await check('Altes aktives Minispiel und Berichtsphase werden begründet abgewiesen', () => {
    const m = make(); m.companies[0].fields.BERLIN.surveyed = true;
    m.companies[0].fields.BERLIN.owned = true;
    m.minigame = {kind: 'DRILL', companyId: 'H1', region: 'BERLIN', step: 0,
      pattern: ['LINKS', 'MITTE', 'RECHTS']};
    old.validate(m);
    assert.throws(() => E.migrateV08(m), /ohne laufendes Minispiel/);
    const r = make(); r.phase = 'REPORT'; old.validate(r);
    assert.throws(() => E.migrateV08(r), /normalen Zuges/);
  });

  await check('Vier Altgutachten bei nur drei Claims blockiert statt Datenverlust', () => {
    const source = make(4);
    for (const f of source.companies) f.fields.BERLIN.surveyed = true;
    old.validate(source);
    const before = round(source);
    assert.throws(() => E.migrateV08(source), /zu viele Konzessionen oder Gutachten/);
    assert.deepEqual(source, before);
  });

  await check('Unbekanntes oder beschädigtes Altformat wird vor Migration gesperrt', () => {
    const source = make(); source.ruleset = 'gefälschte Regeln';
    assert.throws(() => E.migrateV08(source), /Dateiformat|Spielstandsformat/);
  });

  await check('Echter Lade-Schalter migriert V0.8 und exportiert normalisiertes V0.8.2-JSON', async () => {
    const source = make(); source.companies[0].fields.BERLIN.surveyed = true;
    await importText(JSON.stringify(source));
    const migrated = state();
    E.validate(migrated);
    assert.equal(migrated.schema, E.SCHEMA);
    assert.equal(migrated.lineage.source, old.SCHEMA);
    assert.deepEqual(migrated.claims['BERLIN-1'].surveyedBy, ['H1']);
    assert.match(notices.at(-1), /geprüft und übernommen/);
    get('saveGame').click();
    const exported = JSON.parse(await downloaded.at(-1).text());
    assert.deepEqual(exported, migrated);
    assert.equal(exported.schema, E.SCHEMA);
  });

  await check('Fehlender, fremder oder zukünftiger Versionscode überschreibt nichts', async () => {
    const before = state();
    for (const bad of [{schema: 'pppoppi.berlin.save/9.0'}, {schema: 'other/1.0'}, {}]) {
      await importText(JSON.stringify(bad));
      assert.deepEqual(state(), before);
      assert.match(notices.at(-1), /Import abgelehnt/);
    }
  });

  await check('V0.7 wird sichtbar als nicht unterstütztes Format abgewiesen', async () => {
    const source = globalThis.OliV07.fresh({humans: 2, ais: 0});
    const before = state();
    await importText(JSON.stringify(source));
    assert.deepEqual(state(), before);
    assert.match(notices.at(-1), /Import abgelehnt/);
  });

  assert.equal(passed, 13);
  console.log('RESULT SPE-02', passed, 'Versions- und Migrationsfaelle bestanden');
})().catch(error => {console.error(error); process.exitCode = 1;});
