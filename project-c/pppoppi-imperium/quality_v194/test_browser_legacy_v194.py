#!/usr/bin/env python3
"""Legacy save compatibility: genuine V0.8 engine, V0.8.2 fixture, V0.6 rejection.

Only isolated file:// preview and browser memory are changed. No source
fixtures or existing saves are modified, and no automatic migration is assumed.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import export_state, state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "SPIEL"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-legacy-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Unveränderte Quellen in isolierter Offline-Vorschau",
              (preview / "index.html").is_file())
        old_v082 = json.loads((SOURCE / "sample_save_v11.json").read_text(encoding="utf-8"))
        old_v06 = json.loads((SOURCE / "legacy_v06/docs/test_save.json").read_text(encoding="utf-8"))
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                context = browser.new_context(viewport={"width": 800, "height": 600},
                                              accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof NeoEconomy === 'object' && typeof OliV08 === 'object'")

                # Construct a real old-format state through its historic engine.
                old_v08 = page.evaluate("""() => {
                    let s = OliV08.fresh({humans: 1, ais: 1, seed: 'LEGACY-V08-TEST'});
                    for (const [type, number] of [['SURVEY', 1], ['BUY', 2]]) {
                        s = OliV08.transition(s, {type, companyId: 'H1',
                            region: 'BERLIN', requestId: 'legacy-' + number}).state;
                    }
                    OliV08.validate(s);
                    return s;
                }""")
                check("V0.8-Ausgangszustand mit echten Buchungen",
                      old_v08["schema"] == "pppoppi.berlin.save/0.8"
                      and len(old_v08["companies"][0]["ledger"]) >= 2
                      and old_v08["companies"][0]["fields"]["BERLIN"]["owned"])
                import_file(page, "v08-genuine.json", old_v08, True)
                migrated = state(page)
                check("V0.8-Migration auf aktuelles Schema",
                      migrated["schema"] == "pppoppi.berlin.save/0.8.2"
                      and migrated["lineage"]["source"] == old_v08["schema"])
                check("Historische Geld-, Schulden- und Buchungswerte unverändert",
                      all(migrated["companies"][i][key] == old_v08["companies"][i][key]
                          for i in range(len(old_v08["companies"]))
                          for key in ("cashCent", "debtCent", "ledger", "obligations")))
                check("Eigentum und Wiederholungsschutz aus V0.8 übernommen",
                      migrated["claims"]["BERLIN-1"]["owner"] == "H1"
                      and migrated["processedIds"] == old_v08["processedIds"]
                      and migrated["sequence"] == old_v08["sequence"])
                check("Migrierter Export ist exakt der importierte Zustand",
                      export_state(page) == migrated)
                import_file(page, "v08-migrated-roundtrip.json", migrated, True)
                check("Wiederimport des migrierten Stands ohne Doppelbuchung",
                      state(page) == migrated)

                # Immutable original V0.8.2 example file.
                check("V0.8.2-Originalbeispiel erkannt",
                      old_v082["schema"] == "pppoppi.berlin.save/0.8.2")
                import_file(page, "sample_save_v11.json", old_v082, True)
                check("V0.8.2 ohne stille Änderung der Buchungshistorie",
                      state(page) == old_v082 and export_state(page) == old_v082)

                # Reject unsupported and broken formats without changing journals.
                invalid = [
                    # SPE-02 aus PR #27: V0.7 ist keine stillschweigend
                    # unterstützte Migration; auch fehlende und zukünftige
                    # Schemata dürfen den laufenden Spielstand nicht ersetzen.
                    ("unsupported-v07.json", {**copy.deepcopy(old_v08),
                                              "schema": "pppoppi.berlin.save/0.7"}),
                    ("missing-version.json", {k: copy.deepcopy(v)
                                              for k, v in old_v08.items() if k != "schema"}),
                    ("future-version.json", {**copy.deepcopy(old_v08),
                                             "schema": "pppoppi.berlin.save/0.9"}),
                    ("unsupported-v06.json", old_v06),
                    ("corrupt-v08.json", {**copy.deepcopy(old_v08), "companies": []}),
                    ("truncated-v08.json", b'{"schema":"pppoppi.berlin.save/0.8",'),
                ]
                for name, payload in invalid:
                    import_file(page, name, payload, False)
                    check("Abgewiesener Altimport ohne Datenverlust: " + name,
                          state(page) == old_v082)
                check("800 × 600 ohne horizontalen Überlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("ALTSTAND-REGRESSION:", json.dumps({
                    "v08_migration": "PASS", "v082_fixture": "PASS",
                    "rejected_invalid": len(invalid), "original_sources_changed": False,
                    "v06_migration_supported": False, "release_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
