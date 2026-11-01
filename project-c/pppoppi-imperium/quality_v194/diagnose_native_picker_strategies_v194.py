#!/usr/bin/env python3
"""Diagnose nativer Chromium-Dateiauswahl bei echtem Tab-Zoom; KEIN Release-Gate."""
import json
from importlib.metadata import version
import os
import re
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import TimeoutError as PickerTimeout, sync_playwright
from test_browser_native_zoom_v194 import (
    extension_at, set_real_zoom, wait_for_zoom_worker,
)

from native_filechooser_v194 import prepare_filechooser

METHODS = ("showpicker", "inputclick", "direct")
ZOOMS = (1.75, 2.0)
REPETITIONS = int(os.environ.get("PPPOPPI_PICKER_REPETITIONS", "4"))
ACKNOWLEDGED = os.environ.get("PPPOPPI_PICKER_ACKNOWLEDGED", "0") == "1"
if not 1 <= REPETITIONS <= 12:
    raise ValueError("Diagnosewiederholungen muessen zwischen 1 und 12 liegen")
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
              "repetition": repeat, "acknowledgedInterception": ACKNOWLEDGED,
              "result": "FAIL", "error": None}
    print("PICKER_CASE " + json.dumps(result), file=sys.stderr, flush=True)
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
        result["actualZoom"] = actual["factor"]
        result["browserVersion"] = context.browser.version if context.browser else None
        selector = "#" + method
        target = page.locator(selector)
        if not target.is_visible() or not target.is_enabled():
            raise AssertionError("Dateiauswahl-Steuerung nicht sichtbar")
        target.focus()
        result["focusBeforeKey"] = target.evaluate(
            "(e) => document.activeElement === e")
        result["documentFocus"] = page.evaluate("document.hasFocus()")
        if ACKNOWLEDGED:
            prepare_filechooser(page)
            result["interceptionAcknowledgedBeforeKey"] = True
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


def summarize_protocol(text, payload):
    """Read-only classification; protocol ACK order is evidence, not release PASS."""
    chunks = re.split(r"^PICKER_CASE ", text, flags=re.MULTILINE)[1:]
    if len(chunks) != len(payload["results"]):
        raise ValueError("Protokoll und JSON haben unterschiedliche Versuchszahlen")
    rows = []
    for chunk, result in zip(chunks, payload["results"]):
        label, _, body = chunk.partition("\n")
        case = json.loads(label)
        for key in ("method", "zoomPercent", "repetition", "acknowledgedInterception"):
            if case[key] != result[key]:
                raise ValueError("Protokoll und JSON stimmen beim Versuch nicht ueberein")
        events = []
        pending = {}
        for line in body.splitlines():
            match = re.search(r"(SEND ►|◀ RECV) (\{.*\})$", line)
            if not match:
                continue
            message = json.loads(match[2])
            key = (message.get("sessionId"), message.get("id"))
            if match[1].startswith("SEND"):
                method = message.get("method")
                if method == "Page.setInterceptFileChooserDialog" and message["params"].get("enabled"):
                    pending[key] = "interceptionAck"
                    events.append("interceptionSend")
                elif method == "Input.dispatchKeyEvent" and message["params"].get("type") == "keyDown":
                    pending[key] = "keyAck"
                    events.append("keySend")
            elif key in pending:
                event = pending.pop(key)
                events.append(event + ("Error" if "error" in message else ""))
            elif message.get("method") == "Page.fileChooserOpened":
                events.append("rawFileChooser")
        ack = events.index("interceptionAck") if "interceptionAck" in events else None
        key_send = events.index("keySend") if "keySend" in events else None
        before = ack is not None and key_send is not None and key_send < ack
        if result["result"] == "PASS":
            classification = "PASS"
        elif "rawFileChooser" in events:
            classification = "RAW_EVENT_WITHOUT_PLAYWRIGHT_EVENT"
        elif before:
            classification = "ENTER_BEFORE_INTERCEPTION_ACK"
        else:
            classification = "UNEXPLAINED"
        rows.append({k: result[k] for k in (
            "method", "zoomPercent", "repetition", "acknowledgedInterception", "result")})
        rows[-1].update(events=events, enterBeforeAck=before,
                        classification=classification)
    return {"scope": "causal diagnostic only, no game/release proof",
            "headless": payload["headless"],
            "acknowledgedInterception": payload["acknowledgedInterception"],
            "total": len(rows), "failed": payload["failed"], "cases": rows}


def write_protocol_summary():
    report = summarize_protocol(
        Path("native_picker_protocol.log").read_text(encoding="utf-8"),
        json.loads(RESULT.read_text(encoding="utf-8")))
    Path("native_picker_causal_summary.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("CAUSAL_SUMMARY", json.dumps({
        "headless": report["headless"],
        "acknowledgedInterception": report["acknowledgedInterception"],
        "total": report["total"], "failed": report["failed"],
        "failedCases": [r for r in report["cases"] if r["result"] != "PASS"],
        "enterBeforeAck": sum(r["enterBeforeAck"] for r in report["cases"])
    }), flush=True)


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
            "playwrightVersion": version("playwright"),
            "acknowledgedInterception": ACKNOWLEDGED,
            "repetitions": REPETITIONS,
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
    if sys.argv[1:] == ["--summarize-protocol"]:
        write_protocol_summary()
    elif sys.argv[1:]:
        raise SystemExit("Unbekannte Diagnoseargumente")
    else:
        main()
