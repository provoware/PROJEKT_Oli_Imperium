'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_strategy_engine.js');require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');require('./src/strategy_ai_v192.js');
const E=globalThis.OliV082,A=globalThis.PPStrategicAI;
let serial=0;function send(s,cmd,companyId){return E.transition(s,{type:cmd,companyId,requestId:'RUN-'+(++serial)}).state}
function loop({seed,humans,ais,months,legacy=false}){
 const t=Date.now(),was=A.enabled;A.enabled=!legacy;let s=E.fresh({seed,humans,ais}),checked=0,rescues=0;
 try{
  for(let m=0;m<months;m++){
   if(s.phase==='RESCUE')throw Error('Unerwartete Restrettung');
   while(s.phase==='TURN'){
    const f=s.companies[s.turnIndex];assert.equal(f.type,'human');s=send(s,'END_TURN',f.id);
   }
   for(let r=0;s.phase==='RESCUE'&&r<15;r++){
    let id=s.rescueIds[0],company=s.companies.find(f=>f.id===id);
    if(!company.loanUsed){s=send(s,'RESCUE_LOAN',id)}
    else{s=send(s,'RESTART',id);rescues++}
   }
   assert.equal(s.phase,'REPORT');E.validate(s);checked++;
   s=send(s,'NEXT_MONTH','H1');E.validate(s);
  }
 }finally{A.enabled=was}
 const ai=s.companies.filter(f=>f.type==='ai');
 const actions=s.events.filter(e=>e.type==='KI_ENTSCHEIDUNG');
 const types=Object.fromEntries([...new Set(actions.map(e=>e.action))].map(k=>[k,actions.filter(x=>x.action===k).length]));
 return {seed,humans,ais,months,legacy,checked,ai:ai.map(f=>({id:f.id,profile:A.profile(f.id),cashCent:f.cashCent,debtCent:f.debtCent,awards:f.stats.awards,rescues:f.stats.rescues,owned:Object.values(s.claims).filter(c=>c.owner===f.id).length,drilled:Object.values(s.claims).filter(c=>c.owner===f.id&&c.drilled).length})),decisions:actions.length,actionTypes:types,finalMonth:s.month,totalRescues:rescues,elapsedMs:Date.now()-t};
}
const configs=[
 {seed:'LANGZEIT-BERLIN-1',humans:1,ais:3,months:96},
 {seed:'LANGZEIT-BERLIN-2',humans:2,ais:2,months:96},
 {seed:'LANGZEIT-BERLIN-3',humans:1,ais:3,months:120},
 {seed:'LANGZEIT-BERLIN-1',humans:1,ais:3,months:96,legacy:true}
];
const result=[];for(const args of configs){const x=loop(args);result.push(x);console.log('RUN',args.seed,args.months,'legacy',!!args.legacy,'decisions',x.decisions,'duration-ms',x.elapsedMs,'rescue',x.totalRescues,'cash',x.ai.map(f=>f.cashCent).join(','));}
fs.mkdirSync('./evidence_v192',{recursive:true});fs.writeFileSync('./evidence_v192/LANGZEITVERGLEICH_V193.json',JSON.stringify({runs:result,c64Reference:'not-tested',kubuntuPersonalAcceptance:'deferred',metricsAreNotBalanceProof:true},null,2));
console.log('TOTAL_MONTHS',result.reduce((x,r)=>x+r.months,0));
