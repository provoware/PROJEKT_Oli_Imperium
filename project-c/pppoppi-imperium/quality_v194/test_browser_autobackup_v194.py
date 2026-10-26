#!/usr/bin/env python3
"""V1.9.4: persistente IndexedDB-Zwischensicherung im isolierten Offline-Build.

Kein Stromausfall-/Dateisystem-Absturztest; Browserprofil ist wegwerfbar.
Prueft zwei Generationen, bewusste Wiederherstellung, defekte neueste
Generation, sichere Ablehnung beider defekten Generationen und JSON-Export.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import action, state
from test_browser_legacy_special_v194 import export_state

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


CORRUPT = """async (allSlots) => {
 const db=await new Promise((resolve,reject)=>{
  const r=indexedDB.open('pppoppi-imperium-local-backups-v1',1);
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error);
 });
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction('snapshots','readwrite'), store=tx.objectStore('snapshots');
  const req=store.getAll();
  let changed=0;
  req.onsuccess=()=>{
   const sorted=req.result.sort((a,b)=>b.seq-a.seq);
   for(const item of (allSlots?sorted:sorted.slice(0,1))){
    item.json='{"unterbrochen":';
    store.put(item);
    changed++;
   }
  };
  tx.oncomplete=()=>{db.close();resolve(changed)};
  tx.onabort=()=>{db.close();reject(tx.error)};
 });
}"""


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-backup-test-") as tmp:
        preview = Path(tmp) / "preview"
        profile = Path(tmp) / "chromium-profile"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Isolierter Technikaufbau mit Zusatzmodul",
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
            check("Neue Partie atomar lokal gespeichert",
                  page.evaluate("PPBackup.idle()") is True)
            older = state(page)
            action(page, "claim", "SURVEY", CLAIM)
            check("Spielaktion lokal gespeichert",
                  page.evaluate("PPBackup.idle()") is True)
            newer = state(page)
            check("Zwei unterschiedliche Spielzustaende",
                  older != newer and newer["companies"][0]["ledger"] != older["companies"][0]["ledger"])
            check("Speicherstatus ohne Fehlermeldung",
                  page.locator("#backupStatus").get_attribute("data-error") == "false")
            context.close()

            context, page = session()
            check("Kein stiller Spielstandimport beim Neustart", state(page) is None)
            page.locator("#startGame").click()
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_function("NeoEconomy.getState() !== null")
            check("Neueste Generation nach Browser-Neustart wiederhergestellt",
                  state(page) == newer)
            check("Buchungen nach Wiederherstellung identisch",
                  state(page)["companies"][0]["ledger"] == newer["companies"][0]["ledger"])
            check("Nur die neueste Sicherung im Testprofil beschaedigt",
                  page.evaluate(CORRUPT, False) == 1)
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_function("PPBackup.status().includes('Ältere gültige')")
            check("Aeltere gueltige Generation automatisch ausgewaehlt",
                  state(page) == older)
            check("Beide Sicherungen im Testprofil beschaedigt",
                  page.evaluate(CORRUPT, True) == 2)
            before = state(page)
            page.locator('[data-ui="restore-backup"]').click()
            page.wait_for_function("PPBackup.status().includes('Beide Zwischensicherungen')")
            check("Beide defekten Sicherungen verweigert, laufende Partie erhalten",
                  state(page) == before and
                  page.locator("#backupStatus").get_attribute("data-error") == "true")
            check("Expliziter JSON-Export funktioniert weiterhin",
                  export_state(page) == older)
            check("800x600 ohne horizontalen Ueberlauf",
                  page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
            check("Keine externen Netzanforderungen", not external)
            check("Keine JavaScript-Laufzeitfehler", not errors)
            print("AUTO-SICHERUNG:", json.dumps({
                "storage": "IndexedDB",
                "generations": 2,
                "browser_restarts": 1,
                "corrupt_latest_fallback": True,
                "corrupt_both_rejected": True,
                "explicit_restore_only": True,
                "power_cut_tested": False,
                "filesystem_crash_tested": False,
                "release_gate": "BLOCKED",
            }, ensure_ascii=False), flush=True)
            context.close()


if __name__ == "__main__":
    main()
