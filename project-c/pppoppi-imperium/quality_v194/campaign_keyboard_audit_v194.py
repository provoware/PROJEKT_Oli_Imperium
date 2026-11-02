"""Keyboard-only Tab reachability audit for long Chromium campaigns.

This is an additional assertion, not a replacement for the existing Enter
actions. A direct locator.focus() is deliberately forbidden in this audit.
"""


def tab_to_target(page, selector, *, max_tabs=120):
    """Find one visible enabled control by actual keyboard Tab presses."""
    if not isinstance(max_tabs, int) or isinstance(max_tabs, bool) or not 1 <= max_tabs <= 200:
        raise ValueError("Ungueltige maximale Tab-Anzahl")
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        raise AssertionError("Tab-Ziel nicht eindeutig sichtbar und bedienbar: " + selector)
    for step in range(1, max_tabs + 1):
        page.keyboard.press("Tab")
        if target.evaluate("(el) => document.activeElement === el"):
            return step
    raise AssertionError(
        f"Tab-Ziel nach {max_tabs} Tastendruecken nicht erreichbar: {selector}"
    )



def press_tab_focused(page, selector):
    """Activate only a real Tab-focused, visibly focused control with Enter."""
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        raise AssertionError("Tab-Aktivierung nicht eindeutig bedienbar: " + selector)
    if not target.evaluate("(el) => document.activeElement === el"):
        raise AssertionError("Tab-Aktivierung ohne echten Tastaturfokus: " + selector)
    if not target.evaluate("(el) => el.matches(':focus-visible')"):
        raise AssertionError("Tab-Aktivierung ohne sichtbaren Fokus: " + selector)
    page.keyboard.press("Enter")
