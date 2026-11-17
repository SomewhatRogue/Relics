# Figure models (docs/design/new-figures.md)

Blender scripts that build Relic's new figures from simple shapes with flat cel colours, pose them, and bake them
for the game. Checked with Blender 5.2, headless.

- `kit.py`: the shared pieces (cel materials, shapes, cloth, plates, the light).
- `rig.py`: a skeleton of named joints with rigid parts hung on them; poses; the model and its moves as data.
- `moves.py`: a hero's moves as poses (guard, walk, a sword blow), driven by ground covered and the blow's own time.
- `knight.py`: the knight on that skeleton.
- `bake.py`: everything out of Blender in about 16 seconds:

      blender --background --factory-startup --python scripts/figures/bake.py -- <outdir> [look]

  `knight-sheet.png` (8 facings by 20 frames, no smoothing, 70 pixels tall), `knight.json` (the model and every
  move's samples, to draw him live) and `knight-look.png` (a few poses big, to check by eye; `look` bakes only this).

A figure faces -Y, stands on z = 0 and is measured in metres (a hero about 1.9 tall). 'L' and 'R' are the viewer's
left and right when the figure faces them. Nothing thinner than about 3 cm: a pixel is 2.5 cm.
