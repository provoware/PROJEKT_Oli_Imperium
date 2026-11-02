"""Negativtests: Bohr-, Rohr- und Feuerwehraktionen nur mit strengem Tastatur-Gate."""
import importlib
import unittest
from unittest.mock import Mock, patch


class KeyboardGateContract:
    MODULE = None
    SELECTOR = '[data-arcade="pipe-check"]'

    def run_action(self, *, reachable=True, focus_visible=True,
                   ring_error=None, enter_error=None):
        module = importlib.import_module(self.MODULE)
        page = Mock()
        page.evaluate.return_value = focus_visible
        with patch(self.MODULE + ".tab_to", return_value=reachable) as tab, \
             patch(self.MODULE + ".assert_computed_focus_indicator") as ring, \
             patch(self.MODULE + ".press_tab_focused") as enter:
            if ring_error:
                ring.side_effect = AssertionError(ring_error)
            if enter_error:
                enter.side_effect = AssertionError(enter_error)
            error = None
            try:
                module.activate(page, self.SELECTOR, "Minispiel")
            except AssertionError as exc:
                error = str(exc)
            return page, tab, ring, enter, error

    def test_strict_path_without_synthetic_focus(self):
        page, tab, ring, enter, error = self.run_action()
        self.assertIsNone(error)
        tab.assert_called_once_with(page, self.SELECTOR)
        ring.assert_called_once_with(page.locator.return_value, self.SELECTOR)
        enter.assert_called_once_with(page, self.SELECTOR)
        page.locator.return_value.focus.assert_not_called()
        page.locator.return_value.click.assert_not_called()
        page.keyboard.press.assert_not_called()

    def test_unreachable_target_blocks_enter(self):
        _, _, ring, enter, error = self.run_action(reachable=False)
        self.assertIn("Tab erreichbar", error)
        ring.assert_not_called()
        enter.assert_not_called()

    def test_missing_focus_visible_blocks_enter(self):
        _, _, ring, enter, error = self.run_action(focus_visible=False)
        self.assertIn("Tastaturfokus", error) if "drill" in self.MODULE else self.assertIn("Fokus sichtbar", error)
        ring.assert_not_called()
        enter.assert_not_called()

    def test_missing_computed_ring_blocks_enter(self):
        _, _, ring, enter, error = self.run_action(ring_error="CSS-Fokus fehlt")
        self.assertIn("CSS-Fokus fehlt", error)
        ring.assert_called_once()
        enter.assert_not_called()

    def test_occlusion_or_focus_loss_blocks_activation(self):
        page, _, _, enter, error = self.run_action(enter_error="Ziel verdeckt / Fokus verloren")
        self.assertIn("Ziel verdeckt", error)
        enter.assert_called_once()
        page.keyboard.press.assert_not_called()


class PipeFireKeyboardGateTests(KeyboardGateContract, unittest.TestCase):
    MODULE = "test_browser_keyboard_pipe_fire_v194"


class DrillKeyboardGateTests(KeyboardGateContract, unittest.TestCase):
    MODULE = "test_browser_keyboard_drill_v194"
    SELECTOR = '[data-arcade="drill-check"]'


if __name__ == "__main__":
    unittest.main()
