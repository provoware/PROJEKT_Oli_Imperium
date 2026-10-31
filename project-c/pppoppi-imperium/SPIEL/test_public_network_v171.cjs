'use strict';
const assert=require('node:assert/strict');for(const file of ['v07_engine','v08_engine','v082_engine','profi_economy','logistics_v17','public_network_v171'])require('./src/'+file+'.js');
const E=globalThis.OliV082,P=globalThis.PPPublicNetwork;let serial=0,pCount=0;
const go=(s,type,id='H1',args={})=>E.transition(s,{type,companyId:id,requestId:'PUB-TEST-'+(++serial),claimId:'BERLIN-1',...args}).state;
const test=(desc,fn)=>{try{fn();pCount++;console.log('PASS',pCount,desc)}catch(e){console.error('FAIL',desc);throw e}};
function init(humans=2){let s=E.fresh({humans,ais:0,seed:'V171-REFERENCE'});for(let i=1;i<=humans;i++){const id='H'+i;for(const r of E.REGIONS){const plant=s.refinery.plants[id][r.id];plant.built=true;plant.route=true;s.transport.firms[id][r.id].enabled=true;s.transport.firms[id][r.id].marketMilli=30000;}s.companies.find(f=>f.id===id).cashCent=20000000;}E.validate(s);return s;}
function connect(s,id='H1',a='BERLIN',b='BRANDENBURG'){return go(s,'PUBLIC_CONNECT',id,{from:a,to:b})}
function queue(s,id='H1',a='BERLIN',b='BRANDENBURG',qty=18000){return go(s,'PUBLIC_QUEUE',id,{from:a,to:b,qtyMilli:qty})}
function close(s){for(let i=0;i<s.companies.length;i++)s=go(s,'END_TURN',s.companies[i].id);assert.equal(s.phase,'REPORT');return s}
function next(s){s=go(s,'NEXT_MONTH',s.companies[0].id);assert.equal(s.phase,'TURN');return s}
test('Neuspiel mit eindeutigem Netzschema',()=>{assert.equal(init().publicNetwork.version,'pppoppi.publicnetwork/1.0')});
test('V1.7-Spielstand ohne öffentlichen Netzblock bleibt gültig',()=>{let s=init();delete s.publicNetwork;E.validate(s);s=go(s,'SURVEY','H1',{claimId:'BERLIN-2'});assert.ok(s.publicNetwork)});
test('Zwei-Haltestellen-Route Berlin über Brandenburg an Nordküste',()=>{assert.deepEqual(P.routeFor('BERLIN','NORD'),['B-BB','BB-N'])});
test('Unbekannte und identische Regionen werden verweigert',()=>{let s=init();assert.throws(()=>connect(s,'H1','NORD','NORD'));assert.throws(()=>connect(s,'H1','JUPITER','BERLIN'))});
test('Zugang einmal bezahlen; weitere Buchung derselben Strecke gesperrt',()=>{let s=init(),before=s.companies[0].cashCent;s=connect(s);assert.equal(before-s.companies[0].cashCent,P.CONNECT);assert.throws(()=>connect(s),/bereits/)});
test('Ohne regionales Ausgangsnetz keine Fremdstrecke',()=>{let s=init();s.transport.firms.H1.BERLIN.enabled=false;assert.throws(()=>connect(s),/aktivieren/)});
test('Vormerkung reserviert Ware und volle Fracht genau einmal',()=>{let s=connect(init()),a=s.companies[0].cashCent;s=queue(s);assert.equal(s.transport.firms.H1.BERLIN.marketMilli,12000);assert.equal(a-s.companies[0].cashCent,P.freight(18000,['B-BB']))});
test('Fehlender Zugang und Mengenüberschuss verhindern jede Buchung',()=>{let s=init(),str=JSON.stringify(s);assert.throws(()=>queue(s),/zugang fehlt/i);assert.equal(str,JSON.stringify(s));s=connect(s);assert.throws(()=>queue(s,'H1','BERLIN','BRANDENBURG',40000));});
test('Mehrspieler teilen 24 Barrel öffentliches Verkehrsvolumen hälftig',()=>{let s=init();s=connect(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');s=go(s,'END_TURN','H2');s=next(s); // wrong: H1 did not queue
assert.equal(s.publicNetwork.received.H2.BRANDENBURG,18000)});
test('Gemeinsame Kanten verteilen genau 12/12 Barrel bei identischen Angeboten',()=>{let s=connect(init());s=queue(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');s=closeFromH2(s);const records=s.lastReport.publicNetwork.freight;assert.deepEqual(records.map(r=>r.acceptedMilli).sort(),[12000,12000]);assert.equal(records.reduce((t,r)=>t+r.acceptedMilli,0),24000);assert.equal(s.transport.firms.H1.BERLIN.marketMilli,18000);assert.equal(s.transport.firms.H2.BERLIN.marketMilli,18000)});
function closeFromH2(s){return go(s,'END_TURN','H2')}
test('Zuteilung unabhängig von Eingabereihenfolge/Spielzug',()=>{let s=connect(init());s=queue(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');s=closeFromH2(s);assert.equal(s.lastReport.publicNetwork.freight.find(x=>x.companyId==='H1').acceptedMilli,12000);assert.equal(s.lastReport.publicNetwork.freight.find(x=>x.companyId==='H2').acceptedMilli,12000)});
test('Bei 18 Barrel je Firma gehen abgewiesene 6 Barrel und Teilfracht zurück',()=>{let s=connect(init());s=queue(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');s=closeFromH2(s);for(const o of s.lastReport.publicNetwork.freight)assert.equal(o.returnedMilli,6000);assert.equal(s.publicNetwork.queued.length,0)});
test('Zwei Firmen blockieren gleiche globale Kante und können nicht 36 Barrel verschicken',()=>{let s=connect(init());s=queue(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');s=closeFromH2(s);assert.equal(s.lastReport.publicNetwork.capacity['B-BB'].usedMilli,24000)});
test('Monatswechsel transportiert Ware nicht vor Ankunft',()=>{let s=queue(connect(init()));s=close(s);assert.equal(s.publicNetwork.received.H1.BRANDENBURG,0);s=next(s);assert.equal(s.publicNetwork.received.H1.BRANDENBURG,18000)});
test('Zwei Kanten: Berlin-Nord benötigt zwei Monate',()=>{let s=queue(connect(init(), 'H1','BERLIN','NORD'),'H1','BERLIN','NORD');s=close(s);s=next(s);assert.equal(s.publicNetwork.received.H1.NORD,0);s=close(s);s=next(s);assert.equal(s.publicNetwork.received.H1.NORD,18000)});
test('Gemeinsamer Engpass über Kettenroute begrenzt B-BB und BB-N',()=>{let s=queue(connect(init(),'H1','BERLIN','NORD'),'H1','BERLIN','NORD');s=close(s);assert.equal(s.lastReport.publicNetwork.capacity['BB-N'].usedMilli,18000)});
test('Überschreibschutz: Doppelte requestId erzeugt keine zweite Queue',()=>{let s=connect(init()),cmd={type:'PUBLIC_QUEUE',requestId:'IDEMPOTENT-42',companyId:'H1',from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000};s=E.transition(s,cmd).state;assert.equal(E.transition(s,cmd).duplicate,true);assert.equal(s.publicNetwork.queued.length,1)});
test('Kein negativer Lagerbestand bei verweigerter Queue',()=>{let s=connect(init());let b=JSON.stringify(s);assert.throws(()=>queue(s,'H1','BERLIN','BRANDENBURG',40000));assert.equal(b,JSON.stringify(s))});
test('Gelieferte Ware im separaten Exportmarkt anbieten',()=>{let s=queue(connect(init()));s=close(s);s=next(s);s=go(s,'PUBLIC_OFFER','H1',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});assert.equal(s.publicNetwork.received.H1.BRANDENBURG,9000);assert.equal(s.publicNetwork.offers.length,1);s=close(s);assert.equal(s.lastReport.publicNetwork.productMarket.BRANDENBURG.allocations.H1.soldMilli,9000);});
test('Exportbörse separat vom raffinierten Regionalmarkt',()=>{let s=queue(connect(init()));s=close(s);s=next(s);s=go(s,'PUBLIC_OFFER','H1',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});s=close(s);assert.equal(s.refinery.salesMilli.BRANDENBURG,0);assert.equal(s.lastReport.publicNetwork.productMarket.BRANDENBURG.allocations.H1.soldMilli,9000)});
test('Exportbörse pro Region maximal 18 Barrel; Preis vor Gehalt gebucht',()=>{let s=queue(connect(init()));s=close(s);s=next(s);s.publicNetwork.received.H2.BRANDENBURG=18000;s=go(s,'PUBLIC_OFFER','H1',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:9000});s=go(s,'END_TURN','H1');s=connect(s,'H2','BERLIN','BRANDENBURG');s=go(s,'PUBLIC_OFFER','H2',{from:'BERLIN',to:'BRANDENBURG',qtyMilli:18000});s=closeFromH2(s);const a=s.lastReport.publicNetwork.productMarket.BRANDENBURG.allocations;assert.equal(a.H1.soldMilli+a.H2.soldMilli,18000)});
test('Speichern und Laden einer unerledigten Sendung (JSON roundtrip)',()=>{let s=queue(connect(init()));s=JSON.parse(JSON.stringify(s));E.validate(s);s=close(s);s=next(s);assert.equal(s.publicNetwork.received.H1.BRANDENBURG,18000)});
test('Manipulierte Kapazitäts-/Lagerdaten werden abgewiesen',()=>{let s=init();s.publicNetwork.received.H1.BERLIN=-1;assert.throws(()=>E.validate(s));});
test('Globale Streckensperre, Reparatur und Wiederfreigabe',()=>{let s=connect(init());s.publicNetwork.links['B-BB'].downUntil=3;s=queue(s);s=close(s);assert.equal(s.lastReport.publicNetwork.freight[0].acceptedMilli,0);s=next(s);s=go(s,'PUBLIC_REPAIR','H1',{link:'B-BB'});assert.equal(s.publicNetwork.links['B-BB'].downUntil,0);});
test('Reparatur zahlt eine Firma, Freigabe gilt für alle',()=>{let s=connect(init());s.publicNetwork.links['B-BB'].downUntil=4;s=go(s,'PUBLIC_REPAIR','H1',{link:'B-BB'});assert.equal(s.publicNetwork.links['B-BB'].downUntil,0);});
test('72 Monate ohne Verkehr laufen auch mit Modul konsistent',()=>{let s=init();for(let i=0;i<72;i++){if(s.phase==='RESCUE') {throw Error('Rettung in Testfixture nicht definiert');}s=close(s);if(s.phase==='RESCUE')throw Error('Rettung');s=next(s);}E.validate(s);assert.equal(s.month,73)});
test('Vertauschte Vormerkreihenfolge ändert Firmenzuteilung nicht',()=>{
 let s=connect(init());s=queue(s);s=go(s,'END_TURN','H1');s=connect(s,'H2');s=queue(s,'H2');
 let a=JSON.parse(JSON.stringify(s)),b=JSON.parse(JSON.stringify(s));b.publicNetwork.queued.reverse();
 const finish=x=>go(x,'END_TURN','H2').lastReport.publicNetwork.freight.reduce((z,x)=>(z[x.companyId]=(z[x.companyId]||0)+x.acceptedMilli,z),{});
 assert.deepEqual(finish(a),finish(b));
});
test('Zwei verschiedene Transportwege teilen denselben BB-N-Engpass',()=>{
 let s=connect(init(),'H1','BERLIN','NORD');s=queue(s,'H1','BERLIN','NORD',18000);s=go(s,'END_TURN','H1');
 s=connect(s,'H2','BRANDENBURG','NORD');s=queue(s,'H2','BRANDENBURG','NORD',18000);s=go(s,'END_TURN','H2');
 const f=s.lastReport.publicNetwork.freight;assert.equal(f.reduce((a,x)=>a+x.acceptedMilli,0),18000);
 assert.equal(f.find(x=>x.companyId==='H1').acceptedMilli,9000);
 assert.equal(f.find(x=>x.companyId==='H2').acceptedMilli,9000);
});
console.log('RESULT',pCount,'Tests bestanden');
