import { INITIAL_SCREEN, availablePilotActions, getPilotCard, navigatePilot } from './navigation.mjs';
import { renderLoadFailure, renderLoadingState, renderPilotControls, renderPilotScreen, renderPilotTraceSteps } from './ui/render.mjs';
import { appendPilotTrace, createPilotTrace, serializePilotTrace } from './pilot-trace.mjs';
import { serializeReferenceComparisonPlan } from './reference-comparison.mjs';
import { UI_TEXT } from './ui/texts.de.mjs';

/**
 * Controller: nur Lade-/Benutzeraktionen. Fachmodell und HTML-Darstellung
 * bleiben in unabhängigen Modulen, Forschungsdaten strikt schreibgeschützt.
 */
const controls = document.querySelector('#pilot-controls');
const view = document.querySelector('#pilot-view');
const status = document.querySelector('#pilot-status');
const retry = document.querySelector('#reload-contract');
const versionLabel = document.querySelector('#c0-version');
const traceList = document.querySelector('#pilot-trace-list');
const traceDownload = document.querySelector('#download-trace');
const comparisonDownload = document.querySelector('#download-comparison');
const traceTitle = document.querySelector('#trace-title');
const traceDescription = document.querySelector('.trace-note');

if (!controls || !view || !status || !retry || !versionLabel ||
    !traceList || !traceDownload || !comparisonDownload || !traceTitle || !traceDescription) {
  throw new Error('HTML-Testbasis: erforderliche Oberflächenelemente fehlen.');
}

let contract = null;
let currentScreen = INITIAL_SCREEN;
let pilotTrace = null;
traceTitle.textContent = UI_TEXT.traceTitle;
traceDescription.textContent = UI_TEXT.traceDescription;
traceDownload.textContent = UI_TEXT.traceDownload;
comparisonDownload.textContent = UI_TEXT.comparisonDownload;

function showTrace() {
  traceList.replaceChildren();
  traceDownload.disabled = !pilotTrace;
  comparisonDownload.disabled = !pilotTrace || !contract;
  if (pilotTrace) traceList.append(renderPilotTraceSteps(document, pilotTrace));
}


function showScreen() {
  const card = getPilotCard(contract, currentScreen);
  view.replaceChildren(renderPilotScreen(document, card));
  controls.replaceChildren(renderPilotControls(document, availablePilotActions(currentScreen), (action) => {
    const result = navigatePilot(currentScreen, action);
    if (!result.ok) {
      status.textContent = result.error;
      return;
    }
    pilotTrace = appendPilotTrace(pilotTrace, currentScreen, action);
    currentScreen = result.screen;
    showScreen();
    showTrace();
    status.textContent = UI_TEXT.navigationPrefix + currentScreen + UI_TEXT.navigationSuffix;
    view.querySelector('h2')?.focus();
  }));
}

async function readJson(relativeUrl) {
  const response = await fetch(new URL(relativeUrl, import.meta.url), { cache: 'no-store' });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' (' + relativeUrl + ')');
  return response.json();
}

async function reload() {
  retry.disabled = true;
  // Keine alten Vertragsobjekte in einer neuen Sitzung weiterverwenden.
  contract = null;
  pilotTrace = null;
  showTrace();
  controls.replaceChildren();
  // Niemals den Inhalt einer alten Datenversion als neue Ansicht ausgeben.
  view.setAttribute('aria-busy', 'true');
  view.replaceChildren(renderLoadingState(document));
  versionLabel.textContent = UI_TEXT.versionLoading;
  status.textContent = UI_TEXT.loading;
  try {
    const [candidate, config] = await Promise.all([
      readJson('../data/contract.json'),
      readJson('../release/c0-version.json'),
    ]);
    // Die Versionskennung ist eine technische Aussage, keine Freigabe.
    if (config.component !== 'c0-html-research-prototype' || typeof config.version !== 'string' ||
      config.contract_schema !== candidate.schema_version || config.channel !== 'research-preview') {
      throw new Error('C0-Versions- oder Datenvertrag stimmt nicht überein.');
    }
    getPilotCard(candidate, INITIAL_SCREEN);
    const newTrace = createPilotTrace(config.version);
    contract = candidate;
    currentScreen = INITIAL_SCREEN;
    pilotTrace = newTrace;
    versionLabel.textContent = UI_TEXT.versionPrefix + config.version;
    showScreen();
    showTrace();
    status.textContent = UI_TEXT.ready;
  } catch (error) {
    contract = null;
    versionLabel.textContent = UI_TEXT.versionError;
    view.replaceChildren(renderLoadFailure(document));
    status.textContent = UI_TEXT.loadingErrorPrefix + (error instanceof Error ? error.message : 'unbekannt');
  } finally {
    view.setAttribute('aria-busy', 'false');
    retry.disabled = false;
  }
}


/**
 * Ein gemeinsamer, bewusster JSON-Download statt zweier fast identischer Pfade.
 * Der Inhalt wird vor dem Erstellen des Blob jeweils vollständig validiert.
 */
function exportJson(buildContent, suffix, successText, errorText) {
  if (!pilotTrace) return;
  try {
    const content = buildContent();
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const address = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = address;
      link.download = 'oli-imperium-c0-' + pilotTrace.preview_version + '-' + suffix + '.json';
      link.click();
      // Datei wird u. U. erst nach Ende des Click-Handlers ausgelesen.
      setTimeout(() => URL.revokeObjectURL(address), 1000);
    } catch (error) {
      URL.revokeObjectURL(address);
      throw error;
    }
    status.textContent = successText;
  } catch {
    status.textContent = errorText;
  }
}

traceDownload.addEventListener('click', () => {
  exportJson(
    () => serializePilotTrace(pilotTrace),
    'navigationstest', UI_TEXT.traceExported, UI_TEXT.traceExportError,
  );
});
comparisonDownload.addEventListener('click', () => {
  if (!contract) return;
  exportJson(
    () => serializeReferenceComparisonPlan(pilotTrace, contract),
    'vergleichsvorlage', UI_TEXT.comparisonExported, UI_TEXT.comparisonExportError,
  );
});

retry.addEventListener('click', () => { void reload(); });
void reload();
