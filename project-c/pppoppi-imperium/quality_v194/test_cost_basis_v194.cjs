'use strict';
// Reale Engine-Buchungen + adaptive Forschungskosten. Kein C64-Originaltest.
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193'])
 require('../SPIEL/src/'+f+'.js');
const E=globalThis.OliV082,B=require('./cost_basis_v194.cjs');
const cp=x=>JSON.parse(JSON.stringify(x));
function scenario(){
 let s=E.fresh({humans:2,ais:0,seed:'F-COST-LONG'}),b=B.seed(s,'H1'),n=0;
 const steps=[],start=cp(s);
 function move(type,id='H1',args={}){
  const before=cp(s),out=E.transition(s,{type,companyId:id,requestId:'FIN-'+(++n),...args});
  assert.equal(out.duplicate,false);
  assert.deepEqual(s,before,'Rechenweg darf die Spielengine nicht veraendern');
  E.validate(out.state);
  const oldBook=cp(b);const newer=B.reconcile(s,out.state,b);
  assert.deepEqual(b,oldBook,'keine In-Place-Buchwertmutation');b=newer;
  s=out.state;steps.push({type,month:s.month,phase:s.phase});
  return {state:s,book:b};
 }
 const close=()=>{move('END_TURN');move('END_TURN','H2');};
 const next=()=>move('NEXT_MONTH');
 return {get state(){return s},get book(){return b},start,steps,move,close,next};
}
test('Startbild: Keine unbekannten historischen Anschaffungskosten erfinden',()=>{
 const x=scenario();
 assert.equal(x.book.assets.length,0);
 assert.equal(x.book.releaseGate,'BLOCKED');
 assert.equal(B.report(x.book,x.state).accountingProfitCent,null);
 const v=cp(x.state);v.claims['BERLIN-1'].owner='H1';
 assert.throws(()=>B.seed(v,'H1'),/Vorbestaende/);
});
test('Kostenregel ist versioniert und bleibt trotz korrekt gerechneter Centwerte gesperrt',()=>{
 assert.equal(B.POLICY.status,'DRAFT_NOT_APPROVED');
 assert.equal(B.POLICY.fieldLifeMonths,120);
 assert.equal(B.POLICY.stock.startsWith('regionaler'),true);
 assert.equal(B.POLICY.releaseGate,'BLOCKED');
});
test('Echter Feldkauf: Anschaffungswert statt Sofortverlust, Gutachten laufender Aufwand',()=>{
 const x=scenario(),id='BERLIN-1';
 x.move('SURVEY','H1',{claimId:id});x.move('BUY','H1',{claimId:id});
 const a=B.report(x.book,x.state);
 assert.equal(B.valuation(x.book,x.state).claimBookCent,E.REGIONS.find(r=>r.id==='BERLIN').buy);
 assert.equal(x.book.assets[0].bookCent,E.REGIONS.find(r=>r.id==='BERLIN').buy);
 assert.equal(x.book.expenseCent,E.REGIONS.find(r=>r.id==='BERLIN').survey);
 assert.equal(a.equityCent,E.CFG.startCash-E.REGIONS.find(r=>r.id==='BERLIN').survey);
});
test('Reale Rohölförderung und Raffinierung: Bestand zu Herstellungskosten',()=>{
 const x=scenario(),id='BERLIN-1';
 for(const type of ['SURVEY','BUY','DRILL','PUMP'])x.move(type,'H1',{claimId:id});
 assert.equal(x.book.raw.BERLIN.qty,E.CFG.pumpMilli);
 assert.equal(x.book.raw.BERLIN.cent,E.CFG.pumpCost);
 assert.equal(x.book.costOfSalesCent,0);
 x.move('REFINERY_BUILD','H1',{region:'BERLIN'});
 x.move('REFINE_BATCH','H1',{region:'BERLIN',claimId:id});
 assert.equal(x.book.raw.BERLIN.qty,E.CFG.pumpMilli-globalThis.PPProfi.COSTS.rawBatchMilli);
 assert.equal(x.book.raw.BERLIN.cent,E.CFG.pumpCost-10000);
 assert.equal(x.book.product.BERLIN.qty,globalThis.PPProfi.COSTS.yieldMilli);
 assert.equal(x.book.product.BERLIN.cent,10000+globalThis.PPProfi.COSTS.refineCent);
 assert.equal(x.book.costOfSalesCent,0,'Nur die Verarbeitung erzeugt keinen Verkauf');
});
test('Echte Warenwirtschaft über vier Monate: Rohöl, Raffinerie, Netztransport, zwei Marktverkäufe',()=>{
 const x=scenario(),id='BERLIN-1';
 const a=(type,props)=>x.move(type,'H1',props);
 a('SURVEY',{claimId:id});a('BUY',{claimId:id});a('DRILL',{claimId:id});
 a('PUMP',{claimId:id});a('REFINERY_BUILD',{region:'BERLIN'});
 a('REFINE_BATCH',{region:'BERLIN',claimId:id});a('ROUTE_BUILD',{region:'BERLIN'});
 a('REFINED_SELL',{region:'BERLIN'});a('SHIP',{claimId:id});a('OFFER',{claimId:id});
 x.close();
 assert.equal(x.state.phase,'REPORT');
 assert.equal(x.book.monthsClosed,1);
 assert.equal(x.book.raw.BERLIN.cent,0);
 assert.equal(x.book.product.BERLIN.cent,0);
 assert.equal(x.book.costOfSalesCent,165000,'90.000 Rohölkosten und 75.000 Fertigwarenkosten');
 assert.equal(x.book.revenueCent,7119000);
 const assetsM1=x.book.assets.length;
 x.next();
 a('NETWORK_ENABLE',{region:'BERLIN'});
 for(const kind of ['RAW','PIPE','FINAL'])a('NETWORK_BUILD',{region:'BERLIN',kind,claimId:id});
 assert.equal(x.book.assets.length,assetsM1+3);
 a('PUMP',{claimId:id});
 a('NETWORK_RAW',{region:'BERLIN',claimId:id,qtyMilli:10000});
 assert.equal(B.valuation(x.book,x.state).inTransitBookCent,11400,'Nachgewiesene Rohölzulieferung: Förderkosten plus 14.000-Cent-Anlieferfracht');
 x.close();x.next();
 assert.equal(B.valuation(x.book,x.state).inTransitBookCent,0,'Rohöl am Werk eingetroffen');
 a('NETWORK_REFINE',{region:'BERLIN',claimId:id});
 assert.equal(x.book.product.BERLIN.cent,76400);
 a('NETWORK_PRODUCT',{region:'BERLIN',claimId:id,qtyMilli:9000});
 assert.equal(B.valuation(x.book,x.state).inTransitBookCent,76400);
 x.close();x.next();
 assert.equal(B.valuation(x.book,x.state).inTransitBookCent,0,'Fertigware im Marktdepot eingetroffen');
 assert.equal(x.state.claims[id].burning,true,'Vierter Monat: reales Brandereignis');
 a('FIRE_EXPERT',{claimId:id});
 assert.equal(x.state.claims[id].burning,false,'Reale Brandbekämpfung vor Bewertung');
 a('NETWORK_OFFER',{region:'BERLIN',claimId:id});x.close();
 assert.equal(x.book.monthsClosed,4);
 const report=B.report(x.book,x.state);
 assert.equal(report.status,'MODEL_ONLY_UNAPPROVED');
 assert.equal(report.releaseGate,'BLOCKED');
 assert.equal(report.accountingProfitCent,null);
 assert.equal(report.observedCOGSCent,241400);
 assert.equal(report.observedRevenueCent,7897311);
 assert.equal(report.observedDepreciationCent,444999);
 assert.equal(x.book.raw.BERLIN.cent,102600,'Rohöl-Restbestand einschließlich Anlieferungskosten bleibt Vermögen');
 assert.equal(report.equityCent,26374812-E.COST.fireExpertCost);
 assert.equal(report.observedModelResultCent,6374812-E.COST.fireExpertCost);
 assert.equal(report.equityCent-E.CFG.startCash,
  x.book.revenueCent-x.book.expenseCent-x.book.costOfSalesCent-x.book.depreciationCent,
  'Vermögensänderung stimmt mit Umsatz, Aufwand, Herstellkosten und Abschreibung überein');
 assert.equal(report.assetsCent,report.equityCent);
 assert.equal(x.steps.length,31,'Brandlöschung ist zusätzlicher echter Wirtschaftsübergang');
});
test('Abschreibung beginnt erst im Folgemonat und besitzt keine fiktive Verkaufsgutschrift',()=>{
 const x=scenario(),id='BERLIN-1';
 x.move('SURVEY','H1',{claimId:id});x.move('BUY','H1',{claimId:id});
 const purchase=x.book.assets[0].bookCent;x.close();
 assert.equal(x.book.assets[0].bookCent,purchase);
 x.next();x.close();
 const depreciation=Math.floor(purchase/120);
 assert.equal(x.book.assets[0].depreciatedMonths,1);
 assert.equal(x.book.assets[0].bookCent,purchase-depreciation);
 assert.equal(x.book.depreciationCent,depreciation);
});
test('Unbekannte Kontobuchung oder erklärungsloser Rohölabgang stoppt',()=>{
 const x=scenario(),id='BERLIN-1';
 let y=E.transition(x.state,{type:'SURVEY',companyId:'H1',claimId:id,requestId:'BAD-1'}).state;
 y.companies[0].ledger.at(-1).code='ERFUNDENE_BILANZPOSITION';
 assert.throws(()=>B.reconcile(x.state,y,x.book),/Unbekannte Buchungsart/);
 const unsold=cp(x.state);unsold.claims['BERLIN-1'].owner='H1';unsold.claims['BERLIN-1'].inventoryMilli=10000;
 assert.throws(()=>B.reconcile(x.state,unsold,x.book),/Bestandsabweichung|erkl[aä]erter/);
});
test('Fremder Spielstand, Buchungsänderung, Neustart oder doppelte Buchung werden zurückgewiesen',()=>{
 const x=scenario(),id='BERLIN-1';x.move('SURVEY','H1',{claimId:id});
 const next=E.transition(x.state,{type:'BUY',companyId:'H1',claimId:id,requestId:'BAD-BUY'}).state;
 const falsified=cp(next);falsified.companies[0].ledger[0].deltaCent=-1;
 assert.throws(()=>B.reconcile(x.state,falsified,x.book),/nachtraeglich veraendert/);
 const broken=cp(x.state);broken.companies[0].generation++;
 assert.throws(()=>B.reconcile(x.state,broken,x.book),/Neustart/);
 const duplicateBook=cp(x.book);duplicateBook.ledgerCount=0;
 assert.throws(()=>B.reconcile(x.state,next,duplicateBook),/Rechenkette unterbrochen/);
});
