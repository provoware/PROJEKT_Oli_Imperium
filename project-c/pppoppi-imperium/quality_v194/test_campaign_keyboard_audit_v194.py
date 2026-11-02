"""Fail-closed isolated regressions for actual Tab navigation evidence."""
from unittest import TestCase, main
from unittest.mock import Mock

from campaign_keyboard_audit_v194 import tab_to_target, press_tab_focused


class TabReachabilityTests(TestCase):
    def setUp(self):
        self.page = Mock()
        self.target = self.page.locator.return_value
        self.target.count.return_value = 1
        self.target.is_visible.return_value = True
        self.target.is_enabled.return_value = True

    def test_reaches_target_after_three_real_tabs(self):
        self.target.evaluate.side_effect = [False, False, True]
        self.assertEqual(tab_to_target(self.page, "#startGame", max_tabs=4), 3)
        self.assertEqual(self.page.keyboard.press.call_count, 3)
        self.page.keyboard.press.assert_called_with("Tab")
        self.target.focus.assert_not_called()

    def test_unreachable_target_fails_instead_of_forcing_focus(self):
        self.target.evaluate.return_value = False
        with self.assertRaisesRegex(AssertionError, "nicht erreichbar"):
            tab_to_target(self.page, "#startGame", max_tabs=3)
        self.assertEqual(self.page.keyboard.press.call_count, 3)
        self.target.focus.assert_not_called()

    def test_hidden_or_disabled_target_fails_before_keyboard(self):
        for attr in ("is_visible", "is_enabled"):
            with self.subTest(attr=attr):
                getattr(self.target, attr).return_value = False
                with self.assertRaisesRegex(AssertionError, "nicht eindeutig"):
                    tab_to_target(self.page, "#startGame")
                getattr(self.target, attr).return_value = True
        self.page.keyboard.press.assert_not_called()

    def test_duplicate_target_fails_before_keyboard(self):
        self.target.count.return_value = 2
        with self.assertRaises(AssertionError):
            tab_to_target(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_invalid_budget_rejected(self):
        for limit in (0, -1, 201, True, 1.5):
            with self.subTest(limit=limit), self.assertRaises(ValueError):
                tab_to_target(self.page, "#startGame", max_tabs=limit)
        self.page.keyboard.press.assert_not_called()

    def test_real_tab_focus_activates_with_keyboard_enter(self):
        self.target.evaluate.side_effect = [True, True, {"inViewport": True, "unobstructed": True}, True, True]
        press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_called_once_with("Enter")
        self.target.focus.assert_not_called()
        self.target.press.assert_not_called()

    def test_activation_rejects_missing_keyboard_focus(self):
        self.target.evaluate.return_value = False
        with self.assertRaisesRegex(AssertionError, "ohne echten Tastaturfokus"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_activation_rejects_missing_visible_focus_ring(self):
        self.target.evaluate.side_effect = [True, False]
        with self.assertRaisesRegex(AssertionError, "ohne sichtbaren Fokus"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_activation_rejects_disabled_control(self):
        self.target.is_enabled.return_value = False
        with self.assertRaisesRegex(AssertionError, "nicht eindeutig"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()


    def test_activation_rejects_offscreen_target(self):
        offscreen = {"inViewport": False, "unobstructed": False}
        self.target.evaluate.side_effect = [True, True, offscreen, offscreen]
        with self.assertRaisesRegex(AssertionError, "nicht nutzbar im Browserfenster"):
            press_tab_focused(self.page, "#startGame")
        self.page.wait_for_function.assert_called_once()
        self.page.keyboard.press.assert_not_called()

    def test_natural_tab_scroll_can_finish_before_enter(self):
        offscreen = {"inViewport": False, "unobstructed": False}
        visible = {"inViewport": True, "unobstructed": True}
        self.target.evaluate.side_effect = [True, True, offscreen, visible, True, True]
        press_tab_focused(self.page, "#startGame")
        self.page.wait_for_function.assert_called_once()
        args, kwargs = self.page.wait_for_function.call_args
        self.assertIn("document.activeElement !== el", args[0])
        self.assertEqual(kwargs["arg"], "#startGame")
        self.assertEqual(kwargs["timeout"], 3000)
        self.page.keyboard.press.assert_called_once_with("Enter")
        self.target.focus.assert_not_called()
        self.target.press.assert_not_called()

    def test_scroll_timeout_still_blocks_offscreen_activation(self):
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        offscreen = {"inViewport": False, "unobstructed": False}
        self.target.evaluate.side_effect = [True, True, offscreen, offscreen]
        self.page.wait_for_function.side_effect = PlaywrightTimeoutError("Timeout 3000ms")
        with self.assertRaisesRegex(AssertionError, "nicht nutzbar im Browserfenster"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_activation_rejects_obscured_target(self):
        self.target.evaluate.side_effect = [True, True, {"inViewport": True, "unobstructed": False}]
        with self.assertRaisesRegex(AssertionError, "verdeckt"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_activation_rejects_unexpected_hit_test_result(self):
        for invalid in (None, True, {}, {"inViewport": 1, "unobstructed": True}):
            with self.subTest(result=invalid):
                self.target.evaluate.side_effect = [True, True, invalid]
                with self.assertRaisesRegex(AssertionError, "nicht nutzbar im Browserfenster"):
                    press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()


    def test_activation_rejects_focus_stolen_after_geometry(self):
        self.target.evaluate.side_effect = [
            True, True, {"inViewport": True, "unobstructed": True}, False
        ]
        with self.assertRaisesRegex(AssertionError, "Fokus nach Sichtbarkeitspruefung verloren"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

    def test_activation_rejects_focus_ring_lost_after_geometry(self):
        self.target.evaluate.side_effect = [
            True, True, {"inViewport": True, "unobstructed": True}, True, False
        ]
        with self.assertRaisesRegex(AssertionError, "sichtbarer Fokus nach Sichtbarkeitspruefung verloren"):
            press_tab_focused(self.page, "#startGame")
        self.page.keyboard.press.assert_not_called()

if __name__ == "__main__":
    main()
