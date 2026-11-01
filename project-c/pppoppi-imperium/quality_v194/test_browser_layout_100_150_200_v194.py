#!/usr/bin/env python3
"""Native 100/150/200% layout evidence; no complete gameplay/release approval."""
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser_native_zoom_v194 import (
    audit_all_scenes, check, extension_at, set_real_zoom, tab_to,
    wait_for_zoom_worker,
)

HERE = Path(__file__).resolve().parent
FACTORS = (1.0, 1.5, 2.0)
EXPECTED_SCENES = 40


def exercise(playwright, root, preview, extension, factor, evidence):
    percent = round(100 * factor)
    label = str(percent) + '%'
    context = playwright.chromium.launch_persistent_context(
        str(root / ('profile-' + str(percent))), channel='chromium',
        headless=True, viewport={'width': 800, 'height': 600},
        reduced_motion='reduce',
        args=['--disable-extensions-except=' + str(extension),
              '--load-extension=' + str(extension)])
    try:
        errors, external = [], []
        page = context.new_page()
        page.set_default_timeout(15000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: external.append(request.url)
                if request.url.startswith(('http://', 'https://')) else None)
        page.goto((preview / 'index.html').as_uri(), wait_until='load')
        page.wait_for_function("typeof PPNavigation191 === 'object'")
        worker = wait_for_zoom_worker(context)
        baseline = page.evaluate('({width:innerWidth,dpr:devicePixelRatio})')
        check(label + ': Basis 800 CSS-Pixel', baseline['width'] == 800)
        check(label + ': Spielstart per Tab', tab_to(page, '#startGame'))
        page.keyboard.press('Enter')
        page.locator('#econMode').wait_for(state='visible')
        check(label + ': neue Partie per Tab', tab_to(page, '[data-ui="newgame"]'))
        page.keyboard.press('Enter')
        page.wait_for_function('NeoEconomy.getState() !== null')
        if page.locator('#dialog').evaluate('(dialog) => dialog.open'):
            page.keyboard.press('Escape')
            page.wait_for_function("!document.querySelector('#dialog').open")
        original = page.evaluate('JSON.stringify(NeoEconomy.getState())')
        actual = set_real_zoom(worker, page.url, factor)
        check(label + ': nativer Zoom bestaetigt', abs(actual['factor'] - factor) < .01)
        page.wait_for_function(
            '({factor,base}) => Math.abs(devicePixelRatio/base-factor)<.02',
            arg={'factor': factor, 'base': baseline['dpr']})
        metrics = page.evaluate('''() => ({width:innerWidth,height:innerHeight,
            dpr:devicePixelRatio,pageExcess:Math.max(0,
            document.documentElement.scrollWidth-document.documentElement.clientWidth)})''')
        check(label + ': echte CSS-Breite', abs(metrics['width'] - 800/factor) <= 2)
        check(label + ': kein horizontaler Seitenueberlauf', metrics['pageExcess'] <= 2)
        check(label + ': Hilfe per Tab erreichbar', tab_to(page, '#helpBtn'))
        check(label + ': sichtbarer Fokus', page.evaluate("document.activeElement.matches(':focus-visible')"))
        page.keyboard.press('Enter')
        page.locator('#dialog').wait_for(state='visible')
        page.screenshot(path=str(evidence / ('help-' + str(percent) + '.png')))
        page.evaluate('''() => {
            const buttons=[...document.querySelectorAll('#dialogContent button:not([disabled])')];
            if(!buttons.length)throw Error('Keine Hilfeaktionen');
            buttons[buttons.length-1].dataset.qaHelpLast='yes';
        }''')
        check(label + ': letzte Hilfeaktion per Tab', tab_to(page, '[data-qa-help-last="yes"]'))
        check(label + ': letzte Hilfeaktion sichtbar und unverdeckt', page.locator('[data-qa-help-last="yes"]').evaluate('''el => {
            const r=el.getBoundingClientRect(); const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
            return r.top>=0 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1 && !!top && el.contains(top);
        }'''))
        page.screenshot(path=str(evidence / ('help-bottom-' + str(percent) + '.png')))
        page.keyboard.press('Escape')
        page.wait_for_function("!document.querySelector('#dialog').open")
        check(label + ': Hilfefokus kehrt zurueck', page.locator('#helpBtn').evaluate('(el)=>el===document.activeElement'))
        scenes = audit_all_scenes(page, label, original)
        check(label + ': alle 40 registrierten Ansichten', scenes['scenes'] == EXPECTED_SCENES)
        check(label + ': keine Dialogueberlaeufe', scenes['overflow_count'] == 0)
        check(label + ': Schliessen immer im Sichtbereich', not scenes['close_outside_viewport'])
        captured = []
        for number, scene in enumerate(page.evaluate('PPNavigation191.getScenes()')):
            page.evaluate('(id) => PPNavigation191.open(id)', scene)
            page.locator('#dialog').wait_for(state='visible')
            filename = 'scene-' + str(percent) + '-' + str(number).zfill(2) + '.png'
            page.screenshot(path=str(evidence / filename))
            captured.append({'scene': scene, 'file': filename})
            page.keyboard.press('Escape')
            page.wait_for_function("!document.querySelector('#dialog').open")
        check(label + ': Wirtschaft unveraendert', page.evaluate('JSON.stringify(NeoEconomy.getState())') == original)
        check(label + ': keine JavaScript-Laufzeitfehler', not errors)
        check(label + ': keine externen Netzanforderungen', not external)
        return {'percent': percent, 'native_zoom': actual['factor'],
                'metrics': metrics, 'scenes': scenes, 'screenshots': captured,
                'help_keyboard': 'PASS', 'state_unchanged': True,
                'coverage': 'LAYOUT_AND_CLOSE_ONLY', 'release_gate': 'BLOCKED'}
    finally:
        context.close()


def end_variant(playwright, root, preview, extension, evidence, variant):
    """Actual free-game confirmation and natural four-human campaign tie."""
    context = playwright.chromium.launch_persistent_context(
        str(root / ('ending-' + variant)), channel='chromium', headless=True,
        viewport={'width':800,'height':600}, reduced_motion='reduce',
        args=['--disable-extensions-except='+str(extension),'--load-extension='+str(extension)])
    try:
        errors, external = [], []
        page=context.new_page();page.set_default_timeout(15000)
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('request',lambda request:external.append(request.url)
                if request.url.startswith(('http://','https://')) else None)
        page.goto((preview/'index.html').as_uri(),wait_until='load')
        page.wait_for_function('window.NeoEconomy && window.NeoEconomy.endstate')
        worker=wait_for_zoom_worker(context)
        check(variant+': Starttaste erreichbar',tab_to(page,'#startGame'))
        page.keyboard.press('Enter')
        page.locator('#econMode').wait_for(state='visible')
        page.locator('#econMode').select_option('4-0' if variant=='tie' else '1-2')
        page.get_by_label('Spielart',exact=True).select_option('campaign:12' if variant=='tie' else 'free')
        check(variant+': neue Partie erreichbar',tab_to(page,'[data-ui="newgame"]'))
        page.keyboard.press('Enter')
        page.wait_for_function('NeoEconomy.getState() !== null')
        check(variant+': echter 150-Prozent-Zoom',abs(set_real_zoom(worker,page.url,1.5)['factor']-1.5)<.01)
        page.wait_for_function('Math.abs(devicePixelRatio-1.5)<.02')
        if variant=='free':
            original=page.evaluate('JSON.stringify(NeoEconomy.getState())')
            page.evaluate("NeoEconomy.open('endstate')")
            check('Freier Abschluss: Abbrechen erreichbar',tab_to(page,'[data-ui="finish-cancel"]'))
            page.keyboard.press('Enter')
            check('Abbruch laesst Partie aktiv',page.evaluate("NeoEconomy.endstate.status()==='active'"))
            check('Abbruch erhaelt Spielzustand',page.evaluate('JSON.stringify(NeoEconomy.getState())')==original)
            page.evaluate("NeoEconomy.open('endstate')")
            check('Freier Abschluss: Bestaetigen erreichbar',tab_to(page,'[data-ui="finish-confirm"]'))
            page.keyboard.press('Enter')
            page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
            archive=page.evaluate('NeoEconomy.endstate.archive()')
            check('Freies Ende ohne erfundenen Sieger',archive['mode']=='free' and archive['winnerIds']==[] and archive['ranking']==[])
        else:
            for month in range(1,13):
                for human in range(1,5):
                    handoff=page.locator('[data-ui="handoff-ok"]')
                    if handoff.is_visible():
                        check('Spielerwechsel erreichbar',tab_to(page,'[data-ui="handoff-ok"]'))
                        page.keyboard.press('Enter')
                    state=page.evaluate('NeoEconomy.getState()')
                    check('Natuerliche Zugfolge',state['month']==month and state['phase']=='TURN' and state['companies'][state['turnIndex']]['id']=='H'+str(human))
                    page.evaluate("NeoEconomy.open('calendar')")
                    check('Monatszug per Tab',tab_to(page,'[data-econ="END_TURN"]'))
                    page.keyboard.press('Enter')
                    page.wait_for_function('(old)=>NeoEconomy.getState().phase!=="TURN" || NeoEconomy.getState().turnIndex!==old',arg=human-1)
                state=page.evaluate('NeoEconomy.getState()')
                check('Monatsbericht genau einmal',state['phase']=='REPORT' and len(state['reports'])==month)
                if month<12:
                    check('Folgemonat per Tab',tab_to(page,'[data-econ="NEXT_MONTH"]'))
                    page.keyboard.press('Enter')
                    page.wait_for_function('(m)=>NeoEconomy.getState().month===m',arg=month+1)
            page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
            archive=page.evaluate('NeoEconomy.endstate.archive()')
            check('Vier gleiche Firmen sind gemeinsame Sieger',set(archive['winnerIds'])=={'H1','H2','H3','H4'} and len(archive['ranking'])==4 and all(row['rank']==1 for row in archive['ranking']))
            check('Gleichstand hat exakt einen Wert',len({row['scoreCent'] for row in archive['ranking']})==1)
        page.screenshot(path=str(evidence/('ending-'+variant+'-150.png')))
        page.evaluate("NeoEconomy.send('END_TURN')")
        check('Archiv bleibt nach weiterer Aktion unveraendert',page.evaluate('NeoEconomy.endstate.archive()')==archive)
        check('Gueltiger unveraenderter Kernzustand',page.evaluate('NeoEconomy.engine.validate(NeoEconomy.getState())'))
        check('Endvariante ohne Laufzeitfehler und Netzwerk',not errors and not external)
        return {'variant':variant,'zoom':150,'endMonth':archive['endMonth'],
                'winnerIds':archive['winnerIds'],'ranked':len(archive['ranking']),
                'immutable':True,'release_gate':'BLOCKED'}
    finally:
        context.close()


def main():
    evidence = Path('layout_100_150_200_evidence')
    evidence.mkdir(exist_ok=True)
    results, endings = [], []
    try:
        with tempfile.TemporaryDirectory(prefix='pppoppi-zoom-150-') as temp:
            root = Path(temp)
            preview, extension = root / 'preview', root / 'extension'
            subprocess.run(['node', str(HERE / 'build.cjs'), str(preview)],
                           check=True, capture_output=True, text=True, timeout=90)
            check('Manifestgepruefte Vorschau vorhanden', (preview / 'index.html').is_file())
            extension_at(extension)
            with sync_playwright() as playwright:
                for factor in FACTORS:
                    results.append(exercise(playwright, root, preview, extension, factor, evidence))
                for variant in ('free','tie'):
                    endings.append(end_variant(playwright,root,preview,extension,evidence,variant))
        check('Alle drei Zoomstufen ausgefuehrt', [r['percent'] for r in results] == [100, 150, 200])
        check('Beide Endvarianten ausgefuehrt',[r['variant'] for r in endings]==['free','tie'])
    finally:
        payload = {'schema': 'pppoppi.layout-evidence/1', 'physical_viewport': [800,600],
                   'results': results, 'endings': endings, 'complete': len(results) == 3 and len(endings)==2,
                   'coverage': 'layout/help-scroll/keyboard-close/free-cancel-confirm/natural-tie; scene opening programmatic',
                   'release_gate': 'BLOCKED'}
        (evidence / 'results.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
        print('LAYOUT-100-150-200:', json.dumps(payload, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
