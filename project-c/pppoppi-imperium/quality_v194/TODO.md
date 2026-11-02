# OLI V1.9.4 – offene Vorrelease-Pflichtarbeit (PR #155)

Stand 02.11.2026. Dies ist die **auf PR #155 begrenzte Arbeitsliste**; die verbindliche Gesamtmatrix liegt unter [../prerelease/matrix.json](../prerelease/matrix.json). Die Liste aendert keinen Gate-Status und ersetzt keine bestehende Projekt-Roadmap. Benutzerabnahme erst am Ende.

- [ ] 2026-11-02 | SPE-01/VER-03 | 240-Monats-Chromium bei 175 % und 200 % mit je zwei echten Datei-Auswahldialogen pruefen | CI auf finalem HEAD und Logs beider Matrixjobs kontrollieren | fertig wenn beide Jobs PASS und `session_import_count=2`, `session_import_path=NATIVE_FILECHOOSER` nachgewiesen sind
- [ ] 2026-11-02 | BED-02/03 | Vollstaendige Tastatur- und Tab-Reihenfolge unter Zoom mit Fokuswechseln und 800x600 nachpruefen | unabhängige Browser-Regressionen, kein Direktimport als Ersatz | fertig wenn alle vorgesehenen Dialoge ohne Maus erreichbar und automatisiert belegt sind
- [ ] 2026-11-02 | PER-01/02 | Langzeitverlangsamung eingrenzen und reproduzierbare Leistungsgrenzen begruenden | Wiederholungsmessungen mit identischem Aufbau | fertig wenn vereinbarte Schwellen auf aktuellem HEAD nachgewiesen sind
- [ ] 2026-11-02 | VER-03/SPE-01 | Archiv- und Speicherumfang mit Fehler-/Unterbrechungsfaellen vollstaendig belegen | reale Import-/Export- und Negativtests | fertig wenn alle Matrixfaelle nachvollziehbar PASS sind
- [ ] 2026-11-02 | BAL/QUE-04 | Vermoegensbewertung, Medienrechte und C64-Originalvergleich gesondert klaeren | Quell- und Fachnachweise ohne unbelegte Originaltreue | fertig wenn alle unabhaengig pruefbaren Gates gruen und externe Rechtefragen geklaert sind
- [ ] 2026-11-02 | RELEASE | Technischen Release-Kandidaten erst nach allen technischen Pflichten einfrieren | Matrix, Dokumentation und CI auf einem HEAD | fertig wenn Endabnahme zuletzt erfolgt und ausdrueckliche Nutzerfreigabe vorliegt

**Nachweis:** [240-Monats-Dateidialogbericht](NATIVE_IMPORT_240_LONGRUN_20261102.md). **Gesamtstatus:** 6/52 PASS, keine Freigabe. **PR-Entwuerfe:** vor der Iteration 4 offen; nach der Iteration erneut pruefen.
