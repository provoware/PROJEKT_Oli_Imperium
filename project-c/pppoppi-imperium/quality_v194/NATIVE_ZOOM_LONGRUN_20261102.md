# OLI V1.9.4 – echter 175/200-%-Tab-Zoom über 120 Spielmonate

**Arbeitsstand:** 02.11.2026 (technischer Entwurf). **Zweig:** `test/oli-campaign-24-60-20261101`, Entwurfs-PR #155. **Keine Releasefreigabe, kein Merge nach main.**

## Pflicht und Abgrenzung

**BED-03, GRA-02/03, BED-02, VER-01/03, SPE-01, PER-01/02:** Das neue, isolierte Pflichtpaket erweitert den vorhandenen echten 120-/240-Monats-Chromium-Prüfer um `--zoom 175` und `--zoom 200`. Beide neuen CI-Aufträge spielen jeweils 120 echte Monate mit vier Menschen (480 Tastaturzügen), natürlicher Sanierung falls sie auftritt, Export/Import zur Halbzeit und nach dem Abschluss, Rangfolge, Archivschutz und drei vollständigen Chromium-Prozessen. Der Browser startet mit **800×600 physischen Viewport-Pixeln**. Die Zoomstufe wird **nicht** mit CSS oder künstlicher Geräteskalierung simuliert, sondern durch `chrome.tabs.setZoom` einer temporären Manifest-V3-Erweiterung gesetzt und mit `getZoom` sowie `devicePixelRatio` gegengeprüft.

Jeder der drei Browserprozesse verwendet ein **eigenes leeres Profil**; Zoom 100 % wird vor dem Setzen des Zielwerts kontrolliert. Ein Fehler bei echtem Zoom, horizontalem Überlauf, Tastaturbedienung, Spielzustand, Archiv, Browser-Neustart oder JavaScript führt zu **FAIL**, nicht zu einem nachträglichen stillen PASS. Keine echten Benutzerdaten, keine Veränderung der 110 geschützten Spielquellen, keine Änderung des Spielstandformats. Ein technischer PASS ist **keine persönliche Sichtabnahme** und belegt nicht automatisch jede Spielsituation oder historische C64-Originaltreue.

## Reproduzierbare Prüfungen

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 175
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 200
```

**Voraussetzungen:** Node.js, Python 3, Playwright und Chromium gemäß `install_chromium_ci.sh`. Die beiden Browserläufe werden auf GitHub mit getrennten Matrix-Jobs und ohne `fail-fast` ausgeführt. Auch wenn einer scheitert, bleibt das andere Ergebnis sichtbar. Der bisherige 100-%-Pfad bleibt unverändert über den Standardwert `--zoom 100`.

## Tatsächlicher Ausgangsnachweis

Auf Ausgangs-HEAD [93a8b481](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/93a8b481d73d99c22085c9fe691d997f18eddc4d) ist der [bisherige Kampagnenlauf #41357474286](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41357474286) **SUCCESS**, einschließlich aller sechs Jobs (24/120/240 Monate, 120-/240-Monats-Wiederholung und Regressionen). Sieben der acht zu diesem HEAD gefundenen Workflows sind SUCCESS; die integrierte Vorrelease-Sperre [#41357474058](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41357474058) ist FAILURE. **Die neue 175-/200-%-Langzeitprüfung ist auf diesem Ausgangs-HEAD NICHT vorhanden und daher NICHT als PASS belegt.**

## Aktueller Status und Pflichtmatrix

- **Implementierung:** Erweiterung des Langkampagnenprüfers, zwei neue native Zoom-Jobs, diese Dokumentation.
- **Neue 175/200-%-Browserjobs:** **PENDING**, bis GitHub den abschließenden Commit einschließlich dieser Dokumentation geprüft hat. **Keine lokale Chromium-Ausführung** in diesem Lauf behauptet.
- **Pflichtmatrix:** unverändert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Insbesondere **BED-03 bleibt BLOCKED**, bis die realen Läufe, Layoutfehler und die weiteren technischen Pflichtfälle vollständig nachgewiesen sind.
- **Noch offen:** 240 Monate mit nativem Zoom, gezielte Überlauf- und Fokusprüfung aller relevanten Dialoge im langen Verlauf, wiederholte Leistungswerte und Grenzwerte, 240-Monats-Archivierungsumfang, Vermögensbewertung, Medienrechte, C64-Originalvergleich.
- **Endabnahme:** Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach allen eigenständig möglichen technischen Prüfungen und eingefrorenem Kandidaten; Release nur nach ausdrücklicher Nutzerfreigabe.

## Nächste drei technische Schritte

1. CI für beide Zoomstufen und die übrigen Pflichtjobs auf dem **finalen HEAD** auswerten, FAIL mit konkretem Monats-/Schrittbeleg dokumentieren.
2. Reproduzierbare Layout-/Fokus- oder Importfehler isoliert korrigieren, Negativ-/Regressionstests ergänzen und beide Zoompfade erneut prüfen; keine Schutzprüfung abschwächen.
3. Danach die 240-Monats-Archivierung und native Zoom-Wiederholung getrennt nachweisen; Performancegrenzen nur aus mehreren vergleichbaren Messungen ableiten.
