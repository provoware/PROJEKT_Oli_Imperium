'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const S = require('./endstate_session_v194.cjs');
const schema = 'pppoppi.endstate.archive.proposal/1';
const rules = v => Object.freeze(v.mode === 'free' ? {mode:'free',version:schema} :
  v.mode === 'campaign' && Number.isInteger(v.months) && v.months >= 12 && v.months <= 240 ?
    {mode:'campaign',months:v.months,version:schema} : (()=>{throw Error('Vertrag ungueltig')})());
const candidate = {rules, evaluate(state,contract,regions,opts={}) {
  if(state.phase==='RESCUE')return {status:'blocked',reason:'rescue-open'};
  const end=contract.mode==='free' ? opts.confirmEnd===true : state.month===contract.months && state.phase==='REPORT';
  if(!end)return {status:'ongoing'};
  return {status:'finished',archive:{schema,mode:contract.mode,durationMonths:contract.mode==='free'?null:contract.months,
    snapshot:JSON.parse(JSON.stringify(state))}};
}};
const engine = {validate(state) {if (!state || !Number.isInteger(state.month) || state.month < 1 || !['TURN','REPORT','RESCUE'].includes(state.phase))throw Error('Spielstand ungueltig');return true;},
  transition(state,command) {if(command.type==='FAIL'){state.month=99;throw Error('Aktion gescheitert');}
    if(command.type==='CORRUPT')return {state:{month:-1,phase:'TURN'}};
    if(command.type==='MONTH'){state.month++;state.phase='REPORT';return {state};}
    throw Error('Aktion unbekannt');}};
const io = {importArchive(text){const a=JSON.parse(text);if(a.schema!==schema)throw Error('Archiv ungueltig');return Object.freeze(a);},exportArchive(a){return JSON.stringify(a);}};
const deps={engine,candidate,io,regions:[]};
const make=(mode='free',month=1,phase='TURN')=>S.createSession({...deps,contract:rules(mode==='free'?{mode}:{mode,months:12}),state:{month,phase}});
test('Freies Spiel: ausdrueckliches Ende und dauerhafte Aktionssperre',()=>{
 const s=make();assert.throws(()=>s.finish(false),/Bestaetigung/);
 assert.equal(s.finish(true).status,'finished');assert.equal(s.status(),'finished');
 assert.throws(()=>s.apply({type:'MONTH'}),/unveraenderbar/);
 assert.throws(()=>s.finish(true),/unveraenderbar/);
 assert.ok(s.exportArchive().includes(schema));
});
test('Kampagne: Abschluss erst beim Schlussbericht',()=>{
 const s=make('campaign',11);assert.equal(s.apply({type:'MONTH'}).status,'finished');
 assert.throws(()=>s.apply({type:'MONTH'}),/unveraenderbar/);
});
test('Abbruch oder ungueltige Engine-Antwort laesst Originalzustand unberuehrt',()=>{
 const s=make();assert.throws(()=>s.apply({type:'FAIL'}),/gescheitert/);
 assert.equal(s.snapshot().month,1);
 assert.throws(()=>s.apply({type:'CORRUPT'}),/ungueltig/);
 assert.equal(s.snapshot().month,1);
});
test('Sitzungs-Rundlauf aktiv und abgeschlossen mit Sperre',()=>{
 const s=make();const loaded=S.importSession(s.exportSession(),deps);
 assert.equal(loaded.apply({type:'MONTH'}).state.month,2);
 loaded.finish(true);
 const finished=S.importSession(loaded.exportSession(),deps);
 assert.equal(finished.status(),'finished');
 assert.throws(()=>finished.apply({type:'MONTH'}),/unveraenderbar/);
});
test('Rettung blockiert freiwilliges Ende ohne Mutation',()=>{
 const s=make('free',2,'RESCUE');assert.equal(s.finish(true).status,'blocked');
 assert.equal(s.status(),'active');
});
test('Unbekannte Vertragsfelder, falsche Archive und doppelte Zustandsarten abweisen',()=>{
 assert.throws(()=>S.createSession({...deps,contract:{...rules({mode:'free'}),extra:1},state:{month:1,phase:'TURN'}}),/vertrag/i);
 const s=make();const raw=JSON.parse(s.exportSession());
 raw.archive={schema,mode:'free',durationMonths:null,snapshot:{month:1,phase:'TURN'}};
 assert.throws(()=>S.importSession(JSON.stringify(raw),deps),/genau eine/);
 raw.state=null;raw.contract=rules({mode:'campaign',months:12});
 assert.throws(()=>S.importSession(JSON.stringify(raw),deps),/widersprechen/);
});
test('Schluesselinjektion, ungueltiges JSON und Groessengrenze abweisen',()=>{
 const s=make();const raw=s.exportSession();
 assert.throws(()=>S.importSession('{',deps),/JSON/);
 assert.throws(()=>S.importSession(' '.repeat(S.MAX_SESSION_BYTES+1),deps),/gross/);
 const data=JSON.parse(raw);data.state=JSON.parse('{"month":1,"phase":"TURN","__proto__":{"polluted":true}}');
 assert.throws(()=>S.importSession(JSON.stringify(data),deps),/Unsicherer/);
});
test('Rausgegebene Zustandskopie darf die aktive Sitzung nicht manipulieren',()=>{
 const s=make();const copy=s.snapshot();copy.month=240;
 assert.equal(s.snapshot().month,1);
 assert.throws(()=>s.exportArchive(),/Noch keine/);
});
test('Echter V0.8.2-Kern: Monatswechsel, freiwilliger Abschluss und Archiv-Neuladen', t=>{
 const fs=require('node:fs'),path=require('node:path');
 const original=path.resolve(__dirname,'../SPIEL/src/v082_strategy_engine.js');
 if(!fs.existsSync(original)) { t.skip('Originalquellen nur im GitHub-Repository vorhanden'); return; }
 require('../SPIEL/src/v07_engine.js');require('../SPIEL/src/v08_engine.js');
 const E=require('../SPIEL/src/v082_strategy_engine.js');
 const C=require('./endstate_candidate_v194.cjs');
 const IO=require('./endstate_archive_io_v194.cjs');
 const d={engine:E,candidate:C,io:IO,regions:E.REGIONS};
 const initial=E.fresh({humans:2,ais:0,seed:'SESSION-REAL-2026'});
 const s=S.createSession({...d,contract:C.rules({mode:'free'}),state:initial});
 s.apply({type:'END_TURN',companyId:'H1',requestId:'SESSION-1'});
 s.apply({type:'END_TURN',companyId:'H2',requestId:'SESSION-2'});
 assert.equal(s.snapshot().phase,'REPORT');
 assert.equal(s.finish(true).status,'finished');
 const loaded=S.importSession(s.exportSession(),d);
 assert.equal(loaded.status(),'finished');
 assert.throws(()=>loaded.apply({type:'END_TURN',companyId:'H1',requestId:'SESSION-3'}),/unveraenderbar/);
 assert.equal(E.validate(loaded.snapshot()),true);
});
