# Vorrelease-Teilpaket: Bohr-Minispiel mit Sitzungsexport und Kampagnenabschluss

**Datum:** 29.10.2026 · **Projekt:** PPPOPPI IMPERIUM, abgeleitete V1.9.4-Technikfassung · **Entwurfs-PR:** [#125](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/125).

## Vorprüfung und Abgrenzung

- GitHub-`main`: `d3dc371154cc1089e06f34d0dc4ff04047132360` (vor der Änderung).
- Gestapelte Basis: [PR #124](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/124), `3016c518149ac9ff12f6f0b10e1a93029d7cf9b1`.
- Neuer Browser-Test und eigener Workflow, keine Änderung an den 110 manifestgeschützten `SPIEL/`-Originaldateien, keine Änderung am Wirtschaftskern.
- Teilpflichten: LOG-04, VER-01, VER-03, SPE-01, TES-03; alle bleiben bis zur vollständigen Fachabnahme BLOCKED.

## Warum dieser Test notwendig ist

Die bisherigen Browser-Tests belegten entweder ein Bohr-Minispiel bis zum Export eines **alten** Spielstandes oder vollständige Kampagnen mit versionierter Sitzung, aber nicht die Verbindung beider Abläufe. Ein Prozessneustart **mitten in einem aktiven Minispiel** kann Bedienzustand, Startkosten, Monatsfortschritt oder den Abschlussvertrag verlieren.

## Reproduzierbarer Prüfablauf

1. Temporären Offline-Technikaufbau aus exakt 110 geprüften Quellen erzeugen, ohne bestehende Dateien zu überschreiben.
2. Vier menschliche Firmen und 12-Monats-Kampagne über die echte Oberfläche starten. Feld `BERLIN-1` begutachten und kaufen; dreistufiges Bohr-Minispiel über die echte Bedienung starten.
3. Während Bohrabschnitt 1 aktiv ist, die **versionierte Sitzung** über den sichtbaren Exportknopf speichern. Prüfen: `schema`, 12-Monats-Vertrag, aktives Minispiel und vollständiger Spielzustand stimmen überein.
4. Chromium-Prozess vollständig beenden, einen neuen starten und die Sitzung über die echte Dateieingabe laden. Die Minispielphase und alle Buchungen müssen identisch bleiben.
5. Alle drei Bohrabschnitte mit Tab, Home, Pfeiltasten und Enter abschließen; Zielwerte vom vorhandenen Spielkern lesen, Spielkern nach jeder Aktion validieren. Keine doppelt berechneten Starttage.
6. Die 12 Monate mit echten Spielerwechseln und Monatsberichten abschließen, Endwertung und schreibgeschütztes Archiv exportieren. Nach drittem Chromium-Prozess Archiv erneut laden und unveränderten Zustand sowie Aktionssperre prüfen.
7. 800×600 ohne horizontalen Seitenüberlauf, keine externen HTTP-Anfragen und keine JavaScript-Laufzeitfehler prüfen.

**Abnahmeregel:** Jede fehlende Phase, jede Datenabweichung, ein nicht erfolgter Download oder Browserneustart, ein fehlerhafter Tastaturablauf oder ein vorzeitiges Archiv ist FAIL. Ein erfolgreiches Ergebnis ist nur ein technischer Teilnachweis, **keine historische C64-Originaltreue und keine Vorrelease-Freigabe**.

## Prüfstand und offene Pflichten

- **Ausführung:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_drill_recovery_v194.py`.
- **GitHub-CI:** `.github/workflows/prerelease-campaign-drill.yml`; Ergebnis auf endgültigem Commit erst nach tatsächlicher Ausführung nachtragen.
- **Basis-CI:** [PR #124](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/124) hatte auf `3016c518149ac9ff12f6f0b10e1a93029d7cf9b1` Quellschutz und Browserregressionen PASS, aber integrierte Vorrelease-Sperre BLOCKED.
- **Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED = 52; keine Statusänderung durch dieses Teilpaket.
- **Noch offen:** andere Minispiele mitten in einer Kampagne, mehrere Insolvenz-/Wirtschaftsgrenzfälle, Ressourcenrechte, vollständige technische Freigabe, verifizierter historischer Originalvergleich. Persönliche Sichtprüfung/Kubuntu-Endabnahme erst nach technischem Kandidaten-Freeze.

## Nächste drei Schritte

1. Den neuen Chromium-Job auf dem finalen HEAD vollständig auswerten; bei FAIL Ursache beheben und erneut prüfen.
2. Dieselbe Unterbrechungs- und Abschlusskette für Rohrnetz/Feuerwehr sowie komplexere Wirtschaftszustände ergänzen.
3. Ressourcen- und Rechteinventar, C64-Referenz und übrige Pflichtgates unabhängig abschließen.

**Kein Merge, kein Release ohne ausdrückliche Nutzerfreigabe.**
