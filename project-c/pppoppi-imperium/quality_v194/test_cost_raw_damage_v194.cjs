'use strict';
// PPPOPPI-Forschungsbilanz: echte Brandschaeden mit belegpflichtigem Rohölbestand.
// KEIN historischer C64-Test; Schaetzbelege sind ausschliesslich synthetisch.
const test=require('node:test'),assert=require('node:assert/strict');
for(const n of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193'])
 require('../SPIEL/src/'+n+'.js');
const E=globalThis.OliV082,B=require('./cost_basis_v194.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function campaign(){
 let state=E.fresh({humans:2,ais:0,seed:'RAW-DAMAGE-2026'});
 let book=B.seed(state,'H1'),seq=0;
 function action(type,id='H1',data={}){
  const before=clone(state),saved=clone(book);
  const out=E.transition(state,{type,companyId:id,requestId:'RAW-'+(++seq),...data});
  assert.equal(out.duplicate,false);
  E.validate(out.state);assert.deepEqual(state,before,'Spielkernel bleibt unmutiert');
  const updated=B.reconcile(state,out.state,book);
  assert.deepEqual(book,saved,'keine In-place-Mutation');
  state=out.state;book=updated;
 }
 const close=()=>{action('END_TURN');action('END_TURN','H2')};
 const beginNext=()=>action('NEXT_MONTH');
 const claimId='BERLIN-1';
 action('SURVEY','H1',{claimId});
 action('BUY','H1',{claimId});
 action('DRILL','H1',{claimId});
 action('PUMP','H1',{claimId});
 close();
 for(let month=2;month<=4;month++){beginNext();if(month<4)close();}
 assert.equal(state.month,4);assert.equal(state.claims[claimId].burning,true);
 return {
  claimId,get state(){return state},get book(){return book},
  action,close,beginNext,assess:(data)=>{const prev=clone(book);const next=B.recordRawInventoryValuation(book,state,claimId,data);assert.deepEqual(book,prev);book=next;}
 };
}
const proof=(x,recoverableCent,extras={})=>({
 claimId:x.claimId,month:x.state.month,affectedQtyMilli:x.state.claims[x.claimId].inventoryMilli+x.state.claims[x.claimId].preparedMilli,
 recoverableCent,sourceRef:'DRAFT-SYNTHETIC-OIL-STOCK-VALUATION-CASE',
 method:'Individuell belegter erloesbarer Bestand, kein Automatismus',
 ...extras
});
test('Echter Lagerbrand startet offenes Inventargutachten, trotz unveränderter Rohölmenge',()=>{
 const x=campaign();
 assert.equal(x.state.claims[x.claimId].inventoryMilli,E.CFG.pumpMilli);
 assert.equal(x.book.raw.BERLIN.qty,E.CFG.pumpMilli);
 assert.equal(x.book.rawDamagePending[x.claimId].resolved,false);
 assert.equal(x.book.rawStockImpairmentCent,0);
 assert.throws(()=>B.report(x.book,x.state),/LAGERWERTMINDERUNG_OFFEN/);
});
test('Reale Brandlöschung darf unbewertete Lagerware nicht nachträglich freigeben',()=>{
 const x=campaign();
 x.action('FIRE_EXPERT','H1',{claimId:x.claimId});
 assert.equal(x.state.claims[x.claimId].burning,false);
 assert.throws(()=>B.report(x.book,x.state),/LAGERWERTMINDERUNG_OFFEN/);
 assert.throws(()=>x.action('SHIP','H1',{claimId:x.claimId}),/LAGERWERTMINDERUNG_OFFEN/);
});
test('Einzelbeleg: tatsächliche Rohölmenge bleibt gleich, reduzierter Kostenwert senkt Reinvermögen',()=>{
 const x=campaign(),old=x.book.raw.BERLIN.cent;
 const recoverable=60000;
 x.assess(proof(x,recoverable));
 assert.equal(x.book.raw.BERLIN.qty,E.CFG.pumpMilli,'kein unbelegter physischer Schwund');
 assert.equal(x.book.raw.BERLIN.cent,recoverable);
 assert.equal(x.book.rawStockImpairmentCent,old-recoverable);
 assert.equal(x.book.rawDamagePending[x.claimId].resolved,true);
 assert.equal(x.book.rawDamageReviews.length,1);
 assert.throws(()=>B.report(x.book,x.state),/WERTMINDERUNG_OFFEN/,'Anlagenwert braucht getrennten Beleg');
 x.action('FIRE_EXPERT','H1',{claimId:x.claimId});
 const result=B.report(x.book,x.state);
 assert.equal(result.observedRawInventoryImpairmentCent,old-recoverable);
 assert.equal(result.observedModelResultCent,
  x.book.revenueCent-x.book.expenseCent-x.book.costOfSalesCent-x.book.depreciationCent-x.book.impairmentCent-x.book.rawStockImpairmentCent);
 assert.equal(result.accountingProfitCent,null);
 assert.equal(result.releaseGate,'BLOCKED');
});
test('Belegte Null-Minderung ist zulässig, aber nicht ohne nachprüfbare Dokumentation',()=>{
 const x=campaign(),old=x.book.raw.BERLIN.cent;
 x.assess(proof(x,old));
 assert.equal(x.book.rawStockImpairmentCent,0);
 x.action('FIRE_EXPERT','H1',{claimId:x.claimId});
 assert.equal(B.report(x.book,x.state).releaseGate,'BLOCKED');
});
test('Rohöl-Lager kann nur einmal für denselben Schadensfall abgewertet werden',()=>{
 const x=campaign();
 x.assess(proof(x,50000));
 assert.throws(()=>B.recordRawInventoryValuation(x.book,x.state,x.claimId,proof(x,0)),/bereits bewertet/);
 assert.equal(x.book.rawStockImpairmentCent,50000);
});
test('Fehlende Quellenangabe, falsche Menge, falscher Monat oder Werterhöhung werden abgelehnt',()=>{
 const x=campaign(),base=proof(x,50000);
 for(const bad of [
  {...base,sourceRef:''},{...base,method:'zu kurz'},
  {...base,claimId:'BERLIN-2'},{...base,month:3},
  {...base,affectedQtyMilli:base.affectedQtyMilli-1},
  {...base,recoverableCent:-1},{...base,recoverableCent:Number.MAX_SAFE_INTEGER+1},
  {...base,recoverableCent:100001}
 ])assert.throws(()=>B.recordRawInventoryValuation(x.book,x.state,x.claimId,bad));
 assert.equal(x.book.rawStockImpairmentCent,0);
});
test('Bewertung muss an aktuellen Spielstand gebunden sein und darf nach Warenabgang nicht rückdatiert werden',()=>{
 const x=campaign();
 const stale=clone(x.state);
 stale.companies[0].cashCent+=1;
 assert.throws(()=>B.recordRawInventoryValuation(x.book,stale,x.claimId,proof(x,50000)),/Buchungsstand/);
 x.action('END_TURN');
 const bad=proof(x,50000,{month:3});
 assert.throws(()=>B.recordRawInventoryValuation(x.book,x.state,x.claimId,bad),/Einzelbeleg/);
});
test('Vollständig geschädigtes Rohöl darf nur ausdrücklich auf Null gesetzt werden',()=>{
 const x=campaign();
 x.assess(proof(x,0));
 assert.equal(x.book.raw.BERLIN.cent,0);
 assert.equal(x.book.raw.BERLIN.qty,E.CFG.pumpMilli,'keine automatische Vernichtung der Ware');
 x.action('FIRE_EXPERT','H1',{claimId:x.claimId});
 const report=B.report(x.book,x.state);
 assert.equal(report.observedRawInventoryImpairmentCent,100000);
 assert.equal(report.accountingProfitCent,null);
});
test('Nicht zuordenbare Rohöl-Charge eines anderen Claims wird nicht anhand regionaler Durchschnittswerte fingiert',()=>{
 const x=campaign(),fake=clone(x.book);
 fake.raw.BERLIN.qty+=1000;fake.raw.BERLIN.cent+=1000;
 assert.throws(()=>B.recordRawInventoryValuation(fake,x.state,x.claimId,proof(x,50000)),/Bestandsabweichung/);
});
