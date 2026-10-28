'use strict';
// Statische Integritätsprüfung; ersetzt keine Browser-, Sicht- oder Kubuntu-Abnahme.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {changes, renderPatched, verifySource} = require('./build.cjs');

const root = path.resolve(__dirname, '../SPIEL');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = renderPatched('index.html');
const bridge = renderPatched('src/neo_bridge.js');
const navigation = read('src/navigation_v191.js');
let passed = 0;

function check(name, fn) {
  fn();
  console.log('PASS', ++passed, name);
}

check('Alle 110 Originalquellen sind vor dem Technikaufbau byteidentisch', () => {
  assert.equal(verifySource().length, 110);
});

check('Spielkern und Prüfschicht sind als zwei Versionen gekennzeichnet', () => {
  assert.match(html, /<title>PPPOPPI IMPERIUM – Spielkern V1\.9\.3 · Prüfstand V1\.9\.4<\/title>/);
  assert.match(html, /SPIEL V1\.9\.3 · TEST V1\.9\.4/);
  assert.doesNotMatch(html, /V1\.6 · PROFI · LIVE/);
  assert.match(bridge, /version:'1\.7\.1',gameVersion:'1\.9\.3',qaVersion:'1\.9\.4'/);
});

check('Klebende Navigation und KI-Knopf ueberdecken im Zoom keine Aktionen', () => {
  assert.match(html, /id="pppoppi-zoom-overlap-v194"/);
  assert.match(html, /#dialog\[open\] \.dhead\{position:static\}/);
  assert.match(html, /#dialog\[open\] \.v191-nav\{position:static\}/);
  assert.match(html, /#dialog\[open\] #pp-ai-button\{position:static/);
  assert.match(html, /#dialog\[open\] #pp-ai-drawer\{position:static/);
  assert.doesNotMatch(read('index.html'), /pppoppi-zoom-overlap-v194/);
});

check('Select-Fokus ist nur in der Technikvorschau sichtbar und kontrastreich', () => {
  assert.match(html, /id="pppoppi-select-focus-v194"/);
  assert.match(html, /#dialog select:focus-visible\{outline:3px solid #ffda8d;outline-offset:3px\}/);
  assert.doesNotMatch(read('index.html'), /pppoppi-select-focus-v194/);
});

check('Monatsabrechnung bricht Tabellenzellen bei schmalem Zoom um', () => {
  assert.match(html, /id="pppoppi-zoom-econ-table-v194"/);
  assert.match(html, /\.econ-table\{display:table;width:100%;max-width:100%;table-layout:fixed\}/);
  assert.match(html, /\.econ-table td\{min-width:0;padding:5px 3px;white-space:normal;overflow-wrap:anywhere;word-break:break-word\}/);
  assert.doesNotMatch(read('index.html'), /pppoppi-zoom-econ-table-v194/);
});

check('Nur die drei freigegebenen V1.9.4-Zusatzmodule werden im Browser geladen', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  assert.ok(scripts.includes('src/strategy_logistics_v193.js'));
  assert.ok(scripts.includes('src/neo_bridge.js'));
  assert.ok(scripts.includes('src/backup_v194.js'), 'Lokaler Backup-Zusatz fehlt');
  assert.ok(scripts.includes('src/endstate_browser_v194.js'), 'Isolierter Endspieladapter fehlt');
  assert.ok(scripts.includes('src/endstate_live_v194.js'), 'Live-Endspieladapter fehlt');
  assert.match(bridge, /window\.PPPEndstateLive\.start\(/);
  assert.match(bridge, /window\.PPPEndstateLive\.apply\(/);
  assert.doesNotMatch(bridge, /E\.transition\(/, 'Kein direkter Spielkern-Aufruf darf den Sitzungsadapter umgehen');
  assert.ok(!scripts.some(file => /v194\.(?:js|cjs)$/.test(file) &&
    !['src/backup_v194.js', 'src/endstate_browser_v194.js', 'src/endstate_live_v194.js'].includes(file)));
  assert.ok(!scripts.some(file => file.includes('evaluate_balance') || file.includes('analyze_stress')));
});

check('Sichtbare Spielartwahl verwendet ausschliesslich den versionierten Endspielvertrag', () => {
  assert.equal(bridge.split('id="econEndMode"').length - 1, 1);
  for (const mode of ['free', 'campaign:12', 'campaign:24', 'campaign:60', 'campaign:120', 'campaign:240']) {
    assert.ok(bridge.includes('value="' + mode + '"'), 'Spielart fehlt: ' + mode);
  }
  assert.ok(bridge.includes("newPartie($('econMode')?.value||'1-2',$('econEndMode')?.value||'free')"));
  assert.doesNotMatch(read('src/neo_bridge.js'), /econEndMode/, 'Original darf keine neue Spielart enthalten');
});

check('Enddialog, Abbruch und schreibgeschuetzte Archivansicht nur im Technikaufbau', () => {
  assert.match(bridge, /function endstateView\(\)/);
  assert.match(bridge, /data-ui="finish-confirm"/);
  assert.match(bridge, /data-ui="finish-cancel"/);
  assert.match(bridge, /PPPEndstateLive\.finish\(\)/);
  assert.match(bridge, /ABSCHLUSSARCHIV · NUR LESEN/);
  assert.match(bridge, /PPPEndstateLive\.status\(\)==='finished'/);
  assert.match(bridge, /endstate:\{kind:'SPIELENDE'/);
  assert.doesNotMatch(read('src/neo_bridge.js'), /finish-confirm|endstateView/);
});

check('V1.9.4-Berichte lesen den tatsächlichen V1.9.3-Kern; dessen Module bleiben bytegleich', () => {
  const runtimeModules = ['src/v082_strategy_engine.js', 'src/strategy_ai_v192.js',
    'src/strategy_logistics_v193.js', 'src/profi_economy.js', 'src/logistics_v17.js'];
  const modifiedFiles = [...new Set(changes.map(entry => entry[0]))];
  assert.deepEqual(modifiedFiles.sort(), ['README_START.txt', 'index.html',
    'src/neo_bridge.js', 'test_human_parity_v192.cjs']);
  for (const name of runtimeModules) assert.ok(!modifiedFiles.includes(name));
  for (const testScript of ['evaluate_balance_v194.cjs', 'analyze_stress_v194.cjs']) {
    const source = read(testScript);
    assert.match(source, /strategy_logistics_v193/);
    assert.match(source, /v082_strategy_engine/);
    assert.doesNotMatch(source, /require\(['"]\.\/src\/strategy_balance_v194/);
  }
  assert.match(read('evaluate_balance_v194.cjs'), /source:'actual V1\.9\.3 game engine'/);
});

check('Alle HTML-Quellen sind lokal vorhanden und ohne CDN erreichbar', () => {
  const resources = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  assert.equal(resources.length, 23, '20 Original-Ressourcen und drei gepruefte Zusaetze');
  for (const target of resources) {
    assert.match(target, /^(?:src|legacy_v06)\/[A-Za-z0-9_./-]+$/);
    assert.ok(!target.split('/').includes('..'), 'Kein Pfad darf den Spielordner verlassen');
    if (target === 'src/endstate_browser_v194.js') {
      assert.ok(require('./endstate_browser_bundle_v194.cjs').bundleSource().length > 5000);
      continue;
    }
    const resolved = ['src/backup_v194.js', 'src/endstate_live_v194.js'].includes(target) ? path.join(__dirname, path.basename(target)) : path.join(root, target);
    assert.ok(fs.statSync(resolved).isFile(), 'Fehlende Ressource: ' + target);
  }
});

check('Industriehof erklärt die vorhandene Raffineriefunktion korrekt', () => {
  assert.match(bridge, /Die Gebäudeillustration ist Kulisse; Raffinerie, Verarbeitung und Vertriebswege werden im Wirtschaftskern tatsächlich berechnet/);
  assert.doesNotMatch(bridge, /es gibt noch keine zusätzliche Raffinerie-Wirtschaftsregel/);
  assert.match(bridge, /factory:\{kind:'INDUSTRIEHOF'/);
  assert.match(bridge, /go\('refinery','🏭 Raffinerie & Vertriebsroute'\)/);
});

check('Lokale Sicherungen haben Oberflächenaktionen und validierten Import', () => {
  for (const id of ['startGame', 'saveGame', 'loadGame', 'loadEconFile']) {
    assert.ok(html.includes('id="' + id + '"'), 'Fehlender Schalter: ' + id);
  }
  assert.match(bridge, /addEventListener\('click',exportGame\)/);
  assert.match(bridge, /addEventListener\('change',e=>\{const file=e\.target\.files\[0\];importGame\(file\)/);
  assert.match(bridge, /E\.validate\(parsed\)/);
  assert.match(bridge, /file\.size>5_000_000/);
});

check('Navigation und vertraulicher Spielerwechsel bleiben geschützt', () => {
  assert.match(navigation, /if\(isPrivate\(\)\)return 'handoff'/);
  assert.match(navigation, /dialog\.addEventListener\('click'/);
  assert.match(bridge, /if\(handoff\)return toast\('Erst den vertraulichen Spielerwechsel abschließen\.'\)/);
  assert.match(bridge, /if\(handoff\)return toast\('Import während der vertraulichen Übergabe gesperrt\.'\)/);
});

check('Mobile Steuerung und reduzierte Animationen sind vorgesehen', () => {
  assert.match(html, /id="mobileActions"/);
  assert.match(html, /@media\(max-width:620px\)/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(bridge, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
});

check('Technikaufbau erklärt fehlende Bildbelege und bleibt unreleased', () => {
  const readme = renderPatched('README_START.txt');
  assert.match(readme, /V1\.9\.3 \/ PRÜFSTAND V1\.9\.4/);
  assert.match(readme, /Bildbelege liegen im geprüften Original-ZIP/);
  assert.match(readme, /noch keine Endfreigabe/);
  const testProgram = renderPatched('test_human_parity_v192.cjs');
  assert.match(testProgram, /if\(result\.error\)throw result\.error/);
  assert.match(testProgram, /Vergleichsprozess lieferte keine Spielstanddaten/);
});

console.log('ERGEBNIS', passed, '/', passed, 'statische UI-Vertragsprüfungen bestanden');
