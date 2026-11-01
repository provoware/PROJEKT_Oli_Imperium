import test from 'node:test';
import assert from 'node:assert/strict';
import {collectPassEvidence, validateRun, verifyPassEvidence, fetchGitHubRun} from './verify_ci_evidence.mjs';

const sha = 'a'.repeat(40);
const url = 'https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/12345';
const matrix = {gates:[{id:'QUE-02',stage:'technical',status:'pass',evidence:['project-c/pppoppi-imperium/prerelease/evidence/QUE-02.json']},
  {id:'LOG-01',stage:'technical',status:'blocked',evidence:[]},
  {id:'FRE-02',stage:'personal',status:'deferred',evidence:[]}]};
const proof = {gate_id:'QUE-02',result:'PASS',commit:sha,ci_run:url,ci_conclusion:'success',ci_event:'push'};
const read = () => structuredClone(proof);
const run = {id:12345,html_url:url,repository:{full_name:'provoware/PROJEKT_Oli_Imperium'},
  status:'completed',conclusion:'success',head_sha:sha,event:'push'};

test('Nur technische PASS-Nachweise werden geprueft',()=>{
  const items=collectPassEvidence(matrix,read);
  assert.equal(items.length,1);assert.equal(items[0].gate,'QUE-02');assert.equal(items[0].runId,12345);
});
test('GitHub-Lauf stimmt vollstaendig mit Nachweis ueberein',async()=>{
  const r=await verifyPassEvidence(matrix,read,async()=>structuredClone(run));
  assert.equal(r.ok,true);assert.equal(r.verified.length,1);assert.deepEqual(r.errors,[]);
});
test('Falscher Commit wird verworfen',()=>{
  assert.match(validateRun(collectPassEvidence(matrix,read)[0],{...run,head_sha:'b'.repeat(40)}).join(' '),/Commit-Abweichung/);
});
test('Fremdes Repository wird verworfen',()=>{
  assert.match(validateRun(collectPassEvidence(matrix,read)[0],{...run,repository:{full_name:'fremd/projekt'}}).join(' '),/Repository/);
});
test('Abgebrochener oder laufender GitHub-Job ist kein PASS',()=>{
  const item=collectPassEvidence(matrix,read)[0];
  for(const patch of [{status:'in_progress'},{conclusion:'cancelled'},{conclusion:'failure'},{conclusion:null}])
    assert.notEqual(validateRun(item,{...run,...patch}).length,0);
});
test('Falsche Laufkennung, URL und Ereignis werden erkannt',()=>{
  const item=collectPassEvidence(matrix,read)[0];
  for(const patch of [{id:54321},{html_url:url+'/evil'},{event:'pull_request'}])
    assert.notEqual(validateRun(item,{...run,...patch}).length,0);
});
test('Manipulierter Nachweis kann keinen beliebigen API-Pfad erzwingen',()=>{
  for(const altered of [{ci_run:'https://evil.example/actions/runs/12345'},
    {ci_run:'https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/12345/extra'},
    {ci_run:'https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/0'},
    {ci_conclusion:'failure'},{commit:'kurz'},{gate_id:'LOG-01'}]) {
    assert.throws(()=>collectPassEvidence(matrix,()=>({...proof,...altered})),/CI-Nachweis/);
  }
});
test('Pfadtraversal und fehlende Nachweise sind unzulaessig',()=>{
  const m=structuredClone(matrix);
  m.gates[0].evidence=['project-c/pppoppi-imperium/prerelease/evidence/../secret.json'];
  assert.throws(()=>collectPassEvidence(m,read),/Nachweispfad/);
  m.gates[0].evidence=[];
  assert.throws(()=>collectPassEvidence(m,read),/ohne Nachweis/);
});
test('API-Ausfall wird als FAIL und nicht als PASS bewertet',async()=>{
  const r=await verifyPassEvidence(matrix,read,async()=>{throw new Error('HTTP 403')});
  assert.equal(r.ok,false);assert.equal(r.verified.length,0);assert.match(r.errors.join(' '),/HTTP 403/);
});
test('Mehrfachnutzung eines Laufs wird nur einmal abgefragt',async()=>{
  const m=structuredClone(matrix);m.gates[0].evidence.push('project-c/pppoppi-imperium/prerelease/evidence/QUE-02-2.json');
  let calls=0;const r=await verifyPassEvidence(m,read,async()=>{calls++;return run;});
  assert.equal(calls,1);assert.equal(r.verified.length,2);
});
test('GitHub-HTTP-Fehler stoppt die Livepruefung',async()=>{
  await assert.rejects(fetchGitHubRun(12345,{token:'test',request:async()=>({ok:false,status:403})}),/HTTP 403/);
});
test('API-Aufruf nutzt nur festgelegtes Repository und Token als Header',async()=>{
  let args;const data=await fetchGitHubRun(12345,{token:'test',request:async(...v)=>{args=v;return {ok:true,json:async()=>run};}});
  assert.equal(data.id,12345);
  assert.equal(args[0],'https://api.github.com/repos/provoware/PROJEKT_Oli_Imperium/actions/runs/12345');
  assert.equal(args[1].headers.Authorization,'Bearer test');
});

test('Zu grosse GitHub-Laufkennungen werden nicht gerundet',()=>{
  assert.throws(()=>collectPassEvidence(matrix,()=>({...proof,ci_run:'https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/999999999999999999999'})),/Laufkennung/);
});
