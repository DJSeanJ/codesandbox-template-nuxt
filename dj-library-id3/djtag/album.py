from __future__ import annotations

import re
from datetime import date

PREFIX_RE = re.compile(r"^\d{2} \d{4}: ")


def format_prefix(d: date) -> str:
    return f"{d.strftime('%y')} {d.strftime('%m%d')}: "


def is_prefixed(album: str) -> bool:
    return bool(PREFIX_RE.match(album))


def apply_prefix(album: str | None, today: date, fallback: str = "") -> str:
    base = (album or "").strip()
    if not base:
        base = fallback.strip()
    if is_prefixed(base):
        return base
    return f"{format_prefix(today)}{base}".rstrip()
