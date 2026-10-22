// Projekt C: unabhängige Vorrelease-Pflichtprüfung (nur Node-Standardbibliothek).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const REQUIRED_AREAS = ["quellen","spiellogik","spielverlauf","wirtschaft","balance","speichern","sicherheit","fehlerfaelle","performance","grafik","bedienung","barrierefreiheit","startbarkeit","tests","dokumentation","freigabe"];
export function auditMatrix(data, readEvidence = () => null, mode = "schema") {
  const errors = [], blockers = [], covered = new Set(), seen = new Set();
  if (!data || typeof data !== "object" || Array.isArray(data)) return {errors:["Matrix muss ein Objekt sein."],blockers:[],summary:{}};
  if (data.schema_version !== 1) errors.push("schema_version muss 1 sein.");
  if (data.project !== "PPPOPPI IMPERIUM") errors.push("Projektkennung falsch.");
  if (!["missing","imported"].includes(data.source_status)) errors.push("source_status ungueltig.");
  if (!Array.isArray(data.gates) || data.gates.length === 0) return {errors:[...errors,"gates muss eine nichtleere Liste sein."],blockers:[],summary:{}};
  const areas = new Set(REQUIRED_AREAS);
  for (const [index,g] of data.gates.entries()) {
    if (!g || typeof g !== "object" || Array.isArray(g)) {errors.push(`gates[${index}]: Objekt erwartet.`);continue;}
    const id = g.id;
    if (typeof id !== "string" || !/^[A-Z]{3}-\d{2}$/.test(id)) errors.push(`gates[${index}]: ungueltige ID.`);
    else if (seen.has(id)) errors.push(`Doppelte Pflicht-ID: ${id}.`);
    else seen.add(id);
    if (!areas.has(g.area)) errors.push(`${id}: unbekannter Bereich.`);
    else covered.add(g.area);
    if (typeof g.requirement !== "string" || !g.requirement.trim()) errors.push(`${id}: Anforderung fehlt.`);
    if (typeof g.basis !== "string" || !g.basis.trim()) errors.push(`${id}: Grundlage fehlt.`);
    if (!["technical","personal"].includes(g.stage)) errors.push(`${id}: Stufe ungueltig.`);
    if (!["open","blocked","fail","pass","deferred"].includes(g.status)) errors.push(`${id}: Status ungueltig.`);
    if (g.stage === "technical" && g.status === "deferred") errors.push(`${id}: Technische Pflicht darf nicht vertagt werden.`);
    if (g.stage === "personal" && !["deferred","pass"].includes(g.status)) errors.push(`${id}: Persoenliche Abnahme muss vertagt oder bestanden sein.`);
    if (!Array.isArray(g.evidence)) errors.push(`${id}: evidence muss Liste sein.`);
    if (g.status === "blocked" || g.status === "fail") {
      if (typeof g.blocker !== "string" || !g.blocker.trim()) errors.push(`${id}: Blockadegrund fehlt.`);
    }
    if (g.status !== "pass" && typeof g.next !== "string") errors.push(`${id}: naechste Handlung fehlt.`);
    if (g.status === "pass") {
      if (!Array.isArray(g.evidence) || g.evidence.length === 0) errors.push(`${id}: PASS ohne Nachweis.`);
      else for (const p of g.evidence) {
        if (typeof p !== "string" || !/^project-c\/pppoppi-imperium\/prerelease\/evidence\/[A-Za-z0-9._/-]+\.json$/.test(p) || p.split("/").some(s=>s==="."||s==="..") || p.includes("//")) {
          errors.push(`${id}: unzulaessiger Nachweispfad.`); continue;
        }
        const e = readEvidence(p);
        if (!e || e.gate_id !== id || e.result !== "PASS" || !/^[0-9a-f]{40}$/.test(e.commit || "") || typeof e.command !== "string" || !e.command.trim() || typeof e.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push(`${id}: Nachweis fehlt oder ist ungueltig.`);
      }
    }
    if (g.stage === "technical" && g.status !== "pass") blockers.push(`${id}: ${g.status}`);
  }
  for (const area of REQUIRED_AREAS) if (!covered.has(area)) errors.push(`Pflichtbereich fehlt: ${area}.`);
  if (data.source_status === "missing") blockers.push("Spielquellen fehlen in GitHub.");
  if (data.source_status === "missing" && data.gates.some(g=>g?.id==="QUE-01" && g.status==="pass")) errors.push("QUE-01 kann ohne importierte Spielquellen nicht PASS sein.");
  if (mode !== "schema" && mode !== "technical") errors.push("Unbekannter Pruefmodus.");
  const summary = {total:data.gates.length,pass:data.gates.filter(g=>g?.status==="pass").length,blocked:data.gates.filter(g=>g?.status==="blocked").length,open:data.gates.filter(g=>g?.status==="open").length,fail:data.gates.filter(g=>g?.status==="fail").length,deferred:data.gates.filter(g=>g?.status==="deferred").length,technical:data.gates.filter(g=>g?.stage==="technical").length,personal:data.gates.filter(g=>g?.stage==="personal").length};
  return {errors,blockers,summary,ready:errors.length===0&&blockers.length===0};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] === '--technical' ? 'technical' : 'schema';
  if (process.argv[2] && !['--schema','--technical'].includes(process.argv[2])) { console.error('Aufruf: node check.mjs [--schema|--technical]'); process.exit(2); }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '../../..');
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(here, 'matrix.json'), 'utf8')); }
  catch (error) { console.error('Matrix nicht lesbar:', error.message); process.exit(2); }
  function readEvidence(rel) {
    try {
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root + path.sep)) return null;
      const stat = fs.lstatSync(abs);
      if (!stat.isFile() || stat.isSymbolicLink()) return null;
      const real = fs.realpathSync(abs);
      if (!real.startsWith(root + path.sep)) return null;
      return JSON.parse(fs.readFileSync(real, 'utf8'));
    } catch { return null; }
  }
  const result = auditMatrix(data, readEvidence, mode);
  console.log('Projekt C Vorrelease:', JSON.stringify(result.summary));
  for (const e of result.errors) console.error('FAIL:', e);
  if (mode === 'technical') for (const b of result.blockers) console.error('BLOCKED:', b);
  console.log(result.errors.length ? 'SCHEMA FAIL' : mode === 'technical' && !result.ready ? 'TECHNISCH NICHT BEREIT' : 'SCHEMA PASS');
  process.exit(result.errors.length ? 2 : mode === 'technical' && !result.ready ? 1 : 0);
}
