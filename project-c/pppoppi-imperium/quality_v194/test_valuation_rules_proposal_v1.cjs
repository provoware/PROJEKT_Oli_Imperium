'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {MODEL,DURATION,depreciate,inventory,receivables,prepareSnapshot}=require('./valuation_rules_proposal_v1.cjs');
const dep=(assetType,costCent,ageMonths)=>depreciate({assetType,costCent,ageMonths});
test('Nutzungsdauer und letzte Cent genau, keine Restabschreibung',()=>{
  a.deepEqual(DURATION,{FACHBOHRUNG:60,RAFFINERIE_BAU:120,VERTRIEBSROUTE:60});
  const d=dep('FACHBOHRUNG',101,59),last=dep('FACHBOHRUNG',101,60);
  a.equal(d.accumulatedDepreciationCent,99);
  a.equal(last.currentMonthDepreciationCent,2);
  a.equal(last.bookValueCent,0);a.equal(dep('FACHBOHRUNG',101,75).bookValueCent,0);
});
test('Anlage bleibt ohne Aktivierungsdauer unbekannt',()=>{
  for(const assetType of ['FELDKAUF','IRGENDEINE_ANLAGE'])
    a.throws(()=>dep(assetType,5000,1),/Unbekannte Anlagenart/);
});
test('Abschreibung verlangt sichere echte Cent und Monate',()=>{
  for(const costCent of [-1,1.5,'100',NaN,Infinity,Number.MAX_SAFE_INTEGER+1])
    a.throws(()=>dep('RAFFINERIE_BAU',costCent,1),/Ungueltig/);
  for(const ageMonths of [-1,0.5,'2',NaN])
    a.throws(()=>dep('RAFFINERIE_BAU',100,ageMonths),/Ungueltig/);
});
test('Raffinerie nach 12 Monaten anteilig und exakt',()=>{
  const d=dep('RAFFINERIE_BAU',120000,12);
  a.equal(d.accumulatedDepreciationCent,12000);
  a.equal(d.bookValueCent,108000);
});
test('gleitender Durchschnitt nach zwei echten Kosteneingaengen',()=>{
  const v=inventory([{id:'R1',type:'receive',qtyMilli:1000,costCent:300},
    {id:'R2',type:'receive',qtyMilli:1000,costCent:500},
    {id:'C1',type:'consume',qtyMilli:500}]);
  a.equal(v.stockMilli,1500);a.equal(v.stockCostCent,600);
  a.equal(v.consumedCostCent,200);
});
test('Vollentnahme schliesst Kostenrechnung centgenau',()=>{
  const v=inventory([{id:'R1',type:'receive',qtyMilli:3,costCent:2},
    {id:'C1',type:'consume',qtyMilli:1},
    {id:'C2',type:'consume',qtyMilli:2}]);
  a.equal(v.stockMilli,0);a.equal(v.stockCostCent,0);
  a.equal(v.consumedCostCent,2);
});
test('kein erfundener Nullwert bei unbekannten Herstellungskosten',()=>{
  const v=inventory([{id:'R1',type:'receive',qtyMilli:1000,costCent:null},
    {id:'C1',type:'consume',qtyMilli:500}]);
  a.equal(v.stockMilli,500);a.equal(v.stockCostCent,null);
  a.equal(v.consumedCostCent,null);a.equal(v.valuationStatus,'UNPRICED');
});
test('Lager: Überziehung, doppelte Belege und Betragsmanipulationen',()=>{
  const valid=[{id:'R',type:'receive',qtyMilli:1000,costCent:100}];
  const bad=[
    [...valid,{id:'C',type:'consume',qtyMilli:1001}],
    [...valid,{id:'R',type:'consume',qtyMilli:1}],
    [{id:'R',type:'receive',qtyMilli:-1,costCent:10}],
    [{id:'R',type:'receive',qtyMilli:1.2,costCent:10}],
    [{id:'R',type:'receive',qtyMilli:1,costCent:-10}],
    [{id:'R',type:'receive',qtyMilli:1,costCent:'10'}],
    [{id:'R',type:'receive',qtyMilli:1,costCent:10},{id:'X',type:'sell',qtyMilli:1}],
    [{id:'R',type:'receive',qtyMilli:Number.MAX_SAFE_INTEGER+1,costCent:1}],
    [{id:'R',type:'receive',qtyMilli:1,costCent:1},{id:'X',type:'receive',qtyMilli:1,costCent:Number.MAX_SAFE_INTEGER}]
  ];
  for(const scenario of bad)a.throws(()=>inventory(scenario));
});
test('Vertragszusage allein erzeugt keine Forderung',()=>{
  const v=receivables([{id:'C1',type:'contract',contractId:'C1',qtyMilli:40000}]);
  a.equal(v.receivablesCent,0);a.equal(v.acceptedRevenueCent,0);
});
test('Teillieferung, Zahlung und Ausfall bleiben getrennt',()=>{
  const v=receivables([{id:'C1',type:'contract',contractId:'C1',qtyMilli:40000},
    {id:'A1',type:'accept',contractId:'C1',qtyMilli:20000,amountCent:800000},
    {id:'P1',type:'payment',contractId:'C1',amountCent:250000},
    {id:'W1',type:'writeoff',contractId:'C1',amountCent:50000}]);
  a.equal(v.receivablesCent,500000);
  a.equal(v.acceptedRevenueCent,800000);
  a.equal(v.collectedCent,250000);
  a.equal(v.badDebtExpenseCent,50000);
});
test('Gutschrift senkt Forderung, nicht zweiten Umsatz erfinden',()=>{
  const v=receivables([{id:'C1',type:'contract',contractId:'C1',qtyMilli:40000},
    {id:'A1',type:'accept',contractId:'C1',qtyMilli:40000,amountCent:800000},
    {id:'N1',type:'credit_note',contractId:'C1',amountCent:100000}]);
  a.equal(v.creditNotesCent,100000);a.equal(v.receivablesCent,700000);
});
test('Vertragsimport darf keine doppelte Abnahme oder Zahlung buchen',()=>{
  const start=[{id:'C',type:'contract',contractId:'C',qtyMilli:1000},
    {id:'A',type:'accept',contractId:'C',qtyMilli:1000,amountCent:100}];
  a.throws(()=>receivables([...start,start[1]]),/doppelte/);
  a.throws(()=>receivables([...start,{id:'A2',type:'accept',contractId:'C',qtyMilli:1,amountCent:1}]),/ueberschritten/);
  a.throws(()=>receivables([...start,{id:'P',type:'payment',contractId:'C',amountCent:101}]),/ueber/);
});
test('Vertragsgrenzen sperren ungueltige Eingaben und verfruehte Lieferung',()=>{
  const base={id:'C',type:'contract',contractId:'C',qtyMilli:10};
  const bad=[
    [{id:'A',type:'accept',contractId:'C',qtyMilli:1,amountCent:1}],
    [base,{id:'P',type:'payment',contractId:'C',amountCent:1}],
    [base,{id:'A',type:'accept',contractId:'C',qtyMilli:0,amountCent:1}],
    [base,{id:'A',type:'accept',contractId:'C',qtyMilli:1,amountCent:0}],
    [base,{id:'A',type:'accept',contractId:'C',qtyMilli:1,amountCent:-1}],
    [base,{id:'A',type:'accept',contractId:'C',qtyMilli:1,amountCent:'1'}],
    [base,{id:'Z',type:'refund',contractId:'C',amountCent:1}],
    [base,{id:'N',type:'credit_note',contractId:'C',amountCent:1}],
    [base,{id:'B',type:'contract',contractId:'C',qtyMilli:10}],
    [{id:'C',type:'contract',contractId:'C',qtyMilli:Number.MAX_SAFE_INTEGER+1}]
  ];
  for(const scenario of bad)a.throws(()=>receivables(scenario));
});
test('Forderungen: mehrere Firmenvertraege müssen sauber aggregieren',()=>{
  const v=receivables([{id:'C1',type:'contract',contractId:'C1',qtyMilli:10},
    {id:'C2',type:'contract',contractId:'C2',qtyMilli:10},
    {id:'A1',type:'accept',contractId:'C1',qtyMilli:10,amountCent:500},
    {id:'A2',type:'accept',contractId:'C2',qtyMilli:5,amountCent:250},
    {id:'P1',type:'payment',contractId:'C1',amountCent:200}]);
  a.equal(v.receivablesCent,550);a.equal(v.acceptedRevenueCent,750);
});
test('Snapshot liest reales Startkapital, erfindet keine Vermögensbewertung',()=>{
  for(const name of ['v07_engine','v08_engine','v082_strategy_engine',
    'profi_economy','logistics_v17','public_network_v171',
    'strategy_ai_v192','strategy_logistics_v193'])
    require('../SPIEL/src/'+name+'.js');
  const E=globalThis.OliV082;
  const state=E.fresh({humans:2,ais:0,seed:'VALUATION-DRAFT-20261101'});
  a.equal(E.validate(state),true);
  const original=structuredClone(state);
  const s=prepareSnapshot(state,'H1');
  a.deepEqual(state,original);
  a.equal(s.knownInputs.cashCent,E.CFG.startCash);
  a.equal(s.knownInputs.loanPrincipalCent,0);
  a.equal(s.valuation.status,'NOT_COMPUTABLE');
  a.equal(s.valuation.totalAssetsCent,null);
  a.ok(s.valuation.missing.includes('fixedAssetsCent'));
  a.equal(s.model,MODEL);
});
test('Snapshot verweigert Tilgungs-Doppelzahlung und kaputte Beträge',()=>{
  const s={companies:[{id:'H1',cashCent:10000,debtCent:50,obligations:[
    {kind:'TILGUNG',dueCent:51,paidCent:0}]}]};
  a.throws(()=>prepareSnapshot(s,'H1'),/Tilgung doppelt/);
  s.companies[0].obligations[0].paidCent=51;
  const v=prepareSnapshot(s,'H1');a.equal(v.knownInputs.unpaidOtherInvoicesCent,0);
  s.companies[0].obligations[0].dueCent=-1;
  a.throws(()=>prepareSnapshot(s,'H1'),/Ungueltig/);
});
test('Schutz: mathematische Vorschläge sind keine C64-Spielregel oder Release',()=>{
  const d=dep('VERTRIEBSROUTE',800000,1);
  a.equal(d.ruleStatus,'DRAFT_ONLY');
  const r=receivables([]);
  a.equal(r.ruleStatus,'DRAFT_ONLY');
  a.match(r.qualification,/independent proof/);
});
test('nach Ende der Nutzungsdauer darf kein weiterer Cent abgeschrieben werden',()=>{
  for(const assetType of Object.keys(DURATION)){
    const atEnd=dep(assetType,101,DURATION[assetType]);
    const oneLater=dep(assetType,101,DURATION[assetType]+1);
    const muchLater=dep(assetType,101,DURATION[assetType]+1000);
    a.equal(atEnd.bookValueCent,0);
    a.equal(oneLater.bookValueCent,0);
    a.equal(oneLater.currentMonthDepreciationCent,0);
    a.equal(muchLater.currentMonthDepreciationCent,0);
  }
});


test('Leerer Bestand und neuer bekannter Zugang heilen keine unbekannten Verbrauchskosten',()=>{
  const v=inventory([{id:'U',type:'receive',qtyMilli:1,costCent:null},
    {id:'E',type:'consume',qtyMilli:1},{id:'K',type:'receive',qtyMilli:2,costCent:100}]);
  a.equal(v.stockMilli,2);a.equal(v.stockCostCent,100);
  a.equal(v.consumedCostCent,null);a.equal(v.valuationStatus,'UNPRICED');
});
test('Vollstaendig leerer unbewerteter Bestand hat null bekannte Bestandkosten',()=>{
  const v=inventory([{id:'U',type:'receive',qtyMilli:1,costCent:null},
    {id:'E',type:'consume',qtyMilli:1}]);
  a.equal(v.stockMilli,0);a.equal(v.stockCostCent,0);a.equal(v.consumedCostCent,null);
});
test('Versionierter Bewertungsvertrag haelt Modell und produktive Freigabe getrennt',()=>{
  const c=require('./valuation_contract_v1.json');
  a.equal(c.schema,'pppoppi.valuation.contract/1');
  a.deepEqual(c.assetLifetimesMonths,DURATION);
  a.equal(c.productConnected,false);a.equal(c.historicalC64Claim,false);
  a.equal(c.unknownOrUnmappedInput,'NOT_COMPUTABLE');
  a.equal(c.inventory.unknownConsumedCostSurvivesDepletion,true);
  a.equal(c.recognition.cashSales,'cash-at-settlement-no-additional-receivable');
});
