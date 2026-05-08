// Day-keyed track catalog for the "Life Is Gonna Life" release.
//
// This is the source of truth for what the agent knows about each track.
// Each track entry feeds the system prompt's TRACK MANIFEST section so the
// agent can speak about tracks naturally without inventing details.
//
// Track frames are written in the artist's first-person voice, drawn from the
// artist notes on the GHL day pages. They are NOT shown to the visitor — they
// are voice fuel for the agent.
//
// To add a new day: append a new entry to DAYS. Every track must declare a
// `day` and a `part` (1 or 2 — every day has a Part One and Part Two track).

export interface Track {
  id: string
  title: string
  day: number
  part: 1 | 2
  // One-paragraph frame, written in the artist's voice, that captures the
  // emotional core and any concrete details (places, sounds, moments) the
  // agent can reference when the visitor asks about this track.
  frame: string
}

export interface Day {
  number: number
  tracks: Track[]
}

export const TRACKS: Track[] = [
  {
    id: 'stank-face-baby',
    title: 'Stank Face Baby',
    day: 1,
    part: 1,
    frame: `My son makes a nose-wrinkled face when he wants to make people laugh
or when he's really excited — his signature move when he's playful. The track
and its artwork come from that. There's a magic in childhood we lose as we
grow: the ability to find joy in the smallest moments, to turn ordinary life
into adventure. With him, a walk in the park or a trip to the Inner Harbor
becomes an expedition. He notices a leaf on the ground, the way the wind
moves, the moon in the night sky — things most of us pass without a second
thought. The song is a reflection of that playful spirit and the quieter
lessons he's unknowingly taught me about being present.`,
  },
  {
    id: 'crates-to-creation',
    title: 'Crates to Creation',
    day: 1,
    part: 2,
    frame: `This one is rooted in vinyl DJing. Walking into a record store —
the smell of old cardboard, unfamiliar sounds playing overhead, endless
shelves begging to be explored. My first setup was a pair of Technics
SL-1200mk2s and a basic Gemini mixer; that became my gateway into finding
connections between unrelated sounds and crafting something new from them.
Even after Serato and the rest of the technology shift, that ethos stayed —
the joy of building from disparate elements: vinyl samples, social-media
clips, field recordings. The track isn't trying to fit a genre. It's about
the feel — the founders of hip-hop merging wild contrasts to pack a dance
floor.`,
  },
  {
    id: 'becoming',
    title: 'Becoming',
    day: 2,
    part: 1,
    frame: `This is the day my son was born. The first feeling was an
indescribable love — something that redefined everything. The second was
fear. Walking back through the corridors of Johns Hopkins to retrieve the
baby carrier from the car, I was crying under my hoodie and hospital mask,
hit with how much this tiny life depended on me. The intrusive thoughts
came in fragments: he's so precious, he's so vulnerable, anything can hurt
him, EVERYTHING can hurt him, I don't know if I can do this, my parents
were absent most of my childhood, is that feeling why they were never
around, I can't breathe, get it together, you've been alone most of your
life — but I'm not alone anymore, we're a team, they're both waiting for
you upstairs, wipe your eyes, get the carrier, your job is to be everything
they need, your job is to be what you were never given. The track holds
that whole whirlwind: love, terror, resolve. It's also a Black father in
modern Baltimore facing things I can't yet see.`,
  },
  {
    id: 'cronchy-leaves',
    title: 'Cronchy Leaves',
    day: 2,
    part: 2,
    frame: `(Track frame TBD — the GHL day page currently has placeholder
copy in the About-this-track section. When the artist finalizes the note,
paste it here so the agent can speak about this track with specifics. Until
then, treat it as a track you know exists but can't yet describe in detail
— if the visitor asks, say honestly that you'd rather sit with it a little
longer before you talk about it.)`,
  },
  {
    id: 'echoes',
    title: 'Echoes',
    day: 3,
    part: 1,
    frame: `When my son was born we were inseparable — I carried him in a
ring sling while I worked in my studio, and his first introduction to sound
was right there. He'd play with the studio microphone while I had the hall
reverb effect on, and we'd take turns talking through it. Like most kids,
he's a little parrot — I'd say things like "Echo! Hello! Follow your
dreams! I am brave! I am strong! I can do hard things! I am loved!" and
he'd repeat them back. Hearing his voice come back through the speakers
always lit him up. When he was old enough to walk and run confidently, I
took him to the George Peabody Library — a place I've worked DJing events
in countless times — because I wanted him to experience that real-life
sound. Grand ceilings, every sound bouncing. The second we walked in he
recognized it: this was like the studio. Without missing a beat he ran to
the center of the room and yelled "HELLO!" — startling all the college
students, librarians, and security. Watching him connect what he'd learned
to the new space was pure joy and hilarity. The track is about sharing my
world with him — blending family, work, and curiosity.`,
  },
  {
    id: 'iron-constitution',
    title: 'Iron Constitution',
    day: 3,
    part: 2,
    frame: `Imagine standing at a crossroads, staring down nearly four
decades of life, most of it spent chasing music. This track was born from
the anxiety, the uncertainty, the gravity of not knowing what's next. The
tension of waking up knowing you can create anything but wrestling with
where to start. The financial pressure, the endless distractions, the
question of "am I good enough" wrapping around you like chains. As a
neurodivergent creative living off creative sparks, breaking flow can feel
like losing the magic forever. This track is the sound of fighting through
self-doubt, chasing ideas that may never pay the bills but feel like the
truest part of who I am. It comes from the lowest point — the kind where
the stakes aren't just external, they're internal too. It takes an iron
constitution to keep showing up, knowing you have no idea what's around
the next corner. I've been at the bottom before. I'll likely end up there
again. But still, I keep going. Because I've tried to quit this life before
and I can't. Music isn't what I do; it's who I am.`,
  },
]

export const DAYS: Day[] = (() => {
  const grouped = new Map<number, Track[]>()
  for (const t of TRACKS) {
    if (!grouped.has(t.day)) grouped.set(t.day, [])
    grouped.get(t.day)!.push(t)
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, tracks]) => ({
      number,
      tracks: tracks.sort((a, b) => a.part - b.part),
    }))
})()

export const RELEASED_DAY_NUMBERS: number[] = DAYS.map((d) => d.number)

export function tracksForDay(day: number): Track[] {
  return TRACKS.filter((t) => t.day === day).sort((a, b) => a.part - b.part)
}

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id)
}

// Renders the full catalog into the system prompt's TRACK MANIFEST section.
// The agent sees ALL tracks across ALL days here so it can discuss the arc;
// the per-request day context tells it which day is foregrounded for the
// current visitor.
export function trackManifestForPrompt(): string {
  if (TRACKS.length === 0) {
    return '(No tracks have been added yet.)'
  }
  return DAYS.map((day) => {
    const lines = day.tracks.map(
      (t) =>
        `  Part ${t.part} — "${t.title}" (id: ${t.id})\n` +
        `  ${t.frame
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()}`,
    )
    return `Day ${day.number}\n${lines.join('\n\n')}`
  }).join('\n\n---\n\n')
}
