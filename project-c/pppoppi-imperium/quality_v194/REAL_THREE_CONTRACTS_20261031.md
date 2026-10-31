# WIR-03 / WIR-04 – Drei parallele Verträge einer Firma (31.10.2026)

## Prüfziel und Herkunft

Eigenständige Berliner Satire-Variante, **kein belegter C64-Originalalgorithmus**. Nach den zwei parallelen Verträgen verschiedener Firmen wird erstmals die echte Obergrenze von **drei gleichzeitig offenen Regionalverträgen derselben Firma** mit regulären Spielaktionen überprüft. Es wird kein Geld, Öl, Eigentum oder Spielstand künstlich injiziert. Der geschützte Spielkern wird nicht verändert.

## Vier aufeinanderfolgende Spielmonate

1. **Monat 1:** H1 erschließt BERLIN-1, fördert und verkauft 100.000 Milli-Barrel auf dem freien Markt; H2 beendet seinen Zug unverändert.
2. **Monat 2:** H1 erschließt NORD-1, fördert 100.000 Milli-Barrel und bietet sie öffentlich an. Wegen begrenzter Nachfrage bleibt eine **natürlich entstandene Teilmenge** im Lager. Die erwartete Restmenge wird unabhängig als Förderung minus archivierter Marktverkauf berechnet.
3. **Monat 3:** H1 erwirbt BRANDENBURG-1, fördert erneut in BERLIN-1 und schließt **drei gleichzeitig offene Verträge** (BERLIN, NORD, BRANDENBURG) mit Fälligkeit in Monat 4. Ein vierter beziehungsweise regional doppelter Vertragsabschluss muss zurückgewiesen werden. Alle drei Verträge bleiben beim Monatsabschluss offen.
4. **Monat 4:** BERLIN liefert vollständig (40.000 Milli-Barrel, DONE), NORD liefert nur den vorhandenen Rest (BREACH), BRANDENBURG liefert nichts (BREACH). Transportgebühren, beide Vertragsstrafen, Einnahmen, Eigentum, Restlager, Löhne und Wartung werden anhand der Vertragsparameter unabhängig berechnet.

## Automatisierte Prüfnachweise

- **Prüfdatei:** [test_real_three_contracts_v194.cjs](test_real_three_contracts_v194.cjs).
- **Fachworkflow:** [prerelease-real-credit-longrun.yml](../../../.github/workflows/prerelease-real-credit-longrun.yml) – vom Repository-Hauptverzeichnis aus unter `.github/workflows/`.
- **Sollumfang:** zwei deterministische Wiederholungen; 16 Firmen-Monatsbeobachtungen; 24 gezielte Manipulationsproben; 6 JSON-Speicher-Rundläufe; alle regulären Aktionen mit unveränderter Eingabe, Zustandsgültigkeit und Duplikatsperre.
- **Manipulationsarten:** Kasse, Vertragserfüllung, Vertragsstatus, Gewinn, Lager, Eigentum, Einnahmenbuchung, Strafrechnung, Transportzahlung, Monatsbericht, Fremdfirma und Vertragsduplikat.
- **Unabhängige Rechnung:** Sollkasse vor Fälligkeit + drei Vertragsumsätze − Transportgebühren − Vertragsstrafen − Personal − Wartung für zwei aktive Felder. Zusätzlich müssen sämtliche Rechnungszahlungen einzeln mit den Kassenbuchzeilen und die archivierten Monatsberichte mit dem Zustand übereinstimmen.

### Reproduzierbare Befehle

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_three_contracts_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_three_contracts_v194.cjs
```

**CI-Status bei Dokumentation:** zunächst **PENDING**; kein bestandener Fachtest wird ohne erfolgreich abgeschlossenen GitHub-Lauf auf dem konkreten Commit behauptet. [Workflow-Übersicht](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-credit-longrun.yml). Nach jedem nachfolgenden Dokumentations-Commit muss der neue HEAD erneut geprüft werden.

## Pflichtmatrix und Freigabegrenzen

WIR-03 und WIR-04 bleiben **BLOCKED**; unverändert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED** von 52. Dieser Test prüft unmittelbare Vertragszahlungen und Kassenabgleich, **keine Debitorenforderungen, Abschreibungen oder vollständige Vermögensbilanz**. Weiterhin fehlen durchgängige Endpartien, stabile Browser-Dateiimporte bei hohem Zoom, belastbare Herkunfts-/Rechtenachweise der 77 ausgeschlossenen Archivobjekte und der historische C64-Originalvergleich. Die persönliche Kubuntu- und Sichtabnahme folgt erst nach allen eigenständig prüfbaren technischen Pflichtgates am eingefrorenen Release-Kandidaten.

**Nächste konkrete technische Implementierung:** Zusammenhängenden mehrmonatigen Dreivertragsverlauf mit wiederholter Fälligkeit, neuen Abschlüssen und natürlichen Zahlungsschwierigkeiten bis zur Sanierung prüfen. Forderungs- und Vermögensbewertung nur nach fachlich dokumentierter Modellentscheidung ergänzen.

**Sperre:** PR bleibt DRAFT, kein Merge nach `main`, keine Veröffentlichung und keine Releasefreigabe.
