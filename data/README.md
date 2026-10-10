# Gemeinsamer Datenvertrag

`contract.json` ist **die einzige maßgebliche strukturierte Registratur** für Quellen, Spielregeln, Screens, technische Module, Tests und Kreuzfragen.

**Aktueller Start:** Leere Kategorien sind bewusst leer, denn es existiert noch kein bestätigter C64-Originaltest.

## Felder
- `schema_version`: Formatversion.
- `sources`: `id`, `title`, `url`, `type` (primary, emulator, secondary, forum, reconstruction), `note`.
- `rules`: `id`, `title`, `status` (open, manual, observed, approved), `source_ids` und optional `screen_ids`.
- `screens`: `id`, `title`, `status` (open, captured, reviewed), `source_ids`.
- `modules`: `id`, `title`, `status` (planned, designed, approved), `rule_ids`.
- `tests`: `id`, `title`, `kind` (original, structure, integration), `mandatory`, `weight` >= 1, `status` (not_run, passed, failed, blocked), `rule_ids`.
- `questions`: `id`, `text`, `owner` (A,B), `status` (open, answered, closed), `blocks` (IDs), `related_ids`.

**Wichtig:** Eine regelbezogene Originalvergleichsprüfung darf nur `passed` heißen, wenn sie mit dem dokumentierten Original tatsächlich ausgeführt wurde. Der Validator prüft Struktur/Konsistenz, nicht die Wahrheit der historischen Behauptung.

## Vorgehen
Einmal Quellen-ID erfassen → Regelkarte zuordnen → Bildschirm-/Test-/Modul-IDs verbinden → Übergabe versionieren. Nicht dieselbe Zahl in mehreren Dateien pflegen. Änderungen mit `python3 tools/validate_project.py` prüfen.
