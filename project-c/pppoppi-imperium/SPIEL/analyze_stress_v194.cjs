'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_strategy_engine.js');require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');require('./src/strategy_ai_v192.js');require('./src/strategy_logistics_v193.js');
const E=globalThis.OliV082;let serial=0;const send=(s,type,id='H1')=>E.transition(s,{type,companyId:id,requestId:'STRESS194-'+(++serial)}).state;
const scenarios=[
 {name:'Basis mit drei KI-Firmen',months:48,ais:3},
 {name:'Monatlicher Nachfrageeinbruch',months:36,ais:3,demand:0.4},
 {name:'Preisverfall und Ressourcenknappheit',months:36,ais:2,price:0.4,reserve:0.08},
 {name:'Erzwungener Forderungsausfall und Sanierung',months:36,ais:2,forceCash:100000,arrears:true},
];
function close(s){let safety=0;while(s.phase==='TURN'){if(++safety>10)throw Error('Zug hängt');const f=s.companies[s.turnIndex];assert.equal(f.type,'human');s=send(s,'END_TURN',f.id)}
for(let i=0;s.phase==='RESCUE'&&i<10;i++){const f=s.companies.find(x=>x.id===s.rescueIds[0]);if(!f.loanUsed){try{s=send(s,'RESCUE_LOAN',f.id);continue}catch(_){}}s=send(s,'RESTART',f.id)}
assert.equal(s.phase,'REPORT');E.validate(s);return send(s,'NEXT_MONTH')}
const results=[];
for(const caseDef of scenarios){let s=E.fresh({humans:1,ais:caseDef.ais,seed:'V194-'+caseDef.name});let cashMin=Infinity,actions=0,failures=0;
if(caseDef.price)for(const r of E.REGIONS)s.prices[r.id]=Math.floor(r.price*caseDef.price);
if(caseDef.demand)for(const r of E.REGIONS)s.demand[r.id]=Math.floor(r.demand*caseDef.demand);
if(caseDef.reserve)for(const c of Object.values(s.claims))c.reserveMilli=Math.floor(c.reserveMilli*caseDef.reserve);
if(caseDef.forceCash)for(const f of s.companies.filter(x=>x.type==='ai'))f.cashCent=caseDef.forceCash;
if(caseDef.arrears){s.companies[0].cashCent=100000;s.companies[0].obligations.push({id:'V194-UNBEZAHLBAR',priority:1,dueCent:50000000,paidCent:0,kind:'RECHNUNG'});}
E.validate(s);
for(let m=0;m<caseDef.months;m++){s=close(s);E.validate(s);for(const f of s.companies){assert.ok(f.cashCent>=0&&f.debtCent>=0);cashMin=Math.min(f.cashCent,cashMin)}for(const c of Object.values(s.claims))assert.ok(c.reserveMilli>=0);
 for(const o of (s.publicNetwork?.inTransit||[]))assert.ok(o.qtyMilli>=1000);
 actions=s.events.filter(e=>e.type==='KI_LOGISTIK').length;
}
const r={scenario:caseDef.name,months:caseDef.months,completed:s.month-1,valid:true,cashMinCent:cashMin,aiLogisticsActions:actions,aiBankruptcies:s.companies.filter(x=>x.type==='ai').reduce((a,b)=>a+b.stats.rescues,0),humanRescues:s.companies.filter(x=>x.type==='human').reduce((a,b)=>a+b.stats.rescues,0)};results.push(r);console.log('OK',r)}
fs.mkdirSync('evidence_v193',{recursive:true});fs.writeFileSync('evidence_v193/KRISEN_LANGZEIT_V194.json',JSON.stringify({runs:results,totalMonths:results.reduce((a,b)=>a+b.months,0),note:'Technische Konsistenz, kein Beweis für Balance oder historische Originaltreue'},null,2));
