# Projekt C – Browser-Langlauf und Wiederherstellung (26.10.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4-Prüfschicht auf V1.9.3-Kern. **Status:** technische Teilprüfung, kein Release.
**Basis:** Entwurfs-PR #49, `9469907c185c70625839f54a2bd84a9d2a0fc2b7`. Getrennter Zweig: `agent/prerelease-c-browser-longrun-20261026-0137`.
**Code-Commit:** `59d9263e2baa117b4f6728689424883acff4b1b2`. **Workflow-Commit:** `0ce290630614940c2c1923565ab02fe07a6faada`.

## Prüfgegenstand

Neuer Test: `quality_v194/test_browser_longrun_v194.py`; eingebunden in `.github/workflows/prerelease-browser-project-c.yml`.

Der Test erzeugt ausschließlich in einem temporären Verzeichnis einen Offline-Technikaufbau, öffnet diesen mit echtem Chromium über `file://` und beginnt eine neue Partie mit einem menschlichen und zwei KI-Unternehmen. Er führt **zwölf Monatsabschlüsse und zwölf Monatswechsel** über die echte Spieloberfläche aus. Pro Monat prüft er die aktive Phase, genau einen neuen Monatsbericht, den nächsten Monat und eine steigende Ereignisfolge.

Nach den Monaten **4, 8 und 12** wird der Spielstand über die Schaltfläche exportiert. Der Browser-Kontext wird vollständig geschlossen, ein neuer isolierter Kontext geöffnet, die JSON-Datei importiert und der gesamte Zustand auf Gleichheit geprüft. In jedem neuen Kontext wird anschließend ein syntaktisch gültiger, aber mit negativem Geldbestand manipulierter Import angeboten: Der Import muss abgelehnt werden, der laufende Zustand unverändert bleiben.

Zusätzlich: keine externen HTTP-Anfragen, keine JavaScript-Ausnahmen. Die gemessenen Monatslaufzeiten werden **nur diagnostisch** ausgegeben; ohne festgelegte belastbare Leistungsgrenze wird PER-01/PER-02 **nicht** freigegeben. Weder Originaldateien noch produktive Spielstände werden geschrieben oder verändert.

## Reproduzierbare Ausführung

```bash
python3 -m pip install playwright==1.56.0
python3 -m playwright install chromium
python3 project-c/pppoppi-imperium/quality_v194/test_browser_longrun_v194.py
```

Der Browser-Workflow führt den Test nach Offline-Rundlauf und Szenenaudit aus. **Neuer Test: bis zum echten CI-Ergebnis PENDING/BLOCKED**, nicht vorab PASS. Fehler des neuen Tests gelten als echte FAIL-Signale, nicht als Vorrelease-Erfolg.

## Nachweisgrenzen und Pflichtmatrix

- `LOG-05`: Monatswechsel nur in einem zusätzlichen Zwölfmonats-Szenario geprüft; vollständige Aktions- und Buchungsabdeckung weiter **BLOCKED**.
- `VER-03`, `SPE-01`, `SPE-03`: drei Neustart-Importe und drei manipulierte Dateien; andere Abbrüche, Dateisystemfehler und Versionsmigration weiter **BLOCKED**.
- `PER-01`, `PER-02`: Laufzeiten erfasst, jedoch keine verlässlichen Grenzwerte und keine Speicherprofilierung; **BLOCKED**.
- `VER-01`, `VER-02`: kein vollständiger Sieg-/Verlust-/Insolvenzpfad; **BLOCKED**.
- `GRA-03`, `BED-02`, `BED-03`: bisherige Teilnachweise unverändert; echter Browserzoom und vollständige Tastaturbedienung weiter **BLOCKED**.

**Freigabestand bleibt unverändert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.** Ein grüner Browser-Workflow ist ausdrücklich keine Gesamtfreigabe.

## Nächste konkrete Arbeitspakete

1. CI-Ergebnis des neuen Tests auswerten, etwaige echte Browserfehler reproduzierbar korrigieren und den finalen Commit belegen.
2. Browser-Langlauf um wirtschaftliche Kernaktionen, Minispiele, Sanierung und weitere Unterbrechungsfälle erweitern.
3. Echten nativen Browserzoom, vollständige Tastaturpfade und unabhängige Leistungsmessungen nachziehen.

**Kein Merge, kein Release. Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach vollständig grünen technischen Gates und eingefrorenem Kandidaten.**

## Tatsächlich abgeschlossene GitHub-Prüfungen – 26.10.2026

**Geprüfter Code-/Dokumentations-HEAD:** `fe9a9564cb3aeaed41ef1bb3d23492cc39bdd437`. Der nachfolgende Nachweis-Commit verändert nur diesen Bericht; auf dessen endgültigem HEAD müssen die Prüfungen erneut kontrolliert werden.

- [Chromium-Workflow #40250467071](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40250467071): **PASS**. Offline-Rundlauf, Szenenaudit und neuer Browser-Langlauf erfolgreich. **12/12 Monatsabschlüsse**, **12/12 Monatswechsel**, **12/12 Berichte**, **3/3 Export-/Neustart-/Reimporte** und **3/3 abgewiesene manipulierte Spielstände**. Keine externen HTTP-Anfragen oder JavaScript-Laufzeitfehler.
- [Quell-/Fachworkflow #40250467123](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40250467123): **PASS**, einschließlich 110 unveränderter Originalquellen und der fachlichen Testprogramme.
- [Gesamtfreigabe #40250467028](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40250467028): **FAIL/BLOCKED wie vorgesehen**. Matrix strukturell gültig, aber **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**; keine Vorrelease-Freigabe.

**Laufzeitbeobachtung:** Die zwölf Monatsabschnitte benötigten in der CI-Umgebung je 0,149 bis 0,509 Sekunden. Das ist eine Momentaufnahme ohne garantierte Leistungsgrenze, kein Leistungs- oder Stabilitätsfreigabenachweis.
