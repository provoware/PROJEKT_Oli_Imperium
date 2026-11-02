# V1.9.4 – Natürliche Vertrags-Teillieferung nach JSON-Wiederherstellung

**Datum:** 28.10.2026 · **Projekt:** C / PPPOPPI IMPERIUM, eigenständige Adaption · **Status:** PARTIAL / isolierter neuer Node-CI-Schritt PASS; lange Browser-CI zum Dokumentationszeitpunkt noch offen; Vorrelease BLOCKED.

## Vorprüfung und Abhängigkeiten

- GitHub-`main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Basis: [PR #101](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/101), HEAD `c914598200265e4493f726eaa1fbdfd7667aa286`; alle vier Chromium-Jobs [#40627334232](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40627334232) inzwischen **PASS**. In #101 war der CI-Status beim letzten Bericht noch offen.
- Neues unabhängiges Pflichtpaket: [Entwurfs-PR #102](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/102); ausschließlich neue Testdatei, ein CI-Schritt und dokumentierte Teilnachweise. Keine der 110 geschützten Originalquellen geändert.
- Betroffene Gates: `WIR-03`, `SPE-01`, `FEH-03` (alle weiterhin BLOCKED).

## Reproduzierbares Szenario

Zwei echte menschliche Firmen im unveränderten V0.8.2-Engine-Kern. H1 erwirbt und erschließt NORD-1, fördert 100.000 Mengeneinheiten, versendet sie und bietet sie am Markt an. Bei der regulären Monatsabrechnung kann der NORD-Markt 80.000 Einheiten aufnehmen; die übrigen 20.000 bleiben als Lagerbestand. Der im ersten Monat unterzeichnete Vertrag verlangt im zweiten Monat 40.000 Einheiten. Ohne weitere Förderung entsteht deshalb eine **natürliche Teillieferung** (20.000 geliefert, 20.000 fehlen), nicht durch manipulierte Spielstandwerte.

Der Test prüft JSON-Export/Import **vor** der Fälligkeit, identische unabhängige Monatsabrechnungen, korrekte Vertragsstrafe auf nur die Fehlmenge, Umsatz auf nur die gelieferte Menge, genau eine Liefergebühr, unveränderten Zustand nach falschem Spielerzug, doppelte Befehlskennung und den Folgemonat.

## Prüfung und Einschränkungen

- Neuer Befehl: `node project-c/pppoppi-imperium/quality_v194/test_contract_partial_delivery_v194.cjs`.
- [Chromium-CI #40633158227](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40633158227): **neuer Node-Schritt PASS** auf Code-HEAD `d7fd6c44b059b80189ad1be922c792769d33c20f`; vier Browserjobs und gesamter Workflow zum Zeitpunkt der letzten Prüfung noch IN_PROGRESS.
- [Quell-CI #40633158234](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40633158234): **zum Zeitpunkt der letzten Prüfung IN_PROGRESS**.
- [Gesamtgate #40633158471](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40633158471): **keine Vorrelease-Freigabe**; 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.
- Maschinenlesbarer Teilnachweis: [SPE-01-CONTRACT-PARTIAL-20261028.json](../prerelease/evidence/SPE-01-CONTRACT-PARTIAL-20261028.json).
- **Nicht abgedeckt:** reale Browserklicks im Vertragspfad, echter Browser-Prozessneustart für genau diesen Vertrag, Vertrag während Sanierung, vollständige Sieg-/Niederlagenpartie, historischer C64-Vergleich.

## Nächste drei Pflichtschritte

1. Die CI auf dem finalen HEAD auswerten; tatsächliche Fehler beheben und nur bestätigte PASS-Nachweise dokumentieren.
2. Vertragsbruch, Teilmenge, Notverkauf und Speicherwiederherstellung in einem echten Browserablauf mit Prozessneustart absichern.
3. Fachlich verbindliche Endspielregeln und reguläre vollständige Sieg-/Niederlagenpartien implementieren und prüfen.

**Weiterführende Empfehlung:** Für den Browser-Gesamtlauf vor und nach Vertragsfälligkeit eine unveränderliche JSON-Referenz als Vergleich sichern. Kein Merge, kein Release, keine persönliche Endabnahme vor allen technischen Pflichtgates.
