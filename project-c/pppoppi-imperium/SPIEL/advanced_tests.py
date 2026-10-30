from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
root=Path(__file__).parent
h=(root/'index.html').read_text()
h=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(root/m.group(1)).read_text()+'</style>',h)
h=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/m.group(1)).read_text()+'</script>',h)
results=[]
def t(ok,msg):results.append({'name':msg,'passed':bool(ok)});assert ok,msg
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(4000)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(h)
 page.locator('#startGame').click();page.locator('#econMode').select_option('2-2');page.locator('[data-ui="newgame"]').click()
 game=page.evaluate('NeoEconomy.getState()');t(len(game['companies'])==4 and game['companies'][1]['type']=='human','Zwei Menschen und zwei KI-Firmen starten')
 page.evaluate('NeoEconomy.open("calendar")');page.locator('[data-econ="END_TURN"]').click()
 t(page.locator('[data-ui="handoff-ok"]').count()==1,'Privater Spielerwechsel zeigt Übergabedialog')
 t(page.locator('.bottom .stats').inner_text().find('200.000')<0,'Fremdes Bargeld während Übergabe verdeckt')
 page.locator('[data-ui="handoff-ok"]').click()
 t(page.evaluate('NeoEconomy.getState().companies[NeoEconomy.getState().turnIndex].id')=='H2','Zweite menschliche Firma aktiv')
 t('Mensch 2' in page.locator('.bottom .stats').inner_text(),'Beträge erst nach bestätigter Übergabe sichtbar')
 # 2nd human ends; AI turns and closes month
 page.evaluate('NeoEconomy.open("calendar")');page.locator('[data-econ="END_TURN"]').click()
 t(page.evaluate('NeoEconomy.getState().phase')=='REPORT','Mehrspielermonat wird nach beiden Menschen abgerechnet')
 # separate instance: game action failure must not mutate
 second=b.new_page();second.set_default_timeout(4000);second.set_content(h)
 second.locator('#startGame').click();second.locator('[data-ui="newgame"]').click()
 second.evaluate('NeoEconomy.open("claim")')
 before=second.evaluate('JSON.stringify(NeoEconomy.getState())')
 second.locator('[data-econ="BUY"]').click()
 after=second.evaluate('JSON.stringify(NeoEconomy.getState())')
 t(before==after,'Kauf ohne Gutachten verändert keinen Spielzustand')
 second.locator('[data-econ="SURVEY"]').click();second.locator('[data-econ="BUY"]').click()
 second.evaluate('NeoEconomy.open("workshop")')
 second.locator('[data-econ="DRILL_SELF_START"]').click()
 t(second.evaluate('NeoEconomy.getState().minigame.kind')=='DRILL','Eigenbohrung startet echtes Minispiel')
 for _ in range(3):
  game=second.evaluate('NeoEconomy.getState()'); m=game['minigame'];t(m is not None,'Minispielabschnitt aktiv')
  goal=second.evaluate('OliV082.target(NeoEconomy.getState(),NeoEconomy.getState().minigame)')
  dial=m['dial']; diff=goal-dial
  while diff!=0:
   inc=(10 if diff>=10 else 1) if diff>0 else (-10 if diff<=-10 else -1)
   second.locator(f'[data-delta="{inc}"]').click();diff-=inc
  second.locator('[data-econ="MINI_CHECK"]').click()
 t(second.evaluate('NeoEconomy.getState().claims["BERLIN-1"].drilled') is True,'Alle drei Bohr-Minispielabschnitte verändern echte Anlage')
 t(not errs,'Mehrspieler-Browserlauf ohne JS-Ausnahmen')
 b.close()
(root/'advanced_results.json').write_text(json.dumps({'passed':len(results),'tests':results},ensure_ascii=False,indent=2))
print('ADVANCED',len(results),'PASSED')
