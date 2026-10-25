# V1.9.4-Technikaufbau – Schutz vor unsicheren Zielpfaden

**25.10.2026 | separater Vorrelease-Entwicklungszweig, kein Merge, kein Release.**

## Grundlage und Abgrenzung

- Ausgangspunkt: Quellwiederherstellungszweig `restore/v194-verified-sources-20261025`, Commit `8f2fa297825ecf35be92726ccc363a18134e0ae7`.
- Nur der **separat erzeugte Technikaufbau** (`quality_v194/build.cjs`) wird geändert. Die 110 verifizierten Originaldateien in `SPIEL/`, die Wirtschaftsregeln, gespeicherte Spielstände und die Forschungsdaten A/B bleiben unverändert.
- Ziel: verhindern, dass ein Build unbemerkt über einen symbolischen Verweis in das Spieloriginal oder in fremde Ordner schreibt.

## Implementierte Schutzregeln

1. Ziel muss neu sein; ein bestehender Ordner **oder ein hängender symbolischer Verweis** wird zurückgewiesen. Vorhandene Dateien werden nicht gelöscht oder überschrieben.
2. Sämtliche vorhandenen Elternordner werden auf echte Verzeichnisse geprüft. Ein symbolischer Verweis in der Zielkette ist unzulässig.
3. Der aufgelöste Zielpfad darf nicht innerhalb der unveränderlichen `SPIEL/`-Originale liegen.
4. Nach dem Anlegen des Zielordners wird seine kanonische Lage erneut geprüft, **bevor** die erste Quelldatei kopiert wird.
5. Neue Dateien werden exklusiv angelegt (`wx` bzw. `COPYFILE_EXCL`); der Build kann bestehende Dateien nicht stillschweigend ersetzen.
6. Wie zuvor wird die vollständige 110er-Quellintegrität vor dem Aufbau geprüft. Bei einem Fehler wird **kein fremder Ordner aufgeräumt**.

## Reproduzierbare Prüfungen

```bash
node project-c/pppoppi-imperium/quality_v194/test_build_safety_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_gameflow_v194.cjs
python3 project-c/pppoppi-imperium/recovery/verify_sources.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

Die neue Testdatei prüft **acht** isolierte Fälle: Inventar, leeres Ziel, Schreibversuch unter `SPIEL/`, Symlink-Elternordner, hängender Ziel-Symlink, vorhandener Ordner mit fremder Datei, fehlender Elternordner und regulärer 110-Dateien-Aufbau. Die GitHub-Quell-CI führt sie künftig als Pflichtschritt aus.

**Grenze:** Die Prüfung ist keine vollständige atomare Garantie gegen einen absichtlich parallel ausgetauschten Pfad *während* des Kopierens. Für eine solche Garantie wäre ein an offene Verzeichniskennungen gebundener, plattformspezifischer Kopierweg nötig. Ein abgebrochener Build kann einen unvollständigen **neu angelegten** Zielordner hinterlassen; dieser wird bewusst nicht automatisch gelöscht.

## Offene Vorrelease-Pflichten

Die Änderung erfüllt **keinen** vollständigen Matrixpunkt allein. Weiterhin offen sind insbesondere Browser-Partien, Speicherung und Wiederherstellung, 800×600/Zoom, Tastatur, Performance, Quellrechte und technische Gesamtfreigabe. Persönliche Sichtprüfung und Kubuntu-Praxistest erfolgen erst nach allen eigenständig möglichen technischen Freigaben.

**Nächste Umsetzung:** Erst CI dieses Zweigs auf dem endgültigen HEAD kontrollieren; danach sichere Unterbrechungsdiagnose für unvollständige Technikaufbauten ergänzen, ohne fremde Daten zu löschen.


## Fortsetzung: lesende Diagnose unterbrochener Technikaufbauten (25.10.2026)

**Umfang:** diagnose_build.cjs, test_diagnose_build.cjs und Anbindung an test_build_safety_v194.cjs. Der unveränderte Spielkern, die 110 Originaldateien und Spielstände werden weder repariert noch beschrieben.

**Aufruf nach einem Aufbau:**

    node project-c/pppoppi-imperium/quality_v194/diagnose_build.cjs /pfad/zum/bestehenden-technikordner

Die Diagnose vergleicht die vorhandenen Dateien gegen das Quellmanifest (SHA-256, Dateigröße) und die vier bewusst angepassten Ausgabedateien gegen den reproduzierbar berechneten Sollinhalt. BUILD_INFO.json ist die Bestätigung des fertigen Aufbaus; sie wird nicht erzeugt oder verändert. Fehlende, zusätzliche und veränderte Dateien werden einzeln benannt. Symbolische Verknüpfungen und Spezialdateien werden zurückgewiesen.

| Status | Bedeutung |
|---|---|
| absent | Ziel existiert nicht |
| empty | Ziel existiert, enthält aber nichts |
| incomplete | Mindestens eine Soll-Datei fehlt |
| unconfirmed | Alle Soll-Dateien stimmen, aber die Bestätigung fehlt |
| complete | 110 Dateien und Bestätigung stimmen |
| damaged | Inhalt, Bestätigung oder Fremddateien weichen ab |
| unsafe | Symlink, Spezialdatei, unsicherer Pfad oder zu tiefer Verzeichnisbaum |

**Ausgangscode und Nachweise:** Basis-PR #35 auf HEAD 8b660299d9d4e85216fb80d101e1331842ab3069. Elf neue isolierte Diagnosetests wurden am 25.10.2026 lokal unter Node.js 22 ausgeführt: **11/11 PASS**. Die bereits vorhandenen acht Aufbauprüfungen und die tatsächliche Quell-CI müssen auf dem neuen GitHub-HEAD erneut geprüft werden; bis dahin keine Gesamtfreigabe. Der neue Diagnosecode prüft **keinen Stromausfall** und garantiert keinen Schutz gegen gleichzeitige böswillige Pfadwechsel.

**Pflichtmatrix:** Kein bisher blockierter Gesamtpunkt wird durch diese Teilprüfung automatisch freigegeben. Besonders FEH-01, STA-03, SPE-01..03, VER-01..03, GRA-03, BED-02..03 und PER-01..02 bleiben bis zu den jeweils vollständigen Nachweisen offen/blockiert.

**Nächste Implementierung:** Technischen Browserstart und einen isolierten Speichern→Neustart→Wiederherstellen-Rundlauf auf dem erzeugten V1.9.4-Prüfstand automatisieren; danach 800×600, Tastatur und Zoom ohne persönliche Sichtabnahme prüfen.
