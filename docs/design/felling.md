# Felling: trees knocked down, and what a swing mows

Kyle, 2026-11-19: "I wonder if we could do things like sword cuts cut down grain or high fields and trees can be
knocked down by bigger units like warrior and cleric." Then, on the proposal: "heavy is the right trigger. Falling
tree should hurt everything. Felled trunks SHOULD burn! nice."

## What is in

**Mowing** (`sim/buildings.ts` `sweepBlocks`). Any melee swing cuts down the standing rye and reeds in its arc for
good. They were only ever soft cover, so nothing else changes: you see what was in them.

**Felling** (`sim/felling.ts`; numbers in `tuning.ts` `FELL`).
1. **Who and how:** a Warrior's or a Cleric's charged heavy swing that reaches the tree. A quick cut does nothing
   to it; no other class fells.
2. **Which trees:** a tree, a dead tree or an apple tree no bigger than `FELL.r` (0.72). Big old trees and pines
   stand.
3. **Which way:** away from the blow, along the nearer of east, south, west and north. The world is square-on and
   so is a trunk on the ground.
4. **The fall:** 0.65 seconds. For that time the floor where it will lie is marked red and the tree is drawn going
   over from its stump. Nothing bumps into it yet.
5. **The landing:** everything under it is hurt and thrown out sideways: goblins 40, heroes 22, the one who felled
   it included. A roll gets you out from under it, as from any blow.
6. **After:** the trunk lies there as a wooden block: it stops bodies and shots, it can be chopped up, and it
   burns. Its stump stays where the tree stood.

How it is held: the trunk is a `log` block from the blow on (`lands`: when it comes down; `stump`: which round
was the tree; its `look` packs which end the crown is, what tree it was and how big). Blocks are sent to
friends, so a friend sees the same trunk. A friend's map still has the tree, built from the seed; its screen
makes that round a stump when the trunk arrives (`client/felled.ts`). The 2.5D view keeps the map's trees in a
mesh of their own and rebuilds only that when one goes over (`three/ground.ts`).

## Not built yet

- **A trunk as a bridge.** Dropped across deep water it should be walked on, not bumped into. Today it lies on
  the water as cover. It wants to become a `gangway` deck where it spans deep water (and the `gangway` wants a
  log's look, which it does not have).
- **Brutes and the log-carriers felling trees** in a charge.
- **Sound** for the crack and the landing (the landing borrows a building's collapse).
- **Goblins knowing about it:** they do not avoid the mark or use a trunk as cover on purpose.
- Mowing: the small reed clumps (rounds) are not cut, and shots and spells cut nothing.
