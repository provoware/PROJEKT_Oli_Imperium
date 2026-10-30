'use strict';
// V1.9.4: reproducible scenario comparison, not a claim that the AI is balanced.
const fs=require('fs'); const assert=require('node:assert/strict');
for(const file of ['v07_engine','v08_engine','v082_strategy_engine','profi_economy','logistics_v17','public_network_v171','strategy_ai_v192','strategy_logistics_v193']) require('./src/'+file+'.js');
const E=globalThis.OliV082,A=globalThis.PPStrategicAI;
let serial=0;
function act(s,type,id='H1',extra={}){return E.transition(s,{type,companyId:id,requestId:'BAL194-'+(++serial),...extra}).state}
function humanMove(s,mode){
 if(mode==='active'){
  // Real actions through transition(), not artificial cash injection.
  let count=0;for(const c of Object.values(s.claims).sort((a,b)=>a.id.localeCompare(b.id))){
   if(count>4)break;
   const commands=c.owner==='H1'?(!c.drilled?['DRILL']:c.inventoryMilli>0?['SHIP','OFFER']:['PUMP']):c.owner===null?['SURVEY','BUY']:[];
   for(const type of commands)try{s=act(s,type,'H1',{claimId:c.id});count++;}catch(_){};
   if(s.companies[0].daysUsed>=E.CFG.monthDays-4)break;
  }
 }
 return act(s,'END_TURN');
}
function next(s){let guard=0;while(s.phase==='RESCUE'){
 if(++guard>12)throw Error('Rettungsschleife');const id=s.rescueIds[0];const f=s.companies.find(x=>x.id===id);
 try{s=act(s,f.loanUsed?'RESTART':'RESCUE_LOAN',id)}catch(_){s=act(s,'RESTART',id)}
 }
 assert.equal(s.phase,'REPORT');return act(s,'NEXT_MONTH');}
function run(name,mode,months,mod){let s=E.fresh({humans:1,ais:3,seed:'V194-EVAL-'+name});
 if(mod==='low_demand')for(const r of E.REGIONS)s.demand[r.id]=Math.floor(s.demand[r.id]*.45);
 if(mod==='low_price')for(const r of E.REGIONS)s.prices[r.id]=Math.floor(s.prices[r.id]*.52);
 const logs=[];let bad=0;for(let i=0;i<months;i++){
  assert.equal(s.phase,'TURN');s=humanMove(s,mode);s=next(s);E.validate(s);
  for(const c of Object.values(s.claims))assert.ok(c.reserveMilli>=0&&c.inventoryMilli>=0&&c.preparedMilli>=0);
  for(const f of s.companies)assert.ok(f.cashCent>=0&&f.debtCent>=0&&f.daysUsed<=E.CFG.monthDays);
  const byFirm=s.companies.map(f=>({id:f.id,kind:f.type, cashCent:f.cashCent,debtCent:f.debtCent,fields:Object.values(s.claims).filter(c=>c.owner===f.id).length, rescues:f.stats.rescues}));
  logs.push({month:i+1, firms:byFirm});
 }
 const events=s.events;const actions=events.filter(e=>e.type==='KI_ENTSCHEIDUNG');
 const net=events.filter(e=>e.type==='KI_LOGISTIK');
 const final=logs.at(-1).firms;
 return {name,mode,months,passed:true,final,metrics:{strategicDecisions:actions.length,logisticDecisions:net.length,totalRescues:final.reduce((a,b)=>a+b.rescues,0),companiesWithFields:final.filter(f=>f.fields>0).length},annual:logs.filter((x,i)=>(i+1)%12===0||i===logs.length-1)};
}
const scenarios=[['passive_normal','passive',36,null],['active_normal','active',36,null],['active_low_demand','active',36,'low_demand'],['active_low_price','active',36,'low_price']];
const results=scenarios.map(args=>run(...args));assert.equal(results.length,4);
fs.mkdirSync('evidence_v194',{recursive:true});fs.writeFileSync('evidence_v194/BALANCE_V194.json',JSON.stringify({version:'1.9.4',source:'actual V1.9.3 game engine',limitations:['Human agent follows deterministic simple decisions, not actual human players','No validation of C64 original','Passing invariants does not demonstrate fair or fun balance'],results},null,2));
console.log(JSON.stringify(results.map(r=>({case:r.name,months:r.months,...r.metrics})),null,2));console.log('OK 4/4 scenario runs, 144 months');
