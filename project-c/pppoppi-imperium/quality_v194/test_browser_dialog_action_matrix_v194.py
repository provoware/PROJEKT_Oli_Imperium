#!/usr/bin/env python3
"""Je Dialogszene jede unterschiedliche sichtbare Wirtschaftsaktion per Tab/Enter.

Nur isolierte, manifestgepruefte Offline-Vorschau bei echtem Chromium-Zoom.
Wiederholte Feld-/Regionsparameter und spaetere dynamische Zustaende bleiben
ausdruecklich offen. Keine historische C64- oder Vorrelease-Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import check, tab_to
from test_browser_native_zoom_flow_v194 import new_page
from test_browser_native_zoom_v194 import extension_at

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)

INVENTORY = r"""() => [...document.querySelectorAll(
    '#dialogContent button[data-econ]')].map((el, index) => {
    const css = getComputedStyle(el);
    const eligible = !el.disabled && el.tabIndex >= 0 &&
        el.getClientRects().length > 0 && css.display !== 'none' &&
        css.visibility === 'visible' && !el.closest('[inert]');
    return {index, eligible, action:el.dataset.econ,
        claim:el.dataset.claim || '', region:el.dataset.region || ''};
})"""

MARK = r"""(index) => {
    const all = [...document.querySelectorAll(
        '#dialogContent button[data-econ]')];
    const target = all[index];
    if (!target || target.disabled || !target.getClientRects().length)
        throw Error('Wirtschaftsknopf nicht mehr vorhanden: ' + index);
    target.dataset.qaMatrixTarget = 'yes';
}"""

# Diese Nachbedingungen gelten ausschliesslich fuer eine frische Partie.
# Andere Aktionen werden nur auf Bedienbarkeit und Zustandsintegritaet
# geprueft, nicht irrtuemlich als fachlich richtig freigegeben.
REJECT_FRESH = {'PUMP', 'DRILL', 'PIPE_START', 'REFINERY_BUILD'}


def scan(page, scenes):
    rows = []
    for scene in scenes:
        page.evaluate("(id) => PPNavigation191.open(id)", scene)
        page.locator("#dialog").wait_for(state="visible")
        inventory = page.evaluate(INVENTORY)
        eligible = [item for item in inventory if item["eligible"]]
        unique = {}
        for item in eligible:
            unique.setdefault(item["action"], item)
        for item in unique.values():
            rows.append({"scene": scene, **item})
    return rows


def exercise(page, item, label):
    scene, action = item["scene"], item["action"]
    name = label + "/" + scene + "/" + action
    page.evaluate("(id) => PPNavigation191.open(id)", scene)
    page.locator("#dialog").wait_for(state="visible")
    page.evaluate(MARK, item["index"])
    before = page.evaluate("NeoEconomy.getState()")
    page.evaluate("""() => {
        window.__qaMatrixClicks = 0;
        document.addEventListener('click', event => {
            if (event.isTrusted && event.target.closest(
                '[data-qa-matrix-target="yes"]')) window.__qaMatrixClicks++;
        }, {capture:true});
    }""")
    check(name + ": per Tab erreichbar",
          tab_to(page, '#dialogContent [data-qa-matrix-target="yes"]',
                 max_tabs=300))
    check(name + ": sichtbarer Tastaturfokus",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")
    check(name + ": genau ein echter Tastaturklick",
          page.evaluate("window.__qaMatrixClicks") == 1)
    check(name + ": gueltiger Spielstand",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    after = page.evaluate("NeoEconomy.getState()")
    changed = before != after
    if action in REJECT_FRESH:
        check(name + ": unzulaessige Aktion ohne Zustandsmutation",
              not changed)
    if action == "SURVEY":
        claim = item["claim"]
        check(name + ": Gutachten fachlich verbucht",
              bool(claim) and "H1" in after["claims"][claim]["surveyedBy"]
              and after["companies"][0]["daysUsed"] ==
              before["companies"][0]["daysUsed"] + 2)
    if action == "END_TURN":
        check(name + ": Monatsbericht statt stiller No-op",
              after["phase"] == "REPORT"
              and len(after["reports"]) == len(before["reports"]) + 1)
    return {"scene": scene, "action": action, "claim": item["claim"],
            "region": item["region"], "changed": changed}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-dialog-matrix-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Vorschau vorhanden",
              (preview / "index.html").is_file())
        extension_at(root / "extension")
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width":800, "height":600}, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(root / "extension"),
                      "--load-extension=" + str(root / "extension")])
            try:
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker",
                                                     timeout=15000))
                check("Echte Chromium-Zoom-Erweiterung aktiv",
                      worker.url.startswith("chrome-extension://"))
                results = []
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    errors, external = [], []
                    inventory_page = new_page(context, preview, worker, factor,
                                              errors, external)
                    try:
                        scenes = inventory_page.evaluate(
                            "PPNavigation191.getScenes()")
                        check(label + ": 39 eindeutige Spielszenen",
                              len(scenes) == 39 and len(set(scenes)) == 39)
                        cases = scan(inventory_page, scenes)
                        check(label + ": mehrere unterschiedliche Aktionen",
                              len(cases) >= 12)
                        check(label + ": Scan ohne Laufzeit-/HTTP-Fehler",
                              not errors and not external)
                    finally:
                        inventory_page.close()
                    executed = []
                    for item in cases:
                        errors, external = [], []
                        page = new_page(context, preview, worker, factor,
                                        errors, external)
                        try:
                            executed.append(exercise(page, item, label))
                            check(label + "/" + item["scene"] + "/" +
                                  item["action"] + ": keine Laufzeitfehler",
                                  not errors)
                            check(label + "/" + item["scene"] + "/" +
                                  item["action"] + ": offline", not external)
                        finally:
                            page.close()
                    check(label + ": alle erfassten Aktionsarten je Szene",
                          len(executed) == len(cases))
                    result = {"zoom_percent": round(factor * 100),
                              "scenes": len(scenes),
                              "distinct_scene_actions": len(executed),
                              "distinct_action_codes": sorted(
                                  set(x["action"] for x in executed)),
                              "state_changes": sum(x["changed"] for x in executed),
                              "tested": executed, "release_gate": "BLOCKED"}
                    results.append(result)
                    print("DIALOG-MATRIX:", json.dumps(result,
                          ensure_ascii=False), flush=True)
                check("Beide echten Zoomstufen", [r["zoom_percent"]
                      for r in results] == [175, 200])
                print("GRENZE: Je Szene eine frische Partie je Aktionskennung; "
                      "weitere Claims/Regionen, dynamische Vorbedingungen, "
                      "weitere Sollfolgen und Endpartien bleiben BLOCKED.",
                      flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
