# WIR-02 / WIR-03 – 11 Monate mit gemeinsamer Frachtsperre und Reparatur (31.10.2026)

## Herkunft, Zweck, Abgrenzung
Aufbauend auf PR #143, HEAD ef2641efff7e6b34358c2bcc8cb70cd7f8550dbe.
Dessen fachlicher Test wurde auf exakt diesem Commit in
[GitHub-CI #41156383897](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41156383897)
mit **SUCCESS** abgeschlossen. Die integrierte Vorrelease-Sperre bleibt **BLOCKED**.

Dieses Paket prüft einen weiteren echten Spielverlauf: Zwei menschliche Firmen
erwerben getrennte Berliner Felder, fördern je 100 Barrel, verarbeiten
je 20 Barrel Rohöl zu 18 Barrel Fertigware und nutzen denselben öffentlichen
Transportweg. Es werden keine Ölbestände, Kassenwerte, Streckenzustände,
Nachfragewerte oder Besitzrechte künstlich gesetzt.

## Soll-Ablauf und überprüfbare Pflichtbedingungen
- **M1:** Je Firma echte Erschließung, Förderung und Rohtransport.
- **M2:** Je zwei echte Raffineriechargen; 18 Barrel Fertigware pro Firma.
- **M3:** Je 18 Barrel öffentliche Fracht gebucht; gemeinsam nur 18 Barrel
  Kapazität; je Firma 9 Barrel zugeteilt und 9 Barrel erstattet.
- **M5:** Ankunft und Verkauf der ersten 9 Barrel je Firma.
- **M8:** Öffentliche Verbindung B-BB automatisch bis M10 gesperrt.
  Je 9 Barrel Fracht werden vollständig zurückgegeben, die gemeinsame
  Kapazitätsnutzung beträgt **0**.
- **M9:** Genau eine echte kostenpflichtige Reparatur durch H1; dieselbe
  Strecke ist danach auch für H2 wieder frei. Je 9 Barrel Fracht werden
  angenommen; keine zweite Reparatur und keine Rückerstattung.
- **M11:** Beide Firmen verkaufen die zweite Ankunft, insgesamt je 18 Barrel.
  Physische Endbilanz je Firma: 100 gefördert = 80 Feldlager +
  18 verkauft + 2 Verarbeitungsschwund.

Nach **jedem Monatsabschluss** werden Firmenbesitz, Fördermenge,
sämtliche Zwischenlager und laufenden Transporte, bisheriger Absatz
und Verarbeitungsschwund sowie Kasse gegen das vollständige Buchungsjournal
unabhängig geprüft. Weitere Pflichten: 22 echte Spielmonate über zwei
identische Läufe, 44 Firmen-Monatsbilanzen, 42 JSON-Rundläufe,
12 abgewiesene doppelte Frachtaufträge, 20 absichtliche Manipulationen
von Beständen, Buchungen und Frachtberichten sowie zwei echte
Reparaturzahlungen. Fehlgeschlagene Aktionen dürfen den Eingabezustand
nicht verändern.

**Wichtige Grenze:** Es handelt sich um einen anfänglichen Engpass und
eine spätere Sperre mit Reparatur, **nicht** um zwei wiederholte
Überbuchungsmonate. Gewinn-/Anlagenbewertung, Browser-Import,
vollständige Endpartien, Ressourcenrechte und C64-Originaltreue
werden hier ausdrücklich nicht freigegeben.

## Reproduktion und Status
Test: project-c/pppoppi-imperium/quality_v194/test_public_closure_repair_v194.cjs

GitHub-Prüfablauf: .github/workflows/prerelease-public-closure-repair.yml

    node --check project-c/pppoppi-imperium/quality_v194/test_public_closure_repair_v194.cjs
    node project-c/pppoppi-imperium/quality_v194/test_public_closure_repair_v194.cjs

**Status bei Erstellung: PENDING.** Ein Syntax-PASS ersetzt keinen
fachlichen Test. Erst ein vollständig erfolgreicher GitHub-Prüflauf
auf dem endgültigen Dokumentations-HEAD erlaubt den Teilstatus PASS.
WIR-02 und WIR-03 bleiben unabhängig davon **BLOCKED**.

## Nächste drei Schritte
1. Fachprüfung und übrige GitHub-Gates auf dem finalen HEAD auswerten,
   Fehler reproduzieren und beheben.
2. Zwei **erneute echte Überbuchungsmonate** mit zusätzlichen
   Raffineriechargen und kumulierter Bilanz prüfen.
3. Gewinn-/Vermögensbewertung und vollständige Endpartien getrennt
   weiterentwickeln; Rechte/C64-Nachweise bleiben offen.

**Kein Merge, kein Release, keine persönliche Endabnahme vor
eingefrorenem und vollständig technisch geprüftem Kandidaten.**


## Erste GitHub-Ausführung und anschließende Härtung

- [GitHub-CI #41160715066](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41160715066) auf Commit 60811928426b1f7071b3fb55a5397d22c588da3f: **PASS**. Der echte Node-Test, der maschinengeprüfte JSON-Vertrag und das Hochladen des Nachweises waren erfolgreich. [JSON-Artefakt](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41160715066/artifacts/13026952588).
- Danach zusätzlich unabhängig kontrolliert: Summe **und Anzahl** aller tatsächlichen Außenmarkt-Verkaufsbelege gegen sämtliche Monatsberichte. Diese Härtung benötigt eine **neue GitHub-Prüfung auf dem finalen Dokumentations-HEAD**; bis dahin PENDING.
- Der bestätigte Fachteil-PASS auf dem früheren Commit ist **keine** Freigabe von WIR-02/WIR-03, des produktiven Importwegs oder der integrierten Vorrelease-Sperre.
