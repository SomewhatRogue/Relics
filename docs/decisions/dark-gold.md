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
