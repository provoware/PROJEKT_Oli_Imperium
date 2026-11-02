# Vorrelease-Teilpaket: verweigerter Sitzungsexport bei drei offenen Sanierungen

**Datum:** 29.10.2026 · **Projekt:** PPPOPPI IMPERIUM, abgeleitete V1.9.4-Technikfassung · **PR:** [#124](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/124).

## Verbindliche Basis und Abgrenzung

- GitHub-`main` bei der Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Basis: [PR #123](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/123), HEAD `24a4f189ddc3d3694652d998f7d77f44b6ed0b08`.
- Nur `quality_v194/build.cjs` und `quality_v194/test_browser_campaign_triple_lastmonth_v194.py` werden funktional geändert. Alle 110 manifestgeschützten `SPIEL/`-Originaldateien bleiben unverändert.
- Kein C64-Originalvergleich, kein tatsächlicher Stromausfalltest, keine Aussage über eine vom Browser oder Betriebssystem **tatsächlich gespeicherte** Datei.

## Fehlerursache und Korrektur

Bisher wurden beim versionierten Sitzungsexport ein temporärer Blob-Link und ein unsichtbarer Download-Anker erzeugt. Warf der Browser beim programmatischen Download-Klick einen Fehler, wurden weder der Anker entfernt noch die Blob-Adresse freigegeben. Wiederholte Exportfehler konnten damit Ressourcen zurücklassen. Außerdem behauptete die Meldung `Versionierte Sitzung lokal exportiert` mehr, als die Oberfläche sicher wissen kann: Ein Download-Klick beweist keinen abgeschlossenen Dateispeichervorgang.

Die abgeleitete Technikfassung räumt den Download-Anker nun in `finally` auf. Ein bei fehlgeschlagenem Klick erzeugter Blob-Link wird sofort freigegeben; nach erfolgreich ausgelöstem Klick bleibt die bestehende verzögerte Freigabe erhalten. Die Meldung lautet nun `Sitzungsdownload gestartet; Datei auf dem Rechner pruefen.`. Weder Spielkern noch Sitzungsdaten werden beim Export verändert.

## Reproduzierbarer Browser-Grenzfall

Test: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_triple_lastmonth_v194.py`.

1. Eine echte 12-Monats-Partie mit vier menschlichen Firmen und 24 Wirtschaftsaktionen erzeugt drei natürliche Schlussmonatsinsolvenzen.
2. Der Browser wirft beim Klick auf den Sitzungsexport-Anker kontrolliert `DOWNLOAD_BLOCKED_TEST`; das ist eine **simulierte Browser-Verweigerung**, keine echte Datenträgerstörung.
3. Geprüft werden die sichtbare Fehlermeldung, genau ein erzeugter und wieder freigegebener Blob-Link, null verbliebene Download-Anker sowie bytegleich repräsentierte Spielzustände und drei offene Sanierungen.
4. Danach folgen die vorhandenen Prüfungen auf fehlerhafte Sitzungsimporte, verspäteten Import, Notverkauf, Rettungskredit, Sanierungsneustart, erfolgreiche Sitzungsdownloads und Wiederherstellung über vier Chromium-Prozesse.

**Abnahmeregel:** Ein Fehler bei Schritt 2 oder 3 ist **FAIL**. Ein erfolgreicher Test belegt nur die geprüfte Export-Fehlerbehandlung und unveränderte Rettungszustände, nicht die allgemeine Speicherung aller denkbaren Browser und Betriebssysteme.

## Prüfstand

- Vor der Änderung: GitHub-Browser-CI [#40795265924](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795265924) PASS 8/8 und Dreifachrettung [#40795265951](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795265951) PASS, aber ohne diesen verweigerten Download.
- Neue Änderung: GitHub-CI auf dem **finalen Commit** muss separat nachgewiesen werden; bis dahin **PENDING**, nicht PASS.
- Vorrelease-Gesamtgate: **BLOCKED** wegen offener Matrixpflichten, unabhängig vom Ergebnis dieser Teilprüfung.
- Matrixstand bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Betroffene Teilpflichten: VER-03, SPE-03, TES-03.

## Noch offene Arbeiten

1. Neue Chromium-CI vollständig auswerten, Fehler korrigieren und auf dem finalen Commit erneut prüfen.
2. Abbruchfälle beim Speichern/Importieren in weiteren Wirtschafts- und Minispiel-Endpartien untersuchen.
3. Ressourcenrechte, vollständige technische Freigaben und historischen C64-Referenzvergleich unabhängig nachweisen.

**Keine Zusammenführung, kein Release.** Benutzer-Sichtprüfung und Kubuntu-Praxistest bleiben bis zum technisch geprüften und eingefrorenen Release-Kandidaten zurückgestellt. Release nur mit ausdrücklicher Nutzerfreigabe.
