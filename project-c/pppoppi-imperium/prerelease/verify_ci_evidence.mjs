// Unabhaengiger Live-Abgleich technischer PASS-Belege mit GitHub Actions.
// Nur Node-Standardbibliothek; kein Schreibzugriff auf GitHub oder Spielstaende.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditMatrix } from './check.mjs';
import { verifyPassSteps, fetchGitHubJobs } from './verify_ci_steps.mjs';

const REPO = 'provoware/PROJEKT_Oli_Imperium';
const PREFIX = 'project-c/pppoppi-imperium/prerelease/evidence/';
const RUN_URL = /^https:\/\/github\.com\/provoware\/PROJEKT_Oli_Imperium\/actions\/runs\/([1-9]\d*)$/;

export function collectPassEvidence(matrix, readEvidence) {
  const items = [];
  for (const gate of matrix.gates ?? []) {
    if (gate.stage !== 'technical' || gate.status !== 'pass') continue;
    if (!Array.isArray(gate.evidence) || gate.evidence.length === 0) {
      throw new Error(gate.id + ': technischer PASS ohne Nachweis');
    }
    for (const rel of gate.evidence) {
      if (typeof rel !== 'string' || !rel.startsWith(PREFIX) ||
          !/^[A-Za-z0-9._-]+\.json$/.test(rel.slice(PREFIX.length)) ||
          rel.slice(PREFIX.length).includes('..')) {
        throw new Error(gate.id + ': unzulaessiger Nachweispfad');
      }
      const proof = readEvidence(rel);
      const match = RUN_URL.exec(proof?.ci_run ?? '');
      if (!proof || proof.gate_id !== gate.id || proof.result !== 'PASS' ||
          !/^[0-9a-f]{40}$/.test(proof.commit ?? '') ||
          proof.ci_conclusion !== 'success' || !match) {
        throw new Error(gate.id + ': unvollstaendiger technischer CI-Nachweis');
      }
      const runId = Number(match[1]);
      if (!Number.isSafeInteger(runId)) throw new Error(gate.id + ': ungueltige CI-Laufkennung');
      if (!Number.isSafeInteger(proof.ci_job_id) || proof.ci_job_id <= 0 ||
          typeof proof.ci_step_name !== 'string' || !proof.ci_step_name.trim())
        throw new Error(gate.id + ': fehlende Job-/Schrittzuordnung');
      items.push({gate:gate.id, runId, url:proof.ci_run,
        commit:proof.commit, event:proof.ci_event,
        jobId:proof.ci_job_id, stepName:proof.ci_step_name});
    }
  }
  return items;
}

export function validateRun(item, run) {
  const failures = [];
  if (run?.id !== item.runId) failures.push('Laufkennung');
  if (run?.html_url !== item.url) failures.push('Laufadresse');
  if (run?.repository?.full_name !== REPO) failures.push('Repository');
  if (run?.status !== 'completed') failures.push('nicht abgeschlossen');
  if (run?.conclusion !== 'success') failures.push('kein erfolgreicher Abschluss');
  if (run?.head_sha !== item.commit) failures.push('Commit-Abweichung');
  if (item.event && run?.event !== item.event) failures.push('Ereignis-Abweichung');
  return failures;
}

export async function verifyPassEvidence(matrix, readEvidence, getRun) {
  const items = collectPassEvidence(matrix, readEvidence);
  const cache = new Map();
  const errors = [], verified = [];
  for (const item of items) {
    try {
      if (!cache.has(item.runId)) cache.set(item.runId, await getRun(item.runId));
      const failures = validateRun(item, cache.get(item.runId));
      if (failures.length) errors.push(item.gate + ': Lauf ' + item.runId + ': ' + failures.join(', '));
      else verified.push({gate:item.gate, runId:item.runId, commit:item.commit,
        jobId:item.jobId, stepName:item.stepName});
    } catch (error) {
      errors.push(item.gate + ': Lauf ' + item.runId + ': API-Pruefung nicht moeglich (' + error.message + ')');
    }
  }
  return {ok:errors.length === 0, total:items.length, verified, errors};
}

export async function fetchGitHubRun(runId, {token=process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
  request=globalThis.fetch} = {}) {
  const headers = {'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'provoware-prerelease-evidence-audit'};
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await request('https://api.github.com/repos/' + REPO + '/actions/runs/' + runId,
    {headers, signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
  return response.json();
}

function readEvidenceOnDisk(rel, root) {
  const name = rel.slice(PREFIX.length);
  const file = path.join(root, 'project-c/pppoppi-imperium/prerelease/evidence', name);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Keine regulaere Nachweisdatei');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '../../..');
  const matrix = JSON.parse(fs.readFileSync(path.join(here, 'matrix.json'), 'utf8'));
  const read = rel => readEvidenceOnDisk(rel, root);
  const schema = auditMatrix(matrix, rel => {try{return read(rel);}catch{return null;}});
  if (schema.errors.length) throw new Error('Matrix-Schema FAIL: ' + schema.errors.join('; '));
  const result = await verifyPassEvidence(matrix, read, fetchGitHubRun);
  for (const entry of result.verified) console.log('PASS ' + entry.gate + ': GitHub-Lauf ' + entry.runId + ', Commit ' + entry.commit);
  for (const error of result.errors) console.error('FAIL ' + error);
  console.log('GitHub-Live-Nachweise: ' + result.verified.length + '/' + result.total + ' bestaetigt');
  const steps = await verifyPassSteps(result.verified, fetchGitHubJobs);
  for (const entry of steps.verified) console.log('PASS ' + entry.gate + ': Job ' + entry.jobId + ', Schritt ' + entry.stepName);
  for (const error of steps.errors) console.error('FAIL ' + error);
  console.log('GitHub-Jobschritte: ' + steps.verified.length + '/' + result.total + ' bestaetigt');
  if (!result.ok || !steps.ok || steps.verified.length !== result.total) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error('FAIL CI-Nachweispruefung: ' + error.message);process.exitCode=1;});
}
