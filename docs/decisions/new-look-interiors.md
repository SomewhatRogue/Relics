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
