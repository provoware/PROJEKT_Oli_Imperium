#!/usr/bin/env python3
"""Echten Chromium-Seitenzoom ueber chrome.tabs.setZoom pruefen.

Eine temporaere MV3-Erweiterung setzt den Browser-Tab-Zoom. Dies ist weder
CSS-Viewport-Simulation noch deviceScaleFactor oder Pinch-Zoom.
Die Prüfung ist technisch und ersetzt keine persoenliche Sichtabnahme.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)


def check(label, ok):
    print(("PASS: " if ok else "FAIL: ") + label, flush=True)
    if not ok:
        raise AssertionError(label)


def tab_to(page, selector, limit=300):
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        return False
    for _ in range(limit):
        if target.evaluate("(el) => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def extension_at(folder):
    folder.mkdir()
    (folder / "manifest.json").write_text(json.dumps({
        "manifest_version": 3, "name": "PPPOPPI Offline Zoom QA",
        "version": "1.0.0", "permissions": ["tabs"],
        "background": {"service_worker": "background.js"}
    }), encoding="utf-8")
    (folder / "background.js").write_text(
        "chrome.runtime.onInstalled.addListener(() => {});\n",
        encoding="utf-8")


def set_real_zoom(worker, url, factor):
    return worker.evaluate("""async ({url, factor}) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(t => t.url === url);
        if (!tab) throw Error('Spiel-Tab nicht in chrome.tabs.query gefunden');
        await chrome.tabs.setZoom(tab.id, factor);
        return {id: tab.id, factor: await chrome.tabs.getZoom(tab.id)};
    }""", {"url": url, "factor": factor})


def audit_zoom(page, worker, factor, base_width, base_dpr, state):
    label = str(round(factor * 100)) + "%"
    result = set_real_zoom(worker, page.url, factor)
    check(label + ": echter Browser-Tab-Zoom bestaetigt",
          abs(result["factor"] - factor) < 0.01)
    page.wait_for_function(
        "({factor, base}) => devicePixelRatio >= base * (factor - 0.05)",
        arg={"factor": factor, "base": base_dpr})
    metrics = page.evaluate("""() => {
        const root = document.documentElement;
        const dialog = document.querySelector('#dialog');
        return {
            dpr: devicePixelRatio, innerWidth, innerHeight,
            viewportScale: visualViewport.scale,
            pageExcess: Math.max(0, root.scrollWidth - root.clientWidth),
            dialogExcess: Math.max(0, dialog.scrollWidth - dialog.clientWidth)
        };
    }""")
    check(label + ": CSS-Breite sinkt durch nativen Zoom",
          metrics["innerWidth"] < base_width * 0.65)
    check(label + ": Hilfe per echter Tab-Taste erreichbar",
          tab_to(page, "#helpBtn"))
    check(label + ": sichtbarer Fokus am Ausloeser",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")
    page.locator("#dialog").wait_for(state="visible")
    check(label + ": Hilfedialog nach Zoom geoeffnet",
          page.locator("#dialog").evaluate("(d) => d.open"))
    metrics["dialogExcess"] = page.evaluate("""() => {const d = document.querySelector("#dialog"); return Math.max(0, d.scrollWidth - d.clientWidth)}""")
    check(label + ": Schliessen per Tab erreichbar",
          tab_to(page, "#closeBtn"))
    page.keyboard.press("Escape")
    page.wait_for_function("!document.querySelector('#dialog').open")
    check(label + ": Escape schliesst Dialog",
          not page.locator("#dialog").evaluate("(d) => d.open"))
    check(label + ": Fokus kehrt zum Hilfe-Ausloeser zurueck",
          page.locator("#helpBtn").evaluate(
              "(el) => document.activeElement === el"))
    check(label + ": Wirtschaftszustand unveraendert",
          page.evaluate("JSON.stringify(NeoEconomy.getState())") == state)
    metrics["zoom_percent"] = round(factor * 100)
    metrics["zoom_api"] = "chrome.tabs.setZoom/getZoom"
    metrics["layout_status"] = (
        "BLOCKED" if metrics["pageExcess"] > 2 or metrics["dialogExcess"] > 2
        else "PARTIAL")
    print("NATIVE-ZOOM-AUDIT:", json.dumps(metrics, ensure_ascii=False),
          flush=True)
    return metrics


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-native-zoom-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Hashgepruefte Offline-Vorschau erstellt",
              (preview / "index.html").is_file())
        ext = root / "zoom-extension"
        extension_at(ext)
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "browser-profile"), channel="chromium",
                headless=True, viewport={"width": 800, "height": 600},
                reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(ext),
                      "--load-extension=" + str(ext)])
            try:
                errors, external = [], []
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof PPNavigation191 === 'object'")
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker", timeout=15000))
                check("MV3-Erweiterung ist geladen",
                      worker.url.startswith("chrome-extension://"))
                check("Spielstart mit Tab", tab_to(page, "#startGame"))
                page.keyboard.press("Enter")
                page.locator("#econMode").wait_for(state="visible")
                check("Neue Partie mit Tab", tab_to(page, '[data-ui="newgame"]'))
                page.keyboard.press("Enter")
                page.wait_for_function("NeoEconomy.getState() !== null")
                # Neue Partie oeffnet den modalen Unternehmenscomputer. Solange
                # dieser offen ist, duerfen Kopfknoepfe nicht per Tab erreichbar
                # sein: zuerst den Dialog regulär mit Escape schliessen.
                if page.locator("#dialog").evaluate("(d) => d.open"):
                    page.keyboard.press("Escape")
                    page.wait_for_function("!document.querySelector('#dialog').open")
                check("Startdialog vor Kopfbedienung geschlossen",
                      not page.locator("#dialog").evaluate("(d) => d.open"))
                state = page.evaluate("JSON.stringify(NeoEconomy.getState())")
                baseline = page.evaluate(
                    "() => ({width: innerWidth, dpr: devicePixelRatio})")
                check("Basisbreite 800 CSS-Pixel", baseline["width"] >= 790)
                rows = [audit_zoom(page, worker, factor, baseline["width"],
                                   baseline["dpr"], state) for factor in ZOOMS]
                check("175 und 200 Prozent wirklich geprueft",
                      [row["zoom_percent"] for row in rows] == [175, 200])
                check("Keine JavaScript-Laufzeitfehler", not errors)
                check("Keine externen HTTP-Anfragen", not external)
                print("ERGEBNIS:", json.dumps(rows, ensure_ascii=False),
                      flush=True)
                print("GRENZE: Zoom und Tastatur-Hilfedialog technisch geprueft. "
                      "Ueberlaeufe sind BLOCKED, keine komplette Szenen- oder "
                      "Kontrastabnahme; BED-03 bleibt BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
