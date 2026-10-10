/**
 * Funktionaler Browser-Regressionslauf ohne zusätzliche Bibliotheken.
 * Läuft NUR über prototype/tests/browser-regression.html auf localhost.
 * Technische UI-Prüfung != C64-Original- oder menschliche Sichtabnahme.
 */
const result = document.querySelector('#result');
const iframe = document.querySelector('#pilot-frame');
const checks = [];
function check(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(predicate, label, timeoutMs = 12000) {
  const untilTime = Date.now() + timeoutMs;
  while (Date.now() < untilTime) {
    if (predicate()) return;
    await sleep(75);
  }
  throw new Error('Zeitüberschreitung: ' + label);
}
function buttonByText(doc, needle) {
  const button = Array.from(doc.querySelectorAll('#pilot-controls button'))
    .find((item) => item.textContent.includes(needle));
  if (!button) throw new Error('Navigationsschaltfläche fehlt: ' + needle);
  return button;
}
function pageTitle(doc) {
  return doc.querySelector('#pilot-view h2')?.textContent ?? '';
}
async function run() {
  // Ein iframe besitzt zunächst ein leeres about:blank-Dokument, das bereits
  // readyState=complete hat. Auf die tatsächliche Zieladresse warten.
  await until(() => iframe.contentDocument?.URL?.endsWith('/prototype/index.html') &&
    iframe.contentDocument?.readyState === 'complete', 'HTML-Zieldokument laden');
  const page = iframe.contentDocument;
  const win = iframe.contentWindow;
  await until(() => page.querySelector('#pilot-status')?.textContent?.includes('Testbasis bereit'),
    'gültigen Datenvertrag und Versionskennung laden (Status: ' +
      page.querySelector('#pilot-status')?.textContent + ')');
  const configResponse = await fetch(new URL('../../release/c0-version.json', import.meta.url));
  check(configResponse.ok, 'Versionsdatei aus dem Projektstamm erreichbar');
  const config = await configResponse.json();
  check(page.querySelector('#c0-version')?.textContent === 'C0-Testfassung ' + config.version,
    'Version folgt der versionierten Konfigurationsdatei');
  const securityPolicy = page.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content;
  check(typeof securityPolicy === 'string' && securityPolicy.includes("script-src 'self'") &&
    securityPolicy.includes("object-src 'none'"), 'CSP sperrt externe/inline Skripte und Objekte');
  check(pageTitle(page).includes('Büro'), 'Büroansicht sichtbar');
  check(page.querySelector('#pilot-view')?.textContent.includes('REGEL-002'), 'Regel-IDs aus Vertrag sichtbar');
  check(page.querySelector('#pilot-view')?.textContent.includes('Q-001'), 'Forschungsfragen sichtbar');
  check(page.querySelector('#pilot-view')?.textContent.includes('nicht nachgewiesen'),
    'Originalreferenz unverändert als unbestätigt gekennzeichnet');

  const expected = [
    ['Weltkarte', 'Weltkarte'],
    ['Claim-Information', 'Claim'],
    ['Weltkarte', 'Weltkarte'],
    ['Büro zurück', 'Büro'],
  ];
  for (const [label, target] of expected) {
    const button = buttonByText(page, label);
    button.focus();
    check(page.activeElement === button, 'Navigationsbutton per Tastaturfokus erreichbar: ' + label);
    button.click();
    const title = page.querySelector('#pilot-view h2');
    check(title?.textContent?.includes(target), 'Entwurfsnavigation führt zu ' + target);
    check(page.activeElement === title, 'Fokus nach Navigation auf neuem Titel');
    check(page.querySelector('#pilot-status').textContent.includes('Keine bestätigte Original-Eingabe'),
      'Wechsel wird als rein technischer Entwurf beschrieben');
  }

  for (const [width, zoom] of [[320, 1], [390, 1], [640, 2]]) {
    iframe.style.width = width + 'px';
    page.documentElement.style.zoom = String(zoom);
    await sleep(120);
    const docWidth = page.documentElement.clientWidth;
    const scrollWidth = page.documentElement.scrollWidth;
    check(scrollWidth <= docWidth + 2,
      'Darstellung ohne horizontales Überlaufen bei ' + width + 'px / ' + (zoom * 100) + '%');
  }
  page.documentElement.style.zoom = '';
  iframe.style.width = '390px';

  const reload = page.querySelector('#reload-contract');
  const previousFetch = win.fetch;
  try {
    const requests = [];
    win.fetch = () => new Promise((resolve) => { requests.push(resolve); });
    reload.click();
    await until(() => requests.length === 2, 'beide Datenanforderungen beim Nachladen gestartet');
    check(reload.disabled === true, 'Doppeltes Laden während der Prüfung verhindert');
    check(page.querySelector('#pilot-view').getAttribute('aria-busy') === 'true',
      'Ladezustand für Hilfstechnologien erkennbar');
    check(!page.querySelector('#pilot-view').textContent.includes('REGEL-002'),
      'Veraltete Forschungsinhalte während des Ladens verborgen');
    check(page.querySelector('#pilot-controls').children.length === 0,
      'Keine alten Bedienaktionen während des Ladens sichtbar');
    check(page.querySelector('#c0-version').textContent.includes('Version wird geprüft'),
      'Versionsanzeige ist während des Ladens nicht veraltet');
    for (const resolve of requests) resolve({ ok: false, status: 503 });
    await until(() => page.querySelector('#pilot-status')?.textContent?.includes('Fehler beim Laden'),
      'serverseitige Datenlade-Störung sichtbar melden');
    check(page.querySelector('#pilot-controls').children.length === 0,
      'Bei Ladefehler sind alte Navigationsaktionen entfernt');
    check(page.querySelector('#c0-version').textContent.includes('nicht freigegeben'),
      'Veraltete Versionsanzeige wird bei fehlerhaften Daten zurückgesetzt');
    check(reload.disabled === false, 'Erneuter Ladeversuch bleibt möglich');
    check(page.querySelector('#pilot-view').getAttribute('aria-busy') === 'false',
      'Ladestatus wird nach Fehler zurückgenommen');
  } finally {
    win.fetch = previousFetch;
  }
  reload.click();
  await until(() => page.querySelector('#pilot-status')?.textContent?.includes('Testbasis bereit'),
    'Wiederherstellung nach Ladefehler');
  check(pageTitle(page).includes('Büro'), 'Nach erfolgreichem Wiederladen Büroansicht wiederhergestellt');
  check(page.querySelector('#pilot-view').getAttribute('aria-busy') === 'false',
    'Ladestatus wird nach erfolgreichem Wiederanlauf zurückgenommen');

  result.textContent = 'BROWSER_C0_PASS – ' + checks.length + ' technische Browserprüfungen erfolgreich.';
  result.dataset.checks = String(checks.length);
  result.dataset.state = 'passed';
  console.info(result.textContent);
}
run().catch((error) => {
  result.textContent = 'BROWSER_C0_FAIL – ' + error.message;
  result.dataset.state = 'failed';
  console.error(error);
});
