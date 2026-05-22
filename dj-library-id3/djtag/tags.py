from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

import yaml


@dataclass(frozen=True)
class CanonicalTag:
    canonical: str
    category: str
    preserve_case: bool = False
    aliases: tuple[str, ...] = field(default_factory=tuple)


@dataclass
class TagRegistry:
    tags: list[CanonicalTag]

    def __post_init__(self) -> None:
        self._by_lower: dict[str, CanonicalTag] = {}
        for t in self.tags:
            self._by_lower[t.canonical.lower()] = t
            for a in t.aliases:
                self._by_lower[a.lower()] = t

    def match(self, token: str) -> CanonicalTag | None:
        return self._by_lower.get(token.lower())

    def canonical_forms(self) -> Iterable[str]:
        for t in self.tags:
            yield t.canonical


def load_registry(path: Path | None = None) -> TagRegistry:
    if path is None:
        path = Path(__file__).resolve().parent.parent / "canonical_tags.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    tags = [
        CanonicalTag(
            canonical=entry["canonical"],
            category=entry.get("category", "uncategorized"),
            preserve_case=bool(entry.get("preserve_case", False)),
            aliases=tuple(entry.get("aliases", []) or ()),
        )
        for entry in (data.get("tags") or [])
    ]
    return TagRegistry(tags=tags)
