#!/usr/bin/env python3
"""Alle neun Claim-Parameter: Wirtschaftskette und Ablehnungen bei echtem Zoom.

Isolierte, manifestgepruefte Offline-Vorschau. Feldauswahl wird bewusst ueber
das HTML-Auswahlfeld vorbereitet; alle Wirtschaftsaktionen erfolgen mit echter
Tab-/Enter-Tastaturbedienung. Keine Original-C64- oder Release-Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from test_browser_native_zoom_v194 import wait_for_zoom_worker

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, sync_playwright

from test_browser_keyboard_pipe_fire_v194 import check, tab_to
from test_browser_native_zoom_flow_v194 import new_page
from test_browser_native_zoom_v194 import extension_at

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)
# Pro Feld: vier bewusst unzulaessige Aktionen, sechs erfolgreiche Aktionen.
SEQUENCE = (
    ("BUY", False),
    ("SURVEY", True),
    ("SURVEY", False),
    ("BUY", True),
    ("BUY", False),
    ("DRILL", True),
    ("PUMP", True),
    ("SHIP", True),
    ("OFFER", True),
    ("OFFER", False),
)
DAYS = {"SURVEY": 2, "BUY": 1, "DRILL": 5, "PUMP": 4,
        "SHIP": 1, "OFFER": 1}
BOOKINGS = {"SURVEY": "GUTACHTEN", "BUY": "FELDKAUF",
            "DRILL": "FACHBOHRUNG", "PUMP": "FOERDERUNG",
            "SHIP": "TRANSPORT"}


def activate(page, claim, code, label):
    scene = ('warehouse' if code == 'SHIP' else
             'market' if code == 'OFFER' else 'claim')
    page.evaluate("(scene) => NeoEconomy.open(scene)", scene)
    # Nicht bloss auf irgendeinen Button warten: die verlangte Aktionsart
    # muss im gerade geoeffneten Dialog bereits gerendert sein.
    page.wait_for_function("""({code}) => {
        const dialog = document.querySelector('#dialog');
        const select = document.querySelector('#econClaim');
        const buttons = [...document.querySelectorAll(
            '#dialogContent button[data-econ]')];
        return !!(dialog?.open && select &&
            buttons.some(b => b.dataset.econ === code));
    }""", arg={"code": code}, timeout=8000)
    check(label + ": aktive Szene nach Oeffnung korrekt",
          page.evaluate("active") == scene)
    before_selection = page.evaluate("NeoEconomy.getState()")
    page.locator("#econClaim").select_option(claim)
    # Das Change-Ereignis rendert den Dialog erneut. Erst zwei
    # Browser-Zeichenzyklen abwarten, dann das neue Ziel kontrollieren.
    page.evaluate("""() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)))""")
    selector = '#dialogContent button[data-econ="%s"][data-claim="%s"]' % (
        code, claim)
    try:
        page.wait_for_function("""({claim, code}) => {
            const select = document.querySelector('#econClaim');
            const buttons = [...document.querySelectorAll(
                '#dialogContent button[data-econ]')];
            return select?.value === claim &&
                buttons.filter(b => b.dataset.econ === code &&
                                  b.dataset.claim === claim).length === 1;
        }""", arg={"claim": claim, "code": code}, timeout=8000)
    except PlaywrightTimeoutError as exc:
        # Diagnose statt stiller Wiederholung: ein UI-Fehler darf nicht
        # durch erneutes Klicken oder kuenstliche Spielstandkorrektur verschwinden.
        failure = page.evaluate("""() => ({
            activeScene: typeof active === 'string' ? active : null,
            dialogTitle: document.querySelector('#dialogTitle')?.textContent || '',
            contentLength: document.querySelector('#dialogContent')?.textContent.length || 0,
            navigationScene: window.PPNavigation191?.current?.() ?? null,
            selected: document.querySelector('#econClaim')?.value ?? null,
            options: [...(document.querySelector('#econClaim')?.options || [])]
                .map(option => option.value),
            dialogOpen: !!document.querySelector('#dialog')?.open,
            buttons: [...document.querySelectorAll(
                '#dialogContent button[data-econ]')].map(
                    button => [button.dataset.econ, button.dataset.claim || '']),
            phase: window.NeoEconomy?.getState()?.phase ?? null
        })""")
        raise AssertionError(
            label + ": Ziel nach Feldauswahl nicht stabil: " +
            json.dumps(failure, ensure_ascii=False)) from exc
    check(label + ": Feldauswahl ohne Wirtschaftsaktion",
          page.evaluate("NeoEconomy.getState()") == before_selection)
    target = page.locator(selector)
    diagnostic = page.evaluate("""() => ({
        selected: document.querySelector('#econClaim')?.value || null,
        scene: document.querySelector('#dialog')?.open,
        claimButtons: [...document.querySelectorAll(
            '#dialogContent button[data-econ]')].map(
                el => [el.dataset.econ, el.dataset.claim || ''])
    })""")
    check(label + ": korrektes Claim-Ziel " +
          json.dumps(diagnostic, ensure_ascii=False), target.count() == 1)
    page.evaluate("""() => {
        if (!window.__qaParamListener) {
            document.addEventListener('click', event => {
                if (event.isTrusted && event.target.closest(
                    '[data-qa-param-target="yes"]')) window.__qaParamClicks++;
            }, {capture: true});
            window.__qaParamListener = true;
        }
        window.__qaParamClicks = 0;
        document.querySelectorAll('[data-qa-param-target]').forEach(
            el => el.removeAttribute('data-qa-param-target'));
    }""")
    target.evaluate("(el) => el.dataset.qaParamTarget = 'yes'")
    before = page.evaluate("NeoEconomy.getState()")
    check(label + ": per Tab erreichbar", tab_to(page, selector, max_tabs=300))
    check(label + ": sichtbarer Fokus",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")
    check(label + ": genau ein echter Tastaturklick",
          page.evaluate("window.__qaParamClicks") == 1)
    check(label + ": Spielstand gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    after = page.evaluate("NeoEconomy.getState()")
    check(label + ": fremde Claims unveraendert",
          all(before["claims"][other] == after["claims"][other]
              for other in before["claims"] if other != claim))
    return before, after


def verify(before, after, claim, code, success, region, cfg, label):
    if not success:
        check(label + ": Ablehnung ohne jede Zustandsaenderung", after == before)
        return
    check(label + ": Erfolg aendert Spielstand", after != before)
    a, b = before["companies"][0], after["companies"][0]
    check(label + ": Spieltage korrekt",
          b["daysUsed"] == a["daysUsed"] + DAYS[code])
    cost = {"SURVEY": region["survey"], "BUY": region["buy"],
            "DRILL": region["drill"], "PUMP": cfg["pumpCost"],
            "SHIP": cfg["shippingCost"], "OFFER": 0}[code]
    check(label + ": regionaler Preis / Kosten korrekt",
          b["cashCent"] == a["cashCent"] - cost)
    if code in BOOKINGS:
        check(label + ": genau eine richtige Buchung",
              len(b["ledger"]) == len(a["ledger"]) + 1
              and b["ledger"][-1]["code"] == BOOKINGS[code]
              and b["ledger"][-1]["info"] == claim
              and b["ledger"][-1]["deltaCent"] == -cost)
    else:
        check(label + ": keine fingierte Buchung",
              b["ledger"] == a["ledger"])
    old, new = before["claims"][claim], after["claims"][claim]
    if code == "SURVEY":
        check(label + ": Gutachten nur fuer gewaehltes Feld",
              old["surveyedBy"] == [] and new["surveyedBy"] == ["H1"])
    elif code == "BUY":
        check(label + ": Eigentum nur fuer gewaehltes Feld",
              old["owner"] is None and new["owner"] == "H1")
    elif code == "DRILL":
        check(label + ": Feld erschlossen",
              not old["drilled"] and new["drilled"])
    elif code == "PUMP":
        check(label + ": Reserven und Lager exakt gebucht",
              new["reserveMilli"] == old["reserveMilli"] - cfg["pumpMilli"]
              and new["inventoryMilli"] == old["inventoryMilli"] + cfg["pumpMilli"]
              and b["monthProducedMilli"] ==
              a["monthProducedMilli"] + cfg["pumpMilli"])
    elif code == "SHIP":
        check(label + ": verladen ohne Mengenverlust",
              old["inventoryMilli"] == cfg["pumpMilli"]
              and new["inventoryMilli"] == 0
              and new["preparedMilli"] == cfg["pumpMilli"])
    elif code == "OFFER":
        check(label + ": verbindliches Angebot, kein Soforterloes",
              not old["order"] and new["order"]
              and b["monthRevenueCent"] == a["monthRevenueCent"])



def verify_save_roundtrip(context, worker, preview, factor, claim,
                          page, final_state, errors, external, label):
    """Export per Tastatur, neuer Tab, Dateiimport und exakter Zustandsvergleich.

    Nur der Download ist eine Tastaturaktion. Das versteckte Dateifeld wird
    explizit per Playwright gesetzt, nicht als Tastaturtest ausgegeben.
    """
    page.keyboard.press("Escape")
    page.wait_for_function("!document.querySelector('#dialog').open")
    check(label + ": Dialog vor Export per Escape geschlossen",
          not page.locator("#dialog").evaluate("(el) => el.open"))
    check(label + ": Export per Tab erreichbar",
          tab_to(page, "#saveGame", max_tabs=300))
    with page.expect_download() as download_info:
        page.keyboard.press("Enter")
    exported = json.loads(Path(download_info.value.path()).read_text(
        encoding="utf-8"))
    check(label + ": exportierter Spielstand exakt",
          exported == final_state)
    # Die Zoom-Erweiterung adressiert einen Tab per URL: nie zwei
    # gleichnamige Spiel-Tabs gleichzeitig offen lassen.
    page.close()
    restored = new_page(context, preview, worker, factor,
                        errors, external, fresh=False)
    try:
        check(label + ": neuer Tab ohne stillen Altzustand",
              restored.evaluate("NeoEconomy.getState()") is None)
        restored.locator("#loadEconFile").set_input_files({
            "name": "claim-roundtrip.json",
            "mimeType": "application/json",
            "buffer": json.dumps(exported, ensure_ascii=False).encode("utf-8"),
        })
        restored.wait_for_function("NeoEconomy.getState() !== null")
        check(label + ": Import erhaelt alle neun Claims und Buchungen exakt",
              restored.evaluate("NeoEconomy.getState()") == final_state)
        check(label + ": importierter Zustand gueltig",
              restored.evaluate(
                  "NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    finally:
        restored.close()


def run_claim(context, worker, preview, factor, claim, region, cfg):
    label = str(round(factor * 100)) + "%/" + claim
    errors, external = [], []
    page = new_page(context, preview, worker, factor, errors, external)
    try:
        start = page.evaluate("NeoEconomy.getState()")
        check(label + ": frische Partie", start["phase"] == "TURN"
              and all(c["owner"] is None for c in start["claims"].values()))
        successes = rejections = 0
        for code, success in SEQUENCE:
            step = label + "/" + code + "/" + str(successes + rejections + 1)
            before, after = activate(page, claim, code, step)
            verify(before, after, claim, code, success, region, cfg, step)
            if success:
                successes += 1
            else:
                rejections += 1
        check(label + ": sechs Erfolge und vier Ablehnungen",
              successes == 6 and rejections == 4)
        final_state = page.evaluate("NeoEconomy.getState()")
        verify_save_roundtrip(context, worker, preview, factor, claim,
                              page, final_state, errors, external, label)
        check(label + ": keine JavaScript-Laufzeitfehler", not errors)
        check(label + ": keine externen HTTP-Anfragen", not external)
        return {"claim": claim, "region": region["id"], "zoom_percent":
                round(factor * 100), "successful": successes,
                "rejected": rejections, "save_roundtrip": True,
                "release_gate": "BLOCKED"}
    finally:
        if not page.is_closed():
            page.close()


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-claim-parameters-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Vorschau gebaut",
              (preview / "index.html").is_file())
        extension_at(root / "extension")
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width": 800, "height": 600}, accept_downloads=True,
                reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(root / "extension"),
                      "--load-extension=" + str(root / "extension")])
            try:
                worker = wait_for_zoom_worker(context)
                check("Echte Chromium-Zoom-Erweiterung geladen",
                      worker.url.startswith("chrome-extension://"))
                probe_errors, probe_external = [], []
                probe = new_page(context, preview, worker, 1.75,
                                 probe_errors, probe_external)
                try:
                    initial = probe.evaluate("NeoEconomy.getState()")
                    regions = probe.evaluate("NeoEconomy.engine.REGIONS")
                    cfg = probe.evaluate("NeoEconomy.engine.CFG")
                    claims = sorted(initial["claims"])
                    check("Neun eindeutige Claims in drei Regionen",
                          len(claims) == 9 and len(regions) == 3
                          and len(set(claims)) == 9
                          and set(c["region"] for c in initial["claims"].values())
                          == set(r["id"] for r in regions))
                    check("Probe ohne Fehler / Netzwerkanfragen",
                          not probe_errors and not probe_external)
                finally:
                    probe.close()
                results = []
                for factor in ZOOMS:
                    for claim in claims:
                        region_id = claim.rsplit("-", 1)[0]
                        region = next(r for r in regions if r["id"] == region_id)
                        results.append(run_claim(context, worker, preview,
                                                 factor, claim, region, cfg))
                check("Alle 18 Claim/Zoom-Kombinationen",
                      len(results) == 18 and
                      set(x["zoom_percent"] for x in results) == {175, 200})
                check("108 echte Erfolge und 72 echte Ablehnungen",
                      sum(x["successful"] for x in results) == 108 and
                      sum(x["rejected"] for x in results) == 72)
                check("18 echte Export-/Import-Rundlaeufe",
                      sum(x["save_roundtrip"] for x in results) == 18)
                print("CLAIM-PARAMETER-MATRIX:",
                      json.dumps({"cases": results, "total_actions": 180,
                                  "successes": 108, "rejections": 72,
                                  "save_roundtrips": 18,
                                  "release_gate": "BLOCKED"},
                                 ensure_ascii=False), flush=True)
                print("GRENZE: Regionale Preise aus dem vorhandenen Kern, "
                      "keine externe Fachfreigabe. Feldwahl ueber HTML-Select; "
                      "Aktionen per Tab/Enter. Weitere dynamische Zustaende, "
                      "vollstaendige Endpartien und Vorrelease bleiben BLOCKED.",
                      flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
