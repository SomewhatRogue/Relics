# Outside the gate: the land you walk into

Kyle, 2026-11-24: "One long map might work for SOME of them. Maybe we have a different type between missions and
then we slowly begin working out a long map and maps that you can access by just going out of the gate, and we start
adding in some missions around killing things and acquiring materials and doing quests out there."

With docs/design/biome-sets.md (the look of it: a landmark a biome, echoes, drawn seams, views off the map's edge)
and docs/design/territories.md (the kit it stands on, and the people out on the land with jobs of their own).

## Three kinds of ground

1. **Town.** Wickhold, as now.
2. **Missions off the board.** As now, and of several types on purpose: a short job of rooms, a boss's arena, an
   instance, a territory, and for some of them one long map with no gates. A mission's type is part of what makes
   it that mission; none is being replaced.
3. **The land.** You walk out of the North Gate and you are in it. No board, no posting, no shut gate between its
   parts. It is grown a map at a time and the maps are stitched: you walk off the end of one into the next.

## The land's first map: the Gate Fields

- **In:** through the North Gate (shared/town.ts, the spot `gate`). **Out:** walk back in at the gate.
- **The ground:** about 56 by 96. The road north from the gate through the town's common fields and the first
  hedged strips, rougher pasture, then the seam into the wood's edge at the far end with the great oak in sight
  over the trees. A view off the east side, out over the river plain.
- **On the kit there is:** a territory's room (sim/landroom.ts): zones that wake as you come near and doze behind
  you, real heights, the road as the spine. Nothing new in the fight.
- **By stretch:** each stretch has its own enemy kinds, and one holds something that comes out at you (a pack from
  a den in the hedge) where a gate would have stood.

## What you do out there

- **Kill things.** Packs that keep to their stretch; a named one now and then. Bounties posted at the gate: bring
  back proof, be paid.
- **Gather.** Materials from the land itself (herbs, timber, stone) and off what you kill (hide, bone). What they
  are for is the Economy and Gear chats' to say; out here they are things to find, with places they are found.
- **Quests.** People on the land with a job of their own (territories.md, "Mini quests"), and errands from town
  that send you out (docs/design/town-quests.md).

## Order

1. The Gate Fields, walkable from the gate and back, enemies by stretch, the set and the seam drawn.
2. Bounties and the first materials.
3. A second map stitched to its far end: the wood.
4. Quests out there. Then a map at a time.

## Who

A new chat, "The land" (a big new topic: CLAUDE.md section 4). It builds on Territories' kit and asks that chat
first; materials go through Economy and Gear, quests through Town quests; the Graphics sweep draws it (looks, sets,
seams, views).

## Open, for Kyle

- What falling out there costs (wake at the gate with what you carried, or without it).
- Whether other players are seen out there as they are in town, or it is your party only. Proposed: your party
  only at first, as on a job.
- Whether fallen enemies are back when you next walk out, or stay down for the day.
