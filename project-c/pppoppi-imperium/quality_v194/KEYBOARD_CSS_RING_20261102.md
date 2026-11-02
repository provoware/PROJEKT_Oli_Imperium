# BED-02/03 – CSS-Fokusmarkierung bei Tastatur-Enter (02.11.2026)

**Repository:** [PROJEKT_Oli_Imperium](https://github.com/provoware/PROJEKT_Oli_Imperium) · **Entwurfs-PR:** [#155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **Basis-HEAD:** `36edd26a55d411a6eaee06b6eb103ed05e98ab58`.

## Verifizierter Ausgangszustand

[GitHub Actions #41422394500](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41422394500): 18/18 Jobs **SUCCESS** auf dem Basis-HEAD. Darin: 16 bisherige Python-Tastaturregressionen sowie die vier 120-Monats-Browserjobs mit echtem 175/200-%-Zoom und Vorwaerts-/Rueckwaerts-Tab. Dies ist kein Gesamtfreigabe-PASS.

## Pruefluecke und Korrektur

`:focus-visible` belegt nur den CSS-Zustand, nicht dass ein Mensch tatsaechlich eine sichtbare Fokusmarkierung bekommt. Der bereits vorhandene reine Lesetest fuer echten Fokus, Geometrie, Sichtbarkeit und Verdeckung bleibt bestehen. **Neu:** Vor dem abschliessenden Enter muss die berechnete CSS-Darstellung ein Outline mit positiver Breite und nichttransparentem Farbwert oder einen Box-Schatten liefern. Fehlt die Markierung oder ist der Nachweis ungueltig, **FAIL ohne Enter**. Drei neue Negativtests pruefen fehlenden Ring, fehlendes `:focus-visible` trotz Ring und ungueltigen Rueckgabewert. 19 statt 16 isolierte Tests im bestehenden Pflichtworkflow.

**Grenze:** Dies ist ein technischer Heuristik-Nachweis fuer eine CSS-Fokusmarkierung, keine vollstaendige Kontrastmessung, keine visuelle Nutzerabnahme und kein Beleg fuer alle Spielansichten. Keine Aenderung am geschuetzten 110-Dateien-Quellinventar, an Wirtschaftsregeln, Speicherstaenden oder dem UI-Zweig #154.

## Nachpruefung

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/campaign_keyboard_audit_v194.py project-c/pppoppi-imperium/quality_v194/test_campaign_keyboard_audit_v194.py
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_keyboard_audit_v194.py' -v
```

**Neuer HEAD / CI:** nach GitHub-Commit gesondert pruefen; vor Abschluss **PENDING**. Kein vorweggenommener PASS. **Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Keine Integration, kein Release, keine persoenliche Endabnahme.

**Naechste Schritte:** (1) aktuelle 19 Regressionen und vier Browserjobs auswerten, (2) CSS-Fokusfehler gezielt beheben, (3) noch nicht abgedeckte Dialoge und Minispiele inventarisieren und testen.
