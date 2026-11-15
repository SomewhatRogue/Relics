# Dark and gold: decisions

The Dark and gold chat's log (docs/design/dark-gold.md, Kyle's pictures in docs/design/ref/).

## 2026-11-15: slice 1, buildings and the world (both views)

- One grade rather than a hand edit in every painter (client/darkgold.ts): violet, blue and plain greys go to the
  reference dungeon's green-grey (hue about 90, saturation at most 0.15, the lightest eased down); timber and thatch
  darker and duller; red roof tiles to slate, red cloth and paint to rust; painted greens dulled toward moss. Gold
  and brass, creams, lit windows and flames are left alone, so the accent still reads. The ground grade touches stone
  only (earth, mud, grass, blood as they were).
- Where it's applied, once and cached: the map's painted canvas (world.ts `paintMap`, both views' floor and back
  wall), each block's canvas (blocks.ts `paint`; the roof rows graded as a roof), the 2.5D buildings' vertex colours
  after each build (three/darkgold3d.ts from buildings3d.ts), the piece box lists (pieces.ts `blockBoxes` and
  `roundBoxes` now graded wrappers, so the Lantern's dais and the plinth match in both views), the flat view's round
  sprites (rocks, pillars, wells: `gradeSprite` in drawRound), the 2.5D rocks and stones (nature3d.ts through a
  grading wrapper on its boxes).
- Detail (lived-in-world.md's slice 3 taken in): moss in the floor's stone joints (its own seed, so the floor paints
  as before), moss on roofs and in a wall's lowest joints, rubble heaped at corners and along the foot (never in a
  doorway), and at the church, the halls and the tower two square columns and a broken step at the door
  (client/darkdress.ts flat, three/darkdress3d.ts in 2.5D). In 2.5D moss is laid face by face on roof courses turned
  up and on the low stones of a wall. All cosmetic, seeded by the block, never collided.
- Small edits in others' files, colour only: Art's statuedraw.ts (the statue's stone bands graded; the plinth drawn
  from the graded `roundBoxes`), blocklook.ts (the stall's stripes bone `#9a8c6a`, not cream; blocks.ts paints them
  from the table). Nothing in the side-view or gear chats' files.
- Looked at: town at night and noon, the Open Cut, an expedition, the Deep's floor 3 (its stone comes along through
  the floor grade). `node scripts/dark-look.cjs <url> <out> <day> x,y | me | deep:N` shoots both views with the
  hour held.
- Open for Kyle: whether the green is right (one number, darkgold.ts `rgb(90 ...)`), the market's stripes.
  (Claude Opus 5.5)
