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

## Technische Robustheit der Aufnahmeprüfung (Wartung vom 13.10.2026)
Der lokale Prüfer weist ungültige Datentypen in der Aufnahmeakte kontrolliert zurück.
Insbesondere gelten `true`, `false` und Dezimalzahlen **nicht** als ganzzahlige
Schrittnummern oder Schemaversionen. Ein Bildverweis muss entweder `null` oder
ein Dateiname als Text sein; verschachtelte Listen oder Objekte führen zu einem
Strukturfehler statt zu einem Programmabbruch.

Dies betrifft ausschließlich die Fehlerbehandlung des vorhandenen
Aufnahmeprüfers und synthetische Negativtests. **Es ist weder ein echter
Emulatorlauf noch eine Original-, Rechte- oder Wissenschaftsfreigabe.**


---

## Phase 4 – Versionierte Screenshot-Matrix (Vorbereitung, 13.10.2026)

**Zweck:** Eine systematische Ersterfassung von **44 geplanten Ansichtszuständen**, ausdrücklich **nicht** die Behauptung, das C64-Spiel habe 44 eigenständige Bildschirme. Einige Zeilen können erst nach echten Beobachtungen als Menü/Dialog/Overlay oder als nicht vorhandene Ansicht bewertet werden.

**Basis:** R-01 = Preservation64 Source 3, deutsche C64-PAL-Ausgabe. Vergleichskandidat R-GB5359 = deutsche, laut Gamebase64 von DMAgic bearbeitete D64-Fassung. **Nicht** die englische R-GB14505 oder das fremde Browser-Online-Spiel `oilimperium.de` verwenden, um unbelegte C64-Regeln zu erfinden.

**Prioritäten:** `P0` = notwendiger Navigations- und Originalidentitäts-Pilot; `P1` = weitere reguläre Menüs/Wirtschaft; `P2` = verzweigte, bedingte oder schwer herbeizuführende Situationen. Quellenhinweis „C64-Wiki“ = **Sekundärquelle**, kein nachgewiesener Emulatortest.

| Aufnahme-ID | Priorität | Ansicht / Zustand | Geplanter Zugang (erst beobachten) | Zu sichernde Beobachtung | Quelle/Grundlage | Aktueller C0-Abgleich |
|---|---|---|---|---|---|---|
| C64-001 | P0 | Lade-/Startzustand | Programmstart nach Disketteneinlage | Loader oder erster stabiler Zustand | Archiv/Beobachtung | – |
| C64-002 | P0 | Titelseite | Ladevorgang bis Titel abwarten | Titel und erreichbare Startaktion | Archiv/Beobachtung | – |
| C64-003 | P0 | Handbuch-/Codeabfrage | Falls im gewählten Exemplar vorhanden | Frage, Position und zulässige Eingabe | Archiv/Beobachtung | – |
| C64-004 | P0 | Spieler-Einrichtung | Neues Spiel beginnen | Spielerzahl, menschlich/Computer, Start | C64-Wiki/Beobachtung | – |
| C64-005 | P1 | Siegbedingung auswählen | Beim Spielbeginn, falls eigene Ansicht | Vier benannte Spielziele oder Auswahlfluss | C64-Wiki/Beobachtung | – |
| C64-006 | P0 | Büro A | Erste tatsächlich erreichbare Büroansicht | Objektpositionen, Handzeiger, Kalender | C64-Wiki | SCREEN-001 |
| C64-007 | P1 | Büro B | Weiteren Spieler mit anderer Darstellung erreichen | Unterschiedliche Büro-Oberfläche prüfen | C64-Wiki/Beobachtung | – |
| C64-008 | P1 | Büro C | Weiteren Spieler mit anderer Darstellung erreichen | Unterschiedliche Büro-Oberfläche prüfen | C64-Wiki/Beobachtung | – |
| C64-009 | P1 | Büro D | Weiteren Spieler mit anderer Darstellung erreichen | Unterschiedliche Büro-Oberfläche prüfen | C64-Wiki/Beobachtung | – |
| C64-010 | P0 | Kalender | Im Büro Kalender anwählen | Tagesanzeige und etwaige Bestätigung | C64-Wiki | – |
| C64-011 | P1 | Speichern/Laden | Firmensignet im Büro anwählen | Diskettenauswahl, Abbruch, Speichern/Laden | C64-Wiki | – |
| C64-012 | P0 | Weltkarte | Büroweltkarte tatsächlich anwählen | Kartenlayout; Eingaben und Rückweg | C64-Wiki | SCREEN-002; TEST-001 |
| C64-013 | P0 | Gebietsauswahl | Reproduzierbar Gebiet auf Karte anwählen | Gebiets-/Regionenmarker und Auswahl | C64-Wiki | TEST-002 |
| C64-014 | P0 | Claims/Besitz | Ausgewähltes Gebiet öffnen | Claims, Eigentümerangaben und Rückweg | C64-Wiki | SCREEN-003?; TEST-002/003 |
| C64-015 | P1 | Computer-Hauptmenü | Computerobjekt im Büro anwählen | Fünf Einträge: Kaufen/Verkaufen/Bohren/Statistik/Expertise | C64-Wiki | – |
| C64-016 | P1 | Kaufen: Ölfeld | Computer > Kaufen > Feld, sofern erreichbar | Preis, Lage, Auswahl, bestätigte Kaufaktion | C64-Wiki | – |
| C64-017 | P1 | Kaufen: Tank | Computer > Kaufen > Tank, sofern erreichbar | Ort, Preis, Kapazität, Rückweg | C64-Wiki | – |
| C64-018 | P1 | Verkaufen: Ölfeld | Computer > Verkaufen > Feld | Angebot/Bestätigung, Besitzstatus | C64-Wiki | – |
| C64-019 | P1 | Verkaufen: Öl | Computer > Verkaufen > Öl | Bestand, Preis, Menge, Auswirkung | C64-Wiki | – |
| C64-020 | P1 | Bohrung auswählen | Computer > Bohren | Quelle, Voraussetzungen, Alternativen | C64-Wiki | – |
| C64-021 | P2 | Bohrfirma beauftragen | Bohrungsdialog > Fachfirma | Kosten, Tage, Ergebnis/Bestätigung | C64-Wiki | – |
| C64-022 | P2 | Selbst bohren | Bohrungsdialog > Selbstausführung | Bohrkopf, Richtung, Gestein, Ergebnis | C64-Wiki | – |
| C64-023 | P1 | Statistik | Computer > Statistik | Spielervergleich, Vermögen, Werte | C64-Wiki | – |
| C64-024 | P1 | Expertise beauftragen | Computer > Expertise | Claim, Gutachterauftrag, Kosten | C64-Wiki | – |
| C64-025 | P1 | Expertise-Ergebnis | Vorliegendes Gutachten öffnen | Öl-/Wirtschaftsdaten, Kennzahlen | C64-Wiki | – |
| C64-026 | P1 | Telefon | Klingeln oder Telefonobjekt wählen | Telefonzustand; Beginn der Meldung | C64-Wiki | – |
| C64-027 | P1 | Telegramm | Eingehende Nachricht ansehen | Nachricht, Reihenfolge, Bedienung | C64-Wiki | – |
| C64-028 | P1 | Liefervertrag | Passendes Vertragsangebot erreichen | Annahme/Ablehnung, Verpflichtungen | C64-Wiki | – |
| C64-029 | P1 | Schubladenübersicht | Schublade im Büro anwählen | Drei Dokumentfunktionen sichtbar | C64-Wiki | – |
| C64-030 | P2 | Detektiv/Schutz | Schublade > Schutzdokument | Laufzeit, Qualitäts-/Preisoptionen | C64-Wiki | – |
| C64-031 | P1 | Firmenbilanz | Schublade > Unternehmensübersicht | Quellen, Tanks, Verträge | C64-Wiki | – |
| C64-032 | P2 | Sabotage | Schublade > Saboteure | Ziel, Laufzeit, Kosten, Ergebnis | C64-Wiki | – |
| C64-033 | P2 | Koffer/Brand | Bei brennendem Ölfeld Koffer öffnen | Fachfirma oder eigener Einsatz | C64-Wiki | – |
| C64-034 | P2 | Brand durch Firma | Koffer > Fachfirma | Auftragsentscheidung, Preis, Zeit | C64-Wiki | – |
| C64-035 | P2 | Brand selbst löschen | Koffer > Selbstversuch | Aktionssequenz, Fehlschlag, Abbruch | C64-Wiki | – |
| C64-036 | P1 | Zeitung/Ereignisse | Zeitung im Büro anwählen | Nachrichten, Ölpreis, Urteile | C64-Wiki | – |
| C64-037 | P2 | Pipeline-Aktionsszene | Aktion auslösenden Spielzustand erreichen | Sequenz, Steuerung, Ausgang | C64-Wiki | – |
| C64-038 | P0 | Zugende-Bestätigung | Kalender mit verbliebenen Tagen anwählen | Rückfrage, Ablehnung/Annahme | C64-Wiki | – |
| C64-039 | P1 | Computergegner-Zug | Zug an Gegner übergeben | Zwischengrafik, Reihenfolge, Meldung | C64-Wiki | – |
| C64-040 | P1 | Monats-/Rundenwechsel | Zeitkontingent erschöpfen/Monat beenden | Datum, Bestände, Folgewirkungen | C64-Wiki | – |
| C64-041 | P2 | Spielziel erreicht | Eine der vier Siegbedingungen gezielt auslösen | Siegermeldung und weiterer Ablauf | C64-Wiki/Beobachtung | – |
| C64-042 | P2 | Bankrott/Verlust | Verlustzustand gezielt auslösen | Ende/Weiterspielen und Gegenspieler | C64-Wiki/Beobachtung | – |
| C64-043 | P1 | Abbruch/Rückweg | Menüs offen; abbrechen/zurück navigieren | Vorheriger Bildschirm, kein ungewollter Kauf | C64-Wiki/Beobachtung | TEST-003 |
| C64-044 | P0 | Datenträgerwechsel | Nur falls Spiel Wechsel verlangt | Prompt, eingelegte Seite, Fortsetzung | Archiv/Beobachtung | – |

### Aufnahmeprotokoll pro Zustand

1. Zunächst Kopie eindeutig identifizieren: **Referenzkennung**, Ausgabesprache, PAL/NTSC, Archiv-Quelle, Lizenz-/Nutzungsgrundlage, SHA-256 **beider** G64-Seiten und tatsächlich installierte VICE-Version.
2. Ausgangszustand sichern: Lauf-/Spielstandkennung, Spieler, Monat/Tag, Region, Geld/Öl und alle für den konkreten Versuch wesentlichen Größen (falls verfügbar); keine Zahlen erfinden.
3. Einzelschritt im Original **wirklich ausführen** und wörtlich dokumentieren: ausgewähltes Objekt, Joystick-Port, Richtung, Feuerknopf, Warte-/Ladezeit, gegebenenfalls Abbruch. Keine Eingabe aus dem HTML-Entwurf ableiten.
4. Bei **jeder optisch eigenständigen Ansicht, relevanten Menüüberlagerung und Zustandsvariante** ein unverändertes PNG als Rohbeleg erzeugen. Ein C64-XXX-Eintrag darf dabei mehrere `Z00`, `Z01` usw. benötigen; nicht jeder Tabelleneintrag muss wirklich eine eigene Bildschirmfläche darstellen.
5. Vorgeschlagener **privater** Dateiname: `R01_C64-012_Z00_original.png`. Separat SHA-256, Pixelmaße, PAL-Einstellung, Farb-/Skalierungsmodus, Szene, tatsächliche Eingabefolge, relative Zeit, Beobachterprüfung und rechtliche Nutzungsgrundlage in der **privaten** Forschungsakte festhalten.
6. Wiederholung bei neuem Spielstand oder nicht reproduzierbarer Szene; Rückweg bis zum Ausgangszustand ebenfalls erfassen. Für zweifelhafte Anzeigen zwei unabhängige Wiederholungen vor fachlicher Bestätigung.
7. Originalaufnahme und HTML-Aufnahme **getrennt** ablegen. Für die HTML-Seite die tatsächliche C0-Version und die genauen Modellaktionen `to-map`, `to-claims`, `to-map` / `to-office` protokollieren. Testmodelle sind keine C64-Eingaben.
8. Pixelweise Gegenüberstellung nur nach nachvollziehbarer Auflösungs-/Rahmen-/Farbnormierung. Abweichungen getrennt nach Struktur, Text, Icon, Spielzustand, Eingabe, Rückweg und Timing bewerten; keine künstlichen Ähnlichkeits-Prozentzahlen.
9. Für jede geplante Zeile den Status `nicht_erreicht`, `beobachtet`, `abweichung`, `nicht_vorhanden` oder `unklar` führen. `beobachtet` ist noch kein wissenschaftlich freigegebenes `passed`.
10. **Veröffentlichungsschutz:** G64/D64/NIB/ROM, Bild-Rohdaten, Bildkopien und gegebenenfalls handbuchgeschützte Inhalte ausschließlich privat. In GitHub/CI nur selbst formulierte Prüfbeschreibungen und nach Rechteprüfung zulässige Metadaten; kein Einbetten der Originalbilder in öffentliche PDFs.

### Mindestabnahme P0 – Die drei bereits vorhandenen Originaltests

- **TEST-001**: C64-006 (Büro) → tatsächliche Weltkarte C64-012; genaue Hand-/Joystick-Bedienung und PNGs zu beiden Zuständen.
- **TEST-002**: C64-012 (Weltkarte) → C64-013 (Gebiet, wenn existent) → C64-014 (Claim/Besitz, falls eigenständiger Zustand). `SCREEN-003` im HTML ist **bis zur Beobachtung nur eine Hypothese**.
- **TEST-003**: Vollständiger beobachteter Rückweg ab C64-014 bis C64-006, nicht nur der letzte HTML-Wechsel C64-012 → C64-006. Zwischenstationen und Abbruchwege exakt aufzeichnen.

**Start-/Fortschrittsstatus:** `44 geplant | 0 Original-PNGs aufgenommen | 0 Originaltests durchgeführt | 0 Historienregeln freigegeben`. Diese Zahlen sind **Planung**, kein neuer Nachweis.

**Sekundärquellen (nicht eigenständig ausgeführt):** https://www.c64-wiki.de/wiki/Oil_Imperium · https://preservation64.de/index.php?title=Oil_Imperium · https://gb64.com/game.php?d=18&id=5359. Bisherige Gegenprobe/Abnahme bleibt weiterhin ausstehend.
