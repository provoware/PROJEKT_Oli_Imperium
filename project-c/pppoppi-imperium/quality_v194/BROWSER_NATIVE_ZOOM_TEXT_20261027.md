# Texttreffbarkeit und Tabellenabschneidung bei echtem Browserzoom – 27.10.2026

**Spiel:** PPPOPPI IMPERIUM, isolierte V1.9.4-Technikvorschau des V1.9.3-Spielkerns. **Kein Release.** [Entwurfs-PR #82](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/82), gestapelt auf PR #81. Hauptzweig: `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Zweck und Umfang

Bisherige Tests erkannten verdeckte Bedienelemente und horizontalen Ueberlauf, nicht jedoch gezielt von anderen Elementen verdeckte Textbereiche oder abgeschnittene Tabellenzellen. Neuer Chromium-Test `quality_v194/test_browser_native_zoom_text_v194.py` kontrolliert deshalb in 39 registrierten Spielszenen Ueberschriften und Tabellenzellen. Danach durchlaeuft er zwei Wirtschaftsmonate per echten Tab-/Enter-Aktionen und kontrolliert die dynamische Monatsabrechnung.

Das Skript verwendet `chrome.tabs.setZoom/getZoom` fuer **echte 175 % und 200 % Browserzoomstufen** bei Ausgangsfenster 800 × 600. Fuer Texttreffbarkeit werden `Range.getClientRects` und `document.elementFromPoint` eingesetzt; Abschneidung wird bei `overflow:hidden/clip` und messbarem Inhaltueberlauf erfasst. Eine absichtlich deckende Testflaeche muss einen Fehler ergeben (Positivkontrolle fuer die Fehlererkennung).

## Nachweise

- **Implementierungs-HEAD:** `002e2c489c7892bfa10b43b67f1416e6a8d2171d`.
- [GitHub Actions – vollstaendiger Browserlauf #40474144518](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40474144518): **PASS**.
- [Quellnachweis #40474144559](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40474144559): **PASS**.
- [Technische Vorrelease-Sperre #40474144798](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40474144798): **BLOCKED** (erwartete Freigabesperre; kein technischer Release-PASS).
- **175 %:** 39 Szenen, 170 gemessene Textstellen, 32 Tabellenzellen, 0 Abschneidungen, 0 vollstaendige Ueberdeckungen, 0 unmessbare Stellen.
- **200 %:** 39 Szenen, 170 gemessene Textstellen, 32 Tabellenzellen, 0 Abschneidungen, 0 vollstaendige Ueberdeckungen, 0 unmessbare Stellen.
- Die absichtlich eingefuegte Textueberdeckung wurde erkannt. Keine Veraenderung der 110 manifestgeschuetzten Originaldateien.

**Zaehleinheit:** 170 Textstellen pro Zoomdurchlauf, keine 170 verschiedenen Spielfunktionen. Die Pruefung umfasst Ueberschriften und Tabellenzellen einschliesslich Monatsbericht, **nicht alle Fliesstexte, Animationen oder visuelle Details**. Szenenwahl per vorhandener API; Wirtschaftsaktionen per echten Tasten. Der Nachweis ist ein **PARTIAL** fuer BED-03, nicht die vollstaendige Freigabe.

## Offene Pflichtarbeit

1. Restliche dynamische Textarten, mehrzeilige Inhalte und Animationsphasen unter 175/200 % auf Lesbarkeit und Ueberdeckungen untersuchen.
2. Fehlende Dialogaktionen und Grenzfaelle einschliesslich vollstaendiger Tastaturpfade pruefen.
3. Regulare Sieg-/Niederlagenpartien, Speichern/Wiederherstellen und weitere Release-Gates durchlaufen.

**Status:** BED-03/BAR-01 und die technische Gesamtfreigabe bleiben **BLOCKED**. Persoenliche Kubuntu- und Sicht-Endabnahme erst nach eingefrorenem, technisch geprueftem Kandidaten. Kein Merge und kein Release.
