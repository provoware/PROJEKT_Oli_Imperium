# 24 · C0 – Technischer Funktionsumfang eingefroren (keine Freigabe)

**Stand:** 10.10.2026 · **Aktuelle Paketversion:** `0.1.0-alpha.10` · **Funktionsumfang unverändert seit:** `0.1.0-alpha.8` · **Status:** `technical_feature_scope_frozen` · **PR:** #7 (Entwurf)

## Was genau eingefroren wurde

Die HTML-Forschungstestbasis C0 ist **kein Nachbau des C64-Spiels**. Ihr *technischer Funktionsumfang* ist für die gebündelte Vorabnahme festgelegt. Verbindliche maschinenlesbare Quelle ist `release/c0-scope.json`. Die neun dort aufgeführten Implementierungsdateien werden gegen den internen Archivkatalog abgeglichen.

C0 besteht ausschließlich aus diesen nachgewiesenen Funktionen:

1. Bestehende Forschungsdaten nur lesen und mit offenen Status-/Quellen-IDs darstellen.
2. Einen hypothetischen, dreistufigen Bildschirmweg Büro → Weltkarte → Claim-Information mit Rückweg bedienen.
3. Ein begrenztes, technisch validiertes Navigationsprotokoll nach bewusster Nutzeraktion als JSON exportieren.
4. Eine gesonderte, **unverifizierte** Vergleichsvorlage für TEST-001/002/003 als JSON exportieren.
5. Eine deutschsprachige, responsive (an verschiedene Bildschirmbreiten angepasste) und grundsätzlich tastaturbedienbare HTML-Oberfläche anbieten.
6. Lokal und ohne Cloud einen HTTP-Server zur Vorschau verwenden.
7. Lade-/Fehlerzustände und einen erneuten Versuch nach einem Ladefehler anzeigen.
8. Reproduzierbare interne Prüfpakete samt Version, Prüfsummen, Negativtests, Browserbildern und gesperrten Freigaben erstellen.

**Eingefroren heißt:** Keine neuen Spielfunktionen in C0, keine neuen Originalbehauptungen und keine stillen Änderungen der abgeschlossenen Funktionsdefinition. Zulässig sind Fehlerkorrekturen, Sicherheitskorrekturen, Barrierefreiheit, Tests und Dokumentation. Änderungen benötigen weiterhin einen nachvollziehbaren Commit, passende Prüfungen und bei Bedarf eine neue Vorabversionsnummer. Ein größeres Funktionspaket erhält einen eigenen fachlich begründeten Auftrag.

## Was ausdrücklich NICHT Teil dieses Umfangs ist

- Originalgetreue C64-Spielmechanik, Original-Menüpfade als bestätigte Regeln, Grafik, Musik oder Disketteninhalte.
- Wirtschaftssimulation, Ölproduktion, Preisbildung, Spielkampagne oder echte Speicherstände.
- Vollständige historische Forschung, wissenschaftliche Originalbestätigung und urheberrechtliche Prüfung.
- Automatische Übernahme in `main`, öffentliche Releases oder stillschweigende Freigaben.

**Der Originalabgleich steht weiterhin aus:** kein eigener validierter VICE-Lauf, keine zwei überprüften G64-Dateien, **0 von 3** Originaltests nachgewiesen und **0 von 4** Originalregeln freigegeben. Die öffentliche `data/original-session.template.json` bleibt vollständig leer. Private, rechtmäßig gewonnene Originaldaten gehören nicht in dieses Repository.

## Qualitäts- und Abnahmeregel

Die vier Review-Gruppen aus `release/review-segments.json` gelten unverändert:

| Gruppe | Technische Verantwortlichkeit | Menschlicher Gate |
|---|---|---|
| A | Forschungsdaten, Originalaufnahme-Vorlage, Vertragsprüfer | Quellenrechte, wissenschaftliche Originaldaten |
| B | getrennte Navigations-, Protokoll-, Vergleichs-, UI- und Textschichten | Fachliche Interpretation und Bedienbarkeit |
| C | Node-/Python-Tests, echte Chrome-Tastaturprüfung, Mobile/Zoom | Sicht-, Kontrast- und vollständiger Tastaturtest durch Menschen |
| D | Version, Funktionsumfang, ZIP-Manifest, Freigaben | Verantwortliche Gesamtfreigabe und GitHub-Review |

`tools/check_c0_release.py` kontrolliert den Funktionsumfang bei der Paketprüfung. Ein abweichender Dateikatalog oder ein falscher Freigabestatus blockiert das interne Review-Paket.

**Nicht verwechseln:** Ein grüner automatisierter Prüfbericht und die Fixierung des Funktionsumfangs bedeuten **nicht**, dass Nutzer, Hochschule, Rechteinhaber oder GitHub-Verantwortliche etwas abgenommen hätten. Alle vier formellen Felder bleiben `false`. Die Testbasis erhält deshalb **keine Beta-, RC- oder öffentliche Release-Freigabe**.

## Festgestellte und behobene Konsolidierungspunkte

- Technische Schritte wurden bislang beim JSON-Export nur teilweise geprüft. Nun prüft `validatePilotTrace` Startzustand, Versionsschema, kontinuierliche Nummern, erlaubte Übergänge und die begrenzte Schrittfolge für sämtliche Verbraucher. Der Originalvergleich benutzt dieselbe Funktion.
- Beide JSON-Downloadwege enthielten nahezu gleichen Code. Ein zentraler Exportpfad übernimmt nun die gemeinsame Dateierzeugung und Bereinigung temporärer Browseradressen.
- Beim erneuten Laden wird der alte Vertrag vor dem Aufbau einer neuen Sitzung aus dem Controllerzustand entfernt.
- Zusätzliche Negativtests verhindern, dass manipulierte Navigationsfolgen als technische Forschungsdaten ausgegeben werden.

Die Originaldaten und die wissenschaftlichen Freigabestatus wurden nicht verändert.

## Drei nächste Schritte (nach der Funktionsfixierung)

1. PR #7 durch die vier unabhängigen Prüfabschnitte A–D reviewen; relevante Fehler mit Versionsnachweis korrigieren, **keine** neuen Spielmerkmale ergänzen.
2. Eine rechtmäßige C64-Vorlage über Forschung A beschaffen, Hashes und VICE-Belege in einer privaten Aufnahmeakte dokumentieren; die unverifizierte öffentliche Vorlage bleibt leer.
3. Nach unabhängigen menschlichen Sicht-, Tastatur-, Wissenschafts-, Rechte- und GitHub-Freigaben entscheiden, ob eine `beta`- oder `rc`-Fassung vorbereitet werden darf. Kein automatisches Release.

**Verweis:** [Vorabnahmebogen](22_C0_VORABNAHMEBOGEN.md) · [Reviewsegmentierung](23_C0_REVIEW_SEGMENTIERUNG.md) · [Vergleichsvorlage](21_C0_ORIGINALVERGLEICH.md)
