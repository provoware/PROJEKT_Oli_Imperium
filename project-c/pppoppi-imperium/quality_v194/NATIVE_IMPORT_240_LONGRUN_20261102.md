# OLI V1.9.4 – 240 Monate mit nativem Dateidialog bei 175/200 %

**Datum:** 02.11.2026 · **Zweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **DRAFT, kein Merge, kein Release**.

## Ausgangsnachweis (vor dieser Änderung)

Auf HEAD [f1809af62782e432f6025dad9d1e6f37533f0ba4](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/f1809af62782e432f6025dad9d1e6f37533f0ba4) war [GitHub Actions #41372928433](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41372928433) **12/12 Jobs SUCCESS**. Insbesondere `browser-campaign-120-native-filechooser (175)` und `(200)` waren gruen. Die echten Browserlogs meldeten je 120 Monate, 480 menschliche Zugabschluesse, drei Chromium-Prozesse und `session_import_path=NATIVE_FILECHOOSER`. Zwei unabhaengige Datei-Importe waren im Testablauf vorgesehen, aber nicht separat als Zaehler belegt.

## Neues Pflichtpaket

- Der Langzeitpruefer zaehlt die Importpfade und erzwingt **genau zwei bestaetigte Importe** (Halbzeit und Endarchiv) desselben deklarierten Typs. Ein direkter Datei-Import darf nicht als nativer Dateidialog ausgegeben werden.
- Zwei zusaetzliche Negativ-/Regressionstests pruefen fehlende, gemischte oder ueberzaehlige Importnachweise; zusammen sieben gezielte Tests. Keine Wiederholung und kein automatischer Ersatz bei fehlendem Dateidialog.
- Neuer GitHub-Job `browser-campaign-240-native-filechooser` als unabhaengige Matrix bei **175 % und 200 % echtem Chromium-Tab-Zoom**, jeweils 240 Monate, 960 menschliche Zugabschluesse, 800x600, drei getrennte Browserprozesse, Export, nativer Zwischenimport und nativer Endarchivimport.
- Beide Varianten laufen unabhaengig (`fail-fast: false`), mit maximal 55 Minuten pro Job. Fehler und Zeitueberschreitungen sind **FAIL**, keine Freigabe. Originaldateien, Spielkern und Speicherformat bleiben unveraendert.

## Reproduzierbare Pruefungen

```bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_native_import_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 240 --zoom 175 --native-import
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 240 --zoom 200 --native-import
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
```

**Neuer HEAD / CI:** bis zum erfolgreichen GitHub-Prueflauf **PENDING**, nicht PASS. Die bisher gruenen 120-Monats-Jobs sind keine Belege fuer den neuen 240-Monats-Pfad. Nach dem CI-Abschluss im PR die konkrete HEAD-SHA, Run-URL und PASS/FAIL-Werte nachtragen.

## Vorrelease-Pflichtmatrix (Teilnachweise, keine Statusanhebung)

| Kennung | Nachweisziel | Aktueller Stand |
|---|---|---|
| SPE-01 | Halbzeit-/Endarchivimport nach Prozessneustart | 120 Monate PASS auf Ausgangs-HEAD; 240 Monate PENDING |
| BED-02/03 | Enter, Fokus, 175/200 % nativer Zoom, 800x600 | 120 Monate PASS; 240 Monate PENDING; gesamte Tab-Reihenfolge offen |
| VER-03 | Vollstaendige 240-Monats-Partie und Endarchiv | Bisher nur direkter Input PASS; nativer Dateidialog PENDING |
| PER-01/02 | Leistung und reproduzierbare Grenzwerte | Messwerte vorhanden, Freigabegrenzwerte BLOCKED |
| QUE-04 | Originalreferenz und Medienrechte | BLOCKED |

**Gesamtmatrix:** weiterhin 6 PASS / 39 BLOCKED / 4 OPEN / 3 persoenliche DEFERRED = 52. Die drei persoenlichen Endabnahmen erfolgen erst nach allen technischen Pflichtpruefungen und eingefrorenem Kandidaten. Keine Freigabe oder Integration.

## Naechste Schritte

1. Beide neuen 240-Monats-Dateidialogjobs auf dem tatsaechlichen finalen HEAD abschliessen und Fehler gezielt beheben.
2. Fokus-/Tab-Reihenfolge und nativen Import mehrfach unter 175/200 % ohne Ersatzpfad pruefen.
3. Leistungsgrenzen, Archivumfang, Bewertungsregeln, Rechte und C64-Originalbelege getrennt abschliessen.

**Weiterfuehrende Empfehlung:** Die Importzaehlung als dauerhaften Schutz gegen scheinbar erfolgreiche Browserpfade beibehalten, auch wenn kuenftige Testhilfen veraendert werden.
