# OLI V1.9.4 – reale Tab-Erreichbarkeit in Langzeitpartien (02.11.2026)

**Arbeitszweig:** `test/oli-campaign-24-60-20261101` · [PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **kein Merge, kein Release**.

## Bestätigter Ausgangsstand

[GitHub-Actions-Lauf #41378517223](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41378517223) auf HEAD [3dde8c40f562c2fc6d396e68c1edde3642e2700a](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/3dde8c40f562c2fc6d396e68c1edde3642e2700a): **14/14 Jobs SUCCESS**. Die beiden 240-Monats-Dateidialogjobs bei 175/200 % sind tatsächlich erfolgreich abgeschlossen. Die jeweiligen Browserprotokolle enthalten 960 menschliche Zugabschlüsse, drei getrennte Chromium-Prozesse, `session_import_count=2` und `session_import_path=NATIVE_FILECHOOSER`. Die Langzeitpartien wurden bei 800×600 durchgeführt; das beweist **nicht** die gesamte Tab-Reihenfolge aller Spielszenen.

| Zoom | 240-Monats-Job | Browserdauer | P95-Monat | Zweite/erste Spielhälfte |
|---|---|---:|---:|---:|
| 175 % | [Job 125063958386](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41378517223/job/125063958386) | 875,249 s | 5,560 s | 2,439× |
| 200 % | [Job 125063958376](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41378517223/job/125063958376) | 753,491 s | 4,558 s | 2,173× |

Die Messungen sind Einzelbeobachtungen auf verschiedenen Runnern, keine belastbare Aussage zur Zoom-Geschwindigkeit. Leistungsschwellen bleiben BLOCKED.

## Neues technisches Pflichtpaket

- `campaign_keyboard_audit_v194.py`: prüft Erreichbarkeit ausschließlich über echte Tab-Tastendrücke, **ohne** `locator.focus()`; fehlende, doppelte, unsichtbare oder nicht erreichbare Ziele führen zu FAIL.
- Die 120-Monats-Browserkampagne prüft mit `--keyboard-audit --native-import` insgesamt **14 Tab-Nachweise**: Start, Neuspiel, Monatszug, Übergabe, Monatswechsel (zweimal), Export (zweimal) und die drei Bedienelemente bei **jedem** der zwei nativen Importe.
- Je ein eigenständiger CI-Job für 175 % und 200 % echten Chromium-Tab-Zoom bei 800×600; 120 Monate, 480 Zugabschlüsse, drei Prozesse, zwei native Dateiimporte, Abschlussarchiv. Die bisherigen 240-Monats-Jobs bleiben unverändert.
- Fünf isolierte Negativ-/Regressionstests für Tab-Navigation und ein zusätzlicher Import-Regressionsfall für alle drei fokussierbaren Kontrollen. Kein Spielkern, keine Wirtschaftsbuchung, keine gespeicherte Datei und kein geschütztes Original werden verändert.

**Reproduzierbare Befehle:**

```bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_keyboard_audit_v194.py' -v
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_native_import_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 175 --native-import --keyboard-audit
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 200 --native-import --keyboard-audit
```

**Neue CI-Gates:** bis zur tatsächlichen Ausführung auf dem neuen HEAD **PENDING**; keine vorgezogene PASS-Behauptung. Bei FAIL zuerst konkrete Zielkontrolle und Browserzustand diagnostizieren, nicht den Tab-Test abschalten. Die bestehenden `press_button`-Aktionen nutzen weiter Fokus + Enter; die neue unabhängige Tab-Prüfung deckt ausgewählte Schlüsselkontrollen ab, nicht alle Dialoge.

## Pflichtmatrix – begrenzter Teilnachweis

| ID | Nachweis | Status |
|---|---|---|
| SPE-01 / VER-03 | 240 Monate, zwei native Dateiimporte je Zoomstufe | Teilnachweis PASS auf Ausgangs-HEAD |
| BED-02/03 | Tab-Reihenfolge ausgewählter 14 Kontrollpunkte bei 175/200 % | PENDING auf neuem HEAD; vollständige Spielnavigation weiter BLOCKED |
| PER-01/02 | Leistung, Stabilität und Schwellenwerte | Messwerte vorhanden, Grenzwerte BLOCKED |
| QUE-04 | Rechte und Originalbelege | BLOCKED |

**Gesamtmatrix unverändert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED = 52. Persönliche Endabnahme ausschließlich nach allen technischen Gates und eingefrorenem Kandidaten.

## Nächste drei Schritte

1. Beide neuen 120-Monats-Tab-Jobs samt fünf und acht Regressionen auf finalem HEAD auswerten und Fehler korrigieren.
2. Nach erfolgreichem Nachweis zusätzliche Dialoge, Minispiele und vollständige Tab-Reihenfolge unter 175/200 % separat abdecken.
3. Leistungsursachen, Speicher-/Archiv-Randfälle und noch offene Fach-/Rechtefragen unabhängig weiterbearbeiten.

**Empfehlung:** Tab-Nachweise dauerhaft als gesonderte Pflicht führen; Enter nach künstlichem Fokus ist kein Ersatz für nachgewiesene Tastatur-Erreichbarkeit.


## Nachtrag 02.11.2026, 05:35 MEZ – echte Enter-Aktivierung nach Tab-Fokus

**Bestätigter Vorgänger-HEAD:** [12924ca8](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/12924ca81a61500982f7c1234e61cde767bfa3dd). Im [Kampagnenlauf #41384400318](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41384400318) waren bei der Bestandsaufnahme beide 120-Monats-Tab-Jobs (175 % und 200 %) **SUCCESS**; die übrigen Langläufer waren noch teilweise in Arbeit. Das ist kein Gesamt-PASS.

**Neues Pflichtpaket:** Die 14 bereits per Tab erreichbaren Schlüsselkontrollen werden nun bei der nachfolgenden Aktivierung **ohne künstliches `locator.focus()`** über die tatsächliche Seitentastatur (`page.keyboard.press("Enter")`) ausgelöst. Vor Enter prüft der neue Helfer sowohl `document.activeElement` als auch `:focus-visible`. Fehlender, unsichtbarer, deaktivierter oder nicht wirklich fokussierter Schalter führt zu FAIL, nicht zu einem Fokus-Trick. Ungeprüfte Aktionen behalten den bisherigen Ablauf; Spielkern und Spielstände bleiben unverändert.

**Isolierter Nachweis:** neun Python-Regressionen **9/9 PASS** in der lokalen Ausführung, darunter vier neue Fälle für echte Enter-Aktivierung, fehlenden Fokus, fehlenden sichtbaren Fokus und deaktivierte Kontrolle; `py_compile` **PASS**. Die GitHub-Browserprüfung auf dem neuen Commit bleibt bis zum tatsächlichen CI-Abschluss **PENDING**. Eine bestandene Browserprüfung belegt nur diese 14 Stellen, nicht sämtliche Dialoge, Minispiele oder die vollständige Tab-Reihenfolge.

**Matrix:** BED-02/BED-03 weiterhin **BLOCKED** als Gesamtpflicht; bestehende 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED unverändert. Kein Merge, kein Release, keine persönliche Endabnahme.

**Nächste Arbeit:** neue CI-Fehler auswerten, die weiteren Dialog-/Minispielpfade mit echter Tab+Enter-Aktivierung prüfen und unabhängig die offenen Leistungs-/Archivgrenzen bearbeiten.
