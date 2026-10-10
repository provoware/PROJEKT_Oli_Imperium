# Mitarbeit: effizient und nachprüfbar

## Entscheidungsregel für jede Tätigkeit
**Warum?** Konkrete Lücke / Ziel → **Wozu?** prüfbares Ergebnis → **Was ist betroffen?** IDs und Abhängigkeiten → **Wie prüfen?** kleinster aussagekräftiger Test → **Was dokumentieren?** Quelle, Änderung, Status.

## Arbeitspakete
- A: Primär- und Sekundärmaterial, Emulatorversuche, Regeldaten, Bildatlas, Originaltreue; keine behaupteten Originalalgorithmen ohne Nachweis.
- B: Anforderungen, modulare Architektur, Schnittstellen, Datenmodelle, Fehlerpfade, technische Entscheidungsberichte und Teststrategie; fachliche Regeln nur aus freigegebenem A-Material.
- Gemeinsame Entscheidung: widersprüchliche Originalbelege, Änderungen am fachlichen Vertrag, Prüfungsanforderungen, Veröffentlichungsfragen.
- C (später): HTML-Umsetzung; nicht in A/B hineinschmuggeln.

## Kleinstmögliche Schleife
1. Eine Aufgabe anlegen: ID, Grund, Abnahmekriterium, Eigentümer, Abhängigkeiten und Änderungsumfang.
2. Beleg oder Entwurf an genau einer maßgeblichen Stelle ändern.
3. Nur echte Abhängigkeiten über IDs nachführen; keine parallelen Kopien.
4. Bei Dokumentationsänderung: Markdown-Links/Metadaten prüfen. Bei `data/`-Änderung: Validator. Bei Prüftool-Änderung: Unittests. Bei späterem Spielkern: ausgewählte Regression.
5. Ergebnis und offene Unterschiede im Änderungsantrag berichten; Review, dann Übernahme.
6. Größere konzeptionelle Änderungen nur mit kurzer Entscheidungsvorlage unter `vorlagen/ENTSCHEIDUNG.md`.

## Fragekreislauf
Fachliche Unklarheit B→A oder technische Unklarheit A→B: Ticket aus `vorlagen/KREUZFRAGE.md`, betroffene IDs, genaue Frage, Auswirkungen, 'blockiert genau...', erlaubte Parallelaufgaben. Sammelrückfragen vorziehen; nur kritische Blockaden sofort klären.

## Änderungsvorschlag
- Betroffene ID-Kette: Quelle / Regel / Bildschirm / Modul / Test.
- Vorprüfung: Notwendigkeit, vorhandene Belege, Risiken, erwartetes Ergebnis.
- Umsetzung: klein, nachvollziehbar, keine fremden Bereiche verändern.
- Nachprüfung: Ergebnis, gezielte Tests, Dokumentation, Abweichungen.
- Abschluss: Fortschrittsnenner aktualisieren, nächste drei Schritte.

## Wissenschaft / Urheberrecht
Eigenleistung beider Abschlussarbeiten transparent halten und Abstimmung mit der Prüfungsordnung dokumentieren. Rechteangaben je Bild und Datei. Kein 'frei verfügbar = frei nutzbar'.
