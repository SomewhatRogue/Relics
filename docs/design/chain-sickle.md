# The chain sickle (the Rogue's second kit, in the rapier's place)

Kyle, 2026-11-23: "Rapier I do NOT like. It's not good at single target or AOE... A grappling hook or a weapon
on a long chain that has decent mid-range and can fling around and also can snag onto walls and pull you
towards them or small enemies towards you when fully charged, but you need to get it going to do damage on it,
and it inflicts bleed on perfects." Then: "on spin it should cut and bleed but not do a TON of damage, just
more range / AoE, and you're a bit slower." Written by Claude Opus 5.5 with Kyle.

## How it plays

- **Tap:** quick sickle cuts up close, two or three goblins a swing, a wide third cut. Fair head on (0.85x),
  1.75x from behind (the poisoner's rules), not one goblin a blow like the daggers.
- **Hold:** the chain whirls round you. Every 0.3 s it cuts everything within 2.8 tiles for a little
  (3, up to 6 as the spin builds) and makes it bleed 2 s. You walk at 0.55 while it spins. Hugging a wall
  (within 1.2 tiles), the chain catches on it and the spin cuts nothing.
- **Let go:** the sickle flies on its chain where you face, 6 tiles (8 on the white flash).
  - Not fully spun: it cuts the first goblin it reaches (10 to 24) and comes back.
  - Fully spun, it snags:
    - a wall, a pillar or a heavy prop: it pulls you there (the first wall grapple in the game);
    - a big goblin: it pulls you round **behind** it, ready to backstab (the spear pulls you to its front);
    - a small goblin: it yanks it to your feet, knocked down.
  - On the white flash, the goblin it snags bleeds (3 s).

## Tuned down (2026-11-23)

Kyle: "way too good, it can do as much with quick hits close, needs to spin a bit slower and do less damage in
general; it's better in a one v one than daggers from behind." Now: taps 6, 6, 9 and a touch slower, 0.75x head on
and 1.75x behind (the floor every Rogue kit keeps; about a third of the daggers' from behind, a little under theirs head on); the spin cuts every 0.5 s
for 2 to 4, bleeds only once fully going, and takes 1.5 s to get going; the throw 8 to 18. tests/sickle.test.ts
holds it under the daggers.

Then (Kyle, same day): "dagger straight on was pretty weak, it can be equivalent to that... the bleed being closer to
10 per rotate feels about right; I want classes to be able to kill things about the same if you do the more AoE
effect, but the trade-off is a lot worse at single target." So: taps 7, 7, 10 at 1x head on (the daggers' head on);
a full spin cuts for 7 plus the bleed's 3, about 10 a turn to everything in reach. On four goblins that's about the
daggers' from behind on one; on one goblin, a quarter.

## Later the same night (Kyle, playing)

- Not up to speed, the spin's first cut that lands stops it ("TOO SLOW"): spin up at a distance and walk in.
- The whirl turns round the chain hand; the sickle's point leads, in the spin and on the cut.
- The spin never shoves or staggers. The throw goes out only fully spun; let go short, "TOO SLOW" and nothing.
- The time to full is the weapon's draw, so anything that draws faster (QUICK DRAW, gear) spins it up faster.

## In the code

- The weapon id stays `rapier` (saves, loot tables, gear looks and stores all carry it); only its name and
  kit change (shared/kits.ts). Its numbers: shared/sickle.ts.
- The throw rides the grappling hook (sim/hook.ts) as the spear's chain does (sim/spearchain.ts), with a
  `sickle` mark for the snag rules. The spin is sim/sickle.ts, stepped by the room each tick.
- Drawn: the chain and sickle in flight as the hook's line; the spin as a ring on the glow layer
  (client/sicklespin.ts). The sickle in the hand is the Art chat's (client/heldkits.ts): asked on the board.
</content>
</invoke>
