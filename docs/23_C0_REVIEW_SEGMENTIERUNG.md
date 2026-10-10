# 23 · C0-Review in vier verbindliche, getrennte Prüfabschnitte

**Gültig ab:** C0 0.1.0-alpha.8 · **Status:** technischer Entwurf, keine Freigabe.  
**Zweck:** Der inzwischen große PR #7 bleibt prüfbar, ohne die bereits versionierte Entwicklung in unverbundene Spielnachbauzweige zu zerlegen.

## Verfahren

Die maschinenlesbare Datei `release/review-segments.json` ist der verbindliche technische Gruppenkatalog. `tools/check_review_segments.py` prüft gegen sämtliche Datei-Namen des internen Vorabnahme-ZIP, dass **jede Datei genau einer Gruppe angehört**; neue Dateien ohne Gruppenzuordnung oder mehrfache Zuordnungen blockieren den Paketbau.

**Reihenfolge der fachlichen Teilabnahmen:** A → B → C → D. Eine technische CI-Meldung ist kein unterschriebenes Review. Jeder Abschnitt erhält später eine gezielte Prüfung, eigene Kommentare und die offenen Ergebnisse. Am Ende wird das vollständige Paket gemeinsam freigegeben; kein vorzeitiges Merge und kein öffentliches Release.

| Gruppe | Inhalt / technische Nachweise | Was nicht automatisch freigegeben wird |
|---|---|---|
| **A · Wissenschaftliche Referenz** | Einziger Vertrag, Archivkandidat DE-PAL, private Aufnahmevorlage, SHA-256-/VICE-Prüfer, Python-Negativtests | Quellenrechte, echte Datenträgeridentität, Originalnavigation, Hochschul-/Autorenfreigabe |
| **B · Technisches Modell und HTML** | Reine Navigation, Vertragswächter, Protokoll, unverifizierter TEST-ID-Vergleich, Controller, Renderer, deutsche Texte, Gestaltung | Originaltreue, wirtschaftliche Regeln, Originalgrafiken |
| **C · Reale technische Qualitätskontrollen** | Python/Node, Browserregression mit Desktop/Mobil/150–200 %, Fokus-/Tastaturkontrollen, keine Überlappungen, Testbilder | Menschliche visuelle und barrierefreie Bedienabnahme |
| **D · Versions- und Veröffentlichungssperre** | Changelog, README, Regelwerke, Abnahmebogen, Versionsvertrag, unabhängige Gruppenprüfung, ZIP und SHA-256-Manifest | GitHub-Merge, Wissenschafts-/Rechtefreigaben, öffentlicher Release |

## A – Konkretes Originalexemplar, ohne erfundene Tatsachen

Referenzkandidat ist Source 3 aus Preservation64 (deutsche C64-PAL-Fassung, zwei G64-Seiten), dokumentiert in `docs/18_REFERENZKANDIDAT_C64_PAL.md`. Bis eine **rechtmäßig verfügbare lokale Kopie** samt Dateiprüfsummen und Emulatoraufnahmen vorliegt, bleiben beide Dateien und alle Beobachtungen im Muster `data/original-session.template.json` **null bzw. leer**.

Einmaliger Arbeitsablauf für Forschung A:

1. Nutzungsberechtigung und den tatsächlichen Fund dokumentieren; Originalprogrammdateien nie in dieses öffentliche Repository laden.
2. Beide Originalseiten separat mit `sha256sum` erfassen, Dateigrößen protokollieren, VICE-Version und PAL-Modus notieren.
3. Büro → Weltkarte → Claim → vollständiger Rückweg bei genau diesem Datenträger mit allen Eingaben und unveränderten PNG-Belegen aufzeichnen. SCREEN-003 nur als eigene Ansicht zählen, wenn ein Originalbeleg vorliegt.
4. Eine **private Kopie** der Aufnahmevorlage befüllen und mit `python3 tools/validate_c64_capture.py /privater/pfad/c64-session.json` auf Struktur prüfen.
5. `complete_for_independent_review: true` bedeutet ausschließlich „Unterlagen strukturell vollständig“; der Bericht nennt dennoch `scientifically_verified: false` und `original_tests_approved: 0`.
6. Originalbelege und Schlussfolgerungen von Fachverantwortlichen getrennt beurteilen lassen, bevor `data/contract.json` geändert werden darf.

**Nie** originale Disketten, lizenzrechtlich ungeprüfte Spielbilder, Handbücher oder private Aufnahmeprotokolle in das C0-Review-ZIP übernehmen.

## B – Sauber getrennte Verantwortung

- `navigation.mjs`: Nur hypothetische Bildschirmübergänge, keine Browserzustände.
- `contract-guard.mjs`: Forschungsdatenintegrität ohne Originalfreigabe.
- `pilot-trace.mjs`: Deterministische technische Schrittfolge.
- `reference-comparison.mjs`: TEST-ID-Verweise mit ausdrücklich `not_compared` und `null`-Belegen.
- `app.mjs`: Datenzugriffe, Lade-/Fehlerzustände, bewusste JSON-Exporte.
- `ui/render.mjs` und `ui/texts.de.mjs`: Sichere Anzeige und deutschsprachige Texte.
- `index.html` und `styles.css`: Semantik, Kontrast, Bildschirmgrößen.

## C – Maßgebliche technische Prüfmatrix

Die GitHub-Automatik muss bei **demselben Commit** diese Prüfungen bestehen: Python-Vertrag + Tests, beide Aufnahme-/Gruppenprüfer, Node-Modultests, Chrome-Start, echte Navigation/Downloads, Fokusprüfung, 320/390/640/800/1024 Pixel und die simulierten Layoutbreiten für 100/150/200 % im Browser ohne horizontales Überlaufen. Für mobile Ansichten muss der erste Knopf vor dem langen Forschungsinfobereich erreichbar sein. Chrome erzeugt zusätzlich Desktop-/Mobilbilder. Das neue Werkzeug `tools/chrome_keyboard_probe.mjs` sendet echte Tab-, Umschalt+Tab- und Eingabetasten und prüft den Fokus und die mobile Ansicht. Ein menschlicher Sicht-/Barrierefreiheitsreview bleibt dennoch offen.

## D – Versionierter Gesamtprüfbericht

Das interne ZIP enthält die ausführbare HTML-Testbasis, **alle im Paket benutzten Python- und Node-Prüfdateien**, die Aufnahmevorlage ohne Belege, den Gruppenplan, Forschungshinweise und alle maßgeblichen Projektregeln. `REVIEW_STATUS.json` und `REVIEW_MANIFEST.json` enthalten Version, Originalstatus und einzelne SHA-256-Nachweise. Das gleiche Quellmaterial muss stets das gleiche Archiv ergeben. Danach wird das ZIP in ein eigenständiges Verzeichnis entpackt und seine Python- und JavaScript-Prüfungen werden dort erneut ausgeführt. Lokale Verweise der HTML-Startseite müssen im Paket vorhanden sein. Der SHA-256-Wert dient der Integritätsprüfung, nicht als digitaler Herkunftsnachweis.

Das Review-Verzeichnis ist **kein** GitHub-Release; dafür fehlen bestätigte Nutzungsrechte, Originalvergleiche und formelle Genehmigungen. Erst nach kontrolliertem Fachreview kann aus `0.1.0-alpha.N` ein klar abgegrenzter `beta`- oder `rc`-Kandidat entstehen. Eigene Versionsnummer für C0, unabhängig von Forschungs-Datenvertrag 1.0 und Dokumentation 3.0.

**Verbindliche Funktionsfixierung:** [24_C0_TECHNISCHER_UMFANG.md](24_C0_TECHNISCHER_UMFANG.md) mit maschinenlesbarer Liste in `release/c0-scope.json`. Technisch eingefroren bedeutet nur, dass keine weiteren Spielfunktionen in C0 hinzugefügt werden. Die vier verantwortlichen Personen-/Fachfreigaben bleiben ausstehend.

## Regel für neue Features

Betroffene Gruppe, Regel-/TEST-ID, bereits bekannte Unsicherheit, konkrete negative und positive Testfälle **vor jeder neuen Arbeit benennen**. Kleine Commits sind gut; eine unstrukturierte PR-Abnahme ist es nicht. Änderungen an mindestens zwei Gruppen benötigen ausdrücklich beide Prüfvermerke. Auch ein vollständig grüner Techniklauf erteilt **keine** Freigabe.

**Nächste drei Schritte:** ① Gruppenvollständigkeit automatisch überprüfen; ② Chrome-Regressionsmatrix mit der bei 150 % bzw. 200 % verkleinerten **wirksamen CSS-Viewportbreite** einschließlich Fokus ausführen; einen echten Browser-Zoom über Tastenkombination und tatsächliche Bedienbarkeit später zusätzlich manuell prüfen; ③ vollständiges internes Paket erzeugen, technisch prüfen und die offenen Original- und Freigabegates transparent ausweisen.
