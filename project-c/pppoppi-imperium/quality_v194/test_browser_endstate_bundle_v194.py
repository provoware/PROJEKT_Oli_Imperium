#!/usr/bin/env python3
"""Echter Offline-Chromium-Test des isolierten Endspiel-Browserpakets."""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-endstate-") as temporary:
        target = Path(temporary) / "tech-preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(target)],
                       check=True, capture_output=True, text=True)
        info = json.loads((target / "BUILD_INFO.json").read_text(encoding="utf-8"))
        assert info["sourceFiles"] == 110, info
        assert "src/endstate_browser_v194.js" in info["generatedAddons"], info
        assert (target / "src/endstate_browser_v194.js").is_file()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 800, "height": 600})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto((target / "index.html").as_uri())
            page.wait_for_function("window.PPPEndstate && window.OliV082")
            result = page.evaluate("""() => {
              const {candidate: C, io: IO, session: S} = window.PPPEndstate;
              const E = window.OliV082;
              const deps = {engine: E, candidate: C, io: IO, regions: E.REGIONS};
              const original = E.fresh({humans: 2, ais: 0, seed: 'ENDSTATE-BROWSER-BUNDLE'});
              const active = S.createSession({...deps, contract: C.rules({mode: 'free'}), state: original});
              const before = active.snapshot();
              active.apply({type: 'END_TURN', companyId: 'H1', requestId: 'BUNDLE-1'});
              const after = active.snapshot();
              const restoredActive = S.importSession(active.exportSession(), deps);
              const ended = restoredActive.finish(true);
              const archive = restoredActive.exportArchive();
              const restored = S.importSession(restoredActive.exportSession(), deps);
              let blocked = false;
              try { restored.apply({type: 'END_TURN', companyId: 'H2', requestId: 'BUNDLE-2'}); }
              catch (error) { blocked = /unveraenderbar/.test(error.message); }
              const checked = IO.importArchive(archive, E.REGIONS);
              return {initialMonth: before.month, nextTurn: after.turnIndex,
                activeStatus: active.status(), finished: ended.status,
                restored: restored.status(), blocked,
                archiveSchema: checked.schema, engineValid: E.validate(restored.snapshot()),
                originalUntouched: original.turnIndex === before.turnIndex};
            }""")
            assert result["initialMonth"] == 1, result
            assert result["nextTurn"] == 1, result
            assert result["activeStatus"] == "active", result
            assert result["finished"] == "finished", result
            assert result["restored"] == "finished", result
            assert result["blocked"] is True, result
            assert result["engineValid"] is True, result
            assert result["originalUntouched"] is True, result
            assert result["archiveSchema"] == "pppoppi.endstate.archive.proposal/1", result
            assert not errors, errors
            browser.close()
            print("PASS: Offline-Chromium 800x600, Originalengine, Browserpaket, "
                  "aktiver Sitzungsimport, Archiv, Aktionssperre, 110 Quellhashes")
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
