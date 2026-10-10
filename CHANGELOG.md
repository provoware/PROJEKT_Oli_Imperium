# Änderungsprotokoll

## C0 0.1.0-alpha.2 – zusätzliche technische Sicherheits- und Bedienprüfungen (unveröffentlicht)

- Strenge, eigene Laufzeitprüfung des Forschungsdatenvertrags: keine erdachten Referenzfreigaben, keine defekten IDs, Statuswerte, Testnachweise oder Quelllinks. Navigationsmodell und Datenwächter getrennt.
- Zusätzliche negative Node-Tests für widersprüchliche Nachweise und schadhafte Referenzen.
- Reeller Headless-Chrome-Ablauftest: Büro/Weltkarte/Claims/Rückweg, Fokusführung, schmaler Viewport, absichtlich ausgelöster HTTP-Ladefehler und erneutes erfolgreiches Laden.
- Automatisierte AA-Kontrastkontrolle, sichtbarer Tastaturfokus und Mindestgröße von Schaltflächen.
- Alle neuen Tests und Testseiten gehören zum reproduzierbaren C0-Prüfarchiv. Keine Änderungen an Originaldaten oder fachlichen C64-Regeln.
- Eigene Versionskennung `release/c0-version.json` und Abnahmeformular `release/approvals.json` auf `0.1.0-alpha.2` fortgeschrieben; keine Freigabe erteilt.

## Unveröffentlicht – HTML-Forschungsprototyp C0 (Entwurf, Freigabe ausstehend)

- Kleiner offlinefähiger HTML/CSS/JavaScript-Forschungsviewer für den hypothetischen Büro→Weltkarte→Claim-Pilot.
- Regelstatus, Quellen und offene Fragen werden lesend aus `data/contract.json` dargestellt; keine duplizierten Forschungsdaten.
- Kein bestätigter Originalbildschirm, keine Spielsimulation, keine vorgezogene Freigabe für Projekt C.
- Acht deterministische Navigations- und Konsistenztests mit Node-Standardbibliothek; separate CI mit Python-Vertragscheck und lokalem HTTP-Smoke-Test.
- Verbindliches Vorgehens- und Freigaberegelwerk in `docs/19_HTML_TESTBASIS_REGELWERK.md`.
- C0-SemVer `0.1.0-alpha.1` getrennt von der Forschungs-Dokumentationsversion; vier zunächst gesperrte fachliche Freigaben.
- Deterministisches internes ZIP-Prüfarchiv mit SHA-256-Manifest, Manipulations-/Negativtests und automatischem GitHub-Artefakt.
- HTML-Aufteilung in Navigationsmodell, Controller, reine DOM-Darstellung und deutsche Oberflächentexte.
- Zusätzliche Browser-Sichtproben für Desktop und Mobilgerät in Headless Chrome; kein Emulator-Originalvergleich.
- Begleitender Prozess für gebündelte Vorabnahme: `docs/20_GEBUENDELTE_VORABNAHME.md`.

## 3.0 – 2026-10-10 (Projektgrundstruktur)
- Gemeinsamer Forschungs- und Architekturauftrag mit zwei eigenständigen Abschlussarbeiten.
- Quellen-, Regel-, Bildschirm-, Modul-, Test- und Fragen-Verknüpfung als ein maßgeblicher Datensatz.
- Codex-Regeln, projektgerechte Änderungsabwicklung, vordefinierte Vorlagen und Handzettel.
- Kleiner Validator mit Negativtests; keine fingierten Originaltreue-Prozentwerte.
- Dokumentierter Workflow für Bildbelege, Risiken, Recht, Heimstudie und späteren Deutschland-/PPPOPPI-Ableger.
- Noch keine formell festgelegte C64-Originaldatei und keine Programmimplementierung.

## Leitlinie
Fortschritt nur für wirklich abgeschlossene, definiert geprüfte Ergebnisse angeben. Nicht im Vorgriff historische Spielregeln freigeben.
