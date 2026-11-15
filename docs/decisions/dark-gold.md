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

## 2026-11-15: slice 2, enemies

- One wrapper, not a recolour in every enemy file: strawman.ts `drawFoe` (the flat scene and the 2.5D cards both draw
  through it) hands the painters a lit layer that grades every fill, stroke and sprite it's given (client/darkfoe.ts,
  a Proxy like gobpen.ts's; a sprite's canvas graded once and kept). So goblins, their kits, butchers, beasts and the
  bosses change together, each keeping its shape, with nothing edited in Art's, the Deep's or the Instances' files.
  The yard's straw men and dummies are left as they are. The glow layer (eyes, telegraphs, hit flashes) is untouched.
- The 'foe' rules (darkgold.ts `foeHex`): goblin greens kept; whites and anything bright and strong (a telegraph's
  red, fire, a spell) kept; blood kept red, since wounds show how hurt a foe is (a first pass rusted it: the HURT and
  BAD rows lost their cuts); duller reds to rust; light hide and cloth to bone, dark leather and wood nearly black,
  greys and cloth to dirty iron; gold and brass on a goblin to dull bronze (gold is the heroes' mark).
- Looked at in `?lineup=goblins` (every foe, every move) and in the Open Cut in 2.5D.
- One line in Art's strawman.ts (the wrap), noted here.
  (Claude Opus 5.5)

## 2026-11-15: slice 3, heroes

- Kyle: "Go", taken as the yes for slices 3 and 4 (the side-view chat had finished its slices and is waiting on play).
- Colour by the looks' palettes in Art's herolooks.ts and herolooks2.ts, so the front, the back and the side-view
  chat's profiles (which read the same palettes) all change together without a line of herosides*.ts touched.
  Warriors: plate dark steel; the knight's and Blackiron's pauldron rims (`p`) gold, the gold edging; capes the colour
  of old blood; the sellsword dull, a brass buckle. Rangers: deep teal, dark umber, slate; leathers dark; the hilt and
  buckle gold, the strap old brass. Rogues: the face lost in the hood (skin and wrap to the hood's dark, hands gloved),
  two pale glints for eyes (the eye pixels themselves stay `#16121a`: the eye dial draws there, tests/herolooks.test.ts);
  a gold strap or buckle each. Mages: slate, rust-black and deep teal, gold bands and hems; the brim out to the full
  width and a feather from the band (HAT rows, `Q` and `q`: wine, black, pale). Healers: the mail dark steel, the
  tabard's edge (`w`) gold as the filigree, the red cap and tabard wine; the friar's habit darker, the cross gold.
- Weapons longer (held.ts, heldkits.ts `bladeLength`; drawing only, the room's reach unchanged): the sword 15 to 18,
  the greatsword 21 to 25, the spear's haft and head 20 to 25 hero units with the tip further out, the staff 18 to 23.
  The weapons' colours stay the gear-looks chat's (weaponpaint.ts tints whatever held.ts draws).
- Left for later, because they'd need new profile maps in the side-view chat's files: the Ranger's hat in place of the
  hood, slimmer bodies, the feather and wider brim from the side (the profile hat is as it was).
  (Claude Opus 5.5)

## 2026-11-15: slice 4, townsfolk

- The same wrapper as the enemies (darkfoe.ts, now taking a grade): Art's npcs.ts `drawNpc` draws through `darkFolk`,
  so every look, front and profile, both views, the vignettes and the rack's watch change together. Names are on the
  glow layer and quest marks are drawn elsewhere (errandmarks.ts), so neither is touched.
- The 'folk' rules (darkgold.ts `folkHex`): the two skin tones kept; gold and brass dulled (gold is the heroes' mark, so
  a hero still stands out in a crowd); blood kept; whites to bone; cloth, hair and leather darker and duller; red cloth
  to rust (the guard's tunic). `node scripts/folk-look.cjs` shows every look.
- One line in Art's npcs.ts (the wrap; the Town quests chat's gold-mark lines untouched).
  (Claude Opus 5.5)

## 2026-11-15: the new look (docs/design/new-look.md)

- Kyle, playing the dark-and-gold build on a laptop: grainy, and not his pictures; a redesign. With four more
  pictures (saved in docs/design/ref/: dense-town-day, hd2d-town-night, gothic-hall, lantern-bearer) and "a more full
  looking town... buildings you can go in defined by their guild signs". "ya lets do it."
- The grain: 16 px tiles scaled 4x to 6x on a laptop, and lone pixels everywhere (grass flecks, the scatter, the
  light's dither). Recolouring code-drawn art gets the mood, not the pictures' craft (clusters, twice the density).
- The spec: the steep camera kept (the fight needs the floor), 32 px tiles, HD-2D light in the 2.5D view, the town
  re-laid out full with guild signs, day like the dense town and night like the HD-2D square. Art from licensed
  packs; Mana Seed ruled out (its licence forbids use with anything AI-made, code included). The repo is public, so
  a pack's files can't go in it as it is: Kyle to choose private repo or a private art repo.
- Concept shots of Wickhold and the heroes generated in Kyle's ElevenLabs flow "Relic: HD-2D look tests".
  (Claude Opus 5.5)

## 2026-11-15: the new look, slice 0a (HD-2D light behind `?hd`)

- three/hdlook.ts: with `?hd` in the address the 2.5D view paints at about twice the resolution (`HD_AREA`, four
  times high quality's pixels), light is smooth (post.ts `toonize` keeps only the dither helper the cards need), and
  its own post pass: a three-ring bloom off everything glowing, fog that thickens smoothly, a tilt-shift blur toward
  the top and bottom (ordinary surfaces only, from ordinary neighbours: telegraphs and eyes stay crisp), a vignette,
  no outlines. Without `?hd` nothing changes.
- Looked at: the town at night on a laptop and a phone, Hangman's Wood by day on a laptop. The checker grain is gone
  and the light pools; what's left is the art (busy 16 px grass, the trees as low-poly lumps), slice 0b's job.
- Known: the overlay's pixel-font labels (FORGE, WORKS) come out half size under `?hd`; Fenmere's mist isn't drawn.
  Try: relic-lake.vercel.app/?look=3d&hd (or `&day=0.9` for night).
  (Claude Opus 5.5)

## 2026-11-15: the new look, slice 0b first pass (the kit-built town behind `?hd&street`)

- Kyle loved the concepts ("the WHOLE aesthetic is what I want. entirely"), asked about cost (about 190 ElevenLabs
  credits an image; the test street's kit was three sheets of four), and "Do it". Then: a low chase camera in town.
- The kit: facade sheets (forge, tavern, chapel, house, four takes each), a material sheet (cobble, stone, slate,
  timber, planks, flags) and a prop sheet (the four guild signs), generated in his ElevenLabs flow, pulled down,
  and cut by scripts/kitprep.py: background cleared, scaled to 32 px a tile, snapped to a palette with no dither,
  glow masks for the lit windows in their own colours, kit.json with each picture's size. 776 KB.
- three/streetkit.ts: a roofed block becomes a row of gable-fronted houses at their natural sizes, its own front in
  the middle and houses either side (mirrored every other one), each with a slate roof running back and stone or
  timber at the row's ends and backs; a guild sign by the door (anvil, tankard, lantern, mortar by kind and label).
  The floor laid with the cobbles. Under `?street` the camera's pitch is 24 degrees (camera3d.ts) and the view
  closer (view3d.ts ZOOM). Drawing only: footprints, doors and collision unchanged. Nothing changes without it.
- Known: the painted doors don't line up with the room's doors; props, trees and people are still the old art and
  look crude beside the kit; the texture density doesn't sit 1:1 on screen at this zoom; the town's layout is the
  old one. Try: relic-lake.vercel.app/?look=3d&hd&street&day=0.9
  (Claude Opus 5.5)

## 2026-11-15: the new look, slice 0b second pass (zoomed out, a hole round your hero)

- Kyle on the first pass: "WAY too zoomed in", "passing behind houses looks cheap", "i like the lower camera and i
  think we can go even lower but will probably need to redesign the town somewhat and zoom WAY back".
- Zoom: under `?street` the view is painted at the screen's own pixels over its density (view3d.ts), the kit at
  32 px a tile, about 40 tiles across a laptop and 20 across an upright phone (streetkit.ts `streetPpu`). (The first
  try widened the view and raised the resolution by the same factor, which cancelled out.) Pitch 20 degrees.
- Behind a kit building (as far back as it hides at this tilt, `top / tan(PITCH)`): a soft round hole round your
  hero, its edge dithered, the rest of the building solid; nothing lifts or drops (buildings3d.ts, streetkit.ts
  `ghostKit`, `HOLE` set each frame in view3d.ts). The hero's own see-through silhouette still shows.
- Known: an upright phone at this low tilt sees about 100 tiles deep with an orthographic camera, past the town's
  40, so half its screen is empty: the next step is a true perspective chase camera in town (Kyle's picture,
  ref/town-chase-camera.png). Then the kit's props, then the town re-laid out dense.
  (Claude Opus 5.5)

## 2026-11-15: the new look, the chase camera in town (behind `?hd&street`)

- Kyle: more variety, buildings cheated toward the camera, and "the camera to also have more of a chase effect...
  follow behind you as you're walking through, so you can see like the front of the church". Asked how far it
  should turn: "Gentle swing first".
- camera3d.ts: under `?street` the camera is perspective (28 degree lens, looking down 26 degrees), far enough back
  that a tile at your hero is the street's ppu. In town it eases after you and turns toward where you walk, up to 45
  degrees either way; walking back toward it holds the turn rather than spinning round. On a job it stays north.
- swing.ts holds the turn (no imports): input.ts turns the stick and keys by it, so up still walks away from the
  camera; figs3d.ts turns the figures' cards to face it.
- The upright phone's empty half is gone (perspective shrinks the far rows). Known: black beyond the town's walls (no
  sky or fog yet); the see-through hole's "behind" test doesn't know the swing.
- Kyle asked whether to model in Blender; and that interiors (the barracks, the church) are now far too small for
  these fronts: to be designed next.
  (Claude Opus 5.5)
