'use strict';
// Isolierte Forschungsbilanz: nur echte Brandereignisse, nie erfundene Restwerte.
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193'])
 require('../SPIEL/src/'+f+'.js');
const E=globalThis.OliV082,B=require('./cost_basis_v194.cjs');
const cp=x=>JSON.parse(JSON.stringify(x));
function run(seed='IMPAIRMENT-2026'){
 let state=E.fresh({humans:2,ais:0,seed}),book=B.seed(state,'H1'),n=0;
 function move(type,id='H1',extra={}){
  const previous=cp(state),before=cp(book);
  const result=E.transition(state,{type,companyId:id,requestId:'IMP-'+(++n),...extra});
  assert.equal(result.duplicate,false);assert.deepEqual(state,previous);
  E.validate(result.state);
  const updated=B.reconcile(state,result.state,book);assert.deepEqual(book,before);
  state=result.state;book=updated;
 }
 const close=()=>{move('END_TURN');move('END_TURN','H2')};
 const next=()=>move('NEXT_MONTH');
 function damaged(){
  const claimId='BERLIN-1';
  move('SURVEY','H1',{claimId});move('BUY','H1',{claimId});
  move('DRILL','H1',{claimId});close();
  for(let n=2;n<=4;n++){next();if(n<4)close();}
  assert.equal(state.month,4);
  assert.equal(state.claims[claimId].burning,true,'echt erzeugtes periodisches Brandereignis');
  return claimId;
 }
 return {get state(){return state},get book(){return book},move,close,next,damaged,
   assess:(claimId,data)=>{const original=cp(book);book=B.recordDamageValuation(book,state,claimId,data);assert.deepEqual(original,original);return book;}};
}
const evidence=(claimId,month,recoverableCent,extra={})=>({
 claimId,month,recoverableCent,
 sourceRef:'SCENARIO-REPAIR-QUOTE-NOT-EXTERNAL-VERIFIED',
 method:'Ersatzkosten minus ausdrücklich geschätzter Reparaturbedarf',...extra
});
test('Echter Brand sperrt Bilanz trotz technisch vorhandener Buchwerte',()=>{
 const x=run(),id=x.damaged();
 assert.equal(x.book.impairmentCent,0);
 assert.throws(()=>B.report(x.book,x.state),/WERTMINDERUNG_OFFEN/);
 assert.equal(x.book.releaseGate,'BLOCKED');
});
test('Einzelner belegter Schätzwert mindert sofort das Modellreinvermögen, kein Gewinn wird freigegeben',()=>{
 const x=run(),id=x.damaged(),old=cp(x.book);
 const group=old.assets.filter(a=>a.ref===id),before=group.reduce((n,a)=>n+a.bookCent,0);
 const recoverable=3000000,loss=before-recoverable;
 x.assess(id,evidence(id,4,recoverable));
 assert.equal(old.impairmentCent,0,'ursprüngliche Buchwerte unverändert');
 assert.equal(x.book.impairmentCent,loss);
 assert.equal(x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0),recoverable);
 const report=B.report(x.book,x.state);
 assert.equal(report.observedImpairmentCent,loss);
 assert.equal(report.accountingProfitCent,null);
 assert.equal(report.releaseGate,'BLOCKED');
 assert.equal(report.damageAssessment,'UNVERIFIED_DRAFT_ESTIMATE');
 assert.equal(report.equityCent-E.CFG.startCash,
  x.book.revenueCent-x.book.expenseCent-x.book.costOfSalesCent-x.book.depreciationCent-x.book.impairmentCent);
});
test('Nach realer Brandlöschung darf der geminderte Wert nicht ungefragt wieder ansteigen',()=>{
 const x=run(),id=x.damaged();
 x.assess(id,evidence(id,4,2700000));
 const carrying=x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0);
 x.move('FIRE_EXPERT','H1',{claimId:id});
 assert.equal(x.state.claims[id].burning,false);
 assert.equal(x.book.impairmentCent>0,true);
 assert.equal(x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0),carrying);
 assert.equal(B.report(x.book,x.state).releaseGate,'BLOCKED');
 x.close();x.next();x.close();
 const remaining=x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0);
 assert.ok(remaining<carrying,'Folgemonatsabschreibung auf verbliebenen Wert');
 assert.ok(remaining>=0,'keine Überabschreibung');
 assert.equal(B.report(x.book,x.state).accountingProfitCent,null);
});
test('Unbelegte, falsche und positive Zuschreibungsannahmen werden abgelehnt',()=>{
 const x=run(),id=x.damaged();
 const base=evidence(id,4,3000000);
 for(const bad of [
  {...base,sourceRef:''},{...base,method:''},{...base,month:3},
  {...base,claimId:'BERLIN-2'},{...base,recoverableCent:-1},
  {...base,recoverableCent:Number.MAX_SAFE_INTEGER+1}
 ])assert.throws(()=>B.recordDamageValuation(x.book,x.state,id,bad));
 const before=x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0);
 assert.throws(()=>B.recordDamageValuation(x.book,x.state,id,evidence(id,4,before+1)),/Zuschreibung/);
 assert.equal(x.book.impairmentCent,0);
});
test('Nullwert nur explizit und dokumentiert; nicht durch Heuristik/Prozentannahme',()=>{
 const x=run(),id=x.damaged();
 x.assess(id,evidence(id,4,0));
 assert.equal(x.book.assets.filter(a=>a.ref===id).reduce((n,a)=>n+a.bookCent,0),0);
 assert.ok(x.book.impairmentCent>0);
 assert.equal(B.report(x.book,x.state).accountingProfitCent,null);
});
test('Bewertungsbeleg wird nach neuer Spielaktion im selben Monat ungültig',()=>{
 const x=run(),id=x.damaged();x.assess(id,evidence(id,4,3000000));
 x.move('END_TURN');
 assert.throws(()=>B.report(x.book,x.state),/WERTMINDERUNG_OFFEN/);
 x.assess(id,evidence(id,4,2800000,{sourceRef:'CURRENT-BRAND-ESTIMATE-AFTER-ACTION'}));
 assert.equal(B.report(x.book,x.state).releaseGate,'BLOCKED');
});
test('Fremde Firmenanlage oder gesunde Anlage dürfen nicht ohne Schaden abgewertet werden',()=>{
 const x=run(),id='BERLIN-1';
 assert.throws(()=>B.recordDamageValuation(x.book,x.state,id,evidence(id,1,0)),/beschädigte eigene Anlage/);
 const v=cp(x.state);v.claims[id].owner='H2';v.claims[id].drilled=true;v.claims[id].damaged=true;
 assert.throws(()=>B.recordDamageValuation(x.book,v,id,evidence(id,1,0)),/beschädigte eigene Anlage/);
});
test('Bereits vollständig geminderter Buchwert bleibt auch über Folgemonate Null',()=>{
 const x=run(),id=x.damaged();x.assess(id,evidence(id,4,0));x.move('FIRE_EXPERT','H1',{claimId:id});
 x.close();for(let n=0;n<3;n++){x.next();x.close();}
 const group=x.book.assets.filter(a=>a.ref===id);
 assert.ok(group.every(a=>a.bookCent===0));
 assert.equal(B.report(x.book,x.state).observedImpairmentCent,x.book.impairmentCent);
});
