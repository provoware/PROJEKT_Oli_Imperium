'use strict';
// WIR-04 / BAL-01: independent acquisition-cost and liability bridge.
// Cash payments are not profit; historical asset values remain unapproved.
const assert = require('node:assert/strict');
for (const name of ['v07_engine','v08_engine','v082_engine','profi_economy',
  'logistics_v17','public_network_v171']) require('../SPIEL/src/' + name + '.js');
const E = globalThis.OliV082;
const copy = value => JSON.parse(JSON.stringify(value));
const IDS = ['H1','H2'];
const CLAIMS = {'H1':'BERLIN-1','H2':'BERLIN-2'};
const INVESTMENT_CODES = ['FELDKAUF','FACHBOHRUNG','RAFFINERIE_BAU','VERTRIEBSROUTE'];
const SALE_CODES = new Set(['MARKTERLÖS','VERTRAGSERLÖS','AUSSENMARKT','RAFFINIERT_MONATSVERKAUF']);
let sequence = 0;
function move(state,type,id,extra={}) {
  const before = copy(state);
  const command = {type,companyId:id,requestId:'ASSET-BRIDGE-'+(++sequence),...extra};
  const result = E.transition(state,command);
  assert.equal(result.duplicate,false,'duplicate action');
  assert.deepEqual(state,before,'action mutated input');
  assert.equal(E.validate(result.state),true);
  return result.state;
}
function audit(state,opening) {
  assert.equal(state.phase,'REPORT','month must be settled');
  const result = [];
  let totalInvestment = 0, totalSales = 0, totalUnpaid = 0;
  for (const id of IDS) {
    const firm = state.companies.find(f=>f.id===id);
    const report = state.lastReport.companies.find(f=>f.id===id);
    assert.ok(firm&&report,'company/report missing');
    const entries = firm.ledger;
    const ids = entries.map(e=>e.id);
    assert.equal(new Set(ids).size,ids.length,'duplicate booking ID');
    for(const entry of entries) {
      assert.ok(typeof entry.code==='string'&&Number.isSafeInteger(entry.deltaCent),
        'invalid booking');
    }
    const delta = entries.reduce((sum,e)=>sum+e.deltaCent,0);
    assert.ok(Number.isSafeInteger(delta),'unsafe ledger sum');
    assert.equal(firm.cashCent,opening[id].cashCent+delta,'cash/ledger mismatch');
    assert.equal(report.cashCent,firm.cashCent,'report cash mismatch');
    assert.equal(report.debtCent,firm.debtCent,'report debt mismatch');
    const invoices = firm.obligations.map(o=>{
      assert.ok(Number.isSafeInteger(o.dueCent)&&Number.isSafeInteger(o.paidCent)&&
        o.paidCent>=0&&o.dueCent>=o.paidCent,'invalid invoice');
      return o;
    });
    const unpaid = invoices.filter(o=>o.priority<=3)
      .reduce((sum,o)=>sum+o.dueCent-o.paidCent,0);
    assert.equal(unpaid,E.pending(firm),'invoice/pending mismatch');
    assert.equal(unpaid,report.arrearsCent,'report arrears mismatch');
    assert.equal(firm.debtCent,0,'unexpected debt in no-credit scenario');
    const sales = entries.filter(e=>SALE_CODES.has(e.code))
      .reduce((sum,e)=>sum+e.deltaCent,0);
    assert.equal(sales,report.revenueCent,'report revenue mismatch');
    assert.ok(sales>0,'real sale missing');
    const count=(code,info)=>entries.filter(e=>e.code===code&&e.info===info).length;
    const all=(code)=>entries.filter(e=>e.code===code);
    const owned=Object.values(state.claims).filter(c=>c.owner===id);
    assert.equal(owned.length,1,'asset ownership mismatch');
    const claim=state.claims[CLAIMS[id]];
    assert.equal(claim.owner,id,'asset purchase trail owner mismatch');
    assert.equal(claim.drilled,true,'asset drilling trail missing');
    assert.equal(all('FELDKAUF').length,owned.length,'asset purchase trail count mismatch');
    assert.equal(count('FELDKAUF',claim.id),1,'asset purchase trail mismatch');
    assert.equal(all('FACHBOHRUNG').length,1,'asset drilling trail count mismatch');
    assert.equal(count('FACHBOHRUNG',claim.id),1,'asset drilling trail mismatch');
    const plants=state.refinery.plants[id];
    for(const region of E.REGIONS) {
      const plant=plants[region.id];
      assert.ok(plant,'asset plant missing');
      const expected=region.id==='BERLIN'?1:0;
      assert.equal(Number(plant.built),expected,'asset plant state mismatch');
      assert.equal(Number(plant.route),expected,'asset route state mismatch');
      assert.equal(count('RAFFINERIE_BAU',region.id),expected,
        'asset plant trail mismatch');
      assert.equal(count('VERTRIEBSROUTE',region.id),expected,
        'asset route trail mismatch');
    }
    assert.equal(all('RAFFINERIE_BAU').length,1,'asset plant trail count mismatch');
    assert.equal(all('VERTRIEBSROUTE').length,1,'asset route trail count mismatch');
    const sold = state.lastReport.allocations.BERLIN[claim.id];
    assert.ok(Number.isSafeInteger(sold)&&sold>0,'real regional sale missing');
    assert.equal(opening[id].reserveMilli-claim.reserveMilli,E.CFG.pumpMilli,
      'physical reserve movement mismatch');
    assert.equal(claim.inventoryMilli+claim.preparedMilli+sold,E.CFG.pumpMilli,
      'physical stock conservation mismatch');
    const investment=entries.filter(e=>INVESTMENT_CODES.includes(e.code))
      .reduce((sum,e)=>{
        assert.ok(e.deltaCent<0,'asset acquisition has invalid sign');
        return sum-e.deltaCent;
      },0);
    assert.ok(investment>0,'no paid acquisitions');
    assert.ok(Number.isSafeInteger(investment),'unsafe acquisition sum');
    totalInvestment+=investment;totalSales+=sales;totalUnpaid+=unpaid;
    result.push({company:id,ownedClaims:owned.length,drilledClaims:1,
      builtRefineries:1,builtRoutes:1,acquisitionPaymentsCent:investment,
      revenueCent:sales,unpaidInvoicesCent:unpaid,rawStockMilli:claim.inventoryMilli,
      cashCent:firm.cashCent,debtCent:firm.debtCent});
  }
  assert.equal(state.lastReport.regions.BERLIN.soldMilli,
    IDS.reduce((sum,id)=>sum+state.lastReport.allocations.BERLIN[CLAIMS[id]],0),
    'regional sales total mismatch');
  assert.ok(Number.isSafeInteger(totalInvestment+totalSales+totalUnpaid),
    'aggregate overflow');
  assert.equal(E.validate(state),true);
  return {companies:result,totalAcquisitionPaymentsCent:totalInvestment,
    totalSalesCent:totalSales,totalUnpaidInvoicesCent:totalUnpaid,
    valuationStatus:'UNPRICED',profitStatus:'NOT_COMPUTABLE'};
}
function scenario() {
  let state=E.fresh({humans:2,ais:0,seed:'ASSET-COST-BRIDGE-20261031'});
  const opening=Object.fromEntries(IDS.map(id=>[id,{
    cashCent:state.companies.find(f=>f.id===id).cashCent,
    reserveMilli:state.claims[CLAIMS[id]].reserveMilli
  }]));
  for(const id of IDS) {
    const claimId=CLAIMS[id];
    for(const [type,extra] of [
      ['SURVEY',{claimId}],['BUY',{claimId}],['DRILL',{claimId}],
      ['PUMP',{claimId}],['REFINERY_BUILD',{region:'BERLIN',claimId}],
      ['ROUTE_BUILD',{region:'BERLIN'}],['SHIP',{claimId}],
      ['OFFER',{claimId}]
    ]) state=move(state,type,id,extra);
    state=move(state,'END_TURN',id);
  }
  const summary=audit(state,opening);
  const cases=[
    ['cash/ledger mismatch',s=>{s.companies[0].cashCent++;}],
    ['cash/ledger mismatch',s=>{s.companies[0].ledger[0].deltaCent++;}],
    ['duplicate booking ID',s=>{s.companies[0].ledger.push(copy(s.companies[0].ledger[0]));}],
    ['asset purchase trail mismatch',s=>{s.companies[0].ledger.find(e=>e.code==='FELDKAUF').info='BERLIN-2';}],
    ['asset ownership mismatch',s=>{s.claims['BERLIN-1'].owner=null;}],
    ['asset drilling trail missing',s=>{s.claims['BERLIN-1'].drilled=false;}],
    ['asset plant state mismatch',s=>{s.refinery.plants.H1.BERLIN.built=false;}],
    ['asset route state mismatch',s=>{s.refinery.plants.H1.BERLIN.route=false;}],
    ['report debt mismatch',s=>{s.companies[0].debtCent++;}],
    ['report arrears mismatch',s=>{s.companies[0].obligations[0].dueCent++;}],
    ['report revenue mismatch',s=>{s.lastReport.companies[0].revenueCent++;}],
    ['physical stock conservation mismatch',s=>{s.claims['BERLIN-1'].inventoryMilli++;}]
  ];
  for(const [message,corrupt] of cases) {
    const bad=copy(state);corrupt(bad);
    assert.throws(()=>audit(bad,opening),new RegExp(message.replace('/','\\/')));
  }
  return {summary,negativeCases:cases.length,realActions:IDS.length*9,
    sourceUnchanged:true,noInjectedInventoryOrCash:true};
}
const first=scenario(),second=scenario();
assert.deepEqual(first,second,'asset bridge is not reproducible');
console.log(JSON.stringify({schema:'pppoppi.asset-cost-bridge/1',
  scenarios:2,companiesChecked:4,negativeCases:24,
  assetCostVsValueSeparated:true,profitNotClaimed:true,
  ...first,prereleaseGate:'BLOCKED',
  limitations:[
    'Acquisition payments are cash flows, not approved residual or market values.',
    'Depreciation, fire losses, stock unit costs and receivable recognition are not defined.',
    'No accounting profit or net worth is calculated without approved valuation rules.',
    'This two-company one-month scenario is a technical partial test, not a complete game.'
  ]},null,2));
