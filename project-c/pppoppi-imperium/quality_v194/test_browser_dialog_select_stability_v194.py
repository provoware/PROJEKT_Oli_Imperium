#!/usr/bin/env python3
"""Dynamische Feldauswahl: 216 Wechsel bei echtem Chromium-Zoom.

Vier Wirtschaftsszenen, neun Felder, drei unabhaengige Runden bei 175/200 %.
Keine Wirtschaftsaktion, keine Retry-Heilung, keine Gesamtfreigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser_keyboard_pipe_fire_v194 import check
from test_browser_native_zoom_flow_v194 import new_page
from test_browser_native_zoom_v194 import extension_at

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)
ROUNDS = 3
SCENES = (("claim", "BUY"), ("field", "DRILL"),
          ("warehouse", "SHIP"), ("market", "OFFER"))


def snapshot(page):
    """Nur Diagnose lesen, keine Dialogreparatur."""
    return page.evaluate("""() => ({
        activeScene: typeof active === 'string' ? active : null,
        dialogOpen: !!document.querySelector('#dialog')?.open,
        title: document.querySelector('#dialogTitle')?.textContent || '',
        contentLength: document.querySelector('#dialogContent')?.innerHTML.length || 0,
        selected: document.querySelector('#econClaim')?.value ?? null,
        options: [...(document.querySelector('#econClaim')?.options || [])]
            .map(option => option.value),
        buttons: [...document.querySelectorAll(
            '#dialogContent button[data-econ]')]
            .map(button => [button.dataset.econ, button.dataset.claim || '']),
        phase: window.NeoEconomy?.getState()?.phase ?? null
    })""")


def select_claim(page, claim, action, label, baseline, errors):
    try:
        # Change ersetzt das gesamte Dialog-HTML. Bei Fehler nicht neu
        # oeffnen, erneut auswaehlen oder den Zustand manipulieren.
        page.locator("#econClaim").select_option(claim, timeout=6000)
        page.wait_for_function("""({claim, action}) => {
            const select = document.querySelector('#econClaim');
            const buttons = [...document.querySelectorAll(
                '#dialogContent button[data-econ]')];
            return !!document.querySelector('#dialog')?.open &&
                select?.value === claim &&
                buttons.filter(button =>
                    button.dataset.econ === action &&
                    button.dataset.claim === claim).length === 1;
        }""", arg={"claim": claim, "action": action}, timeout=6000)
    except Exception as exc:
        raise AssertionError(
            label + ": dynamischer Feldauswahl-Fehler; " +
            json.dumps({"diagnostic": snapshot(page), "pageErrors": errors,
                        "originalError": str(exc)}, ensure_ascii=False)
        ) from exc
    check(label + ": genau ein passender Wirtschaftsbutton",
          page.locator(
              f'#dialogContent button[data-econ="{action}"][data-claim="{claim}"]'
          ).count() == 1)
    check(label + ": Spielstand unveraendert",
          page.evaluate("NeoEconomy.getState()") == baseline)


def run_round(context, preview, worker, factor, number, claims):
    errors, external = [], []
    label = f"{round(factor * 100)}%/Runde-{number}"
    page = new_page(context, preview, worker, factor, errors, external)
    try:
        baseline = page.evaluate("NeoEconomy.getState()")
        check(label + ": neun Felder und aktive Partie",
              baseline["phase"] == "TURN" and len(baseline["claims"]) == 9)
        selections = 0
        # BERLIN-2 zuerst, BERLIN-1 zuletzt: jeder Schritt erzeugt Change.
        order = claims[1:] + claims[:1]
        for scene, action in SCENES:
            page.evaluate("(scene) => NeoEconomy.open(scene)", scene)
            check(label + "/" + scene + ": genau ein Auswahlfeld",
                  page.locator("#econClaim").count() == 1)
            check(label + "/" + scene + ": Aktionsart vorhanden",
                  page.locator(
                      f'#dialogContent button[data-econ="{action}"]'
                  ).count() == 1)
            for claim in order:
                select_claim(page, claim, action,
                             f"{label}/{scene}/{claim}", baseline, errors)
                selections += 1
        check(label + ": 36 echte Auswahlwechsel", selections == 36)
        check(label + ": keine JavaScript-Fehler", not errors)
        check(label + ": keine externen HTTP-Anfragen", not external)
        return {"zoom_percent": round(factor * 100), "round": number,
                "scenes": len(SCENES), "selections": selections,
                "state_unchanged": True}
    finally:
        page.close()


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-dialog-stability-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Vorschau erstellt",
              (preview / "index.html").is_file())
        extension_at(root / "extension")
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width": 800, "height": 600},
                accept_downloads=True, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(root / "extension"),
                      "--load-extension=" + str(root / "extension")])
            try:
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker",
                                                     timeout=15000))
                check("Chromium-Zoom-Erweiterung geladen",
                      worker.url.startswith("chrome-extension://"))
                errors, external = [], []
                probe = new_page(context, preview, worker, 1.75,
                                 errors, external)
                try:
                    claims = sorted(probe.evaluate(
                        "Object.keys(NeoEconomy.getState().claims)"))
                    check("Neun unterschiedliche Oelfelder", len(claims) == 9)
                    check("Probe ohne Laufzeit-/Netzwerkfehler",
                          not errors and not external)
                finally:
                    probe.close()
                results = [run_round(context, preview, worker, factor, number,
                                     claims)
                           for factor in ZOOMS
                           for number in range(1, ROUNDS + 1)]
                total = sum(item["selections"] for item in results)
                check("216 dynamische Auswahlwechsel", total == 216)
                print("DIALOG-AUSWAHL-STABILITAET:",
                      json.dumps({"results": results, "selections": total,
                                  "release_gate": "BLOCKED"},
                                 ensure_ascii=False), flush=True)
                print("GRENZE: Drei Stichproben je Zoomstufe sind kein "
                      "Dauerstabilitaetsbeweis. HTML-Select nicht per Tastatur. "
                      "Keine Wirtschaftsaktionen; Vorrelease BLOCKED.",
                      flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
