#!/usr/bin/env python3
"""Browser-Speicherverweigerung und abgebrochene IndexedDB-Transaktion.

Nur ein wegwerfbares Chromium-Profil wird manipuliert. Kein echter
Stromausfall, kein Datentraegerabbruch und keine Aussage zu fsync.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import action, state
from test_browser_legacy_special_v194 import export_state

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-storage-fault-") as tmp:
        preview = Path(tmp) / "preview"
        profile = Path(tmp) / "chromium-profile"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Isolierter, unveraenderter Quellaufbau",
              (preview / "src" / "backup_v194.js").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            def session():
                context = playwright.chromium.launch_persistent_context(
                    str(profile), headless=True,
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce",
                )
                page = context.pages[0] if context.pages else context.new_page()
                page.set_default_timeout(20000)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.on("dialog", lambda dialog: dialog.accept())
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof PPBackup === 'object' && typeof NeoEconomy === 'object'")
                return context, page

            context, page = session()
            page.locator("#startGame").click()
            page.locator('[data-ui="newgame"]').click()
            check("Erste Sicherung geschrieben", page.evaluate("PPBackup.idle()") is True)
            action(page, "claim", "SURVEY", "BERLIN-1")
            check("Zweite Sicherung geschrieben", page.evaluate("PPBackup.idle()") is True)
            safe = state(page)

            # IDB-Transaktion gezielt abbrechen, bevor die dritte Generation
            # geschrieben wird. Nur das temporaere Testprofil ist betroffen.
            page.evaluate("""() => {
                window.__storageFaults = {
                    put: IDBObjectStore.prototype.put,
                    open: indexedDB.open.bind(indexedDB)
                };
                IDBObjectStore.prototype.put = function(...args) {
                    if (this.name === 'snapshots') {
                        this.transaction.abort();
                        return undefined;
                    }
                    return window.__storageFaults.put.apply(this, args);
                };
            }""")
            changed = action(page, "claim", "BUY", "BERLIN-1")
            check("Spielaktion trotz Sicherungsabbruch ausgefuehrt",
                  changed != safe and changed["claims"]["BERLIN-1"]["owner"] == "H1")
            check("Abgebrochene Schreibtransaktion meldet FAIL",
                  page.evaluate("PPBackup.idle()") is False and
                  page.locator("#backupStatus").get_attribute("data-error") == "true" and
                  "Sicherung fehlgeschlagen" in page.locator("#backupStatus").inner_text())
            page.evaluate("() => { IDBObjectStore.prototype.put = window.__storageFaults.put; }")
            page.evaluate("NeoEconomy.open('startup')")
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_timeout(400)
            print("DIAG-SICHERUNG:", json.dumps({
                "status": page.evaluate("PPBackup.status()"),
                "restored_equals_safe": state(page) == safe,
                "current_ledger_count": len(state(page)["companies"][0]["ledger"]) if state(page) else None,
                "expected_ledger_count": len(safe["companies"][0]["ledger"]),
            }, ensure_ascii=False), flush=True)
            check("Nach Transaktionsabbruch letzte gueltige Generation erhalten",
                  state(page) == safe)
            check("Keine doppelten Buchungen nach Rueckfall",
                  state(page)["companies"][0]["ledger"] == safe["companies"][0]["ledger"])

            restored_buy = action(page, "claim", "BUY", "BERLIN-1")
            saved_again = page.evaluate("PPBackup.idle()")
            check("Nach Abbruch erneut erfolgreich gespeichert",
                  saved_again is True and
                  restored_buy["claims"]["BERLIN-1"]["owner"] == "H1" and
                  restored_buy["companies"][0]["cashCent"] == changed["companies"][0]["cashCent"] and
                  len(restored_buy["companies"][0]["ledger"]) ==
                  len(changed["companies"][0]["ledger"]))
            check("Status nach erfolgreicher Speicherung zurueckgesetzt",
                  page.locator("#backupStatus").get_attribute("data-error") == "false")

            # Zugriff auf IndexedDB sperren: kein Eingriff in echte Browserdaten.
            page.evaluate("""() => {
                indexedDB.open = function() {
                    throw new DOMException('Testweise verweigert', 'SecurityError');
                };
            }""")
            check("Speicherverweigerung beim Schreiben sicher abgefangen",
                  page.evaluate("PPBackup.capture(NeoEconomy.getState())") is False and
                  page.locator("#backupStatus").get_attribute("data-error") == "true")
            page.evaluate("NeoEconomy.open('startup')")
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_function("PPBackup.status().includes('Wiederherstellung nicht möglich')")
            check("Speicherverweigerung beim Lesen sichtbar",
                  page.locator("#backupStatus").get_attribute("data-error") == "true")
            check("Lesefehler veraendert laufende Partie nicht",
                  state(page) == restored_buy)
            page.evaluate("() => { indexedDB.open = window.__storageFaults.open; }")
            check("JSON-Export auch nach Speicherverweigerung nutzbar",
                  export_state(page) == restored_buy)
            context.close()

            context, page = session()
            check("Nach Browser-Neustart kein stilles Ueberschreiben",
                  state(page) is None)
            page.locator("#startGame").click()
            page.evaluate("NeoEconomy.open('startup')")
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_function("NeoEconomy.getState() !== null")
            check("Letzte bestaetigte Generation nach Neustart wiederherstellbar",
                  state(page) == restored_buy)
            check("800x600 ohne horizontalen Ueberlauf",
                  page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
            check("Offline ohne externe HTTP-Anfragen", not external)
            check("Keine JavaScript-Laufzeitfehler", not errors)
            print("SPEICHER-FEHLERPROBEN:", json.dumps({
                "aborted_indexeddb_transaction": True,
                "indexeddb_open_denied": True,
                "last_committed_snapshot_restored": True,
                "browser_restart": True,
                "real_power_cut_tested": False,
                "real_filesystem_write_interruption_tested": False,
                "release_gate": "BLOCKED",
            }, ensure_ascii=False), flush=True)
            context.close()


if __name__ == "__main__":
    main()
