require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/v082_strategy_engine.js');require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');require('./src/strategy_ai_v192.js');require('./src/strategy_logistics_v193.js');
const E=globalThis.OliV082;let s=E.fresh({humans:1,ais:2,seed:'V193-SCREEN-TEST'});
for(const [id,cid] of [['A1','BRANDENBURG-1'],['A2','BRANDENBURG-2']]){let c=s.claims[cid],f=s.companies.find(x=>x.id===id);c.owner=id;c.drilled=true;c.inventoryMilli=20000;f.cashCent=50000000;
let p=s.refinery.plants[id].BRANDENBURG;p.built=true;p.route=true;const t=s.transport.firms[id].BRANDENBURG;t.enabled=true;t.marketMilli=18000;}
E.validate(s);s=E.transition(s,{type:'END_TURN',companyId:'H1',requestId:'VISUAL-QA193'}).state;E.validate(s);
require('node:fs').writeFileSync('evidence_v193/BELEGSPIELSTAND_V193.json',JSON.stringify(s,null,2));
console.log('SAVED',s.phase,'LOGISTICS',s.events.filter(x=>x.type==='KI_LOGISTIK').length,'MONTH',s.month);
