'use strict';
const assert=require('node:assert/strict');
const E=require('../src/engine.js');
const tests=[];
const T=(name,fn)=>tests.push([name,fn]);
function doCmd(s,type,id=type+Math.random()){return E.transition(s,{type,requestId:id}).state;}
function toWell(){let s=E.fresh();for(const x of ['SURVEY','BUY_FIELD','DRILL'])s=doCmd(s,x);return s;}
function fullMonth(){let s=E.fresh();for(const x of ['SURVEY','BUY_FIELD','DRILL','PUMP','TRANSPORT','OFFER','END_MONTH'])s=doCmd(s,x);return s;}
function fails(s,type,msg){assert.throws(()=>doCmd(s,type),msg);}
T('Startdaten und Einheitengrenzen',()=>{let s=E.fresh();assert.equal(s.cashCent,20000000);assert.equal(s.field.reserveMilli,500000);assert.equal(E.validate(s),true)});
T('1 Barrel = 1000 Milli-Barrel für Abrechnung',()=>assert.equal(E.centsForOil(12500,6000),75000));
T('Kaufmännische Cent-Rundung',()=>{assert.equal(E.centsForOil(1,500),1);assert.equal(E.centsForOil(1,499),0)});
T('Marktverteilung 90/60 auf 100',()=>assert.deepEqual(E.allocLargestRemainder([{id:'A',qty:90000},{id:'B',qty:60000}],100000),{A:60000,B:40000}));
T('Kein Überangebot: alle verkaufen',()=>assert.deepEqual(E.allocLargestRemainder([{id:'A',qty:3},{id:'B',qty:2}],10),{A:3,B:2}));
T('Gleichstand: feste ID-Reihenfolge',()=>assert.deepEqual(E.allocLargestRemainder([{id:'B',qty:1},{id:'A',qty:1}],1),{A:1,B:0}));
T('Nullangebote',()=>assert.deepEqual(E.allocLargestRemainder([{id:'A',qty:0}],1),{A:0}));
T('Keine doppelten Angebots-IDs',()=>assert.throws(()=>E.allocLargestRemainder([{id:'A',qty:1},{id:'A',qty:2}],2),/Doppelte/));
T('Zahlung Priorität und Rest',()=>{let r=E.payPriority(1000,[{id:'A',priority:1,dueCent:600,paidCent:0},{id:'B',priority:2,dueCent:600,paidCent:0},{id:'C',priority:3,dueCent:300,paidCent:0}]);assert.deepEqual(r.obligations.map(x=>x.paidCent),[600,400,0]);assert.equal(r.cashCent,0)});
T('Zahlung innerhalb Klasse anteilig',()=>{let r=E.payPriority(100,[{id:'A',priority:1,dueCent:60,paidCent:0},{id:'B',priority:1,dueCent:140,paidCent:0}]);assert.deepEqual(r.obligations.map(x=>x.paidCent),[30,70])});
T('Aktion scheitert bei fehlendem Gutachten',()=>fails(E.fresh(),'BUY_FIELD',/Gutachten/));
T('Bohrung scheitert ohne Besitz',()=>fails(E.fresh(),'DRILL',/Eigentum/));
T('Förderung scheitert ohne Anlage',()=>fails(E.fresh(),'PUMP',/Förderanlage/));
T('Angebot scheitert ohne Lieferung',()=>fails(E.fresh(),'OFFER',/Lieferung/));
T('Geldmangel ändert Ursprungszustand nicht',()=>{let s=E.fresh();s.cashCent=100;let old=JSON.stringify(s);fails(s,'SURVEY',/Guthaben/);assert.equal(JSON.stringify(s),old)});
T('Idempotenter erneut abgesandter Befehl',()=>{let s=E.fresh();let r=E.transition(s,{type:'SURVEY',requestId:'req-1'});let again=E.transition(r.state,{type:'SURVEY',requestId:'req-1'});assert.equal(again.duplicate,true);assert.deepEqual(again.state,r.state)});
T('Doppelte Befehle mit neuen IDs verboten wenn Einmalfunktion',()=>{let s=doCmd(E.fresh(),'SURVEY');fails(s,'SURVEY',/bereits/)});
T('Bohrung und Kaufkosten korrekt',()=>{let s=toWell();assert.equal(s.cashCent,20000000-200000-5000000-7000000);assert.equal(s.actionDaysUsed,8)});
T('Förderung vermindert Feldreserve',()=>{let s=doCmd(toWell(),'PUMP');assert.equal(s.field.reserveMilli,400000);assert.equal(s.inventoryMilli,100000)});
T('Lagervolumen geschützt',()=>{let s=toWell();s.tankCapacityMilli=10000;fails(s,'PUMP',/Tankkapazität/)});
T('Förderung ohne Reserve blockiert',()=>{let s=toWell();s.field.reserveMilli=0;fails(s,'PUMP',/Reserve/)});
T('Zeitlimit blockiert Aktion',()=>{let s=E.fresh();s.actionDaysUsed=29;fails(s,'SURVEY',/Spieltage/)});
T('Kompletter Monat: 80/40; 20 Barrel zurück',()=>{let s=fullMonth();assert.equal(s.phase,'MONTH_REPORT');assert.equal(s.monthReport.soldMilli,80000);assert.equal(s.monthReport.revenueCent,5600000);assert.equal(s.inventoryMilli,20000);assert.equal(s.field.reserveMilli,400000);assert.equal(s.actionDaysUsed,14);assert.equal(s.cashCent,13110000);assert.equal(s.monthReport.marketShareBps,6667)});
T('Monatsabschluss nicht doppelt',()=>{let s=fullMonth();fails(s,'END_MONTH',/bereits abgeschlossen/)});
T('Monatsabschluss idempotent über gleiche Vorgangskennung',()=>{let s=E.fresh();let r=E.transition(s,{type:'END_MONTH',requestId:'finish-1'});let r2=E.transition(r.state,{type:'END_MONTH',requestId:'finish-1'});assert.equal(r2.duplicate,true);assert.equal(r2.state.history.length,1)});
T('Nächster Monat nach Bericht',()=>{let s=doCmd(fullMonth(),'NEXT_MONTH');assert.equal(s.month,2);assert.equal(s.actionDaysUsed,0);assert.equal(s.phase,'TURN_ACTIVE')});
T('Ölangebot bleibt nach Monatsabschluss nicht gebunden',()=>{let s=fullMonth();assert.equal(s.preparedMilli,0);assert.equal(s.order,null)});
T('Nicht gebundene Lieferung stornierbar, Transportkosten bleiben',()=>{let s=toWell();s=doCmd(s,'PUMP');s=doCmd(s,'TRANSPORT');const cash=s.cashCent;s=doCmd(s,'CANCEL_SHIPMENT');assert.equal(s.cashCent,cash);assert.equal(s.inventoryMilli,100000);assert.equal(s.preparedMilli,0)});
T('Gebundenes Angebot nicht rückgängig',()=>{let s=toWell();s=doCmd(s,'PUMP');s=doCmd(s,'TRANSPORT');s=doCmd(s,'OFFER');fails(s,'CANCEL_SHIPMENT',/bindendes/)});
T('Rettung bei zu geringer Liquidität',()=>{let s=E.fresh();s.cashCent=0;s=doCmd(s,'END_MONTH');assert.equal(s.phase,'RESCUE');assert.equal(s.monthReport.criticalOutstandingCent,90000)});
T('Rettungskredit bucht Schuld und Zahlung',()=>{let s=E.fresh();s.cashCent=0;s=doCmd(s,'END_MONTH');s=doCmd(s,'RESCUE_LOAN');assert.equal(s.phase,'MONTH_REPORT');assert.equal(s.debtCent,4000000);assert.equal(s.cashCent,4000000-90000);assert.equal(s.obligations[0].paidCent,90000)});
T('Kredit nur einmal je Generation',()=>{let s=E.fresh();s.cashCent=0;s=doCmd(s,'END_MONTH');s=doCmd(s,'RESCUE_LOAN');s.phase='RESCUE';fails(s,'RESCUE_LOAN',/bereits/)});
T('Sanierungsneustart kein doppeltes Eigenkapital',()=>{let s=E.fresh();s.cashCent=0;s=doCmd(s,'END_MONTH');s.awards=['M-TEST'];s=doCmd(s,'RESTART');assert.equal(s.cashCent,15000000);assert.equal(s.debtCent,0);assert.equal(s.generation,2);assert.deepEqual(s.awards,['M-TEST']);assert.equal(s.obligations.length,0)});
T('Savegame-Roundtrip',()=>{let s=fullMonth();assert.deepEqual(JSON.parse(JSON.stringify(s)),s);assert.equal(E.validate(JSON.parse(JSON.stringify(s))),true)});
T('Beschädigter Spielstand blockiert',()=>{let s=E.fresh();s.inventoryMilli=999999;assert.throws(()=>E.validate(s),/Tankkapazität/)});
T('Unbekanntes Profil blockiert',()=>{let s=E.fresh();s.ruleset='c64-original';assert.throws(()=>E.validate(s),/Regelprofil/)});
T('Hundert Monate ohne doppelte Monatsendbuchung',()=>{let s=E.fresh();for(let i=0;i<100;i++){s=doCmd(s,'END_MONTH');if(s.phase==='RESCUE')s=doCmd(s,'RESTART');s=doCmd(s,'NEXT_MONTH');}assert.equal(s.month,101);assert.equal(s.history.filter(x=>x.soldMilli!==undefined).length,100);assert.equal(E.validate(s),true)});
let passed=0;
for (const [name,fn] of tests){try{fn();console.log('OK',name);passed++;}catch(e){console.error('FEHLER',name,e.stack);process.exitCode=1;}}
console.log(`${passed}/${tests.length} Fachtests bestanden.`);
