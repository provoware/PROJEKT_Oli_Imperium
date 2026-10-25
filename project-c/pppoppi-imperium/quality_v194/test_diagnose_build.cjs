'use strict';
// Kleine isolierte Testdaten; Original-Spielstaende werden nicht angefasst.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {inspect} = require('./diagnose_build.cjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'imperium-diagnose-'));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const entries = [{path: 'index.html', size: 2, sha256: sha('OK')},
  {path: 'src/a.js', size: 3, sha256: sha('abc')}];
const info = {kind: 'test'};
let count = 0;
function test(name, fn) { fn(); console.log('PASS', ++count, name); }
function write(relative, content) {
  const filename = path.join(temp, relative);
  fs.mkdirSync(path.dirname(filename), {recursive: true});
  fs.writeFileSync(filename, content);
}
try {
  const target = path.join(temp, 'target');
  test('Fehlender Zielordner', () => assert.equal(inspect(target, entries, info).status, 'absent'));
  fs.mkdirSync(target);
  test('Leerer Zielordner', () => assert.equal(inspect(target, entries, info).status, 'empty'));
  write('target/index.html', 'OK');
  test('Unterbrochene Kopie', () => {
    const r = inspect(target, entries, info);
    assert.equal(r.status, 'incomplete'); assert.deepEqual(r.missing, ['src/a.js']);
  });
  write('target/src/a.js', 'abc');
  test('Vollstaendig aber unbestaetigt', () => assert.equal(inspect(target, entries, info).status, 'unconfirmed'));
  write('target/BUILD_INFO.json', JSON.stringify(info));
  test('Bestaetigt und unveraendert', () => {
    const r = inspect(target, entries, info);
    assert.equal(r.status, 'complete'); assert.equal(r.valid, 2);
  });
  write('target/src/a.js', 'xyz');
  test('Beschaedigte Quelldatei', () => assert.equal(inspect(target, entries, info).status, 'damaged'));
  write('target/src/a.js', 'abc');
  write('target/fremd.txt', 'nicht loeschen');
  test('Fremde Datei bleibt erhalten', () => {
    assert.equal(inspect(target, entries, info).status, 'damaged');
    assert.equal(fs.readFileSync(path.join(target, 'fremd.txt'), 'utf8'), 'nicht loeschen');
  });
  fs.rmSync(path.join(target, 'fremd.txt'));
  write('target/BUILD_INFO.json', '{kaputt');
  test('Kaputte Bestaetigung', () => assert.equal(inspect(target, entries, info).status, 'damaged'));
  fs.rmSync(path.join(target, 'src/a.js'));
  fs.symlinkSync(path.join(temp, 'nicht_vorhanden'), path.join(target, 'src/a.js'));
  test('Haengender Symlink', () => assert.equal(inspect(target, entries, info).status, 'unsafe'));
  const alias = path.join(temp, 'alias');
  fs.symlinkSync(target, alias, 'dir');
  test('Ziel-Symlink', () => assert.equal(inspect(alias, entries, info).status, 'unsafe'));
  test('Traversal im Inventar', () => assert.throws(() => inspect(target, [{path:'../evil',size:1,sha256:sha('x')}], info), /Pfad ausserhalb/));
  console.log('ERGEBNIS', count, '/', count, 'Diagnosetests bestanden');
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
