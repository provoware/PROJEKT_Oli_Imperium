'use strict';
// WIR-04 / BAL-01: independent 16-month natural liquidity and repeat-rescue test.
// Berlin adaptation only: NOT evidence of original C64 rules or accounting profit.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const firm = (state,id) => state.companies.find(f => f.id === id);
const rounded = (n,d) => Math.floor((n + Math.floor(d/2))/d);
let serial = 0;
function step(state,type,companyId,extra={}) {
  const original = copy(state);
  const command = {type,companyId,requestId:'CREDIT-LONGRUN-'+(++serial),...extra};
  const result = E.transition(state,command);
  assert.equal(result.duplicate,false,'first command rejected as duplicate');
  assert.deepEqual(state,original,'transition changed its input');
  assert.equal(E.validate(result.state),true,'invalid resulting state');
  const replay = E.transition(result.state,command);
  assert.equal(replay.duplicate,true,'repeated command was accepted');
  assert.deepEqual(replay.state,result.state,'repeated command changed state');
  return result.state;
}
function invoice(f,month,kind) {
  const id = 'M'+month+'-G'+f.generation+'-'+(kind==='PERSONAL'?'LOHN':kind);
  const matches = f.obligations.filter(o => o.id === id);
  assert.equal(matches.length,1,'missing/duplicate invoice '+id);
  return matches[0];
}
function ledgerAudit(f,opening) {
  assert.equal(new Set(f.ledger.map(e=>e.id)).size,f.ledger.length,'duplicate ledger ID');
  const delta = f.ledger.reduce((sum,e)=>{
    assert.ok(Number.isSafeInteger(e.deltaCent),'unsafe ledger amount');
    return sum+e.deltaCent;
  },0);
  assert.equal(f.cashCent,opening+delta,'ledger/cash mismatch');
}
function verifyFinal(state,opening) {
  const a=firm(state,'H1'),b=firm(state,'H2');
  ledgerAudit(a,opening);ledgerAudit(b,opening);
  assert.equal(a.cashCent,2815799,'final H1 cash');
  assert.equal(a.debtCent,5463166,'final H1 debt');
  assert.equal(b.cashCent,opening-16*E.CFG.wage,'independent H2 cash');
  assert.equal(b.debtCent,0,'independent H2 debt');
  const loans=a.ledger.filter(e=>e.code==='RETTUNGSKREDIT');
  assert.equal(loans.length,2,'rescue loan count');
  assert.equal(loans.reduce((sum,e)=>sum+e.deltaCent,0),8000000,'rescue loan total');
  assert.equal(invoice(a,14,'ZINS').dueCent,21614,'month 14 interest');
  assert.equal(invoice(a,16,'TILGUNG').dueCent,287535,'month 16 principal');
  assert.equal(E.pending(a),0,'unpaid final invoices');
  for(const o of a.obligations)assert.equal(o.paidCent,o.dueCent,'unpaid H1 invoice');
}
function scenario() {
  serial=0;
  let s=E.fresh({humans:2,ais:0,seed:'WIR04-NATURAL-CREDIT-LONGRUN-20261031'});
  const opening=E.CFG.startCash;
  assert.equal(opening,20000000,'starting cash assumption changed');
  assert.equal(E.CFG.wage,90000,'wage assumption changed');
  assert.equal(E.CFG.upkeep,50000,'upkeep assumption changed');
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
  for(const [type,params] of actions)s=step(s,type,'H1',params);
  assert.equal(firm(s,'H1').cashCent,100000,'natural investment costs changed');
  assert.equal(firm(s,'H1').debtCent,0,'initial debt must be zero');
  s=step(s,'END_TURN','H1');s=step(s,'END_TURN','H2');
  assert.equal(s.phase,'RESCUE','month 1 must cause natural rescue');
  assert.deepEqual(s.rescueIds,['H1']);
  assert.equal(E.pending(firm(s,'H1')),40000,'month 1 arrears');
  s=step(s,'RESCUE_LOAN','H1');
  assert.equal(s.phase,'REPORT');
  let expectedCash=3960000,expectedDebt=4000000,roundtrips=0,secondArrears=0;
  assert.equal(firm(s,'H1').cashCent,expectedCash);
  assert.equal(firm(s,'H1').debtCent,expectedDebt);
  for(let month=2;month<=16;month++) {
    s=step(s,'NEXT_MONTH','H1');
    assert.equal(s.month,month);
    if([5,10,14,16].includes(month)){
      const restored=copy(s);
      assert.equal(E.validate(restored),true,'saved state invalid');
      assert.deepEqual(restored,s,'JSON roundtrip changed state');
      s=restored;roundtrips++;
    }
    const previousDebt=expectedDebt;
    const interest=rounded(previousDebt*E.CFG.loanInterestBps,10000);
    const principal=rounded(previousDebt*E.CFG.loanRepaymentBps,10000);
    const due=E.CFG.wage+E.CFG.upkeep+interest+principal;
    const shortfall=Math.max(0,due-expectedCash);
    s=step(s,'END_TURN','H1');s=step(s,'END_TURN','H2');
    const a=firm(s,'H1'),b=firm(s,'H2');
    assert.equal(invoice(a,month,'PERSONAL').dueCent,90000,'monthly wage');
    assert.equal(invoice(a,month,'WARTUNG').dueCent,50000,'monthly upkeep');
    assert.equal(invoice(a,month,'ZINS').dueCent,interest,'independent interest oracle');
    assert.equal(invoice(a,month,'TILGUNG').dueCent,principal,'independent principal oracle');
    assert.equal(s.lastReport.month,month);
    assert.equal(s.lastReport.companies.find(f=>f.id==='H1').arrearsCent,shortfall,
      'report must record arrears before rescue');
    assert.equal(E.pending(a),shortfall,'monthly unpaid obligations');
    assert.equal(s.phase,shortfall?'RESCUE':'REPORT','wrong month-end phase');
    assert.equal(b.cashCent,opening-month*E.CFG.wage,'H2 was affected by H1');
    assert.equal(b.debtCent,0,'H2 acquired unexpected debt');
    expectedCash=Math.max(0,expectedCash-due);
    if(!shortfall)expectedDebt-=principal;
    if(shortfall) {
      assert.equal(month,14,'unexpected additional rescue');
      assert.equal(shortfall,195957,'month 14 natural shortage');
      assert.deepEqual(s.rescueIds,['H1']);
      secondArrears=shortfall;
      const restored=copy(s);
      assert.equal(E.validate(restored),true,'mid-rescue JSON invalid');
      s=step(restored,'RESCUE_LOAN','H1');
      roundtrips++;
      assert.equal(invoice(a,month,'TILGUNG').paidCent,0,'principal paid before rescue despite insufficient priority-1 cash');
      expectedDebt+=E.CFG.credit-principal;
      expectedCash+=E.CFG.credit-shortfall;
      assert.equal(s.phase,'REPORT','second rescue must finish');
      assert.equal(E.pending(firm(s,'H1')),0,'second rescue left unpaid invoices');
    }
    assert.equal(firm(s,'H1').cashCent,expectedCash,'cash at month '+month);
    assert.equal(firm(s,'H1').debtCent,expectedDebt,'debt at month '+month);
    assert.equal(s.reports.length,month,'report history length');
    ledgerAudit(firm(s,'H1'),opening);ledgerAudit(firm(s,'H2'),opening);
  }
  assert.equal(secondArrears,195957);
  assert.equal(roundtrips,5);
  verifyFinal(s,opening);
  const corruptions=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{const f=firm(x,'H1');f.ledger.push(copy(f.ledger.at(-1)));},
    x=>{firm(x,'H1').debtCent++;},
    x=>{firm(x,'H1').ledger.find(e=>e.code==='RETTUNGSKREDIT').deltaCent++;},
    x=>{invoice(firm(x,'H1'),14,'ZINS').dueCent++;},
    x=>{invoice(firm(x,'H1'),16,'TILGUNG').dueCent++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{invoice(firm(x,'H1'),12,'PERSONAL').paidCent--;}
  ];
  for(const corrupt of corruptions) {
    const damaged=copy(s);corrupt(damaged);
    assert.throws(()=>verifyFinal(damaged,opening),'undetected corruption');
  }
  return {months:16,realActions:actions.length,secondRescueMonth:14,
    firstArrearsCent:40000,secondArrearsCent:secondArrears,
    creditPerRescueCent:E.CFG.credit,finalCashCent:expectedCash,
    finalDebtCent:expectedDebt,jsonRoundtrips:roundtrips,
    negativeCases:corruptions.length,noInjectedCashOrDebt:true};
}
const a=scenario(),b=scenario();
assert.deepEqual(a,b,'repeated scenario not deterministic');
console.log(JSON.stringify({schema:'pppoppi.real-credit-longrun/1',
  scenarios:2,companyMonthsChecked:64,...a,
  negativeCases:a.negativeCases+b.negativeCases,
  prereleaseGate:'BLOCKED',
  limitations:['16 months of a Berlin adaptation, not a complete game.',
    'No original C64 debt rule or verified accounting valuation.',
    'No browser file picker, media rights or end-user approval covered.']
},null,2));
