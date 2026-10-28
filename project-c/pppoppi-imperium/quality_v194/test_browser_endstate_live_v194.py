#!/usr/bin/env python3
"""Live-Endspieladapter mit sichtbarer Spielartwahl im Offline-Chromium; Enddialog folgt."""
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
            # Normale Bedienoberflaeche: Spielart sichtbar, beschriftet und per Tastatur erreichbar.
            page.evaluate("window.NeoEconomy.open('startup')")
            mode_select = page.get_by_label("Spielart", exact=True)
            assert mode_select.count() == 1, "Spielart-Auswahl nicht sichtbar"
            assert mode_select.is_visible()
            assert mode_select.input_value() == "free"
            assert page.locator("#econEndMode option").count() == 6
            mode_select.focus()
            mode_select.press("Tab")
            assert page.evaluate("document.activeElement?.dataset?.ui") == "newgame", "Tab-Reihenfolge unterbrochen"
            mode_select.select_option("campaign:12")
            page.locator("#dialogContent button[data-ui='newgame']").click()
            chosen = page.evaluate("""() => ({
              mode: NeoEconomy.endstate.contract().mode,
              months: NeoEconomy.endstate.contract().months,
              status: NeoEconomy.endstate.status(),
              month: NeoEconomy.getState().month
            })""")
            assert chosen == {"mode": "campaign", "months": 12, "status": "active", "month": 1}, chosen
            page.evaluate("window.NeoEconomy.open('startup')")
            page.get_by_label("Spielart", exact=True).select_option("free")
            page.locator("#dialogContent button[data-ui='newgame']").click()
            free = page.evaluate("""() => ({
              mode: NeoEconomy.endstate.contract().mode,
              status: NeoEconomy.endstate.status(),
              month: NeoEconomy.getState().month
            })""")
            assert free == {"mode": "free", "status": "active", "month": 1}, free
            # Echte Bedienfolge: freie Partie nicht versehentlich beenden, dann bestaetigen.
            page.evaluate("window.NeoEconomy.open('computer')")
            page.get_by_role("button", name="Spielende pruefen").click()
            confirm = page.get_by_role("button", name="Ja, Partie endgueltig abschliessen")
            assert confirm.is_visible(), "Bestaetigungsdialog fehlt"
            confirm.focus()
            confirm.press("Tab")
            assert page.evaluate("document.activeElement?.dataset?.ui") == "finish-cancel", "Abbruch nicht per Tab erreichbar"
            page.get_by_role("button", name="Nein, weiterspielen").click()
            assert page.evaluate("NeoEconomy.endstate.status()") == "active", "Abbruch hat Partie beendet"
            page.evaluate("window.NeoEconomy.open('computer')")
            page.get_by_role("button", name="Spielende pruefen").click()
            page.get_by_role("button", name="Ja, Partie endgueltig abschliessen").click()
            archived = page.evaluate("""() => ({
              status: NeoEconomy.endstate.status(),
              archive: NeoEconomy.endstate.archive(),
              text: document.getElementById('dialogContent').innerText,
              state: JSON.stringify(NeoEconomy.getState())
            })""")
            assert archived["status"] == "finished", archived
            assert archived["archive"]["reason"] == "voluntary-end", archived
            assert archived["archive"]["endMonth"] == 1, archived
            assert "NUR LESEN" in archived["text"], archived
            assert "Weitere Wirtschaftsaktionen sind gesperrt" in archived["text"], archived
            page.evaluate("window.NeoEconomy.send('END_TURN')")
            assert page.evaluate("JSON.stringify(NeoEconomy.getState())") == archived["state"], "Archiv wurde veraendert"
            page.evaluate("window.NeoEconomy.open('endstate')")
            assert page.get_by_role("button", name="Neue Partie vorbereiten").is_visible()
            assert not errors, errors
            browser.close()
            print("PASS: Offline-Chromium 800x600, Live-Spielaktion, freiwilliger "
                  "Abschluss, Aktionssperre, Kampagnenvertrag, 110 Quellhashes")
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    main()
