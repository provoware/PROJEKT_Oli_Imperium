'use strict';
// Isolierter, noch NICHT in die Browseroberflaeche eingebundener Sitzungsadapter.
// Expliziter Vertrag, versionierter Sitzungsstand und gesperrte Archivpartien.
const SESSION_SCHEMA = 'pppoppi.endstate.session.proposal/1';
const MAX_SESSION_BYTES = 5_000_000;
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const clone = value => JSON.parse(JSON.stringify(value));
function inspect(value, depth = 0, budget = {left: 100000}) {
  if (--budget.left < 0 || depth > 64) throw Error('Sitzungsstruktur zu gross oder zu tief');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) { for (const item of value) inspect(item, depth + 1, budget); return; }
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw Error('Ungueltiger Sitzungsdatentyp');
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.has(key)) throw Error('Unsicherer Sitzungsschluessel');
    inspect(item, depth + 1, budget);
  }
}
function contractOf(candidate, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Endregelvertrag fehlt');
  const normalized = value.mode === 'free' ? candidate.rules({mode: 'free'}) :
    candidate.rules({mode: value.mode, months: value.months});
  const keys = Object.keys(value).sort().join(',');
  if (keys !== Object.keys(normalized).sort().join(',') ||
      Object.keys(normalized).some(key => value[key] !== normalized[key]))
    throw Error('Endregelvertrag passt nicht zum Schema');
  return normalized;
}
function createSession({engine, candidate, io, regions, contract, state, archivedText}) {
  if (!engine || typeof engine.validate !== 'function' || typeof engine.transition !== 'function' ||
      !candidate || typeof candidate.rules !== 'function' || typeof candidate.evaluate !== 'function' ||
      !io || typeof io.importArchive !== 'function' || typeof io.exportArchive !== 'function' ||
      !Array.isArray(regions)) throw Error('Unvollstaendige Adapterabhaengigkeiten');
  const rule = contractOf(candidate, contract);
  let active = null, archived = null;
  if (archivedText !== undefined) {
    if (state !== undefined && state !== null) throw Error('Archiv und aktive Partie duerfen nicht gemischt werden');
    archived = io.importArchive(archivedText, regions);
    // Archivkonsistenz allein beweist keinen gueltigen Engine-Spielstand.
    // Auch schreibgeschuetzte Abschlussdaten muessen den echten Kernvertrag erfuellen.
    engine.validate(archived.snapshot);
    if (archived.mode !== rule.mode || archived.durationMonths !== (rule.mode === 'free' ? null : rule.months))
      throw Error('Archiv und Endregelvertrag widersprechen sich');
  } else {
    if (!state) throw Error('Aktiver Spielstand fehlt');
    inspect(state);
    engine.validate(state);
    active = clone(state);
    if (candidate.evaluate(active, rule, regions).status === 'finished')
      throw Error('Bereits beendete Kampagne darf nicht aktiv geladen werden');
  }
  function seal(result) {
    const next = io.importArchive(io.exportArchive(result.archive, regions), regions);
    archived = next;
    active = null;
  }
  function apply(command) {
    if (archived) throw Error('Archivierte Partie ist unveraenderbar');
    const transition = engine.transition(clone(active), command);
    if (!transition || !transition.state) throw Error('Spielkern lieferte keinen Spielstand');
    inspect(transition.state);
    engine.validate(transition.state);
    const result = candidate.evaluate(transition.state, rule, regions);
    if (result.status === 'finished') seal(result);
    else active = clone(transition.state);
    return {status: archived ? 'finished' : result.status, state: snapshot()};
  }
  function finish(confirm) {
    if (archived) throw Error('Archivierte Partie ist unveraenderbar');
    if (rule.mode !== 'free' || confirm !== true) throw Error('Freies Ende verlangt ausdrueckliche Bestaetigung');
    const result = candidate.evaluate(active, rule, regions, {confirmEnd: true});
    if (result.status === 'finished') seal(result);
    return {status: result.status, reason: result.reason || null};
  }
  function snapshot() { return clone(archived ? archived.snapshot : active); }
  function exportSession() {
    const text = JSON.stringify({schema: SESSION_SCHEMA, contract: rule,
      state: archived ? null : active, archive: archived ? archived : null});
    if (new TextEncoder().encode(text).length > MAX_SESSION_BYTES) throw Error('Sitzungsdatei zu gross');
    return text;
  }
  function exportArchive() {
    if (!archived) throw Error('Noch keine abgeschlossene Partie');
    return io.exportArchive(archived, regions);
  }
  return Object.freeze({apply, finish, snapshot, exportSession, exportArchive,
    status: () => archived ? 'finished' : 'active', contract: () => clone(rule)});
}
function importSession(text, dependencies) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_SESSION_BYTES)
    throw Error('Sitzungsdatei fehlt oder ist zu gross');
  let data;
  try { data = JSON.parse(text); } catch { throw Error('Sitzungsdatei ist kein gueltiges JSON'); }
  inspect(data);
  if (!data || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'archive,contract,schema,state' ||
      data.schema !== SESSION_SCHEMA) throw Error('Unbekanntes Sitzungsschema');
  if ((data.state === null) === (data.archive === null))
    throw Error('Sitzung muss genau eine aktive oder archivierte Partie enthalten');
  if (data.archive !== null) return createSession({...dependencies, contract: data.contract,
    archivedText: JSON.stringify(data.archive)});
  return createSession({...dependencies, contract: data.contract, state: data.state});
}
module.exports = {SESSION_SCHEMA, MAX_SESSION_BYTES, createSession, importSession};
