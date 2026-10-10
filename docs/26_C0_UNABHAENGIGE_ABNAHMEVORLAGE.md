# 26 · Unabhängige Bedienungsprüfung und gebündelte C0-Freigabe (VORLAGE)

**Paketstand:** 0.1.0-alpha.10 · **Geltung:** eingefrorener HTML-Forschungsprototyp C0 · **Status:** PRÜFUNG AUSSTEHEND · **PR:** #7 (Entwurf).

**Nicht mit dem automatischen CI-Ergebnis verwechseln:** Die vorhandenen Browser-/Tastaturtests liefern technische Ausführungsnachweise, aber **keine unabhängige menschliche Sichtprüfung**, keine rechtsgültige Lizenzprüfung und keinen wissenschaftlichen C64-Originalbeleg. **Dieses Dokument bescheinigt keine Abnahme.** Die einzige verbindliche Maschinenquelle für bestehende Freigaben bleibt `release/approvals.json`; dort sind alle vier Freigaben `false`. Die hier beschriebenen Formularfelder sind **privat und erst nach tatsächlicher Prüfung** auszufüllen.

## 1. Prüfidentität – erst bei tatsächlicher Abnahme ausfüllen
- **Geprüfte Fassung und Commit:** 0.1.0-alpha.10 / SHA: offen.
- **Datum, Testgerät und Browser-Version:** offen.
- **Prüfende verantwortliche Person/Funktion:** offen (nicht ungefragt ins öffentliche Repository eintragen).
- **Prüfgegenstand:** C0-HTML-Pilot; **kein** C64-Spieloriginal und kein fertiges Spiel.
- **Vorgelegtes ZIP, Hash und Prüflauf:** offen; stets mit dem exakt gleichen Commit abgleichen.

## 2. Praktische Bedienung – echte Person, nicht simulierte Vergrößerung

**Prüfregel pro Zeile:** `ausstehend`, `bestanden`, `nicht bestanden` oder `nicht anwendbar (begründet)`. Ohne tatsächliche Beobachtung bleibt die Zeile ausstehend.

| ID | Arbeitsauftrag und erwarteter Befund | Ergebnis / Beleg |
|---|---|---|
| B-01 | Desktop mit **1280×800 bei 100 %**: Navigation, Informationen, Status und Protokoll klar lesbar, keine Überlagerung. | ausstehend |
| B-02 | **Echter Browser-Zoom 150 %** (nicht nur schmaleres Fenster): alle Schaltflächen mit Tastatur und Maus erreichbar; Text nicht abgeschnitten. | ausstehend |
| B-03 | **Echter Browser-Zoom 200 %**: Umbruch einspaltig, keine abgeschnittenen Schaltflächen, kein zwingendes horizontales Scrollen. | ausstehend |
| B-04 | Kleine Ansichten **390 und 320 CSS-Pixel**: bedienbarer Pilot zuerst, Hilfe-/Quellenlinks weiterhin auffindbar, keine Überlagerung. | ausstehend |
| B-05 | Ohne Maus **Tab/Shift+Tab**: überspringbarer Kopfbereich, Neu-Laden, Entwurfsnavigation, Quellenlinks, JSON-Exporte, Forschungslinks in nachvollziehbarer Reihenfolge. | ausstehend |
| B-06 | Fokusrahmen in allen Bedienzuständen sichtbar, aktive Schaltfläche ist erkennbar. | ausstehend |
| B-07 | **Enter** aktiviert den gewählten Entwurfsschritt, anschließend Fokus und Bildschirminhalt passend. | ausstehend |
| B-08 | Büro → Weltkarte → Claim → Karte → Büro; technische Schrittfolge und beide **bewussten** JSON-Downloads sind vollständig und als unverifiziert markiert. | ausstehend |
| B-09 | Ladefehler simulieren (lokaler HTTP-Server nicht erreichbar): verständliche Meldung, keine veralteten Schaltflächen, nach Wiederanlauf erfolgreicher Neustart. | ausstehend |
| B-10 | Untertitel/Legende in Deutsch verständlich; Forschungsunsicherheit und ausdrücklich **nicht bestätigte Originaltreue** ständig klar erkennbar. | ausstehend |
| B-11 | Kontrast und Schrift bei 100/150/200 % visuell prüfen; vorhandene automatische Kontrastzahlen ersetzen dieses Urteil nicht. | ausstehend |
| B-12 | Reale Mobilbedienung mit Touch/Zoom (sofern für Freigabe erforderlich), keine unbeabsichtigten Aktivierungen oder verdeckten Schaltflächen. | ausstehend |

**Pro Befund festhalten:** Prüf-ID, Soll, beobachtetes Ist, Fenster/Zoom, Bildschirmnachweis (privat), Fehlerbeschreibung, Schweregrad, zugehöriger Änderungsantrag und Ergebnis des erneuten Tests. **Keine Testergebnisse erfinden.**

## 3. Vier getrennte Prüfbereiche (A → B → C → D)

| Abschnitt | Automatisch vorbereitete Grundlagen | Menschlich noch nachzuweisen |
|---|---|---|
| A – C64-Original und Wissenschaft | Forschungsdatenvertrag, leere G64-Aufnahmevorlage, Quellen- und Test-IDs | Rechtmäßige Originalkopie, zwei SHA-256-Werte, VICE-Beobachtungen TEST-001..003, wissenschaftliche Freigabe |
| B – Bedienung und HTML-Architektur | neun eingefrorene Implementierungsdateien, technische Browser-/Modultests | Code-/Funktionsprüfung und praktische Tabelle B-01 bis B-12 |
| C – Technische Qualität | Python/Node, Chrome, negative Fehlerfälle, ZIP-Wiederholung und Hashes | Unabhängige Ergebnisprüfung, Geräte-/Browserabdeckung und dokumentierte Restrisiken |
| D – Abnahme und GitHub | Version, Changelog, Prüfdateien, offene Freigaben, PR #7 | Verantwortliche Entscheide; rechtskonformer Inhalt; Repository-Zweigschutz und Übernahmebeschluss |

Jeder Abschnitt erhält **eigenständige** tatsächliche Befunde und Unterschriften bzw. nachvollziehbare Freigabedokumente. Keine Personengruppe darf ohne die notwendige Zuständigkeit eine andere Freigabe ersetzen.

## 4. Entscheidungslogik – keine automatische Zustimmung

**Eingangsbedingungen für eine spätere formelle Gesamtentscheidung:**
- A: Originalversuch und Nutzungsrecht tatsächlich belegt, offene Regeln/Tatsachen sorgfältig bewertet.
- B: Alle relevanten manuellen Bedienungschecks durchgeführt; erhebliche Fehler behoben und nachgetestet.
- C: Automatische Prüfungen **auf demselben finalen Commit** erfolgreich; ZIP reproduzierbar und unmanipuliert.
- D: Verantwortliche technische, wissenschaftliche, Rechte- und GitHub-Freigabe je einzeln nachgewiesen.

**Aktuell feststehende, nicht erteilte Freigaben:**
```text
technical_review         = false
scientific_scope_review  = false
rights_review            = false
maintainer_approval      = false
public_release_allowed   = false
```

**Gesamtausgang:** `NICHT FREIGEGEBEN` · `KEIN MERGE` · `KEIN BETA/RC` · `KEIN RELEASE`. Ein grüner Test ändert diese Werte **nicht**.

## 5. Ergebnisformular (nur nach echter Prüfung ausfüllen, privat verwahren)

```text
A Wissenschaft / Original:  AUSSTEHEND  | Nachweis-ID: __________ | verantwortlich: ______
B HTML / Bedienung:         AUSSTEHEND  | Nachweis-ID: __________ | verantwortlich: ______
C Qualität / Sicherheit:    AUSSTEHEND  | Nachweis-ID: __________ | verantwortlich: ______
D Recht / GitHub / Gesamt:  AUSSTEHEND  | Nachweis-ID: __________ | verantwortlich: ______

Offene Mängel: __________
Neu getesteter Commit: __________
Technische Restgefahren: __________
Entscheidung: NICHT FREIGEGEBEN
Nächste Prüfung: __________
```

**Keine persönlichen Daten, privaten Emulator-Abbilder oder Rechteunterlagen in einem öffentlichen PR-Protokoll veröffentlichen.** Die bewerteten Belege können bei späterer tatsächlicher Abnahme mit datensparsamen Nachweis-IDs referenziert werden.

### Bezugspunkte
- [Unveränderter C0-Funktionsumfang](24_C0_TECHNISCHER_UMFANG.md)
- [Technische A-D-Prüfakte](25_C0_AUDIT_A_B_C_D.md)
- [Ablauf einer rechtmäßigen Originalaufnahme](27_C0_ORIGINALPRUEFUNG_ANLEITUNG.md)
- [Gebündelter Vorabnahmebogen](22_C0_VORABNAHMEBOGEN.md)

**Wichtige Unterscheidung:** Diese Vorlage kann sofort als Arbeitsgrundlage verwendet werden. Eine tatsächliche Abnahme entsteht **erst nach** den jeweils dokumentierten Prüfhandlungen und Entscheidungen.
