from pathlib import Path

from djtag.review import ReviewRow, read_review, write_review


def test_round_trip(tmp_path: Path):
    rows = [
        ReviewRow(
            file="/x/y.mp3",
            field="genre",
            current_token="hoose",
            suggested=".house",
            distance=1,
            action="apply",
            notes="close-match",
        ),
        ReviewRow(
            file="/x/z.mp3",
            field="genre",
            current_token="bigroom",
            suggested="",
            distance=4,
            action="skip",
            notes="missing-dot",
        ),
    ]
    out = write_review(tmp_path, rows)
    assert out.exists()
    back = read_review(tmp_path)
    assert len(back) == 2
    assert back[0].current_token == "hoose"
    assert back[0].action == "apply"
    assert back[1].suggested == ""
