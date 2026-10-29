# WIR-04 – Geldgrenzen, exakte Zahlungen und Sanierungsüberlauf (29.10.2026)

**Spiel:** PPPOPPI IMPERIUM, eigenständige Berliner Adaption. **Geltungsbereich:** V0.8.2-Wirtschaftskern aus der V1.9.3-Quellfassung mit V1.9.4-Prüfschicht; **keine** belegte C64-Originalregel.

**Ausgangsbasis:** [PR #129](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/129), HEAD `0f0ea10ba3a3f2f5661532ba8b865705238f20fb`. `main` bei Vorprüfung `d3dc371154cc1089e06f34d0dc4ff04047132360`. Vorherige Browser-CI [#40829966311](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40829966311) abgeschlossen: PASS. Integrierte Vorrelease-Sperre bleibt wegen offener Matrixpflichten absichtlich rot.

## Ziel und Risiko

Geld wird in ganzen Cent gespeichert. Ungültige oder zu große Werte dürfen weder über einen manipulierten Spielstand noch über eine Rettungsaktion zu Rundungsfehlern, negativem Bargeld oder stiller Zustandsveränderung führen. Bisher lag für diese Grenzen kein gezielter GitHub-Prüflauf vor.

## Umsetzung

- `quality_v194/test_money_boundaries_v194.cjs`: eigenständige, deterministische Regression mit echten Funktionen `E.validate` und `E.transition` aus den unveränderten Quellmodulen.
- Prüft negative, gebrochene, unsichere und typfalsche Werte in sechs Geld-/Mengenfeldern; Rechnungsgrenzen, Marktpreis und Nachfrage.
- Prüft exakte Nullzahlung, einen Cent Unterdeckung, Duplikatschutz, den maximal sicheren ganzzahligen Kontostand, verlustfreien JSON-Rundlauf und zwei Überlaufversuche bei Rettungskrediten.
- `.github/workflows/prerelease-money-boundaries.yml`: Node 22 auf GitHub Ubuntu 24.04; der Test läuft unabhängig von der erwartungsgemäß gesperrten technischen Gesamtfreigabe.

**Änderungsgrenze:** Nur neue Test-, Workflow- und Berichtdateien sowie der WIR-04-Matrixhinweis. Die 110 inventarisierten Quell-/Testoriginale bleiben unverändert. Keine echten Spielstände, keine Rechteumgehung, kein Merge.

## Prüfstatus und offene Pflichten

- **Vor PR-Erstellung:** neuer Test noch nicht auf GitHub ausgeführt, deshalb kein behauptetes PASS. Die CI des neuen Entwicklungs-HEADs muss separat geprüft werden.
- **Abnahmekriterium für dieses Teilpaket:** Workflow erfolgreich; alle Einzelprüfungen als PASS protokolliert; Ausgangsstand nach abgewiesenen Aktionen unverändert; unveränderte Quelloriginale durch Quellworkflow bestätigt.
- **WIR-04 bleibt BLOCKED:** Das Teilpaket deckt keine vollständige Wirtschaftskampagne, nicht alle Rechnungs-/Preis-/Schuldzinsen-Extremwerte, keine Browser-Eingabe für Grenzwerte und keine historische Originaltreue ab.
- **Vorrelease:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52; die 77 ausgeschlossenen Archivdateien haben keine Rechtefreigabe.

## Nächste drei technischen Arbeiten

1. Neuen GitHub-Node-Prüflauf und Quellschutz auf dem endgültigen HEAD auswerten; Fehler beheben, nicht schönmelden.
2. Hohe Schulden mit Zins-/Tilgungsrundung und mehreren Rechnungen über eine vollständige 12-Monats-Partie mit Export/Import absichern.
3. Ressourcenrechte und C64-Referenz getrennt prüfen; persönliche Sichtprüfung/Kubuntu erst nach vollständigen technischen Pflichtgates und eingefrorenem Kandidaten.

**Kein Release, kein ungeprüfter Merge, keine persönliche Endabnahme.**
