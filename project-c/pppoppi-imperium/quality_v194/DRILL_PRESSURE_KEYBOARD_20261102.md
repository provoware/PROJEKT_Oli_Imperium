# BED-03 · Bohrdruckregler: echter Tastaturfokus und Verdeckung (02.11.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4-Pruefschicht / V1.9.3-Kern. **Entwurfs-PR:** https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155. **Ausgangs-HEAD:** d6ee7052b976b988e2c0e4c6d0628fb4ea7e9a65. **Implementierungs-HEAD vor diesem Bericht:** cb97a90ef14f5e0a8f5f6ef6a71d2d73e45820a0. **Kein Merge, kein Release.**

## Risiko und Wirkung

Der bisherige echte Bohr-Browserpfad kontrollierte beim Druckregler lediglich, ob Tab das Element erreicht. Danach sendete er Home und Pfeiltasten, ohne berechneten CSS-Fokusring, Verdeckung, Sichtbarkeit im 800x600-Fenster oder einen Fokusverlust nach der Geometriepruefung auszuschliessen. Das konnte unbedienbare Regler als technisch erfolgreich erscheinen lassen. Die bereits strengen Enter-Pruefungen der anderen Minispielaktionen bleiben unveraendert.

## Aenderungen (nur im bestehenden Draft #155)

- Im **abgeleiteten** Technikaufbau erhaelt `#skillPressure` bei `:focus-visible` einen sofort sichtbaren 3px-Fokusring. Die 110 manifestgeschuetzten Originaldateien in `SPIEL/` bleiben unveraendert.
- Vor Home und Pfeiltasten prueft `assert_pressure_keyboard_ready` echten Tab-Fokus, `:focus-visible`, berechneten CSS-Fokusring, tatsaechliche Fenstergeometrie, Verdeckung und Fokus erneut nach der Geometriepruefung. Nach den Pfeiltasten wird der Fokus nochmals kontrolliert. Keine synthetische Fokussetzung und kein programmgesteuertes Scrollen.
- Fuenf neue isolierte Negativ-/Vertragstests: gueltiger Pfad, nicht erreichbarer Regler, fehlender Fokusring, verdeckter Regler, Fokusverlust. Die bestehende GitHub-Pflichtpruefung kontrolliert nun auch die Python-Syntax des Bohrprogramms und fuehrt 15 statt 10 Minispiel-Vertragstests aus.
- Die bestehende Build-Sicherheitspruefung verlangt genau eine Regler-Fokusregel im abgeleiteten HTML und keine entsprechende Aenderung im Original.

## Nachweise und Grenzen

**PASS (Quell-/Struktur-Vorpruefung):** Aenderungsanker und Einzelvorkommen vor dem Schreiben kontrolliert; nachtraeglich die doppelte Python-Zeilenfortsetzung erkannt und auf Commit cb97a90ef14f5e0a8f5f6ef6a71d2d73e45820a0 folgend korrigiert. Diese Strukturpruefung ist **kein ausgefuehrter Python-, Node- oder Browser-Test**.

**PENDING:** Die 15 Python-Vertragstests, der Node-Build-Sicherheitstest und der echte Chromium-Bohrtest auf dem endgueltigen PR-HEAD muessen in GitHub Actions laufen und nachweislich PASS liefern. Ein erfolgreicher Test auf einem frueheren HEAD ersetzt dies nicht. Der echte Bohrtest deckt 800x600 und eine CSS-200%-Variante ab; nativer 175/200%-Browserzoom ist separat zu pruefen.

**BLOCKED:** BED-03 als Gesamtgate, nicht erfasste dynamische Minispielphasen, vollstaendige Langzeitpartien, Leistungsgrenzen, Rechte und C64-Referenz. Die verbindliche Pflichtmatrix bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**.

## Naechste drei Schritte

1. GitHub-Syntax-, Build- und 15 Minispiel-Vertragstests auf dem endgueltigen HEAD auswerten; echte FAIL-Ursachen beheben.
2. Den vollstaendigen Chromium-Bohrpfad (800x600 und CSS-200) auswerten und den Druckregler zusaetzlich unter echtem 175/200%-Browserzoom absichern.
3. Weitere dynamische Regler und Phasen mit Zustandssicherung in die BED-03-Pflichtmatrix aufnehmen; unabhaengige offene Arbeiten trotz Einzelblockade fortsetzen.

**Empfehlung:** Keine Matrix-Aufwertung, bevor ein reproduzierbarer echter Browserbeleg auf finalem HEAD vorliegt. Persoenliche Kubuntu- und Sichtabnahme erst unmittelbar vor ausdruecklich freigegebenem Release.
