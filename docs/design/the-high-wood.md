# The High Wood: the land's third map

Kyle, 2026-11-25: "lets get started on the third land and then go back and refine the earlier lands." The third
map past the North Gate, offered as "the deeper wood: struck oak, thunderstone, the great oak at its grandest".
Built the way the fen was (docs/design/the-fen.md), on the same kit: a roaming land, no gates, shelters, bounties,
nooks, raids and the map. Names from the lore keeper (2026-11-25): its own wood, none of the bible's; never "Deep" (Cobb's pit), never
Hangman's Wood's (no gibbet, ribbons, Hempen or Hew's blazes).

## What it is

THE HIGH WOOD: old forest on the high ground beyond the fen. You climb out of the Peat Cuts onto
roots and rock, and the trees close over. A roaming land of its own (`highwood` in shared/territory.ts,
`roam: true`), 96 by 160, always by day but dark under the canopy, with height everywhere: banks, rock steps,
fallen trunks to walk along. Aimed at heroes of level 8 to 11 (the room still scales by the party's level).

## Getting there and back

- **On:** walk out of the fen's far (north) end: a boardwalk over the last cut to a stair of roots. ON INTO THE
  HIGH WOOD? GO ON takes the party to the wood's south way in (shared/landlinks.ts: `fenroam` gets an onward).
- **Back:** the wood's way in: BACK TO THE FEN?, arriving at the fen's far end (a named way, `FAR END`).
- **Home and from town:** Woodward Hild has HOME TO WICKHOLD; once found, the North Gate offers OUT TO THE
  WOODWARD'S LODGE.

## Its parts, south to north

1. **THE ROOT STAIR** (y 140 to 160): the bog gives up at a scarp of roots and rock. Alders and birch going to oak,
   pools between the roots. Nothing hostile within ten tiles of the way in.
2. **THE SUNK LANES** (y 110 to 140): old lanes worn deep between high banks, roofed by roots. The banks are real
   heights: the Rogue climbs them, the rest go round. Snarers' lines across the lanes, archers in a blind on a bank
   top, wolves with their keeper in a side lane.
3. **THE WOODWARD'S LODGE** (the shelter, about y 104): a split-oak palisade, a fire, a lodge. Woodward Hild has
   held it alone since before the siege and still marks the struck oaks for felling, though nobody comes for timber.
4. **THE STRUCK OAKS** (y 70 to 104): a ridge where the oaks are lightning-split and burnt black, a clearing of
   fallen trunks. THUNDERSTONE lies where the strikes have fused the ground. Ironhides with their rods (sim/rods.ts)
   hold it; torch bearers. Some trips a storm sits over the wood (shared/sky.ts), and its strikes fall here.
5. **THE OLD TREES** (y 36 to 70): the oldest trees, so close the light comes in shafts, a stream in a ravine with a
   fallen trunk as its bridge, a spiders' nest in the roots, a band lying hidden in the bracken.
6. **THE COIN OAK** (y 2 to 36): the landmark. The biggest oak there is, on a rise, its trunk wide as a house, hollow.
   Valley folk hammered coins edgewise into its bark before the war; the hungry have prised out all they can reach,
   and the high ones are still there. Their own ropes hang cut and empty from the low boughs. Their den is in the
   roots under it: a heavy, a drummer, a butcher's band. Nothing comes of the coins; the oak holds no shard. The far edge is rock and thick wood: nothing beyond yet.

## Foes

Harder than the fen's: snarers, wolves and keepers, archers in blinds, ironhides, torch bearers, lungers and shields,
pouncers in the bracken, spiders, a hexer, heavies at the oak. About fourteen packs (packs 471 up), about 55 bodies.
Nooks with mini bosses as on the other two (five nooks, two mini bosses, better loot, found off the road).

## Gathers

- **THUNDERSTONE** (storm, grade 3) in the Struck Oaks: a few spots, one laid only once the ironhides' pack is dead.
- More HIDE, SILK and FATWOOD than the fields give, for the forge's higher pluses.

## Bounties

At the North Gate from level 9, one a day out of three for the wood, paid above the fen's: THE IRONHIDES,
THE COIN OAK, THE SNARERS (SNARED and CUT FREE as Hangman's Wood will have them).

## The look

The wood's set (client/sets.ts) grown dark: oak, moss, bracken, rock; the canopy's shade with shafts of light. New
cards the tile way: the Coin Oak (a card of its own, wider than the north fields' great oak, coins glinting high in
the bark), split and burnt oaks, a sunk lane's bank face, the lodge. Echoes: struck stumps, cut ropes.
The storm is only weather; thunderstone is ground the strikes fused glassy, never magic.

## Slices

Built 2026-11-25: slices 1 to 3. Packs 471 to 484 (56 bodies), nooks 485 to 487 (mini bosses 486 and 487 over
guarded chests), thunderstone after pack 476, bounties `ironhides`, `coinoak`, `lanesnarers` (titled THE SUNK LANES,
not THE SNARERS, which is the north fields'). Woodward Hild's words in client/highwoodwords.ts. The trunk bridge is a
box piece, not a card (a deck cannot be a standing card). Slice 4 built 2026-11-26: about one day in three stormy (`stormyWood`), strikes kept to the ridge (`GameMap.strikeIn`).

1. **The land.** The map (ground, roads, heights, blocks, trails for raids), the territory entry, the links on from
   the fen and back, the shelter and its keeper, the map's zone names. No foes yet. Done when you can walk from the
   fen to the Coin Oak and back, and rest at the shelter.
2. **Foes, nooks, gathers, bounties.** The packs, five nooks with two mini bosses, thunderstone and the rest, three
   bounties. Tests as the fen's.
3. **The art.** The Coin Oak card, the struck oaks, the bank faces, the shelter, the echoes. Checked on the phone.
4. **Weather.** The storm over the wood some trips, its strikes over the Struck Oaks.

## Not in this

Quests out here; a fourth land; anything past the oak.
