// Belegt erfolgreiche, eindeutig benannte GitHub-Jobschritte fuer historische PASS-Nachweise.
// Die GitHub-Jobmetadaten beweisen nicht den Inhalt des ausgefuehrten Befehls.
const REPO = 'provoware/PROJEKT_Oli_Imperium';

export function validateJobStep(item, jobs) {
  const errors = [];
  if (!Array.isArray(jobs)) return ['Jobliste fehlt'];
  const matches = jobs.filter(job => job?.id === item.jobId);
  if (matches.length !== 1) return ['Jobkennung fehlt oder ist mehrfach vorhanden'];
  const job = matches[0];
  if (job.run_id !== item.runId) errors.push('Job gehoert zu anderem Lauf');
  if (job.status !== 'completed' || job.conclusion !== 'success') errors.push('Job nicht erfolgreich abgeschlossen');
  if (!Array.isArray(job.steps)) return [...errors, 'Jobschritte fehlen'];
  const steps = job.steps.filter(step => step?.name === item.stepName);
  if (steps.length !== 1) errors.push('Pruefschritt fehlt oder ist mehrfach vorhanden');
  else if (steps[0].status !== 'completed' || steps[0].conclusion !== 'success')
    errors.push('Pruefschritt nicht erfolgreich abgeschlossen');
  return errors;
}

export async function verifyPassSteps(items, getJobs) {
  const cache = new Map(), verified = [], errors = [];
  for (const item of items) {
    try {
      if (!Number.isSafeInteger(item.jobId) || item.jobId <= 0 ||
          typeof item.stepName !== 'string' || !item.stepName.trim()) {
        errors.push(item.gate + ': Jobkennung oder Pruefschritt fehlt');
        continue;
      }
      if (!cache.has(item.runId)) cache.set(item.runId, await getJobs(item.runId));
      const problems = validateJobStep(item, cache.get(item.runId));
      if (problems.length) errors.push(item.gate + ': ' + problems.join(', '));
      else verified.push({gate:item.gate, runId:item.runId, jobId:item.jobId, stepName:item.stepName});
    } catch (error) {
      errors.push(item.gate + ': GitHub-Jobpruefung nicht moeglich (' + error.message + ')');
    }
  }
  return {ok:errors.length === 0, total:items.length, verified, errors};
}

export async function fetchGitHubJobs(runId, {token=process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
  request=globalThis.fetch} = {}) {
  if (!Number.isSafeInteger(runId) || runId <= 0) throw new Error('Ungueltige Laufkennung');
  const headers = {'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'provoware-prerelease-evidence-audit'};
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await request('https://api.github.com/repos/' + REPO + '/actions/runs/' + runId + '/jobs?per_page=100',
    {headers, signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
  const data = await response.json();
  if (!Array.isArray(data?.jobs) || !Number.isSafeInteger(data?.total_count) ||
      data.total_count !== data.jobs.length) throw new Error('Unvollstaendige Jobliste (Pagination/Antwort)');
  return data.jobs;
}
