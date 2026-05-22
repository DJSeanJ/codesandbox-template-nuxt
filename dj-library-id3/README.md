# djtag — DJ Sean J library ID3 normalizer

Two-step automation for the daily inbox triage:

1. Stamp the `album` field with a `YY MMDD: ` date prefix (idempotent).
2. Normalize the `genre` field against a canonical dot-tag dictionary,
   preserving Sean-specific tags (`.DiG`, `.4hof`, unknown `.*` tags) and
   flagging fuzzy / typo'd tokens for review instead of guessing.

Formats: MP3, M4A/AAC, AIFF, FLAC, WAV. The comment field is left alone —
associations stay manual.

## Install (Mac)

```bash
cd dj-library-id3
pipx install .
# or
uv tool install .
```

Then `djtag --help`.

## Workflow

```bash
# Dry-run on a copy of a few inbox tracks
djtag scan ~/Desktop/djtag-scratch/

# Apply safe edits; fuzzy tokens land in review.csv next to the files
djtag apply ~/Desktop/djtag-scratch/

# Open review.csv, set `action` to apply/skip/keep-as-is for each row,
# save, then:
djtag review-apply ~/Desktop/djtag-scratch/

# If anything looked wrong, roll back:
djtag restore ~/Desktop/djtag-scratch/
```

A `.djtag-bak/` directory is written next to each touched file with a
timestamped JSON snapshot of the prior album+genre values. `djtag
restore` replays the most recent snapshot. DAWs that scan folders will
ignore the dot-prefixed directory.

## Extending the dictionary

Edit `canonical_tags.yaml`. Add `aliases:` for every spelling that should
normalize to your canonical form. Set `preserve_case: true` for tags
where capitalization carries meaning (the way `.DiG` does today).

## Tests

```bash
pip install -e .[dev]
pytest
```
