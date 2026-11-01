# PLAN

## Current slice

**Slice 3c: heights and paths** (Claude Opus 5.5, 2026-11-01). Ledges, ramps and rooftops in run
rooms (goblin archers up high, height for the ranged, drops and falls), and forks in a run where the
party picks the high road or the low road, together or split. *Done when* a job has a fork, and a
room where a threat on a ledge has to be dealt with from the ledge or from range.

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
- [x] Slice 2h: props (barrels, oil barrel, crates, a table, broken pieces) that break and push; the
      Warrior lifts, slams and throws them

## Next (in order)

1. Kyle plays slice 3. Tune: job length, goblin counts, gold and experience, the town's layout.
2. Slice 4: four players by link or code (town and runs), the leader's browser hosts every room someone
   is in, drop-in mid-fight, rejoin by hero name, a RunSave every 2 s and takeover from it. Copy Come
   Bye's client relay, resume and online tests; follow `docs/ONLINE.md` and the Redis budget.
3. Slice 5: the shared world on the server (api/world.ts: town state, chapter, votes with a real
   quorum), down and revive, more objectives (escort, hold the ward), the Want and the church.
4. Slice 6: classes for real (abilities, subclasses: Knight or Barbarian, Sharpshooter or Rogue).
   Slice 7: chapter 2, written from the group's choices. Slice 8: Blender art pilot.
