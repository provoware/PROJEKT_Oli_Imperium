/* PPPOPPI IMPERIUM V1.9.2 — eigenständiger, deterministischer KI-Planer.
 * Keine neuen Spielressourcen, keine neuen Spielregeln, keine Netzwerkanfragen.
 * Benutzt nur vom alten Spielkern erlaubte Aktionen. Kein Echtgeld-Bezug. */
(function(root){'use strict';
 const E=root.OliV082;
 if(!E)throw Error('KI-Planer: Wirtschaftskern fehlt');
 const profiles=Object.freeze({A1:'vorsichtig',A2:'wachstumsorientiert',A3:'handelsorientiert',A4:'ausgewogen'});
 const config={
  vorsichtig:{buffer:5400000,expand:0.75,production:1.08,risk:1.35},
  wachstumsorientiert:{buffer:2300000,expand:1.35,production:1,risk:0.8},
  handelsorientiert:{buffer:2800000,expand:0.9,production:1.32,risk:1},
  ausgewogen:{buffer:4000000,expand:1,production:1.13,risk:1}
 };
 const profile=id=>profiles[id]||'ausgewogen';
 const enough=(firm,cost,buffer,emergency=false)=>firm.cashCent>=cost+(emergency?0:buffer);
 const safeNum=n=>Number.isFinite(n)?n:0;
 function rank(state,companyId){
  const firm=state.companies.find(f=>f.id===companyId);
  if(!firm||firm.type!=='ai'||state.phase!=='TURN')return [];
  const cfg=config[profile(companyId)];
  const dayBudget=E.CFG.monthDays-firm.daysUsed;
  const owned=Object.values(state.claims).filter(c=>c.owner===companyId);
  const drilled=owned.filter(c=>c.drilled&&!c.burning&&!c.damaged);
  const unresolved=owned.filter(c=>!c.drilled);
  const proposals=[];
  const rmap=Object.fromEntries(E.REGIONS.map(r=>[r.id,r]));
  function add(type,c,cost,days,score,reason,emergency=false){
   if(dayBudget<days||!enough(firm,cost,cfg.buffer,emergency))return;
   if(!(Number.isFinite(score)&&score>0))return;
   proposals.push({cmd:{type,claimId:c.id},score:Math.round(score),reason});
  }
  for(const c of Object.values(state.claims)){
   const r=rmap[c.region],price=state.prices[c.region];
   const demand=Math.max(1,state.demand[c.region]);
   const sameOffers=Object.values(state.claims).filter(v=>v.region===c.region&&v.order).reduce((t,v)=>t+v.preparedMilli,0);
   const salesPressure=Math.max(.25,Math.min(1,(demand-sameOffers)/Math.max(1000,demand)));
   const effectiveRevenue=E.CFG.pumpMilli*price/1000*salesPressure;
   const pumpMargin=effectiveRevenue-E.CFG.pumpCost-E.CFG.shippingCost+(c.pipeline?E.COST.pipeRefund:0);
   const reserveRatio=c.reserveMilli/Math.max(1,r.reserve);
   const isOwned=c.owner===companyId;
   if(isOwned){
    if(c.burning) add('FIRE_EXPERT',c,E.COST.fireExpertCost,E.COST.fireExpertDays,12000+reserveRatio*500,
      'Akuter Anlagenbrand: zuerst produktionsfähiges Eigentum sichern',true);
    if(c.damaged&&!c.burning)add('REPAIR',c,E.COST.repairCost,E.COST.repairDays,11000+reserveRatio*450,
      'Beschädigtes Feld reaktivieren statt neues Kapital binden',true);
    if(c.preparedMilli>0&&!c.order)add('OFFER',c,0,1,9750+price/20000,
      'Bereits bezahlten Transport am Monatsmarkt anbieten',true);
    if(c.inventoryMilli>=1000&&c.preparedMilli===0 && !c.burning && !c.damaged)
      add('SHIP',c,E.CFG.shippingCost,1,9100+Math.min(1600,c.inventoryMilli/100),
       'Vorhandene Ware verkaufen, bevor neues Kapital gebunden wird',true);
    if(c.drilled&&!c.burning&&!c.damaged && c.reserveMilli>=E.CFG.pumpMilli &&
       c.inventoryMilli+c.preparedMilli+E.CFG.pumpMilli<=c.tankMilli && pumpMargin>0)
      add('PUMP',c,E.CFG.pumpCost,4,4800+Math.min(2900,pumpMargin/1600)*cfg.production,
       'Positive Deckung aus Preis, Marktnachfrage und Förderkosten');
    if(!c.drilled&&c.reserveMilli>0){
      const periods=Math.max(1,Math.floor(c.reserveMilli/E.CFG.pumpMilli));
      const potential=periods*pumpMargin;
      if(potential>r.drill*1.05)
       add('DRILL',c,r.drill,5,3800+Math.min(1750,potential/r.drill*700)*cfg.expand,
         'Erschließung rechnet sich voraussichtlich aus verbleibender Reserve');
    }
    if(c.drilled&&!c.burning&&!c.damaged && c.tankLevel<E.COST.tankMaxLevel &&
       c.inventoryMilli+c.preparedMilli>=c.tankMilli-E.CFG.pumpMilli && c.reserveMilli>E.CFG.pumpMilli)
      add('TANK_UPGRADE',c,E.COST.tankUpgradeCost,2,4100*cfg.expand,
       'Kapazitätsengpass begrenzt weitere Förderung');
    const threat=state.events.slice(-120).some(e=>e.claimId===c.id && ['SABOTAGE_SCHADEN','SABOTAGE_ABGEWEHRT'].includes(e.type));
    if(c.drilled&&c.securityUntil<state.month&&threat&&reserveRatio>.3)
      add('SECURITY',c,E.COST.securityCost,1,2000*cfg.risk,
       'Dokumentierte Sabotagegefahr rechtfertigt vorbeugenden Objektschutz');
   }else if(c.owner===null){
    const candidatePayback=Math.max(0,pumpMargin)*Math.max(1,Math.floor(c.reserveMilli/E.CFG.pumpMilli));
    const totalInvestment=r.buy+r.drill+r.survey;
    if(candidatePayback>totalInvestment*1.15 && unresolved.length===0 && drilled.length<3){
      const score=2700+Math.min(2300,candidatePayback/totalInvestment*560)*cfg.expand;
      if(c.surveyedBy.includes(companyId)) add('BUY',c,r.buy,1,score,
         'Untersuchte freie Konzession mit positiver Rentabilitätsprognose');
      else add('SURVEY',c,r.survey,2,score*.75,
         'Gutachten vor Investitionsentscheidung statt Blindkauf');
    }
   }
  }
  // Lose profitability comparison is only a decision aid; validation and actual
  // state changes always remain with the historical V0.8.2 action handler.
  return proposals.sort((a,b)=>b.score-a.score||a.cmd.claimId.localeCompare(b.cmd.claimId)||a.cmd.type.localeCompare(b.cmd.type));
 }
 root.PPStrategicAI={version:'1.9.2',enabled:true,rank,profile,profiles,config,
  evaluate:(state,id)=>rank(state,id).slice(0,5).map(x=>({...x})),
  ready:()=>Boolean(E&&typeof E.transition==='function')};
 if(typeof module==='object'&&module.exports)module.exports=root.PPStrategicAI;
})(typeof globalThis!=='undefined'?globalThis:this);
