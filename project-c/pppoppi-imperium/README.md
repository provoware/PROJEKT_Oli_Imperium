# Projekt C: PPPOPPI IMPERIUM – Wiederherstellung V1.9.4

Status (25.10.2026): **110 verifizierte Quell-/Testdateien auf getrenntem Integrationszweig nachgetragen.** Die 77 übrigen Original-ZIP-Einträge einschließlich Medien und Berichten wurden bewusst nicht übernommen. Dies ist **keine vollständige Spiel- oder Release-Freigabe**.

- Herkunft: vom Nutzer am 21.10.2026 bereitgestelltes Spielpaket `PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel.zip`.
- Prüfsumme (SHA-256): `94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca`.
- Umfang: 187 Einträge, davon 185 unter `SPIEL/`, einschließlich JavaScript-Quellcode, HTML, Tests und Bildnachweisen.
- Beabsichtigter Zielordner: `project-c/pppoppi-imperium/SPIEL/` sowie Begleitberichte unter `project-c/pppoppi-imperium/`.
- WICHTIG: Das Paket ist die V1.9.4 **Prüfschicht** über einem V1.9.3-Spielkern, nicht die spätere, separate Optimierungsprobe. `src/strategy_balance_v194.js` und `test_strategy_balance_v194.cjs` sind **nicht** in diesem Paket.
- Lokal tatsächlich wiederholt: 6/6 Node-Fachtestprogramme und 3/3 neuere Browserprogramme bestanden; 2 ältere V1.2-Browserprogramme scheiterten an fehlenden `data-delta="-10"`-Schaltflächen. Das ist keine vollständige Freigabe.
- Original-C64-Vergleich, menschliche Kubuntu-Endabnahme und V2.0-Freigabe bleiben offen.
- Nachimport-Nachweis: [QUELLIMPORT_20261025.md](QUELLIMPORT_20261025.md). `WIEDERHERSTELLUNG_MANIFEST.json` bindet die 110 Dateien an das geprüfte Originalpaket; die acht Fach-/Langzeittests liefen lokal erfolgreich. Auf dem endgültigen GitHub-Commit müssen die Prüfungen erneut laufen. Die 52 Vorrelease-Pflichten bleiben ohne unabhängige Abnahme gesperrt.

**GitHub-Quelle als Pflicht:** künftige Spielversionen müssen zuerst unter `project-c/pppoppi-imperium/` im Entwicklungszweig mitsamt Tests gesichert, durch GitHub Actions überprüft und anschließend als überprüfbarer PR angeboten werden. Erst dann gilt ein Versionsstand als auf GitHub gesichert.

Das Forschungsprojekt A/B und dessen offener PR-Stapel bleiben getrennt und unverändert. Keine historischen C64-Originaldateien ins öffentliche Repository aufnehmen.
