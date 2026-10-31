'use strict';
// Separater, noch NICHT in Engine oder UI eingebundener Archiv-Import/-Export.
// Konsistenzpruefung ist KEIN kryptografischer Echtheits- oder Herkunftsnachweis.
const C = require('./endstate_candidate_v194.cjs');
const MAX_ARCHIVE_BYTES = 4 * 1024 * 1024;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function checkJSON(value, depth = 0, budget = {remaining: 100000}) {
  if (--budget.remaining < 0 || depth > 64) throw Error('Archivstruktur zu tief oder zu gross');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) checkJSON(item, depth + 1, budget);
    return;
  }
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw Error('Ungueltiger Archivdatentyp');
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw Error('Unsicherer Archivschluessel');
    checkJSON(item, depth + 1, budget);
  }
}
function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) freezeDeep(item);
    Object.freeze(value);
  }
  return value;
}
function importArchive(text, regions) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_ARCHIVE_BYTES)
    throw Error('Archivdatei fehlt oder ist zu gross');
  let archive;
  try { archive = JSON.parse(text); } catch { throw Error('Archivdatei ist kein gueltiges JSON'); }
  checkJSON(archive);
  if (!archive || Array.isArray(archive) || archive.schema !== C.ARCHIVE_SCHEMA ||
      archive.sourceSchema !== C.ENGINE_SCHEMA) throw Error('Unbekanntes Archivschema');
  const contract = archive.mode === 'free' ? C.rules({mode:'free'}) :
    C.rules({mode:archive.mode, months:archive.durationMonths});
  const result = C.evaluate(archive.snapshot, contract, regions, {confirmEnd:true});
  if (result.status !== 'finished' || canonical(result.archive) !== canonical(archive))
    throw Error('Archivinhalt und Endabrechnung stimmen nicht ueberein');
  return freezeDeep(archive);
}
function exportArchive(archive, regions) {
  const text = JSON.stringify(archive);
  importArchive(text, regions);
  return text;
}
module.exports = {MAX_ARCHIVE_BYTES, importArchive, exportArchive};
