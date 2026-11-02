# BAL-01 – monatliche KI-Zugrotation als kontrollierter Gegenversuch (29.10.2026)

**Geltungsbereich:** PPPOPPI IMPERIUM, Projekt C, unveränderter V1.9.3-Spielkern; ausschließlich V1.9.4-Testschicht im bestehenden [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). Keine C64-Originalbehauptung, keine Spielregeländerung, keine Veröffentlichung.

## Ausgangslage und Vorprüfung

Auf dem zuvor geprüften HEAD `624f10da3b341b539465d8b5770c6db4564e87cd` sind **alle acht Browser-/Fachworkflows erfolgreich** ([Browser #40949792872](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40949792872), [KI #40949793204](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40949793204), [Quellschutz #40949793046](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40949793046)); die [integrierte Vorrelease-Sperre #40949793134](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40949793134) scheitert weiterhin **absichtlich**, weil technische Pflichten offen sind. Der zuvor sporadische native Dateidialogfehler ist mit dem letzten grünen Browserlauf **nicht** ursächlich beseitigt.

Die sechs festen KI-Reihenfolgen zeigen einen starken Positionsunterschied: erster KI-Zug meist drei Felder, zweiter eines, dritter keines. Die getrennte Logistikreihenfolge bewirkte in den untersuchten Märkten 36/36-mal keine wirtschaftliche Änderung. Nächste sachgerechte Gegenfrage: **Verteilt eine wechselnde strategische Zugreihenfolge die Investitionschancen gerechter, ohne die Gesamtwirtschaft deutlich zu verschlechtern?**

## Neu implementierter Test – vor CI zunächst PENDING

- `test_ai_turn_rotation_v194.cjs`: zwei geskriptete Märkte (normal/niedriger Preis), drei Anfangspositionen und jeweils eine **feste**, eine vorwärts und eine rückwärts rotierende KI-Zugfolge über 36 Monate.
- **18 unterschiedliche Konfigurationen**, jede zweimal; plus zwei unveränderte Ausgangskontrollen: **38 vollständige Kampagnen / 1.368 Spielmonate**. Alle 36 Wiederholungsläufe müssen exakt übereinstimmen.
- **36 firmenbezogene Vergleiche** der Rotation mit fester Anfangsposition: Endfelder, Strategie- und Logistikaktionen, liquide Nettoposition und Schulden. Zusätzlich Gesamtfelder, Null-Feld-Firmen, Feldverteilungsbreite und Gesamtnettoposition.
- Die Spielzustände werden nur **im Arbeitsspeicher der Prüfung** nach jedem echten `NEXT_MONTH` in ihrer Firmenlistenreihenfolge umgeordnet. Alle übrigen Zustandsfelder müssen nach normalisierter Firmenreihenfolge exakt identisch bleiben. Spielstandsvalidierung nach jeder Rotation.
- **Kontrollparität:** unveränderte Anfangsreihenfolge ohne Rotation muss dem vollständig uninstrumentierten Ausgangsspiel exakt entsprechen. Die ursprünglichen Engine-Funktionen werden selbst bei Fehlern wiederhergestellt.
- `test_ai_turn_rotation_unit_v194.cjs`: drei unabhängige Prüffälle für Dreierrotation, ungültige Eingaben und Feld-/Liquiditätskennzahlen.
- Der bestehende GitHub-Workflow `prerelease-ai-strategy-metrics.yml` führt Syntax, Einzelprüfungen und Vollkampagnen aus und lädt `ai_turn_rotation.json` als Nachweisartefakt hoch. **Ein grüner Strukturtest ist kein Nachweis für faire Balance.**

## Auswertung und Grenzen

Die Rotation verändert strategische **und** logistische Reihenfolge gleichzeitig; die vorherige isolierte Logistikprüfung ist ein gesonderter Beleg, ersetzt aber keine erneute Isolation für diese Monatsfolgen. Die Anfangsposition kann bereits im ersten Monat einen dauerhaften Feldvorteil schaffen. Die Szenarien sind deterministisch, nicht statistisch unabhängig. Kasse minus Schulden ist **kein** buchhalterischer Gewinn; Feldwerte, Lagerbestände, Produktionsanlagen und zukünftige Erlöse fehlen. Eine Änderung des Spielkerns ist erst nach ausgewerteten wirtschaftlichen Gegenversuchen und eigenständiger Freigabe vertretbar.

**Teststatus dieser neuen Änderung:** PENDING, bis die tatsächlichen GitHub-CI-Läufe auf dem endgültigen Entwicklungs-HEAD vorliegen. `BAL-01` bleibt BLOCKED; Matrix **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**.

## Reproduzierbare Befehle

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_unit_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_v194.cjs > ai_turn_rotation.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

## Drei nächste Pflichtschritte

1. GitHub-CI auf dem endgültigen Commit prüfen; bei FAIL die Ursache korrigieren und auf neuem HEAD wiederholen. Tatsächliche Feld-/Liquiditätsdifferenzen erst aus dem erzeugten JSON berichten.
2. Bei nachgewiesener Verbesserung einen getrennten, testbaren Entwurf für faire Zugpositionen ausarbeiten; andernfalls die anfängliche Feldkonkurrenz und Investitionsbewertung gezielt weiter untersuchen. Echte Vermögens-/Gewinnbewertung und Schulden-/Sanierungsfälle ergänzen.
3. Die 77 nicht importierten Archivdateien einzeln auf Rechte und Notwendigkeit prüfen und die historische C64-Referenz nachweisen. Persönliche Endabnahme erst nach vollständig grüner Technik und eingefrorenem Kandidaten.

**Empfehlung:** Erst reale Gegenversuche, dann Änderung der Spielregeln. Kein Merge, kein Release, keine vorgezogene Benutzerabnahme.

## GitHub-Abnahme und tatsächliche Wirtschaftsergebnisse

**PASS auf Entwicklungs-HEAD `952df5564948478bcd359ff43c910ee3ad9e8ea7`:** [KI-Gesamt-CI #40958741291](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40958741291) einschließlich drei neuer Rotations-Einzeltests, 38 vollständiger 36-Monats-Kampagnen (1.368 Monate), 36 firmenbezogener Differenzvergleiche, 36 identischer Wiederholungsläufe und unveränderter Ausgangsparität. [Browser-Gesamt-CI #40958741397](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40958741397) **PASS**, [Quellschutz #40958741255](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40958741255) **PASS**; fünf weitere Spezialworkflows **PASS**. [Integriertes Vorrelease-Gate #40958741114](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40958741114) erwartungsgemäß **FAIL/BLOCKED** wegen weiterhin offener Pflichten. Vollständige Messwerte: Artefakt `ai-strategy-baseline/ai_turn_rotation.json` desselben KI-Laufs und dessen protokollierte Ausgabe.

**Befund in genau den zwei geprüften Märkten:** Bei **allen 12** monatlich rotierenden Varianten (je drei Anfangspositionen × zwei Drehrichtungen × zwei Märkte) besaßen die drei KI-Firmen am Ende zusammen **fünf statt vier Felder**. Statt jeweils **einer KI ohne Feld** hatten bei Rotation **alle drei mindestens ein Feld**. Die **gemeinsame Veränderung von Kasse minus Schulden** lag in allen 12 Gegenvergleichen über der jeweiligen festen Ausgangsreihenfolge, um **13.694,53 € bis 279.288,44 €**. Dies ist **kein buchhalterischer Gewinn**, kein unabhängiger Zufallsversuch und kein Beweis allgemeiner Balance. Einzelne Firmen können trotz besserem Gesamtergebnis Nachteile haben; der erste menschliche Zug bleibt bevorzugt. **Keine automatische Übernahme der Rotation in den Spielkern.**

**Abnahmegrenze:** Der genannte CI-PASS gehört zum exakten vorherigen Test-HEAD; diese nachgetragene Dokumentation benötigt auf ihrem endgültigen HEAD erneut CI-Kontrolle. BAL-01 bleibt BLOCKED, Matrix 6/52 PASS. Kein Merge und kein Release.
