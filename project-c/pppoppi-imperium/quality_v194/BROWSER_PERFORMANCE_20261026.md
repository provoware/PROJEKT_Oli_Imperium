# Vorrelease-Pflichtpaket: reproduzierbare Leistungs-Basiswerte

**26.10.2026 · PPPOPPI IMPERIUM V1.9.4 (Projekt C)**

Ausgangsstand: `7ca91e31b18195934b0f16a6a6820e5c8e0fbd75`, Entwurfs-PR #62.
Der vorangehende Chromium-Lauf #40326416224 wurde am 26.10.2026
auf genau diesem Stand mit **success** abgeschlossen; Quellprüfung
#40326416271 ebenfalls **success**. Das harte Gesamtgate
#40326416250 blieb erwartungsgemäß **failure**, weil die Vorrelease-Pflichten
noch nicht erfüllt sind.

## Umsetzung und Grenzen

Neues isoliertes Browser-Prüfprogramm
`quality_v194/test_browser_performance_v194.py`:

- Erzeugt die Offline-Vorschau in einem temporären Verzeichnis und startet
  Chromium mit 800×600; kein Schreibzugriff auf die 110 Originaldateien.
- Misst reale Zeit vom Laden der `file://`-Datei bis zum spielbereiten Kern.
- Führt zwölf reguläre Monatswechsel mit Browserklicks aus und misst
  Laufzeiten je Monat sowie Median und Maximum.
- Erfasst Chromium-Messwerte (JavaScript-Speicher, DOM-Knoten,
  Dokumente, Aufgabenlaufzeit) bei Monat 0, 4, 8 und 12.
- Kontrolliert zwölf Monatsberichte, fehlende Browserfehler und
  ausbleibende externe HTTP-Anfragen.

**Reproduzieren:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_performance_v194.py`.
Der neue Test läuft zusätzlich im bestehenden Chromium-CI-Workflow.
Die konkrete CI-Ausführung auf dem neuen HEAD muss separat als PASS/FAIL
bewertet werden. Ein lokal nicht ausgeführter Test ist kein PASS.

## Pflichtmatrix und Freigabe

`PER-01` (Start-/Ladezeit) und `PER-02` (Langzeit-Speicher)
erhalten **Teilnachweise**, bleiben aber **BLOCKED**: Eine einzelne
GitHub-Maschine ist keine repräsentative Leistungsgrenze. Zwölf Monate
beweisen keine Langzeit-Stabilität oder Abwesenheit von Speicherlecks.
Grenzwerte, wiederholte Messreihen, längere Partien und unterschiedliche
Hardware müssen vor der Freigabe geprüft werden. Die 52 Pflichtpunkte
bleiben **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**.

**Nächste Implementierung:** Messwerte aus der CI auswerten, belastbare
Grenzwerte und mehrere Wiederholungen festlegen; danach längere
realistische Partien mit Speicherverlauf, echten Browserzoom und
durchgehender Tastaturführung prüfen.

Keine persönliche Sicht-/Kubuntu-Endabnahme vor allen grünen technischen
Gates und eingefrorenem Kandidaten. Kein Merge, kein Release.
