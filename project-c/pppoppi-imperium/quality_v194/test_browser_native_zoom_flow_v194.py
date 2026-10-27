#!/usr/bin/env python3
"""Fliesstext und dynamische Spielphasen bei echtem 175/200-%-Chromium-Zoom.

Technischer Teilnachweis fuer BED-03; keine vollstaendige Sicht-/Release-Abnahme.
Die manifestgeschuetzten 110 Spieloriginale werden ausschliesslich gelesen.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_economy_v194 import run_economy, start_fresh
from test_browser_keyboard_pipe_fire_v194 import (
    check, fire, pipe, start, state, to_fire_month, valid,
)
from test_browser_native_zoom_v194 import extension_at, set_real_zoom

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)

# Bewusst andere Textarten als im vorigen Test: keine h2/h3/th/td.
# Getrennte Textrechtecke statt nur scrollWidth der gesamten Seite.
FLOW_MEASURE = r"""(selector) => {
    const root = document.querySelector(selector);
    if (!root) throw Error('Pruefbereich fehlt: ' + selector);
    const candidates = [...root.querySelectorAll('p,li,label,blockquote,figcaption')]
        .filter(el => !el.querySelector('p,li,label,blockquote,figcaption'));
    const issues = [];
    let measured = 0, clipped = 0, covered = 0, unmeasurable = 0;
    for (const el of candidates) {
        if (!el.textContent.trim()) continue;
        const css = getComputedStyle(el);
        if (css.display === 'none' || css.visibility !== 'visible' ||
            !el.getClientRects().length) continue;
        el.scrollIntoView({block:'center', inline:'nearest'});
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter(
            r => r.width > 1 && r.height > 1);
        const visible = rects.filter(r => {
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            return x >= 0 && x < innerWidth && y >= 0 && y < innerHeight;
        });
        const id = el.id || el.tagName.toLowerCase();
        if (!visible.length) {
            unmeasurable++;
            issues.push({id, type:'not-in-viewport',
                text:el.textContent.trim().slice(0,60)});
            continue;
        }
        measured++;
        const dx = el.scrollWidth - el.clientWidth;
        const dy = el.scrollHeight - el.clientHeight;
        const isClipped = (dx > 2 && ['hidden','clip'].includes(css.overflowX)) ||
            (dy > 2 && ['hidden','clip'].includes(css.overflowY));
        const isCovered = !visible.some(r => {
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const hit = document.elementFromPoint(x,y);
            return hit && (hit === el || el.contains(hit));
        });
        if (isClipped) clipped++;
        if (isCovered) covered++;
        if (isClipped || isCovered)
            issues.push({id, type:isClipped?'clipped':'covered',
                text:el.textContent.trim().slice(0,60), dx, dy});
    }
    return {candidates:candidates.length, measured, clipped, covered,
        unmeasurable, runningAnimations:document.getAnimations().filter(
            a => a.playState === 'running').length,
        issues:issues.slice(0,12)};
}"""



# Wortweise Treffpunktpruefung: auch TEILWEISE Ueberdeckungen werden erkannt.
# Ein einzelner Treffer in der Mitte eines ganzen Absatzes reicht dafuer nicht.
PARTIAL_MEASURE = r"""(selector) => {
    const root = document.querySelector(selector);
    if (!root) throw Error('Teilueberdeckungs-Pruefbereich fehlt: ' + selector);
    const candidates = [...root.querySelectorAll('p,li,label,blockquote,figcaption')]
        .filter(el => !el.querySelector('p,li,label,blockquote,figcaption'));
    let inspected = 0, wordSamples = 0, partialCovered = 0, fullyCovered = 0;
    const issues = [];
    for (const el of candidates) {
        if (!el.textContent.trim()) continue;
        const css = getComputedStyle(el);
        if (css.display === 'none' || css.visibility !== 'visible' ||
            !el.getClientRects().length) continue;
        el.scrollIntoView({block:'center', inline:'nearest'});
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let visible = 0, covered = 0, node;
        while ((node = walker.nextNode())) {
            if (!node.textContent.trim()) continue;
            const parent = node.parentElement;
            if (!parent) continue;
            const style = getComputedStyle(parent);
            if (style.display === 'none' || style.visibility !== 'visible') continue;
            const words = /\S+/g;
            let match;
            while ((match = words.exec(node.textContent)) !== null) {
                const range = document.createRange();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + match[0].length);
                for (const rect of range.getClientRects()) {
                    if (rect.width < 2 || rect.height < 2) continue;
                    const y = rect.top + rect.height * 0.5;
                    for (const fraction of [0.25, 0.5, 0.75]) {
                        const x = rect.left + rect.width * fraction;
                        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight)
                            continue;
                        const hit = document.elementFromPoint(x, y);
                        if (hit && (hit === el || el.contains(hit))) visible++;
                        else covered++;
                    }
                }
            }
        }
        if (visible + covered === 0) continue;
        inspected++;
        wordSamples += visible + covered;
        if (visible && covered) partialCovered++;
        if (!visible && covered) fullyCovered++;
        if (covered) issues.push({
            id:el.id || el.tagName.toLowerCase(),
            text:el.textContent.trim().slice(0,70),
            visible, covered
        });
    }
    return {inspected, wordSamples, partialCovered, fullyCovered,
        issues:issues.slice(0,12)};
}"""


def audit(page, stage, results):
    # Vier zeitlich getrennte Stichproben statt zwei. Kein lueckenloser Film.
    for frame in range(1, 5):
        result = page.evaluate(FLOW_MEASURE, "#dialogContent")
        detail = page.evaluate(PARTIAL_MEASURE, "#dialogContent")
        check(stage + f": Frame {frame} ohne abgeschnittenen Fliesstext",
              result["clipped"] == 0)
        check(stage + f": Frame {frame} ohne vollstaendig verdeckten Fliesstext",
              result["covered"] == 0)
        check(stage + f": Frame {frame} ohne unmessbaren Fliesstext",
              result["unmeasurable"] == 0)
        check(stage + f": Frame {frame} ohne teilweise verdeckte Textwoerter",
              detail["partialCovered"] == 0 and detail["fullyCovered"] == 0)
        check(stage + f": Frame {frame} Wortstichproben vorhanden",
              detail["wordSamples"] > 0 if result["measured"] > 0 else True)
        results.append({"stage":stage, "frame":frame, **result,
                        "wordSamples":detail["wordSamples"],
                        "partialCovered":detail["partialCovered"],
                        "fullyCoveredWords":detail["fullyCovered"]})
        if frame < 4:
            page.wait_for_timeout(75)

def check_detector(page):
    page.set_content('<div id="probe"><p>Freier Text fuer den Kontrolltest</p></div>')
    clean = page.evaluate(FLOW_MEASURE, "#probe")
    check("Positivkontrolle: freier Fliesstext messbar",
          clean["measured"] == 1 and clean["covered"] == 0)

    page.set_content('<div id="probe"><p style="width:320px">'
                     'Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel'
                     '</p></div>')
    check("Wortprobe: freier Text ohne Teilueberdeckung",
          page.evaluate(PARTIAL_MEASURE, "#probe")["partialCovered"] == 0)
    page.evaluate("""() => {
        const p = document.querySelector('#probe p');
        const r = p.getBoundingClientRect();
        const cover = document.createElement('div');
        cover.style.cssText = 'position:fixed;z-index:2147483647;background:#111';
        cover.style.left = r.left + 'px';
        cover.style.top = r.top + 'px';
        cover.style.width = (r.width * .43) + 'px';
        cover.style.height = r.height + 'px';
        document.body.appendChild(cover);
    }""")
    partial = page.evaluate(PARTIAL_MEASURE, "#probe")
    check("Negativkontrolle: teilweise verdeckte Textwoerter erkannt",
          partial["partialCovered"] == 1 and partial["fullyCovered"] == 0)
    page.set_content('<div id="probe"><p>Freier Text fuer den Kontrolltest</p></div>')
    page.evaluate("""() => {
        const cover=document.createElement('div');
        cover.style.cssText='position:fixed;inset:0;z-index:9999;background:#111';
        document.body.appendChild(cover);
    }""")
    check("Negativkontrolle: echte Textueberdeckung wird erkannt",
          page.evaluate(FLOW_MEASURE, "#probe")["covered"] == 1)
    page.set_content('<div id="probe"><p style="width:20px;white-space:nowrap;overflow:hidden">Absichtlich abgeschnittener Kontrolltext</p></div>')
    check("Negativkontrolle: abgeschnittener Fliesstext wird erkannt",
          page.evaluate(FLOW_MEASURE, "#probe")["clipped"] == 1)


def new_page(context, preview, worker, factor, errors, external, fresh=True):
    page = context.new_page()
    page.set_default_timeout(15000)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: external.append(request.url)
            if request.url.startswith(("http://","https://")) else None)
    page.goto((preview / "index.html").as_uri(), wait_until="load")
    page.wait_for_function("typeof PPNavigation191 === 'object'")
    set_real_zoom(worker, page.url, 1.0)
    if fresh:
        start_fresh(page, str(round(factor * 100)) + "%")
        if page.locator("#dialog").evaluate("(d) => d.open"):
            # Das native close-Ereignis kommt nach dem Entfernen von open.
            # Erst danach darf die naechste Szene geoeffnet werden, sonst
            # kann der alte close-Handler active noch asynchron leeren.
            page.evaluate("""() => {
                window.__qaFreshCloseSeen = false;
                document.querySelector('#dialog').addEventListener(
                    'close', () => { window.__qaFreshCloseSeen = true; },
                    {once: true});
            }""")
            page.keyboard.press("Escape")
            page.wait_for_function("""() =>
                window.__qaFreshCloseSeen === true &&
                !document.querySelector('#dialog').open && active === ''""")
            check("Frischer Dialog nach echtem close-Ereignis geschlossen",
                  page.evaluate("window.__qaFreshCloseSeen === true"))
    zoom = set_real_zoom(worker, page.url, factor)
    check("Echter Chromium-Zoom " + str(round(factor * 100)) + "%",
          abs(zoom["factor"] - factor) < .01)
    page.wait_for_function("(f) => Math.abs(devicePixelRatio-f) < .1", arg=factor)
    check("CSS-Breite bei Zoom kleiner als 500", page.evaluate("innerWidth") < 500)
    return page


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-flow-zoom-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Technikvorschau gebaut",
              (preview / "index.html").is_file())
        extension = root / "extension"
        extension_at(extension)
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width":800, "height":600}, reduced_motion="no-preference",
                args=["--disable-extensions-except=" + str(extension),
                      "--load-extension=" + str(extension)])
            try:
                probe = context.new_page()
                check_detector(probe)
                probe.close()
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker", timeout=15000))
                check("Echte Zoom-Erweiterung aktiv",
                      worker.url.startswith("chrome-extension://"))
                summaries = []
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    errors, external, rows = [], [], []
                    page = new_page(context, preview, worker, factor, errors, external)
                    try:
                        before = state(page)
                        scenes = page.evaluate("PPNavigation191.getScenes()")
                        check(label + ": eindeutige Szenen", len(scenes) >= 35
                              and len(scenes) == len(set(scenes)))
                        for scene in scenes:
                            page.evaluate("(s) => PPNavigation191.open(s)", scene)
                            page.locator("#dialog").wait_for(state="visible")
                            audit(page, label + "/scene/" + scene, rows)
                        check(label + ": Szenenpruefung ohne Spielstandaenderung",
                              state(page) == before)
                        run_economy(page, label)
                        audit(page, label + "/monatsbericht-2", rows)
                        valid(page, label + ": Wirtschaftskern nach Bericht")
                    finally:
                        page.close()

                    arcade = new_page(context, preview, worker, factor, errors, external, fresh=False)
                    try:
                        # Neue, unabhaengige Partie; die Aktionen laufen per Tab/Enter.
                        # start() erzeugt das erschlossene Feld, nicht ein Test-Fake.
                        start(arcade, label + "/arcade")
                        pipe(arcade, label + "/arcade",
                             on_stage=lambda p, s: audit(p, label + "/" + s, rows))
                        audit(arcade, label + "/pipe-fertig", rows)
                        to_fire_month(arcade, label + "/arcade")
                        fire(arcade, label + "/arcade",
                             on_stage=lambda p, s: audit(p, label + "/" + s, rows))
                        audit(arcade, label + "/fire-fertig", rows)
                        valid(arcade, label + ": Wirtschaftskern nach Minispielen")
                    finally:
                        arcade.close()

                    check(label + ": keine JavaScript-Fehler", not errors)
                    check(label + ": keine externen HTTP-Anfragen", not external)
                    samples = sum(r["measured"] for r in rows)
                    check(label + ": Fliesstext in mehreren Spielphasen gemessen",
                          samples > 50)
                    summary = {"zoom_percent":round(factor*100),
                        "scenes":len(scenes), "sampled_frames":len(rows),
                        "flow_text_samples":samples,
                        "running_animation_observations":sum(
                            r["runningAnimations"] for r in rows),
                        "word_samples":sum(r["wordSamples"] for r in rows),
                        "partially_covered_text":sum(
                            r["partialCovered"] for r in rows),
                        "fully_covered_words":sum(
                            r["fullyCoveredWords"] for r in rows),
                        "clipped":sum(r["clipped"] for r in rows),
                        "covered":sum(r["covered"] for r in rows),
                        "unmeasurable":sum(r["unmeasurable"] for r in rows),
                        "release_gate":"BLOCKED"}
                    summaries.append(summary)
                    print("FLOW-ZOOM:", json.dumps(
                        summary, ensure_ascii=False), flush=True)
                check("Beide echten Zoomstufen geprueft",
                      [s["zoom_percent"] for s in summaries] == [175,200])
                print("GRENZE: Nur sichtbare p/li/label/blockquote/figcaption-"
                      "Textbereiche in vier Momentaufnahmen je Spielphase. "
                      "Kein Pixelvergleich und keine vollstaendige Animation, "
                      "Dialogaktion oder Endpartie. BED-03/BAR-01 BLOCKED.",
                      flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
