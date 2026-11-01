'use strict';
const test=require('node:test');
const a=require('node:assert/strict');
for(const name of ['v07_engine','v08_engine','v082_engine',
  'profi_economy','logistics_v17','public_network_v171'])
  require('../SPIEL/src/'+name+'.js');
const E=globalThis.OliV082;
const {captureSettledEvents}=require('./valuation_live_event_adapter_v1.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
let sequence=0;
function move(state,type,companyId,extra={}) {
  const command={type,companyId,requestId:'VAL-LIVE-'+(++sequence),...extra};
  const old=copy(state);
  const result=E.transition(state,command);
  a.deepEqual(state,old,'Spielkern wurde veraendert');
  a.equal(result.duplicate,false);
  a.equal(E.validate(result.state),true);
  const replay=E.transition(result.state,command);
  a.equal(replay.duplicate,true);
  a.deepEqual(replay.state,result.state);
  return result.state;
}
function actual(deliver) {
  sequence=0;
  let state=E.fresh({humans:2,ais:0,seed:'VAL-EVENT-'+(deliver?'DELIVERY':'BREACH')});
  for(const [type,extra] of [
    ['SURVEY',{claimId:'BERLIN-1'}],['BUY',{claimId:'BERLIN-1'}],
    ['DRILL',{claimId:'BERLIN-1'}],['SIGN',{region:'BERLIN'}],
    ...(deliver?[['PUMP',{claimId:'BERLIN-1'}]]:[])
  ])state=move(state,type,'H1',extra);
  state=move(state,'END_TURN','H1');
  state=move(state,'END_TURN','H2');
  a.equal(state.phase,'REPORT');
  state=move(state,'NEXT_MONTH','H1');
  state=move(state,'END_TURN','H1');
  state=move(state,'END_TURN','H2');
  a.equal(state.phase,'REPORT');
  a.equal(state.month,2);
  const untouched=copy(state);
  const h1=captureSettledEvents(state,'H1',E.CFG.startCash);
  const h2=captureSettledEvents(state,'H2',E.CFG.startCash);
  a.deepEqual(state,untouched,'Bruecke veraendert Spielstand');
  a.equal(h1.knownCashCent,state.companies.find(f=>f.id==='H1').cashCent);
  a.equal(h2.recognizedCurrentMonthCashSalesCent,0);
  a.equal(h1.valuationStatus,'NOT_COMPUTABLE');
  a.equal(h1.totalAssetsCent,null);
  a.equal(h1.profitCent,null);
  a.equal(h1.productiveConnection,false);
  a.equal(h1.gate,'BLOCKED');
  a.equal(h1.observedLedgerEvents.filter(e=>e.code==='FELDKAUF').length,1);
  a.equal(h1.observedLedgerEvents.filter(e=>e.code==='FACHBOHRUNG').length,1);
  const receipts=h1.observedLedgerEvents.filter(e=>e.code==='VERTRAGSERLÖS');
  a.equal(receipts.length,deliver?1:0);
  a.equal(h1.recognizedCurrentMonthCashSalesCent,deliver?2987600:0);
  a.equal(h1.recognizedReceivablesForTheseCashSalesCent,0);
  a.ok(h1.observedLedgerEvents.some(e=>e.code.startsWith('ZAHLUNG_')
    &&e.classification==='INVOICE_SETTLEMENT_NOT_SECOND_EXPENSE'));
  return {state,h1};
}
for(const deliver of [true,false])test('echter Engine-Vertrag: '+(deliver?'Erfuellung':'Bruch'),()=>{
  const {state,h1}=actual(deliver);
  const corrupt=[
    s=>s.companies[0].ledger.push(copy(s.companies[0].ledger[0])),
    s=>s.companies[0].ledger[0].deltaCent=NaN,
    s=>s.companies[0].cashCent++,
    s=>s.lastReport.companies[0].revenueCent++,
    s=>s.companies[0].obligations[0].paidCent++,
    s=>s.companies[0].obligations[0].dueCent=-1,
    s=>s.claims['BERLIN-1'].owner=null,
    s=>s.claims['BERLIN-1'].drilled=false,
    s=>s.companies[0].generation=2,
    s=>s.companies[0].ledger[0].month=99
  ];
  for(const [index,fn] of corrupt.entries()){
    const bad=copy(state);fn(bad);
    a.throws(()=>captureSettledEvents(bad,'H1',E.CFG.startCash),
      'unentdeckte Datenmanipulation '+index);
  }
  if(deliver){
    const bad=copy(state);
    bad.companies[0].contracts[0].status='BREACH';
    a.throws(()=>captureSettledEvents(bad,'H1',E.CFG.startCash),
      /Vertragserloes ohne echte Abnahme/);
  }
  a.throws(()=>captureSettledEvents(state,'H9',E.CFG.startCash),/Firma/);
  a.throws(()=>captureSettledEvents(state,'H1',-1),/Startkapital/);
  a.throws(()=>captureSettledEvents(state,'H1',E.CFG.startCash+1),/Kassen/);
  a.equal(h1.observedLedgerEvents.length,new Set(h1.observedLedgerEvents.map(x=>x.id)).size);
});
test('kein Endwert aus laufendem Monat oder unvollstaendiger Historie',()=>{
  const s=E.fresh({humans:2,ais:0,seed:'VAL-LIVE-UNSETTLED'});
  a.throws(()=>captureSettledEvents(s,'H1',E.CFG.startCash),/Monatsberichte/);
  const altered=copy(s);
  altered.phase='REPORT';altered.month=2;altered.reports=[];
  a.throws(()=>captureSettledEvents(altered,'H1',E.CFG.startCash),/Monatsberichte/);
});
