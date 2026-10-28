#!/usr/bin/env python3
"""Deterministische Animationsphasen unter echtem Chromium-Zoom pruefen.

Technischer Teilnachweis BED-03: zeitliche Stichproben, KEINE lueckenlose
Pixel-/Animations- oder Vorrelease-Abnahme. Originaldateien nur lesen.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from test_browser_native_zoom_v194 import wait_for_zoom_worker

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import check, state
from test_browser_native_zoom_flow_v194 import (
    FLOW_MEASURE, PARTIAL_MEASURE, check_detector, new_page,
)
from test_browser_native_zoom_v194 import extension_at

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)
PHASES = (0.125, 0.375, 0.625, 0.875, 1.125, 1.375, 1.625, 1.875)

PREPARE = r"""() => {
    const root = document.querySelector('#dialogContent');
    if (!root) throw Error('Dialoginhalt fehlt');
    const animations = document.getAnimations().filter(a => {
        if (!a.effect || !a.effect.target ||
            !root.contains(a.effect.target) || a.playState === 'idle')
            return false;
        const t = a.effect.getComputedTiming();
        return Number.isFinite(t.duration) && t.duration > 0 &&
            t.duration <= 30000;
    });
    window.__phaseAudit = animations.map(a => {
        const timing = a.effect.getComputedTiming();
        const record = {animation:a, time:a.currentTime,
            playState:a.playState, duration:timing.duration,
            cycles:timing.iterations === Infinity || timing.iterations >= 2};
        a.pause();
        return record;
    });
    return {eligible:animations.length,
        targets:animations.map(a => a.effect.target.tagName.toLowerCase())};
}"""

SEEK = r"""(phase) => {
    const items = window.__phaseAudit || [];
    for (const item of items) {
        const offset = item.cycles ? phase : (phase % 1);
        item.animation.currentTime = item.duration * offset;
    }
    return items.length;
}"""

RESTORE = r"""() => {
    const items = window.__phaseAudit || [];
    for (const item of items) {
        try {
            item.animation.currentTime = item.time;
            if (item.playState === 'running') item.animation.play();
            else if (item.playState === 'paused') item.animation.pause();
        } catch (_) {
            // Eine durch Navigation beendete Animation kann bereits entfallen.
        }
    }
    delete window.__phaseAudit;
}"""


def test_seek_control(page):
    page.set_content("""
        <style>@keyframes move {from {transform:translateX(0px)}
        to {transform:translateX(120px)}}</style>
        <div id="marker" style="animation:move 2s linear infinite alternate">
        Kontrollanimation</div>
    """)
    offsets = page.evaluate("""() => {
        const marker = document.querySelector('#marker');
        const animation = marker.getAnimations()[0];
        if (!animation) return null;
        animation.pause();
        animation.currentTime = 250;
        const a = marker.getBoundingClientRect().x;
        animation.currentTime = 1750;
        const b = marker.getBoundingClientRect().x;
        return [a,b];
    }""")
    check("Kontrollanimation: gezieltes Zeitversetzen aendert Geometrie",
          offsets is not None and offsets[1] - offsets[0] > 50)


def inspect_scene(page, scene, label):
    page.evaluate("(id) => PPNavigation191.open(id)", scene)
    page.locator("#dialog").wait_for(state="visible")
    info = page.evaluate(PREPARE)
    findings = []
    measurements = 0
    word_points = 0
    try:
        if not info["eligible"]:
            return {"animated":False, "animations":0, "samples":0,
                    "text":0, "words":0, "findings":[]}
        for phase in PHASES:
            count = page.evaluate(SEEK, phase)
            if count != info["eligible"]:
                raise AssertionError("Animationsliste unerwartet veraendert")
            flow = page.evaluate(FLOW_MEASURE, "#dialogContent")
            words = page.evaluate(PARTIAL_MEASURE, "#dialogContent")
            measurements += flow["measured"]
            word_points += words["wordSamples"]
            if (flow["clipped"] or flow["covered"] or flow["unmeasurable"] or
                    words["partialCovered"] or words["fullyCovered"]):
                findings.append({"phase":phase, "flow":flow, "words":words})
        check(label + "/" + scene + ": 8 Phasen ohne Textfehler",
              not findings)
        return {"animated":True, "animations":info["eligible"],
                "samples":len(PHASES), "text":measurements,
                "words":word_points, "findings":findings}
    finally:
        page.evaluate(RESTORE)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-animation-zoom-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Manifestgepruefte Offline-Vorschau gebaut",
              (preview / "index.html").is_file())
        extension_at(root / "extension")
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width":800, "height":600},
                reduced_motion="no-preference",
                args=["--disable-extensions-except=" + str(root / "extension"),
                      "--load-extension=" + str(root / "extension")])
            try:
                probe = context.new_page()
                check_detector(probe)
                test_seek_control(probe)
                probe.close()
                worker = wait_for_zoom_worker(context)
                check("Echte Chromium-Zoom-Erweiterung aktiv",
                      worker.url.startswith("chrome-extension://"))
                summaries = []
                for factor in ZOOMS:
                    errors, external = [], []
                    page = new_page(context, preview, worker, factor,
                                    errors, external)
                    try:
                        before = state(page)
                        scenes = page.evaluate("PPNavigation191.getScenes()")
                        check("Eindeutige 39 Spielszenen",
                              len(scenes) == 39 and len(set(scenes)) == 39)
                        records = [inspect_scene(page, s,
                                   str(round(factor*100)) + "%") for s in scenes]
                        check("Szenenwechsel ohne Wirtschaftsaenderung",
                              state(page) == before)
                        check("Keine JavaScript-Laufzeitfehler", not errors)
                        check("Keine externen HTTP-Anfragen", not external)
                        summary = {
                            "zoom_percent":round(factor*100),
                            "scenes":len(scenes),
                            "animated_scenes":sum(r["animated"] for r in records),
                            "eligible_animation_occurrences":sum(
                                r["animations"] for r in records),
                            "deterministic_phase_samples":sum(
                                r["samples"] for r in records),
                            "text_measurements":sum(r["text"] for r in records),
                            "word_hit_points":sum(r["words"] for r in records),
                            "errors":sum(len(r["findings"]) for r in records),
                            "release_gate":"BLOCKED"}
                        check("Animierte Szenen tatsaechlich gefunden",
                              summary["animated_scenes"] > 0 and
                              summary["eligible_animation_occurrences"] > 0)
                        check("Deterministische Phasen tatsaechlich geprueft",
                              summary["deterministic_phase_samples"] >= 8)
                        check("Animierte Textbereiche tatsaechlich gemessen",
                              summary["text_measurements"] > 0 and
                              summary["word_hit_points"] > 0)
                        check("Keine gemessenen Textfehler", summary["errors"] == 0)
                        summaries.append(summary)
                        print("ANIMATION-ZOOM:", json.dumps(
                            summary, ensure_ascii=False), flush=True)
                    finally:
                        page.close()
                check("Beide echten Zoomstufen erfasst",
                      [s["zoom_percent"] for s in summaries] == [175,200])
                print("GRENZE: Acht deterministische Phasen je animierter "
                      "Szene; alle dort erkannten Animationen zeitversetzt, "
                      "inklusive Rueckwaertsphase bei "
                      "alternierenden Mehrfachlaeufen. Kein lueckenloser "
                      "Pixelvergleich, keine vollstaendige Animation, "
                      "Dialogaktion oder Endpartie. BED-03 BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
