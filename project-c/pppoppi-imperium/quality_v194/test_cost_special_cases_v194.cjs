'use strict';
// Sonderfaelle fuer PPPOPPI-Forschungsbilanz: kein freigegebener Abschluss.
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193'])require('../SPIEL/src/'+f+'.js');
const E=globalThis.OliV082,B=require('./cost_basis_v194.cjs'),cp=x=>JSON.parse(JSON.stringify(x));
function session(seed='FIN-SPECIAL'){
 let s=E.fresh({humans:2,ais:0,seed}),b=B.seed(s,'H1'),step=0;
 function move(type,args={},companyId='H1'){
  const original=cp(s),oldBook=cp(b);
  const out=E.transition(s,{type,companyId,requestId:'SPECIAL-'+(++step),...args});
  assert.equal(out.duplicate,false);
  E.validate(out.state);assert.deepEqual(s,original,'Spielzustand mutiert');
  const updated=B.reconcile(s,out.state,b);
  assert.deepEqual(b,oldBook,'Kostenkonto mutiert');
  s=out.state;b=updated;return s;
 }
 const end=()=>{move('END_TURN');move('END_TURN',{},'H2')};
 return {move,end,get state(){return s},get book(){return b},get steps(){return step}};
}
function preparePublic(){
 const t=session('FIN-PUBLIC-PAY');
 const x=(type,data)=>t.move(type,data),id='BERLIN-1';
 x('SURVEY',{claimId:id});x('BUY',{claimId:id});x('DRILL',{claimId:id});x('PUMP',{claimId:id});
 x('REFINERY_BUILD',{region:'BERLIN'});x('REFINE_BATCH',{region:'BERLIN',claimId:id});
 x('ROUTE_BUILD',{region:'BERLIN'});x('REFINED_SELL',{region:'BERLIN'});
 x('SHIP',{claimId:id});x('OFFER',{claimId:id});t.end();x('NEXT_MONTH');
 x('NETWORK_ENABLE',{region:'BERLIN'});
 for(const kind of ['RAW','PIPE','FINAL'])x('NETWORK_BUILD',{region:'BERLIN',kind,claimId:id});
 x('PUMP',{claimId:id});x('NETWORK_RAW',{region:'BERLIN',claimId:id,qtyMilli:10000});
 t.end();x('NEXT_MONTH');
 x('NETWORK_REFINE',{region:'BERLIN',claimId:id});
 x('NETWORK_PRODUCT',{region:'BERLIN',claimId:id,qtyMilli:9000});
 t.end();x('NEXT_MONTH');
 return t;
}
test('Öltransportkosten: Rohölzulieferung aktiviert, ausgehende Fertigware bleibt Vertriebsaufwand',()=>{
 const t=preparePublic();
 assert.equal(t.book.capitalizedInboundFreightCent,14000);
 const product=B.valuation(t.book,t.state).inTransitBookCent;
 assert.equal(product,0,'Fertigware wurde im Folgemonat schon am Marktlager abgeladen');
 assert.equal(t.book.raw.BERLIN.cent,102600);
 assert.equal(t.book.product.BERLIN.cent,76400);
 assert.equal(B.report(t.book,t.state).accountingProfitCent,null);
});
test('Öffentlicher Frachtvorschuss: zunächst Forderungs-/Vorauszahlungsbestand statt Aufwand',()=>{
 const t=preparePublic(),start=t.book.expenseCent;
 t.move('PUBLIC_CONNECT',{from:'BERLIN',to:'BRANDENBURG'});
 const afterConnection=t.book.expenseCent;
 assert.equal(afterConnection,start);
 t.move('PUBLIC_QUEUE',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});
 const held=t.book.heldFreightCent;
 assert.ok(held>0);assert.equal(t.book.expenseCent,afterConnection);
 assert.equal(B.valuation(t.book,t.state).prepaymentBookCent,held);
 assert.equal(B.report(t.book,t.state).accountingProfitCent,null);
 t.end();
 assert.equal(t.book.heldFreightCent,0);
 assert.equal(t.book.expenseCent,afterConnection+held+E.CFG.wage+E.CFG.upkeep);
 assert.equal(t.book.product.BERLIN.qty,0,'Produkt geht von Berlin in den Fremdmarkt');
 assert.equal(t.book.product.BRANDENBURG.qty,9000);
 assert.equal(B.valuation(t.book,t.state).inTransitBookCent,76400);
 const auction=t.state.lastReport.publicNetwork;
 assert.equal(auction.freight.filter(x=>x.companyId==='H1').length,1);
 assert.equal(auction.freight.find(x=>x.companyId==='H1').freightCent,held);
 assert.equal(B.report(t.book,t.state).accountingProfitCent,null);
});
test('Öffentlicher Zielmarkt: kein Erlös bei Angebot/Transport, sondern erst Abrechnung',()=>{
 const t=preparePublic();
 t.move('PUBLIC_CONNECT',{from:'BERLIN',to:'BRANDENBURG'});
 t.move('PUBLIC_QUEUE',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});t.end();t.move('NEXT_MONTH');
 let loops=0;
 while((t.state.publicNetwork.received.H1.BRANDENBURG||0)<9000&&loops++<6){t.end();t.move('NEXT_MONTH');}
 assert.equal(t.state.publicNetwork.received.H1.BRANDENBURG,9000);
 const before=t.book.revenueCent;
 t.move('PUBLIC_OFFER',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});
 assert.equal(t.book.revenueCent,before);
 assert.equal(t.book.product.BRANDENBURG.qty,9000,'Ware bleibt bis zur Auktion eigenes Vermögen');
 t.end();
 assert.ok(t.book.revenueCent>before);
 assert.equal(t.book.product.BRANDENBURG.qty,0);
 assert.equal(t.book.heldFreightCent,0);
 assert.equal(t.book.releaseGate,'BLOCKED');
});
test('Echter vollständig belieferter Vertrag: Umsatz, Rohöl-Warenausgang und Rechnungen',()=>{
 const t=session('CONTRACT-FIN-FULL'),id='BERLIN-1',a=(type,v)=>t.move(type,v);
 a('SURVEY',{claimId:id});a('BUY',{claimId:id});a('DRILL',{claimId:id});
 a('PUMP',{claimId:id});a('SIGN',{region:'BERLIN'});t.end();a('NEXT_MONTH');
 const old=t.book.revenueCent;
 t.end();
 const con=t.state.companies[0].contracts.at(-1);
 assert.equal(con.status,'DONE');
 assert.equal(t.book.revenueCent-old,t.state.companies[0].ledger.filter(x=>x.code==='VERTRAGSERLÖS').reduce((sum,x)=>sum+x.deltaCent,0));
 assert.equal(t.book.costOfSalesCent,Math.floor(E.CFG.pumpCost*con.soldMilli/E.CFG.pumpMilli));
 assert.equal(t.book.raw.BERLIN.qty,E.CFG.pumpMilli-con.soldMilli);
 assert.equal(B.report(t.book,t.state).releaseGate,'BLOCKED');
});
test('Echter Vertragsbruch ohne Ware: offene Vertragsstrafe ist Aufwand, kein Umsatz',()=>{
 const t=session('CONTRACT-FIN-BREACH'),id='BERLIN-1',a=(type,v)=>t.move(type,v);
 a('SURVEY',{claimId:id});a('BUY',{claimId:id});a('SIGN',{region:'BERLIN'});
 t.end();a('NEXT_MONTH');t.end();
 const v=t.state.companies[0].contracts.at(-1);
 assert.equal(v.status,'BREACH');assert.equal(v.soldMilli,0);
 assert.equal(t.book.revenueCent,0);
 assert.ok(t.state.companies[0].obligations.some(o=>o.kind==='VERTRAGSSTRAFE'));
 assert.equal(B.report(t.book,t.state).releaseGate,'BLOCKED');
});
test('Realer Brandschaden: vorhandener Anlagebuchwert wird nicht still als intakt bewertet',()=>{
 const t=preparePublic();
 // Der Engine-Zyklus erzeugt am Anfang von Monat 4 periodisch einen Brand.
 const claim=t.state.claims['BERLIN-1'];
 assert.equal(claim.burning,true);
 assert.throws(()=>B.report(t.book,t.state),/WERTMINDERUNG_OFFEN/);
});
test('Unbelegte Rückerstattung wird als unzulässiger Cashflow zurückgewiesen',()=>{
 const t=session(),original=cp(t.state),corrupt=cp(t.state),f=corrupt.companies[0];
 f.cashCent+=100;
 f.ledger.push({id:'FAKE-REFUND',month:1,code:'FRACHT_RUECKGABE',deltaCent:100,info:'FAKE'});
 assert.throws(()=>B.reconcile(original,corrupt,t.book),/Unbelegte Frachtrueckgabe/);
});
test('Mehrmonatige Endpartie: Buchungs- und Bestandsbrücke bleibt ausführbar, Vorrelease bleibt gesperrt',()=>{
 const t=session('LONG-MONTH-END');
 // Drei Konzessionen ohne Bohrung vermeiden ungeprüfte Brand-Wertminderung.
 for(let i=1;i<=3;i++){t.move('SURVEY',{claimId:'BERLIN-'+i});t.move('BUY',{claimId:'BERLIN-'+i});}
 let completed=0,crises=0;
 for(let i=0;i<66;i++){
  t.end();completed++;
  if(t.state.phase==='RESCUE'){crises++;break;}
  assert.equal(t.state.phase,'REPORT');
  assert.equal(B.report(t.book,t.state).releaseGate,'BLOCKED');
  t.move('NEXT_MONTH');
 }
 assert.ok(completed>=10);
 assert.ok(crises>0,'Natürliche Krise sollte vor Monat 66 eintreten');
 assert.equal(t.state.phase,'RESCUE');
 assert.equal(t.book.releaseGate,'BLOCKED');
 // Notverkauf einer unbeladenen Konzession: Erlös und Ausbuchung des Buchwerts.
 const prior=t.book.assets.length,before=t.book.assetSaleProceedsCent;
 t.move('RESCUE_SALE',{claimId:'BERLIN-1'});
 assert.equal(t.book.assets.length,prior-1);
 assert.ok(t.book.assetSaleProceedsCent>before);
 assert.equal(t.state.claims['BERLIN-1'].owner,null);
 assert.equal(B.report(t.book,t.state).releaseGate,'BLOCKED');
});
