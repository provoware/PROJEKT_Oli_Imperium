#!/usr/bin/env python3
"""Bohr-Minispiel mitten in einer 12-Monats-Kampagne ueber Prozessneustarts.

Echte Browser- und Tastaturaktionen, versionierter Sitzungs-Rundlauf und
Abschlussarchiv. Nur technische PPPOPPI-Adaption, keine C64-Originaltreue.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_keyboard_drill_v194 import activate, check, state, tab_to
from test_browser_campaign_lastmonth_rescue_v194 import finish_four_human_turns

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
SCHEMA = "pppoppi.endstate.session.proposal/1"


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-campaign-drill-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 Originaldateien im getrennten Aufbau verifiziert",
              info["sourceFiles"] == 110)
        errors, external = [], []
        processes = 0
        with sync_playwright() as playwright:
            browser = None

            def start():
                nonlocal browser, processes
                browser = playwright.chromium.launch(headless=True)
                processes += 1
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Neuer Prozess ohne fremden In-Memory-Spielstand",
                      state(page) is None)
                return page

            def stop():
                nonlocal browser
                if browser is not None:
                    browser.close()
                    browser = None

            def export(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                target = root / filename
                download.value.save_as(target)
                payload = json.loads(target.read_text(encoding="utf-8"))
                check("Sitzungsdatei hat den 12-Monats-Vertrag",
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == 12)
                return target, payload

            try:
                page = start()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                check("Vier Menschen und befristete Kampagne",
                      len(state(page)["companies"]) == 4
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)

                for command in ("SURVEY", "BUY"):
                    page.evaluate("NeoEconomy.open('claim')")
                    activate(page, f'[data-econ="{command}"][data-claim="{CLAIM}"]',
                             "Feldaktion " + command)
                page.evaluate("NeoEconomy.open('workshop')")
                activate(page, f'[data-econ="DRILL_SELF_START"][data-claim="{CLAIM}"]',
                         "Bohr-Minispiel starten")
                interrupted = state(page)
                check("Bohrspiel vor dem ersten Abschnitt aktiv",
                      interrupted["month"] == 1
                      and interrupted["minigame"]["kind"] == "DRILL"
                      and interrupted["minigame"]["stage"] == 0
                      and interrupted["claims"][CLAIM]["owner"] == "H1")
                saved, payload = export(page, "bohrung-unterbrochen.json")
                check("Versionierter Export erhaelt aktives Minispiel exakt",
                      payload["state"] == interrupted
                      and payload["archive"] is None)
                stop()

                page = start()
                page.locator("#loadSessionFile").set_input_files(str(saved))
                page.wait_for_function(
                    "NeoEconomy.getState()?.minigame?.kind === 'DRILL'")
                check("Minispiel nach echtem Browserneustart unveraendert",
                      state(page) == interrupted
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")
                page.evaluate("NeoEconomy.open('workshop')")
                targets = []
                for stage in range(3):
                    current = state(page)
                    check("Bohrabschnitt %d korrekt wiederaufgenommen" % (stage + 1),
                          current["minigame"] is not None
                          and current["minigame"]["stage"] == stage)
                    target = page.evaluate(
                        "NeoEconomy.engine.target(NeoEconomy.getState(),"
                        " NeoEconomy.getState().minigame)")
                    check("Gueltiger Druckzielwert", isinstance(target, int)
                          and 0 <= target <= 100)
                    check("Druckregler ueber Tab erreichbar",
                          tab_to(page, "#skillPressure"))
                    page.keyboard.press("Home")
                    for _ in range(target):
                        page.keyboard.press("ArrowRight")
                    check("Druck ausschliesslich ueber Tastatur eingestellt",
                          page.locator("#skillPressure").input_value() == str(target))
                    activate(page, '[data-arcade="drill-check"]',
                             "Bohrabschnitt %d bestaetigen" % (stage + 1))
                    check("Spielkern nach Bohrabschnitt gueltig",
                          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())")
                          is True)
                    targets.append(target)
                drilled = state(page)
                check("Bohrspiel abgeschlossen ohne doppelte Startkosten",
                      drilled["minigame"] is None
                      and drilled["claims"][CLAIM]["drilled"]
                      and drilled["companies"][0]["daysUsed"]
                      == interrupted["companies"][0]["daysUsed"])
                check("Kampagnenvertrag nach Minispiel weiter aktiv",
                      page.evaluate("NeoEconomy.endstate.status()") == "active")

                for month in range(1, 13):
                    check("Kampagnenmonat %d vor Abrechnung" % month,
                          state(page)["month"] == month)
                    after = finish_four_human_turns(page)
                    check("Monat %d exakt einmal abgerechnet" % month,
                          len(after["reports"]) == month)
                    if month < 12:
                        check("Vor Monat 12 kein Abschlussarchiv",
                              page.evaluate("NeoEconomy.endstate.status()") == "active")
                        page.locator('[data-econ="NEXT_MONTH"]').click()
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Zwölf Monate, Bohrfeld und Endwertung archiviert",
                      final["month"] == 12
                      and len(final["reports"]) == 12
                      and final["claims"][CLAIM]["drilled"]
                      and archive["endMonth"] == 12
                      and archive["snapshot"] == final
                      and len(archive["ranking"]) == 4)
                archived, archive_payload = export(page, "kampagne-archiv.json")
                check("Abschlussdatei enthaelt nur Archiv",
                      archive_payload["state"] is None
                      and archive_payload["archive"] == archive)
                stop()

                page = start()
                page.locator("#loadSessionFile").set_input_files(str(archived))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach drittem Prozess unveraendert",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Archivierung keine weitere Buchung",
                      state(page) == final)
                check("Drei echte Chromium-Prozesse", processes == 3)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Offline ohne HTTP/HTTPS", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("KAMPAGNEN-BOHRSPIEL:", json.dumps({
                    "months": 12, "reports": 12, "drill_stages": 3,
                    "pressure_targets": targets, "chromium_processes": processes,
                    "session_exports": 2, "historical_c64_verified": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop()


if __name__ == "__main__":
    main()
