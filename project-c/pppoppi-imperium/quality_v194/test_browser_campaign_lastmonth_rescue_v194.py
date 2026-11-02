#!/usr/bin/env python3
"""Insolvenz exakt im letzten Kampagnenmonat im echten Offline-Chromium.

Vier Menschen ohne KI-Konzessionskonflikte, reale UI-Aktionen, drei frische
Browserprozesse. Kein kuenstlicher Spielstand, kein C64-Originalnachweis.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import action, pending, state

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"
# Die regulären Monatslöhne betragen 90.000 Cent je Firma.
# Nach elf leeren Monaten bleiben H1 19.010.000 Cent. Diese echten
# Aktionen kosten 18.940.000 Cent und lassen 70.000 Cent für
# 140.000 Cent Lohn + Wartung im Abschlussmonat.
LAST_MONTH_ACTIONS = (
    ("claim", "SURVEY", "BERLIN-1"),
    ("claim", "BUY", "BERLIN-1"),
    ("claim", "DRILL", "BERLIN-1"),
    ("claim", "SURVEY", "NORD-1"),
    ("claim", "BUY", "NORD-1"),
    ("claim", "SURVEY", "BRANDENBURG-1"),
    ("security", "SECURITY", "BERLIN-1"),
    ("security", "SECURITY", "BERLIN-1"),
)


def check(label, ok):
    print(("PASS: " if ok else "FAIL: ") + label, flush=True)
    if not ok:
        raise AssertionError(label)


def finish_four_human_turns(page):
    before = state(page)
    check("Monat beginnt bei H1", before["phase"] == "TURN"
          and before["turnIndex"] == 0)
    for index in range(4):
        page.evaluate("NeoEconomy.open('calendar')")
        page.locator('[data-econ="END_TURN"]').click()
        if index < 3:
            page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
            switched = state(page)
            check("H%d uebergibt ohne Zwischenabrechnung" % (index + 1),
                  switched["phase"] == "TURN"
                  and switched["turnIndex"] == index + 1
                  and len(switched["reports"]) == len(before["reports"]))
            page.locator('[data-ui="handoff-ok"]').click()
        else:
            page.wait_for_function(
                "['REPORT','RESCUE'].includes(NeoEconomy.getState()?.phase)")
    after = state(page)
    check("Monat genau einmal abgerechnet",
          after["month"] == before["month"]
          and len(after["reports"]) == len(before["reports"]) + 1
          and after["lastReport"]["month"] == before["month"]
          and page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    return after


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-lastmonth-rescue-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Originaldateien verifiziert", info["sourceFiles"] == 110)
        errors, external = [], []
        process_count = 0

        with sync_playwright() as pw:
            browser = None

            def start_process():
                nonlocal browser, process_count
                browser = pw.chromium.launch(headless=True)
                process_count += 1
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
                check("Frischer Prozess ohne alte Partie", state(page) is None)
                return page

            def stop_process():
                nonlocal browser
                if browser is not None:
                    browser.close()
                    browser = None

            def export_session(page, name):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                path = root / name
                download.value.save_as(path)
                payload = json.loads(path.read_text(encoding="utf-8"))
                check("Versionierter Sitzungsexport", payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == 12)
                return path, payload

            try:
                page = start_process()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                fresh = state(page)
                check("Vier echte Menschen, keine KI, 12-Monats-Vertrag",
                      [f["id"] for f in fresh["companies"]] ==
                      ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)
                for month in range(1, 12):
                    before = state(page)
                    check("Monat %d: ungenutztes H1-Kapital nach Lohn" % month,
                          before["month"] == month
                          and before["companies"][0]["cashCent"]
                          == 20_000_000 - (month - 1) * 90_000)
                    after = finish_four_human_turns(page)
                    check("Monat %d: keine Insolvenz, kein vorzeitiges Ende" % month,
                          after["phase"] == "REPORT"
                          and page.evaluate("NeoEconomy.endstate.status()") == "active")
                    page.locator('[data-econ="NEXT_MONTH"]').click()

                before = state(page)
                check("Schlussmonat 12 mit 19.010.000 Cent und elf Berichten",
                      before["month"] == 12
                      and len(before["reports"]) == 11
                      and before["companies"][0]["cashCent"] == 19_010_000)
                for scene, command, claim in LAST_MONTH_ACTIONS:
                    action(page, scene, command, claim)
                prepared = state(page)
                check("Acht echte Klicks lassen 70.000 Cent und 15 Tage",
                      prepared["companies"][0]["cashCent"] == 70_000
                      and prepared["companies"][0]["daysUsed"] == 15)
                insolvent = finish_four_human_turns(page)
                check("Letzter Monat: echte Insolvenz statt vorzeitigem Archiv",
                      insolvent["phase"] == "RESCUE"
                      and insolvent["rescueIds"] == ["H1"]
                      and pending(page) == 70_000
                      and len(insolvent["reports"]) == 12
                      and page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)
                saved, payload = export_session(page, "sanierung-monat-12.json")
                check("Offene Schlussmonatsanierung bleibt aktive Sitzung",
                      payload["state"] == insolvent and payload["archive"] is None)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(saved))
                page.wait_for_function("NeoEconomy.getState()?.phase==='RESCUE'")
                check("Schlussmonats-Insolvenz nach Neustart unveraendert",
                      state(page) == insolvent
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                ranking = {r["companyId"]: r for r in archive["ranking"]}
                check("Genau ein Abschluss nach Sanierung im letzten Monat",
                      final["month"] == 12
                      and len(final["reports"]) == 12
                      and final["companies"][0]["generation"] == 2
                      and final["companies"][0]["stats"]["rescues"] == 1
                      and archive["endMonth"] == 12
                      and archive["reason"] == "campaign-duration"
                      and archive["snapshot"] == final)
                check("Insolventer H1 verliert gegen unbeschaedigte Firmen",
                      "H1" not in archive["winnerIds"]
                      and ranking["H1"]["rank"] > 1)
                frozen = json.dumps(final, sort_keys=True)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Schlussmonatsanierung keine neue Abrechnung",
                      json.dumps(state(page), sort_keys=True) == frozen)
                archive_file, archive_payload = export_session(
                    page, "schlussmonat-archiv.json")
                check("Archiv ohne aktive Partie", archive_payload["state"] is None
                      and archive_payload["archive"] == archive)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(archive_file))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Abschluss nach zweitem Neustart bytegleich als JSON",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Drei echte Chromium-Prozesse", process_count == 3)
                check("Offline ohne HTTP/HTTPS", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("SCHLUSSMONAT-INSOLVENZ:", json.dumps({
                    "month": 12, "reports": 12, "natural_insolvencies": 1,
                    "rescue_before_finish": True, "generation_h1": 2,
                    "winner_ids": archive["winnerIds"],
                    "chromium_processes": process_count,
                    "historical_c64_verified": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop_process()


if __name__ == "__main__":
    main()
