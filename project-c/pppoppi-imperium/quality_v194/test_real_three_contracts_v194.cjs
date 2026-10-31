'use strict';
// WIR-03/WIR-04: three concurrent regional contracts owned by ONE company.
// Public actions only. Independent cents/quantity oracle; no C64 fidelity claim.
const assert=require('node:assert/strict');
for(const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E=globalThis.OliV082, clone=x=>JSON.parse(JSON.stringify(x));
const firm=(s,id)=>s.companies.find(x=>x.id===id);
const round=(n,d)=>Math.floor((n+Math.floor(d/2))/d);
const cents=(q,p)=>round(q*p,1000);
let serial=0,duplicateChecks=0,jsonRoundtrips=0,negativeCases=0;
function act(s,type,companyId,extra={}) {
  const before=clone(s),cmd={type,companyId,
    requestId:'THREE-CONTRACTS-'+(++serial),...extra};
  const r=E.transition(s,cmd);
  assert.deepEqual(s,before,'action mutated input');
  assert.equal(r.duplicate,false,'action unexpectedly duplicated');
  assert.equal(E.validate(r.state),true);
  const again=E.transition(r.state,cmd);
  assert.equal(again.duplicate,true,'replay accepted');
  assert.deepEqual(again.state,r.state,'replay changed state');
  duplicateChecks++;
  return r.state;
}
function endMonth(s) {
  s=act(s,'END_TURN','H1');
  return act(s,'END_TURN','H2');
}
function audit(s,baseline,expected) {
  assert.equal(E.validate(s),true);
  assert.equal(s.month,4);
  assert.equal(s.phase,'REPORT');
  assert.equal(s.reports.length,4);
  assert.deepEqual(s.lastReport,s.reports[3],'report archive diverged');
  const f=firm(s,'H1'),before=firm(baseline,'H1'),other=firm(s,'H2');
  assert.equal(f.contracts.length,3,'wrong number of contracts');
  assert.equal(new Set(f.contracts.map(c=>c.id)).size,3,'duplicate contract IDs');
  assert.deepEqual(f.contracts.map(c=>c.region).sort(),
    ['BERLIN','BRANDENBURG','NORD']);
  assert.equal(other.contracts.length,0,'other company acquired a contract');
  let totalRevenue=0,totalFees=0,totalPenalties=0,completed=0,profit=0;
  for(const row of expected) {
    const c=f.contracts.find(x=>x.id===row.id);
    assert.ok(c,'missing contract '+row.region);
    assert.equal(c.region,row.region);
    assert.equal(c.dueMonth,4);
    assert.equal(c.qtyMilli,E.CFG.contractQty);
    assert.equal(c.soldMilli,row.delivered,'delivered '+row.region);
    assert.equal(c.status,row.status,'status '+row.region);
    assert.equal(c.profitCent,row.profit,'profit '+row.region);
    const claim=s.claims[row.region+'-1'];
    assert.equal(claim.owner,'H1','ownership '+row.region);
    assert.equal(claim.inventoryMilli,row.remaining,'stock '+row.region);
    assert.equal(claim.preparedMilli,0,'prepared stock '+row.region);
    const receipts=f.ledger.filter(x=>x.code==='VERTRAGSERLÖS'&&x.info===row.id);
    assert.equal(receipts.length,row.delivered?1:0,'receipt count '+row.region);
    if(row.delivered) {
      assert.equal(receipts[0].deltaCent,row.revenue,'receipt cents '+row.region);
      assert.equal(receipts[0].month,4);
    }
    for(const [kind,amount,suffix] of [
      ['VERTRAGSTRANSPORT',row.fee,'FEE'],
      ['VERTRAGSSTRAFE',row.penalty,'STRAFE']
    ]) {
      const id='M4-'+row.id+'-'+suffix;
      const bills=f.obligations.filter(x=>x.id===id);
      assert.equal(bills.length,amount?1:0,'invoice count '+id);
      if(!amount)continue;
      const bill=bills[0];
      assert.equal(bill.kind,kind);
      assert.equal(bill.priority,2);
      assert.equal(bill.dueCent,amount,'invoice due '+id);
      assert.equal(bill.paidCent,amount,'invoice paid '+id);
      const payments=f.ledger.filter(x=>x.code==='ZAHLUNG_'+kind&&x.info===id);
      assert.equal(payments.length,1,'payment count '+id);
      assert.equal(payments[0].deltaCent,-amount,'payment amount '+id);
    }
    totalRevenue+=row.revenue;
    totalFees+=row.fee;
    totalPenalties+=row.penalty;
    if(row.status==='DONE'){completed++;profit+=row.profit;}
  }
  assert.equal(completed,1,'exactly one contract must be complete');
  assert.equal(f.stats.contractsDone,completed);
  assert.equal(f.stats.contractsOnTime,completed);
  assert.equal(f.stats.contractsProfitable,completed);
  assert.equal(f.stats.contractsProfitCent,profit);
  assert.equal(f.monthContractMilli,expected.reduce((n,r)=>n+r.delivered,0));
  assert.equal(f.monthRevenueCent,totalRevenue);
  const cash=before.cashCent+totalRevenue-totalFees-totalPenalties-
    E.CFG.wage-2*E.CFG.upkeep;
  assert.equal(f.cashCent,cash,'independent cash oracle');
  assert.equal(other.cashCent,firm(baseline,'H2').cashCent-E.CFG.wage);
  assert.equal(f.debtCent,0);
  assert.equal(other.debtCent,0);
  assert.equal(E.pending(f),0);
  assert.equal(E.pending(other),0);
  for(const company of [f,other]) {
    assert.equal(new Set(company.ledger.map(x=>x.id)).size,company.ledger.length);
    assert.equal(company.cashCent,E.CFG.startCash+
      company.ledger.reduce((sum,x)=>{
        assert.ok(Number.isSafeInteger(x.deltaCent));
        return sum+x.deltaCent;
      },0),'ledger/cash bridge '+company.id);
    for(const bill of company.obligations) {
      const paid=company.ledger.filter(x=>x.code==='ZAHLUNG_'+bill.kind&&
        x.info===bill.id).reduce((n,x)=>n-x.deltaCent,0);
      assert.equal(paid,bill.paidCent,'invoice/payment bridge '+bill.id);
    }
  }
  const report=s.lastReport.companies.find(x=>x.id==='H1');
  assert.equal(report.cashCent,cash);
  assert.equal(report.revenueCent,totalRevenue);
  assert.equal(report.arrearsCent,0);
  assert.equal(report.debtCent,0);
  assert.equal(s.lastReport.companies.find(x=>x.id==='H2').cashCent,
    other.cashCent);
}
function scenario() {
  serial=0;
  let s=E.fresh({humans:2,ais:0,seed:'THREE-CONTRACTS-20261031'});
  assert.equal(E.CFG.contractQty,40000);
  assert.equal(E.CFG.pumpMilli,100000);
  assert.equal(E.CFG.monthDays,30);
  for(const type of ['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER'])
    s=act(s,type,'H1',{claimId:'BERLIN-1'});
  s=endMonth(s);
  assert.equal(s.phase,'REPORT');
  assert.equal(s.claims['BERLIN-1'].inventoryMilli,0);
  s=act(s,'NEXT_MONTH','H1');
  for(const type of ['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER'])
    s=act(s,type,'H1',{claimId:'NORD-1'});
  s=endMonth(s);
  assert.equal(s.phase,'REPORT');
  const partial=s.claims['NORD-1'].inventoryMilli;
  assert.ok(partial>0&&partial<E.CFG.contractQty,
    'regular market did not leave a partial contract quantity');
  assert.equal(partial,E.CFG.pumpMilli-s.lastReport.regions.NORD.soldMilli,
    'partial quantity not explained by market sales');
  s=act(s,'NEXT_MONTH','H1');
  s=act(s,'SURVEY','H1',{claimId:'BRANDENBURG-1'});
  s=act(s,'BUY','H1',{claimId:'BRANDENBURG-1'});
  s=act(s,'PUMP','H1',{claimId:'BERLIN-1'});
  for(const region of ['BERLIN','NORD','BRANDENBURG'])
    s=act(s,'SIGN','H1',{region});
  assert.equal(firm(s,'H1').contracts.length,3);
  assert.throws(()=>E.transition(s,{type:'SIGN',companyId:'H1',
    region:'BERLIN',requestId:'THREE-REJECT-FOURTH'}),
    /Vertragsobergrenze|Regionalvertrag/,'fourth/duplicate contract accepted');
  const ids=Object.fromEntries(firm(s,'H1').contracts.map(c=>[c.region,c.id]));
  s=endMonth(s);
  assert.equal(s.phase,'REPORT');
  assert.equal(firm(s,'H1').contracts.filter(x=>x.status==='OPEN').length,3);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli,100000);
  assert.equal(s.claims['NORD-1'].inventoryMilli,partial);
  assert.equal(s.claims['BRANDENBURG-1'].inventoryMilli,0);
  const saved=JSON.parse(JSON.stringify(s));jsonRoundtrips++;
  assert.equal(E.validate(saved),true);
  s=act(saved,'NEXT_MONTH','H1');
  const baseline=clone(s);
  const expected=[
    {region:'BERLIN',id:ids.BERLIN,delivered:40000,remaining:60000,status:'DONE'},
    {region:'NORD',id:ids.NORD,delivered:partial,remaining:0,status:'BREACH'},
    {region:'BRANDENBURG',id:ids.BRANDENBURG,delivered:0,remaining:0,status:'BREACH'}
  ].map(row=>{
    const price=round(baseline.prices[row.region]*E.CFG.contractBonusBps,10000);
    const revenue=cents(row.delivered,price);
    const missing=E.CFG.contractQty-row.delivered;
    const fee=row.delivered?E.CFG.contractDeliveryFee:0;
    const penalty=missing?round(cents(missing,price)*
      E.CFG.contractPenaltyBps,10000):0;
    return {...row,revenue,fee,penalty,
      profit:revenue-cents(row.delivered,E.CFG.contractUnitCost)-fee};
  });
  const finalSerial=serial;
  const direct=endMonth(s);
  const restored=JSON.parse(JSON.stringify(baseline));jsonRoundtrips++;
  assert.equal(E.validate(restored),true);
  // Replay exactly the same request IDs: otherwise processedIds/sequence differ.
  serial=finalSerial;
  const resumed=endMonth(restored);
  assert.deepEqual(resumed,direct,'save/reload changed contract settlement');
  audit(direct,baseline,expected);
  const exported=JSON.parse(JSON.stringify(direct));jsonRoundtrips++;
  audit(exported,baseline,expected);
  const attacks=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{firm(x,'H1').contracts[0].soldMilli++;},
    x=>{firm(x,'H1').contracts[1].status='DONE';},
    x=>{firm(x,'H1').contracts[2].profitCent++;},
    x=>{x.claims['NORD-1'].inventoryMilli++;},
    x=>{x.claims['BRANDENBURG-1'].owner='H2';},
    x=>{firm(x,'H1').ledger.find(y=>y.code==='VERTRAGSERLÖS').deltaCent++;},
    x=>{firm(x,'H1').obligations.find(y=>y.kind==='VERTRAGSSTRAFE').dueCent++;},
    x=>{firm(x,'H1').obligations.find(y=>y.kind==='VERTRAGSTRANSPORT').paidCent--;},
    x=>{x.lastReport.companies.find(y=>y.id==='H1').revenueCent++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{firm(x,'H1').contracts.push(clone(firm(x,'H1').contracts[0]));}
  ];
  for(const [i,attack] of attacks.entries()){
    const damaged=clone(exported);attack(damaged);
    assert.throws(()=>audit(damaged,baseline,expected),
      'undetected manipulation '+(i+1));
    negativeCases++;
  }
  // A second real contract cycle must not rebook any of the three old contracts.
  let next=act(exported,'NEXT_MONTH','H1');
  assert.equal(next.month,5);
  assert.equal(firm(next,'H1').contracts.filter(x=>x.status==='OPEN').length,0);
  assert.equal(firm(next,'H1').ledger.filter(x=>x.code==='VERTRAGSERLÖS').length,2);
  const oldContracts=clone(firm(next,'H1').contracts);
  const oldIds=new Set(oldContracts.map(x=>x.id));
  const oldReceipts=clone(firm(next,'H1').ledger.filter(x=>
    x.code==='VERTRAGSERLÖS'&&oldIds.has(x.info)));
  const oldBills=clone(firm(next,'H1').obligations.filter(x=>
    x.kind.startsWith('VERTRAG')));
  const archive=clone(next.reports);
  assert.equal(next.claims['BERLIN-1'].inventoryMilli,60000);
  next=act(next,'SIGN','H1',{region:'BERLIN'});
  const renewedId=firm(next,'H1').contracts.at(-1).id;
  assert.equal(firm(next,'H1').contracts.length,4);
  assert.equal(firm(next,'H1').contracts.at(-1).dueMonth,6);
  next=endMonth(next);
  assert.equal(next.phase,'REPORT');
  assert.equal(next.month,5);
  assert.equal(firm(next,'H1').contracts.at(-1).status,'OPEN');
  assert.deepEqual(next.reports.slice(0,4),archive);
  next=act(next,'NEXT_MONTH','H1');
  const secondBaseline=clone(next);
  const secondSerial=serial;
  const price=round(secondBaseline.prices.BERLIN*E.CFG.contractBonusBps,10000);
  const secondRevenue=cents(E.CFG.contractQty,price);
  const fee=E.CFG.contractDeliveryFee;
  const expectedCash=firm(secondBaseline,'H1').cashCent+secondRevenue-fee-
    E.CFG.wage-2*E.CFG.upkeep;
  const expectedProfit=secondRevenue-cents(E.CFG.contractQty,
    E.CFG.contractUnitCost)-fee;
  const settled=endMonth(next);
  function auditRenewal(x) {
    assert.equal(E.validate(x),true);
    assert.equal(x.month,6);
    assert.equal(x.phase,'REPORT');
    assert.equal(x.reports.length,6);
    assert.deepEqual(x.lastReport,x.reports[5]);
    assert.deepEqual(x.reports.slice(0,4),archive,'old reports rewritten');
    const f=firm(x,'H1'),other=firm(x,'H2');
    assert.equal(f.contracts.length,4);
    assert.deepEqual(f.contracts.slice(0,3),oldContracts,
      'old contracts changed or settled twice');
    const renewal=f.contracts[3];
    assert.equal(renewal.id,renewedId);
    assert.equal(renewal.region,'BERLIN');
    assert.equal(renewal.dueMonth,6);
    assert.equal(renewal.status,'DONE');
    assert.equal(renewal.soldMilli,E.CFG.contractQty);
    assert.equal(renewal.profitCent,expectedProfit);
    assert.equal(f.stats.contractsDone,2);
    assert.equal(f.stats.contractsOnTime,2);
    assert.equal(x.claims['BERLIN-1'].inventoryMilli,20000);
    assert.equal(f.monthContractMilli,E.CFG.contractQty);
    assert.equal(f.monthRevenueCent,secondRevenue);
    assert.equal(f.cashCent,expectedCash,'second-cycle independent cash');
    assert.equal(f.debtCent,0);
    assert.equal(E.pending(f),0);
    assert.equal(other.cashCent,firm(secondBaseline,'H2').cashCent-E.CFG.wage);
    assert.deepEqual(f.ledger.filter(y=>y.code==='VERTRAGSERLÖS'&&
      oldIds.has(y.info)),oldReceipts,'old contract revenue duplicated');
    assert.deepEqual(f.obligations.filter(y=>y.kind.startsWith('VERTRAG')&&
      oldIds.has(y.id.slice(y.id.indexOf('-V-')+1).replace(/-(FEE|STRAFE)$/,''))),
      oldBills,'old contract invoices changed');
    const receipts=f.ledger.filter(y=>y.code==='VERTRAGSERLÖS'&&
      y.info===renewedId);
    assert.equal(receipts.length,1);
    assert.equal(receipts[0].month,6);
    assert.equal(receipts[0].deltaCent,secondRevenue);
    const billId='M6-'+renewedId+'-FEE';
    const bills=f.obligations.filter(y=>y.id===billId);
    assert.equal(bills.length,1);
    assert.equal(bills[0].kind,'VERTRAGSTRANSPORT');
    assert.equal(bills[0].dueCent,fee);
    assert.equal(bills[0].paidCent,fee);
    const payments=f.ledger.filter(y=>y.code==='ZAHLUNG_VERTRAGSTRANSPORT'
      &&y.info===billId);
    assert.equal(payments.length,1);
    assert.equal(payments[0].deltaCent,-fee);
    const report=x.lastReport.companies.find(y=>y.id==='H1');
    assert.equal(report.cashCent,expectedCash);
    assert.equal(report.revenueCent,secondRevenue);
    assert.equal(report.arrearsCent,0);
    assert.equal(report.debtCent,0);
  }
  // Re-run the same two month-end commands with identical request IDs.
  serial=secondSerial;
  const resumed=endMonth(JSON.parse(JSON.stringify(secondBaseline)));
  jsonRoundtrips++;
  assert.deepEqual(resumed,settled,'second settlement changed after restore');
  const exportedRenewal=JSON.parse(JSON.stringify(settled));
  jsonRoundtrips++;
  auditRenewal(settled);
  auditRenewal(exportedRenewal);
  const renewalAttacks=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{firm(x,'H1').contracts[3].soldMilli--;},
    x=>{firm(x,'H1').ledger.find(y=>y.info===renewedId&&
      y.code==='VERTRAGSERLÖS').deltaCent++;},
    x=>{firm(x,'H1').obligations.find(y=>y.id==='M6-'+renewedId+'-FEE').paidCent--;},
    x=>{firm(x,'H1').contracts[1].status='DONE';},
    x=>{x.reports[3].companies.find(y=>y.id==='H1').cashCent++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{x.claims['BERLIN-1'].inventoryMilli++;}
  ];
  for(const [i,attack] of renewalAttacks.entries()) {
    const damaged=clone(exportedRenewal);attack(damaged);
    assert.throws(()=>auditRenewal(damaged),
      'undetected renewal manipulation '+(i+1));
    negativeCases++;
  }
  return {secondCycleDeliveredMilli:E.CFG.contractQty,
    secondCycleRevenueCent:secondRevenue,
    partialDeliveredMilli:partial,regions:expected.map(x=>x.region),
    delivered:expected.map(x=>x.delivered),
    revenueCent:expected.reduce((n,x)=>n+x.revenue,0),
    penaltyCent:expected.reduce((n,x)=>n+x.penalty,0)};
}
const first=scenario(),second=scenario();
assert.deepEqual(first,second,'non-deterministic three-contract settlement');
console.log(JSON.stringify({schema:'pppoppi.real-three-contracts/1',
  scenarios:2,companyMonthsChecked:24,duplicateChecks,jsonRoundtrips,
  secondCycleDeliveredMilli:first.secondCycleDeliveredMilli,
  secondCycleRevenueCent:first.secondCycleRevenueCent,
  negativeCases,partialDeliveredMilli:first.partialDeliveredMilli,
  contractRegions:first.regions,deliveredMilli:first.delivered,
  noInjectedCashOrInventory:true,prereleaseGate:'BLOCKED',
  limitations:['Immediate cash receipts, not receivables or full asset valuation.',
    'No complete endgame, C64 comparison, browser acceptance or release approval.']},null,2));
