import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditMatrix, REQUIRED_AREAS } from './check.mjs';
const source = JSON.parse(fs.readFileSync(new URL('./matrix.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(source);
const good = { gate_id:'QUE-01',result:'PASS',commit:'a'.repeat(40),command:'node --test',date:'2026-10-22' };
const readEvidence = rel => {
  const prefix = 'project-c/pppoppi-imperium/prerelease/evidence/';
  if (!rel.startsWith(prefix) || rel.slice(prefix.length).includes('/')) return null;
  try { return JSON.parse(fs.readFileSync(new URL('./evidence/'+rel.slice(prefix.length),import.meta.url),'utf8')); }
  catch { return null; }
};
test('Ausgangsmatrix ist strukturell gueltig, aber nicht freigabefaehig',()=>{const r=auditMatrix(source,readEvidence);assert.deepEqual(r.errors,[]);assert.ok(r.blockers.length>0);assert.equal(r.summary.total,52);});
test('QUE-02 ist durch eine vorhandene SHA-Prüfung belegt; ohne Datei nicht PASS',()=>{const gate=source.gates.find(g=>g.id==='QUE-02');assert.equal(gate.status,'pass');assert.equal(gate.evidence.length,1);const proof=readEvidence(gate.evidence[0]);assert.equal(proof.gate_id,'QUE-02');assert.equal(proof.verified_files,110);assert.match(auditMatrix(source,rel=>rel===gate.evidence[0]?null:readEvidence(rel)).errors.join(' '),/QUE-02: Nachweis fehlt/);});
test('QUE-03 trennt Spielkern und Prüfschicht und sperrt bei fehlendem Beleg',()=>{const gate=source.gates.find(g=>g.id==='QUE-03');assert.equal(gate.status,'pass');assert.equal(gate.evidence.length,1);const proof=readEvidence(gate.evidence[0]);assert.equal(proof.game_version,'1.9.3');assert.equal(proof.qa_version,'1.9.4');assert.match(auditMatrix(source,rel=>rel===gate.evidence[0]?null:readEvidence(rel)).errors.join(' '),/QUE-03: Nachweis fehlt/);});
test('TES-01 belegt sechs Fachprogramme und kann ohne GitHub-Nachweis nicht PASS sein',()=>{const gate=source.gates.find(g=>g.id==='TES-01');assert.equal(gate.status,'pass');assert.equal(gate.evidence.length,1);const proof=readEvidence(gate.evidence[0]);assert.equal(proof.suites.length,6);assert.equal(proof.total_cases,105);assert.equal(proof.human_parity_sha256,'e9cea8fd1e3320900a31c91bcda27d3400cd06a20cb2ebd26b648cb98f52524a');assert.match(auditMatrix(source,rel=>rel===gate.evidence[0]?null:readEvidence(rel)).errors.join(' '),/TES-01: Nachweis fehlt/);});
test('TES-02 hat 300 reproduzierte Szenariomonate und sperrt fehlende Evidenz',()=>{const gate=source.gates.find(g=>g.id==='TES-02');assert.equal(gate.status,'pass');assert.equal(gate.evidence.length,1);const proof=readEvidence(gate.evidence[0]);assert.equal(proof.balance.months,144);assert.equal(proof.stress.months,156);assert.equal(proof.reproduced_ci_runs.length,3);assert.match(auditMatrix(source,rel=>rel===gate.evidence[0]?null:readEvidence(rel)).errors.join(' '),/TES-02: Nachweis fehlt/);});
test('Pflichtbereiche sind vollstaendig',()=>{assert.deepEqual([...new Set(source.gates.map(g=>g.area))].sort(),[...REQUIRED_AREAS].sort());});
test('Doppelte IDs werden erkannt',()=>{const m=clone();m.gates[1].id=m.gates[0].id;assert.match(auditMatrix(m).errors.join(' '),/Doppelte/);});
test('Unbelegtes PASS ist verboten',()=>{const m=clone();m.gates[0].status='pass';assert.match(auditMatrix(m).errors.join(' '),/PASS ohne Nachweis/);});
test('Pfadmanipulation im Nachweis wird verworfen',()=>{const m=clone();m.gates[0].status='pass';m.gates[0].evidence=['project-c/pppoppi-imperium/prerelease/evidence/../x.json'];assert.match(auditMatrix(m).errors.join(' '),/Nachweispfad/);});
test('Falscher oder fehlender Nachweis wird verworfen',()=>{const m=clone();m.gates[0].status='pass';m.gates[0].evidence=['project-c/pppoppi-imperium/prerelease/evidence/QUE-01.json'];assert.match(auditMatrix(m,()=>null).errors.join(' '),/Nachweis fehlt/);assert.match(auditMatrix(m,()=>({...good,gate_id:'QUE-99'})).errors.join(' '),/Nachweis fehlt/);});
test('Auch formal guter Quellnachweis hebt Quellsperre nicht auf',()=>{const m=clone();m.source_status='missing';m.gates[0].status='pass';m.gates[0].evidence=['project-c/pppoppi-imperium/prerelease/evidence/QUE-01.json'];assert.match(auditMatrix(m,()=>good).errors.join(' '),/ohne importierte/);});
test('Formaler Nachweis wird bei importiertem Status akzeptiert',()=>{const m=clone();m.source_status='imported';m.gates[0].status='pass';m.gates[0].evidence=['project-c/pppoppi-imperium/prerelease/evidence/QUE-01.json'];assert.deepEqual(auditMatrix(m,rel=>rel.endsWith('/QUE-01.json')?good:readEvidence(rel)).errors,[]);});
test('Technische Pflichten duerfen nicht vertagt werden',()=>{const m=clone();m.gates[0].status='deferred';assert.match(auditMatrix(m).errors.join(' '),/Technische Pflicht/);});
test('Persoenliche Abnahme bleibt bis zum Schluss vertagt',()=>{const m=clone();const p=m.gates.find(g=>g.stage==='personal');assert.equal(p.status,'deferred');p.status='open';assert.match(auditMatrix(m).errors.join(' '),/Persoenliche Abnahme/);});
test('Fehlende Pflichtbereiche blockieren die Matrix',()=>{const m=clone();m.gates=m.gates.filter(g=>g.area!=='performance');assert.match(auditMatrix(m).errors.join(' '),/Pflichtbereich fehlt/);});
test('Technisches Gate bleibt bei offenen Punkten gesperrt',()=>{const r=auditMatrix(source,()=>null,'technical');assert.equal(r.ready,false);assert.ok(r.blockers.length>0);});

test('Einzelne entfernte Pflicht trotz erhaltenem Bereich erkannt',()=>{const m=clone();m.gates=m.gates.filter(g=>g.id!=='LOG-02');assert.match(auditMatrix(m).errors.join(' '),/Pflicht-ID fehlt: LOG-02/);});
test('Ersatz-ID verdeckt entfernte Pflicht nicht',()=>{const m=clone();m.gates.find(g=>g.id==='LOG-02').id='LOG-99';assert.match(auditMatrix(m).errors.join(' '),/Pflicht-ID fehlt: LOG-02/);});
test('Neue technische Pflichten duerfen hinzugefuegt werden',()=>{const m=clone();const g=structuredClone(m.gates.find(g=>g.id==='LOG-02'));g.id='LOG-99';m.gates.push(g);assert.deepEqual(auditMatrix(m,readEvidence).errors,[]);});
test('Pflicht darf nicht in fremden Bereich verschoben werden',()=>{const m=clone();m.gates.find(g=>g.id==='LOG-02').area='wirtschaft';assert.match(auditMatrix(m).errors.join(' '),/LOG-02: Bereich muss spiellogik/);});
test('Technische Pflicht darf nicht persoenlich vertagt werden',()=>{const m=clone();const g=m.gates.find(g=>g.id==='LOG-02');g.stage='personal';g.status='deferred';assert.match(auditMatrix(m).errors.join(' '),/Stufe muss technical/);});
test('Persoenliche Pflicht bleibt persoenlich',()=>{const m=clone();const g=m.gates.find(g=>g.id==='FRE-02');g.stage='technical';g.status='open';assert.match(auditMatrix(m).errors.join(' '),/Stufe muss personal/);});
test('Vorzeitige persoenliche PASS-Abnahme wird abgewiesen',()=>{const m=clone();const g=m.gates.find(g=>g.id==='FRE-02');g.status='pass';g.evidence=['project-c/pppoppi-imperium/prerelease/evidence/FRE-02.json'];assert.match(auditMatrix(m,()=>({...good,gate_id:'FRE-02'})).errors.join(' '),/vor technischem Abschluss/);});
test('Unbekannte Fachpraefixe werden abgewiesen',()=>{const m=clone();const g=structuredClone(m.gates.find(g=>g.id==='LOG-02'));g.id='XYZ-01';m.gates.push(g);assert.match(auditMatrix(m).errors.join(' '),/unbekannter Pflichtpraefix/);});
