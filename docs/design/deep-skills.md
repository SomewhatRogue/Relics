# Deep skills: a class skill you can only earn far down in the Deep

Spec, 2026-11-13 (Kyle and Claude Opus 5.5), from the town quests chat. **Not built.** A big new system:
build it in its own chat, from this.

## What Kyle wants

"Some class specific abilities, higher level, locked behind a certain level of the Deep, which gets really
hard." New skills, not today's moved: "would have to be real good."

## Where they sit

- Each class has three skills from its trainer (levels 3, 5, 7: `SKILL_CHOICES`, `SKILL_STEPS`), and a
  hero **carries one at a time**. A Deep skill is a **fourth to choose from**, not a fourth button. So it
  doesn't stack on top: it has to be worth carrying instead of the others, for some fights.
- **Opened by the deepest floor a hero has ever reached** (a new `deepBest` on the hero; a floor reached
  in a party counts, as joined runs do for quests). Until then it isn't on the trainer's list at all (as
  skills above your level aren't, 2026-11-12). Reaching the floor puts A NEW SKILL on your trainer (the
  errands' level-up word, `shared/errands.ts`, keyed to the floor as well as the level).
- Still learned and paid for at the trainer, like the others.

## What "real good" means here (the bar for each)

1. **A new verb for the class**, not a bigger number on one it has: something the other fifteen skills
   can't do. Each class's three today: Warrior charge, taunt, stamp; Ranger net, volley, hound; Rogue
   vanish, knife fan, smoke; Mage round up, fire ring, storm tether; Healer sanctuary, censer chain,
   leathers.
2. **It changes a party's fight**, not only its owner's: the Deep is mostly played together.
3. **Of the Deep**: it should feel like something learned down there (the dark, the tunnels, what lives
   below), so earning it means something.
4. **Readable on a phone**: one tap, an obvious shape on the floor, a clear sound.
5. **Built one first and played**, before the rest (below).

## Candidates, two a class (Kyle picks one each, or neither)

| Class | A | B |
| --- | --- | --- |
| Warrior | **BARRICADE**: plant your shield as a wall across a tunnel for a few seconds; goblins can't pass, friends behind it are safe from what's thrown. Holding a corridor in the Deep is the Warrior's job made solid. | **HOLD**: for a few seconds nothing knocks you down or moves you; every blow you take is stored and goes out round you as a blast when it ends. |
| Ranger | **FLARE**: a burning arrow lights a wide patch of floor for a while; every goblin in the light is marked (takes more from everyone) and nothing hides in it. Light as a weapon where it's dark. | **PIN**: a heavy bolt that carries a goblin back; if it hits a wall it's pinned there, out of the fight, for a long few seconds. |
| Rogue | **RUN THROUGH**: dash through a line of goblins, cutting each one you pass; any you came at from behind take a killing cut (a small one dies, a big one loses a big piece). | **SWAP**: trade places with a goblin (or a friend) in reach: out of a corner, a friend out of trouble, a goblin into the fire. |
| Mage | **THE DOOR**: open two linked doors on the floor for a few seconds; anyone who steps in one comes out the other (goblins too). Ways out, ways round, a friend saved from across the room. | **STILL**: everything in a circle stops for two seconds, goblins and what they threw. |
| Healer | **CALL BACK**: bring a friend who's down straight back up from across the room, on their feet with some health. A long wait between. | **VIGIL**: for a few seconds, half of what hits any friend near you hits you instead. |

My leaning, for the five: BARRICADE, FLARE, RUN THROUGH, THE DOOR, CALL BACK (each is a verb nothing in
the game has yet, and each is about the party).

## Kyle's calls

1. **The five** (from the table, or ideas of his own).
2. **How deep.** Bosses every 5 floors, blessings every 10 (shared/deep.ts, deepmarks.ts). Proposed:
   **floor 20** for all five (the fourth boss down; "really hard"), or 15. Ask the Deep chat what floor
   20 is like now before settling.
3. **One first:** which class's to build and play before the rest. Proposed: the Mage's DOOR or the
   Healer's CALL BACK (the furthest from anything that's there now, so the first to show whether the
   idea holds).

## Build order (once it's a yes)

1. `deepBest` on the hero (from the Deep's runs; old heroes from their saved run's floor), and the
   trainer's fourth skill row behind it, hidden till then; A NEW SKILL on reaching it.
2. **One skill**, the room deciding it (`src/sim/`), drawn in both views, with its sound; tuning in
   `tuning.ts`. Kyle plays it. Done when he says it's good, not when it works.
3. The other four, one at a time, each played.
4. Words: the five names and lines through one lore-keeper and one line-editor pass; the trainer's word.

## Who it touches

The Deep chat (floors, how hard they get, `deepBest` from its runs), the trainer's list and the errands
(the town quests chat), the sim for the skills (a new chat's own files), Art for how they look.
