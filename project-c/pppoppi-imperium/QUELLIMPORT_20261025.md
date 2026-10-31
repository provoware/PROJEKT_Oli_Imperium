# V1.9.4 – geprüfter Nachimport der Quellen am 25.10.2026

## Herkunft und Umfang

- Vom Nutzer bereitgestellte Datei: `PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel(1).zip`.
- SHA-256 des ZIP: `94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca` – entspricht exakt dem zuvor festgehaltenen Originalarchiv.
- Das zusätzliche Rettungsarchiv `PPPOPPI_IMPERIUM_V194_GitHub_Rettung(1).zip` enthält das byteidentische Original-ZIP. Das darin enthaltene ältere Upload-Skript wurde **nicht** ausgeführt.
- Sicherer Import mit `recovery/import_archive.py` aus dem fest gepinnten Originalarchiv: **110 von 110** freigegebenen Quell-/Testdateien und ein neu erzeugtes Manifest.
- Inventar-SHA-256: `2514ffd8b641d8ed230ff6c9a461f309d0874c3820ad872ffcc1e5b814e39913`.
- Ausgeschlossen: die übrigen **77 Archiv-Einträge**, insbesondere Bildmedien und weitere Berichte. Keine ZIP-Datei, kein C64-Diskettenabbild und keine Originalmedien wurden eingecheckt.

## Lokal tatsächlich geprüft

| Prüfung | Ergebnis |
| --- | --- |
| Exakter Original-ZIP-SHA-256 und fester 110er-Inventarfingerabdruck | PASS |
| `python3 recovery/verify_sources.py` (aus Projektwurzel unter `project-c/pppoppi-imperium/recovery/`) | PASS, 110/110 |
| `python3 -m unittest discover -s project-c/pppoppi-imperium/recovery -p 'test_*.py' -q` | PASS, 64/64 |
| `python3 tools/validate_project.py` und `python3 -m unittest discover -s tests -q` | PASS, 8/8 |
| `node project-c/pppoppi-imperium/prerelease/check.mjs --schema` und `node --test project-c/pppoppi-imperium/prerelease/test.mjs` | PASS |
| Acht V1.9.4-Wirtschafts-/Langzeitprüfprogramme | PASS, 8/8, lokaler Lauf |

Die acht Programme waren: `test_fair_market_v161.cjs`, `test_human_parity_v192.cjs`, `test_logistics_ai_v193.cjs`, `test_public_network_v171.cjs`, `test_strategy_v192.cjs`, `test_transport_v17.cjs`, `evaluate_balance_v194.cjs`, `analyze_stress_v194.cjs`.

## Weiterhin gesperrt

Diese Tests bestätigen bestimmte technische Invarianten, **nicht** vollständige Spielbarkeit, Bilanz, historische Originaltreue oder Rechtefreigabe. Ein unabhängiger GitHub-Workflow muss den endgültigen Commit nochmals prüfen. Ausstehend sind insbesondere:

1. Rechtliche und technische Bewertung der 77 ausgeschlossenen Archiveinträge, soweit das Spiel sie benötigt.
2. Browser-, Tastatur-, 800×600-, Vergrößerungs-, Speicher- und vollständige Partietests sowie reproduzierbare Ressourcen-/Langzeitmessungen.
3. Die 52 Vorrelease-Pflichten: mangels vollständiger Freigabebelege zunächst **0/52 PASS**, nicht stillschweigend grün markieren. Menschliche Sicht- und Kubuntu-Abnahmen erst nach dem technisch geprüften Kandidaten.

**Keine automatische Zusammenführung nach `main`, kein Release.** Der Nachimport liegt als separat prüfbarer Projekt-C-Entwicklungsstand vor.
