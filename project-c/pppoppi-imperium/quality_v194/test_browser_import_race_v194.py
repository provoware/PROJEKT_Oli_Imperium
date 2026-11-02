#!/usr/bin/env python3
"""Reproduzierbarer Import-Wettlauf im isolierten Offline-Browser.

File.text() wird nur im fluechtigen Testbrowser angehalten. Kein echter
Stromausfall und keine Manipulation der gespeicherten Wirtschaftsdaten.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import action, export_state, state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def submit(page, name, snapshot):
    page.locator("#loadEconFile").set_input_files({
        "name": name,
        "mimeType": "application/json",
        "buffer": json.dumps(snapshot, ensure_ascii=False).encode("utf-8"),
    })


def queue_slow(page, snapshot):
    before = page.evaluate("window.__importRace.queued.length")
    submit(page, "slow-valid.json", snapshot)
    page.wait_for_function(
        "(expected) => window.__importRace.queued.length > expected",
        arg=before,
    )


def release_slow(page):
    page.evaluate("() => window.__importRace.release()")


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-import-race-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Sicherer isolierter Offline-Aufbau", (preview / "index.html").is_file())
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
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof window.NeoEconomy === 'object'")
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                older = export_state(page)
                action(page, "claim", "SURVEY", "BERLIN-1")
                newer = export_state(page)
                check("Zwei echte, unterschiedliche gueltige Spielstaende",
                      older != newer and older["month"] == newer["month"]
                      and newer["companies"][0]["cashCent"] <
                      older["companies"][0]["cashCent"])

                # Instrumentiert ausschliesslich das Lesen einer Testdatei:
                # eine alte Auswahl bleibt in der Warteschlange, waehrend
                # eine zweite Auswahl bereits vollstaendig gelesen wird.
                page.evaluate("""() => {
                    const nativeText = File.prototype.text;
                    window.__importRace = {
                        queued: [],
                        async release() {
                            const job = this.queued.shift();
                            if (!job) throw Error('Kein angehaltener Import');
                            await job();
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    };
                    File.prototype.text = function() {
                        if (!this.name.startsWith('slow-'))
                            return nativeText.call(this);
                        const file = this;
                        return new Promise((resolve, reject) => {
                            window.__importRace.queued.push(async () => {
                                try { resolve(await nativeText.call(file)); }
                                catch (error) { reject(error); }
                            });
                        });
                    };
                }""")

                queue_slow(page, older)
                import_file(page, "fast-newer.json", newer, True)
                release_slow(page)
                check("Spaeter ausgewaehlter gueltiger Import gewinnt",
                      state(page) == newer)

                queue_slow(page, older)
                import_file(page, "broken.json", b'{"schema":', False)
                release_slow(page)
                check("Abgewiesener letzter Import aktiviert keinen alten",
                      state(page) == newer)

                queue_slow(page, older)
                bought = action(page, "claim", "BUY", "BERLIN-1")
                release_slow(page)
                check("Spielaktion verhindert verspaetetes Ueberschreiben",
                      state(page) == bought and bought != newer)

                queue_slow(page, bought)
                page.evaluate("NeoEconomy.open('startup')")
                page.locator('[data-ui="newgame"]').click()
                fresh = state(page)
                release_slow(page)
                check("Neue Partie bleibt vor altem Import geschuetzt",
                      state(page) == fresh and fresh == older)

                # Das Schliessen der Sitzung waehrend eines noch nicht
                # abgeschlossenen Dateilesens ist keine Stromausfallprobe.
                queue_slow(page, newer)
                context.close()
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce",
                )
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof window.NeoEconomy === 'object'")
                check("Neue Sitzung ohne halbfertigen Import", state(page) is None)
                import_file(page, "last-valid-backup.json", newer, True)
                check("Explizite Sicherung nach Abbruch vollstaendig ladbar",
                      state(page) == newer)
                check("Spielstand validierbar",
                      page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("IMPORT-WETTLAUF:", json.dumps({
                    "overlap_cases": 4,
                    "cancelled_read_on_close": 1,
                    "explicit_backup_restore": 1,
                    "power_failure_tested": False,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
