from pathlib import Path
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(p)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 issues=[]
 page.on('pageerror', lambda e:issues.append(str(e)))
 page.set_content((p/'index.html').read_text())
 page.add_style_tag(content=(p/'src/style.css').read_text())
 for script in ['engine.js','nav.js','ui.js']:
  page.add_script_tag(content=(p/'src'/script).read_text())
 page.get_by_role('button',name='Neue Partie einrichten').click()
 page.get_by_role('button',name='Partie jetzt beginnen').click()
 page.get_by_role('button',name='Karte und Ölfeld').click()
 page.get_by_role('button',name='Fiktives Brandenburg öffnen').click()
 page.get_by_role('button',name='Feld P-01 untersuchen').click()
 page.get_by_role('button',name='Gutachten').click()
 page.get_by_role('button',name='Gutachten beauftragen').click()
 page.get_by_role('button',name='← Zurück').first.click()
 page.get_by_role('button',name='Feldkauf').click()
 page.get_by_role('button',name='Konzession kaufen').click()
 page.get_by_role('button',name='← Zurück').first.click()
 page.get_by_role('button',name='Bohrung').click()
 page.get_by_role('button',name='Bohrfirma einsetzen').click()
 # navigate back via field -> region -> map -> HQ
 for _ in range(4):
  candidates=page.get_by_role('button',name='← Zurück')
  if candidates.count():candidates.first.click()
  else:break
 # visible HQ
 assert page.get_by_text('PPPOPPI:',exact=False).count(), 'Zentrale nicht erreicht'
 page.get_by_role('button',name='Lager & Förderung').click()
 page.get_by_role('button',name='100 Barrel fördern').click()
 page.get_by_role('button',name='Logistik öffnen').click()
 page.get_by_role('button',name='Lieferung vorbereiten',exact=True).click()
 page.get_by_role('button',name='← Zurück').first.click()
 page.get_by_role('button',name='← Zurück').first.click()
 page.get_by_role('button',name='Ölmarkt').click()
 page.get_by_role('button',name='Verkaufsangebot abgeben').click()
 page.get_by_role('button',name='← Zurück').first.click()
 page.get_by_role('button',name='Spielmonat abschließen').click()
 page.get_by_role('button',name='Monat verbindlich abrechnen').click()
 assert '56.000,00 €' in page.locator('#main').inner_text(),page.locator('#main').inner_text()
 assert '131.100,00 €' in page.locator('#indicators').inner_text()
 page.screenshot(path=str(p/'docs'/'browser_test.png'),full_page=True)
 with page.expect_download() as d:
  page.get_by_role('button',name='Spielstand exportieren').click()
 download=d.value
 assert download.suggested_filename.endswith('.json')
 save=p/'docs'/'test_save.json'; download.save_as(save)
 page.get_by_role('button',name='Nächsten Spielmonat beginnen').click()
 assert 'Monat 2' in page.locator('#topStatus').inner_text()
 page.locator('#fileImport').set_input_files(str(save))
 page.wait_for_function("document.querySelector('#topStatus').textContent.includes('Monat 1')")
 assert 'Monat 1' in page.locator('#topStatus').inner_text()
 assert not issues,issues
 print('BROWSER E2E OK · Start bis Monatsbericht · Ergebnis 131.100,00 € · Export/Import und 2. Monat OK · JS-Fehler 0')
 browser.close()
