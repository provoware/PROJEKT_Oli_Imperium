# PPPOPPI – optionale Bewertungsrechnung V1.9.4 (Modellgrenze)
**Entwurfsstand 01.11.2026 · nur abgeleitete technische Prüfschicht, keine C64-Referenz, kein Release.**

Die bestehende `test_financial_boundaries_v194.cjs` und `test_asset_cost_bridge_v194.cjs` bleiben die unabhängigen Quellen für **Kassen-, Kredit-, Beleg- und Mengenkontrollen**. Die neue Rechenfunktion `valuation_explicit_v194.cjs` verändert die Spielengine nicht und liest keine realen Nutzerdaten. Sie berechnet *nur dann* Gewinn und Vermögen, wenn ein Aufrufer **sämtliche zwölf Cent-Positionen** nachvollziehbar und sicher übergibt.

## Verbindliche Rechenlogik der optionalen Auswertung
- **Aktiva:** Kasse + bewertete Forderungen + bewertete Vorräte + bewertete Anlagen.
- **Bekannte Verbindlichkeiten:** ausstehendes Kreditkapital + noch unbezahlte sonstige Rechnungen. **Offene Tilgungsrechnungen nicht erneut addieren.**
- **Eigenkapital:** Aktiva − bekannte Verbindlichkeiten.
- **Periodenergebnis:** periodengerecht zugeordnete Erlöse − Materialaufwand − Betriebsausgaben − Zinsen − Vertragsstrafen − Abschreibungen.
- **Kreditaufnahme und Tilgung:** Liquiditäts-/Schuldenbewegungen, niemals Umsatz oder Gewinn.
- **Unbekannte Bewertung:** Bereits **eine** fehlende Position ergibt `NOT_COMPUTABLE`; Ergebnisfelder `null`, nicht `0`.
- **Sicherheit:** Nur sichere ganze Cent-Beträge, keine negativen Einzelpositionen, keine stillen Rundungen oder Überläufe; **negative Gesamtergebnisse** bleiben erlaubt.
- **Kein Doppelzählungsversprechen:** Ein Aufrufer muss sicherstellen, dass Positionen fachlich disjunkt sind. Die Funktion kann fehlende Belege, falsch zugeordneten Periodenaufwand oder falsche Eigentums-/Forderungsregeln nicht selbst beweisen.

## Noch nicht festgelegt / keine automatische Bewertung
*Anlage:* Abschreibungsdauer, Restwert, Brandschaden und Zeitpunkt der Aktivierung. *Vorräte:* Herstellkosten, Lagerbewertung und Eigentumsübergang. *Forderungen:* Anspruchsentstehung, Teillieferung und Ausfall. *Ergebnis:* maßgebliche Buchungsperioden und Vertragsregeln. Diese Zahlen werden nicht aus der bestehenden Engine geschätzt oder als historische C64-Regeln ausgegeben.

**Test:** `node --test project-c/pppoppi-imperium/quality_v194/test_valuation_explicit_v194.cjs`. Acht isolierte Tests, einschließlich fehlender Einzelwerte, Kreditneutralität, Manipulationen, Überlauf und Verlust. Die CI bindet diesen Test zusätzlich an die bestehende Anschaffungskostenbrücke.

**Fachlicher Status:** Die Funktion ist ein prüfbares Recheninstrument für **explizit bewertete** Eingaben, **keine** aktivierte Gesamtbilanz und **kein** fachlich freigegebenes Bewertungsmodell. WIR-01 bis WIR-04/BAL-01 bleiben BLOCKED, 52er-Matrix unverändert, kein Merge nach `main`.
