"""End-to-end roundtrip across the formats Sean's library uses.

We synthesize empty media containers via mutagen rather than committing binary
fixtures. Not every format can be created from nothing inside mutagen — those
that can't are exercised by the unit tests in test_audio_adapter.py via
mocking instead.
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from djtag import scan as scan_mod
from djtag.audio import read_tags, write_tags
from djtag.tags import load_registry


def _silent_mp3_bytes() -> bytes:
    """A valid minimal MP3 frame (MPEG-1 Layer 3, 32kbps, 44.1kHz, mono).

    Header: 0xFFFB9040 + padding. Just enough for mutagen to parse.
    """
    # Frame size for 32kbps 44.1kHz layer3 = 104 bytes.
    header = bytes([0xFF, 0xFB, 0x90, 0x40])
    return header + b"\x00" * 100


@pytest.fixture
def mp3_file(tmp_path: Path) -> Path:
    p = tmp_path / "test.mp3"
    # Two frames so mutagen can detect bitrate reliably.
    p.write_bytes(_silent_mp3_bytes() * 2)
    return p


def test_mp3_roundtrip(mp3_file: Path):
    write_tags(mp3_file, "26 0522: Test Album", [".house", ".peak", ".DiG"])
    back = read_tags(mp3_file)
    assert back.album == "26 0522: Test Album"
    assert back.genre_tokens == [".house", ".peak", ".DiG"]


def test_plan_file_album_and_genre(mp3_file: Path):
    write_tags(mp3_file, "Old Album", ["house", "HOUSE", "dig"])
    registry = load_registry()
    plan = scan_mod.plan_file(mp3_file, registry, date(2026, 5, 22))
    assert plan.after.album == "26 0522: Old Album"
    assert plan.after.genre_tokens == [".house", ".DiG"]
    assert plan.album_changed
    assert plan.genre_changed


def test_apply_change_writes_and_backs_up(mp3_file: Path):
    write_tags(mp3_file, "Old Album", ["house"])
    registry = load_registry()
    plan = scan_mod.plan_file(mp3_file, registry, date(2026, 5, 22))
    scan_mod.apply_change(plan)

    back = read_tags(mp3_file)
    assert back.album == "26 0522: Old Album"
    assert back.genre_tokens == [".house"]

    bdir = mp3_file.parent / ".djtag-bak"
    assert bdir.is_dir()
    assert any(bdir.iterdir())


def test_iter_skips_backup_dir(mp3_file: Path):
    bdir = mp3_file.parent / ".djtag-bak"
    bdir.mkdir(exist_ok=True)
    (bdir / "sneaky.mp3").write_bytes(_silent_mp3_bytes() * 2)
    files = list(scan_mod.iter_audio_files(mp3_file.parent))
    assert mp3_file in files
    assert all(".djtag-bak" not in str(f) for f in files)
