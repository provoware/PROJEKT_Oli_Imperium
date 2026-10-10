# 13 · Agentensystem V4: Ein-Schreiber-Prinzip

## 13.1 Architektur
```text
MENSCH / HOCHSCHULVERANTWORTLICHE
                 |
          KOORDINATOR (root)
                 |
     Bedarfserkennung & Auftragskarte
       /       |          |        \
  FORSCHER   PLANER   PRÜFER   DOKU-PRÜFER  (alle read-only, nur bei Bedarf)
       \       |          |        /
             OPERATOR (einziger Schreiber)
                 |
           gezielter Diff / PR
                 |
       unabhängige Prüfung/Entscheidung
```
Der Koordinator fasst zusammen, entscheidet Priorität, ruft Experten nach Bedarf, schreibt aber **keine Projektdateien**. Der Operator implementiert Code, Daten und Dokumentation. Historische Spielregeln liefert Arbeit A, technische Entwürfe Arbeit B.

## 13.2 Aktivierungsstrategie
| Aufwand/Risiko | Agenten | Ergebnis |
|---|---|---|
| Kleiner Rechtschreibfehler | Koordinator → Operator | Patch, kurzer Abgleich; kein Forschungsagent |
| Unklare C64-Regel | Forscher → Koordinator → optional Planer → Operator | Beleg, Status, sichere Aktualisierung |
| Neue Schnittstelle | Planer → Operator → Prüfer | fachlicher Vertrag, Entwurf, prüfbarer Patch |
| Nur Dokumentationskorrektur mit historischen Aussagen | Forscher oder Doku-Prüfer → Operator | verifizierte Aussage und aktualisierter Verweis |
| Kritischer Eingriff Geld/Zeit/Sieg/Persistenz | Forscher + Planer → Operator → Prüfer + Doku-Prüfer | Nachweis, Grenzfälle, Risiko-Review |
| Veröffentlichung / Hochschul-Abgabe | Operator für tatsächlich erforderliche Korrekturen; menschliche Endfreigabe | Freigabeprotokoll |

## 13.3 Rollen und Rechte
- **Koordinator (Hauptagent):** Triage, Nachfrage, Annahme/Ablehnung von Vorschlägen, kein Code-/Dateischreiben.
- **Forscher:** Originalbelege, C64-Version, Emulatorbeobachtung; read-only.
- **Planer:** Softwarearchitektur, Modulkarten, Schnittstellen und Umsetzungsaufträge; read-only.
- **Operator:** einzige Schreibinstanz für sämtliche Repository-Dateien, inklusive Docs/Tests, auf eigenem Zweig.
- **Prüfer:** Befund, Reproduktion, Auswirkung, Testlücke; read-only.
- **Doku-Prüfer:** Fachübergabe, Querverweise, Glossar, Handzettel und akademische Konsistenz; read-only.

**Rechtehinweis:** `sandbox_mode = "read-only"` ist eine Codex-Konfigurationsvorgabe. Laufzeitüberschreibungen, gemeinsame Credentials oder übergeordnete Berechtigungen können sie verändern. Für durchsetzbare Trennung separate Ausführungsumgebungen ohne Schreibzugriff und ausschließlich dem Operator zugewiesene GitHub-Credentials nutzen. `AGENTS.md` ist kein Hard-Security-Gate.

## 13.4 Handoffs mit eindeutigen Formaten
- Forscher → Koordinator: `ID | Aussage | Plattform/Version | Beleg | Status | offene Frage | minimaler Test`.
- Planer → Koordinator: `Ziel | betroffene IDs | erlaubte Dateien | Vor-/Nachbedingung | Abhängigkeiten | Akzeptanz | Tests`.
- Koordinator → Operator: freigegebene [Auftragskarte](../vorlagen/OPERATOR_AUFTRAG.md), gewünschter Zweig, klarer Zeit-/Risikorahmen.
- Operator → Prüfer: Diff, tatsächlich gelaufene Tests, betroffene Module, beabsichtigtes Verhalten.
- Prüfer/Doku-Prüfer → Koordinator: priorisierte Fundstellen, keine Änderungen.
- Koordinator → Mensch: Evidenz, Stand, blockiert nur was, Empfehlung, Freigabevorlage.

## 13.5 Endliche Arbeitsrunde
1. Eingang mit Zweck, Scope und ID → 2. Triage → 3. **nur nötige** Lesespezialisten → 4. Freigabe des Minimalplans → 5. Operator ändert → 6. passende automatisierte Checks → 7. bei realem Risiko read-only Review → 8. Operator korrigiert konkrete Befunde → 9. Check/PR/Menschenfreigabe.
**Abbruch:** Höchstens zwei gezielte Korrekturrunden pro Befund; danach Problem neu zuschneiden. Keine automatische Endlosschleife, kein selbstständiger Merge.

## 13.6 Original und Adaption
Die C64-Fassung bleibt Referenz. Deutschland-/PPPOPPI-Variante erst nachgelagert, getrennte Daten- und Testgrundlage; nie als historische Originalfunktion bezeichnen.

## 13.7 Messung ohne Scheingenauigkeit
`P_Arbeitsfluss = abgenommene Pflichtaufgaben / definierte Pflichtaufgaben`. `P_A = freigegebene Forschungs-Pakete / verpflichtende Pakete`. `P_B = technisch freigegebene Module / definierte Pflichtmodule`. `P_Originaltreue = bestandene gewichtete Pflicht-Originalvergleiche / alle gewichteten Pflicht-Originalvergleiche`. Bei leerem Nenner: **nicht messbar**, nicht 100 %. Zusätzlich Änderungsaufwand, Zahl unnötiger Wiederholungstests und offene P0/P1-Lücken führen; niemals freie Schätzungen als wissenschaftliche Kennzahl nutzen.

## 13.8 Fünf systematische Qualitätsschleifen – keine fünf identischen Testläufe
(1) **Notwendigkeit:** Wozu, warum jetzt? (2) **Fachbezug:** Quelle/Regel/Version? (3) **Architektur:** Minimaländerung und Abhängigkeiten? (4) **Validierung:** Kleinster aussagefähiger Test? (5) **Nachvollziehbarkeit:** IDs, Doku und Freigabe? Nur bei realen Befunden nacharbeiten.

## 13.9 Laufzeit und praktische Einrichtung
Konfiguration in `/.codex/config.toml`, Rollen in `/.codex/agents/*.toml`. Kein festes Modell eingetragen; Codex verwendet ein für den angemeldeten Account verfügbares Modell. Lokal prüfen: `python3 tools/check_agent_policy.py` (Python 3.11+), danach in Codex ausdrücklich mit einem **read-only**-Agenten einen kleinen Erkundungsauftrag erproben. Auf GitHub prüfen automatische *statische* Regeln, keine KI-Generierung.

## 13.10 Offene Schutzmaßnahme
Ein deklarierter einziger Operator ist zunächst ein **Verfahrensstandard**; erst eine passende Rechte-/Token-Trennung beweist, dass andere Prozesse technisch nicht schreiben können. Deshalb nicht mit garantierter technischer Abschottung werben.
