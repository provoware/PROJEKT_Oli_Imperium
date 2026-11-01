'use strict';
// Read-only evidence adapter for PPPOPPI contract V1; no accounting/release approval.
const {prepareSnapshot}=require('./valuation_rules_proposal_v1.cjs');
const SALES=new Set(['MARKTERLÖS','VERTRAGSERLÖS','AUSSENMARKT','RAFFINIERT_MONATSVERKAUF']);
const ASSETS=new Set(['FELDKAUF','FACHBOHRUNG','RAFFINERIE_BAU','VERTRIEBSROUTE']);
const MAX=BigInt(Number.MAX_SAFE_INTEGER);
function cents(value,name) {
  if(!Number.isSafeInteger(value)||value<0)throw Error('Ungueltig '+name);
  return BigInt(value);
}
function signed(value,name) {
  if(!Number.isSafeInteger(value))throw Error('Ungueltig '+name);
  return BigInt(value);
}
function asNumber(value,name) {
  if(value>MAX||value< -MAX)throw Error('Ueberlauf '+name);
  return Number(value);
}
function captureSettledEvents(state,companyId,openingCashCent) {
  if(!state||state.phase!=='REPORT'||!Number.isSafeInteger(state.month)||state.month<1
    ||!Array.isArray(state.companies)||!state.lastReport
    ||!Array.isArray(state.lastReport.companies)
    ||!Array.isArray(state.reports)||state.reports.length!==state.month)
    throw Error('Nur vollstaendig abgeschlossene reale Monatsberichte');
  const firm=state.companies.find(f=>f.id===companyId);
  const report=state.lastReport.companies.find(f=>f.id===companyId);
  if(!firm||!report||!Array.isArray(firm.ledger)
    ||!Array.isArray(firm.obligations)||!Array.isArray(firm.contracts))
    throw Error('Firma, Belege oder Monatsbericht fehlen');
  // RESTART erases old ledgers: never imply reconstructability across generations.
  if(firm.generation!==1)throw Error('Alte Generation nicht rekonstruierbar');
  const opening=cents(openingCashCent,'belegtes Startkapital');
  const snapshot=prepareSnapshot(state,companyId);
  if(snapshot.valuation.status!=='NOT_COMPUTABLE')throw Error('Unbelegte Bilanz berechnet');
  const seen=new Set(),events=[],unmapped=new Set();
  let movement=0n,monthRevenue=0n;
  if(firm.ledger.length>10000)throw Error('Zu viele Buchungen');
  for(const entry of firm.ledger) {
    if(!entry||typeof entry.id!=='string'||!entry.id.trim()||seen.has(entry.id)
      ||typeof entry.code!=='string'||!entry.code.trim()
      ||!Number.isSafeInteger(entry.month)||entry.month<1||entry.month>state.month)
      throw Error('Unvollstaendige oder doppelte Ereignisidentitaet');
    seen.add(entry.id);
    const delta=signed(entry.deltaCent,'Ereignisbetrag');
    movement+=delta;
    let classification='UNMAPPED';
    if(SALES.has(entry.code)) {
      if(delta<=0n)throw Error('Verkauf ohne positiven Kassenzugang');
      classification='CASH_SALE_RECOGNIZED_ONCE';
      if(entry.month===state.month)monthRevenue+=delta;
      if(entry.code==='VERTRAGSERLÖS') {
        const contract=firm.contracts.find(c=>c.id===entry.info);
        if(!contract||contract.status!=='DONE'||!Number.isSafeInteger(contract.soldMilli)
          ||contract.soldMilli<=0)throw Error('Vertragserloes ohne echte Abnahme');
      }
    } else if(ASSETS.has(entry.code)) {
      if(delta>=0n)throw Error('Anlage ohne Anschaffungsauszahlung');
      classification='PAID_ACQUISITION_NOT_PROFIT';
      if(['FELDKAUF','FACHBOHRUNG'].includes(entry.code)) {
        const claim=state.claims&&state.claims[entry.info];
        if(!claim||claim.owner!==companyId
          ||(entry.code==='FACHBOHRUNG'&&!claim.drilled))
          throw Error('Anlagenbuchung ohne reales Eigentum');
      }else{
        const plant=state.refinery&&state.refinery.plants&&
          state.refinery.plants[companyId]&&state.refinery.plants[companyId][entry.info];
        if(!plant||(entry.code==='RAFFINERIE_BAU'&&!plant.built)
          ||(entry.code==='VERTRIEBSROUTE'&&!plant.route))
          throw Error('Anlagenbuchung ohne fertige Anlage');
      }
    } else if(entry.code.startsWith('ZAHLUNG_')) {
      if(delta>=0n)throw Error('Rechnungszahlung ohne Kassenabgang');
      const bill=firm.obligations.find(o=>o.id===entry.info);
      if(!bill||entry.code!=='ZAHLUNG_'+bill.kind)
        throw Error('Zahlung ohne zugeordnete Rechnung');
      classification='INVOICE_SETTLEMENT_NOT_SECOND_EXPENSE';
    } else {
      unmapped.add(entry.code);
    }
    events.push(Object.freeze({id:entry.id,companyId,generation:firm.generation,
      month:entry.month,code:entry.code,deltaCent:Number(delta),
      classification}));
  }
  if(asNumber(opening+movement,'Kassenbruecke')!==firm.cashCent
    ||firm.cashCent!==report.cashCent||firm.debtCent!==report.debtCent)
    throw Error('Kassen-/Berichtsbruecke stimmt nicht');
  if(asNumber(monthRevenue,'Monatserloes')!==report.revenueCent)
    throw Error('Monatsumsatz stimmt nicht');
  const invoices=new Set();let unpaidOther=0n;
  for(const bill of firm.obligations) {
    if(!bill||typeof bill.id!=='string'||!bill.id.trim()||invoices.has(bill.id)
      ||typeof bill.kind!=='string'||!bill.kind.trim())
      throw Error('Unvollstaendige oder doppelte Rechnung');
    invoices.add(bill.id);
    const due=cents(bill.dueCent,'Rechnungsbetrag');
    const paid=cents(bill.paidCent,'Rechnungszahlung');
    if(paid>due)throw Error('Rechnung ueberzahlt');
    const payments=firm.ledger.filter(e=>e.code==='ZAHLUNG_'+bill.kind&&e.info===bill.id);
    const paidFromLedger=payments.reduce((n,e)=>n-signed(e.deltaCent,'Zahlungsbuchung'),0n);
    if(paidFromLedger!==paid)throw Error('Zahlung doppelt oder nicht verbucht');
    if(bill.kind!=='TILGUNG')unpaidOther+=due-paid;
  }
  if(asNumber(unpaidOther,'Rechnungsrest')!==snapshot.knownInputs.unpaidOtherInvoicesCent
    ||snapshot.knownInputs.cashCent!==firm.cashCent)
    throw Error('Offene-Rechnungen-Bruecke stimmt nicht');
  return Object.freeze({
    schema:'pppoppi.valuation.real-events/1',
    contract:'pppoppi.valuation.contract/1',
    companyId,generation:firm.generation,settledMonth:state.month,
    observedLedgerEvents:events,
    knownCashCent:firm.cashCent,
    knownDebtCent:firm.debtCent,
    knownUnpaidOtherInvoicesCent:asNumber(unpaidOther,'Verbindlichkeiten'),
    recognizedCurrentMonthCashSalesCent:asNumber(monthRevenue,'Barumsaetze'),
    recognizedReceivablesForTheseCashSalesCent:0,
    unmappedCodes:[...unmapped].sort(),
    assetValueCent:null,inventoryCostCent:null,totalAssetsCent:null,
    equityCent:null,profitCent:null,
    valuationStatus:'NOT_COMPUTABLE',productiveConnection:false,
    gate:'BLOCKED',assurance:'READ_ONLY_REAL_ENGINE_EVENT_EVIDENCE'
  });
}
module.exports={captureSettledEvents};
