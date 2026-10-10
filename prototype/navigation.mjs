/**
 * PILOT-01 – Navigationsmodell der wissenschaftlichen HTML-Testbasis.
 * Ein Entwurf für Arbeit B, KEINE verifizierte C64-Eingabe- oder Spielregel.
 * Die Wirtschaft, die Spielzeit und Forschungsdaten bleiben unangetastet.
 */
export const INITIAL_SCREEN = 'SCREEN-001';

const TRANSITIONS = Object.freeze({
  'SCREEN-001': Object.freeze({ 'to-map': 'SCREEN-002' }),
  'SCREEN-002': Object.freeze({ 'to-claims': 'SCREEN-003', 'to-office': 'SCREEN-001' }),
  'SCREEN-003': Object.freeze({ 'to-map': 'SCREEN-002' }),
});

export function navigatePilot(currentScreen, action) {
  const next = Object.hasOwn(TRANSITIONS, currentScreen)
    ? TRANSITIONS[currentScreen][action] : undefined;
  if (next === undefined) {
    return { ok: false, screen: currentScreen, error: 'Dieser Übergang ist im Entwurf nicht vorgesehen.' };
  }
  return { ok: true, screen: next };
}

/** Ableitungen ausschließlich aus dem vorhandenen Datenvertrag. */
export function getPilotCard(contract, screenId) {
  validatePilotContract(contract);
  const screen = contract.screens.find((entry) => entry.id === screenId);
  if (!screen) throw new Error('Bildschirm-ID fehlt im Datenvertrag: ' + screenId);
  const rules = contract.rules.filter((rule) => rule.screen_ids.includes(screenId));
  const sourceIds = new Set([...screen.source_ids, ...rules.flatMap((rule) => rule.source_ids)]);
  const sources = contract.sources.filter((source) => sourceIds.has(source.id));
  const questions = contract.questions.filter((q) => q.related_ids.includes(screenId) ||
    q.related_ids.some((id) => rules.some((rule) => rule.id === id)));
  return { screen, rules, sources, questions, reference: contract.reference };
}

export function validatePilotContract(value) {
  if (!value || typeof value !== 'object' || value.schema_version !== '1.0' ||
    !value.reference || typeof value.reference.status !== 'string') {
    throw new Error('Unpassende oder fehlende Version des Forschungsdatenvertrags.');
  }
  for (const kind of ['screens', 'rules', 'sources', 'questions']) {
    if (!Array.isArray(value[kind]) || value[kind].some((item) =>
      !item || typeof item.id !== 'string' ||
      typeof (item.title ?? item.text) !== 'string' ||
      (kind !== 'sources' && typeof item.status !== 'string'))) {
      throw new Error('Ungültige Forschungsdaten: ' + kind);
    }
  }
  for (const screen of value.screens) {
    if (!Array.isArray(screen.source_ids)) throw new Error('Bildschirm ohne Quellverweise.');
  }
  for (const rule of value.rules) {
    if (!Array.isArray(rule.screen_ids) || !Array.isArray(rule.source_ids)) {
      throw new Error('Regel ohne Bildschirm-/Quellverweise.');
    }
  }
  for (const question of value.questions) {
    if (!Array.isArray(question.related_ids)) throw new Error('Frage ohne Referenzverweise.');
  }
  const ids = new Set();
  for (const kind of ['screens', 'rules', 'sources', 'questions']) {
    for (const item of value[kind]) {
      if (ids.has(item.id)) throw new Error('Doppelte Forschungs-ID: ' + item.id);
      ids.add(item.id);
    }
  }
  for (const screen of Object.keys(TRANSITIONS)) {
    if (!value.screens.some((item) => item.id === screen)) {
      throw new Error('Pilotbildschirm nicht im Datenvertrag vorhanden: ' + screen);
    }
  }
  return true;
}

/** Erst die technikseitige Test-Navigation; das Original-Rückwegverhalten ist offen. */
export function availablePilotActions(screenId) {
  if (!Object.hasOwn(TRANSITIONS, screenId)) return [];
  return Object.keys(TRANSITIONS[screenId]);
}
