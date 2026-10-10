/**
 * Abwehrschicht für Forschungsdaten im Browser (keine fachliche Freigabe).
 * Der Python-Vertragsvalidator bleibt für das gesamte Repository maßgeblich.
 * Das UI verweigert aber widersprüchliche Status- und Referenzangaben.
 */
const GROUPS = Object.freeze({
  sources: 'SRC',
  rules: 'REGEL',
  screens: 'SCREEN',
  modules: 'MOD',
  tests: 'TEST',
  questions: 'Q',
});
const VALID_STATUSES = Object.freeze({
  rules: ['open', 'manual', 'observed', 'approved'],
  screens: ['open', 'captured', 'reviewed'],
  modules: ['planned', 'designed', 'approved'],
  tests: ['not_run', 'passed', 'failed', 'blocked'],
  questions: ['open', 'answered', 'closed'],
});
const SOURCES = new Set(['primary', 'emulator', 'secondary', 'forum', 'reconstruction']);
const TEST_KINDS = new Set(['original', 'structure', 'integration']);

function fail(message) {
  throw new Error('Ungültige Forschungsdaten: ' + message);
}
function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function links(item, field, idMap, expectedGroup) {
  const items = item[field] ?? [];
  if (!Array.isArray(items) || new Set(items).size !== items.length) {
    fail(item.id + '.' + field + ': Liste oder Verknüpfungen ungültig.');
  }
  for (const id of items) {
    if (typeof id !== 'string' || !idMap.has(id)) {
      fail(item.id + '.' + field + ': fehlende Referenz ' + String(id));
    }
    if (expectedGroup && idMap.get(id) !== expectedGroup) {
      fail(item.id + '.' + field + ': falsche Referenzart ' + id);
    }
  }
}
function sourceIsHttps(text) {
  try {
    return typeof text === 'string' && new URL(text).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Prüft nur Nachvollziehbarkeit und Datenkonsistenz. Weder Originaltreue
 * noch wissenschaftliche/urheberrechtliche Zulässigkeit lassen sich daraus ableiten.
 */
export function validatePilotContract(data) {
  if (!object(data) || data.schema_version !== '1.0' || !object(data.reference)) {
    fail('Forschungsdatenvertrag hat die falsche Version oder Referenzstruktur.');
  }
  const ref = data.reference;
  if (!['not_selected', 'candidate', 'verified'].includes(ref.status) ||
      typeof ref.verified_run !== 'boolean') {
    fail('Originalreferenz hat einen unbekannten Status.');
  }
  if (ref.status === 'verified' && (
    ref.verified_run !== true ||
    typeof ref.emulator_version !== 'string' || !ref.emulator_version.trim() ||
    typeof ref.image_sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(ref.image_sha256)
  )) {
    fail('Bestätigte Originalreferenz ohne Emulator- und SHA-256-Nachweis.');
  }
  if (ref.status !== 'verified' && ref.verified_run) {
    fail('Emulatorlauf und ungeprüfter Referenzstatus widersprechen sich.');
  }

  const idMap = new Map();
  for (const [kind, prefix] of Object.entries(GROUPS)) {
    if (!Array.isArray(data[kind])) fail(kind + ': erwartet Liste.');
    for (const item of data[kind]) {
      if (!object(item) || typeof item.id !== 'string' ||
        !item.id.startsWith(prefix + '-') || item.id.length <= prefix.length + 1) {
        fail(kind + ': ungültige Kennung.');
      }
      if (idMap.has(item.id)) fail('Doppelte Forschungs-ID: ' + item.id);
      idMap.set(item.id, kind);
      if (typeof (item.title ?? item.text) !== 'string' ||
          !(item.title ?? item.text).trim()) {
        fail(item.id + ': Titel oder Fragetext fehlt.');
      }
      if (VALID_STATUSES[kind] && !VALID_STATUSES[kind].includes(item.status)) {
        fail(item.id + ': unbekannter Prüfstatus.');
      }
      if (kind === 'sources' && (!SOURCES.has(item.type) || !sourceIsHttps(item.url))) {
        fail(item.id + ': unzulässige Quelladresse oder Quellenart.');
      }
      if (kind === 'tests' && (!TEST_KINDS.has(item.kind) ||
          typeof item.mandatory !== 'boolean' ||
          !Number.isInteger(item.weight) || item.weight < 1)) {
        fail(item.id + ': ungültige Testbeschreibung.');
      }
      if (kind === 'questions' && !['A', 'B'].includes(item.owner)) {
        fail(item.id + ': Forschungszuständigkeit fehlt.');
      }
    }
  }
  for (const screen of data.screens) links(screen, 'source_ids', idMap, 'sources');
  for (const rule of data.rules) {
    links(rule, 'source_ids', idMap, 'sources');
    links(rule, 'screen_ids', idMap, 'screens');
    if (rule.status === 'approved' && rule.source_ids.length === 0) {
      fail(rule.id + ': freigegebene Regel ohne Quelle.');
    }
  }
  for (const module of data.modules) links(module, 'rule_ids', idMap, 'rules');
  for (const test of data.tests) {
    links(test, 'rule_ids', idMap, 'rules');
    if (test.kind === 'original' && test.status === 'passed' && (
      ref.status !== 'verified' || !test.evidence || test.rule_ids.length === 0
    )) {
      fail(test.id + ': Originaltest ohne nachgewiesene Referenz/Belege.');
    }
  }
  for (const question of data.questions) {
    links(question, 'related_ids', idMap);
    links(question, 'blocks', idMap);
  }
  for (const screen of ['SCREEN-001', 'SCREEN-002', 'SCREEN-003']) {
    if (idMap.get(screen) !== 'screens') fail('Pilotbildschirm nicht vorhanden: ' + screen);
  }
  return true;
}
