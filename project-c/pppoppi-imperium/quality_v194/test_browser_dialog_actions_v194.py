#!/usr/bin/env python3
"""Echte Tastaturaktivierung je einer Wirtschaftsaktion pro Dialogszene.

Jeder Fall startet eine isolierte neue Partie in einer temporaeren Offline-
Vorschau. Das ist eine TEILPRUEFUNG: keine vollstaendige Aktionsabdeckung,
keine originale C64-Regelvalidierung und keine Vorrelease-Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from test_browser_native_zoom_v194 import wait_for_zoom_worker

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import check, tab_to
from test_browser_native_zoom_flow_v194 import new_page
from test_browser_native_zoom_v194 import extension_at

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)

# Nur Wirtschaftsaktionen: Export/Import, Browserdialoge und Navigation
# bleiben in ihren eigenen, bereits vorhandenen Testketten.
CHOOSE = r"""() => {
    const root = document.querySelector('#dialogContent');
    if (!root) throw Error('Dialoginhalt fehlt');
    const controls = [...root.querySelectorAll('button[data-econ]')].filter(el => {
        const css = getComputedStyle(el);
        return !el.disabled && el.tabIndex >= 0 &&
            el.getClientRects().length > 0 &&
            css.display !== 'none' && css.visibility === 'visible' &&
            !el.closest('[inert]');
    });
    if (!controls.length) return {count:0};
    const chosen = controls[0];
    chosen.dataset.qaAction = 'selected';
    return {count:controls.length, action:chosen.dataset.econ,
        claim:chosen.dataset.claim || '', text:chosen.textContent.trim().slice(0,80)};
}"""


def exercise(page, scene, label):
    page.evaluate("(id) => PPNavigation191.open(id)", scene)
    page.locator("#dialog").wait_for(state="visible")
    candidate = page.evaluate(CHOOSE)
    if not candidate["count"]:
        return {"scene":scene, "status":"NO_ECON_ACTION"}
    before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
    page.evaluate("""() => {
        window.__qaTrustedActivation = 0;
        document.addEventListener('click', event => {
            if (event.isTrusted &&
                event.target.closest('[data-qa-action="selected"]'))
                window.__qaTrustedActivation++;
        }, {capture:true, once:false});
    }""")
    check(label + "/" + scene + ": echte Tab-Taste erreicht Wirtschaftsaktion",
          tab_to(page, '#dialogContent [data-qa-action="selected"]', max_tabs=300))
    check(label + "/" + scene + ": Tastaturfokus sichtbar",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")
    check(label + "/" + scene + ": Enter erzeugt genau einen echten Klick",
          page.evaluate("window.__qaTrustedActivation") == 1)
    check(label + "/" + scene + ": Wirtschaftszustand weiterhin gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    after = page.evaluate("JSON.stringify(NeoEconomy.getState())")
    return {"scene":scene, "status":"ACTIVATED", "action":candidate["action"],
            "claim":candidate["claim"], "available":candidate["count"],
            "state_changed":before != after}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-dialog-action-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Vorschau", (preview / "index.html").is_file())
        extension_at(root / "extension")
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width":800, "height":600}, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(root / "extension"),
                      "--load-extension=" + str(root / "extension")])
            try:
                worker = wait_for_zoom_worker(context)
                check("Echte Zoom-Erweiterung aktiv",
                      worker.url.startswith("chrome-extension://"))
                results = []
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    errors, external = [], []
                    inventory_page = new_page(context, preview, worker, factor,
                                              errors, external)
                    try:
                        scenes = inventory_page.evaluate("PPNavigation191.getScenes()")
                        check(label + ": 40 eindeutige Spielszenen",
                              len(scenes) == 40 and len(set(scenes)) == 40)
                    finally:
                        inventory_page.close()
                    rows = []
                    for scene in scenes:
                        errors, external = [], []
                        page = new_page(context, preview, worker, factor,
                                        errors, external)
                        try:
                            rows.append(exercise(page, scene, label))
                            check(label + "/" + scene + ": keine JavaScript-Fehler",
                                  not errors)
                            check(label + "/" + scene + ": keine HTTP-Anfragen",
                                  not external)
                        finally:
                            page.close()
                    active = [r for r in rows if r["status"] == "ACTIVATED"]
                    check(label + ": Wirtschaftsaktionen tatsaechlich ausgefuehrt",
                          len(active) >= 5)
                    results.append({"zoom_percent":round(factor*100),
                                    "scenes":len(rows),
                                    "action_scenes":len(active),
                                    "scenes_without_econ_action":len(rows)-len(active),
                                    "changed_state":sum(r["state_changed"] for r in active),
                                    "actions":active,
                                    "release_gate":"BLOCKED"})
                    print("DIALOG-ACTIONS:", json.dumps(results[-1],
                          ensure_ascii=False), flush=True)
                check("Beide nativen Zoomstufen geprueft",
                      [r["zoom_percent"] for r in results] == [175,200])
                print("GRENZE: Je Szene nur die erste sichtbare Wirtschaftsaktion "
                      "mit einer frischen Testpartie aktiviert. Eine regelkonforme "
                      "Ablehnung darf den Zustand unveraendert lassen. Weitere "
                      "Aktionen, Erfolgs-/Fehlerfolgen und Endpartien offen. "
                      "BED-02/BED-03 bleiben BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
