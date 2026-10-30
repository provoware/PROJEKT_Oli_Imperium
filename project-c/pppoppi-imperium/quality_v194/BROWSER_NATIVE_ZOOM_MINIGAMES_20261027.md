# Rohrnetz und Feuerwehr bei echtem Browserzoom – 27.10.2026

## Ausgangslage und Schutz
- Spiel: PPPOPPI IMPERIUM V1.9.4, Projekt C, eigenständige Technikvorschau.
- Basis: PR #76, Entwicklungs-HEAD `be648b958f1a75e5b202db3e300d2a91c3fe722f`.
- Neuer Entwurfs-PR: [#77](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/77).
- `main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Keine Änderungen an 110 geschützten Originaldateien, echten Spielständen oder Fachregeln.

## Neuer reproduzierbarer Prüffall

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_minigames_v194.py
```

Das Prüfprogramm baut die Offline-Vorschau aus dem geprüften Quellmanifest in einem temporären Verzeichnis. Eine lokale Chromium-Erweiterung setzt den echten Tab-Zoom per `chrome.tabs.setZoom` und liest ihn mit `chrome.tabs.getZoom` zurück.

Für **175 % und 200 % getrennt** startet es eine neue Partie und spielt per echten Tab-/Enter-Tasten:
1. Gutachten, Kauf und Bohrung eines Feldes.
2. Rohrnetz-Minispiel mit drei Abschnitten und dokumentierten Rohrdrehungen.
3. Drei reguläre Monatsabschlüsse bis zum natürlichen Brand in Monat vier.
4. Feuerwehr-Minispiel mit einem absichtlich falschen Löschversuch und drei erfolgreichen Löschabschnitten.
5. JSON-Spielstandexport mit exakter Gleichheitsprüfung gegen den Zustand vor Export.

Zusätzlich prüft es den Spielkern nach den Minispielen, unveränderte Wirtschaftsdaten durch den Zoom, JavaScript-Fehler und externe HTTP-Anfragen. Die dynamische Dialogbreite und Erreichbarkeit des Schließen-Knopfs werden **diagnostisch** protokolliert, nicht als vollständige Sicht- oder Kontrastfreigabe ausgegeben.

## Prüfstand und Grenzen

- **Implementierung:** neuer Test und Einbindung in `.github/workflows/prerelease-browser-project-c.yml`.
- **GitHub-CI auf Implementierungs-HEAD** \`e8989bf7ec75370a69d5af597abfff6f4928ac2c\`:
  - [Chromium #40445202236](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40445202236): **PASS**, einschließlich neuem Zoom-Minispiel-Test und vollständiger Browserkette.
  - [Quellnachweis #40445202211](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40445202211): **PASS**.
  - [Pflichtmatrix #40445202284](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40445202284): Strukturprüfungen PASS, technische Gesamtfreigabe erwartungsgemäß **BLOCKED**.
- **Tatsächlich gemessen:** bei 175 % CSS-Breite 457 px, bei 200 % 400 px; jeweils drei Rohrnetz- und drei Feuerwehrabschnitte, 32 Rohrdrehungen, ein absichtlich falscher Löschversuch, natürlicher Brand im vierten Monat, JSON-Export gleich dem Spielzustand, keine JavaScript-Fehler oder externen Anfragen. Vier dynamische Layout-Messungen ohne horizontalen Überlauf; Schließen-Knopf im Bildbereich. Die Messung erfolgt nach Abschluss des jeweiligen Minispiels und deckt nicht alle Zwischenbilder ab.
- **BAR-01 und BED-03:** bleiben BLOCKED. Fokuskontrast, Bohr-Minispiel bei echtem Zoom, übrige Dialogaktionen und mögliche Überdeckungen noch nicht vollständig geprüft.
- **Gesamtfreigabe:** weiterhin gesperrt; Sieg-/Niederlagenregeln und vollständige Endpartien fehlen.
- **Persönliche Sicht- und Kubuntu-Abnahme:** bis zum eingefrorenen Release-Kandidaten zurückgestellt.

## Nächste drei Pflichtschritte
1. GitHub-CI und Testprotokoll dieses Zoom-Minispielpakets tatsächlich auswerten, Fehler korrigieren.
2. Bohr-Minispiel und übrige Dialogaktionen unter echtem Zoom prüfen; Fokuskontraste rechnerisch untersuchen.
3. Fachlich belegte Spielendbedingungen und vollständige Endpartien mit Wiederherstellungstest absichern.

**Kein Merge, kein Release.**
