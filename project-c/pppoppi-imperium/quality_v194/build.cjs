'use strict';
// Reproduzierbarer Technikaufbau aus den unveränderten 110 Quelloriginalen.
// Kein Release; überschreibt weder Originale noch vorhandene Zielordner.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const gameRoot = path.join(projectRoot, 'SPIEL');
const manifestPath = path.join(projectRoot, 'WIEDERHERSTELLUNG_MANIFEST.json');
const expectedArchiveSha = '94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca';

const changes = [
  ['index.html',
    '<title>PPPOPPI IMPERIUM V1.7.1 PROFI – Neo-Retro Büro & Geschicklichkeitsspiele</title>',
    '<title>PPPOPPI IMPERIUM – Spielkern V1.9.3 · Prüfstand V1.9.4</title>'],
  ['index.html',
    '<span class="pill">V1.6 · PROFI · LIVE</span>',
    '<span class="pill" title="V1.9.4 prüft den V1.9.3-Spielkern; keine Spielfreigabe">SPIEL V1.9.3 · TEST V1.9.4</span>'],
  ['src/neo_bridge.js',
    'Industriepark mit Produktions-, Tank- und Logistikansichten. Die Fabrikgebäude sind derzeit Spielkulisse; es gibt noch keine zusätzliche Raffinerie-Wirtschaftsregel.',
    'Der Industriehof zeigt Produktion, Tanklager und Logistik. Die Gebäudeillustration ist Kulisse; Raffinerie, Verarbeitung und Vertriebswege werden im Wirtschaftskern tatsächlich berechnet.'],
  ['src/neo_bridge.js',
    "window.NeoEconomy={version:'1.7.1',getState:",
    "window.NeoEconomy={version:'1.7.1',gameVersion:'1.9.3',qaVersion:'1.9.4',getState:"],
  ['README_START.txt',
    'PPPOPPI IMPERIUM – NEO-RETRO V1.1',
    'PPPOPPI IMPERIUM – NEO-RETRO V1.9.3 / PRÜFSTAND V1.9.4'],
  ['README_START.txt',
    'SPIELSTART (OHNE INSTALLATION):',
    'VERSIONSSTAND: Spielkern V1.9.3 mit V1.9.4-Prüfschicht, noch keine Endfreigabe.\n\nSPIELSTART (OHNE INSTALLATION):'],
  ['README_START.txt',
    'DATENHINWEIS: V1.1 speichert',
    'DATENHINWEIS: Das Spiel speichert'],
  ['README_START.txt',
    'QUALITÄTSNACHWEISE: docs/BILD_ABNAHME.pdf (9 echte Chromium-Screenshots)',
    'QUALITÄTSNACHWEISE: Bildbelege liegen im geprüften Original-ZIP, nicht im Quellzweig.'],
  ['README_START.txt',
    'Original-V0.8.2 als separate Datei im vergleiche/-Ordner.',
    'Das historische V0.8.2-Archiv liegt nur im ursprünglichen Nutzerpaket.'],
  // Centgenaue Zins- und Tilgungsrundung auch oberhalb 2^53 bei der
  // Zwischenmultiplikation. BigInt darf nicht im JSON-Spielstand landen.
  ['src/v082_engine.js',
    'div(f.debtCent*CFG.loanInterestBps,10000)',
    'Number((BigInt(f.debtCent)*BigInt(CFG.loanInterestBps)+5000n)/10000n)'],
  ['src/v082_engine.js',
    'div(f.debtCent*CFG.loanRepaymentBps,10000)',
    'Number((BigInt(f.debtCent)*BigInt(CFG.loanRepaymentBps)+5000n)/10000n)'],
  // Die spaetere Strategie-Engine hat die Monatsabrechnung selbst kopiert;
  // beide wirklich ausgefuehrten Rechenpfade muessen identisch repariert sein.
  ['src/v082_strategy_engine.js',
    'div(f.debtCent*CFG.loanInterestBps,10000)',
    'Number((BigInt(f.debtCent)*BigInt(CFG.loanInterestBps)+5000n)/10000n)'],
  ['src/v082_strategy_engine.js',
    'div(f.debtCent*CFG.loanRepaymentBps,10000)',
    'Number((BigInt(f.debtCent)*BigInt(CFG.loanRepaymentBps)+5000n)/10000n)'],
  ['test_human_parity_v192.cjs',
    'if(result.status!==0)throw Error(result.stderr);return result.stdout.trim();',
    "if(result.error)throw result.error;if(result.signal)throw Error('Vergleichsprozess abgebrochen: '+result.signal);if(result.status!==0)throw Error(result.stderr||'Vergleichsprozess fehlgeschlagen: '+result.status);const output=result.stdout.trim();if(!output)throw Error('Vergleichsprozess lieferte keine Spielstanddaten');return output;"]
];

function replaceExactlyOnce(text, before, after, relative) {
  const first = text.indexOf(before);
  assert.ok(first >= 0, 'Nicht mehr passender Patch: ' + relative);
  assert.equal(text.indexOf(before, first + before.length), -1, 'Mehrdeutiger Patch: ' + relative);
  return text.slice(0, first) + after + text.slice(first + before.length);
}

function renderPatched(relative, source) {
  let text = source === undefined ? fs.readFileSync(path.join(gameRoot, relative), 'utf8') : source;
  for (const [name, before, after] of changes) {
    if (name === relative) text = replaceExactlyOnce(text, before, after, relative);
  }
  return text;
}

function verifySource() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.source_sha256, expectedArchiveSha);
  assert.equal(manifest.source_entries, 187);
  assert.equal(manifest.total_files, 110);
  assert.equal(manifest.files.length, 110);
  const seen = new Set();
  for (const entry of manifest.files) {
    assert.match(entry.path, /^SPIEL\/[A-Za-z0-9_.\/-]+$/);
    assert.ok(!entry.path.split('/').includes('..'));
    assert.ok(!seen.has(entry.path), 'Doppelter Manifest-Pfad');
    seen.add(entry.path);
    const target = path.join(projectRoot, entry.path);
    const info = fs.lstatSync(target);
    assert.ok(info.isFile() && !info.isSymbolicLink(), 'Keine reguläre Quelle: ' + entry.path);
    assert.equal(info.size, entry.size, 'Geänderte Größe: ' + entry.path);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    assert.equal(digest, entry.sha256, 'Geänderte Originalquelle: ' + entry.path);
  }
  return manifest.files;
}

function build(destination) {
  assert.ok(destination, 'Zielordner fehlt');
  const targetRoot = path.resolve(destination);
  assert.ok(targetRoot !== gameRoot && !targetRoot.startsWith(gameRoot + path.sep), 'Spieloriginale dürfen nicht überschrieben werden');
  assert.ok(!fs.existsSync(targetRoot), 'Zielordner existiert bereits: ' + targetRoot);
  const files = verifySource();
  // Preflight: no output directory is created until all string patches match.
  for (const [name] of changes) renderPatched(name);
  fs.mkdirSync(targetRoot, {recursive: false});
  for (const entry of files) {
    const relative = entry.path.slice('SPIEL/'.length);
    const dest = path.join(targetRoot, relative);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    if (changes.some(([name]) => name === relative)) {
      fs.writeFileSync(dest, renderPatched(relative), 'utf8');
    } else {
      fs.copyFileSync(path.join(projectRoot, entry.path), dest);
    }
  }
  fs.writeFileSync(path.join(targetRoot, 'BUILD_INFO.json'), JSON.stringify({
    kind: 'technical-preview-not-released', gameVersion: '1.9.3', qaVersion: '1.9.4',
    sourceArchiveSha256: expectedArchiveSha, sourceFiles: files.length,
    sourceOverrides: [...new Set(changes.map(c => c[0]))].sort()
  }, null, 2) + '\n');
  return {directory: targetRoot, sourceFiles: files.length};
}

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw Error('Aufruf: node quality_v194/build.cjs <neuer-zielordner>');
    console.log('TECHNIKAUFBAU', JSON.stringify(build(process.argv[2])));
  } catch (error) {
    console.error('AUFBAU GESPERRT:', error.message);
    process.exitCode = 1;
  }
}
module.exports = {build, changes, renderPatched, verifySource};
