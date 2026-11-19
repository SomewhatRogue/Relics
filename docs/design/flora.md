# Flora: making the plants beautiful

Kyle, 2026-11-18, after playing Tollan's Farm and Sallow Carr: "grass (reeds?) look a little weird sometimes in
general and trees etc could use more variety. I want these worlds to be beautiful."

This is research and a plan, not a build. Three researchers: one audited how Relic draws every plant today in
both views (close-up pictures in `scratch/flora/`), two read how other games and pixel-art teachers do ground
cover and trees. Nothing here is built yet. Most of the files it would touch are the Art chat's (`sprites.ts`,
`blocks.ts`, `soil.ts`, `three/nature3d.ts`, `three/rounds3d.ts`), so who builds it is Kyle's call.

## What is wrong today (the audit, worst first)

| # | What you see | Why | Size of the fix |
| --- | --- | --- | --- |
| 1 | **Flat view: reeds are black picket combs.** A clump is a block of dark bars, all one height, and in Sallow Carr they bury the hero and the goblins (225 clumps on its first map) | One reed sprite, each stem thickened and given the sprite outline (`sprites.ts` reed, through `makeSprite`) | Small: no outline on grass-like sprites, 1 px stems in three greens and a straw, two or three sprites of mixed height picked by position |
| 2 | **2.5D: small willows are lollipops.** A thick brown post with a fist of leaves | The crown follows the tree's size, the trunk is a fixed box (`three/rounds3d.ts`) | Tiny: trunk height and width follow the size too |
| 3 | **Flat view: every tree, pine and bush is one sprite at one size in one green.** 404 identical willows in rows | `blocks.ts` `drawRound` blits one sprite and ignores the size | Medium: three crown shapes, three or four greens, a flip, three sizes, picked by position |
| 4 | **Rye is drawn as fen reeds:** green stems with brown cattail heads over a very bright crop floor | Lowfurrow's rye uses the `reeds` block; the crop soil is 35% bright flecks (`fenpieces.ts`, `soil.ts`) | Small: a rye look (straw stems, a pale bent ear, even height), calmer crop flecks |
| 5 | **2.5D: reeds are brighter than everything round them** | They skip the colour grade the rest of the plants get (`three/rounds3d.ts`); tree leaves skip it too, bushes do not, so a hedge and the tree beside it differ | Tiny |
| 6 | **Flat view: apple trees are soft blurry blobs** beside crisp sprites | Drawn with smooth canvas ellipses (`piecedraw.ts`) | Small: whole-pixel lumps with a darker rim |
| 7 | **Hedges are beads on a string:** identical bushes, two berries each, evenly spaced | One bush shape (`three/nature3d.ts`, `sprites.ts`) | Tiny: vary width, height and green, berries on one in three |
| 8 | **Reeds draw over bodies standing behind them** | A clump sorts by its foot as one thing | Mostly cured by 1 (shorter, thinner); a proper cure is medium |
| 9 | **Straw and crop patches glare** against the grass | 30% bright flecks in the straw soil | Tiny |

What already works: pines and big trees on the knoll, the orchards in 2.5D now that an apple tree follows its
size, big willow crowns over black water, the floor's painted tufts in 2.5D. Only tree and pine leaves move in
the wind in 2.5D; nothing moves in the flat view.

## What good looks like (the research)

Ground cover:
- **Clumps, not blades.** A few cluster shapes reused, with empty ground between them. Drawing every blade is
  noise (Slynyrd, Pixelblog 15 and 20).
- **Mixed heights.** Reeds in three or four height classes, a few bent, a few dead and pale, a seed head on about
  one stem in four. Even height is what reads as fake.
- **Dark base, light tip, and the hue moves.** Shadows toward blue-green, tips toward yellow-olive, never just
  lighter and darker of one green. In 2.5D the same by height, which fakes shade at the root for nothing.
- **Tint by place.** A slow noise over the map so a field is not one green.
- **Few colours, low contrast** on the ground, so the red floor telegraphs stay the loudest thing.
- **At the water:** a dark band at each stem's foot, a short smear below it, a rare slow ring.
- **Thin near paths and where the fight is,** thick at the margins.
- **Sway by height** in 2.5D (tips move, roots stay). The shader already does this for trees.

Trees:
- **Few shapes, many placements.** Variety comes from scale, flip, lean, trunk height and a tint per tree, not
  from many assets.
- **A crown is a stack of lumps,** light on top and dark underneath, not one ball.
- **Clumps, not dice.** One big, one or two middling, one or two small, a bush at the foot, bare gaps between
  clumps. Never two the same size touching.
- **Species read by outline.** Oak: wide, lumpy, low. Pollard willow: a short fat knuckled trunk with a spray of
  thin upright shoots, grey-green. Alder: narrow, dense, very dark, several stems. Hawthorn: low, wide, tangled.
  Birch: a thin white trunk, an airy pale crown. Pine: the one that is not round.
- **Crowns darker and cooler than the grass,** so a tree is never the same green as the field it stands in.
- **A wood's floor is darker and bluer** than a field's, with blob shadows and a few light dapples under crowns.
- **One hero tree a map:** bigger, older, a different hue, clear ground round it.
- **Dead trees, stumps and fallen trunks** break the pattern cheaply.

To avoid: even spacing and even height; neon or single-hue greens; bright tips that fight the light pools; tall
cover over feet and telegraphs; a round crown on a willow (it reads as an oak, and the carr reads as a park).

Sources read: Slynyrd's Pixelblog 10 (water), 15 (plant life), 20 and 43 (top-down tiles), 44 (top-down
trees), 62 (landscapes); itch.io pixel tutorials on grass patches and a Zelda-style mockup; Game Developer,
"Art tips for building forests" and the Eastward interview; Codrops and Godot Shaders on stylised grass;
write-ups of Ghost of Tsushima's grass; the Imphenzia low-poly trees devlog; Kent Wildlife Trust on crack
willow. The researchers found no usable developer write-up for Stardew Valley, Sea of Stars, Tunic or Hades
plants, so nothing here is credited to those.

## The plan, in slices

Each slice is seen in both views on Lowfurrow, Tollan's Farm and Sallow Carr before it lands.

1. **Stop the weird** (small; fixes 1, 2, 5, 9 above). Reeds redrawn in the flat view as thin mixed-height
   clumps with no outline; reeds graded in 2.5D with a dark foot and a light tip; willow trunks that follow the
   tree's size; calmer straw and crop flecks. This is the "grass looks weird" complaint, cured.
2. **Trees that are not copies** (medium; fixes 3, 7). Three crown shapes, four greens (one olive, one
   blue-green), flip and three sizes in the flat view, the same choice driving the lumps in 2.5D; bushes in
   three outlines, berries on a few.
3. **Species** (medium). A pollard willow for Sallow Carr, then an oak and an alder; rye that is rye (fix 4);
   crisp apple trees in the flat view (fix 6).
4. **Woods as places** (medium; mostly laying, in the maps). Clumps and gaps, a hero tree on each map, a darker
   floor and dapples under crowns, dead trees and fallen trunks, a dark foot and a ring where a reed meets
   water. Reeds and rye swaying in 2.5D.

**Slice 1 is in (2026-11-18, the Territories chat, at Kyle's "do it").** Reeds in the flat view are three
clumps of one-pixel stems at mixed heights, dark foot and pale tip, a few heads, one dead, no outline, picked and
flipped by place (`sprites.ts` `reedClump`, `makeSprite`'s new `outline` switch, `blocks.ts`). Reeds in 2.5D are
graded, two-tone by height, mixed heights, heads on a few (`three/rounds3d.ts`). A living tree's trunk follows
its size in 2.5D. Crop and straw flecks are fewer and calmer (`soil.ts`). Still open from the table: 3, 4, 6, 7,
8 (the proper cure).

**Slice 2 is in (2026-11-19, the Territories chat, at Kyle's "continue").** A plant's look is chosen by where it
stands, the same in both views (`client/flora.ts` `floraLook`): a tree is one of three outlines (round, taller
and narrower, broader and lower), one of four greens (the old one for four in ten, an olive, a blue-green, a
deep shade), mirrored or not, and one of three sizes by its radius. A pine keeps its outline, in its own green
or the blue one, three sizes. A bush has the three outlines and four greens; about one in three shows berries,
one in nine blossom, the rest neither. The flat view builds each look from the one drawing the first time it
is wanted (`client/florasprites.ts`); the 2.5D view shapes and tints its lumps from the same choice, and tree
and pine leaves are graded now as bushes always were (`three/rounds3d.ts`, `three/nature3d.ts`). Fixes 3 and 7
of the table. Open: 4 (rye), 6 (flat apple trees), 8, and slices 3 and 4.
