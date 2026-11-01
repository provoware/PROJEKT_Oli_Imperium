#!/usr/bin/env python3
"""Echte 120/240-Monats-Partien im Offline-Chromium; kein C64-Originalnachweis.

Nur sichtbare Tastaturaktionen, echte Sanierungen, Export/Import und neue
Browserprozesse. Alle Dateien liegen in einem automatisch geloeschten Tempordner.
"""
import argparse
from contextlib import contextmanager
import json
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_campaign_24months_v194 import check, press_button, state
from performance_profile_v194 import (summarize_month_durations,
                                     summarize_campaign_phase_timing,
                                     summarize_campaign_state_growth)

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"
HUMANS = 4
MAX_REPORTS = 120


def play_month(page, month):
    before = state(page)
    retained_before = min(month - 1, MAX_REPORTS)
    check("Monat %d beginnt ohne Doppelabschluss" % month,
          before["month"] == month and before["phase"] == "TURN"
          and before["turnIndex"] == 0
          and len(before["reports"]) == retained_before)
    for index in range(HUMANS):
        page.evaluate("NeoEconomy.open('calendar')")
        press_button(page, '[data-econ="END_TURN"]')
        if index < HUMANS - 1:
            page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
            handoff = state(page)
            check("Monat %d: Uebergabe H%d" % (month, index + 2),
                  handoff["turnIndex"] == index + 1
                  and handoff["phase"] == "TURN"
                  and len(handoff["reports"]) == retained_before)
            press_button(page, '[data-ui="handoff-ok"]')
    page.wait_for_function(
        "['REPORT','RESCUE'].includes(NeoEconomy.getState()?.phase)")
    rescues = 0
    while state(page)["phase"] == "RESCUE":
        before_rescue = state(page)
        check("Monat %d: Sanierungsfirma vorhanden" % month,
              bool(before_rescue["rescueIds"]) and rescues < 10)
        page.evaluate("NeoEconomy.open('rescue')")
        press_button(page, '[data-econ="RESTART"]')
        rescues += 1
        check("Monat %d: Sanierung schreitet voran" % month,
              len(state(page)["rescueIds"]) < len(before_rescue["rescueIds"]))
    report = state(page)
    retained = min(month, MAX_REPORTS)
    check("Monat %d: genau ein Monatsabschluss, 120er-Fenster" % month,
          report["phase"] == "REPORT"
          and len(report["reports"]) == retained
          and report["reports"][0]["month"] == month - retained + 1
          and report["reports"][-1]["month"] == month
          and report["lastReport"]["month"] == month
          and page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())")
          is True)
    check("800x600 ohne horizontalen Seitenueberlauf",
          page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
    return report, rescues


def main(months):
    campaign_started = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="pppoppi-browser-%d-" % months) as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Quelldateien im isolierten Aufbau",
              build["sourceFiles"] == 110)
        errors, external, durations, state_sizes = [], [], [], []
        phase_timings = {"midpoint": {}, "archive": {}}
        processes, rescues = 0, 0

        with sync_playwright() as pw:
            browser = None

            @contextmanager
            def timed_phase(stage, action):
                began = time.monotonic()
                try:
                    yield
                finally:
                    phase_timings[stage][action] = round(time.monotonic() - began, 3)

            def start():
                nonlocal browser, processes
                browser = pw.chromium.launch(headless=True)
                processes += 1
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Neuer Chromium-Prozess ohne fremde Sitzung",
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
                check("Exportvertrag fuer %d Monate" % months,
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == months)
                return target, payload

            try:
                page = start()
                press_button(page, "#startGame")
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option(
                    "campaign:%d" % months)
                press_button(page, '#dialogContent [data-ui="newgame"]')
                initial = state(page)
                check("Vier Menschen und gewaehlte Kampagnendauer",
                      [c["id"] for c in initial["companies"]]
                      == ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months")
                      == months)

                for month in range(1, months + 1):
                    start_time = time.monotonic()
                    report, count = play_month(page, month)
                    rescues += count
                    check("Monat %d: Endstatus korrekt" % month,
                          page.evaluate("NeoEconomy.endstate.status()")
                          == ("finished" if month == months else "active"))
                    if month == months // 2:
                        checkpoint = report
                        with timed_phase("midpoint", "export"):
                            saved, payload = export_session(
                                page, "zwischenstand-%d.json" % months)
                            check("Halbzeitexport ohne Archiv und mit vollem Zustand",
                                  payload["state"] == checkpoint
                                  and payload["archive"] is None)
                        with timed_phase("midpoint", "restart"):
                            stop()
                            page = start()
                        with timed_phase("midpoint", "import"):
                            page.locator("#loadSessionFile").set_input_files(str(saved))
                            page.wait_for_function(
                                "(m) => NeoEconomy.getState()?.month===m && "
                                "NeoEconomy.getState()?.phase==='REPORT'",
                                arg=month)
                            check("Prozessneustart: Zustand und Vertrag identisch",
                                  state(page) == checkpoint
                                  and page.evaluate(
                                      "NeoEconomy.endstate.contract().months")
                                  == months)
                    if month < months:
                        press_button(page, '[data-econ="NEXT_MONTH"]')
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='TURN'", arg=month + 1)
                    durations.append(round(time.monotonic() - start_time, 3))
                    # Outside the measured month: inspect an already fetched REPORT
                    # state without changing gameplay or retaining its contents.
                    state_sizes.append(len(json.dumps(
                        report, ensure_ascii=False, separators=(",", ":")
                    ).encode("utf-8")))

                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Archiv exakt im Endmonat und unveraenderter Snapshot",
                      final["month"] == months
                      and len(final["reports"]) == MAX_REPORTS
                      and final["reports"][0]["month"] == months - MAX_REPORTS + 1
                      and archive["endMonth"] == months
                      and archive["durationMonths"] == months
                      and archive["reason"] == "campaign-duration"
                      and archive["snapshot"] == final)
                check("Rangliste und Sieger aus vier Firmen",
                      len(archive["ranking"]) == HUMANS
                      and archive["winnerIds"]
                      == [r["companyId"] for r in archive["ranking"]
                          if r["rank"] == 1])
                check("Abschlussansicht nur lesbar",
                      "NUR LESEN" in page.locator("#dialogContent").inner_text())
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Endwertung keine weitere Buchung",
                      state(page) == final)
                with timed_phase("archive", "export"):
                    saved, payload = export_session(
                        page, "abschluss-%d.json" % months)
                    check("Endexport enthaelt nur das Archiv",
                          payload["state"] is None and payload["archive"] == archive)
                with timed_phase("archive", "restart"):
                    stop()
                    page = start()
                with timed_phase("archive", "import"):
                    page.locator("#loadSessionFile").set_input_files(str(saved))
                    page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                    check("Archiv und Endstand nach zweitem Neustart identisch",
                          state(page) == final
                          and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                check("Drei unabhaengige Chromium-Prozesse", processes == 3)
                check("Keine externen HTTP/HTTPS-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                profile = summarize_month_durations(durations)
                breakdown = summarize_campaign_phase_timing(durations, phase_timings)
                state_growth = summarize_campaign_state_growth(durations, state_sizes)
                check("Profil enthaelt alle tatsaechlichen Spielmonate",
                      profile["measured_months"] == months
                      and breakdown["midpoint_month"] == months // 2
                      and state_growth["sampled_months"] == months
                      and breakdown["month_step_profile_without_midpoint_io"]["measured_months"] == months)
                print("BROWSER-LANGKAMPAGNE:", json.dumps({
                    "months": months, "human_turns": months * HUMANS,
                    "retained_reports": len(final["reports"]),
                    "natural_rescues": rescues, "chromium_processes": processes,
                    "viewport": "800x600", "keyboard": "Enter",
                    "slowest_month_seconds": max(durations),
                    "month_step_profile": profile,
                    "timing_breakdown": breakdown,
                    "state_size_profile": state_growth,
                    "end_to_end_seconds": round(time.monotonic() - campaign_started, 3),
                    "historical_c64_verified": False,
                    "performance_release_gate": "BLOCKED: no agreed threshold",
                    "release_gate": "BLOCKED",
                }, sort_keys=True), flush=True)
            finally:
                stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--months", type=int, choices=(120, 240), required=True)
    main(parser.parse_args().months)
