#!/usr/bin/env python3
"""Regulaere Insolvenz durch echte Browser-Aktionen, ohne Testspielstand-Manipulation.

Ein neuer Offline-Spielstand wird ausschliesslich ueber die sichtbaren
Wirtschaftsschaltflaechen belastet. Kredit, Notverkauf und Neustart werden
aus demselben echten Sanierungs-Spielstand getrennt durchgespielt.
Kein Release-Gate und keine Aussage ueber historische C64-Regeln.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
BERLIN = "BERLIN-1"
NORD = "NORD-1"
ACTIONS = (
    ("claim", "SURVEY", BERLIN),
    ("claim", "BUY", BERLIN),
    ("claim", "DRILL", BERLIN),
    ("claim", "SURVEY", NORD),
    ("claim", "BUY", NORD),
    ("warehouse", "TANK_UPGRADE", BERLIN),
    ("security", "SECURITY", BERLIN),
    ("security", "SECURITY", BERLIN),
)


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def pending(page):
    return page.evaluate(
        "NeoEconomy.engine.pending(NeoEconomy.getState().companies[0])"
    )


def action(page, scene, name, claim):
    # Navigation per vorhandener Oberflaechen-API, Aktionen nur per echtem Klick.
    page.evaluate("(id) => NeoEconomy.select(id)", claim)
    if scene != "claim":
        page.evaluate("(name) => NeoEconomy.open(name)", scene)
    selector = f'[data-econ="{name}"][data-claim="{claim}"]'
    button = page.locator(selector)
    check(f"{name} auf {claim}: genau eine Schaltflaeche", button.count() == 1)
    button.click()
    result = state(page)
    check(f"{name} auf {claim}: Spielstand gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    return result


def export_state(page):
    page.locator("#closeBtn").click()
    with page.expect_download() as downloaded:
        page.locator("#saveGame").click()
    return json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))


def import_state(page, name, data, phase):
    check("Neuer Browserkontext ohne alten Spielstand", state(page) is None)
    page.locator("#loadEconFile").set_input_files({
        "name": name,
        "mimeType": "application/json",
        "buffer": json.dumps(data, ensure_ascii=False).encode("utf-8"),
    })
    page.wait_for_function(
        "(expected) => NeoEconomy.getState()?.phase === expected", arg=phase
    )
    check("Import exakt ohne Datenverlust", state(page) == data)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-natural-rescue-") as temp:
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
                    page.set_default_timeout(12000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("http://", "https://")) else None)
                    page.goto((preview / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                fresh = state(page)
                check("Frischer unveraenderter Spielstart mit 20 Mio. Cent",
                      fresh["phase"] == "TURN"
                      and fresh["companies"][0]["cashCent"] == 20_000_000
                      and fresh["companies"][0]["obligations"] == [])
                for scene, name, claim in ACTIONS:
                    before = state(page)
                    after = action(page, scene, name, claim)
                    check(f"{name}: Geld und Spieltage nur durch Spielaktion",
                          after["companies"][0]["cashCent"] < before["companies"][0]["cashCent"]
                          and after["companies"][0]["daysUsed"] > before["companies"][0]["daysUsed"])
                before_end = state(page)
                firm = before_end["companies"][0]
                check("Ohne manipulierte Finanzdaten: 60.000 Cent Restkasse, 15 Tage",
                      firm["cashCent"] == 60_000 and firm["daysUsed"] == 15
                      and not firm["obligations"])
                check("Zwei echte Felder, eine Bohrung und zwei Sicherheitsbuchungen",
                      before_end["claims"][BERLIN]["owner"] == "H1"
                      and before_end["claims"][NORD]["owner"] == "H1"
                      and before_end["claims"][BERLIN]["drilled"]
                      and len([x for x in firm["ledger"]
                               if x["code"] == "OBJEKTSCHUTZ"]) == 2)
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'RESCUE'")
                rescue = state(page)
                bills = rescue["companies"][0]["obligations"]
                check("Echter Monatsabschluss fuehrt zur Insolvenzphase",
                      rescue["month"] == 1 and rescue["rescueIds"] == ["H1"]
                      and len(rescue["reports"]) == 1 and pending(page) == 80_000)
                check("Lohn und Wartung: 140.000 Cent faellig, 60.000 Cent bezahlt",
                      {x["kind"] for x in bills} == {"PERSONAL", "WARTUNG"}
                      and sum(x["dueCent"] for x in bills) == 140_000
                      and sum(x["paidCent"] for x in bills) == 60_000
                      and rescue["companies"][0]["cashCent"] == 0)
                check("Keine synthetischen Forderungen oder direkten Engine-Befehle",
                      all(x["kind"] in {"PERSONAL", "WARTUNG"} for x in bills)
                      and not rescue["companies"][0]["loanUsed"])
                saved_rescue = export_state(page)
                check("Export vor Sanierung entspricht der echten Insolvenz",
                      saved_rescue == rescue)

                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                loan = state(page)
                check("Rettungskredit beseitigt Rueckstand, erhaelt Eigentum",
                      loan["phase"] == "REPORT" and pending(page) == 0
                      and loan["companies"][0]["cashCent"] == 3_920_000
                      and loan["companies"][0]["debtCent"] == 4_000_000
                      and loan["claims"][BERLIN]["owner"] == "H1"
                      and loan["claims"][NORD]["owner"] == "H1")
                check("Kredit genau einmal gebucht, Bericht nicht verdoppelt",
                      len([x for x in loan["companies"][0]["ledger"]
                           if x["code"] == "RETTUNGSKREDIT"]) == 1
                      and len(loan["reports"]) == 1)
                saved_loan = export_state(page)
                check("Kredit-Export identisch", saved_loan == loan)
                context.close()

                context, page = session()
                import_state(page, "echte-insolvenz-nach-kredit.json", saved_loan, "REPORT")
                page.locator('[data-econ="NEXT_MONTH"]').click()
                next_month = state(page)
                check("Kredit-Neustart: Folgemonat ohne doppelte Abrechnung",
                      next_month["month"] == 2 and next_month["phase"] == "TURN"
                      and len(next_month["reports"]) == 1
                      and len([x for x in next_month["companies"][0]["ledger"]
                               if x["code"] == "RETTUNGSKREDIT"]) == 1)
                context.close()

                context, page = session()
                import_state(page, "echte-insolvenz-notverkauf.json", saved_rescue, "RESCUE")
                page.locator('[data-econ="RESCUE_SALE"]').click()
                sold = state(page)
                check("Notverkauf deckt echte Rueckstaende ohne Kredit",
                      sold["phase"] == "REPORT" and pending(page) == 0
                      and sold["companies"][0]["cashCent"] == 2_920_000
                      and sold["companies"][0]["debtCent"] == 0
                      and sold["claims"][BERLIN]["owner"] is None
                      and sold["claims"][NORD]["owner"] == "H1")
                check("Genau ein Notverkauf und ein Monatsbericht",
                      len([x for x in sold["companies"][0]["ledger"]
                           if x["code"] == "NOTVERKAUF"]) == 1
                      and len(sold["reports"]) == 1)
                context.close()

                context, page = session()
                import_state(page, "echte-insolvenz-neustart.json", saved_rescue, "RESCUE")
                page.locator('[data-econ="RESTART"]').click()
                restarted = state(page)
                firm = restarted["companies"][0]
                check("Neustart nach echter Insolvenz: Generation 2, 15 Mio. Cent",
                      restarted["phase"] == "REPORT" and firm["generation"] == 2
                      and firm["cashCent"] == 15_000_000 and firm["debtCent"] == 0
                      and firm["stats"]["rescues"] == 1 and pending(page) == 0)
                check("Neustart gibt beide Felder frei und fuehrt Ereignis",
                      restarted["claims"][BERLIN]["owner"] is None
                      and restarted["claims"][NORD]["owner"] is None
                      and any(x["type"] == "SANIERUNGSNEUSTART"
                              for x in restarted["events"])
                      and len(restarted["reports"]) == 1)
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("ECHTE-INSOLVENZ:", json.dumps({
                    "origin": "ausschliesslich acht sichtbare Wirtschaftshandlungen",
                    "fixture": False,
                    "unpaid_after_month_cent": 80_000,
                    "branches": ["RETTUNGSKREDIT", "NOTVERKAUF", "NEUSTART"],
                    "loan_export_restart_import": "PASS",
                    "release_gate": "BLOCKED: weitere Pflichten offen",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
