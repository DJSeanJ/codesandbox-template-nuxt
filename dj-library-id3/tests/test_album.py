from datetime import date

from djtag.album import apply_prefix, format_prefix, is_prefixed


def test_format_prefix_uses_yy_mmdd():
    assert format_prefix(date(2026, 5, 22)) == "26 0522: "


def test_apply_prefix_adds_when_missing():
    out = apply_prefix("Some Album", date(2026, 5, 22))
    assert out == "26 0522: Some Album"


def test_apply_prefix_idempotent():
    pre = "26 0522: Some Album"
    assert apply_prefix(pre, date(2026, 5, 22)) == pre


def test_apply_prefix_does_not_match_year_in_title():
    # Album titles that start with digits like "1989 (Taylor's Version)"
    # should NOT be treated as already prefixed.
    out = apply_prefix("1989 (Taylor's Version)", date(2026, 5, 22))
    assert out == "26 0522: 1989 (Taylor's Version)"


def test_apply_prefix_empty_uses_fallback():
    out = apply_prefix(None, date(2026, 5, 22), fallback="track-01")
    assert out == "26 0522: track-01"


def test_is_prefixed_strict():
    assert is_prefixed("26 0522: x")
    assert not is_prefixed("260522: x")
    assert not is_prefixed("26 0522:x")
    assert not is_prefixed("2026 0522: x")
