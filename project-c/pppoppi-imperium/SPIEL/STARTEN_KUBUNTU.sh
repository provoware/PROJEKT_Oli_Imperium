#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [[ ! -f index.html ]]; then echo 'FEHLER: index.html fehlt.' >&2; exit 1; fi
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "file://$(pwd)/index.html" >/dev/null 2>&1 &
  echo 'Spiel im Standardbrowser angefordert.'
elif command -v firefox >/dev/null 2>&1; then
  firefox "file://$(pwd)/index.html" >/dev/null 2>&1 &
  echo 'Spiel in Firefox angefordert.'
elif command -v chromium >/dev/null 2>&1; then
  chromium "file://$(pwd)/index.html" >/dev/null 2>&1 &
  echo 'Spiel in Chromium angefordert.'
else
  echo 'Kein Browser gefunden. Bitte index.html mit einem installierten Browser öffnen.' >&2
  exit 2
fi
