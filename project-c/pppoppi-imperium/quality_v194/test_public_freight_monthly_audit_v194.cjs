'use strict';
// WIR-01 / WIR-04 / BAL-01: real public freight booking, refund and arrival
// across month boundaries; isolated test fixture, never change production files.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) {
  require('../SPIEL/src/' + name + '.js');
}
const E = globalThis.OliV082;
const P = globalThis.PPPublicNetwork;
const copy = value => JSON.parse(JSON.stringify(value));
const path = ['B-BB'];
const cases = [
  {name:'shared_capacity',blocked:false,acceptedMilli:12000},
  {name:'closed_link',blocked:true,acceptedMilli:0}
];
function company(s,id) {
  const f=s.companies.find(x=>x.id===id);
  assert.ok(f,'company missing: '+id);
  return f;
}
function step(s,cmd) {
  const before=copy(s);
  const r=E.transition(s,cmd);
  assert.equal(r.duplicate,false,'unexpected duplicate: '+cmd.requestId);
  assert.deepEqual(s,before,'input state mutated: '+cmd.requestId);
  assert.equal(E.validate(r.state),true,'invalid state: '+cmd.requestId);
  return r.state;
}
function command(type,id,scenario,suffix,extra={}) {
  return {type,companyId:id,requestId:'FREIGHT-AUDIT-'+scenario+'-'+suffix,...extra};
}
function play(testCase) {
  const label=testCase.name;
  let s=E.fresh({humans:2,ais:0,seed:'FREIGHT-AUDIT-'+label});
  for(const id of ['H1','H2']) {
    for(const region of E.REGIONS) {
      s.refinery.plants[id][region.id].built=true;
      s.refinery.plants[id][region.id].route=true;
      s.transport.firms[id][region.id].enabled=true;
      s.transport.firms[id][region.id].marketMilli=30000;
    }
    company(s,id).cashCent=20000000;
  }
  if(testCase.blocked) s.publicNetwork.links['B-BB'].downUntil=3;
  assert.equal(E.validate(s),true,'invalid fixture');
  const held=P.freight(18000,path);
  const accepted=testCase.acceptedMilli;
  const refunded=P.freight(18000-accepted,path);
  const rows=[];
  for(const id of ['H1','H2']) {
    s=step(s,command('PUBLIC_CONNECT',id,label,id+'-CONNECT',
      {from:'BERLIN',to:'BRANDENBURG'}));
    const prior=company(s,id);
    const cash=prior.cashCent;
    const ledgerLength=prior.ledger.length;
    const queue=command('PUBLIC_QUEUE',id,label,id+'-QUEUE',
      {from:'BERLIN',to:'BRANDENBURG',qtyMilli:18000});
    s=step(s,queue);
    const firm=company(s,id);
    assert.equal(cash-firm.cashCent,held,'wrong hold debit');
    assert.equal(firm.ledger.length,ledgerLength+1,'hold not booked once');
    assert.equal(firm.ledger[ledgerLength].code,'PUBLIC_FREIGHT_HOLD');
    assert.equal(firm.ledger[ledgerLength].deltaCent,-held);
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,12000);
    const duplicate=E.transition(s,queue);
    assert.equal(duplicate.duplicate,true,'duplicate queue was accepted');
    assert.deepEqual(duplicate.state,s,'duplicate queue changed state');
    s=step(s,command('END_TURN',id,label,id+'-END-M1'));
  }
  assert.equal(s.phase,'REPORT');
  assert.equal(s.lastReport.month,1);
  assert.equal(s.publicNetwork.queued.length,0,'queued freight remained after close');
  assert.equal(s.lastReport.publicNetwork.freight.length,2);
  for(const id of ['H1','H2']) {
    const allocation=s.lastReport.publicNetwork.freight.find(x=>x.companyId===id);
    assert.ok(allocation,'allocation missing');
    assert.equal(allocation.requestedMilli,18000);
    assert.equal(allocation.acceptedMilli,accepted);
    assert.equal(allocation.returnedMilli,18000-accepted);
    assert.equal(allocation.freightCent,P.freight(accepted,path));
    const f=company(s,id);
    const holds=f.ledger.filter(e=>e.code==='PUBLIC_FREIGHT_HOLD');
    const refunds=f.ledger.filter(e=>e.code==='FRACHT_RUECKGABE');
    assert.equal(holds.length,1,'hold booked repeatedly');
    assert.equal(refunds.length,1,'refund booked repeatedly');
    assert.equal(holds[0].deltaCent,-held);
    assert.equal(refunds[0].deltaCent,refunded);
    assert.equal(held-refunded,P.freight(accepted,path),'net freight mismatch');
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,30000-accepted);
    assert.equal(s.publicNetwork.received[id].BRANDENBURG,0,'premature delivery');
    assert.equal(s.publicNetwork.inTransit.filter(x=>x.companyId===id).length,
      accepted>0?1:0,'unexpected transit count');
    rows.push({companyId:id,heldCent:held,refundedCent:refunded,
      netFreightCent:held-refunded,acceptedMilli:accepted});
  }
  s=copy(s);
  assert.equal(E.validate(s),true,'report JSON roundtrip failed');
  s=step(s,command('NEXT_MONTH','H1',label,'NEXT-M2'));
  assert.equal(s.month,2);
  for(const id of ['H1','H2']) {
    assert.equal(s.publicNetwork.received[id].BRANDENBURG,accepted,
      'delivery missing after month boundary');
  }
  for(const id of ['H1','H2'])
    s=step(s,command('END_TURN',id,label,id+'-END-M2'));
  assert.equal(s.phase,'REPORT');
  assert.equal(s.lastReport.month,2);
  assert.equal(s.lastReport.publicNetwork.freight.length,0,
    'freight was allocated again without a queue');
  for(const id of ['H1','H2']) {
    const f=company(s,id);
    assert.equal(f.ledger.filter(e=>e.code==='PUBLIC_FREIGHT_HOLD').length,1,
      'hold repeated in later month');
    assert.equal(f.ledger.filter(e=>e.code==='FRACHT_RUECKGABE').length,1,
      'refund repeated in later month');
  }
  s=copy(s);
  assert.equal(E.validate(s),true,'second report JSON roundtrip failed');
  s=step(s,command('NEXT_MONTH','H1',label,'NEXT-M3'));
  assert.equal(s.month,3);
  assert.equal(s.reports.length,2);
  return {scenario:label,months:2,rows,finalMonth:s.month,
    blockedLink:testCase.blocked,jsonRoundtrips:2};
}
const rows=cases.map(testCase=>{
  const first=play(testCase);
  assert.deepEqual(play(testCase),first,'non-deterministic '+testCase.name);
  return first;
});
console.log(JSON.stringify({
  schema:'pppoppi.freight-monthly-audit/1',
  scenarios:cases.length,repeatedRuns:2,totalSimulatedMonths:8,
  checkedCompanyMonths:16,duplicateQueuesRejected:8,jsonRoundtrips:8,
  noProductionSourceChanges:true,rows,
  limitations:[
    'Fixture seeds market inventory and cash; this is not a naturally generated freight campaign.',
    'Hold/refund are cash flows, not verified profit or asset valuation.',
    'Two months and one public route do not establish full gameplay balance or C64 authenticity.'
  ],
  prereleaseGate:'BLOCKED'
},null,2));
