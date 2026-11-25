# Materials: what the land gives, and what the forge and the corner ask for

Kyle, 2026-11-24: "I do like being able to upgrade gear. So lower levels, all that takes is steel, but higher
levels, it takes steel plus hide or plus more rare ingredients further up. ... So this route is going to be going
into the wilderness to get things beyond even just quests, to be able to upgrade things. I also want to be able to
get some materials that's necessary for adding elements onto your weapons." Built by the land's work (this chat),
with small edits in Economy's forgeplus.ts and the Gear chat's files, noted on the board.

## The rules

- **Materials come from the land**, not from jobs in town or the Deep: the reason to walk out of the gate. A short
  list, each with places it is found (outside-the-gate.md "Gather"); more come with each new map.
- **They drop as things on the ground** where a beast or a nest dies, decided by the room's seeded dice (never
  `Math.random`), and picked up by walking over them, as coin is. Whoever picks one up, **everyone in the party
  gets one** (the coin is one pot; so is this).
- **They are kept in a satchel**, counts on the save (`Profile.mats`), not squares in the pack: they never crowd
  out gear. The pack shows the counts.
- **Halvard's pluses ask for them from +3** (Kyle): +1 and +2 steel and coin as now; +3 adds hide; +4 hide and
  silk; +5 those and one rare thing. The coin and steel stay as they are (shared/forgeplus.ts).
- **The corner's elements ask for one each** (element-augments.md, not yet built): fire takes charcoal, frost and
  storm take materials from lands still to come. A hero's first of each stays free, and takes nothing.

## The first list (the north fields)

| Material | From | Chance | Used for |
| --- | --- | --- | --- |
| HIDE | wolves, pouncers | 40% a beast | +3, +4, +5 |
| SILK | spiders | 35% a spider | +4, +5 |
| BROOD SILK | the spiders' nest (left in the ash if it burns) | always one | +5 |
| CHARCOAL | sold by the Charcoal Hut's keeper | (bought) | fire on a weapon |

Names checked by the lore keeper (2026-11-24): the nest's is BROOD SILK, the tight silk a brood mother wraps her eggs
in (a "heart" made the nest sound like a living core). What Halvard does with them: hide and silk go into wraps,
straps, linings and bindings; they never temper or harden steel, and nothing on screen says they do. Rare things for later lands: the fen's (frost), the wood's (storm), a named
beast's.

## The forge's asks (per plus reached)

| Plus | Steel (as now) | Materials |
| --- | --- | --- |
| +1 | 2 | none |
| +2 | 5 | none |
| +3 | 10 | 3 hide |
| +4 | 20 | 6 hide, 4 silk |
| +5 | 35 | 8 hide, 6 silk, 1 brood silk |

## Slices

1. **Materials exist** (shared/materials.ts, the drop in sim/pickups.ts, a tile-way picture for each on the ground,
   the satchel counts on the save and in the pack).
2. **The forge asks for them** (shared/forgeplus.ts `plusCost` gains `mats`; client/forgeview.ts shows them; paid
   with the coin and steel).
3. **Charcoal on the Charcoal Hut's shelf**, ready for the corner.
4. **The corner** (element-augments.md), materials in from the start: waits on Kyle's yes for the person.

## Built (2026-11-24)

- Slice 1: shared/materials.ts, client/matwords.ts; sim/matdrops.ts (`dropMats`, one roll of the room's loot dice a
  beast, only on a roaming land; called beside `dropPickups` in sim/room.ts); the `mat` pickup and event
  (sim/pickups.ts, types.ts); `Profile.mats` (progress.ts, save.ts); everyone in the room gets one (client/game.ts,
  both branches); "+1 HIDE" floats (fxmagic.ts); tile-way pictures (client/tilemats.ts, three/matcards.ts, drawn in
  relicsdraw.ts and three/actors3d.ts); the counts in the pack's footer.
- Slice 2: `PLUS_MATS` in shared/forgeplus.ts, asked by `plusCost`, checked and taken in Game.levelUp and bags.ts
  `upgraded`, shown in the strike button and the price line, with "You find hide and silk in the fields past the
  North Gate." under it.
- Not yet: charcoal's own picture and its place on the Charcoal Hut's shelf (slice 3); the corner (slice 4).

## Grades, and what is gathered (2026-11-25)

Kyle: "You should also be able to get better quality materials for higher burn etc from the wild. I like having to
find the materials more than buying them." Each element of an edge has three grades, by the dressing Merren works in
(the lore keeper's; shared/edges.ts `EDGE_MATS`); the grade multiplies the element's main number (fire: the burn's
damage and length, 1, 1.5, 2; storm: the shock, the same; frost: the hold, 1, 1.3, 1.6, softer since a frozen foe
can't act). The card says FIRE, STRONG FIRE, FIERCE FIRE.

| Element | 1 | 2 | 3 |
| --- | --- | --- | --- |
| Fire | CHARCOAL (bought at the Charcoal Hut, or lumps by its clamp) | FATWOOD (old pine stumps, the Wood's Edge) | SALTPETRE (inside the Rough Pasture's den, once its pack is dead) |
| Frost | COLD CLAY (the stepped pond's bank) | WATER MINT (the east river's edge) | BLACK PEAT (the fen, to come) |
| Storm | STRUCK PINE (splinters at a lightning-struck pine, the Wood's Edge) | AMBER (the east river's gravel) | THUNDERSTONE (the deeper wood, to come) |

Only charcoal is sold. The rest lie at their spots, rolled by the room each trip (`map.gathers`, `layGathers` in
sim/matdrops.ts, its own seeded dice), and the den's saltpetre is laid when the last of pack 406 dies (`layAfter`,
called beside `dropMats` in sim/room.ts). Never the Blacktongue's copper; never hemlock or nightshade (the Rogue's
unnamed poison). For the bible: saltpetre forms on the den's walls, and no line explains why.

