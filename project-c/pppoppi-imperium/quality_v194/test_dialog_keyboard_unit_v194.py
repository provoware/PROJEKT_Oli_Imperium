"""Negativtests: Wirtschaftsaktionen nie ohne echte Tastatur- und Fokuspruefung."""
import unittest
from unittest.mock import Mock, patch

from test_browser_dialog_action_matrix_v194 import activate_dialog_keyboard

SELECTOR = '#dialogContent [data-qa-matrix-target="yes"]'
MODULE = "test_browser_dialog_action_matrix_v194."


class DialogKeyboardTests(unittest.TestCase):
    def test_real_keyboard_path_and_no_synthetic_focus(self):
        page = Mock()
        with patch(MODULE + "tab_to", return_value=True) as tab, \
             patch(MODULE + "verify_reverse_tab_roundtrip") as reverse, \
             patch(MODULE + "assert_computed_focus_indicator") as ring, \
             patch(MODULE + "press_tab_focused") as enter:
            activate_dialog_keyboard(page, SELECTOR, "SURVEY")
            tab.assert_called_once_with(page, SELECTOR, max_tabs=300)
            reverse.assert_called_once_with(page, SELECTOR)
            ring.assert_called_once_with(page.locator.return_value, SELECTOR)
            enter.assert_called_once_with(page, SELECTOR)
            page.locator.return_value.focus.assert_not_called()
            page.locator.return_value.click.assert_not_called()

    def test_unreachable_control_blocks_enter(self):
        page = Mock()
        with patch(MODULE + "tab_to", return_value=False), \
             patch(MODULE + "verify_reverse_tab_roundtrip") as reverse, \
             patch(MODULE + "press_tab_focused") as enter:
            with self.assertRaisesRegex(AssertionError, "per Tab erreichbar"):
                activate_dialog_keyboard(page, SELECTOR, "DRILL")
            reverse.assert_not_called()
            enter.assert_not_called()

    def test_reverse_tab_failure_blocks_enter(self):
        page = Mock()
        with patch(MODULE + "tab_to", return_value=True), \
             patch(MODULE + "verify_reverse_tab_roundtrip",
                   side_effect=AssertionError("Rueckweg fehlt")), \
             patch(MODULE + "press_tab_focused") as enter:
            with self.assertRaisesRegex(AssertionError, "Rueckweg fehlt"):
                activate_dialog_keyboard(page, SELECTOR, "PIPE_START")
            enter.assert_not_called()

    def test_missing_computed_focus_ring_blocks_enter(self):
        page = Mock()
        with patch(MODULE + "tab_to", return_value=True), \
             patch(MODULE + "verify_reverse_tab_roundtrip"), \
             patch(MODULE + "assert_computed_focus_indicator",
                   side_effect=AssertionError("CSS-Ring fehlt")), \
             patch(MODULE + "press_tab_focused") as enter:
            with self.assertRaisesRegex(AssertionError, "CSS-Ring fehlt"):
                activate_dialog_keyboard(page, SELECTOR, "SURVEY")
            enter.assert_not_called()

    def test_obstructed_target_is_rejected_by_shared_enter_gate(self):
        page = Mock()
        with patch(MODULE + "tab_to", return_value=True), \
             patch(MODULE + "verify_reverse_tab_roundtrip"), \
             patch(MODULE + "assert_computed_focus_indicator"), \
             patch(MODULE + "press_tab_focused",
                   side_effect=AssertionError("Ziel verdeckt")) as enter:
            with self.assertRaisesRegex(AssertionError, "Ziel verdeckt"):
                activate_dialog_keyboard(page, SELECTOR, "END_TURN")
            enter.assert_called_once_with(page, SELECTOR)
            page.keyboard.press.assert_not_called()


if __name__ == "__main__":
    unittest.main()
