#!/usr/bin/env python3
"""Echte Verlust-Kampagne: Insolvenz, Sanierung, Endwertung und Archiv.

Die Wirtschaftsaktionen erfolgen ausschliesslich ueber sichtbare Schalter.
Zwei menschliche und zwei Computerfirmen, 800x600, drei Chromium-Prozesse.
Teilnachweis der PPPOPPI-Adaption; KEIN C64-Originalvergleich/Release-PASS.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import ACTIONS, action, pending, state
from test_browser_multigeneration_rescue_v194 import finish_two_human_turns

HERE = Path(__file__).resolve().parent
SESSION_SCHEMA = "pppoppi.endstate.session.proposal/1"


def check(label, ok):
    print(("PASS: " if ok else "FAIL: ") + label, flush=True)
    if not ok:
        raise AssertionError(label)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-loss-endgame-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Quelldateien im isolierten Aufbau",
              build["sourceFiles"] == 110)
        errors, external = [], []
        starts = 0

        with sync_playwright() as pw:
            browser = None
            context = None

            def new_process():
                nonlocal browser, context, starts
                browser = pw.chromium.launch(headless=True)
                starts += 1
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
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Neuer Chromium-Prozess ohne uebernommene Partie",
                      state(page) is None)
                return page

            def stop_process():
                nonlocal browser, context
                if context is not None:
                    context.close()
                    context = None
                if browser is not None:
                    browser.close()
                    browser = None

            def export_session(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                saved = root / filename
                download.value.save_as(saved)
                payload = json.loads(saved.read_text(encoding="utf-8"))
                check("Versionierter Export " + filename,
                      payload["schema"] == SESSION_SCHEMA
                      and payload["contract"]["months"] == 12)
                return saved, payload

            try:
                page = new_process()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("2-2")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                fresh = state(page)
                check("Vier Firmen, zwei Menschen, Kampagne 12 Monate",
                      [c["id"] for c in fresh["companies"]] ==
                      ["H1", "H2", "A1", "A2"]
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")
                check("Beide menschlichen Firmen starten mit gleichem Kapital",
                      fresh["companies"][0]["cashCent"] ==
                      fresh["companies"][1]["cashCent"] == 20_000_000)

                # Keine kuenstliche Insolvenz: acht echte Wirtschafts-Klicks.
                for scene, command, claim in ACTIONS:
                    action(page, scene, command, claim)
                prepared = state(page)
                check("H1 durch acht Wirtschaftsaktionen auf 60.000 Cent",
                      prepared["companies"][0]["cashCent"] == 60_000
                      and prepared["companies"][0]["daysUsed"] == 15)
                insolvent = finish_two_human_turns(page)
                check("Natuerliche H1-Insolvenz mit 80.000 Cent Rueckstand",
                      insolvent["phase"] == "RESCUE"
                      and insolvent["rescueIds"] == ["H1"]
                      and pending(page) == 80_000
                      and len(insolvent["reports"]) == 1)
                check("Insolvenz beendet Kampagne nicht voreilig",
                      page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)

                rescue_file, rescue_payload = export_session(
                    page, "offene-sanierung.json")
                check("Offene Sanierung statt Archiv gespeichert",
                      rescue_payload["state"] == insolvent
                      and rescue_payload["archive"] is None)
                stop_process()

                # Erste Wiederherstellung mitten in der Insolvenz.
                page = new_process()
                page.locator("#loadSessionFile").set_input_files(str(rescue_file))
                page.wait_for_function(
                    "NeoEconomy.getState()?.phase==='RESCUE' && "
                    "NeoEconomy.endstate.status()==='active'")
                check("Sanierung nach Prozessneustart bytegleich als JSON",
                      state(page) == insolvent and pending(page) == 80_000)
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                rescued = state(page)
                check("H1-Generation 2, H2 unveraendert, nur ein Monatsbericht",
                      rescued["phase"] == "REPORT"
                      and rescued["companies"][0]["generation"] == 2
                      and rescued["companies"][1]["generation"] == 1
                      and rescued["companies"][0]["stats"]["rescues"] == 1
                      and len(rescued["reports"]) == 1
                      and pending(page) == 0)
                check("Kampagne laeuft nach Sanierung weiter",
                      page.evaluate("NeoEconomy.endstate.status()") == "active")

                for month in range(2, 13):
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                    before = state(page)
                    check("Monat %d: keine doppelte Abrechnung" % month,
                          before["month"] == month
                          and before["phase"] == "TURN"
                          and len(before["reports"]) == month - 1)
                    after = finish_two_human_turns(page)
                    check("Monat %d: Abschlussbericht gueltig" % month,
                          after["month"] == month
                          and after["phase"] == "REPORT"
                          and len(after["reports"]) == month
                          and after["companies"][0]["generation"] == 2)
                    if month < 12:
                        check("Monat %d: Partie noch aktiv" % month,
                              page.evaluate("NeoEconomy.endstate.status()") == "active")

                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                ranking = {r["companyId"]: r for r in archive["ranking"]}
                check("Endwertung exakt nach 12 Berichten und Sanierung",
                      final["month"] == 12
                      and len(final["reports"]) == 12
                      and final["companies"][0]["generation"] == 2
                      and archive["reason"] == "campaign-duration"
                      and archive["snapshot"] == final)
                check("Verlierer H1 nach echter Insolvenz, H2 vor H1",
                      "H1" not in archive["winnerIds"]
                      and ranking["H1"]["rank"] > 1
                      and int(ranking["H2"]["scoreCent"]) >
                      int(ranking["H1"]["scoreCent"]))
                check("Endansicht schreibgeschuetzt",
                      "NUR LESEN" in page.locator("#dialogContent").inner_text())
                frozen = json.dumps(final, sort_keys=True)
                page.evaluate("NeoEconomy.send('END_TURN')")
                check("Abgeschlossene Verlustpartie nicht mehr veraenderbar",
                      json.dumps(state(page), sort_keys=True) == frozen)
                archive_file, archive_payload = export_session(
                    page, "verlust-archiv.json")
                check("Abschluss nur als Archiv exportiert",
                      archive_payload["state"] is None
                      and archive_payload["archive"] == archive)
                stop_process()

                # Zweite Wiederherstellung nach dem Spielende.
                page = new_process()
                page.locator("#loadSessionFile").set_input_files(str(archive_file))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Verlustwertung und Spielstand nach Neustart identisch",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Auch wiederhergestellte Partie bleibt schreibgeschuetzt",
                      state(page) == final)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Drei echte Chromium-Prozesse", starts == 3)
                check("Keine HTTP-/HTTPS-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("VERLUST-KAMPAGNE:", json.dumps({
                    "months": 12, "reports": len(final["reports"]),
                    "natural_insolvencies_h1": 1,
                    "generation_h1": final["companies"][0]["generation"],
                    "loser_h1": True, "winner_ids": archive["winnerIds"],
                    "chromium_process_starts": starts,
                    "historical_c64_verified": False,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop_process()


if __name__ == "__main__":
    main()
