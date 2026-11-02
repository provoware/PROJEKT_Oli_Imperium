'use strict';
const assert=require('node:assert/strict');
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_strategy_engine.js');require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');require('./src/strategy_ai_v192.js');require('./src/strategy_logistics_v193.js');
const E=globalThis.OliV082,A=globalThis.PPLogisticsAI;
let count=0,seq=0;function test(name,fn){try{fn();console.log('PASS',++count,name)}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;throw e}}
function send(s,type,id='H1',extra={}){return E.transition(s,{type,companyId:id,requestId:'QA193-'+(++seq),...extra}).state}
function advance(s){for(let k=0;k<20&&s.phase==='TURN';k++){const f=s.companies[s.turnIndex];assert.equal(f.type,'human');s=send(s,'END_TURN',f.id)}for(let k=0;k<10&&s.phase==='RESCUE';k++){let id=s.rescueIds[0];try{s=send(s,'RESCUE_LOAN',id)}catch(_){s=send(s,'RESTART',id)}}assert.equal(s.phase,'REPORT');return send(s,'NEXT_MONTH')}
function fixture(){const s=E.fresh({humans:1,ais:2,seed:'V193-FIXTURE'});const c=s.claims['BRANDENBURG-1'];c.owner='A2';c.drilled=true;c.reserveMilli=510000;c.inventoryMilli=50000;s.companies[2].cashCent=60000000;return s}
test('Separate KI-Logistik ist geladen',()=>assert.equal(A.version,'1.9.3'));
test('Bewertung verändert keine Eingabe',()=>{const s=fixture(),raw=JSON.stringify(s);A.candidates(s,'A2');assert.equal(JSON.stringify(s),raw)});
test('Öl- und Produktionen bleiben valide',()=>{const s=fixture();E.validate(s);assert.ok(A.candidates(s,'A2').some(x=>x.type==='REFINERY_BUILD'))});
test('Fabrikinvestition und Vertrieb über Originalaktion verarbeitet',()=>{const s=fixture(),out=A.prepare(s).state;E.validate(out);assert.ok(out.refinery.plants.A2.BRANDENBURG.built);assert.ok(out.refinery.plants.A2.BRANDENBURG.route);assert.ok(out.transport.firms.A2.BRANDENBURG.enabled);assert.equal(s.refinery.plants.A2.BRANDENBURG.built,false)});
test('Bau belastet Geld einmal und dokumentiert Aktionen',()=>{const s=fixture(),out=A.prepare(s).state;const ledger=out.companies[2].ledger;assert.equal(ledger.filter(x=>x.code==='RAFFINERIE_BAU').length,1);assert.ok(out.events.some(e=>e.type==='KI_LOGISTIK'))});
test('KI macht ökonomische Transportangebote im Folgemonat',()=>{let s=fixture();for(let i=0;i<6;i++){s=advance(s);E.validate(s)}const events=s.events.filter(e=>e.type==='KI_LOGISTIK');assert.ok(events.length>=3);console.log('ACTIONS',Object.fromEntries([...new Set(events.map(x=>x.action))].map(k=>[k,events.filter(x=>x.action===k).length])))});
test('Original-Basis-KI ist abschaltbar und neue Logistik reagiert darauf',()=>{const s=fixture(),old=globalThis.PPStrategicAI.enabled;globalThis.PPStrategicAI.enabled=false;try{const out=send(s,'END_TURN');assert.equal(out.events.filter(x=>x.type==='KI_LOGISTIK').length,0)}finally{globalThis.PPStrategicAI.enabled=old}});
test('Exakt gleicher Beginn führt zum gleichen Ergebnis',()=>{const s=fixture();const c={type:'END_TURN',companyId:'H1',requestId:'SAME-193'};assert.deepEqual(E.transition(s,c).state,E.transition(s,c).state)});
test('Doppeltes Monatsende bewirkt keinen zweiten KI-Einsatz',()=>{let s=fixture(),cmd={type:'END_TURN',companyId:'H1',requestId:'ONCE-193'};s=E.transition(s,cmd).state;const again=E.transition(s,cmd);assert.equal(again.duplicate,true);assert.deepEqual(again.state,s)});
test('Rohölreserve und Geldkonten bleiben nichtnegativ',()=>{let s=fixture();for(let i=0;i<20;i++)s=advance(s);E.validate(s);for(const f of s.companies)assert.ok(f.cashCent>=0);for(const c of Object.values(s.claims))assert.ok(c.reserveMilli>=0)});
test('Grenzfall Krisenmodus mit keinem KI-Budget',()=>{let s=fixture();s.companies[2].cashCent=0;const out=A.prepare(s).state;assert.equal(out.companies[2].cashCent,0);E.validate(out)});
test('Volle Lager erzeugen keine Waren aus dem Nichts',()=>{let s=fixture(),sum=x=>Object.values(x.claims).reduce((v,c)=>v+c.inventoryMilli,0);const before=sum(s);s=A.prepare(s).state;assert.ok(sum(s)<=before);E.validate(s)});
test('Logistikplanung schützt alte menschliche Partien',()=>{let s=E.fresh({humans:2,ais:0});const old=JSON.stringify(s);s=send(s,'END_TURN');assert.equal(s.events.some(x=>x.type==='KI_LOGISTIK'),false);assert.ok(JSON.stringify(s)!==old)});
test('Altes Spielstandformat ist weiterhin validierbar',()=>{const s=fixture();delete s.publicNetwork; // legacy network upgrade may be inserted by action wrappers
E.validate(s)});

function competitive(){const s=E.fresh({humans:1,ais:2,seed:'V193-NEUTRAL'});
 for(const [id,claim] of [['A1','BRANDENBURG-1'],['A2','BRANDENBURG-2']]){
  const c=s.claims[claim];c.owner=id;c.drilled=true;c.inventoryMilli=20000;c.reserveMilli=500000;
  s.companies.find(f=>f.id===id).cashCent=50000000;
  const p=s.refinery.plants[id].BRANDENBURG;p.built=true;p.route=true;
  const g=s.transport.firms[id].BRANDENBURG;g.enabled=true;g.marketMilli=18000;
 }
 E.validate(s);return s}
test('Überregionaler Vorteil ist um Frachtkosten bereinigt',()=>{const s=competitive();assert.ok(A.margin(s,'BRANDENBURG','NORD')>0);assert.ok(A.candidates(s,'A1').some(x=>x.type==='PUBLIC_CONNECT'))});
test('Zwei Firmen buchen unabhängig und gemeinsame Strecke wird nicht überzogen',()=>{
 let s=competitive();const p=A.prepare(s);s=p.state;const q=s.publicNetwork.queued;
 assert.ok(q.filter(x=>x.companyId==='A1').length>0);assert.ok(q.filter(x=>x.companyId==='A2').length>0);
 s=send(s,'END_TURN');assert.equal(s.phase,'REPORT');const freight=s.lastReport.publicNetwork.freight;
 const route=freight.filter(x=>x.to==='NORD');assert.ok(route.length>=2);const sum=route.reduce((x,v)=>x+v.acceptedMilli,0);assert.ok(sum<=18000);
 assert.ok(route.some(x=>x.acceptedMilli>0));E.validate(s);
});
test('Anlieferung und späterer Verkauf werden von KI selbst disponiert',()=>{
 let s=competitive();s=A.prepare(s).state;s=send(s,'END_TURN');s=send(s,'NEXT_MONTH');
 for(let i=0;i<3;i++)s=advance(s);
 const ev=s.events.filter(x=>x.type==='KI_LOGISTIK').map(x=>x.action);
 assert.ok(ev.includes('PUBLIC_QUEUE'));assert.ok(ev.includes('PUBLIC_OFFER'));E.validate(s);
});
test('Krisen: Preisuntergrenze und Nachfrageschock stoppen unrentables Wachstum',()=>{
 let s=competitive();s.prices.BRANDENBURG=Math.round(E.REGIONS.find(r=>r.id==='BRANDENBURG').price*.4);
 s.prices.NORD=Math.round(E.REGIONS.find(r=>r.id==='NORD').price*.4);s.demand.BRANDENBURG=0;s.demand.NORD=0;
 E.validate(s);let x=A.prepare(s).state;E.validate(x);
 for(const f of x.companies){assert.ok(f.cashCent>=0&&f.daysUsed<=30)}
});
test('Rettungsfall mit Null-Guthaben: KI kann keine Kredite vervielfältigen',()=>{
 let s=competitive();s.companies.find(x=>x.id==='A1').cashCent=0;
 s=A.prepare(s).state;E.validate(s);
 assert.equal(s.companies.find(x=>x.id==='A1').cashCent,0);
});

console.log('ERGEBNIS',count,'neue V1.9.3 Fachtests bestanden');
