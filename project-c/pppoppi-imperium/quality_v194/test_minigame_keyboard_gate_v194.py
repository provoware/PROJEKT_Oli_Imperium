"""Negativtests: Bohr-, Rohr- und Feuerwehraktionen nur mit strengem Tastatur-Gate."""
import importlib
from contextlib import nullcontext
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


class DrillPressureSliderTests(unittest.TestCase):
    """Negativtests fuer echten Tab-Fokus am Bohrdruckregler."""

    def run_slider(self, reachable=True, ring_error=None, geometry_error=None,
                   focus_results=(True, True)):
        module = importlib.import_module("test_browser_keyboard_drill_v194")
        page = Mock()
        target = page.locator.return_value
        target.evaluate.side_effect = list(focus_results)
        with patch("test_browser_keyboard_drill_v194.tab_to", return_value=reachable) as tab, \
             patch("test_browser_keyboard_drill_v194.assert_computed_focus_indicator") as ring, \
             patch("test_browser_keyboard_drill_v194.assert_unobstructed_keyboard_target") as geometry:
            if ring_error:
                ring.side_effect = AssertionError(ring_error)
            if geometry_error:
                geometry.side_effect = AssertionError(geometry_error)
            expected_fail = not reachable or bool(ring_error or geometry_error) or not all(focus_results)
            with self.assertRaises(AssertionError) if expected_fail else nullcontext():
                module.assert_pressure_keyboard_ready(page, "Druckregler")
            return page, tab, ring, geometry

    def test_success_checks_ring_geometry_and_focus_without_keypress(self):
        page, tab, ring, geometry = self.run_slider()
        tab.assert_called_once_with(page, "#skillPressure")
        ring.assert_called_once_with(page.locator.return_value, "#skillPressure")
        geometry.assert_called_once_with(page.locator.return_value, "#skillPressure", page)
        page.keyboard.press.assert_not_called()

    def test_unreachable_slider_blocks_before_ring(self):
        _, _, ring, geometry = self.run_slider(reachable=False)
        ring.assert_not_called()
        geometry.assert_not_called()

    def test_missing_ring_blocks_geometry_and_keys(self):
        page, _, ring, geometry = self.run_slider(ring_error="CSS-Ring fehlt")
        ring.assert_called_once()
        geometry.assert_not_called()
        page.keyboard.press.assert_not_called()

    def test_occluded_slider_blocks_keyboard(self):
        page, _, ring, geometry = self.run_slider(geometry_error="Regler verdeckt")
        ring.assert_called_once()
        geometry.assert_called_once()
        page.keyboard.press.assert_not_called()

    def test_focus_lost_after_geometry_blocks_keyboard(self):
        page, _, ring, geometry = self.run_slider(focus_results=(True, False))
        ring.assert_called_once()
        geometry.assert_called_once()
        page.keyboard.press.assert_not_called()


if __name__ == "__main__":
    unittest.main()
