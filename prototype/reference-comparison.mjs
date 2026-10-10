import { validatePilotContract } from './contract-guard.mjs';
import { PILOT_TRACE_KIND, validatePilotTrace } from './pilot-trace.mjs';

/**
 * Ausschließlich Hypothesen der HTML-Navigation; KEINE C64-Originaldaten.
 * Originaltest-ID und Titel stammen allein aus dem Forschungsdatenvertrag.
 * Die Zuordnung dieser drei technischen Pfade ist ein offener Entwurf.
 */
const DRAFT_PATHS = Object.freeze({
  'TEST-001': Object.freeze({ from: 'SCREEN-001', action: 'to-map', to: 'SCREEN-002' }),
  'TEST-002': Object.freeze({ from: 'SCREEN-002', action: 'to-claims', to: 'SCREEN-003' }),
  'TEST-003': Object.freeze({ from: 'SCREEN-002', action: 'to-office', to: 'SCREEN-001' }),
});

export const COMPARISON_KIND = 'c0-reference-comparison-plan';

/**
 * Bereitet den Abgleich vor – ohne Originalbelege, ohne Testfreigabe.
 * Jede Beobachtungsspalte bleibt leer, bis ein unabhängiger, rechtmäßig
 * dokumentierter C64-Lauf vorliegt und fachlich geprüft wird.
 */
export function createReferenceComparisonPlan(trace, contract) {
  validatePilotContract(contract);
  validatePilotTrace(trace);
  const tests = Object.entries(DRAFT_PATHS).map(([testId, path]) => {
    const test = contract.tests.find(item => item.id === testId && item.kind === 'original');
    if (!test) throw new Error('Pflicht-Originaltest im Forschungsvertrag fehlt: ' + testId);
    const matchingSteps = trace.steps
      .filter(step => step.from === path.from && step.to === path.to && step.action === path.action)
      .map(step => step.sequence);
    const sources = new Set(contract.rules
      .filter(rule => test.rule_ids.includes(rule.id))
      .flatMap(rule => rule.source_ids));
    return {
      test_id: testId,
      test_title: test.title,
      contract_status: test.status,
      rule_ids: [...test.rule_ids],
      source_ids: [...sources].sort(),
      draft_expected: { ...path },
      draft_step_numbers: matchingSteps,
      original_observation: null,
      original_evidence_id: null,
      comparison_status: 'not_compared',
    };
  });
  return {
    schema_version: 1,
    kind: COMPARISON_KIND,
    preview_version: trace.preview_version,
    technical_trace_kind: PILOT_TRACE_KIND,
    original_verified: false,
    scientific_approval: false,
    purpose: 'Vergleichsvorlage für eine spätere, unabhängig belegte C64-Emulatorausführung.',
    notes: [
      'Alle Übergänge sind Hypothesen aus Arbeit B, keine nachgewiesenen C64-Bedienbefehle.',
      'Keine Originalbelege eingebunden. null bedeutet fehlende Beobachtung, nicht Übereinstimmung.',
      'TEST-003 bezeichnet nur den Teilübergang Weltkarte → Büro im technischen Entwurf.',
      'Der Forschungsdatenvertrag bleibt unverändert. Ein grüner HTML-Test ist kein Originaltest.',
    ],
    omitted_technical_steps: trace.omitted_steps,
    tests,
  };
}

export function serializeReferenceComparisonPlan(trace, contract) {
  return JSON.stringify(createReferenceComparisonPlan(trace, contract), null, 2) + '\n';
}
