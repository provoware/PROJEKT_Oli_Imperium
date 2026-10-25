'use strict';
// SIC-01: Browser-Dateiimport darf weder Pfadnamen auflösen noch path-artige
// Dateinamen annehmen. Simulierte Eingaben verwenden den echten UI-Handler.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {Blob} = require('node:buffer');
assert.equal(process.argv.length, 3, 'Aufruf: node test_import_paths_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, name + '.js'));
const E = globalThis.OliV082;
const bridge = fs.readFileSync(path.join(root, 'neo_bridge.js'), 'utf8');
const PRIMARY = 'pppoppi-imperium:snapshot/1';
const BACKUP = 'pppoppi-imperium:backup/1';
const storage = new Map(), nodes = new Map(), toasts = [], downloads = [], urls = new Map();
const json = obj => JSON.parse(JSON.stringify(obj));
let passed = 0;
const check = async (label, test) => {await test();console.log('PASS SIC-01', ++passed, label);};
function node() {
  const listeners = new Map();
  return {style: {}, textContent: '', files: [], value: '', classList: {toggle() {}, add() {}},
    appendChild() {}, remove() {}, setAttribute() {}, querySelector() {return null;},
    addEventListener(event, fn) {const a = listeners.get(event) || []; a.push(fn); listeners.set(event, a);},
    emit(event, e = {}) {for (const fn of listeners.get(event) || []) fn(e);},
    click() {this.emit('click');}};
}
function get(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);}
const document = {getElementById: get, querySelectorAll: () => [], hidden: false,
  documentElement: {classList: {toggle() {}}}, body: {appendChild() {}},
  createElement(tag) {const x = node(); if (tag === 'a') x.click = () => downloads.push({name: x.download, blob: urls.get(x.href)}); return x;}};
const localStorage = {getItem(key) {return storage.get(key) ?? null;}, setItem(key, value) {storage.set(key, String(value));}};
const window = {OliV082: E, PPProfi: globalThis.PPProfi,
  PPTransport: globalThis.PPTransport, PPPublicNetwork: globalThis.PPPublicNetwork,
  matchMedia: () => ({matches: false})};
vm.runInNewContext(bridge, {window, document, localStorage, Blob,
  URL: {createObjectURL(b) {const u = 'blob:mock-' + urls.size; urls.set(u, b); return u;}, revokeObjectURL() {}},
  scenes: {}, show() {}, toast: msg => toasts.push(msg), active: null,
  setTimeout() {}, setInterval() {}
}, {filename: 'neo_bridge.js', timeout: 5000});
const ui = window.NeoEconomy;
const state = () => json(ui.getState());
const validState = E.fresh({humans: 2, ais: 0, seed: 'SIC01-SAFE-IMPORTED'});
const validText = JSON.stringify(validState);
async function submit(name, contents = validText, options = {}) {
  let reads = 0;
  const file = {name, size: options.size ?? Buffer.byteLength(contents),
    webkitRelativePath: options.webkitRelativePath ?? '',
    path: options.path ?? undefined,
    async text() {reads++; if (options.failRead) throw Error('Datei nicht lesbar'); return contents;}};
  get('loadEconFile').emit('change', {target: {files: [file], value: 'path.json'}});
  await new Promise(resolve => setImmediate(resolve));
  return {reads, message: toasts.at(-1)};
}
async function rejected(name, contents = validText, options = {}, early = true) {
  const before = state(), current = storage.get(PRIMARY), backup = storage.get(BACKUP);
  const result = await submit(name, contents, options);
  assert.match(result.message, /Import abgelehnt/);
  if (early) assert.equal(result.reads, 0, 'Unerlaubter Pfad muss vor dem Einlesen scheitern');
  assert.deepEqual(state(), before);
  assert.equal(storage.get(PRIMARY), current);
  assert.equal(storage.get(BACKUP), backup);
}

(async () => {
  await check('Normale JSON-Datei wird importiert, nicht als Pfad interpretiert', async () => {
    ui.start('2-0');
    const r = await submit('Mein-Oelspiel-M1.json');
    assert.equal(r.reads, 1);
    assert.match(r.message, /geprüft und übernommen/);
    assert.deepEqual(state(), validState);
    E.validate(state());
  });

  await check('Relative Traversal-Dateinamen werden vor dem Lesen gesperrt', async () => {
    for (const filename of ['../save.json', '../../etc/passwd.json', 'safe/../../evil.json', './save.json']) {
      await rejected(filename);
    }
  });

  await check('Absolute Unix-Pfade sind keine akzeptierten Dateinamen', async () => {
    for (const filename of ['/etc/passwd.json', '/tmp/save.json', '//server/share/save.json']) await rejected(filename);
  });

  await check('Windows-Pfade und Laufwerkspräfixe dürfen nicht zu Dateizugriffen führen', async () => {
    for (const filename of ['C:\\Users\\Test\\save.json', '\\\\server\\secret\\save.json', 'C:save.json']) await rejected(filename);
  });

  await check('file://, http:// und weitere URL-artige Namen werden abgewiesen', async () => {
    for (const filename of ['file:///etc/secret.json', 'https://bad.example/a.json', 'ftp:backup.json']) await rejected(filename);
  });

  await check('Prozentkodierte Traversalfolgen sind vor dem Dateilesen unzulässig', async () => {
    for (const filename of ['%2e%2e%2fsave.json', 'secret%5c..%5cdata.json', 'safe%2Fbad.json']) await rejected(filename);
  });

  await check('Versteckte Pfade und doppelte Punkte werden nicht entschlüsselt', async () => {
    for (const filename of ['.hidden.json', '..json', 'safe..json']) await rejected(filename);
  });

  await check('Unicode-Trennstriche und Richtungssteuerzeichen werden blockiert', async () => {
    for (const filename of ['a∕b.json', 'a⁄b.json', 'a／b.json', 'safe\u202Ejson.txt.json']) await rejected(filename);
  });

  await check('Kontrollzeichen, NUL und Zeilenumbrüche sind keine Dateinamen', async () => {
    for (const filename of ['a\0.json', 'x\n.json', 'a\r.json']) await rejected(filename);
  });

  await check('Nicht-JSON-Endungen, zu lange oder fehlende Namen werden abgelehnt', async () => {
    for (const filename of ['save.html', 'save.json.js', 'save.json?view=1', '', 'x'.repeat(190) + '.json', null]) await rejected(filename);
  });

  await check('Relative Verzeichnisauswahl wird auch bei harmloser Basisdatei blockiert', async () => {
    await rejected('save.json', validText, {webkitRelativePath: '../../outside/save.json'});
  });

  await check('Künstliche externe path-Eigenschaft wird nie zum Einlesen benutzt', async () => {
    const r = await submit('safe.json', validText, {path: '/etc/passwd'});
    assert.equal(r.reads, 1);
    assert.deepEqual(state(), validState);
    assert.equal(storage.has(PRIMARY), true);
  });

  await check('Verdächtige Schema- und Dateipfadfelder im JSON werden validiert', async () => {
    const wrong = json(validState); wrong.schema = 'file:///etc/secret.json';
    await rejected('save.json', JSON.stringify(wrong), {}, false);
    const injected = json(validState); delete injected.claims['BERLIN-1'];
    injected.claims['../../evil'] = {};
    await rejected('save.json', JSON.stringify(injected), {}, false);
  });

  await check('Pfadartige Firmennamen bleiben inert als Daten, nicht als Dateianweisung', async () => {
    const allowed = json(validState); allowed.companies[0].name = '../../private/not-a-file';
    const r = await submit('Spielstand.json', JSON.stringify(allowed));
    assert.equal(r.reads, 1);
    assert.equal(state().companies[0].name, '../../private/not-a-file');
    assert.ok([...storage.keys()].every(key => [PRIMARY, BACKUP].includes(key)));
  });

  await check('Überdimensionierter JSON-Import wird vor dem Lesen verworfen', async () => {
    await rejected('save.json', '{}', {size: 5_000_001});
  });

  await check('Fehler beim Dateilesen lassen aktive Partie und Sicherungen unverändert', async () => {
    await rejected('save.json', validText, {failRead: true}, false);
  });

  await check('Exportname ist fest vorgegeben und enthält nur gültigen Monatswert', async () => {
    get('saveGame').click();
    assert.match(downloads.at(-1).name, /^PPPOPPI-IMPERIUM-M\d+\.json$/);
    assert.deepEqual(JSON.parse(await downloads.at(-1).blob.text()), state());
  });

  await check('Importhandler nutzt weder Netzwerk noch Dateisystem-Pfadauflösung', () => {
    const body = bridge.slice(bridge.indexOf('function assertSafeImportFile'), bridge.indexOf('function selectDropdown'));
    assert.match(body, /JSON\.parse\(await file\.text\(\)\)/);
    assert.match(body, /assertSafeImportFile\(file\)/);
    assert.doesNotMatch(body, /(?:fetch|XMLHttpRequest|readFileSync|writeFileSync|path\.resolve|window\.open)\s*\(/);
  });

  assert.equal(passed, 18);
  console.log('RESULT SIC-01', passed, 'Dateipfad-, Traversal- und Importgrenzpruefungen bestanden');
})().catch(error => {console.error(error); process.exitCode = 1;});
