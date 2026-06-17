from __future__ import annotations

from datetime import date
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from . import scan as scan_mod
from .audio import read_tags, write_tags
from .backup import latest_backup, read_backup
from .review import ReviewRow, read_review, write_review
from .tags import load_registry

app = typer.Typer(add_completion=False, help="DJ library ID3 normalizer.")
console = Console()


def _summarize(changes: list[scan_mod.PlannedChange]) -> None:
    table = Table(title="Proposed changes", show_lines=False)
    table.add_column("file")
    table.add_column("album → new")
    table.add_column("genre → new")
    table.add_column("flagged")
    for c in changes:
        if not (c.album_changed or c.genre_changed or c.findings):
            continue
        album_cell = c.after.album or "" if c.album_changed else "—"
        genre_cell = (
            ", ".join(c.after.genre_tokens) if c.genre_changed else "—"
        )
        table.add_row(
            str(c.path.name),
            album_cell,
            genre_cell,
            str(len(c.findings)),
        )
    console.print(table)


@app.command()
def scan(path: Path = typer.Argument(..., exists=True, file_okay=False, dir_okay=True)) -> None:
    """Dry-run: show what would change under PATH without writing."""
    registry = load_registry()
    today = date.today()
    changes = [scan_mod.plan_file(p, registry, today) for p in scan_mod.iter_audio_files(path)]
    _summarize(changes)
    total_findings = sum(len(c.findings) for c in changes)
    console.print(
        f"[bold]{len(changes)}[/bold] files scanned · "
        f"[bold]{total_findings}[/bold] tokens would be flagged for review."
    )


@app.command()
def apply(path: Path = typer.Argument(..., exists=True, file_okay=False, dir_okay=True)) -> None:
    """Apply safe edits in place; write review.csv for fuzzy tokens."""
    registry = load_registry()
    today = date.today()
    changes = [scan_mod.plan_file(p, registry, today) for p in scan_mod.iter_audio_files(path)]
    review_rows: list[ReviewRow] = []
    applied = 0
    for c in changes:
        if c.album_changed or c.genre_changed:
            scan_mod.apply_change(c)
            applied += 1
        review_rows.extend(scan_mod.findings_to_rows(c))
    if review_rows:
        out = write_review(path, review_rows)
        console.print(f"Wrote {len(review_rows)} review row(s) → {out}")
    console.print(f"Applied changes to [bold]{applied}[/bold] / {len(changes)} files.")


@app.command("review-apply")
def review_apply(path: Path = typer.Argument(..., exists=True)) -> None:
    """Apply approved rows from review.csv at PATH (or PATH itself if a CSV)."""
    rows = read_review(path)
    registry = load_registry()
    by_file: dict[Path, list[ReviewRow]] = {}
    for r in rows:
        if r.action != "apply":
            continue
        by_file.setdefault(Path(r.file), []).append(r)

    applied = 0
    for file_path, frows in by_file.items():
        before = read_tags(file_path)
        new_tokens = list(before.genre_tokens)
        for r in frows:
            replacement = r.suggested or r.current_token
            matched = registry.match(replacement)
            rendered = (
                matched.canonical
                if matched and matched.preserve_case
                else replacement.lower()
                if matched
                else replacement
            )
            new_tokens = [rendered if t == r.current_token else t for t in new_tokens]
        # dedup preserving order
        seen: set[str] = set()
        deduped: list[str] = []
        for t in new_tokens:
            if t.lower() in seen:
                continue
            seen.add(t.lower())
            deduped.append(t)
        write_tags(file_path, before.album or "", deduped)
        applied += 1
    console.print(f"Applied review decisions to [bold]{applied}[/bold] files.")


@app.command()
def restore(path: Path = typer.Argument(..., exists=True, file_okay=False, dir_okay=True)) -> None:
    """Restore the most recent backup sidecar for every audio file under PATH."""
    restored = 0
    for p in scan_mod.iter_audio_files(path):
        bk = latest_backup(p)
        if bk is None:
            continue
        prior = read_backup(bk)
        write_tags(p, prior.album or "", prior.genre_tokens)
        restored += 1
    console.print(f"Restored [bold]{restored}[/bold] file(s) from backup.")


if __name__ == "__main__":
    app()
