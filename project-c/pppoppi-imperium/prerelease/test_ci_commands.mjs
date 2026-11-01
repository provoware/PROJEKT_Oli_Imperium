import test from 'node:test';
import assert from 'node:assert/strict';
import {extractStep,validateCommandClaim,verifyCommandClaims,fetchWorkflowAtCommit} from './verify_ci_commands.mjs';
const commit='a'.repeat(40), workflowPath='.github/workflows/pppoppi-imperium-recovery.yml';
const item={gate:'BAL-02',runId:123,jobId:456,stepName:'Wirtschaftliche Fachprüfungen',
  url:'https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/123',commit,event:'push',
  evidencePath:'project-c/pppoppi-imperium/prerelease/evidence/BAL-02.json'};
const proof={ci_workflow_path:workflowPath,ci_job_name:'check-source',
  ci_working_directory:'project-c/pppoppi-imperium/SPIEL',
  ci_expected_commands:['node evaluate_balance_v194.cjs','node ../quality_v194/test_balance_report_v194.cjs']};
const run={id:123,html_url:item.url,repository:{full_name:'provoware/PROJEKT_Oli_Imperium'},
  status:'completed',conclusion:'success',head_sha:commit,event:'push',path:workflowPath};
const jobs=[{id:456,run_id:123,name:'check-source',status:'completed',conclusion:'success',
  steps:[{name:item.stepName,status:'completed',conclusion:'success'}]}];
const workflow=[
'name: example','jobs:','  check-source:','    runs-on: ubuntu-latest','    steps:',
'      - uses: actions/checkout@v4','      - name: Andere Prüfung','        run: node other.cjs',
'      - name: Wirtschaftliche Fachprüfungen',
'        working-directory: project-c/pppoppi-imperium/SPIEL','        run: |',
'          set -e','          # node fake.cjs','          node evaluate_balance_v194.cjs',
'          node ../quality_v194/test_balance_report_v194.cjs',
'          git diff --exit-code -- evidence_v194/BALANCE_V194.json',''].join('\n');
test('Historischen Job und Shell-Zeilen aus YAML-Teilmenge lesen',()=>{
  assert.deepEqual(extractStep(workflow,'check-source',item.stepName),{
    workingDirectory:proof.ci_working_directory,
    commands:['set -e',...proof.ci_expected_commands,'git diff --exit-code -- evidence_v194/BALANCE_V194.json']});
});
test('Alle belegten Befehle in korrekter Reihenfolge akzeptieren',()=>{
  assert.deepEqual(validateCommandClaim(item,proof,run,jobs,workflow),[]);
});
test('Fehlende, nur kommentierte und vertauschte Befehle sind FAIL',()=>{
  for(const commands of [['node fake.cjs'],['node evaluate_balance_v194.cjs extra'],
    [...proof.ci_expected_commands].reverse(),[]])
    assert.notEqual(validateCommandClaim(item,{...proof,ci_expected_commands:commands},run,jobs,workflow).length,0);
});
test('Falscher Workflow-Pfad, Commit, Jobname und Arbeitsordner sind FAIL',()=>{
  for(const r of [{...run,path:'.github/workflows/other.yml'},{...run,head_sha:'b'.repeat(40)}])
    assert.notEqual(validateCommandClaim(item,proof,r,jobs,workflow).length,0);
  assert.notEqual(validateCommandClaim(item,{...proof,ci_job_name:'other'},run,jobs,workflow).length,0);
  assert.notEqual(validateCommandClaim(item,{...proof,ci_working_directory:'other'},run,jobs,workflow).length,0);
  assert.notEqual(validateCommandClaim(item,proof,run,[{...jobs[0],name:'other'}],workflow).length,0);
});
test('Nur ein benannter Schritt im passenden Job zulaessig',()=>{
  assert.throws(()=>extractStep(workflow.replace('jobs:','jobz:'),'check-source',item.stepName),/jobs/);
  assert.throws(()=>extractStep(workflow+'      - name: Wirtschaftliche Fachprüfungen\n        run: node fake.cjs\n','check-source',item.stepName),/Eindeutiger/);
  assert.throws(()=>extractStep(workflow,'missing',item.stepName),/Workflow-Job/);
});
test('Fehlerhafter, fremder oder fehlgeschlagener Job blockiert',()=>{
  for(const bad of [[],[{...jobs[0],conclusion:'failure'}],[{...jobs[0],run_id:1}]])
    assert.notEqual(validateCommandClaim(item,proof,run,bad,workflow).length,0);
});
test('API-Ausfall ist FAIL; gleiche Lauf-/Workflowdaten werden zwischengespeichert',async()=>{
  let calls={run:0,jobs:0,workflow:0};
  const result=await verifyCommandClaims([item,{...item,gate:'BAL-03'}],()=>proof,
    async()=>{calls.run++;return run},async()=>{calls.jobs++;return jobs},
    async()=>{calls.workflow++;return workflow});
  assert.equal(result.ok,true);assert.equal(result.verified.length,2);
  assert.deepEqual(calls,{run:1,jobs:1,workflow:1});
  const failed=await verifyCommandClaims([item],()=>proof,async()=>{throw new Error('HTTP 403')},
    async()=>jobs,async()=>workflow);
  assert.equal(failed.ok,false);assert.match(failed.errors.join(' '),/HTTP 403/);
});
test('GitHub-Workflow-Abfrage auf Repository und historischen Commit begrenzt',async()=>{
  let args;
  const data=await fetchWorkflowAtCommit(commit,workflowPath,{token:'test',request:async(...v)=>{
    args=v;return {ok:true,json:async()=>({type:'file',encoding:'base64',size:Buffer.byteLength(workflow),
      content:Buffer.from(workflow).toString('base64')})};}});
  assert.equal(data,workflow);
  assert.equal(args[0],'https://api.github.com/repos/provoware/PROJEKT_Oli_Imperium/contents/'+workflowPath+'?ref='+commit);
  assert.equal(args[1].headers.Authorization,'Bearer test');
  await assert.rejects(fetchWorkflowAtCommit('invalid',workflowPath),/Ungueltiger/);
  await assert.rejects(fetchWorkflowAtCommit(commit,'../../other.yml'),/Ungueltiger/);
});
test('Fehlende, unvollstaendige oder gescheiterte GitHub-Antwort wird abgewiesen',async()=>{
  await assert.rejects(fetchWorkflowAtCommit(commit,workflowPath,{request:async()=>({ok:false,status:404})}),/HTTP 404/);
  await assert.rejects(fetchWorkflowAtCommit(commit,workflowPath,{request:async()=>({ok:true,json:async()=>({type:'file',encoding:'base64',size:100,content:'aGVsbG8='})})}),/Groesse/);
});

test('Geerbte Standardwerte duerfen keinen falschen Arbeitsordner bestaetigen',()=>{
  for (const changed of [
    workflow.replace('jobs:', 'defaults:\n  run:\n    working-directory: falscher-ordner\njobs:'),
    workflow.replace('    steps:', '    defaults:\n      run:\n        working-directory: falscher-ordner\n    steps:')
  ]) {
    assert.throws(()=>extractStep(changed,'check-source',item.stepName),/Standardwerte/);
  }
});
