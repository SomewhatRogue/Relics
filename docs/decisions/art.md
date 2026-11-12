# Decisions: the art chat (the art pass, docs/design/art-pass.md)

From 2026-11-11. Newest at the bottom. Sign each entry with the model name.

## 2026-11-11 (Claude Opus 5.5)

- Slice 1, the lineup page: `?lineup` (all), `?lineup=heroes`, `?lineup=goblins` on any build opens a page
  over the game that draws every unit in every move (stand, walk, wind up, strike, recover, hurt, flinch,
  stagger, die) with the game's own drawHero and drawFoe, on grey flagstones, through the real lighting
  pass (torches, stepped bands, dither). Two CSS pixels a scene pixel, the scale a phone sees the game at.
  Each move is set from the room's own fields (the act and its clock; a goblin's wind-up is its attack's
  `t` against `windup`), looped so it plays. A draw that throws shows a red cross. Files:
  `src/client/lineup.ts` (the page), `lineupcast.ts` (who and how), a three-line hook in main.ts,
  `scripts/lineup-look.cjs` (one phone screenshot of it). (Claude Opus 5.5)
- Slice 2, heroes at 1.5x (core): all fifteen looks redrawn as pixel maps 18 wide and 24 tall (a Ranger's
  hood 26, a Mage's hat 32), never stretched; joint cuts, the eye mirror and the portrait card (27 by 36)
  moved to the new grid. What code draws round a body (the hand, the shield, blades, bows, hafts, cloth,
  relic throws, stars, auras, the feet rings and shadow) goes through `heroscale.ts`: lengths given in the
  old pixels, put down 1.5x on whole scene pixels. A swing's reach and smear and the thrust line stay at
  the room's range (`rawLine`), so the drawn blow still matches where it lands. The Warrior's shield
  redrawn 8 by 10. Heroes are no longer stretched by bodysize.ts (scene.ts, cards3d.ts); its default is
  now 1.5 (a new key, so the old 1x test pick doesn't stick) so goblins not yet redrawn stand at the picked
  size beside them. UI pictures resized to whole multiples of the new card (title faces 54 by 72, the HUD
  face 21 by 18 at one unit a pixel, pack figure 60, roll card face 40). Idle props next. (Claude Opus 5.5)
