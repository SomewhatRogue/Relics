# Foe patterns: more interesting goblin attacks

Kyle, 2026-11-27: "I'd like enemies to have more interesting attack patterns ... beyond the special enemies to keep
things interesting and a bit harder." He picked everything offered except the guard-breaker ("people who block can't
really dodge"). Written by Claude Opus 5.5 (General chat).

## What changes

1. **The slam** (done): no hop. A dip, up tall with the cleaver overhead, leaning back and shaking, then a step in and
   the smash, low (client/foepose.ts). The rules and telegraph are as they were.
2. **Combos**: some blows come in strings, each with its own telegraph, the last a beat late so an early dodge or a
   dropped guard is caught. A scrapper: stab, stab, lunge. A heavy: swing, swing. A butcher: cleave, then the slam.
   Strings grow more likely with level.
3. **The held swing**: a big goblin's cleave fills its red, then holds full for a random moment (the room's Rng)
   before it lands. The telegraph shows the hold: full and shaking.
4. **Flanking**: in a pack, the goblin nearest a hero's front keeps them busy; others walk round to the hero's sides
   and back before striking, so a held block (front only) has to turn.
5. **Thrown junk**: a scrapper that can't reach you throws a stone: a short red line, a small hit. It closes the gap
   on a hero who hangs back.
6. **The whirl**: a heavy or a butcher spins: a ring round it, three hits if you stay in, then dizzy a moment to punish.
7. **The drag**: a brute drags its cleaver toward you along a long thin red line; one sidestep clears it, and it cuts
   across its own and your friends too.
8. **Volleys**: archers loose together on a shout: every archer near the first shoots at the same hero on the same
   clock, a lane of lines.
9. **Fire pots**: a scrapper now and then lobs a pot that lands, sits with a lit fuse, then bursts in a ring.

All of it in the room (src/sim/), seeded, telegraphed the same as today, and multiplayer by default.

## Slices

1. Slam look; combos and the held swing (sim/foechain.ts; telegraph hold in both views).
2. Flanking (sim/flank.ts).
3. Thrown stones, the drag, the whirl, volleys, fire pots (sim/foethrow.ts, sim/whirl.ts, sim/volley.ts).

Numbers in shared/foepatterns.ts. Tests per slice; the full suite before each push.
