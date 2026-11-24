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

## Falling, and way stations (Kyle, 2026-11-24)

"When you're out on the map you only get 1 self revive (unlimited friend pick ups) but there's some way stations
around that you can teleport back to base and/or to them, like a safe zone with maybe a merchant or someone who
sells healing potions or a relic recharge."

- **One self revive a trip out.** Down once and you get yourself up; down again and only a friend can lift you.
  Friends may lift you as often as they reach you. It comes back when you rest at a way station or in town.
- **Way stations.** A few on each map of the land, a walk apart: a fire, a palisade, somebody keeping it. Inside
  is safe ground: nothing follows you in. Found by walking to it; once found it is yours to travel to.
- **Travel.** From a way station: back to Wickhold, or to any other you have found. From Wickhold's gate: out to
  any you have found. So a long walk is walked once.
- **Who is there.** One keeper a station, not a town: healing potions at most, a plain relic's recharge at some
  (the church's rule and price, shared/church.ts), a bounty to hand in at a few. Each station has its own person.
- **Drawn as the biome's.** A station is one of its set's echoes grown up (biome-sets.md): a charcoal burner's
  hut in the wood, an eel catcher's staithe in the fen, a field barn.

## Order

1. The Gate Fields, walkable from the gate and back, enemies by stretch, the set and the seam drawn; one way
   station, with the self revive and the travel.
2. Bounties and the first materials.
3. A second map stitched to its far end: the wood.
4. Quests out there. Then a map at a time.

## Who

A new chat, "The land" (a big new topic: CLAUDE.md section 4). It builds on Territories' kit and asks that chat
first; materials go through Economy and Gear, quests through Town quests; the Graphics sweep draws it (looks, sets,
seams, views).

## Open, for Kyle

- What happens when the self revive is spent and you fall with nobody to lift you. Proposed: you wake at the last
  way station you rested at (the gate if none), with what you carried, and what you had gathered since that rest is
  left where you fell to walk back for.
- Whether other players are seen out there as they are in town, or it is your party only. Proposed: your party
  only at first, as on a job.
- Whether fallen enemies are back when you next walk out, or stay down for the day.
