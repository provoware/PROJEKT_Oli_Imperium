# OLI V1.9.4 – Tab-Fokus: tatsächliche Sichtbarkeit im 800×600-Browserfenster

Stand: 02.11.2026 · Entwicklungszweig `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **DRAFT, kein Merge, kein Release**.

## Ausgangsbefund

[GitHub-CI #41394778651](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41394778651) auf dem Ausgangs-HEAD [`b286b5dbb238c93a479a12e09e101df80cf0cb09`](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/b286b5dbb238c93a479a12e09e101df80cf0cb09): **18/18 Kampagnenjobs SUCCESS**, darunter beide Rückwärts-Tab-Browserjobs bei 175 % und 200 %. Das bestätigt ausgewählte 14 Tastaturpfade, nicht die vollständige Bedienbarkeit.

**Neue Lücke:** `is_visible()`, `document.activeElement` und `:focus-visible` allein beweisen nicht, dass das Bedienelement im tatsächlich sichtbaren Browserfenster liegt und nicht durch einen Dialog oder ein anderes Element verdeckt wird. Auch ein formal fokussierter Schalter kann für den Nutzer unerreichbar aussehen.

## Neues, eng begrenztes Pflichtpaket

- `campaign_keyboard_audit_v194.py`: Vor jedem der 14 bereits auditierten Enter-Tastendrücke ein **rein lesender DOM-Sichtbarkeitstest**: mindestens 2×2 sichtbare Pixel im aktuellen Browserfenster, `document.elementFromPoint` am Mittelpunkt der sichtbaren Schnittfläche, Treffer muss das Element oder ein Kindelement sein. Bei verdecktem/außerhalb liegendem Element **FAIL vor Enter**.
- `test_campaign_keyboard_audit_v194.py`: drei zusätzliche negative Tests für außerhalb des Fensters, verdeckten Mittelpunkt und unerwartete Prüfdaten; der positive Enter-Test erwartet einen bestätigten Sichtbarkeitstreffer. Damit **12 isolierte Regressionen**.
- `.github/workflows/prerelease-campaign-duration.yml`: vorhandene Tab-Regressionen laufen unverändert als Pflichtschritt, Beschriftung auf 12 aktualisiert. Vorhandene Chromium-Jobs mit 175/200 % und 800×600 prüfen die neue Schranke automatisch; kein neuer redundanter Langzeitjob.
- Kein Spielkern, kein Spielstandschema, keine Wirtschaftsregeln, keine Originaldaten, kein `main` und keine fremden PR-Dateien geändert.

## Reproduzierbare Prüfungen

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/campaign_keyboard_audit_v194.py project-c/pppoppi-imperium/quality_v194/test_campaign_keyboard_audit_v194.py
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_keyboard_audit_v194.py' -v
```

**Vor GitHub-Übertragung lokal ausgeführt:** Python-Syntax **PASS**; **12/12** Unit-Regressionen **PASS**; zusätzlich **4/4** JavaScript-DOM-Geometrieszenarien mit Node.js **PASS** (sichtbar, außerhalb, verdeckt, weniger als 2 Pixel). Dies sind **isolierte Tests**, kein echter Browserlauf auf dem neuen HEAD.

**CI auf dem neuen HEAD:** bis zur Ausführung **PENDING**. Insbesondere die beiden 120-Monats-Tab- und Rückwärts-Tab-Jobs bei 175/200 % müssen nach Abschluss erneut ausgewertet werden. Bei FAIL den konkreten Fokus- oder Überdeckungsfehler beheben; die Sichtbarkeitsprüfung nicht abschalten.

## Vorrelease-Grenze

**BED-02/BED-03 bleiben BLOCKED**: 14 Kontrollpunkte decken nicht alle Dialoge, Minispiele, alternative Ansichten und Tastaturfolgen ab. Auch ein DOM-Treffertest beweist noch keinen ausreichenden Kontrast oder einen tatsächlich erkennbaren Fokusrahmen. Matrix unverändert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Benutzer-/Kubuntu-Endabnahme erst nach eingefrorenem technisch vollständig geprüftem Kandidaten.

## Nächste drei Pflichtschritte

1. Neuen GitHub-CI-Lauf einschließlich der 175/200-%-Browserpfade auf exakt demselben HEAD prüfen und echte Fehler korrigieren.
2. Noch nicht erfasste Dialoge und Minispiele inventarisieren; ihre echten Tastaturwege und Fokusüberdeckungen ergänzen.
3. Unabhängig Leistungsschwellen und Archiv-Randfälle bearbeiten; Rechte und C64-Originalbelege gesondert offen lassen.


## Nachtrag 02.11.2026 – CI-Fehler und verzögerte Tastatur-Bildlaufbewegung

**Echter Befund:** [CI #41400850616](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41400850616) auf HEAD `a820507db8b20908f93b70fff63acecbbe83550e`: **14/18 Jobs PASS, 4/18 FAIL**. Betroffen sind die vier 120-Monats-Tastaturjobs (vorwärts und rückwärts, jeweils 175/200 %). Alle vier scheitern vor der ersten Spielaktion am selben Ziel `#startGame` mit `Tab-Ziel nicht nutzbar im Browserfenster`. Die übrigen 14 Jobs sind erfolgreich; daraus folgt keine Gesamtfreigabe.

**Ursachenhypothese, noch nicht browserbestätigt:** Die Originalseite setzt `html { scroll-behavior: smooth }`; der Startknopf liegt in der unteren Werkzeugleiste. Bei echtem Zoom kann die Tastatur bereits den Fokus setzen, bevor der natürliche, animierte Seitenbildlauf den Knopf ins 800×600-Fenster bewegt hat. Der neue sofortige Geometrietest könnte daher zu früh auslösen. Ein tatsächlich dauerhaft unsichtbarer oder verdeckter Knopf bleibt ein echter Fehler.

**Gezielte Korrektur:** Nur wenn der Knopf unmittelbar nach Tab außerhalb des Fensters liegt, wartet die Prüfschicht bis zu drei Sekunden auf den **natürlichen Browserbildlauf**. Weder `focus()` noch `scrollIntoView()`, künstlicher Klick oder Abschaltung der Überdeckungsprüfung werden verwendet. Danach wird die Geometrie erneut gemessen; ein weiterhin außerhalb liegender oder verdeckter Knopf bleibt **FAIL** und gibt seine Fensterkoordinaten als Diagnose aus.

**Neue Regressionen:** Ein Fall für erfolgreich abgeschlossenen natürlichen Bildlauf und ein Fall für dauerhafte Unsichtbarkeit trotz Zeitablauf; zusammen **14** Tastatur-Einzeltests. Die Korrektur ist erst nach einem tatsächlichen erfolgreichen Browserlauf auf dem neuen HEAD bestätigt; bis dahin **PENDING**.

**Nachweis-/Freigabegrenze:** BED-02/03 weiterhin BLOCKED, Gesamtmatrix 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Keine persönliche Endabnahme, kein Merge und kein Release.
