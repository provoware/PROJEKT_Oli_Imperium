# 07 · Risikoregister, Recht, Datenschutz und Reproduzierbarkeit

| Risiko | Frühindikator | Minimalmaßnahme | Zuständig |
|---|---|---|---|
| Falsches Original | Varianten widersprechen sich | konkrete Diskettenreferenz + SHA-256 | A |
| Übernommene Forenbehauptung | kein Originalnachweis | als Hypothese, gezielter Test | A |
| Unterschiedliche Regelstände | A/B benutzen verschiedene Zahlen | gemeinsame Regel-ID und Revision | A+B |
| Fehlende Datenfelder | B kann Aktion nicht eindeutig modellieren | lokale Rückfrage, Schnittstelle weiterplanen | B |
| Versteckte Eigenannahmen | 'kommt sicher so vor' | Unsicherheit explizit dokumentieren | A+B |
| Testexplosion | wiederholte unveränderte Prüfungen | Änderungs-/Abhängigkeitsauswahl | B |
| Falscher Fortschritt | 100 % bei leerem Nenner | nicht messbar anzeigen | A+B |
| Bildrechte verletzt | öffentliches Repo mit Originalassets | Rechteakte, sonst nur Links/Metadaten | A |
| Vertrauliche Hochschuldaten | personenbezogene Notizen öffentlich | Daten minimieren, private Ablage | A+B |
| Adaption verändert Original | Deutschland/PPPOPPI im Originalmodus | Version/Config/Tests trennen | C |
| Einzelner Blocker stoppt alles | fehlende Ölformel | nur Preisberechnung offen | A+B |
| Fehlende Reproduktion | keine Emulatorversion/Dateihash | Referenzakte samt Ablaufprotokoll | A |

## Bild-, Programm- und Markenrechte
Freier Abruf ≠ freie Wiederverwendung. Keine originalen Disketten-/ROM-Dateien, Originalmusik, vollständigen Manualscans, Kopierschutztabellen oder fremden Screenshot-Sammlungen ungeprüft veröffentlichen. Hochschulprivilegien nicht pauschal als Veröffentlichungslizenz interpretieren.

## Datenschutz
Für freiwillige Heimstudie vorzugsweise keine personenbezogenen Informationen erheben. Ergebnisexport lokal, keine automatische Übertragung.

## Lizenzstatus dieses Repositories
Derzeit wird **keine Softwarelizenz** erteilt: wissenschaftliche Texte und späterer Code benötigen vor einer Weitergabe eine ausdrückliche Lizenzentscheidung. Originalmaterial des Spiels ist davon unabhängig zu behandeln.

## Sicherheits- und Datenhygiene
Vor jedem Commit `git diff --check`, keine Zugangsdaten, keine nicht freigegebenen Primärassets, keine privaten Protokolle. Backups und Fortschrittsdokumentation sind unabhängig zu führen.
