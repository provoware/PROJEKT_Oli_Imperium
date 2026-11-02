#!/usr/bin/env python3
"""Echte Tastaturaktionen im dreistufigen Bohr-Minispiel; kein Gesamt-Gate."""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
MODES = (("800x600", 800, 600), ("CSS-200", 400, 300))


def check(label, ok):
    print(("PASS: " if ok else "FAIL: ") + label, flush=True)
    if not ok:
        raise AssertionError(label)


def tab_to(page, selector, max_tabs=180):
    """Tastaturfokus ausschliesslich durch echte Tab-Ereignisse erreichen."""
    item = page.locator(selector)
    if item.count() != 1 or not item.is_visible() or not item.is_enabled():
        return False
    for _ in range(max_tabs + 1):
        if item.evaluate("(el) => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def activate(page, selector, label):
    check(label + ": mit Tab erreichbar", tab_to(page, selector))
    check(label + ": sichtbarer Tastaturfokus",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-keyboard-drill-") as tmp:
        preview = Path(tmp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Gepruefter Aufbau nur im temporaeren Ordner",
              (preview / "index.html").is_file())
        results = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, width, height in MODES:
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        accept_downloads=True, reduced_motion="reduce",
                    )
                    errors, external = [], []
                    try:
                        page = context.new_page()
                        page.set_default_timeout(12000)
                        page.on("pageerror", lambda err: errors.append(str(err)))
                        page.on("request", lambda req: external.append(req.url)
                                if req.url.startswith(("http://", "https://")) else None)
                        page.goto((preview / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof NeoEconomy === 'object'")
                        activate(page, "#startGame", label + ": Spielstart")
                        page.locator("#econMode").wait_for(state="visible")
                        activate(page, '[data-ui="newgame"]', label + ": neue Partie")
                        page.wait_for_function("NeoEconomy.getState() !== null")
                        check(label + ": frische Partie",
                              state(page)["phase"] == "TURN")
                        # Nur die Szenenwahl benutzt die vorhandene Navigations-API;
                        # alle wirtschaftlichen und Minispiel-Aktionen echte Tasten.
                        for action in ("SURVEY", "BUY"):
                            page.evaluate("NeoEconomy.open('claim')")
                            activate(page,
                                     f'[data-econ="{action}"][data-claim="{CLAIM}"]',
                                     label + ": " + action)
                            check(label + ": " + action + " gueltiger Zustand",
                                  page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
                        check(label + ": eigenes Feld",
                              state(page)["claims"][CLAIM]["owner"] == "H1")
                        page.evaluate("NeoEconomy.open('workshop')")
                        activate(page, f'[data-econ="DRILL_SELF_START"][data-claim="{CLAIM}"]',
                                 label + ": Bohr-Minispiel starten")
                        check(label + ": Bohr-Minispiel aktiv",
                              state(page)["minigame"]["kind"] == "DRILL")
                        # SPE-01 aus PR #27: laufendes Minispiel inklusive
                        # Reglerstand durch echte Browser-Datei speichern/laden.
                        # Kein zweites Testprogramm oder Eingriff in den Spielkern.
                        page.evaluate("NeoEconomy.send('MINI_ADJUST', 'BERLIN-1', {delta:10})")
                        before_midgame = state(page)
                        check(label + ": laufender Drehregler auf 60",
                              before_midgame["minigame"]["stage"] == 0
                              and before_midgame["minigame"]["dial"] == 60)
                        activate(page, "#closeBtn", label + ": Minispieldialog zum Speichern schliessen")
                        with page.expect_download() as active_save:
                            activate(page, "#saveGame", label + ": aktives Minispiel exportieren")
                        active_payload = Path(active_save.value.path()).read_bytes()
                        check(label + ": Export enthaelt aktiven Drehreglerzustand",
                              json.loads(active_payload) == before_midgame)
                        page.locator("#loadEconFile").set_input_files({
                            "name": "laufendes-bohrminispiel.json",
                            "mimeType": "application/json",
                            "buffer": active_payload,
                        })
                        page.wait_for_function(
                            "document.querySelector('#toast')?.textContent?.includes('Spielstand geprüft und übernommen')"
                        )
                        check(label + ": Aktives Minispiel nach Dateiimport unveraendert",
                              state(page) == before_midgame
                              and page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
                        page.evaluate("NeoEconomy.open('workshop')")
                        stages = []
                        for stage in range(3):
                            current = state(page)
                            check(label + f": Bohrabschnitt {stage + 1} sichtbar",
                                  current["minigame"] is not None
                                  and current["minigame"]["stage"] == stage)
                            target = page.evaluate(
                                "NeoEconomy.engine.target(NeoEconomy.getState(), NeoEconomy.getState().minigame)"
                            )
                            check(label + ": gueltiger Druckzielwert",
                                  isinstance(target, int) and 0 <= target <= 100)
                            check(label + ": Schieberegler per Tab erreichbar",
                                  tab_to(page, "#skillPressure"))
                            page.keyboard.press("Home")
                            check(label + ": Home stellt Regler auf null",
                                  page.locator("#skillPressure").input_value() == "0")
                            for _ in range(target):
                                page.keyboard.press("ArrowRight")
                            check(label + f": Druck {target} nur per Pfeiltasten",
                                  page.locator("#skillPressure").input_value() == str(target))
                            activate(page, '[data-arcade="drill-check"]',
                                     label + f": Abschnitt {stage + 1} bestaetigen")
                            after = state(page)
                            check(label + ": Spielkern validiert Minispiel-Aktion",
                                  page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
                            if stage < 2:
                                check(label + ": naechster Abschnitt",
                                      after["minigame"] is not None
                                      and after["minigame"]["stage"] == stage + 1)
                            else:
                                check(label + ": Minispiel regulaer beendet",
                                      after["minigame"] is None
                                      and after["claims"][CLAIM]["drilled"])
                            stages.append(target)
                        before_export = state(page)
                        activate(page, "#closeBtn", label + ": Dialog schliessen")
                        with page.expect_download() as download_info:
                            activate(page, "#saveGame", label + ": Spielstand exportieren")
                        exported = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
                        check(label + ": Tastatur-Export entspricht Spielstand",
                              exported == before_export)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen Anfragen", not external)
                        results.append({"viewport": [width, height], "stages": 3,
                                        "pressure_targets": stages,
                                        "export_equal": True, "native_zoom": "NOT_TESTED"})
                        print("DRILL-KEYBOARD:", json.dumps(results[-1], ensure_ascii=False), flush=True)
                    finally:
                        context.close()
            finally:
                browser.close()
        print("ERGEBNIS:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Nur Bohr-Minispiel; Rohrnetz/Feuerwehr, alle anderen "
              "Dialogaktionen und nativer Browserzoom bleiben BLOCKED.", flush=True)


if __name__ == "__main__":
    main()
