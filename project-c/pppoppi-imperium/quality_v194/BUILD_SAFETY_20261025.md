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
