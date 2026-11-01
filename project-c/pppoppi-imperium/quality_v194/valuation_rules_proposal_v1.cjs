'use strict';
// PPPOPPI-Adaptation proposal: independent valuation oracles, NOT C64 evidence.
// Does not mutate game state, financial ledger, or any original source.
const MODEL='pppoppi-valuation-proposal/1';
const DURATION=Object.freeze({FACHBOHRUNG:60,RAFFINERIE_BAU:120,VERTRIEBSROUTE:60});
const max=BigInt(Number.MAX_SAFE_INTEGER);
function integer(n,label,{positive=false}={}) {
  if(!Number.isSafeInteger(n)||n<0||(positive&&n===0))throw Error('Ungueltig '+label);
  return BigInt(n);
}
function safe(n,label) {
  if(n>max||n< -max)throw Error('Ueberlauf '+label);
  return Number(n);
}
function add(a,b,label){return safe(BigInt(a)+BigInt(b),label);}
function depreciate({costCent,assetType,ageMonths}){
  const cost=integer(costCent,'Anschaffungskosten');
  const age=integer(ageMonths,'Anlagenalter');
  const lifetime=DURATION[assetType];
  if(!lifetime)throw Error('Unbekannte Anlagenart');
  const capped=age>BigInt(lifetime)?BigInt(lifetime):age;
  // Floor accumulated depreciation, so the final month absorbs all remainder cents.
  const accumulated=cost*capped/BigInt(lifetime);
  const previous=age>BigInt(lifetime)?accumulated:cost*(capped>0n?capped-1n:0n)/BigInt(lifetime);
  return {model:MODEL,assetType,lifetimeMonths:lifetime,
    accumulatedDepreciationCent:safe(accumulated,'Abschreibung'),
    currentMonthDepreciationCent:safe(accumulated-previous,'Monatsabschreibung'),
    bookValueCent:safe(cost-accumulated,'Anlagenbuchwert'),
    ruleStatus:'DRAFT_ONLY'};
}
function inventory(events){
  if(!Array.isArray(events))throw Error('Lagerereignisse fehlen');
  if(events.length>10000)throw Error('Zu viele Lagerereignisse');
  let quantity=0n,cost=0n,consumed=0n;const seen=new Set();
  let stockUnpriced=false,consumedUnpriced=false;
  for(const event of events){
    if(!event||typeof event.id!=='string'||!event.id.trim()||seen.has(event.id))
      throw Error('Fehlende oder doppelte Ereigniskennung');
    seen.add(event.id);
    const qty=integer(event.qtyMilli,'Lagermenge',{positive:true});
    if(event.type==='receive'){
      if(event.costCent===null||event.costCent===undefined)stockUnpriced=true;
      else integer(event.costCent,'Lagerkosten');
      quantity+=qty;
      if(!stockUnpriced)cost+=BigInt(event.costCent);
    }else if(event.type==='consume'){
      if(qty>quantity)throw Error('Lagerueberziehung');
      if(stockUnpriced)consumedUnpriced=true;
      if(!stockUnpriced){
        const costUsed=qty===quantity?cost:(cost*qty+quantity/2n)/quantity;
        cost-=costUsed;consumed+=costUsed;
      }
      quantity-=qty;
      if(quantity===0n){stockUnpriced=false;cost=0n;}
    }else throw Error('Unbekannter Lagervorgang');
    if(quantity>max||cost>max||consumed>max)throw Error('Ueberlauf Lager');
  }
  return {model:MODEL,valuationStatus:(stockUnpriced||consumedUnpriced)?'UNPRICED':'VALUED_FROM_EXPLICIT_COSTS',
    stockMilli:safe(quantity,'Bestand'),
    stockCostCent:stockUnpriced?null:safe(cost,'Bestandskosten'),
    consumedCostCent:consumedUnpriced?null:safe(consumed,'Verbrauchskosten'),
    ruleStatus:'DRAFT_ONLY'};
}
function receivables(events){
  if(!Array.isArray(events)||events.length>10000)throw Error('Vertragsereignisse ungueltig');
  const seen=new Set(),contracts=new Map();
  let revenue=0n,paid=0n,notes=0n,badDebt=0n;
  for(const event of events){
    if(!event||typeof event.id!=='string'||!event.id.trim()||seen.has(event.id))
      throw Error('Fehlende oder doppelte Ereigniskennung');
    seen.add(event.id);
    if(typeof event.contractId!=='string'||!event.contractId.trim())
      throw Error('Vertragskennung fehlt');
    if(event.type==='contract'){
      const maxQty=integer(event.qtyMilli,'Vertragsmenge',{positive:true});
      if(contracts.has(event.contractId))throw Error('Vertrag doppelt');
      contracts.set(event.contractId,{maxQty,delivered:0n,outstanding:0n});
      continue;
    }
    const contract=contracts.get(event.contractId);
    if(!contract)throw Error('Nicht bestaetigter Vertrag');
    if(event.type==='accept'){
      const qty=integer(event.qtyMilli,'Abnahmemenge',{positive:true});
      const price=integer(event.amountCent,'Abnahmebetrag',{positive:true});
      if(contract.delivered+qty>contract.maxQty)throw Error('Vertragsmenge ueberschritten');
      contract.delivered+=qty;contract.outstanding+=price;revenue+=price;
    }else if(['payment','credit_note','writeoff'].includes(event.type)){
      const amount=integer(event.amountCent,'Ausgleichsbetrag',{positive:true});
      if(amount>contract.outstanding)throw Error('Ausgleich ueber offener Forderung');
      contract.outstanding-=amount;
      if(event.type==='payment')paid+=amount;
      if(event.type==='credit_note')notes+=amount;
      if(event.type==='writeoff')badDebt+=amount;
    }else throw Error('Unbekannter Vertragsvorgang');
    if(contract.outstanding>max||revenue>max||paid>max||notes>max||badDebt>max)
      throw Error('Ueberlauf Forderung');
  }
  let outstanding=0n;
  for(const c of contracts.values())outstanding+=c.outstanding;
  if(outstanding!==revenue-paid-notes-badDebt)throw Error('Forderungsbruecke fehlerhaft');
  return {model:MODEL,receivablesCent:safe(outstanding,'Forderungen'),
    acceptedRevenueCent:safe(revenue,'Erlos'),collectedCent:safe(paid,'Zahlung'),
    creditNotesCent:safe(notes,'Gutschriften'),badDebtExpenseCent:safe(badDebt,'Ausfall'),
    ruleStatus:'DRAFT_ONLY',
    qualification:'Acceptance events require independent proof from the real game engine'};
}
function prepareSnapshot(state,companyId){
  if(!state||!Array.isArray(state.companies))throw Error('Spielzustand fehlt');
  const f=state.companies.find(c=>c.id===companyId);
  if(!f||!Array.isArray(f.obligations))throw Error('Firma/Rechnungen fehlen');
  const cash=safe(integer(f.cashCent,'Kasse'),'Kasse');
  const debt=safe(integer(f.debtCent,'Kreditschuld'),'Kreditschuld');
  let other=0n,principal=0n;
  for(const o of f.obligations){
    if(!o||typeof o.kind!=='string'||!o.kind)throw Error('Rechnungsart fehlt');
    const due=integer(o.dueCent,'Rechnungssoll');
    const paid=integer(o.paidCent,'Rechnungszahlung');
    if(paid>due)throw Error('Rechnung ueberbezahlt');
    if(o.kind==='TILGUNG')principal+=due-paid;
    else other+=due-paid;
  }
  if(principal>BigInt(debt))throw Error('Tilgung doppelt gezaehlt');
  const inputs={cashCent:cash,loanPrincipalCent:debt,
    unpaidOtherInvoicesCent:safe(other,'Offene Rechnungen')};
  const {calculate}=require('./valuation_explicit_v194.cjs');
  const result=calculate(inputs);
  if(result.status!=='NOT_COMPUTABLE')throw Error('Unbewerteter Snapshot wurde bilanziert');
  return {model:MODEL,companyId,knownInputs:inputs,valuation:result,
    source:'validated-game-state-read-only',ruleStatus:'DRAFT_ONLY'};
}
module.exports={MODEL,DURATION,depreciate,inventory,receivables,prepareSnapshot};

