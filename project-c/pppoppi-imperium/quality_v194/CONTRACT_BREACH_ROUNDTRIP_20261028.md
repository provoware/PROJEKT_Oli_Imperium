# V1.9.4 – Vertragsbruch und Vertragserfüllung nach Speicher-Rundlauf

**Datum:** 28.10.2026 · **Projekt:** C / PPPOPPI IMPERIUM (eigenständige Adaption, kein Original-C64-Nachweis) · **Status:** PARTIAL, Vorrelease BLOCKED.

## Ausgangslage und technische Entscheidung

- GitHub-`main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Entwicklungsbasis: [Entwurfs-PR #100](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/100), HEAD `ecd6c3e04fed99b215fe6aa40e2188c741607171`; neuer [Entwurfs-PR #101](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/101).
- Die bestehenden Tests deckten Notverkauf und Altvertragsmigration ab. Eine deterministische Gegenprobe **zweier gleichzeitig fälliger V0.8.2-Verträge** nach Import vor der Fälligkeit fehlte. Daher gezielter Test ohne Eingriff in geschützte Spielquellen.
- Betroffene Pflichten: `SPE-01`, `WIR-03`, teilweise `FEH-03`. Alle bleiben BLOCKED, bis ihre vollständigen Kriterien erfüllt sind.

## Implementierung

`quality_v194/test_contract_breach_roundtrip_v194.cjs` startet zwei menschliche Firmen. H1 kauft ein Feld und schließt einen Vertrag ohne Förderung; H2 kauft, bohrt, fördert und schließt einen Vertrag. Beide Verträge werden **über echte Engine-Aktionen** im Folgemonat fällig. Ein JSON-Spielstand wird **vor** der Fälligkeit exportiert, importiert und unabhängig mit identischen Befehlen abgerechnet.

Der Test prüft `BREACH` gegenüber `DONE`, Vertragsmenge, exakt gerundete Strafzahlung und Erlös, Transportrechnung, Lagerrest, richtige Spielerreihenfolge, unveränderten Zustand nach abgewiesenem Fremdzug, doppelte Befehlskennung, identische Berichte und den nächsten Monat ohne Doppelbuchungen. Er erfindet weder Geld noch Vertragsstatus noch Spielende.

## Nachweise und Grenzen

- [Chromium-Workflow #40627244010](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40627244010) auf Implementierungs-HEAD `5a27df95a37fea43096d8be3b67238a1109f48c1`: **isolierter Node-Schritt PASS** (GitHub-Job `chromium-roundtrip`); vollständige Browser-Gesamtkette bei Dokumentation noch **IN_PROGRESS**.
- [Maschinenlesbarer Teilnachweis](../prerelease/evidence/SPE-01-CONTRACT-BREACH-PARTIAL-20261028.json) und [52-Pflichten-Matrix](../prerelease/matrix.json).
- Vergleich gegen PR #100 nach den ersten vier Commits: nur Workflow, Test, Matrix und Teilnachweis; **0 geschützte Original-Spielquellen** verändert. Die zusätzliche Berichtsdatei ist ebenfalls ausschließlich Dokumentation.
- **Nicht geprüft:** reale Browserklicks für diesen Vertragspfad, echter Browser-Prozessneustart, Teillieferungen, Vertragsbruch während Sanierung, vollständige Sieg-/Niederlagenpartien und historischer C64-Originalvergleich. Kein PASS für die Gesamtpflicht.

## Nächste drei Pflichtschritte

1. Die **vollständige** Chromium- und Quell-CI auf dem endgültigen Dokumentations-HEAD auswerten; echte Fehler gezielt beheben.
2. Vertragserfüllung, Vertragsbruch, Notverkauf und Spielstand-Neustart in einem echten Offline-Browserablauf zusammen prüfen; Teillieferung und Rechnungsgrenzen ergänzen.
3. Fachlich belastbaren Endregelvertrag festlegen und reguläre vollständige Sieg-/Niederlagenpartien samt Speicherwiederherstellung technisch absichern.

**Weiterführende Empfehlung:** Für jede wirtschaftliche Endpartie einen wiederholbaren Spielstand direkt vor dem kritischen Ereignis aufbewahren, damit Fehler und Abrechnungsdifferenzen exakt reproduzierbar bleiben.

**Freigabe:** BLOCKED; kein Merge, kein Release, keine persönliche Endabnahme vor den technischen Pflichtgates.
