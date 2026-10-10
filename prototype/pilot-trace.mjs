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
 * Gemeinsamer Integritätscheck für Schreibpfad, JSON-Export und Vergleich.
 * Validiert auch abgeschnittene Protokolle: Nach dem Abschneiden muss der
 * erste noch vorhandene Schritt genau die Nummer omitted_steps besitzen.
 * Dies bestätigt nur die technische Konsistenz, KEINE C64-Originaltreue.
 */
export function validatePilotTrace(trace) {
  if (!trace || typeof trace !== 'object' || Array.isArray(trace) ||
      trace.schema_version !== 1 || trace.kind !== PILOT_TRACE_KIND ||
      trace.reference_verified !== false ||
      typeof trace.preview_version !== 'string' ||
      !/^0\\.\\d+\\.\\d+-(?:alpha|beta|rc)\\.\\d+$/.test(trace.preview_version) ||
      !Number.isSafeInteger(trace.omitted_steps) || trace.omitted_steps < 0 ||
      !Array.isArray(trace.steps) || trace.steps.length < 1 ||
      trace.steps.length > PILOT_TRACE_LIMIT) {
    throw new TypeError('Testprotokoll ist beschädigt oder nicht unterstützt.');
  }
  for (let index = 0; index < trace.steps.length; index += 1) {
    const step = trace.steps[index];
    if (!step || typeof step !== 'object' || Array.isArray(step) ||
        !Number.isSafeInteger(step.sequence) ||
        step.sequence !== trace.omitted_steps + index ||
        typeof step.to !== 'string') {
      throw new TypeError('Testprotokoll enthält ungültige Schritt- oder Zählerdaten.');
    }
    if (index === 0 && trace.omitted_steps === 0) {
      if (step.from !== null || step.action !== 'start' ||
          step.to !== INITIAL_SCREEN) {
        throw new TypeError('Testprotokoll beginnt nicht mit der festgelegten Startansicht.');
      }
    } else {
      if (typeof step.from !== 'string' || typeof step.action !== 'string' ||
          (index > 0 && trace.steps[index - 1].to !== step.from)) {
        throw new TypeError('Testprotokoll enthält eine unterbrochene Bildschirmfolge.');
      }
      const transition = navigatePilot(step.from, step.action);
      if (!transition.ok || transition.screen !== step.to) {
        throw new TypeError('Testprotokoll enthält einen nicht vorgesehenen Übergang.');
      }
    }
  }
  return true;
}

/**
 * Leitet einen neuen, unabhängigen Zustand ab. Nur erlaubte Pilotaktionen
 * können in das Protokoll aufgenommen werden, selbst bei fehlerhaften Aufrufen.
 */
export function appendPilotTrace(trace, from, action) {
  validatePilotTrace(trace);
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
  validatePilotTrace(trace);
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
