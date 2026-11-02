'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const snippet=String.raw`
require('./src/v07_engine.js');require('./src/v08_engine.js');require('./src/ENGINE_NAME');
require('./src/profi_economy.js');require('./src/logistics_v17.js');require('./src/public_network_v171.js');
const E=globalThis.OliV082;
let s=E.fresh({humans:2,ais:0,seed:'HUMAN-PARITY-42'}),n=0;
function act(type,who,extra={}){s=E.transition(s,{type,companyId:who,requestId:'PARITY-'+(++n),...extra}).state;}
act('SURVEY','H1',{claimId:'BERLIN-1'});act('BUY','H1',{claimId:'BERLIN-1'});
act('DRILL','H1',{claimId:'BERLIN-1'});act('PUMP','H1',{claimId:'BERLIN-1'});
act('SHIP','H1',{claimId:'BERLIN-1'});act('OFFER','H1',{claimId:'BERLIN-1'});
act('END_TURN','H1');act('SURVEY','H2',{claimId:'BRANDENBURG-1'});act('END_TURN','H2');act('NEXT_MONTH','H1');E.validate(s);
console.log(JSON.stringify(s));`;
function run(engine){const cmd=snippet.replace('ENGINE_NAME',engine);const result=cp.spawnSync(process.execPath,['-e',cmd],{cwd:__dirname,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);return result.stdout.trim();}
const left=run('v082_engine.js'),right=run('v082_strategy_engine.js');assert.equal(left,right,'Human-only outcome must remain byte identical');
console.log('PASS Mensch-gegen-Mensch ohne KI unverändert');console.log('SHA256',crypto.createHash('sha256').update(left).digest('hex'));
