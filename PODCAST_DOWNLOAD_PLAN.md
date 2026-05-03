# Download Sesame Street Podcast for Toniebox (macOS)

## Context

The user needs offline copies of "The Sesame Street Podcast with Foley and Friends" (Audible exclusive, ~20-24 episodes, ~20-30 min each) so their child can listen on a Toniebox — a screen-free children's audio device that cannot run apps like Audible. The Toniebox plays audio loaded onto a **Creative Tonie** figure, which is filled by uploading MP3s through the myTonies web portal at https://my.tonies.com. That means actual audio files are required, not the streaming app.

This runbook is being handed off to a keyboard/mouse control system (computer-use agent) running on **macOS**. Per the user, Audible authentication is **out of scope** and is being handled separately — the agent should assume `audible-cli` is already authenticated. The user has **one Creative Tonie** (~90 min capacity), so this run uploads only the first batch of episodes; the remaining episodes will be rotated through the same Tonie later.

## Approach

Use **`audible-cli` + `ffmpeg`** to fetch DRM-free copies of every episode, decrypt and convert to MP3, then upload the first ~90 minutes' worth (≈3 episodes) to the Creative Tonie via the myTonies web portal. Keep the remaining MP3s on disk for future rotations.

The Audible mobile app method is not viable — files stay locked inside the app and cannot be transferred to the Toniebox.

## Prerequisites (assumed already in place)

- macOS machine with Homebrew installed (`brew --version` works)
- Active Audible account with the podcast already in its **Library** (already added by the user)
- `audible-cli` already authenticated; an `audible.cfg` and auth profile exist under `~/.audible/`
- Browser available (Chrome/Firefox/Safari) for the upload step
- myTonies account (https://my.tonies.com) already signed in **or** sign-in handled by the user separately
- One Creative Tonie figure already paired to the Toniebox

If any prerequisite fails, **stop and report** rather than attempting to fix it.

---

## Phase 1 — Install Tooling

```bash
brew install python ffmpeg
python3 -m pip install --upgrade pip
python3 -m pip install --user audible-cli
```

Make sure the user-bin is on PATH for this shell:
```bash
export PATH="$HOME/Library/Python/$(python3 -c 'import sys;print(f\"{sys.version_info.major}.{sys.version_info.minor}\")')/bin:$PATH"
```

**Verify:**
```bash
audible --version
ffmpeg -version
```
Both must print version info. If `audible: command not found`, fall back to `python3 -m audible` everywhere below.

---

## Phase 2 — Authentication

**Skip.** Out of scope per user. Sanity-check only:
```bash
audible library list | head -3
```
If this errors with anything auth-related, stop and report.

---

## Phase 3 — Locate the Podcast and Capture Episode ASINs

```bash
mkdir -p ~/sesame-podcast/raw ~/sesame-podcast/mp3
cd ~/sesame-podcast
```

Export library and find the show:
```bash
audible library export -o library.tsv
grep -i "sesame street podcast" library.tsv
```
Note the parent `asin` from the matching row.

Resolve podcast children (per-episode ASINs) into a JSON dump:
```bash
audible library list --resolve-podcasts --format json > library_full.json
```

Extract just the Foley & Friends episode ASINs into `asins.txt`. A reliable extractor (replace `<PARENT_ASIN>` with the value from the grep step):
```bash
python3 - <<'PY' > asins.txt
import json
data = json.load(open('library_full.json'))
PARENT = "<PARENT_ASIN>"
items = data if isinstance(data, list) else data.get("items", [])
for it in items:
    title = (it.get("title") or "").lower()
    parent = it.get("parent_asin") or ""
    if "foley" in title or parent == PARENT:
        print(it["asin"])
PY
```

**Verification:**
```bash
wc -l asins.txt    # expect ~20-24
```
If the count is wildly off, stop and report (don't guess).

---

## Phase 4 — Download Every Episode

```bash
cd ~/sesame-podcast
while read -r ASIN; do
  audible download \
    --asin "$ASIN" \
    --aaxc \
    --output-dir ./raw \
    --no-confirm
done < asins.txt
```

Each episode produces an `.aaxc` audio file plus a sidecar `.voucher` JSON containing its decryption key/IV. Re-running the loop is safe — already-downloaded files are skipped.

**Verification:**
```bash
ls ./raw/*.aaxc | wc -l       # matches asins.txt count
ls ./raw/*.voucher | wc -l    # matches asins.txt count
```

---

## Phase 5 — Convert AAXC → MP3

```bash
cd ~/sesame-podcast/raw
for f in *.aaxc; do
  base="${f%.aaxc}"
  voucher="${base}.voucher"
  KEY=$(python3 -c "import json; d=json.load(open('$voucher')); print(d['content_license']['license_response']['key'])")
  IV=$(python3 -c "import json; d=json.load(open('$voucher')); print(d['content_license']['license_response']['iv'])")
  ffmpeg -y \
    -audible_key "$KEY" \
    -audible_iv "$IV" \
    -i "$f" \
    -codec:a libmp3lame -b:a 96k \
    -map_metadata 0 \
    "../mp3/${base}.mp3"
done
```

96 kbps is plenty for spoken-word kids' content and keeps uploads small. Source `.aaxc` files are kept as backups.

**Verification:**
```bash
ls ../mp3/*.mp3 | wc -l
ffprobe -v error -show_entries format=duration -of csv=p=0 ../mp3/*.mp3 | head
```
Spot-check one MP3 with the macOS default player:
```bash
open ../mp3/$(ls ../mp3 | head -1)
```
Confirm it's intelligible audio (not silence/noise), then close it.

---

## Phase 6 — Pick the First Batch (~90 min)

The Creative Tonie holds ~90 minutes total. Pick the first chronological batch.

1. Build a sorted list with durations:
   ```bash
   cd ~/sesame-podcast/mp3
   for f in *.mp3; do
     dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
     printf "%6.1f  %s\n" "$dur" "$f"
   done | sort
   ```
2. Working from earliest to latest, keep selecting episodes until total runtime is **≤ 5400 seconds (90 min)**. Stop before the next one would push it over.
3. Copy the chosen files into a staging folder with numeric prefixes for upload order:
   ```bash
   mkdir -p ~/sesame-podcast/batch1
   # Example, adjust filenames after sorting:
   # cp "01_Episode-A.mp3" ~/sesame-podcast/batch1/01-Episode-A.mp3
   # cp "02_Episode-B.mp3" ~/sesame-podcast/batch1/02-Episode-B.mp3
   # cp "03_Episode-C.mp3" ~/sesame-podcast/batch1/03-Episode-C.mp3
   ```

**Verification — sum batch duration:**
```bash
python3 -c "
import subprocess, glob
total = 0
for f in sorted(glob.glob('$HOME/sesame-podcast/batch1/*.mp3')):
    d = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
    total += d
print(f'Total: {total/60:.1f} min')
"
```
Confirm total is ≤ 90.0 min before uploading.

---

## Phase 7 — Upload to the Creative Tonie via my.tonies.com

GUI work; the keyboard/mouse agent drives the browser.

1. Open https://my.tonies.com in the default browser.
2. Sign in if prompted (out of scope per user — if it requires creds, surface to the user).
3. Click **Creative-Tonies** in the left navigation.
4. Click the user's Creative Tonie figure to open it.
5. Click **Upload** (or drag-and-drop) and select all files from `~/sesame-podcast/batch1/` in numeric-prefix order.
6. Wait for every progress bar to reach 100%.
7. Confirm the page's total runtime indicator reads **≤ 90:00**. If it reads over, remove the last chapter via the trash icon next to it and re-check.
8. Verify chapters list in the intended order (numeric prefixes should keep them sorted). Drag to reorder if not.
9. Click **Save** if a Save button is shown.

**Verification:** Reload the page and confirm chapter count, titles, and order persist.

---

## Phase 8 — On-Device Verification (handoff to the user)

The agent cannot physically test. Surface this checklist to the user:

1. Place the Creative Tonie on the Toniebox.
2. Wait for the Wi-Fi sync (status LED).
3. Confirm episode 1 starts playing.
4. Test ear-pinch (skip forward/back) — chapter boundaries should land on episode boundaries.

---

## Files / Locations on Disk

- `~/sesame-podcast/library.tsv` — full library export
- `~/sesame-podcast/library_full.json` — library with podcast children resolved
- `~/sesame-podcast/asins.txt` — episode ASINs, one per line
- `~/sesame-podcast/raw/*.aaxc` + `*.voucher` — encrypted source files (keep as backup; future re-conversions need the voucher)
- `~/sesame-podcast/mp3/*.mp3` — all episodes, ready for any future batch
- `~/sesame-podcast/batch1/*.mp3` — episodes uploaded in this run

The remaining episodes in `~/sesame-podcast/mp3/` are the rotation pool — the user can re-upload a different ~90-min slice to the same Creative Tonie whenever they want fresh content.

## Troubleshooting

- **`audible: command not found`** → Use `python3 -m audible ...` instead.
- **`audible library list` errors with auth** → Stop. Out of scope per user.
- **`audible download` says "license required"** → Confirm the `--aaxc` flag is present (not `--aax`).
- **ffmpeg "Invalid data found" during decrypt** → Wrong key/IV pairing. Re-extract from the voucher matching the same base filename.
- **myTonies upload silently fails** → Likely a too-large or odd-codec file. Re-encode at 64k: `ffmpeg -i in.mp3 -b:a 64k out.mp3`.
- **Chapter order wrong on the Tonie** → Drag-reorder in the myTonies web UI and Save.
- **Total runtime > 90 min after upload** → Delete the last-uploaded chapter using its trash icon; re-verify.

## Success Criteria

- [ ] `audible --version` and `ffmpeg -version` both succeed
- [ ] `asins.txt` contains ~20-24 ASINs
- [ ] `.aaxc`, `.voucher`, and `.mp3` counts all match
- [ ] Spot-check MP3 plays intelligibly
- [ ] `~/sesame-podcast/batch1/` totals ≤ 90 min
- [ ] Creative Tonie page shows uploaded chapters in correct order, total ≤ 90:00, after refresh
- [ ] User confirms playback works on the physical Toniebox
