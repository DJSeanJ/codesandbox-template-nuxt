from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from mutagen.aiff import AIFF
from mutagen.flac import FLAC
from mutagen.id3 import ID3, ID3NoHeaderError, TALB, TCON
from mutagen.mp4 import MP4
from mutagen.wave import WAVE

SUPPORTED_SUFFIXES = {".mp3", ".m4a", ".mp4", ".aac", ".aiff", ".aif", ".flac", ".wav"}


@dataclass
class TagData:
    album: str | None
    genre_tokens: list[str]


def _id3_read_from(tags) -> TagData:
    if tags is None:
        return TagData(album=None, genre_tokens=[])
    album = None
    if "TALB" in tags:
        album = str(tags["TALB"].text[0]) if tags["TALB"].text else None
    genre_tokens: list[str] = []
    if "TCON" in tags:
        for v in tags["TCON"].text or []:
            genre_tokens.append(str(v))
    return TagData(album=album, genre_tokens=genre_tokens)


def _id3_set(tags, album: str, genre_tokens: list[str]) -> None:
    tags.setall("TALB", [TALB(encoding=3, text=[album])])
    tags.setall("TCON", [TCON(encoding=3, text=genre_tokens)])


def _load_mp3_id3(path: Path) -> ID3:
    try:
        return ID3(path)
    except ID3NoHeaderError:
        return ID3()


def read_tags(path: Path) -> TagData:
    suffix = path.suffix.lower()
    if suffix == ".mp3":
        return _id3_read_from(_load_mp3_id3(path))
    if suffix in {".m4a", ".mp4", ".aac"}:
        mp4 = MP4(path)
        album_vals = mp4.tags.get("\xa9alb", []) if mp4.tags else []
        genre_vals = mp4.tags.get("\xa9gen", []) if mp4.tags else []
        album = album_vals[0] if album_vals else None
        tokens: list[str] = [str(v) for v in genre_vals]
        return TagData(album=album, genre_tokens=tokens)
    if suffix in {".aiff", ".aif"}:
        return _id3_read_from(AIFF(path).tags)
    if suffix == ".flac":
        flac = FLAC(path)
        album = (flac.get("album") or [None])[0]
        tokens = list(flac.get("genre") or [])
        return TagData(album=album, genre_tokens=tokens)
    if suffix == ".wav":
        return _id3_read_from(WAVE(path).tags)
    raise ValueError(f"Unsupported audio format: {suffix}")


def write_tags(path: Path, album: str, genre_tokens: list[str]) -> None:
    suffix = path.suffix.lower()
    if suffix == ".mp3":
        tags = _load_mp3_id3(path)
        _id3_set(tags, album, genre_tokens)
        tags.save(path)
        return
    if suffix in {".m4a", ".mp4", ".aac"}:
        mp4 = MP4(path)
        if mp4.tags is None:
            mp4.add_tags()
        mp4.tags["\xa9alb"] = [album]
        mp4.tags["\xa9gen"] = genre_tokens
        mp4.save()
        return
    if suffix in {".aiff", ".aif"}:
        audio = AIFF(path)
        if audio.tags is None:
            audio.add_tags()
        _id3_set(audio.tags, album, genre_tokens)
        audio.save()
        return
    if suffix == ".flac":
        flac = FLAC(path)
        flac["album"] = album
        flac["genre"] = genre_tokens
        flac.save()
        return
    if suffix == ".wav":
        audio = WAVE(path)
        if audio.tags is None:
            audio.add_tags()
        _id3_set(audio.tags, album, genre_tokens)
        audio.save()
        return
    raise ValueError(f"Unsupported audio format: {suffix}")
