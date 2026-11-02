# Projekt C – native Zoom-Pflichttests getrennt ausführen

**Stand:** 27.10.2026 · **Zweig:** `automation/prerelease-isolated-zoom-gates-20261027-1833` · **Basis:** PR #90, HEAD `e51b8c5946c0c60b884d7ab0698f2c0d51d4c452` · **main bei Vorprüfung:** `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Tatsächlicher Fehler / Warum diese Änderung

[Chromium-CI #40543143687](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40543143687) ist **FAIL** auf PR #90. Die vorgelagerten Browserprüfungen bestanden, aber `test_browser_native_zoom_drill_v194.py` scheiterte beim Start der lokalen Chromium-Zoom-Erweiterung: `Timeout 15000ms exceeded while waiting for event "serviceworker"`. Die späteren Schritte, einschließlich des eigentlichen Claim-Parameter-Tests, wurden **SKIPPED**. Das ist kein Nachweis eines fehlerhaften Spielstands oder einer bestandenen 18-Fälle-Prüfung.

## Kleinstes zusammenhängendes Pflichtpaket

Die zwei technisch aufwendigen nativen Zoom-Prüfungen werden aus dem langen Chromium-Durchlauf in **einen separaten CI-Job mit frischem Browserprofil** verlegt. Dort läuft zuerst der Claim-Parameter-Test (18 Fälle, 180 Aktionen, 18 Export-/Import-Rundläufe als **Soll**, nicht als bereits bestandene Messung), danach der dreistufige Bohrtest. Der bisherige Chromium-Job behält alle übrigen Tests. Kein Test wird abgeschaltet, übersprungen oder in seiner Erfolgskontrolle abgeschwächt; die Gesamt-CI ist nur grün, wenn beide Jobs erfolgreich sind.

**Geänderte Dateien:** ausschließlich CI-Arbeitsablauf, Pflichtmatrix und dieser Bericht. Keine der 110 geschützten Originaldateien, keine Spielregeln, keine gespeicherten Nutzerdaten geändert.

## Reproduzierbare Befehle

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_claim_parameters_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_drill_v194.py
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
```

**Vor CI:** Workflow-Aufteilung implementiert, fachlicher PASS für die neue Aufteilung noch **PENDING**. Die 52-Pflichten-Matrix bleibt bei **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Der neue Job kann einen Serviceworker-Fehler isolieren, behebt ihn aber nicht zwangsläufig.

## Nächste drei Schritte

1. Beide GitHub-CI-Jobs auf dem endgültigen HEAD prüfen und bei Fehlern die genaue erste fehlschlagende Aktion protokollieren.
2. Nach belastbarem Claim- und Bohrtest weitere Wirtschaftsaktionen sowie Speicher-Neustarts unabhängig absichern.
3. Endregelvertrag und vollständige reguläre Endpartien bearbeiten; persönliche Abnahme erst nach grünen technischen Pflichtgates und eingefrorenem Kandidaten.

**Vorrelease:** BLOCKED. Kein Merge, kein Release, keine persönliche Endabnahme.
