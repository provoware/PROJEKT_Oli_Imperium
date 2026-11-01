import test from 'node:test';
import assert from 'node:assert/strict';
import {validateJobStep, verifyPassSteps, fetchGitHubJobs} from './verify_ci_steps.mjs';
const item = {gate:'QUE-02',runId:12345,jobId:9876,stepName:'Vollstaendige Quellenpruefung'};
const jobs = [{id:9876,run_id:12345,status:'completed',conclusion:'success',
  steps:[{name:'Vollstaendige Quellenpruefung',status:'completed',conclusion:'success'}]}];

test('Erfolgreicher Job und konkreter Pruefschritt werden bestaetigt',()=>{
  assert.deepEqual(validateJobStep(item,jobs),[]);
});
test('Fremde, fehlende und doppelte Jobkennungen werden abgewiesen',()=>{
  for(const bad of [[],[{...jobs[0],id:2}], [...jobs,...jobs]])
    assert.notEqual(validateJobStep(item,bad).length,0);
});
test('Falscher Lauf oder fehlgeschlagener Job ist kein PASS',()=>{
  for(const patch of [{run_id:1},{status:'queued'},{conclusion:'failure'}])
    assert.notEqual(validateJobStep(item,[{...jobs[0],...patch}]).length,0);
});
test('Fehlender, doppelter oder gescheiterter Pruefschritt ist kein PASS',()=>{
  for(const steps of [[], [...jobs[0].steps,...jobs[0].steps],
    [{...jobs[0].steps[0],conclusion:'failure'}],
    [{...jobs[0].steps[0],status:'in_progress'}]])
    assert.notEqual(validateJobStep(item,[{...jobs[0],steps}]).length,0);
});
test('Fehlende Jobdaten werden nicht als PASS gewertet',()=>{
  assert.notEqual(validateJobStep(item,null).length,0);
  assert.notEqual(validateJobStep(item,[{...jobs[0],steps:null}]).length,0);
});
test('Mehrere Belege desselben Laufs fragen GitHub nur einmal ab',async()=>{
  let calls=0;
  const r=await verifyPassSteps([item,{...item,gate:'TES-01'}],async()=>{calls++;return jobs;});
  assert.equal(calls,1);assert.equal(r.verified.length,2);assert.equal(r.ok,true);
});
test('GitHub-API-Ausfall und fehlende Nachweisfelder sperren PASS',async()=>{
  const failure=await verifyPassSteps([item],async()=>{throw new Error('HTTP 403')});
  assert.equal(failure.ok,false);
  const invalid=await verifyPassSteps([{...item,stepName:''}],async()=>jobs);
  assert.equal(invalid.ok,false);
});
test('Unvollstaendige oder paginierte GitHub-Jobliste wird abgelehnt',async()=>{
  for(const data of [{total_count:2,jobs}, {total_count:1,jobs:null}, {jobs}])
    await assert.rejects(fetchGitHubJobs(12345,{request:async()=>({ok:true,json:async()=>data})}),/Jobliste/);
});
test('GitHub-Jobabfrage ist repositoryfest und verwendet nur Lesetoken',async()=>{
  let args;
  const returned=await fetchGitHubJobs(12345,{token:'test',request:async(...a)=>{args=a;return {ok:true,json:async()=>({total_count:1,jobs})};}});
  assert.equal(returned.length,1);
  assert.equal(args[0],'https://api.github.com/repos/provoware/PROJEKT_Oli_Imperium/actions/runs/12345/jobs?per_page=100');
  assert.equal(args[1].headers.Authorization,'Bearer test');
});
test('GitHub-HTTP-Fehler sperrt die Jobpruefung',async()=>{
  await assert.rejects(fetchGitHubJobs(12345,{request:async()=>({ok:false,status:403})}),/HTTP 403/);
});
