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
