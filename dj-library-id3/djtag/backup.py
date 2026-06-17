from __future__ import annotations

import json
import time
from dataclasses import asdict
from pathlib import Path

from .audio import TagData

BACKUP_DIR_NAME = ".djtag-bak"


def backup_dir_for(file_path: Path) -> Path:
    return file_path.parent / BACKUP_DIR_NAME


def write_backup(file_path: Path, tags: TagData) -> Path:
    bdir = backup_dir_for(file_path)
    bdir.mkdir(exist_ok=True)
    payload = {
        "file": file_path.name,
        "timestamp": time.time(),
        "tags": asdict(tags),
    }
    stamp = time.strftime("%Y%m%dT%H%M%S")
    out = bdir / f"{file_path.name}.{stamp}.json"
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return out


def latest_backup(file_path: Path) -> Path | None:
    bdir = backup_dir_for(file_path)
    if not bdir.is_dir():
        return None
    candidates = sorted(bdir.glob(f"{file_path.name}.*.json"))
    return candidates[-1] if candidates else None


def read_backup(backup_path: Path) -> TagData:
    payload = json.loads(backup_path.read_text(encoding="utf-8"))
    raw = payload["tags"]
    return TagData(album=raw.get("album"), genre_tokens=list(raw.get("genre_tokens") or []))
