#!/usr/bin/env python3
"""Echte 12-Monats-Kampagne im Offline-Chromium mit Prozessneustarts.

Teilnachweis fuer die eigenstaendige PPPOPPI-Adaption, keine C64-Originaltreue.
Nur ein temporaerer, hashgepruefter Technikaufbau wird gestartet.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SESSION_SCHEMA = "pppoppi.endstate.session.proposal/1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-campaign-e2e-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 unveraenderte, manifestgepruefte Originaldateien",
              info["sourceFiles"] == 110)
        url = (preview / "index.html").as_uri()
        errors, external = [], []
        restarts = 0

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = None
            try:
                def new_page():
                    nonlocal context
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True, reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: external.append(request.url)
                            if request.url.startswith(("http://", "https://")) else None)
                    page.goto(url, wait_until="load")
                    page.wait_for_function(
                        "window.NeoEconomy && window.NeoEconomy.endstate")
                    check("Neuer Browser ohne uebernommene Sitzung",
                          page.evaluate("NeoEconomy.getState()") is None)
                    return page

                page = new_page()
                page.locator("#startGame").click()
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                check("Kampagne mit zwoelf Monaten aktiv",
                      page.evaluate("NeoEconomy.endstate.contract().months") == 12
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")

                for month in range(1, 13):
                    before = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d: aktive Partie" % month,
                          before["month"] == month
                          and before["phase"] == "TURN"
                          and page.evaluate("NeoEconomy.endstate.status()") == "active")
                    page.evaluate("NeoEconomy.open('calendar')")
                    page.locator('[data-econ="END_TURN"]').click()
                    page.wait_for_function(
                        "(m) => NeoEconomy.getState()?.month === m && "
                        "(NeoEconomy.getState()?.phase === 'REPORT' || "
                        "NeoEconomy.endstate.status() === 'finished')", arg=month)
                    report = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d: Monatsbericht ohne Doppelbuchung" % month,
                          len(report["reports"]) == month)
                    if month == 12:
                        break
                    check("Monat %d: noch kein Kampagnenende" % month,
                          page.evaluate("NeoEconomy.endstate.status()") == "active")
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                    page.wait_for_function(
                        "(m) => NeoEconomy.getState()?.month === m && "
                        "NeoEconomy.getState()?.phase === 'TURN'", arg=month + 1)

                    if month == 6:
                        checkpoint = page.evaluate("NeoEconomy.getState()")
                        page.evaluate("NeoEconomy.open('computer')")
                        with page.expect_download() as pending:
                            page.locator(
                                '#dialogContent [data-ui="session-export"]').click()
                        saved = root / "kampagne-monat-7.json"
                        pending.value.save_as(saved)
                        payload = json.loads(saved.read_text(encoding="utf-8"))
                        check("Zwischenstand enthaelt Zustand und 12-Monats-Vertrag",
                              payload["schema"] == SESSION_SCHEMA
                              and payload["contract"]["months"] == 12
                              and payload["state"] == checkpoint)
                        context.close()
                        browser.close()
                        restarts += 1
                        browser = playwright.chromium.launch(headless=True)
                        page = new_page()
                        page.locator("#loadSessionFile").set_input_files(str(saved))
                        page.wait_for_function(
                            "NeoEconomy.endstate.status()==='active' && "
                            "NeoEconomy.getState()?.month===7")
                        check("Prozessneustart: Wirtschaft und Vertrag identisch",
                              page.evaluate("NeoEconomy.getState()") == checkpoint
                              and page.evaluate(
                                  "NeoEconomy.endstate.contract().months") == 12)

                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = page.evaluate("NeoEconomy.getState()")
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Abschluss exakt nach Monat 12",
                      final["month"] == 12 and final["phase"] == "REPORT"
                      and len(final["reports"]) == 12
                      and archive["endMonth"] == 12
                      and archive["durationMonths"] == 12
                      and archive["reason"] == "campaign-duration")
                ranking = archive["ranking"]
                check("Wertung, Sieger und Archiv-Snapshot konsistent",
                      len(ranking) == len(final["companies"])
                      and len(ranking) > 0
                      and archive["snapshot"] == final
                      and archive["winnerIds"]
                      == [r["companyId"] for r in ranking if r["rank"] == 1]
                      and all(int(ranking[i]["scoreCent"])
                              >= int(ranking[i + 1]["scoreCent"])
                              for i in range(len(ranking) - 1)))
                check("Abschlussansicht sichtbar und nur lesbar",
                      "NUR LESEN" in page.locator("#dialogContent").inner_text())
                snapshot = page.evaluate("JSON.stringify(NeoEconomy.getState())")
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Weitere Wirtschaftsbuchungen gesperrt",
                      page.evaluate("JSON.stringify(NeoEconomy.getState())")
                      == snapshot)
                with page.expect_download() as pending:
                    page.locator(
                        '#dialogContent [data-ui="session-export"]').click()
                completed = root / "kampagne-abschluss.json"
                pending.value.save_as(completed)
                completed_payload = json.loads(
                    completed.read_text(encoding="utf-8"))
                check("Abschluss exportiert nur Archiv, keinen aktiven Zustand",
                      completed_payload["schema"] == SESSION_SCHEMA
                      and completed_payload["state"] is None
                      and completed_payload["archive"] == archive)

                context.close()
                browser.close()
                restarts += 1
                browser = playwright.chromium.launch(headless=True)
                page = new_page()
                page.locator("#loadSessionFile").set_input_files(str(completed))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach zweitem Prozessneustart identisch",
                      page.evaluate("NeoEconomy.endstate.archive()") == archive
                      and page.evaluate("NeoEconomy.getState()") == final)
                page.evaluate("NeoEconomy.send('END_TURN')")
                check("Wiederhergestelltes Archiv bleibt unveraenderbar",
                      page.evaluate("NeoEconomy.getState()") == final)

                # Manipulierte Siegerwertung muss atomar abgewiesen werden.
                bad = json.loads(completed.read_text(encoding="utf-8"))
                bad["archive"]["ranking"][0]["scoreCent"] = "999999999999"
                bad_file = root / "manipuliertes-archiv.json"
                bad_file.write_text(json.dumps(bad), encoding="utf-8")
                page.on("dialog", lambda dialog: dialog.accept())
                page.locator("#loadSessionFile").set_input_files(str(bad_file))
                page.wait_for_function(
                    "document.querySelector('#toast')?.textContent"
                    ".includes('Sitzungsimport abgelehnt')")
                check("Manipuliertes Archiv abgewiesen, Zustand unveraendert",
                      page.evaluate("NeoEconomy.endstate.archive()") == archive
                      and page.evaluate("NeoEconomy.getState()") == final)
                check("Offline ohne HTTP/HTTPS-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                check("Zwei echte Chromium-Prozessneustarts", restarts == 2)
                print("KAMPAGNEN-ENDE:", json.dumps({
                    "months": 12, "reports": len(final["reports"]),
                    "winner_ids": archive["winnerIds"],
                    "ranked_companies": len(ranking),
                    "process_restarts": restarts,
                    "manipulated_archive_rejected": True,
                    "historical_original_verification": "BLOCKED",
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                if context is not None:
                    context.close()
                browser.close()


if __name__ == "__main__":
    main()
