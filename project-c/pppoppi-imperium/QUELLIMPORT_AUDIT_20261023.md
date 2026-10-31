# Quellcode-Abgleich PPPOPPI IMPERIUM V1.9.4 – 23.10.2026

**Status: NICHT IMPORTIERT.** Nur Provenienz und Importvorbereitung liegen auf GitHub. Das Spiel ist hier weiterhin nicht spielbar; `main` ist unverändert.

## Verifizierte Herkunft

- Originalpaket: `PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel.zip` (SHA-256 `94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca`).
- Original-ZIP: **187 Einträge**, davon **185** innerhalb `SPIEL/`.
- Davon sind **110 UTF-8-Dateien** geeignete Quellcode-, Test-, JSON- und Textnachweise (899.676 Bytes).
- **77 ausgelassene Einträge**: 2 äußere Berichtdateien und 75 PNG/PDF/ZIP-Mediendateien. Nicht mitkopieren, insbesondere `SPIEL/vergleiche/Original_V082_Archiv.zip` ohne separate Rechteprüfung.
- Lokal erstelltes sicheres Importpaket `PPPOPPI_IMPERIUM_V194_GITHUB_QUELLCODE_SICHER.zip`, **302.215 Bytes**, SHA-256 `54ab598afc58fdf06cb250c33dda08bb0dc4077b8e8b31c328df868a94e809f4`.
- Im sicheren Importpaket liegen die 110 Dateien bereits unter `project-c/pppoppi-imperium/SPIEL/` sowie das dateiweise überprüfte `WIEDERHERSTELLUNG_MANIFEST.json` und `QUELLIMPORT_HINWEIS.md`.

## Lokale Prüfung (nicht als GitHub-Erfolg ausgeben)

- Original-ZIP-Hash stimmt.
- 110 Dateihashes des Quellpakets gegen den Quellarchivinhalt verifiziert.
- Acht Node-Programme der Fach-/Langzeitprüfung: **8/8 erfolgreich**.
- Keine fehlenden statisch verlinkten HTML-/CSS-Ressourcen im bereinigten Paket.
- Keine Treffer einfacher Schlüssel-/Tokenmuster in den ausgewählten UTF-8-Dateien (kein vollständiger Geheimnisscan).
- Browsersicht, Linux-Endabnahme, C64-Originaltreue und Versionsfreigabe **nicht** nachgewiesen.

## Integrationssperre

Der vorhandene Workflow verlangt bisher mindestens 185 Manifestdateien; das ist für das bewusst medienbereinigte Quellpaket nicht passend. Gate erst nach bewusster Anpassung auf 110 mit vollständiger Hash- und Pfadprüfung freigeben. Solange die Quelltexte auf GitHub fehlen, **muss** die Prüfung rot sein.

Nächste Schritte: sicheres Quellpaket in den Recovery-Zweig importieren; GitHub-Quellmanifest/CI unverändert beziehungsweise nur zusammen angepasst prüfen; danach separaten PR auf aktuellem `main` ohne automatischen Merge vorbereiten.