#!/usr/bin/env python3
"""Wirtschaftskette und Vertragsabschluss mit echten Tab-/Enter-Aktionen.

Nur isolierte Offline-Technikvorschau. Szenenwahl erfolgt ueber die bestehende
Navigationsschnittstelle; Wirtschaftsaktionen werden ausschliesslich per
Tastatur ausgeloest. Dateiimport wird gesondert ueber Playwright eingespeist.
Kein Gesamt-Vorrelease-PASS und kein nativer Browserzoom.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import (
    MODES, activate, check, start, state, valid,
)

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"


def action(page, scene, selector, label):
    page.evaluate("(scene) => NeoEconomy.open(scene)", scene)
    activate(page, selector, label)
    valid(page, label)
    return state(page)


def claim_action(page, code, label):
    return action(
        page, "claim",
        f'[data-econ="{code}"][data-claim="{CLAIM}"]', label,
    )


def run_economy(page, label):
    initial = state(page)
    check(label + ": Ausgangslage mit neun Feldern",
          initial["phase"] == "TURN" and len(initial["claims"]) == 9)
    rejected = claim_action(page, "PUMP", label + ": Foerderung vor Bohrung")
    check(label + ": unzulaessige Foerderung unveraendert", rejected == initial)

    surveyed = claim_action(page, "SURVEY", label + ": Gutachten")
    check(label + ": Gutachten verbucht",
          surveyed["companies"][0]["daysUsed"] == 2
          and "H1" in surveyed["claims"][CLAIM]["surveyedBy"])
    bought = claim_action(page, "BUY", label + ": Feldkauf")
    check(label + ": Feld gehoert H1", bought["claims"][CLAIM]["owner"] == "H1")
    duplicate = claim_action(page, "BUY", label + ": Doppelkauf")
    check(label + ": Doppelkauf ohne Doppelbuchung", duplicate == bought)
    drilled = claim_action(page, "DRILL", label + ": Bohrung")
    check(label + ": Bohrung abgeschlossen", drilled["claims"][CLAIM]["drilled"])
    pumped = claim_action(page, "PUMP", label + ": Foerderung")
    check(label + ": 100 Barrel im Tank",
          pumped["claims"][CLAIM]["inventoryMilli"] == 100000)
    shipped = action(
        page, "warehouse",
        f'[data-econ="SHIP"][data-claim="{CLAIM}"]',
        label + ": Transport")
    check(label + ": 100 Barrel ohne Mengenverlust verladen",
          shipped["claims"][CLAIM]["inventoryMilli"] == 0
          and shipped["claims"][CLAIM]["preparedMilli"] == 100000)
    offered = action(
        page, "market",
        f'[data-econ="OFFER"][data-claim="{CLAIM}"]',
        label + ": Marktangebot")
    check(label + ": Angebot ohne vorzeitigen Erloes",
          offered["claims"][CLAIM]["order"] is not None
          and offered["companies"][0]["cashCent"] == shipped["companies"][0]["cashCent"])
    signed = action(
        page, "contracts",
        '[data-econ="SIGN"][data-region="BERLIN"]',
        label + ": Vertrag")
    contracts = signed["companies"][0]["contracts"]
    check(label + ": 40 Barrel Vertrag fuer Monat zwei",
          len(contracts) == 1 and contracts[0]["status"] == "OPEN"
          and contracts[0]["qtyMilli"] == 40000
          and contracts[0]["dueMonth"] == 2)

    month1 = action(page, "calendar", '[data-econ="END_TURN"]',
                    label + ": Monat eins abschliessen")
    check(label + ": Monatsbericht eins mit Verkauf",
          month1["phase"] == "REPORT" and len(month1["reports"]) == 1
          and month1["companies"][0]["monthSoldMilli"] > 0)
    activate(page, '[data-econ="NEXT_MONTH"]',
             label + ": Monat zwei beginnen")
    check(label + ": Monat zwei aktiv", state(page)["month"] == 2)
    pumped2 = claim_action(page, "PUMP", label + ": Vertragsoel foerdern")
    check(label + ": genuegend Oel fuer Vertrag",
          pumped2["claims"][CLAIM]["inventoryMilli"] >= 40000)
    month2 = action(page, "calendar", '[data-econ="END_TURN"]',
                    label + ": Monat zwei abschliessen")
    contract = month2["companies"][0]["contracts"][0]
    check(label + ": Vertrag exakt einmal erfuellt",
          month2["phase"] == "REPORT" and len(month2["reports"]) == 2
          and contract["status"] == "DONE" and contract["soldMilli"] == 40000
          and month2["companies"][0]["stats"]["contractsDone"] == 1)
    check(label + ": Erloes und Transportkosten verbucht",
          any(x["code"] == "VERTRAGSERLÖS"
              for x in month2["companies"][0]["ledger"])
          and any(x["kind"] == "VERTRAGSTRANSPORT"
                  for x in month2["companies"][0]["obligations"]))
    return month2


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-keyboard-economy-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Hashgepruefte Offline-Vorschau erstellt",
              (preview / "index.html").is_file())
        results = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, width, height in MODES:
                    errors, external = [], []
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        accept_downloads=True, reduced_motion="reduce")
                    try:
                        page = context.new_page()
                        page.set_default_timeout(12000)
                        page.on("pageerror", lambda err: errors.append(str(err)))
                        page.on("request", lambda req: external.append(req.url)
                                if req.url.startswith(("http://", "https://")) else None)
                        page.goto((preview / "index.html").as_uri(),
                                  wait_until="load")
                        page.wait_for_function("typeof NeoEconomy === 'object'")
                        start(page, label)
                        final_state = run_economy(page, label)
                        activate(page, "#closeBtn", label + ": Dialog schliessen")
                        with page.expect_download() as download_info:
                            activate(page, "#saveGame",
                                     label + ": Spielstand per Tastatur exportieren")
                        exported = json.loads(
                            Path(download_info.value.path()).read_text(encoding="utf-8"))
                        check(label + ": Export stimmt mit Spielstand ueberein",
                              exported == final_state)
                    finally:
                        context.close()

                    # Dateiimport ist bewusst KEINE behauptete Tastaturaktion.
                    restored_context = browser.new_context(
                        viewport={"width": width, "height": height},
                        reduced_motion="reduce")
                    try:
                        restored = restored_context.new_page()
                        restored.set_default_timeout(12000)
                        restored.on("pageerror", lambda err: errors.append(str(err)))
                        restored.on("request", lambda req: external.append(req.url)
                                    if req.url.startswith(("http://", "https://")) else None)
                        restored.goto((preview / "index.html").as_uri(),
                                      wait_until="load")
                        check(label + ": neuer Kontext ohne Spielstand",
                              restored.evaluate("NeoEconomy.getState()") is None)
                        restored.locator("#loadEconFile").set_input_files({
                            "name": "keyboard-economy.json",
                            "mimeType": "application/json",
                            "buffer": json.dumps(exported, ensure_ascii=False).encode("utf-8"),
                        })
                        restored.wait_for_function(
                            "NeoEconomy.getState()?.month === 2")
                        check(label + ": Import erhaelt Wirtschaftshistorie",
                              state(restored) == final_state)
                        activate(restored, '[data-econ="NEXT_MONTH"]',
                                 label + ": Monat drei nach Import")
                        after = state(restored)
                        check(label + ": keine doppelte Abrechnung",
                              after["month"] == 3 and len(after["reports"]) == 2
                              and after["companies"][0]["stats"]["contractsDone"] == 1)
                    finally:
                        restored_context.close()
                    check(label + ": keine JavaScript-Fehler", not errors)
                    check(label + ": keine externen Netzwerkanfragen", not external)
                    result = {
                        "viewport": [width, height],
                        "economic_actions": [
                            "PUMP_REJECTED", "SURVEY", "BUY", "BUY_REJECTED",
                            "DRILL", "PUMP", "SHIP", "OFFER", "SIGN",
                            "END_TURN", "NEXT_MONTH", "PUMP", "END_TURN",
                            "SAVE", "NEXT_MONTH_AFTER_IMPORT",
                        ],
                        "months_settled": 2,
                        "contract_fulfilled": True,
                        "export_import_equal": True,
                        "native_zoom": "NOT_TESTED",
                        "release_gate": "BLOCKED",
                    }
                    results.append(result)
                    print("KEYBOARD-ECONOMY:", json.dumps(
                        result, ensure_ascii=False), flush=True)
            finally:
                browser.close()
        check("Beide CSS-Bildbereiche getestet", len(results) == 2)
        print("ERGEBNIS:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Nur Wirtschaftskette per Tab/Enter; Dateiimport ueber "
              "Playwright, kein nativer Browserzoom, keine vollstaendige "
              "Dialog-/Endspiel-Freigabe.", flush=True)


if __name__ == "__main__":
    main()
