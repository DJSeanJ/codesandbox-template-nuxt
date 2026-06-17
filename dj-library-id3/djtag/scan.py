from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterator

from . import album as album_mod
from . import genre as genre_mod
from .audio import SUPPORTED_SUFFIXES, TagData, read_tags, write_tags
from .backup import write_backup
from .review import ReviewRow
from .tags import TagRegistry


@dataclass
class PlannedChange:
    path: Path
    before: TagData
    after: TagData
    findings: list[genre_mod.FuzzyFinding]
    album_changed: bool
    genre_changed: bool


def iter_audio_files(root: Path) -> Iterator[Path]:
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        if any(part.startswith(".") for part in p.relative_to(root).parts):
            continue
        yield p


def plan_file(path: Path, registry: TagRegistry, today: date) -> PlannedChange:
    before = read_tags(path)
    new_album = album_mod.apply_prefix(before.album, today, fallback=path.stem)
    result = genre_mod.normalize(before.genre_tokens, registry)
    after = TagData(album=new_album, genre_tokens=result.tokens)
    return PlannedChange(
        path=path,
        before=before,
        after=after,
        findings=result.findings,
        album_changed=(new_album != (before.album or "")),
        genre_changed=result.changed,
    )


def apply_change(change: PlannedChange) -> None:
    if not (change.album_changed or change.genre_changed):
        return
    write_backup(change.path, change.before)
    write_tags(change.path, change.after.album or "", change.after.genre_tokens)


def findings_to_rows(change: PlannedChange) -> list[ReviewRow]:
    rows: list[ReviewRow] = []
    for f in change.findings:
        rows.append(
            ReviewRow(
                file=str(change.path),
                field="genre",
                current_token=f.original_token,
                suggested=f.suggested_canonical or "",
                distance=f.distance,
                action="skip",
                notes=f.reason,
            )
        )
    return rows
