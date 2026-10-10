import { INITIAL_SCREEN, availablePilotActions, getPilotCard, navigatePilot } from './navigation.mjs';
import { renderLoadFailure, renderPilotControls, renderPilotScreen } from './ui/render.mjs';
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

if (!controls || !view || !status || !retry || !versionLabel) {
  throw new Error('HTML-Testbasis: erforderliche Oberflächenelemente fehlen.');
}

let contract = null;
let currentScreen = INITIAL_SCREEN;

function showScreen() {
  const card = getPilotCard(contract, currentScreen);
  view.replaceChildren(renderPilotScreen(document, card));
  controls.replaceChildren(renderPilotControls(document, availablePilotActions(currentScreen), (action) => {
    const result = navigatePilot(currentScreen, action);
    if (!result.ok) {
      status.textContent = result.error;
      return;
    }
    currentScreen = result.screen;
    showScreen();
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
  controls.replaceChildren();
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
    contract = candidate;
    currentScreen = INITIAL_SCREEN;
    versionLabel.textContent = UI_TEXT.versionPrefix + config.version;
    showScreen();
    status.textContent = UI_TEXT.ready;
  } catch (error) {
    contract = null;
    versionLabel.textContent = UI_TEXT.versionError;
    view.replaceChildren(renderLoadFailure(document));
    status.textContent = UI_TEXT.loadingErrorPrefix + (error instanceof Error ? error.message : 'unbekannt');
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener('click', () => { void reload(); });
void reload();
