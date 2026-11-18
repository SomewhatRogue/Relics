# Territories: bigger hand-laid maps with a story, a road through them and gates

Spec, 2026-11-17 (Kyle and Claude Fable 5.2). **Not built.** Names and facts marked **[NEW]** are not in
the story bible; the lore keeper read this draft on 2026-11-17 and its rulings are folded in (the list is in
the log, `docs/decisions/territories.md`). They go into the bible only on Kyle's yes. No line here ships as
written: player-facing words go through the lore keeper and the line editor when a slice is built.

## What Kyle asked for (2026-11-17)

- "Make all of the maps for the quests a bit bigger and more tailored, basically making sure that each has a
  theme or a feel to it that carries through and is potentially a little bigger than just a small field or
  collection of houses unless it's a corridor area."
- "I also want more bigger hand laid maps. Start planning them out and give them a story."
- "Make it possible for multiplayer so some gates or screens you can pass through but generally bigger
  territories and scapes between each zone and a more linear feel (sort of like an instance)."

## Where the quest maps stand today

The five quest postings (`shared/heroquests.ts`) run the ordinary board generator at their place: two to
five rooms of 28 by 24 (or 34 by 20) drawn from the country's pool, seeded by the hero. Nothing about a
quest's map is its own. The game already has what a tailored map needs: Hangman's Wood (72 by 48) and
Fenmere (76 by 60) laid by hand on the expedition kit, and the Open Cut's one-map frame (stretches, gates
that wait for the party, checkpoints, dozing behind). A territory is those two put together.

## The format

A **territory** is one hand-laid map with a road through it. It has three kinds of ground:

- **Zones** (three to five): the places with a story, where the fighting is. Each is one scene you walk in
  on, with the hungry busy at something, one job for the party, and one thing only this zone has.
- **Scapes** (one between each pair of zones): the country between. Twenty to forty tiles of lane, field,
  causeway or gallery, quiet on purpose. The Open Cut's lull, grown up. Rules for a scape:
  1. **A view.** One thing ahead you'll reach: the barn's roof on the rise, a wheel turning, three smokes.
  2. **A trace.** One thing on the ground that tells the story without a line: a track, a dropped thing.
  3. **A sound before a sight** (arcs-and-missions.md lesson 2): the next zone is heard first.
  4. **Hardly anyone in it:** a patrol or a knot of two at most, never a pack. It's where a party
     regroups, drinks and talks.
  5. **One pocket** you can skip (a chest, a captive, a look at something), a dead end, never a second way.
- **Gates and screens:** how you pass from one to the next.
  - A **gate** is in the map, and it's a thing of the place: a field gate in a hedge, planks pulled off a
    drain, a sluice, a pair of barn doors, an air door in a mine. It opens when the zone's job is done and
    every hero who's up stands at it. It's the checkpoint: the fallen get up there, the wipe count starts
    again there, and the ground behind dozes (`sim/stretches.ts`, `sim/checkpoint.ts`, `sim/sleep.ts`, as
    the Open Cut has them).
  - A **screen** is a way into another map: a big interior, a level down a ladder. Same rule: everyone at
    the door, then everyone through.

**The linear feel.** One way on. Hedges, banks, water, thick wood, walls and rock keep the party on it,
and the edge of the map does what it already does to anyone who climbs out. A territory may bend (it isn't
always bottom to top) but it never gives a second route to get lost on.

**Fewer goblins, each a job** (Kyle's Open Cut rule): packs of two to four with a leader, standing
somewhere doing something. A zone is two or three packs, not a field of them.

**One ground, four jobs.** Each zone is laid with slots for the board's objectives: a cage place, a den
place, a rack place, a named butcher's ground. The quest uses the slots its story wants; later the daily
board's jobs at that place run on the same ground with their own slots filled (slice 8), so the place is
the same place every time and the job is what changes.

**Seeds.** The spine, every zone's place, the gates and the set pieces never change. The seed shuffles
cover, which goblins are in a pack, chests, the captive, the hour and the weather (the atlas rule).

### Sizes

| Kind | Map | Zones | Time | For |
| --- | --- | --- | --- | --- |
| Short | about 44 by 90 | 3 | 6 to 8 min | Lowfurrow, Tollan's Farm |
| Medium | about 56 by 125 | 3 or 4 | 10 to 12 min | Sallow Carr, Fennick Ford |
| Long | 4 screens of about 40 by 60 | 4 or 5 | 15 to 18 min | the Copperdeep Shafts |

Today's rooms come to 1,300 to 3,400 tiles a job. A short territory is about 4,000 and a medium one
7,000, most of it scape. The Open Cut's stress map (150 by 150, 150 goblins) measured cheaper than
Fenmere runs today (docs/decisions/instances.md), so these are well inside the budget: a map built in
2 s on a phone, a room step under 4 ms with the CPU slowed 4x.

### Multiplayer

- **One to four heroes.** Quest territories are the level ladder, so they are tuned for **one** and get
  harder with each hero added (more health and harder hits, not more goblins: Kyle, 2026-11-05). This is
  the opposite of an instance, which never scales under three. Kyle to confirm.
- **Gates wait for everyone** who's up. A friend down is up at the last gate ten seconds later. The third
  wipe since the last gate loses the run.
- **Each zone has a job two do faster than one**, never one that needs two: one hero holds a winch while
  the rest guard, two leaves of a barn door, one carries the lamp. Alone it's slower and more exposed.
- **A run joined counts toward your own quest** (Kyle, 2026-11-13: already the rule).
- **The room decides everything**, built from the job's seed on every screen; the map is never sent.

## The thread: the Lowfurrow line [NEW, Kyle's call]

The five quest territories lie along one road, and a hero climbing the ladder is walking it a step behind
one roped line of people.

- Fourteen gleaners **[NEW]** went out from Wickhold to cut what still seeds itself at Lowfurrow, because
  bread is dear and nothing comes in from outside. All grown men and women, gone of their own accord: nobody
  sent them, and farming outside the walls stays chapter 1's vote. "Gleaners" is the town's wry word for
  anyone who cuts out there, since nobody sowed it. The hungry took them at their work.
- Like the prologue, the line is each hero's own and undated. No shared line in town ever speaks of "the
  fourteen".
- At Lowfurrow (the first job) you bring out the five who were hidden, caught or penned. **Nine were roped
  and walked on** before you came. Nothing says so. You see a trampled lane through the rye going on
  past the rise, and things dropped along it.
- Each later territory is a place that way passes through, and shows one thing the hungry do with people:
  where they're **taken** (Lowfurrow), **eaten** (Tollan's Farm), where the hungry **live** (Sallow Carr),
  where people are **counted** (Fennick Ford), and where they're **put to work** (the Copperdeep Shafts).
  The way itself is never named or drawn on a map: the bible fixes only that Greyhollow lies east of town.
- The nine turn up along it: one left lame at Tollan's, one kept at a den in the carr, three caged at the
  ford, four at the face in the Shafts. Each can be lost: missed in a pocket, left in a burning den, not
  reached in time.
- It's told on the ground. The board's postings stay as they are, one or two sentences each. The only new
  words are on the hero's own recap, in the game's plain voice: who came home. Father Odric keeps the count
  of the dead only, so he speaks only of those he can put on it (burned by a den, dead at the face). Anyone
  walked over the ford is taken, not dead: no notch, and nobody says where they went.
- If one of the nine ever needs a name (the lore keeper's, unused elsewhere): Dickon (the lame man), Emmot
  (the woman on the holm), Sib. The detail first, then the name, and only on that hero's own recap.

Why this thread: it is the bible's own material (the pens make the hungry, so every rescue matters twice;
they took the ones who could dig; the wall at Fennick Ford) and the arcs doc's lessons 1, 3 and 6 (every
job takes something; captivity is the scariest place; hold the real goal back). A new player doesn't know
there is a thread until about the ford. It needs no boss and almost no writing. Its one piece of new cast is
Tollan, if he's given a line (below).

What it must never do (the lore keeper holds me to these): show the Tally Man, his ledger, a price, a name or
a buyer before chapter 4; say where the roped go beyond what the ground shows; explain the count; show the
roped as anything but plain captives (never bred, drugged, altered, driven as rams, or called cattle); put a
child among them. A caged one cries pain and the cage, never "help me", which is the mimic's line.

## The five quest territories

### 1. Lowfurrow Fields: the gleaning (first job; level 1; rescue; short; always by day)

**What happened.** The gleaners were taken at their work an hour or two ago. The dinner is still in the
basket.

**The feel.** Open, bright, readable, safe-looking: strips gone to rye, wild oat and thistle, the rye over
head height, a blue day, larks. The
least ruined place in the valley, which is why new heroes start here. What's wrong is small: sickles in
the stubble, a handcart on its side.

| | Ground | What you walk in on | The job |
| --- | --- | --- | --- |
| In | The stile off the Wickhold road | | |
| Zone 1 | **The headland.** The gleaners' handcart, dropped sickles, sheaves half bound | Two scrappers fighting over the dinner basket | Kill them; a gleaner comes out from under the cart (the first rescue) |
| Gate | The field gate in the hedge (teaches gates: stand in it, all of you) | | |
| Scape | **The long strips.** Ridge and furrow, rye standing either side of a trampled lane | The barn's roof on the rise; a scarecrow in a gleaner's bonnet; a pond down a side path (a chest) | |
| Zone 2 | **The stooks.** A cut strip, sheaves stood in rows (cover that burns), a hay cart | Two gleaners made to carry sheaves to the cart, an archer up on it | Cut them free |
| Gate | The drain: the hungry pulled the planks off the bridge. Lay them back (a hold, quicker with two) | | |
| Scape | **The barn road.** A hollow lane under elms, climbing | The great barn: no doors on it, carts dragged across the doorway, something big shifting inside. No fight: the Doorkeepers' hunt is posted later | |
| Zone 3 | **The fold yard.** A sheepfold of hurdles used as a pen | A pack with a drummer round the pen | Break the pen; the last two come out |
| Out | The stile on the rise | The trampled lane goes on north without you | |

- **Only here:** standing rye. You can't see into it, and neither can they. It burns.
- **What it costs:** nothing yet. It's the first job. The cost is what you notice on the rise.
- **Solo and party:** soloable by a hero who has only just left the wood.
- **Needs:** rye as cover and fuel (new), the field gate and the plank bridge as gate looks.

### 2. Tollan's Farm: MAWL has the barn (level 3; hunt MAWL; short)

**What happened.** Tollan held out on his own ground, as Hew and the eel-catchers did, until one morning he
walked his family in to Wickhold between breakfast and dinner, with the table laid and the yard gate left
open for the stock **[NEW]**. The family is never named or counted, and nothing of theirs is in the larder.
He's in town now and won't stop asking about his dog (voice.md). MAWL has made the barn a larder, and the
hungry are carrying the farm into it a piece at a time.

**The feel.** A real working farm, kept by one family for a long time and left in one morning: orchard in
rows, hurdled paddocks, a yard with everything in its place and a bad smell from the barn.

| | Ground | What you walk in on | The job |
| --- | --- | --- | --- |
| In | The lane's end, by the milk stand | A dog on the orchard wall, watching you, then gone | |
| Zone 1 | **The home orchard.** Apple trees in rows, windfalls, the hives knocked over | A pack shaking down apples into a sack | Kill them |
| Gate | The door in the yard wall | | |
| Scape | **The paddocks.** Hurdle lanes, a dewpond, a field shelter | The dog again, ahead, on the way you want. In the shelter, down a side lane: a man who went lame on the road, left roped to a post (one of the nine). Never cut: a turned or broken ankle | |
| Zone 2 | **The yard.** The farmhouse with its door standing open, the cart shed (archers on its roof), the well, the midden | The hungry carrying the house's goods across to the barn | Clear the yard. One interior: the farmhouse kitchen, the table still laid **[NEW]** |
| Gate | The barn's great doors, two leaves (one hero hauls them slowly, two quickly) | | |
| Zone 3 | **The barn** (a screen: a big interior). Threshing floor, hay mow, the rafters hung | MAWL, gorged and slow at first, at its larder | Kill it |
| Out | The yard gate | The dog follows the party home | |

- **Only here:** the dog. A scruffy collie sort (the farm dog Maeve owns to a hand in), no name on screen,
  an ordinary dog with no secret. It can't be hurt and never fights; it lives because it's quick and keeps to
  the walls, never because the hungry fear or spare dogs. It goes ahead only where a farm dog would go: the
  orchard wall, the hurdle lanes, its own yard. Afterwards it's with Tollan in town for good **[NEW]**, and
  for that hero it isn't on this ground again.
- **What it costs:** the barn is full of hay and oil. Fight MAWL in a fire and the barn is gone: it stands
  or it doesn't, and the recap says only that **[Kyle's call: a result that stays on your hero]**. Nobody
  goes back out to live there, and Tollan never blames a hero for a burned barn (the board's own model
  posting says "Burn it"). If Tollan is to say anything at all he is new cast and needs a register in
  voice.md first.
- **Solo and party:** MAWL is a named butcher on the boss kit, and this is the easiest of those fights. On
  screen MAWL and GUTCHAIN are "it" (jobs.ts); the quest postings say "him" today (a note for the Town
  quests chat).
- **Needs:** the dog, the two-leaf door gate, the barn interior as a boss ground.

### 3. Sallow Carr: nobody kept the ditches (level 4; burn 3 dens; medium; opens Hangman's Wood)

**What happened.** A willow wood gone to bog when nobody kept the ditches (bible). The hungry like it for
that: black water all round, one way in, and osiers to build with. Three dens, each on its own dry ground.

**The feel.** Wet, close, grey-green and quiet. Pollard willows standing in water, duckboards, mist in
banks, and the old sluices still in their frames. It must not read as Fenmere, which has reed beds and
open fen: the carr is a wood, roofed over, and you fight its water.

| | Ground | What you walk in on | The job |
| --- | --- | --- | --- |
| In | The drove's end, where the ditch bank begins | | |
| Zone 1 | **The osier beds.** Rows of cut stools, withy bundles stacked, the first den on the bank | A pack weaving hurdles for a pen | Burn the den with their own oil (teaches the burn) |
| Gate | **The first sluice.** Wind it shut (a hold) and the cut beyond drains to a hard bottom you can walk | | |
| Scape | **The drowned drove.** A causeway half under, logs laid across the deep by the hungry | Smoke over the water from the second den; sickles from Lowfurrow hung on a willow | |
| Zone 2 | **The holm.** An island: the second den, the cookpot, a cage | A skimmer pouring oil on the water; a woman caged by the den (one of the nine) | Free her first or lose her; burn the den |
| Gate | **The second sluice** | | |
| Scape | **The willow holt.** A duckboard twisting through thick pollards, dark at noon | Webs (spiders have spread into Greyhollow); a web pocket with a chest | |
| Zone 3 | **The sluice house.** A stone hut on the main bank, the biggest den built against it, the oil hoard | An elite pack; kegs stacked to the eaves | Burn it |
| Out | The main bank, at a run | The hoard goes up and lit oil spreads over the water behind you | |

- **Only here:** the sluices. Each one you shut changes the ground ahead: water that was deep is a floor.
  One way only: a sluice drains a floor for the party. It never floods, strands or drowns the hungry, because
  deep water is never a weakness the town gets to use.
- **What it costs:** a captive left by a burning den is lost (bible). The quick way to three dens is fire
  first.
- **Leaving:** three smokes over the carr behind you.
- **Needs:** water that changes level at a gate (new), the winch hold, oil alight on water (the skimmer has
  it at the staithe).
- **Lore keeper (allowed as written):** the sluice house is nobody's: no name, no church things, no lantern
  niche. The dens are built against it, not in it. The atlas's Sallow Priory is a proposal, not canon, and
  nothing here leans on it or rules it out.

### 4. Fennick Ford: the near bank (level 5; bring out 4; medium; opens the Barrowfields and Fenmere)

**What happened.** The old mill town. The town proper is over the river and stays shut: it's chapter 4's
ground. This territory is the near bank: the cloth fields, the fulling mill and the ford itself, which the
hungry use to walk people over.

**The feel.** A town's working edge: wet stone, a mill race, rot and industry. The wheel is turning, and
nobody should be turning it. Over the water, all the way along: fires, and a long wall with pale marks on
it that you can't get to (the rumour in the game now). The wall is far off: nobody is seen at it, marking it
or receiving the line, and nobody is seen living or trading over there.

| | Ground | What you walk in on | The job |
| --- | --- | --- | --- |
| In | The mill lane | | |
| Zone 1 | **The tenter field.** Rows of cloth-drying frames, rotted cloth still on the hooks | A pack going through a few bundles and boots; nothing on the tenterhooks but the old rotted cloth | The first cage |
| Gate | The footbridge over the leat | | |
| Scape | **The leat path.** Along the race to the mill | The wheel heard, then seen; the far bank and its wall across the river | |
| Zone 2 | **The fulling mill** (a screen: two rooms). The stocks, great hammers driven by the wheel, falling in turn on old cloth or on nothing | Two cages under the stocks' frame, a pack at work | Jam the sluice to stop the hammers, or fight between them (striped lanes: walk out) |
| Gate | The mill's river door, out onto the weir | | |
| Scape | **The weir.** Along its top, shallow underfoot, deep either side | The ford ahead; a roped line standing on the gravel bar | |
| Zone 3 | **The ford.** A gravel bar in the middle of the river | A line being walked over; a chalker chalking a stroke over each roped head as it steps into the water, in fives, then over one of you; the fourth cage, the ones kept back | Kill the guards, break the cage, cut the line free and walk them back |
| Out | The upstream path on the near bank | Horns in the town. Nothing comes over, and nothing says why | |

- **Only here:** the far bank. You look at chapter 4 for ten minutes and can't touch it.
- **What it costs:** the line is in the river when the fight starts. Anyone not cut free by its end has been
  walked over, and that's the last you see of them.
- **Three of the nine** are in these cages; the fourth cage and the line are strangers.
- **Needs:** the hammers (a timed striped hazard), captives who follow across water.
- **Lore keeper (allowed with changes, folded in):**
  - No board, slate, post or marked stone on the near bank: no written count stands in Fenmere before
    chapter 4. The chalker does only what a chalker does, strokes over a head. Nobody on screen says "tally"
    or "tallyman".
  - The tenter field is a pack's worth of bundles and boots, cloth and leather only, never sorted by worth
    and never a field of heaps. At any bigger scale it reads as photographs from our own history, and that
    would be Kyle's choice to make with eyes open. One small shoe at most. Nothing on a frame that could be
    taken for skin.
  - "Nothing comes over" is never explained: they've just walked a line across, so it reads as their choice,
    not as water stopping them.
  - With the wall on the far bank, the arcs doc's Read the Wall jobs can't run before chapter 4 (Kyle).

### 5. The Copperdeep Shafts: the ones who could dig (level 7; kill GUTCHAIN; long; opens the Deep)

**What happened.** The hungry took the ones who could dig (bible), and the miners are gone: nobody here says
where, and no miner is in this territory. What's at the face now is whoever the hungry had left: field
hands, the ones who can't dig, put to it anyway.

**The feel.** The corridor one, and it stays a corridor: narrow timbered galleries, lamps, water in the
gutter, and picks heard ahead that stop when you make a noise. It's a territory because it's one descent
laid by hand in four **screens** (levels joined by ladders), each with its own trouble, where today it's
five random rooms. It must not read as the Open Cut (a village and a pit in the open) or the Deep's
Haulage (old stone-pit gear, not a mine): this is copper, underground, in the dark.

| | Ground | What you walk in on | The job |
| --- | --- | --- | --- |
| Screen 1 | **The day level.** The adit mouth, ore tubs on a plank road, candle niches | A guard pack at a fire in the mouth, daylight behind you | Kill them. Take a lamp: one hero carries it (hands full for a heavy blow), the rest see by it |
| Gate | An air door, and the ladderway down | | |
| Screen 2 | **The stope.** A long drift (the scape), then a worked-out chamber on rock pillars | Four on a gang chain at the face, making a poor job of it, driven by a pack; brood spiders in the old workings (a pocket) | Free them: the last four of the nine |
| Gate | The ladderway | | |
| Screen 3 | **The drowned level.** Waist water you wade, deep in the low drift, the pump stopped | A rag-and-chain pump with nobody at it; the hungry's own planks over the deep, pulled up behind them | Work the pump (a hold) to drain the way on while the level's goblins come |
| Gate | The kibble: everyone in the bucket, then down | | |
| Screen 4 | **The bottom.** A raw new cut, narrower than a miner would make it, not following the ore; then the end chamber | GUTCHAIN, with the gang chain | Kill it |
| Out | The ladders, with whoever you freed | In the chamber's floor: a hole in rough rock with the miners' own timber nailed over it | |

- **Only here:** the lamp, and the dark.
- **What it costs:** the four are freed on the way down and have to live till you come back up. The count
  of the nine ends here.
- **Solo and party:** alone, you carry your own lamp and fight one-handed or put it down.
- **Needs:** the dark and a carried lamp (new), screens joined by ladders, the pump hold, GUTCHAIN on the
  boss kit.
- **Lore keeper (allowed with changes, folded in):**
  - The boarded hole is the rumour already in the game (the shafts go down past where anyone dug) and no
    more. It is kept unlike the Deep and the Sealed Door: rough rock and the miners' own planks; no worked
    stone, ladder, rope, iron, chain, draught, sound or light, and nothing to say the hungry came up out of
    it. Copper is ore only, never tied to the shard or to magic.
  - The raw cut never points at Wickhold and never reads as chapter 2's tunnels.
  - This job opens the Deep, and its last picture is a hole going down. So the Deep's opening is told in
    town, never on this recap or beside the hole: joining the two is Kyle's call alone. (The bible still
    says the Deep opens at level 9; the game says 7. The bible is stale.)
  - No "sump", "adit mouth" or "winding gear" in its words: those are the Haulage's. The table's "adit
    mouth" is a working word for the way in.

## More territories (sketches; one at a time after the five)

| Territory | Place and story | Only here |
| --- | --- | --- |
| **Barrowby** (chapter 1's story mission, a party's) | The lych road, the green, the churchyard, the nave where the Gnawer sleeps under the bell with Barrowby penned round the font, then the tower. The whole territory is the walk to one rope | The bell: you ring it yourself, and from the tower you watch the hungry go quiet and wrong, then leave together, one way, faster than they should. Nobody sees who calls them. Never dying, burning or fleeing a spell. Played once: never on the daily board |
| **Brokenbridge** (Copperdeep) | The ore road down a gorge to the broken span. Over by the hungry's laid logs and the old ferry chain. Who broke the bridge stays open | The ferry: the whole party on a raft hauled over by its chain, which is a gate that moves. Only heroes ride it; the hungry never board, swim or haul. The ferry is older than the bridge, so it dates nothing |
| **Ketterby and the Sheepwash** (Barrowfields) | Up the river by the washing pens to a hamlet burned in the war's first year and never rebuilt: thirty years of birch through the floors, ash under the moss | A place nobody has fought over since. The hungry pass because it's the one shallow stretch (bible); why they'd stop is Kyle's to say. Nothing buried there without his yes |
| **Hesketh Hall** (Fenmere, hard) | The causeway, the avenue, the terraces, the cellars under a razed house on the fen's one dry rise. The statues are just statues | The cellars: a larder range under a house that isn't there. No Hesketh named, no portrait, vault or heirloom |
| **The Charcoal Camps** (Greyhollow, last) | The clamps are warm, and it's the hungry burning them: Hew was the last charcoal burner in Greyhollow. Not his hut, his kiln or the column's field; no second Stoker; where the sacks go is unsaid. Built last, after Kyle answers the bible's open "does anyone ever burn Hew?", and after a check of series-research.md for the books' own burners | Smoke you can't see through, and kilns you mustn't break open |

Not on the list: the Sewers (a corridor place: stays rooms), the Peat Cuts (inside Fenmere already),
Hangman's Wood, Fenmere, the Barrowfields and the Open Cut (built). The atlas's Coldscar, the Bell at Four
Lane Ends, the Corpse Road and the Old Park would be territories in this format when their turn comes.

## Build order

Each slice is played before the next starts.

1. **The frame.** `Job.land`; a territory room on the expedition kit's ground with the Open Cut's stretches,
   gates and checkpoints (they run only for instances today: `sim/run.ts`, `sim/goal.ts`); the scape rules;
   tuning for one hero and up. Proved on Lowfurrow in plain blocks, no art.
2. **Lowfurrow Fields**, whole: ground, the three zones, the rye, the field gate and plank bridge, the
   barn seen. The first job posts onto it (one line in `heroquests.ts`, the Town quests chat's).
3. **Tollan's Farm:** the dog, the barn doors, MAWL's barn.
4. **Sallow Carr:** the sluices and the water, oil on the water, the run out.
5. **Fennick Ford:** the mill and its hammers, the ford, the far bank drawn.
6. **The Copperdeep Shafts:** screens by ladder, the lamp and the dark, the pump, GUTCHAIN.
7. **The line:** the nine counted across the five on the hero's record, the recap's words, Odric's line.
   One writing pass.
8. **The daily board on the same ground:** the board's jobs at these five places use their territories.
9. **More territories**, Barrowby first.

## Who it touches

New files are mine (`shared/territory.ts`, one file or two per territory after `hangwood.ts`, their draw and
scene files, tests). Small edits asked on the board first: `shared/jobs.ts` (one field), `sim/run.ts` and
`sim/goal.ts` (the two `job.instance` tests that step stretches and checkpoints), the Town quests chat's
`heroquests.ts` (each posting's territory, one at a time, last), the Instances chat's `gatedraw.ts` (a gate's
look). Nothing of the Instances chat's sim changes: a territory is data for it.

## Calls for Kyle

1. **The Lowfurrow line:** yes, no, or lighter (traces only, no count)? A yes puts the gleaners, the count
   (fourteen, five, nine) and the order of the five places into the bible.
2. **Tuned for one**, harder with each hero, for quest territories?
3. **A result that stays:** Tollan's barn burned or saved, kept on your hero and said in town?
4. **Fennick Ford is the near bank only** until chapter 4?
5. **The first job's length:** six to eight minutes for a brand new hero, up from about five?
6. **The daily board on the same ground** once a place has its territory (slice 8)?
7. **The tenter field's scale** at Fennick Ford: a few bundles and boots (as written), or nothing at all?
8. **Read the Wall** (arcs doc) waits for chapter 4 if the wall is on the far bank. All right?
