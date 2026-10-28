'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const C = require('./endstate_candidate_v194.cjs');
const IO = require('./endstate_archive_io_v194.cjs');
const regions = [{id:'BER',buy:1000}];
function snapshot(month=12,phase='REPORT') {
  return {schema:C.ENGINE_SCHEMA,ruleset:'berlin-economy/0.8.2.0',month,phase,
    companies:[{id:'H1',cashCent:10000,debtCent:2000,obligations:[]},
      {id:'H2',cashCent:8600,debtCent:0,obligations:[]}],
    claims:{'BER-1':{owner:'H1',region:'BER'}}};
}
function archive(mode='campaign') {
  const contract=mode==='free'?C.rules({mode:'free'}):C.rules({mode:'campaign',months:12});
  return C.evaluate(snapshot(),contract,regions,{confirmEnd:true}).archive;
}
function changed(fn) {const obj=JSON.parse(JSON.stringify(archive()));fn(obj);return JSON.stringify(obj);}
test('Kampagne: Export/Import, Rangfolge, unveraenderlicher Spielstand',()=>{
  const a=archive();const raw=IO.exportArchive(a,regions);
  const restored=IO.importArchive(raw,regions);
  assert.deepEqual(restored,a);
  assert.throws(()=>{restored.snapshot.companies[0].cashCent=0},TypeError);
  assert.throws(()=>C.guardArchived(restored,()=>{},snapshot(),{type:'END_TURN'}),/unveraenderbar/);
});
test('Freies Spiel: Ende ohne Sieger bleibt lesbar',()=>{
  const a=archive('free');assert.deepEqual(IO.importArchive(IO.exportArchive(a,regions),regions).winnerIds,[]);
});
test('Andere JSON-Schluesselreihenfolge bleibt gueltig',()=>{
  const a=JSON.parse(JSON.stringify(archive()));const reversed=Object.fromEntries(Object.entries(a).reverse());
  assert.deepEqual(IO.importArchive(JSON.stringify(reversed),regions),a);
});
test('Manipulierte Rangfolge, Sieger und Abschlussmonat werden abgewiesen',()=>{
  for (const fn of [a=>a.ranking[0].scoreCent='999',a=>a.winnerIds=['H1'],a=>a.endMonth=13])
    assert.throws(()=>IO.importArchive(changed(fn),regions),/stimmen nicht/);
});
test('Unstimmiger Schnappschuss und nachtraeglicher REPORT-Wechsel werden abgewiesen',()=>{
  for (const fn of [a=>a.snapshot.companies[0].cashCent=10001,a=>a.snapshot.phase='RESCUE'])
    assert.throws(()=>IO.importArchive(changed(fn),regions));
});
test('Fremde Schemas, zusaetzliche Archivfelder und ungueltige Laufzeit werden abgewiesen',()=>{
  for (const fn of [a=>a.schema='fremd',a=>a.unbekannt=true,a=>a.durationMonths=241])
    assert.throws(()=>IO.importArchive(changed(fn),regions));
});
test('Unbekanntes Feld, ungueltiges JSON und fehlende Daten werden abgewiesen',()=>{
  assert.throws(()=>IO.importArchive(IO.exportArchive(archive(),regions),[]),/Feldwert/);
  for (const bad of ['{',null,'null','[]']) assert.throws(()=>IO.importArchive(bad,regions));
});
test('Groessen-, Tiefen- und Prototyp-Schluesselschutz',()=>{
  assert.throws(()=>IO.importArchive(' '.repeat(IO.MAX_ARCHIVE_BYTES+1),regions),/gross/);
  assert.throws(()=>IO.importArchive(changed(a=>{a.snapshot['__proto__']=null;Object.defineProperty(a.snapshot,'__proto__',{value:{polluted:true},enumerable:true})}),regions),/Unsicherer/);
  assert.throws(()=>IO.importArchive(changed(a=>{let x=a.snapshot;for(let i=0;i<70;i++){x.deep={};x=x.deep}}),regions),/tief/);
});
test('Kein stilles Umdeuten eines aktiven Spielstandes zum Archiv',()=>{
  assert.throws(()=>IO.importArchive(JSON.stringify(snapshot()),regions),/Archivschema/);
});
console.log('HINWEIS: Nur isolierte Archiv-Konsistenzpruefung, keine Browserintegration, keine Signatur.');
