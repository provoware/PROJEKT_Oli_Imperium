# Vorrelease-Teilpaket: 12-Monats-Kampagne im echten Browser

**Stand:** 28.10.2026, 20:34 MEZ. **Basis:** Entwurfs-PR #117, HEAD 70df79032ec605b1dfcfebfeed1215f17833876b; **main:** d3dc371154cc1089e06f34d0dc4ff04047132360. **Geltung:** ausschliesslich abgeleitete PPPOPPI-Technikfassung, keine historisch verifizierte C64-Spielregel.

## Ziel und erwartete Wirkung

Bisher war die 12-Monats-Kampagne am echten Spielkern per Node-Test und die normale Browseroberflaeche in Teilstrecken geprueft. Es fehlte eine zusammenhaengende Browser-Endpartie mit **echten Klicks auf Monatsabschluss und Monatswechsel**, zwischenzeitlichem Sitzungsdownload, zwei echten Chromium-Prozessneustarts, automatischer Siegerwertung und anschliessend unveraenderbarem Archiv.

## Umsetzung

- Neuer isolierter Browser-Test: quality_v194/test_browser_campaign_endgame_v194.py.
- Start ueber sichtbare Spielartwahl, zwoelf Monatsberichte ueber END_TURN, elf Monatswechsel ueber NEXT_MONTH, automatische Abschlussansicht im zwoelften Monat.
- Nach Monat sechs: versionierten Zwischenstand ueber sichtbaren Export herunterladen, Chromium-Prozess beenden, Datei in neuem Chromium importieren und Spielzustand/Vertrag exakt vergleichen.
- Nach Spielende: Rangliste, Sieger, Grund, Monat und unveraenderten Archiv-Snapshot pruefen; weitere Wirtschaftsaktion ohne Zustandsaenderung; Archiv exportieren und nach zweitem Prozessneustart wiederherstellen.
- Manipulierte Siegerwertung ueber echten Dateiimport abweisen, ohne die archivierte Partie zu ersetzen. 800×600, JavaScript-Laufzeitfehler und externe Netzanforderungen ebenfalls pruefen.
- Eigenstaendiger CI-Job browser-campaign-endgame, damit ein Fehler nicht durch andere Browserjobs verdeckt wird. Nur temporaere Dateien; keine Aenderung an den 110 manifestgeschuetzten Originaldateien.

## Nachweisstatus

| Pruefung | Status vor GitHub-CI |
|---|---|
| Quellsyntax, Browserlauf und Kampagnenende | PENDING |
| Zwoelf Monatsberichte, Abschlusswertung und Sieger | PENDING |
| Zwei echte Chromium-Prozessneustarts und Sitzungsrundlauf | PENDING |
| Schreibsperre und manipulierte Archivdatei | PENDING |
| Bestehende GitHub-Quell- und Browserregression | PENDING |
| Vollstaendige technische Vorrelease-Freigabe | BLOCKED |

**Vorgesehener Aufruf:** python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_endgame_v194.py (Playwright 1.56.0 und Chromium). GitHub-CI muss auf dem **finalen HEAD** geprueft werden. Fehlgeschlagene Tests bleiben FAIL bis zur tatsaechlichen Korrektur; PENDING wird nicht als PASS gezaehlt.

## Offene Grenzen

Der Test deckt **eine** deterministische 12-Monats-Partie ab, nicht alle Spielarten, Niederlagen, Mehrspieler-Konstellationen, Insolvenzen, Wirtschaftsstrategien oder historischen Originalwerte. Die 52er-Matrix bleibt bei **6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. VER-01, SPE-03 und TES-03 bleiben BLOCKED. Keine Freigabe von Originaltreue, keine A/B-Umdeutung, kein Merge und kein Release. Persoenliche Kubuntu-/Sichtpruefung erst nach eingefrorenem technisch geprueftem Kandidaten.

## Naechste drei Schritte

1. GitHub-Quellpruefung und alle Browserjobs auf finalem Entwicklungs-HEAD auswerten, bei FAIL die Ursache beheben und neu pruefen.
2. Den Verlust-/Insolvenz-Endpfad mit natuerlichen Wirtschaftsaktionen und mehreren Prozessneustarts als getrennte Regression absichern.
3. Kampagnen-Endfaelle mit Mehrspieler, Unterbrechung und wiederholtem Import vervollstaendigen; erst danach betroffene Matrix-Gates neu bewerten.

**Empfehlung:** Eine einzelne gruen getestete Endpartie nur als Teilnachweis behandeln, nicht als fachlich vollstaendige Spielabnahme.
