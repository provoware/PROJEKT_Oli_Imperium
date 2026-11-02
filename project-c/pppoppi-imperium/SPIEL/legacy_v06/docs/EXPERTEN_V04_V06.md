# OLI IMPERIUM / PPPOPPI-IMPERIUM
## V0.4 Datenmodell · V0.5 Ablaufarchitektur · V0.6 spielbarer Offline-Pilot

**Stand: 20.10.2026 · Entwicklungsnachweis und wissenschaftlicher Entwurf**  
**Repository-Bezug:** `provoware/PROJEKT_Oli_Imperium`  
**Status:** Lokal erstelltes eigenständiges Arbeitspaket. Nicht in GitHub übernommen. Keine C64-Originalabnahme.

> **Kernentscheidung:** Die historischen C64-Befunde, unsere Berliner Spielfachregeln und die tatsächlich ausgeführte Pilotimplementierung sind drei getrennte Wahrheitsbereiche. Das Paket enthält die Entwurfsgrundlagen für das ganze Spiel, prüft die zentrale Verbindung von Regeln und Abläufen, implementiert aber ausdrücklich nur einen ersten vollständigen Spielmonat als vertikalen Prototyp.

## 01. Projektarchitektur und Geltungsbereich

Es gibt drei Produkte mit unterschiedlichem Erkenntnisziel: **A** erforscht die C64-Ausgabe, einschließlich Quellen- und Emulatornachweis; **B** übersetzt ausreichend belegte Regeln in eine wissenschaftlich begründete Architektur; **C** entwickelt ein eigenständiges, satirisches Wirtschaftsspiel mit PPPOPPI und Freunden. Die Berliner Spielregeln werden nicht rückwirkend als historische Originalregeln ausgegeben.

| Teil | Bedeutung | Evidenz- bzw. Fertigstatus |
|---|---|---|
| C64-Forschung | Beobachtete Originalabläufe und Originalwerte | Originalemulatorlauf weiterhin ausstehend |
| V0.4 | Numerisches, wirtschaftliches und Zustandsmodell für die Eigenentwicklung | Als **Pilotprofil** konkretisiert, nicht als endgültiges Spielbalancing |
| V0.5 | Gesamtkatalog von Bildschirmen und gerichteten Übergängen | 32 Bildschirm- und 62 Übergangsentwürfe, davon 34 im Pilot als vorgesehen markiert |
| V0.6 | Umsetzung einer durchspielbaren ersten Wirtschaftskette | Kern umgesetzt und automatisiert getestet |

**Achtung:** Die 62 Verbindungen beschreiben einen zukünftigen Soll-Graphen, nicht 62 original belegte C64-Abläufe. Die 34 Kanten bilden den für den Piloten markierten Umfang ab; nicht alle Bildschirme und Wirtschaftsfunktionen des Vollspiels sind fertig.

## 02. Qualitätsziele und Abnahmegrenzen

Jede Funktion braucht eine Eingabe, Vorbedingung, zulässige Datenänderung, Fehlerbehandlung, Rückweg, eindeutige Testkennung und Kennzeichnung **HISTORISCH / BERLIN-ENTWURF / IMPLEMENTIERT**. Jede zustandsändernde Aktion wird über eine zentrale Transaktion ausgeführt, nicht durch eine Bildschirmschaltfläche selbst.

Abnahmeklassen: (1) **strukturell geprüft**: Datensätze und Übergänge sind in sich konsistent; (2) **fachlich geprüft**: Berechnungen liefern erwartete Modellwerte; (3) **im Browser geprüft**: Bedienabläufe funktionieren im konkreten Test; (4) **originalverifiziert**: Handlung und Ergebnis wurden mit einer exakt identifizierten rechtmäßig nutzbaren C64-Version im Emulator abgeglichen. Die vierte Klasse wurde bislang nicht erreicht.

## 03. V0.4 – Einheiten und feste Zahlenregeln

| Größe | Interne Speicherung | Sichtbare Einheit | Verbindliche Behandlung |
|---|---|---|---|
| Geld | ganze Eurocent | Euro (€) | Keine Gleitkomma-Buchungen |
| Ölbestand | Tausendstel-Barrel | Barrel (bbl) | Keine negativen Bestände, eindeutiger Eigentümer |
| Ölpreis | Eurocent je Barrel | €/bbl | Erlös = Menge × Preis, auf Cent gerundet |
| Zeit | ganze Spieltage, globaler Monat | Tage / Monat | Nur Aktionen verbrauchen Zeit; Navigation kostet 0 |
| Fördermenge | Tausendstel-Barrel | Barrel | Entnahme begrenzt durch Reserve, Lager und Aktion |
| Kredit | Eurocent | Euro | Zahlungseingang **und** Verbindlichkeit erzeugen |
| Marktanteil | ganze Basispunkte | Prozent | 10.000 Basispunkte = 100 % |
| Produktionsrisiko | Im Pilot nicht numerisch modelliert | – | Erst nach spezifizierter Wahrscheinlichkeitsquelle |

**Umrechnungen:** 1 Barrel = 1.000 interne Mengeneinheiten; 1 Barrel Rohöl entspricht als Volumen einem US-Ölbarrel von rund 158,987 Litern. Für die Umrechnung in Gewicht sind zusätzlich Öldichte und Temperaturkontext nötig. Historische Dollarbeträge werden nicht heimlich in Euro umgerechnet.

**Rundung:** Positive Geldbeträge werden auf den nächsten Cent kaufmännisch gerundet; intern sind die kleinen Ölmenge-Schritte exakt. Bei knapper Marktmenge werden ganze Mengeneinheiten nach dem Verfahren „größter Rest, dann ID“ verteilt. Gleiche Ausgangsdaten führen damit stets zum gleichen Ergebnis.

## 04. V0.4 – Festes Startprofil für den Piloten

Die folgenden Zahlen sind **frei entworfene Lern- und Balancingparameter**, keine C64-Originalwerte, keine reale Prognose des Rohölmarkts und kein endgültig freigegebenes Vollspielbalancing.

| Merkmal | Pilotwert | Bedeutung |
|---|---:|---|
| Startkapital | 200.000 € | Konto vor allen Aktivitäten |
| Spieltage | 30 pro Monat | Maximaler Aktionsrahmen |
| Gutachten | 2.000 € / 2 Tage | Vor dem Kauf erforderlich |
| Konzession | 50.000 € / 1 Tag | Ein Testfeld, eine Region |
| Bohrung | 70.000 € / 5 Tage | Erst nach Kauf |
| Ein Fördervorgang | 100 Barrel / 1.000 € / 4 Tage | Reduziert Feldreserve |
| Ein Liefertransport | 500 € / 1 Tag | Vorbereitung der gesamten verfügbaren Menge |
| Verkaufsauftrag | 1 Tag | Verbindlich bis zum Monatsende |
| Anfangsreserve | 500 Barrel | Endlich, kein automatischer Nachschub |
| Tank | 200 Barrel | Vorbereitete und unvorbereitete Bestände zusammen |
| Marktpreis | 700 €/Barrel | Bewusst künstlicher Testpreis |
| Nachfrage / Konkurrenzangebot | 120 / 50 Barrel | Ein Markt; Konkurrenz zunächst ein festes Angebot |
| Monatskosten | 900 € Personal + 500 € Anlage | Anlage nur bei bestehender Bohrung |
| Einmaliger Rettungskredit | 40.000 € | Je Wirtschaftsgeneration maximal einmal |
| Sanierungsneustart | 150.000 € | Als **neues** Startvermögen, niemals zusätzlich |

Das Mengenmodell beschränkt die Lagerung, nicht aber die Zahl der Monatszyklen. **Unbegrenztes Nachfüllen geologischer Reserven ist verboten.** Die Erweiterung um mehrere Felder, weitere Regionen und reale Angebotsdynamik wird nötig, bevor die Langzeitbalance abschließend beurteilt werden kann.

## 05. V0.4 – Marktverteilung und Preisbildung

Aufträge werden fachlich in *vertraglich gebunden* und *freier Markt* aufgeteilt. **Im ersten Pilot wird nur der freie Markt tatsächlich ausgeführt.** Gleichrangige Angebote erhalten bei zu kleiner Nachfrage eine anteilige Zuteilung. Dabei wird zunächst der ganzzahlige Anteil berechnet; unteilbare Reste werden nach größtem Nachkommarest und stabiler Angebotskennung vergeben. Die Zuteilung liegt nie über der angebotenen Menge.

**Referenzfall:** PPPOPPI bietet 100 Barrel an, ein Gegner 50. Der Markt benötigt 120. Die Zuteilung beträgt 80 Barrel an PPPOPPI und 40 an den Gegner. 20 nicht abgenommene Barrel gehen zurück ins Lager. Der Preis gilt für **verkaufte**, nicht nur angebotene Menge. PPPOPPIs Marktanteil beträgt 80 von 120, also rund 66,67 %.

Das Marktmodell ist für diese Pilotphase festpreisorientiert. Ein dynamisches Angebot-Nachfrage-Preismodell, regional unterschiedliche Preise, Vertragspriorität und tatsächliche Computergegner-Disposition bleiben in V0.7 beziehungsweise später gesondert zu implementieren.

## 06. V0.4 – Zahlungs- und Buchungslogik

Alle Monatsansprüche werden nach einer verbindlichen Rangfolge verarbeitet. Bei unzureichendem Bargeld wird innerhalb derselben Rangklasse anteilig verteilt; danach erst folgt die nächste Klasse.

| Zahlungsrang | Kategorie | Beispiel |
|---|---|---|
| 1 | Personal und Sicherheit | Gehalt, Anlagenbetrieb |
| 2 | Fällige Vertragsforderungen | Lieferverpflichtung (später) |
| 3 | Kreditverpflichtungen | Zinsen und Tilgung |
| 4 | Sonstige Verbindlichkeiten | Allgemeine Rechnungen (später) |
| 5 | Optionale Ausgaben | Sonderprogramme (später) |

**Referenzfall:** 1.000 € verfügbar, Forderungen über 600 € (Rang 1), 600 € (Rang 2), 300 € (Rang 3) → Zahlung 600 / 400 / 0 €. Der offene Betrag bleibt eine Verbindlichkeit und wird nicht gelöscht. Es ist unzulässig, bei 0 € Bargeld negative Auszahlungen zuzulassen oder eine Forderung stillschweigend als beglichen zu kennzeichnen.

Der Pilot protokolliert alle Kassenbewegungen in einer unveränderlich fortlaufenden Buchungshistorie. Für eine spätere Vollimplementierung ist ein vollständiges doppisches Bilanzmodell getrennt zu untersuchen; die aktuelle Kassenhistorie ist **noch keine kaufmännische Bilanz**.

## 07. V0.4 – Lebenszyklus, Rettung und Spielziele

**Phasen:** `TURN_ACTIVE → MONTH_REPORT → NEXT_MONTH` beziehungsweise `TURN_ACTIVE → RESCUE → MONTH_REPORT → NEXT_MONTH`. Jeder Monatsabschluss erzeugt genau einen Bericht. Ein Monatsabschluss in `RESCUE` oder `MONTH_REPORT` ist verboten. Der nächste Monat setzt die Aktionszeit zurück, nicht aber Guthaben, Vermögenswerte, Schulden oder Auszeichnungen.

**Weiche Pleite:** Reichen Einnahmen und Bargeld nicht für kritische Verbindlichkeiten, erscheint eine Rettungsphase. Diese bietet (A) einmaligen Rettungskredit mit entsprechender Schuld, (B) dokumentierten Notverkauf und (C) ausdrücklich gekennzeichneten Sanierungsneustart. Weder Kredit noch Neustart erzeugen Gratisvermögen durch doppelte Übertragung. Beim Notverkauf können an die Konzession gebundene Rohstoffe und Infrastruktur abgeschrieben werden; der Vorgang muss als Verlust dokumentiert bleiben.

**Meilensteine:** Marktführer = mindestens 60 % Marktanteil über sechs geeignete Monate; der Pilot verwendet für die Eignung bewusst die angepasste Mindestnachfrage **100 Barrel**, statt dem früheren V0.3-Entwurfswert 500 Barrel. Vertragsmeister = 20 erfolgreiche Verträge, mindestens 95 % pünktlich, positiver gemeinsamer Vertragsüberschuss. Vertragsmeister ist **noch nicht implementiert**. Der Endlosmodus ist eine eigenständige Spielart ohne zwingendes Sieg-Ende. Ursprüngliche C64-Siegziele bleiben davon unabhängig und unverifiziert.

## 08. V0.4 – Zentrale Spielzustände

Die Spielstanddatei beschreibt eine einzige Spielinstanz durch: Speicherformat, Regelprofil, Partiekennung, Monat, Wirtschaftsgeneration, Phase, Bargeld, Schulden, verbrauchte Tage, Feldstatus, Lager und vorgemerkte Lieferung, Angebot, offene Forderungen, Buchungsjournal, bereits verarbeitete Vorgangskennungen, Erfolgshistorie, Monatsbericht und Ereignisverlauf.

**Invarianten (immer gültige Zustandsbedingungen):** kein negativer Lagerbestand; kein Bohrstatus ohne Eigentum; keine zwei gleichzeitig offenen identischen Angebote; kein Guthaben unter Null; keine Abschlusspassage ohne passende Phase; Rückweg ohne Fachbuchung; abgeschlossene Transaktion höchstens einmal; dieselbe Ölmenge befindet sich nicht zugleich in Verkaufsreservierung und frei verfügbarem Lager.

Jeder Befehl verarbeitet eine Kopie des Zustands und gibt nur bei komplett erfolgreicher Prüfung das neue Ergebnis zurück. Ein gescheiterter Befehl lässt den Ursprungszustand unverändert. Eine eindeutige Vorgangskennung verhindert doppelte Ausführung bei versehentlichen Wiederholungen. Die JSON-Schemata prüfen grundlegende Datentypen; die Programmlogik prüft zusätzliche fachliche Regeln.

## 09. V0.5 – Der vollständige gerichtete Ablaufkatalog

Der Katalog aus V0.3 wurde übernommen und um zwei fehlende Rettungsverbindungen ergänzt: **NAV-061** vom Monatsabschluss in die Rettung nach offener Zahlungslücke und **NAV-062** aus erfolgreicher Rettung zum Monatsbericht. Ergebnis: **32 Bildschirmdefinitionen und 62 gerichtete Übergangsdefinitionen**. Alle 32 Ansichten sind im geplanten Gesamtkatalog vom Start erreichbar und besitzen, wo fachlich erforderlich, einen gerichteten Weg zurück zur Zentrale.

Jede Kante definiert: ID; Ausgangsansicht; Zielansicht; Ereignis; Schutzbedingung; kennzeichnet Zustandswirkung; Tageskosten; Testkennung; Entwurfsstatus; Kennzeichen `implemented`; historischer Geltungsbereich. Schaltflächen dürfen ausschließlich vorhandene, für die Implementierungsphase zugelassene Übergänge ansprechen. Ein Wechsel des Bildschirms darf keine Wirtschaftswerte buchen. Eine bewusst abgeschlossene Transaktion wird durch **separaten Befehl** ausgelöst.

| Ablaufbereich | Beispielkette | Stand V0.6 |
|---|---|---|
| Einstieg | Start → Einrichtung → Büro | Implementiert |
| Standort | Büro → Karte → Region → Feld | Implementiert für ein Feld |
| Forschung/Kauf | Feld → Gutachten / Kauf → Feld | Implementiert |
| Bohrung | Feld → Bohrung → Feld | Implementiert ohne Minispiel |
| Bestände | Büro → Lager → Logistik → Lager | Implementiert |
| Verkauf | Büro → Markt → Büro | Implementiert mit Monatsabwicklung |
| Zeit | Büro → Zugende → Bericht → Büro | Implementiert |
| Rettung | Zugende → Rettung → Bericht | Implementiert bei Zahlungslücke |
| Verträge, Medien, Sabotage | Entwurfskanten vorhanden | Nicht spielbar, ausdrücklich geplant |
| Drei Geschicklichkeitsspiele | Entwurfskanten vorhanden | Nicht implementiert |

**Noch nicht formal verifiziert:** Alle Wächterbedingungen für die späteren 28 unimplementierten Kanten können erst mit ihren Fachmodulen getestet werden. Grafische Erreichbarkeit allein ist keine vollständige semantische Konsistenzprüfung.

## 10. V0.5 – Navigations- und Fehlerrichtlinien

„Zurück“ und „Schließen“ erhalten den zuletzt gebuchten Wirtschaftszustand. Das Verlassen einer Kaufbestätigung setzt einen gekauften Besitz nicht auf „frei“ zurück. Begonnene Minispiele benötigen später eigene Zustandsautomaten mit Ergebnis-, Abbruch- und Wiederherstellungsregeln. Eine Rettungsansicht darf nur während einer tatsächlichen Krisenphase aufgerufen werden. Unverbindliche Transporte können ohne Erstattung bereits entstandener Transportkosten zurückgenommen werden; ein rechtsverbindlich vorgemerktes Verkaufsangebot erhält keinen stillschweigenden Abbruchknopf.

Für eine vollständige Abnahme sind zusätzlich zu Strukturtests **Wächtertests je Kante** erforderlich: erlaubter Wechsel, blockierter Wechsel, Abbruch und Rücksprung, Finanzzustand unverändert, Fehlermeldung, Tastaturbedienung und tatsächliche Darstellung im Browser.

## 11. V0.6 – Erste vollständig durchspielbare Mini-Partie

**Startbedingungen:** 200.000 € Kasse, ein unerschlossenes Feld mit 500 Barrel Reserve, 200 Barrel Tankkapazität, 30 Aktionstage. Ziel der Pilotpartie: vom Start bis zum ersten erfolgreich abgeschlossenen Monatsbericht gelangen. Die Oberfläche ist deutschsprachig, dunkel und in drei flexible Bereiche gegliedert. Eine Internetverbindung ist nicht nötig.

| Nr. | Aktion | Veränderung | Kassenbestand |
|---|---|---|---:|
| 0 | Spielstart | 200.000 € Startkasse | 200.000 € |
| 1 | Gutachten | −2.000 €, −2 Tage | 198.000 € |
| 2 | Konzession kaufen | −50.000 €, −1 Tag | 148.000 € |
| 3 | Bohrung | −70.000 €, −5 Tage | 78.000 € |
| 4 | 100 Barrel fördern | −1.000 €, −4 Tage | 77.000 € |
| 5 | Lieferung vorbereiten | −500 €, −1 Tag | 76.500 € |
| 6 | Angebot abgeben | −1 Tag, keine sofortige Einnahme | 76.500 € |
| 7 | Monatsmarkt | 80 von 100 Barrel verkauft = +56.000 € | 132.500 € |
| 8 | Monatskosten | −900 € Personal, −500 € Anlage | **131.100 €** |

**Prüfergebnis:** 14 von 30 Tagen verbraucht; 80 Barrel verkauft; 20 Barrel frei im Lager; 400 Barrel verbleibende Feldreserve; keine Schulden; Marktanteil 66,67 %; Startmonat abgeschlossen. Dieser Zustand wurde in einem echten Chromium-Bedienablauf erzeugt und als `docs/test_save.json` bereitgestellt.

## 12. V0.6 – Bedienung unter Linux

**Ohne Installation:** ZIP-Datei entpacken und darin `index.html` mit Firefox oder Chromium öffnen. Das Spiel braucht **kein Konto, keine Internetverbindung, keine Paketinstallation und kein Terminal**. Es verwendet ausschließlich mitgelieferte HTML-, CSS- und JavaScript-Dateien.

**Spielstand:** Über „Spielstand exportieren“ eine JSON-Datei sichern; „Spielstand laden“ nimmt die exportierte JSON-Datei wieder entgegen. Diese Export-/Import-Funktion ist absichtlich verlässlicher als browserabhängige Speicherung bei `file://`-Aufruf. **Zum Fortsetzen grundsätzlich vorher exportieren.** Die Bezeichnung `test_save.json` steht für eine Testdatei, nicht für einen automatisch erzeugten persönlichen Speicherstand.

**Für Entwickler:** `node tests/test_engine.cjs` und `node tests/test_navigation.cjs` prüfen die zentrale Wirtschaft und die Ablaufstruktur ohne NPM-Installation. `python3 tests/browser_smoke.py` ist ein zusätzlicher Prüflauf in dieser Entwicklungsumgebung mit Playwright und Chromium, aber für die normale Spielnutzung nicht erforderlich.

## 13. Implementiert, teilweise implementiert, bewusst offen

| Bereich | Status | Präzisierung |
|---|---|---|
| Eine vollständige Wirtschaftskette | **IMPLEMENTIERT** | Survey → Kauf → Bohrung → Förderung → Angebot → Markt |
| Runden und Monatsabschluss | **IMPLEMENTIERT** | Ein aktiver Spieler, ein Monat; mehrfach fortsetzbar |
| Basis-Markt und Rang-Zahlungen | **IMPLEMENTIERT** | Fixpreis, ein Angebotsort, einfache Kosten |
| Rettung mit Kredit/Neustart | **IMPLEMENTIERT** | Modellbetrieb; nicht abschließende Vollbilanz |
| Marktführer-Meilenstein | **TEILWEISE** | Serienwert; nur eine künstliche Pilot-Marktsituation |
| Vertragssystem/Vertragsmeister | **GEPLANT** | Katalog und Bedingungen, noch keine echten Vertragshandlungen |
| Vollständige Computer-KI | **GEPLANT** | Rivalenangebot im Pilot fest vorgegeben |
| Mehrspieler bis zu vier Parteien | **GEPLANT** | Kein isolierter Spielstand mehrerer Firmen vorhanden |
| Bohren-, Brand-, Pipeline-Minispiele | **GEPLANT** | Noch keine Minispielausführung |
| Ereignisse, Sabotage, Gerichte | **GEPLANT** | Nur Ablaufentwürfe, keine Fachwirkung |
| C64-Originaltreue | **NICHT GEPRÜFT** | Keine selbst verifizierte Originaldiskette und Emulation |

## 14. Ausgeführte Tests und Grenzen

**Automatische Fachtests:** 37 von 37 bestanden (Startwerte, Umrechnung, Rundung, Angebotsverteilung, Gleichstand, Zahlungsränge, Fehlaktionen, Kassenintegrität, Vorräte, Zeitgrenzen, Monatsabschluss, Doppelbuchungsverhinderung, Lieferstorno, Rettung, Neustart, Speicherprüfung und vereinfachter Lauf über 100 Monate).

**Graphprüfung:** 411 Strukturprüfungen bestanden; 32 Bildschirme, 62 definierte Übergänge, 34 als Pilot-implementiert markiert. Die Prüfung belegt **Modellstruktur**, nicht die fachliche Freigabe der späteren Funktionen.

**Browser-Praxistest:** Im installierten Chromium wurde der komplette Bedienablauf von der Einrichtung bis zum Bericht ausgeführt und eine exportierte JSON-Datei wieder geladen. Keine JavaScript-Laufzeitfehler im protokollierten Prüfdurchlauf. Der Test nutzte in der isolierten Entwicklungsumgebung ein technisch inline geladenes HTML-Dokument, weil direkte lokale Browsernavigation dort gesperrt ist. Für den Anwender ist das Paket für die übliche lokale Dateiansicht konzipiert; eine gesonderte Kubuntu-Endabnahme steht weiterhin aus.

**Nicht geprüft:** originale C64-Werte, originale Navigationsfolgen, echte 4-Spielerpartien, echte Zufallsereignisse, langfristig balancierte Wirtschaft, alle Rettungsgrenzfälle, tatsächlicher Browserstart auf deinem Kubuntu, Rechtslage aller künftigen Grafiken und Namen.

## 15. Risiken und vorgezogene Gegenmaßnahmen

| Risiko | Vorbeugung | Momentaner Status |
|---|---|---|
| Vermischung von Original und Eigenentwicklung | Getrennte Quellen- und Regelprofile | Umgesetzt im Konzept und in Metadaten |
| Doppelte Buchung bei erneutem Klick | Vorgangskennung und zustandskopierender Befehl | Mit Tests nachgewiesen |
| Preis/Menge falsch verrechnet | Ganze Cent und Tausendstel-Barrel | Mit Referenzwerten geprüft |
| Zu viele Navigationswege | Gerichteter Graph und erreichbare Rückwege | Struktur geprüft; Teilbedienung getestet |
| Savegame beschädigt | Format-/Profil-Prüfung und Plausibilitätskontrolle | Grundprüfung getestet; komplexe Migration noch offen |
| Unendlicher Geldgenerator im Endlosmodus | Ressourcenverbrauch, Tilgung, Generationstrennung | Grundregel implementiert; Vollbalance offen |
| Ungerechte KI | Gemeinsamer Simulationskern statt versteckter KI-Boni | Nur als Zielvorgabe, KI noch nicht umgesetzt |
| Lizenzierte Originalassets | Nur eigene Berliner Bilder, Dialoge und Töne | Pilot enthält keine Originalassets |
| Falsches Fertigstellungsversprechen | Teststatus je Ebene und Funktion | Sichtbar im Paket getrennt |

## 16. Dateien, Datenverträge und Nachvollziehbarkeit

`index.html` ist der Einstieg. `src/engine.js` enthält die Regeln, `src/ui.js` die Bedienung, `src/nav.js` den lokal eingebundenen Graphen und `src/style.css` die Darstellung. `config/profile_v04.json`, `config/schema_save_v04.json`, `config/navigation_v05.json`, `config/schema_navigation_v05.json` definieren die fachlichen Vorgaben. `reference/` enthält die aus V0.3 übernommenen Forschungskataloge, **ohne sie als Originalbelege aufzuwerten**. `tests/` enthält Fach-, Graph- und Browserprüfungen. `docs/test_save.json` ist der gespeicherte Ende-Monat-Referenzzustand des erfolgreichen Testlaufs.

**Wichtig für die weitere Bearbeitung:** Die Pilotparameter liegen derzeit in `src/engine.js` zur offlinefähigen Ausführung und werden in `config/profile_v04.json` dokumentiert. Änderungen am Profil müssen auf Abweichungen geprüft werden; langfristig werden sie durch eine validierte Konfiguration geladen, statt in mehreren Dateien unabhängig gepflegt zu werden.

## 17. Wissenschaftliche Reflexion und verbleibende Widersprüche

Ein funktionierender Mini-Monat beweist nur, dass dieser **eine vertikale Prozessstrecke** spielbar ist. Er beweist weder, dass die historischen C64-Abläufe vollständig abgebildet sind, noch, dass sich die Preis-, Kredit- und Wirtschaftssysteme über viele reale Spieljahre als spannend und fair erweisen. Ebenfalls noch offen: faire KI-Aktionen bei gleichzeitigem Marktabschluss, bilanzielle Unternehmensbewertung, Rettung nach mehrstufigen Vertragspflichten, automatische Produktion im Monatsabschluss und Rückverfolgung aller UI-Wege auf Original-Screen-IDs.

Die korrekte hochschulische Methodik trennt **Beobachtungsbeleg**, **Modellannahme**, **Implementierungsstand** und **Testsachverhalt**. Ein hypothetischer oder in Foren beschriebener Originalwert darf weder als verifiziert noch als ungeprüft verbindliche technische Vorgabe erscheinen. Die C64-Originalfassung muss vor einem 1:1-Originalvergleich eindeutig durch Prüfsumme, Rechtebasis und Emulatorlauf identifiziert werden.

## 18. Die drei nächsten zwingenden Entwicklungsschritte

**① V0.7: Vollständiges Mehrspieler- und Marktjahr.** Je Partei getrenntes Vermögen und Zeitkonto, echte Computerentscheidungen aus denselben Informationen, mehrjährige Produktions- und Preisentwicklung, Verträge und verbindliche Bilanzkontrolle. Die bestehende Mini-Partie darf dabei nicht regressieren.

**② V0.8: Funktionsgraph bis zur Oberfläche schließen.** Jeder geplante Screen und Übergang erhält Implementierung, Bedingungs- und Rückwegprüfung, Tastaturtest, Fehlerfälle und unabhängige Abnahme. Danach die drei Minispiele mit speicherbaren Zwischenschritten ergänzen.

**③ C64-Originalpilot reproduzierbar verifizieren.** Rechtmäßig nutzbare PAL-Referenz identifizieren, SHA-256 und VICE-Konfiguration festhalten, Büro → Karte → Feldinformation → Rückweg reproduzierbar protokollieren; anschließend historische Ergebnisse und Berliner Abweichungen strikt getrennt vergleichen.

**Freigabeempfehlung:** Das aktuelle Paket kann als nachvollziehbarer, separat liegender Entwicklungsprototyp betrachtet werden. Eine Änderung im GitHub-Repository oder eine Freigabe als fertiges Spiel ist **nicht** erfolgt.
