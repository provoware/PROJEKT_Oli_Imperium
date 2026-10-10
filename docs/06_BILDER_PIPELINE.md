# 06 · Screenshots und bebilderter Forschungsatlas

## Ziel
Originalansichten mit eindeutiger Herkunft und Spielzustand dokumentieren und für wissenschaftliche Analyse/Präsentation als **annotierte Arbeitskopien** verwenden. Keine zufälligen Netzbilder als „Original-C64“ übernehmen.

## Reproduzierbare Kette
1. Referenzabbild und rechtliche Grundlage kontrollieren; SHA-256 protokollieren.
2. VICE-Version/Region/Startparameter im Versuch erfassen.
3. Spiel an die dokumentierte Ansicht bringen; Eingabefolge und ggf. Spielstand festhalten.
4. Screenshot im VICE-Monitor als PNG speichern (siehe offizielle VICE-Dokumentation).
5. Original-PNG **unverändert** sichern; SHA-256 mit `sha256sum datei.png`.
6. Optional: Arbeitskopie per FFmpeg ohne Weichzeichnung vergrößern, z. B. `ffmpeg -i roh.png -vf scale=iw*4:ih*4:flags=neighbor -frames:v 1 arbeitskopie.png`.
7. Beschriftungen/Pfeile niemals ins Original einbrennen; stattdessen separate didaktische Ebene.
8. SCREEN-ID, Originalversion, Zugfolge, Datum, Quellen-/Rechtevermerk, angezeigte Spielwerte und Menüübergänge ergänzen.
9. Bild zuerst in Atlas/Forschungsakte verknüpfen; erst nach Rechtprüfung für öffentliche PDFs oder das Repository nutzen.

## Pipe-/Automationsidee (geplant, hier nicht ausgeführt)
`VICE-Spielzustand → PNG → Hash/Metadaten → Arbeitskopie → SCREEN-ID → Atlas → PDF`.
**Sparsamkeit:** Nur neue, fehlende oder durch Versionswechsel ungültige Bilder erstellen; bereits identische Screens über Hash wiederverwenden.

## Pflichtfelder pro Bild
`SCREEN-ID | Referenz-SHA | Spielzustand | Aufnahmesequenz | Pfad | PNG-SHA256 | Objekte | Ziele | Quelle | Lizenzstatus | Bildlegende | Nachweisstatus`.

## Zwei Freigaben unterscheiden
1. **Forschungsnachweis:** Herkunft und Funktion erfasst.
2. **Publikationsfreigabe:** Rechteklärung für die konkrete Verwendung erfolgt.

**Status:** Technisches Verfahren dokumentiert; noch keine eigene Originalaufnahme erstellt.
