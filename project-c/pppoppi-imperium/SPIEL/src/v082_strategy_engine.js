/* PPPOPPI IMPERIUM V0.8.2 – independent fictional simulation, NOT historical C64 code. */
(function(root,factory){const old=typeof module==='object'&&module.exports?require('./v08_engine.js'):root.OliV08;
 const api=factory(old);if(typeof module==='object'&&module.exports)module.exports=api;root.OliV082=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(OLD){'use strict';
const SCHEMA='pppoppi.berlin.save/0.8.2', RULESET='berlin-economy/0.8.2.0';
const REGIONS=OLD.REGIONS, CFG=OLD.CFG, COST=OLD.V08, clone=x=>JSON.parse(JSON.stringify(x));
const ACTION_DAYS={SURVEY:2,BUY:1,DRILL:5,PUMP:4,SHIP:1,OFFER:1,SIGN:1,TANK_UPGRADE:2,SECURITY:1,REPAIR:2,SABOTAGE:2};
const MINI={DRILL:{start:'DRILL_SELF_START',cost:COST.drillSelfCost,days:COST.drillSelfDays,label:'Bohrdruck',base:[36,64,48]},PIPE:{start:'PIPE_START',cost:COST.pipeCost,days:COST.pipeDays,label:'Leitungswinkel',base:[69,31,58]},FIRE:{start:'FIRE_START',cost:COST.fireSelfCost,days:COST.fireSelfDays,label:'Löschintensität',base:[41,72,53]}};
const finite=x=>Number.isSafeInteger(x)&&x>=0;
function ok(c,m){if(!c)throw Error(m);}function div(n,d){return Math.floor((n+Math.floor(d/2))/d);}function sum(a){return a.reduce((x,y)=>x+y,0);}function cashFor(q,p){return div(q*p,1000);}function idFor(r,n){return r.id+'-'+n;}
function claim(r,i){return {id:idFor(r,i),region:r.id,name:r.name+' / Claim '+i,owner:null,surveyedBy:[],drilled:false,reserveMilli:r.reserve+((i-1)*55000),inventoryMilli:0,preparedMilli:0,order:false,tankLevel:1,tankMilli:r.tank,pipeline:false,burning:false,damaged:false,securityUntil:0};}
function firm(id,name,type){return {id,name,type,generation:1,cashCent:CFG.startCash,debtCent:0,daysUsed:0,contracts:[],obligations:[],ledger:[],stats:{contractsDone:0,contractsOnTime:0,contractsProfitable:0,contractsProfitCent:0,marketStreak:0,awards:[],rescues:0},loanUsed:false,monthRevenueCent:0,monthSoldMilli:0,monthProducedMilli:0,monthContractMilli:0};}
function fresh(options={}){const humans=options.humans??1,ais=options.ais??2;ok(Number.isInteger(humans)&&humans>=1&&humans<=4&&Number.isInteger(ais)&&ais>=0&&humans+ais>=2&&humans+ais<=4,'2–4 Firmen mit mindestens einem Menschen');const seed=String(options.seed||'BERLIN-2026');ok(seed.length&&seed.length<=80,'Startkennung ungültig');const companies=[];for(let i=1;i<=humans;i++)companies.push(firm('H'+i,i===1?'PPPOPPI':'Mensch '+i,'human'));for(let i=1;i<=ais;i++)companies.push(firm('A'+i,['Milchmädchen Pete GmbH','Edna Ruppen & Co.','Kapital-Krake AG'][i-1],'ai'));const claims=Object.fromEntries(REGIONS.flatMap(r=>Array.from({length:r.claims},(_,i)=>{const c=claim(r,i+1);return [c.id,c]})));
const state={schema:SCHEMA,ruleset:RULESET,seed,month:1,phase:'TURN',turnIndex:0,companies,claims,prices:Object.fromEntries(REGIONS.map(r=>[r.id,r.price])),demand:Object.fromEntries(REGIONS.map(r=>[r.id,r.demand])),processedIds:[],sequence:0,reports:[],events:[],rescueIds:[],lastReport:null,minigame:null,lineage:null};validate(state);return state;}
function ownClaims(s,f,region=null){return Object.values(s.claims).filter(c=>c.owner===f.id&&(!region||c.region===region));}
function pending(f){return sum(f.obligations.filter(x=>x.priority<=3).map(o=>o.dueCent-o.paidCent));}
function validate(s){ok(s&&s.schema===SCHEMA&&s.ruleset===RULESET,'Unbekanntes Spielstandsformat');ok(finite(s.month)&&s.month>=1&&s.month<=100000,'Monat ungültig');ok(['TURN','RESCUE','REPORT'].includes(s.phase),'Spielphase ungültig');ok(Array.isArray(s.companies)&&s.companies.length>=2&&s.companies.length<=4,'Unternehmensliste beschädigt');ok(finite(s.turnIndex)&&s.turnIndex<s.companies.length,'Spielerposition beschädigt');ok(Array.isArray(s.processedIds)&&new Set(s.processedIds).size===s.processedIds.length&&s.processedIds.length<=100000,'Aktionserkennung beschädigt');ok(finite(s.sequence),'Aktionszähler beschädigt');ok(s.claims&&Object.keys(s.claims).length===REGIONS.reduce((a,r)=>a+r.claims,0),'Claim-Anzahl stimmt nicht');const ids=s.companies.map(f=>f.id);ok(new Set(ids).size===ids.length,'Doppelte Firma');
for(const r of REGIONS){ok(finite(s.prices[r.id])&&s.prices[r.id]>=div(r.price*40,100)&&s.prices[r.id]<=div(r.price*140,100),'Marktpreis ungültig');ok(finite(s.demand[r.id])&&s.demand[r.id]<=r.demand*2,'Nachfrage ungültig');for(let i=1;i<=r.claims;i++){const c=s.claims[idFor(r,i)];ok(c&&c.id===idFor(r,i)&&c.region===r.id,'Claim-Kennung beschädigt');ok(c.owner===null||ids.includes(c.owner),'Besitzer fehlt');ok(Array.isArray(c.surveyedBy)&&new Set(c.surveyedBy).size===c.surveyedBy.length&&c.surveyedBy.every(id=>ids.includes(id)),'Gutachten beschädigt');for(const k of ['reserveMilli','inventoryMilli','preparedMilli','tankMilli','tankLevel','securityUntil'])ok(finite(c[k]),'Feldwert '+k+' ungültig');ok(c.tankLevel>=1&&c.tankLevel<=COST.tankMaxLevel&&c.tankMilli===r.tank+(c.tankLevel-1)*COST.tankUpgradeMilli,'Tankstufe/Kapazität ungültig');ok(c.inventoryMilli+c.preparedMilli<=c.tankMilli,'Lager überfüllt');ok(c.reserveMilli<=r.reserve+(i-1)*55000,'Ölreserve gewachsen');ok(['drilled','pipeline','burning','damaged','order'].every(k=>typeof c[k]==='boolean'),'Anlagenzustand ungültig');ok(!c.drilled||c.owner,'Bohrung ohne Eigentümer');ok(!c.pipeline||c.drilled,'Pipeline ohne Bohrung');ok(!c.burning||c.drilled,'Brand ohne Bohrung');ok(!c.order||c.preparedMilli>0,'Angebot ohne Ware');}}
for(const f of s.companies){ok(/^([HA][1-4])$/.test(f.id)&&['human','ai'].includes(f.type)&&typeof f.name==='string','Firmendaten beschädigt');for(const k of ['cashCent','debtCent','daysUsed','generation','monthRevenueCent','monthSoldMilli','monthProducedMilli','monthContractMilli'])ok(finite(f[k]),'Firmenwert '+k+' ungültig');ok(f.daysUsed<=CFG.monthDays,'Spieltagüberlauf');ok(Array.isArray(f.contracts)&&Array.isArray(f.obligations)&&Array.isArray(f.ledger),'Buchungsdaten ungültig');for(const o of f.obligations)ok(finite(o.dueCent)&&finite(o.paidCent)&&o.paidCent<=o.dueCent,'Rechnung beschädigt');for(const x of f.contracts)ok(['OPEN','DONE','BREACH'].includes(x.status)&&REGIONS.some(r=>r.id===x.region),'Vertragszustand beschädigt');}
ok(Array.isArray(s.rescueIds)&&s.rescueIds.every(id=>ids.includes(id))&&Array.isArray(s.events)&&Array.isArray(s.reports),'Spielverlauf beschädigt');if(s.minigame){const m=s.minigame;ok(s.phase==='TURN'&&Object.keys(MINI).includes(m.kind)&&s.claims[m.claimId]?.owner===m.companyId&&s.companies[s.turnIndex].id===m.companyId,'Unzulässiges Minispiel');ok(finite(m.stage)&&m.stage<3&&finite(m.attempts)&&m.attempts<=2&&finite(m.dial)&&m.dial<=100,'Minispielwerte ungültig');}return true;}
function book(s,f,delta,code,info){ok(Number.isSafeInteger(delta)&&Number.isSafeInteger(f.cashCent+delta)&&f.cashCent+delta>=0,'Nicht genügend Bargeld');f.cashCent+=delta;f.ledger.push({id:`B${s.month}-${s.sequence}-${f.ledger.length}`,month:s.month,deltaCent:delta,code,info});}
function days(f,n){ok(f.daysUsed+n<=CFG.monthDays,'Nicht genügend Spieltage');f.daysUsed+=n;}
function bill(f,id,p,c,kind){ok(f.obligations.every(o=>o.id!==id),'Rechnung schon erfasst');f.obligations.push({id,priority:p,dueCent:c,paidCent:0,kind});}
function settle(s,f){
 // Within one priority class, invoices are paid proportionally using the same
 // stable largest-remainder rule as regional market allocations; no hidden
 // alphabetical preference between equal-priority creditors.
 const priorities=[...new Set(f.obligations.map(o=>o.priority))].sort((a,b)=>a-b);
 for(const prio of priorities){const group=f.obligations.filter(o=>o.priority===prio&&o.dueCent>o.paidCent);
  if(!group.length||!f.cashCent)continue;
  const allocation=OLD.BASE.allocLargestRemainder(group.map(o=>({id:o.id,qty:o.dueCent-o.paidCent})),f.cashCent);
  for(const o of group.sort((a,b)=>a.id.localeCompare(b.id))){const d=allocation[o.id]||0;
   if(d){book(s,f,-d,'ZAHLUNG_'+o.kind,o.id);o.paidCent+=d;if(o.kind==='TILGUNG')f.debtCent-=d;}}
 }
}

function charge(s,f,c,code,info,dayCount=0){ok(f.cashCent>=c,'Nicht genügend Guthaben');days(f,dayCount);book(s,f,-c,code,info);}
function event(s,type,data){s.events.push({month:s.month,type,...data});}
function makeMini(s,f,c,kind){const v=MINI[kind];ok(!s.minigame,'Minispiel läuft');if(kind==='DRILL')ok(c.owner===f.id&&!c.drilled,'Nur auf eigenem unerschlossenem Claim');if(kind==='PIPE')ok(c.owner===f.id&&c.drilled&&!c.pipeline&&!c.burning&&!c.damaged,'Pipeline erfordert intaktes Feld');if(kind==='FIRE')ok(c.owner===f.id&&c.burning,'Feuerwehreinsatz nur bei Brand');charge(s,f,v.cost,'MINISPIEL_'+kind,c.id,v.days);s.minigame={kind,companyId:f.id,claimId:c.id,stage:0,dial:50,attempts:0};event(s,'MINI_START',{kind,claimId:c.id,company:f.id});}
function target(s,m){const base=MINI[m.kind].base[m.stage],offset=((s.month+m.claimId.charCodeAt(m.claimId.length-1))%3-1)*3;return base+offset;}
function miniAction(s,f,cmd){const m=s.minigame;ok(m&&m.companyId===f.id,'Kein eigenes Minispiel');if(cmd.type==='MINI_ADJUST'){ok(Number.isSafeInteger(cmd.delta)&&[-10,-1,1,10].includes(cmd.delta),'Ungültige Stellschrittweite');m.dial=Math.min(100,Math.max(0,m.dial+cmd.delta));return;}const goal=target(s,m),tolerance=[6,4,3][m.stage];if(Math.abs(goal-m.dial)<=tolerance){m.stage++;m.attempts=0;m.dial=50;if(m.stage===3){const c=s.claims[m.claimId];if(m.kind==='DRILL')c.drilled=true;if(m.kind==='PIPE')c.pipeline=true;if(m.kind==='FIRE'){c.burning=false;c.damaged=false;}event(s,'MINI_SUCCESS',{kind:m.kind,claimId:c.id,company:f.id});s.minigame=null;}}else{m.attempts++;event(s,'MINI_FALSCHE_EINSTELLUNG',{kind:m.kind,claimId:m.claimId,stage:m.stage,company:f.id});if(m.attempts>=2){if(m.kind==='FIRE')s.claims[m.claimId].damaged=true;event(s,'MINI_FAIL',{kind:m.kind,claimId:m.claimId,company:f.id});s.minigame=null;}}}
function action(s,f,cmd){const c=cmd.claimId?s.claims[cmd.claimId]:null, r=cmd.region?REGIONS.find(x=>x.id===cmd.region):c?REGIONS.find(x=>x.id===c.region):null;
function owns(){ok(c&&c.owner===f.id,'Claim gehört nicht zum Unternehmen');}switch(cmd.type){
case 'SURVEY':ok(c&&c.owner===null&&!c.surveyedBy.includes(f.id),'Kein neues Gutachten möglich');charge(s,f,r.survey,'GUTACHTEN',c.id,ACTION_DAYS.SURVEY);c.surveyedBy.push(f.id);break;
case 'BUY':ok(c&&c.owner===null&&c.surveyedBy.includes(f.id),'Nur freien untersuchten Claim kaufen');charge(s,f,r.buy,'FELDKAUF',c.id,ACTION_DAYS.BUY);c.owner=f.id;break;
case 'DRILL':owns();ok(!c.drilled,'Bereits erschlossen');charge(s,f,r.drill,'FACHBOHRUNG',c.id,ACTION_DAYS.DRILL);c.drilled=true;break;
case 'PUMP':owns();ok(c.drilled&&!c.burning&&!c.damaged,'Förderung gesperrt');ok(c.reserveMilli>=CFG.pumpMilli,'Reserve reicht nicht');ok(c.inventoryMilli+c.preparedMilli+CFG.pumpMilli<=c.tankMilli,'Tankkapazität reicht nicht');charge(s,f,CFG.pumpCost,'FOERDERUNG',c.id,ACTION_DAYS.PUMP);c.reserveMilli-=CFG.pumpMilli;c.inventoryMilli+=CFG.pumpMilli;f.monthProducedMilli+=CFG.pumpMilli;break;
case 'SHIP':owns();ok(c.inventoryMilli>=1000&&c.preparedMilli===0,'Keine ungebundene Ware oder Lieferung läuft');charge(s,f,CFG.shippingCost,'TRANSPORT',c.id,ACTION_DAYS.SHIP);c.preparedMilli=c.inventoryMilli;c.inventoryMilli=0;if(c.pipeline)book(s,f,COST.pipeRefund,'PIPELINE_GUTSCHRIFT',c.id);break;
case 'OFFER':owns();ok(c.preparedMilli>0&&!c.order,'Lieferung fehlt oder Angebot aktiv');days(f,ACTION_DAYS.OFFER);c.order=true;break;
case 'CANCEL':owns();ok(c.preparedMilli>0&&!c.order,'Verbindliches Marktangebot ist nicht widerruflich');c.inventoryMilli+=c.preparedMilli;c.preparedMilli=0;break;
case 'SIGN':ok(r&&ownClaims(s,f,r.id).length>0,'Vertrag erfordert eigene Konzession');ok(f.contracts.filter(x=>x.status==='OPEN').length<3&&!f.contracts.some(x=>x.status==='OPEN'&&x.region===r.id),'Vertragsobergrenze oder bestehender Regionalvertrag');days(f,ACTION_DAYS.SIGN);f.contracts.push({id:`V-${f.id}-${s.month}-${r.id}-${s.sequence}`,region:r.id,qtyMilli:CFG.contractQty,dueMonth:s.month+1,status:'OPEN',soldMilli:0,profitCent:0});break;
case 'TANK_UPGRADE':owns();ok(c.tankLevel<COST.tankMaxLevel,'Tankstufe maximal');charge(s,f,COST.tankUpgradeCost,'TANKAUSBAU',c.id,ACTION_DAYS.TANK_UPGRADE);c.tankLevel++;c.tankMilli+=COST.tankUpgradeMilli;break;
case 'SECURITY':owns();charge(s,f,COST.securityCost,'OBJEKTSCHUTZ',c.id,ACTION_DAYS.SECURITY);c.securityUntil=s.month+2;break;
case 'REPAIR':owns();ok(c.damaged&&!c.burning,'Nur beschädigtes, gelöschtes Feld reparieren');charge(s,f,COST.repairCost,'REPARATUR',c.id,ACTION_DAYS.REPAIR);c.damaged=false;break;
case 'FIRE_EXPERT':owns();ok(c.burning,'Keine brennende Anlage');charge(s,f,COST.fireExpertCost,'BRANDBEKÄMPFUNG_PROFI',c.id,COST.fireExpertDays);c.burning=false;c.damaged=false;break;
case 'SABOTAGE':ok(c&&c.owner&&c.owner!==f.id&&c.drilled&&!c.damaged&&!c.burning,'Nur aktive Konkurrenzanlage angreifen');charge(s,f,COST.sabotageCost,'SABOTAGEVERSUCH',c.id,ACTION_DAYS.SABOTAGE);if(c.securityUntil>=s.month)event(s,'SABOTAGE_ABGEWEHRT',{company:f.id,claimId:c.id});else if((s.month+c.id.length+s.sequence)%3===0)event(s,'SABOTAGE_MISSGLUECKT',{company:f.id,claimId:c.id});else{c.damaged=true;event(s,'SABOTAGE_SCHADEN',{company:f.id,claimId:c.id});}break;
case 'DRILL_SELF_START':case 'PIPE_START':case 'FIRE_START':ok(c,'Claim fehlt');makeMini(s,f,c,cmd.type==='DRILL_SELF_START'?'DRILL':cmd.type==='PIPE_START'?'PIPE':'FIRE');break;
case 'MINI_ADJUST':case 'MINI_CHECK':miniAction(s,f,cmd);break;
default:throw Error('Unbekannte Aktion: '+cmd.type);
}}
function settleMonth(s){ok(s.phase==='TURN','Monat nicht bereit');
// 1. Contracts have priority; independent claims remain individually measurable.
for(const f of s.companies)for(const v of f.contracts.filter(x=>x.status==='OPEN'&&x.dueMonth<=s.month)){
let missing=v.qtyMilli,delivered=0;for(const c of ownClaims(s,f,v.region).sort((a,b)=>a.id.localeCompare(b.id))){let n=Math.min(c.inventoryMilli,missing);c.inventoryMilli-=n;missing-=n;delivered+=n;n=Math.min(c.preparedMilli,missing);c.preparedMilli-=n;missing-=n;delivered+=n;if(c.preparedMilli===0)c.order=false;if(!missing)break;}
const price=div(s.prices[v.region]*CFG.contractBonusBps,10000),revenue=cashFor(delivered,price);if(delivered){book(s,f,revenue,'VERTRAGSERLÖS',v.id);f.monthRevenueCent+=revenue;f.monthContractMilli+=delivered;bill(f,`M${s.month}-${v.id}-FEE`,2,CFG.contractDeliveryFee,'VERTRAGSTRANSPORT');}if(missing)bill(f,`M${s.month}-${v.id}-STRAFE`,2,div(cashFor(missing,price)*CFG.contractPenaltyBps,10000),'VERTRAGSSTRAFE');v.soldMilli=delivered;v.profitCent=revenue-cashFor(delivered,CFG.contractUnitCost)-(delivered?CFG.contractDeliveryFee:0);v.status=missing?'BREACH':'DONE';if(!missing){f.stats.contractsDone++;f.stats.contractsOnTime++;if(v.profitCent>0)f.stats.contractsProfitable++;f.stats.contractsProfitCent+=v.profitCent;}}
// 2. Free regional market using stable claim IDs, independent of input order.
const allocations={};for(const r of REGIONS){const offers=Object.values(s.claims).filter(c=>c.region===r.id&&c.order&&c.preparedMilli).map(c=>({id:c.id,qty:c.preparedMilli}));const portions=OLD.BASE.allocLargestRemainder(offers,s.demand[r.id]);allocations[r.id]={};for(const c of Object.values(s.claims).filter(c=>c.region===r.id)){const sold=portions[c.id]||0;allocations[r.id][c.id]=sold;const f=s.companies.find(f=>f.id===c.owner);if(sold){book(s,f,cashFor(sold,s.prices[r.id]),'MARKTERLÖS',c.id);f.monthSoldMilli+=sold;f.monthRevenueCent+=cashFor(sold,s.prices[r.id]);}if(c.order){c.inventoryMilli+=c.preparedMilli-sold;c.preparedMilli=0;c.order=false;}}}
// 3. Invoicing and ordered settlement, no negative balances.
for(const f of s.companies){bill(f,`M${s.month}-G${f.generation}-LOHN`,1,CFG.wage,'PERSONAL');const active=ownClaims(s,f).filter(c=>c.drilled).length;if(active)bill(f,`M${s.month}-G${f.generation}-WARTUNG`,1,active*CFG.upkeep,'WARTUNG');if(f.debtCent){bill(f,`M${s.month}-G${f.generation}-ZINS`,3,div(f.debtCent*CFG.loanInterestBps,10000),'ZINS');const pendingRepay=sum(f.obligations.filter(o=>o.kind==='TILGUNG').map(o=>o.dueCent-o.paidCent));bill(f,`M${s.month}-G${f.generation}-TILGUNG`,3,Math.min(Math.max(0,f.debtCent-pendingRepay),div(f.debtCent*CFG.loanRepaymentBps,10000)),'TILGUNG');}settle(s,f);}
const soldTotal=sum(s.companies.map(f=>f.monthSoldMilli)),competitors=s.companies.filter(f=>f.monthSoldMilli>0).length;
s.lastReport={month:s.month,allocations,regions:Object.fromEntries(REGIONS.map(r=>[r.id,{priceCent:s.prices[r.id],demandMilli:s.demand[r.id],soldMilli:sum(Object.values(allocations[r.id]))}])),companies:[]};
for(const f of s.companies){const share=soldTotal?div(f.monthSoldMilli*10000,soldTotal):0;if(soldTotal>=CFG.minShareSalesMilli&&competitors>=2&&share>=6000)f.stats.marketStreak++;else f.stats.marketStreak=0;if(f.stats.marketStreak>=6&&!f.stats.awards.includes('MARKTFUEHRER'))f.stats.awards.push('MARKTFUEHRER');if(f.stats.contractsDone>=20&&f.stats.contractsOnTime*100>=f.stats.contractsDone*95&&f.stats.contractsProfitable*100>=f.stats.contractsDone*95&&f.stats.contractsProfitCent>0&&!f.stats.awards.includes('VERTRAGSMEISTER'))f.stats.awards.push('VERTRAGSMEISTER');s.lastReport.companies.push({id:f.id,name:f.name,soldMilli:f.monthSoldMilli,revenueCent:f.monthRevenueCent,marketShareBps:share,arrearsCent:pending(f),cashCent:f.cashCent,debtCent:f.debtCent});}
s.reports.push(clone(s.lastReport));if(s.reports.length>120)s.reports.shift();for(const f of s.companies.filter(f=>f.type==='ai'&&pending(f)>0))autoRescue(s,f);s.rescueIds=s.companies.filter(f=>f.type==='human'&&pending(f)>0).map(f=>f.id);s.phase=s.rescueIds.length?'RESCUE':'REPORT';event(s,'MONATSABSCHLUSS',{soldMilli:soldTotal});}
function restart(s,f){event(s,'SANIERUNGSNEUSTART',{company:f.id,generation:f.generation});for(const c of ownClaims(s,f)){const r=REGIONS.find(r=>r.id===c.region);s.claims[c.id]=claim(r,Number(c.id.split('-').pop()));}const old=f.stats,oldGen=f.generation,base=firm(f.id,f.name,f.type);Object.assign(f,base);f.generation=oldGen+1;f.cashCent=CFG.restart;f.stats.awards=old.awards.slice();f.stats.rescues=old.rescues+1;}
function autoRescue(s,f){if(!f.loanUsed){f.loanUsed=true;f.debtCent+=CFG.credit;book(s,f,CFG.credit,'KI_RETTUNGSKREDIT','Rettung');settle(s,f);}if(pending(f)>0)restart(s,f);}
// V1.9.2: Optional strategic AI adapter. Historical action path remains the
// fallback, and every proposed action is run on an isolated copy first.
function aiTurn(s){let safety=0;
 while(s.phase==='TURN'&&s.companies[s.turnIndex].type==='ai'){
  ok(++safety<=s.companies.length+1,'Computerzug hängt');
  const id=s.companies[s.turnIndex].id;
  const planner=globalThis.PPStrategicAI;
  if(planner&&planner.enabled!==false&&typeof planner.rank==='function'){
   let used=0;
   for(let step=0;step<14;step++){
    const candidateList=planner.rank(clone(s),id);
    let applied=false;
    for(const choice of candidateList){
     if(!choice||!choice.cmd||!choice.cmd.type)continue;
     try{
      const probe=clone(s);
      action(probe,probe.companies[probe.turnIndex],choice.cmd);
      s.companies=probe.companies;s.claims=probe.claims;
      event(s,'KI_ENTSCHEIDUNG',{company:id,action:choice.cmd.type,claimId:choice.cmd.claimId||null,
       score:Math.round(choice.score),reason:String(choice.reason||'').slice(0,140),strategy:planner.profile(id)});
      applied=true;used++;break;
     }catch(_){/* No partial action. Rejected proposals are not booked. */}
    }
    if(!applied)break;
   }
   if(!used)event(s,'KI_ABWARTEN',{company:id,strategy:planner.profile(id),reason:'Keine rentable und zulässige Handlung im Budget'});
  }else{
   const f=s.companies[s.turnIndex];const preferred=REGIONS.slice().sort((a,b)=>a.buy-b.buy);
   for(const r of preferred){const own=ownClaims(s,f,r.id);let c=own[0]||Object.values(s.claims).find(c=>c.region===r.id&&c.owner===null);if(!c)continue;
    for(const type of ['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER']){
     if(f.daysUsed>=CFG.monthDays-2)break;
     try{if(type==='SURVEY'&&(c.owner===f.id||c.surveyedBy.includes(f.id)))continue;
      if(type==='BUY'&&c.owner===f.id)continue;if(type==='DRILL'&&c.drilled)continue;
      if(type==='PUMP'&&(c.reserveMilli<CFG.pumpMilli||c.inventoryMilli+c.preparedMilli+CFG.pumpMilli>c.tankMilli))continue;
      if(type==='SHIP'&&(!c.inventoryMilli||c.preparedMilli))continue;
      if(type==='OFFER'&&(!c.preparedMilli||c.order))continue;
      const probe=clone(s);action(probe,probe.companies[probe.turnIndex],{type,claimId:c.id});s.companies=probe.companies;s.claims=probe.claims;
     }catch(_){} }
    if(f.daysUsed>=CFG.monthDays-2||f.cashCent<CFG.pumpCost+CFG.wage)break;
   }
  }
  const f=s.companies[s.turnIndex];event(s,'KI_ZUG',{company:f.id,days:f.daysUsed});
  s.turnIndex++;if(s.turnIndex===s.companies.length){s.turnIndex=0;settleMonth(s);}
 }
}
function changeMarkets(s){for(const r of REGIONS){const info=s.lastReport?.regions[r.id];if(!info)continue;const bps=info.soldMilli<info.demandMilli*0.7?-300:info.soldMilli>=info.demandMilli?400:100;const next=div(s.prices[r.id]*(10000+bps),10000);s.prices[r.id]=Math.max(div(r.price*40,100),Math.min(div(r.price*140,100),next));const fluct=[-10,-5,0,5,8,0,-4,2][s.month%8];s.demand[r.id]=div(r.demand*(100+fluct),100);}}
function periodicEvents(s){const x=s.month%4===0?'BRAND':s.month%3===0?'MARKTSCHOCK':null;if(x==='BRAND'){const list=Object.values(s.claims).filter(c=>c.drilled&&!c.burning).sort((a,b)=>a.id.localeCompare(b.id));if(list.length){const c=list[(s.month/4-1)%list.length];c.burning=true;event(s,'BRAND',{claimId:c.id,company:c.owner,rule:'jeder vierte Monat'});}}if(x==='MARKTSCHOCK'){const r=REGIONS[s.month%REGIONS.length];s.demand[r.id]=Math.max(0,div(s.demand[r.id]*85,100));event(s,'MARKTSCHOCK',{region:r.id,rule:'jeder dritte Monat ohne Brand'});}}
function transition(input,cmd){validate(input);ok(cmd&&typeof cmd.type==='string'&&typeof cmd.requestId==='string'&&cmd.requestId.length>=3&&cmd.requestId.length<=100,'Befehl benötigt Kennung');if(input.processedIds.includes(cmd.requestId))return {state:clone(input),duplicate:true};const s=clone(input),f=s.companies[s.turnIndex];s.sequence++;
if(s.minigame)ok(['MINI_ADJUST','MINI_CHECK'].includes(cmd.type),'Minispiel zuerst abschließen');
if(cmd.type==='END_TURN'){ok(s.phase==='TURN'&&f.type==='human'&&cmd.companyId===f.id,'Falscher Zug');s.turnIndex++;if(s.turnIndex===s.companies.length){s.turnIndex=0;settleMonth(s);}else if(s.companies[s.turnIndex].type==='ai')aiTurn(s);}
else if(cmd.type==='NEXT_MONTH'){ok(s.phase==='REPORT','Erst Monatsabrechnung fertigstellen');changeMarkets(s);s.month++;s.phase='TURN';s.turnIndex=0;s.rescueIds=[];for(const c of s.companies){c.daysUsed=0;c.monthRevenueCent=0;c.monthSoldMilli=0;c.monthProducedMilli=0;c.monthContractMilli=0;c.loanUsed=false;}periodicEvents(s);}
else if(['RESCUE_LOAN','RESCUE_SALE','RESTART'].includes(cmd.type)){ok(s.phase==='RESCUE'&&s.rescueIds[0]===cmd.companyId,'Kein eigener Rettungsfall');const a=s.companies.find(x=>x.id===cmd.companyId);if(cmd.type==='RESCUE_LOAN'){ok(!a.loanUsed,'Rettungskredit verbraucht');a.loanUsed=true;a.debtCent+=CFG.credit;book(s,a,CFG.credit,'RETTUNGSKREDIT','gleichhohe Verbindlichkeit');settle(s,a);}if(cmd.type==='RESCUE_SALE'){const c=cmd.claimId?s.claims[cmd.claimId]:ownClaims(s,a)[0];ok(c&&c.owner===a.id,'Kein eigenes Feld zum Notverkauf');const r=REGIONS.find(r=>r.id===c.region);book(s,a,div(r.buy*60,100),'NOTVERKAUF',c.id);s.claims[c.id]=claim(r,Number(c.id.split('-').pop()));settle(s,a);}if(cmd.type==='RESTART')restart(s,a);if(!pending(a)||cmd.type==='RESTART')s.rescueIds.shift();if(!s.rescueIds.length)s.phase='REPORT';}
else{ok(s.phase==='TURN'&&f.type==='human'&&cmd.companyId===f.id,'Aktion nur für aktiven menschlichen Zug');action(s,f,cmd);}
s.processedIds.push(cmd.requestId);validate(s);return {state:s,duplicate:false};}
function migrateV08(old){OLD.validate(old);ok(old.phase==='TURN'&&!old.minigame,'Übernahme nur während eines normalen Zuges ohne laufendes Minispiel');ok(!old.companies.some(f=>f.contracts.some(v=>v.status==='OPEN')),'Verträge vor Übernahme abschließen');const humans=old.companies.filter(f=>f.type==='human').length,ais=old.companies.length-humans;const s=fresh({humans,ais,seed:old.seed});s.month=old.month;s.phase=old.phase;s.turnIndex=old.turnIndex;s.prices=clone(old.prices);s.demand=clone(old.demand);s.lineage={source:old.schema,sourceMonth:old.month,notice:'V0.8 nach V0.8.2: pro Alt-Region und Firma genau ein Claim; zusätzliche Claims bleiben frei.'};s.sequence=old.sequence;s.processedIds=clone(old.processedIds);s.events=clone(old.events);s.reports=clone(old.reports);s.lastReport=clone(old.lastReport);
for(let fi=0;fi<old.companies.length;fi++){const before=old.companies[fi],after=s.companies[fi];for(const key of ['generation','cashCent','debtCent','daysUsed','contracts','obligations','ledger','stats','loanUsed','monthRevenueCent','monthSoldMilli','monthProducedMilli','monthContractMilli'])after[key]=clone(before[key]);for(const r of REGIONS){const x=before.fields[r.id];if(!x.surveyed&&!x.owned)continue;const used=Object.values(s.claims).filter(c=>c.region===r.id&&c.owner!==null).length;const c=s.claims[idFor(r,Math.min(r.claims,used+1))];ok(!c.owner,'Altspielstand besitzt zu viele Konzessionen');c.surveyedBy=[after.id];if(!x.owned)continue;c.owner=after.id;c.drilled=x.drilled;c.reserveMilli=x.reserveMilli;c.inventoryMilli=x.inventoryMilli;c.preparedMilli=x.preparedMilli;c.order=x.order;c.tankLevel=x.v08.tankLevel;c.tankMilli=x.tankMilli;c.pipeline=x.v08.pipeline;c.burning=x.v08.burning;c.damaged=x.v08.damaged;c.securityUntil=x.v08.securityUntil;}}validate(s);return s;}
return {SCHEMA,RULESET,REGIONS,CFG,COST,MINI,fresh,validate,transition,migrateV08,ownClaims,target,pending};
});
