"""Fail-closed regression tests for the optional real file-chooser path."""
from contextlib import contextmanager
from types import SimpleNamespace
from unittest import TestCase, main
from unittest.mock import Mock, patch

from campaign_native_import_v194 import import_saved_session, require_two_imports


class NativeImportTests(TestCase):
    def setUp(self):
        self.page = Mock()
        self.page.locator.return_value.count.return_value = 1
        self.page.locator.return_value.is_visible.return_value = True
        self.page.locator.return_value.is_enabled.return_value = True
        self.page.locator.return_value.evaluate.return_value = True
        self.page.evaluate.return_value = False
        self.files = Mock()

    def test_direct_path_is_explicit_and_never_uses_chooser(self):
        with patch("campaign_native_import_v194.ready_filechooser") as chooser:
            result = import_saved_session(self.page, "save.json")
        self.assertEqual(result, "DIRECT_INPUT")
        self.page.locator.return_value.set_input_files.assert_called_once_with("save.json")
        chooser.assert_not_called()
        self.page.keyboard.press.assert_not_called()

    def test_native_path_uses_one_keyboard_chooser(self):
        @contextmanager
        def chooser(_page, timeout):
            self.assertEqual(timeout, 8000)
            yield SimpleNamespace(value=self.files)
        with patch("campaign_native_import_v194.ready_filechooser", chooser):
            result = import_saved_session(self.page, "save.json", native=True)
        self.assertEqual(result, "NATIVE_FILECHOOSER")
        self.page.keyboard.press.assert_called_once_with("Enter")
        self.files.set_files.assert_called_once_with("save.json")
        self.page.locator.return_value.set_input_files.assert_not_called()

    def test_tab_audit_used_for_all_three_import_controls(self):
        calls = []
        @contextmanager
        def chooser(_page, timeout):
            yield SimpleNamespace(value=self.files)
        def focus_by_tab(page, selector):
            self.assertIs(page, self.page)
            calls.append(selector)
        with patch("campaign_native_import_v194.ready_filechooser", chooser):
            self.assertEqual(import_saved_session(
                self.page, "save.json", native=True,
                focus_by_tab=focus_by_tab), "NATIVE_FILECHOOSER")
        self.assertEqual(calls, [
            "#startGame",
            '#dialogContent [data-ui="newgame"]',
            '#dialogContent [data-ui="session-import"]',
        ])
        self.page.locator.return_value.focus.assert_not_called()

    def test_missing_chooser_fails_without_fallback(self):
        @contextmanager
        def chooser(_page, timeout):
            yield SimpleNamespace(value=None)
        with patch("campaign_native_import_v194.ready_filechooser", chooser):
            with self.assertRaisesRegex(AssertionError, "Kein nativer"):
                import_saved_session(self.page, "save.json", native=True)
        self.page.locator.return_value.set_input_files.assert_not_called()

    def test_chooser_exception_propagates_without_retry(self):
        calls = []
        @contextmanager
        def chooser(_page, timeout):
            calls.append(timeout)
            raise TimeoutError("Dateidialog blieb aus")
            yield
        with patch("campaign_native_import_v194.ready_filechooser", chooser):
            with self.assertRaises(TimeoutError):
                import_saved_session(self.page, "save.json", native=True)
        self.assertEqual(calls, [8000])
        self.page.locator.return_value.set_input_files.assert_not_called()

    def test_missing_keyboard_focus_fails_before_chooser(self):
        self.page.locator.return_value.evaluate.return_value = False
        with patch("campaign_native_import_v194.ready_filechooser") as chooser:
            with self.assertRaisesRegex(AssertionError, "Tastaturfokus"):
                import_saved_session(self.page, "save.json", native=True)
        chooser.assert_not_called()
        self.page.keyboard.press.assert_not_called()


class ImportEvidenceTests(TestCase):
    def test_two_native_imports_are_required(self):
        self.assertEqual(require_two_imports(
            ["NATIVE_FILECHOOSER", "NATIVE_FILECHOOSER"], native=True),
            "NATIVE_FILECHOOSER")
        for paths in ([], ["NATIVE_FILECHOOSER"],
                      ["NATIVE_FILECHOOSER", "DIRECT_INPUT"],
                      ["NATIVE_FILECHOOSER", "NATIVE_FILECHOOSER", "NATIVE_FILECHOOSER"]):
            with self.subTest(paths=paths), self.assertRaises(AssertionError):
                require_two_imports(paths, native=True)

    def test_direct_path_cannot_be_misreported_as_native(self):
        self.assertEqual(require_two_imports(
            ["DIRECT_INPUT", "DIRECT_INPUT"], native=False), "DIRECT_INPUT")
        with self.assertRaises(AssertionError):
            require_two_imports(["DIRECT_INPUT", "NATIVE_FILECHOOSER"], native=False)


if __name__ == "__main__":
    main()
