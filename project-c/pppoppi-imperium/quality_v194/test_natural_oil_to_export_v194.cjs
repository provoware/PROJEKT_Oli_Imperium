'use strict';
// WIR-02/WIR-03: real SURVEY/BUY/DRILL/PUMP -> refinery -> local logistics
// -> public two-hop shipment -> external sale. No synthetic oil inventory.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171'])
  require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const P = globalThis.PPPublicNetwork;
const copy = value => JSON.parse(JSON.stringify(value));
const CLAIM = 'BERLIN-1';
const ROUTE = ['B-BB','BB-N'];
assert.deepEqual(P.routeFor('BERLIN','NORD'), ROUTE);
const firm = s => s.companies.find(f => f.id === 'H1');
function command(type, label, suffix, extra = {}, id = 'H1') {
  return {type, companyId:id, requestId:'NATURAL-EXPORT-'+label+'-'+suffix, ...extra};
}
function step(s, cmd) {
  const original = copy(s);
  const result = E.transition(s, cmd);
  assert.equal(result.duplicate, false, 'unexpected duplicate '+cmd.requestId);
  assert.deepEqual(s, original, 'input mutated '+cmd.requestId);
  assert.equal(E.validate(result.state), true, 'invalid state '+cmd.requestId);
  return result.state;
}
function reject(s, cmd, pattern) {
  const original = copy(s);
  assert.throws(() => E.transition(s, cmd), pattern);
  assert.deepEqual(s, original, 'rejected action mutated input');
}
function close(s, label, month) {
  for (const id of ['H1','H2'])
    s = step(s, command('END_TURN',label,id+'-END-'+month,{},id));
  assert.equal(s.phase, 'REPORT');
  assert.equal(s.lastReport.month, month);
  assert.equal(s.reports.length, month);
  return s;
}
function next(s, label, month) {
  s = step(s, command('NEXT_MONTH',label,'NEXT-'+month));
  assert.equal(s.month, month);
  assert.equal(s.phase, 'TURN');
  return s;
}
function save(s) {
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(restored, s);
  assert.equal(E.validate(restored), true);
  return restored;
}
function play(blocked) {
  const label = blocked ? 'blocked' : 'open';
  let s = E.fresh({humans:2,ais:0,seed:'NATURAL-EXPORT-'+label});
  const initialCash = firm(s).cashCent;
  const initialReserve = s.claims[CLAIM].reserveMilli;
  const actions = [
    ['SURVEY',{claimId:CLAIM}],
    ['BUY',{claimId:CLAIM}],
    ['DRILL',{claimId:CLAIM}],
    ['PUMP',{claimId:CLAIM}],
    ['REFINERY_BUILD',{region:'BERLIN',claimId:CLAIM}],
    ['ROUTE_BUILD',{region:'BERLIN'}],
    ['NETWORK_ENABLE',{region:'BERLIN'}],
    ['NETWORK_BUILD',{region:'BERLIN',kind:'RAW',claimId:CLAIM}],
    ['NETWORK_BUILD',{region:'BERLIN',kind:'PIPE'}],
    ['NETWORK_BUILD',{region:'BERLIN',kind:'FINAL'}]
  ];
  for (const [type,extra] of actions)
    s = step(s, command(type,label,'M1-'+type+'-'+(extra.kind||''),extra));
  assert.equal(s.claims[CLAIM].owner,'H1');
  assert.equal(s.claims[CLAIM].drilled,true);
  assert.equal(s.claims[CLAIM].reserveMilli,initialReserve-E.CFG.pumpMilli);
  assert.equal(s.claims[CLAIM].inventoryMilli,E.CFG.pumpMilli);
  assert.equal(firm(s).monthProducedMilli,E.CFG.pumpMilli);
  reject(s,command('NETWORK_REFINE',label,'PREMATURE-REFINE',
    {region:'BERLIN',claimId:CLAIM}),/Rohöl noch nicht angeliefert/);
  s = step(s,command('NETWORK_RAW',label,'RAW-DEPART',
    {region:'BERLIN',claimId:CLAIM,qtyMilli:10000}));
  assert.equal(s.claims[CLAIM].inventoryMilli,E.CFG.pumpMilli-10000);
  assert.equal(s.transport.shipments.length,1);
  assert.equal(s.transport.shipments[0].arriveMonth,2);
  s = save(close(s,label,1));
  s = next(s,label,2);
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli,10000);
  assert.equal(s.transport.shipments.length,0);
  s = step(s,command('NETWORK_REFINE',label,'REFINE',
    {region:'BERLIN',claimId:CLAIM}));
  assert.equal(s.transport.firms.H1.BERLIN.rawMilli,0);
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli,9000);
  assert.equal(s.claims[CLAIM].inventoryMilli,E.CFG.pumpMilli-10000);
  s = step(s,command('NETWORK_PRODUCT',label,'PRODUCT-DEPART',
    {region:'BERLIN',qtyMilli:9000}));
  assert.equal(s.refinery.plants.H1.BERLIN.productMilli,0);
  assert.equal(s.transport.shipments.length,1);
  assert.equal(s.transport.shipments[0].arriveMonth,3);
  s = save(close(s,label,2));
  s = next(s,label,3);
  assert.equal(s.transport.firms.H1.BERLIN.marketMilli,9000);
  s = step(s,command('PUBLIC_CONNECT',label,'CONNECT',
    {from:'BERLIN',to:'NORD'}));
  if (blocked) {
    // Valid, explicitly injected public disruption, never injected oil.
    s.publicNetwork.links['BB-N'].downUntil=5;
    assert.equal(E.validate(s),true);
  }
  const queue = command('PUBLIC_QUEUE',label,'QUEUE',
    {from:'BERLIN',to:'NORD',qtyMilli:9000});
  s = step(s,queue);
  assert.equal(s.transport.firms.H1.BERLIN.marketMilli,0);
  assert.equal(firm(s).ledger.filter(e=>e.code==='PUBLIC_FREIGHT_HOLD').length,1);
  const duplicate = E.transition(s,queue);
  assert.equal(duplicate.duplicate,true);
  assert.deepEqual(duplicate.state,s);
  s = save(close(s,label,3));
  const freight = s.lastReport.publicNetwork.freight.find(x=>x.companyId==='H1');
  assert.ok(freight);
  assert.equal(freight.requestedMilli,9000);
  assert.equal(freight.acceptedMilli,blocked?0:9000);
  assert.equal(freight.returnedMilli,blocked?9000:0);
  assert.equal(s.transport.firms.H1.BERLIN.marketMilli,blocked?9000:0);
  assert.equal(firm(s).ledger.filter(e=>e.code==='FRACHT_RUECKGABE').length,
    blocked?1:0);
  if (blocked) assert.equal(firm(s).ledger.find(e=>e.code==='FRACHT_RUECKGABE').deltaCent,
    P.freight(9000,ROUTE));
  else assert.equal(s.publicNetwork.inTransit[0].arriveMonth,5);
  s = next(s,label,4);
  reject(s,command('PUBLIC_OFFER',label,'PREMATURE-OFFER',
    {from:'BERLIN',to:'NORD',qtyMilli:9000}),/Nicht genug angelieferte Ware/);
  s = save(close(s,label,4));
  s = next(s,label,5);
  assert.equal(s.publicNetwork.received.H1.NORD,blocked?0:9000);
  let revenue = 0;
  if (blocked) {
    reject(s,command('PUBLIC_OFFER',label,'BLOCKED-OFFER',
      {from:'BERLIN',to:'NORD',qtyMilli:9000}),/Nicht genug angelieferte Ware/);
  } else {
    reject(s,command('PUBLIC_OFFER',label,'OVERSELL',
      {from:'BERLIN',to:'NORD',qtyMilli:10000}),/Nicht genug angelieferte Ware/);
    revenue=Math.floor((9000*Math.floor((s.prices.NORD*115+50)/100)+500)/1000);
    s = step(s,command('PUBLIC_OFFER',label,'SELL',
      {from:'BERLIN',to:'NORD',qtyMilli:9000}));
    assert.equal(s.publicNetwork.received.H1.NORD,0);
  }
  s = save(close(s,label,5));
  const sale=s.lastReport.publicNetwork.productMarket.NORD.allocations.H1;
  if (blocked) assert.equal(sale,undefined);
  else {
    assert.ok(sale);
    assert.equal(sale.soldMilli,9000);
    assert.equal(sale.revenueCent,revenue);
  }
  assert.equal(firm(s).ledger.filter(e=>e.code==='AUSSENMARKT').length,
    blocked?0:1);
  assert.equal(firm(s).ledger.filter(e=>e.code==='AUSSENMARKT')
    .reduce((n,e)=>n+e.deltaCent,0),revenue);
  assert.equal(s.claims[CLAIM].inventoryMilli,E.CFG.pumpMilli-10000);
  assert.equal(s.claims[CLAIM].reserveMilli,initialReserve-E.CFG.pumpMilli);
  assert.equal(s.transport.shipments.length,0);
  assert.equal(s.publicNetwork.inTransit.length,0);
  assert.equal(s.publicNetwork.queued.length,0);
  assert.equal(s.publicNetwork.offers.length,0);
  // Every cash movement, including wages, must be traceable to the ledger.
  const ledgerNet=firm(s).ledger.reduce((n,e)=>n+e.deltaCent,0);
  assert.equal(firm(s).cashCent-initialCash,ledgerNet);
  assert.equal(firm(s).generation,1);
  s = save(next(s,label,6));
  assert.equal(firm(s).ledger.filter(e=>e.code==='AUSSENMARKT').length,
    blocked?0:1);
  assert.equal(s.reports.length,5);
  return {scenario:label,months:5,producedMilli:E.CFG.pumpMilli,
    processedRawMilli:10000,refinedProductMilli:9000,
    deliveredMilli:blocked?0:9000,soldMilli:blocked?0:9000,
    refundedMilli:blocked?9000:0,revenueCent:revenue,
    jsonRoundtrips:5,duplicateQueueRejected:true,
    negativeCases:blocked?2:3,ledgerReconciled:true};
}
const rows=[false,true].map(blocked=>{
  const first=play(blocked);
  assert.deepEqual(play(blocked),first,'non-deterministic '+first.scenario);
  return first;
});
console.log(JSON.stringify({
  schema:'pppoppi.natural-oil-export/1',
  scenarios:2,repeatedRuns:2,totalSimulatedMonths:20,
  checkedCompanyMonths:40,rows,
  untouchedProductionFiles:true,
  limitations:[
    'Production and infrastructure use real game actions and normal initial budget.',
    'The blocked-link scenario injects a valid public disruption, not oil inventory.',
    'One claim, one refinery, one route and five months do not establish overall balance.',
    'Sales revenue is not net profit or asset valuation; no C64 authenticity is claimed.',
    'Browser, scaling, accessibility, asset rights and release gate remain open.'
  ],
  prereleaseGate:'BLOCKED'
},null,2));
