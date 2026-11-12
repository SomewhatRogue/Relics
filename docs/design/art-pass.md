# The art pass: bodies at 1.5x, bosses with their own shapes and moves

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Not built. Kyle tried the SIZE test: "1.5x is PERFECT", "we
want even pixels", "redraw what we need and also get on drawing the new bosses and mobs and animations for
the mini bosses and bosses".

## The rule

**What people stand next to grows; the map, and anything showing where a blow lands, stays the same size.**

| Grows 1.5x (redrawn) | Taller, same footprint | Unchanged |
| --- | --- | --- |
| Heroes, goblins, every kit | Buildings: walls up, doors and windows 1.5x | Floor tiles (`PX` 16), map size, camera |
| Butchers and bosses (so they still tower) | Trees: canopy and trunk, same spot | Red floor telegraphs, reach, hit circles |
| Props at hand height: doors, barrels, crates, carts, fences, the well, the job board, cages, captives, drops | Pillars, statues, braziers | Anything the room decides |
| After-images, ghosts, deaths, shadows (drawn from the body) | | |
| Arrows, bolts, orbs: a little bigger, paths true | | |

## The camera

Unchanged (Kyle, 2026-11-11): 1.5x bodies at today's zoom, about 12 tiles across on a phone. No tilt, no
zooming out: the art pass changes no camera code.

## Even pixels

- **Redrawn, never stretched.** Each sprite is drawn again with 1.5 times the pixels (a 16 px goblin becomes
  24 px), so every pixel is whole. `bodysize.ts`'s stretch goes once a thing is redrawn; the SIZE button goes
  when everything is.
- The 3D view's cards use the same sprites, so they come along.
- The look stays as approved (CLAUDE.md, "The look"): cool stone, torchlight, goblins in sickly greens with
  glowing eyes, the lit and glow layers, a body erasing the glow under it.

## Shapes that read

Every unit type is known from its outline at phone size, before its colours. Props alone (a net in a small
goblin's hand) aren't enough for the units people must react to: give each a body that says what it does
(the shield goblin a wall, the netter hunched and wide-armed, the hexer thin and tall).

## Moves

Every unit, the same set: **stand, walk, wind up, strike, recover, hurt, flinch, stagger, die**.
- The wind-up is the tell. It is drawn from the room's own attack clock (`a.t / a.windup`), never a timer of
  its own, so what you see and what lands share one source.
- Bosses add: an entrance, a signature move each, a turn when its health crosses a phase, and a death that
  lasts.
- Cosmetic flourishes (breath, sway, a flicker) may use the draw clock; never the fight's dice.

## Bosses and mini-bosses first

| Who | Where now | Shape to give it |
| --- | --- | --- |
| Named butchers | `butcherDown`, `butcherUp` in `sprites.ts` | 1.5x and each its own: build, trophy, weapon |
| The Hempen Man | `hempendraw.ts` | rope and sacking, the gallows lean |
| The Doorkeepers | `doordraw.ts` | the pair, each half a door |
| The Haulier | `hauldraw.ts`, `haulpose.ts` | under its ropes and loads |
| The Barn's hunt | `bosstune.ts` BARN_HUNT | as its spec says |
| Rakehead: the Drover, the Brakesman, the Raker and the Sluicer, the Haulier of the Open Cut | the Instances chat, placeholder looks | the rope line, the brake lever, the long rake and the flood, ropes and loads (docs/design/instances.md) |

Then the mobs, by how often they're confused: shield, netter, hexer, lunger, gaffer, snarer, ironhide,
heavy, then the rest of the variants in `foekits*.ts`. New mobs from new specs are drawn by this chat too.

## The lineup page

A dev page that draws every unit in every move side by side, at phone scale, on the stone floor and under
torchlight. Kyle can open it on his phone; each slice is checked with one screenshot of it, not dozens.

## Ownership (on the board)

This chat owns the drawing files: `sprites.ts`, `heroart.ts`, `herolooks*.ts`, `heropose.ts`, `idlepose.ts`,
`foes.ts`, `foepose.ts`, `foedraw.ts`, `foekits*.ts`, the `*draw.ts` files that draw bodies and props,
`spidersprites.ts`, `meatysprites*.ts`, `houndbody.ts`, `bodysize.ts`, `three/goblins3d.ts`,
`three/foepose3d.ts`, `three/cards3d.ts`. Not the Deep chat's `deep*.ts`. The Instances chat keeps simple
placeholder looks for its bosses; as each fight lands, its look comes here.

## Build order (slices)

1. The lineup page.
2. Heroes redrawn at 1.5x, each class and its weapons.
3. The small and big goblin bodies, then every kit.
4. Props at hand height; buildings taller; trees.
5. Named butchers; then the Hempen Man, the Doorkeepers, the Haulier, the Barn's boss, with their moves.
6. Rakehead's four as their fights land.
7. The mobs, most confused first; remove the stretch and the SIZE button.
