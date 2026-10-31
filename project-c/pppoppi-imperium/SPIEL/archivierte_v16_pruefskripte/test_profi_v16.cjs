const assert=require('node:assert/strict');
const path=require('node:path');
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_engine.js');const baseline=globalThis.OliV082;
const original=baseline.fresh({humans:1,ais:1,seed:'V16-TEST'});
const originalSnapshot=JSON.stringify(original);
require('./src/profi_economy.js');const E=globalThis.OliV082;
let count=0;const test=(title,fn)=>{fn();count++;console.log('OK',count,title)};
let s=E.fresh({humans:1,ais:1,seed:'V16-TEST'});
const c='BERLIN-1';let seq=0;
function send(type,claimId=c,extra={}){let res=E.transition(s,{type,companyId:'H1',claimId,requestId:'V16-'+(++seq),...extra});s=res.state;return res}
test('Alte V0.8.2-Startdaten unverändert',()=>assert.equal(JSON.stringify(original),originalSnapshot));
test('Erweiterte Startdaten gültig',()=>E.validate(s));
send('SURVEY');send('BUY');send('DRILL');send('PUMP');
test('Eigenes erschlossenes Feld und Rohöl',()=>{assert.equal(s.claims[c].owner,'H1');assert.ok(s.claims[c].inventoryMilli>0)});
// Time/cash setup for deterministic independent unit scenarios
function stateWithFunds(){const x=structuredClone(s);x.companies[0].daysUsed=0;x.companies[0].cashCent=10_000_000;x.claims[c].inventoryMilli=50000;x.claims[c].preparedMilli=0;x.claims[c].order=false;return x;}
s=stateWithFunds();
test('Raffineriebau entfernt exakt Geld und vier Tage',()=>{const before=structuredClone(s);send('REFINERY_BUILD');assert.equal(s.companies[0].cashCent,before.companies[0].cashCent-3000000);assert.equal(s.companies[0].daysUsed,before.companies[0].daysUsed+4)});

test('Raffinerie ohne Doppelbau',()=>{const saved=JSON.stringify(s);assert.throws(()=>send('REFINERY_BUILD'),/bereits/);assert.equal(JSON.stringify(s),saved)});
test('Rohöl wird in 90 Prozent Fertigprodukt umgewandelt',()=>{const b=s.claims[c].inventoryMilli;send('REFINE_BATCH');assert.equal(s.claims[c].inventoryMilli,b-10000);assert.equal(s.refinery.plants.H1.BERLIN.productMilli,9000)});
test('Absatz ohne Route gesperrt und atomar',()=>{const before=JSON.stringify(s);assert.throws(()=>send('REFINED_SELL'),/Route/);assert.equal(JSON.stringify(s),before)});
test('Vertriebsroute lässt sich bauen',()=>{send('ROUTE_BUILD');assert.equal(s.refinery.plants.H1.BERLIN.route,true)});
test('Verkauf senkt Bestand und erhöht Kasse exakt einmal',()=>{const b=s.companies[0].cashCent;const res=send('REFINED_SELL');assert.ok(s.companies[0].cashCent>b);assert.equal(s.refinery.plants.H1.BERLIN.productMilli,0);assert.equal(s.refinery.salesMilli.BERLIN,9000);const d=E.transition(s,{type:'REFINED_SELL',companyId:'H1',claimId:c,requestId:s.processedIds.at(-1)});assert.equal(d.duplicate,true);assert.deepEqual(d.state,s)});
test('Beschädigtes Produktlager zurückgewiesen',()=>{const bad=structuredClone(s);bad.refinery.plants.H1.BERLIN.productMilli=-1;assert.throws(()=>E.validate(bad),/Negative/)});
test('Monatswechsel setzt Quote zurück',()=>{let x=structuredClone(s);x.phase='REPORT';x.lastReport={month:x.month,companies:[],regions:Object.fromEntries(E.REGIONS.map(r=>[r.id,{soldMilli:0,demandMilli:1000}]))};x.companies[0].daysUsed=0;let y=E.transition(x,{type:'NEXT_MONTH',requestId:'new-month-check',companyId:'H1'}).state;assert.equal(y.refinery.salesMilli.BERLIN,0);assert.equal(y.refinery.plants.H1.BERLIN.processedMilli,0)});
test('Legacy-Spielstand ohne Raffineriedaten lesbar',()=>E.validate(original));
test('Unzulässige Aktion mit fehlendem Rohöl verändert nichts',()=>{const old=structuredClone(s);s.claims[c].inventoryMilli=0;const save=JSON.stringify(s);assert.throws(()=>send('REFINE_BATCH'),/Rohöl/);assert.equal(JSON.stringify(s),save);s=old});
test('Datenänderung erhält integer Ledger',()=>{const f=s.companies[0];assert.ok(f.ledger.some(x=>x.code==='RAFFINIERT_VERKAUF'));assert.ok(f.ledger.every(x=>Number.isSafeInteger(x.deltaCent)))});
console.log('TOTAL',count);
