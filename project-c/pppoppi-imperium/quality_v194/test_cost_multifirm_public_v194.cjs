'use strict';
// Unabhaengige Gegenprobe mit zwei Firmen und echter, knapper Streckenkapazitaet.
const test=require('node:test'),assert=require('node:assert/strict');
for(const n of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193'])
 require('../SPIEL/src/'+n+'.js');
const E=globalThis.OliV082,B=require('./cost_basis_v194.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function campaign(){
 let state=E.fresh({humans:2,ais:0,seed:'MULTIFIRM-IMP-2026'});
 let books={H1:B.seed(state,'H1'),H2:B.seed(state,'H2')},seq=0;
 function act(type,companyId,args={}){
  const old=copy(state),prior=copy(books);
  const result=E.transition(state,{type,companyId,requestId:'MF-'+(++seq),...args});
  assert.equal(result.duplicate,false);assert.deepEqual(state,old);
  E.validate(result.state);
  const updated={};
  for(const k of ['H1','H2'])updated[k]=B.reconcile(state,result.state,books[k]);
  assert.deepEqual(books,prior);state=result.state;books=updated;
 }
 const next=()=>act('NEXT_MONTH','H1');
 for(let i=1;i<=2;i++){
  const id='H'+i,claimId='BERLIN-'+i;
  for(const type of ['SURVEY','BUY','DRILL'])act(type,id,{claimId});
  act('REFINERY_BUILD',id,{region:'BERLIN'});
  act('ROUTE_BUILD',id,{region:'BERLIN'});act('END_TURN',id);
 }
 next();
 for(let i=1;i<=2;i++){
  const id='H'+i,claimId='BERLIN-'+i;
  act('NETWORK_ENABLE',id,{region:'BERLIN'});
  for(const kind of ['RAW','PIPE','FINAL'])act('NETWORK_BUILD',id,{region:'BERLIN',kind,claimId});
  act('PUMP',id,{claimId});
  act('NETWORK_RAW',id,{region:'BERLIN',claimId,qtyMilli:20000});
  act('END_TURN',id);
 }
 next();
 for(let i=1;i<=2;i++){
  const id='H'+i,claimId='BERLIN-'+i;
  act('NETWORK_REFINE',id,{region:'BERLIN',claimId});
  act('NETWORK_REFINE',id,{region:'BERLIN',claimId});
  act('NETWORK_PRODUCT',id,{region:'BERLIN',claimId,qtyMilli:18000});
  act('END_TURN',id);
 }
 next();
 const burning=Object.values(state.claims).filter(x=>x.owner&&x.burning).map(x=>x.id);
 for(let i=1;i<=2;i++){
  const id='H'+i,claimId='BERLIN-'+i;
  if(state.claims[claimId].burning){
   const claim=state.claims[claimId];
   assert.ok(books[id].rawDamagePending[claimId]);
   books[id]=B.recordRawInventoryValuation(books[id],state,claimId,{
    claimId,month:state.month,affectedQtyMilli:claim.inventoryMilli+claim.preparedMilli,
    recoverableCent:books[id].raw.BERLIN.cent,
    sourceRef:'SYNTHETIC-MULTIFIRM-INVENTORY-CHECK-NOT-EXTERNAL',
    method:'Synthetische Erhaltung der Rohölbuchwerte nach Einzelinventur'});
   act('FIRE_EXPERT',id,{claimId});
  }
  act('PUBLIC_CONNECT',id,{from:'BERLIN',to:'BRANDENBURG'});
  act('PUBLIC_QUEUE',id,{from:'BERLIN',to:'BRANDENBURG',qtyMilli:18000});
  if(i===1)assert.equal(books[id].heldFreightCent,50400);
  act('END_TURN',id);
 }
 return {state,books,steps:seq,burning};
}
test('Zwei reale konkurrierende Firmen: faire Teilzuteilung und keine doppelte Lagerware',()=>{
 const s=campaign();assert.equal(s.steps,44);
 assert.equal(s.state.phase,'REPORT');
 assert.deepEqual(s.burning,['BERLIN-1']);
 const orders=s.state.lastReport.publicNetwork.freight;
 assert.equal(orders.length,2);
 for(const order of orders){
  assert.equal(order.requestedMilli,18000);
  assert.equal(order.acceptedMilli,12000);
  assert.equal(order.returnedMilli,6000);
  assert.equal(order.freightCent,33600);
  const b=s.books[order.companyId];
  assert.equal(b.heldFreightCent,0,'erledigte Frachtvorauszahlung nicht im Vermoegen');
  assert.equal(b.product.BERLIN.qty,6000,'nicht zugeteilte Ware bleibt im Herkunftslager');
  assert.equal(b.product.BRANDENBURG.qty,12000,'nur zugeteilte Menge unterwegs');
  assert.equal(b.product.BERLIN.qty+b.product.BRANDENBURG.qty,18000);
  assert.equal(B.report(b,s.state).accountingProfitCent,null);
  assert.equal(B.report(b,s.state).releaseGate,'BLOCKED');
 }
});
test('Echte Frachtrueckerstattung: beide Firmen zahlen netto nur zugeteilte Menge',()=>{
 const s=campaign();
 for(const id of ['H1','H2']){
  const ledger=s.state.companies.find(x=>x.id===id).ledger;
  const holds=ledger.filter(x=>x.code==='PUBLIC_FREIGHT_HOLD');
  const refunds=ledger.filter(x=>x.code==='FRACHT_RUECKGABE');
  assert.equal(holds.length,1);
  assert.equal(refunds.length,1);
  assert.equal(holds[0].deltaCent,-50400);
  assert.equal(refunds[0].deltaCent,16800);
  assert.equal(-holds[0].deltaCent-refunds[0].deltaCent,33600);
  assert.equal(s.books[id].heldFreightCent,0);
 }
});
test('Vertrag ohne fällige Lieferung schafft keine erfundene Forderung',()=>{
 const s=E.fresh({humans:2,ais:0,seed:'OPEN-CONTRACT-2026'});
 const b=B.seed(s,'H1');
 const own=copy(s),contract={
  id:'V-H1-1-BERLIN-FAKE',region:'BERLIN',qtyMilli:10000,dueMonth:2,
  status:'OPEN',soldMilli:0,profitCent:0
 };
 own.companies[0].contracts.push(contract);
 E.validate(own);
 const n=B.reconcile(s,own,b);
 assert.equal(B.valuation(n,own).receivablesCent,0);
 assert.equal(B.report(n,own).accountingProfitCent,null);
 assert.equal(n.revenueCent,0);
});
