# Vorrelease-Pflichtpaket – Wirtschaftsaktionen mit strengem Tastatur-Gate (02.11.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4 · **PR:** [#155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **Ausgangs-HEAD:** `216d2f68f3b3254049a835e9a6f7c474928e3cbb`.

## Reale Luecke und Korrektur

Der bestehende [Dialog-Aktionsmatrix-Test](test_browser_dialog_action_matrix_v194.py) erreichte sichtbare Wirtschaftsaktionen per Tab und loeste Enter aus. Vor Enter fehlten dort jedoch die strengeren gemeinsamen Pruefungen auf **Shift+Tab/Tab-Rueckweg**, **berechneten CSS-Fokusring**, **tatsaechliche Fenster-Treffbarkeit/Verdeckung** und **Fokusverlust nach Bildlauf**. Der neue `activate_dialog_keyboard`-Pfad benutzt die bereits vorhandenen, separat geprueften Schutzfunktionen. Kein `locator.focus()`, kein `locator.click()`, kein Eingriff in die 110 geschuetzten Originaldateien oder das Speicherformat.

**Pruefumfang:** pro Szene und unterschiedlicher Aktionskennung ein frischer Spielzustand, wie im vorhandenen Browserpruefer. 800x600 und echter Chromium-Zoom 175/200 %; bei fehlendem Fokus oder verdecktem Ziel gilt **FAIL**, nicht stillschweigendes PASS. Bestehende fachliche Sollfolgen, Gueltigkeitskontrollen, Offline- und Fehlerpruefungen bleiben unveraendert.

## Pruef- und Freigabestatus

- Fuenf neue isolierte Negativ-/Regressionstests: Erreichbarkeit, Rueckweg, CSS-Fokus, Verdeckung und Verbot kuenstlicher Fokussierung. **CI nach Commit auswerten; vor Ausfuehrung PENDING.**
- Neuer Unit-Schritt im vorhandenen [Kopfzeilen-CI](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-header-keyboard.yml); der bestehende [Browser-Rundlauf](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-browser-project-c.yml) fuehrt die Dialog-Aktionsmatrix aus.
- Letzter unabhaengig verifizierter Kopfzeilen-Ausgangslauf [#41455990553](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41455990553): 3/3 PASS auf Ausgangs-HEAD. Die integrierte Vorrelease-Sperre [#41455990485](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41455990485) bleibt wegen offener Pflichten absichtlich rot.
- **Gesamtmatrix unveraendert:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED. Der neue Test deckt weder alle Parameter noch dynamische Aktionsfolgen oder die vollstaendige fachliche Freigabe ab.

**Naechste technische Arbeit:** Aktuelle Unit- und Browser-CI auf exakt neuem HEAD auswerten; bei fehlenden CSS-Fokusringen/Verdeckung die echte Darstellung korrigieren, nicht die Pruefung abschwaechen; danach weitere Claims/Regionen und dynamische Minispielaktionen mit Soll-Zustandsaenderungen belegen.

**Sperren:** kein Merge, kein Release, keine persoenliche Sicht- oder Kubuntu-Abnahme vor vollstaendig gruenem und eingefrorenem technischen Kandidaten.
