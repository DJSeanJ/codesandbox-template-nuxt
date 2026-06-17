from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

REVIEW_FILENAME = "review.csv"
FIELDNAMES = [
    "file",
    "field",
    "current_token",
    "suggested",
    "distance",
    "action",
    "notes",
]


@dataclass
class ReviewRow:
    file: str
    field: str
    current_token: str
    suggested: str
    distance: int
    action: str  # apply | skip | keep-as-is
    notes: str = ""


def write_review(path: Path, rows: list[ReviewRow]) -> Path:
    out = path / REVIEW_FILENAME
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        w.writeheader()
        for r in rows:
            w.writerow(
                {
                    "file": r.file,
                    "field": r.field,
                    "current_token": r.current_token,
                    "suggested": r.suggested,
                    "distance": r.distance,
                    "action": r.action or "skip",
                    "notes": r.notes,
                }
            )
    return out


def read_review(path: Path) -> list[ReviewRow]:
    src = path / REVIEW_FILENAME if path.is_dir() else path
    with src.open("r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows: list[ReviewRow] = []
        for r in reader:
            rows.append(
                ReviewRow(
                    file=r["file"],
                    field=r["field"],
                    current_token=r["current_token"],
                    suggested=r["suggested"],
                    distance=int(r["distance"] or 0),
                    action=(r.get("action") or "skip").strip(),
                    notes=r.get("notes", ""),
                )
            )
    return rows
