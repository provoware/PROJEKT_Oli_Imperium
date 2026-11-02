"""Optional real keyboard-driven Chromium file chooser for isolated campaigns.

The existing direct-input test remains a separate, explicitly named path.
A failed native chooser must fail the test; no fallback or retry is allowed.
"""
from native_filechooser_v194 import ready_filechooser


def import_saved_session(page, filename, *, native=False, focus_by_tab=None):
    if not native:
        page.locator("#loadSessionFile").set_input_files(str(filename))
        return "DIRECT_INPUT"

    # A fresh process has no active game. Create a disposable local game so
    # that the actual session-import control can be reached by keyboard.
    page.on("dialog", lambda dialog: dialog.accept())
    start = page.locator("#startGame")
    if start.count() != 1 or not start.is_visible() or not start.is_enabled():
        raise AssertionError("Startschalter fuer nativen Import nicht bedienbar")
    if focus_by_tab is None:
        start.focus()
    else:
        focus_by_tab(page, "#startGame")
    start.press("Enter")
    page.locator("#econMode").select_option("4-0")
    page.get_by_label("Spielart", exact=True).select_option("campaign:12")
    new_game = page.locator('#dialogContent [data-ui="newgame"]')
    if new_game.count() != 1 or not new_game.is_visible() or not new_game.is_enabled():
        raise AssertionError("Neue Testpartie nicht bedienbar")
    if focus_by_tab is None:
        new_game.focus()
    else:
        focus_by_tab(page, '#dialogContent [data-ui="newgame"]')
    new_game.press("Enter")
    if page.evaluate("NeoEconomy.getState() === null"):
        raise AssertionError("Testpartie vor nativem Import fehlt")
    page.evaluate("NeoEconomy.open('computer')")
    button = page.locator('#dialogContent [data-ui="session-import"]')
    if button.count() != 1 or not button.is_visible() or not button.is_enabled():
        raise AssertionError("Nativer Sitzungimport-Schalter nicht bedienbar")
    if focus_by_tab is None:
        button.focus()
    else:
        focus_by_tab(page, '#dialogContent [data-ui="session-import"]')
    if not button.evaluate("(el) => document.activeElement === el"):
        raise AssertionError("Sitzungsimport ohne Tastaturfokus")
    with ready_filechooser(page, timeout=8000) as pending:
        page.keyboard.press("Enter")
    if pending.value is None:
        raise AssertionError("Kein nativer Datei-Auswahldialog")
    pending.value.set_files(str(filename))
    return "NATIVE_FILECHOOSER"


def require_two_imports(import_paths, *, native):
    """Require two independent imports through the declared path; never fall back."""
    expected = "NATIVE_FILECHOOSER" if native else "DIRECT_INPUT"
    if import_paths != [expected, expected]:
        raise AssertionError(
            "Zwei unabhaengige Sitzungsimporte erforderlich: "
            f"erwartet {[expected, expected]!r}, erhalten {import_paths!r}"
        )
    return expected
