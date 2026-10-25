const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const base=path.resolve(__dirname,'..');
const screens=JSON.parse(fs.readFileSync(base+'/reference/screens.json','utf8'));
const nav=JSON.parse(fs.readFileSync(base+'/config/navigation_v05.json','utf8'));
const ids=new Set(screens.map(x=>x.id));
let checks=0;
function test(cond,msg){assert.ok(cond,msg);checks++;}
test(ids.size===screens.length,'Bildschirmkennungen einmalig');
test(new Set(nav.map(x=>x.id)).size===nav.length,'Navigationskennungen einmalig');
for(const e of nav){test(ids.has(e.from_screen)&&ids.has(e.to_screen),'Unbekannter Screen in '+e.id);test(typeof e.guard==='string'&&e.guard.length>0,'Guard fehlt: '+e.id);test(typeof e.implemented==='boolean','Implementierungsangabe fehlt: '+e.id);test(e.time_cost_days===0,'Navigation darf keine Spieltage verbrauchen: '+e.id);test(e.test_id,'Prüfkennung fehlt: '+e.id);test(e.evidence_level==='BERLIN_DESIGN_NOT_C64','Herkunft unklar: '+e.id);}
function reachable(start){let found=new Set([start]);for(let changed=true;changed;){changed=false;for(const e of nav){if(found.has(e.from_screen)&&!found.has(e.to_screen)){found.add(e.to_screen);changed=true;}}}return found;}
const all=reachable('SCR-START');test(all.size===screens.length,'Nicht erreichbar: '+screens.filter(s=>!all.has(s.id)).map(x=>x.id));
const hq=ids.has('SCR-HQ');test(hq,'Zentrale fehlt');
for(const s of screens){if(!['SCR-START','SCR-SETUP'].includes(s.id))test(reachable(s.id).has('SCR-HQ'),`Kein Weg zurück zum Büro: ${s.id}`);}
for(const e of nav.filter(x=>x.implemented&&x.mutates_financial_state))test(['NAV-002','NAV-058','NAV-060'].includes(e.id),'Implementierte Finanznavigation ohne expliziten Prozess: '+e.id);
test(nav.some(x=>x.from_screen==='SCR-END-TURN'&&x.to_screen==='SCR-RESCUE'),'Krisenpfad muss vorhanden sein');
test(nav.some(x=>x.from_screen==='SCR-RESCUE'&&x.to_screen==='SCR-MONTH-REPORT'),'Rettungsrückweg muss vorhanden sein');
console.log('OK:',screens.length,'Screens,',nav.length,'Kanten,',nav.filter(x=>x.implemented).length,'implementierte Kanten;',checks,'Strukturprüfungen bestanden');
