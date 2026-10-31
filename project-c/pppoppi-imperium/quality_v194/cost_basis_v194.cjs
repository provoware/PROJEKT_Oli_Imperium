'use strict';
// Versioniertes Forschungsmodell der eigenstaendigen PPPOPPI-Adaption.
// Keine historische C64-Regel, keine Freigabe und kein Eingriff in den Spielkern.
const A=require('./accounting_model_v194.cjs');
function engineSpecs(){const e=globalThis.OliV082?.CFG,p=globalThis.PPProfi?.COSTS;
 if(!e||!p||!Number.isSafeInteger(e.pumpMilli)||e.pumpMilli<=0||!Number.isSafeInteger(p.rawBatchMilli)||p.rawBatchMilli<=0||!Number.isSafeInteger(p.yieldMilli)||p.yieldMilli<=0)
  throw Error('Verbindliche Spielkernel-Mengenvorgaben fehlen');
 return {pumpMilli:e.pumpMilli,rawBatchMilli:p.rawBatchMilli,yieldMilli:p.yieldMilli};
}
const POLICY=Object.freeze({
 id:'PPPOPPI-ADAPT/FIN-COST/1-DRAFT',status:'DRAFT_NOT_APPROVED',
 fieldLifeMonths:120,drillLifeMonths:120,tankLifeMonths:60,
 refineryLifeMonths:120,routeLifeMonths:60,networkLifeMonths:60,
 depreciation:'linear, cent-genau, ab Folgemonat, Restcent im Schlussmonat',
 production:'tatsaechliche FOERDERUNG-Auszahlung als Rohölkosten',
 manufacturing:'10 Barrel Rohöl plus reale Verarbeitungszahlung werden 9 Barrel Fertigware',
 stock:'regionaler gewichteter Durchschnitt; nur Herstellkosten, nie Marktpreis',
 transport:'eigene Frachten als Periodenaufwand; Warenbestand bleibt Eigentum',
 trade:'Erlös erst beim tatsächlichen gutgeschriebenen Marktabschluss',
 receivables:'ohne nachgewiesene offene Lieferung keine Forderung ansetzen',
 purchase:'Kauf/Bohrung/Bau zum ausgewiesenen Anschaffungswert, Gutachten als Aufwand',
 capital:'Eigentümer-Einlagen/Entnahmen nur gegen gesonderten Beleg',
 releaseGate:'BLOCKED'
});
const cap=new Set(['FELDKAUF','FACHBOHRUNG','TANKAUSBAU','RAFFINERIE_BAU','VERTRIEBSROUTE','STRECKENBAU']);
const cost=new Set(['GUTACHTEN','TRANSPORT','FRACHT','REPARATUR','BRANDBEKÄMPFUNG_PROFI','TRANSPORT_REPARATUR','ZAHLUNG_PERSONAL','ZAHLUNG_WARTUNG','ZAHLUNG_ZINS']);
const sale=new Set(['MARKTERLÖS','RAFFINIERT_MONATSVERKAUF','AUSSENMARKT']);
const financingIn=new Set(['RETTUNGSKREDIT','KI_RETTUNGSKREDIT']);
const financingOut=new Set(['ZAHLUNG_TILGUNG']);
const zero=new Set(['PIPELINE_GUTSCHRIFT']); // Gutschrift ist kein Verkauf
const volume=x=>{if(!Number.isSafeInteger(x)||x<0)throw Error('Ungueltige nichtnegative Menge');return x};
const cents=x=>{if(!Number.isSafeInteger(x)||x<0)throw Error('Ungueltiger nichtnegativer Cent-Wert');return x};
function safe(v){if(!Number.isSafeInteger(v))throw Error('Zahlenueberlauf');return v}
function plus(a,b){return safe(a+b)}
function sub(a,b){return safe(a-b)}
function proportion(value,n,d){
 cents(value);volume(n);volume(d);if(!d||n>d)throw Error('Ungueltige Kostenquote');
 const ans=BigInt(value)*BigInt(n)/BigInt(d);
 if(ans>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Zahlenueberlauf');
 return Number(ans);
}
function bookTotals(s,id){
 const regions=Object.fromEntries(Object.keys(s.prices||{}).map(r=>[r,{raw:0,product:0,transitRaw:0,transitProduct:0}]));
 const add=(region,kind,qty)=>{if(!regions[region])throw Error('Unbekannte Region');regions[region][kind]=plus(regions[region][kind],volume(qty));};
 for(const x of Object.values(s.claims||{}))if(x.owner===id){
  add(x.region,'raw',plus(volume(x.inventoryMilli),volume(x.preparedMilli)));
 }
 for(const [r,p] of Object.entries(s.refinery?.plants?.[id]||{}))add(r,'product',p.productMilli);
 for(const x of s.refinery?.offers||[])if(x.companyId===id)add(x.region,'product',x.qtyMilli);
 for(const x of s.transport?.shipments||[])if(x.companyId===id){
  const k=x.type==='RAW'?'raw':x.type==='PRODUCT'?'product':null;
  if(!k)throw Error('Unbekannter Transporttyp');
  add(x.region,k,x.qtyMilli);
  add(x.region,k==='raw'?'transitRaw':'transitProduct',x.qtyMilli);
 }
 for(const [r,g] of Object.entries(s.transport?.firms?.[id]||{})){
  add(r,'raw',g.rawMilli);add(r,'product',g.marketMilli);
 }
 for(const x of s.publicNetwork?.queued||[])if(x.companyId===id)add(x.from,'product',x.qtyMilli);
 for(const x of s.publicNetwork?.inTransit||[])if(x.companyId===id){
  add(x.to,'product',x.qtyMilli);
  add(x.to,'transitProduct',x.qtyMilli);
 }
 for(const x of s.publicNetwork?.offers||[])if(x.companyId===id)add(x.to,'product',x.qtyMilli);
 for(const [r,q] of Object.entries(s.publicNetwork?.received?.[id]||{}))add(r,'product',q);
 return regions;
}
function assertPools(b,actual){
 for(const r of Object.keys(actual)){
  if(!b.raw[r])b.raw[r]={qty:0,cent:0};
  if(!b.product[r])b.product[r]={qty:0,cent:0};
  if(b.raw[r].qty!==actual[r].raw||b.product[r].qty!==actual[r].product)
   throw Error('Bestandsabweichung '+r+': beobachtete Warenmengen nicht durch Buchungen erklaert');
 }
 if(Object.keys(b.raw).some(r=>!actual[r]))throw Error('Region fehlt');
}
function seed(s,id){
 if(s.month!==1||s.phase!=='TURN')throw Error('Anfangsbestand muss vor Monat 1 sein');
 const f=s.companies?.find(x=>x.id===id);
 if(!f||f.ledger?.length!==0||f.debtCent!==0||f.obligations?.length!==0)
  throw Error('Anfangsregister nicht leer; keine unbekannten Buchwerte erfinden');
 const quantities=bookTotals(s,id);
 if(Object.values(quantities).some(q=>q.raw||q.product)||
  Object.values(s.claims||{}).some(x=>x.owner===id))
  throw Error('Vorbestaende erfordern historischen Kostennachweis');
 const raw={},product={};
 for(const r of Object.keys(quantities)){raw[r]={qty:0,cent:0};product[r]={qty:0,cent:0};}
 return {modelId:POLICY.id,companyId:id,generation:f.generation,
  month:s.month,phase:s.phase,cashCent:cents(f.cashCent),debtCent:0,
  ledgerCount:0,ledgerLastId:null,raw,product,assets:[],openingEquityCent:cents(f.cashCent),
  revenueCent:0,expenseCent:0,costOfSalesCent:0,depreciationCent:0,
  observedSteps:0,monthsClosed:0,releaseGate:'BLOCKED'};
}
function classifyAsset(code,entry,month){
 const kind=code==='FELDKAUF'?'field':code==='FACHBOHRUNG'?'drill':
  code==='TANKAUSBAU'?'tank':code==='RAFFINERIE_BAU'?'refinery':
  code==='VERTRIEBSROUTE'?'route':'network';
 const months=POLICY[kind==='field'?'fieldLifeMonths':
  kind==='drill'?'drillLifeMonths':kind==='tank'?'tankLifeMonths':
  kind==='refinery'?'refineryLifeMonths':kind==='route'?'routeLifeMonths':'networkLifeMonths'];
 if(typeof entry.info!=='string'||!entry.info.trim())throw Error('Anlage ohne eindeutigen Buchungsbeleg');
 return {id:entry.id,kind,ref:entry.info,costCent:cents(-entry.deltaCent),
  bookCent:cents(-entry.deltaCent),createdMonth:month,
  firstDepreciationMonth:month+1,lifeMonths:months,depreciatedMonths:0};
}
function take(pool,qty){
 volume(qty);if(qty>pool.qty)throw Error('Bestandsmenge ueberschritten');
 const c=proportion(pool.cent,qty,pool.qty);
 pool.qty-=qty;pool.cent-=c;
 return c;
}
function reconcile(previous,current,original){
 const b=JSON.parse(JSON.stringify(original)),id=b.companyId;
 if(b.modelId!==POLICY.id)throw Error('Unbekannte Bewertungsregel');
 const before=previous.companies?.find(f=>f.id===id),after=current.companies?.find(f=>f.id===id);
 if(!before||!after||before.generation!==after.generation||before.generation!==b.generation)
  throw Error('Neustart oder Firma unbekannt');
 if(b.cashCent!==before.cashCent||b.debtCent!==before.debtCent||
  b.month!==previous.month||b.phase!==previous.phase||b.ledgerCount!==before.ledger.length||
  (b.ledgerLastId!==null&&before.ledger.at(-1)?.id!==b.ledgerLastId))
  throw Error('Rechenkette unterbrochen');
 const prior=bookTotals(previous,id);
 assertPools(b,prior);
 if(!Array.isArray(after.ledger)||after.ledger.length<before.ledger.length)
  throw Error('Buchungsregister geschrumpft');
 for(let k=0;k<before.ledger.length;k++)
  if(JSON.stringify(before.ledger[k])!==JSON.stringify(after.ledger[k]))
   throw Error('Buchungsregister nachtraeglich veraendert');
 const newly=after.ledger.slice(before.ledger.length);
 let cashDelta=0;const pump={},refine={},rawSales={},productSales={};
 let loanReceipts=0,loanPayments=0;
 for(const r of Object.keys(prior)){pump[r]=0;refine[r]=0;rawSales[r]=0;productSales[r]=0;}
 for(const x of newly){
  if(!Number.isSafeInteger(x.deltaCent)||typeof x.code!=='string')
   throw Error('Ungueltige Buchung');
  cashDelta=plus(cashDelta,x.deltaCent);
  if(cap.has(x.code)){
   if(x.deltaCent>=0)throw Error('Investition ohne Aufwand');
   b.assets.push(classifyAsset(x.code,x,current.month));
  }else if(x.code==='FOERDERUNG'){
   if(x.deltaCent>=0)throw Error('Foerderung ohne Ausgabebetrag');
   const region=current.claims?.[x.info]?.region;
   if(!region||pump[region]===undefined)throw Error('Foerderung ohne konkrete Claim-Region');
   b.raw[region].qty=plus(b.raw[region].qty,engineSpecs().pumpMilli);
   b.raw[region].cent=plus(b.raw[region].cent,-x.deltaCent);
   pump[region]=plus(pump[region],engineSpecs().pumpMilli);
  }else if(x.code==='RAFFINERIE_VERARBEITUNG'){
   if(x.deltaCent>=0)throw Error('Raffinierung ohne Aufwand');
   const region=current.claims?.[x.info]?.region;
   if(!region||refine[region]===undefined)throw Error('Verarbeitung ohne konkreten Claim');
   const {rawBatchMilli:q,yieldMilli:output}=engineSpecs();
   const transfer=take(b.raw[region],q);
   b.product[region].qty=plus(b.product[region].qty,output);
   b.product[region].cent=plus(b.product[region].cent,plus(transfer,-x.deltaCent));
   refine[region]=plus(refine[region],q);
  }else if(financingIn.has(x.code)){
   if(x.deltaCent<=0)throw Error('Kredit ohne Zufluss');
   loanReceipts=plus(loanReceipts,x.deltaCent);
  }else if(financingOut.has(x.code)){
   if(x.deltaCent>=0)throw Error('Tilgung ohne Abfluss');
   loanPayments=plus(loanPayments,-x.deltaCent);
  }else if(cost.has(x.code)){
   if(x.deltaCent>0)throw Error('Aufwand mit positivem Vorzeichen');
   b.expenseCent=plus(b.expenseCent,-x.deltaCent);
  }else if(sale.has(x.code)){
   if(x.deltaCent<0)throw Error('Umsatz mit negativem Vorzeichen');
   b.revenueCent=plus(b.revenueCent,x.deltaCent);
  }else if(zero.has(x.code)){
   if(x.deltaCent<0)throw Error('Gutschrift negativ');
   b.expenseCent=sub(b.expenseCent,x.deltaCent);
  }else{
   throw Error('Unbekannte Buchungsart '+x.code+'; keine stille Bilanzierung');
  }
 }
 if(sub(after.cashCent,before.cashCent)!==cashDelta)
  throw Error('Bargeld nicht mit Einzelbuchungen abstimmbar');
 if(sub(after.debtCent,before.debtCent)!==sub(loanReceipts,loanPayments))
  throw Error('Darlehenshauptschuld nicht mit Kredit- und Tilgungsbuchungen abstimmbar');
 const priorBills=A.financialFacts(previous,id).unpaidOtherBillsCent;
 const closingBills=A.financialFacts(current,id).unpaidOtherBillsCent;
 // Periodenabgrenzung: offene Lohn-/Zinsrechnungen sind Aufwand auch ohne Zahlung.
 b.expenseCent=plus(b.expenseCent,sub(closingBills,priorBills));
 // Verkaufsberichte werden nur bei echtem Monatsabschluss einmal ausgewertet.
 const closing=previous.phase!=='REPORT'&&current.phase==='REPORT'&&current.month===previous.month;
 const nextTotals=bookTotals(current,id);
 for(const r of Object.keys(prior)){
  let soldRaw=0,soldProduct=0;
  if(closing){
   for(const claim of Object.values(previous.claims||{}))if(claim.owner===id&&claim.region===r){
    soldRaw=plus(soldRaw,current.lastReport?.allocations?.[r]?.[claim.id]||0);
   }
   soldProduct=plus(
    current.lastReport?.refinery?.regions?.[r]?.allocations?.[id]?.soldMilli||0,
    current.lastReport?.publicNetwork?.productMarket?.[r]?.allocations?.[id]?.soldMilli||0
   );
  }
  volume(soldRaw);volume(soldProduct);
  if(soldRaw){
   const c=take(b.raw[r],soldRaw);b.costOfSalesCent=plus(b.costOfSalesCent,c);
  }
  if(soldProduct){
   const c=take(b.product[r],soldProduct);b.costOfSalesCent=plus(b.costOfSalesCent,c);
  }
  if(b.raw[r].qty!==nextTotals[r].raw||b.product[r].qty!==nextTotals[r].product)
   throw Error('Nicht erklaerter Lager-/Transport-/Verkaufsabgang '+r);
 }
 if(closing){
  for(const asset of b.assets)if(current.month>=asset.firstDepreciationMonth&&asset.depreciatedMonths<asset.lifeMonths){
   const prev=proportion(asset.costCent,asset.depreciatedMonths,asset.lifeMonths);
   const next=proportion(asset.costCent,asset.depreciatedMonths+1,asset.lifeMonths);
   const charge=sub(next,prev);
   asset.bookCent=sub(asset.bookCent,charge);
   asset.depreciatedMonths++;
   b.depreciationCent=plus(b.depreciationCent,charge);
  }
  b.monthsClosed++;
 }
 b.month=current.month;b.phase=current.phase;b.cashCent=after.cashCent;b.debtCent=after.debtCent;
 b.ledgerCount=after.ledger.length;b.ledgerLastId=after.ledger.at(-1)?.id||null;b.observedSteps++;
 return b;
}
function valuation(b,s){
 const qty=bookTotals(s,b.companyId);
 assertPools(b,qty);
 let field=0,refinery=0,network=0,stock=0,transit=0;
 for(const a of b.assets){
  if(a.kind==='field'||a.kind==='drill'||a.kind==='tank')field=plus(field,a.bookCent);
  else if(a.kind==='refinery')refinery=plus(refinery,a.bookCent);
  else network=plus(network,a.bookCent);
 }
 for(const [r,q] of Object.entries(qty)){
  const totalRaw=b.raw[r],totalProduct=b.product[r];
  const rawTransit=proportion(totalRaw.cent,q.transitRaw,totalRaw.qty||1);
  const productTransit=proportion(totalProduct.cent,q.transitProduct,totalProduct.qty||1);
  transit=plus(transit,plus(rawTransit,productTransit));
  stock=plus(stock,plus(sub(totalRaw.cent,rawTransit),sub(totalProduct.cent,productTransit)));
 }
 return {
  modelId:POLICY.id,evidenceRef:'ENGINE-OBSERVED-LEDGER-AND-QUANTITIES; POLICY-NOT-APPROVED',
  receivablesCent:0,inventoryBookCent:stock,inTransitBookCent:transit,
  claimBookCent:field,refineryBookCent:refinery,networkBookCent:network,
  prepaymentBookCent:0,otherAssetsCent:0,additionalLiabilitiesCent:0
 };
}
function report(b,state){
 if(b.month!==state.month||b.phase!==state.phase||b.cashCent!==state.companies.find(f=>f.id===b.companyId)?.cashCent)
  throw Error('Buchstand und Spielstand differieren');
 const v=valuation(b,state);
 const computed=A.snapshot(state,b.companyId,v);
 const netResult=sub(computed.equityCent,b.openingEquityCent);
 const recognizedResult=sub(sub(sub(b.revenueCent,b.expenseCent),b.costOfSalesCent),b.depreciationCent);
 if(netResult!==recognizedResult)throw Error('Bilanzgleichung/Erfolgsrechnung nicht abstimmbar');
 return {...computed,policy:POLICY.id,observedModelResultCent:netResult,accountingProfitCent:null,
  observedRevenueCent:b.revenueCent,observedOperatingOutflowsCent:b.expenseCent,
  observedProductionCostCent:Object.values(b.raw).reduce((n,x)=>plus(n,x.cent),0),
  observedCOGSCent:b.costOfSalesCent,observedDepreciationCent:b.depreciationCent,
  periodsClosed:b.monthsClosed,releaseGate:'BLOCKED',status:'MODEL_ONLY_UNAPPROVED'};
}
module.exports={POLICY,bookTotals,seed,reconcile,valuation,report};
