# OLI V1.9.4 – Rueckwaerts-Tastaturnavigation, 02.11.2026

**Zweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **kein Merge, kein Release**.

## Nachgepruefter Ausgangspunkt

[GitHub Actions #41389498165](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41389498165) auf [HEAD c7c1b9ad](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/c7c1b9ad0d49827318c3ebc726f49796a5af7473): **16/16 Jobs SUCCESS**, einschliesslich der 120-Monats-Tab-Kampagnen bei 175 und 200 Prozent. Dies beweist die bisherigen 14 Tab+Enter-Schluesselaktionen, **nicht** die gesamte Tastaturbedienung aller Szenen.

## Neues unabhaengiges Pflichtpaket

- `campaign_keyboard_reverse_v194.py`: Nach bereits echtem Tab-Fokus einmal `Shift+Tab` und dann `Tab`. Die erste Taste **muss** das Ziel verlassen, die zweite **muss** denselben Schalter wieder fokussieren; `:focus-visible` muss danach vorhanden sein. Kein `focus()`, keine DOM-Manipulation, keine Umgehung bei FAIL.
- `test_campaign_keyboard_reverse_v194.py`: **sechs** deterministische Positiv-/Negativtests fuer erfolgreichen Rueckweg, fehlenden Anfangsfokus, haengenden Rueckwaertsfokus, verlorene Rueckkehr, fehlenden sichtbaren Fokus und ungueltige Ziele.
- `test_browser_campaign_120_240_v194.py`: neue **optionale** `--reverse-tab-audit`-Pruefung fuer die bereits definierten 14 Schluesselkontrollen. Die Option erfordert `--keyboard-audit` und damit `--native-import`. Vorherige Standardpfade bleiben unveraendert.
- `.github/workflows/prerelease-campaign-duration.yml`: neue eigenstaendige 120-Monats-Chromium-Jobs bei **175 und 200 Prozent**, 800×600, 480 Spielzuegen, drei Browserprozessen, zwei nativen Dateiimporten und jeweils 14 echten Rueckwegen; sechs Regressionen zusaetzlich im allgemeinen CI-Job.

**Lokal isoliert ausgefuehrt:** `python3 -m unittest discover -s /tmp/oli_reverse -p 'test_campaign_keyboard_reverse_v194.py' -v` = **6/6 PASS**; `python3 -m py_compile /tmp/oli_reverse/*.py` = **PASS**. Die lokal getesteten neuen Modul-/Testdateien wurden inhaltsgleich in den Entwicklungszweig uebertragen. Das ist **kein** GitHub-Browsernachweis.

**GitHub-CI fuer das neue Paket:** **PENDING**, bis die beiden neuen 120-Monats-Jobs und der Gesamt-Regressionsjob auf dem finalen HEAD wirklich abgeschlossen sind. Bei einem Fehler zuerst den tatsaechlichen Fokuspfad untersuchen, den Pruefer nicht abschalten.

### Reproduzierbar

```bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_keyboard_reverse_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 175 --native-import --keyboard-audit --reverse-tab-audit
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 200 --native-import --keyboard-audit --reverse-tab-audit
```

## Pflichtmatrix und Abgrenzung

BED-02/BED-03 erhalten nur einen weiteren **Teilnachweis**. Vollstaendige Dialoge, Minispiele, Reihenfolge und alternative 800×600-Szenen bleiben offen. Gesamtmatrix unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Performancegrenzen, Vermoegensbewertung, Medienrechte und C64-Referenz bleiben gesondert offen. Keine persoenliche Endabnahme vor eingefrorenem technischen Kandidaten.

## Naechste drei Schritte

1. Beide neuen Rueckwaerts-Tab-Browserjobs und den Regressionsjob auf finalem HEAD pruefen, Fehler reproduzieren und gezielt beheben.
2. Bei Erfolg die noch nicht geprueften Dialog-/Minispielpfade inventarisieren und jeweils echte Vorwaerts-/Rueckwaerts-Tab+Enter-Nachweise planen.
3. Unabhaengige Archiv-Randfaelle und Leistungsgrenzen bearbeiten, ohne das blockierte Tastatur-Gesamtgate als bestanden zu markieren.

**Empfehlung:** Ein gepruefter Rueckweg ist ein zusaetzlicher Bedienbarkeitsbeleg, keine pauschale WCAG- oder Releasefreigabe.
