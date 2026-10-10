#!/usr/bin/env python3
"""Statische und sparsame Kontrolle des Codex-Agentenvertrags (Python 3.11+)."""
from __future__ import annotations

import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "forscher": "read-only",
    "planer": "read-only",
    "operator": "workspace-write",
    "pruefer": "read-only",
    "doku_pruefer": "read-only",
}

def check(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    config_file = root / ".codex" / "config.toml"
    if not config_file.is_file():
        return [".codex/config.toml fehlt"]
    try:
        conf = tomllib.loads(config_file.read_text(encoding="utf-8"))
    except (OSError, ValueError) as ex:
        return [f"Ungültige Codex-Konfiguration: {ex}"]
    agents = conf.get("agents", {})
    if agents.get("enabled", True) is not True:
        errors.append("Unteragenten sind deaktiviert")
    cap = agents.get("max_concurrent_threads_per_session")
    if type(cap) is not int or not 1 <= cap <= 3:
        errors.append("Agentenlimit muss ganze Zahl 1 bis 3 sein")
    folder = root / ".codex" / "agents"
    names = {p.stem for p in folder.glob("*.toml")} if folder.is_dir() else set()
    if names != set(EXPECTED):
        errors.append(f"Rollenmenge falsch: vorhanden={sorted(names)}; erwartet={sorted(EXPECTED)}")
    for name, expected_mode in EXPECTED.items():
        path = folder / f"{name}.toml"
        if not path.is_file():
            continue
        try:
            role = tomllib.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as ex:
            errors.append(f"{name}: TOML ungültig: {ex}")
            continue
        if role.get("name") != name:
            errors.append(f"{name}: interne Rolle/Dateiname widersprechen sich")
        if role.get("sandbox_mode") != expected_mode:
            errors.append(f"{name}: sandbox_mode muss {expected_mode!r} sein")
        for field in ("description", "developer_instructions"):
            if not isinstance(role.get(field), str) or not role[field].strip():
                errors.append(f"{name}: {field} fehlt")
    root_agents = root / "AGENTS.md"
    if not root_agents.is_file() or "operator" not in root_agents.read_text(encoding="utf-8").lower():
        errors.append("AGENTS.md fehlt oder enthält keinen Operator-Bezug")
    return errors

def main() -> int:
    errors = check()
    if errors:
        for error in errors:
            print("FEHLER:", error, file=sys.stderr)
        return 1
    print("Agenten-Konfiguration: OK (fünf Rollen; einziger deklarierter Schreiber: operator)")
    print("Hinweis: Kein Beweis tatsächlicher Rechteisolation oder von Agentenausführungen.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
