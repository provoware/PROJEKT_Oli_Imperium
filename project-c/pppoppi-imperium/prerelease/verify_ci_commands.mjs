// Kontrolliert, ob behauptete Shell-Befehle im historischen GitHub-Workflow
// des belegten erfolgreichen Jobs und Schritts tatsaechlich definiert waren.
// Absichtlich begrenzter YAML-Leser: unbekannte Struktur wird als FAIL behandelt.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditMatrix} from './check.mjs';
import {collectPassEvidence, validateRun, fetchGitHubRun} from './verify_ci_evidence.mjs';
import {validateJobStep, fetchGitHubJobs} from './verify_ci_steps.mjs';

const REPO = 'provoware/PROJEKT_Oli_Imperium';
const PREFIX = 'project-c/pppoppi-imperium/prerelease/evidence/';
const WORKFLOW = '.github/workflows/pppoppi-imperium-recovery.yml';

function unquote(value) {
  const s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1);
  return s;
}

export function extractStep(workflow, jobName, stepName) {
  if (typeof workflow !== 'string' || workflow.length > 200000 ||
      typeof jobName !== 'string' || !/^[A-Za-z0-9_-]+$/.test(jobName) ||
      typeof stepName !== 'string' || !stepName.trim()) throw new Error('Ungueltige Workflow-Abfrage');
  const lines = workflow.replace(/\r\n/g, '\n').split('\n');
  const jobs = lines.findIndex(line => line === 'jobs:');
  if (jobs < 0 || lines.filter(line => line === 'jobs:').length !== 1)
    throw new Error('Eindeutiger jobs-Block fehlt');
  const jobMarker = '  ' + jobName + ':';
  const jobStart = lines.findIndex((line, i) => i > jobs && line === jobMarker);
  if (jobStart < 0 || lines.filter(line => line === jobMarker).length !== 1)
    throw new Error('Eindeutiger Workflow-Job fehlt');
  const jobEnd = lines.findIndex((line, i) => i > jobStart && /^  [^\s#][^:]*:\s*$/.test(line));
  const jobLines = lines.slice(jobStart + 1, jobEnd < 0 ? undefined : jobEnd);
  const stepsStart = jobLines.findIndex(line => line === '    steps:');
  if (stepsStart < 0 || jobLines.filter(line => line === '    steps:').length !== 1)
    throw new Error('Eindeutiger steps-Block fehlt');
  const section = jobLines.slice(stepsStart + 1);
  const blocks = [];
  let current = null;
  for (const line of section) {
    if (/^    [^\s#]/.test(line)) break;
    if (line.startsWith('      - ')) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) current.push(line);
  }
  if (current) blocks.push(current);
  const matches = blocks.filter(block => block.some(line =>
    line.startsWith('      - name: ') && unquote(line.slice(14)) === stepName));
  if (matches.length !== 1) throw new Error('Eindeutiger benannter Workflow-Schritt fehlt');
  const block = matches[0];
  const working = block.filter(line => line.startsWith('        working-directory: '));
  if (working.length > 1) throw new Error('Mehrdeutiges Arbeitsverzeichnis');
  const runIndex = block.findIndex(line => line.startsWith('        run: '));
  if (runIndex < 0 || block.filter(line => line.startsWith('        run: ')).length !== 1)
    throw new Error('Eindeutiger run-Block fehlt');
  const header = block[runIndex].slice(13).trim();
  let commands;
  if (/^\|[-+]?$/.test(header)) {
    commands = [];
    for (const line of block.slice(runIndex + 1)) {
      if (line.trim() && !/^ {10}/.test(line)) break;
      if (/^ {10}/.test(line)) commands.push(line.slice(10).trim());
    }
  } else if (header && !header.startsWith('>')) {
    commands = [unquote(header)];
  } else throw new Error('Unbekannte run-Syntax');
  return {workingDirectory:working.length ? unquote(working[0].slice(27)) : '',
    commands:commands.filter(line => line && !line.startsWith('#'))};
}

export function validateCommandClaim(item, proof, run, jobs, workflow) {
  const errors = [...validateRun(item, run), ...validateJobStep(item, jobs)];
  if (proof?.ci_workflow_path !== WORKFLOW || run?.path !== WORKFLOW)
    errors.push('Historischer Workflow-Pfad stimmt nicht');
  const job = Array.isArray(jobs) ? jobs.find(j => j.id === item.jobId) : null;
  if (proof?.ci_job_name !== 'check-source' || job?.name !== proof?.ci_job_name)
    errors.push('Jobname stimmt nicht');
  const expected = proof?.ci_expected_commands;
  if (!Array.isArray(expected) || expected.length === 0 ||
      expected.some(x => typeof x !== 'string' || !x.trim() || x !== x.trim()) ||
      new Set(expected).size !== expected.length) errors.push('Befehlsliste fehlt oder ist ungueltig');
  if (errors.length) return errors;
  try {
    const step = extractStep(workflow, proof.ci_job_name, item.stepName);
    if (step.workingDirectory !== (proof.ci_working_directory ?? ''))
      errors.push('Arbeitsverzeichnis stimmt nicht');
    let pos = -1;
    for (const command of expected) {
      pos = step.commands.indexOf(command, pos + 1);
      if (pos < 0) {errors.push('Behaupteter Befehl fehlt oder Reihenfolge falsch: ' + command);break;}
    }
  } catch (error) {errors.push('Workflow-Analyse: ' + error.message);}
  return errors;
}

export async function verifyCommandClaims(items, readEvidence, getRun, getJobs, getWorkflow) {
  const runs = new Map(), jobs = new Map(), workflows = new Map(), verified = [], errors = [];
  for (const item of items) {
    try {
      const proof = readEvidence(item.evidencePath);
      if (!runs.has(item.runId)) runs.set(item.runId, await getRun(item.runId));
      if (!jobs.has(item.runId)) jobs.set(item.runId, await getJobs(item.runId));
      const key = item.commit + ':' + WORKFLOW;
      if (!workflows.has(key)) workflows.set(key, await getWorkflow(item.commit, WORKFLOW));
      const problems = validateCommandClaim(item, proof, runs.get(item.runId), jobs.get(item.runId), workflows.get(key));
      if (problems.length) errors.push(item.gate + ': ' + problems.join('; '));
      else verified.push({gate:item.gate,runId:item.runId,commit:item.commit,commands:proof.ci_expected_commands.length});
    } catch (error) {errors.push(item.gate + ': GitHub-/Workflow-Abgleich nicht moeglich (' + error.message + ')');}
  }
  return {ok:errors.length === 0,total:items.length,verified,errors};
}

export async function fetchWorkflowAtCommit(commit, workflowPath, {
  token=process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,request=globalThis.fetch}={}) {
  if (!/^[0-9a-f]{40}$/.test(commit) || workflowPath !== WORKFLOW)
    throw new Error('Ungueltiger Commit oder Workflow-Pfad');
  const headers = {'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'provoware-prerelease-evidence-audit'};
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await request('https://api.github.com/repos/' + REPO + '/contents/' + workflowPath + '?ref=' + commit,
    {headers,signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
  const data = await response.json();
  if (data?.type !== 'file' || data.encoding !== 'base64' || typeof data.content !== 'string' ||
      !Number.isSafeInteger(data.size) || data.size > 200000)
    throw new Error('Workflow-Antwort unvollstaendig oder unzulaessig');
  const decoded = Buffer.from(data.content.replace(/\s/g,''),'base64');
  if (decoded.length !== data.size) throw new Error('Workflow-Groesse stimmt nicht');
  return decoded.toString('utf8');
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here,'../../..');
  const matrix = JSON.parse(fs.readFileSync(path.join(here,'matrix.json'),'utf8'));
  const read = rel => {
    if (typeof rel !== 'string' || !rel.startsWith(PREFIX) ||
        !/^[A-Za-z0-9._-]+\.json$/.test(rel.slice(PREFIX.length)))
      throw new Error('Ungueltiger Nachweispfad');
    const filename = path.join(root,rel);
    const stat = fs.lstatSync(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Nachweis ist keine regulaere Datei');
    return JSON.parse(fs.readFileSync(filename,'utf8'));
  };
  const schema = auditMatrix(matrix,rel=>{try{return read(rel);}catch{return null;}});
  if (schema.errors.length) throw new Error('Matrix-Schema FAIL: '+schema.errors.join('; '));
  const items = collectPassEvidence(matrix,read).map(item => ({...item,
    evidencePath:matrix.gates.find(g=>g.id===item.gate).evidence.find(rel=>{
      const p=read(rel);return p.ci_run===item.url && p.ci_job_id===item.jobId;
    })}));
  const result = await verifyCommandClaims(items,read,fetchGitHubRun,fetchGitHubJobs,fetchWorkflowAtCommit);
  for (const item of result.verified) console.log('PASS '+item.gate+': '+item.commands+' historisch definierte Befehle, Lauf '+item.runId);
  for (const error of result.errors) console.error('FAIL '+error);
  console.log('Historische Workflow-Befehle: '+result.verified.length+'/'+result.total+' bestaetigt');
  if (!result.ok) process.exitCode=1;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(error=>{console.error('FAIL Workflow-Befehlspruefung: '+error.message);process.exitCode=1;});
