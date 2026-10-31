/* PPPOPPI IMPERIUM V1.9.3: optional strategic logistics adapter.
   Single source of truth remains OliV082.transition(); no historical C64 claim.
   AI acts BEFORE the common month-end auctions; same validator, prices,
   booking rules, transport capacities, and order identifiers as human firms.
*/
(function(root){'use strict';
const E=root.OliV082,P=root.PPPublicNetwork,T=root.PPTransport,R=root.PPProfi;
if(!E||!P||!T||!R)throw Error('V1.9.3 benötigt bestehende Spielmodule');
const previous=E.transition.bind(E),clone=x=>JSON.parse(JSON.stringify(x));
const RESERVE={A1:5800000,A2:3000000,A3:4000000};
const minCash=(id)=>RESERVE[id]||4500000;
const valid=x=>Number.isSafeInteger(x)&&x>=0;
const day=(s,id)=>{const f=s.companies.find(x=>x.id===id);return f?E.CFG.monthDays-f.daysUsed:0};
const available=(s,id,cost,days=0,emergency=false)=>{const f=s.companies.find(x=>x.id===id);return !!f&&day(s,id)>=days&&f.cashCent>=cost+(emergency?0:minCash(id));};
const trips=(s,id,r)=>Object.values(s.claims).filter(c=>c.owner===id&&c.region===r&&c.drilled&&!c.burning&&!c.damaged).sort((a,b)=>a.id.localeCompare(b.id));
function margin(s,origin,destination,qty=9000){
 const p=P.routeFor(origin,destination);if(!p)return -Infinity;
 const inPrice=Math.floor((s.prices[origin]*130+50)/100);
 const outPrice=Math.floor((s.prices[destination]*115+50)/100);
 const freight=P.freight(qty,p);
 return Math.floor((outPrice-inPrice)*qty/1000)-freight;
}
function candidates(s,id){
 if(s.phase!=='TURN')return [];
 const f=s.companies.find(x=>x.id===id);if(!f||f.type!=='ai')return [];
 const list=[],pn=P.view(s);let budget=day(s,id);
 const regions=E.REGIONS.slice().sort((a,b)=>a.id.localeCompare(b.id));
 const own=regions.filter(r=>trips(s,id,r.id).length);
 const builtCount=regions.filter(r=>s.refinery.plants[id][r.id].built).length;
 for(const r of own){
  const c=trips(s,id,r.id)[0],rr=r.id,plant=s.refinery.plants[id][rr],g=s.transport.firms[id][rr];
  const expected=(s.prices[rr]*1.3*.9)-(s.prices[rr])-65000/10; // cent per batch rough forecast
  const minDays=4;
  const cash=f.cashCent;
  if(!plant.built&&builtCount===0&&c.reserveMilli>=25000&&expected>0&&available(s,id,3000000,minDays))
   list.push({type:'REFINERY_BUILD',region:rr,claimId:c.id,cost:3000000,days:4,priority:65,reason:'Vorhandenes Feld und erwarteter Raffinerieertrag ermöglichen Investition'});
  if(plant.built&&!plant.route&&available(s,id,800000,2))
   list.push({type:'ROUTE_BUILD',region:rr,claimId:c.id,cost:800000,days:2,priority:85,reason:'Absatzweg für vorhandene Raffinerie erschließen'});
  if(plant.built&&plant.route&&!g.enabled)
   list.push({type:'NETWORK_ENABLE',region:rr,claimId:c.id,cost:0,days:0,priority:100,reason:'Verbindliche Logistikkette zum Werk aktivieren'});
  if(!g.enabled)continue;
  const paths=[{kind:'RAW',claimId:c.id,cost:250000},{kind:'PIPE',cost:450000},{kind:'FINAL',cost:200000}];
  for(const x of paths){const key=[id,rr,x.kind,x.claimId||''].join(':');if(!g.edges[key]?.built&&available(s,id,x.cost,2))list.push({type:'NETWORK_BUILD',kind:x.kind,region:rr,claimId:x.claimId||c.id,cost:x.cost,days:2,priority:x.kind==='RAW'?93:92,reason:'Fehlende Teilstrecke der eigenen Förderkette bauen'});}
  const rawEdge=g.edges[[id,rr,'RAW',c.id].join(':')];
  const pipeEdge=g.edges[[id,rr,'PIPE',''].join(':')];const finalEdge=g.edges[[id,rr,'FINAL',''].join(':')];
  const repaired=[{edge:rawEdge,kind:'RAW',claimId:c.id},{edge:pipeEdge,kind:'PIPE',claimId:c.id},{edge:finalEdge,kind:'FINAL',claimId:c.id}];
  for(const x of repaired)if(x.edge?.built&&x.edge.downUntil>s.month&&available(s,id,90000,2))list.push({type:'NETWORK_REPAIR',region:rr,kind:x.kind,claimId:x.claimId,cost:90000,days:2,priority:97,reason:'Blockierte eigene Betriebsstrecke instand setzen'});
  if(g.marketMilli>=9000){
   const choices=regions.filter(x=>x.id!==rr).map(x=>({to:x.id,gain:margin(s,rr,x.id)})).sort((a,b)=>b.gain-a.gain||a.to.localeCompare(b.to));
   const dest=choices[0];const connected=dest&&pn.connections[id].includes(rr+'>'+dest.to);
   const supply=s.refinery.offers.filter(x=>x.region===rr).reduce((a,b)=>a+b.qtyMilli,0);
   const saturated=supply>=27000;
   if(dest && (dest.gain>0||saturated)){
    if(!connected&&available(s,id,200000,1)&&dest.gain>0)
      list.push({type:'PUBLIC_CONNECT',from:rr,to:dest.to,cost:200000,days:1,priority:95,reason:'Überregionaler Absatz bietet positiven Fracht-bereinigten Preisvorteil'});
    if(connected&&available(s,id,P.freight(9000,P.routeFor(rr,dest.to)),1,true))
      list.push({type:'PUBLIC_QUEUE',from:rr,to:dest.to,qtyMilli:9000,cost:0,days:1,priority:96,reason:'Fertigware über gemeinsames öffentliches Netz disponieren'});
   }
   if(available(s,id,0,1,true))list.push({type:'NETWORK_OFFER',region:rr,claimId:c.id,cost:0,days:1,priority:80,reason:'Angelieferte Fertigware am gemeinsamen Regionalmarkt anbieten'});
  }
  for(const x of regions.filter(x=>x.id!==rr))if(pn.received[id]?.[x.id]>=9000&&available(s,id,0,1,true)&&pn.connections[id].includes(rr+'>'+x.id))
    list.push({type:'PUBLIC_OFFER',from:rr,to:x.id,qtyMilli:9000,cost:0,days:1,priority:99,reason:'Tatsächlich im Zielmarkt eingetroffene Ware verkaufen'});
  if(g.rawMilli>=10000&&plant.processedMilli+10000<=45000&&c.inventoryMilli+10000<=c.tankMilli&&available(s,id,65000,2))
    list.push({type:'NETWORK_REFINE',region:rr,claimId:c.id,cost:65000,days:2,priority:88,reason:'Angeliefertes Rohöl im eigenen Werk verarbeiten'});
  if(plant.productMilli>=9000&&pipeEdge?.built&&finalEdge?.built&&pipeEdge.downUntil<=s.month&&finalEdge.downUntil<=s.month&&available(s,id,26100,1,true))
    list.push({type:'NETWORK_PRODUCT',region:rr,claimId:c.id,qtyMilli:9000,cost:26100,days:1,priority:87,reason:'Fertigware über die eigene Leitung zum Marktdepot bringen'});
  if(c.inventoryMilli>=10000&&rawEdge?.built&&rawEdge.downUntil<=s.month&&available(s,id,14000,1,true))
    list.push({type:'NETWORK_RAW',region:rr,claimId:c.id,qtyMilli:10000,cost:14000,days:1,priority:75,reason:'Vorhandenes Rohöl als neue Raffineriecharge anliefern'});
 }
 return list.sort((a,b)=>b.priority-a.priority||String(a.region||a.from).localeCompare(String(b.region||b.from))||a.type.localeCompare(b.type));
}
function useCommand(s,id,item){
 const oldIndex=s.turnIndex,idx=s.companies.findIndex(x=>x.id===id);
 if(idx<0)throw Error('KI-Firma fehlt');
 const shadow=clone(s);shadow.turnIndex=idx;shadow.companies[idx].type='human';
 const command={...item,companyId:id,requestId:'AI193-'+s.month+'-'+id+'-'+s.sequence+'-'+item.type};
 for(const k of ['priority','cost','days','reason'])delete command[k];
 const result=previous(shadow,command);
 if(result.duplicate)throw Error('Doppelte KI-Aktion');
 const next=result.state;next.companies[idx].type='ai';next.turnIndex=oldIndex;
 next.events.push({month:next.month,type:'KI_LOGISTIK',company:id,action:item.type,
  region:item.region||item.from||'',destination:item.to||null,reason:item.reason,source:'v1.9.3-modul'});
 E.validate(next);return next;
}
function prepare(input){let work=clone(input),actions=[],failed=0;
 for(const company of work.companies.filter(x=>x.type==='ai')){
  for(let i=0;i<10;i++){
   let changed=false;
   for(const item of candidates(work,company.id)){
    try{const future=useCommand(work,company.id,item);work=future;
      actions.push({company:company.id,action:item.type,region:item.region||item.from||'',to:item.to||null,reason:item.reason});changed=true;break;
    }catch(_){failed++;}
   }
   if(!changed)break;
  }
 }
 return {state:work,actions,declinedCandidates:failed};
}
function transition(input,cmd){
 const should=cmd?.type==='END_TURN'&&input.phase==='TURN'&&!input.minigame&&
  input.companies[input.turnIndex]?.type==='human'&&input.companies[input.turnIndex].id===cmd.companyId&&
  input.companies.slice(input.turnIndex+1).every(f=>f.type==='ai')&&
  input.companies.some(f=>f.type==='ai')&&root.PPStrategicAI?.enabled!==false&&root.PPLogisticsAI?.enabled!==false;
 const staged=should?prepare(input):null;
 const out=previous(staged?staged.state:input,cmd);
 if(staged&&!out.duplicate){out.state.events.push({month:out.state.month,type:'KI_LOGISTIK_SUMME',actions:staged.actions.length,declined:staged.declinedCandidates});E.validate(out.state);}
 return out;
}
E.transition=transition;
root.PPLogisticsAI={version:'1.9.3',candidates,prepare,margin,enabled:true};
if(typeof module==='object'&&module.exports)module.exports=root.PPLogisticsAI;
})(typeof globalThis!=='undefined'?globalThis:this);
