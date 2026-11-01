#!/usr/bin/env python3
"""Diagnose nativer Chromium-Dateiauswahl bei echtem Tab-Zoom; KEIN Release-Gate."""
import json
import os
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import TimeoutError as PickerTimeout, sync_playwright
from test_browser_native_zoom_v194 import (
    extension_at, set_real_zoom, wait_for_zoom_worker,
)

METHODS = ("showpicker", "inputclick", "direct")
ZOOMS = (1.75, 2.0)
REPETITIONS = 4
RESULT = Path("native_picker_diagnostic.json")
HTML = """<!doctype html><html lang="de"><meta charset="utf-8">
<title>Dateiauswahl-Diagnose</title>
<button id="showpicker" type="button">showPicker</button>
<button id="inputclick" type="button">Input click</button>
<input id="direct" type="file" aria-label="Direkte Dateiauswahl">
<input id="hiddenFile" type="file" hidden>
<script>
window.pickerTrace={method:null,clicked:false,activated:null,returned:false,error:null};
document.querySelector('#showpicker').addEventListener('click',event=>{
 const t=window.pickerTrace;t.method='showpicker';
 t.clicked=event.isTrusted;t.activated=navigator.userActivation?.isActive??null;
 try{document.querySelector('#hiddenFile').showPicker();t.returned=true;}
 catch(e){t.error=e.name+': '+e.message;throw e;}
});
document.querySelector('#inputclick').addEventListener('click',event=>{
 const t=window.pickerTrace;t.method='inputclick';
 t.clicked=event.isTrusted;t.activated=navigator.userActivation?.isActive??null;
 try{document.querySelector('#hiddenFile').click();t.returned=true;}
 catch(e){t.error=e.name+': '+e.message;throw e;}
});
document.querySelector('#direct').addEventListener('click',event=>{
 const t=window.pickerTrace;t.method='direct';
 t.clicked=event.isTrusted;t.activated=navigator.userActivation?.isActive??null;
 t.returned=true;
});
</script></html>"""


def one(pw, root, fixture, method, zoom, repeat):
    directory = root / ("profile-" + method + "-" + str(int(zoom * 100))
                        + "-" + str(repeat))
    result = {"method": method, "zoomPercent": round(zoom * 100),
              "repetition": repeat, "result": "FAIL", "error": None}
    context = None
    try:
        extension = root / "zoom-extension"
        context = pw.chromium.launch_persistent_context(
            str(directory), channel="chromium", headless=os.environ.get("PPPOPPI_PICKER_HEADLESS", "1") != "0",
            viewport={"width": 800, "height": 600},
            reduced_motion="reduce",
            args=["--disable-extensions-except=" + str(extension),
                  "--load-extension=" + str(extension)])
        worker = wait_for_zoom_worker(context)
        page = context.new_page()
        page.goto(fixture.as_uri(), wait_until="load")
        set_real_zoom(worker, page.url, 1.0)
        actual = set_real_zoom(worker, page.url, zoom)
        if abs(actual["factor"] - zoom) > 0.01:
            raise AssertionError("Echter Chrome-Tab-Zoom nicht aktiv")
        selector = "#" + method
        target = page.locator(selector)
        if not target.is_visible() or not target.is_enabled():
            raise AssertionError("Dateiauswahl-Steuerung nicht sichtbar")
        target.focus()
        result["focusBeforeKey"] = target.evaluate(
            "(e) => document.activeElement === e")
        result["documentFocus"] = page.evaluate("document.hasFocus()")
        try:
            # Only authentic keyboard input; never silently set input files.
            with page.expect_file_chooser(timeout=5000) as event:
                page.keyboard.press("Enter")
            result["filechooserElementId"] = (
                event.value.element.get_attribute("id"))
            result["result"] = "PASS"
        except PickerTimeout as error:
            result["error"] = "PLAYWRIGHT_FILECHOOSER_TIMEOUT: " + str(error)[:130]
        result["eventTrace"] = page.evaluate("window.pickerTrace")
        result["visible"] = page.evaluate("document.visibilityState")
    except Exception as error:
        result["error"] = type(error).__name__ + ": " + str(error)[:260]
    finally:
        if context is not None:
            context.close()
    print(json.dumps(result, ensure_ascii=False), flush=True)
    return result


def main():
    results = []
    try:
        with tempfile.TemporaryDirectory(prefix="pppoppi-picker-a-b-") as temp:
            root = Path(temp)
            fixture = root / "picker-diagnostic.html"
            fixture.write_text(HTML, encoding="utf-8")
            extension_at(root / "zoom-extension")
            with sync_playwright() as pw:
                for method in METHODS:
                    for zoom in ZOOMS:
                        for rep in range(1, REPETITIONS + 1):
                            results.append(one(pw, root, fixture, method, zoom, rep))
    finally:
        failed = [r for r in results if r["result"] != "PASS"]
        payload = {
            "schema": "pppoppi.native-picker-diagnostic/1",
            "scope": "Chromium automation control only; NOT the game or release proof",
            "headless": os.environ.get("PPPOPPI_PICKER_HEADLESS", "1") != "0",
            "total": len(results), "passed": len(results) - len(failed),
            "failed": len(failed), "results": results,
            "releaseGate": "BLOCKED"
        }
        RESULT.write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                          encoding="utf-8")
        print("PICKER-A-B-SUMMARY", json.dumps(
            {k: payload[k] for k in ("total", "passed", "failed", "releaseGate")}),
            flush=True)
    # A failed control is never converted to a green test or silently retried.
    if len(results) != len(METHODS) * len(ZOOMS) * REPETITIONS or failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
