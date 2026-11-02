PPPOPPI IMPERIUM – NEO-RETRO V1.1
=====================================

SPIELSTART (OHNE INSTALLATION):
1. ZIP vollständig entpacken.
2. index.html im Spielhauptordner mit Chromium oder Firefox öffnen.
3. „Neue Partie“ anklicken.
4. Durch Klick auf Gegenstände spielen. Tab + Enter sind ebenfalls möglich.
5. „Sichern“ exportiert eine JSON-Datei; „Laden“ liest sie wieder ein.

SPIELWEGE:
- Computer: Bilanz, Claims, Vertrag, Markt, Sicherung.
- Weltkarte: Region auswählen -> Claim -> gutachten -> kaufen -> bohren -> fördern.
- Tanks: vorbereiten -> Regionalmarkt -> verbindliches Angebot.
- Telefon: Edna Ruppen (Verträge) / Milchmädchen Pete (Finanzen).
- Koffer: Bohrung, Pipeline, Brand-Minigame.
- Kalender: aktiven Zug abschließen -> Bericht -> nächster Monat.
- Ente, Pflanze und Papierkorb: Satire ohne Wirtschaftsfolgen.

DATENHINWEIS: V1.1 speichert den wirtschaftlichen Spielstand über expliziten
JSON-Export/Import. Die kosmetischen Spaßzähler stehen separat im Browser.

QUALITÄTSNACHWEISE: docs/BILD_ABNAHME.pdf (9 echte Chromium-Screenshots)
QA-MANIFEST: evidence/MANIFEST.json
AUTOMATISIERUNG (FREIWILLIG, ERFORDERT PLAYWRIGHT UND CHROMIUM):
  python3 browser_acceptance.py
  python3 advanced_tests.py
Original-V0.8.2 als separate Datei im vergleiche/-Ordner.

WICHTIGE EINSCHRÄNKUNG: Die direkte lokale Öffnung konnte in dieser
Prüfumgebung wegen einer Administratorsperre für file:// nicht ausgeführt
werden. Der praktische Doppelklick auf Kubuntu ist deshalb noch nicht abgenommen.
Ein echter Vergleich mit dem C64-Original wurde ebenfalls nicht durchgeführt.

Provoware · Oktober 2026
