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
from campaign_native_import_v194 import import_saved_session, require_two_imports
from campaign_keyboard_audit_v194 import tab_to_target, press_tab_focused
from test_browser_native_zoom_v194 import (extension_at, set_real_zoom,
                                          wait_for_zoom_worker)
from performance_profile_v194 import (summarize_month_durations,
                                     summarize_campaign_phase_timing,
                                     summarize_campaign_state_growth)

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"
HUMANS = 4
MAX_REPORTS = 120


def press_campaign_button(page, selector, *, audited=False):
    """Audited controls must use real Tab focus and keyboard Enter."""
    if audited:
        press_tab_focused(page, selector)
    else:
        press_button(page, selector)


def play_month(page, month, audit=None):
    before = state(page)
    retained_before = min(month - 1, MAX_REPORTS)
    check("Monat %d beginnt ohne Doppelabschluss" % month,
          before["month"] == month and before["phase"] == "TURN"
          and before["turnIndex"] == 0
          and len(before["reports"]) == retained_before)
    for index in range(HUMANS):
        page.evaluate("NeoEconomy.open('calendar')")
        audited_turn = audit is not None and month == 1 and index == 0
        if audited_turn:
            audit(page, '[data-econ="END_TURN"]')
        press_campaign_button(page, '[data-econ="END_TURN"]',
                              audited=audited_turn)
        if index < HUMANS - 1:
            page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
            handoff = state(page)
            check("Monat %d: Uebergabe H%d" % (month, index + 2),
                  handoff["turnIndex"] == index + 1
                  and handoff["phase"] == "TURN"
                  and len(handoff["reports"]) == retained_before)
            audited_handoff = audit is not None and month == 1 and index == 0
            if audited_handoff:
                audit(page, '[data-ui="handoff-ok"]')
            press_campaign_button(page, '[data-ui="handoff-ok"]',
                                  audited=audited_handoff)
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


def main(months, zoom_percent=100, native_import=False, keyboard_audit=False):
    campaign_started = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="pppoppi-browser-%d-" % months) as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Quelldateien im isolierten Aufbau",
              build["sourceFiles"] == 110)
        extension = root / "zoom-extension"
        if zoom_percent != 100:
            extension_at(extension)
        errors, external, durations, state_sizes = [], [], [], []
        phase_timings = {"midpoint": {}, "archive": {}}
        processes, rescues = 0, 0
        import_paths = []
        keyboard_audit_hits = []

        def audit(page, selector):
            if keyboard_audit:
                steps = tab_to_target(page, selector)
                keyboard_audit_hits.append({"selector": selector, "tabs": steps})

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
                if zoom_percent == 100:
                    browser = pw.chromium.launch(headless=True)
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True, reduced_motion="reduce")
                else:
                    # Every restart uses a fresh Chromium process AND profile.
                    # Native tab zoom needs the real MV3 tabs API, not CSS zoom.
                    browser = pw.chromium.launch_persistent_context(
                        str(root / ("profile-" + str(processes + 1))),
                        channel="chromium", headless=True,
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True, reduced_motion="reduce",
                        args=["--disable-extensions-except=" + str(extension),
                              "--load-extension=" + str(extension)])
                    context = browser
                processes += 1
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                if zoom_percent != 100:
                    worker = wait_for_zoom_worker(context)
                    reset = set_real_zoom(worker, page.url, 1.0)
                    check("Zoom vor jedem Prozesslauf auf 100 % zurueckgesetzt",
                          abs(reset["factor"] - 1.0) < 0.01)
                    page.wait_for_function("innerWidth >= 790")
                    baseline = page.evaluate(
                        "() => ({width: innerWidth, dpr: devicePixelRatio})")
                    check("800x600-Basisfenster vor nativem Zoom",
                          790 <= baseline["width"] <= 810)
                    factor = zoom_percent / 100
                    actual = set_real_zoom(worker, page.url, factor)
                    check("Echter Chromium-Tab-Zoom %d%%" % zoom_percent,
                          abs(actual["factor"] - factor) < 0.01)
                    page.wait_for_function(
                        "({factor, dpr}) => devicePixelRatio >= dpr * (factor - 0.05)",
                        arg={"factor": factor, "dpr": baseline["dpr"]})
                    check("Nativer Zoom reduziert die CSS-Breite",
                          page.evaluate("innerWidth") < baseline["width"] * 0.65)
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
                    audit(page, '#dialogContent [data-ui="session-export"]')
                    press_campaign_button(
                        page, '#dialogContent [data-ui="session-export"]',
                        audited=keyboard_audit)
                target = root / filename
                download.value.save_as(target)
                payload = json.loads(target.read_text(encoding="utf-8"))
                check("Exportvertrag fuer %d Monate" % months,
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == months)
                return target, payload

            try:
                page = start()
                audit(page, "#startGame")
                press_campaign_button(page, "#startGame", audited=keyboard_audit)
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option(
                    "campaign:%d" % months)
                audit(page, '#dialogContent [data-ui="newgame"]')
                press_campaign_button(
                    page, '#dialogContent [data-ui="newgame"]',
                    audited=keyboard_audit)
                initial = state(page)
                check("Vier Menschen und gewaehlte Kampagnendauer",
                      [c["id"] for c in initial["companies"]]
                      == ["H1", "H2", "H3", "H4"]
                      and page.evaluate("NeoEconomy.endstate.contract().months")
                      == months)

                for month in range(1, months + 1):
                    start_time = time.monotonic()
                    report, count = play_month(page, month, audit if keyboard_audit else None)
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
                            import_paths.append(import_saved_session(
                                page, saved, native=native_import,
                                focus_by_tab=audit if keyboard_audit else None))
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
                        audited_next = keyboard_audit and month in (1, months // 2)
                        if audited_next:
                            audit(page, '[data-econ="NEXT_MONTH"]')
                        press_campaign_button(page, '[data-econ="NEXT_MONTH"]',
                                              audited=audited_next)
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
                    import_paths.append(import_saved_session(
                        page, saved, native=native_import,
                        focus_by_tab=audit if keyboard_audit else None))
                    page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                    check("Archiv und Endstand nach zweitem Neustart identisch",
                          state(page) == final
                          and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                proven_import_path = require_two_imports(
                    import_paths, native=native_import)
                check("Zwei bestaetigte Importe ohne Pfadwechsel",
                      len(import_paths) == 2)
                check("Drei unabhaengige Chromium-Prozesse", processes == 3)
                if keyboard_audit:
                    check("Vierzehn echte Tab-Navigationsnachweise",
                          len(keyboard_audit_hits) == 14)
                    check("Tab-Nachweise mit positiven Tastendruecken",
                          all(hit["tabs"] >= 1 for hit in keyboard_audit_hits))
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
                    "viewport": "800x600",
                    "keyboard": "Enter+Tab" if keyboard_audit else "Enter",
                    "keyboard_tab_audit": (
                        {"controls": len(keyboard_audit_hits),
                         "max_tabs": max(hit["tabs"] for hit in keyboard_audit_hits),
                         "targets": keyboard_audit_hits}
                        if keyboard_audit else None),
                    "native_zoom_percent": zoom_percent,
                    "session_import_path": proven_import_path,
                    "session_import_count": len(import_paths),
                    "native_zoom_api": ("chrome.tabs.setZoom/getZoom"
                                        if zoom_percent != 100 else None),
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
    parser.add_argument("--zoom", type=int, choices=(100, 175, 200), default=100)
    parser.add_argument("--native-import", action="store_true",
                        help="Echte Enter-Dateiauswahl bei beiden Prozessneustarts")
    parser.add_argument("--keyboard-audit", action="store_true",
                        help="Tab-Erreichbarkeit vor Bedienung von 14 Schluesselkontrollen")
    args = parser.parse_args()
    if args.keyboard_audit and not args.native_import:
        parser.error("--keyboard-audit erfordert --native-import")
    main(args.months, args.zoom, args.native_import, args.keyboard_audit)
