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
- Slice 2, idle props: every idle's things in hand (the thumb on the edge, the yawn, the flex, the stick,
  the scan, coins and flipped knives, the book, the brim, sparks, the prayer, the polish, the censer's
  smoke) and the pastimes held at the hands (the rod and creel, the range bow, the arm wrestle, the knife
  throw, the smith's hammer) placed through `hs`; colour samples and head points read on the new grid.
  Things out in the world (the float, the butts, the anvil) stay put. Open: the Ranger's hound is still
  its old size beside the bigger hero; redraw it with the goblins' kit. (Claude Opus 5.5)
- Slice 3, goblins (the small body and every kit): the small goblin redrawn 17 by 20 (from 11 by 13): a
  bigger head, long ears out to the sides, a brow over the glowing eyes, a jagged grin, thin arms, a patched
  jerkin, bandy legs; the pale blind hunters the same body in bone with upright ears and empty sockets; the
  headless and burnt bodies redrawn to match. Its pose is laid out 1.5x. Everything it carries goes through
  `gobpen.ts`: the kit files (foekits*.ts, staithekit, meatydraw*, chalkdraw, ironhidedraw, lessonfoes, the
  snarer's, the hexer's and drummer's, the elites' marks) still draw in the old pixels round the feet, and the
  pen puts each rect on the 1.5x grid at whole pixels, one-pixel details kept one pixel; a `line` on the pen
  (draw.ts) is drawn whole in the new space so it stays thin. No kit file needed editing. Telegraphs and reach
  are drawn without the pen, unchanged. Status marks (ice, snare, flames) sized to the taller body. Small
  goblins are no longer stretched (`stretchFoe` in bodysize.ts); wolves, logs, the dug-in, spiders and the
  meaty sorts' extra size still are until their turn. Open: butchers are still their old size, now barely
  taller than a goblin (slice 5 grows them); props a goblin carries that are sprites (a door, a keg) keep
  their old size until the props slice. (Claude Opus 5.5)
- The Ranger's hound at 1.5x: every breed measured again half as big again (leg, body, chest, loin, neck,
  skull, muzzle, snout, tail; legs a pixel thicker, the tail's curl spread over its longer length), in a box
  39 by 24 (from 26 by 16), so the code draws it natively at the new size with lines still one pixel. Poses'
  pixel moves (leg shifts, stretch, lift, crouch, head) scaled once where the map is built; the sit, down and
  belly shapes redrawn to the new measures; a mood's lean and lift scaled. The wolfhound's muzzle is 4, not
  5, so its nose stays in the box at full stretch (tests/hound.test.ts holds every breed in every pose
  inside it). Maeve's preview canvas 64 by 40 at an even 4x. (Claude Opus 5.5)
- Slice 4, props and townsfolk: `grow` in sprites.ts draws a sprite again from its own shapes at 1.5x
  (rect edges land on the new grid, ellipses and wedges drawn whole, a lone pixel stays one pixel), so
  nothing is stretched. Grown 1.5x: barrel, punt, oil, table, plank, stave, cage, larder, trees, pine, dead
  tree, bush, reeds, rock, hay, well, stump, target, stone, the training dummies (no longer stretched), the
  freed captives; the crate redrawn by hand (its cross brace as two clean diagonals). Taller on the same
  footprint: pillar, statue, brazier, lamp, lantern, support, post. Their overlays moved with them (the
  brazier's flames, ash and light, the lamp post's flame, the Last Lantern's flame, a prop's shadow, tumble
  and lift over the bigger hero). Wickhold's townsfolk and the child grown the same way; what they hold
  (spears, tools, Hew's arrow, the crew's loads) and the captives' rope, hands and sparks go through the
  goblin pen. Left for the Deep chat: the Haulier's ore cart (its wheels are drawn in sumpdraw.ts), still
  1x. Next: buildings taller on the same footprint. (Claude Opus 5.5)
- Slice 4, buildings: every block painted from blocklook.ts's table stands 1.5x as tall on the same
  footprint (walls up, furniture at the bigger hands); the 2.5D view builds from the same table so it grows
  with it. Pieces drawn from their own boxes (headframe, mill, the Staithe's, the Gospel Oak, haystacks,
  Fenmere's boards and reeds) keep theirs. Doors 1.5x (a cottage's 9 by 16, a barn's 18 by 27); a cottage's
  windows 8 by 8 with a cross and set higher, their lamplight to match; stone sills wider. A roof archer
  stands on the new ridge (ROOF_UP 45, 3.45 in 2.5D). Tests that read heights pass (houses, buildings,
  furnish3d, parity3d). (Claude Opus 5.5)
- Slice 5, butchers: the butcher redrawn 27 by 33 (butcherparts.ts): a great belly, thick arms with big
  hands, an apron with straps and old blood, a head with ears out, a brow, glowing eyes, tusks. Every named
  butcher its own look, picked steadily from its name: a build (heavy, hunched with the back humped over the
  head, or lean with a long neck), a hide and apron (three greens, three aprons), a trophy (skulls at the
  belt, a string of ears, a hero's dented helm with its plume, a tooth necklace) and a weapon look (cleaver,
  meat hook, maul). THE STOKER: soot to the eyes, a black apron, an iron poker with a hot end. The Hempen Man:
  the lean build in sacking, a stitched hood tied at the neck with the eyes burning through rough holes, rope
  across him, nooses at the belt, a hook, a forward gallows lean; past half his health the sack is torn open
  over one eye. All looks only: the swing, its arc and its telegraph are the room's; the smear and marks are
  1.5x. Pose, hand, ring and status sized through heroscale. The lineup shows a few names, the Stoker and
  the Hempen Man whole and torn. A fractional head row crashed the sprite maker; caught on the lineup before
  any push. (Claude Opus 5.5)
- Slice 5, the Doorkeepers (the Barn's hunt): no longer a 1.15 canvas stretch of the butcher; the butcher's
  shapes drawn again 1.15 as big (`grow`), cut to match, so they stand a size up on whole pixels. Each one's
  look comes from its name like any named butcher. Their doors drawn through the goblin pen at 1.5x; the
  door each carries square in front shows whose it is (the Latch's bar and ring, the Hasp's hasp and gold
  lock). ENRAGED eyes and heat placed for the new body. Not done here, by the board: the Haulier and its ore
  cart are drawn in the Deep chat's `hauldraw.ts`, `haulpose.ts` and `sumpdraw.ts` (`haul*.ts` is theirs);
  the Deep chat or Kyle can hand them over, and the art spec's shape for it stands (under its ropes and
  loads). (Claude Opus 5.5)
- Injury you can see (Kyle, 2026-11-11: tougher goblins and elites "look it before you slice them in
  half"): wounds.ts. Who: elites, BIG ONEs, named goblins, any goblin with over 1.6x a plain one's health
  (instance goblins), every butcher; plain one-hit goblins stay clean. From the room's health share: under two
  thirds, cuts across the body with blood running from them; under a third, more and deeper cuts, a cut on the
  arm and the head, blood down the legs, an eye put out (its glow covered), a limp in the walk (down hard on
  one leg, a lean) and a heave in the breath. Each goblin's wounds sit in the same places every frame, seeded
  by its id. On a butcher the cuts go on the bare hide either side of the apron and the shoulders, so they
  don't blur into the apron's old blood. The lineup has hurt and badly hurt rows. Drawing only. (Claude Opus 5.5)
- Slice 6, Rakehead's four (Kyle's yes to the handover; their bodies were never in the Instances chat's files:
  brakedraw.ts and pairdraw.ts draw only the floor mechanics, untouched): each a goblin a size up (the goblin's
  shapes drawn again 1.3x on the new body, cut to match; the goblin pen takes a size, so every kit, the
  Sluicer's ironhide plates too, fits it) with its own tool in place of a club, from rakehands.ts: the
  Drover's goad and a coil of rope on the shoulder, the Brakesman's great iron lever with a knob, gloves and a
  chain at the belt, the Raker's long rake with a crossbar and tines, the Sluicer's bucket with water running
  off it. The tool draws back through the wind-up and comes forward on the blow, from the room's attack clock.
- Shields round a hero at 1.5x (Kyle: they hadn't grown): the spellblade's mana shield (shell, inner shell,
  ground ring, cracks, shards), the Cleric's holy shield (shell, halo, motes), the holy guard's shell, the
  crossbow's reload ring and glint, and the column over a friend being raised. (Claude Opus 5.5)
- Detail pass (Kyle, 2026-11-11: "since we're more zoomed in we could add more details to EVERYTHING"), in
  order of what's seen most: heroes, goblins and butchers, then props and buildings. Heroes: brows and mouths
  on the bare faces, the knight's nasal guard; the Warrior's pauldron rims and rivets, cloth folds, a belt
  pouch, knee plates, boot cuffs and wider soles; the Ranger's strap buckle, pouch and boot cuffs; the Rogue's
  strap stud, a knife's hilt at the hip, laced boots; the Mage's hat-band buckle, gold along the hem and a
  pouch; the Cleric's pouch and soles. Goblins: a ragged jerkin hem, a rope knot at the belt, knobbly knees,
  claws on hands and toes, a ring in one ear, a wart. Butchers: rag wraps on the legs, toe claws, a nose ring,
  an old scar on the brow. (Claude Opus 5.5)
- Detail pass, props and buildings: drawn into each prop's own shapes so they come out at 1.5x with it
  (barrel stave seams, hoop rivets and lid; table grain, nails and a mug; the well's stone courses, a bucket on
  its rope, moss; loose straw on hay; stump rings; leaf highlights and bark on trees and pines; cracks and moss
  on rocks; rust on cages; chips in pillars; rivets and dead coals on braziers; an arrow in the target; nails
  in the crate's corners). Cottages: a sill under each window, a base course along the wall's foot, cracks in
  the plaster. Every door: its planks, iron hinge straps, a handle. Next in the pass: the mobs as slice 7
  redraws them (wolves, spiders, the meaty sorts), and the floors. (Claude Opus 5.5)
- Slice 7, the rest of the mobs; the stretch and the SIZE button gone. Spiders, brood mothers, nests and the
  meaty sorts' things (door, flail head, tines, keg, claws, gaff, horn) drawn again from their shapes at 1.5x.
  Spiders, the dug-in sapper's mound and the logs drawn through the goblin pen; the sprite helpers (blitPose,
  spin, ghost) draw a sprite at the pen's feet at its own size, on the real canvas. A BIG ONE, a meaty sort
  and a growing gorger are no longer a stretched canvas: strawman.ts hands the size to the body (gobpen.ts
  BODY), and the goblin and butcher draw their shapes again at it (made once a size, in steps of 0.05); the
  pen and the elites' marks follow. Wolves redrawn (wolfdraw.ts): the hound's own body as a rough grey
  wolfhound a step darker, gold eyes catching the light, trotting, crouched in the wind-up, stretched out in
  the dart, from the room's attack clock. bodysize.ts deleted: nothing is stretched any more; the SIZE button
  is out of options. (Claude Opus 5.5)
- Detail pass, round two (Kyle: "more detail on characters and npcs and houses etc", trees "more foliage"):
  trees a full canopy of overlapping leaf clumps lit on top and shadowed under, a trunk with roots; pines in
  tiers lit along their tops; fuller bushes. Shingle roofs: each course's lower edge catching the light, slipped
  tiles, moss, a ridge shadow; thatch shadowed at the eave; chimneys bricked with a clay pot. Plaster cottages
  half-timbered (a beam across, a brace); shutters open beside the windows; on some cottages a box of flowers.
  Townsfolk: a belt and buckle, cuffs, buttons, boots, a mouth, an apron's tie. Heroes: the knight's cheek-guard
  rivets, colour in the Rangers' cheeks, folds in the Rogues' hoods. makeSprite now rounds rects, pixels and
  wedges to whole pixels itself (a half pixel crashed it twice tonight; both caught before any push), and grow
  lays a wedge on whole rows. (Claude Opus 5.5)
- Detail pass, round three (Kyle: "Go" on the Healer and Mage, the goblins, the dungeon pieces). Mages: a fold and a
  charm on the hat, trimmed cuffs, a pouch and a tassel at the belt, folds down the robe, a gold-stitched hem, bushy
  brows, a nose, strands in the beard and hair. Healers: the Lantern's heart in pale gold (embroidered, still unlit),
  the tabard shaded at its sides with a gold tip, knees in the mail, brows and a nose; the friar a wooden cross on a
  cord and folds in the habit. Goblins: a strap from shoulder to hip with a tooth tied on, rags round the shins,
  elbows, wiry hairs, a bitten ear, nostrils, hollow cheeks, fangs over the lip (the pale ones stay bald). The crate:
  a lit top edge, nails, grain, knots. Braziers: a riveted band, a dark lip, splayed feet, and coals glowing between
  the flames when lit. Lamp posts: a frame on the lamp. The Doorkeepers' doors: lit plank edges, knots, a split,
  nail heads along a strap still on. Drawing only. (Claude Opus 5.5)
- Detail pass, round four: butchers (a second round): leather bracers with a rivet, knuckles and claws, warts and an
  old cut on the hide, a hem across the apron with a pocket and a knife's handle in it, the apron's foot ragged, a
  creased brow, nostrils, a wart, a ring in one ear, folds at the chin; walking away, the spine knobbed and the neck
  folded. Spiders: a bristle off each knee, a dull red mark on the back, fangs; the brood mother banded, bristled,
  eggs stuck to her. Rakehead's four and the BIG ONEs share the goblin's body, so round three's goblin detail is on
  them already. Floors and walls aren't the art chat's files. Drawing only. (Claude Opus 5.5)
