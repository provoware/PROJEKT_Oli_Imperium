#!/usr/bin/env python3
"""Rohrnetz und Feuerwehr: echte Tab-/Enter-Eingaben im Offline-Chromium.

Nur V1.9.4-Technikvorschau. Die Szenenwahl bleibt API-gesteuert; sämtliche
Spiel-, Rohrdreh-, Lösch-, Monats- und Exportaktionen erfolgen per Tastatur.
Keine Änderungen an Originalquellen, echten Spielständen oder main.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
MODES = (("800x600", 800, 600), ("CSS-200", 400, 300))
PIPE_PATHS = (
    ((0, 1), (1, 1), (2, 1), (2, 0), (3, 0), (4, 0)),
    ((0, 2), (1, 2), (1, 1), (2, 1), (3, 1), (3, 0), (4, 0)),
    ((0, 0), (1, 0), (1, 1), (2, 1), (2, 2), (3, 2), (4, 2)),
)
FIRE_CHOICES = ("VENTIL", "KUEHLEN", "SCHAUM")


def check(label, passed):
    print(("PASS: " if passed else "FAIL: ") + label, flush=True)
    if not passed:
        raise AssertionError(label)


def tab_to(page, selector, max_tabs=180):
    item = page.locator(selector)
    if item.count() != 1 or not item.is_visible() or not item.is_enabled():
        return False
    for _ in range(max_tabs + 1):
        if item.evaluate("(el) => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def activate(page, selector, label):
    check(label + ": per Tab erreichbar", tab_to(page, selector))
    check(label + ": Fokus sichtbar",
          page.evaluate("document.activeElement.matches(':focus-visible')"))
    page.keyboard.press("Enter")


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def valid(page, label):
    check(label + ": Wirtschaftskern gültig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)


def start(page, label):
    activate(page, "#startGame", label + ": Spielstart")
    page.locator("#econMode").wait_for(state="visible")
    activate(page, '[data-ui="newgame"]', label + ": neue Partie")
    page.wait_for_function("NeoEconomy.getState() !== null")
    check(label + ": aktive Partie", state(page)["phase"] == "TURN")
    for action in ("SURVEY", "BUY", "DRILL"):
        page.evaluate("NeoEconomy.open('claim')")
        activate(page, f'[data-econ="{action}"][data-claim="{CLAIM}"]',
                 label + ": " + action)
        valid(page, label + ": " + action)
    check(label + ": eigenes gebohrtes Feld",
          state(page)["claims"][CLAIM]["owner"] == "H1"
          and state(page)["claims"][CLAIM]["drilled"])


def pipe(page, label):
    page.evaluate("NeoEconomy.open('pipeline')")
    activate(page, f'[data-econ="PIPE_START"][data-claim="{CLAIM}"]',
             label + ": Rohrnetz starten")
    check(label + ": Rohrnetz aktiv", state(page)["minigame"]["kind"] == "PIPE")
    rotations = 0
    for stage, cells in enumerate(PIPE_PATHS):
        check(label + f": Rohrabschnitt {stage+1} aktiv",
              state(page)["minigame"]["stage"] == stage)
        check(label + ": richtige Zahl sichtbarer Rohrstücke",
              page.locator('[data-arcade="rotate"]').count() == len(cells))
        for index, (x, y) in enumerate(cells):
            selector = f'[data-arcade="rotate"][data-cell="{x}-{y}"]'
            check(label + f": Rohr {x}-{y} per Tab",
                  tab_to(page, selector))
            check(label + f": Rohr {x}-{y} Fokus sichtbar",
                  page.evaluate("document.activeElement.matches(':focus-visible')"))
            # Unabhängige Sollfolge aus der dokumentierten Spielmechanik:
            # jedes Rohrstück wird auf seine Ausgangsrichtung 0 gedreht.
            turns = (4 - ((index * 3 + stage + 1) % 4)) % 4
            before = state(page)
            for _ in range(turns):
                activate(page, selector, label + f": Rohr {x}-{y} drehen")
                rotations += 1
            after = state(page)
            check(label + ": Drehen bucht weder Geld noch Spieltage",
                  after == before)
        activate(page, '[data-arcade="pipe-check"]',
                 label + f": Rohrabschnitt {stage+1} prüfen")
        after = state(page)
        valid(page, label + f": Rohrabschnitt {stage+1}")
        if stage < 2:
            check(label + ": nächster Rohrabschnitt",
                  after["minigame"] is not None
                  and after["minigame"]["stage"] == stage + 1)
        else:
            check(label + ": Rohrnetz regulär fertig",
                  after["minigame"] is None and after["claims"][CLAIM]["pipeline"])
    return rotations


def to_fire_month(page, label):
    # V0.8.2-Regel: beim Übergang auf Monat 4 brennt das alphabetisch
    # erste erschlossene Feld. BERLIN-1 wurde regulär erschlossen.
    for month in (1, 2, 3):
        check(label + f": Monat {month} vor Abschluss", state(page)["month"] == month)
        page.evaluate("NeoEconomy.open('calendar')")
        activate(page, '[data-econ="END_TURN"]',
                 label + f": Monat {month} abschließen")
        check(label + ": regulärer Monatsbericht",
              state(page)["phase"] == "REPORT")
        activate(page, '[data-econ="NEXT_MONTH"]',
                 label + f": Monat {month+1} beginnen")
        valid(page, label + ": Monatswechsel")
    current = state(page)
    check(label + ": natürlicher Brand in Monat vier",
          current["month"] == 4
          and current["claims"][CLAIM]["burning"]
          and any(e["type"] == "BRAND" and e.get("claimId") == CLAIM
                  for e in current["events"]))


def fire(page, label):
    page.evaluate("NeoEconomy.open('workshop')")
    activate(page, f'[data-econ="FIRE_START"][data-claim="{CLAIM}"]',
             label + ": Feuerwehreinsatz starten")
    check(label + ": Feuerwehr aktiv", state(page)["minigame"]["kind"] == "FIRE")
    # Ein absichtlicher Fehler prüft die Fehlversuch-Begrenzung, ohne
    # manipulierte Spielstände oder direkten Zugriff auf den Spielkern.
    before_wrong = state(page)
    activate(page, '[data-arcade="fire"][data-choice="SCHAUM"]',
             label + ": falsche Erstmaßnahme")
    after_wrong = state(page)
    check(label + ": Fehler bleibt in Abschnitt eins",
          after_wrong["minigame"] is not None
          and after_wrong["minigame"]["stage"] == 0
          and after_wrong["minigame"]["attempts"] == 1)
    check(label + ": Fehlversuch ohne erneute Startkosten",
          after_wrong["companies"][0]["cashCent"]
          == before_wrong["companies"][0]["cashCent"])
    for stage, choice in enumerate(FIRE_CHOICES):
        check(label + f": Löschabschnitt {stage+1} aktiv",
              state(page)["minigame"]["stage"] == stage)
        check(label + ": drei beschriftete Löschaktionen",
              page.locator('[data-arcade="fire"]').count() == 3)
        activate(page, f'[data-arcade="fire"][data-choice="{choice}"]',
                 label + f": Löschabschnitt {stage+1}")
        after = state(page)
        valid(page, label + f": Löschabschnitt {stage+1}")
        if stage < 2:
            check(label + ": nächste Löschphase",
                  after["minigame"] is not None
                  and after["minigame"]["stage"] == stage + 1)
        else:
            check(label + ": Brand gelöscht, Rohrnetz erhalten",
                  after["minigame"] is None
                  and not after["claims"][CLAIM]["burning"]
                  and not after["claims"][CLAIM]["damaged"]
                  and after["claims"][CLAIM]["pipeline"])


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-pipe-fire-") as tmp:
        preview = Path(tmp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Geschützte Quellen nur in temporäre Vorschau gebaut",
              (preview / "index.html").is_file())
        results = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, width, height in MODES:
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        accept_downloads=True, reduced_motion="reduce")
                    errors, external = [], []
                    try:
                        page = context.new_page()
                        page.set_default_timeout(12000)
                        page.on("pageerror", lambda err: errors.append(str(err)))
                        page.on("request", lambda req: external.append(req.url)
                                if req.url.startswith(("http://", "https://")) else None)
                        page.goto((preview / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof NeoEconomy === 'object'")
                        start(page, label)
                        rotations = pipe(page, label)
                        to_fire_month(page, label)
                        fire(page, label)
                        before_export = state(page)
                        activate(page, "#closeBtn", label + ": Dialog schließen")
                        with page.expect_download() as download_info:
                            activate(page, "#saveGame", label + ": JSON exportieren")
                        exported = json.loads(
                            Path(download_info.value.path()).read_text(encoding="utf-8"))
                        check(label + ": Export erhält alle Spiel- und Brandereignisse",
                              exported == before_export)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen Anfragen", not external)
                        results.append({"viewport": [width, height],
                                        "pipe_stages": 3, "pipe_rotations": rotations,
                                        "fire_stages": 3, "fire_wrong_choices": 1,
                                        "months": 4, "export_equal": True,
                                        "native_zoom": "NOT_TESTED"})
                        print("PIPE-FIRE-KEYBOARD:",
                              json.dumps(results[-1], ensure_ascii=False), flush=True)
                    finally:
                        context.close()
            finally:
                browser.close()
        print("ERGEBNIS:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Nur Rohrnetz und Feuerwehr. Weitere Dialogaktionen, "
              "nativer Zoom, Fokuskontrast und reguläres Spielende BLOCKED.",
              flush=True)


if __name__ == "__main__":
    main()
