#!/usr/bin/env python3
"""Isolierte Regression der MV3-Serviceworker-Startabfrage ohne Browser."""
import unittest

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from test_browser_native_zoom_v194 import wait_for_zoom_worker


class Worker:
    url = "chrome-extension://qa/background.js"

    def __init__(self, api=True):
        self.api = api
        self.calls = 0

    def evaluate(self, expression):
        assert "typeof chrome.tabs.setZoom" in expression
        self.calls += 1
        if isinstance(self.api, list):
            return self.api[min(self.calls - 1, len(self.api) - 1)]
        return self.api


class MissedEventContext:
    def __init__(self):
        self.workers = []
        self.events = 0

    @property
    def service_workers(self):
        return self.workers

    def wait_for_event(self, event, timeout):
        assert event == "serviceworker"
        self.events += 1
        self.workers.append(Worker())
        raise PlaywrightTimeoutError(
            "simuliertes Ereignis zwischen Snapshot und Listener")


class NeverStartsContext:
    @property
    def service_workers(self):
        return []

    def wait_for_event(self, event, timeout):
        raise PlaywrightTimeoutError("simuliert: kein Worker")


class StaticContext:
    def __init__(self, workers):
        self.workers = workers

    @property
    def service_workers(self):
        return self.workers

    def wait_for_event(self, event, timeout):
        raise PlaywrightTimeoutError("simuliert: kein neues Ereignis")


class WorkerWaitTests(unittest.TestCase):
    def test_missed_event_found_from_worker_list(self):
        context = MissedEventContext()
        self.assertIs(
            wait_for_zoom_worker(context, timeout_ms=100), context.workers[0])
        self.assertEqual(context.events, 1)

    def test_missing_worker_fails(self):
        with self.assertRaisesRegex(AssertionError, "nicht bereit"):
            wait_for_zoom_worker(NeverStartsContext(), timeout_ms=10)

    def test_missing_zoom_api_fails(self):
        context = StaticContext([Worker(api=False)])
        with self.assertRaisesRegex(AssertionError, "tabs.setZoom"):
            wait_for_zoom_worker(context, timeout_ms=10)

    def test_delayed_zoom_api_becomes_ready(self):
        context = StaticContext([Worker(api=[False, True])])
        self.assertIs(
            wait_for_zoom_worker(context, timeout_ms=100), context.workers[0])
        self.assertEqual(context.workers[0].calls, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
