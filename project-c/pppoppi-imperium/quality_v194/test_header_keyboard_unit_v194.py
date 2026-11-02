"""Fail-closed unit tests for the new header keyboard evidence."""
import unittest
from unittest.mock import Mock, patch

from test_browser_header_keyboard_v194 import require_toggle_change, keyboard_activate, run


class HeaderKeyboardTests(unittest.TestCase):
    def test_toggle_accepts_both_directions(self):
        require_toggle_change("false", "true", "#zonesBtn")
        require_toggle_change("true", "false", "#soundBtn")

    def test_toggle_rejects_no_change(self):
        for state in ("true", "false"):
            with self.subTest(state=state), self.assertRaisesRegex(AssertionError, "nicht umgeschaltet"):
                require_toggle_change(state, state, "#zonesBtn")

    def test_toggle_rejects_missing_or_malformed_state(self):
        for before, after in ((None, "true"), ("false", None),
                              ("1", "true"), ("false", "TRUE")):
            with self.subTest(before=before, after=after), self.assertRaisesRegex(AssertionError, "Ungueltiger"):
                require_toggle_change(before, after, "#soundBtn")

    def test_keyboard_path_never_uses_locator_focus(self):
        page = Mock()
        with patch("test_browser_header_keyboard_v194.tab_to_target", return_value=7) as tab, \
             patch("test_browser_header_keyboard_v194.verify_reverse_tab_roundtrip") as reverse, \
             patch("test_browser_header_keyboard_v194.assert_computed_focus_indicator") as ring, \
             patch("test_browser_header_keyboard_v194.press_tab_focused") as enter:
            self.assertEqual(keyboard_activate(page, "#helpBtn"), 7)
            tab.assert_called_once_with(page, "#helpBtn")
            reverse.assert_called_once_with(page, "#helpBtn")
            ring.assert_called_once_with(page.locator.return_value, "#helpBtn")
            enter.assert_called_once_with(page, "#helpBtn")
            page.locator.return_value.focus.assert_not_called()

    def test_keyboard_failure_does_not_activate(self):
        page = Mock()
        with patch("test_browser_header_keyboard_v194.tab_to_target", side_effect=AssertionError("nicht erreichbar")), \
             patch("test_browser_header_keyboard_v194.press_tab_focused") as enter:
            with self.assertRaisesRegex(AssertionError, "nicht erreichbar"):
                keyboard_activate(page, "#helpBtn")
            enter.assert_not_called()

    def test_rejects_unplanned_zoom(self):
        for value in (100, 150, 201):
            with self.subTest(zoom=value), self.assertRaises(ValueError):
                run(value)


if __name__ == "__main__":
    unittest.main()
