# djtag tutorial — start here

Hi Sean. This walks you through using `djtag` from scratch. No coding
background needed. Each step says what to type, what it does, and what
you should see. If anything looks different from what's described here,
stop and ask — don't push through.

The whole thing should take about 20 minutes the first time. After that
the daily routine is two commands.

---

## What this tool does

Two boring jobs you do by hand today, every track:

1. **Album field**: stamps it with today's date in `YY MMDD: ` format —
   so a track tagged today (May 22, 2026) gets `26 0522: ` glued to the
   front of whatever was already there.
2. **Genre field**: cleans up your dot-tags. If you typed `house`,
   `HOUSE`, and `dig`, it rewrites them as `.house` and `.DiG`. If you
   typed something the tool isn't sure about (like a typo), it writes
   that question down in a file called `review.csv` and asks you what
   you meant, instead of guessing.

Comments are left alone — you still do associations by hand.

It works on MP3, M4A, AIFF, FLAC, and WAV.

**It always makes a backup before changing anything.** You can undo with
one command (`djtag restore`).

---

## Some words you'll see

- **Terminal** — a Mac app where you type commands instead of clicking
  buttons. We'll open it in step 1.
- **Command** — one line of typing. You press Enter to run it. Most of
  what you'll do is copy a line from this tutorial and paste it in.
- **Folder** — same thing the Finder calls a folder. In the terminal,
  it's sometimes called a "directory."
- **Install** — putting a tool on your Mac so you can use it. Like
  installing an app from the App Store, but using the terminal.

---

## Step 1: Open the terminal

1. Press `⌘ Space` (Command + Spacebar). That opens Spotlight search.
2. Type `Terminal` and press Enter.

A window opens with a blinking cursor and some text that ends with a
`$` or `%`. That's the prompt — it's waiting for you to type a command.

From here on, when you see a gray box like this:

```bash
some command here
```

It means: click in the terminal window, type the command exactly as
shown, and press Enter.

You can also copy the command from this tutorial and paste it in
(`⌘V`). Copy-paste is fine and safer than retyping.

---

## Step 2: Install Homebrew (only if you don't have it)

Homebrew is a Mac app store for terminal tools. You probably already
have it — to check, type:

```bash
brew --version
```

If you see something like `Homebrew 4.x.x`, you're good — **skip to step 3**.

If you see `command not found`, install Homebrew by pasting this:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

It'll ask for your Mac password. Type it (you won't see anything appear
as you type — that's normal, just type and press Enter). Wait for it to
finish, then **close and reopen the terminal**.

---

## Step 3: Install pipx

`pipx` is a tool that installs Python tools like ours. One line:

```bash
brew install pipx
pipx ensurepath
```

(That's two commands — paste the first, press Enter, wait for it to
finish, then paste the second.)

**Close and reopen the terminal** so it picks up the change.

---

## Step 4: Download the djtag code

In the terminal, type:

```bash
cd ~/Documents
git clone https://github.com/DJSeanJ/codesandbox-template-nuxt.git
cd codesandbox-template-nuxt
git checkout claude/dj-library-id3-automation-A4KFv
cd dj-library-id3
```

Line by line, that says:
1. Go to your Documents folder.
2. Download the code from GitHub into a new folder there.
3. Step into the downloaded folder.
4. Switch to the branch where djtag lives.
5. Step into the `dj-library-id3` folder inside that.

**What you'll see** after the last command: the prompt should show
`dj-library-id3` somewhere in it. You're now "inside" the folder with
the tool.

---

## Step 5: Install djtag itself

```bash
pipx install .
```

The `.` means "install the thing in this folder." Wait for it to
finish (10–30 seconds). The last line should say something like
`installed package djtag`.

Test it:

```bash
djtag --help
```

You should see a help menu listing four commands: `scan`, `apply`,
`review-apply`, `restore`. If you do — perfect, the tool is installed.

If you see `command not found: djtag`, close and reopen the terminal
once and try `djtag --help` again. `pipx ensurepath` (from step 3) only
takes effect in a fresh terminal window.

---

## Step 6: Make a sandbox to practice in

We're not going to point this at your real library yet. We'll copy 3–5
tracks to a practice folder first, so if anything looks weird you
haven't touched the real ones.

```bash
mkdir -p ~/Desktop/djtag-practice
```

That creates an empty folder called `djtag-practice` on your Desktop.

Now copy a handful of tracks into it. The easy way: open Finder,
navigate to `/Volumes/00 DJ MUSIC/_INBOX/`, pick 3–5 tracks (variety is
good — maybe one MP3, one M4A if you have one), and drag them onto the
`djtag-practice` folder on your Desktop while holding `⌥ Option` (that
copies instead of moving).

You can verify what's in there with:

```bash
ls ~/Desktop/djtag-practice
```

That lists the files. Make sure you see your tracks.

---

## Step 7: Look without touching (`djtag scan`)

This is the safe one. It reads your files and prints a table of what it
*would* change, but it doesn't actually change anything yet.

```bash
djtag scan ~/Desktop/djtag-practice
```

**What you'll see**: a table with one row per track, showing:
- the filename
- what the new album field would be (with the `26 0522: ` prefix)
- what the new genre field would be (cleaned up)
- how many tokens the tool wants to ask you about

At the bottom: `N files scanned · M tokens would be flagged for review.`

If the proposed changes look right in spirit — move to step 8. If
something looks wildly wrong (like the album field for every track
turning into the same thing), stop and tell me.

---

## Step 8: Apply the safe changes (`djtag apply`)

```bash
djtag apply ~/Desktop/djtag-practice
```

This actually writes the changes. It does three things:
1. Stamps `26 0522: ` on the album field.
2. Cleans up the genre tokens it's sure about.
3. Writes a file called `review.csv` in `~/Desktop/djtag-practice/`
   listing every token it wasn't sure about.

You'll also see a hidden folder called `.djtag-bak/` appear in the
practice folder — that's the backup, in case you want to undo.

---

## Step 9: Answer the questions (`review.csv`)

Open the practice folder in Finder. You'll see a new file called
`review.csv`. Double-click it — it'll open in Numbers (or whatever
opens spreadsheets for you).

Each row is a question the tool has about one tag in one file. The
columns are:

| column          | meaning                                              |
| --------------- | ---------------------------------------------------- |
| `file`          | which track the question is about                    |
| `current_token` | what's currently in the genre field                  |
| `suggested`     | what the tool *thinks* you might have meant          |
| `distance`      | how close the guess is (1 or 2 = very close)         |
| `action`        | **the only column you edit** — type one of three values |
| `notes`         | the tool's reason for asking                         |

In the `action` column, type one of:

- **`apply`** — yes, use the suggested form. So `hoose` → `.house`.
- **`skip`** — leave it alone for now, I'll think about it later.
- **`keep-as-is`** — this is a legit tag, stop asking me about it.

Save the file when you're done (`⌘S`). If Numbers asks about format,
keep it as CSV.

---

## Step 10: Apply the answers (`djtag review-apply`)

```bash
djtag review-apply ~/Desktop/djtag-practice
```

This reads your `review.csv` and applies the rows you marked `apply`.
The `skip` and `keep-as-is` rows are left alone.

---

## Step 11: Check the result in djay and Serato

Open one of the practice tracks in djay. Look at the album and genre.
Do the same in Serato. They should reflect what you expected from
step 7's table plus your `review.csv` answers.

If they look right — you're done with the practice run. Move to step 13.

If something looks wrong — go to step 12 to roll back.

---

## Step 12: If you need to undo (`djtag restore`)

This puts every track's tags back to how they were before `djtag apply`.

```bash
djtag restore ~/Desktop/djtag-practice
```

You can run this as many times as you want. It uses the hidden
`.djtag-bak/` backups the tool wrote in step 8.

After restoring, tell me what looked wrong so we can fix it before you
try on real tracks.

---

## Step 13: Do it for real

Once the practice run looked right, you can point it at the real inbox:

```bash
djtag scan "/Volumes/00 DJ MUSIC/_INBOX"
djtag apply "/Volumes/00 DJ MUSIC/_INBOX"
```

(The quotes around the path are needed because of the space in
`00 DJ MUSIC`.)

Then check `review.csv` in `/Volumes/00 DJ MUSIC/_INBOX/`, mark the
actions, and:

```bash
djtag review-apply "/Volumes/00 DJ MUSIC/_INBOX"
```

If anything goes sideways:

```bash
djtag restore "/Volumes/00 DJ MUSIC/_INBOX"
```

---

## The daily routine, once you're comfortable

After today, your daily workflow is just two commands:

```bash
djtag apply "/Volumes/00 DJ MUSIC/_INBOX"
# open review.csv, fill in the action column, save
djtag review-apply "/Volumes/00 DJ MUSIC/_INBOX"
```

Comments / associations are still on you. So is moving tracks out of
`_INBOX/` into the main library.

---

## Adding new tags to the dictionary

When you invent a new tag (say `.brunch`), open this file in any text
editor:

```
~/Documents/codesandbox-template-nuxt/dj-library-id3/canonical_tags.yaml
```

Add a block like this anywhere in the list:

```yaml
  - canonical: ".brunch"
    category: energy
    aliases: [brunch, .brnch]
```

`aliases` is the list of variations the tool should automatically rewrite to
`.brunch`. Save the file. Next time you run `djtag`, the new tag is live.
No reinstall needed.

If you want a tag where the capitalization matters (like `.DiG`), add
`preserve_case: true`:

```yaml
  - canonical: ".XyZ"
    category: collection
    preserve_case: true
    aliases: [.xyz, xyz]
```

---

## Common things that go wrong

**"command not found: djtag"** — you opened the terminal before pipx
finished setting up your path. Close the terminal, open a new one, try
again.

**"command not found: brew"** — Homebrew isn't installed. Go back to
step 2.

**"command not found: git"** — Macs come with git, but you may need to
trigger the developer tools install. Run `xcode-select --install` and
click through the prompts, then come back to step 4.

**The table from `djtag scan` is empty** — the folder you pointed at
has no audio files. Check with `ls ~/Desktop/djtag-practice` and make
sure the files copied.

**A track now has weird tags after `djtag apply`** — run `djtag restore`
on that folder, then send me an example: which file, which tag, what
you expected vs. what happened.

**You're stuck** — copy the last command you ran *and* the output it
gave you (highlight in the terminal, `⌘C` to copy), and send both. The
exact error text is way more useful than "it didn't work."

---

That's the whole tool. The first run is the scary one. After that
it's two commands and a spreadsheet.
