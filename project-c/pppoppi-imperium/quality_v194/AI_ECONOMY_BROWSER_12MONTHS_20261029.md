# BAL-01 / WIR-04 / SPE-01 – KI-Wirtschaftskampagne mit Chromium (29.10.2026)

## Basis und Abgrenzung

- Gestapelte Basis: [PR #133](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/133), `97631acbbae9b5bd027536d4922341db7d984aa8`.
- `main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`; **nicht geändert**.
- Änderung: [PR #134](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/134), nur isolierter Test, neuer GitHub-Workflow, dieser Bericht und Matrix-Nachtrag. Die 110 manifestgeschützten Originaldateien bleiben unberührt.
- Geltung: eigenständige PPPOPPI-/Deutschland-Adaption, **kein** historischer C64-Regelnachweis.

## Reproduzierbarer Prüfbefehl

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_ai_economy_12months_v194.py
python3 -m pip install playwright==1.56.0
python3 -m playwright install --with-deps chromium
python3 project-c/pppoppi-imperium/quality_v194/test_browser_ai_economy_12months_v194.py
```

GitHub-Workflow: `.github/workflows/prerelease-browser-ai-economy-12m.yml`, Ubuntu 24.04, Python 3.12, Node 22, Chromium. Der Test erzeugt nur einen temporären, hashgeprüften Offline-Aufbau und löscht ihn nach Abschluss.

## Tatsächlich ausgeführte Prüfungen

**Implementierungs-HEAD:** `5ff936fdc12464e874444f4ef4ed3a221695960f`.
[GitHub Actions #40866371739](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40866371739): **PASS – 129/129 protokollierte Prüfungen, 0 FAIL**, Python-Syntax und echter Chromium-Durchlauf erfolgreich. Das sind Prüfmeldungen des konkreten neuen Tests, nicht 129 unabhängige Release-Pflichten.

- Echte Kampagne über **12 Monate**, vier Firmen (`H1`, `H2`, `A1`, `A2`), **12 Monatsberichte** und ein schreibgeschütztes Abschlussarchiv.
- Menschliche Wirtschaft über sichtbare Schaltflächen: **2 Gutachten, 2 Käufe, 1 Bohrung, 1 Förderung, 1 Transport, 1 Marktangebot, 1 Vertrag**. Die KI führt ihre Aktionen durch den regulären Spielkern aus.
- **24 KI-Züge**, genau zwei je Monat, und **148 protokollierte KI-Entscheidungen** von beiden KI-Firmen; valide Spielstände, nichtnegative Kassen/Schulden, eindeutige Auftragskennungen.
- Vertraulicher Übergabe-Dialog H1 → H2, monatliche KI-Automatik, keine vorzeitige Archivierung.
- **5 echte Chromium-Prozesse**, **4 versionierte Sitzungsexporte und exakte Importe** nach Monaten 3/6/9 und nach dem Endarchiv.
- 800×600 ohne horizontalen Seitenüberlauf; keine HTTP/HTTPS-Anfragen und keine JavaScript-Laufzeitfehler.
- Nach Archivimport bleiben zusätzliche Monats-/Wirtschaftsaktionen gesperrt.

## Bewertung der Pflichten

`BAL-01`: wertvoller Teilnachweis für die **technische** KI-Ausführung und die beiden Strategien. Eine quantitative Gegenüberstellung von Gewinn, Liquidität, Risiko, Kapitalrendite und Wettbewerbsfähigkeit sowie gezielte Gegenproben fehlt. **BLOCKED**.

`WIR-04`: Teilnachweis für korrekte Geld-/Schuldenfelder während 12 KI-Monaten. Vollständige Extremwert-/Kredit-/Rechnungsvarianten in KI-Partien fehlen. **BLOCKED**.

`SPE-01`: Teilnachweis für mehrfachen unveränderten KI-Spielstand-Export/Import einschließlich Endarchiv. Systematische Störfälle, Dateifehler und alle Varianten bleiben eigene Pflichten. **BLOCKED**.

**Gesamtmatrix unverändert:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED. Das integrierte Vorrelease-Gate muss bis zur echten Gesamtfreigabe rot bleiben. Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.

## Drei nächste technische Schritte

1. Auf dem dokumentierten KI-Kampagnenstand **Gewinn, Liquiditätsreserve, Schulden, Risiko und langfristige Marktstellung** beider Strategien über mehrere reproduzierbare Starts vergleichen, statt nur Aktionen zu zählen.
2. Vollständige KI-Partien mit **mehreren Regionen, Engpässen, Vertragsstrafen und automatischen Sanierungen** inklusive wiederholter Browserneustarts prüfen.
3. Alle noch offenen unabhängigen Pflichten (insbesondere 77 ausgeschlossene Archivdateien/Rechte, historische C64-Referenz und Release-Dokumentation) getrennt bearbeiten; persönliche Endabnahmen erst nach eingefrorenem Kandidaten.

**Empfehlung:** Zunächst einen reproduzierbaren, quantitativ bewerteten KI-Vergleich mit Baseline und festem Prüfmaßstab erstellen; erst bei nachgewiesenem Nutzen Strategielogik verändern.
