/* PPPOPPI Imperium V1.7 – optionale, nachvollziehbare Logistikkette.
   Eigenentwicklung, keine Behauptung über C64-Originalregeln.
   Nicht aktivierte Regionen behalten die gesamte V1.6.1-Funktionalität.
*/
(function(root){'use strict';
const E=root.OliV082; if(!E||!root.PPProfi)throw Error('V1.6.1 muss zuerst geladen sein');
const prevFresh=E.fresh.bind(E),prevValidate=E.validate.bind(E),prevTransition=E.transition.bind(E);
const copy=x=>JSON.parse(JSON.stringify(x));const assert=(v,m)=>{if(!v)throw Error(m)};
const num=x=>Number.isSafeInteger(x)&&x>=0;
const SCHEMA='pppoppi.transport/1.0';
const SPECS={RAW:{cap:30000,fee:1400,build:250000,days:1},PIPE:{cap:20000,fee:1800,build:450000,days:1},FINAL:{cap:20000,fee:1100,build:200000,days:1}};
const regionOK=id=>E.REGIONS.some(r=>r.id===id);
const edge=(f,r,kind,c='')=>[f,r,kind,c].join(':');
const plant=(s,id,r)=>s.refinery.plants[id]?.[r];
const fleet=(s,id,r)=>s.transport.firms[id][r];
const owned=(s,id,r)=>Object.values(s.claims).filter(c=>c.owner===id&&c.region===r&&c.drilled);
function empty(s){return {version:SCHEMA,firms:Object.fromEntries(s.companies.map(f=>[f.id,Object.fromEntries(E.REGIONS.map(r=>[r.id,{enabled:false,rawMilli:0,marketMilli:0,edges:{},log:[]}]))])),shipments:[],monthly:[],seq:0};}
function get(s){return s.transport||empty(s)}
function upgrade(s){if(!s.transport)s.transport=empty(s);return s.transport}
function allEdges(s,id,r){const g=fleet(s,id,r);const result=[];for(const c of owned(s,id,r))result.push({id:edge(id,r,'RAW',c.id),kind:'RAW',from:'tank/'+c.id,to:'plant/'+id+'/'+r,...SPECS.RAW,...g.edges[edge(id,r,'RAW',c.id)]});
 for(const kind of ['PIPE','FINAL']){const names=kind==='PIPE'?['plant/'+id+'/'+r,'hub/'+id+'/'+r]:['hub/'+id+'/'+r,'market/'+r];result.push({id:edge(id,r,kind),kind,from:names[0],to:names[1],...SPECS[kind],...g.edges[edge(id,r,kind)]});}return result;}
function validate(s){prevValidate(s);if(!s.transport)return true;const t=s.transport;assert(t.version===SCHEMA,'Transportformat ungültig');assert(t.firms&&Array.isArray(t.shipments)&&t.shipments.length<=10000,'Transportregister fehlerhaft');assert(num(t.seq),'Transportzähler ungültig');assert(Array.isArray(t.monthly)&&t.monthly.length<=120,'Transportberichte ungültig');const seen=new Set();for(const f of s.companies)for(const r of E.REGIONS){const g=t.firms[f.id]?.[r.id];assert(g&&typeof g.enabled==='boolean'&&num(g.rawMilli)&&num(g.marketMilli),'Transportlager ungültig');assert(Object.keys(g.edges).length<=30&&Array.isArray(g.log)&&g.log.length<=200,'Transportkanten beschädigt');if(g.enabled)assert(plant(s,f.id,r.id).built&&plant(s,f.id,r.id).route,'Transport ohne Raffinerie und Alt-Vertriebsweg');for(const [id,v] of Object.entries(g.edges)){assert(id.startsWith(f.id+':'+r.id+':'),'Fremde Strecke');assert(v&&typeof v.built==='boolean'&&num(v.usedMilli)&&num(v.usedMonth)&&num(v.downUntil),'Streckenzustand beschädigt');assert(v.usedMonth<=s.month&&v.usedMilli<=((id.split(':')[2] in SPECS)?SPECS[id.split(':')[2]].cap:0),'Streckenkapazität verletzt');if(id.split(':')[2]==='RAW')assert(s.claims[id.split(':').slice(3).join(':')]?.owner===f.id,'Verwaiste Claim-Strecke');}}
 for(const x of t.shipments){assert(x&&typeof x.id==='string'&&!seen.has(x.id),'Doppelte Sendung');seen.add(x.id);assert(s.companies.some(f=>f.id===x.companyId)&&regionOK(x.region),'Ungültige Firmenlieferung');assert(['RAW','PRODUCT'].includes(x.type)&&num(x.qtyMilli)&&x.qtyMilli>0&&num(x.arriveMonth)&&x.arriveMonth>=s.month,'Lieferdaten beschädigt');assert(Array.isArray(x.path)&&x.path.length>=1&&x.path.length<=3,'Lieferstrecke fehlt');}
 return true;}
function paid(s,f,cent,days,code,msg){assert(num(cent)&&num(days)&&f.cashCent>=cent,'Zu wenig Bargeld');assert(f.daysUsed+days<=E.CFG.monthDays,'Zu wenig Spieltage');f.cashCent-=cent;f.daysUsed+=days;f.ledger.push({id:`LG-${s.month}-${s.sequence}-${f.ledger.length}`,month:s.month,deltaCent:-cent,code,info:msg});}
function record(s,g,type,message){g.log.push({month:s.month,type,message});g.log=g.log.slice(-200);s.events.push({month:s.month,type:'LOGISTIK_'+type,message,source:'pppoppi-berlin'});}
function fresh(o){const s=prevFresh(o);s.transport=empty(s);validate(s);return s;}
function transition(source,cmd){validate(source);assert(cmd&&typeof cmd.type==='string'&&typeof cmd.requestId==='string'&&cmd.requestId.length>=3,'Ungültige Aktion');if(source.processedIds.includes(cmd.requestId))return {state:copy(source),duplicate:true};
 const isLocal=['NETWORK_ENABLE','NETWORK_BUILD','NETWORK_RAW','NETWORK_PRODUCT','NETWORK_REFINE','NETWORK_OFFER','NETWORK_REPAIR'].includes(cmd.type);
 if(!isLocal){const before=copy(source);upgrade(before);
  if(cmd.type==='REFINED_SELL'&&before.phase==='TURN'){const f=before.companies[before.turnIndex],r=cmd.region||before.claims[cmd.claimId]?.region;assert(!fleet(before,f.id,r)?.enabled,'Aktives Transportnetz: Verkauf nur nach Marktanlieferung');}
  if(cmd.type==='REFINE_BATCH'&&before.phase==='TURN'){const f=before.companies[before.turnIndex],r=cmd.region||before.claims[cmd.claimId]?.region;assert(!fleet(before,f.id,r)?.enabled,'Aktives Transportnetz: Verarbeitung nur aus angeliefertem Rohöl');}
  const result=prevTransition(before,cmd);const s=result.state;
  if(result.duplicate)return result;
  if(s.month>before.month){const t=upgrade(s);const arriving=t.shipments.filter(x=>x.arriveMonth<=s.month);t.shipments=t.shipments.filter(x=>x.arriveMonth>s.month);for(const x of arriving){const g=fleet(s,x.companyId,x.region);if(x.type==='RAW')g.rawMilli+=x.qtyMilli;else g.marketMilli+=x.qtyMilli;record(s,g,'ANKUNFT',x.qtyMilli/1000+' Barrel '+x.type+' in '+x.region);}
   for(const firm of Object.values(t.firms))for(const g of Object.values(firm))for(const v of Object.values(g.edges))if(v.usedMonth<s.month)v.usedMilli=0;
   // Vorhersagbare, dokumentierte Betriebsstörung; nie in alten Spielständen.
   if(s.month%6===0)for(const f of s.companies)for(const r of E.REGIONS){const g=fleet(s,f.id,r.id),id=edge(f.id,r.id,'PIPE'),v=g.edges[id];if(g.enabled&&v?.built&&v.downUntil<s.month){v.downUntil=s.month+2;record(s,g,'STOERUNG','Umschlagleitung '+r.id+' gesperrt bis M'+v.downUntil);}}
   t.monthly.push({month:s.month-1,arrivals:arriving.map(x=>x.id),pending:t.shipments.length});t.monthly=t.monthly.slice(-120);
  }
  if(cmd.type==='RESTART'&&cmd.companyId){const f=s.companies.find(x=>x.id===cmd.companyId);if(f){const t=upgrade(s);const rlist=t.firms[f.id];for(const r of E.REGIONS)rlist[r.id]={enabled:false,rawMilli:0,marketMilli:0,edges:{},log:[]};t.shipments=t.shipments.filter(x=>x.companyId!==f.id);}}
  validate(s);return {...result,state:s};}
 assert(source.phase==='TURN'&&!source.minigame,'Nur im normalen Firmenzug');const s=copy(source);upgrade(s);const f=s.companies[s.turnIndex];assert(f&&f.type==='human'&&f.id===cmd.companyId,'Nicht die aktive Firma');const r=cmd.region||s.claims[cmd.claimId]?.region;assert(regionOK(r),'Region ungültig');const g=fleet(s,f.id,r),p=plant(s,f.id,r);assert(p,'Raffinerie fehlt');
 if(cmd.type==='NETWORK_ENABLE'){assert(!g.enabled&&p.built&&p.route,'Erst Raffinerie und Vertriebsroute bauen');g.enabled=true;record(s,g,'START','Verbindliche Transportlogistik aktiviert');}
 else {assert(g.enabled,'Transportnetz zuerst aktivieren');
  if(cmd.type==='NETWORK_BUILD'){const kind=cmd.kind;assert(['RAW','PIPE','FINAL'].includes(kind),'Streckentyp ungültig');const c=kind==='RAW'?s.claims[cmd.claimId]:null;if(kind==='RAW')assert(c&&c.owner===f.id&&c.drilled&&c.region===r,'Nur eigenes erschlossenes Feld');const id=edge(f.id,r,kind,c?.id||'');assert(!g.edges[id]?.built,'Strecke bereits gebaut');paid(s,f,SPECS[kind].build,2,'STRECKENBAU',id);g.edges[id]={built:true,usedMilli:0,usedMonth:s.month,downUntil:0};record(s,g,'BAU',id);}
  else if(cmd.type==='NETWORK_REPAIR'){const id=edge(f.id,r,cmd.kind,cmd.kind==='RAW'?cmd.claimId||'':'');const v=g.edges[id];assert(v?.built&&v.downUntil>s.month,'Keine gestörte Strecke');paid(s,f,90000,2,'TRANSPORT_REPARATUR',id);v.downUntil=0;record(s,g,'REPARATUR',id);}
  else if(cmd.type==='NETWORK_RAW'||cmd.type==='NETWORK_PRODUCT'){const raw=cmd.type==='NETWORK_RAW',kind=raw?'RAW':'PIPE';const c=raw?s.claims[cmd.claimId]:null;assert(!raw||(c&&c.owner===f.id&&c.drilled&&c.region===r&&!c.burning&&!c.damaged),'Rohölquelle nicht verfügbar');const qty=cmd.qtyMilli??(raw?10000:9000);assert(num(qty)&&qty>=1000&&qty<=30000&&qty%1000===0,'Menge nur in ganzen Barrel 1–30');const ids=raw?[edge(f.id,r,'RAW',c.id)]:[edge(f.id,r,'PIPE'),edge(f.id,r,'FINAL')];const kinds=raw?['RAW']:['PIPE','FINAL'];let cost=0;for(let i=0;i<ids.length;i++){const v=g.edges[ids[i]],sp=SPECS[kinds[i]];assert(v?.built,'Nicht verbundene Route: '+kinds[i]);assert(v.downUntil<=s.month,'Transportstrecke gestört');assert((v.usedMonth===s.month?v.usedMilli:0)+qty<=sp.cap,'Streckenkapazität überschritten');cost+=Math.floor((qty*sp.fee+500)/1000);}assert(raw?c.inventoryMilli>=qty:p.productMilli>=qty,'Nicht genügend freie Ware am Ausgangsort');paid(s,f,cost,1,'FRACHT',ids.join(' > '));for(const id of ids){const v=g.edges[id];if(v.usedMonth!==s.month){v.usedMonth=s.month;v.usedMilli=0;}v.usedMilli+=qty;}
   if(raw)c.inventoryMilli-=qty;else p.productMilli-=qty;
   const x={id:'TR-'+(++s.transport.seq),type:raw?'RAW':'PRODUCT',companyId:f.id,region:r,qtyMilli:qty,claimId:c?.id||null,path:ids,departMonth:s.month,arriveMonth:s.month+1,freightCent:cost};s.transport.shipments.push(x);record(s,g,'ABFAHRT',qty/1000+' Barrel auf '+ids.join(' → '));}
  else if(cmd.type==='NETWORK_REFINE'){const c=s.claims[cmd.claimId];assert(c&&c.owner===f.id&&c.drilled&&c.region===r,'Eigener erschlossener Claim erforderlich');assert(g.rawMilli>=10000,'Rohöl noch nicht angeliefert');assert(c.inventoryMilli+10000<=c.tankMilli,'Feldlager für Abwicklung zu voll');const shadow=copy(s);shadow.claims[c.id].inventoryMilli+=10000;shadow.transport.firms[f.id][r].rawMilli-=10000;const inner=prevTransition(shadow,{...cmd,type:'REFINE_BATCH'});const done=inner.state; // RAW was consumed by existing refinery economic rule
   record(done,fleet(done,f.id,r),'VERARBEITUNG','10 bbl Rohöl verarbeitet');validate(done);return {...inner,state:done};}
  else if(cmd.type==='NETWORK_OFFER'){assert(g.marketMilli>=9000,'Fertigware noch nicht im Marktdepot');assert(f.daysUsed+1<=E.CFG.monthDays,'Nicht genügend Spieltage');g.marketMilli-=9000;f.daysUsed++;s.refinery.offers.push({id:cmd.requestId,companyId:f.id,region:r,qtyMilli:9000,month:s.month});record(s,g,'ANGEBOT','9 bbl für gemeinsame Monatsabrechnung vorgemerkt');}
 }
 s.sequence++;s.processedIds.push(cmd.requestId);validate(s);return {state:s,duplicate:false};}
E.fresh=fresh;E.validate=validate;E.transition=transition;
root.PPTransport={version:SCHEMA,SPECS,view:get,edges:allEdges,validate};if(typeof module==='object'&&module.exports)module.exports=root.PPTransport;
})(typeof globalThis!=='undefined'?globalThis:this);
