import { INITIAL_SCREEN, navigatePilot } from './navigation.mjs';

/**
 * Technisches Testprotokoll – niemals ein C64-Originalbeleg.
 * Begrenzte Datenmenge, kein Zeitstempel, keine Personen- oder Forschungsdaten.
 */
export const PILOT_TRACE_LIMIT = 200;
export const PILOT_TRACE_KIND = 'c0-technical-navigation-draft';

export function createPilotTrace(version) {
  if (typeof version !== 'string' || !/^0\.\d+\.\d+-(?:alpha|beta|rc)\.\d+$/.test(version)) {
    throw new TypeError('Testprotokoll benötigt eine gültige Vorabversionskennung.');
  }
  return {
    schema_version: 1,
    kind: PILOT_TRACE_KIND,
    preview_version: version,
    reference_verified: false,
    omitted_steps: 0,
    steps: [{ sequence: 0, from: null, action: 'start', to: INITIAL_SCREEN }],
  };
}

/**
 * Leitet einen neuen, unabhängigen Zustand ab. Nur erlaubte Pilotaktionen
 * können in das Protokoll aufgenommen werden, selbst bei fehlerhaften Aufrufen.
 */
export function appendPilotTrace(trace, from, action) {
  if (!trace || trace.kind !== PILOT_TRACE_KIND || !Array.isArray(trace.steps) ||
    trace.steps.length === 0 || trace.reference_verified !== false ||
    !Number.isSafeInteger(trace.omitted_steps) || trace.omitted_steps < 0) {
    throw new TypeError('Testprotokoll ist beschädigt oder nicht unterstützt.');
  }
  const previous = trace.steps[trace.steps.length - 1];
  if (!previous || previous.to !== from) {
    throw new Error('Der Ausgangsbildschirm stimmt nicht mit dem Testprotokoll überein.');
  }
  const result = navigatePilot(from, action);
  if (!result.ok) throw new Error(result.error);
  const nextSequence = previous.sequence + 1;
  if (!Number.isSafeInteger(nextSequence)) throw new RangeError('Zu viele Navigationsschritte.');
  const next = { sequence: nextSequence, from, action, to: result.screen };
  const all = [...trace.steps, next];
  const overflow = Math.max(0, all.length - PILOT_TRACE_LIMIT);
  return {
    ...trace,
    omitted_steps: trace.omitted_steps + overflow,
    steps: overflow > 0 ? all.slice(overflow) : all,
  };
}

/** Export enthält nur den nachvollziehbaren Entwurfsweg, keine Originalaussage. */
export function serializePilotTrace(trace) {
  if (!trace || trace.kind !== PILOT_TRACE_KIND || trace.reference_verified !== false ||
    !Array.isArray(trace.steps) || trace.steps.length === 0 ||
    !trace.steps.every((step) => Number.isSafeInteger(step.sequence) &&
      typeof step.to === 'string' && typeof step.action === 'string')) {
    throw new TypeError('Testprotokoll kann nicht sicher ausgegeben werden.');
  }
  return JSON.stringify({
    schema_version: 1,
    kind: PILOT_TRACE_KIND,
    preview_version: trace.preview_version,
    reference_verified: false,
    omitted_steps: trace.omitted_steps,
    note: 'Nur HTML-Entwurfsnavigation. Kein C64-Originaltest und keine historische Freigabe.',
    steps: trace.steps.map((step) => ({
      sequence: step.sequence, from: step.from, action: step.action, to: step.to,
    })),
  }, null, 2) + '\n';
}
