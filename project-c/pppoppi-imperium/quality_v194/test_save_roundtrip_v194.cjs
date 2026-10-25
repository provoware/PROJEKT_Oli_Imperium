'use strict';
// SPE-01: echte Export-/Import-Handler der Technikfassung mit simulierten
// DOM-Ereignissen und Datei-Downloads; keine vorgezogene visuelle Abnahme.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {Blob} = require('node:buffer');
assert.equal(process.argv.length, 3, 'Aufruf: node test_save_roundtrip_v194.cjs <technische-src>');
const root = path.resolve(process.argv[2]);
for (const name of [
  'v07_engine', 'v08_engine', 'v082_strategy_engine', 'profi_economy',
  'logistics_v17', 'public_network_v171', 'strategy_ai_v192',
  'strategy_logistics_v193'
]) require(path.join(root, name + '.js'));
const E = globalThis.OliV082;
let passed = 0, serial = 0;
const downloads = [], messages = [], scenesShown = [], urls = new Map();
const elementMap = new Map();
function element(id = '') {
  const listeners = new Map();
  return {id, value: '', files: [], style: {}, className: '', textContent: '', innerHTML: '',
    open: false, classList: {add() {}, toggle() {}}, setAttribute() {}, appendChild() {},
    remove() {}, querySelector() {return null;},
    addEventListener(name, fn) {const list = listeners.get(name) || []; list.push(fn); listeners.set(name, list);},
    emit(name, data = {}) {for (const fn of listeners.get(name) || []) fn(data);},
    click() {this.emit('click');}};
}
function get(id) {if (!elementMap.has(id)) elementMap.set(id, element(id)); return elementMap.get(id);}
const document = {
  getElementById: get, querySelectorAll() {return [];}, hidden: false,
  documentElement: {classList: {toggle() {}}},
  createElement(tag) {
    const node = element();
    if (tag === 'a') node.click = () => downloads.push({name: node.download,
      url: node.href, blob: urls.get(node.href)});
    return node;
  },
  body: {appendChild() {}}
};
const URLMock = {createObjectURL(blob) {const id = 'blob:mock-' + (urls.size + 1); urls.set(id, blob); return id;},
  revokeObjectURL() {}};
const window = {OliV082: E, PPProfi: globalThis.PPProfi,
  PPTransport: globalThis.PPTransport, PPPublicNetwork: globalThis.PPPublicNetwork,
  matchMedia() {return {matches: false};}};
const context = {window, document, Blob, URL: URLMock,
  scenes: {}, active: null, show: name => scenesShown.push(name),
  toast: message => messages.push(message),
  setTimeout() {return 0;}, setInterval() {return 0;},
  localStorage: {getItem() {return null;}, setItem() {}}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'neo_bridge.js'), 'utf8'), context,
  {filename: 'neo_bridge.js', timeout: 5000});
const ui = window.NeoEconomy;
const snapshot = () => JSON.parse(JSON.stringify(ui.getState()));
const fireExport = async () => {get('saveGame').click(); const out = downloads.at(-1);
  return out ? {...out, text: await out.blob.text()} : null;};
const file = (content, size = Buffer.byteLength(content)) => ({size, text: async () => content});
async function fireImport(input) {
  get('loadEconFile').emit('change', {target: {files: [input], value: 'test.json'}});
  await new Promise(resolve => setImmediate(resolve));
}
const check = async (label, fn) => {await fn(); console.log('PASS SPE-01', ++passed, label);};
const action = (s, type, who = 'H1', extra = {}) => E.transition(s, {
  type, companyId: who, requestId: 'SPE01-' + (++serial), ...extra}).state;
const make = () => E.fresh({humans: 2, ais: 0, seed: 'SPE01-FULL-STATE'});

(async () => {
  await check('Export ohne gestartete Partie erzeugt keine Datei', async () => {
    get('saveGame').click();
    assert.equal(downloads.length, 0);
    assert.match(messages.at(-1), /Erst eine Partie starten/);
  });

  let baseline, firstExport;
  await check('Echter UI-Export erzeugt eine herunterladbare unverfälschte JSON-Datei', async () => {
    ui.start('2-0');
    ui.send('SURVEY', 'BERLIN-1');
    baseline = snapshot();
    E.validate(baseline);
    firstExport = await fireExport();
    assert.equal(firstExport.name, 'PPPOPPI-IMPERIUM-M1.json');
    assert.equal(firstExport.blob.type, 'application/json');
    assert.equal(firstExport.text, JSON.stringify(baseline, null, 2));
    assert.deepEqual(JSON.parse(firstExport.text), baseline);
    assert.match(messages.at(-1), /lokal exportiert/);
  });

  await check('Import derselben Datei stellt vorherigen Wirtschaftszustand exakt her', async () => {
    ui.send('BUY', 'BERLIN-1');
    assert.notDeepEqual(snapshot(), baseline);
    await fireImport(file(firstExport.text));
    assert.deepEqual(snapshot(), baseline);
    assert.match(messages.at(-1), /geprüft und übernommen/);
    E.validate(snapshot());
  });

  await check('Export nach Wiederherstellung bleibt Byte für Byte gleich', async () => {
    const copy = await fireExport();
    assert.equal(copy.text, firstExport.text);
    assert.equal(copy.name, firstExport.name);
    assert.deepEqual(snapshot().processedIds, baseline.processedIds);
  });

  let extended;
  await check('Offene Verträge, reale Netztransporte und Zahlungsjournale bleiben erhalten', async () => {
    let s = make();
    s.claims['BERLIN-1'].owner = 'H1';
    s.claims['BERLIN-1'].drilled = true;
    s.claims['BERLIN-1'].inventoryMilli = 50000;
    s.refinery.plants.H1.BERLIN.built = true;
    s.refinery.plants.H1.BERLIN.route = true;
    E.validate(s);
    s = action(s, 'SIGN', 'H1', {region: 'BERLIN'});
    s = action(s, 'NETWORK_ENABLE', 'H1', {region: 'BERLIN'});
    s = action(s, 'NETWORK_BUILD', 'H1', {region: 'BERLIN', kind: 'RAW', claimId: 'BERLIN-1'});
    s = action(s, 'NETWORK_RAW', 'H1', {region: 'BERLIN', claimId: 'BERLIN-1', qtyMilli: 10000});
    extended = s;
    await fireImport(file(JSON.stringify(s)));
    assert.deepEqual(snapshot(), s);
    assert.equal(snapshot().companies[0].contracts.length, 1);
    assert.equal(snapshot().transport.shipments.length, 1);
    assert.ok(snapshot().companies[0].ledger.length >= 2);
    const exported = await fireExport();
    assert.deepEqual(JSON.parse(exported.text), s);
  });

  await check('Wiederhergestellter Spielstand setzt dieselbe Aktion deterministisch fort', async () => {
    const command = {type: 'END_TURN', companyId: 'H1', requestId: 'SPE01-CONTINUE-1'};
    const fromOriginal = E.transition(extended, command).state;
    const fromLoaded = E.transition(snapshot(), command).state;
    assert.deepEqual(fromLoaded, fromOriginal);
    E.validate(fromLoaded);
  });

  await check('Abgeschlossener Monatsbericht wird unverändert importiert', async () => {
    let s = make(); s = action(s, 'END_TURN'); s = action(s, 'END_TURN', 'H2');
    assert.equal(s.phase, 'REPORT');
    await fireImport(file(JSON.stringify(s)));
    assert.deepEqual(snapshot(), s);
    assert.equal(scenesShown.at(-1), 'report');
    assert.equal(snapshot().reports.length, 1);
    const out = await fireExport();
    assert.equal(out.name, 'PPPOPPI-IMPERIUM-M1.json');
  });

  await check('Aktive Minispielphase und Drehregler überleben Speichern/Laden', async () => {
    let s = make(); s.claims['BERLIN-1'].owner = 'H1';
    s = action(s, 'DRILL_SELF_START', 'H1', {claimId: 'BERLIN-1'});
    s = action(s, 'MINI_ADJUST', 'H1', {delta: 10});
    E.validate(s);
    await fireImport(file(JSON.stringify(s)));
    assert.deepEqual(snapshot(), s);
    assert.equal(snapshot().minigame.dial, 60);
  });

  await check('Ungültiges JSON lässt den aktiven Spielstand unverändert', async () => {
    const before = snapshot();
    await fireImport(file('{"schema":'));
    assert.deepEqual(snapshot(), before);
    assert.match(messages.at(-1), /Import abgelehnt/);
  });

  await check('Manipulierter Geldbestand wird verworfen, statt importiert', async () => {
    const before = snapshot(), wrong = structuredClone(before);
    wrong.companies[0].cashCent = -1;
    await fireImport(file(JSON.stringify(wrong)));
    assert.deepEqual(snapshot(), before);
    assert.match(messages.at(-1), /Import abgelehnt/);
  });

  await check('Datei über 5 MB wird vor dem Lesen und ohne Verlust gesperrt', async () => {
    const before = snapshot(); let read = false;
    await fireImport({size: 5_000_001, async text() {read = true; return '{}';}});
    assert.equal(read, false);
    assert.deepEqual(snapshot(), before);
    assert.match(messages.at(-1), /zu groß/);
  });

  await check('Vertraulicher Spielerwechsel blockiert Export und Import', async () => {
    ui.start('2-0'); ui.send('END_TURN');
    assert.equal(ui.needsHandoff(), true);
    const before = snapshot(), count = downloads.length;
    get('saveGame').click();
    assert.equal(downloads.length, count);
    assert.match(messages.at(-1), /Spielerwechsel abschließen/);
    await fireImport(file(firstExport.text));
    assert.deepEqual(snapshot(), before);
    assert.match(messages.at(-1), /Übergabe gesperrt/);
  });

  assert.equal(passed, 12);
  console.log('RESULT SPE-01', passed, 'echte Datei-, DOM- und Spielstand-Roundtrips bestanden');
})().catch(error => {console.error(error); process.exitCode = 1;});
