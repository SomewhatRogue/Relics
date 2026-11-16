# New look: interiors, decisions

The chat re-imagining Wickhold's insides at the new scale (new-look.md, "Interiors to match": "the insides are way
too small now... the barracks and church etc. let's re-imagine and design"). The church, the barracks, the town hall,
the Drowned Rat, the forge and the infirmary.

## 2026-11-15: claimed

- Row moved from Waiting to Active. Order: concepts in Kyle's ElevenLabs flow "Relic: HD-2D look tests", a short spec
  (docs/design/new-look-interiors.md) for Kyle's yes, then build behind `?street`, screenshots, land each.

Claude Opus 5.5

## 2026-11-15: concepts and the spec

- Shot today's six under `?look=3d&hd&street` (`scripts/inside-look.cjs`, new): shoeboxes, the heroes as tall as the
  back wall, the room a third of the screen.
- Concepts in the flow "Relic: HD-2D look tests": one node a building (same model and settings as the concept squares,
  the knight for scale, the near wall cut away), four takes each. Picks in `docs/design/ref/inside-*.jpg`.
- Spec: docs/design/new-look-interiors.md. Rooms about twice as wide and deep, walls three hero heights, the back wall
  the showpiece, pillars or posts and a gallery, beams, moonlit windows, a low front wall. Behind `?street`; new files
  `shared/bighalls.ts`, `three/insidekit.ts`, `three/insidefurn3d.ts`; small asks of others listed there. Waiting on
  Kyle's yes.

Claude Opus 5.5

## 2026-11-15: slice 1 in, the rooms at the new size (Kyle: "yes to all of these")

- Kyle's calls: the picks stand, look-only folk in the Rat, the church and the hall, the counting house, tower and
  lodge after these six, and a slice 4: the same for buildings on jobs and in the dungeons (spec updated).
- `shared/bighalls.ts` (new): the six at 22 to 26 by 14 to 20 tiles (were 12 to 18 by 8 or 9), `wallH` 5 to 7.
  Same people, words, looks and trades; look-only folk (`mute`, no talk). The pastimes' corners move whole (`SHIFT`):
  the arm table to the Rat's door, the knife board to the back wall's east end, the anvil before the forge's hearth.
  `interiors.ts` asks it under `LAYOUT.on`; the old rooms are untouched.
- Small edits, for the record: arena.ts (`GameMap.wallH`, optional), game.ts (`enterPastime` asks `bigSeat` inside
  a room with `wallH`), and the Buildings and camera chat's view3d.ts (an inside takes the town's zoom; hangs the tall
  walls) and camera3d.ts (inside: 36 degrees down, never looking out past the room's front or sides, your hero never
  off the foot). Theirs to change if they'd rather.
- `three/insidekit.ts` (new): the back wall run up from the painted face to `wallH`, and full-height side walls, in
  the kit's `mat-stone` (or `mat-timber` for plaster rooms).
- tests/insides.test.ts: old rooms without the switch; bigger, tall, the same people; everyone and the way out reached
  from the door; the pastimes' seats free and where their tables went. Full suite 1963 passed.
- Seen: the floor is the street's cobble swatch in every room under `?street` (the town hall's planks too). Slice 2.

Claude Opus 5.5

## 2026-11-15: slice 2 in, the structure

- `three/insidekit.ts`: plates along the walls' tops, rafter ends, a tie beam near the back (never across the room,
  where it would hide the floor), posts down timbered walls, the low front wall across the cutaway with the door's gap
  (the forge's open mouth wider), and the floor's marks laid back over the kit's floor (rugs, rushes, sawdust, soot,
  the sand ring), since the street look's floor hides the painted one.
- `three/insideparts.ts` (new): leaded or stained windows that glow, moonlight falling from them (soft additive
  planes), the marks' paintings, a gallery with its balustrade, beams, arch ribs.
- `three/insidedress.ts` (new), each room by name: the church's arcade of pointed arches on its pillars, high
  stained lancets and a candle ring over the altar, its three low steps and tomb slabs; the barracks' gallery over the
  bunks, tower banners, a rope round the sand ring; the town hall's back gallery, four tree banners, the clock, the
  chimney breast, two candle rings over the table; the Rat's gallery along the back and the hearth's chimney breast,
  candle rings; the forge's hood narrowing into its chimney, glowing underneath; the infirmary's curtains between the
  beds and herbs hung from a beam by the hearth.
- `three/insidefurn3d.ts` (new) and three BlockKinds (arena.ts): the church's `font`, armour `stand`s by the
  quartermaster, tavern `table`s (the Rat's benches are tables now, a fifth added). Small edits, for the record: Art's
  blocklook.ts (their LOOK entries), walls3d.ts (one call), and the Buildings and camera chat's streetkit.ts
  (`streetFloor` takes another of the kit's floors) and ground.ts (an inside lays planks or flags, not cobbles).
- The camera inside: your hero low on the screen and the room rising to the back wall's top behind them, as the
  concepts frame it (camera3d.ts `inRoom`).
- `scripts/inside-look.cjs`: UP=1 stands you halfway up each room to see its back wall. Full suite 1963 passed.
- Next: slice 3, the showpieces (the rose window, the valley map, the rat sign and bottle wall, the forge's mouth)
  generated in the flow and cut into the kit.

Claude Opus 5.5

## 2026-11-15: slice 3 in, the showpieces (cut from the concepts)

- The planned generated sheet couldn't be made: Kyle's ElevenLabs workspace is out of credits (93 left, a sheet is
  190). So the showpieces are cut straight from the concept takes instead, which already show them front-on:
  `scripts/insideprep.py` (new) crops, masks, scales to 32 px a tile and snaps to a palette like kitprep.py, into
  `kit/inside-rose.png`, `inside-map.png`, `inside-ratsign.png` (and their sizes into kit.json; kitprep.py rebuilds
  kit.json from every picture in the folder, so they stay).
- Hung (insidedress.ts `piece`): the rose window over the church's altar, glowing, the moon through it (the two
  placeholder lancets gone); the painted valley map between the town hall's two boards; the carved rat on the front
  of the Rat's gallery over the bar. A little of their own light so they read by candlelight.
- Left for when there are credits (or not at all): a trophy of arms for the barracks, the forge's mouth.
- Checks: tsc and tests/insides.test.ts (drawing and pictures only, no rules touched).

Claude Opus 5.5

## 2026-11-15: slice 4 in, houses on a job (Kyle: "Continue")

- Spec addition (new-look-interiors.md, "Slice 4"). `shared/housegrow.ts` (new): under `?street` a house's layout
  grows before anyone is put in it, 1.6 times (a cottage or barn) or 1.35 (the longhouse, hall house, tithe barn, so
  none outgrows the church). Inner walls stretch (doorways wider), furniture keeps its size and its wall, everything
  else spreads with the room: where goblins stand and sleep, the cage's corner, the body, the lantern, tables,
  barrels. `wallH` 4.5, or 5.5 for the big ones. One small edit in shared/inside.ts (nobody's on the board).
- Drawn by insidekit.ts with a plain dressing (insidedress.ts `plainDress`): small leaded windows down both side
  walls with the moon through them, plus the walls, beams, posts and the low front wall every inside gets. Houses on a
  job keep the job's zoom for the fight; only Wickhold's halls take the town's (`townInside`, view3d.ts).
- Tests (tests/insides.test.ts): 240 houses and barns of every kind, grown: everyone, every goblin, cage, chest and
  body reached from the door, the floor one space, the fire in its hearth. The houses, grim, doors and buildings tests
  unchanged without the switch. `scripts/house-look.cjs` shoots four kinds of house on a village job.
- **For the Instances and Deep chats:** any room in an instance or the Deep gets the same tall walls, beams, front wall
  and windows by setting `wallH` on its GameMap; an entry in client/three/insidedress.ts (by the map's name) gives it
  its own pieces. The Open Cut's reckoning house, winding house and lamp room are yours to opt in.

Claude Opus 5.5
