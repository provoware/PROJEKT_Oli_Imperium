#!/usr/bin/env python3
"""Quantitativer Fokus-Kontrast-Audit bei echtem Chromium-Tab-Zoom.

Nur Tastatur-Tab, keine Spielaktionen. Berechnet WCAG-Kontrast des
CSS-Outline-Farbtons gegen die naechste deckende Flaeche bzw. alle
bekannten Gradienten-Farbstopps. Transparente/Bildhintergruende bleiben
UNGEKLAERT, niemals stillschweigend PASS. Keine visuelle Endabnahme.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_native_zoom_v194 import (
    HERE, ZOOMS, check, tab_to, extension_at, set_real_zoom,
)

CONTROLS = "button, a[href], input, select, textarea, [tabindex]"

# Der Browser liefert die tatsaechlich berechneten CSS-Farben.
# WCAG 2.x: relative Luminanz, Kontrast = (L_hell + .05)/(L_dunkel + .05).
MEASURE = r"""() => {
    const el = document.activeElement;
    if (!el || !el.dataset.qaFocusIndex) return null;
    const st = getComputedStyle(el);
    const parse = s => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const a = m[1].split(',').map(x => Number(x.trim()));
        if (a.length < 3 || a.slice(0, 3).some(x => !Number.isFinite(x)))
            return null;
        return {rgb: a.slice(0, 3), alpha: a.length > 3 ? a[3] : 1};
    };
    const luminance = rgb => {
        const c = rgb.map(v => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    };
    const ratio = (a, b) => {
        const x = luminance(a), y = luminance(b);
        return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
    };
    const ring = parse(st.outlineColor);
    const ringVisible = el.matches(':focus-visible') &&
        st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2;
    // Ein CSS-Fokus kann trotz ausreichendem Kontrast von einem anderen
    // Element verdeckt sein. Fuenf Punkte pruefen; Kinder zaehlen zum Ziel.
    const rect = el.getBoundingClientRect();
    const samples = [[.5,.5],[.2,.5],[.8,.5],[.5,.2],[.5,.8]];
    const hitPoints = samples.map(([fx, fy]) => {
        const x = rect.left + rect.width * fx;
        const y = rect.top + rect.height * fy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight)
            return false;
        const hit = document.elementFromPoint(x, y);
        return !!hit && (hit === el || el.contains(hit));
    });
    const hitTestable = hitPoints.some(Boolean);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topAtCenter = centerX >= 0 && centerX < innerWidth &&
        centerY >= 0 && centerY < innerHeight ?
        document.elementFromPoint(centerX, centerY) : null;
    const overlapDiagnostic = hitTestable ? null : {
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 90),
        rect: {x: Math.round(rect.x), y: Math.round(rect.y),
               w: Math.round(rect.width), h: Math.round(rect.height)},
        viewport: {w: innerWidth, h: innerHeight},
        topAtCenter: topAtCenter ? {
            tag: topAtCenter.tagName, id: topAtCenter.id,
            className: String(topAtCenter.className).slice(0, 100)
        } : null,
        dialogScrollTop: document.querySelector('#dialog')?.scrollTop,
        contentScrollTop: document.querySelector('#dialogContent')?.scrollTop
    };
    let surfaces = null, surface = 'unbekannt';
    for (let n = el.parentElement; n; n = n.parentElement) {
        const css = getComputedStyle(n);
        if (css.backgroundImage !== 'none') {
            const parts = css.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
            const stops = parts.map(parse);
            if (css.backgroundImage.includes('gradient(') &&
                stops.length >= 2 && stops.every(c => c && c.alpha === 1)) {
                surfaces = stops.map(c => c.rgb);
                surface = 'gradient:' + n.tagName.toLowerCase();
            } else {
                surface = 'unbekanntes-bild:' + n.tagName.toLowerCase();
            }
            break;
        }
        const bg = parse(css.backgroundColor);
        if (bg && bg.alpha === 1) {
            surfaces = [bg.rgb];
            surface = 'flaeche:' + n.tagName.toLowerCase();
            break;
        }
    }
    return {
        id: el.dataset.qaFocusIndex,
        tag: el.tagName.toLowerCase(),
        visible: el.matches(':focus-visible'),
        ringVisible, hitTestable, overlapDiagnostic,
        hitPointsInsideTarget: hitPoints.filter(Boolean).length,
        outlineWidth: st.outlineWidth,
        outlineColor: st.outlineColor,
        surface,
        contrast: ring && ring.alpha === 1 && surfaces ?
            Math.min(...surfaces.map(bg => ratio(ring.rgb, bg))) : null
    };
}"""


def audit_scene(page, scene):
    page.evaluate("(scene) => PPNavigation191.open(scene)", scene)
    page.locator("#dialog").wait_for(state="visible")
    expected = page.evaluate(r"""(selector) => {
        const dialog = document.querySelector('#dialog');
        return [...dialog.querySelectorAll(selector)].filter(el => {
            const s = getComputedStyle(el);
            return el.tabIndex >= 0 && !el.disabled &&
                el.getClientRects().length > 0 &&
                s.visibility !== 'hidden' && s.display !== 'none' &&
                !el.closest('[inert]');
        }).map((el, i) => {
            el.dataset.qaFocusIndex = String(i + 1);
            return String(i + 1);
        });
    }""", CONTROLS)
    check(scene + ": Fokusziele vorhanden", bool(expected))
    check(scene + ": Schliessen per Tab", tab_to(page, "#closeBtn"))
    found = {}
    for _ in range(2 * len(expected) + 12):
        result = page.evaluate(MEASURE)
        if result is not None:
            found[result["id"]] = result
        if len(found) == len(expected):
            break
        page.keyboard.press("Tab")
    missing = [i for i in expected if i not in found]
    no_ring = [r for r in found.values() if not r["ringVisible"]]
    weak = [r for r in found.values()
            if r["contrast"] is not None and r["contrast"] < 3.0]
    unknown = [r for r in found.values() if r["contrast"] is None]
    covered = [r for r in found.values() if not r["hitTestable"]]
    page.keyboard.press("Escape")
    page.wait_for_function("!document.querySelector('#dialog').open")
    return {
        "scene": scene, "expected": len(expected), "measured": len(found),
        "missing": missing, "no_ring": no_ring, "weak": weak,
        "unknown": unknown, "covered": covered,
        "lowest_contrast": round(min(
            (r["contrast"] for r in found.values()
             if r["contrast"] is not None), default=0), 2),
    }


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-focus-contrast-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Hashgepruefte Offline-Vorschau", (preview / "index.html").is_file())
        ext = root / "zoom-extension"
        extension_at(ext)
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width": 800, "height": 600},
                reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(ext),
                      "--load-extension=" + str(ext)])
            try:
                errors, external, summaries = [], [], []
                # Kontrollversuch: ein absichtlich darueberliegendes Element
                # muss den Treffer-Test auf FAIL setzen, sonst waere er wertlos.
                probe = context.new_page()
                try:
                    probe.set_content('<input data-qa-focus-index="1" style="width:160px;height:40px">')
                    probe.locator("input").focus()
                    check("Treffertest erkennt freies Bedienelement",
                          probe.evaluate(MEASURE)["hitTestable"])
                    probe.evaluate("""() => {
                        const cover = document.createElement('div');
                        cover.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#111';
                        document.body.appendChild(cover);
                    }""")
                    check("Treffertest erkennt absichtliche Ueberdeckung",
                          not probe.evaluate(MEASURE)["hitTestable"])
                finally:
                    probe.close()
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on("request", lambda r: external.append(r.url)
                        if r.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof PPNavigation191 === 'object'")
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker", timeout=15000))
                check("Echte Zoom-Erweiterung geladen",
                      worker.url.startswith("chrome-extension://"))
                check("Start per Tab", tab_to(page, "#startGame"))
                page.keyboard.press("Enter")
                page.locator("#econMode").wait_for(state="visible")
                check("Neue Partie per Tab", tab_to(page, '[data-ui="newgame"]'))
                page.keyboard.press("Enter")
                page.wait_for_function("NeoEconomy.getState() !== null")
                if page.locator("#dialog").evaluate("(d) => d.open"):
                    page.keyboard.press("Escape")
                    page.wait_for_function("!document.querySelector('#dialog').open")
                before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
                scenes = page.evaluate("PPNavigation191.getScenes()")
                check("Mindestens 35 eindeutige Szenen",
                      len(scenes) >= 35 and len(scenes) == len(set(scenes)))
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    zoom = set_real_zoom(worker, page.url, factor)
                    check(label + ": nativer Zoom bestaetigt",
                          abs(zoom["factor"] - factor) < .01)
                    rows = [audit_scene(page, scene) for scene in scenes]
                    summary = {
                        "zoom": label, "scenes": len(rows),
                        "controls": sum(r["expected"] for r in rows),
                        "measured": sum(r["measured"] for r in rows),
                        "missing": sum(len(r["missing"]) for r in rows),
                        "no_ring": sum(len(r["no_ring"]) for r in rows),
                        "weak": sum(len(r["weak"]) for r in rows),
                        "unknown": sum(len(r["unknown"]) for r in rows),
                        "covered": sum(len(r["covered"]) for r in rows),
                        "minimum_contrast": min(r["lowest_contrast"] for r in rows
                                                if r["lowest_contrast"] > 0),
                        "issues": [r for r in rows if r["missing"] or r["no_ring"]
                                   or r["weak"] or r["unknown"] or r["covered"]][:12],
                    }
                    print("FOKUS-KONTRAST:", json.dumps(
                        summary, ensure_ascii=False), flush=True)
                    check(label + ": alle Fokusziele per Tab erreicht",
                          summary["missing"] == 0)
                    check(label + ": alle Fokusmarkierungen sichtbar",
                          summary["no_ring"] == 0)
                    check(label + ": berechneter Kontrast >= 3:1",
                          summary["weak"] == 0)
                    check(label + ": alle Hintergruende auswertbar",
                          summary["unknown"] == 0)
                    check(label + ": fokussierte Bedienelemente nicht verdeckt",
                          summary["covered"] == 0)
                    # KI-Inspektor darf durch die Layoutkorrektur nicht
                    # verschwinden: oeffnen und schliessen per echten Tasten.
                    page.evaluate("PPNavigation191.open('computer')")
                    page.wait_for_function(
                        "document.querySelector('#dialog #pp-ai-button') !== null")
                    check(label + ": KI-Knopf bleibt im Dialog vorhanden",
                          page.locator("#dialog #pp-ai-button").count() == 1)
                    check(label + ": KI-Knopf im normalen Layoutfluss",
                          page.locator("#pp-ai-button").evaluate(
                              "(el) => getComputedStyle(el).position === 'static'"))
                    check(label + ": KI-Knopf per Tab erreichbar",
                          tab_to(page, "#pp-ai-button"))
                    page.keyboard.press("Enter")
                    check(label + ": KI-Protokoll per Enter geoeffnet",
                          not page.locator("#pp-ai-drawer").evaluate(
                              "(el) => el.hidden"))
                    check(label + ": KI-Protokoll-Schliessen per Tab",
                          tab_to(page, "#pp-ai-close"))
                    page.keyboard.press("Enter")
                    check(label + ": KI-Protokoll per Enter geschlossen",
                          page.locator("#pp-ai-drawer").evaluate(
                              "(el) => el.hidden"))
                    page.keyboard.press("Escape")
                    page.wait_for_function(
                        "!document.querySelector('#dialog').open")
                    summaries.append(summary)
                check("Spielstand bei reiner Tab-Navigation unveraendert",
                      page.evaluate("JSON.stringify(NeoEconomy.getState())") == before)
                check("Keine JavaScript-Fehler", not errors)
                check("Keine externen HTTP-Anfragen", not external)
                check("175 und 200 Prozent getestet", len(summaries) == 2)
                print("ERGEBNIS:", json.dumps(summaries, ensure_ascii=False),
                      flush=True)
                print("GRENZE: Fuenf Element-Trefferpunkte je fokussiertem "
                      "Bedienelement; keine pixelbasierte Pruefung von Text, "
                      "Animationen oder allen Zwischenbildern. "
                      "BAR-01/BED-03 bleiben BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
