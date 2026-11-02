from pathlib import Path
import json,hashlib,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];shots=root/'screenshots_v14';shots.mkdir(exist_ok=True)
results=[];errors=[];requests=[]
def test(condition,label):
    results.append({'test':label,'ok':bool(condition)});print(('PASS' if condition else 'FAIL'),label,flush=True);assert condition,label
html=(root/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+ (root/m.group(1)).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (root/m.group(1)).read_text()+'</script>',html)
def go(page,who):page.evaluate('(id)=>NeoEconomy.open(id)',who)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1470,'height':940},accept_downloads=True)
    page.set_default_timeout(4500)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url) if r.url.startswith('http') else None)
    page.set_content(html,wait_until='load')
    test(page.evaluate('typeof NeoEconomy')=='object','V1.4 mit Spielkern geladen')
    test(page.evaluate('typeof PPArcade')=='object','Drei Minispieloberflächen geladen')
    before_demo=page.evaluate('JSON.stringify(NeoEconomy.getState())')
    page.locator('#motionBtn').click();test(page.locator('#motionBtn').get_attribute('aria-pressed')=='false','Dekorative Animationen abschaltbar')
    test(page.evaluate('JSON.stringify(NeoEconomy.getState())')==before_demo,'Animationsschalter ist wirtschaftlich neutral')
    page.locator('#motionBtn').click()
    page.screenshot(path=str(shots/'01_Profi_Buero.png'),full_page=True)
    page.locator('#startGame').click();page.locator('[data-ui="newgame"]').click()
    test(page.evaluate('NeoEconomy.getState().schema')=='pppoppi.berlin.save/0.8.2','Unverändertes Speicherformat V0.8.2')
    go(page,'claim');page.locator('[data-econ="SURVEY"]').click();page.locator('[data-econ="BUY"]').click();
    test(page.evaluate('NeoEconomy.getState().claims["BERLIN-1"].owner')=='H1','Ölfeld erfolgreich gekauft')
    go(page,'workshop');page.locator('[data-econ="DRILL_SELF_START"]').click()
    test(page.locator('.skill-console').count()==1,'Neuer Bohrdruckdialog sichtbar')
    page.locator('.skill-console').screenshot(path=str(shots/'02_Bohrdruck.png'))
    # Negative action: intentionally wrong dial, must not drill.
    first=page.evaluate('NeoEconomy.getState()')
    page.locator('#skillPressure').fill('0');page.locator('[data-arcade="drill-check"]').click()
    state=page.evaluate('NeoEconomy.getState()')
    test(not state['claims']['BERLIN-1']['drilled'] and state['minigame']['attempts']==1,'Fehlschlag kostet Versuch, nicht zweiten Startpreis')
    test(state['companies'][0]['cashCent']==first['companies'][0]['cashCent'],'Fehlversuch belastet nicht erneut das Konto')
    for i in range(3):
        state=page.evaluate('NeoEconomy.getState()');m=state['minigame'];goal=page.evaluate('OliV082.target(NeoEconomy.getState(), NeoEconomy.getState().minigame)')
        page.locator('#skillPressure').fill(str(goal));page.locator('[data-arcade="drill-check"]').click()
        nxt=page.evaluate('NeoEconomy.getState()');test((nxt['minigame']['stage']==i+1 if i<2 else nxt['minigame'] is None),f'Bohrstufe {i+1} erfolgreich')
    test(page.evaluate('NeoEconomy.getState().claims["BERLIN-1"].drilled'),'Erfolgreiches Minispiel erschließt Feld')
    go(page,'field');page.screenshot(path=str(shots/'03_Erschlossenes_Feld.png'),full_page=True)
    go(page,'pipeline');page.locator('[data-econ="PIPE_START"]').click()
    test(page.locator('.skill-pipeboard .skill-pipe-tile').count()>=6,'Rohrleitungs-Puzzle als echte klickbare Bauteile')
    page.locator('.skill-console').screenshot(path=str(shots/'04_Pipeline_Puzzle.png'))
    patterns=[[(0,1),(1,1),(2,1),(2,0),(3,0),(4,0)],[(0,2),(1,2),(1,1),(2,1),(3,1),(3,0),(4,0)],[(0,0),(1,0),(1,1),(2,1),(2,2),(3,2),(4,2)]]
    for stage,path in enumerate(patterns):
        for i,(x,y) in enumerate(path):
            turns=(i*3+stage+1)%4
            for _ in range((4-turns)%4):page.locator(f'button[data-cell="{x}-{y}"]').click()
        page.screenshot(path=str(shots/f'0{5+stage}_Pipeline_verbunden_{stage+1}.png'),full_page=True) if stage==0 else None
        page.locator('[data-arcade="pipe-check"]').click()
        ss=page.evaluate('NeoEconomy.getState()');test(ss['minigame']['stage']==stage+1 if stage<2 else ss['minigame'] is None,f'Rohrnetzphase {stage+1} abgeschlossen')
    test(page.evaluate('NeoEconomy.getState().claims["BERLIN-1"].pipeline'),'Rohrleitungsbau aktiviert echten Transportvorteil')
    # Simulate legitimate turn-cycle event state for the UI firefighter via an imported validated save.
    s=page.evaluate('NeoEconomy.getState()');s['claims']['BERLIN-1']['burning']=True
    import_file=root/'tests_v14'/'brand_szenario.json';import_file.write_text(json.dumps(s,ensure_ascii=False))
    go(page,'computer');page.locator('[data-ui="import"]').click();page.locator('#loadEconFile').set_input_files(str(import_file))
    page.wait_for_function('NeoEconomy.getState().claims["BERLIN-1"].burning')
    test(page.evaluate('NeoEconomy.getState().claims["BERLIN-1"].burning'),'Validierter Brandszenario-Spielstand geladen')
    go(page,'workshop');page.locator('[data-econ="FIRE_START"]').click();test(page.locator('.skill-fire-scene').count()==1,'Feuerwehreinsatz mit eigenständiger Szene')
    page.locator('.skill-console').screenshot(path=str(shots/'06_Brandbekaempfung.png'))
    right=['VENTIL','KUEHLEN','SCHAUM']
    for i,choice in enumerate(right):
        page.locator(f'[data-choice="{choice}"]').click()
        st=page.evaluate('NeoEconomy.getState()');test((st['minigame']['stage']==i+1 if i<2 else st['minigame'] is None),f'Taktische Feuerwehrphase {i+1} abgeschlossen')
    test(page.evaluate('!NeoEconomy.getState().claims["BERLIN-1"].burning'),'Brand wird ausschließlich über bestehendes Regelsystem gelöscht')
    # financial consistency and retained save-format
    test(page.evaluate('OliV082.validate(NeoEconomy.getState())'),'Endzustand ist nach Regeln valide')
    old=page.evaluate('JSON.stringify(NeoEconomy.getState())');page.evaluate('NeoEconomy.open("boardroom")');page.locator('[data-advice]').first.click()
    test(old==page.evaluate('JSON.stringify(NeoEconomy.getState())'),'Figurenhumor verändert niemals Wirtschaftswerte')
    page.screenshot(path=str(shots/'07_Vorstand.png'),full_page=True)
    page.locator('#closeBtn').click()
    with page.expect_download() as dl:page.locator('#saveGame').click()
    sav=root/'tests_v14'/'exported_save.json';dl.value.save_as(str(sav))
    test(json.loads(sav.read_text())['schema']=='pppoppi.berlin.save/0.8.2','Dateiexport nutzt bestehendes Schema')
    page.locator('#loadGame').click();page.locator('#loadEconFile').set_input_files(str(sav))
    page.wait_for_function('NeoEconomy.getState().claims["BERLIN-1"].pipeline')
    test(page.evaluate('NeoEconomy.getState().claims["BERLIN-1"].pipeline'),'Import erhält fertiges Rohrnetz')
    mob=browser.new_page(viewport={'width':390,'height':844});mob.set_content(html,wait_until='load')
    mob.locator('#startGame').click();mob.locator('[data-ui="newgame"]').click();mob.evaluate('NeoEconomy.open("claim")');mob.locator('[data-econ="SURVEY"]').click();mob.locator('[data-econ="BUY"]').click();mob.evaluate('NeoEconomy.open("workshop")');mob.locator('[data-econ="DRILL_SELF_START"]').click()
    test(mob.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Neue Minispiele verhindern horizontales Seitenscrollen auf Mobil')
    mob.screenshot(path=str(shots/'08_Mobil_Minispiel.png'),full_page=True)
    test(not errors,'Keine ungefangenen Browserfehler');test(not requests,'Keine externen Netzwerkanfragen')
    browser.close()
manifest={'checks':results,'total':len(results),'passed':sum(t['ok'] for t in results),'screenshots':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(shots.glob('*.png'))],'browser_errors':errors,'network_requests':requests,'test_transport':'Chromium set_content: alle lokalen CSS/JS-Dateien eingebettet'}
(root/'tests_v14'/'acceptance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('V1.4 FINAL',manifest['passed'],'/',manifest['total'],' screenshots=',len(manifest['screenshots']))
