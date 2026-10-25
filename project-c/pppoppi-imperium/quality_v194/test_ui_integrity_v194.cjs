'use strict';
// Statische Integritätsprüfung; ersetzt keine Browser-, Sicht- oder Kubuntu-Abnahme.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {renderPatched, verifySource} = require('./build.cjs');

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

check('Alle HTML-Quellen sind lokal vorhanden und ohne CDN erreichbar', () => {
  const resources = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  assert.equal(resources.length, 20, 'Anzahl der eingebundenen Skripte/Styles prüfen');
  for (const target of resources) {
    assert.match(target, /^(?:src|legacy_v06)\/[A-Za-z0-9_./-]+$/);
    assert.ok(!target.split('/').includes('..'), 'Kein Pfad darf den Spielordner verlassen');
    assert.ok(fs.statSync(path.join(root, target)).isFile(), 'Fehlende Ressource: ' + target);
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
