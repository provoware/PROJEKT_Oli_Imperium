'use strict';
// WIR-03/WIR-04: two simultaneous real regional contracts, one partial.
// Independent settlement oracle; fictional Berlin adaptation, not C64 evidence.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E = globalThis.OliV082;
const copy = x => JSON.parse(JSON.stringify(x));
const firm = (s,id) => s.companies.find(x => x.id === id);
const rounded = (n,d) => Math.floor((n+Math.floor(d/2))/d);
const priceFor = (s,region) => rounded(s.prices[region]*E.CFG.contractBonusBps,10000);
const moneyFor = (qty,price) => rounded(qty*price,1000);
let serial=0,duplicateChecks=0,roundtrips=0,negativeCases=0;
function move(s,type,companyId,extra={}) {
  const before=copy(s);
  const command={type,companyId,requestId:'TWO-REGIONS-'+(++serial),...extra};
  const result=E.transition(s,command);
  assert.deepEqual(s,before,'action changed its input');
  assert.equal(result.duplicate,false,'unexpected duplicate');
  assert.equal(E.validate(result.state),true);
  const replay=E.transition(result.state,command);
  assert.equal(replay.duplicate,true,'duplicate action not rejected');
  assert.deepEqual(replay.state,result.state,'duplicate mutated state');
  duplicateChecks++;
  return result.state;
}
function audit(s,baseline,expected) {
  assert.equal(E.validate(s),true);
  assert.equal(s.phase,'REPORT');
  assert.equal(s.month,2);
  assert.equal(s.reports.length,2);
  assert.deepEqual(s.lastReport,s.reports[1]);
  for(const row of expected) {
    const f=firm(s,row.id),before=firm(baseline,row.id);
    const c=f.contracts[0],claim=s.claims[row.claimId];
    assert.equal(f.contracts.length,1,'contract count '+row.id);
    assert.equal(c.id,row.contractId,'contract identity '+row.id);
    assert.equal(c.region,row.region);
    assert.equal(c.qtyMilli,E.CFG.contractQty);
    assert.equal(c.dueMonth,2);
    assert.equal(c.soldMilli,row.delivered,'delivered '+row.id);
    assert.equal(c.status,row.status,'contract status '+row.id);
    assert.equal(c.profitCent,row.profit,'contract profit '+row.id);
    assert.equal(claim.owner,row.id,'foreign oil '+row.id);
    assert.equal(claim.inventoryMilli,row.remaining,'remaining stock '+row.id);
    assert.equal(claim.preparedMilli,0);
    assert.equal(f.stats.contractsDone,row.status==='DONE'?1:0);
    assert.equal(f.stats.contractsOnTime,row.status==='DONE'?1:0);
    assert.equal(f.stats.contractsProfitCent,row.status==='DONE'?row.profit:0);
    assert.equal(f.monthContractMilli,row.delivered);
    assert.equal(f.monthRevenueCent,row.revenue);
    assert.equal(f.debtCent,0);
    assert.equal(E.pending(f),0,'unexpected unpaid invoice '+row.id);
    const expectedCash=before.cashCent+row.revenue-row.fee-row.penalty-
      E.CFG.wage-E.CFG.upkeep;
    assert.equal(f.cashCent,expectedCash,'independent cash oracle '+row.id);
    const receipts=f.ledger.filter(x=>x.code==='VERTRAGSERLÖS');
    assert.equal(receipts.length,1,'contract receipt count '+row.id);
    assert.equal(receipts[0].deltaCent,row.revenue);
    assert.equal(receipts[0].info,row.contractId);
    assert.equal(receipts[0].month,2);
    const bills=f.obligations.filter(x=>x.kind.startsWith('VERTRAGS'));
    assert.equal(bills.length,row.penalty?2:1,'contract bill count '+row.id);
    const kinds=[['VERTRAGSTRANSPORT',row.fee],
      ...(row.penalty?[['VERTRAGSSTRAFE',row.penalty]]:[])];
    for(const [kind,amount] of kinds) {
      const matches=bills.filter(x=>x.kind===kind);
      assert.equal(matches.length,1,'bill kind '+kind+' '+row.id);
      const bill=matches[0];
      assert.equal(bill.dueCent,amount);
      assert.equal(bill.paidCent,amount);
      assert.equal(bill.priority,2);
      assert.equal(bill.id,'M2-'+row.contractId+
        (kind==='VERTRAGSTRANSPORT'?'-FEE':'-STRAFE'));
      const payments=f.ledger.filter(x=>x.code==='ZAHLUNG_'+kind &&
        x.info===bill.id);
      assert.equal(payments.length,1,'payment count '+kind+' '+row.id);
      assert.equal(payments[0].deltaCent,-amount);
    }
    assert.equal(new Set(f.ledger.map(x=>x.id)).size,f.ledger.length,
      'duplicate ledger entry '+row.id);
    assert.equal(f.cashCent,E.CFG.startCash+f.ledger.reduce((n,x)=>{
      assert.ok(Number.isSafeInteger(x.deltaCent));
      return n+x.deltaCent;
    },0),'cash/ledger bridge '+row.id);
    for(const bill of f.obligations) {
      const paid=f.ledger.filter(x=>x.code==='ZAHLUNG_'+bill.kind &&
        x.info===bill.id).reduce((n,x)=>n-x.deltaCent,0);
      assert.equal(paid,bill.paidCent,'payment/obligation bridge '+bill.id);
    }
    const report=s.lastReport.companies.find(x=>x.id===row.id);
    assert.equal(report.cashCent,expectedCash,'archived cash '+row.id);
    assert.equal(report.revenueCent,row.revenue,'archived revenue '+row.id);
    assert.equal(report.arrearsCent,0,'archived arrears '+row.id);
  }
  assert.notEqual(expected[0].contractId,expected[1].contractId);
}
function scenario() {
  serial=0;
  let s=E.fresh({humans:2,ais:0,seed:'TWO-REGIONAL-CONTRACTS-20261031'});
  assert.equal(E.CFG.contractQty,40000);
  assert.equal(E.CFG.pumpMilli,100000);
  for(const type of ['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER'])
    s=move(s,type,'H1',{claimId:'NORD-1'});
  s=move(s,'SIGN','H1',{region:'NORD'});
  for(const type of ['SURVEY','BUY','DRILL','PUMP'])
    s=move(s,type,'H2',{claimId:'BERLIN-1'});
  s=move(s,'SIGN','H2',{region:'BERLIN'});
  const contractIds=['H1','H2'].map(id=>firm(s,id).contracts[0].id);
  assert.throws(()=>E.transition(s,{type:'SIGN',companyId:'H2',
    region:'BERLIN',requestId:'TWO-REGIONS-DUPLICATE'}),
    /Vertragsobergrenze|Regionalvertrag/);
  s=move(s,'END_TURN','H1');
  s=move(s,'END_TURN','H2');
  assert.equal(s.phase,'REPORT');
  assert.equal(s.reports.length,1);
  assert.equal(s.claims['NORD-1'].inventoryMilli,20000,
    'natural partial stock after first-month market sale');
  assert.equal(s.claims['BERLIN-1'].inventoryMilli,100000);
  assert.equal(s.lastReport.regions.NORD.soldMilli,80000);
  for(const id of ['H1','H2'])assert.equal(firm(s,id).contracts[0].status,'OPEN',
    'contract settled early');
  const exported=JSON.stringify(s);roundtrips++;
  assert.equal(E.validate(JSON.parse(exported)),true);
  s=move(s,'NEXT_MONTH','H1');
  const baseline=copy(s);
  const expected=[
    {id:'H1',region:'NORD',claimId:'NORD-1',contractId:contractIds[0],
      delivered:20000,remaining:0,status:'BREACH'},
    {id:'H2',region:'BERLIN',claimId:'BERLIN-1',contractId:contractIds[1],
      delivered:40000,remaining:60000,status:'DONE'}
  ].map(row=>{
    const price=priceFor(baseline,row.region);
    const revenue=moneyFor(row.delivered,price);
    const missing=E.CFG.contractQty-row.delivered;
    const penalty=rounded(moneyFor(missing,price)*E.CFG.contractPenaltyBps,10000);
    const fee=row.delivered?E.CFG.contractDeliveryFee:0;
    return {...row,revenue,penalty,fee,
      profit:revenue-moneyFor(row.delivered,E.CFG.contractUnitCost)-fee};
  });
  const direct=move(move(s,'END_TURN','H1'),'END_TURN','H2');
  // Different request IDs are harmless: compare economic state from saved
  // pre-settlement input with identical commands, not with a fresh run.
  const saved=copy(baseline);roundtrips++;
  assert.equal(E.validate(saved),true);
  audit(direct,baseline,expected);
  const restored=copy(direct);roundtrips++;
  audit(restored,baseline,expected);
  const attacks=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{firm(x,'H1').contracts[0].soldMilli++;},
    x=>{firm(x,'H1').contracts[0].status='DONE';},
    x=>{firm(x,'H1').contracts[0].profitCent++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{firm(x,'H2').contracts[0].status='BREACH';},
    x=>{x.claims['NORD-1'].inventoryMilli++;},
    x=>{firm(x,'H1').ledger.find(y=>y.code==='VERTRAGSERLÖS').deltaCent++;},
    x=>{firm(x,'H1').obligations.find(y=>y.kind==='VERTRAGSSTRAFE').paidCent--;},
    x=>{firm(x,'H2').obligations.find(y=>y.kind==='VERTRAGSTRANSPORT').dueCent++;},
    x=>{x.lastReport.companies.find(y=>y.id==='H2').revenueCent++;},
    x=>{firm(x,'H2').contracts.push(copy(firm(x,'H2').contracts[0]));}
  ];
  for(const [i,attack] of attacks.entries()) {
    const damaged=copy(restored);attack(damaged);
    assert.throws(()=>audit(damaged,baseline,expected),
      'undetected manipulation '+(i+1));
    negativeCases++;
  }
  s=move(restored,'NEXT_MONTH','H1');
  assert.equal(s.month,3);
  assert.equal(firm(s,'H1').contracts[0].status,'BREACH');
  assert.equal(firm(s,'H2').contracts[0].status,'DONE');
  assert.equal(firm(s,'H1').ledger.filter(x=>x.code==='VERTRAGSERLÖS').length,1);
  assert.equal(firm(s,'H2').ledger.filter(x=>x.code==='VERTRAGSERLÖS').length,1);
  return {partial:expected[0],complete:expected[1],month:2};
}
const first=scenario(),second=scenario();
assert.deepEqual(first,second,'non-deterministic multi-contract settlement');
console.log(JSON.stringify({schema:'pppoppi.real-parallel-contracts/1',
  scenarios:2,companyMonthsChecked:8,duplicateChecks,
  jsonRoundtrips:roundtrips,negativeCases,
  partialDeliveredMilli:first.partial.delivered,
  completeDeliveredMilli:first.complete.delivered,
  contractRegions:['NORD','BERLIN'],
  noInjectedCashOrInventory:true,prereleaseGate:'BLOCKED',
  limitations:['No deferred receivables, financial asset valuation or endgame.',
    'No C64 original comparison, browser acceptance or release approval.']},null,2));
