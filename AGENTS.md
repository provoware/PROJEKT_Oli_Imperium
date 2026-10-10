# Codex-Arbeitsvertrag · Oil Imperium C64

**Ziel:** Zwei eigenständige Abschlussarbeiten (A historische Forschung, B technische Architektur) und erst später ein HTML-Nachbau (C). C64-Original und Deutschland-/PPPOPPI-Adaption nie vermischen.

## Unveränderliche Regeln
1. **Eine Schreibinstanz:** Nur der benannte `operator` darf Dateien erstellen, verändern oder entfernen – einschließlich Code, Tests, Dokumentation und Git-Aktionen. Koordinator, `forscher`, `planer`, `pruefer` und `doku_pruefer` liefern ausschließlich textuelle Befunde und Vorschläge.
2. **Ein belegter Fachvertrag:** `data/contract.json` ist für Quellen-/Regel-/Screen-/Modul-/Test-IDs maßgeblich. Nie erfundene C64-Regeln, Schwellen, Algorithmen oder „Originaltreue“ behaupten; offenes als offen markieren.
3. **Sparsame Delegation:** Einfache Aufgabe → Koordinator + Operator. Nur bei nachgewiesenem Erkenntnisbedarf einen spezialisierten Agenten aktivieren. Maximal zwei beratende Agenten gleichzeitig; keine Ketten aus Agenten, die sich nur gegenseitig prüfen.
4. **Auftragskarte vor Änderung:** Der Operator braucht Ziel, Anlass, erlaubte Pfade, betroffene IDs, Quelle/Status, Akzeptanzkriterium und den kleinsten notwendigen Test; für reine Tippfehler genügt eine Kurzkarte.
5. **Lokal weiterarbeiten:** Fehlender Originalbeleg sperrt nur abhängige Originalregel, nicht ganze Forschung oder Architektur. Fachrückfragen A↔B gezielt sammeln.
6. **Nach Prüfung nicht blind reparieren:** Prüfer meldet Befund + Reproduktion + Risiko. Koordinator entscheidet. Nur Operator setzt angenommene Korrekturen um. Keine selbständige Endlosschleife.
7. **Minimale Tests:** Markdown → lokale Verweise; `data/` → `python3 tools/validate_project.py`; Agentenkonfig → `python3 tools/check_agent_policy.py`; Prüfwerkzeuge → passende Unittests. Große Regression nur bei Risiko oder Release.
8. **Dokumentation gleichzeitig:** Nur tatsächlich betroffene Quellen, Daten, Verlauf und Architektur verknüpfen; keine Duplikatpflege. Arbeitsberichte mit überprüfbaren Prozent-Nennern.
9. **GitHub:** Kleiner Zweig/PR, keine eigenmächtige Übernahme oder Veröffentlichung. Originalabbilder, fremde Bilder, private Daten, Tokens und Schlüssel nicht hochladen.
10. **Statusbericht:** Tatsächlicher Stand in %, Nenner und Kurzdetails; genau drei nächste Schritte und eine weiterführende Empfehlung.

## Delegationsregeln
- Original-C64-Beleg unklar → `forscher`.
- Modulgrenzen, Schnittstellen, komplexer Eingriff → `planer`.
- Freigegebener Arbeitsauftrag mit Änderungen → `operator`.
- Nach Implementierung oder bei hohem Risiko → `pruefer`.
- Umfangreiche/inhaltlich betroffene Dokumentation → `doku_pruefer`.
- Keine Delegation für triviale Umbenennung, schon bekannte Sachfrage oder reine Statusabfrage.

**Ausführlicher Ablauf:** [Agentenmodell](docs/13_AGENTEN_BETRIEBSMODELL.md) · [Trigger-Matrix](docs/14_TRIGGER_MATRIX.md) · [Auftragskarte](vorlagen/OPERATOR_AUFTRAG.md). Vor jeder größeren Aufgabe nur die **relevanten** Fachdateien lesen, nicht das ganze Repository.

## Code Review Rules
- Als originale C64-Regel eingeführte Änderung ohne bezeugte Quelle/Version und Prüffall beanstanden. Sicherer Weg: als Forschungsfrage markieren oder belegte Regel verwenden.
- Eingriffe in `data/contract.json` müssen ID-Bezüge konsistent halten. Sicherer Weg: gezielter Validator und betroffene Referenzen.
- Der Analysemodus darf den späteren Original-Spielzustand nicht verändern. Sicherer Weg: ausschließlich lesender Ereignisstrom.
- Veröffentlichung von Original-C64-Medien oder persönlicher Heimstudien-Daten ohne Rechte/Aufklärung beanstanden.

**Hinweis:** Diese Datei ist eine verbindliche *Arbeitsanweisung*, kein Betriebssystem-Zugriffsschutz. `sandbox_mode`, GitHub-Zugriffsrechte und menschliche Freigaben müssen separat geprüft werden.
