#!/usr/bin/env python3
"""Repeated browser imports must not replay accounting or damage a valid save.

Uses only temporary file:// builds and in-memory browser profiles.  The rescue
fixture is produced through normal visible gameplay actions, not edited cash.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import ACTIONS, action, export_state, state

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def import_file(page, name, content, accepted):
    # Reset only a transient UI message, never the game's accounting state.
    page.evaluate("document.querySelector('#toast').textContent = ''")
    page.locator("#loadEconFile").set_input_files({
        "name": name,
        "mimeType": "application/json",
        "buffer": content if isinstance(content, bytes) else
                  json.dumps(content, ensure_ascii=False).encode("utf-8"),
    })
    expected = "Spielstand geprüft und übernommen" if accepted else "Import abgelehnt"
    page.wait_for_function(
        "message => document.querySelector('#toast')?.textContent?.includes(message)",
        arg=expected,
    )


def accounting_signature(snapshot):
    """Compare complete bookkeeping and event streams, not only cash balances."""
    return {
        "month": snapshot["month"],
        "phase": snapshot["phase"],
        "reports": snapshot["reports"],
        "events": snapshot["events"],
        "processedIds": snapshot["processedIds"],
        "companies": [
            {"id": firm["id"], "cashCent": firm["cashCent"],
             "debtCent": firm["debtCent"], "ledger": firm["ledger"],
             "obligations": firm["obligations"], "generation": firm["generation"]}
            for firm in snapshot["companies"]
        ],
    }


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-reimport-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Isolierter Offline-Aufbau", (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def session():
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True, reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("http://", "https://")) else None)
                    page.goto((preview / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                for scene, name, claim in ACTIONS:
                    action(page, scene, name, claim)
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'RESCUE'")
                check("Regulär entstandene Insolvenz ohne Spielstand-Manipulation",
                      page.evaluate("NeoEconomy.engine.pending(NeoEconomy.getState().companies[0])") == 80_000)
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                after_loan = state(page)
                check("Kredit nur einmal vor dem Export",
                      after_loan["phase"] == "REPORT"
                      and len([x for x in after_loan["companies"][0]["ledger"]
                               if x["code"] == "RETTUNGSKREDIT"]) == 1
                      and len(after_loan["reports"]) == 1)
                exported = export_state(page)
                check("Spielstand aus regulärem Browser-Export", exported == after_loan)
                context.close()

                context, page = session()
                check("Neue Sitzung startet ohne alte Partie", state(page) is None)
                signature = accounting_signature(exported)
                for number in range(1, 7):
                    import_file(page, f"same-save-{number}.json", exported, True)
                    check(f"Wiederimport {number}/6: keine erneute Buchung",
                          state(page) == exported
                          and accounting_signature(state(page)) == signature)
                check("Importiertes Datenmodell weiterhin gültig",
                      page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)

                # Three independent failure modes must leave the *existing*
                # legitimate state intact, including journals and event history.
                invalid = [
                    ("abgeschnitten.json", b'{"schema":'),
                    ("fremdes-schema.json", {**exported, "schema": "unbekannt/0"}),
                    ("negative-kasse.json", None),
                ]
                negative = copy.deepcopy(exported)
                negative["companies"][0]["cashCent"] = -1
                invalid[2] = ("negative-kasse.json", negative)
                for name, payload in invalid:
                    import_file(page, name, payload, False)
                    check(f"Fehlerhafter Import {name} lässt Buchungen unverändert",
                          state(page) == exported
                          and accounting_signature(state(page)) == signature)

                page.locator('[data-econ="NEXT_MONTH"]').click()
                month_two = state(page)
                check("Monat zwei nach sechsmaligem Import ohne Wiederabrechnung",
                      month_two["month"] == 2 and month_two["phase"] == "TURN"
                      and len(month_two["reports"]) == 1
                      and len([x for x in month_two["companies"][0]["ledger"]
                               if x["code"] == "RETTUNGSKREDIT"]) == 1)
                saved_two = export_state(page)
                check("Fortsetzung exportiert unveränderten Monat-zwei-Stand",
                      saved_two == month_two)
                context.close()

                context, page = session()
                check("Zweiter Neustart ohne unbemerkte Wiederherstellung", state(page) is None)
                signature_two = accounting_signature(saved_two)
                for number in range(1, 7):
                    import_file(page, f"continued-{number}.json", saved_two, True)
                    check(f"Folgemonat-Import {number}/6: keine doppelten Ereignisse",
                          state(page) == saved_two
                          and accounting_signature(state(page)) == signature_two)
                check("800x600 ohne horizontalen Überlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("WIEDERIMPORT-REGRESSION:", json.dumps({
                    "reimports": 12,
                    "rejected_imports": 3,
                    "browser_restarts": 2,
                    "loan_bookings": 1,
                    "monthly_reports": 1,
                    "release_gate": "BLOCKED: weitere technische Pflichten offen",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
