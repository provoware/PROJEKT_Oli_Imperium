#!/usr/bin/env python3
"""Prueft fremde Spielstand-Eingaben und HTML-Escaping im Offline-Chromium.

Nur wegwerfbare Browserprofile und bewusst veraenderte Testkopien. Kein
Spieloriginal, kein realer Nutzer-Spielstand und keine C64-Originalregel.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import export_state, state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent
PAYLOAD = '<img src=x onerror=window.__pppoppiXss=1><svg onload=window.__pppoppiXss=2></svg>'
SCENES = ('computer', 'claim', 'finance', 'contracts', 'newsroom', 'report', 'map', 'region')


def check(label, condition):
    print(('PASS: ' if condition else 'FAIL: ') + label, flush=True)
    if not condition:
        raise AssertionError(label)


def corruptions(valid):
    cases = [('null', None), ('array', []), ('number', 42), ('string', 'text'), ('empty-object', {})]
    edits = (
        ('wrong-schema', lambda s: s.update(schema='unknown/1')),
        ('month-zero', lambda s: s.update(month=0)),
        ('month-too-large', lambda s: s.update(month=100001)),
        ('negative-cash', lambda s: s['companies'][0].update(cashCent=-1)),
        ('duplicate-company', lambda s: s['companies'][1].update(id=s['companies'][0]['id'])),
        ('missing-claims', lambda s: s.update(claims={})),
        ('duplicate-request', lambda s: s.update(processedIds=['repeat', 'repeat'])),
        ('missing-companies', lambda s: s.update(companies=[])),
    )
    nested_edits = (
        ('claim-foreign-owner', lambda s: s['claims']['BERLIN-1'].update(owner='UNKNOWN')),
        ('claim-duplicate-survey', lambda s: s['claims']['BERLIN-1'].update(surveyedBy=['H1', 'H1'])),
        ('claim-tank-level-zero', lambda s: s['claims']['BERLIN-1'].update(tankLevel=0)),
        ('claim-storage-overflow', lambda s: s['claims']['BERLIN-1'].update(
            inventoryMilli=s['claims']['BERLIN-1']['tankMilli'] + 1)),
        ('claim-negative-reserve', lambda s: s['claims']['BERLIN-1'].update(reserveMilli=-1)),
        ('claim-drilled-without-owner', lambda s: s['claims']['BERLIN-1'].update(drilled=True)),
        ('company-name-number', lambda s: s['companies'][0].update(name=123)),
        ('company-fractional-cash', lambda s: s['companies'][0].update(cashCent=1.25)),
        ('company-days-overflow', lambda s: s['companies'][0].update(daysUsed=9999)),
        ('obligation-overpaid', lambda s: s['companies'][0]['obligations'].append(
            {'dueCent': 1, 'paidCent': 2})),
        ('contract-invalid-status', lambda s: s['companies'][0]['contracts'].append(
            {'status': 'UNKNOWN', 'region': 'BERLIN'})),
        ('market-negative-price', lambda s: s['prices'].update(BERLIN=-1)),
        ('market-negative-demand', lambda s: s['demand'].update(BERLIN=-1)),
        ('turn-index-out-of-range', lambda s: s.update(turnIndex=999)),
        ('negative-sequence', lambda s: s.update(sequence=-1)),
        ('invalid-phase', lambda s: s.update(phase='UNKNOWN')),
        ('invalid-minigame-kind', lambda s: s.update(minigame={
            'kind': 'UNKNOWN', 'claimId': 'BERLIN-1', 'companyId': 'H1',
            'stage': 0, 'attempts': 0, 'dial': 50})),
    )
    for name, edit in edits + nested_edits:
        broken = copy.deepcopy(valid)
        edit(broken)
        cases.append((name, broken))
    return cases


def main():
    with tempfile.TemporaryDirectory(prefix='pppoppi-import-input-') as tmp:
        preview = Path(tmp) / 'preview'
        subprocess.run(['node', str(HERE / 'build.cjs'), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check('Offline-Aufbau im leeren Zielordner', (preview / 'index.html').is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def session():
                    context = browser.new_context(viewport={'width': 800, 'height': 600},
                                                  accept_downloads=True, reduced_motion='reduce')
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.add_init_script('window.__pppoppiXss = 0')
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.on('request', lambda req: external.append(req.url)
                            if req.url.startswith(('http://', 'https://')) else None)
                    page.goto((preview / 'index.html').as_uri(), wait_until='load')
                    page.wait_for_function("typeof NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                page.locator('#startGame').click()
                page.locator('[data-ui="newgame"]').click()
                original = state(page)
                check('Regulaerer Spielstand als sichere Ausgangsbasis',
                      original is not None and
                      page.evaluate('NeoEconomy.engine.validate(NeoEconomy.getState())') is True)
                hostile = copy.deepcopy(original)
                hostile['companies'][0]['name'] = 'TEST ' + PAYLOAD + ' ENDE'
                import_file(page, 'fremdname-gueltig.json', hostile, True)
                check('Syntaktisch gueltiger Fremdname bleibt als Text erhalten', state(page) == hostile)
                check('Importiertes Datenmodell bleibt technisch gueltig',
                      page.evaluate('NeoEconomy.engine.validate(NeoEconomy.getState())') is True)

                for scene in SCENES:
                    page.evaluate('(id) => PPNavigation191.open(id)', scene)
                    page.evaluate('() => new Promise(resolve => requestAnimationFrame(resolve))')
                    check(scene + ': kein eingeschleustes HTML-Ereignis',
                          page.evaluate("""() => {
                              const content = document.querySelector('#dialogContent');
                              return !!document.querySelector('#dialog').open &&
                                  !content.querySelector('img[onerror],svg[onload],script') &&
                                  window.__pppoppiXss === 0;
                          }"""))
                page.evaluate("PPNavigation191.open('computer')")
                check('Boesartiger Firmenname im Computer sichtbar, aber nur Text',
                      page.evaluate('(p) => document.querySelector("#dialogContent").textContent.includes(p)',
                                    PAYLOAD))

                invalid = corruptions(hostile)
                for name, broken in invalid:
                    import_file(page, name + '.json', broken, False)
                    check(name + ': Ablehnung atomar ohne Buchungs- oder Namensaenderung',
                          state(page) == hostile and page.evaluate('window.__pppoppiXss') == 0)
                # Die Grenze ist inklusive: genau 5.000.000 Bytes muessen
                # als gueltiges JSON lesbar bleiben; ein Byte mehr muss bereits
                # vor der Auswertung sicher abgewiesen werden.
                encoded = json.dumps(hostile, ensure_ascii=False).encode('utf-8')
                check('Test-Spielstand kleiner als Dateigrenze', len(encoded) < 5_000_000)
                boundary = encoded + b' ' * (5_000_000 - len(encoded))
                check('Dateigroesse exakt 5.000.000 Bytes', len(boundary) == 5_000_000)
                import_file(page, 'grenze-5000000.json', boundary, True)
                check('Gueltige Datei genau an der Grenze bleibt unveraendert',
                      state(page) == hostile)
                import_file(page, 'zu-gross-5000001.json', boundary + b' ', False)
                check('Uebergrosse, sonst gueltige JSON-Datei atomar abgewiesen',
                      state(page) == hostile and page.evaluate('window.__pppoppiXss') == 0)
                check('Export nach allen Ablehnungen exakt unveraendert', export_state(page) == hostile)
                context.close()

                context, page = session()
                check('Frischer Browser ohne stillen Fremd-Spielstand', state(page) is None)
                import_file(page, 'gueltige-sicherung.json', hostile, True)
                page.evaluate("PPNavigation191.open('computer')")
                check('Explizite Wiederherstellung bleibt text-sicher',
                      state(page) == hostile and page.evaluate('window.__pppoppiXss') == 0 and
                      page.locator('#dialogContent img[onerror], #dialogContent svg[onload]').count() == 0)
                check('Keine externen HTTP-Anfragen', not external)
                check('Keine JavaScript-Laufzeitfehler', not errors)
                print('IMPORT-EINGABESICHERHEIT:', json.dumps({
                    'rejected_structural_cases': len(invalid),
                    'nested_invalid_cases': 17,
                    'file_size_boundary_bytes': 5_000_000,
                    'file_size_cases': 2,
                    'html_injection_scenes': len(SCENES),
                    'valid_untrusted_name_roundtrips': 2,
                    'browser_contexts': 2,
                    'source_files_changed': 0,
                    'release_gate': 'BLOCKED',
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == '__main__':
    main()
