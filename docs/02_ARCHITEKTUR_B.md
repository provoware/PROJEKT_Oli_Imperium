# 02 · Entwicklungsarbeit B – Softwarearchitektur und Projektplanung

## B-0 Forschungsrahmen
Eigenständige Frage zur Architektur, Softwarequalität, Testbarkeit, Wartbarkeit, Reproduzierbarkeit, rechtlichen Grenzen. Hochschule: Umfang und eigene wissenschaftliche Leistung klären.
**Ergänzung:** B untersucht Entwurfsalternativen und begründet Entscheidungen; reine Übertragung von A genügt nicht.

## B-1 Anforderungen aus A übersetzen
Je freigegebener Regel-ID: Eingaben, Ausgaben, Vor-/Nachbedingungen, Datenänderung, Fehlerzustände, Quelle, benötigte Bildschirme, Abnahmekriterium.
**Ergänzung:** 'noch unbekannt' wird als offenes Feld geführt, nicht als erfundene Zahl.

## B-2 Systemgrenzen und Architekturentscheidungen
Offline-Browser (HTML/CSS/JavaScript), lokale Persistenz, C64-nahe Ansicht, unabhängige Analyseansicht, Asset-/Rechteverwaltung, portable Daten.
**Ergänzung:** Optionen (z. B. Vanilla JS versus kleines Framework) mit Kosten, Abhängigkeiten und Langzeitwartung vergleichen, ohne vorschnell Bibliotheken einzubauen.

## B-3 Fachliches Datenmodell
Spiel, Firma/Spieler, Zug/Monat, Region, Feld, Anlagen, Produktion, Bestand, Verträge, Ereignisse, Gegner und Siegprüfung jeweils nur mit nachgewiesenen Feldern bzw. als Entwurf markierten Erweiterungen.
**Ergänzung:** Geld als genaue Ganzzahleinheit verwalten, sofern zulässige Originalwerte dies ermöglichen; keine stillen Rundungsfehler durch Gleitkommazahlen.

## B-4 Ereignis- und Zustandsmodell
Eingabe → Vorbedingung → Aktion → Zustandsübergang → Ereignisprotokoll → Anzeige. Nur der Spielkern verändert Fachwerte, Analyseansicht beobachtet read-only.
**Ergänzung:** Zufallsquellen isolieren und Testläufe über reproduzierbare Eingaben/Zufallsfolgen vergleichbar machen.

## B-5 Funktionale Module
Referenzentwurf: Eingang/Navigation, Regelmaschine, Simulation, Markt/Geld, Felder/Regionen, Vertrags- und Ereignissystem, Computergegner, drei Minispiel-Controller, Speicher/Laden, C64-Retroansicht, Analyse-/Erkläransicht, Quellenansicht.
**Ergänzung:** Module nur trennen, wenn Schnittstellen und Wiederverwendung die zusätzliche Komplexität rechtfertigen.

## B-6 Nichtfunktionale Qualität
Offline-Funktion, Verständlichkeit, Bedienbarkeit mit Tastatur, erkennbare Kontraste, Fehlerfeedback, stabile Spielstände, feste Schemas und Migrationen, kein Zwang zu Nutzerkonten oder externen Diensten.
**Ergänzung:** Wenn browserlokale Speicherung beim `file://`-Öffnen nicht portabel ist, JSON-Import/Export als garantierten Rückweg vorsehen.

## B-7 Teststrategie und Originalvergleich
Strukturtests (IDs, Referenzen), deterministische Fachtests, kontrollierte Integration, Browser-Smoke-Test, Grenzfälle und später VICE-Vergleich. Änderungslokalität und Risiko entscheiden über Testumfang.
**Ergänzung:** Originaltreue hat getrennte Messgrößen: Pflichtabdeckung, getestete Übereinstimmung und bestätigtes Gesamtmaß – nie '100 %' für leere oder ungeprüfte Mengen.

## B-8 Rückwärtsplanung und abnahmefähiges Pflichtenheft
Vom geforderten sichtbaren Ergebnis und Prüfzeugnis zurück zu Modulen, Daten, Fachregeln, Quellen. Vorwärtsplanung prüft, ob aus A-Befunden gültige Tests und Module ableitbar sind.
**Ergänzung:** Für jeden Meilenstein explizit klären: Was ist minimal erforderlich, was darf warten, was ist nur optionale Modernisierung?

## B-9 Technische Dokumentation und Übergabe
Architekturdiagramme, Schnittstellen, Datenkatalog, Fehlerkategorien, Risikomatrix, Testdesign, Entwicklungsreihenfolge, Aufwandsschätzungsbandbreiten, Versionsstrategie, Definition of Done.
**Ergänzung:** Keine scheinpräzisen Stunden-/Prozentversprechen ohne Ist-Daten; technische Machbarkeit separat von historischer Authentizität ausweisen.

## Wissenschaftliche Eigenleistung B
Begründeter Vergleich mindestens zweier Architekturvarianten für kritische Teile; nachvollziehbare Entwurfsentscheidungen (ADR); Diskussion von Qualität, Abhängigkeit, Komplexität und langfristiger Wartbarkeit. Kein zusätzlicher Webbedarf zur historischen Spielmechanik, sofern A das jeweilige Fachpaket vollständig liefert.
