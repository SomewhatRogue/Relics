# The Fen: the land's second map

Kyle, 2026-11-25: "one long map ... maps that you can access by just going out of the gate", Path of Exile 2 as
the model ("alive and vast with big backgrounds", "no gates between things, just longer pathways with other enemy
types"); of the biome sets, "I do like the drowned chapel". With docs/design/outside-the-gate.md (the land, its
shelters, travel and bounties) and docs/design/biome-sets.md (one landmark a map, echoes everywhere else).

## What it is

THE FEN: the near edge of Fenmere, north of THE NORTH FIELDS, where the fields go to bog. A roaming land of its own
(`fenroam` in shared/territory.ts, `roam: true`), 90 by 150 (grown half again each way on 2026-11-25, with five nooks: shared/fenroamnooks.ts), always by day, no gates: the pace is distance, deep
water and which foes hold each stretch. Not Fenmere the expedition (shared/fen.ts), which stays as it is; this map
copies its ways of laying ground (a fine grid painted in layers, merged to boxes) and its foes.

## Getting there and back

- **On:** walk out of the north fields' far (north) end. Standing in its way out, the leader (or a lone hero) is
  asked ON INTO THE FEN? GO ON moves the whole party: the run takes the fen's job, the loading page shows, and you
  stand at the fen's south way in. STAY keeps you where you are.
- **Back:** walk back to the fen's south way in: BACK TO THE NORTH FIELDS? GO BACK lands the party at the north
  fields' north end (a named arrival, `NORTH END`, shared/landlinks.ts), not at the gate.
- **Home:** the staithe's keeper has HOME TO WICKHOLD, as every keeper does; the leave button still goes in.
- **From town:** once found by resting there, the North Gate offers OUT TO THE EEL STAITHE (alone, as OUT TO does).

## Its parts, south to north

1. **THE BOG EDGE** (y 82 to 100): the last of the wood going to bog (pines, stumps and dead trees by the way in, thinning north into rushes and shallow pools, its ground the wood's `mossy` look to y 90, then `reedmoor`), dead willows, a
   drowned sheep with three at it. Nothing hostile within ten tiles of the way in.
2. **THE CAUSEWAYS** (y 52 to 82): deep water crossed by one raised causeway with a dog-leg; a shield line across it
   with an archer behind; a skimmer on its islet pouring oil on the causeway's edge; a ford where a gaffer and a
   brute wait on the far side; a long boardwalk west to an island with a chest and a netter's band.
3. **THE EEL STAITHE** (the shelter, at 44, 56.5): an eel landing on a dry island at the causeway's north end, its
   catchers long gone. A jetty over deep water, a smokehouse, drying racks, a punt drawn up, a fire, its keeper.
4. **THE WIDE REEDS** (y 34 to 52): wide shallows thick with reeds, deep channels across them with boards over, two
   bands lying hidden in the reeds (lungers, netters, a pouncer), a dry hummock with a few on it.
5. **THE DROWNED CHAPEL** (y 16 to 34): the landmark. A belfry and a broken gable standing up out of the water, the
   nave flooded, an old churchyard wall's line as the causeway past it; grave slabs and crosses awash in the shallows,
   pews in the mud. A hexer's band on the causeway, a spiders' nest on the dry rise east of it.
6. **THE PEAT CUTS** (y 2 to 16): old diggings gone to water, deep cuts with baulks between and boards across each,
   the drying ground in the middle and the hungry's larder on it: a brute, two gaffers on the baulks, a drummer and
   their band (the lair). The far edge is deep water: nothing beyond yet.

## Foes

Fenmere's, harder than the north fields (aimed at heroes of level 5 to 8; the room still scales by the party's
level): shields, archers, skimmers, gaffers, brutes, lurkers in the reeds, a hexer, a drummer, spiders. Eleven
packs, 451 to 461, about 45 bodies. None within nine tiles of the staithe; none below y 88.

## Gathers

- BLACK PEAT at the Peat Cuts: one spot laid only once the larder's pack is dead, one at another cut at a low
  chance (0.15).
- COLD CLAY at the bog edge's pool and the staithe's bank; WATER MINT at the reed beds' edges.

## Bounties

Posted at the North Gate beside the north fields' two, from level 6: one a day out of three for the fen.
THE LARDER (the Peat Cuts' band), THE LURKERS (both bands in the reeds), THE CAUSEWAY (the shield line, the skimmer
and the ford). Paid more than the fields' (90 to 130 copper, 150 to 220 experience). The north fields' five are
unchanged, and the two-in-hand rule holds across both.

## The look

The fen's country (`reedmoor`, `drowned`), the marsh light by day. The chapel is one block (`chapel`) drawn the tile
way as a card (client/tilechapel.ts): dark, wet, mossy grey stone in four shades (the lightest thing about it, never pale), light from the upper left, a dark outline, the
water line across its foot. Its echoes are small cards (`awash`, client/tileawash.ts): a grave slab, a cross, a pew,
scattered by the seed in the reeds, the churchyard and the bog edge.

## Mist

Eight banks laid by the seed (`layFenBanks`, shared/fenmist.ts, carried as `map.mist`): three round the chapel, three over the wide reeds, two thin ones over the causeways. Drawn by Fenmere's drawer and ruled the same way (a goblin notices you from less far, an archer reaches less far, read from the map and the room's clock in sim/enemies.ts).

## Not in this

A third land; the deeper wood; quests out here; named
beasts; a view drawn off the map's edges.
