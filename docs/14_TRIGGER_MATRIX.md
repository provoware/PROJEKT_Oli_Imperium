# 14 · Auslöserbasierte Arbeit ohne KI-Dauerschleifen

## 14.1 Grundsatz
**Ereignis → Bedarf prüfen → kleinsten relevanten Agenten/Check auslösen → Ergebnis protokollieren.** Kein Zeitplan mit stündlichen Agentenaufrufen und keine automatische KI-Reaktion auf jeden Push. GitHub Actions prüft zunächst ausschließlich deterministische Dateien.

| Trigger / Ereignis | Reaktion | Benötigter Agent | Muss vermeiden |
|---|---|---|---|
| Neuer Forschungsbeleg mit offener Regel | Originalversion/Quelle abgleichen | Forscher | alle Archive erneut lesen |
| Freigegebene A-Regelkarte | Abhängigkeits- und Schnittstellenplanung | Planer | fertige Architektur neu planen |
| Freigegebene Operator-Auftragskarte | minimalen Patch erstellen | Operator | Paralleländerungen anderer Agenten |
| PR verändert nur Schreibweise | Link-Check/Review nach Umfang | ggf. nur Operator | fünf Agenten starten |
| PR verändert Datenmodell/`data/` | Validator und betroffene Referenzen | GitHub-Check, bei Risiko Prüfer | kompletten Emulatordurchlauf |
| PR verändert `.codex/` oder `AGENTS.md` | TOML-/Rollenrichtlinie prüfen | GitHub-Check, bei Risiko Prüfer | Codex bei jedem Commit starten |
| PR verändert Wirtschaftsregel | Quelle, Grenzfall, betroffene Tests | Forscher + Prüfer | ohne Emulatorreferenz Originaltreue behaupten |
| PR ändert README/Handzettel fachlich | begrenzten Doku-/Quellenabgleich | Doku-Prüfer | ganze Abschlussarbeit prüfen |
| Reproduzierter Fehler mit P0/P1 | betroffene Aufgabe sofort priorisieren | Prüfer → Operator | globale Entwicklungsblockade |
| Versionswechsel C64-Referenz | Gültigkeit abhängiger Erkenntnisse prüfen | Forscher + Planer | unbetroffene Screens neu aufnehmen |
| Release/Abgabe geplant | vollständige Freigabekriterien | Prüfer + Doku-Prüfer + Mensch | automatische Veröffentlichung |

## 14.2 Konkrete Automatik
- `.github/workflows/agent_policy.yml` startet nur bei PR-Änderungen an Agentenkonfigurationen, diesem Prüftool oder seinen Tests bzw. manuell über GitHub `workflow_dispatch`.
- Sie benutzt keine KI, keine externen OpenAI-Aufrufe, keinen Schreib-Token und keine langen Volltests.
- Die vorhandene Workflow-Datei `validate.yml` bleibt für Datenstruktur und bestehende Tests zuständig.
- Gleichzeitige veraltete Prüfungen derselben PR können abgebrochen werden; keine parallelen Schreibjobs.
- Labels wie `needs-research` oder `ready-for-operator` sind zunächst **manuelle organisatorische Auslöser**, keine implementierte GitHub-Bot-Automatik.
- Erst bei nachgewiesenem Nutzen können zusätzliche Ereignisse einen KI-Auftrag **zur menschlichen Bestätigung** vorschlagen.

## 14.3 Entscheidungsautomat
```text
NEUE AUFGABE
 → Zweck? Nein: verwerfen/dokumentieren.
 → Besteht die Antwort schon? Ja: vorhandenen Beleg verwenden.
 → Ist eine historische Originalregel betroffen? Ja: Quellenstatus prüfen.
 → Benötigt die Änderung Schnittstellenklärung? Ja: Planer.
 → Ist der Änderungsauftrag eindeutig und freigegeben? Ja: Operator.
 → Hat der Patch fachliche/technische Risiken? Ja: gezielten Prüfer.
 → Ist veröffentlichte Fachdokumentation betroffen? Ja: Doku-Prüfer.
 → Bestanden? PR zur menschlichen Entscheidung.
```

## 14.4 Effizienzgrenzen
Maximal zwei gleichzeitige Lesespezialisten für eine Aufgabe; höchstens drei offene Codex-Unteragenten insgesamt. Eine Recherche darf vorhandene unveränderte Quellen nicht nochmal abrufen. Keine Testwiederholung ohne Änderung/Fehler/Widerspruch/Release. Keine PR-Kette ohne neue Erkenntnis. Bei schwerem Fehler mit Begründung eskalieren, nicht endlos reparieren.

## 14.5 Prüfprotokoll
`TASK-ID | Trigger | Grund | betroffene IDs/Dateien | entsandte Rolle | Änderungen | Test + Ergebnis | Zeit-/Netzaufwand soweit messbar | Restfehler | Freigabe`.

## 14.6 Schutz vor Schein-Automation
`AGENTS.md` und `.codex/agents/*.toml` konfigurieren Agenten, starten sie aber nicht automatisch durch GitHub-Ereignisse. Dafür wäre eine gesonderte GitHub-App/Action mit Token, Trigger, Kostenlimits und Menschfreigabe nötig. Bis dahin sind nur statische CI-Trigger aktiv.
