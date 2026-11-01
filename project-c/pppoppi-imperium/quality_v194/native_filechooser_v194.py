"""Readiness boundary for native file-chooser tests; never product/import code."""
import asyncio
from contextlib import contextmanager
from importlib.metadata import version
from weakref import WeakKeyDictionary

# Canonical installer: install_chromium_ci.sh. A new SDK needs explicit audit.
VALIDATED_PLAYWRIGHT = "1.56.0"
_READY = WeakKeyDictionary()


class FileChooserReadinessError(RuntimeError):
    """No user input may be emitted after an unconfirmed preparation."""


def prepare_filechooser(page, timeout_seconds=5):
    """Await the browser ACK before the first Python event subscription.

    Playwright's public event registration sends updateSubscription without
    awaiting its reply. This pinned, guarded private boundary is necessary until
    the SDK supplies a public acknowledged subscription. Keep one public observer
    until page.close(), so transient expect_file_chooser listeners cannot toggle
    interception off and recreate the race on subsequent imports.
    """
    if version("playwright") != VALIDATED_PLAYWRIGHT:
        raise FileChooserReadinessError("Nicht gepruefte Playwright-Version")
    if page.is_closed():
        raise FileChooserReadinessError("Dateiauswahl-Seite bereits geschlossen")
    impl = getattr(page, "_impl_obj", None)
    channel = getattr(impl, "_channel", None)
    if not (callable(getattr(page, "_sync", None))
            and callable(getattr(channel, "send", None))
            and callable(getattr(impl, "listeners", None))):
        raise FileChooserReadinessError("SDK-Bereitschaftsschnittstelle fehlt")
    listeners = impl.listeners("filechooser")
    if page in _READY:
        if len(listeners) != 1 or listeners[0] is not _READY[page]:
            raise FileChooserReadinessError("Dateiauswahl-Beobachter veraendert")
        return
    if listeners:
        raise FileChooserReadinessError("Bereitschaft muss vor Anmeldung erfolgen")
    try:
        page._sync(asyncio.wait_for(channel.send(
            "updateSubscription", None,
            {"event": "fileChooser", "enabled": True}), timeout_seconds))
    except Exception as error:
        raise FileChooserReadinessError(
            "Dateidialog-Ueberwachung nicht bestaetigt; keine Eingabe erlaubt"
        ) from error
    # Register only AFTER the acknowledged dispatcher call. Adding the public
    # observer first would start a competing fire-and-forget enable request.
    def keep_interception(_chooser):
        pass
    page.on("filechooser", keep_interception)
    registered = impl.listeners("filechooser")
    if len(registered) != 1:
        raise FileChooserReadinessError("Dateiauswahl-Beobachter nicht eindeutig")
    # The sync SDK may wrap public callbacks; retain the actual implementation listener.
    _READY[page] = registered[0]


@contextmanager
def ready_filechooser(page, timeout=5000):
    """Yield the genuine chooser waiter only after confirmed interception."""
    prepare_filechooser(page)
    with page.expect_file_chooser(timeout=timeout) as chooser:
        yield chooser
