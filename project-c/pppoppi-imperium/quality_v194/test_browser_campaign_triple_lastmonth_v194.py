#!/usr/bin/env python3
"""Drei natuerliche Schlussmonatsinsolvenzen: Verkauf, Kredit, Neustart.

Vier Menschen, 12 echte Monatsabschluesse, 24 echte Wirtschaftsklicks,
drei versionierte Zwischenstaende und vier frische Chromium-Prozesse.
Teilnachweis der fiktiven Adaption, kein C64-Original- oder Release-Gate.
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


def count_ledger(snapshot, index, code):
    return sum(x["code"] == code for x in snapshot["companies"][index]["ledger"])


def reject_session_import(page, filename, payload, message, expected):
    """Ungueltiger Dateiimport darf offene Sanierungen nicht ersetzen."""
    page.evaluate("document.querySelector('#toast').textContent = ''")
    page.locator("#loadSessionFile").set_input_files({
        "name": filename, "mimeType": "application/json", "buffer": payload,
    })
    page.wait_for_function(
        "(text) => document.querySelector('#toast').textContent.includes(text)",
        arg=message,
    )
    check(filename + ": alle drei Sanierungen und Buchungen bleiben erhalten",
          state(page) == expected
          and state(page)["rescueIds"] == ["H1", "H2", "H3"]
          and page.evaluate("NeoEconomy.endstate.status()") == "active"
          and page.evaluate("NeoEconomy.endstate.archive()") is None)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-triple-lastmonth-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 unveraenderte Originalquellen im Aufbau",
              info["sourceFiles"] == 110)
        errors, external = [], []
        process_count = 0

        with sync_playwright() as playwright:
            browser = None

            def start():
                nonlocal browser, process_count
                browser = playwright.chromium.launch(headless=True)
                process_count += 1
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("dialog", lambda dialog: dialog.accept())
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Frischer Chromium-Prozess ohne alten Spielstand",
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
                path = root / filename
                download.value.save_as(path)
                data = json.loads(path.read_text(encoding="utf-8"))
                check("Versionierte Sitzung: " + filename,
                      data["schema"] == SCHEMA
                      and data["contract"]["months"] == 12)
                return path, data

            def resume(path, expected, rescue_ids):
                page = start()
                page.locator("#loadSessionFile").set_input_files(str(path))
                page.wait_for_function(
                    "(ids) => JSON.stringify(NeoEconomy.getState()?.rescueIds) === JSON.stringify(ids)",
                    arg=rescue_ids)
                check("Unterbrochene Sanierung exakt wiederhergestellt",
                      state(page) == expected
                      and page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)
                return page

            def handoff(page, last=False):
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                if not last:
                    page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
                    page.locator('[data-ui="handoff-ok"]').click()

            try:
                page = start()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                check("Vier Menschen und 12-Monats-Kampagne",
                      [f["id"] for f in state(page)["companies"]] ==
                      ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)

                for month in range(1, 12):
                    check("Regulaerer Spielmonat " + str(month),
                          state(page)["month"] == month)
                    after = finish_four_human_turns(page)
                    check("Bis Monat 11 kein vorzeitiges Spielende",
                          after["phase"] == "REPORT"
                          and page.evaluate("NeoEconomy.endstate.status()") == "active")
                    page.locator('[data-econ="NEXT_MONTH"]').click()

                before = state(page)
                check("Monat 12: alle vier Firmen gleich finanziert",
                      before["month"] == 12 and len(before["reports"]) == 11
                      and all(f["cashCent"] == 19_010_000
                              for f in before["companies"]))

                for index in range(1, 4):
                    for scene, command, claim in LAST_MONTH_ACTIONS:
                        action(page, scene, command, claim.replace("-1", "-" + str(index)))
                    current = state(page)
                    check("H%d: acht reale Aktionen, 70.000 Cent" % index,
                          current["companies"][index - 1]["cashCent"] == 70_000
                          and current["companies"][index - 1]["daysUsed"] == 15
                          and current["claims"]["BERLIN-" + str(index)]["owner"]
                          == "H" + str(index))
                    handoff(page)
                    check("Nach H%d noch keine Monatsabrechnung" % index,
                          len(state(page)["reports"]) == 11
                          and state(page)["turnIndex"] == index)
                handoff(page, last=True)
                page.wait_for_function("NeoEconomy.getState()?.phase==='RESCUE'")
                insolvent = state(page)
                check("Drei unabhaengige natuerliche Insolvenzen",
                      insolvent["rescueIds"] == ["H1", "H2", "H3"]
                      and len(insolvent["reports"]) == 12
                      and all(pending(page, i) == 70_000 for i in range(3)))
                check("Kein Archiv vor der letzten Sanierung",
                      page.evaluate("NeoEconomy.endstate.status()") == "active"
                      and page.evaluate("NeoEconomy.endstate.archive()") is None)

                # Fehlende/abgebrochene und widerspruechliche Sitzungsdateien
                # ueber den echten Dateieingang pruefen, solange drei
                # Insolvenzen gleichzeitig offen sind.
                session = json.loads(page.evaluate(
                    "NeoEconomy.endstate.exportSession()"))
                check("Gueltiger Ausgangsstand mit drei offenen Rettungen",
                      session["schema"] == SCHEMA
                      and session["state"] == insolvent
                      and session["archive"] is None)
                reject_session_import(
                    page, "abgebrochener-export.json", b'{"schema":',
                    "Sitzungsimport abgelehnt", insolvent)
                forged = {**session, "archive": {"forged": True}}
                reject_session_import(
                    page, "widerspruechliche-sitzung.json",
                    json.dumps(forged).encode("utf-8"),
                    "Sitzungsimport abgelehnt", insolvent)
                reject_session_import(
                    page, "uebergrosse-sitzung.json", b" " * 5_000_001,
                    "Sitzungsdatei zu gross", insolvent)
                check("Wirtschaftskern nach drei Importfehlern gueltig",
                      page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())")
                      is True)

                # Ein noch lesender, aelterer Import darf einen inzwischen
                # ausgefuehrten echten Rettungsklick nicht zurueckrollen.
                serialized = json.dumps(session, ensure_ascii=False)
                page.evaluate("""() => {
                    const nativeText = File.prototype.text;
                    window.__delayedSessionReads = [];
                    File.prototype.text = function() {
                        if (this.name !== 'verzoegerte-sitzung.json')
                            return nativeText.call(this);
                        return new Promise(resolve =>
                            window.__delayedSessionReads.push(resolve));
                    };
                }""")
                page.locator("#loadSessionFile").set_input_files({
                    "name": "verzoegerte-sitzung.json",
                    "mimeType": "application/json",
                    "buffer": serialized.encode("utf-8"),
                })
                page.wait_for_function("window.__delayedSessionReads.length === 1")
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_SALE"]').click()
                sold = state(page)
                page.evaluate("""async (text) => {
                    window.__delayedSessionReads.shift()(text);
                    await new Promise(resolve => setTimeout(resolve, 0));
                }""", serialized)
                check("Spaeter Import darf H1-Notverkauf nicht rueckgaengig machen",
                      state(page) == sold
                      and sold["rescueIds"] == ["H2", "H3"]
                      and count_ledger(sold, 0, "NOTVERKAUF") == 1)
                check("H1-Notverkauf laesst H2 und H3 unberuehrt",
                      sold["phase"] == "RESCUE"
                      and sold["rescueIds"] == ["H2", "H3"]
                      and pending(page, 0) == 0
                      and pending(page, 1) == 70_000
                      and pending(page, 2) == 70_000
                      and sold["claims"]["BERLIN-1"]["owner"] is None
                      and sold["claims"]["NORD-1"]["owner"] == "H1"
                      and count_ledger(sold, 0, "NOTVERKAUF") == 1
                      and sold["companies"][0]["generation"] == 1)
                file1, payload1 = export(page, "nach-notverkauf.json")
                check("Erster Zwischenstand ohne Abschlussarchiv",
                      payload1["state"] == sold and payload1["archive"] is None)
                stop()

                page = resume(file1, sold, ["H2", "H3"])
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                credited = state(page)
                check("H2-Kredit laesst H3 offen und H1-Verkauf bestehen",
                      credited["phase"] == "RESCUE"
                      and credited["rescueIds"] == ["H3"]
                      and pending(page, 1) == 0
                      and pending(page, 2) == 70_000
                      and credited["companies"][1]["debtCent"] == 4_000_000
                      and count_ledger(credited, 1, "RETTUNGSKREDIT") == 1
                      and count_ledger(credited, 0, "NOTVERKAUF") == 1
                      and len(credited["reports"]) == 12)
                file2, payload2 = export(page, "nach-kredit.json")
                check("Zweiter Zwischenstand ohne Abschlussarchiv",
                      payload2["state"] == credited and payload2["archive"] is None)
                stop()

                page = resume(file2, credited, ["H3"])
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("H3-Neustart schliesst erst jetzt Kampagne ab",
                      final["phase"] == "REPORT"
                      and final["rescueIds"] == []
                      and final["month"] == 12
                      and len(final["reports"]) == 12
                      and final["companies"][2]["generation"] == 2
                      and final["companies"][2]["stats"]["rescues"] == 1
                      and final["claims"]["BERLIN-3"]["owner"] is None
                      and final["claims"]["NORD-3"]["owner"] is None
                      and archive["endMonth"] == 12
                      and archive["snapshot"] == final)
                check("Jeder Rettungsweg genau einmal, ohne Fremdbuchung",
                      count_ledger(final, 0, "NOTVERKAUF") == 1
                      and count_ledger(final, 1, "RETTUNGSKREDIT") == 1
                      and sum(e["type"] == "SANIERUNGSNEUSTART"
                              and e.get("company") == "H3"
                              for e in final["events"]) == 1
                      and final["companies"][3]["generation"] == 1)
                frozen = json.dumps(final, sort_keys=True)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Endarchiv keine weitere Monatsbuchung",
                      json.dumps(state(page), sort_keys=True) == frozen)
                file3, payload3 = export(page, "abschlussarchiv.json")
                check("Archivexport enthaelt keine aktive Sitzung",
                      payload3["state"] is None and payload3["archive"] == archive)
                stop()

                page = start()
                page.locator("#loadSessionFile").set_input_files(str(file3))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach viertem Prozess unveraendert",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                check("Vier echte Chromium-Prozesse", process_count == 4)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Kein HTTP/HTTPS-Verkehr", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("DREIFACH-SCHLUSSMONATSINSOLVENZ:", json.dumps({
                    "month": 12, "humans": 4, "real_economic_actions": 24,
                    "natural_insolvencies": 3,
                    "paths": ["H1: Notverkauf", "H2: Kredit", "H3: Neustart"],
                    "chromium_processes": process_count, "session_exports": 3,
                    "rejected_session_imports": 3, "delayed_import_guard": True,
                    "historical_c64_verified": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop()


if __name__ == "__main__":
    main()
