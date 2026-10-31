'use strict';
// VER-02 / WIR-04 / BAL-01: natural 14-month insolvency and asset release.
// Independent Berlin-adaptation test; no historical C64 or valuation claim.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/'+name+'.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const firm = (s,id) => s.companies.find(f => f.id===id);
const owned = (s,id) => Object.values(s.claims).filter(c=>c.owner===id)
  .map(c=>c.id).sort();
const round = (n,d) => Math.floor((n+Math.floor(d/2))/d);
let sequence=0;
function move(s,type,companyId,extra={}) {
  const before=copy(s);
  const command={type,companyId,requestId:'NAT-INSOLV-'+(++sequence),...extra};
  const result=E.transition(s,command);
  assert.equal(result.duplicate,false,'first command treated as duplicate');
  assert.deepEqual(s,before,'engine mutated input');
  assert.equal(E.validate(result.state),true,'engine produced invalid state');
  const again=E.transition(result.state,command);
  assert.equal(again.duplicate,true,'duplicate request accepted');
  assert.deepEqual(again.state,result.state,'duplicate changed state');
  return result.state;
}
function checkRestart(s,reference) {
  assert.equal(E.validate(s),true);
  assert.equal(s.phase,'REPORT','rescue did not finish');
  assert.deepEqual(s.rescueIds,[],'rescue queue not cleared');
  assert.equal(s.month,14,'wrong insolvency month');
  assert.deepEqual(s.reports,reference.reports,'historical reports rewritten');
  assert.deepEqual(s.lastReport,reference.reports.at(-1),'last report rewritten');
  const h1=firm(s,'H1');
  assert.equal(h1.generation,reference.generation+1,'generation not advanced');
  assert.equal(h1.stats.rescues,reference.rescues+1,'restart counter wrong');
  assert.deepEqual(h1.stats.awards,reference.awards,'awards lost');
  assert.equal(h1.cashCent,E.CFG.restart,'restart cash wrong');
  assert.equal(h1.debtCent,0,'old debt survived restart');
  assert.equal(E.pending(h1),0,'old arrears survived restart');
  assert.equal(h1.ledger.length,0,'old ledger survived restart');
  assert.equal(h1.obligations.length,0,'old invoices survived restart');
  assert.deepEqual(owned(s,'H1'),[],'insolvent company retained fields');
  for(const id of reference.released) {
    assert.deepEqual(s.claims[id],reference.pristine.claims[id],
      'released field not fully reset: '+id);
  }
  assert.deepEqual(firm(s,'H2'),reference.h2,'unrelated company changed');
  assert.equal(s.events.filter(e=>e.type==='SANIERUNGSNEUSTART'
    &&e.company==='H1').length,reference.restartEvents+1,
    'restart event count wrong');
}
function scenario() {
  sequence=0;
  const seed='WIR04-NATURAL-INSOLVENCY-20261031';
  const pristine=E.fresh({humans:2,ais:0,seed});
  let s=copy(pristine);
  assert.equal(E.CFG.startCash,20000000,'opening cash oracle changed');
  assert.equal(E.CFG.wage,90000,'wage oracle changed');
  assert.equal(E.CFG.upkeep,50000,'upkeep oracle changed');
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
  assert.equal(firm(s,'H1').cashCent,100000,'natural investment cash');
  assert.equal(firm(s,'H1').debtCent,0,'debt was injected');
  assert.deepEqual(owned(s,'H1'),['BERLIN-1','BRANDENBURG-1']);
  s=move(s,'END_TURN','H1');s=move(s,'END_TURN','H2');
  assert.equal(s.phase,'RESCUE','first natural crisis missing');
  assert.deepEqual(s.rescueIds,['H1']);
  assert.equal(E.pending(firm(s,'H1')),40000,'first arrears wrong');
  const firstH1=s.lastReport.companies.find(f=>f.id==='H1');
  const firstH2=s.lastReport.companies.find(f=>f.id==='H2');
  assert.equal(firstH1.arrearsCent,40000);
  assert.equal(firstH1.cashCent,0);
  assert.equal(firstH1.debtCent,0);
  assert.equal(firstH2.cashCent,E.CFG.startCash-E.CFG.wage);
  assert.equal(firstH2.debtCent,0);
  assert.equal(firstH2.arrearsCent,0);
  assert.equal(s.reports.length,1);
  s=move(s,'RESCUE_LOAN','H1');
  assert.equal(s.phase,'REPORT','first credit rescue failed');
  let cash=3960000,debt=4000000,roundtrips=0;
  assert.equal(firm(s,'H1').cashCent,cash);
  assert.equal(firm(s,'H1').debtCent,debt);
  for(let month=2;month<=14;month++) {
    s=move(s,'NEXT_MONTH','H1');
    assert.equal(s.month,month,'month sequence wrong');
    if(month===7) {
      s=copy(s);assert.equal(E.validate(s),true);roundtrips++;
    }
    const interest=round(debt*E.CFG.loanInterestBps,10000);
    const principal=round(debt*E.CFG.loanRepaymentBps,10000);
    const due=E.CFG.wage+E.CFG.upkeep+interest+principal;
    const shortage=Math.max(0,due-cash);
    s=move(s,'END_TURN','H1');s=move(s,'END_TURN','H2');
    const report=s.lastReport.companies.find(f=>f.id==='H1');
    const otherReport=s.lastReport.companies.find(f=>f.id==='H2');
    assert.ok(otherReport,'second company report missing M'+month);
    assert.equal(otherReport.cashCent,E.CFG.startCash-month*E.CFG.wage,
      'reported H2 cash M'+month);
    assert.equal(otherReport.debtCent,0,'reported H2 debt M'+month);
    assert.equal(otherReport.arrearsCent,0,'reported H2 arrears M'+month);
    assert.equal(report.cashCent,Math.max(0,cash-due),'reported cash M'+month);
    assert.equal(report.debtCent,debt-(shortage?0:principal),
      'reported debt M'+month);
    assert.equal(report.arrearsCent,shortage,'reported arrears M'+month);
    assert.equal(E.pending(firm(s,'H1')),shortage,'real arrears M'+month);
    assert.equal(s.reports.length,month,'archived month count');
    assert.equal(firm(s,'H2').cashCent,
      E.CFG.startCash-month*E.CFG.wage,'unrelated company cash M'+month);
    if(month<14) {
      assert.equal(shortage,0,'unexpected earlier crisis');
      assert.equal(s.phase,'REPORT');
      cash-=due;debt-=principal;
      assert.equal(firm(s,'H1').cashCent,cash);
      assert.equal(firm(s,'H1').debtCent,debt);
    } else {
      assert.equal(cash,73729,'cash before second crisis changed');
      assert.equal(debt,2161441,'debt before second crisis changed');
      assert.equal(due,269686,'month-14 invoice total changed');
      assert.equal(shortage,195957,'natural month-14 shortage changed');
      assert.equal(s.phase,'RESCUE','natural insolvency opportunity missing');
      assert.deepEqual(s.rescueIds,['H1']);
      assert.equal(firm(s,'H1').cashCent,0);
      assert.equal(firm(s,'H1').debtCent,debt);
    }
  }
  const released=owned(s,'H1');
  assert.deepEqual(released,['BERLIN-1','BRANDENBURG-1']);
  const before=firm(s,'H1');
  const reference={
    pristine,released,reports:copy(s.reports),h2:copy(firm(s,'H2')),
    generation:before.generation,rescues:before.stats.rescues,
    awards:copy(before.stats.awards),
    restartEvents:s.events.filter(e=>e.type==='SANIERUNGSNEUSTART'
      &&e.company==='H1').length
  };
  s=copy(s);assert.equal(E.validate(s),true);roundtrips++;
  s=move(s,'RESTART','H1');
  checkRestart(s,reference);
  const corruptions=[
    x=>{firm(x,'H1').cashCent++;},
    x=>{firm(x,'H1').debtCent++;},
    x=>{firm(x,'H1').generation++;},
    x=>{firm(x,'H1').stats.rescues++;},
    x=>{firm(x,'H1').ledger.push({id:'FAKE',deltaCent:1});},
    x=>{firm(x,'H1').obligations.push({id:'FAKE',kind:'PERSONAL',
      priority:1,dueCent:1,paidCent:0});},
    x=>{x.claims[released[0]].owner='H1';},
    x=>{x.claims[released[1]].inventoryMilli++;},
    x=>{firm(x,'H2').cashCent++;},
    x=>{x.reports.at(-1).companies[0].cashCent++;},
    x=>{x.events.pop();}
  ];
  for(const corrupt of corruptions) {
    const damaged=copy(s);corrupt(damaged);
    assert.throws(()=>checkRestart(damaged,reference),'undetected restart corruption');
  }
  s=copy(s);assert.equal(E.validate(s),true);roundtrips++;
  s=move(s,'NEXT_MONTH','H1');
  assert.equal(s.phase,'TURN');
  assert.equal(s.month,15);
  assert.equal(s.reports.length,14,'restart added a false report');
  assert.equal(firm(s,'H1').generation,reference.generation+1);
  assert.equal(firm(s,'H1').debtCent,0);
  assert.deepEqual(owned(s,'H1'),[]);
  assert.deepEqual(firm(s,'H2'),reference.h2);
  for(const id of released)
    assert.deepEqual(s.claims[id],pristine.claims[id],'field reappeared');
  return {months:14,companyMonthsChecked:28,realActions:actions.length,
    firstRescueMonth:1,naturalInsolvencyMonth:14,arrearsCent:195957,
    releasedClaims:released,roundtrips,negativeCases:corruptions.length,
    noInjectedCashOrDebt:true,unrelatedCompanyPreserved:true};
}
const a=scenario(),b=scenario();
assert.deepEqual(a,b,'natural insolvency scenario not deterministic');
console.log(JSON.stringify({schema:'pppoppi.real-insolvency-longrun/1',
  scenarios:2,...a,
  companyMonthsChecked:a.companyMonthsChecked+b.companyMonthsChecked,
  negativeCases:a.negativeCases+b.negativeCases,
  prereleaseGate:'BLOCKED',
  limitations:[
    'Voluntary RESTART is selected after a natural month-14 shortage.',
    'This is a Berlin-adaptation partial test, not a complete endgame.',
    'No market value, historical C64 rule, or release approval is inferred.'
  ]},null,2));
