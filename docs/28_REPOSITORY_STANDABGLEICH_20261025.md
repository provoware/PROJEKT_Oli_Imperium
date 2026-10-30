# Oli Imperium – Repository-Standabgleich vom 25.10.2026

## Ergebnis und Begriffsgrenze

**Abgleichbasis:** `main` auf `d3dc371154cc1089e06f34d0dc4ff04047132360`.
Auf GitHub sind **21 Remote-Zweige** mit nicht in `main` enthaltenen Commits
vorhanden; deren gemeinsame Historie umfasst **282 eindeutige Commits außerhalb
von `main`** (`git rev-list --count --all --not origin/main`). Mehrere Zweige
zeigen auf denselben Commit oder enthalten ältere Zwischenstände; 282 ist deshalb
**keine** Anzahl unabhängiger, fertigzustellender Versionen.

**Bereits ins Repository übertragen:** Sämtliche unten aufgeführten Branch-Heads
liegen auf GitHub. **Noch nicht nach `main` übernommen:** die Arbeit auf diesen
21 Zweigen. **Tatsächlich nicht als GitHub-Quelldaten vorhanden:** die 110
freigegebenen V1.9.4-Quell-/Testdateien samt geprüftem Importmanifest.
Ein Abgleich mit nicht bereitgestellten lokalen Kubuntu-Verzeichnissen,
externen ZIP-Dateien oder alten Chat-Dateianhängen war nicht möglich.

## Entwicklungsstände und ihre Grenzen

| Bereich | Relevanter erreichbarer Stand | Einordnung |
| --- | --- | --- |
| A/B-Forschungsbasis V3.0 | [`main`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/main) | Hauptzweig; sechs Commits |
| C0: Browserpilot, Studien-/Testgrundlage | [`docs/c64-public-sources-audit-20261013`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/docs/c64-public-sources-audit-20261013), `d01a1ed4` | Prototyp, Tests, Forschungsunterlagen; **nicht freigegeben**, PR #7–#13 nicht nach `main` gemergt |
| Codex V4: Einzeloperator und Rollen | [`docs/codex-single-writer-agents-v4`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/docs/codex-single-writer-agents-v4), `f9d93fd2` | Eigene Agenten-/Policy-Dateien, nicht mit C0-Hauptzweig gleichzusetzen |
| C0: paralleler Typvalidierungs-Fix | [`fix/c0-c64-capture-type-validation-20261013`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/fix/c0-c64-capture-type-validation-20261013), `c58f0611` | Eigenständige Commitlinie; beim Integrationsreview auf Patchgleichheit prüfen |
| V1.9.4: Wiederherstellungsbasis | [`recovery/pppoppi-imperium-v194-20261021`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/recovery/pppoppi-imperium-v194-20261021), `7be7ef85` | Sicherheitsprüfer und Inventarbezug, **keine 110 Spielquelldateien** |
| Projekt C: neueste Import-/Diagnosearbeit | [`agent/prerelease-c-readonly-recovery-20261025-0233`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/agent/prerelease-c-readonly-recovery-20261025-0233), `faf50eaa` | PR #25 offen; lesende Teilimport-Diagnose, ZIP-Import, Sicherheits- und Matrixprüfungen |
| Projekt C: gesonderter Gate-Nachweis | [`agent/prerelease-c-gate-integrity-20261023-0333`](https://github.com/provoware/PROJEKT_Oli_Imperium/tree/agent/prerelease-c-gate-integrity-20261023-0333), `6aa5a0e7` | Eigenständige Prüfketten-Historie; 52-Pflichten-Schema in der jüngeren Projekt-C-Linie technisch vorhanden, Unterschiede vor Integration einzeln prüfen |

### Vollständige Branch-Referenzliste dieses Abgleichs

Diese 21 Remote-Refs lagen zum Prüfzeitpunkt **nicht in der Historie von
`main`**; die SHA-Werte belegen den jeweils geprüften Zustand.

| Zweig (`origin/` vorangestellt) | HEAD |
| --- | --- |
| `agent/prerelease-c-archive-bounds-20261024-1932` | `705ca1dca48e2244fc37414cb3cd539f45eb5867` |
| `agent/prerelease-c-gate-integrity-20261023-0333` | `6aa5a0e7f9f881a146572659b7581e7c12ebffd1` |
| `agent/prerelease-c-gates-20261022` | `9a975fae9bf9c091a00b27dfcf3ab80f899789a1` |
| `agent/prerelease-c-manifest-parser-20261024-0434` | `176249e3b3a10e9781d97af58bc47a9d033475f7` |
| `agent/prerelease-c-offline-import-20261024-1437` | `6c26a7d902ee66885fcfad37150896154d01ba9b` |
| `agent/prerelease-c-readonly-recovery-20261025-0233` | `faf50eaa31e36741dba0bfd614b9fbde7155875b` |
| `agent/prerelease-c-streamed-source-check-20261024-0929` | `44642b340ce695603553b9280a9e18da5731d361` |
| `agent/prerelease-gate-ids-20261022-1733` | `9a975fae9bf9c091a00b27dfcf3ab80f899789a1` |
| `agent/prerelease-gate-integrity-20261022` | `9a975fae9bf9c091a00b27dfcf3ab80f899789a1` |
| `agent/prerelease-integrated-20261023-2336` | `10f7599f02c71afacaca6354f9e43fe87c1194fb` |
| `agent/prerelease-recovery-hardening-20261023-1836` | `cfe7bcffe1fd43815080398c2eb58b3bf88a0e48` |
| `agent/prerelease-recovery-inventory-20261023-1334` | `f2cc6304e79934d734c342c4d9f7b9dbc17fbba9` |
| `consolidate/c0-pr8-pr9-20261013` | `2ccff054614d7c30498fb543c3c95101f6dbae73` |
| `docs/c64-public-sources-audit-20261013` | `d01a1ed4f189f353b3edc65bd8d318433e01137a` |
| `docs/codex-single-writer-agents-v4` | `f9d93fd2701889c2b582cd088e0466256f12cde4` |
| `docs/reference-only-development-standard-20261013` | `598d626e92a2962c3e65c32583011a98458279c5` |
| `feat/html-research-pilot-navigation-20261010` | `5b616edec2520a5a1cb60f26727ade0a112ab17a` |
| `fix/c0-browser-contract-links-20261013` | `aefc97cb5b9272be9314b3c0dc765ee6bd897de2` |
| `fix/c0-c64-capture-type-validation-20261013` | `c58f0611278e24946532baf3e4d33ebc9e3cc2dd` |
| `fix/c0-robust-nested-data-20261013` | `75136cef5a502b2e5065a664db6dbc5a2c933e5a` |
| `recovery/pppoppi-imperium-v194-20261021` | `7be7ef857223f77f0b32de98fde7e23398249b9e` |

`fix/source-url-provenance-20261021` zeigt wie `main` auf `d3dc3711`
und gehört **nicht** zu den 21 ausstehenden Zweigen.

## Wesentliche nicht veröffentlichbare oder nicht freigegebene Teile

1. **Quellimport:** `project-c/pppoppi-imperium/recovery/README.md` dokumentiert
   zwei archivbezogene SHA-256-Werte und ein Inventar aus 110 freigegebenen
   Dateien. Das Originalarchiv und das geprüfte Quellpaket sind in der
   zugänglichen Repository-Historie nicht enthalten. Nichts synthetisch
   rekonstruieren und keine unbekannten Medien einchecken.
2. **Technische Freigabe:** In der letzten Projekt-C-Matrix sind **0 von 52**
   Punkten freigegeben: 45 `blocked`, 4 `open`, 3 `deferred`.
   Die GitHub-Nachweise in `prerelease/RUN_20261025_0233.md` berichten
   64/64 synthetische Import-/Recovery-Regressionen und 20/20 Matrix-Tests;
   die Quell- und fachliche Gesamtprüfung ist ausdrücklich `BLOCKED`.
3. **C0 und A/B:** Keine Originaltreue ohne freigegebene Referenzdaten und
   C64-Vergleich. Der C0-Zweig hat zusätzliche Prototyp- und Browserprüfungen,
   die nicht mit den V1.9.4-Fachprogrammen verwechselt werden dürfen.
4. **Zusammenführung:** `AGENTS.md` und die Entwicklungsnachweise untersagen
   automatische Merges/Veröffentlichungen. PR #25 ist noch Entwurf;
   PR #24 wurde auf **seinem Projekt-C-Basiszweig**, nicht auf `main`, gemergt.

## Nachholen – sichere und prüfbare Reihenfolge

1. **Quelle bereitstellen:** Eigentümer liefert das rechtlich freigegebene
   V1.9.4-Archiv lokal; dessen SHA-256 und 110er-Inventar mit
   `recovery/import_archive.py` und `recovery/verify_sources.py` prüfen.
   Keine fremden/geschützten Medien oder persönlichen Daten importieren.
2. **Getrennte Reviews:** C0- und Codex-V4-Zweige getrennt gegen `main`
   vergleichen; Projekt-C-Import-/Gate-Historie auf eigenem Integrationszweig
   prüfen. Bestehende Branch-Heads und offene Sperren erhalten, Konflikte
   dokumentieren und alle betroffenen Tests am konkreten Commit ausführen.
3. **Abnahme:** Erst geprüfte Änderungen über nachvollziehbare Pull Requests
   zur Entscheidung vorlegen. Keine automatische Verschmelzung mit `main`,
   kein Release und keine fingierte Freigabe.

**Weiterführende Empfehlung:** Nach Quellbereitstellung einen geschützten,
reproduzierbaren Projekt-C-Kandidaten mit vollständiger technischer CI aufbauen;
erst dann Spiel-, Speicher-, Browser- und Kubuntu-Endabnahme planen.

### Reproduzierbare Prüfkommandos

```bash
git fetch --all
git branch -r --no-merged origin/main
git rev-list --count --all --not origin/main
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
```

Die ersten drei Kommandos beschreiben den **jeweils aktuellen** Zustand; die
Zahlen oben sind eine datierte Momentaufnahme, keine laufende Synchronisation.

## Fortschreibung vom 30.10.2026 – Abgrenzung zum historischen Abgleich

Dieser Bericht ist eine **Momentaufnahme vom 25.10.2026**, kein aktuelles Verzeichnis sämtlicher Entwicklungszweige und kein Freigabe- oder Importnachweis. Die damals gezählten 21 Zweige und 282 zusätzlichen Commits dürfen nicht als heutige Zahlen übernommen werden.

Am 30.10.2026 wurden vor der Zusammenführung von [PR #139](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/139) **98 offene Änderungsanträge (97 Entwürfe)** ermittelt. Nach dessen technisch geprüftem Merge auf `main` ist die Dokumentations- und Entwurfsbremse aktiv. Weitere Spiel- und Quellpakete sind damit **nicht** automatisch integriert oder freigegeben. Der spätere Quellimport wird separat in [PR #27](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/27) dokumentiert; für eine belastbare aktuelle Aussage sind der konkrete Branch-HEAD, Rechte und Quellprüfungen erneut abzugleichen.

Die aktuellen Entwicklungs- und Freigabepflichten bleiben in ihren jeweils maßgeblichen Projekt-C-Dateien und den offenen Änderungsanträgen. Diesen historischen Bericht nicht als Ersatz für einen Live-Bestandsabgleich oder die 52-Pflichten-Prüfmatrix verwenden.
