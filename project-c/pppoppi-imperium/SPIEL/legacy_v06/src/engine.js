/* PPPOPPI-IMPERIUM: eigenständiger Berliner Spielprototyp. MIT + kein Originalcode. */
(function (root, make) {
  const api = make();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OliEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'pppoppi.berlin.save/0.6';
  const RULESET = 'berlin-slice-0.4.0';
  const P = Object.freeze({
    startCashCent: 20000000, monthDays: 30, buyCent: 5000000,
    surveyCent: 200000, drillCent: 7000000, pumpCent: 100000,
    transportCent: 50000, fieldReserveMilli: 500000, pumpMilli: 100000,
    tankCapacityMilli: 200000, priceCentPerBbl: 70000,
    marketDemandMilli: 120000, rivalOfferMilli: 50000,
    wageCent: 90000, upkeepCent: 50000, rescueLoanCent: 4000000,
    restartCashCent: 15000000, resalePercent: 60,
    interestBps: 100, repaymentBps: 500
  });
  const days = Object.freeze({SURVEY:2,BUY_FIELD:1,DRILL:5,PUMP:4,TRANSPORT:1,OFFER:1});
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const isInt = Number.isSafeInteger;
  function assert(c,msg){ if(!c) throw new Error(msg); }
  function roundDivide(num, den) {assert(isInt(num)&&isInt(den)&&num>=0&&den>0,'Ungültige Berechnung');return Math.floor((num + Math.floor(den/2))/den);}
  function centsForOil(milli,centPerBbl){return roundDivide(milli*centPerBbl,1000);}
  function allocLargestRemainder(offers,cap){
    assert(isInt(cap)&&cap>=0,'Kapazität ungültig');
    assert(Array.isArray(offers)&&offers.every(x=>typeof x.id==='string'&&isInt(x.qty)&&x.qty>=0),'Angebote ungültig');
    assert(new Set(offers.map(x=>x.id)).size===offers.length,'Doppelte Angebotskennung');
    const total=offers.reduce((a,x)=>a+x.qty,0), alloc=Object.fromEntries(offers.map(x=>[x.id,0]));
    if(total<=cap){offers.forEach(x=>alloc[x.id]=x.qty);return alloc;}
    if(total===0)return alloc;
    const target=Math.min(cap,total);
    // Keine Fließkommarundung im Teilungsverfahren.
    const rows=offers.map(x=>({id:x.id,base:Math.floor(x.qty*target/total),rem:(x.qty*target)%total,qty:x.qty}));
    rows.forEach(x=>alloc[x.id]=x.base);
    let left=target-rows.reduce((s,x)=>s+x.base,0);
    rows.sort((a,b)=>b.rem-a.rem || a.id.localeCompare(b.id,'en'));
    for (const x of rows){if(left<=0)break;if(alloc[x.id]<x.qty){alloc[x.id]++;left--;}}
    assert(left===0,'Verteilung unvollständig');
    return alloc;
  }
  function payPriority(balanceCent, obligations){
    assert(isInt(balanceCent)&&balanceCent>=0,'Ungültiger Bargeldbestand');
    const out=clone(obligations), priorities=[1,2,3,4,5];let cash=balanceCent;
    for(const tier of priorities){const rows=out.filter(x=>x.priority===tier&&x.dueCent>x.paidCent);
      if(!rows.length)continue;
      const bills=rows.map(x=>({id:x.id,qty:x.dueCent-x.paidCent}));
      const alloc=allocLargestRemainder(bills,cash);
      for(const x of rows){x.paidCent+=alloc[x.id];cash-=alloc[x.id];}
    }
    return {cashCent:cash,obligations:out};
  }
  function fresh(seed='BERLIN-START'){
    assert(typeof seed==='string'&&seed.length>0&&seed.length<=80,'Startkennung ungültig');
    return {schema:SCHEMA, ruleset:RULESET, seed,month:1,generation:1,phase:'TURN_ACTIVE',
      cashCent:P.startCashCent, debtCent:0, actionDaysUsed:0,
      field:{owned:false,surveyed:false,drilled:false,reserveMilli:P.fieldReserveMilli},
      tankCapacityMilli:P.tankCapacityMilli, inventoryMilli:0,preparedMilli:0,order:null,
      obligations:[],ledger:[],processedIds:[],sequence:0, loanUsed:false,
      rescuedGenerations:0,awards:[],marketStreak:0,contractsFinished:0,
      monthReport:null,history:[],message:'Willkommen in PPPOPPIs Berliner Öl-Büro.'};
  }
  function validate(s){
    assert(s&&typeof s==='object'&&s.schema===SCHEMA&&s.ruleset===RULESET,'Unbekanntes Speicherformat oder Regelprofil');
    assert(isInt(s.month)&&s.month>=1&&isInt(s.generation)&&s.generation>=1,'Monat/Generation beschädigt');
    assert(['TURN_ACTIVE','MONTH_REPORT','RESCUE'].includes(s.phase),'Ungültige Spielphase');
    for(const k of ['cashCent','debtCent','actionDaysUsed','inventoryMilli','preparedMilli','tankCapacityMilli','sequence'])assert(isInt(s[k])&&s[k]>=0,`${k} ungültig`);
    assert(s.actionDaysUsed<=P.monthDays,'Spieltagelimit überschritten');
    assert(s.inventoryMilli+s.preparedMilli<=s.tankCapacityMilli,'Ölmenge über Tankkapazität');
    assert(s.field&&typeof s.field.owned==='boolean'&&typeof s.field.drilled==='boolean'&&typeof s.field.surveyed==='boolean'&&isInt(s.field.reserveMilli)&&s.field.reserveMilli>=0,'Feldzustand beschädigt');
    assert(!s.field.drilled||s.field.owned,'Bohrung ohne Eigentum');
    assert(!s.order || (s.order.id==='ORDER-SELF'&&s.order.qtyMilli===s.preparedMilli&&s.order.qtyMilli>0),'Ungültiger Verkaufsauftrag');
    assert(Array.isArray(s.ledger)&&Array.isArray(s.obligations)&&Array.isArray(s.processedIds)&&Array.isArray(s.history)&&Array.isArray(s.awards),'Verlaufsdaten beschädigt');
    assert(new Set(s.processedIds).size===s.processedIds.length,'Doppelte Vorgangskennungen');
    assert(s.obligations.every(o=>typeof o.id==='string'&&isInt(o.dueCent)&&o.dueCent>=0&&isInt(o.paidCent)&&o.paidCent>=0&&o.paidCent<=o.dueCent&&[1,2,3,4,5].includes(o.priority)),'Verbindlichkeit beschädigt');
    return true;
  }
  function ledger(s,code,deltaCent,detail){assert(isInt(deltaCent),'Buchung ungültig');assert(s.cashCent+deltaCent>=0,'Nicht genug Guthaben');s.cashCent+=deltaCent;s.ledger.push({id:`L-${s.sequence}-${s.ledger.length+1}`,month:s.month,generation:s.generation,code,deltaCent,detail});}
  function requireTime(s,type){assert(s.actionDaysUsed+days[type]<=P.monthDays,'Nicht genügend freie Spieltage');s.actionDaysUsed+=days[type];}
  function monthClose(s){
    assert(s.phase==='TURN_ACTIVE','Monat bereits abgeschlossen');
    const ownQty=s.order?s.order.qtyMilli:0;
    const allocated=allocLargestRemainder([{id:'A-PPPOPPI',qty:ownQty},{id:'Z-GEGENFIRMA',qty:P.rivalOfferMilli}],P.marketDemandMilli);
    const sold=allocated['A-PPPOPPI'];
    const revenue=centsForOil(sold,P.priceCentPerBbl);
    if(sold>0) ledger(s,'ERLOES',revenue,`${sold/1000} Barrel am Markt verkauft`);
    s.inventoryMilli+=s.preparedMilli-sold;
    s.preparedMilli=0;s.order=null;
    const demanded=Math.min(P.marketDemandMilli,ownQty+P.rivalOfferMilli);
    const share=demanded>0?roundDivide(sold*10000,demanded):0;
    if(demanded>=100000&&P.rivalOfferMilli>0&&share>=6000)s.marketStreak++;else s.marketStreak=0;
    // Beurkundete Auszeichnungen sind unabhängig vom laufenden Streak; im Mini-Prototyp optional erreichbar.
    if(s.marketStreak>=6&&!s.awards.includes('MS-BERLIN-MARKTFUEHRER'))s.awards.push('MS-BERLIN-MARKTFUEHRER');
    const oldIds=new Set(s.obligations.map(o=>o.id));
    function add(id,priority,dueCent,kind){assert(!oldIds.has(id),'Monatsabrechnung doppelt');s.obligations.push({id,priority,dueCent,paidCent:0,kind});oldIds.add(id);}
    add(`M${s.month}-G${s.generation}-PERSONAL`,1,P.wageCent,'PERSONAL');
    if(s.field.drilled)add(`M${s.month}-G${s.generation}-ANLAGE`,1,P.upkeepCent,'ANLAGE');
    if(s.debtCent>0){
      const interest=roundDivide(s.debtCent*P.interestBps,10000);
      const principal=roundDivide(s.debtCent*P.repaymentBps,10000);
      add(`M${s.month}-G${s.generation}-ZINS`,3,interest,'ZINS');
      // Keine Doppel-Fälligkeit: Fälligkeitsforderung ersetzt keine bereits offene Tilgung.
      const outstanding=s.obligations.filter(o=>o.kind==='TILGUNG').reduce((a,o)=>a+o.dueCent-o.paidCent,0);
      add(`M${s.month}-G${s.generation}-TILGUNG`,3,Math.min(Math.max(0,s.debtCent-outstanding),principal),'TILGUNG');
    }
    settle(s);
    const outstanding=s.obligations.filter(o=>o.priority<=3).reduce((a,o)=>a+o.dueCent-o.paidCent,0);
    s.monthReport={month:s.month,producedMilli:s.lastProducedMilli||0,soldMilli:sold,revenueCent:revenue,marketShareBps:share,unsoldMilli:s.inventoryMilli,initialShortfallCent:outstanding,criticalOutstandingCent:outstanding};
    s.history.push({month:s.month,generation:s.generation,soldMilli:sold,revenueCent:revenue,marketShareBps:share,criticalOutstandingCent:outstanding});
    s.phase=outstanding?'RESCUE':'MONTH_REPORT';
    s.message=outstanding?'Zahlungslücke – Rettung erforderlich.':'Monat abgeschlossen – Bericht ansehen.';
  }
  function settle(s){
    const original=Object.fromEntries(s.obligations.map(o=>[o.id,o.paidCent]));
    const out=payPriority(s.cashCent,s.obligations);
    s.obligations=out.obligations;
    for(const o of out.obligations){const delta=o.paidCent-original[o.id];if(delta>0){ledger(s,`RECHNUNG_${o.kind}`,-delta,o.id);if(o.kind==='TILGUNG')s.debtCent-=delta;}}
    assert(s.cashCent===out.cashCent,'Buchungsfehler in Zahlungsabwicklung');
  }
  function restart(s){
    s.history.push({month:s.month,generation:s.generation,event:'SANIERUNGSNEUSTART',writtenOffDebtCent:s.debtCent});
    s.generation++;s.rescuedGenerations++;
    s.cashCent=P.restartCashCent;s.debtCent=0;s.field={owned:false,surveyed:false,drilled:false,reserveMilli:P.fieldReserveMilli};
    s.inventoryMilli=0;s.preparedMilli=0;s.order=null;s.obligations=[];s.loanUsed=false;s.marketStreak=0;s.contractsFinished=0;s.lastProducedMilli=0;
    s.phase='MONTH_REPORT';
    s.message='Neue Wirtschaftsgeneration. Erfolge bleiben, alte Vermögenswerte und Schulden wurden im Spiel abgewickelt.';
    if(s.monthReport)s.monthReport.rescueRestarted=true;
  }
  function transition(input,cmd){
    validate(input);assert(cmd&&typeof cmd==='object'&&typeof cmd.type==='string','Befehl ungültig');
    assert(typeof cmd.requestId==='string'&&cmd.requestId.length>=3&&cmd.requestId.length<=100,'Vorgangskennung fehlt');
    if(input.processedIds.includes(cmd.requestId))return {state:clone(input),duplicate:true};
    const s=clone(input);s.sequence++;
    switch(cmd.type){
      case 'SURVEY':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(!s.field.surveyed,'Gutachten bereits vorhanden');requireTime(s,'SURVEY');ledger(s,'GUTACHTEN',-P.surveyCent,'Unabhängiges Probegutachten');s.field.surveyed=true;s.message='Gutachten erstellt: Feld besitzt modellierte Reserve.';break;
      case 'BUY_FIELD':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(s.field.surveyed,'Erst Gutachten erstellen');assert(!s.field.owned,'Feld ist bereits im Besitz');requireTime(s,'BUY_FIELD');ledger(s,'FELDKAUF',-P.buyCent,'Konzession erworben');s.field.owned=true;s.message='Feld erworben.';break;
      case 'DRILL':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(s.field.owned&&!s.field.drilled,'Eigentum ohne bisherige Bohrung erforderlich');requireTime(s,'DRILL');ledger(s,'BOHRUNG',-P.drillCent,'Förderanlage errichtet');s.field.drilled=true;s.message='Bohrung fertig, Förderung möglich.';break;
      case 'PUMP':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(s.field.owned&&s.field.drilled,'Förderanlage erforderlich');assert(s.field.reserveMilli>=P.pumpMilli,'Reserve für Fördercharge erschöpft');assert(s.inventoryMilli+s.preparedMilli+P.pumpMilli<=s.tankCapacityMilli,'Tankkapazität zu klein');requireTime(s,'PUMP');ledger(s,'FOERDERUNG',-P.pumpCent,'100 Barrel gefördert');s.field.reserveMilli-=P.pumpMilli;s.inventoryMilli+=P.pumpMilli;s.lastProducedMilli=(s.lastProducedMilli||0)+P.pumpMilli;s.message='100 Barrel gefördert und eingelagert.';break;
      case 'TRANSPORT':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(!s.order&&s.preparedMilli===0,'Laufende Lieferung vorhanden');assert(s.inventoryMilli>=1000,'Mindestens ein Barrel für Lieferung nötig');requireTime(s,'TRANSPORT');ledger(s,'TRANSPORT',-P.transportCent,'Liefervorbereitung');s.preparedMilli=s.inventoryMilli;s.inventoryMilli=0;s.message='Öl für Lieferung bereitgestellt.';break;
      case 'OFFER':assert(s.phase==='TURN_ACTIVE','Keine Aktionen in dieser Phase');assert(s.preparedMilli>0&&!s.order,'Erst Lieferung vorbereiten');requireTime(s,'OFFER');s.order={id:'ORDER-SELF',qtyMilli:s.preparedMilli};s.message='Verkaufsangebot für Monatsmarkt erfasst.';break;
      case 'CANCEL_SHIPMENT':assert(s.phase==='TURN_ACTIVE','Kein Storno in dieser Phase');assert(!s.order&&s.preparedMilli>0,'Ein bindendes Angebot kann nicht kommentarlos storniert werden');s.inventoryMilli+=s.preparedMilli;s.preparedMilli=0;s.message='Ungebundene Lieferung ins Lager zurückgebucht; Transportkosten bleiben.';break;
      case 'END_MONTH':monthClose(s);break;
      case 'NEXT_MONTH':assert(s.phase==='MONTH_REPORT','Erst Monatsbericht oder Rettung abschließen');s.month++;s.phase='TURN_ACTIVE';s.actionDaysUsed=0;s.lastProducedMilli=0;s.monthReport=null;s.message='Neuer Spielmonat begonnen.';break;
      case 'RESCUE_LOAN':assert(s.phase==='RESCUE','Kein Rettungsfall');assert(!s.loanUsed,'Rettungskredit bereits verwendet');s.loanUsed=true;s.debtCent+=P.rescueLoanCent;ledger(s,'RETTUNGSKREDIT',P.rescueLoanCent,'Kredit erhöht Bargeld und Schulden');settle(s);s.monthReport.criticalOutstandingCent=s.obligations.filter(o=>o.priority<=3).reduce((a,o)=>a+o.dueCent-o.paidCent,0);if(!s.obligations.some(o=>o.priority<=3&&o.paidCent<o.dueCent))s.phase='MONTH_REPORT';s.message=s.phase==='MONTH_REPORT'?'Zahlungsfähigkeit wiederhergestellt.':'Kredit reicht noch nicht für alle Pflichtzahlungen.';break;
      case 'RESCUE_SALE':assert(s.phase==='RESCUE','Kein Rettungsfall');assert(s.field.owned,'Keine Konzession für Verkauf vorhanden');ledger(s,'NOTVERKAUF',roundDivide(P.buyCent*P.resalePercent,100),'Konzession im Rettungsfall verkauft');s.history.push({month:s.month,generation:s.generation,event:'NOTVERKAUF',writtenOffOilMilli:s.inventoryMilli+s.preparedMilli,closedReserveMilli:s.field.reserveMilli});s.field.owned=false;s.field.drilled=false;s.field.surveyed=false;s.field.reserveMilli=0;s.inventoryMilli=0;s.preparedMilli=0;s.order=null;settle(s);s.monthReport.criticalOutstandingCent=s.obligations.filter(o=>o.priority<=3).reduce((a,o)=>a+o.dueCent-o.paidCent,0);if(!s.obligations.some(o=>o.priority<=3&&o.paidCent<o.dueCent))s.phase='MONTH_REPORT';s.message='Notverkauf und fällige Rechnungen geprüft.';break;
      case 'RESTART':assert(s.phase==='RESCUE','Sanierungsneustart nur in Krise');restart(s);break;
      default:throw new Error('Unbekannte Aktion: '+cmd.type);
    }
    s.processedIds.push(cmd.requestId);
    validate(s);return {state:s,duplicate:false};
  }
  return {SCHEMA,RULESET,P,days,fresh,validate,transition,centsForOil,roundDivide,allocLargestRemainder,payPriority};
});
