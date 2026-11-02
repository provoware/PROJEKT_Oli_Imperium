"""Keyboard-only Tab reachability audit for long Chromium campaigns.

This is an additional assertion, not a replacement for the existing Enter
actions. A direct locator.focus() is deliberately forbidden in this audit.
"""

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


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



def assert_unobstructed_keyboard_target(target, selector, page):
    """Read-only hit test: focus must be on a usable viewport target, not under an overlay."""
    result = target.evaluate("""(el) => {
        const rect = el.getBoundingClientRect();
        const left = Math.max(0, rect.left);
        const top = Math.max(0, rect.top);
        const right = Math.min(window.innerWidth, rect.right);
        const bottom = Math.min(window.innerHeight, rect.bottom);
        if (!Number.isFinite(left + top + right + bottom) ||
            right - left < 2 || bottom - top < 2) {
            return {inViewport: false, unobstructed: false};
        }
        const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
        return {inViewport: true,
                unobstructed: !!hit && (hit === el || el.contains(hit))};
    }""")
    # The source page uses smooth scrolling. A real Tab can focus a button
    # before Chromium finishes scrolling it into the 800x600 zoomed viewport.
    # Wait for natural browser scrolling only; never focus/scroll via script.
    if isinstance(result, dict) and result.get("inViewport") is False:
        try:
            page.wait_for_function("""(selector) => {
                const el = document.querySelector(selector);
                if (!el || document.activeElement !== el) return false;
                const r = el.getBoundingClientRect();
                const l = Math.max(0, r.left), t = Math.max(0, r.top);
                const right = Math.min(innerWidth, r.right);
                const bottom = Math.min(innerHeight, r.bottom);
                if (!Number.isFinite(l + t + right + bottom) ||
                    right - l < 2 || bottom - t < 2) return false;
                const hit = document.elementFromPoint(
                    (l + right) / 2, (t + bottom) / 2);
                return !!hit && (hit === el || el.contains(hit));
            }""", arg=selector, timeout=3000)
        except PlaywrightTimeoutError:
            pass  # Preserve the strict failure below, with actual geometry.
        result = target.evaluate("""(el) => {
            const r = el.getBoundingClientRect();
            const l = Math.max(0, r.left), t = Math.max(0, r.top);
            const right = Math.min(innerWidth, r.right);
            const bottom = Math.min(innerHeight, r.bottom);
            const valid = Number.isFinite(l + t + right + bottom) &&
                          right - l >= 2 && bottom - t >= 2;
            const hit = valid ? document.elementFromPoint(
                (l + right) / 2, (t + bottom) / 2) : null;
            return {inViewport: valid,
                    unobstructed: !!hit && (hit === el || el.contains(hit)),
                    rectTop: Math.round(r.top), rectBottom: Math.round(r.bottom),
                    viewportHeight: innerHeight, scrollY: Math.round(scrollY)};
        }""")
    if not isinstance(result, dict) or result.get("inViewport") is not True:
        raise AssertionError("Tab-Ziel nicht nutzbar im Browserfenster: " +
                             selector + " " + repr(result))
    if result.get("unobstructed") is not True:
        raise AssertionError("Tab-Ziel durch anderes Element verdeckt: " +
                             selector + " " + repr(result))


def assert_computed_focus_indicator(target, selector):
    """Require an actual CSS focus marker, not only the :focus-visible pseudo-class."""
    evidence = target.evaluate("""(el) => {
        const style = getComputedStyle(el);
        const outline = style.outlineStyle !== 'none' &&
            Number.parseFloat(style.outlineWidth) > 0 &&
            !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.outlineColor);
        const shadow = style.boxShadow !== 'none' && style.boxShadow !== '';
        return {focusVisible: el.matches(':focus-visible'),
                ring: Boolean(outline || shadow)};
    }""")
    if (not isinstance(evidence, dict) or
            evidence.get("focusVisible") is not True or
            evidence.get("ring") is not True):
        raise AssertionError(
            "Tab-Aktivierung ohne sichtbare CSS-Fokusmarkierung: " +
            selector + " " + repr(evidence))


def press_tab_focused(page, selector):
    """Activate only a real Tab-focused, visibly focused and unobstructed control."""
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        raise AssertionError("Tab-Aktivierung nicht eindeutig bedienbar: " + selector)
    if not target.evaluate("(el) => document.activeElement === el"):
        raise AssertionError("Tab-Aktivierung ohne echten Tastaturfokus: " + selector)
    if not target.evaluate("(el) => el.matches(':focus-visible')"):
        raise AssertionError("Tab-Aktivierung ohne sichtbaren Fokus: " + selector)
    assert_unobstructed_keyboard_target(target, selector, page)
    # Smooth scrolling or a dialog can move focus during the geometry check.
    # Recheck immediately before Enter to avoid activating a different control.
    if not target.evaluate("(el) => document.activeElement === el"):
        raise AssertionError("Tab-Aktivierung: Fokus nach Sichtbarkeitspruefung verloren: " + selector)
    if not target.evaluate("(el) => el.matches(':focus-visible')"):
        raise AssertionError("Tab-Aktivierung: sichtbarer Fokus nach Sichtbarkeitspruefung verloren: " + selector)
    assert_computed_focus_indicator(target, selector)
    page.keyboard.press("Enter")
