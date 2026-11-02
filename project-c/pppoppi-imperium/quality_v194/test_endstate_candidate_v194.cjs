'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const C = require('./endstate_candidate_v194.cjs');
const regions = [{id:'BER', buy:1000}, {id:'HAM', buy:2000}];
function state(month=12, phase='REPORT') {
  return {schema:C.ENGINE_SCHEMA, ruleset:'berlin-economy/0.8.2.0',month,phase,
    companies:[
      {id:'H1',cashCent:10000,debtCent:2000,obligations:[{kind:'TILGUNG',dueCent:2000,paidCent:0},{kind:'BETRIEB',dueCent:500,paidCent:100}]},
      {id:'H2',cashCent:8600,debtCent:0,obligations:[]}],
    claims:{'BER-1':{owner:'H1',region:'BER'}}};
}
test('Keine stillen Standardregeln und keine ungueltige Laufzeit',()=>{
  for (const x of [{},{mode:'campaign'},{mode:'campaign',months:0},{mode:'campaign',months:241},{mode:'free',months:12},{mode:'historical'}])
    assert.throws(()=>C.rules(x));
  assert.equal(C.rules({mode:'campaign',months:12}).months,12);
});
test('Freies Spiel hat keinen automatischen Sieger und verlangt Bestaetigung',()=>{
  const s=state(); const before=JSON.stringify(s);
  assert.equal(C.evaluate(s,C.rules({mode:'free'}),regions).status,'ongoing');
  const out=C.evaluate(s,C.rules({mode:'free'}),regions,{confirmEnd:true});
  assert.equal(out.status,'finished');assert.deepEqual(out.archive.winnerIds,[]);
  assert.equal(out.archive.reason,'voluntary-end');assert.equal(JSON.stringify(s),before);
});
test('Kampagne endet nur nach vollstaendigem Schlussbericht',()=>{
  const c=C.rules({mode:'campaign',months:12});
  assert.equal(C.evaluate(state(11),c,regions).status,'ongoing');
  assert.equal(C.evaluate(state(12,'TURN'),c,regions).status,'ongoing');
  assert.equal(C.evaluate(state(12,'RESCUE'),c,regions).reason,'rescue-open');
  assert.throws(()=>C.evaluate(state(13),c,regions),/ueberschritten/);
});
test('Schulden, unbezahlte Rechnungen und Feldwert werden nicht doppelt verrechnet',()=>{
  const a=C.evaluate(state(),C.rules({mode:'campaign',months:12}),regions).archive;
  assert.deepEqual(a.ranking,[{companyId:'H2',scoreCent:'8600',rank:1},{companyId:'H1',scoreCent:'8200',rank:2}]);
  assert.deepEqual(a.winnerIds,['H2']);
});
test('Gleichstand bleibt Gleichstand und Reihenfolge ist deterministisch',()=>{
  const s=state();s.companies[1].cashCent=8200;
  const c=C.rules({mode:'campaign',months:12});
  const a=C.evaluate(s,c,regions).archive;
  assert.deepEqual(a.winnerIds,['H1','H2']);
  assert.deepEqual(a.ranking.map(r=>r.rank),[1,1]);
  assert.deepEqual(C.evaluate(s,c,regions).archive,a);
});
test('Archiv und verschachtelter Spielstand sind unveraenderbar',()=>{
  const s=state();const a=C.evaluate(s,C.rules({mode:'campaign',months:12}),regions).archive;
  assert.throws(()=>{a.snapshot.companies[0].cashCent=1},TypeError);
  assert.throws(()=>C.guardArchived(a,()=>({}),s,{}),/unveraenderbar/);
  assert.equal(s.companies[0].cashCent,10000);
});
test('Ungesicherte Fremddaten und Ueberlaeufe werden abgewiesen',()=>{
  const c=C.rules({mode:'campaign',months:12});
  const invalid=state();invalid.schema='legacy';assert.throws(()=>C.evaluate(invalid,c,regions));
  const wrong=state();wrong.companies[0].cashCent=Number.MAX_SAFE_INTEGER+1;
  assert.throws(()=>C.evaluate(wrong,c,regions),/Geldwerte/);
  const missing=state();assert.throws(()=>C.evaluate(missing,c,[]),/Feldwert/);
});
test('JSON-Export und Import behalten Abschluss und Wertung bei',()=>{
  const a=C.evaluate(state(),C.rules({mode:'campaign',months:12}),regions).archive;
  const imported=JSON.parse(JSON.stringify(a));
  assert.deepEqual(imported,a);
  assert.equal(imported.sourceSchema,C.ENGINE_SCHEMA);
});
test('Echter V0.8.2-Kern: Monatsbericht und freiwilliger Archiv-Entwurf ohne Mutation',()=>{
  require('../SPIEL/src/v07_engine.js');
  require('../SPIEL/src/v08_engine.js');
  const E=require('../SPIEL/src/v082_strategy_engine.js');
  let s=E.fresh({humans:2,ais:0,seed:'END-CANDIDATE-REAL'});
  s=E.transition(s,{type:'END_TURN',companyId:'H1',requestId:'END-CAND-H1'}).state;
  s=E.transition(s,{type:'END_TURN',companyId:'H2',requestId:'END-CAND-H2'}).state;
  assert.equal(s.phase,'REPORT');assert.equal(E.validate(s),true);
  const before=JSON.stringify(s);
  const a=C.evaluate(s,C.rules({mode:'free'}),E.REGIONS,{confirmEnd:true}).archive;
  assert.equal(a.reason,'voluntary-end');
  assert.equal(JSON.stringify(s),before);
  assert.equal(a.sourceRuleset,E.RULESET);
});
console.log('HINWEIS: Prototyp ohne Browser-/Engine-Einbindung; VER-01 und VER-02 bleiben BLOCKED.');
