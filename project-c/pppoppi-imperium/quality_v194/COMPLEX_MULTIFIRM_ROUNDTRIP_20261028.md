# Komplexe gueltige Mehrfirmen-Spielstaende – Teilpruefung

**Datum:** 28.10.2026. **Projekt:** eigenstaendige PPPOPPI-Adaption (C), keine Aussage zu historischen C64-Regeln. **Basis:** [Entwurfs-PR #96](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/96), HEAD `b0ac330282090a74d9a7ea3377afb4c38c9b821a`; `main` bei der Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Zweck und bestehende Abdeckung

Die bisherigen Browser-Teilpruefungen decken Einzelvertraege, einzelne Sanierungen, mehrere Importe und ungueltige Fremdspielstaende ab. Ein zusammenhaengender Nachweis fuer **zwei gleichzeitig aktive menschliche Wirtschaftsunternehmen mit je eigener Region, eigenem Vertrag und anschliessender wiederholbarer Fortsetzung nach einem echten Browserkontextwechsel** fehlte. Der Test ist eine zusaetzliche Regression fuer `SPE-01`, `VER-03`, `WIR-01` und `WIR-03`; diese Gesamtpflichten bleiben gesperrt.

## Reproduzierbarer Ablauf

1. Im isolierten lokalen Offline-Aufbau eine neue Partie im Modus `2-2` (H1/H2/A1/A2) ueber die Spieloberflaeche starten.
2. H1 kauft, erschliesst und vermarktet BERLIN-1; H2 entsprechend NORD-2. Jeweils `SURVEY`, `BUY`, `DRILL`, `PUMP`, `SHIP`, `OFFER`, `SIGN` ueber reale sichtbare Wirtschaftsschaltflaechen. Menschliche Zuguebergabe ausdruecklich bestaetigen.
3. Nach dem ersten echten Monatsabschluss beide offenen Regionalvertraege, Eigentum, Marktumsatz und einen einzigen Bericht nachweisen. Spielstand exportieren.
4. In frischem Chromium-Kontext importieren, Zustand **vollstaendig** vergleichen. Im zweiten Monat beide Felder erneut foerdern und den zweiten Abschluss durchfuehren. Beide Vertraege muessen jeweils genau 40.000 Milli-Barrel liefern, je einen Vertragserloes und eine Transportrechnung buchen.
5. Den Monats-1-Export in einem dritten frischen Kontext erneut importieren und denselben Wirtschaftsablauf wiederholen. Die vollstaendigen Wirtschaftsfolgen muessen gleich sein. Nur die `processedIds`-Werte werden beim Vergleich normalisiert, weil die vorhandene Oberflaeche diese Kennungen absichtlich mit `Date.now()` versieht; Anzahl und Eindeutigkeit bleiben eigene harte Pruefungen.
6. Den zweiten Monatsbericht in einem vierten Kontext importieren und Monat 3 starten. Weder Vertragsabschluss noch Bericht duerfen doppelt gebucht werden. Dazu 800x600, JavaScript-Fehler und externe HTTP-Anfragen pruefen.

**Wichtig:** Keine kuenstlich erhoehten Konten, keine manuell geaenderten Spielstaende und keine veraenderten Originalquellen. Es handelt sich um vier wegwerfbare Browserkontexte, **nicht** vier echte Betriebssystem-Prozessneustarts. Die getrennte Prozessneustart-Pruefung bleibt bestehen.

## Abnahme

- Neuer Test: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_complex_roundtrip_v194.py`
- CI: `.github/workflows/prerelease-browser-project-c.yml`, Job `chromium-roundtrip`.
- Projektbasis: `python3 tools/validate_project.py`, `python3 -m unittest discover -s tests -v`.
- Matrixschema: `node project-c/pppoppi-imperium/prerelease/check.mjs --schema`; technische Gesamtsperre: `node project-c/pppoppi-imperium/prerelease/check.mjs --technical` muss bis zur echten Vollabnahme **BLOCKED** melden.
- **Status bei Implementierung: PENDING**, bis die GitHub-CI auf dem finalen Zweig-HEAD nachweislich abgeschlossen ist. Ein reiner Code-Commit gilt nicht als PASS.

## Unabhaengig offen

Weitere Firmenkonstellationen, Verlust- und Sanierungsketten, saemtliche zulaessigen Wirtschaftsaktionen, fehlende Endregelentscheidung, echte Sieg-/Niederlagenpartien, Vollstaendigkeit der Buchungsfolgen, Ressourcenrechte, Grafik/Barrierefreiheit und die anderen technischen Release-Gates. `SPE-01`, `VER-01`, `VER-02` und die Gesamtfreigabe bleiben **BLOCKED**.

## Naechste drei Schritte

1. Den neuen GitHub-Browserjob auf dem exakten finalen Commit auswerten und gegebenenfalls Test- oder Produktfehler gezielt beheben.
2. Unabhaengige weitere Buchungs-, Speicher- und Grenzfallketten ergaenzen, ohne den bestehenden Spielkern ungeprueft zu veraendern.
3. Endregelvertrag der eigenstaendigen Adaption vervollstaendigen und danach vollstaendige Endpartien mit Wiederherstellung automatisieren.

**Empfehlung:** Erst nach gruenen Teilpruefungen Belege als PASS eintragen. Kein Merge, kein Release und keine vorgezogene persoenliche Endabnahme.
