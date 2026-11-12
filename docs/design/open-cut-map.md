# The Open Cut as one map (spec)

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). The Instances chat's. Replaces "areas taken in turn" for the Open Cut;
the frame's checkpoints, gates and dozing carry over (docs/design/instances.md, docs/decisions/instances.md).

## What Kyle asked for (2026-11-11, after playing the first build)

- "More like WoW in general: one HUGE map but with little paths (less on earlier ones, more on later ones) and
  branches", lag kept down by only waking what's near people, and a harder, more linear path so you can't run off.
- "Less goblins and each one takes longer for the group to work on"; "bosses and mini-bosses and mobs in well crafted
  spaces that have a story (libraries, destroyed castles, etc) for each one that's thematic ... without needing a
  million rooms."
- More space before a boss that's interesting to move through: "not just houses for the sake of houses, a more
  tailored path with mobs".
- A cut-screen intro or scripted movement for each mini-boss, and the trick it hides taught there, not in a goal line.
- The Haulier a mini-boss; the end boss more epic, in stages, with a much better loot payoff.
- Harder: "too easy to dodge everything", and never "low damage numbers to bosses" as a punishment. (Done: fierce
  goblins, elite leaders, OPEN windows instead of cut-down blows.)

## Shape

One map, walked downhill into the pit, one way with short branches. Each stretch is a **place with a story**, built by
hand: what happened there shows on the ground, and its goblins are doing something in it.

| Stretch | The place and its story | Who's there |
| --- | --- | --- |
| The rows | The miners' cottages up the hill, doors unbroken; the roped line being marched to the adit | The Drover (intro: its line marched past you) |
| The reckoning house | The pay office: ledgers, scales, the tally board the goblins now chalk on (the "library") | A pack at the books; a side room with a chest |
| The adit and the workings | Tunnels with timber props; branches to two side chambers (a cave-in, an old store) | The Brakesman at the top of the incline |
| The winding house | The headframe and the drum, half burnt; the way down to the floor below | An elite pack on the gantry |
| The washing floor | The pools and the sluice | The Sluicer and the Raker |
| The rim | The Haulier's ropeway at the lip of the pit | The Haulier, now a mini-boss |
| The terraces | The cut's stepped sides, down to the floor; one branch to a ledge with a chest | Few, tough packs on each step |
| The floor of the Open Cut | The end boss's arena | The end boss (below) |

- **Paths:** early stretches open and simple, later ones narrower, with more branches (dead-end pockets with a chest or
  an elite, never a second route to get lost on). Cliffs, rock and buildings keep the party on the path.
- **Fewer goblins, each a job:** packs of two to four, an elite leading, each goblin about twice today's instance
  health at three heroes, so a pack is a fight, not a sweep. Roughly a third as many goblins on the map as the four
  areas have now.
- **Gates in the map:** a door, a portcullis or a rope bridge between stretches, which waits for the whole party
  and is a checkpoint (as now). Behind it, the stretch already done dozes.

## Mini-boss intros

As a party first comes within sight: the camera pans to it, its name card shows, its scene plays a few seconds
(scripted movement the room decides, so every screen sees the same), and the trick is shown in it: the Drover's line
marched past with CUT FREE shown on a digger; the Brakesman letting the first cart go down a striped lane; the Raker
dragging a fallen Sluicer out to show what it does. No input is taken for those seconds and nothing can hurt you.

## The end boss

Working name THE OVERMAN (the mine's overseer, the one the Haulier hauls for; the lore keeper names it). Three stages,
the arena changing with each:
1. **The tiers:** it stands on the winding gear dropping loads and calling small ones out of the adits; the party
   fights up the terraces to it.
2. **The floor:** it comes down in plate; carts sent at it and storm break the plates (OPEN after each), adds keep
   coming.
3. **The face:** at a third it blasts the cut face; rockfall telegraphs shrink the arena and it goes berserk.

## Loot

The end boss gives **one unique piece to every hero present**, rolled for their class (instead of one for the party),
plus its relic (the Grappling Hook moves to it from the Haulier) and a gold purse. Mini-bosses keep one drop for the
party. (Changes "one drop per boss per run" for end bosses only; Kyle to confirm.)

## Big without lag

What exists: goblins far from every hero doze and aren't stepped (`sim/sleep.ts`); a friend is sent only what's near
them (`client/interest.ts`); the path grid is built once per map (`sim/pathgrid.ts`, 0.5-tile cells). Fenmere is one
76x60 map with 62 goblins and about 2,600 trees today. The budget for the Open Cut map: building it at most 2 s on a
phone; a tick (the room's step) at most 4 ms in the browser with the CPU slowed 4x; a frame drawn at 30 fps or better
there. Step 0 measures a stress map before anything is built on it.

## Build order

0. **Stress test:** a map about twice Fenmere's size (150x150) with paths, 150 goblins and the trees and rock of a
   big map; build time, tick time and frame time in Node and in the browser slowed 4x.
1. **One-map frame:** stretches and in-map gates on one map; checkpoints at gates; the done stretch dozes.
2. **The Open Cut remade** as the stretches above, fewer and tougher goblins.
3. **Mini-boss intros.**
4. **The incline for the Brakesman, the flood for the Sluicer, the Haulier as a mini-boss.**
5. **The end boss**, stage by stage.
6. **Loot:** pools wired to the party roll, per-hero end-boss drops.
