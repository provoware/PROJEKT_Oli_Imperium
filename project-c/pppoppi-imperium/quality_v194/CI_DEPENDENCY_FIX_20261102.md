# OLI V1.9.4 – CI-Abhängigkeit für Tastaturregressionen (02.11.2026)

**Arbeitszweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **kein Merge / kein Release**.

## Nachgewiesener Fehler auf Ausgangs-HEAD

- Ausgangs-HEAD: [`b214673a6fd97a3ffe7c9b83560aa3d7db6f237a`](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/b214673a6fd97a3ffe7c9b83560aa3d7db6f237a).
- [GitHub-Lauf #41408148850](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41408148850): **17/18 Kampagnenjobs PASS, 1 FAIL**. Die 175/200-%-Browserjobs, einschließlich der Rückwärts-Tab-Prüfungen, waren erfolgreich; das isolierte Job-Gate `campaign-duration-regression` scheiterte.
- [Fehlerjob 125154796422](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41408148850/job/125154796422): `ModuleNotFoundError: No module named 'playwright'` beim Import von `campaign_keyboard_audit_v194.py` durch `test_campaign_keyboard_audit_v194.py`. Der Runner hatte Playwright vor dem isolierten Regressionstest **nicht installiert**. Die vorangehenden 15 Profil-, 11 Wiederholungs- und 8 Importregressionen waren PASS; spätere Schritte wurden übersprungen.
- Ursache: Der Test importiert einen echten `playwright.sync_api.TimeoutError` und der Helfer benötigt diesen Fehlertyp für die strenge Drei-Sekunden-Warteprüfung. Die Browserjobs installieren die Python-Bibliothek bereits über `install_chromium_ci.sh`, der reine Regressionsjob bislang nicht.

## Begrenzte Korrektur

Nur den isolierten GitHub-Job `campaign-duration-regression` vor den Regressionen mit Python 3.12 und `playwright==1.56.0` ausstatten. **Keine** Browserinstallation im isolierten Job, kein Überspringen von Tests, keine Abschwächung von Tastatur-, Fokus- oder Fehlersperren. Die vorhandene Modul- und Testimplementierung bleibt unverändert.

**Vorabprüfung:** Das bisherige Workflow-YAML wurde auf die betroffene Job-Reihenfolge geprüft; die Änderung muss vor dem ersten Importtest erfolgen. **GitHub-CI auf dem neuen HEAD ist bis zu einem tatsächlich abgeschlossenen Lauf PENDING.** Ein grüner Browserjob auf einem älteren HEAD ersetzt keine aktuelle Gesamtprüfung.

## Vorrelease-Pflichtmatrix / Grenzen

Die verbindliche [52er-Pflichtmatrix](../prerelease/matrix.json) bleibt unverändert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED**. Dieser CI-Abhängigkeitsfehler ist kein Beleg für vollständige Tastaturabdeckung. Weitere Dialoge und Minispiele, Langzeitleistung, Archiv-Randfälle, Vermögensbewertung, Medienrechte und C64-Abgleich bleiben offen. Persönliche Sicht- und Kubuntu-Abnahme erst nach vollständig grünen technischen Gates und eingefrorenem Kandidaten.

## Nächste drei Schritte

1. Neuen GitHub-Lauf auf dem **endgültigen HEAD** auswerten; insbesondere den isolierten Job mit allen 12 Tastaturregressionen und 6 Rückwärts-Tab-Regressionen prüfen.
2. Bei weiterem FAIL den tatsächlichen Job-Log auswerten und nur die konkrete Ursache beheben; andere unabhängige Pflichtarbeit fortsetzen.
3. Anschließend weitere reale Dialog-/Minispiel-Tastaturpfade bei 800×600 und 175/200 % ergänzen; Gesamtmatrix nur nach vollständigem Nachweis ändern.

**Status:** Korrektur zur Integration in den Entwicklungszweig vorgesehen; **keine Freigabe**.
