#!/usr/bin/env python3
"""Sitzungsbedienung mit echten Tasten bei nativem Chromium-Tab-Zoom.

Prueft 175/200 %, 800x600, versionierten Export/Import, Fokus und Spielschutz.
Keine persoenliche Sichtabnahme und kein Nachweis vollstaendiger Endpartien.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, sync_playwright
from test_browser_native_zoom_v194 import (
    extension_at, set_real_zoom, tab_to, wait_for_zoom_worker,
)

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def keyboard_button(page, selector, label):
    button = page.locator(selector)
    check(label + ": genau ein sichtbarer Schalter",
          button.count() == 1 and button.is_visible() and button.is_enabled())
    check(label + ": mit Tab erreichbar", tab_to(page, selector))
    check(label + ": sichtbarer Tastaturfokus",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    rect = button.bounding_box()
    viewport = page.evaluate("({width: innerWidth, height: innerHeight})")
    check(label + ": nach Tab nicht horizontal abgeschnitten",
          bool(rect and rect["x"] >= -2
               and rect["x"] + rect["width"] <= viewport["width"] + 2))
    return button


def isolated_filechooser_control(page):
    """Nur NACH einem FAIL: prueft einen unabhaengigen nativen Picker.

    Keine Wiederholung des Spiel-Imports und kein direktes Setzen einer Datei.
    Ein erfolgreicher Kontroll-Picker macht den urspruenglichen Fehler nicht gruen.
    """
    try:
        page.evaluate("""() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = '__pickerControlInput';
            input.hidden = true;
            const button = document.createElement('button');
            button.type = 'button';
            button.id = '__pickerControlButton';
            button.textContent = 'Native picker diagnostic';
            button.addEventListener('click', () => input.showPicker());
            document.body.append(input, button);
        }""")
        page.locator('#__pickerControlButton').focus()
        try:
            with page.expect_file_chooser(timeout=2500):
                page.keyboard.press('Enter')
            return 'OPENED_AFTER_ORIGINAL_FAILURE'
        except PlaywrightTimeoutError:
            # Zweiter, wirklich unabhängiger Kontrollpfad: ein sichtbares
            # natives Datei-Eingabefeld (ohne hidden und ohne showPicker).
            # Auch dessen Erfolg darf den fehlgeschlagenen Spielimport
            # niemals ersetzen oder das Haupttestergebnis gruen setzen.
            try:
                page.evaluate("""() => {
                    const visible = document.createElement('input');
                    visible.type = 'file';
                    visible.id = '__pickerVisibleControl';
                    visible.setAttribute('aria-label', 'Sichtbarer Datei-Kontrollpicker');
                    visible.style.cssText = (
                        'position:fixed;left:8px;top:8px;z-index:2147483647;' +
                        'display:block;opacity:1;pointer-events:auto;'
                    );
                    document.body.appendChild(visible);
                }""")
                page.locator('#__pickerVisibleControl').focus()
                focused = page.evaluate(
                    "document.activeElement?.id === '__pickerVisibleControl'")
                try:
                    with page.expect_file_chooser(timeout=2500):
                        page.keyboard.press('Enter')
                    outcome = 'OPENED_ON_VISIBLE_NATIVE_INPUT'
                except PlaywrightTimeoutError:
                    outcome = 'NO_FILECHOOSER_ON_VISIBLE_NATIVE_INPUT'
                return {'hidden_control': 'NO_FILECHOOSER_ON_INDEPENDENT_CONTROL',
                        'visible_control': outcome, 'visible_focused': focused}
            except Exception as error:
                return {'hidden_control': 'NO_FILECHOOSER_ON_INDEPENDENT_CONTROL',
                        'visible_control': 'CONTROL_ERROR: ' +
                        type(error).__name__ + ': ' + str(error)[:160]}
            finally:
                page.evaluate(
                    "document.getElementById('__pickerVisibleControl')?.remove()")
    except Exception as error:
        return 'CONTROL_ERROR: ' + type(error).__name__ + ': ' + str(error)[:160]
    finally:
        page.evaluate("""() => {
            document.getElementById('__pickerControlButton')?.remove();
            document.getElementById('__pickerControlInput')?.remove();
        }""")


def audit_session(page, worker, zoom, download_dir):
    label = str(round(zoom * 100)) + "%"
    errors, external = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: external.append(request.url)
            if request.url.startswith(("http://", "https://")) else None)
    page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
    # Chromium kann die Zoomstufe einer file://-Seite fuer neue Tabs merken.
    # Vor jeder Messung auf 100 % zuruecksetzen, damit 200 % nicht
    # versehentlich relativ zur vorherigen 175-%-Stufe geprueft werden.
    reset = set_real_zoom(worker, page.url, 1.0)
    check(label + ": Ausgangszoom 100 %", abs(reset["factor"] - 1.0) < 0.01)
    page.wait_for_function("innerWidth >= 790")
    baseline = page.evaluate("({width: innerWidth, dpr: devicePixelRatio})")
    check(label + ": 800 CSS-Pixel vor Zoom", baseline["width"] >= 790)
    actual = set_real_zoom(worker, page.url, zoom)
    check(label + ": chrome.tabs.getZoom bestaetigt echten Tab-Zoom",
          abs(actual["factor"] - zoom) < 0.01)
    page.wait_for_function(
        "({factor, dpr}) => devicePixelRatio >= dpr * (factor - 0.05)",
        arg={"factor": zoom, "dpr": baseline["dpr"]})
    check(label + ": Zoom reduziert CSS-Breite",
          page.evaluate("innerWidth") < baseline["width"] * 0.65)

    keyboard_button(page, "#startGame", label + "/Start").press("Enter")
    mode = page.get_by_label("Spielart", exact=True)
    check(label + ": Spielart beschriftet und sichtbar",
          mode.count() == 1 and mode.is_visible())
    mode.focus()
    mode.press("ArrowDown")
    check(label + ": Kampagne mit Pfeiltaste gewaehlt",
          mode.input_value() == "campaign:12")
    keyboard_button(page, '#dialogContent [data-ui="newgame"]',
                    label + "/Neue Partie").press("Enter")
    page.wait_for_function(
        "NeoEconomy.endstate.status()==='active' && "
        "NeoEconomy.endstate.contract().months===12")
    original = page.evaluate("JSON.stringify(NeoEconomy.getState())")

    keyboard_button(page, '#dialogContent [data-ui="session-export"]',
                    label + "/Export").scroll_into_view_if_needed()
    with page.expect_download() as pending:
        page.keyboard.press("Enter")
    saved = download_dir / ("session-" + label + ".json")
    pending.value.save_as(saved)
    payload = json.loads(saved.read_text(encoding="utf-8"))
    check(label + ": versionierter Sitzungsexport",
          payload["schema"] == "pppoppi.endstate.session.proposal/1"
          and payload["contract"]["months"] == 12)

    # Andere Partie starten; nur der anschliessende Import darf sie ersetzen.
    page.evaluate("NeoEconomy.open('startup')")
    page.get_by_label("Spielart", exact=True).select_option("campaign:24")
    keyboard_button(page, '#dialogContent [data-ui="newgame"]',
                    label + "/Neustart").press("Enter")
    check(label + ": vor Import andere Kampagne aktiv",
          page.evaluate("NeoEconomy.endstate.contract().months") == 24)
    page.on("dialog", lambda dialog: dialog.accept())
    keyboard_button(page, '#dialogContent [data-ui="session-import"]',
                    label + "/Import")
    page.evaluate("""() => {
        window.__sessionImportClicks = 0;
        window.__sessionFileInputClicks = 0;
        window.__sessionInputActivation = null;
        window.__sessionInputTrusted = null;
        // Diagnose ausschliesslich im Test: erfasst den echten nativen
        // Picker-Aufruf und aktive Benutzergeste, ohne Fehler zu umgehen.
        const picker = document.getElementById('loadSessionFile');
        const nativePicker = picker.showPicker;
        window.__nativePickerProbe = {
            calls: 0, activation: null, returned: false,
            error: null, buttonTrusted: null, buttonActivation: null
        };
        if (typeof nativePicker === 'function') {
            picker.showPicker = function(...args) {
                const probe = window.__nativePickerProbe;
                probe.calls++;
                probe.activation = navigator.userActivation?.isActive ?? null;
                try {
                    const result = nativePicker.apply(this, args);
                    probe.returned = true;
                    return result;
                } catch(error) {
                    probe.error = error.name + ': ' + error.message;
                    throw error;
                }
            };
        }
        document.querySelector('[data-ui="session-import"]').addEventListener(
            'click', event => {
                window.__nativePickerProbe.buttonTrusted = event.isTrusted;
                window.__nativePickerProbe.buttonActivation =
                    navigator.userActivation?.isActive ?? null;
            }, {capture: true, once: true});
        picker.addEventListener('click', event => {
            window.__sessionFileInputClicks++;
            window.__sessionInputActivation = navigator.userActivation?.isActive ?? null;
            window.__sessionInputTrusted = event.isTrusted;
        }, {once: true});
        document.querySelector('[data-ui="session-import"]').addEventListener(
            'click', () => { window.__sessionImportClicks++; }, {once: true});
    }""")
    # Das Ereignis vor dem Tastendruck abonnieren und wirklich abwarten.
    # Die alte 200-ms-Wartezeit konnte bei Chromium-Zoom zu frueh enden.
    # Kein direkter Eingabefeld-Ersatz: ohne nativen Dateidialog FAIL.
    try:
        with page.expect_file_chooser(timeout=5000) as chooser_event:
            page.keyboard.press("Enter")
    except PlaywrightTimeoutError:
        # Strikter Fehler: keine direkte Befuellung des Datei-Inputs und
        # kein zweiter Tastendruck, der einen echten Bedienfehler verdeckt.
        diagnostics = page.evaluate("""() => {
            const button = document.querySelector('[data-ui="session-import"]');
            const focused = document.activeElement;
            const inputs = [...document.querySelectorAll('input[type="file"]')];
            return {
                clicks: window.__sessionImportClicks,
                fileInputClicks: window.__sessionFileInputClicks,
                nativeShowPickerAvailable: typeof document.getElementById('loadSessionFile').showPicker === 'function',
                userActivationAtInputClick: window.__sessionInputActivation,
                inputClickTrusted: window.__sessionInputTrusted,
                nativePickerProbe: window.__nativePickerProbe,
                toast: document.querySelector('#toast')?.textContent?.slice(0, 200),
                focusOnImport: focused === button,
                focusedTag: focused?.tagName || null,
                dialogOpen: document.querySelector('#dialog')?.open,
                documentHasFocus: document.hasFocus(),
                visibilityState: document.visibilityState,
                activationAfterTimeout: navigator.userActivation?.isActive ?? null,
                fileInputs: inputs.map(input => ({
                    id: input.id,
                    connected: input.isConnected,
                    disabled: input.disabled,
                    hidden: input.hidden,
                    display: getComputedStyle(input).display,
                    files: input.files?.length ?? null
                }))
            };
        }""")
        # Diagnose erst NACH dem echten Fehler. Selbst ein erfolgreicher
        # Kontroll-Picker darf den fehlgeschlagenen Import niemals ersetzen.
        diagnostics["independentPickerControl"] = isolated_filechooser_control(page)
        print("SESSION-FILECHOOSER-FAIL:", json.dumps(
            {"zoom_percent": round(zoom * 100), **diagnostics},
            ensure_ascii=False), flush=True)
        raise
    page.wait_for_function("window.__sessionImportClicks === 1")
    check(label + ": Import-Schalter reagiert auf echte Enter-Taste",
          page.evaluate("window.__sessionImportClicks") == 1)
    check(label + ": nativer Datei-Picker statt kuenstlichem Input-Klick",
          page.evaluate("typeof document.getElementById('loadSessionFile').showPicker === 'function' && window.__sessionFileInputClicks === 0"))
    check(label + ": Datei-Auswahldialog durch Enter geoeffnet",
          chooser_event.value is not None)
    chooser_event.value.set_files(str(saved))
    chooser_status = "PASS"
    page.wait_for_function(
        "NeoEconomy.endstate.contract().months===12 && "
        "document.querySelector('#toast').textContent.includes("
        "'Versionierte Sitzung geprueft')")
    check(label + ": importierter Spielstand identisch",
          page.evaluate("JSON.stringify(NeoEconomy.getState())") == original)
    check(label + ": importierter Vertrag aktiv",
          page.evaluate("NeoEconomy.endstate.status()") == "active")
    check(label + ": Wirtschaftskern nach Import gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())"))
    check(label + ": keine JavaScript-Laufzeitfehler", not errors)
    check(label + ": Offline-Dateistart ohne Netzanforderung", not external)
    return {"zoom_percent": round(zoom * 100), "native_zoom": True,
            "keyboard_export_import": "PASS", "filechooser": chooser_status,
            "session_restored": True,
            "full_endgame": "NOT_TESTED"}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-session-zoom-") as temp:
        root = Path(temp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 hashgepruefte Originaldateien", info["sourceFiles"] == 110)
        extension = root / "zoom-extension"
        extension_at(extension)
        with sync_playwright() as playwright:
            results = []
            # Drei voneinander unabhaengige Messpaare auf demselben Commit.
            # Jeder Versuch startet einen neuen Chromium-Prozess mit eigenem
            # Profil. Ein fehlgeschlagener Versuch wird NICHT wiederholt
            # oder durch spaetere Erfolge verdeckt: sofort FAIL.
            for trial, zoom in enumerate(ZOOMS * 3, 1):
                label = str(round(zoom * 100))
                context = playwright.chromium.launch_persistent_context(
                    str(root / ("profile-" + label + "-" + str(trial))), channel="chromium",
                    headless=True, viewport={"width": 800, "height": 600},
                    reduced_motion="reduce",
                    accept_downloads=True,
                    args=["--disable-extensions-except=" + str(extension),
                          "--load-extension=" + str(extension)])
                try:
                    worker = wait_for_zoom_worker(context)
                    page = context.new_page()
                    try:
                        page.set_default_timeout(15000)
                        page.goto((preview / "index.html").as_uri(),
                                  wait_until="load")
                        results.append({"trial": trial, **audit_session(page, worker, zoom, root)})
                    finally:
                        page.close()
                finally:
                    context.close()
            check("Sechs unabhaengige native Zoom-Messungen erfolgreich",
                  [r["zoom_percent"] for r in results] == [175, 200] * 3)
            print("SESSION-NATIVE-ZOOM:",
                  json.dumps(results, ensure_ascii=False), flush=True)
            print("GRENZE: technische Teilpruefung; keine Endpartie, "
                  "keine Nutzerabnahme, kein Release.", flush=True)


if __name__ == "__main__":
    main()
