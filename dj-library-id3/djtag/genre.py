from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

import Levenshtein

from .tags import CanonicalTag, TagRegistry

SPLIT_RE = re.compile(r"[,;/]+|\s{2,}")
FUZZY_MAX_DISTANCE = 2


@dataclass(frozen=True)
class FuzzyFinding:
    original_token: str
    suggested_canonical: str | None
    distance: int
    reason: str  # "close-match" | "missing-dot"


@dataclass
class NormalizeResult:
    tokens: list[str]
    findings: list[FuzzyFinding]
    changed: bool


def tokenize(raw: str | Iterable[str] | None) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        parts = SPLIT_RE.split(raw)
    else:
        parts: list[str] = []
        for chunk in raw:
            if chunk is None:
                continue
            parts.extend(SPLIT_RE.split(str(chunk)))
    out: list[str] = []
    for p in parts:
        s = p.strip()
        if s:
            out.append(s)
    return out


def _render(tag: CanonicalTag) -> str:
    return tag.canonical if tag.preserve_case else tag.canonical.lower()


def _closest_canonical(token: str, registry: TagRegistry) -> tuple[str | None, int]:
    best: tuple[str | None, int] = (None, 10**9)
    needle = token.lower()
    for t in registry.tags:
        for candidate in (t.canonical, *t.aliases):
            d = Levenshtein.distance(needle, candidate.lower())
            if d < best[1]:
                best = (t.canonical, d)
    return best


def normalize(
    raw: str | Iterable[str] | None,
    registry: TagRegistry,
) -> NormalizeResult:
    tokens_in = tokenize(raw)
    out: list[str] = []
    seen: set[str] = set()
    findings: list[FuzzyFinding] = []

    for token in tokens_in:
        matched = registry.match(token)
        if matched is not None:
            rendered = _render(matched)
        elif token.startswith("."):
            # Unknown Sean-specific dot tag — preserve verbatim.
            rendered = token
        else:
            suggestion, distance = _closest_canonical(token, registry)
            if suggestion is not None and distance <= FUZZY_MAX_DISTANCE:
                findings.append(
                    FuzzyFinding(
                        original_token=token,
                        suggested_canonical=suggestion,
                        distance=distance,
                        reason="close-match",
                    )
                )
            else:
                findings.append(
                    FuzzyFinding(
                        original_token=token,
                        suggested_canonical=suggestion,
                        distance=distance,
                        reason="missing-dot",
                    )
                )
            rendered = token  # keep on disk until reviewed

        key = rendered.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(rendered)

    changed = out != tokens_in
    return NormalizeResult(tokens=out, findings=findings, changed=changed)


def join(tokens: list[str]) -> str:
    return ", ".join(tokens)
