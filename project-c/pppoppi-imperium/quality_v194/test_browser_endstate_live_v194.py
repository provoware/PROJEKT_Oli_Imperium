#!/usr/bin/env python3
"""Live-Endspieladapter im echten Offline-Chromium, noch ohne Enddialog."""
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent

def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-live-") as tmp:
        target = Path(tmp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(target)],
                       check=True, capture_output=True, text=True)
        info = json.loads((target / "BUILD_INFO.json").read_text(encoding="utf-8"))
        assert info["sourceFiles"] == 110, info
        assert "src/endstate_live_v194.js" in info["generatedAddons"], info
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 800, "height": 600})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto((target / "index.html").as_uri())
            page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
            result = page.evaluate("""() => {
              const N = window.NeoEconomy, L = N.endstate;
              N.start('1-2','free');
              const first = N.getState();
              N.send('END_TURN');
              const report = N.getState();
              const before = JSON.stringify(report);
              const ended = L.finish().status;
              N.send('NEXT_MONTH');
              const blocked = JSON.stringify(N.getState()) === before;
              const archive = L.archive();
              const serialized = L.exportSession();
              N.start('1-2','campaign:12');
              const campaign = L.contract();
              N.send('END_TURN');
              const reportCampaign = N.getState();
              const stillActive = L.status() === 'active';
              return {firstMonth:first.month,reportPhase:report.phase,ended,
                blocked,archiveMonth:archive.endMonth,
                sessionSchema:JSON.parse(serialized).schema,
                campaignMonths:campaign.months,stillActive,
                campaignPhase:reportCampaign.phase,
                originalEngine:N.engine.validate(N.getState())};
            }""")
            assert result["firstMonth"] == 1, result
            assert result["reportPhase"] == "REPORT", result
            assert result["ended"] == "finished", result
            assert result["blocked"] is True, result
            assert result["archiveMonth"] == 1, result
            assert result["sessionSchema"] == "pppoppi.endstate.session.proposal/1", result
            assert result["campaignMonths"] == 12, result
            assert result["stillActive"] is True, result
            assert result["campaignPhase"] == "REPORT", result
            assert result["originalEngine"] is True, result
            assert not errors, errors
            browser.close()
            print("PASS: Offline-Chromium 800x600, Live-Spielaktion, freiwilliger "
                  "Abschluss, Aktionssperre, Kampagnenvertrag, 110 Quellhashes")
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    main()
