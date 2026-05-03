# Faves Stack → USB → Smart TV Guide

A sequential, AI-executable runbook for downloading every video in a Faves
stack and getting them onto a USB drive that plays on a Samsung / LG / Sony
Smart TV. Designed to be handed to an AI agent with computer/keyboard/mouse
control and run end-to-end with no human judgment calls.

- **Platform:** macOS
- **Target:** USB drive playable on a generic Smart TV (Samsung Tizen, LG webOS, Sony Bravia / Google TV)
- **Total time:** 1–3 hours (most of it is unattended downloading)

## Inputs

- **Faves stack URL:** `https://app.joinfaves.com/share/stack?s=584c31fc-c93d-4d5f-9745-a41747593430&r=3782313`
- **USB drive:** ≥ 32 GB, will be wiped
- **Mac:** any model running macOS 12+
- **Smart TV:** with at least one USB-A port

## Success criteria

- [ ] `yt-dlp` and `ffmpeg` installed and on `PATH`
- [ ] `urls.txt` extracted with one entry per video
- [ ] Every URL produces an `.mp4` in `~/faves-videos/downloads/`
- [ ] At least one file plays correctly in QuickTime
- [ ] USB drive is exFAT, MBR partition map, labeled `FAVES`
- [ ] All files copied to `/Volumes/FAVES/` (matching count)
- [ ] First clip plays on the TV directly from USB

---

## Phase 1 — Install yt-dlp and ffmpeg

### 1.1 Install Homebrew (skip if already installed)

Run in Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Expected output:** ends with `Installation successful!` and instructions for
adding Homebrew to your shell. Follow them — typically one of:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 1.2 Install the tools

```bash
brew install yt-dlp ffmpeg
```

### 1.3 Verify

```bash
yt-dlp --version
ffmpeg -version
```

**Expected output:**
- `yt-dlp` prints a date-style version like `2024.10.07`
- `ffmpeg` prints `ffmpeg version <X.Y.Z> ...`

**Troubleshooting**
- `command not found: brew` → on Apple Silicon Homebrew lives at
  `/opt/homebrew/bin`; re-run the `eval "$(/opt/homebrew/bin/brew shellenv)"`
  line above.
- `command not found: yt-dlp` after install → `brew doctor`, then
  `brew link --overwrite yt-dlp`.

---

## Phase 2 — Extract video URLs from the Faves stack

### 2.1 Set up the workspace

```bash
mkdir -p ~/faves-videos/downloads
cd ~/faves-videos
```

### 2.2 Try yt-dlp directly first (fast path)

```bash
yt-dlp --flat-playlist -J "https://app.joinfaves.com/share/stack?s=584c31fc-c93d-4d5f-9745-a41747593430&r=3782313" \
  | jq -r '.entries[]?.url // .url' > urls.txt
wc -l urls.txt
```

If `urls.txt` has lines and `wc -l` matches the visible card count in the
stack, **skip to Phase 3**. Otherwise continue with the HAR fallback below.

### 2.3 HAR fallback — capture URLs via DevTools

1. Open the Faves URL in Chrome.
2. Open DevTools: `Cmd+Opt+I`.
3. Click the **Network** tab.
4. In the filter bar click **Media** (or type `mp4` in the filter box).
5. Reload the page (`Cmd+R`).
6. Slowly scroll the stack from top to bottom so every card loads. Wait
   ~1 second between scrolls.
7. Right-click anywhere in the network request list → **Save all as HAR with
   content** → save as `~/faves-videos/network.har`.

### 2.4 Pull URLs out of the HAR

```bash
brew install jq   # if not already installed
jq -r '.log.entries[].request.url
       | select(test("\\.mp4|\\.m3u8"))' ~/faves-videos/network.har \
  | sort -u > ~/faves-videos/urls.txt
wc -l ~/faves-videos/urls.txt
```

**Expected output:** `urls.txt` containing one URL per line, count roughly
matching the number of videos in the stack.

**Troubleshooting**
- Empty `urls.txt` → you didn't scroll far enough; re-record the HAR after
  scrolling all the way to the bottom of the stack.
- URLs return 401/403 → some videos require auth cookies. Re-export the HAR
  while logged in, or use `--cookies-from-browser chrome` in Phase 3.

---

## Phase 3 — Batch download all videos as MP4

```bash
cd ~/faves-videos/downloads
yt-dlp \
  -a ../urls.txt \
  -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" \
  --merge-output-format mp4 \
  -o "%(autonumber)03d-%(title).80s.%(ext)s" \
  --no-overwrites \
  --continue \
  --ignore-errors
```

What the flags do:
- `-a ../urls.txt` — read URLs from the file
- `-f "..."` — prefer MP4 video + M4A audio, fall back to any MP4, then any best
- `--merge-output-format mp4` — when merging streams, output MP4
- `-o ...` — number files `001-`, `002-`, …; truncate titles to 80 chars
- `--no-overwrites --continue` — safe to re-run; resumes interrupted downloads
- `--ignore-errors` — one bad URL doesn't stop the batch

**Expected output:** numbered `.mp4` files appearing in
`~/faves-videos/downloads/` with a progress bar per file.

**Troubleshooting**
- HLS/`.m3u8` URLs → already handled because `ffmpeg` is installed.
- 403 / 401 → re-run with `--cookies-from-browser chrome` added.
- "Requested format not available" → re-run with `-f best` instead of the
  `-f "bv*..."` block.
- Rate limiting → add `--sleep-interval 3 --max-sleep-interval 8`.

---

## Phase 4 — Organize and verify files locally

### 4.1 Count files vs. URLs

```bash
ls ~/faves-videos/downloads/*.mp4 | wc -l
wc -l ~/faves-videos/urls.txt
```

The two numbers should match (or be very close — failed URLs were skipped due
to `--ignore-errors`; check the yt-dlp output to see which).

### 4.2 Sanity-play one file

```bash
open -a "QuickTime Player" "$(ls ~/faves-videos/downloads/*.mp4 | head -n 1)"
```

**Expected:** QuickTime opens and the clip plays with audio + video.

### 4.3 Optional — clean up filenames

```bash
cd ~/faves-videos/downloads
# Replace any character that isn't alnum, dash, dot, underscore, or space with _
for f in *.mp4; do
  new=$(echo "$f" | tr -c 'A-Za-z0-9._ -' '_' )
  [ "$f" != "$new" ] && mv -- "$f" "$new"
done
```

---

## Phase 5 — Prepare and format the USB drive

> **WARNING:** the format command erases the entire target disk. Triple-check
> the disk identifier before running it.

### 5.1 Identify the USB device

Plug the USB drive in, then:

```bash
diskutil list
```

**Expected output:** find the entry whose `*SIZE` matches your USB drive (e.g.
`*64.0 GB`) and is marked `(external, physical)`. Note the identifier — it
looks like `/dev/disk4`. **Do not** use `/dev/disk0` or `/dev/disk1`; those
are internal.

### 5.2 Confirm before formatting

```bash
diskutil info /dev/diskN | grep -E "Device / Media Name|Disk Size|Removable Media|Protocol"
```

Replace `diskN` with your identifier from 5.1. Confirm the device name and
size match the USB drive on your desk.

### 5.3 Format as exFAT, MBR, label `FAVES`

exFAT is chosen because Samsung/LG/Sony all support it and it has no 4 GB
file size limit (FAT32 does).

```bash
diskutil eraseDisk ExFAT FAVES MBR /dev/diskN
```

**Expected output:** `Finished erase on disk diskN` and the volume mounts at
`/Volumes/FAVES`.

### 5.4 Verify the format

```bash
diskutil info /dev/diskNs1 | grep -E "File System Personality|Volume Name"
```

Should show `File System Personality: ExFAT` and `Volume Name: FAVES`.

### 5.5 Copy the videos

```bash
rsync -ah --progress ~/faves-videos/downloads/ /Volumes/FAVES/
```

### 5.6 Verify the copy

```bash
diff <(cd ~/faves-videos/downloads && ls | sort) <(cd /Volumes/FAVES && ls | sort)
```

**Expected output:** no output (file lists match).

### 5.7 Eject

```bash
diskutil eject /dev/diskN
```

**Troubleshooting**
- `Resource busy` on erase → close any Finder window pointing at the drive,
  then `diskutil unmountDisk /dev/diskN` first.
- File > 4 GB rejected during copy → you're on FAT32; re-run 5.3.
- Slow copy → expected on USB 2.0 ports; switch to a USB 3.0 port if available.

---

## Phase 6 — Smart TV playback (Samsung / LG / Sony)

### 6.1 Connect

1. Eject the drive from macOS (5.7).
2. Plug the USB drive into a USB port on the TV. Front/side ports usually
   provide more power than rear ports.
3. Power the TV on.

### 6.2 Open the USB browser

**Samsung (Tizen):** press `Home` → scroll to `Source` (or `Connected Devices` /
`Sources`) → select the USB drive → choose `Videos` or browse the folder
directly.

**LG (webOS):** press `Home` → `Devices` → `USB` (or open the `Photo & Video`
app and pick the USB drive).

**Sony Bravia (Google TV / Android TV):** press `Inputs` on the remote and
select the USB device, OR open the pre-installed `Media` / `Album` app and
pick the drive. On older Bravias, `Home` → `USB` tile.

### 6.3 Play

Select the first numbered file (`001-...mp4`). It should start playing in
full screen.

**Expected:** video plus audio, smooth playback.

**Troubleshooting**
- USB option missing in Source list → unplug, try a different USB port. Some
  TVs disable specific ports for media playback.
- "Unsupported format" or "Codec not supported" → run the FFmpeg fallback
  below, then copy the re-encoded files back to the USB.
- Video plays but no audio (or vice versa) → re-encode that specific file
  with the FFmpeg one-liner below.
- Drive not detected at all → verify on a Mac that `/Volumes/FAVES` mounts
  with files; if it does, the TV likely doesn't recognize exFAT — reformat
  to FAT32 (note the 4 GB per-file limit) using
  `diskutil eraseDisk MS-DOS FAT32 FAVES MBR /dev/diskN`.

---

## FFmpeg codec fallback

Re-encode any file the TV refuses into TV-safe H.264 + AAC inside MP4.

### Single file

```bash
ffmpeg -i "input.mp4" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "output.mp4"
```

### Re-encode every file in the downloads folder

```bash
mkdir -p ~/faves-videos/reencoded
cd ~/faves-videos/downloads
for f in *.mp4; do
  ffmpeg -y -i "$f" \
    -c:v libx264 -preset medium -crf 20 \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    "../reencoded/$f"
done
```

Then copy `~/faves-videos/reencoded/` to the USB instead of `downloads/` in
step 5.5.

---

## Final verification checklist

- [ ] `yt-dlp --version` and `ffmpeg -version` both succeed
- [ ] `urls.txt` contains expected number of URLs
- [ ] `ls ~/faves-videos/downloads/*.mp4 | wc -l` matches that count
- [ ] One sample file plays in QuickTime
- [ ] `diskutil info /dev/diskNs1` shows `ExFAT` and `FAVES`
- [ ] `diff` of the downloads folder vs `/Volumes/FAVES` is empty
- [ ] USB ejected cleanly
- [ ] First clip plays on the TV from the USB drive

Done.
