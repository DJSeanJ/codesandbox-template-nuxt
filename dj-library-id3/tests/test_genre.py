from djtag.genre import join, normalize, tokenize
from djtag.tags import load_registry

REGISTRY = load_registry()


def test_tokenize_handles_separators():
    assert tokenize(".house, .peak; .DiG / .og") == [".house", ".peak", ".DiG", ".og"]


def test_tokenize_multivalue_iterable():
    assert tokenize([".house", ".peak"]) == [".house", ".peak"]


def test_canonical_lowercased_unless_preserved():
    r = normalize("HOUSE", REGISTRY)
    assert r.tokens == [".house"]
    assert r.changed


def test_preserve_case_for_dig():
    r = normalize(".DiG", REGISTRY)
    assert r.tokens == [".DiG"]


def test_dig_alias_normalizes_to_preserved_canonical():
    r = normalize("dig", REGISTRY)
    assert r.tokens == [".DiG"]


def test_unknown_dot_tag_preserved():
    r = normalize(".weirdsean", REGISTRY)
    assert r.tokens == [".weirdsean"]
    assert r.findings == []


def test_close_match_flagged_but_not_rewritten():
    r = normalize("hoose", REGISTRY)  # 1 edit from "house"
    assert r.tokens == ["hoose"]  # untouched until reviewed
    assert len(r.findings) == 1
    assert r.findings[0].suggested_canonical == ".house"
    assert r.findings[0].reason == "close-match"


def test_missing_dot_flagged():
    r = normalize("zzzz unknown", REGISTRY)
    assert len(r.findings) == 1
    assert r.findings[0].reason in ("missing-dot", "close-match")


def test_dedup_case_insensitive():
    r = normalize(".house, House, HOUSE", REGISTRY)
    assert r.tokens == [".house"]


def test_join_uses_comma_space():
    assert join([".house", ".peak"]) == ".house, .peak"
