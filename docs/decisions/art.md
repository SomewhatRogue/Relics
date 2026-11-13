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
- The Rogue "all legs" (Kyle, 2026-11-12): facing you, the cloak's two edges hung as one-pixel strips with gaps
  either side of the legs, each outlined on its own, so it read as six legs. The cloak's dark lining now fills
  it round the legs from the belt to the calves: one cloak, two legs. (Claude Opus 5.5)
- The Rogue's legs (Kyle, 2026-11-12: "the legs look huge and too long"): its body was 5 rows over 5 of leg and 3
  of boot, against the Warrior's 7 over 3 and 3. A row moved from the legs into the body (the hands and belt sit
  a row lower) and the boots' toes trimmed to 4 wide. (Claude Opus 5.5)
- The Healer's tabard (Kyle, 2026-11-12: on the pick screen "a baby wearing a diaper"): it spread wide over the
  hips and came to a gold point between the legs. Now a narrow straight panel (6 wide) from the shoulders to the
  shin with a gold hem, over a mail skirt to the thigh; the Lantern sits on it as before. (Claude Opus 5.5)
- Weapons carried, not swivelled (Kyle, 2026-11-12: walking, the weapon turns toward where you point or go, "makes
  the mace feel not powerful or solid"). At rest and walking, every one-handed weapon, bow, crossbow, wand and kit
  (rapier, blowpipe, censer, flail) is held at a set angle that flips only with the side faced (held.ts rest,
  heldkits.ts kitPose). Attacks, charges, blocks and the spell tap still point along the aim. (Claude Opus 5.5)

## Heroic proportions (Kyle, 2026-11-12)

Kyle on the pick screen: "the cleric looks like a baby wearing a diaper and they all look sort of not cool or
stylized", and "I almost feel like we're using too few pixels". The heroes were 24 tall with a 9-row head, near
40% of the height, stubby legs and no neck; the Mage reads best because he's the tallest (32 with the hat). A
mock (Warrior and Rogue at 34 tall, a 7-row head) won "oh wow ya I think I like that, I wanna see in the game".

The plan, one class at a time so Kyle can play each against the old ones:
- Same width (18) and pixel size; bodies 31 tall plus any hat or hood (about 40% more pixels a hero), a head of
  about 7 rows, a neck, broad shoulders, a longer body and legs. The world and the camera stay.
- A look can give its own cut points and a hand lift (`cut`, `lift` in lookkit.ts): the held weapon, the shield,
  thrown relics and idle props ride the lift; cloth (herolife.ts) already hangs from the sprite's top and foot.
- The fight never changes: hit circles, reach, telegraphs as they are.
- Then: the other two Warriors, the Rogue, Ranger, Healer, Mage; portraits; then check the butchers and BIG
  ONEs still read big beside them and size them if not.
- Slice one (this push): the knight (Warrior look 1) only.
(Claude Opus 5.5)
- Heroic proportions, slice two (Kyle, 2026-11-12: "Tall hero is great. Need all other heroes tall and all other
  villagers in town... all other skins too"): all 15 looks redrawn tall. Warriors 31 (a 7-row head), Rangers 33
  (hood point over a 5-row face), Rogues 33 (deep hood, the wrap's tail over the shoulder, a pouch, the cloak
  flaring), Mages 40 (the hat over a 5-row face, hands at the belt), Healers 31 (coif or cap, the narrow tabard)
  and the friar 31 (habit to the feet). Each look gives its cut and hand lift. Cloth (herolife.ts) keeps its old
  rows and maps them onto a tall body (head rows to head, body rows to body), so capes, cloaks, mantles, hems,
  tabards and hair follow without being placed again. Townsfolk: the head's rows drawn smaller and the body's
  longer before the 1.5x redraw (npcs.ts person), so they stand as tall as the heroes; children stay small. The
  pick screen's portraits are 27 by 44 so the Mage's hat fits. The goblins stay as they are. (Claude Opus 5.5)
- The world to the tall heroes, step one: houses (Kyle, 2026-11-12: "houses now look way too tiny ... like you're a
  giant"). Research: a pixel-art person is commonly two tiles tall (16 by 32 on 16-pixel tiles); at 31 the heroes
  are there now, and the world's art was drawn for one-tile heroes and only partly grown. Pulling the camera back
  alone shrinks everything together; drawing the grid bigger (PX) touches 67 files and leaves fixed-size art
  small; finer pixels for characters only (mixels) would clash. So: the world's art redrawn to a two-tile person,
  footprints unchanged (the fight and collisions the same), then the camera a step back. This step: every
  painted building and piece of furniture twice its first height (blocklook.ts, was 1.5x), doors 12 by 28 (barns
  24 by 36) in blocks.ts and shutdraw.ts alike, cottage windows four-paned 10 by 10 with sills, shutters and
  flower boxes at the heroes' chests, town windows and the worn ones' boards to match (wear.ts). (Claude Opus 5.5)
- The square's posting places (Kyle, 2026-11-12: the job board "kind of weird"; the mock "ya I like it"): the JOBS
  and PUBLIC WORKS stalls drawn as a roofed notice board (pinned notices, a WANTED with a goblin's face, a red
  seal, a lantern guttering off the eave, a paste pot, JOBS on the fascia) and a builder's sign on scaffold poles
  (a painted hammer, the plans, planks and a mortar tub, WORKS on the top board). postdraw.ts, on the stalls' own
  footprints: the room and the spots unchanged. (Claude Opus 5.5)
- The long trips to the town hall (Kyle, 2026-11-12: "I'd like instances to be in the town hall maybe so it's
  cleaner along with expeditions"): a map table by the hall's west wall with CLERK TAMSIN at it (talk: 'map');
  her list is the expeditions and the Instances, the square's board keeps the rest (hunts, rescues, larders,
  story jobs, Deep runs) with a line at its foot saying where the long trips went. One list builder for both
  (boardui.ts `openBoard(g, panel, 'map')`): the cards, GO ALONE and GATHER A PARTY are the same. Lines checked
  by the lore keeper (no captain in Wickhold; "map table", not "war table"; "expedition" not said in new lines)
  and the line editor. Open for Kyle: the lore keeper suggests Orla of the watch at the table instead of a new
  clerk, which grows her part in the bible. Instances chat: the Open Cut is now taken at the map table, not the
  board; nothing in your files changed. (Claude Opus 5.5)
- The world to the tall heroes, step two: props. Round obstacles keep their width on their hit circle and grow
  upward only (the Last Lantern, lamp posts, the well, pillars, mine supports, archery targets: 2 tall, 1.5
  wide); trees, pines and dead trees all over to 2 (only the trunk is solid); braziers a stand to the heroes'
  hips. Their flames and lights moved up to match (lampsdraw.ts, blocks.ts). Things the room moves and breaks
  at their own sizes (barrels, crates, carts, tables, cages) and low clutter (rocks, stumps, bushes) stay as
  they are, so nothing drawn says a different size from what's decided. (Claude Opus 5.5)
- The world to the tall heroes, step three: the camera and the walk. The camera a step back (scene.ts, and the
  2.5D view's own floor in three/view3d.ts to match: 118000 for 82000; the phone's 6 to 5, a laptop's 8 to 7):
  the tall heroes about the old ones' size on screen, more town round them. The walk (Kyle: "isn't timed up"):
  4.4 squares a second over 12-row legs wanted quicker steps, 11 changes of foot a second for 8; a tall leg lifts
  two pixels; across the screen the lifted leg swings a pixel forward and the planted one back (figure.ts).
  (Claude Opus 5.5)
- The 2.5D view (Kyle plays in it, 2026-11-12: his town still showed the striped PUBLIC WORKS stall): the job board
  and the works sign built of boxes on the stalls' footprints (three/posts3d.ts, from walls3d.ts), their words on
  the fascia and top board (tags3d.ts); townsfolk's marks and names at a tall head's height (HEAD 1.65 to 2.15).
- The statue's "gap in the head" (Kyle's screenshot: a stone Mage): stretched over all six stone shades, the dark
  underside of the hat's brim took the darkest, the ground's colour, and read as a hole through the head. Only
  the outline takes the darkest stone now; the rest spreads over the five paler (statuedraw.ts). (Claude Opus 5.5)
- The 2.5D houses: their walls had their own heights (three/houses3d.ts TALL, a house 1.45 tiles, shorter than a
  tall hero), now 1.7 times (a house 2.45, a head over them), doors 0.9 by up to 2.05 tiles, windows with a
  mullion, the panes and boards to match. (Claude Opus 5.5)
- The loot pass (Kyle, 2026-11-12: "dropped items, gold and potions, along with weapons and weapon glint on the
  ground ... a better pass"). Flat view (lootart.ts, from relicsdraw.ts): two or three coins or a heap for a lot,
  glints winking over them; a corked glass bottle in its potion's colour, the light inside breathing; each
  weapon lying as itself (sword, greatsword, spellblade, spear, daggers, both bows, crossbow, wand, staff, mace)
  with a glint running down the blade every few seconds; a breastplate by its weight; an amulet with a gem in its
  tier's colour; a shadow under each, gear lying still. The tier's ring and shaft of light kept. 2.5D (three/
  loot3d.ts, from actors3d.ts, for props3d.ts's spinning blade): the same, built of boxes, lying at a slant in a
  dotted ring of its tier's colour, the glint running down it; coins and a heap; a corked bottle glowing.
  (Claude Opus 5.5)
- Chests (the loot pass, continued): flat, 20 by 14 sprites (relicsdraw.ts) for the 14-by-12 boxes: a domed lid,
  iron bands with studs, corner irons, planked sides, a brass lock plate with a gem of the tier's colour; open,
  the lid's dark inside tipped back and a gleam of coin in the mouth. The rattle, the seam's light, the sparks
  and the chains kept, sized to it. 2.5D (three/props3d.ts makeChest): corner irons, a plank seam, a brass lock
  plate, the lid banded and raised. (Claude Opus 5.5)
- The walk, again (Kyle, 2026-11-12: "walking animations are weird up and down. And mage boots come out from the
  sides as he walks"): the body no longer bobs, a lifted foot rises one pixel, 9 changes of foot a second; no
  swing under a robe (its legs are only the feet row, and swung, the boots stuck out past the hem). (Claude Opus 5.5)
- The walk cycle (Kyle, 2026-11-12: "lets do it"): four poses from the room's walk clock (figure.ts STRIDE), each
  leg cut at the knee and posed by thigh and shin. Across the screen: contact (one foot reaching forward, two
  pixels at the shin, the other back), passing (the back leg comes through, knee bent, foot a pixel up), then the
  other foot. Toward you or away: the forward foot a pixel lower, the back one a pixel higher, then passing.
  Under a robe the feet only peek in turn. Every look gets it from its own cut; no body bob. (Claude Opus 5.5)
- Cloth whole while walking (Kyle, 2026-11-12: "rogues cloak and presumably other cloaks look different top and
  bottom"): the body's cut above the hem put the cloth's lower half in the legs, so the walk moved it apart from
  the top. The legs are cut below the cloth now: Warriors and Healers at 22 (under the tabard's tip), Rangers at
  25 (under the cloak), Rogues at 27 (under the flared hem, only the boots step). (Claude Opus 5.5)
- Cloaks and robes on the walk (Kyle, 2026-11-12: "weird boots out the middle of the mage and the rogue's cape is
  cut at the middle"): under a robe a foot now only lifts into the hem, never drops below it (the drop showed the
  boots poking out of the middle). The Rogue's cloak was drawn twice, the flare in its sprite and a swaying mantle
  behind, and the two outlines read as one cloak cut at the waist; the Ranger's fluttering cloak the same, a notch
  beside its own. Both drawn once now: the cloak's own lower half (from the cut's `skirt` row) sways a pixel with
  the walk, trailing behind across the screen, side to side toward you (figure.ts SWAY). (Claude Opus 5.5)
- The Roll of the Brave (Kyle, 2026-11-13: with the tall heroes it "takes up too much space. Maybe we do small
  statues on plinths for it. Also a better organized UI"): one record at a time, picked from a row of buttons
  under THE BRAVE / THE UNLUCKY; its top three as small stone statues (the hero's look turned to stone, as the
  town statue's) on stepped plinths, first in the middle and highest; names and counts under them, places four
  on as a list, your own standing. The unlucky in mossier stone on cracked plinths. One card's height instead of
  eight cards of faces (rollui.ts; style.css's podium rules replaced). (Claude Opus 5.5)
- For the Deep chat (found 2026-11-13, not fixed here: your files): since d1697a6 ("The Haulier's tracks and tunnel
  mouths in the 3D view") five test files fail under Node, raise, rats, recapboard, runux and wading, with
  "document is not defined": tests/rats.test.ts imports client/world.ts, which now imports sumpdraw.ts, which calls
  makeSprite as it loads. Making sumpdraw's sprites on first use (or moving paintTracks out of world.ts's imports)
  would clear it. My own process note: I ran the suite before rebasing and piped it through grep, so a red suite
  didn't stop my push; from now I check the suite's exit after the rebase. (Claude Opus 5.5)

## 2026-11-13: the hounds drawn as dogs

- Kyle: "Lets make the hunter dog and dog options better looks not like a dog right now." What made them read
  wrong: a square skull with a box of muzzle stuck on, a pencil-thin neck straight up, hind legs bending forward
  at the knee (a goat's), a slab of body with no chest or tuck, a one-pixel tail.
- Each breed's head is now a small drawing (houndheads.ts): a skull with a stop, the eye at it, a muzzle tapering
  to the nose, and the ears as the breed wears them at rest, laid back running, pricked up. Wolfhound brows and
  beard, the lurcher's long flat head, the hill hound's tan muzzle and long drop ears, the collie's tipped ears
  and white ruff. Open jaws have their own rows.
- The body: high at the withers, the croup falling to the tail, deep in the brisket, tucked at the loin, the
  thigh full behind, forechest and rump rounded. The neck a thick wedge from the withers into the skull. Hind legs
  go back to the hock and down; every foot has a paw; the tail thick at the root. Sitting has a round haunch
  and a hind foot forward; lying down has the paws out past the nose. Wolfhound and lurcher a row longer in the leg.
- Same box (HOUND_BOX), same poses and fight; the wolves share the wolfhound's body so they come out better too.
  scripts/hound-look.cjs's cells now the box's size (39 by 24) so heads aren't cut off the sheet. (Claude Opus 5.5)

## 2026-11-13: the square's statue redone at a hero's size

- Kyle: the statue "has a hole through its face", maybe too big, weird with several heroes; redo. Doubled, with the
  tall heroes it was near three heroes high, blocky, and in the 2.5D view it stood on two cards (a card holds 64
  pixels above its foot) with the seam right through the face.
- Now the figure is the hero at their own size and fidelity (STATUE_SCALE 1), on a plinth half as tall again
  (body 1.5 tiles), so it still stands well over the square. One card in 2.5D (the second only if a figure
  were ever taller than a card). A dark pixel inside the figure (eyes, a brim, a hood) takes the second-darkest
  stone; only the outline is the darkest, so nothing reads as a hole. (Claude Opus 5.5)
