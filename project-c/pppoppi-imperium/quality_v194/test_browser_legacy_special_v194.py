#!/usr/bin/env python3
"""V0.8 special-state migration: reject unfinished work, preserve all journals.

Runs only against a temporary offline preview and disposable Chromium profile.
The 110 protected source files and historical fixtures are never modified.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)

def export_state(page):
    """Export safely whether an import left the scene open or closed."""
    if page.locator("#closeBtn").is_visible():
        page.locator("#closeBtn").click()
    with page.expect_download() as downloaded:
        page.locator("#saveGame").click()
    return json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-legacy-special-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Isolierter, unveraenderter Quellaufbau", (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce",
                )
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function(
                    "typeof OliV08 === 'object' && typeof NeoEconomy === 'object'"
                )

                scenarios = page.evaluate("""() => {
                    let base = OliV08.fresh({humans: 1, ais: 1,
                                            seed: 'LEGACY-SPECIAL-TEST'});
                    const run = (s, type, n, extra = {}) =>
                        OliV08.transition(s, {
                            type, companyId: 'H1', region: 'BERLIN',
                            requestId: 'special-' + n, ...extra
                        }).state;
                    base = run(base, 'SURVEY', 1);
                    base = run(base, 'BUY', 2);
                    const contract = run(base, 'SIGN', 3);
                    const mini = run(base, 'DRILL_SELF_START', 4);
                    let finished = mini;
                    for (let i = 0; i < 3; i++) {
                        const choice = finished.minigame.pattern[finished.minigame.step];
                        finished = run(finished, 'MINI_STEP', 5 + i, {choice});
                    }
                    for (const s of [base, contract, mini, finished])
                        OliV08.validate(s);
                    return {base, contract, mini, finished};
                }""")
                base = scenarios["base"]
                contract = scenarios["contract"]
                mini = scenarios["mini"]
                finished = scenarios["finished"]
                check("Echter Altvertrag ist offen und gueltig",
                      contract["companies"][0]["contracts"][0]["status"] == "OPEN")
                check("Echtes Altminispiel ist aktiv und gueltig",
                      mini["minigame"] is not None and mini["phase"] == "TURN")
                check("Altminispiel regulaer abgeschlossen",
                      finished["minigame"] is None
                      and finished["companies"][0]["fields"]["BERLIN"]["drilled"])

                import_file(page, "legacy-normal.json", base, True)
                before = state(page)
                check("Gueltiger Ausgangszustand migriert",
                      before["schema"] == "pppoppi.berlin.save/0.8.2")
                for name, payload in [
                    ("legacy-open-contract.json", contract),
                    ("legacy-active-minigame.json", mini),
                ]:
                    import_file(page, name, payload, False)
                    check("Keine stille Uebernahme oder Buchung bei " + name,
                          state(page) == before and export_state(page) == before)

                malformed = copy.deepcopy(mini)
                malformed["minigame"]["step"] = 99
                import_file(page, "legacy-broken-minigame.json", malformed, False)
                check("Defektes Minispiel ohne Datenverlust abgewiesen",
                      state(page) == before and export_state(page) == before)

                import_file(page, "legacy-completed-minigame.json", finished, True)
                migrated = state(page)
                check("Abgeschlossenes Altminispiel migriert",
                      migrated["schema"] == "pppoppi.berlin.save/0.8.2"
                      and migrated["claims"]["BERLIN-1"]["drilled"]
                      and migrated["minigame"] is None)
                check("Alle Buchungen und Kennungen des Minispiels erhalten",
                      migrated["companies"][0]["ledger"]
                      == finished["companies"][0]["ledger"]
                      and migrated["processedIds"] == finished["processedIds"]
                      and migrated["sequence"] == finished["sequence"])
                check("Migrierter Spielstand valide und exportierbar",
                      page.evaluate(
                          "NeoEconomy.engine.validate(NeoEconomy.getState())"
                      ) is True and export_state(page) == migrated)
                import_file(page, "legacy-completed-reimport.json", migrated, True)
                check("Wiederimport ohne doppelte Buchung", state(page) == migrated)
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate(
                          "document.documentElement.scrollWidth <= innerWidth + 2"
                      ))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("ALTSONDERZUSTAND-REGRESSION:", json.dumps({
                    "open_contract": "REJECTED_WITHOUT_CHANGE",
                    "active_minigame": "REJECTED_WITHOUT_CHANGE",
                    "malformed_minigame": "REJECTED_WITHOUT_CHANGE",
                    "completed_minigame": "MIGRATED",
                    "roundtrip": "PASS",
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
