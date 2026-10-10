import { INITIAL_SCREEN, availablePilotActions, getPilotCard, navigatePilot } from './navigation.mjs';

const controls = document.querySelector('#pilot-controls');
const view = document.querySelector('#pilot-view');
const status = document.querySelector('#pilot-status');
const retry = document.querySelector('#reload-contract');
const ACTION_LABELS = Object.freeze({
  'to-map': 'Entwurf: zur Weltkarte',
  'to-claims': 'Entwurf: Claim-Information öffnen',
  'to-office': 'Entwurf: zum Büro zurück',
});

let contract = null;
let currentScreen = INITIAL_SCREEN;

function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}

function definition(label, value) {
  const row = node('div', undefined, 'data-row');
  row.append(node('dt', label), node('dd', value));
  return row;
}

function renderCard() {
  const card = getPilotCard(contract, currentScreen);
  view.replaceChildren();
  const header = node('header', undefined, 'screen-header');
  header.append(node('p', card.screen.id + ' · Logische Testansicht', 'eyebrow'));
  header.append(node('h2', card.screen.title));
  header.append(node('p', 'Forschungsstatus: ' + card.screen.status + ' · KEIN Original-Screenshot', 'evidence-warning'));
  view.append(header);

  const explanation = node('p', 'Diese Ansicht testet die vorgeschlagene Navigation von Arbeit B. Aussehen, Steuerung, Claims und Rückweg des C64-Originals sind noch nicht nachgewiesen.');
  view.append(explanation);

  const meta = node('dl', undefined, 'data-list');
  meta.append(definition('Referenzstatus', card.reference.status));
  meta.append(definition('Eigener Emulatorlauf', card.reference.verified_run === true ? 'dokumentiert' : 'nicht nachgewiesen'));
  meta.append(definition('Freigegebene Regeln dieser Ansicht', card.rules.filter((r) => r.status === 'approved').length + ' von ' + card.rules.length));
  view.append(meta);

  const rules = node('section', undefined, 'detail-group');
  rules.append(node('h3', 'Regel-IDs und Forschungsstatus'));
  const ruleList = node('ul');
  for (const rule of card.rules) {
    ruleList.append(node('li', rule.id + ' · ' + rule.title + ' · ' + rule.status));
  }
  if (card.rules.length === 0) ruleList.append(node('li', 'Keine Regel zugeordnet.'));
  rules.append(ruleList);
  view.append(rules);

  const questions = node('section', undefined, 'detail-group');
  questions.append(node('h3', 'Offene Forschungsfragen'));
  const questionList = node('ul');
  for (const q of card.questions) {
    questionList.append(node('li', q.id + ' · ' + q.text + ' · ' + q.status));
  }
  if (card.questions.length === 0) questionList.append(node('li', 'Zu dieser Ansicht keine Frage zugeordnet.'));
  questions.append(questionList);
  view.append(questions);

  const sources = node('section', undefined, 'detail-group');
  sources.append(node('h3', 'Quellenhinweise (kein Originaltest)'));
  const links = node('ul');
  for (const source of card.sources) {
    const li = node('li');
    const anchor = node('a', source.id + ' · ' + source.title);
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:') throw new Error('nicht HTTPS');
      anchor.href = url.href;
      anchor.rel = 'noreferrer noopener';
      li.append(anchor, node('span', ' · ' + source.type));
    } catch {
      li.textContent = source.id + ' · Quellenlink ungültig';
    }
    links.append(li);
  }
  if (card.sources.length === 0) links.append(node('li', 'Keine Quelle zugeordnet.'));
  sources.append(links);
  view.append(sources);

  controls.replaceChildren();
  for (const action of availablePilotActions(currentScreen)) {
    const button = node('button', ACTION_LABELS[action] ?? action);
    button.type = 'button';
    button.addEventListener('click', () => {
      const result = navigatePilot(currentScreen, action);
      if (!result.ok) {
        status.textContent = result.error;
        return;
      }
      currentScreen = result.screen;
      renderCard();
      status.textContent = 'Technischer Testwechsel zu ' + currentScreen + '. Keine bestätigte Original-Eingabe.';
      view.querySelector('h2')?.focus();
    });
    controls.append(button);
  }
  const title = view.querySelector('h2');
  if (title) title.tabIndex = -1;
}

async function loadContract() {
  retry.disabled = true;
  controls.replaceChildren();
  status.textContent = 'Forschungsdaten werden geladen …';
  try {
    const response = await fetch(new URL('../data/contract.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const candidate = await response.json();
    getPilotCard(candidate, INITIAL_SCREEN);
    contract = candidate;
    currentScreen = INITIAL_SCREEN;
    renderCard();
    status.textContent = 'Testbasis bereit. Originaltreue ist noch nicht nachgewiesen.';
  } catch (error) {
    contract = null;
    view.replaceChildren(node('p', 'Die Forschungsdaten konnten nicht geladen werden. Bitte den lokalen HTTP-Server im Projektordner starten; keine Änderungen wurden vorgenommen.'));
    status.textContent = 'Fehler beim Laden: ' + (error instanceof Error ? error.message : 'unbekannt');
  } finally {
    retry.disabled = false;
  }
}
retry.addEventListener('click', () => { void loadContract(); });
void loadContract();
