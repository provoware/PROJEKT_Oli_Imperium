# WIR-04 / BAL-01 – Brandereignis, Rohölmenge und Bewertungsgrenze (31.10.2026)

## Problem und fachliche Trennung

Der aktuelle V0.8.2-Spielkern setzt beim periodischen Brand das Kennzeichen burning=true. Die betreffende Funktion verändert dabei weder reserveMilli noch inventoryMilli oder preparedMilli. Während des Brandes ist die Förderung gesperrt. Eine professionelle Brandbekämpfung kostet tatsächlich Geld und hebt die Sperre auf. **Eine mengenmäßige oder wertmäßige Vernichtung von Rohöl ist im vorhandenen Brandablauf nicht implementiert.** Das ist eine Quellcodebeobachtung, keine historische C64-Regel und keine fachliche Entscheidung, dass ein Brand niemals Lagerware beschädigt.

Die bereits geprüfte Anschaffungskostenbrücke aus PR #147 bewertet keine Anlagen. Ebenso darf der neue Brandtest die Rohölmenge nicht ohne definierte Regel mit einem Geldwert multiplizieren und als Gewinn, Verlust oder Restwert ausgeben.

## Reproduzierbare technische Pflichtprobe

- Zwei echte menschliche Firmen, ausschließlich reguläre Engine-Aktionen; keine künstliche Kasse und keine künstlichen Lagerbestände.
- H1 kauft und erschließt BERLIN-1, fördert in drei aufeinanderfolgenden Monaten jeweils 100.000 Milli-Barrel, verkauft die ersten beiden Lieferungen und hält die dritte im Rohöllager.
- Der echte Übergang in Monat 4 löst den periodischen Brand auf dem erschlossenen Feld aus. Rohölreserve, Lager und vorbereitete Lieferung werden vor und nach dem Brand exakt abgeglichen.
- Eine Förderaktion während des Brandes muss scheitern, ohne den Eingabezustand zu verändern. Die professionelle Brandbekämpfung wird als reale negative Kassenbuchung kontrolliert.
- JSON-Wiederherstellung während des Brand-Folgeablaufs; anschließend Transport, Angebot und Verkauf des verbleibenden Rohöls. Über die vier Monate muss die Mengenidentität Förderung = Verkauf + Restlager gelten.
- Sechs unabhängige Manipulationsproben je Szenario: Kasse, Buchung, Reserve, Rohöllager, regionaler Verkaufsbericht und doppelte Buchungskennung. Zwei identische Wiederholungen sollen insgesamt acht Spielmonate und zwölf Negativproben liefern.

**Wichtig:** Der Test prüft die aktuelle Implementierung und markiert fehlende Wertminderungsregeln ausdrücklich als NOT_DEFINED, die Lagerbewertung als UNPRICED und den Gewinn als NOT_COMPUTABLE. Ein grüner Test ist nur ein technischer Teilnachweis.

## Ausführung

    node --check project-c/pppoppi-imperium/quality_v194/test_fire_raw_stock_v194.cjs
    node project-c/pppoppi-imperium/quality_v194/test_fire_raw_stock_v194.cjs

GitHub-Prüfablauf: [prerelease-fire-raw-stock.yml](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-fire-raw-stock.yml).

**Ausführungsstatus bei Erstellung: PENDING.** Erst die erfolgreich abgeschlossene GitHub-Prüfung auf dem endgültigen Entwicklungs-HEAD ist ein PASS-Nachweis. Fehlgeschlagene Prüfungen bleiben FAIL; die integrierte Vorrelease-Sperre bleibt BLOCKED.

## Noch zu entscheiden und zu implementieren

1. Fachlich begründen, **ob** ein Brand Rohölmengen vernichtet oder nur die Anlage zeitweise stilllegt. Verlustmenge, Zeitpunkt, Rettung und Folgen für Lager/Verträge dürfen nicht geraten werden.
2. Getrennt davon Anschaffungskosten, Herstellungskosten, Abschreibung, Restwerte und Forderungsansatz festlegen. Erst dann den rechnerischen Wert eines tatsächlich beschädigten Bestands prüfen.
3. Nach freigegebenen Regeln produktiven Code und unabhängige Positiv-/Negativtests ergänzen; anschließend echte Mehrfirmen-Endpartien und Speicherung im Browser prüfen.

WIR-04/BAL-01 bleiben BLOCKED; 52er-Matrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED. Kein Merge, kein Release und keine vorgezogene Benutzer-/Kubuntu-Endabnahme.
