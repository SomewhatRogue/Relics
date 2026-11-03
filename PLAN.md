# PLAN

## Current slice

**One big map, measured first** (Claude Opus 5.5, 2026-11-03; Kyle: raids on "one big, coherent, mostly
open map", 8 to 12 rooms' worth, without lag on a phone host or the relay). Measured; the numbers and
the recommendation are in docs/DECISIONS.md. Test only: `?hero=WARRIOR&bigmap=1` (`n=`, `sleep=0`,
`auto=1`, `bots=0`, `overview=1`), `npx tsx scripts/bigmap/measure.ts`, `node scripts/bigmap/browser.cjs`.
Landed for real: dozing goblins (off unless a room asks), near-only pushes and collision on big maps,
and the relay no longer crashes on a message over 64 KiB. *Next, before a big map ships:* each friend
sent only what's near them with quiet clocks, the map sent as its seed, a compact save, and both views
skipping what's off screen.

**Nests you can reach and burn out** (Claude Opus 5.5, 2026-11-03; Kyle: spiders "respawn too quickly
so it's hard to kill their nest", too much HP for a Rogue, "if you run up to it you can light it on
fire and it burns out"). Built; waiting on Kyle's play. *Done when* a nest's waves come every 12 s solo
(9 to 11 in a party) with a 5 s breather after a wave dies; any class standing at a nest sees BURN on
the button (G BURN on a laptop), crouches 1.2 s inside a filling gold ring (a hit, swing, dodge or step
off puts it out), and the nest goes up for 3.5 s, its spiders catching and no wave coming, then lies as
ash and counts; a Rogue's daggers take 55 HP off a nest without the head-on halving; and it reads the
same in FLAT and 2.5D and for a guest online. Open: BURN through the lore keeper and line editor.

**The lamps keep the hour** (Claude Opus 5.5, 2026-11-03; Kyle: "turn off fires at night except for
the wild burning ones", read as: tended fires out by day, wild ones always). Built; waiting on Kyle's
play. *Done when* by day in Wickhold the braziers are ash, the torches and lamp posts out and the
windows dark, in FLAT and 2.5D; as dusk comes the lamps light one by one and carry the night in warm
pools, and go out the same way after dawn; burning houses, wagons, goblin fires and the Tulls' brazier
burn whatever the hour; a day job's torches are out and a night job's lit; and 2.5D at night feels like
FLAT's night, not brighter or bluer. `?day=0.5` or `__setDay(p)` to look at any hour.

**Host a job, wander town, set out when ready** (Claude Opus 5.5, 2026-11-02; Kyle: "host a job and
then wander around town, same with others, and start whenever we're ready, with a little UI notification
of who else signed up"). Built; waiting on Kyle's play. *Done when* Kyle gathers a party at the board and
the board closes; he walks into a hall or a shop and his party card is there with who's in and the slots;
a friend gets a toast that he's gathering and joins from it; Kyle gets a toast that they joined; he sets
out from the card while the friend is in the vault, and the friend gets SETTING OUT and arrives in the job
with him; a friend leaving or a cancel shows a toast; and a reload on either side keeps the party. Open:
the new words (`client/partywords.ts`) through the lore keeper and line editor.

**The 2.5D view everywhere, options under a gear** (Claude Opus 5.5, 2026-11-02; Kyle: wants the look
test's low-res 3D, "a button someone can get to from options", then "No 2.5D in the main hub area?",
"townsfolk, hanged bodies etc. That stuff is amazing", "higher quality, but let someone change the
quality themselves"). Step 2 built; waiting on Kyle's play. *Done when* Kyle picks VIEW: 2.5D and all of
Wickhold is in it by day and by night (the square, the stalls, each hall dressed as itself from the
street, the gallows, the gravedigger at his work, the guards on their rounds, the folk with gold marks,
other players with their names and chat bubbles over their heads, doors he walks into), every hall
inside, the training yard, the wood with Hew and the Stoker's cutscene camera, and every job (the hung
and the pot in the dens, a lunger he can read, the drummers' rings, swing trails, what's on a goblin,
the hook's line, a Mage's blink image, marks at the edge for the freed left behind, the relic held up,
mist); a Rogue's hand crossbow is in the hand instead of the daggers (in FLAT too), every kit its own;
QUALITY: LOW / MID / HIGH under VIEW changes it live and is remembered (HIGH to start, on every device);
flips back to FLAT and nothing else changed; and it feels smooth on his phone at HIGH (or he drops it).
Not yet in 2.5D: Blender art; furniture and props inside halls are plain boxes in their colours; the
tower's coloured smoke and the forge's smoke.
Then (Kyle and friends: "We like the 2.5D, but flat has cleaner, brighter colours. It's too dark in
2.5D", and in the wood on his phone: "It looked like Minecraft from super far back"): 2.5D lit to flat's
levels, closer in on phones, round trees and cone pines, the trainer skills' areas, BRIGHT - / + in the
gear box. *Done when* Kyle and his friends find 2.5D as bright and clean as FLAT at night and by day
(night still night, torchlight still pooling), and the wood on his phone reads like the job rooms.
Then (Kyle: "In 2.5D the mage looks blocky, so does the big orc ... I really like how the terrain and
land look in 2.5D but the enemies I'm not loving"; then on the first shot, "Yes. Love. Do it."): the
figures in 2.5D are FLAT's own pixel figures standing in the 3D world (HD-2D), the box figures kept
behind ?figs=3d. *Done when* every hero, goblin, the butcher and the Stoker, spiders, the freed, the
hound and Wickhold's folk in 2.5D look just as they do in FLAT, crisp, lit by the torches and the moon,
with a shadow, glowing eyes in the dark, names over friends' heads, a silhouette behind walls, and the
spearman's stab reads as a stab in both views.

**Three skills a class, training in sections** (Claude Opus 5.5, 2026-11-02; Kyle: "only one or two
available per class. Let's try to think of 3 per class", "training to be its own expandable /
collapsible area"). Built; waiting on Kyle's play. *Done when* each class's trainer shows three skills,
the first at level 3 for 150, the next at 5 for 250, the last at 7 for 400, each with a line on what it
does; Kyle buys one, carries it at once, and swaps back for nothing; each new skill does what its line
says in the yard and online; and SKILLS, TECHNIQUE, RANKS and KNACKS open and close with a tap, say
where he stands while closed, and stay as he left them next visit. Open: the new names and lines
through the lore keeper and line editor; the 3D view's agent may want to draw the new rings too.

**The pack, the vault, Tobin's stall, the forge** (Claude Opus 5.5, 2026-11-02; Kyle: "Castle of the
Winds or Diablo style", "a somewhat ruined bank", "a generic merchant"). Built; waiting on Kyle's play.
*Done when* Kyle opens PACK on a job and sees what's on each part of his hero, taps a piece and reads it
beside what he wears with the numbers, can't pick up loot with a full pack, buys a bigger pack from
Tobin on Market Row, sells him something and buys it back, stores a piece in the vault at the counting
house, upgrades and melts at Halvard's anvil, and finds Ivo's elements greyed out. Open: Edda, Tobin, the
counting house and every line in `client/storewords.ts` through the lore keeper and line editor.

**Knacks per class, free reset, a pick you can't miss** (Claude Opus 5.5, 2026-11-02; Kyle: "Knacks
should be different per class", "reset their knacks whenever, for free", "hard to know that I have a
choice"). Built; waiting on Kyle's play. *Done when* each class's KNACKS screen shows four chains of
its own (no shared BODY or BREATH), every step moves a number that class's kit uses in the fight, a
waiting pick shows as a gold count on PACK and on KNACKS, a line and a PICK A KNACK button at the job's
end and a line under the hero back in town, the two on offer sit at the top with TAKE, and RESET gives
every knack back free anywhere in town. Open: the new words (list in DECISIONS) through the lore keeper
and line editor; the badge follows `#packbtn` if the corner buttons move into the gear menu.

**Slower growth, the knacks tree, class-true offers** (Claude Opus 5.5, 2026-11-02; Kyle: "purple
loot too fast as well as leveling up too fast", "its own sort of area you can see grow", "the Rogue can
only dodge"). Built; waiting on Kyle's play. *Done when* a new hero is about level 5 after nine or ten
jobs, finds their first purple piece some jobs in rather than on the first, opens KNACKS from the pack
and sees four chains with where each goes, takes one of the two green steps at the trainer, and a
Rogue or Mage is never offered a parry or a block, nor a Warrior or Healer a dodge. Open: the new words
through the lore keeper and line editor; gold pace untouched (drill prices assumed the old levels).

**Going indoors on your own** (Claude Opus 5.5, 2026-11-02; Kyle: "when you go into a house it drags
EVERYONE into it"). Built; waiting on Kyle's play. *Done when* on a job with friends Kyle goes into a
cottage and nobody else is pulled in; a friend outside sees KYLE over that door; a friend goes into
another house on their own and Kyle sees their name there; small goblins still follow you in and big
ones don't; someone freed comes out with whoever brings them (maybe into an ambush); and the way on
waits until everyone has come out.

**Places with a plan** (Claude Opus 5.5, 2026-11-01; Kyle: "maps that feel more like actual areas").
Built; waiting on Kyle's play. *Done when* Kyle walks Barrowby's lane past cottages and their yards to
the green with the fields beyond the hedges, the Charcoal Camps' shacks along the muddy path, Fennick
Ford's stone street and walled garden, Hesketh Hall's grounds, and finds each place looks like itself
every time he goes back.
**The trainer: level locks, dearer ranks, a readable screen** (Claude Opus 5.5, 2026-11-01). Built;
waiting on Kyle's play. *Done when* Kyle opens his trainer on the phone and can tell at a glance his
level, how far to the next, his gold, what he can buy now, and what waits on which level; buys a rank
from a row's ladder; and a new hero can't buy anything until level 2 or learn the skill before 3.
Open: the new short lines through the lore keeper and line editor.

**What the goblins do; houses wrecked and burning** (Claude Opus 5.5, 2026-11-01; Kyle: "some houses
bigger, more fucked up things going on", "more destroyed, or on fire, or you can't get into them
safely"). Built; waiting on Kyle's play. *Done when* on a long or deep job Kyle walks into a longhouse,
a manor or a tithe barn; finds a house where the goblins have been at the dead (torn apart, one tied to
the wall and opened, one on a hook, the pot on their fire) next to a quiet one; sees a street with a
house half fallen in, one he can't get into, and one burning; goes into the burning one past the fire
and the falling beams, frees whoever's caged and gets out before the roof comes in.

**The back of the pack** (Claude Opus 5.5, 2026-11-01). Built; waiting on Kyle's play. *Done when* Kyle
meets a hexer (steps out of its striped circle, or cuts it down mid-spell) and a drummer (sees the pack
pick up near it, and kill it first) on a job, and a party of three finds the extra goblins a little
tougher. Open: a second spell for the hexer (a slow bolt), a horn-blower or other buffers, and their
own sprites in the Blender pass.

**Recovery codes** (Claude Opus 5.5, 2026-11-01). Built; waiting on Kyle's play. *Done when* a friend
opens RECOVERY CODE on the start screen, writes down their code, and brings their heroes to another
phone or computer with USE A CODE. Open: the panel's lines through the lore keeper and line editor.

**Every house its own** (Claude Opus 5.5, 2026-11-01; Kyle's note: "every house is mostly the same").
Built; waiting on Kyle's play. *Done when* the cottages and barns on a village or farm job look
different from the street (thatch or shingle, roof colour, lean-to, a roof stove in, a lit window and
chimney smoke) and inside (one room, a back room, a weaver's, a smithy, a store, a looted house, two
barns), with some empty, some with goblins asleep, some at a body, and the door always clear.

**The prologue wood** (built 2026-11-01; waiting on Kyle's play). *Done when* a new hero wakes on the
field, learns attack, dodge, block and parry from Hew, watches him die, kills the Stoker for the
javelin, and walks into Wickhold with the tally stick.

**Loot and gear** (built 2026-11-01, all six slices; waiting on Kyle's play). *Done when* Kyle finds gold
and potions on a job, opens a chest, compares and equips a better tier, upgrades at the anvil, and
meets a hungry piece. Open: whether the Want turns a hero (story bible).

**The pack and a shorter class pick** (Claude Opus 5.5, 2026-11-01). Built; waiting on Kyle's play.
*Done when* Kyle picks a class from the short list, takes a dropped weapon into his pack mid-fight and
equips it there, and carries a relic won on a deep job from the pack.

**Simpler classes, relics from deep jobs** (2026-11-01). Built; waiting on Kyle's play. *Done when*
each class plays with one skill and no relic, and a deep job won gives a relic on the RELIC button.

**Slices 3b and 3c** (Claude Opus 5.5, 2026-11-01). Built; waiting on Kyle's play.
*Done when* Kyle makes a hero on the start screen, goes into every building in Wickhold and talks to
whoever is there, burns out a goblin den, and takes a job's high road and its low road.

**Slice 3c: heights and forks.** Ledges and ramps in run rooms, goblin archers up high, height for
the ranged, drops and falls; forks where the party picks the high road or the low road together.

**Slice 3b: heroes, buildings, fire** (2026-11-01). Built; waiting on Kyle's play. *Done when* Kyle
makes a hero on the start screen, goes into every building in Wickhold and talks to whoever is there,
and burns out a goblin den on a job.


## Done

- [x] Slice 1, foundations: repo, Vite + TypeScript, Vercel config, Come Bye's relay and its tests
- [x] Slice 2: the Warrior (3-hit combo, hold to block, tap to parry, counter, dodge roll, stamina,
      guard break), a goblin butcher (telegraphed cleave you can parry, striped slam you must roll),
      a straw dummy, a swing dummy for parry practice; hit-stop, sparks, blood that stays, calls
      (PARRY, BLOCK, DODGE, COUNTER), screen shake, synthesized sounds; phone (upright) and laptop
      controls; the approved lit pixel look
- [x] Slice 2b (Kyle's first play): easier parry with a white cue and a real stun, three weapons with
      their own combos, hold to charge heavies, body collision and knockback by weight, goblin
      scrappers, wind-up animations, relic javelin (pins to walls) and grappling hook, craters and cracks
- [x] Slice 2c: corpses ride the javelin, backstabs and twin daggers, kit guard and dodge, relic wheel
- [x] Slice 2d (Claude Opus 5.5, 2026-10-31): all five classes as kits behind a demo CLASS button
      (longbow, focus staff with blink, mace and censer that heals), gale horn and blast flask relics,
      racks of three, fire / frost / storm augments that play off each other. World atlas doc started:
      https://claude.ai/artifact/Q4B7cCpBANzFfvn3P6kffc
- [x] Slice 2e: ranged and spell kits by draw time (longbow, shortbow, crossbow; wand, staff, rod),
      slower classes but the Rogue, relics by class (net, shadowstep, lodestone, blessing, war horn),
      the Healer's smite, a squire to heal
- [x] Slice 2f: loot that rewards execution (fine and forged weapons, seven skill traits, drops,
      the loot card), perfect release and overdraw on every draw
- [x] Slice 2g: grab, slam and throw small goblins (earned by stun, net, freeze, stagger or getting
      behind), body-to-body impacts, deaths by the blow (beheaded, burst, burned, shattered) with gore
- [x] Slice 3: Wickhold (walkable, spots, panels), the job board, seeded run rooms for five terrains,
      rescue / hunt / larder jobs, gold, experience, levels and perks, the smith and trader, the
      church, Rescue Row filling up, chapter 1's story mission and the council vote, saves
- [x] Slice 3b: the start screen (up to three heroes, class for life), every building enterable with
      people to talk to (smith and relic-wright, priest, trainer and squire, healer, reeve, families),
      a town hall, cottages and barns to enter on jobs, wooden buildings that burn down, goblin dens
      and the burn-out job; Come Bye's newer relay and the online rules (`docs/ONLINE.md`)
- [x] Slice 3e: CI (types, tests, build, a browser walk-through), the shared world server and the Roll
      of the Brave, council votes counted across heroes, town works, a bigger living Wickhold with
      patrols and locked places, a trainer per class with class perks, the Drowned Rat and its dice
- [x] Slice 3d: live music for every kind of place (30 pieces) with a fight layer and boss music,
      kit-specific weapon sounds, goblin voices, building sounds; the Healer's blessed ground and ward
      (2026-11-01: the music rewritten for recorded instruments, VSCO 2 CE, VCSL and a CC BY choir;
      see DECISIONS)
- [x] Slice 3c: ledges and ramps (two levels), archers, falls, the high-ground shot, forks with a high
      road and a low road, exits that take the whole party
- [x] Slice 2h: props (barrels, oil barrel, crates, a table, broken pieces) that break and push; the
      Warrior lifts, slams and throws them
- [x] Jobs at dawn, by day, at dusk or at night (lit to match; the board says which), and spiders in the
      wilder places: nests that hatch waves, poison, the brood mother's glob, fire as their weakness
      (2026-11-01, Opus 5.5; lore placement waiting on the lore keeper)

## Next (in order)

1. Kyle plays slice 3. Tune: job length, goblin counts, gold and experience, the town's layout.
1b. Kyle connects Redis (Upstash, free) to the Vercel project once it exists: the shared world and the
   Roll go live; until then the game plays offline.
2. Slice 4: four players by link or code (town and runs), the leader's browser hosts every room someone
   is in, drop-in mid-fight, rejoin by hero name, a RunSave every 2 s and takeover from it. Copy Come
   Bye's client relay, resume and online tests; follow `docs/ONLINE.md` and the Redis budget.
3. Slice 5: the shared world on the server (api/world.ts: town state, chapter, votes with a real
   quorum), down and revive, more objectives (escort, hold the ward), the Want and the church.
4. Slice 6: classes for real (abilities, subclasses: Knight or Barbarian, Sharpshooter or Rogue).
   Slice 7: chapter 2, written from the group's choices. Slice 8: Blender art pilot.

## 2026-11-01: writing that reads like talk (Claude Opus 5.5)
- Read the published Blacktongue excerpts for how the prose moves; notes in docs/lore/prose-notes.md.
- voice.md's sentence rules rewritten; a line-editor agent now follows the lore keeper on every line.
- The prologue rewritten through both passes. Hew's waking is four tap-to-go-on boxes; any card goes on
  with a tap anywhere (the phone stick couldn't reach under the card before).
- Next: run the town's lines (townui, squareui, rumours, jobs, copy.ts) through the same two passes.
- Idea (Kyle): a Rogue relic, "slide behind": the dodge goes round behind the goblin you face instead of straight.
- Story: docs/lore/arcs-and-missions.md (also the Claude Doc "Relic: Story Arcs and Missions"); Kyle to pick a road.

## Online co-op (slice 4): Kyle's shape, 2026-11-01
- You join Wickhold (the hub) only after your own prologue. Everyone logged in to the same world is there, seen
  walking about in real time.
- A group forms at the job board and goes out on a job together; when it succeeds, it's written to the board
  for everyone.
- World quests need at least three people, and they're HARD: people can and will go down. No permadeath.
- Failing a job has a consequence for the town (smaller missions too, scaled to the job).
- World quests end with their result told to the whole town (a crier, and the board), and when the
  outcome leaves a choice for the town, everyone is told there's a vote and where (the town hall or
  the board), with a deadline. Kyle wants one vote per person, not per character.

### Built and next
1. DONE 2026-11-01: the shared town. Everyone online sees everyone in Wickhold (`townfolk.ts`).
2. DONE 2026-11-01: parties at the board and the shared run. GATHER A PARTY on a job, others JOIN,
   the leader SETS OUT and everyone is pulled into the leader's job (coop.ts, parties.ts). Kyle's
   rules: goblins scale with the party (count, and bosses' health), friendly fire at half, down in
   a party you bleed 20 s for a teammate to pick you up (3 s standing over you) or you're out for
   the job; everyone out and it's lost; the last one left plays it out alone; three team kills of
   the same player make a grudge (counted, shown nowhere yet).
   Since: a friend's own hero walks at once (prediction), 20 updates a second, loot and the gold
   pot come home with everyone, a reload puts you straight back in, and the leader dropping hands
   the job to the friend first in line (the leader, back, follows them).
   2026-11-02: LEAVE, party falls, and `npm run test:stress` (leaving, joining, rejoining, dying and
   coming back, 15 scenarios in real browsers); a reloaded leader leads again from its own save, a
   thawed one follows whoever took over (docs/DECISIONS.md).
   Not yet: the party can't split into buildings (everyone goes in with the leader); a job handed
   on from inside a building restarts that building's room only; the leader's mid-fight effects
   (sounds, sparks) for a friend come with the patches, so a lost patch loses its sparks.
3. DONE 2026-11-01: results on the board (DONE LATELY: the job and who did it).
   DONE 2026-11-02: chat. WORLD and NEAR in town, the party on a job; bubbles over heads; a phone
   panel and quick lines; mute and a slur filter (docs/DECISIONS.md, `scripts/chat-online.cjs`).
4. World quests: open only with 3+ in town; hard.
5. Town votes. DONE 2026-11-01: one voice per device (all its heroes share it). Without sign-in a
   second browser is still a second voice. Real one-per-
   person needs a sign-in (Google, Apple or an email link). Start per device; add sign-in if it's
   ever gamed.

## Wickhold as a place to live (Kyle, 2026-11-01)
- DONE: a shared day and night in town (`shared/daylight.ts`): every screen the same hour, a full
  day every 40 minutes.
- DONE: Wickhold starts broken after the breach (blood, the dead on a cart, crows, wrecked lanes,
  scorched and boarded buildings, lamp posts down, a wall of hurdles and stakes) and mends with gold,
  for everyone (`shared/mend.ts`): Wash the Square, Clear the Lanes, Mend the Shutters and Roofs,
  Lanterns along the Lanes, Perrin's garden in three stages (dig, plant, benches and a lamp: a garden
  to sit in at dusk), the north wall in three (stakes, timber with a walk, stone). Townsfolk talk
  about what was mended lately and how the town stands (`shared/townsays.ts`).
- DONE: raids (`shared/raids.ts`): now and then the hungry come over the wall between visits and pull
  down the newest mending (never stone, never the first three works); Dunn tells you, the board
  remembers, it has to be paid for again.
- DONE: ground with some variety (flagstones, earth, ruts, worn paths, puddles, straw, weeds, a drain;
  `shared/ground.ts`) and a town alive under siege (`shared/siege.ts`): a gallows, the gravedigger
  carrying the dead to the churchyard, a burned-out family round a brazier, water drawn at the well, a
  recruit at the whetstone, hurdles at the gate, smoke past the wall, a dog.
- Next: barks as you walk past something newly mended; a raid you're in town for (a fight at the
  breach); other world events (a flood, a fire in the lane). The town remembers what it lost.
