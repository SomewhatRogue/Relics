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
