"""Deterministic fail-closed regressions for real reverse keyboard traversal."""
from unittest import TestCase, main
from unittest.mock import Mock, call
from campaign_keyboard_reverse_v194 import verify_reverse_tab_roundtrip


class ReverseTabTests(TestCase):
    def setUp(self):
        self.page = Mock()
        self.target = self.page.locator.return_value
        self.target.count.return_value = 1
        self.target.is_visible.return_value = True
        self.target.is_enabled.return_value = True

    def test_reverse_then_forward_restores_visible_focus(self):
        self.target.evaluate.side_effect = [True, False, True, True]
        verify_reverse_tab_roundtrip(self.page, '#startGame')
        self.page.keyboard.press.assert_has_calls([call('Shift+Tab'), call('Tab')])
        self.assertEqual(self.page.keyboard.press.call_count, 2)
        self.target.focus.assert_not_called()
        self.target.press.assert_not_called()

    def test_missing_initial_focus_fails_without_keyboard(self):
        self.target.evaluate.return_value = False
        with self.assertRaisesRegex(AssertionError, 'Ausgangsfokus'):
            verify_reverse_tab_roundtrip(self.page, '#startGame')
        self.page.keyboard.press.assert_not_called()

    def test_reverse_must_leave_target(self):
        self.target.evaluate.side_effect = [True, True]
        with self.assertRaisesRegex(AssertionError, 'nicht verlassen'):
            verify_reverse_tab_roundtrip(self.page, '#startGame')
        self.page.keyboard.press.assert_called_once_with('Shift+Tab')

    def test_forward_must_restore_target(self):
        self.target.evaluate.side_effect = [True, False, False]
        with self.assertRaisesRegex(AssertionError, 'kehrt nicht'):
            verify_reverse_tab_roundtrip(self.page, '#startGame')
        self.assertEqual(self.page.keyboard.press.call_count, 2)

    def test_return_requires_visible_focus(self):
        self.target.evaluate.side_effect = [True, False, True, False]
        with self.assertRaisesRegex(AssertionError, 'sichtbaren Tastaturfokus'):
            verify_reverse_tab_roundtrip(self.page, '#startGame')

    def test_hidden_disabled_duplicate_targets_fail_before_keyboard(self):
        for attr, value in [('is_visible', False), ('is_enabled', False), ('count', 2)]:
            with self.subTest(attr=attr):
                method = getattr(self.target, attr)
                original = method.return_value
                method.return_value = value
                with self.assertRaisesRegex(AssertionError, 'nicht eindeutig'):
                    verify_reverse_tab_roundtrip(self.page, '#startGame')
                method.return_value = original
        self.page.keyboard.press.assert_not_called()


if __name__ == '__main__':
    main()
