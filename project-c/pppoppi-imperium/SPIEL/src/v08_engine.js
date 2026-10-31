/* PPPOPPI IMPERIUM V0.8 – independent game mechanics on top of the unchanged V0.7 core.
   Historical C64 behaviour is not asserted: this module implements new satirical variant rules. */
(function(root,factory){const BASE=typeof module==='object'&&module.exports?require('./v07_engine.js'):root.OliV07;
 const api=factory(BASE);if(typeof module==='object'&&module.exports)module.exports=api;root.OliV08=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BASE){'use strict';
const SCHEMA='pppoppi.berlin.save/0.8', RULESET='berlin-economy/0.8.0', clone=x=>JSON.parse(JSON.stringify(x));
const C=Object.freeze({tankUpgradeMilli:150000,tankUpgradeCost:1200000,tankMaxLevel:3,drillSelfCost:4000000,drillSelfDays:4,pipeCost:250000,pipeDays:2,pipeRefund:40000,fireSelfCost:500000,fireSelfDays:2,fireExpertCost:1200000,fireExpertDays:2,repairCost:850000,repairDays:2,securityCost:350000,securityDays:1,sabotageCost:700000,sabotageDays:2});
const directions=['LINKS','MITTE','RECHTS'];
function ok(x,msg){if(!x)throw Error(msg);}function safe(x){ok(Number.isSafeInteger(x)&&x>=0,'Ungültige Zahl');return x;}
function backupCompatible(s){const b=clone(s);b.schema=BASE.SCHEMA;b.ruleset=BASE.RULESET;delete b.minigame;delete b.v08Notes;return b;}
function fieldUpgrade(x){if(!x.v08)x.v08={tankLevel:1,pipeline:false,burning:false,damaged:false,securityUntil:0};return x.v08;}
function promote(input){const s=clone(input);ok(s.schema===BASE.SCHEMA||s.schema===SCHEMA,'Nur V0.7 oder V0.8 übernehmbar');BASE.validate(backupCompatible(s));s.schema=SCHEMA;s.ruleset=RULESET;s.minigame??=null;s.v08Notes??=[];
 for(const f of s.companies)for(const r of BASE.REGIONS)fieldUpgrade(f.fields[r.id]);validate(s);return s;}
function fresh(opts={}){return promote(BASE.fresh(opts));}
function validate(s){ok(s&&s.schema===SCHEMA&&s.ruleset===RULESET,'Falsches V0.8-Dateiformat');BASE.validate(backupCompatible(s));ok(s.minigame===null||s.minigame&&typeof s.minigame==='object','Minispielstatus beschädigt');ok(Array.isArray(s.v08Notes)&&s.v08Notes.length<50000,'Ereignisverlauf zu groß');
 for(const f of s.companies)for(const r of BASE.REGIONS){const x=f.fields[r.id],v=x.v08;ok(v&&Number.isSafeInteger(v.tankLevel)&&v.tankLevel>=1&&v.tankLevel<=C.tankMaxLevel,'Tankstufe ungültig');ok(['pipeline','burning','damaged'].every(k=>typeof v[k]==='boolean'),'Feldzustand beschädigt');safe(v.securityUntil);ok(x.tankMilli===r.tank+(v.tankLevel-1)*C.tankUpgradeMilli,'Tankkapazität passt nicht zur Stufe');ok(!v.pipeline||x.drilled,'Pipeline ohne Bohrung');ok(!v.burning||x.drilled,'Brand ohne Bohrung');}
 if(s.minigame){const m=s.minigame;ok(['DRILL','PIPE','FIRE'].includes(m.kind)&&typeof m.region==='string'&&s.companies.some(f=>f.id===m.companyId),'Unbekanntes Minispiel');ok(m.companyId===s.companies[s.turnIndex].id&&s.phase==='TURN','Minispiel nicht in aktivem Zug');ok(Number.isSafeInteger(m.step)&&m.step>=0&&m.step<3&&Array.isArray(m.pattern)&&m.pattern.length===3&&m.pattern.every(d=>directions.includes(d)),'Minispielschritte ungültig');}
 return true;}
function pay(s,f,cent,code,detail){safe(cent);ok(f.cashCent>=cent,'Nicht genügend Guthaben');f.cashCent-=cent;f.ledger.push({id:`V08-${s.sequence}-${f.ledger.length+1}`,month:s.month,code,deltaCent:-cent,info:detail});}
function credit(s,f,cent,code,detail){safe(cent);ok(Number.isSafeInteger(f.cashCent+cent),'Betrag zu groß');f.cashCent+=cent;f.ledger.push({id:`V08-${s.sequence}-${f.ledger.length+1}`,month:s.month,code,deltaCent:cent,info:detail});}
function days(f,n){ok(f.daysUsed+n<=BASE.CFG.monthDays,'Nicht genügend Spieltage');f.daysUsed+=n;}
function narrate(s,code,detail){s.events.push({month:s.month,type:code,...detail});s.v08Notes.push({month:s.month,kind:code,...detail});}
function determine(s,kind,region){const ix=BASE.REGIONS.findIndex(r=>r.id===region);const n=(s.month+ix+s.seed.length+(kind==='DRILL'?0:kind==='PIPE'?1:2))%3;return [directions[n],directions[(n+1)%3],directions[(n+2)%3]];}
function startMini(s, f,x,cmd){const kind=cmd.type==='DRILL_SELF_START'?'DRILL':cmd.type==='PIPE_START'?'PIPE':'FIRE';
 const v=x.v08;ok(!s.minigame,'Zuerst laufendes Minispiel beenden');
 if(kind==='DRILL'){ok(x.owned&&!x.drilled,'Eigenbohrung benötigt unerschlossenes eigenes Feld');days(f,C.drillSelfDays);pay(s,f,C.drillSelfCost,'EIGENBOHRUNG',cmd.region);}
 else if(kind==='PIPE'){ok(x.drilled&&!v.pipeline&&!v.burning&&!v.damaged,'Pipeline nur an intakter Bohrung möglich');days(f,C.pipeDays);pay(s,f,C.pipeCost,'PIPELINE',cmd.region);}
 else{ok(x.drilled&&v.burning,'Brandbekämpfung setzt brennende Quelle voraus');days(f,C.fireSelfDays);pay(s,f,C.fireSelfCost,'FEUERWEHR_EIGEN',cmd.region);}
 s.minigame={kind,companyId:f.id,region:cmd.region,step:0,pattern:determine(s,kind,cmd.region)};
 narrate(s,'MINI_START',{company:f.id,kind,region:cmd.region});
}
function miniStep(s,cmd){const m=s.minigame;ok(m&&m.companyId===cmd.companyId,'Kein eigenes Minispiel aktiv');ok(directions.includes(cmd.choice),'Steuerung nur LINKS, MITTE oder RECHTS');const f=s.companies[s.turnIndex],x=f.fields[m.region];
 if(cmd.choice!==m.pattern[m.step]){if(m.kind==='FIRE')x.v08.damaged=true;narrate(s,'MINI_FAIL',{company:f.id,kind:m.kind,region:m.region,step:m.step,choice:cmd.choice});s.minigame=null;return;}
 m.step++;if(m.step<3)return;switch(m.kind){case 'DRILL':x.drilled=true;break;case 'PIPE':x.v08.pipeline=true;break;case 'FIRE':x.v08.burning=false;x.v08.damaged=false;break;}
 narrate(s,'MINI_SUCCESS',{company:f.id,kind:m.kind,region:m.region});s.minigame=null;}
function fireEvent(s){/* Fixed documented trigger: every fourth month; no disguised randomness. */
 if(s.month%4!==0)return;const candidates=[];for(const f of s.companies)for(const r of BASE.REGIONS){const x=f.fields[r.id];if(x.drilled&&!x.v08.burning)candidates.push({f,r,x});}
 if(candidates.length){const c=candidates[(s.month/4-1)%candidates.length];c.x.v08.burning=true;narrate(s,'FEUER',{company:c.f.id,region:c.r.id,origin:'REGEL_V08_JEDER_VIERTE_MONAT'});}}
const wrapped=new Set(['SURVEY','BUY','DRILL','PUMP','SHIP','OFFER','CANCEL','SIGN','END_TURN','NEXT_MONTH','RESCUE_LOAN','RESCUE_SALE','RESTART']);
function transition(source,cmd){validate(source);ok(cmd&&typeof cmd.requestId==='string'&&cmd.requestId.length>=3&&cmd.requestId.length<=100,'Request-ID erforderlich');if(source.processedIds.includes(cmd.requestId))return {state:clone(source),duplicate:true};
 const s=clone(source),f=s.companies[s.turnIndex];ok(cmd.companyId===f.id||['NEXT_MONTH'].includes(cmd.type)||['RESCUE_LOAN','RESCUE_SALE','RESTART'].includes(cmd.type),'Nicht die aktive Firma');
 if(s.minigame)ok(cmd.type==='MINI_STEP','Aktives Minispiel muss abgeschlossen werden');
 if(wrapped.has(cmd.type)){
  if(cmd.type==='PUMP'){const x=f.fields[cmd.region];ok(x&&!x.v08.burning&&!x.v08.damaged,'Bohrfeld gesperrt: Brand oder Beschädigung');}
  const v=BASE.transition(backupCompatible(s),cmd);const t=promote(v.state);
  if(cmd.type==='SHIP'){const x=t.companies[t.turnIndex].fields[cmd.region];if(x&&x.v08.pipeline)credit(t,t.companies[t.turnIndex],C.pipeRefund,'PIPELINE_BONUS',cmd.region);}
  if(cmd.type==='NEXT_MONTH')fireEvent(t);
  validate(t);return {state:t,duplicate:v.duplicate};
 }
 ok(s.phase==='TURN'&&f.type==='human'&&f.id===cmd.companyId,'Aktion nur beim aktiven menschlichen Unternehmen');const r=BASE.REGIONS.find(r=>r.id===cmd.region);ok(r,'Region angeben');const x=f.fields[r.id];s.sequence++;
 switch(cmd.type){
 case 'TANK_UPGRADE':ok(x.owned&&x.v08.tankLevel<C.tankMaxLevel,'Tank nur am eigenen Feld, maximale Ausbaustufe beachten');days(f,2);pay(s,f,C.tankUpgradeCost,'TANK_AUSBAU',r.id);x.v08.tankLevel++;x.tankMilli+=C.tankUpgradeMilli;break;
 case 'DRILL_SELF_START':case 'PIPE_START':case 'FIRE_START':startMini(s,f,x,cmd);break;
 case 'FIRE_EXPERT':ok(x.v08.burning,'Kein Brand zu löschen');days(f,C.fireExpertDays);pay(s,f,C.fireExpertCost,'FEUERWEHR_PROFI',r.id);x.v08.burning=false;x.v08.damaged=false;narrate(s,'FEUER_GELOESCHT',{company:f.id,region:r.id});break;
 case 'REPAIR':ok(x.owned&&x.v08.damaged&&!x.v08.burning,'Reparatur nur bei beschädigtem, nicht brennendem Feld');days(f,C.repairDays);pay(s,f,C.repairCost,'REPARATUR',r.id);x.v08.damaged=false;break;
 case 'SECURITY':ok(x.owned,'Sicherheit nur auf eigenem Feld');days(f,C.securityDays);pay(s,f,C.securityCost,'OBJEKTSCHUTZ',r.id);x.v08.securityUntil=s.month+2;break;
 case 'SABOTAGE':{const victim=s.companies.find(t=>t.id===cmd.target);ok(victim&&victim.id!==f.id,'Anderen Konkurrenten wählen');const fx=victim.fields[r.id];ok(fx.drilled&&!fx.v08.damaged&&!fx.v08.burning,'Zielanlage nicht angreifbar');days(f,C.sabotageDays);pay(s,f,C.sabotageCost,'SABOTAGE_PLAN',r.id);const blocked=fx.v08.securityUntil>=s.month;const fail=(s.month+f.id.charCodeAt(0)+victim.id.charCodeAt(1))%3===0;if(!blocked&&!fail)fx.v08.damaged=true;narrate(s,blocked?'SABOTAGE_ABGEWEHRT':fail?'SABOTAGE_MISSGLUECKT':'SABOTAGE_TREFFER',{company:f.id,target:victim.id,region:r.id});break;}
 default:if(cmd.type==='MINI_STEP'){miniStep(s,cmd);break;}throw Error('Unbekannte V0.8-Aktion');
 }
 s.processedIds.push(cmd.requestId);validate(s);return {state:s,duplicate:false};
}
return {SCHEMA,RULESET,REGIONS:BASE.REGIONS,CFG:BASE.CFG,V08:C,BASE,fresh,promote,validate,transition};
});
