'use strict';
// Nur lesen: keine Reparatur, kein Loeschen, kein Umschalten auf ein Build.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {verifySource, renderPatched, changes} = require('./build.cjs');
const {bundleSource} = require('./endstate_browser_bundle_v194.cjs');
const root = path.resolve(__dirname, '..');
const gameRoot = path.join(root, 'SPIEL');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expectedInfo = Object.freeze({
  kind: 'technical-preview-not-released', gameVersion: '1.9.3', qaVersion: '1.9.4',
  sourceArchiveSha256: '94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca',
  sourceFiles: 110, sourceOverrides: [...new Set(changes.map(c => c[0]))].sort(),
  generatedAddons: ['src/backup_v194.js', 'src/endstate_browser_v194.js']
});
function expectedFiles() {
  const overrides = new Set(changes.map(c => c[0]));
  const sourceEntries = verifySource().map(entry => {
    const relative = entry.path.slice('SPIEL/'.length);
    const bytes = overrides.has(relative) ? Buffer.from(renderPatched(relative), 'utf8') : null;
    return {path: relative, size: bytes ? bytes.length : entry.size,
      sha256: bytes ? sha(bytes) : entry.sha256};
  });
  const addon = fs.readFileSync(path.join(__dirname, 'backup_v194.js'));
  sourceEntries.push({path: 'src/backup_v194.js', size: addon.length, sha256: sha(addon)});
  const browser = Buffer.from(bundleSource(), 'utf8');
  sourceEntries.push({path: 'src/endstate_browser_v194.js', size: browser.length, sha256: sha(browser)});
  return sourceEntries;
}
function inspect(destination, entries, info = expectedInfo) {
  assert.ok(typeof destination === 'string' && destination.trim(), 'Zielordner fehlt');
  assert.ok(Array.isArray(entries) && entries.length > 0 && entries.length <= 5000, 'Ungueltiges Inventar');
  const expected = new Map();
  for (const entry of entries) {
    assert.ok(typeof entry.path === 'string' && /^[A-Za-z0-9_.\/-]+$/.test(entry.path), 'Ungueltiger Dateipfad');
    assert.ok(!entry.path.split('/').some(x => x === '..' || x === '.' || !x), 'Pfad ausserhalb des Ziels');
    assert.ok(Number.isSafeInteger(entry.size) && entry.size >= 0, 'Ungueltige Dateigroesse');
    assert.match(entry.sha256, /^[a-f0-9]{64}$/, 'Ungueltiger SHA-256');
    assert.ok(!expected.has(entry.path) && entry.path !== 'BUILD_INFO.json', 'Doppelter/reservierter Pfad');
    expected.set(entry.path, entry);
  }
  const target = path.resolve(destination);
  const report = {status: 'absent', expected: entries.length, valid: 0, missing: [], damaged: [], unexpected: [], reason: ''};
  // Keine Symlinks in der vorhandenen Elternkette verfolgen.
  let targetMissing = false;
  for (let cursor = target; ; cursor = path.dirname(cursor)) {
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch (error) {
      if (error.code === 'ENOENT') {
        if (cursor === target) { targetMissing = true; continue; }
        report.status = 'unsafe'; report.reason = 'Elternordner fehlt'; return report;
      }
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      report.status = 'unsafe'; report.reason = 'Kein echtes Verzeichnis: ' + cursor; return report;
    }
    if (path.dirname(cursor) === cursor) break;
  }
  if (targetMissing) return report;
  if (fs.readdirSync(target).length === 0) { report.status = 'empty'; return report; }
  const seen = new Set();
  let infoStatus = 'missing';
  let scanned = 0;
  function walk(directory, prefix, depth) {
    if (depth > 32) throw Error('Zu tiefe Verzeichnisstruktur');
    for (const name of fs.readdirSync(directory)) {
      if (++scanned > 10000) throw Error('Zu viele Verzeichniseintraege');
      const relative = prefix ? prefix + '/' + name : name;
      const filename = path.join(directory, name);
      const stat = fs.lstatSync(filename);
      if (stat.isSymbolicLink()) { report.status = 'unsafe'; report.reason = 'Symbolischer Verweis: ' + relative; return; }
      if (stat.isDirectory()) { walk(filename, relative, depth + 1); if (report.status === 'unsafe') return; continue; }
      if (!stat.isFile()) { report.status = 'unsafe'; report.reason = 'Spezialdatei: ' + relative; return; }
      if (relative === 'BUILD_INFO.json') {
        if (stat.size > 65536) { infoStatus = 'damaged'; continue; }
        try {
          const actual = JSON.parse(fs.readFileSync(filename, 'utf8'));
          infoStatus = JSON.stringify(actual) === JSON.stringify(info) ? 'valid' : 'damaged';
        } catch { infoStatus = 'damaged'; }
        continue;
      }
      const expectedEntry = expected.get(relative);
      if (!expectedEntry) { report.unexpected.push(relative); continue; }
      seen.add(relative);
      if (stat.size !== expectedEntry.size || sha(fs.readFileSync(filename)) !== expectedEntry.sha256) {
        report.damaged.push(relative);
      } else report.valid++;
    }
  }
  try { walk(target, '', 0); }
  catch (error) { report.status = 'unsafe'; report.reason = error.message; return report; }
  if (report.status === 'unsafe') return report;
  for (const relative of expected.keys()) if (!seen.has(relative)) report.missing.push(relative);
  if (infoStatus === 'damaged' || report.damaged.length || report.unexpected.length) report.status = 'damaged';
  else if (report.missing.length) report.status = 'incomplete';
  else if (infoStatus !== 'valid') report.status = 'unconfirmed';
  else report.status = 'complete';
  return report;
}
function diagnose(destination) { return inspect(destination, expectedFiles()); }
if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw Error('Aufruf: node quality_v194/diagnose_build.cjs <zielordner>');
    const result = diagnose(process.argv[2]);
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'complete') process.exitCode = 2;
  } catch (error) { console.error('DIAGNOSE BLOCKIERT:', error.message); process.exitCode = 1; }
}
module.exports = {inspect, diagnose, expectedFiles};
