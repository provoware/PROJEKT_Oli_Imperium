#!/usr/bin/env python3
"""Lesender Chromium-Audit aller registrierten Spielszenen im isolierten Technikaufbau.

800x600 ist eine echte Browserfenstergröße. CSS-Zoom 175/200 Prozent ist eine
Layout-Simulation, KEIN Nachweis für nativen Browserzoom oder Sichtabnahme.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
MODES = (("800x600", "100%"), ("CSS-Zoom-175", "175%"), ("CSS-Zoom-200", "200%"))


def check(label, passed):
    print(("PASS: " if passed else "FAIL: ") + label, flush=True)
    if not passed:
        raise AssertionError(label)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-scenes-") as temp:
        target = Path(temp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(target)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Isolierte Offline-Datei vorhanden", (target / "index.html").is_file())
        errors, external = [], []
        audits = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, zoom in MODES:
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(12000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: external.append(request.url)
                            if request.url.startswith(("http://", "https://")) else None)
                    page.goto((target / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof PPNavigation191 === 'object'")
                    page.evaluate("(value) => {document.documentElement.style.zoom=value}", zoom)
                    page.locator("#startGame").focus()
                    page.keyboard.press("Enter")
                    page.locator('[data-ui="newgame"]').click()
                    page.wait_for_function("NeoEconomy.getState() !== null")
                    scenes = page.evaluate("PPNavigation191.getScenes()")
                    check(label + ": Szenenregister mit mindestens 35 Einträgen", len(scenes) >= 35)
                    check(label + ": Szenennamen eindeutig", len(scenes) == len(set(scenes)))
                    rows = []
                    for scene in scenes:
                        page.evaluate("(id) => PPNavigation191.open(id)", scene)
                        result = page.evaluate("""() => {
                            const dlg = document.querySelector('#dialog');
                            const content = document.querySelector('#dialogContent');
                            const root = document.documentElement;
                            return {
                                open: dlg.open,
                                title: document.querySelector('#dialogTitle').textContent.trim(),
                                content: content.textContent.trim().length,
                                nav: dlg.querySelectorAll('#v191-navigator').length,
                                pageExcess: Math.max(0, root.scrollWidth - root.clientWidth),
                                dialogExcess: Math.max(0, dlg.scrollWidth - dlg.clientWidth),
                                contentExcess: Math.max(0, content.scrollWidth - content.clientWidth),
                                closeVisible: !!document.querySelector('#closeBtn')?.getClientRects().length
                            };
                        }""")
                        rows.append({"scene": scene, **result})
                    broken = [r for r in rows if not (
                        r["open"] and r["title"] and r["content"] > 0
                        and r["nav"] == 1 and r["closeVisible"]
                    )]
                    check(label + ": alle " + str(len(rows)) + " Szenen rendern mit Navigation",
                          not broken)
                    page.evaluate("PPNavigation191.open('computer')")
                    page.locator('#v191-navigator [data-nav="quick"]').focus()
                    page.keyboard.press("Enter")
                    check(label + ": Übersicht mit Tab-Fokus und Enter erreichbar",
                          page.evaluate("PPNavigation191.current()") == "quick")
                    page.locator("#closeBtn").focus()
                    page.keyboard.press("Enter")
                    check(label + ": Dialog per Tastatur schließbar",
                          not page.locator("#dialog").evaluate("(d) => d.open"))
                    overflow = [r for r in rows if max(
                        r["pageExcess"], r["dialogExcess"], r["contentExcess"]
                    ) > 2]
                    summary = {
                        "mode": label, "zoom": zoom, "scenes": len(rows),
                        "overflow_scenes": len(overflow),
                        "worst": sorted(overflow, key=lambda r: max(
                            r["pageExcess"], r["dialogExcess"], r["contentExcess"]
                        ), reverse=True)[:8],
                    }
                    audits.append(summary)
                    print("LAYOUT-AUDIT:", json.dumps(summary, ensure_ascii=False), flush=True)
                    context.close()
                check("Keine JavaScript-Laufzeitfehler", not errors)
                check("Keine externen HTTP-Anfragen", not external)
            finally:
                browser.close()
        print("SZENEN-AUDIT:", json.dumps(audits, ensure_ascii=False), flush=True)
        print("HINWEIS: Gemessene Überläufe sind offene UI-Befunde, keine bestandene "
              "Freigabe. CSS-Zoom ersetzt keinen nativen Browserzoom.", flush=True)


if __name__ == "__main__":
    main()
