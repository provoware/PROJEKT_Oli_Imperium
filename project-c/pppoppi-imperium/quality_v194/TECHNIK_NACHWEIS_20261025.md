# Technischer Zwischenstand – 25.10.2026

**Status:** lokale Prüfungen bestanden; persönliche Sichtprüfung ausdrücklich
bis zuletzt zurückgestellt. Kein Release, kein Merge, keine C64-Freigabe.

| Bereich | Tatsächlich ausgeführter Prüflauf | Ergebnis |
| --- | --- | --- |
| Herkunft | `python3 project-c/pppoppi-imperium/recovery/verify_sources.py` | **110/110 PASS**, Originale byteidentisch |
| UI-Verträge | `node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs` | **8/8 PASS** (nur statisch) |
| Technische Spielabläufe | `node project-c/pppoppi-imperium/quality_v194/test_gameflow_v194.cjs` | **8/8 PASS** |
| Legacy-Fachregeln | `node SPIEL/legacy_v06/tests/test_engine.cjs` (im SPIEL-Ordner) | **37/37 PASS** |
| Navigation / Profil | `test_navigation.cjs`, `test_profile.cjs` | **411 Strukturprüfungen**, **13 Profilchecks PASS** |
| Markt | `test_fair_market_v161.cjs` | **18/18 PASS** |
| Transport | `test_transport_v17.cjs` | **22/22 PASS** |
| Öffentliches Netz | `test_public_network_v171.cjs` | **28/28 PASS** |
| Strategie-KI | `test_strategy_v192.cjs` | **17/17 PASS** |
| KI-Logistik | `test_logistics_ai_v193.cjs` | **19/19 PASS** |
| Mensch-gegen-Mensch | `test_human_parity_v192.cjs` aus generierter Technikfassung, echte Unterprozesse erlaubt | **PASS**, SHA-256 `e9cea8fd1e3320900a31c91bcda27d3400cd06a20cb2ebd26b648cb98f52524a` |
| V1.9.4 Balance | `evaluate_balance_v194.cjs` im generierten Zielordner | **4/4 Szenarien**, 144 simulierte Monate |
| V1.9.4 Krisen | `analyze_stress_v194.cjs` im generierten Zielordner | **4/4 Szenarien**, 156 simulierte Monate |
| Dateien | Node-Syntaxprüfung; JSON-/Python-Parseprüfung vor Korrektur | **39/39 JS-Syntax**, zuvor **40/40 JSON**, **13/13 Python** |
| Importtests und Basis | `python3 -m unittest` für Recovery und Basis | **64/64 + 8/8 PASS** |
| Vorrelease | `node prerelease/check.mjs --schema` und `node --test prerelease/test.mjs` | Schema und Regressionen PASS; fachliche Freigabe bleibt BLOCKED |

Die im Technikaufbau neu berechneten V1.9.4-Nachweise entsprechen den
geprüften Originalberichten **bytegenau**:

- `BALANCE_V194.json`: SHA-256 `3a14bfb770a730dc8bd765845c63d9a6e05ec735785ec2a2c3f760f747a00d77`.
- `KRISEN_LANGZEIT_V194.json`: SHA-256 `937b5bab3ae5ae26cf59d90bc71964430aed82dc05b7b08eb5460441e1eab6b4`.

Der korrigierte Mensch-gegen-Mensch-Test weist einen blockierten
Unterprozess jetzt als **Fehler** aus; ohne diesen Schutz konnte die
frühere Skriptfassung den Hash der leeren Zeichenfolge als scheinbaren
Erfolg melden. Außerhalb dieser Prozesssperre lief der Vergleich erfolgreich.

**Freigabematrix:** 0/52 PASS, 45 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.
Die Browser-, Tastatur-, 800×600-, Vergrößerungs-, Ressourcen- und
Kubuntu-Abnahmen bleiben offen. Die persönliche Sichtprüfung ist der letzte
Schritt – kein Testlauf in dieser Liste ersetzt sie.

Der neue GitHub-Workflow-Schritt für diese Prüfungen ist vorbereitet.
Ein erfolgreicher Lauf auf dem endgültigen GitHub-Commit ist in diesem
lokalen Bericht **noch nicht behauptet**.
