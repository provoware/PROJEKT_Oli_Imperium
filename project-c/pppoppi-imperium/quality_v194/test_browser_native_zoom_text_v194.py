#!/usr/bin/env python3
"""Text-Treffbarkeit und Zellabschneidung bei echtem 175/200-%-Chromium-Zoom.

Technischer Teilnachweis: keine Pixel-, Animations- oder menschliche Abnahme.
Die 110 manifestgeschuetzten Spieloriginale werden nicht geaendert.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from test_browser_native_zoom_v194 import wait_for_zoom_worker

from playwright.sync_api import sync_playwright

from test_browser_keyboard_economy_v194 import run_economy, start_fresh
from test_browser_keyboard_pipe_fire_v194 import check, state
from test_browser_native_zoom_v194 import extension_at, set_real_zoom

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)

# Nur relevante Ueberschriften und Tabellenzellen, nicht beliebige DOM-Texte.
# elementFromPoint prueft reale Ueberdeckung, scrollWidth erkennt Clipping.
MEASURE = r"""(rootSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) throw Error('Text-Pruefbereich fehlt: ' + rootSelector);
    const nodes = [...root.querySelectorAll('h2,h3,h4,th,td')];
    const title = root.querySelector('#dialogTitle');
    if (title) nodes.unshift(title);
    const issues = [], unmeasurable = [];
    let measured = 0, cells = 0, clipped = 0, covered = 0;
    for (const el of nodes) {
        if (!el.textContent.trim()) continue;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' ||
            !el.getClientRects().length) continue;
        el.scrollIntoView({block:'center', inline:'nearest'});
        const sx = el.scrollWidth - el.clientWidth;
        const sy = el.scrollHeight - el.clientHeight;
        const xClip = sx > 2 && ['hidden','clip'].includes(style.overflowX);
        const yClip = sy > 2 && ['hidden','clip'].includes(style.overflowY);
        const isCell = /^(TH|TD)$/.test(el.tagName);
        if (isCell) cells++;
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1);
        const visible = rects.filter(r => {
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            return x >= 0 && x < innerWidth && y >= 0 && y < innerHeight;
        });
        const hittable = visible.some(r => {
            const hit = document.elementFromPoint(
                r.left + r.width / 2, r.top + r.height / 2);
            return hit && (hit === el || el.contains(hit));
        });
        const id = el.id || el.tagName.toLowerCase();
        if (!visible.length) {
            unmeasurable.push({id, text:el.textContent.trim().slice(0,50)});
            continue;
        }
        measured++;
        if (xClip || yClip || !hittable) {
            if (xClip || yClip) clipped++;
            if (!hittable) covered++;
            issues.push({id, text:el.textContent.trim().slice(0,70),
                xClip, yClip, covered:!hittable, overflowX:sx, overflowY:sy});
        }
    }
    return {candidates:nodes.length, measured, cells, clipped, covered,
        issues:issues.slice(0,30), unmeasurable:unmeasurable.slice(0,20),
        unmeasurableCount:unmeasurable.length};
}"""


def audit(page, stage):
    result = page.evaluate(MEASURE, "#dialog")
    check(stage + ": lesbarer Text gemessen", result["measured"] > 0)
    check(stage + ": keine abgeschnittenen Textbloecke", result["clipped"] == 0)
    check(stage + ": kein vollstaendig ueberdeckter Text", result["covered"] == 0)
    return result


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-text-zoom-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Technikvorschau gebaut",
              (preview / "index.html").is_file())
        extension = root / "extension"
        extension_at(extension)
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width":800, "height":600}, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(extension),
                      "--load-extension=" + str(extension)])
            try:
                probe = context.new_page()
                probe.set_content('<div id="probe"><h3>Kontrolltext lesbar</h3></div>')
                check("Kontrolle: freier Text erreichbar",
                      probe.evaluate(MEASURE, "#probe")["covered"] == 0)
                probe.evaluate("""() => {
                    const d=document.createElement('div');
                    d.id='qa-cover';
                    d.style.cssText='position:fixed;inset:0;z-index:9999;background:#111';
                    document.body.appendChild(d);
                }""")
                check("Kontrolle: absichtliche Textueberdeckung erkannt",
                      probe.evaluate(MEASURE, "#probe")["covered"] == 1)
                probe.close()
                worker = wait_for_zoom_worker(context)
                check("Echte Zoom-Erweiterung aktiv",
                      worker.url.startswith("chrome-extension://"))
                summaries = []
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    errors, external = [], []
                    page.on("pageerror", lambda e: errors.append(str(e)))
                    page.on("request", lambda r: external.append(r.url)
                            if r.url.startswith(("http://","https://")) else None)
                    try:
                        page.goto((preview / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof PPNavigation191 === 'object'")
                        set_real_zoom(worker, page.url, 1.0)
                        start_fresh(page, label)
                        if page.locator("#dialog").evaluate("(d) => d.open"):
                            page.keyboard.press("Escape")
                            page.wait_for_function(
                                "!document.querySelector('#dialog').open")
                        initial = state(page)
                        zoom = set_real_zoom(worker, page.url, factor)
                        check(label + ": nativer Zoom",
                              abs(zoom["factor"] - factor) < .01)
                        page.wait_for_function(
                            "(f) => Math.abs(devicePixelRatio - f) < .1",
                            arg=factor)
                        scenes = page.evaluate("PPNavigation191.getScenes()")
                        check(label + ": Szeneninventar", len(scenes) >= 35
                              and len(scenes) == len(set(scenes)))
                        rows = []
                        for scene in scenes:
                            page.evaluate("(s) => PPNavigation191.open(s)", scene)
                            page.locator("#dialog").wait_for(state="visible")
                            rows.append(audit(page, label + "/" + scene))
                        check(label + ": reine Szenenpruefung ohne Spielstandaenderung",
                              state(page) == initial)
                        # Dynamische Tabellen entstehen erst nach Wirtschaftsaktionen.
                        run_economy(page, label)
                        report = audit(page, label + "/Monatsbericht-2")
                        check(label + ": Monatsbericht enthaelt Tabellenzellen",
                              report["cells"] > 0)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen", not external)
                        summary = {"zoom_percent":round(factor * 100),
                            "scenes":len(rows), "text_samples":sum(
                                r["measured"] for r in rows) + report["measured"],
                            "table_cells":sum(r["cells"] for r in rows) + report["cells"],
                            "unmeasurable":sum(
                                r["unmeasurableCount"] for r in rows) +
                                report["unmeasurableCount"],
                            "clipped":0, "covered":0, "release_gate":"BLOCKED"}
                        summaries.append(summary)
                        print("TEXT-LAYOUT:", json.dumps(
                            summary, ensure_ascii=False), flush=True)
                    finally:
                        page.close()
                check("Beide echten Zoomstufen durchlaufen",
                      [s["zoom_percent"] for s in summaries] == [175,200])
                print("GRENZE: Ueberschriften und Tabellenzellen; kein "
                      "Pixelvergleich, keine Animationspruefung, keine "
                      "vollstaendige Text- oder Endspielabnahme. "
                      "BED-03/BAR-01 bleiben BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
