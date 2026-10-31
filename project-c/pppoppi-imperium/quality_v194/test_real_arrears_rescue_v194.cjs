'use strict';
// WIR-04 / BAL-01: real, unmodified two-company liquidity shortfall and rescue.
// The Berlin adaptation is NOT a historically verified C64 accounting model.
const assert=require('node:assert/strict');
for(const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E=globalThis.OliV082;
const cp=x=>JSON.parse(JSON.stringify(x));
const company=(s,id)=>s.companies.find(f=>f.id===id);
let sequence=0;
function move(s,type,companyId,extra={}) {
  const before=cp(s);
  const requestId='REAL-ARREARS-'+(++sequence);
  const command={type,companyId,requestId,...extra};
  const r=E.transition(s,command);
  assert.equal(r.duplicate,false,'unexpected duplicate action');
  assert.deepEqual(s,before,'transition mutated input');
  assert.equal(E.validate(r.state),true,'invalid game state');
  const duplicate=E.transition(r.state,command);
  assert.equal(duplicate.duplicate,true,'duplicate request accepted');
  assert.deepEqual(duplicate.state,r.state,'duplicate changed state');
  return r.state;
}
function invoice(f,month,kind) {
  const id=`M${month}-G${f.generation}-${kind==='PERSONAL'?'LOHN':kind}`;
  const found=f.obligations.filter(o=>o.id===id);
  assert.equal(found.length,1,'invoice missing or duplicated: '+id);
  return found[0];
}
function cashAudit(f,opening) {
  assert.equal(new Set(f.ledger.map(e=>e.id)).size,f.ledger.length,
    'duplicate booking ID');
  assert.equal(f.cashCent,opening+f.ledger.reduce((n,e)=>{
    assert.ok(Number.isSafeInteger(e.deltaCent),'unsafe booking');
    return n+e.deltaCent;
  },0),'cashbook does not reconcile');
}
function run() {
  sequence=0;
  let s=E.fresh({humans:2,ais:0,seed:'WIR04-REAL-ARREARS-20261031'});
  const opening=E.CFG.startCash;
  assert.equal(company(s,'H1').cashCent,opening);
  assert.equal(company(s,'H1').debtCent,0);
  const actions=[
    ['SURVEY',{claimId:'BERLIN-1'}],
    ['BUY',{claimId:'BERLIN-1'}],
    ['DRILL',{claimId:'BERLIN-1'}],
    ['SURVEY',{claimId:'BRANDENBURG-1'}],
    ['BUY',{claimId:'BRANDENBURG-1'}],
    ['REFINERY_BUILD',{region:'BERLIN',claimId:'BERLIN-1'}],
    ['SECURITY',{claimId:'BERLIN-1'}],
    ['PUMP',{claimId:'BERLIN-1'}],
    ['SHIP',{claimId:'BERLIN-1'}],
    ['PUMP',{claimId:'BERLIN-1'}]
  ];
  for(const [type,extra] of actions)s=move(s,type,'H1',extra);
  const f=company(s,'H1');
  const spent=opening-f.cashCent;
  assert.equal(spent,19900000,'real action costs changed');
  assert.equal(f.cashCent,100000,'natural remaining cash');
  assert.equal(f.debtCent,0,'debt injected before rescue');
  assert.equal(s.claims['BERLIN-1'].preparedMilli,100000);
  assert.equal(s.claims['BERLIN-1'].inventoryMilli,100000);
  cashAudit(f,opening);
  s=move(s,'END_TURN','H1');
  s=move(s,'END_TURN','H2');
  assert.equal(s.phase,'RESCUE','natural arrears must trigger rescue');
  assert.deepEqual(s.rescueIds,['H1']);
  assert.equal(s.lastReport.month,1);
  assert.equal(s.lastReport.companies.find(x=>x.id==='H1').arrearsCent,40000);
  const troubled=company(s,'H1');
  const wage=invoice(troubled,1,'PERSONAL');
  const upkeep=invoice(troubled,1,'WARTUNG');
  assert.equal(wage.dueCent,E.CFG.wage);
  assert.equal(upkeep.dueCent,E.CFG.upkeep);
  assert.equal(wage.paidCent,64286,'proportional wage payment');
  assert.equal(upkeep.paidCent,35714,'proportional upkeep payment');
  assert.equal(E.pending(troubled),40000,'natural unpaid invoices');
  assert.equal(troubled.cashCent,0,'priority-1 settlement should exhaust cash');
  assert.equal(troubled.debtCent,0,'rescue debt not yet created');
  assert.equal(company(s,'H2').cashCent,opening-E.CFG.wage,
    'unaffected second firm cash');
  cashAudit(troubled,opening);
  const beforeLoan=cp(s);
  s=move(s,'RESCUE_LOAN','H1');
  assert.deepEqual(beforeLoan.companies[0].obligations.map(o=>o.paidCent),
    [64286,35714],'rescue mutated prior state');
  const rescued=company(s,'H1');
  assert.equal(s.phase,'REPORT','rescue should finish');
  assert.deepEqual(s.rescueIds,[]);
  assert.equal(rescued.debtCent,E.CFG.credit,'loan must create equal liability');
  assert.equal(rescued.cashCent,E.CFG.credit-40000,
    'loan must settle outstanding invoices');
  assert.equal(E.pending(rescued),0);
  for(const o of rescued.obligations) {
    assert.equal(o.paidCent,o.dueCent,'invoice not fully settled');
    const payments=rescued.ledger.filter(e=>e.code==='ZAHLUNG_'+o.kind&&e.info===o.id);
    assert.equal(payments.length,2,'expected partial and rescue payments');
    assert.equal(-payments.reduce((n,e)=>n+e.deltaCent,0),o.dueCent,
      'invoice payments do not equal liability');
  }
  const credits=rescued.ledger.filter(e=>e.code==='RETTUNGSKREDIT');
  assert.equal(credits.length,1);
  assert.equal(credits[0].deltaCent,E.CFG.credit);
  cashAudit(rescued,opening);
  const restored=cp(s);
  assert.equal(E.validate(restored),true);
  assert.deepEqual(restored,s,'JSON save/restore changed rescue state');
  s=move(restored,'NEXT_MONTH','H1');
  assert.equal(s.month,2);
  s=move(s,'END_TURN','H1');
  s=move(s,'END_TURN','H2');
  assert.equal(s.phase,'REPORT','second month should settle without rescue');
  const next=company(s,'H1');
  const interest=invoice(next,2,'ZINS');
  const principal=invoice(next,2,'TILGUNG');
  assert.equal(interest.dueCent,40000,'1% interest on real rescue loan');
  assert.equal(principal.dueCent,200000,'5% repayment on real rescue loan');
  assert.equal(interest.paidCent,interest.dueCent);
  assert.equal(principal.paidCent,principal.dueCent);
  assert.equal(next.debtCent,E.CFG.credit-principal.dueCent);
  assert.equal(next.cashCent,E.CFG.credit-40000-E.CFG.wage-E.CFG.upkeep-
    interest.dueCent-principal.dueCent);
  assert.equal(E.pending(next),0);
  cashAudit(next,opening);
  assert.equal(s.reports.length,2);
  const invalid=[
    ['cashbook',x=>{company(x,'H1').cashCent++;}],
    ['duplicate payment',x=>{const f=company(x,'H1');f.ledger.push(cp(f.ledger.at(-1)));}],
    ['interest amount',x=>{invoice(company(x,'H1'),2,'ZINS').dueCent++;}],
    ['principal amount',x=>{invoice(company(x,'H1'),2,'TILGUNG').dueCent++;}],
    ['debt balance',x=>{company(x,'H1').debtCent++;}]
  ];
  let negatives=0;
  function auditFinal(x) {
    const f=company(x,'H1');
    cashAudit(f,opening);
    assert.equal(invoice(f,2,'ZINS').dueCent,40000,'interest amount');
    assert.equal(invoice(f,2,'TILGUNG').dueCent,200000,'principal amount');
    assert.equal(f.debtCent,3800000,'debt balance');
  }
  for(const [name,corrupt] of invalid) {
    const bad=cp(s);corrupt(bad);
    assert.throws(()=>auditFinal(bad),new RegExp(name==='duplicate payment'?
      'duplicate booking ID':name==='cashbook'?'cashbook':name),
      'corruption undetected: '+name);
    negatives++;
  }
  return {realActions:actions.length,months:2,companies:2,
    initialCashCent:opening,realActionPaymentsCent:spent,
    unpaidBeforeRescueCent:40000,rescueCreditCent:E.CFG.credit,
    debtAfterMonth2Cent:next.debtCent,negativeCases:negatives,
    jsonRoundtrips:1,noInjectedCashOrDebt:true,
    profitStatus:'NOT_COMPUTABLE',valuationStatus:'UNPRICED'};
}
const first=run(),second=run();
assert.deepEqual(first,second,'natural rescue is not reproducible');
console.log(JSON.stringify({schema:'pppoppi.real-arrears-rescue/1',
  scenarios:2,companyMonthsChecked:8,
  ...first,negativeCases:first.negativeCases+second.negativeCases,
  prereleaseGate:'BLOCKED',
  limitations:['Two months, two human firms, no complete game.',
    'Rescue uses the actual game credit, not synthetic debt.',
    'Historical C64 rules, asset valuation and accounting profit remain unverified.']
},null,2));
