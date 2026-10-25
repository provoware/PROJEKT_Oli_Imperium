# Projekt C – Vorrelease-Pflichtmatrix (22.10.2026)

**Bezugsstand:** PR #14, HEAD `a7b67275d10ad682585816fd46c7ef83cc7d511b`; Hauptzweig `main` wird nicht verändert. Die vollständigen 185 Spielquellen fehlen im GitHub-Zweig. Die Wiederherstellungs-CI aus PR #14 scheitert deshalb **erwartet und zu Recht**. Es existiert kein geprüfter Vorrelease-Kandidat.

Die Matrix `matrix.json` nennt konkrete Pflichten aus PR #14, `AGENTS.md`, `docs/05_TESTS_FORTSCHRITT.md` und dem Vorrelease-Auftrag. **Geplante Funktionen sind keine bestätigten Funktionen.** Die Spalte `basis` kennzeichnet die Herkunft, `status` den tatsächlichen Nachweisstand. `blocked` bedeutet fehlende Spielquellen; `open` bedeutet noch nicht nachgewiesen; `deferred` ist ausschließlich für die drei persönlichen Endabnahmen erlaubt. Kein Punkt ist derzeit als bestanden markiert.

## Befehle

```bash
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node --test project-c/pppoppi-imperium/prerelease/test.mjs
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Die ersten beiden Prüfungen dürfen trotz offener Aufgaben **PASS** liefern: Sie prüfen nur die Matrix und den Schutz vor Scheinfreigaben. `--technical` muss bis zum echten technischen Abschluss mit Exitcode **1 (BLOCKED)** enden; Strukturfehler liefern **2 (FAIL)**. Ein grüner Matrix-Workflow ist ausdrücklich **keine** grüne Spielprüfung. Der Quellimport-Workflow aus PR #14 ist eine zusätzliche, unabhängige Sperre.

Ein Status `pass` ist nur mit mindestens einer regulären JSON-Datei unter `project-c/pppoppi-imperium/prerelease/evidence/` zulässig. Diese muss `gate_id`, `result: PASS`, vollständigen Commit-SHA, tatsächlichen Prüfbefehl und Datum enthalten. Der Prüfer kontrolliert Form und Existenz, **nicht** die Wahrheit des Testberichts; unabhängiger Review und GitHub-CI bleiben zwingend. Vor jeder Statusänderung tatsächlich testen und den Bericht am unveränderten Commit erzeugen.

## Stand und nächstes Arbeitspaket

1. **PR #14**: 185 Spielquellen aus dem eindeutig geprüften V1.9.4-Paket mit Manifest sicher importieren; keine historischen Originaldateien veröffentlichen. Quelle und Prüfsumme mit dem Originalpaket vergleichen.
2. Alle acht Fach-/Langzeitprüfprogramme auf dem importierten Stand in GitHub Actions ausführen; Browserabweichungen und Speicher-/Sicherheitsprüfungen ergänzen.
3. Vollständige Partien, Grafik, 800×600, Skalierung, Tastatur, Offline-Start, Ressourcen und Dokumentation nach Matrix belegen; erst danach Release-Kandidat einfrieren. **Persönliche Sichtprüfung und Kubuntu-Endabnahme erst anschließend gesammelt. Release nur nach ausdrücklicher Nutzerfreigabe.**

**Keine Überschneidung:** Diese Änderung bearbeitet ausschließlich neue Dateien im Ordner `prerelease/` und einen eigenen Workflow. Sie verändert weder die Wiederherstellung aus PR #14 noch den C64-Forschungs-/Prototypenstapel. Der neue Änderungsantrag ist auf den PR-14-Zweig zu richten (gestapelt), nicht direkt auf `main`.

## Umsetzung und Nachweise vom 23.10.2026

- **Änderungsantrag:** [Entwurf PR #16](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/16), Entwicklungszweig `agent/prerelease-c-gate-integrity-20261023-0333` (nicht `main`).
- **Implementierungs-Commit:** `7056024f7ede578693b68f57c93b70927de9e63a` (Prüfer und 8 neue Regressionstests); neuere Dokumentations- und Prüfketten-Commits siehe PR.
- **GitHub-Prüfung der Implementierung:** [Actions #39912753219](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/39912753219): Struktur PASS, **20/20 Node-Tests PASS**; technische Sperre wird korrekt als BLOCKED ausgegeben, nicht als Freigabe.
- **Korrigierter Fehler:** Eine einzelne Pflicht konnte entfernt oder einem falschen Bereich bzw. einer persönlichen Endabnahme zugeordnet werden, ohne dass die frühere Bereichsprüfung es bemerkte. Der Prüfer erzwingt jetzt alle 52 Basis-IDs, ihre Fachbereiche und ihre Stufen. Zusätzliche technische Anforderungen sind zulässig, sofern der Fachpräfix bekannt ist.
- **Aktueller Matrixstand:** 52 Pflichten = 45 BLOCKED + 4 OPEN + 3 persönliche DEFERRED; **0 vollständig nachgewiesen**. Die 49 technischen Pflichten sind noch nicht freigegeben.
- **Quellabhängigkeit:** Die Wiederherstellung aus dem Originalpaket ist nicht abgeschlossen. Die eigenständige Recovery-Prüfung verlangt 110 freigegebene Quell-/Testdateien aus dem ursprünglichen Paket (187 ZIP-Einträge, davon 185 Spiel-Dateien); vollständige Spielfunktion, Sicherheit, Speicherung, Balance und Grafik sind daher nicht auf dem GitHub-Stand testbar.
- **Nächstes Pflichtpaket:** (1) Spielquellen mit verifizierten SHA-256-Prüfsummen rechtskonform wiederherstellen; (2) acht Fach- und Langzeittests und die vollständige technische CI auf demselben HEAD ausführen; (3) Spielstände, vollständige Partien, 800×600, Skalierung und Tastatur automatisiert prüfen und dokumentieren. Fehlende Teilquellen blockieren nur die davon abhängigen Prüfungen.
- **Abnahmegrenze:** Persönliche Sichtprüfung, Kubuntu-Praxistest und Nutzerfreigabe erst nach allen technisch möglichen Prüfungen, grünen Pflichtprüfungen und eingefrorenem Kandidaten. Kein Merge und kein Release ohne ausdrückliche Freigabe.

## Gemeinsamer Integrationszweig (23.10.2026)

Der separate Entwicklungszweig `agent/prerelease-integrated-20261023-2336` führt die unveränderten Matrixprüfer und 20 Regressionstests aus PR #16 mit der gehärteten 110-Dateien-Importprüfung aus PR #18 zusammen. Ausgangs-HEAD: `cfe7bcffe1fd43815080398c2eb58b3bf88a0e48`. Keine Änderung an `main`, keine Zusammenführung bestehender PRs.

Die neue gemeinsame Prüfkette `.github/workflows/prerelease-project-c.yml` führt Matrix, Forschungs-/Grundtests und 18 isolierte Import-Sicherheitsprüfungen aus. Danach sind **sowohl** der tatsächliche 110-Dateien-Import **als auch** sämtliche 49 technischen Matrixpflichten harte Sperren. Anders als im isolierten PR #16 wird ein BLOCKED bei `--technical` **nicht mehr in ein grünes Gesamtergebnis umgewandelt**. Solange die 110 Dateien fehlen, ist ein roter Gesamtstatus korrekt und verpflichtend.

**Korrektur einer begrifflichen Inkonsistenz:** 187 Archiv-Einträge, davon 185 unter `SPIEL/`, sind nicht identisch mit den 110 freigegebenen Quell-/Testdateien. Die übrigen 77 Einträge werden nicht ungeprüft öffentlich übernommen. QUE-01/02 verlangen den geprüften 110-Dateien-Import; notwendige weitere Ressourcen und ihre Rechte müssen gesondert nachgewiesen werden. **0/52 Release-Pflichten PASS; 45 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.**

Der neue Integrationsnachweis steht in `prerelease/INTEGRATION_20261023.md`. Ein bestandener Schema- oder Regressionstest ist kein Beleg für Spielbarkeit. Browser, Langzeitpartien, Speicherung, 800×600, Skalierung, Tastatur, Performance, Offline-Start und Dokumentation bleiben offen. Persönliche Abnahme ausschließlich nach technischem Abschluss.

## Nachtrag: Quellimport vom 25.10.2026

Auf dem getrennten Zweig `restore/v194-verified-sources-20261025` wurden die **110 fest inventarisierten Quell-/Testdateien** aus dem SHA-256-geprüften V1.9.4-Originalarchiv nachgetragen. Der Prüfbericht steht unter [`../QUELLIMPORT_20261025.md`](../QUELLIMPORT_20261025.md). Die oben beschriebenen fehlenden Quelldateien sind damit für **diesen neuen Zweig** kein Hindernis mehr; die älteren Berichte bleiben historische Momentaufnahmen.

Die Matrix kennzeichnet die Quellverfügbarkeit nun als `imported`, hält aber alle 52 Einzelpflichten bis zu unabhängig bewerteten Nachweisen unverändert offen bzw. gesperrt: **0 PASS, 45 BLOCKED, 4 OPEN, 3 DEFERRED**. Acht Fachprogramme wurden lokal ausgeführt; GitHub-CI auf dem endgültigen Commit, Ressourcenrechte, vollständige Partien und Browser-/Speicher-/Kubuntu-Abnahmen bleiben eigene Gates. Keine automatische Freigabe und kein Merge nach `main`.

## Einzelabnahme QUE-02 – 25.10.2026

Erstmals liegt für die **SHA-256-Prüfung aller 110 Quellen** ein unabhängiger
GitHub-Nachweis auf dem tatsächlich gemergten Entwicklerstand
`0ddf47bee13688ad5ecc5d02f5ae07bbc7288b2a` vor. Der
[Quellworkflow #40158404633](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158404633)
war erfolgreich; die Inventardateien blieben seitdem byteidentisch.
Der maschinenprüfbare Nachweis liegt unter `evidence/QUE-02.json`.

**Neuer Matrixstand: 1/52 PASS, 44 BLOCKED, 4 OPEN, 3 DEFERRED.**
Alle 48 anderen technischen Pflichten und alle drei persönlichen Freigaben
bleiben unbestätigt. Diese einzelne Quellenprüfung beweist weder die
Spielbarkeit noch die Rechte der 77 ausgeschlossenen Archivdateien.

## Einzelabnahme QUE-03 – 25.10.2026

Die V1.9.4-Prüfprogramme werden **nicht** als Spielmodule geladen, sondern
verwenden die tatsächlich vorhandenen V1.9.3-Strategie- und Logistikmodule.
Die im Technikaufbau eingesetzte Versionskennzeichnung wird zusätzlich durch
`quality_v194/test_ui_integrity_v194.cjs` abgesichert; Wirtschaftsdateien
werden durch den Aufbau nicht verändert. Der Ausgangsnachweis stammt vom
unveränderten GitHub-Commit `cf7a6cd66e44a79657920b33b5cbc9aba45a8541`,
[Quellworkflow #40158971232](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158971232).

Maschinenlesbarer Nachweis: `evidence/QUE-03.json`.
**Neuer Matrixstand: 2/52 PASS, 43 BLOCKED, 4 OPEN, 3 DEFERRED.**
Originalvergleich, Spielbalance und persönliche Sichtprüfung bleiben offen.

## Einzelabnahme TES-01 – 25.10.2026

Sechs tatsächlich in GitHub Actions ausgeführte Fachprogramme bestanden
zusammen **105 Einzelprüfungen** (18 Markt, 1 Mensch-gegen-Mensch-Parität,
19 Logistik-KI, 28 öffentliches Netz, 17 Strategie, 22 Transport).
Der erfolgreiche [Push-Quellworkflow #40159267861](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159267861)
lief auf dem unveränderten Entwicklungs-Commit
`160c460cbe1f833ce5f8ee18c74b6b4e06589e3a`. Die Paritätsprüfung
lieferte den **nichtleeren** Hash
`e9cea8fd1e3320900a31c91bcda27d3400cd06a20cb2ebd26b648cb98f52524a`.

Zusätzlich wird in der CI die gegen leere/abgebrochene Unterprozesse
gehärtete Paritätsprüfung aus dem Technikaufbau ausgeführt; sie verändert
keine der 110 Quelloriginale. Nachweis: `evidence/TES-01.json`.
**Matrixstand: 3/52 PASS, 42 BLOCKED, 4 OPEN, 3 DEFERRED.**
Langzeitsimulation, tatsächliche Browserbenutzung, Gesamtpartie und
persönliche Sichtprüfung sind dadurch nicht automatisch bestanden.

## Einzelabnahme TES-02 – 25.10.2026

Der unveränderte V1.9.4-Szenarioprüfer absolvierte vier Balancefälle mit
**144 Spielmonaten** sowie vier Krisenfälle mit **156 Spielmonaten**.
Die insgesamt **300 Szenariomonate** wurden in drei erfolgreichen GitHub-Läufen
([#40159267861](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159267861),
[#40159593662](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159593662),
[#40159644336](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159644336))
mit nachweislich **identischen Ausgaben** wiederholt. Der Quellstand
`51f86277bc858451b95df700196df2d1f70b8f64` ist der Bezugs-Commit;
ab dieser Prüfung vergleicht die CI die erneut generierten JSON-Nachweise
mit den versionierten Belegen per `git diff --exit-code`.

Beleg: `evidence/TES-02.json`. **Matrixstand: 4/52 PASS, 41 BLOCKED,
4 OPEN, 3 DEFERRED.** Diese Prüfung zeigt reproduzierbare technische
Konsistenz, **nicht** den Spaß-/Balancegrad oder den Abschluss einer
vollständigen menschlichen Partie.

## Einzelabnahme BAL-02 – 25.10.2026

Vier getrennte, deterministische V1.9.4-Balancefälle zu jeweils 36 Monaten
ergeben exakt **144 simulierte Monate** mit zwölf Jahresständen für
vier beteiligte Firmen. Das Originalprogramm und die versionierten JSON-Daten
wurden auf dem Quell-Commit
`e30ae05ab793485475405fd4b4f7762b6b955434`
in [GitHub-CI #40159924132](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159924132)
bestätigt. `quality_v194/test_balance_report_v194.cjs` kontrolliert
Szenarioabdeckung, Quartett der Firmen und Nichtnegativität der
Jahres-Endkonten zusätzlich im CI-Folgelauf.

Nachweis: `evidence/BAL-02.json`. **Matrixstand: 5/52 PASS,
40 BLOCKED, 4 OPEN, 3 DEFERRED.** Dies ist ein Nachweis für
144 Langzeit-Testmonate, noch kein Beweis für faire Spielbalance.

## Einzelabnahme BAL-03 – 25.10.2026

Die vier V1.9.4-Krisenfälle wurden über **48 + 36 + 36 + 36 = 156 Monate**
simuliert. Nachweis des unveränderten Kerncodes auf
`0a2173895a089d77c4d4da1ec2d4372569b7312f`,
[Quellworkflow #40160147127](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40160147127).
Die zusätzliche Prüfung `quality_v194/test_stress_report_v194.cjs`
kontrolliert vier vollständige Durchläufe, nichtnegative Geldstände und
dass die erzwungene Sanierung tatsächlich eine Rettung ausgelöst hat.

Nachweis: `evidence/BAL-03.json`. **Matrixstand: 6/52 PASS,
39 BLOCKED, 4 OPEN, 3 DEFERRED.** Die gezielten Stressfälle
ersetzen weder allgemeine Insolvenz-, Sieges- und Verlusttests noch
echte menschliche Langzeitpartien.
