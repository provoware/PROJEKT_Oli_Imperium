# Projekt C – Wirtschaftskette im echten Chromium (26.10.2026)

**Projekt:** PPPOPPI IMPERIUM, isolierte V1.9.4-Technikvorschau auf dem V1.9.3-Kern. **Freigabe:** BLOCKED, kein Release.
**Abhängigkeit:** gestapelter Entwurfs-PR #50, Ausgangs-HEAD 26ecbb1d8a4d24b4b69f709cfb8a5cdfc4761261.
**Änderungsantrag:** [Entwurf PR #51](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/51).
**Implementierungs-HEAD:** bed1e19fe39ff4b9439d3dc9e0be3f2b75cf6eef (Test und Workflow, vor diesem Dokumentationsnachtrag).

## Konkrete neue Prüfung

Test: quality_v194/test_browser_economy_v194.py. CI: .github/workflows/prerelease-browser-project-c.yml.
Der Test erzeugt einen neuen, temporären, lokal per file:// geöffneten Technikaufbau und verwendet Chromium mit 800 × 600 Bildpunkten. Wirtschaftliche Aktionen werden **über sichtbare Spielschaltflächen geklickt**, nicht über direkte Aufrufe der Übergangsfunktion. Nur das Öffnen der jeweiligen Spielansicht erfolgt über die vorhandene Navigationsschnittstelle.

| Teilprüfung | Tatsächlich geprüfte Erwartung | Stand auf Implementierungs-HEAD |
|---|---|---|
| Ungültige Förderung vor Bohrung | Kein Geld-, Zeit- oder Zustandsverlust | PASS |
| Gutachten und Kauf | Zwei Gutachten-Spieltage, Geldabbuchung, Eigentum H1 | PASS |
| Doppelter Kauf | Ablehnung ohne Zustandsänderung | PASS |
| Fachbohrung und Förderung | Feld erschlossen, exakt 100 Barrel im Tank | PASS |
| Transport und Marktangebot | Ölmenge vollständig verlagert, noch keine vorzeitige Verkaufsgutschrift | PASS |
| Liefervertrag | 40 Barrel, Fälligkeit im zweiten Monat, zunächst offen | PASS |
| Erster Monatsabschluss | Genau ein Bericht, positiver Marktabsatz und Markt-Erlösbuchung | PASS |
| Zweiter Monat | Weitere Förderung, Vertrag vollständig und fristgerecht erfüllt | PASS |
| Vertragsabrechnung | Vertragserlös und Transportgebühr gebucht | PASS |
| Speichern/Neustart/Import | Exakte Übereinstimmung aller Wirtschaftsdaten und Berichte | PASS |
| Folgemonat nach Import | Keine doppelte Monatsabrechnung oder Vertragsstatistik | PASS |
| Browser-Sicherheit | Keine HTTP-Anfragen, keine JavaScript-Laufzeitfehler | PASS |

**Nachweis auf dem Implementierungs-HEAD:**
- [Chromium #40255297136](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40255297136): **PASS**, neuer Wirtschaftstest mit **43/43** einzeln ausgegebenen Prüfungen, 2 Monatsabrechnungen, 2 abgelehnten ungültigen Aktionen, Export/Neustart/Import; die bereits bestehenden drei Browser-Testprogramme ebenfalls PASS.
- [Quell-/Fachprüfung #40255297121](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40255297121): **PASS**, einschließlich Herkunftsinventar und vorhandener Fachregressionen.
- [Gesamtsperre #40255297073](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40255297073): **FAIL/BLOCKED** wegen noch offener technischer Matrixpflichten. Das ist **keine** Freigabe.

Die Links belegen den Implementierungs-HEAD; ein späterer reiner Dokumentations-Commit wird als eigener HEAD durch die PR-Prüfungen bewertet. Die verbindliche HEAD-SHA und der neueste CI-Stand stehen im PR #51.

## Grenzen und Matrix

Die bestehende maschinenlesbare Matrix unter prerelease/matrix.json bleibt **unverändert bei 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönlichen DEFERRED**. Neue Teiltests dürfen nicht als abgeschlossene Gesamtpflicht gezählt werden.

- WIR-01, WIR-03, LOG-05: zwei reale Wirtschaftsmonate mit Markt und Vertrag; keine vollständige Abdeckung von Preisen, Transportvarianten, Raffinerie, Sonderfällen und KI-Balance.
- SPE-01, SPE-03, VER-03: ein zusätzlicher wirtschaftlicher Export-/Neustart-/Importpfad; keine Stromausfall-, Parallelfenster-, Dateisystem- oder Versionsmigrationsfreigabe.
- VER-01, VER-02: keine vollständigen Sieg-, Verlust-, Sanierungs- oder Insolvenzpfade.
- GRA-03, BED-02, BED-03: 800 × 600 als Testumgebung; kein nativer 175–200-%-Zoom und keine vollständige Tastaturprüfung.
- PER-01, PER-02: keine festgelegte Belastungsgrenze, keine unabhängige Speicherprofilierung.
- Originalquellen, produktive Spielstände, main und die fünf ausgeschlossenen Top-5-Repositories bleiben unverändert.

## Reproduktion

Ab Repository-Wurzel:

~~~bash
python3 -m pip install playwright==1.56.0
python3 -m playwright install chromium
python3 project-c/pppoppi-imperium/quality_v194/test_browser_economy_v194.py
~~~

Erforderlich sind Python 3.12, Node.js 22 und Chromium/Playwright. Der Test schreibt ausschließlich in ein automatisch entferntes temporäres Verzeichnis. Keine externen Dienste oder Nutzerdaten nötig.

## Nächste Pflichtpakete

1. **Sanierung/Insolvenz im echten Browser:** künstlich reproduzierbare, aber gültige Krisensituation; Kredit, Notverkauf oder Neustart, korrekte Buchungen und Spielstand-Roundtrip, ohne produktive Daten.
2. **Unterbrechungs- und Speichergrenzen:** Abbruch zwischen Monatsabschluss und Export, beschädigte oder ältere Spielstände, parallele Fenster, keine Doppelbuchung.
3. **Darstellung und Eingabe:** nativer Browserzoom 175–200 %, vollständige Tastaturpfade und anschließend reproduzierbare Leistungsgrenzen.

**Persönliche Sichtprüfung und Kubuntu-Endabnahme erst nach allen selbstständig möglichen technischen Pflichten, grünen Freigabeprüfungen und eingefrorenem Kandidaten. Kein Merge, kein Release ohne ausdrückliche Nutzerfreigabe.**
