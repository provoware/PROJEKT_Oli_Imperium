#!/usr/bin/env python3
"""Rohrnetz und Feuerwehr in einer kompletten 12-Monats-Kampagne.

Echte Chromium-Prozessneustarts, Tastaturaktionen, versionierte Sitzungsdateien,
natuerlicher Brand in Monat vier und unveraenderbares Abschlussarchiv.
Technische PPPOPPI-Adaption; keine Aussage ueber historische C64-Regeln.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import (
    CLAIM, FIRE_CHOICES, PIPE_PATHS, activate, check, state, tab_to, valid,
)
from test_browser_campaign_lastmonth_rescue_v194 import finish_four_human_turns

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"


def finish_pipe_stage(page, stage):
    page.evaluate("NeoEconomy.open('pipeline')")
    current = state(page)
    check("Rohrabschnitt %d nach Neustart aktiv" % (stage + 1),
          current["minigame"] is not None
          and current["minigame"]["kind"] == "PIPE"
          and current["minigame"]["stage"] == stage)
    cells = PIPE_PATHS[stage]
    check("Alle Rohrstuecke sichtbar",
          page.locator('[data-arcade="rotate"]').count() == len(cells))
    rotations = 0
    for index, (x, y) in enumerate(cells):
        selector = f'[data-arcade="rotate"][data-cell="{x}-{y}"]'
        turns = (4 - ((index * 3 + stage + 1) % 4)) % 4
        before = state(page)
        check("Rohr %d-%d mit Tab erreichbar" % (x, y), tab_to(page, selector))
        for _ in range(turns):
            activate(page, selector, "Rohr %d-%d drehen" % (x, y))
            rotations += 1
        check("Rohrdrehen ohne Wirtschaftsbuchung", state(page) == before)
    activate(page, '[data-arcade="pipe-check"]',
             "Rohrabschnitt %d abschliessen" % (stage + 1))
    valid(page, "Rohrabschnitt %d" % (stage + 1))
    after = state(page)
    if stage < 2:
        check("Naechster Rohrabschnitt", after["minigame"] is not None
              and after["minigame"]["stage"] == stage + 1)
    else:
        check("Rohrnetz fertig", after["minigame"] is None
              and after["claims"][CLAIM]["pipeline"])
    return rotations


def finish_fire_stage(page, stage):
    page.evaluate("NeoEconomy.open('workshop')")
    current = state(page)
    check("Loeschabschnitt %d aktiv" % (stage + 1),
          current["minigame"] is not None
          and current["minigame"]["kind"] == "FIRE"
          and current["minigame"]["stage"] == stage)
    check("Drei Loeschoptionen sichtbar",
          page.locator('[data-arcade="fire"]').count() == 3)
    activate(page, f'[data-arcade="fire"][data-choice="{FIRE_CHOICES[stage]}"]',
             "Loeschabschnitt %d bestaetigen" % (stage + 1))
    valid(page, "Loeschabschnitt %d" % (stage + 1))
    after = state(page)
    if stage < 2:
        check("Naechste Loeschphase", after["minigame"] is not None
              and after["minigame"]["stage"] == stage + 1)
    else:
        check("Brand geloescht und Rohrnetz erhalten",
              after["minigame"] is None
              and not after["claims"][CLAIM]["burning"]
              and not after["claims"][CLAIM]["damaged"]
              and after["claims"][CLAIM]["pipeline"])


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-campaign-pipe-fire-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 manifestgepruefte Originaldateien", build["sourceFiles"] == 110)
        errors, external = [], []
        processes = 0
        with sync_playwright() as playwright:
            browser = None

            def start_process():
                nonlocal browser, processes
                browser = playwright.chromium.launch(headless=True)
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
                check("Frischer Prozess ohne Spielstand", state(page) is None)
                return page

            def stop_process():
                nonlocal browser
                if browser is not None:
                    browser.close()
                    browser = None

            def export_session(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                target = root / filename
                download.value.save_as(target)
                payload = json.loads(target.read_text(encoding="utf-8"))
                check("Export mit versioniertem 12-Monats-Vertrag",
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == 12)
                return target, payload

            try:
                page = start_process()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                check("Vier menschliche Firmen, 12 Monate",
                      len(state(page)["companies"]) == 4
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)
                for command in ("SURVEY", "BUY", "DRILL"):
                    page.evaluate("NeoEconomy.open('claim')")
                    activate(page, f'[data-econ="{command}"][data-claim="{CLAIM}"]',
                             "Feldaktion " + command)
                    valid(page, "Feldaktion " + command)
                page.evaluate("NeoEconomy.open('pipeline')")
                activate(page, f'[data-econ="PIPE_START"][data-claim="{CLAIM}"]',
                         "Rohrnetz-Minispiel starten")
                pipe_interrupted = state(page)
                check("Rohrnetz im ersten Abschnitt aktiv",
                      pipe_interrupted["month"] == 1
                      and pipe_interrupted["minigame"]["kind"] == "PIPE"
                      and pipe_interrupted["minigame"]["stage"] == 0)
                pipe_file, pipe_payload = export_session(page, "rohrnetz-offen.json")
                check("Offenes Rohrnetz exakt exportiert",
                      pipe_payload["state"] == pipe_interrupted
                      and pipe_payload["archive"] is None)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(pipe_file))
                page.wait_for_function("NeoEconomy.getState()?.minigame?.kind==='PIPE'")
                check("Rohrnetz nach Prozessneustart exakt erhalten",
                      state(page) == pipe_interrupted
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")
                rotations = sum(finish_pipe_stage(page, stage) for stage in range(3))
                check("Rohrnetz nach drei Abschnitten fertig",
                      state(page)["claims"][CLAIM]["pipeline"])
                for month in range(1, 4):
                    check("Monat %d vor Bericht" % month,
                          state(page)["month"] == month)
                    after = finish_four_human_turns(page)
                    check("Monatsbericht %d einmal vorhanden" % month,
                          len(after["reports"]) == month)
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                burning = state(page)
                check("Natuerlicher Brand im vierten Monat",
                      burning["month"] == 4
                      and burning["claims"][CLAIM]["burning"]
                      and any(event["type"] == "BRAND"
                              and event.get("claimId") == CLAIM
                              for event in burning["events"]))
                page.evaluate("NeoEconomy.open('workshop')")
                activate(page, f'[data-econ="FIRE_START"][data-claim="{CLAIM}"]',
                         "Feuerwehr-Minispiel starten")
                before_wrong = state(page)
                activate(page, '[data-arcade="fire"][data-choice="SCHAUM"]',
                         "Absichtlich falsche Erstloeschung")
                fire_interrupted = state(page)
                check("Fehlversuch ohne neue Startkosten",
                      fire_interrupted["minigame"]["kind"] == "FIRE"
                      and fire_interrupted["minigame"]["stage"] == 0
                      and fire_interrupted["minigame"]["attempts"] == 1
                      and fire_interrupted["companies"][0]["cashCent"]
                      == before_wrong["companies"][0]["cashCent"])
                fire_file, fire_payload = export_session(page, "brand-offen.json")
                check("Fehlversuch und Brand exakt exportiert",
                      fire_payload["state"] == fire_interrupted
                      and fire_payload["archive"] is None)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(fire_file))
                page.wait_for_function("NeoEconomy.getState()?.minigame?.kind==='FIRE'")
                check("Feuerwehr und Fehlversuch nach Neustart unveraendert",
                      state(page) == fire_interrupted
                      and page.evaluate("NeoEconomy.endstate.status()") == "active")
                for stage in range(3):
                    finish_fire_stage(page, stage)
                check("Kein zweiter Brand im Abschlusszustand",
                      not state(page)["claims"][CLAIM]["burning"])
                for month in range(4, 13):
                    check("Monat %d vor Bericht" % month,
                          state(page)["month"] == month)
                    after = finish_four_human_turns(page)
                    check("Bericht %d ohne Doppelbuchung" % month,
                          len(after["reports"]) == month)
                    if month < 12:
                        check("Kampagne vor Monat 12 aktiv",
                              page.evaluate("NeoEconomy.endstate.status()") == "active")
                        page.locator('[data-econ="NEXT_MONTH"]').click()
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Endarchiv enthaelt beide Minispiele und 12 Berichte",
                      final["month"] == 12
                      and len(final["reports"]) == 12
                      and final["claims"][CLAIM]["pipeline"]
                      and not final["claims"][CLAIM]["burning"]
                      and archive["endMonth"] == 12
                      and archive["snapshot"] == final
                      and len(archive["ranking"]) == 4)
                archive_file, archive_payload = export_session(
                    page, "rohrnetz-feuerwehr-archiv.json")
                check("Abschlussdatei enthaelt nur Archiv",
                      archive_payload["state"] is None
                      and archive_payload["archive"] == archive)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(archive_file))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                check("Archiv nach viertem Chromium-Prozess exakt",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Archiv verhindert weitere Buchungen", state(page) == final)
                check("Vier echte Chromium-Prozesse", processes == 4)
                check("800x600 ohne horizontales Ueberlaufen",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Offline ohne externe Netzwerkanfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("KAMPAGNEN-ROHRNETZ-FEUERWEHR:", json.dumps({
                    "months": 12, "reports": 12, "pipe_stages": 3,
                    "pipe_rotations": rotations, "fire_stages": 3,
                    "fire_wrong_choices": 1, "chromium_processes": processes,
                    "session_exports": 3, "historical_c64_verified": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop_process()


if __name__ == "__main__":
    main()
