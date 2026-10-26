#!/usr/bin/env python3
"""Offline save interruption: reject incomplete downloads and restore explicit backups.

A closed Chromium context is NOT an electrical power-cut test. The game currently
exports JSON files on request; it does not promise automatic crash recovery.
Only disposable browser contexts and copies of exported test data are touched.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import action, state
from test_browser_legacy_special_v194 import export_state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def signature(save):
    firm = save["companies"][0]
    return {
        "month": save["month"], "phase": save["phase"],
        "cash": firm["cashCent"], "debt": firm["debtCent"],
        "ledger": firm["ledger"], "obligations": firm["obligations"],
        "reports": save["reports"], "events": save["events"],
        "processedIds": save["processedIds"], "claims": save["claims"],
    }


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-save-interrupt-") as tmp:
        preview = Path(tmp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True,
        )
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
                    page.on("pageerror", lambda err: errors.append(str(err)))
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("http://", "https://")) else None)
                    page.goto((preview / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                action(page, "claim", "SURVEY", CLAIM)
                backup = export_state(page)
                check("Erste gueltige Sicherung entspricht dem Spielstand",
                      backup == state(page))
                action(page, "claim", "BUY", CLAIM)
                later = export_state(page)
                check("Zweite echte Aktion veraendert Eigentum und Journal",
                      backup != later and backup["claims"][CLAIM]["owner"] is None
                      and later["claims"][CLAIM]["owner"] == "H1"
                      and len(later["companies"][0]["ledger"]) >
                      len(backup["companies"][0]["ledger"]))
                later_bytes = json.dumps(
                    later, ensure_ascii=False, separators=(",", ":")
                ).encode("utf-8")
                check("Zweite Sicherung ist vollstaendiges JSON",
                      json.loads(later_bytes) == later)
                # Simulate an interrupted/partially written *copy* of the
                # exported bytes, not a real filesystem or power interruption.
                broken = [
                    ("abbruch-viertel.json", later_bytes[:len(later_bytes) // 4]),
                    ("abbruch-dreiviertel.json",
                     later_bytes[:3 * len(later_bytes) // 4]),
                    ("abbruch-ungueltige-bytes.json", b"\xff\xfe\x00"),
                ]
                check("Abbruchkopien sind tatsaechlich unlesbar",
                      all(not is_valid_json(payload) for _, payload in broken))
                context.close()  # Abrupt tab/session loss, not power loss.

                context, page = session()
                check("Nach Sitzungsabbruch kein stilles Auto-Restore",
                      state(page) is None)
                for name, payload in broken:
                    import_file(page, name, payload, False)
                    check(name + ": kein unvollstaendiger Spielstand aktiv",
                          state(page) is None)
                import_file(page, "backup-vor-abbruch.json", backup, True)
                check("Letzte gueltige Sicherung vollstaendig wiederhergestellt",
                      state(page) == backup
                      and signature(state(page)) == signature(backup))
                for name, payload in broken:
                    import_file(page, "nach-restore-" + name, payload, False)
                    check(name + ": vorhandene Buchungen unberuehrt",
                          state(page) == backup
                          and signature(state(page)) == signature(backup))
                # Continue normally after recovery, not via direct engine calls.
                continued = action(page, "claim", "BUY", CLAIM)
                check("Partie nach Rueckfall regulär fortsetzbar",
                      continued["claims"][CLAIM]["owner"] == "H1"
                      and continued["companies"][0]["cashCent"] ==
                      later["companies"][0]["cashCent"]
                      and len(continued["companies"][0]["ledger"]) ==
                      len(later["companies"][0]["ledger"]))
                check("Fortsetzung technisch valide",
                      page.evaluate(
                          "NeoEconomy.engine.validate(NeoEconomy.getState())"
                      ) is True)
                context.close()

                context, page = session()
                import_file(page, "backup-nach-kauf.json", later, True)
                check("Spaetere gueltige Sicherung separat ladbar",
                      state(page) == later)
                import_file(page, "backup-nach-kauf-wiederholt.json", later, True)
                check("Kein erneutes Buchen bei doppeltem Restore",
                      state(page) == later
                      and signature(state(page)) == signature(later))
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate(
                          "document.documentElement.scrollWidth <= innerWidth + 2"
                      ))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("SPEICHERABBRUCH-REGRESSION:", json.dumps({
                    "invalid_partial_copies": len(broken),
                    "restored_explicit_backup": True,
                    "replayed_bookings": False,
                    "browser_sessions": 3,
                    "real_power_cut_tested": False,
                    "automatic_crash_recovery_available": False,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


def is_valid_json(payload):
    try:
        json.loads(payload)
        return True
    except (UnicodeDecodeError, json.JSONDecodeError):
        return False


if __name__ == "__main__":
    main()
