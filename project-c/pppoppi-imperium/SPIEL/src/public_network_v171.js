/* PPPOPPI Imperium V1.7.1 - public multi-region network, fictional Berlin adaptation.
   Each route capacity is SHARED among all companies. No C64 authenticity claim.
   Standalone additive layer; original V0.8.2/V1.6.1/V1.7 modules untouched. */
(function(root){'use strict';
const E=root.OliV082,OLD=root.OliV07;
if(!E||!root.PPTransport||!OLD)throw Error('V1.7 erforderlich');
const prev={fresh:E.fresh.bind(E),validate:E.validate.bind(E),transition:E.transition.bind(E)};
const cp=x=>JSON.parse(JSON.stringify(x));const check=(v,m)=>{if(!v)throw Error(m)};
const nat=n=>Number.isSafeInteger(n)&&n>=0;
const V='pppoppi.publicnetwork/1.0',RATE=2800,CONNECT=200000,REPAIR=600000,TRADE_DEMAND=18000;
const ROUTES=Object.freeze([
 {id:'B-BB',from:'BERLIN',to:'BRANDENBURG',capacityMilli:24000,months:1},
 {id:'BB-B',from:'BRANDENBURG',to:'BERLIN',capacityMilli:24000,months:1},
 {id:'BB-N',from:'BRANDENBURG',to:'NORD',capacityMilli:18000,months:1},
 {id:'N-BB',from:'NORD',to:'BRANDENBURG',capacityMilli:18000,months:1}
]);
const validRegion=id=>E.REGIONS.some(r=>r.id===id);
function routeFor(from,to){const q=[[from,[]]],visited=new Set();while(q.length){const [at,path]=q.shift();if(at===to)return path; if(visited.has(at))continue;visited.add(at);for(const e of ROUTES.filter(e=>e.from===at).sort((a,b)=>a.id.localeCompare(b.id)))q.push([e.to,[...path,e.id]]);}return null;}
const orderKey=(f,t)=>f+'>'+t;
const freight=(qty,path)=>Math.floor((qty*RATE*path.length+500)/1000);
function empty(s){return {version:V,connections:Object.fromEntries(s.companies.map(f=>[f.id,[]])),links:Object.fromEntries(ROUTES.map(e=>[e.id,{downUntil:0}])),queued:[],inTransit:[],received:Object.fromEntries(s.companies.map(f=>[f.id,Object.fromEntries(E.REGIONS.map(r=>[r.id,0]))])),offers:[],monthly:[],nextId:0};}
function upgrade(s){if(!s.publicNetwork)s.publicNetwork=empty(s);return s.publicNetwork;}
function validate(s){prev.validate(s);if(!s.publicNetwork)return true;const p=s.publicNetwork;
check(p.version===V&&nat(p.nextId)&&p.nextId<=100000000,'Öffentliches Netzformat unzulässig');
check(p.connections&&p.links&&p.received&&Array.isArray(p.queued)&&Array.isArray(p.inTransit)&&Array.isArray(p.offers)&&Array.isArray(p.monthly),'Öffentliches Netz unvollständig');
check(p.queued.length<=10000&&p.inTransit.length<=10000&&p.offers.length<=10000&&p.monthly.length<=120,'Netzregister zu groß');
const firmIds=s.companies.map(f=>f.id), seen=new Set();
for(const e of ROUTES){check(p.links[e.id]&&nat(p.links[e.id].downUntil),'Öffentliche Strecke beschädigt');}
for(const id of firmIds){check(Array.isArray(p.connections[id])&&p.connections[id].length<=8&&new Set(p.connections[id]).size===p.connections[id].length,'Anschlussregister beschädigt');for(const key of p.connections[id]){const [a,b]=key.split('>');check(routeFor(a,b)&&a!==b,'Ungültiger Netzanschluss');}
for(const r of E.REGIONS)check(nat(p.received[id]?.[r.id]),'Überregionales Eingangslager beschädigt');}
for(const list of [p.queued,p.inTransit,p.offers])for(const x of list){check(x&&typeof x.id==='string'&&!seen.has(x.id),'Doppelte Transportkennung');seen.add(x.id);check(firmIds.includes(x.companyId)&&nat(x.qtyMilli)&&x.qtyMilli>0&&validRegion(x.to),'Ungültiger öffentlicher Auftrag');if(x.from!==undefined)check(validRegion(x.from)&&x.from!==x.to&&Array.isArray(x.path)&&x.path.length>0&&x.path.every(id=>ROUTES.some(e=>e.id===id)),'Streckenfolge beschädigt');if(x.quotedFreight!==undefined)check(nat(x.quotedFreight),'Frachtbetrag beschädigt');if(x.arriveMonth!==undefined)check(nat(x.arriveMonth)&&x.arriveMonth>=s.month,'Lieferdatum beschädigt');}
if(s.phase!=='TURN')check(p.queued.length===0&&p.offers.length===0,'Unerledigte Aufträge nach Monatsende');
return true;}
function debit(s,f,amount,days,code,info){check(nat(amount)&&f.cashCent>=amount,'Zu wenig Bargeld');check(nat(days)&&f.daysUsed+days<=E.CFG.monthDays,'Zu wenig Spieltage');f.cashCent-=amount;f.daysUsed+=days;f.ledger.push({id:'PN-'+s.month+'-'+s.sequence+'-'+f.ledger.length,month:s.month,code,deltaCent:-amount,info});}
function credit(s,id,amount,code,info){check(nat(amount),'Rückerstattung unzulässig');const f=s.companies.find(f=>f.id===id);check(f&&Number.isSafeInteger(f.cashCent+amount),'Geldüberlauf');f.cashCent+=amount;f.ledger.push({id:'PNC-'+s.month+'-'+s.sequence+'-'+f.ledger.length,month:s.month,code,deltaCent:amount,info});}
function event(s,type,message){s.events.push({month:s.month,type:'PUBLIC_'+type,message,source:'berlin-eigenentwicklung'});}
function auction(s){const p=upgrade(s),result={month:s.month,capacity:{},freight:[],productMarket:{}};
let remain=Object.fromEntries(ROUTES.map(e=>[e.id,(p.links[e.id].downUntil>s.month)?0:e.capacityMilli]));
const orders=p.queued.map(o=>({...o,left:o.qtyMilli,allocated:0}));
const companyIds=[...new Set(orders.map(x=>x.companyId))].sort();const rotated=companyIds.length?[...companyIds.slice(s.month%companyIds.length),...companyIds.slice(0,s.month%companyIds.length)]:[];
// Max-min fair by company: one 0.1-barrel allocation per firm per pass; deterministic, independent of click order.
while(true){let made=false;for(const id of rotated){const eligible=orders.filter(o=>o.companyId===id&&o.left>0&&o.path.every(e=>remain[e]>0)).sort((a,b)=>orderKey(a.from,a.to).localeCompare(orderKey(b.from,b.to))||a.id.localeCompare(b.id));const o=eligible[0];if(!o)continue;const step=Math.min(100,o.left,...o.path.map(k=>remain[k]));if(step<=0)continue;o.left-=step;o.allocated+=step;for(const k of o.path)remain[k]-=step;made=true;}if(!made)break;}
for(const e of ROUTES)result.capacity[e.id]={usedMilli:e.capacityMilli-remain[e.id]-(p.links[e.id].downUntil>s.month?e.capacityMilli:0),capacityMilli:e.capacityMilli,downUntil:p.links[e.id].downUntil};
for(const o of orders){const failed=o.qtyMilli-o.allocated;
if(failed){s.transport.firms[o.companyId][o.from].marketMilli+=failed;credit(s,o.companyId,freight(failed,o.path),'FRACHT_RUECKGABE','Nicht zugeteilte Transportkapazität');}
if(o.allocated){const arrive=s.month+o.path.reduce((x,id)=>x+ROUTES.find(e=>e.id===id).months,0);p.inTransit.push({id:'PUB-TRANS-'+(++p.nextId),companyId:o.companyId,from:o.from,to:o.to,qtyMilli:o.allocated,path:o.path,arriveMonth:arrive});}
result.freight.push({id:o.id,companyId:o.companyId,from:o.from,to:o.to,requestedMilli:o.qtyMilli,acceptedMilli:o.allocated,returnedMilli:failed,freightCent:freight(o.allocated,o.path)});
}
p.queued=[];
// Separate export exchange: does not consume or double-count the existing local refinery market demand.
for(const r of E.REGIONS){const grouped={};for(const o of p.offers.filter(o=>o.to===r.id))grouped[o.companyId]=(grouped[o.companyId]||0)+o.qtyMilli;const ids=Object.keys(grouped).sort();const alloc=OLD.allocLargestRemainder(ids.map(id=>({id,qty:grouped[id]})),TRADE_DEMAND);const lines={};const priceCent=Math.floor((s.prices[r.id]*115+50)/100);
for(const id of ids){const sold=alloc[id]||0,returned=grouped[id]-sold;check(sold>=0&&returned>=0,'Fehler im Außenmarkt');p.received[id][r.id]+=returned;const cents=Math.floor((sold*priceCent+500)/1000);if(cents){credit(s,id,cents,'AUSSENMARKT','Überregionaler Handelsplatz '+r.id);const f=s.companies.find(f=>f.id===id);f.monthRevenueCent+=cents;f.monthSoldMilli+=sold;}lines[id]={offeredMilli:grouped[id],soldMilli:sold,returnedMilli:returned,revenueCent:cents};}
result.productMarket[r.id]={demandMilli:TRADE_DEMAND,priceCent,allocations:lines};}
p.offers=[];p.monthly.push(result);p.monthly=p.monthly.slice(-120);event(s,'ABRECHNUNG','Öffentliche Strecken fair verteilt und überregionalen Handel abgerechnet');return result;}
function fresh(o){const s=prev.fresh(o);s.publicNetwork=empty(s);validate(s);return s;}
function transition(input,cmd){validate(input);check(cmd&&typeof cmd.type==='string'&&typeof cmd.requestId==='string'&&cmd.requestId.length>=3,'Befehl ungültig');if(input.processedIds.includes(cmd.requestId))return {state:cp(input),duplicate:true};
const types=['PUBLIC_CONNECT','PUBLIC_QUEUE','PUBLIC_OFFER','PUBLIC_REPAIR'];
if(!types.includes(cmd.type)){
let work=cp(input);upgrade(work);let report=null;
if(cmd.type==='END_TURN'&&work.phase==='TURN'&&!work.minigame){const f=work.companies[work.turnIndex];if(f?.id===cmd.companyId&&f.type==='human'&&work.companies.slice(work.turnIndex+1).every(x=>x.type==='ai'))report=auction(work);}
const out=prev.transition(work,cmd);if(out.duplicate)return out;const s=out.state; s.publicNetwork=cp(work.publicNetwork);
if(report&&s.phase==='REPORT'&&s.lastReport){s.lastReport.publicNetwork=cp(report);if(s.reports.length)s.reports[s.reports.length-1].publicNetwork=cp(report);}
if(s.month>input.month){const p=s.publicNetwork;const arrivals=p.inTransit.filter(x=>x.arriveMonth<=s.month);p.inTransit=p.inTransit.filter(x=>x.arriveMonth>s.month);for(const x of arrivals){p.received[x.companyId][x.to]+=x.qtyMilli;event(s,'ANKUNFT',x.qtyMilli/1000+' bbl in '+x.to+' angeliefert');}
// Global disruptions shared by all companies: first public link every 8th month, repair affects all.
if(s.month%8===0){p.links['B-BB'].downUntil=s.month+2;event(s,'SPERRUNG','Öffentliche Strecke B-BB bis Monat '+(s.month+2)+' gesperrt');}}
if(cmd.type==='RESTART'&&cmd.companyId){const p=s.publicNetwork;p.connections[cmd.companyId]=[];for(const r of E.REGIONS)p.received[cmd.companyId][r.id]=0;p.queued=p.queued.filter(x=>x.companyId!==cmd.companyId);p.offers=p.offers.filter(x=>x.companyId!==cmd.companyId);p.inTransit=p.inTransit.filter(x=>x.companyId!==cmd.companyId);}
validate(s);return {...out,state:s};}
check(input.phase==='TURN'&&!input.minigame,'Nur während des Firmenzugs');const s=cp(input),p=upgrade(s),f=s.companies[s.turnIndex];check(f&&f.id===cmd.companyId&&f.type==='human','Falscher aktiver Spieler');
if(cmd.type==='PUBLIC_REPAIR'){check(ROUTES.some(r=>r.id===cmd.link),'Unbekannte öffentliche Strecke');check(p.links[cmd.link].downUntil>s.month,'Öffentliche Strecke nicht gesperrt');debit(s,f,REPAIR,2,'PUBLIC_REPAIR',cmd.link);p.links[cmd.link].downUntil=0;event(s,'REPARATUR',f.name+' ließ '+cmd.link+' reparieren');}
else{const from=cmd.from,to=cmd.to,path=routeFor(from,to);check(validRegion(from)&&validRegion(to)&&from!==to&&path?.length,'Keine gültige Verbindung');const key=orderKey(from,to);const t=s.transport.firms[f.id][from];check(t?.enabled,'Zuerst regionales Transportnetz aktivieren');
if(cmd.type==='PUBLIC_CONNECT'){check(!p.connections[f.id].includes(key),'Anschluss bereits vorhanden');debit(s,f,CONNECT,1,'PUBLIC_CONNECT',key);p.connections[f.id].push(key);p.connections[f.id].sort();event(s,'ANSCHLUSS',f.name+' erhielt Netzzugang '+key);}
else{check(p.connections[f.id].includes(key),'Öffentlicher Streckenzugang fehlt');
if(cmd.type==='PUBLIC_QUEUE'){const q=cmd.qtyMilli??9000;check(nat(q)&&q>=1000&&q<=18000&&q%1000===0,'Transportmenge 1–18 ganze Barrel');check(t.marketMilli>=q,'Nicht genügend Ware im regionalen Marktlager');const fee=freight(q,path);debit(s,f,fee,1,'PUBLIC_FREIGHT_HOLD',key);t.marketMilli-=q;p.queued.push({id:'PUB-ORDER-'+(++p.nextId),companyId:f.id,from,to,path,qtyMilli:q,quotedFreight:fee,month:s.month});event(s,'VORMERKUNG',f.name+': '+q/1000+' bbl '+key);}
else if(cmd.type==='PUBLIC_OFFER'){const q=cmd.qtyMilli??9000;check(nat(q)&&q>=1000&&q<=18000&&q%1000===0,'Marktmenge 1–18 ganze Barrel');check(p.received[f.id][to]>=q,'Nicht genug angelieferte Ware');check(f.daysUsed+1<=E.CFG.monthDays,'Nicht genügend Spieltage');f.daysUsed++;p.received[f.id][to]-=q;p.offers.push({id:'PUB-OFFER-'+(++p.nextId),companyId:f.id,to,qtyMilli:q,month:s.month});event(s,'ANGEBOT',q/1000+' bbl im Außenmarkt '+to+' vorgemerkt');}
}}
s.sequence++;s.processedIds.push(cmd.requestId);validate(s);return {state:s,duplicate:false};}
E.fresh=fresh;E.validate=validate;E.transition=transition;
root.PPPublicNetwork={version:V,ROUTES,CONNECT,RATE,TRADE_DEMAND,routeFor,freight,upgrade,view:s=>s.publicNetwork||empty(s),validate};
if(typeof module==='object'&&module.exports)module.exports=root.PPPublicNetwork;
})(typeof globalThis!=='undefined'?globalThis:this);
