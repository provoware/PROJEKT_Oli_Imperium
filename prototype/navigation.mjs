import { validatePilotContract } from './contract-guard.mjs';
export { validatePilotContract } from './contract-guard.mjs';

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
  const choices = Object.hasOwn(TRANSITIONS, currentScreen) ? TRANSITIONS[currentScreen] : null;
  const next = choices && Object.hasOwn(choices, action) ? choices[action] : undefined;
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

/** Erst die technikseitige Test-Navigation; das Original-Rückwegverhalten ist offen. */
export function availablePilotActions(screenId) {
  if (!Object.hasOwn(TRANSITIONS, screenId)) return [];
  return Object.keys(TRANSITIONS[screenId]);
}
