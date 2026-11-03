# OLI V1.9.4 – Fokusverlust zwischen Sichtbarkeitspruefung und Enter (02.11.2026)

**Entwicklungszweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Kein Merge, kein Release.**

## Befund und Wirkung

Der bestehende 14-Punkte-Tab-Pruefpfad kontrollierte vor dem Sichtbarkeits-/Geometrietest den echten Tastaturfokus und `:focus-visible`. Nach einem bis zu drei Sekunden dauernden natuerlichen Bildlauf wurde vor `Enter` der Fokus nicht nochmals abgefragt. Ein waehrenddessen erfolgender Fokuswechsel konnte damit im Pruefcode unbemerkt bleiben. Dies ist eine **vorsorglich geschlossene Pruefluecke**, kein im Browser bereits reproduzierter Produktfehler.

## Begrenztes Pflichtpaket

- Nach dem unveraendert strengen Geometrietest werden `document.activeElement === el` und `:focus-visible` **unmittelbar vor Enter** nochmals rein lesend kontrolliert.
- Bei Fokusverlust oder verlorenem sichtbarem Fokus: **FAIL ohne Enter**, kein `focus()`, `scrollIntoView()`, Ersatzklick oder Aufweichen der Pruefschranke.
- Zwei neue isolierte Negativtests; bestehende positive Tests beruecksichtigen die beiden zusaetzlichen Lesepruefungen. Insgesamt 16 Tastaturregressionen im bereits vorhandenen CI-Job.
- Keine Aenderung am Spielkern, Speicherformat, an Originalquellen oder an anderen Repositories.

## Reproduzierbare Pruefung

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/campaign_keyboard_audit_v194.py project-c/pppoppi-imperium/quality_v194/test_campaign_keyboard_audit_v194.py
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_keyboard_audit_v194.py' -v
```

**Vor der Uebertragung isoliert lokal ausgefuehrt:** 3/3 Tests der neuen Fokus-Nachpruefung **PASS**, Python-Syntax **PASS**. Das ist **nicht** die vollstaendige 16er-Regression und kein echter Chromium-Test. GitHub-CI auf dem neuen HEAD bleibt bis zum Abschluss **PENDING**.

**Ausgangs-CI:** [#41421365543](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41421365543) auf `3e0a20b9a058272c39b7c6de5dad0f55144b439e` war bei der Bestandsaufnahme noch **QUEUED**. Ein alter gruenes Ergebnis gilt nicht als Nachweis fuer die neue Aenderung.

## Pflichtmatrix und naechste Arbeit

BED-02/BED-03 bleiben **BLOCKED**, weil 14 Kontrollpunkte nicht alle Dialoge, Minispiele und Ansichten abdecken. Gesamtmatrix unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Keine persoenliche Endabnahme vor eingefrorenem, technisch vollstaendig geprueftem Kandidaten.

1. Die 16 isolierten Regressionen und vier 175/200-%-Tab-/Rueckwaerts-Tab-Jobs auf dem **neuen HEAD** auswerten; konkrete Fehler gezielt korrigieren.
2. Weitere Dialog- und Minispielkontrollen inventarisieren und echte Tastaturwege bei 800×600 nachweisen.
3. Unabhaengig Leistungsschwellen und Speicher-/Archiv-Randfaelle abarbeiten; Rechte und C64-Originalbelege separat offen lassen.
