'use strict';
// WIR-02 / WIR-01: two-hop freight, bottleneck, arrival and actual export sale.
// Deterministic, synthetic starting inventory; original engine is never changed.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const P = globalThis.PPPublicNetwork;
const clone = x => JSON.parse(JSON.stringify(x));
const route = ['B-BB','BB-N'];
assert.deepEqual(P.routeFor('BERLIN','NORD'), route);
const CASES = [{name:'two_hop_open',closed:false,accepted:9000},
  {name:'second_leg_closed',closed:true,accepted:0}];
function firm(s,id) {
  const f = s.companies.find(x => x.id === id);
  assert.ok(f, 'missing company '+id);
  return f;
}
function command(type,id,label,tag,extra={}) {
  return {type,companyId:id,requestId:'FREIGHT-CHAIN-'+label+'-'+tag,...extra};
}
function step(s,c) {
  const snapshot = clone(s);
  const result = E.transition(s,c);
  assert.equal(result.duplicate,false,'unexpected duplicate '+c.requestId);
  assert.deepEqual(s,snapshot,'input mutated '+c.requestId);
  assert.equal(E.validate(result.state),true,'invalid transition '+c.requestId);
  return result.state;
}
function roundtrip(s) {
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(restored,s,'JSON data changed');
  assert.equal(E.validate(restored),true,'invalid restored state');
  return restored;
}
function endMonth(s,label,month) {
  for (const id of ['H1','H2'])
    s = step(s,command('END_TURN',id,label,id+'-END-M'+month));
  assert.equal(s.phase,'REPORT');
  assert.equal(s.lastReport.month,month);
  return s;
}
function nextMonth(s,label,month) {
  s = step(s,command('NEXT_MONTH','H1',label,'NEXT-M'+month));
  assert.equal(s.month,month);
  assert.equal(s.phase,'TURN');
  return s;
}
function play(tc) {
  const label=tc.name;
  let s=E.fresh({humans:2,ais:0,seed:'FREIGHT-CHAIN-'+label});
  for (const id of ['H1','H2']) {
    const f=firm(s,id);
    f.cashCent=20000000;
    for (const region of E.REGIONS) {
      s.refinery.plants[id][region.id].built=true;
      s.refinery.plants[id][region.id].route=true;
      s.transport.firms[id][region.id].enabled=true;
    }
    s.transport.firms[id].BERLIN.marketMilli=30000;
  }
  if(tc.closed) s.publicNetwork.links['BB-N'].downUntil=4;
  assert.equal(E.validate(s),true,'invalid starting fixture');
  const initialInventory=30000;
  const hold=P.freight(18000,route);
  const refund=P.freight(18000-tc.accepted,route);
  const rows=[];
  let duplicates=0, jsonRoundtrips=0, rejectedEarlyOffers=0;
  for(const id of ['H1','H2']) {
    s=step(s,command('PUBLIC_CONNECT',id,label,id+'-CONNECT',
      {from:'BERLIN',to:'NORD'}));
    const prior=firm(s,id);
    const cash=prior.cashCent, ledgerSize=prior.ledger.length;
    const queue=command('PUBLIC_QUEUE',id,label,id+'-QUEUE',
      {from:'BERLIN',to:'NORD',qtyMilli:18000});
    s=step(s,queue);
    assert.equal(cash-firm(s,id).cashCent,hold,'wrong two-hop hold');
    assert.equal(firm(s,id).ledger.length,ledgerSize+1);
    assert.equal(firm(s,id).ledger[ledgerSize].code,'PUBLIC_FREIGHT_HOLD');
    assert.equal(firm(s,id).ledger[ledgerSize].deltaCent,-hold);
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,12000);
    const duplicate=E.transition(s,queue);
    assert.equal(duplicate.duplicate,true);
    assert.deepEqual(duplicate.state,s,'duplicate changed queue');
    duplicates++;
    s=step(s,command('END_TURN',id,label,id+'-END-M1'));
  }
  assert.equal(s.phase,'REPORT');
  assert.equal(s.publicNetwork.queued.length,0);
  assert.equal(s.lastReport.publicNetwork.freight.length,2);
  assert.equal(s.lastReport.publicNetwork.capacity['BB-N'].usedMilli,
    tc.accepted*2,'second-leg capacity mismatch');
  assert.equal(s.lastReport.publicNetwork.capacity['B-BB'].usedMilli,
    tc.accepted*2,'first-leg capacity mismatch');
  for(const id of ['H1','H2']) {
    const allocation=s.lastReport.publicNetwork.freight.find(x=>x.companyId===id);
    assert.ok(allocation,'missing freight allocation');
    assert.equal(allocation.requestedMilli,18000);
    assert.equal(allocation.acceptedMilli,tc.accepted);
    assert.equal(allocation.returnedMilli,18000-tc.accepted);
    assert.equal(allocation.freightCent,P.freight(tc.accepted,route));
    const f=firm(s,id);
    const holds=f.ledger.filter(x=>x.code==='PUBLIC_FREIGHT_HOLD');
    const refunds=f.ledger.filter(x=>x.code==='FRACHT_RUECKGABE');
    assert.equal(holds.length,1);
    assert.equal(refunds.length,1);
    assert.equal(holds[0].deltaCent,-hold);
    assert.equal(refunds[0].deltaCent,refund);
    assert.equal(hold-refund,P.freight(tc.accepted,route));
    assert.equal(s.transport.firms[id].BERLIN.marketMilli,
      initialInventory-tc.accepted,'returned inventory mismatch');
    assert.equal(s.publicNetwork.received[id].NORD,0,'premature delivery');
    const shipments=s.publicNetwork.inTransit.filter(x=>x.companyId===id);
    assert.equal(shipments.length,tc.accepted?1:0);
    if(tc.accepted) {
      assert.equal(shipments[0].arriveMonth,3);
      assert.equal(shipments[0].qtyMilli,tc.accepted);
      assert.deepEqual(shipments[0].path,route);
    }
    rows.push({companyId:id,acceptedMilli:tc.accepted,heldCent:hold,
      refundedCent:refund,netFreightCent:hold-refund});
  }
  s=roundtrip(s);jsonRoundtrips++;
  s=nextMonth(s,label,2);
  for(const id of ['H1','H2']) {
    assert.equal(s.publicNetwork.received[id].NORD,0,'arrival after one hop');
  }
  const premature=command('PUBLIC_OFFER','H1',label,'EARLY-OFFER',
    {from:'BERLIN',to:'NORD',qtyMilli:1000});
  const unchanged=clone(s);
  assert.throws(()=>E.transition(s,premature),/Nicht genug angelieferte Ware/);
  assert.deepEqual(s,unchanged,'early offer changed state');
  rejectedEarlyOffers++;
  s=endMonth(s,label,2);
  assert.equal(s.lastReport.publicNetwork.freight.length,0);
  s=roundtrip(s);jsonRoundtrips++;
  s=nextMonth(s,label,3);
  for(const id of ['H1','H2']) {
    assert.equal(s.publicNetwork.received[id].NORD,tc.accepted,
      'wrong two-hop arrival');
  }
  let expectedRevenue=0;
  const marketPrice=Math.floor((s.prices.NORD*115+50)/100);
  if(tc.accepted) {
    expectedRevenue=Math.floor((tc.accepted*marketPrice+500)/1000);
    const over=command('PUBLIC_OFFER','H1',label,'OVERSELL',
      {from:'BERLIN',to:'NORD',qtyMilli:tc.accepted+1000});
    const before=clone(s);
    assert.throws(()=>E.transition(s,over),/Nicht genug angelieferte Ware/);
    assert.deepEqual(s,before,'oversell changed state');
  }
  for(const id of ['H1','H2']) {
    if(tc.accepted) {
      s=step(s,command('PUBLIC_OFFER',id,label,id+'-OFFER',
        {from:'BERLIN',to:'NORD',qtyMilli:tc.accepted}));
      assert.equal(s.publicNetwork.received[id].NORD,0,'offered stock remains');
    }
    s=step(s,command('END_TURN',id,label,id+'-END-M3'));
  }
  assert.equal(s.phase,'REPORT');
  assert.equal(s.publicNetwork.inTransit.length,0,'shipment remained in transit');
  assert.equal(s.publicNetwork.offers.length,0,'offer not cleared');
  const sales=s.lastReport.publicNetwork.productMarket.NORD.allocations;
  for(const id of ['H1','H2']) {
    const row=sales[id];
    if(tc.accepted) {
      assert.ok(row,'missing export sale');
      assert.equal(row.offeredMilli,tc.accepted);
      assert.equal(row.soldMilli,tc.accepted);
      assert.equal(row.returnedMilli,0);
      assert.equal(row.revenueCent,expectedRevenue);
    } else assert.equal(row,undefined,'sale without shipment');
    const entries=firm(s,id).ledger.filter(x=>x.code==='AUSSENMARKT');
    assert.equal(entries.length,tc.accepted?1:0,'sale booked twice');
    if(tc.accepted) assert.equal(entries[0].deltaCent,expectedRevenue);
    assert.equal(s.publicNetwork.received[id].NORD,0);
    assert.equal(s.transport.firms[id].BERLIN.marketMilli+tc.accepted,
      initialInventory,'stock conservation failed');
  }
  s=roundtrip(s);jsonRoundtrips++;
  s=nextMonth(s,label,4);
  assert.equal(s.publicNetwork.inTransit.length,0);
  assert.equal(s.reports.length,3);
  for(const id of ['H1','H2']) {
    assert.equal(s.publicNetwork.received[id].NORD,0);
    assert.equal(firm(s,id).ledger.filter(x=>x.code==='PUBLIC_FREIGHT_HOLD').length,1);
    assert.equal(firm(s,id).ledger.filter(x=>x.code==='FRACHT_RUECKGABE').length,1);
    assert.equal(firm(s,id).ledger.filter(x=>x.code==='AUSSENMARKT').length,
      tc.accepted?1:0);
  }
  return {scenario:label,closed:tc.closed,months:3,rows,expectedRevenueCent:expectedRevenue,
    duplicatesRejected:duplicates,jsonRoundtrips,rejectedEarlyOffers,
    arrivalMonth:tc.accepted?3:null,finalMonth:s.month};
}
const rows=CASES.map(tc=>{
  const first=play(tc);
  assert.deepEqual(play(tc),first,'non-reproducible '+tc.name);
  return first;
});
console.log(JSON.stringify({
  schema:'pppoppi.freight-chain-sale/1',
  scenarios:2,repeatedRuns:2,totalSimulatedMonths:12,
  checkedCompanyMonths:24,duplicatesRejected:8,jsonRoundtrips:12,
  rejectedEarlyOffers:4,rows,
  noProductionSourceChanges:true,
  limitations:[
    'Synthetic starting inventory and cash; no naturally produced oil or refinery production is established.',
    'Only the Berlin–Brandenburg–Nord route, one shared bottleneck and one blocked-link scenario are covered.',
    'Freight is a cash expense and sales are cash inflows, not proof of profit or asset valuation.',
    'No browser/800x600 validation and no historical C64 authenticity established.'
  ],prereleaseGate:'BLOCKED'
},null,2));
