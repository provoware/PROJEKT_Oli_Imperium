'use strict';
// WIR-03/WIR-04: independently reconcile real contract fulfilment and breach.
// Berlin satire adaptation only; no C64 fidelity or balance-sheet claim.
const assert=require('node:assert/strict');
for(const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E=globalThis.OliV082;
const clone=x=>JSON.parse(JSON.stringify(x));
const firm=(s,id)=>s.companies.find(x=>x.id===id);
const round=(n,d)=>Math.floor((n+Math.floor(d/2))/d);
let sequence=0,duplicates=0,roundtrips=0,negativeCases=0;
const opening=20000000, wage=90000, upkeep=50000, quantity=40000;
function move(s,type,companyId,extra={}) {
  const before=clone(s);
  const cmd={type,companyId,requestId:'CONTRACT-REAL-'+(++sequence),...extra};
  const result=E.transition(s,cmd);
  assert.deepEqual(s,before,'action mutated its input');
  assert.equal(result.duplicate,false);
  assert.equal(E.validate(result.state),true);
  const replay=E.transition(result.state,cmd);
  assert.equal(replay.duplicate,true,'duplicate action accepted');
  assert.deepEqual(replay.state,result.state,'duplicate changed state');
  duplicates++;
  return result.state;
}
function audit(s,expected) {
  assert.equal(E.validate(s),true);
  assert.equal(s.phase,'REPORT');
  assert.equal(s.month,2);
  assert.equal(s.reports.length,2);
  assert.deepEqual(s.lastReport,s.reports[1],'archived report differs');
  const f=firm(s,'H1'),other=firm(s,'H2');
  assert.equal(f.contracts.length,1,'contract duplicated or lost');
  const c=f.contracts[0];
  assert.equal(c.id,expected.id);
  assert.equal(c.region,'BERLIN');
  assert.equal(c.qtyMilli,quantity);
  assert.equal(c.dueMonth,2);
  assert.equal(c.status,expected.status);
  assert.equal(c.soldMilli,expected.delivered);
  assert.equal(c.profitCent,expected.profit);
  assert.equal(f.stats.contractsDone,expected.done);
  assert.equal(f.stats.contractsOnTime,expected.done);
  assert.equal(f.stats.contractsProfitable,expected.done);
  assert.equal(f.stats.contractsProfitCent,expected.profit);
  assert.equal(f.cashCent,expected.cash,'H1 independent cash oracle');
  assert.equal(f.debtCent,0,'contract unexpectedly created a loan');
  assert.equal(E.pending(f),0,'contract invoice left unpaid');
  assert.equal(other.cashCent,opening-2*wage,'H2 cash changed');
  assert.equal(other.debtCent,0);
  assert.equal(other.contracts.length,0,'unrelated company gained contract');
  assert.equal(E.pending(other),0);
  const claim=s.claims['BERLIN-1'];
  assert.equal(claim.owner,'H1');
  assert.equal(claim.inventoryMilli,expected.inventory);
  assert.equal(claim.reserveMilli,expected.reserve);
  assert.equal(claim.preparedMilli,0);
  const receipts=f.ledger.filter(x=>x.code==='VERTRAGSERLÖS');
  assert.equal(receipts.length,expected.delivered?1:0,'contract receipt count');
  if(expected.delivered) {
    assert.equal(receipts[0].deltaCent,expected.revenue);
    assert.equal(receipts[0].info,c.id);
    assert.equal(receipts[0].month,2);
  }
  const contractBills=f.obligations.filter(x=>x.kind.startsWith('VERTRAGS'));
  assert.equal(contractBills.length,1,'unexpected contract invoices');
  const bill=contractBills[0];
  assert.equal(bill.id,expected.billId);
  assert.equal(bill.kind,expected.billKind);
  assert.equal(bill.priority,2);
  assert.equal(bill.dueCent,expected.bill);
  assert.equal(bill.paidCent,expected.bill);
  const payments=f.ledger.filter(x=>x.code==='ZAHLUNG_'+bill.kind&&x.info===bill.id);
  assert.equal(payments.length,1,'missing/duplicated contract payment');
  assert.equal(payments[0].deltaCent,-expected.bill);
  assert.equal(payments[0].month,2);
  for(const company of [f,other]) {
    assert.equal(new Set(company.ledger.map(x=>x.id)).size,company.ledger.length,
      'duplicate ledger id');
    assert.equal(company.cashCent,opening+company.ledger.reduce((sum,x)=>{
      assert.ok(Number.isSafeInteger(x.deltaCent),'invalid ledger delta');
      return sum+x.deltaCent;
    },0),'ledger/cash mismatch');
    for(const o of company.obligations) {
      const paid=company.ledger.filter(x=>x.code==='ZAHLUNG_'+o.kind&&x.info===o.id)
        .reduce((sum,x)=>sum-x.deltaCent,0);
      assert.equal(paid,o.paidCent,'invoice payment mismatch '+o.id);
    }
  }
  const r1=s.lastReport.companies.find(x=>x.id==='H1');
  const r2=s.lastReport.companies.find(x=>x.id==='H2');
  assert.equal(r1.cashCent,expected.cash);
  assert.equal(r1.debtCent,0);
  assert.equal(r1.arrearsCent,0);
  assert.equal(r1.revenueCent,expected.revenue);
  assert.equal(r2.cashCent,opening-2*wage);
  assert.equal(r2.revenueCent,0);
  assert.equal(r2.arrearsCent,0);
}
function scenario(deliver) {
  sequence=0;
  let s=E.fresh({humans:2,ais:0,seed:'CONTRACT-SETTLEMENT-20261031'});
  assert.equal(E.CFG.startCash,opening);
  assert.equal(E.CFG.wage,wage);
  assert.equal(E.CFG.upkeep,upkeep);
  assert.equal(E.CFG.contractQty,quantity);
  assert.equal(E.CFG.contractBonusBps,11000);
  assert.equal(E.CFG.contractPenaltyBps,2500);
  assert.equal(E.CFG.contractDeliveryFee,20000);
  assert.equal(E.CFG.contractUnitCost,15000);
  s=move(s,'SURVEY','H1',{claimId:'BERLIN-1'});
  s=move(s,'BUY','H1',{claimId:'BERLIN-1'});
  s=move(s,'DRILL','H1',{claimId:'BERLIN-1'});
  s=move(s,'SIGN','H1',{region:'BERLIN'});
  const contractId=firm(s,'H1').contracts[0].id;
  assert.equal(firm(s,'H1').contracts[0].status,'OPEN');
  assert.equal(firm(s,'H1').contracts[0].dueMonth,2);
  assert.throws(()=>E.transition(s,{type:'SIGN',companyId:'H1',
    region:'BERLIN',requestId:'INVALID-DUPLICATE-CONTRACT'}),
    /Vertragsobergrenze|Regionalvertrag/,'second regional contract allowed');
  if(deliver)s=move(s,'PUMP','H1',{claimId:'BERLIN-1'});
  const afterActions=clone(s);
  s=move(s,'END_TURN','H1');
  s=move(s,'END_TURN','H2');
  assert.equal(s.phase,'REPORT','unexpected first-month rescue');
  assert.equal(firm(s,'H1').contracts[0].status,'OPEN',
    'contract settled before due month');
  assert.equal(s.lastReport.companies.find(x=>x.id==='H1').revenueCent,0);
  s=clone(s);roundtrips++;
  assert.equal(E.validate(s),true);
  s=move(s,'NEXT_MONTH','H1');
  assert.equal(s.prices.BERLIN,67900,'market price oracle changed');
  const price=round(67900*11000,10000);
  const revenue=deliver?round(quantity*price,1000):0;
  const penalty=deliver?0:round(round(quantity*price,1000)*2500,10000);
  const bill=deliver?20000:penalty;
  const investment=200000+5000000+7000000+(deliver?100000:0);
  const cash=opening-investment-2*(wage+upkeep)+revenue-bill;
  const expected={id:contractId,status:deliver?'DONE':'BREACH',
    delivered:deliver?quantity:0,profit:deliver?revenue-quantity*15-20000:0,
    done:deliver?1:0,cash,revenue,bill,
    billKind:deliver?'VERTRAGSTRANSPORT':'VERTRAGSSTRAFE',
    billId:'M2-'+contractId+(deliver?'-FEE':'-STRAFE'),
    inventory:deliver?60000:0,reserve:deliver?400000:500000};
  assert.equal(firm(s,'H1').cashCent,
    opening-investment-(wage+upkeep),'month 1 cash oracle');
  s=move(s,'END_TURN','H1');
  s=move(s,'END_TURN','H2');
  audit(s,expected);
  s=clone(s);roundtrips++;
  audit(s,expected);
  const attacks=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{firm(x,'H1').contracts[0].soldMilli++;},
    x=>{firm(x,'H1').contracts[0].status='OPEN';},
    x=>{firm(x,'H1').contracts[0].profitCent++;},
    x=>{firm(x,'H1').ledger[0].deltaCent++;},
    x=>{firm(x,'H1').obligations.find(o=>o.kind===expected.billKind).dueCent++;},
    x=>{firm(x,'H1').obligations.find(o=>o.kind===expected.billKind).paidCent--;},
    x=>{x.lastReport.companies.find(f=>f.id==='H1').revenueCent++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{firm(x,'H1').contracts.push(clone(firm(x,'H1').contracts[0]));}
  ];
  for(const [index,attack] of attacks.entries()){
    const damaged=clone(s);attack(damaged);
    assert.throws(()=>audit(damaged,expected),
      'undetected contract manipulation '+(index+1));
    negativeCases++;
  }
  assert.equal(afterActions.claims['BERLIN-1'].owner,'H1');
  return {kind:deliver?'delivery':'breach',contractId,month:2,
    cashCent:cash,revenueCent:revenue,contractInvoiceCent:bill,
    deliveredMilli:expected.delivered,negativeCases:attacks.length};
}
const first=[scenario(true),scenario(false)];
const second=[scenario(true),scenario(false)];
assert.deepEqual(first,second,'contract scenarios not deterministic');
console.log(JSON.stringify({schema:'pppoppi.real-contract-settlement/1',
  scenarios:4,companyMonthsChecked:16,duplicateChecks:duplicates,
  jsonRoundtrips:roundtrips,negativeCases,
  delivery:first[0],breach:first[1],prereleaseGate:'BLOCKED',
  limitations:['No accounts receivable exist in this engine contract model.',
    'Immediate contract receipts and breach penalties are checked, not asset valuation.',
    'No C64 original, complete endgame, or release approval is inferred.']},null,2));
