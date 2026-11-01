"""Guard and lifecycle tests; real delayed-SDK checks are separate evidence."""
import asyncio
from contextlib import contextmanager
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from native_filechooser_v194 import (
    FileChooserReadinessError, prepare_filechooser, ready_filechooser,
)


class PageDouble:
    def __init__(self):
        self.handlers = []
        self.acknowledged = False
        self.send_count = 0
        self.closed = False
        self.fail_ack = False
        self._impl_obj = SimpleNamespace(
            _channel=SimpleNamespace(send=self.send),
            listeners=lambda event: list(self.handlers))

    async def send(self, method, metadata, params):
        self.send_count += 1
        await asyncio.sleep(.002)
        if self.fail_ack:
            raise RuntimeError("injected ACK failure")
        self.acknowledged = True

    def _sync(self, coroutine):
        return asyncio.run(coroutine)

    def is_closed(self):
        return self.closed

    def on(self, event, handler):
        if not self.acknowledged:
            raise AssertionError("Observer registered before ACK")
        self.handlers.append(handler)

    @contextmanager
    def expect_file_chooser(self, timeout):
        if not self.acknowledged:
            raise AssertionError("Input waiter exposed before ACK")
        transient = object()
        self.handlers.append(transient)
        try:
            yield SimpleNamespace(value=None)
        finally:
            self.handlers.remove(transient)


@patch('native_filechooser_v194.version', return_value='1.56.0')
class ReadinessTests(unittest.TestCase):
    def test_ack_precedes_observer_and_input_and_survives_two_waiters(self, _version):
        page = PageDouble()
        for _ in range(2):
            with ready_filechooser(page):
                self.assertTrue(page.acknowledged)
                self.assertEqual(len(page.handlers), 2)
            self.assertEqual(len(page.handlers), 1)
        self.assertEqual(page.send_count, 1)

    def test_failed_ack_never_exposes_input(self, _version):
        page = PageDouble();page.fail_ack = True
        entered = False
        with self.assertRaises(FileChooserReadinessError):
            with ready_filechooser(page):
                entered = True
        self.assertFalse(entered)
        self.assertEqual(page.handlers, [])

    def test_unknown_version_rejected_before_any_subscription(self, sdk_version):
        sdk_version.return_value = '1.57.0'
        page = PageDouble()
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page)
        self.assertEqual(page.send_count, 0)

    def test_missing_private_boundary_rejected(self, _version):
        page = PageDouble();page._impl_obj._channel = None
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page)
        self.assertEqual(page.send_count, 0)

    def test_existing_or_removed_observer_rejected(self, _version):
        page = PageDouble();page.handlers.append(object())
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page)
        page.handlers.clear();prepare_filechooser(page);page.handlers.clear()
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page)

    def test_closed_page_rejected(self, _version):
        page = PageDouble();page.closed = True
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page)
        self.assertEqual(page.send_count, 0)

    def test_ack_timeout_rejected_before_observer(self, _version):
        page = PageDouble()
        with self.assertRaises(FileChooserReadinessError):
            prepare_filechooser(page, timeout_seconds=.00001)
        self.assertFalse(page.acknowledged)
        self.assertEqual(page.handlers, [])


if __name__ == '__main__':
    unittest.main()
