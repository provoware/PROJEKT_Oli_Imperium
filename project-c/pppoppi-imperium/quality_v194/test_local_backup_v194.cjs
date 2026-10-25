'use strict';
// SPE-03: Zwei persistente Browser-Sicherungsstufen samt kontrollierter
// Wiederherstellung; die Tests simulieren Speicher, Dateien und Reloads.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {Blob} = require('node:buffer');
assert.equal(process.argv.length, 3, 'Aufruf: node test_local_backup_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, name + '.js'));
const E = globalThis.OliV082;
const PRIMARY = 'pppoppi-imperium:snapshot/1';
const BACKUP = 'pppoppi-imperium:backup/1';
const source = fs.readFileSync(path.join(root, 'neo_bridge.js'), 'utf8');
let passed = 0;
const json = x => JSON.parse(JSON.stringify(x));
const check = async (label, fn) => {await fn(); console.log('PASS SPE-03', ++passed, label);};
function init(storage = new Map(), options = {}) {
  const nodes = new Map(), notices = [], scenes = [], downloads = [], urls = new Map();
  function element(id = '') {
    const listeners = new Map();
    return {id, style: {}, textContent: '', value: '', files: [], open: false,
      className: '', innerHTML: '', classList: {toggle() {}, add() {}},
      appendChild() {}, remove() {}, querySelector() {return null;}, setAttribute() {},
      addEventListener(name, fn) {const a = listeners.get(name) || []; a.push(fn); listeners.set(name, a);},
      emit(name, arg = {}) {for (const fn of listeners.get(name) || []) fn(arg);},
      click() {this.emit('click');}};
  }
  function get(id) {if (!nodes.has(id)) nodes.set(id, element(id)); return nodes.get(id);}
  const document = {getElementById: get, querySelectorAll: () => [], hidden: false,
    documentElement: {classList: {toggle() {}}}, body: {appendChild() {}},
    createElement(tag) {const x = element(); if (tag === 'a') x.click = () => downloads.push({name: x.download, blob: urls.get(x.href)}); return x;}};
  const localStorage = {
    getItem(key) {if (options.denyRead) throw Error('SecurityError'); return storage.get(key) ?? null;},
    setItem(key, val) {
      if (options.denyWrite || (options.denyPrimaryWrite && key === PRIMARY)) throw Error('QuotaExceededError');
      storage.set(key, String(val));
    }
  };
  const window = {OliV082: E, PPProfi: globalThis.PPProfi,
    PPTransport: globalThis.PPTransport, PPPublicNetwork: globalThis.PPPublicNetwork,
    matchMedia: () => ({matches: false})};
  class FixedDate extends Date {static now() {return 1761377777777;}}
  vm.runInNewContext(source, {window, document, localStorage, Blob,
    URL: {createObjectURL(blob) {const id = 'blob:mock-' + urls.size; urls.set(id, blob); return id;}, revokeObjectURL() {}},
    Date: FixedDate, scenes: {}, show: name => scenes.push(name), toast: msg => notices.push(msg), active: null,
    setTimeout() {}, setInterval() {}}, {filename: 'neo_bridge.js', timeout: 5000});
  const ui = window.NeoEconomy;
  return {ui, storage, notices, scenes, downloads, get,
    state: () => json(ui.getState()),
    saved: key => JSON.parse(storage.get(key)),
    async importText(text, size = Buffer.byteLength(text)) {
      get('loadEconFile').emit('change', {target: {files: [{size, text: async () => text}], value: 'save.json'}});
      await new Promise(resolve => setImmediate(resolve));
    },
    confirmHandoff() {get('dialogContent').emit('click', {
      target: {closest: selector => selector.includes('data-arcade') ? null : {dataset: {ui: 'handoff-ok'}}},
      preventDefault() {}, stopImmediatePropagation() {}
    });}
  };
}

(async () => {
  const shared = new Map();
  let app = init(shared), initial, surveyed, purchased;

  await check('Neue Partie legt validierten Primärstand im Offline-Speicher an', () => {
    assert.equal(shared.has(PRIMARY), false);
    app.ui.start('2-0'); initial = app.state();
    const saved = app.saved(PRIMARY);
    assert.equal(saved.format, 'pppoppi.localbackup/1');
    assert.equal(saved.handoff, false);
    assert.equal(saved.commandNo, 0);
    assert.deepEqual(saved.state, initial);
    E.validate(saved.state);
  });

  await check('Jede erfolgreiche Handlung schiebt nur die vorherige gültige Fassung ins Backup', () => {
    app.ui.send('SURVEY', 'BERLIN-1'); surveyed = app.state();
    assert.notDeepEqual(surveyed, initial);
    assert.deepEqual(app.saved(BACKUP).state, initial);
    assert.deepEqual(app.saved(PRIMARY).state, surveyed);
    assert.equal(app.saved(PRIMARY).commandNo, 1);
  });

  await check('Zweiter Zug rotiert Primär- und Sicherungsstand ohne alte Kopie zu überschreiben', () => {
    app.ui.send('BUY', 'BERLIN-1'); purchased = app.state();
    assert.deepEqual(app.saved(BACKUP).state, surveyed);
    assert.deepEqual(app.saved(PRIMARY).state, purchased);
    assert.equal(app.saved(PRIMARY).commandNo, 2);
  });

  await check('Neuladen übernimmt den jüngsten gespeicherten Spielstand unverändert', () => {
    app = init(shared);
    assert.deepEqual(app.state(), purchased);
    assert.equal(app.ui.needsHandoff(), false);
    assert.equal(app.scenes.at(-1), 'computer');
    assert.match(app.notices.at(-1), /lokalen Spielstand wiederhergestellt/);
  });

  await check('Defekter Primärstand stellt zweite gültige Sicherung wieder her und repariert Slot', () => {
    shared.set(PRIMARY, '{kaputt');
    app = init(shared);
    assert.deepEqual(app.state(), surveyed);
    assert.deepEqual(app.saved(PRIMARY).state, surveyed);
    assert.match(app.notices.at(-1), /Sicherungskopie wiederhergestellt/);
    E.validate(app.state());
  });

  await check('Wenn beide Speicherstände beschädigt sind, beginnt kein erfundenes Spiel', () => {
    shared.set(PRIMARY, '{kaputt'); shared.set(BACKUP, 'null');
    app = init(shared);
    assert.equal(app.ui.getState(), null);
    assert.match(app.notices.at(-1), /Sicherungen beschädigt/);
  });

  await check('Gültiger Primärstand bleibt verwendbar, obwohl die ältere Kopie defekt ist', () => {
    shared.set(PRIMARY, JSON.stringify({format: 'pppoppi.localbackup/1', state: purchased, handoff: false, commandNo: 2}));
    shared.set(BACKUP, '{defekt');
    app = init(shared);
    assert.deepEqual(app.state(), purchased);
  });

  await check('Manipuliertes Import-JSON kann weder aktuelle Partie noch Sicherungsplätze überschreiben', async () => {
    const before = app.state(), a = shared.get(PRIMARY), b = shared.get(BACKUP);
    const wrong = json(before); wrong.companies[0].cashCent = -9;
    await app.importText(JSON.stringify(wrong));
    assert.deepEqual(app.state(), before);
    assert.equal(shared.get(PRIMARY), a);
    assert.equal(shared.get(BACKUP), b);
    assert.match(app.notices.at(-1), /Import abgelehnt/);
  });

  await check('Überdimensionierte Importdatei bleibt ohne Änderung am Spiel- und Backupstand', async () => {
    const before = app.state(), a = shared.get(PRIMARY), b = shared.get(BACKUP);
    await app.importText('{}', 5_000_001);
    assert.deepEqual(app.state(), before);
    assert.equal(shared.get(PRIMARY), a);
    assert.equal(shared.get(BACKUP), b);
  });

  await check('Erfolgreicher Dateiimport ersetzt Hauptstand und sichert den vorherigen Stand', async () => {
    const before = app.state(), other = E.fresh({humans: 2, ais: 0, seed: 'SPE03-IMPORT'});
    await app.importText(JSON.stringify(other));
    assert.deepEqual(app.state(), other);
    assert.deepEqual(app.saved(BACKUP).state, before);
    assert.deepEqual(app.saved(PRIMARY).state, other);
  });

  await check('Mehrspieler-Übergabe bleibt auch nach Reload vor fremden Blicken geschützt', async () => {
    app.ui.start('2-0');
    app.ui.send('END_TURN');
    const waiting = app.state();
    assert.equal(app.ui.needsHandoff(), true);
    assert.equal(app.saved(PRIMARY).handoff, true);
    app = init(shared);
    assert.deepEqual(app.state(), waiting);
    assert.equal(app.ui.needsHandoff(), true);
    assert.equal(app.scenes.at(-1), 'handoff');
    app.get('saveGame').click();
    assert.equal(app.downloads.length, 0);
    await app.importText(JSON.stringify(otherState()));
    assert.equal(app.ui.needsHandoff(), true);
    assert.match(app.notices.at(-1), /Übergabe gesperrt/);
  });

  await check('Bestätigte Übergabe aktualisiert auch den Sicherungsstatus', () => {
    app.confirmHandoff();
    assert.equal(app.ui.needsHandoff(), false);
    assert.equal(app.saved(PRIMARY).handoff, false);
    app = init(shared);
    assert.equal(app.ui.needsHandoff(), false);
    assert.equal(app.scenes.at(-1), 'computer');
  });

  await check('Wiederaufnahme verbraucht keine bereits verarbeitete Befehlskennung', () => {
    const before = app.state();
    const seen = new Set(before.processedIds);
    app.ui.send('SURVEY', 'BERLIN-2');
    const after = app.state();
    assert.equal(after.processedIds.length, before.processedIds.length + 1);
    assert.ok(!seen.has(after.processedIds.at(-1)));
    assert.equal(after.claims['BERLIN-2'].surveyedBy.includes('H2'), true);
  });

  await check('Gesperrter Browser-Speicher verhindert nicht das eigentliche Spielen', () => {
    const local = init(new Map(), {denyWrite: true});
    local.ui.start('2-0');
    local.ui.send('SURVEY', 'BERLIN-1');
    assert.ok(local.state());
    E.validate(local.state());
    assert.match(local.notices.join(' '), /Automatische Sicherung nicht verfügbar/);
    assert.equal(local.storage.has(PRIMARY), false);
  });

  await check('Verweigerter Lesezugriff erklärt Dateirückfall, ohne App-Absturz', () => {
    const blocked = init(new Map(), {denyRead: true});
    assert.equal(blocked.ui.getState(), null);
    assert.match(blocked.notices.join(' '), /Browser-Speicher gesperrt/);
  });

  await check('Wenn nur Hauptschreiben fehlschlägt, bleibt alter gültiger Stand erhalten', () => {
    const localStore = new Map();
    const before = E.fresh({humans: 2, ais: 0});
    localStore.set(PRIMARY, JSON.stringify({format: 'pppoppi.localbackup/1', handoff: false,
      commandNo: 0, state: before}));
    const local = init(localStore, {denyPrimaryWrite: true});
    local.ui.start('2-0');
    assert.deepEqual(JSON.parse(localStore.get(PRIMARY)).state, before);
    assert.match(local.notices.join(' '), /Automatische Sicherung nicht verfügbar/);
    E.validate(JSON.parse(localStore.get(PRIMARY)).state);
  });

  assert.equal(passed, 16);
  console.log('RESULT SPE-03', passed, 'Sicherungs-, Fallback- und Offline-Wiederanlaufpruefungen bestanden');
})().catch(error => {console.error(error); process.exitCode = 1;});

function otherState() {return E.fresh({humans: 2, ais: 0, seed: 'BLOCKED-IMPORT'});}
