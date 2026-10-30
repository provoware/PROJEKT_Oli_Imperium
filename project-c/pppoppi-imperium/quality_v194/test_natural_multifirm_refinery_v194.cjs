'use strict';
// WIR-02/WIR-03: two real companies, two owned Berlin claims, two refineries,
// real production, raw/product freight, public capacity and external sales.
// This test never modifies the protected game source or injects oil/cash.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171'])
  require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const P = globalThis.PPPublicNetwork;
const copy = value => JSON.parse(JSON.stringify(value));
const IDS = ['H1','H2'];
const CLAIMS = ['BERLIN-1','BERLIN-2'];
const PATH = ['B-BB','BB-N'];
assert.deepEqual(P.routeFor('BERLIN','NORD'), PATH);
function company(s,id) {
  const f=s.companies.find(row=>row.id===id);
  assert.ok(f,'company missing '+id);
  return f;
}
function cmd(type,id,suffix,extra={}) {
  return {type,companyId:id,requestId:'NATURAL-MULTIFIRM-'+id+'-'+suffix,...extra};
}
function step(s,command) {
  const before=copy(s);
  const result=E.transition(s,command);
  assert.equal(result.duplicate,false,'unexpected duplicate '+command.requestId);
  assert.deepEqual(s,before,'input changed by '+command.requestId);
  assert.equal(E.validate(result.state),true,'invalid state '+command.requestId);
  return result.state;
}
function save(s) {
  const restored=copy(s);
  assert.deepEqual(restored,s);
  assert.equal(E.validate(restored),true,'invalid JSON roundtrip');
  return restored;
}
function close(s,month) {
  for(const id of IDS) {
    const action=cmd('END_TURN',id,'END-'+month);
    s=step(s,action);
    const duplicate=E.transition(s,action);
    assert.equal(duplicate.duplicate,true,'duplicate turn not rejected');
    assert.deepEqual(duplicate.state,s,'duplicate turn changed state');
  }
  if(s.phase==='RESCUE') {
    for(const id of [...s.rescueIds]) {
      s=step(s,cmd('RESCUE_LOAN',id,'RESCUE-'+month));
      assert.equal(company(s,id).generation,1,'rescue restarted company');
    }
  }
  assert.equal(s.phase,'REPORT','month did not settle '+month);
  assert.equal(s.lastReport.month,month);
  assert.equal(s.reports.length,month);
  return save(s);
}
function next(s,month) {
  s=step(s,cmd('NEXT_MONTH','H1','NEXT-'+month));
  assert.equal(s.month,month);
  return save(s);
}
function audit(s,initial,allocations,stage) {
  let soldTotal=0, inventoryTotal=0, netLedgerTotal=0;
  for(let i=0;i<IDS.length;i++) {
    const id=IDS[i],claim=s.claims[CLAIMS[i]],f=company(s,id);
    const plant=s.refinery.plants[id].BERLIN;
    const local=s.transport.firms[id].BERLIN;
    const delivered=s.publicNetwork.received[id]?.NORD||0;
    const sold=allocations[id]?.soldMilli||0;
    const ledgerSales=f.ledger.filter(e=>e.code==='AUSSENMARKT');
    const ledgerNet=f.ledger.reduce((n,e)=>n+e.deltaCent,0);
    assert.equal(claim.owner,id,'audit: foreign claim '+stage+' '+id);
    assert.equal(initial[id].reserveMilli-claim.reserveMilli,E.CFG.pumpMilli,
      'audit: wrong production '+stage+' '+id);
    for(const [name,n] of Object.entries({field:claim.inventoryMilli,
      raw:local.rawMilli,product:plant.productMilli,regional:local.marketMilli,
      delivered,sold}))
      assert.ok(Number.isSafeInteger(n)&&n>=0,
        'audit: invalid '+name+' '+stage+' '+id);
    assert.equal(claim.inventoryMilli+local.rawMilli+plant.productMilli+
      local.marketMilli+delivered+sold+1000,E.CFG.pumpMilli,
      'audit: oil conservation '+stage+' '+id);
    assert.equal(f.cashCent-initial[id].cashCent,ledgerNet,
      'audit: cash/ledger mismatch '+stage+' '+id);
    assert.equal(ledgerSales.reduce((n,e)=>n+e.deltaCent,0),
      allocations[id]?.revenueCent||0,
      'audit: external sales ledger mismatch '+stage+' '+id);
    assert.equal(ledgerSales.length,sold>0?1:0,
      'audit: duplicate/missing sale '+stage+' '+id);
    soldTotal+=sold;
    inventoryTotal+=claim.inventoryMilli+local.marketMilli+delivered;
    netLedgerTotal+=ledgerNet;
  }
  assert.equal(soldTotal+inventoryTotal+2000,2*E.CFG.pumpMilli,
    'audit: cross-company oil conservation '+stage);
  return {soldTotal,inventoryTotal,netLedgerTotal};
}
function play() {
  let s=E.fresh({humans:2,ais:0,seed:'NATURAL-MULTIFIRM-REFINERY'});
  const initial={};
  for(let i=0;i<2;i++)
    initial[IDS[i]]={cashCent:company(s,IDS[i]).cashCent,
      reserveMilli:s.claims[CLAIMS[i]].reserveMilli};
  let jsonRoundtrips=0,duplicateQueues=0,foreignRejections=0;
  const allocation={H1:{soldMilli:0,revenueCent:0},H2:{soldMilli:0,revenueCent:0}};
  for(let i=0;i<2;i++) {
    const id=IDS[i],claimId=CLAIMS[i];
    for(const [type,extra] of [
      ['SURVEY',{claimId}],['BUY',{claimId}],['DRILL',{claimId}],
      ['PUMP',{claimId}],['REFINERY_BUILD',{region:'BERLIN',claimId}],
      ['ROUTE_BUILD',{region:'BERLIN'}],['NETWORK_ENABLE',{region:'BERLIN'}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'RAW',claimId}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'PIPE'}],
      ['NETWORK_BUILD',{region:'BERLIN',kind:'FINAL'}],
      ['NETWORK_RAW',{region:'BERLIN',claimId,qtyMilli:10000}]
    ]) s=step(s,cmd(type,id,'M1-'+type+'-'+(extra.kind||''),extra));
    assert.equal(s.claims[claimId].owner,id);
    assert.equal(s.claims[claimId].inventoryMilli,E.CFG.pumpMilli-10000);
    const rival=CLAIMS[1-i];
    if(s.claims[rival].owner && s.claims[rival].owner!==id) {
      const untouched=copy(s);
      assert.throws(()=>E.transition(s,cmd('PUMP',id,'FOREIGN-'+rival,
        {claimId:rival})),/Claim gehört nicht zum Unternehmen/);
      assert.deepEqual(s,untouched);
      foreignRejections++;
    }
  }
  s=close(s,1);jsonRoundtrips++;
  s=next(s,2);jsonRoundtrips++;
  for(let i=0;i<2;i++) {
    const id=IDS[i],claimId=CLAIMS[i];
    assert.equal(s.transport.firms[id].BERLIN.rawMilli,10000);
    s=step(s,cmd('NETWORK_REFINE',id,'M2-REFINE',{region:'BERLIN',claimId}));
    assert.equal(s.refinery.plants[id].BERLIN.productMilli,9000);
    s=step(s,cmd('NETWORK_PRODUCT',id,'M2-PRODUCT',
      {region:'BERLIN',qtyMilli:9000}));
  }
  s=close(s,2);jsonRoundtrips++;
  s=next(s,3);jsonRoundtrips++;
  for(const id of IDS) {
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,9000);
    s=step(s,cmd('PUBLIC_CONNECT',id,'M3-CONNECT',
      {from:'BERLIN',to:'NORD'}));
    const queue=cmd('PUBLIC_QUEUE',id,'M3-QUEUE',
      {from:'BERLIN',to:'NORD',qtyMilli:9000});
    s=step(s,queue);
    const duplicate=E.transition(s,queue);
    assert.equal(duplicate.duplicate,true);
    assert.deepEqual(duplicate.state,s);
    duplicateQueues++;
  }
  s=close(s,3);jsonRoundtrips++;
  const freight={};
  for(const id of IDS) {
    const entry=s.lastReport.publicNetwork.freight.find(x=>x.companyId===id);
    assert.ok(entry,'missing freight allocation '+id);
    assert.equal(entry.requestedMilli,9000);
    assert.equal(entry.acceptedMilli+entry.returnedMilli,9000);
    const held=P.freight(9000,PATH),refunded=P.freight(entry.returnedMilli,PATH);
    const f=company(s,id);
    assert.equal(f.ledger.filter(x=>x.code==='PUBLIC_FREIGHT_HOLD').length,1);
    assert.equal(f.ledger.find(x=>x.code==='PUBLIC_FREIGHT_HOLD').deltaCent,-held);
    assert.equal(f.ledger.filter(x=>x.code==='FRACHT_RUECKGABE')
      .reduce((n,x)=>n+x.deltaCent,0),refunded);
    assert.equal(held-refunded,P.freight(entry.acceptedMilli,PATH));
    freight[id]={acceptedMilli:entry.acceptedMilli,returnedMilli:entry.returnedMilli,
      netFreightCent:held-refunded};
  }
  assert.ok(IDS.some(id=>freight[id].acceptedMilli>0),'no actual public shipment');
  s=next(s,4);jsonRoundtrips++;
  s=close(s,4);jsonRoundtrips++;
  s=next(s,5);jsonRoundtrips++;
  for(const id of IDS) {
    const accepted=freight[id].acceptedMilli;
    assert.equal(s.publicNetwork.received[id]?.NORD||0,accepted);
    if(accepted>0) s=step(s,cmd('PUBLIC_OFFER',id,'M5-OFFER',
      {from:'BERLIN',to:'NORD',qtyMilli:accepted}));
  }
  s=close(s,5);jsonRoundtrips++;
  for(const id of IDS) {
    const market=s.lastReport.publicNetwork.productMarket.NORD.allocations[id];
    allocation[id]={soldMilli:market?.soldMilli||0,
      revenueCent:market?.revenueCent||0};
  }
  const totals=audit(s,initial,allocation,'settled');
  let caught=0;
  for(const id of IDS) {
    const field=CLAIMS[IDS.indexOf(id)];
    for(const change of [
      state=>{state.claims[field].inventoryMilli+=1;},
      state=>{company(state,id).cashCent+=1;},
      state=>{company(state,id).ledger[0].deltaCent+=1;}
    ]) {
      const altered=copy(s);change(altered);
      assert.throws(()=>audit(altered,initial,allocation,'corrupted'),/audit:/);
      caught++;
    }
  }
  assert.equal(s.publicNetwork.inTransit.length,0);
  assert.equal(s.publicNetwork.queued.length,0);
  assert.equal(s.publicNetwork.offers.length,0);
  assert.equal(s.transport.shipments.length,0);
  s=next(s,6);jsonRoundtrips++;
  return {months:5,companyMonthChecks:10,jsonRoundtrips,
    duplicateQueues,foreignRejections,negativeChecks:caught,
    freight,allocation,totals,finalMonth:s.month};
}
const first=play();
assert.deepEqual(play(),first,'non-deterministic two-firm refinery run');
console.log(JSON.stringify({
  schema:'pppoppi.natural-multifirm-refinery/1',
  scenarios:1,repeatedRuns:2,simulatedMonths:10,companyMonthChecks:20,
  jsonRoundtrips:20,duplicateQueuesRejected:4,
  negativeCorruptionsCaught:12,noInjectedOilOrCash:true,
  result:first,prereleaseGate:'BLOCKED',limitations:[
    'Two genuinely owned Berlin fields, two firms and two refineries; five completed months.',
    'External market and public network capacity are exercised, not preloaded.',
    'Cash flow and physical stock are checked; no profit/asset valuation.',
    'No full endgame, C64 reference, resource-rights or browser-dialog clearance.'
  ]
},null,2));
