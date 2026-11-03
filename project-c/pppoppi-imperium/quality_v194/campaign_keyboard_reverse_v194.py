"""Fail-closed Shift+Tab/Tab round-trip audit for an already Tab-focused control.

No focus() or DOM mutations: only real keyboard input and read-only assertions.
"""


def verify_reverse_tab_roundtrip(page, selector):
    """Prove backwards navigation and return to the same visible control."""
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        raise AssertionError("Rueckwaerts-Tab-Ziel nicht eindeutig bedienbar: " + selector)
    focused = "(el) => document.activeElement === el"
    if not target.evaluate(focused):
        raise AssertionError("Rueckwaerts-Tab ohne echten Ausgangsfokus: " + selector)
    page.keyboard.press("Shift+Tab")
    if target.evaluate(focused):
        raise AssertionError("Shift+Tab hat Fokus nicht verlassen: " + selector)
    page.keyboard.press("Tab")
    if not target.evaluate(focused):
        raise AssertionError("Tab kehrt nicht zum Ziel zurueck: " + selector)
    if not target.evaluate("(el) => el.matches(':focus-visible')"):
        raise AssertionError("Rueckkehr ohne sichtbaren Tastaturfokus: " + selector)
