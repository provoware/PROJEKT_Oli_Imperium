# 27 · C64-Originalprüfung: ausführbares Aufnahmeprotokoll (VORLAGE)

**C0-Dokumentationsstand:** 0.1.0-alpha.10 · **Status:** NOCH NICHT DURCHGEFÜHRT · **Testbasis:** deutsche C64-PAL-Ausgabe, Preservation64 Source 3 (Archivkandidat).

## Verbindliche Prüfgrenze
Eine Archiv-Webseite beweist **nicht**, dass eine nutzbare, berechtigt vorhandene Originalkopie vorliegt. Ohne zwei real vorhandene, rechtmäßig untersuchte G64-Dateien, eine dokumentierte VICE-Ausführung und unveränderte Bildbelege ist **kein** Originaltest bestanden. Alle drei Tests in `data/original-session.template.json` bleiben `not_run`, alle Originalregeln bleiben unbestätigt. Weder die Originalabbilder noch ungeprüftes urheberrechtlich geschütztes Bildmaterial gehören in dieses GitHub-Repository.

**Katalogbeleg:** https://preservation64.de/index.php?title=Oil_Imperium, Source 3, `OilImperiumDE parser s0.g64` und `OilImperiumDE parser s1.g64`. Die dort separat aufgeführten `fromNib`-Versionen **nicht** ohne Hash- und Formatvergleich vermischen. Die Angabe `Working? Yes` stammt vom Archiv, nicht aus einem hiesigen Emulatorlauf. VICE-Dokumentation: https://vice-emu.sourceforge.io/vice_2.html und https://vice-emu.sourceforge.io/vice_12.html.

## Phase 1 – Nur bei rechtmäßig vorhandenen G64-Dateien (lokal, privat)
1. Nutzungsgrundlage klären und dokumentieren. **Kein automatisches Herunterladen** und kein Kopieren in ein öffentliches Repository.
2. Im privaten Forschungsordner eine lokale Kopie der Datei `data/original-session.template.json` anlegen. Die leere Vorlage im Repository nie direkt befüllen.
3. Die beiden Namen und ihre Herkunft unabhängig prüfen. Für beide Seiten einzeln **tatsächlich berechnen**, nicht aus der Webseite übernehmen:

```bash
sha256sum -- "/PRIVAT/OilImperiumDE parser s0.g64" "/PRIVAT/OilImperiumDE parser s1.g64"
stat -c '%n : %s Bytes' -- "/PRIVAT/OilImperiumDE parser s0.g64" "/PRIVAT/OilImperiumDE parser s1.g64"
command -v x64sc
x64sc -version
```

`/PRIVAT/` steht für einen **echten** privaten Ordner, nicht für einen vorhandenen Projektpfad. Falls die VICE-Version den Parameter `-version` nicht unterstützt, die installierte Versionsangabe im Programm ermitteln und den tatsächlich verwendeten Weg protokollieren.

**Unverändert aufzunehmen:** genaue Namen, Dateigrößen in Byte, beide SHA-256-Werte, Emulatorversion, C64-Modell, PAL-Einstellung, angehängte Datenträgerseite, Bediengerät, Handbuchabfrage und Nutzungsgrundlage. **Keine** unbekannten Details schätzen.

## Phase 2 – Ein echter VICE-Lauf, nicht die HTML-Testoberfläche
1. Mit der dokumentierten VICE-Konfiguration und der tatsächlichen G64-Seite starten. Ladeablauf, Datenträgerwechsel und Handbuchabfrage festhalten, sofern vorhanden.
2. **TEST-001 Büro → Weltkarte:** Ausgangsbild, exakte Tastatur- oder Joystickeingabe, Lade-/Zwischenbilder, neues Bild und Rohbild-Hash dokumentieren.
3. **TEST-002 Weltkarte → Claim-/Gebietsbild:** Tatsächliche Auswahl und Auswirkung erfassen. `SCREEN-003` nur vergeben, falls sich eine eigene originale Ansicht wirklich beobachten lässt.
4. **TEST-003 Claim/Gebiet → Büro:** **Vollständigen** Rückweg einschließlich ggf. vorhandener Zwischenbildschirme, Abbrüche und realer Eingaben dokumentieren. Der C0-HTML-Entwurf modelliert lediglich den letzten Teil Weltkarte → Büro; das ist **kein** Beleg für den Originalweg.
5. Zu jeder wichtigen Szene ein **unbearbeitetes** PNG-Rohbild mitsamt SHA-256 aufbewahren. Erklärende Ausschnitte/Skalierungen sind davon getrennte Arbeitskopien.
6. Keine Eingaben im Bericht beschreiben, die nicht tatsächlich ausprobiert wurden. Für unklare Schritte den Status `not_run`/offen lassen oder die Aufnahme wiederholen.

## Phase 3 – Private Aufnahme prüfen (kein automatisches „bestanden“)
```bash
python3 tools/validate_c64_capture.py "/PRIVAT/c64-session.json"
```

Nur eine **von der Forschungsperson wirklich erstellte private Aufnahmeakte** verwenden. `structure_valid=true` besagt lediglich, dass die Felder formal zusammenpassen. Auch `complete_for_independent_review=true` bedeutet **nicht**, dass die Inhalte authentisch, rechtmäßig nutzbar oder historisch bestätigt sind. Die Software setzt `scientifically_verified=false` und `original_tests_approved=0`.

### Formular je Originaltest (lokal ausfüllen)
**Test-ID:** TEST-___ · **Ausgangsbild/Beleg:** offen · **Originaleingabe:** offen · **Zwischenschritte:** offen · **beobachtetes Ziel:** offen · **Rohbild-Datei + SHA-256:** offen · **Datenträgerseite:** offen · **Widerspruch zur HTML-Hypothese:** unbekannt · **fachliche Bewertung:** ausstehend.

Bei fachlicher Begutachtung technische Beobachtung, Interpretationsschritt und Entscheidung stets voneinander trennen. Änderungen am einzigen Forschungsdatenvertrag `data/contract.json` erfolgen erst nach der vorgeschriebenen unabhängigen Fachprüfung.

## Tatsächlich vorliegender Zustand
- Zwei lokale G64-Dateien rechtmäßig zur Untersuchung bereitgestellt: **nicht nachgewiesen**.
- Zwei selbst berechnete Originalprüfsummen: **fehlen**.
- VICE-Lauf, originale Bedienfolge und PNG-Belege: **nicht durchgeführt/nicht vorgelegt**.
- TEST-001 / TEST-002 / TEST-003: **not_run / not_run / not_run**.
- Formelle wissenschaftliche und rechtliche Freigaben: **ausstehend**.

Dieses Dokument ist eine **Arbeitsanleitung**, keine Originalaufnahme.
