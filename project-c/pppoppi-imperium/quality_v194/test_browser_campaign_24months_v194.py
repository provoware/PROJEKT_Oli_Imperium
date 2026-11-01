#!/usr/bin/env python3
"""24 echte Spielmonate im Offline-Chromium: 800x600, Tastatur und Prozessneustarts.

Vier menschliche Firmen ohne erfundene Wirtschaftsaktionen oder Spielstand-Eingriffe.
Nur der isolierte, manifestgepruefte Technikaufbau wird verwendet.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"
MONTHS = 24
HUMANS = 4


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def press_button(page, selector):
    button = page.locator(selector)
    check(selector + " ist sichtbar und bedienbar",
          button.count() == 1 and button.is_visible() and button.is_enabled())
    button.focus()
    check(selector + " besitzt Tastaturfokus",
          button.evaluate("(el) => document.activeElement === el"))
    button.press("Enter")


def finish_month(page, month):
    before = state(page)
    check("Monat %d startet bei H1 ohne Zwischenbericht" % month,
          before["month"] == month and before["phase"] == "TURN"
          and before["turnIndex"] == 0 and len(before["reports"]) == month - 1)
    for index in range(HUMANS):
        page.evaluate("NeoEconomy.open('calendar')")
        press_button(page, '[data-econ="END_TURN"]')
        if index < HUMANS - 1:
            handoff = page.locator('[data-ui="handoff-ok"]')
            handoff.wait_for(state="visible")
            switched = state(page)
            check("Monat %d: H%d an H%d ohne doppelte Abrechnung" %
                  (month, index + 1, index + 2),
                  switched["phase"] == "TURN"
                  and switched["turnIndex"] == index + 1
                  and len(switched["reports"]) == month - 1)
            press_button(page, '[data-ui="handoff-ok"]')
        else:
            page.wait_for_function(
                "['REPORT','RESCUE'].includes(NeoEconomy.getState()?.phase)")
    report = state(page)
    check("Monat %d: genau ein gueltiger Monatsabschluss" % month,
          report["phase"] == "REPORT" and report["month"] == month
          and len(report["reports"]) == month
          and report["lastReport"]["month"] == month
          and page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())")
          is True)
    return report


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-campaign-24-browser-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Quelldateien geprueft",
              build["sourceFiles"] == 110)
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
                check("Frischer Chromium-Prozess ohne fremde Sitzung",
                      state(page) is None)
                return page

            def stop():
                nonlocal browser
                if browser is not None:
                    browser.close()
                    browser = None

            def export_session(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    press_button(page, '#dialogContent [data-ui="session-export"]')
                target = root / filename
                download.value.save_as(target)
                payload = json.loads(target.read_text(encoding="utf-8"))
                check("Versionierter Export mit 24-Monats-Vertrag",
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == MONTHS)
                return target, payload

            try:
                page = start()
                press_button(page, "#startGame")
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:24")
                press_button(page, '#dialogContent [data-ui="newgame"]')
                initial = state(page)
                check("Vier Menschen und echter 24-Monats-Modus",
                      [firm["id"] for firm in initial["companies"]]
                      == ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 24)

                for month in range(1, MONTHS + 1):
                    report = finish_month(page, month)
                    check("Monat %d: kein vorzeitiger Endzustand" % month,
                          page.evaluate("NeoEconomy.endstate.status()")
                          == ("finished" if month == MONTHS else "active"))
                    check("800x600: kein horizontaler Seitenueberlauf",
                          page.evaluate(
                              "document.documentElement.scrollWidth <= innerWidth + 2"))
                    if month == 12:
                        checkpoint = report
                        saved, payload = export_session(
                            page, "kampagne-24-monat-12.json")
                        check("Halbzeitbericht unveraendert exportiert",
                              payload["state"] == checkpoint and payload["archive"] is None)
                        stop()
                        page = start()
                        page.locator("#loadSessionFile").set_input_files(str(saved))
                        page.wait_for_function(
                            "NeoEconomy.getState()?.month===12 && "
                            "NeoEconomy.getState()?.phase==='REPORT'")
                        check("Neustart: Zustand und Vertragslaufzeit identisch",
                              state(page) == checkpoint
                              and page.evaluate(
                                  "NeoEconomy.endstate.contract().months") == MONTHS)
                    if month < MONTHS:
                        press_button(page, '[data-econ="NEXT_MONTH"]')
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='TURN'", arg=month + 1)

                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("24 Berichte, Abschlussmonat und Archiv-Snapshot",
                      final["month"] == MONTHS and len(final["reports"]) == MONTHS
                      and archive["endMonth"] == MONTHS
                      and archive["durationMonths"] == MONTHS
                      and archive["reason"] == "campaign-duration"
                      and archive["snapshot"] == final)
                check("Sieger und Rangfolge aus echten vier Firmen",
                      len(archive["ranking"]) == HUMANS
                      and archive["winnerIds"]
                      == [row["companyId"] for row in archive["ranking"]
                          if row["rank"] == 1])
                check("Archiv in der Benutzeroberflaeche nur lesbar",
                      "NUR LESEN" in page.locator("#dialogContent").inner_text())
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Abgeschlossenes Spiel bleibt unveraendert",
                      state(page) == final)
                completed, payload = export_session(
                    page, "kampagne-24-abschluss.json")
                check("Endexport ohne aktiven Spielstand",
                      payload["state"] is None and payload["archive"] == archive)
                stop()
                page = start()
                page.locator("#loadSessionFile").set_input_files(str(completed))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach zweitem echten Chromium-Neustart unveraendert",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                check("Drei Chromium-Prozesse und 96 echte Tastatur-Zugabschluesse",
                      processes == 3 and len(final["reports"]) * HUMANS == 96)
                check("Keine externen HTTP/HTTPS-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("BROWSER-24-MONATE:", json.dumps({
                    "months": MONTHS, "human_turns": MONTHS * HUMANS,
                    "reports": len(final["reports"]), "chromium_processes": processes,
                    "viewport": "800x600", "keyboard": "Enter",
                    "historical_c64_verified": False, "release_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop()


if __name__ == "__main__":
    main()
