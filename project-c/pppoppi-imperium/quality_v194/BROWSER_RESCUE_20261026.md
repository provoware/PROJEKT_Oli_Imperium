# Projekt C – Browser-Sanierung: Pflichtpaket 26.10.2026

## Abgrenzung und GitHub-Bestand
- **Spiel:** PPPOPPI IMPERIUM, Technikvorschau V1.9.4 auf Spielkern V1.9.3.
- **Ausgangspunkt:** PR #51, HEAD `b182de370e4afaa16da318a97a0c7993605ed565`.
- **Arbeitszweig:** `agent/prerelease-c-browser-rescue-20261026-0332`.
- **Geänderte Bereiche:** ein neues Browserprüfprogramm, dessen Aufruf im Chromium-CI und dieser Nachweis. Originalquellen und Spielstände bleiben unverändert.
- **Prüfprogramm:** [test_browser_rescue_v194.py](test_browser_rescue_v194.py).
- **Vollständige Pflichtmatrix:** [../prerelease/matrix.json](../prerelease/matrix.json).

## Prüfansatz
Die Testpartie beginnt mit realen Klicks auf **Gutachten** und **Kauf**.
Anschließend wird **ausschließlich im isolierten Test-Browser** ein künstlicher
Liquiditätsengpass erzeugt: Kasse 0 Cent, unbezahlte Testforderung 5.000.000 Cent.
Der resultierende Spielstand ist laut Engine-Schema gültig. Die Phase
`RESCUE` wird **nicht** künstlich gesetzt, sondern durch einen echten
Monatsabschluss mit den zwei KI-Firmen erreicht.

Danach prüft Chromium die echten Schaltflächen **Rettungskredit**,
**zweiter Kredit (Ablehnung)**, **Notverkauf**, **Sanierungsneustart**
sowie zwei getrennte Export-/Neustart-/Importzyklen. Zu prüfen sind
Verbindlichkeiten, Geldbuchungen, Eigentumswechsel, Generationswechsel,
einmalige Ereignisse, identische Speicherstände, Offline-Betrieb und
fehlende JavaScript-Laufzeitfehler. Bildschirmgröße: 800 × 600.

## Beleg- und Freigaberegeln
- **Vor dem CI-Lauf:** `PENDING` – ein angelegtes Prüfprogramm ist kein PASS.
- **PASS:** nur bei tatsächlich erfolgreichem GitHub-Chromium-Lauf auf
  eindeutig genanntem Commit. Ein eventueller Fehler bleibt `FAIL`,
  bis ein erneuter Lauf auf korrigiertem Commit erfolgreich ist.
- **Vorrelease-Matrix:** weiterhin **6/52 PASS, 39 BLOCKED, 4 OPEN,
  3 DEFERRED**. Dieser Test allein gibt `LOG-04` nicht frei.
- **Offen:** echte aus regulärem Gameplay entstandene Insolvenz,
  Sanierung bei mehreren menschlichen Firmen, weitere Sonderaktionen,
  realer Browserzoom, komplette Tastaturpfade, Leistungsgrenzen,
  Quell-/Rechteprüfung, vollständige End-to-End-Partien und Release-Gates.
- **Nächste konkrete Implementierung:** einen ohne künstliche Finanzdaten
  reproduzierbaren Insolvenzauslöser über reguläre Aktionen ermitteln und
  im Browser prüfen; danach getrennt Mehrspieler-Sanierung und Grenzfälle.

**Kein Merge, kein Release, keine persönliche Endabnahme.** Kubuntu- und
Sichtabnahme erst nach grünen technischen Pflichtgates und eingefrorenem
Vorrelease-Kandidaten.
