#!/usr/bin/env bash
# Gemeinsame, zeitlich begrenzte Chromium-Installation fuer alle Pflicht-Browserjobs.
# Ein fehlgeschlagener Systempaket-Mirror darf die eigentlichen Tests nicht verdecken.
set -euo pipefail

timeout --signal=TERM --kill-after=10s 120s python -m pip install playwright==1.56.0

if ! timeout --signal=TERM --kill-after=10s 180s python -m playwright install --with-deps chromium; then
  echo "::warning::Systempakete fehlgeschlagen/Timeout; Chromium ohne apt erneut installieren. Echte Browsertests bleiben Pflicht."
  timeout --signal=TERM --kill-after=10s 180s python -m playwright install chromium
fi

# Auch nach erfolgreichem Download muessen Start und Systembibliotheken funktionieren.
timeout --signal=TERM --kill-after=10s 60s python - <<'PY'
from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    browser.close()
print("PASS: Chromium startet im CI-Runner")
PY
