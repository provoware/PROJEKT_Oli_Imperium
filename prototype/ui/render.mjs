import { UI_TEXT } from './texts.de.mjs';

/** Reine DOM-Darstellung. Keine Netzwerkzugriffe und keine Navigation. */
function element(document, tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function definition(document, label, value) {
  const row = element(document, 'div', undefined, 'data-row');
  row.append(element(document, 'dt', label), element(document, 'dd', value));
  return row;
}

function textList(document, title, items, emptyText) {
  const group = element(document, 'section', undefined, 'detail-group');
  group.append(element(document, 'h3', title));
  const list = element(document, 'ul');
  if (items.length === 0) {
    list.append(element(document, 'li', emptyText));
  } else {
    for (const line of items) list.append(element(document, 'li', line));
  }
  group.append(list);
  return group;
}

export function renderPilotScreen(document, card) {
  const fragment = document.createDocumentFragment();
  const header = element(document, 'header', undefined, 'screen-header');
  header.append(element(document, 'p', card.screen.id + UI_TEXT.screenLabel, 'eyebrow'));
  const title = element(document, 'h2', card.screen.title);
  title.tabIndex = -1;
  header.append(title);
  header.append(element(document, 'p', 'Forschungsstatus: ' + card.screen.status + UI_TEXT.sourceWarning, 'evidence-warning'));
  fragment.append(header, element(document, 'p', UI_TEXT.intro));

  const metadata = element(document, 'dl', undefined, 'data-list');
  metadata.append(definition(document, UI_TEXT.referenceStatus, card.reference.status));
  metadata.append(definition(document, UI_TEXT.emulatorRun, card.reference.verified_run === true
    ? UI_TEXT.runDocumented : UI_TEXT.runMissing));
  const approved = card.rules.filter((rule) => rule.status === 'approved').length;
  metadata.append(definition(document, UI_TEXT.ruleCount, approved + ' von ' + card.rules.length));
  fragment.append(metadata);

  fragment.append(textList(document, UI_TEXT.rulesTitle,
    card.rules.map((rule) => rule.id + ' · ' + rule.title + ' · ' + rule.status), UI_TEXT.noRules));
  fragment.append(textList(document, UI_TEXT.questionsTitle,
    card.questions.map((question) => question.id + ' · ' + question.text + ' · ' + question.status), UI_TEXT.noQuestions));

  const sources = element(document, 'section', undefined, 'detail-group');
  sources.append(element(document, 'h3', UI_TEXT.sourcesTitle));
  const links = element(document, 'ul');
  if (card.sources.length === 0) links.append(element(document, 'li', UI_TEXT.noSources));
  for (const source of card.sources) {
    const li = element(document, 'li');
    const anchor = element(document, 'a', source.id + ' · ' + source.title);
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:') throw new Error('Keine HTTPS-Quelle');
      anchor.href = url.href;
      anchor.rel = 'noreferrer noopener';
      li.append(anchor, element(document, 'span', ' · ' + source.type));
    } catch {
      li.textContent = source.id + UI_TEXT.badSource;
    }
    links.append(li);
  }
  sources.append(links);
  fragment.append(sources);
  return fragment;
}

export function renderPilotControls(document, actions, onAction) {
  const fragment = document.createDocumentFragment();
  for (const action of actions) {
    const label = UI_TEXT.actions[action];
    if (typeof label !== 'string') continue;
    const button = element(document, 'button', label);
    button.type = 'button';
    button.addEventListener('click', () => onAction(action));
    fragment.append(button);
  }
  return fragment;
}

export function renderLoadFailure(document) {
  return element(document, 'p', UI_TEXT.loadFailed);
}

/** Ruhiger, nicht interaktiver Wartezustand: kein alter Bildschirm. */
export function renderLoadingState(document) {
  return element(document, 'p', UI_TEXT.loadingDetail);
}

/** Nur die letzten acht Schritte sichtbar, kompletter Puffer bleibt exportierbar. */
export function renderPilotTraceSteps(document, trace) {
  const fragment = document.createDocumentFragment();
  if (trace.omitted_steps > 0) {
    fragment.append(element(document, 'li', UI_TEXT.traceOmitted + ' ' + trace.omitted_steps));
  }
  for (const step of trace.steps.slice(-8)) {
    const description = step.sequence === 0 ? UI_TEXT.traceStart :
      (UI_TEXT.actions[step.action] ?? step.action);
    fragment.append(element(document, 'li',
      UI_TEXT.traceStep + ' ' + step.sequence + ': ' +
      (step.from === null ? '' : step.from + ' → ') + step.to +
      ' · ' + description));
  }
  return fragment;
}
