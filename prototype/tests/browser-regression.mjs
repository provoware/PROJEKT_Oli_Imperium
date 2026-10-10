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

  iframe.style.width = '390px';
  await sleep(100);
  const docWidth = page.documentElement.clientWidth;
  const scrollWidth = page.documentElement.scrollWidth;
  check(docWidth <= 400 && scrollWidth <= docWidth + 2,
    'Schmale Darstellung (390px) ohne horizontales Überlaufen');

  const reload = page.querySelector('#reload-contract');
  const previousFetch = win.fetch;
  try {
    win.fetch = async () => ({ ok: false, status: 503 });
    reload.click();
    await until(() => page.querySelector('#pilot-status')?.textContent?.includes('Fehler beim Laden'),
      'serverseitige Datenlade-Störung sichtbar melden');
    check(page.querySelector('#pilot-controls').children.length === 0,
      'Bei Ladefehler sind alte Navigationsaktionen entfernt');
    check(page.querySelector('#c0-version').textContent.includes('nicht freigegeben'),
      'Veraltete Versionsanzeige wird bei fehlerhaften Daten zurückgesetzt');
    check(reload.disabled === false, 'Erneuter Ladeversuch bleibt möglich');
  } finally {
    win.fetch = previousFetch;
  }
  reload.click();
  await until(() => page.querySelector('#pilot-status')?.textContent?.includes('Testbasis bereit'),
    'Wiederherstellung nach Ladefehler');
  check(pageTitle(page).includes('Büro'), 'Nach erfolgreichem Wiederladen Büroansicht wiederhergestellt');

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
