'use strict';
const assert=require('node:assert/strict');
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_strategy_engine.js');
require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');
require('./src/strategy_ai_v192.js');
const E=globalThis.OliV082,A=globalThis.PPStrategicAI;
let pass=0,seq=0;
function test(title,fn){try{fn();console.log('OK',++pass,title)}catch(e){console.error('FAIL',title);throw e}}
function go(s,type,companyId='H1',other={}){return E.transition(s,{type,requestId:'V192-'+(++seq),companyId,...other}).state;}
function close(s){for(let safety=0;s.phase==='RESCUE'&&safety<6;safety++){
 const id=s.rescueIds[0];try{s=go(s,'RESCUE_LOAN',id)}catch(_){s=go(s,'RESTART',id)}
 }if(s.phase==='REPORT')return go(s,'NEXT_MONTH');
 if(s.phase==='TURN'){for(let x=0;x<4 && s.phase==='TURN';x++){
  const f=s.companies[s.turnIndex];assert.equal(f.type,'human');s=go(s,'END_TURN',f.id);
 }return close(s)}
 throw Error('Unverstandene Phase '+s.phase)
}
function fixture(ais=2){return E.fresh({humans:1,ais,seed:'KI-MODELL-TEST'})}
function snap(s){return JSON.stringify(s)}
test('Separater Planer vorhanden',()=>{assert.equal(A.version,'1.9.2');assert.equal(A.ready(),true)});
test('Strategien eindeutig je Computerfirma',()=>{assert.equal(A.profile('A1'),'vorsichtig');assert.equal(A.profile('A2'),'wachstumsorientiert');assert.equal(A.profile('A3'),'handelsorientiert')});
test('Strategieauswahl ändert Eingabestand nicht',()=>{const s=fixture(3),x=snap(s);A.rank(s,'A1');assert.equal(snap(s),x)});
test('Fehlende Firma erzeugt keine Vorschläge',()=>{assert.deepEqual(A.rank(fixture(),'A4'),[])});
test('Alle Vorschläge haben plausible Grundstruktur',()=>{for(const v of A.rank(fixture(),'A1')){assert.ok(v.score>0);assert.ok(v.cmd.claimId);assert.ok(v.reason)}});
test('Computerzug beendet Monat und protokolliert Entscheidungen',()=>{let s=go(fixture(2),'END_TURN');assert.equal(s.phase,'REPORT');assert.ok(s.events.some(x=>x.type==='KI_ZUG'));assert.ok(s.events.some(x=>x.type==='KI_ENTSCHEIDUNG'))});
test('Kompletter Engine-State ist nach jedem Computerzug gültig',()=>{let s=fixture(3);for(let i=0;i<20;i++){s=close(s);E.validate(s)}assert.equal(s.month,21)});
test('Computer können keine negativen Guthaben oder unzulässigen Tage bekommen',()=>{let s=fixture(3);for(let i=0;i<18;i++)s=close(s);for(const f of s.companies){assert.ok(f.cashCent>=0);assert.ok(f.daysUsed<=E.CFG.monthDays)}});
test('Determinismus bei gleichem Spielstand und gleichen Eingaben',()=>{let s=fixture(3);const cmd={type:'END_TURN',companyId:'H1',requestId:'IDENTICAL-42'};assert.deepEqual(E.transition(s,cmd).state,E.transition(s,cmd).state)});
test('Doppelte Auftragskennung erzeugt keine neue KI-Aktion',()=>{let s=fixture(2),cmd={type:'END_TURN',companyId:'H1',requestId:'DUP-2026'};s=E.transition(s,cmd).state;const before=snap(s),r=E.transition(s,cmd);assert.equal(r.duplicate,true);assert.equal(snap(s),before)});
test('Ältere gültige Spielstände ohne KI-Erweiterungsblock sind verwendbar',()=>{let s=fixture(2);let x=JSON.parse(snap(s));assert.equal(E.validate(x),true);x=go(x,'END_TURN');assert.equal(x.phase,'REPORT')});
test('Historische KI-Aktionsfolge als technische Rückfalloption verfügbar',()=>{let s=fixture(2);const value=A.enabled;A.enabled=false;try{s=go(s,'END_TURN');assert.equal(s.phase,'REPORT')}finally{A.enabled=value}});
test('Markt und Raffinerie-Exportmodule bleiben nach 24 Monaten konsistent',()=>{let s=fixture(2);for(let i=0;i<24;i++){s=close(s);E.validate(s)}assert.ok(s.publicNetwork&&s.refinery&&s.transport)});
test('Liquiditätsreserve verhindert riskante Neueinkäufe',()=>{let s=fixture(2);s.companies[1].cashCent=1100000;const list=A.rank(s,'A1');assert.ok(!list.some(x=>x.cmd.type==='BUY'||x.cmd.type==='DRILL'))});
test('Schäden und Brände werden in der Entscheidung hoch priorisiert',()=>{let s=fixture(2),c=s.claims['BERLIN-1'];c.owner='A1';c.drilled=true;c.burning=true;const list=A.rank(s,'A1');assert.equal(list[0].cmd.type,'FIRE_EXPERT')});
test('Abgewiesene KI-Vorschläge verändern keine Bestände',()=>{let s=fixture(2);s.companies[1].cashCent=0;s=go(s,'END_TURN');assert.ok(s.companies.every(f=>f.cashCent>=0));E.validate(s)});
test('48 Monate Vergleichsspiel kann ohne Wirtschaftsfehler abgeschlossen werden',()=>{let s=fixture(3);for(let i=0;i<48;i++){s=close(s);E.validate(s)}assert.equal(s.month,49);const dec=s.events.filter(x=>x.type==='KI_ENTSCHEIDUNG');assert.ok(dec.length>0);console.log('DECISIONS',dec.length,'MONTHS',s.month-1,'RESCUES',s.companies.reduce((a,f)=>a+f.stats.rescues,0))});
console.log('ERGEBNIS:',pass,'Fachtests bestanden');
