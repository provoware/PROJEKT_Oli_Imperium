'use strict';
/* Fachlich getrennte Rechnungsbruecke fuer die PPPOPPI-Adaption.
 * Weder C64-Originalregel noch freigegebene Bilanzbewertung.
 * Die Spiellogik und Speicherdateien werden NICHT geaendert.
 */
const FIELDS=Object.freeze([
 'receivablesCent','inventoryBookCent','inTransitBookCent',
 'claimBookCent','refineryBookCent','networkBookCent',
 'prepaymentBookCent','otherAssetsCent','additionalLiabilitiesCent'
]);
function nonnegative(n,label){
 if(!Number.isSafeInteger(n)||n<0)throw Error(label+' muss ein sicherer, nichtnegativer Cent-Ganzzahlwert sein');
 return n;
}
function add(a,b,label){
 const v=a+b;
 if(!Number.isSafeInteger(v))throw Error(label+' Ueberlauf');
 return v;
}
function subtract(a,b,label){
 const v=a-b;
 if(!Number.isSafeInteger(v))throw Error(label+' Ueberlauf');
 return v;
}
function sum(items,label){return items.reduce((n,x)=>add(n,x,label),0)}
function financialFacts(state,companyId){
 if(!state||!Array.isArray(state.companies)||typeof companyId!=='string')throw Error('Spielzustand/Firmenkennung fehlt');
 const f=state.companies.find(x=>x.id===companyId);
 if(!f||!Array.isArray(f.obligations))throw Error('Firma oder Rechnungen fehlen');
 const cash=nonnegative(f.cashCent,'Kasse'),loan=nonnegative(f.debtCent,'Kreditschuld');
 const month=nonnegative(state.month,'Monat'),generation=nonnegative(f.generation,'Generation');
 if(month<1||generation<1)throw Error('Monat/Generation ungueltig');
 let otherBills=0,principalBills=0;
 for(const o of f.obligations){
  if(!o||typeof o.kind!=='string'||!o.kind.trim())throw Error('Rechnungsart fehlt');
  const due=nonnegative(o.dueCent,'Rechnungssoll'),paid=nonnegative(o.paidCent,'Rechnungszahlung');
  if(paid>due)throw Error('Rechnung ueberzahlt');
  const outstanding=due-paid;
  if(o.kind==='TILGUNG')principalBills=add(principalBills,outstanding,'Tilgungsrechnung');
  else otherBills=add(otherBills,outstanding,'Andere Rechnungen');
 }
 if(principalBills>loan)throw Error('Offene Tilgung uebersteigt Kreditschuld');
 const monetaryDebts=add(loan,otherBills,'Bekannte Geldverpflichtungen');
 const claims=Object.values(state.claims||{}).filter(c=>c&&c.owner===companyId);
 let raw=0,ready=0;
 for(const c of claims){
  raw=add(raw,nonnegative(c.inventoryMilli,'Rohbestand'),'Rohbestand');
  ready=add(ready,nonnegative(c.preparedMilli,'Angebotsbestand'),'Angebotsbestand');
 }
 const plants=Object.values(state.refinery?.plants?.[companyId]||{});
 let products=0,plantCount=0;
 for(const p of plants){
  products=add(products,nonnegative(p.productMilli,'Raffinerieware'),'Raffinerieware');
  if(p.built===true)plantCount++;
 }
 return {
  companyId,month,generation,cashCent:cash,loanPrincipalCent:loan,
  unpaidPrincipalIncludedInLoanCent:principalBills,
  unpaidOtherBillsCent:otherBills,knownMonetaryDebtsCent:monetaryDebts,
  netMoneyAfterKnownDebtsCent:subtract(cash,monetaryDebts,'Netto-Geldposition'),
  physicalUnvalued:{claims:claims.length,plants:plantCount,rawMilli:raw,preparedMilli:ready,productMilli:products}
 };
}
function snapshot(state,companyId,valuation){
 const facts=financialFacts(state,companyId);
 const missing=FIELDS.filter(k=>!valuation||!Object.prototype.hasOwnProperty.call(valuation,k));
 const modelId=valuation?.modelId;
 const evidenceRef=valuation?.evidenceRef;
 if(typeof modelId!=='string'||!modelId.trim())missing.push('modelId');
 if(typeof evidenceRef!=='string'||!evidenceRef.trim())missing.push('evidenceRef');
 const basic={...facts,modelId:typeof modelId==='string'?modelId:null,
  complete:missing.length===0,missing,releaseGate:'BLOCKED',
  accountingProfitCent:null,assetsCent:null,liabilitiesCent:null,equityCent:null};
 if(missing.length)return {...basic,status:'VALUATION_MISSING'};
 for(const k of FIELDS)nonnegative(valuation[k],k);
 const assets=sum([
  facts.cashCent,valuation.receivablesCent,valuation.inventoryBookCent,
  valuation.inTransitBookCent,valuation.claimBookCent,valuation.refineryBookCent,
  valuation.networkBookCent,valuation.prepaymentBookCent,valuation.otherAssetsCent
 ],'Aktiva');
 const liabilities=sum([
  facts.loanPrincipalCent,facts.unpaidOtherBillsCent,
  valuation.additionalLiabilitiesCent
 ],'Passiva');
 return {...basic,status:'MODEL_ONLY_UNAPPROVED',assetsCent:assets,
  liabilitiesCent:liabilities,equityCent:subtract(assets,liabilities,'Reinvermoegen'),
  modelId,valuationEvidenceRef:evidenceRef};
}
function period(opening,closing,ownerMovements){
 if(!opening||!closing||!opening.complete||!closing.complete)
  return {status:'BLOCKED_MISSING_VALUATION',modelPeriodResultCent:null,accountingProfitCent:null,releaseGate:'BLOCKED'};
 if(opening.companyId!==closing.companyId||opening.modelId!==closing.modelId)
  throw Error('Firma/Bewertungsregel im Zeitraum gewechselt');
 if(opening.generation!==closing.generation)
  return {status:'BLOCKED_RESTART',modelPeriodResultCent:null,accountingProfitCent:null,releaseGate:'BLOCKED'};
 if(closing.month<opening.month)throw Error('Zeitraum rückwärts');
 if(!ownerMovements||typeof ownerMovements.evidenceRef!=='string'||!ownerMovements.evidenceRef.trim())
  return {status:'BLOCKED_OWNER_MOVEMENTS',modelPeriodResultCent:null,accountingProfitCent:null,releaseGate:'BLOCKED'};
 const paidIn=nonnegative(ownerMovements.contributionsCent,'Eigentuemer-Einlagen');
 const paidOut=nonnegative(ownerMovements.drawingsCent,'Eigentuemer-Entnahmen');
 const delta=subtract(closing.equityCent,opening.equityCent,'Reinvermoegensänderung');
 const result=add(subtract(delta,paidIn,'Einlagenabzug'),paidOut,'Entnahmenzuschlag');
 return {status:'MODEL_ONLY_UNAPPROVED',modelPeriodResultCent:result,
  accountingProfitCent:null,openingEquityCent:opening.equityCent,
  closingEquityCent:closing.equityCent,contributionsCent:paidIn,drawingsCent:paidOut,
  releaseGate:'BLOCKED',warning:'Modellrechnung, kein belegter buchhalterischer Gewinn'};
}
module.exports={FIELDS,financialFacts,snapshot,period};
