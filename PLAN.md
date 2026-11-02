# PLAN

## Current slice

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
- [x] Slice 3c: ledges and ramps (two levels), archers, falls, the high-ground shot, forks with a high
      road and a low road, exits that take the whole party
- [x] Slice 2h: props (barrels, oil barrel, crates, a table, broken pieces) that break and push; the
      Warrior lifts, slams and throws them

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
