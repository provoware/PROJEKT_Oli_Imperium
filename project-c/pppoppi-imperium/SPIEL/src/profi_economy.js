/* PPPOPPI-Imperium V1.6.1: order-independent refined-products market.
 * Independent Berlin-adaptation, NOT a verified Oil Imperium C64 rule.
 * Original V0.8.2 engine remains byte-identical and untouched.
 * Incoming V1.6 saves can be imported without losing past credited sales.
 */
(function(root){'use strict';
const E=root.OliV082, OLD=root.OliV07;
if(!E||!OLD||typeof OLD.allocLargestRemainder!=='function')throw Error('Unveränderte V0.8.2-/V0.7-Basis fehlt');
const baseFresh=E.fresh.bind(E),baseTransition=E.transition.bind(E),baseValidate=E.validate.bind(E);
const EXT='pppoppi.refinery/1.1',LEGACY='pppoppi.refinery/1.0';
const MAX_OUTPUT=45000,RAW_BATCH=10000,YIELD=9000,BUILD_CENT=3000000,REFINE_CENT=65000,ROUTE_CENT=800000,SALE_LIMIT=27000;
const COSTS=Object.freeze({buildCent:BUILD_CENT,refineCent:REFINE_CENT,routeCent:ROUTE_CENT,rawBatchMilli:RAW_BATCH,yieldMilli:YIELD,saleLimitMilli:SALE_LIMIT,monthlyCapacityMilli:MAX_OUTPUT});
const cp=x=>JSON.parse(JSON.stringify(x)),validInt=n=>Number.isSafeInteger(n)&&n>=0;
function ok(c,m){if(!c)throw Error(m)}
function freshExt(s){return {version:EXT,plants:Object.fromEntries(s.companies.map(f=>[f.id,Object.fromEntries(E.REGIONS.map(r=>[r.id,{built:false,route:false,productMilli:0,processedMilli:0}]))])),salesMilli:Object.fromEntries(E.REGIONS.map(r=>[r.id,0])),offers:[],monthly:[],story:[]};}
function view(s){return s.refinery||freshExt(s)}
function upgrade(s){if(!s.refinery)s.refinery=freshExt(s);if(s.refinery.version===LEGACY){s.refinery.version=EXT;s.refinery.offers=[];s.refinery.monthly=[];s.lineage=s.lineage||{};s.lineage.refineryMigration='V1.6 Sofortverkaeufe als historische Buchungen erhalten; neue Verkaeufe nur am Monatsende';}return s.refinery}
function validateExt(s){baseValidate(s);let a=view(s);ok(a.version===EXT||a.version===LEGACY,'Raffinerieformat ungültig');ok(a.plants&&a.salesMilli,'Raffineriedaten fehlen');ok(Array.isArray(a.story)&&(a.story.length<=1000),'Chronik beschädigt');for(const r of E.REGIONS){ok(validInt(a.salesMilli[r.id])&&a.salesMilli[r.id]<=SALE_LIMIT,'Absatzgrenze beschädigt');for(const f of s.companies){let p=a.plants[f.id]?.[r.id];ok(p&&typeof p.built==='boolean'&&typeof p.route==='boolean','Raffinerie fehlt');ok(!p.route||p.built,'Vertriebsroute ohne Raffinerie');ok(validInt(p.productMilli)&&validInt(p.processedMilli)&&p.processedMilli<=MAX_OUTPUT,'Produktmenge beschädigt');ok(p.built||(!p.route&&!p.productMilli&&!p.processedMilli),'Produkt ohne Raffinerie');}}
if(a.version===EXT){ok(Array.isArray(a.offers)&&a.offers.length<=10000,'Auftragsliste beschädigt');ok(Array.isArray(a.monthly)&&a.monthly.length<=120,'Monatsnachweise beschädigt');let seen=new Set();for(const o of a.offers){ok(o&&typeof o.id==='string'&&!seen.has(o.id),'Doppelte Angebotskennung');seen.add(o.id);ok(o.month===s.month,'Auftrag aus fremdem Monat');ok(s.companies.some(f=>f.id===o.companyId),'Firma des Angebots fehlt');ok(E.REGIONS.some(r=>r.id===o.region),'Region fehlt');ok(validInt(o.qtyMilli)&&o.qtyMilli>0&&o.qtyMilli<=MAX_OUTPUT,'Angebotsmenge ungültig');ok(a.plants[o.companyId][o.region].built&&a.plants[o.companyId][o.region].route,'Auftrag ohne Werk oder Vertriebsroute');}ok(s.phase==='TURN'||a.offers.length===0,'Unverrechnete Aufträge nach Monatsende');}
return true;}
function charge(s,f,cent,days,code,note){ok(f.cashCent>=cent,'Nicht genügend Bargeld');ok(f.daysUsed+days<=E.CFG.monthDays,'Nicht genügend Spieltage');f.cashCent-=cent;f.daysUsed+=days;f.ledger.push({id:`RF-${s.month}-${f.id}-${s.sequence}-${f.ledger.length}`,month:s.month,deltaCent:-cent,code,info:note});}
function story(s,f,cmd,r){const scenes={REFINERY_BUILD:['PPPOPPI','Das Werk steht. Die Formulare haben bereits Schichtbetrieb.'],REFINE_BATCH:['Milchmädchen Pete','Zehn Barrel rein, neun raus. Die Differenz heißt Berufserfahrung.'],ROUTE_BUILD:['Edna Ruppen','Die Vertriebsroute steht. Das Kleingedruckte fährt voraus.'],REFINED_SELL:['PPPOPPI','Verkaufsauftrag vorgemerkt. Geld gibt es erst nach dem Monatsabschluss.']};const [character,text]=scenes[cmd.type];s.refinery.story.push({month:s.month,company:f.id,character,action:cmd.type,region:r.id,text});s.refinery.story=s.refinery.story.slice(-1000);s.events.push({month:s.month,type:'RAFFINERIE_'+cmd.type,company:f.id,region:r.id,source:'berlin-adaption'});}
function settleProducts(s){let a=upgrade(s),month={month:s.month,regions:{},orderIds:a.offers.map(o=>o.id).sort()};for(const region of E.REGIONS){const fids=s.companies.map(f=>f.id).sort();const grouped=Object.fromEntries(fids.map(id=>[id,0]));for(const o of a.offers.filter(o=>o.region===region.id))grouped[o.companyId]+=o.qtyMilli;
const portions=OLD.allocLargestRemainder(fids.filter(id=>grouped[id]>0).map(id=>({id,qty:grouped[id]})),SALE_LIMIT);const allocations={};const priceCent=Math.floor((s.prices[region.id]*130+50)/100);
for(const id of fids){const offered=grouped[id],sold=portions[id]||0,returned=offered-sold;ok(sold>=0&&sold<=offered,'Fehlerhafte Verteilung');const plant=a.plants[id][region.id],f=s.companies.find(x=>x.id===id);plant.productMilli+=returned;const revenueCent=Math.floor((sold*priceCent+500)/1000);if(revenueCent){ok(Number.isSafeInteger(f.cashCent+revenueCent),'Buchungsüberlauf');f.cashCent+=revenueCent;f.monthRevenueCent+=revenueCent;f.ledger.push({id:`RF-SALE-${s.month}-${id}-${region.id}`,month:s.month,deltaCent:revenueCent,code:'RAFFINIERT_MONATSVERKAUF',info:`${region.id}: ${sold}/1000 Barrel`});}allocations[id]={offeredMilli:offered,soldMilli:sold,returnedMilli:returned,revenueCent};}
const totalSold=Object.values(allocations).reduce((x,o)=>x+o.soldMilli,0);ok(totalSold<=SALE_LIMIT,'Absatzgrenze überschritten');a.salesMilli[region.id]=totalSold;month.regions[region.id]={demandMilli:SALE_LIMIT,priceCent,allocations,soldMilli:totalSold};}a.offers=[];a.monthly.push(month);a.monthly=a.monthly.slice(-120);s.events.push({month:s.month,type:'RAFFINIERT_MARKT_ABGERECHNET',source:'berlin-adaption'});return month;}
function transition(input,cmd){validateExt(input);ok(cmd&&typeof cmd.type==='string'&&typeof cmd.requestId==='string'&&cmd.requestId.length>=3,'Ungültige Aktion');if(input.processedIds.includes(cmd.requestId))return {state:cp(input),duplicate:true};
const local=['REFINERY_BUILD','REFINE_BATCH','ROUTE_BUILD','REFINED_SELL'];
if(!local.includes(cmd.type)){
 let work=cp(input);upgrade(work);let monthReport=null;
 // Last human ends month; remaining AI turns are resolved by the unchanged base engine.
 // Credit the common refinery auction BEFORE base payroll and rescue evaluation.
 if(cmd.type==='END_TURN'&&work.phase==='TURN'&&!work.minigame&&work.companies[work.turnIndex]?.id===cmd.companyId&&work.companies[work.turnIndex]?.type==='human'&&work.companies.slice(work.turnIndex+1).every(f=>f.type==='ai'))monthReport=settleProducts(work);
 const result=baseTransition(work,cmd);if(result.duplicate)return result;let s=result.state;s.refinery=cp(work.refinery);
 if(monthReport){ok(s.phase!=='TURN','Monatsabschluss wurde nicht erreicht');s.lastReport.refinery=cp(monthReport);s.reports[s.reports.length-1].refinery=cp(monthReport);}
 if(cmd.type==='NEXT_MONTH'){for(const r of E.REGIONS)s.refinery.salesMilli[r.id]=0;for(const firm of Object.values(s.refinery.plants))for(const plant of Object.values(firm))plant.processedMilli=0;}
 if(cmd.type==='RESTART')for(const p of Object.values(s.refinery.plants[cmd.companyId]||{}))Object.assign(p,{built:false,route:false,productMilli:0,processedMilli:0});
 validateExt(s);return {...result,state:s};
}
ok(input.phase==='TURN'&&!input.minigame,'Aktion derzeit gesperrt');const s=cp(input),f=s.companies[s.turnIndex];ok(f&&f.type==='human'&&f.id===cmd.companyId,'Falscher Spielerzug');let a=upgrade(s);const c=s.claims[cmd.claimId],r=E.REGIONS.find(q=>q.id===(cmd.region||c?.region));ok(r,'Region fehlt');const p=a.plants[f.id][r.id];const own=Object.values(s.claims).filter(x=>x.region===r.id&&x.owner===f.id&&x.drilled);
if(cmd.type==='REFINERY_BUILD'){ok(!p.built,'Raffinerie bereits errichtet');ok(own.length>0,'Erschlossenen eigenen Claim benötigt');charge(s,f,BUILD_CENT,4,'RAFFINERIE_BAU',r.id);p.built=true;}
else if(cmd.type==='ROUTE_BUILD'){ok(p.built&&!p.route,'Werk oder Route ungültig');charge(s,f,ROUTE_CENT,2,'VERTRIEBSROUTE',r.id);p.route=true;}
else if(cmd.type==='REFINE_BATCH'){ok(p.built,'Raffinerie fehlt');ok(c&&c.owner===f.id&&c.region===r.id&&c.drilled,'Erschlossenen eigenen Claim benötigt');ok(!c.burning&&!c.damaged,'Anlage gestört');ok(c.inventoryMilli>=RAW_BATCH,'Mindestens zehn Barrel Rohöl nötig');ok(p.processedMilli+RAW_BATCH<=MAX_OUTPUT,'Monatliche Verarbeitungskapazität erreicht');charge(s,f,REFINE_CENT,2,'RAFFINERIE_VERARBEITUNG',c.id);c.inventoryMilli-=RAW_BATCH;p.productMilli+=YIELD;p.processedMilli+=RAW_BATCH;}
else if(cmd.type==='REFINED_SELL'){ok(p.built&&p.route,'Raffinerie und Vertriebsroute erforderlich');ok(p.productMilli>=YIELD,'Nicht genügend Fertigware');ok(f.daysUsed+1<=E.CFG.monthDays,'Nicht genügend Spieltage');f.daysUsed++;p.productMilli-=YIELD;a.offers.push({id:cmd.requestId,companyId:f.id,region:r.id,qtyMilli:YIELD,month:s.month});}
story(s,f,cmd,r);s.sequence++;s.processedIds.push(cmd.requestId);validateExt(s);return {state:s,duplicate:false};}
E.fresh=function(opts){const s=baseFresh(opts);s.refinery=freshExt(s);validateExt(s);return s};E.validate=validateExt;E.transition=transition;
root.PPProfi={version:EXT,COSTS,view,validate:validateExt,upgrade};if(typeof module==='object'&&module.exports)module.exports=root.PPProfi;
})(typeof globalThis!=='undefined'?globalThis:this);
