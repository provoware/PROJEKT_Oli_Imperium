# Projekt C – Zusammenführung der Vorrelease-Pflichten, 23.10.2026

## Nachvollziehbarer Umfang
- Basis: Recovery-PR #18, HEAD `cfe7bcffe1fd43815080398c2eb58b3bf88a0e48`.
- Matrix-Herkunft: Entwurfs-PR #16, HEAD `6aa5a0e7f9f881a146572659b7581e7c12ebffd1`.
- Die beiden Prüfer `prerelease/check.mjs` und `recovery/verify_sources.py` bleiben fachlich unabhängig; nur die gemeinsame CI erzwingt beide.
- Matrix: 52 feste Pflichten in 16 Bereichen, 49 technische und drei persönliche; 45 BLOCKED, vier OPEN, drei DEFERRED, **null PASS**.
- Herkunftsgrenze: 187 Archiveinträge, davon 185 unter SPIEL, aber nur 110 explizit freigegebene Quell-/Testdateien. 77 weitere Einträge sind nicht automatisch freigegeben.
- Änderungen: Matrix und Regressionen aus PR #16 in den Recovery-Zweig übertragen; QUE-01/02 präzisiert; kombinierter Workflow mit harten Quell- und technischen Sperren; keine Spielquellen importiert.

## Prüfbefehle und Sollstatus
```bash
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node --test project-c/pppoppi-imperium/prerelease/test.mjs
python3 -m unittest discover -s project-c/pppoppi-imperium/recovery -p 'test_verify_sources.py' -v
python3 project-c/pppoppi-imperium/recovery/verify_sources.py
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Struktur-/Negativtests dürfen PASS sein. Der Quellencheck muss ohne 110 Dateien **BLOCKED** und der technische Matrixcheck **BLOCKED** melden; der gemeinsame Workflow darf dadurch nicht grün werden. Neue CI-Ergebnisse erst nach Ausführung am endgültigen Commit in den PR aufnehmen. Die acht wirtschaftlichen Fachprogramme starten erst nach erfolgreichem Quellimport im separaten Recovery-Workflow.

## Offene Pflichtarbeit und Reihenfolge
1. **P0:** Das rechtlich geprüfte 110-Dateien-Paket und Manifest auf eigenem Importzweig aus dem Originalarchiv sicher einbringen; keine Original-C64-Medien und kein Überschreiben.
2. **P0:** Beide Sperren auf identischem HEAD grün prüfen, acht Fachprogramme und echte vollständige Partien einschließlich Speicher- und Wiederherstellungsfehlern nachweisen.
3. **P1:** Browser, 800×600, Vergrößerung, Tastatur, Barrierefreiheit, Offline-Start, Performance, Dokumentation und vollständige Regressionen schließen; erst danach Kandidat einfrieren.

**Keine automatische Zusammenführung, keine Veröffentlichung.** Nutzer-Sichtprüfung und Kubuntu-Praxistest sind ausschließlich persönliche Schlussprüfungen. Release nur nach ausdrücklicher Freigabe.
