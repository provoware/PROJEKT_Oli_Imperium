'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
require('../SPIEL/src/v07_engine.js');
require('../SPIEL/src/v08_engine.js');
const E = require('../SPIEL/src/v082_strategy_engine.js');
const C = require('./endstate_candidate_v194.cjs');
const IO = require('./endstate_archive_io_v194.cjs');
const S = require('./endstate_session_v194.cjs');
global.window = {OliV082:E, PPPEndstate:{candidate:C,io:IO,session:S}};
require('./endstate_live_v194.js');
const L = global.window.PPPEndstateLive;
let serial = 0;
const send = (state,type,companyId='H1') =>
  L.apply(state,{type,companyId,requestId:'LIVE-'+(++serial)}).state;
const fresh = seed => E.fresh({humans:2,ais:0,seed});
test('Echter Spielkern: freie Partie, zwei Zuege, Abschluss und unveraenderbares Archiv',()=>{
  let state=L.start(fresh('LIVE-FREE'),'free');
  assert.equal(L.status(),'active');
  state=send(state,'END_TURN','H1');
  state=send(state,'END_TURN','H2');
  assert.equal(state.phase,'REPORT');
  const raw=L.exportSession();
  assert.equal(JSON.parse(raw).contract.mode,'free');
  assert.equal(L.finish().status,'finished');
  assert.equal(L.status(),'finished');
  const archive=L.archive();
  assert.equal(archive.endMonth,1);
  assert.deepEqual(archive.winnerIds,[]);
  assert.throws(()=>send(state,'NEXT_MONTH'),/unveraenderbar/);
  const completed=L.exportSession();
  assert.equal(L.importSession(completed).phase,'REPORT');
  assert.equal(L.status(),'finished');
  assert.throws(()=>send(state,'NEXT_MONTH'),/unveraenderbar/);
});
test('Echter Spielkern: 12 Monatsberichte, Rangliste, Abschluss ohne Doppelbuchung',()=>{
  let state=L.start(fresh('LIVE-CAMPAIGN'),'campaign:12');
  assert.equal(L.contract().months,12);
  for(let month=1;month<=12;month++){
    assert.equal(state.month,month);
    assert.equal(L.status(),'active');
    state=send(state,'END_TURN','H1');
    state=send(state,'END_TURN','H2');
    let rescueCount=0;
    while(L.status()==='active'&&state.phase==='RESCUE'){
      assert.ok(++rescueCount<6,'Sanierung haengt');
      state=send(state,'RESTART',state.rescueIds[0]);
    }
    if(month<12){
      assert.equal(state.phase,'REPORT');
      state=send(state,'NEXT_MONTH');
    }
  }
  assert.equal(L.status(),'finished');
  assert.equal(state.month,12);
  const a=L.archive();
  assert.equal(a.endMonth,12);
  assert.ok(a.winnerIds.length>0);
  assert.equal(a.ranking.length,2);
  assert.equal(E.validate(a.snapshot),true);
  assert.throws(()=>send(state,'NEXT_MONTH'),/unveraenderbar/);
  const text=L.exportSession();
  assert.equal(L.importSession(text).month,12);
  assert.equal(L.status(),'finished');
  assert.deepEqual(L.archive(),a);
});
test('Ungueltige Sitzung veraendert keine bestehende Partie; Fremdzustand wird blockiert',()=>{
  const state=L.start(fresh('LIVE-ATOMIC'),'free');
  assert.throws(()=>L.importSession('{'),/JSON/);
  assert.equal(L.status(),'active');
  assert.deepEqual(L.exportSession()&&L.contract().mode,'free');
  const other=fresh('LIVE-OTHER');
  assert.throws(()=>send(other,'END_TURN'),/nicht synchron/);
  assert.equal(L.status(),'active');
  assert.equal(L.exportSession().includes('LIVE-ATOMIC'),true);
  assert.throws(()=>L.start(state,'campaign:1'),/Spielart/);
  assert.equal(L.status(),'active');
});
test('Altspielstand wird nur explizit abgekoppelt; keine stillschweigende Kampagnenmigration',()=>{
  const state=L.start(fresh('LIVE-LEGACY'),'free');
  L.detach();
  assert.equal(L.status(),'legacy');
  assert.equal(L.contract(),null);
  assert.throws(()=>L.exportSession(),/Alte Partie/);
  const next=send(state,'END_TURN','H1');
  assert.equal(next.turnIndex,1);
  assert.equal(L.status(),'legacy');
});
