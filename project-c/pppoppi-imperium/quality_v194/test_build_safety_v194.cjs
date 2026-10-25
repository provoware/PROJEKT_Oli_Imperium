'use strict';
// Isolierte Schreibschutz-Regressionen. Keine bestehenden Spielstaende anfassen.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {build, renderPatched, verifySource} = require('./build.cjs');

const original = path.resolve(__dirname, '../SPIEL');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pppoppi-build-safety-'));
let passed = 0;
function check(name, fn) {
  fn();
  console.log('PASS', ++passed, name);
}

try {
  check('Originalinventar bleibt vor dem Aufbau vollstaendig verifiziert', () => {
    assert.equal(verifySource().length, 110);
  });
  check('Leeres Ziel wird vor dem Schreiben abgelehnt', () => {
    assert.throws(() => build(''), /Zielordner fehlt/);
  });
  check('Ziel unter SPIEL wird vor dem Schreiben abgelehnt', () => {
    const forbidden = path.join(original, '__verbotener_technikaufbau__');
    assert.equal(fs.existsSync(forbidden), false);
    assert.throws(() => build(forbidden), /Spieloriginale/);
    assert.equal(fs.existsSync(forbidden), false);
  });
  check('Symlink-Elternordner wird abgelehnt und sein Ziel bleibt leer', () => {
    const real = path.join(temporary, 'real');
    const alias = path.join(temporary, 'alias');
    fs.mkdirSync(real);
    fs.symlinkSync(real, alias, 'dir');
    assert.throws(() => build(path.join(alias, 'spiel')), /Unsicherer Ziel-Elternordner/);
    assert.deepEqual(fs.readdirSync(real), []);
  });
  check('Auch ein haengender Symlink als Ziel gilt als bereits vorhanden', () => {
    const dangling = path.join(temporary, 'dangling');
    fs.symlinkSync(path.join(temporary, 'nicht_vorhanden'), dangling);
    assert.throws(() => build(dangling), /Zielordner existiert bereits/);
    assert.ok(fs.lstatSync(dangling).isSymbolicLink());
  });
  check('Bestehender Ordner und fremde Inhalte bleiben unveraendert', () => {
    const existing = path.join(temporary, 'existing');
    fs.mkdirSync(existing);
    fs.writeFileSync(path.join(existing, 'fremd.txt'), 'unveraendert');
    assert.throws(() => build(existing), /Zielordner existiert bereits/);
    assert.equal(fs.readFileSync(path.join(existing, 'fremd.txt'), 'utf8'), 'unveraendert');
  });
  check('Nicht existierender Elternordner wird nicht automatisch angelegt', () => {
    const missing = path.join(temporary, 'fehlender_elternordner', 'spiel');
    assert.throws(() => build(missing), /ENOENT/);
    assert.equal(fs.existsSync(path.dirname(missing)), false);
  });
  check('Regulaerer Aufbau erzeugt 110 Quelldateien und Herkunftsnachweis', () => {
    const destination = path.join(temporary, 'build');
    const result = build(destination);
    assert.equal(require('./diagnose_build.cjs').diagnose(destination).status, 'complete');
    assert.equal(result.sourceFiles, 110);
    const info = JSON.parse(fs.readFileSync(path.join(destination, 'BUILD_INFO.json'), 'utf8'));
    assert.equal(info.kind, 'technical-preview-not-released');
    assert.equal(info.sourceFiles, 110);
    assert.deepEqual(info.sourceOverrides, ['README_START.txt', 'index.html', 'src/neo_bridge.js', 'test_human_parity_v192.cjs']);
    assert.equal(fs.readFileSync(path.join(destination, 'index.html'), 'utf8'), renderPatched('index.html'));
    assert.equal(fs.readFileSync(path.join(destination, 'src/neo_bridge.js'), 'utf8'), renderPatched('src/neo_bridge.js'));
    assert.equal(fs.readFileSync(path.join(destination, 'src/profi_economy.js'), 'utf8'),
      fs.readFileSync(path.join(original, 'src/profi_economy.js'), 'utf8'));
  });
  console.log('ERGEBNIS', passed, '/', passed, 'Aufbau-Sicherheitspruefungen bestanden');
} finally {
  // Ausschliesslich das eigens erzeugte temporaere Testverzeichnis.
  fs.rmSync(temporary, {recursive: true, force: true});
}

// Isolierte Diagnose-Regressionsfaelle im bestehenden CI-Pflichtschritt.
require('./test_diagnose_build.cjs');
