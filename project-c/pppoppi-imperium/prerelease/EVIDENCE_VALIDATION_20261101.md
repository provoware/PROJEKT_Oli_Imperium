# Vorrelease – Integritaet der Pflichtnachweise (01.11.2026)

## Ziel
Die 52er-Pflichtmatrix darf einen technischen PASS nicht allein aufgrund eines beliebigen oder fehlenden CI-Links akzeptieren. Die Strukturpruefung wird gezielt verstaerkt, ohne Spielkern, Speicherstaende oder bestehende PASS-Zaehlung zu veraendern.

## Aenderungen
- Technische PASS-Nachweise benoetigen eine GitHub-Actions-Laufadresse **aus provoware/PROJEKT_Oli_Imperium** mit positiver numerischer Laufkennung.
- Fuer **jeden technischen PASS** muss `ci_conclusion` ausdruecklich `success` sein. Fehlende, `null`, `pending`, `cancelled` oder `failure` werden abgewiesen. Die bisher fehlende Angabe in `BAL-03.json` wurde erst nach echtem GitHub-Abgleich ergaenzt.
- Nachweisdaten muessen echte Kalendertage sein; z.B. 30. Februar wird verworfen.
- Offene, blockierte oder fehlgeschlagene Pflichten brauchen eine nichtleere naechste Handlung.
- Neue Negativtests decken fehlende/fremde/ungueltige CI-Adressen, Fehlerstatus, falsche Daten und leere Folgehandlungen ab.

## Reproduzierbare Tests
```bash
node --check project-c/pppoppi-imperium/prerelease/check.mjs
node --check project-c/pppoppi-imperium/prerelease/test.mjs
node --test project-c/pppoppi-imperium/prerelease/test.mjs
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Erwartung: Syntax, Node-Tests und Schema PASS; technische Gesamtpruefung weiterhin BLOCKED mit Exitcode 1. Die neuen Kontrollen validieren **nur das Format** eines GitHub-Nachweises, nicht dessen Echtheit, Zuordnung zum Commit oder erfolgreichen Lauf auf GitHub. Diese externe Verifikation bleibt zwingend.

## Freigabegrenzen
6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche Endabnahmen DEFERRED (unveraendert). Kein Release, kein Merge, keine persoenliche Abnahme. Nach GitHub-CI auf dem neuen PR-HEAD: bei Fehlern korrigieren; danach weitere unabhängige technische Pflichtarbeit bearbeiten. Die Browser-Dateiauswahl und Vermoegensmodellierung werden in separaten PRs #151 bzw. #150 behandelt.

## Live-Abgleich der sechs bestehenden PASS-Belege (01.11.2026)

GitHub-Actions-Laufmetadaten wurden ueber die GitHub-API einzeln gelesen. Bei **allen sechs** waren `status=completed`, `conclusion=success` und `head_sha` identisch mit `commit` im jeweiligen JSON-Beleg. Die Eintraege sind historische Teilnachweise, **keine** aktuelle Gesamtfreigabe.

| Pflicht | GitHub-Lauf | Nachweis-Commit (`head_sha`) | Ergebnis |
|---|---|---|---|
| QUE-02 | [40158404633](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158404633) | `0ddf47bee13688ad5ecc5d02f5ae07bbc7288b2a` | PASS |
| QUE-03 | [40158971232](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158971232) | `cf7a6cd66e44a79657920b33b5cbc9aba45a8541` | PASS |
| BAL-02 | [40159924132](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159924132) | `e30ae05ab793485475405fd4b4f7762b6b955434` | PASS |
| BAL-03 | [40160147127](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40160147127) | `0a2173895a089d77c4d4da1ec2d4372569b7312f` | PASS |
| TES-01 | [40159267861](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159267861) | `160c460cbe1f833ce5f8ee18c74b6b4e06589e3a` | PASS |
| TES-02 | [40159644336](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159644336) | `51f86277bc858451b95df700196df2d1f70b8f64` | PASS |

**Pruefgrenze:** Der Schema-Checker fragt GitHub nicht selbst ab. Er erzwingt die dokumentierte Erfolgsangabe, aber externe Nachweise koennen weiterhin nur durch separaten GitHub-API-Abgleich als echt bestaetigt werden. Vorrelease-Pflichtstand unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Vor jedem Merge aktuelle CI auf dem neuen PR-HEAD erneut pruefen. Keine Freigabe, kein Merge, kein Release.

## Live-Pruefer als verbindlicher CI-Schritt (01.11.2026, 07 Uhr MEZ)

**Umsetzung auf PR #153:** `verify_ci_evidence.mjs` gleicht jetzt jeden technischen PASS-Nachweis mit dem **echten** GitHub-Actions-Lauf ueber die GitHub-API ab. Pflichtfelder: Lauf-ID, kanonische URL, Repository, `status=completed`, `conclusion=success`, identischer `head_sha` und (falls hinterlegt) identischer Ereignistyp. Fremde, abgebrochene, noch laufende oder nicht erreichbare Laeufe zaehlen **nicht** als PASS. Ein API-Ausfall liefert FAIL statt einer stillschweigenden Freigabe. Der API-Pfad ist fest auf dieses Repository begrenzt; das Lesetoken wird nur als HTTP-Header uebergeben und nicht protokolliert.

**Pflicht-CI:** `.github/workflows/prerelease-project-c.yml` fuehrt nun `test_ci_evidence.mjs` und die Live-Pruefung mit `actions: read` vor den Forschungs-/Importpruefungen aus. Die bestehende harte technische Sperre bleibt unveraendert und wird nicht als PASS umgedeutet.

**Lokal tatsaechlich ausgefuehrt:** `node --check verify_ci_evidence.mjs`, `node --check test_ci_evidence.mjs`, `node --test test_ci_evidence.mjs` => **13/13 PASS**. Getestet: echter und falscher Lauf, Repository, Commit, URL, Ereignis, Fehl-/Wartestatus, ungueltige Belege, Pfadtraversal, API-Ausfall, Token-Header, Mehrfachabfrage und uebergrosse Kennungen. Die lokale Testausfuehrung verwendet simulierte API-Antworten; sie ersetzt den Live-Test nicht.

**Externer Ist-Abgleich vor Implementierung:** Alle sechs historischen PASS-Lauf-IDs 40158404633, 40158971232, 40159924132, 40160147127, 40159267861 und 40159644336 wurden am 01.11.2026 erneut ueber GitHub abgefragt: jeweils `completed/success`, eigenes Repository und exakt der in der Nachweisdatei genannte Commit. Der **neue automatisierte GitHub-Live-Test auf dem finalen PR-HEAD** muss noch erfolgreich abschliessen; bis dahin kein behaupteter CI-PASS dieses Pakets.

**Grenzen:** Ein erfolgreicher GitHub-Gesamtlauf beweist nicht automatisch, dass der in `command` dokumentierte Einzeltest darin ausgefuehrt wurde. Die Live-Pruefung belegt Laufzuordnung und Abschlussstatus, keine vollstaendige Testschritt-Provenienz oder historische Originaltreue. Matrix **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**; persoenliche Abnahmen bleiben vertagt.

**Naechste technische Pflichtarbeit:** GitHub-Live-Pruefung auf dem letzten PR-HEAD kontrollieren und bei Fehlern korrigieren. Danach die Zuordnung jedes PASS-Belegs zum konkret ausgefuehrten GitHub-Job/Pruefschritt maschinenpruefbar ergaenzen; anschliessend unabhaengige Endspiel-/Vermoegens- und Browserpakete aus den getrennten PRs konsolidieren, ohne deren Dateien hier zu bearbeiten. Kein Merge, kein Release.

## GitHub-Jobschritte statt nur erfolgreicher Gesamtlaeufe (01.11.2026)

Neues eigenstaendiges Pflichtpaket auf PR #153: Jeder technische PASS-Nachweis benoetigt eine **konkrete numerische GitHub-Job-ID** und den **exakten Namen eines erfolgreich abgeschlossenen Schritts**. Der Live-Pruefer kontrolliert Jobzugehoerigkeit zum belegten Lauf, Jobabschluss und eindeutigen Schrittabschluss. Fehlende, doppelte, fremde, fehlgeschlagene oder nicht erreichbare Jobdaten ergeben FAIL. Bei mehr als 100 Jobs wird eine unvollstaendige API-Antwort ausdruecklich abgewiesen. Keine Rechte zum Schreiben oder Umgehen von Sperren.

| Pflicht | Historische GitHub-Job-ID | Erwarteter erfolgreicher Schritt |
|---|---:|---|
| QUE-02 | 121064600924 | Vollstaendige GitHub-Quellen gegen das gepruefte Originalinventar |
| QUE-03 | 121066291329 | Technische Spielablaeufe und statische Oberflaechenvertraege |
| BAL-02 | 121069143534 | Wirtschaftliche Fachpruefungen |
| BAL-03 | 121069803142 | Wirtschaftliche Fachpruefungen |
| TES-01 | 121067189357 | Wirtschaftliche Fachpruefungen |
| TES-02 | 121068323252 | Wirtschaftliche Fachpruefungen |

**Vorab tatsaechlich geprueft:** GitHub lieferte fuer alle sechs historischen Laeufe jeweils genau einen passenden, erfolgreichen Job mit dem genannten erfolgreichen Schritt. Der neue isolierte lokale Node-Test (node --test project-c/pppoppi-imperium/prerelease/test_ci_steps.mjs) bestand **10/10**; Syntax beider neuen Dateien PASS. Die neue CI auf dem finalen GitHub-Commit muss gesondert kontrolliert werden. Die bestehende Matrix bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**.

**Wichtige Grenze:** Die GitHub-Job-API belegt den erfolgreichen benannten Schritt, aber noch nicht bytegenau dessen ausgefuehrte Shell-Befehle. Als naechstes die zugehoerige Workflow-Datei auf dem historischen Commit gegen die dokumentierten Einzelbefehle abgleichen. Endpartien, Vermoegensregeln, Medienrechte, C64-Referenz und persoenliche Abnahme bleiben unabhaengig BLOCKED/DEFERRED. Kein Merge, kein Release.
