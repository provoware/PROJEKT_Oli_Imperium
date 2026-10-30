'use strict';
// Reproduzierbarer Technikaufbau aus den unveränderten 110 Quelloriginalen.
// Kein Release; überschreibt weder Originale noch vorhandene Zielordner.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {bundleSource} = require('./endstate_browser_bundle_v194.cjs');

const projectRoot = path.resolve(__dirname, '..');
const gameRoot = path.join(projectRoot, 'SPIEL');
const manifestPath = path.join(projectRoot, 'WIEDERHERSTELLUNG_MANIFEST.json');
const expectedArchiveSha = '94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca';

const changes = [
  // Bei echtem Zoom werden die klebende Szenennavigation und der fixe
  // KI-Knopf ueber Bedienelemente geschoben. Im schmalen Dialog bleiben
  // beide im normalen Dokumentfluss, ohne Funktionen zu entfernen.
  ['index.html',
    '</head>',
    '<style id="pppoppi-zoom-overlap-v194">@media(max-width:620px){#dialog[open] .dhead{position:static}#dialog[open] .v191-nav{position:static}#dialog[open] #pp-ai-button{position:static;display:block;margin:10px 12px 10px auto}#dialog[open] #pp-ai-drawer{position:static;width:calc(100% - 24px);max-height:none;margin:8px auto}}</style>\n</head>'],
  // Browser-Standardfokus bei <select> war bei 175 % nur 0,57 CSS-Pixel
  // breit und hatte gegen den Dialoghintergrund nur 1,18:1 Kontrast.
  // Ausschliesslich in der abgeleiteten Technikvorschau korrigieren.
  ['index.html',
    '</head>',
    '<style id="pppoppi-select-focus-v194">#dialog select:focus-visible{outline:3px solid #ffda8d;outline-offset:3px}</style>\n</head>'],
  // Die sechsspal­tige Monatsabrechnung ueberlief bei 200 % nativem Zoom
  // um 54 CSS-Pixel. Tabellenzellen nur im schmalen Technikdialog umbrechen.
  ['index.html',
    '</head>',
    '<style id="pppoppi-zoom-econ-table-v194">@media(max-width:620px){#dialog[open] .dcontent .econ-table{display:table;width:100%;max-width:100%;table-layout:fixed}#dialog[open] .dcontent .econ-table th,#dialog[open] .dcontent .econ-table td{min-width:0;padding:5px 3px;white-space:normal;overflow-wrap:anywhere;word-break:break-word}}</style>\n</head>'],
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
  ['src/neo_bridge.js',
    "let econ=null, selected='BERLIN-1', commandNo=0, handoff=false, focusReturn='computer', callCount=0;",
    "let econ=null, selected='BERLIN-1', commandNo=0, handoff=false, focusReturn='computer', callCount=0, importRevision=0;"],
  ['src/neo_bridge.js',
    "function newPartie(mode='1-2'){const [humans,ais]=mode.split('-').map(Number);",
    "function newPartie(mode='1-2'){++importRevision;const [humans,ais]=mode.split('-').map(Number);"],
  ['src/neo_bridge.js',
    "E.validate(next.state);econ=next.state;",
    "E.validate(next.state);++importRevision;econ=next.state;"],
  ['src/neo_bridge.js',
    "async function importGame(file){if(handoff)return toast('Import während der vertraulichen Übergabe gesperrt.');if(!file)return;try{if(file.size>5_000_000)throw Error('Spielstand zu groß');let parsed=JSON.parse(await file.text());if(parsed.schema==='pppoppi.berlin.save/0.8'){parsed=E.migrateV08(parsed)}E.validate(parsed);econ=parsed;selected=Object.keys(econ.claims)[0];handoff=false;show(econ.phase==='RESCUE'?'rescue':econ.phase==='REPORT'?'report':'computer');refreshStatus();toast('Spielstand geprüft und übernommen.')}catch(err){toast('Import abgelehnt: '+err.message)}}",
    "async function importGame(file){if(handoff)return toast('Import während der vertraulichen Übergabe gesperrt.');if(!file)return;const revision=++importRevision;try{if(file.size>5_000_000)throw Error('Spielstand zu groß');let parsed=JSON.parse(await file.text());if(revision!==importRevision)return;if(parsed.schema==='pppoppi.berlin.save/0.8'){parsed=E.migrateV08(parsed)}E.validate(parsed);if(revision!==importRevision)return;econ=parsed;selected=Object.keys(econ.claims)[0];handoff=false;show(econ.phase==='RESCUE'?'rescue':econ.phase==='REPORT'?'report':'computer');refreshStatus();toast('Spielstand geprüft und übernommen.')}catch(err){if(revision===importRevision)toast('Import abgelehnt: '+err.message)}}"],
  ['index.html',
    '<script src="src/neo_bridge.js"></script>',
    '<script src="src/backup_v194.js"></script><script src="src/neo_bridge.js"></script>'],
  // Endspieladapter als eigenstaendiges, noch nicht angeschlossenes Browsermodul.
  ['index.html',
    '<script src="src/backup_v194.js"></script><script src="src/neo_bridge.js"></script>',
    '<script src="src/backup_v194.js"></script><script src="src/endstate_browser_v194.js"></script><script src="src/neo_bridge.js"></script>'],
  ['src/neo_bridge.js',
    "econ=E.fresh({humans,ais,seed:'PPPOPPI-2026'});selected=",
    "econ=E.fresh({humans,ais,seed:'PPPOPPI-2026'});window.PPBackup.capture(econ);selected="],
  ['src/neo_bridge.js',
    'E.validate(next.state);++importRevision;econ=next.state;',
    'E.validate(next.state);++importRevision;econ=next.state;window.PPBackup.capture(econ);'],
  ['src/neo_bridge.js',
    'econ=parsed;selected=Object.keys(econ.claims)[0];',
    'econ=parsed;window.PPBackup.capture(econ);selected=Object.keys(econ.claims)[0];'],
  ['src/neo_bridge.js',
    '<div class="econ-actions"><button data-ui="newgame">▶ Neue Partie starten</button></div>',
    '<div class="econ-actions"><button data-ui="newgame">▶ Neue Partie starten</button><button data-ui="restore-backup">💾 Lokale Zwischensicherung wiederherstellen</button></div>'],
  ['src/neo_bridge.js',
    "card('💾 Spielstände','<p>Unabhängige Datei auf dem eigenen Rechner.</p>','<button data-ui=\"export\">Spielstand exportieren</button><button data-ui=\"import\">Spielstand laden</button>')",
    "card('💾 Spielstände','<p>Unabhängige Datei auf dem eigenen Rechner.</p>','<button data-ui=\"export\">Spielstand exportieren</button><button data-ui=\"import\">Spielstand laden</button><button data-ui=\"restore-backup\">Zwischensicherung wiederherstellen</button>')"],
  ['src/neo_bridge.js',
    "case 'import':$('loadEconFile').click();break;",
    "case 'import':$('loadEconFile').click();break;case 'restore-backup':if(handoff){toast('Während des Spielerwechsels gesperrt.');break;}if(econ&&!confirm('Aktuelle Partie durch eine lokale Zwischensicherung ersetzen?'))break;{const revision=++importRevision;window.PPBackup.restore(E.validate).then(({state,older})=>{if(revision!==importRevision)return;econ=state;selected=Object.keys(econ.claims)[0];handoff=false;show(econ.phase==='RESCUE'?'rescue':econ.phase==='REPORT'?'report':'computer');refreshStatus();toast(older?'Ältere gültige Zwischensicherung geladen.':'Zwischensicherung geprüft und geladen.');}).catch(error=>{if(revision===importRevision)toast('Wiederherstellung nicht möglich: '+error.message);});}break;"],
  ['test_human_parity_v192.cjs',
    'if(result.status!==0)throw Error(result.stderr);return result.stdout.trim();',
    "if(result.error)throw result.error;if(result.signal)throw Error('Vergleichsprozess abgebrochen: '+result.signal);if(result.status!==0)throw Error(result.stderr||'Vergleichsprozess fehlgeschlagen: '+result.status);const output=result.stdout.trim();if(!output)throw Error('Vergleichsprozess lieferte keine Spielstanddaten');return output;"],
  ["index.html",
    "<script src=\"src/endstate_browser_v194.js\"></script><script src=\"src/neo_bridge.js\"></script>",
    "<script src=\"src/endstate_browser_v194.js\"></script><script src=\"src/endstate_live_v194.js\"></script><script src=\"src/neo_bridge.js\"></script>"],
  ["src/neo_bridge.js",
    "function newPartie(mode='1-2'){",
    "function newPartie(mode='1-2',endMode='free'){"],
  ["src/neo_bridge.js",
    "econ=E.fresh({humans,ais,seed:'PPPOPPI-2026'});window.PPBackup.capture(econ);selected=",
    "econ=E.fresh({humans,ais,seed:'PPPOPPI-2026'});window.PPBackup.capture(econ);window.PPPEndstateLive.start(econ,endMode);selected="],
  ["src/neo_bridge.js",
    "const next=E.transition(econ,cmd);E.validate(next.state);++importRevision;econ=next.state;window.PPBackup.capture(econ);",
    "const next=window.PPPEndstateLive.apply(econ,cmd);E.validate(next.state);++importRevision;econ=next.state;window.PPBackup.capture(econ);"],
  ["src/neo_bridge.js",
    "econ=E.transition(econ,cmd).state;current=econ.minigame.dial;",
    "econ=window.PPPEndstateLive.apply(econ,cmd).state;current=econ.minigame.dial;"],
  ["src/neo_bridge.js",
    "econ=parsed;window.PPBackup.capture(econ);selected=",
    "window.PPPEndstateLive.detach();econ=parsed;window.PPBackup.capture(econ);selected="],
  ["src/neo_bridge.js",
    "econ=state;selected=Object.keys(econ.claims)[0];handoff=false;",
    "window.PPPEndstateLive.detach();econ=state;selected=Object.keys(econ.claims)[0];handoff=false;"],
  ["src/neo_bridge.js",
    "engine:E};",
    "engine:E,endstate:window.PPPEndstateLive};"],
  // Sichtbare Spielartwahl nur in der abgeleiteten Technikfassung; keine Originalquelle.
  ['src/neo_bridge.js',
    "<div class=\"econ-actions\"><button data-ui=\"newgame\">▶ Neue Partie starten</button><button data-ui=\"restore-backup\">💾 Lokale Zwischensicherung wiederherstellen</button></div>",
    "<label for=\"econEndMode\">Spielart</label><select class=\"econ-select\" id=\"econEndMode\"><option value=\"free\">Freies Spiel – Abschluss auf Wunsch</option><option value=\"campaign:12\">Kampagne – 12 Monate</option><option value=\"campaign:24\">Kampagne – 24 Monate</option><option value=\"campaign:60\">Kampagne – 60 Monate</option><option value=\"campaign:120\">Kampagne – 120 Monate</option><option value=\"campaign:240\">Kampagne – 240 Monate</option></select><div class=\"econ-actions\"><button data-ui=\"newgame\">▶ Neue Partie starten</button><button data-ui=\"restore-backup\">💾 Lokale Zwischensicherung wiederherstellen</button></div>"],
  ['src/neo_bridge.js',
    "case 'newgame':newPartie($('econMode')?.value||'1-2');break;",
    "case 'newgame':newPartie($('econMode')?.value||'1-2',$('econEndMode')?.value||'free');break;"],
  ["src/neo_bridge.js","Object.assign(scenes,{","function endstateEntry(){\n const L=window.PPPEndstateLive, status=L.status();\n if(status==='legacy')return card('🏁 Spielende','<p>Dieser alte Spielstand hat keinen Endspielvertrag. Fuer eine Kampagne bitte eine neue Partie starten.</p>');\n const rule=L.contract();\n const detail=rule.mode==='campaign'?'Kampagne bis Monat '+rule.months+'. Nach dem Schlussbericht wird das Archiv gesperrt.':'Freies Spiel: Ein Abschluss erfolgt nur nach ausdruecklicher Bestaetigung.';\n return card('🏁 Spielende','<p>'+escape(detail)+'</p>',go('endstate',status==='finished'?'Abschlussarchiv oeffnen':'Spielende pruefen'));\n}\nfunction endstateView(){\n if(!ready())return startup();\n if(handoff)return '<p>Erst den vertraulichen Spielerwechsel abschliessen.</p>'+go('computer','Zurueck');\n const L=window.PPPEndstateLive, status=L.status(), rule=L.contract();\n if(status==='legacy')return head('SPIELENDE')+tip('Alte Spielstaende haben keinen Endspielvertrag; keine automatische Umwandlung.')+go('computer','Zurueck zum Spiel');\n if(status==='finished'){\n  const a=L.archive();\n  const rows=a.ranking.map(r=>`<tr><td>${escape(r.rank)}</td><td>${escape(r.companyId)}</td><td>${escape(r.scoreCent)}</td></tr>`).join('');\n  const table=rows?`<table class=\"econ-table\"><caption>Abschlusswertung in Cent</caption><thead><tr><th>Platz</th><th>Firma</th><th>Wertung (Cent)</th></tr></thead><tbody>${rows}</tbody></table>`:'<p>Freies Spiel ohne Siegerwertung abgeschlossen.</p>';\n  return head('ABSCHLUSSARCHIV · NUR LESEN')+`<p role=\"status\">Diese Partie ist endgueltig abgeschlossen. Weitere Wirtschaftsaktionen sind gesperrt.</p><p>Spielart: ${escape(a.mode)} · Abschlussmonat: ${escape(a.endMonth)} · Grund: ${escape(a.reason)}</p>`+table+`<div class=\"econ-actions\">${go('startup','Neue Partie vorbereiten')}${go('computer','Firmencomputer ansehen')}</div>`;\n }\n if(rule.mode==='campaign')return head('KAMPAGNE')+`<p>Geplantes Ende: Monat ${escape(rule.months)}. Die Abschlusswertung entsteht automatisch nach dem letzten Monatsbericht.</p>`+go('computer','Weiterspielen');\n if(econ.phase==='RESCUE')return head('SPIELENDE')+tip('Waehrend einer offenen Sanierung ist kein Abschluss moeglich.')+go('rescue','Sanierung fortsetzen');\n return head('SPIELENDE BESTAETIGEN')+'<p>Diese freie Partie wirklich endgueltig abschliessen? Der aktuelle Spielstand wird als schreibgeschuetztes Abschlussarchiv festgehalten. Danach sind keine weiteren Spielaktionen moeglich.</p><div class=\"econ-actions\"><button type=\"button\" data-ui=\"finish-confirm\">Ja, Partie endgueltig abschliessen</button><button type=\"button\" data-ui=\"finish-cancel\">Nein, weiterspielen</button></div>';\n}\n\nObject.assign(scenes,{"],
  ["src/neo_bridge.js","Object.assign(scenes,{\n startup:","Object.assign(scenes,{\n endstate:{kind:'SPIELENDE',title:'Spielabschluss und Archiv',html:endstateView},\n startup:"],
  ["src/neo_bridge.js","return head('FIRMENCOMPUTER · PPPOPPI OS')+pills()+","return head('FIRMENCOMPUTER · PPPOPPI OS')+pills()+endstateEntry()+"],
  ["src/neo_bridge.js","if(type==='END_TURN'&&econ.phase==='TURN'&&human()?.type==='human'){","if(window.PPPEndstateLive.status()==='finished')show('endstate');\n else if(type==='END_TURN'&&econ.phase==='TURN'&&human()?.type==='human'){"],
  ["src/neo_bridge.js","case 'export':exportGame();break;","case 'finish-confirm':if(handoff){toast('Spielerwechsel zuerst abschliessen.');break;}try{window.PPPEndstateLive.finish();show('endstate');refreshStatus();}catch(error){toast('Abschluss abgelehnt: '+error.message);}break;case 'finish-cancel':show('computer');break;case 'export':exportGame();break;"],
  ["index.html","<input type=\"file\" accept=\".json,application/json\" hidden id=\"loadEconFile\">","<input type=\"file\" accept=\".json,application/json\" hidden id=\"loadEconFile\"><input type=\"file\" accept=\".json,application/json\" hidden id=\"loadSessionFile\">"],
  ["src/neo_bridge.js","card('💾 Spielstände','<p>Unabhängige Datei auf dem eigenen Rechner.</p>','<button data-ui=\"export\">Spielstand exportieren</button><button data-ui=\"import\">Spielstand laden</button><button data-ui=\"restore-backup\">Zwischensicherung wiederherstellen</button>')","card('💾 Spielstände','<p>Der alte Spielstandexport enthaelt keinen Kampagnenvertrag. Fuer vollstaendige Partien bitte die versionierte Sitzung verwenden.</p>','<button data-ui=\"session-export\">Sitzung exportieren</button><button data-ui=\"session-import\">Sitzung laden</button><button data-ui=\"export\">Alter Spielstandexport</button><button data-ui=\"import\">Alten Spielstand laden</button><button data-ui=\"restore-backup\">Zwischensicherung wiederherstellen</button>')"],
  ["src/neo_bridge.js","function selectDropdown(){","\nfunction exportEndstateSession(){\n if(handoff)return toast('Sitzungsexport waehrend des Spielerwechsels gesperrt.');\n let url=null, anchor=null, started=false;\n try{\n  const text=window.PPPEndstateLive.exportSession();\n  url=URL.createObjectURL(new Blob([text],{type:'application/json'}));\n  anchor=document.createElement('a');anchor.href=url;anchor.download='PPPOPPI-SITZUNG-M'+econ.month+'.json';\n  document.body.appendChild(anchor);anchor.click();started=true;\n  // Der Browser kann einen gestarteten Download spaeter abbrechen.\n  toast('Sitzungsdownload gestartet; Datei auf dem Rechner pruefen.');\n }catch(error){toast('Sitzungsexport abgelehnt: '+error.message)}\n finally{\n  if(anchor)anchor.remove();\n  if(url){\n   if(started)setTimeout(()=>URL.revokeObjectURL(url),400);\n   else URL.revokeObjectURL(url);\n  }\n }\n}\nasync function importEndstateSession(file){\n if(handoff)return toast('Sitzungsimport waehrend des Spielerwechsels gesperrt.');\n if(!file)return;\n if(econ&&!confirm('Aktuelle Partie durch die ausgewaehlte Sitzung ersetzen?'))return;\n const revision=++importRevision;\n try{\n  if(file.size>5_000_000)throw Error('Sitzungsdatei zu gross');\n  const text=await file.text();\n  if(revision!==importRevision)return;\n  // Die Adapterpruefung muss vollstaendig erfolgreich sein, bevor econ ersetzt wird.\n  const next=window.PPPEndstateLive.importSession(text);\n  econ=next;selected=Object.keys(econ.claims)[0];handoff=false;\n  show(window.PPPEndstateLive.status()==='finished'?'endstate':econ.phase==='RESCUE'?'rescue':econ.phase==='REPORT'?'report':'computer');\n  refreshStatus();toast('Versionierte Sitzung geprueft und uebernommen.');\n }catch(error){if(revision===importRevision)toast('Sitzungsimport abgelehnt: '+error.message)}\n}\nfunction selectDropdown(){"],
  ["src/neo_bridge.js","case 'export':exportGame();break;","case 'session-export':exportEndstateSession();break;case 'session-import':{const picker=$('loadSessionFile');try{if(typeof picker.showPicker==='function')picker.showPicker();else picker.click();}catch(error){toast('Dateiauswahl nicht moeglich: '+error.message);}break;}case 'export':exportGame();break;"],
  ["src/neo_bridge.js","go('computer','Firmencomputer ansehen')}</div>","go('computer','Firmencomputer ansehen')}<button type=\"button\" data-ui=\"session-export\">Sitzung exportieren</button><button type=\"button\" data-ui=\"session-import\">Sitzung laden</button></div>"],
  ["src/neo_bridge.js","$('loadEconFile').addEventListener('change',e=>{const file=e.target.files[0];importGame(file);e.target.value=''});","$('loadEconFile').addEventListener('change',e=>{const file=e.target.files[0];importGame(file);e.target.value=''});$('loadSessionFile').addEventListener('change',e=>{const file=e.target.files[0];importEndstateSession(file);e.target.value=''});"],
  // PR #27: ehemalige P0-Schutzregeln nur im abgeleiteten Technikaufbau.
  ["src/neo_bridge.js",
    "async function importGame(file){if(handoff)return toast('Import während der vertraulichen Übergabe gesperrt.');if(!file)return;const revision=++importRevision;try{if(file.size>5_000_000)",
    "function assertSafeImportFile(file){\n const filename=file.name===undefined?'spielstand.json':file.name;\n if(typeof filename!=='string'||filename.length<1||filename.length>180||\n    !filename.toLowerCase().endsWith('.json')||\n    /[\\/\\\\:\\x00-\\x1f\\x7f\\u2215\\u2044\\uff0f]/.test(filename)||\n    /(^\\.|\\.\\.|%(?:2e|2f|5c)|[?#\\u202e\\u202d\\u2066-\\u2069])/i.test(filename)||\n    (typeof file.webkitRelativePath==='string'&&file.webkitRelativePath.length>0))\n    throw Error('Unzulässiger Dateiname: nur lokale JSON-Dateien ohne Pfadangaben');\n}\nasync function importGame(file){if(handoff)return toast('Import während der vertraulichen Übergabe gesperrt.');if(!file)return;const revision=++importRevision;try{assertSafeImportFile(file);if(file.size>5_000_000)"],
  ["src/v082_engine.js",
    "div(f.debtCent*CFG.loanInterestBps,10000)",
    "Number((BigInt(f.debtCent)*BigInt(CFG.loanInterestBps)+5000n)/10000n)"],
  ["src/v082_engine.js",
    "div(f.debtCent*CFG.loanRepaymentBps,10000)",
    "Number((BigInt(f.debtCent)*BigInt(CFG.loanRepaymentBps)+5000n)/10000n)"],
  ["src/v082_strategy_engine.js",
    "div(f.debtCent*CFG.loanInterestBps,10000)",
    "Number((BigInt(f.debtCent)*BigInt(CFG.loanInterestBps)+5000n)/10000n)"],
  ["src/v082_strategy_engine.js",
    "div(f.debtCent*CFG.loanRepaymentBps,10000)",
    "Number((BigInt(f.debtCent)*BigInt(CFG.loanRepaymentBps)+5000n)/10000n)"],

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

// Zielpfade werden vor jedem Schreibzugriff auf vorhandene Links und
// Aliasse zum unveraenderlichen Spieloriginal geprueft. Keine Reparatur,
// kein Aufraeumen fremder Ordner und keine Ueberschreibung.
function isInside(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}
function safeBuildTarget(destination) {
  assert.ok(typeof destination === 'string' && destination.trim(), 'Zielordner fehlt');
  const targetRoot = path.resolve(destination);
  assert.ok(path.basename(targetRoot), 'Dateisystemwurzel ist kein Zielordner');
  const parent = path.dirname(targetRoot);
  // Jede existierende Elternkomponente muss ein echtes Verzeichnis sein.
  // Auch ein Symlink auf einen scheinbar harmlosen Pfad wird abgelehnt.
  for (let cursor = parent; ; cursor = path.dirname(cursor)) {
    const info = fs.lstatSync(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(), 'Unsicherer Ziel-Elternordner: ' + cursor);
    if (path.dirname(cursor) === cursor) break;
  }
  const canonicalParent = fs.realpathSync(parent);
  const canonicalTarget = path.join(canonicalParent, path.basename(targetRoot));
  const canonicalGame = fs.realpathSync(gameRoot);
  assert.ok(!isInside(canonicalGame, canonicalTarget), 'Spieloriginale dürfen nicht überschrieben werden');
  // existsSync allein uebersieht haengende Symlinks.
  try {
    fs.lstatSync(targetRoot);
  } catch (error) {
    if (error.code === 'ENOENT') return {targetRoot, canonicalParent, canonicalTarget};
    throw error;
  }
  throw Error('Zielordner existiert bereits: ' + targetRoot);
}

function build(destination) {
  const {targetRoot, canonicalParent, canonicalTarget} = safeBuildTarget(destination);
  const files = verifySource();
  // Preflight: no output directory is created until all string patches match.
  for (const [name] of changes) renderPatched(name);
  // Zusatzskript vor dem Anlegen des Zielordners auf Lesbarkeit und Syntax pruefen.
  new Function(fs.readFileSync(path.join(__dirname, 'backup_v194.js'), 'utf8'));
  new Function(fs.readFileSync(path.join(__dirname, 'endstate_live_v194.js'), 'utf8'));
  const endstateBrowser = bundleSource();
  fs.mkdirSync(targetRoot, {recursive: false, mode: 0o700});
  // Ein nach der Vorpruefung ausgetauschter Elternordner muss vor dem
  // ersten Kopieren auffallen. Eine vollstaendige atomare Garantie gegen
  // gleichzeitige Angreifer ist damit nicht behauptet.
  assert.equal(fs.realpathSync(path.dirname(targetRoot)), canonicalParent, 'Ziel-Elternordner wurde ausgetauscht');
  assert.equal(fs.realpathSync(targetRoot), canonicalTarget, 'Zielordner wurde ausgetauscht');
  const created = fs.lstatSync(targetRoot);
  assert.ok(created.isDirectory() && !created.isSymbolicLink(), 'Zielordner ist kein echtes Verzeichnis');
  for (const entry of files) {
    const relative = entry.path.slice('SPIEL/'.length);
    const dest = path.join(targetRoot, relative);
    fs.mkdirSync(path.dirname(dest), {recursive: true, mode: 0o700});
    if (changes.some(([name]) => name === relative)) {
      fs.writeFileSync(dest, renderPatched(relative), {encoding: 'utf8', flag: 'wx'});
    } else {
      fs.copyFileSync(path.join(projectRoot, entry.path), dest, fs.constants.COPYFILE_EXCL);
    }
  }
  fs.copyFileSync(path.join(__dirname, 'backup_v194.js'),
    path.join(targetRoot, 'src', 'backup_v194.js'), fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(path.join(targetRoot, 'src', 'endstate_browser_v194.js'),
    endstateBrowser, {encoding: 'utf8', flag: 'wx'});
  fs.copyFileSync(path.join(__dirname, 'endstate_live_v194.js'),
    path.join(targetRoot, 'src', 'endstate_live_v194.js'), fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(path.join(targetRoot, 'BUILD_INFO.json'), JSON.stringify({
    kind: 'technical-preview-not-released', gameVersion: '1.9.3', qaVersion: '1.9.4',
    sourceArchiveSha256: expectedArchiveSha, sourceFiles: files.length,
    sourceOverrides: [...new Set(changes.map(c => c[0]))].sort(),
    generatedAddons: ['src/backup_v194.js', 'src/endstate_browser_v194.js', 'src/endstate_live_v194.js']
  }, null, 2) + '\n', {encoding: 'utf8', flag: 'wx'});
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
