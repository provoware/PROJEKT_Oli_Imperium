#!/usr/bin/env python3
"""Zwei natuerliche Insolvenzen im letzten Kampagnenmonat, echte UI und Neustarts.

Vier Menschen, keine manipulierten Spielstaende; zwei getrennte Sanierungen
vor genau einer Endwertung. Teilnachweis, keine C64-Originalfreigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_campaign_lastmonth_rescue_v194 import (
    LAST_MONTH_ACTIONS, check, finish_four_human_turns,
)
from test_browser_natural_rescue_v194 import action, state

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"


def pending(page, index):
    return page.evaluate(
        "(i) => NeoEconomy.engine.pending(NeoEconomy.getState().companies[i])",
        index,
    )


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-dual-lastmonth-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 Originaldateien beim Aufbau verifiziert", info["sourceFiles"] == 110)
        errors, external = [], []
        processes = 0

        with sync_playwright() as pw:
            browser = None

            def start():
                nonlocal browser, processes
                browser = pw.chromium.launch(headless=True)
                processes += 1
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Neuer Chromium-Prozess ohne alte Sitzung", state(page) is None)
                return page

            def stop():
                nonlocal browser
                if browser:
                    browser.close()
                    browser = None

            def save(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                target = root / filename
                download.value.save_as(target)
                data = json.loads(target.read_text(encoding="utf-8"))
                check("Versionierte Sitzung "+filename,
                      data["schema"] == SCHEMA and data["contract"]["months"] == 12)
                return target, data

            def end_turn(page, has_handoff):
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                if has_handoff:
                    page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
                    page.locator('[data-ui="handoff-ok"]').click()

            try:
                page = start()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                check("Vier Menschen, Kampagne mit zwoelf Monaten",
                      [f["id"] for f in state(page)["companies"]] ==
                      ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)

                for month in range(1, 12):
                    check("Regulaerer Monat "+str(month),
                          state(page)["month"] == month
                          and state(page)["phase"] == "TURN")
                    after = finish_four_human_turns(page)
                    check("Bis Monat elf keine Insolvenz", after["phase"] == "REPORT")
                    page.locator('[data-econ="NEXT_MONTH"]').click()

                before = state(page)
                check("Zwei gleich finanzierte Firmen vor Schlussmonat",
                      before["month"] == 12 and len(before["reports"]) == 11
                      and all(f["cashCent"] == 19_010_000 for f in before["companies"]))

                for scene, command, claim in LAST_MONTH_ACTIONS:
                    action(page, scene, command, claim)
                check("H1 hat 70.000 Cent vor Monatsabschluss",
                      state(page)["companies"][0]["cashCent"] == 70_000)
                end_turn(page, True)
                check("H2 ist jetzt am Zug, keine Zwischenabrechnung",
                      state(page)["turnIndex"] == 1
                      and len(state(page)["reports"]) == 11)

                for scene, command, claim in LAST_MONTH_ACTIONS:
                    action(page, scene, command, claim.replace("-1", "-2"))
                check("H2 hat unabhaengig 70.000 Cent",
                      state(page)["companies"][1]["cashCent"] == 70_000
                      and state(page)["claims"]["BERLIN-1"]["owner"] == "H1"
                      and state(page)["claims"]["BERLIN-2"]["owner"] == "H2")
                end_turn(page, True)
                end_turn(page, True)
                end_turn(page, False)
                page.wait_for_function("NeoEconomy.getState()?.phase==='RESCUE'")
                insolvent = state(page)
                check("Zwei natuerliche Insolvenzen, genau ein Schlussbericht",
                      insolvent["rescueIds"] == ["H1", "H2"]
                      and len(insolvent["reports"]) == 12
                      and pending(page, 0) == 70_000
                      and pending(page, 1) == 70_000)
                check("Keine vorzeitige Archivierung bei zwei offenen Sanierungen",
                      page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)

                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                partial = state(page)
                check("H1-Kredit erledigt nur erste Sanierung",
                      partial["phase"] == "RESCUE"
                      and partial["rescueIds"] == ["H2"]
                      and pending(page, 0) == 0 and pending(page, 1) == 70_000
                      and partial["companies"][0]["debtCent"] == 4_000_000
                      and len(partial["reports"]) == 12)
                check("Auch nach erster Sanierung noch kein Archiv",
                      page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)
                file1, payload1 = save(page, "zwischen-zwei-sanierungen.json")
                check("Offene H2-Sanierung exportiert",
                      payload1["state"] == partial and payload1["archive"] is None)
                stop()

                page = start()
                page.locator("#loadSessionFile").set_input_files(str(file1))
                page.wait_for_function("NeoEconomy.getState()?.phase==='RESCUE'")
                check("Zwischenstand nach Prozessneustart unveraendert",
                      state(page) == partial and pending(page, 1) == 70_000)
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Zweite Sanierung erzeugt genau eine Abschlusswertung",
                      final["phase"] == "REPORT"
                      and final["rescueIds"] == []
                      and len(final["reports"]) == 12
                      and final["companies"][0]["generation"] == 1
                      and final["companies"][1]["generation"] == 2
                      and final["companies"][1]["stats"]["rescues"] == 1
                      and archive["endMonth"] == 12
                      and archive["snapshot"] == final)
                check("H1-Kredit nur einmal und H2-Neustart nur einmal",
                      len([x for x in final["companies"][0]["ledger"]
                           if x["code"] == "RETTUNGSKREDIT"]) == 1
                      and len([e for e in final["events"]
                               if e["type"] == "SANIERUNGSNEUSTART"
                               and e["company"] == "H2"]) == 1)
                frozen = json.dumps(final, sort_keys=True)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Archivierung kein dreizehnter Monat",
                      json.dumps(state(page), sort_keys=True) == frozen)
                file2, payload2 = save(page, "archiv-zwei-sanierungen.json")
                check("Nur fertiges Archiv exportiert",
                      payload2["state"] is None and payload2["archive"] == archive)
                stop()

                page = start()
                page.locator("#loadSessionFile").set_input_files(str(file2))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach drittem Chromium-Prozess unveraendert",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Drei echte Chromium-Prozesse", processes == 3)
                check("Offline ohne HTTP/HTTPS", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("DOPPELTE-SCHLUSSMONATSINSOLVENZ:", json.dumps({
                    "month": 12, "human_companies": 4, "natural_insolvencies": 2,
                    "rescue_paths": ["H1: Kredit", "H2: Neustart"],
                    "reports": 12, "chromium_processes": processes,
                    "historical_c64_verified": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop()


if __name__ == "__main__":
    main()
