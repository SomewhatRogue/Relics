# Blender briefs: Wickhold's landmarks

For the new look (docs/design/new-look.md, `?look=3d&hd&street`). Today each landmark is a generated picture on a
flat front with a box behind it (three/streetbuild.ts), which reads well head-on and goes thin as the chase camera
swings round. Modelled in Blender, a landmark holds up from every side the camera can see, while keeping the
pictures' look. One brief per landmark:

- [church.md](church.md): the church on Kirkhill
- [town-hall.md](town-hall.md): the town hall on the square
- [drowned-rat.md](drowned-rat.md): the Drowned Rat
- [forge.md](forge.md): the forge on Smiths' Lane

## Rules for all four

**Scale and axes.** One Blender unit is one tile. Heroes stand about 2.5 tiles tall; a door is 1.6 to 2 tiles high
and about 1.2 wide (a hero walks in, not ducks). Y up in the game (Blender's Z up is fine; export with "+Y up").
The front faces **+Z in the game (south, toward the camera)**, which is Blender's **-Y**. The origin sits on the
ground at the middle of the front, under the door. Model it straight: the game turns it toward the middle of town
(up to 15 degrees) and to whichever way its block faces in the new layout (docs/design/town-layout.md).

**Footprint.** The room's block (where you can't walk) is fixed by the town map, given in each brief. The model may
overhang it by up to a tile at the front (steps, a jetty, a porch) and half a tile at the sides; never into a lane
beyond that, and never over the door spot (the block's front middle, 0.45 tiles out). The town layout chat may
change footprints; check `src/shared/town.ts` (or its new layout) before starting, and fit the model to it.

**Look.** Match the kit pictures (`src/client/three/kit/land-<kind>-<n>.png`, four takes each) and the concepts
(`docs/design/ref/concept-squares.png`, `dense-town-night.png`, `town-chase-camera.png`). Dark timber, grey-green
stone, grimy cream plaster, slate roofs with moss, iron and a little gold. Chunky, readable shapes: this is seen
from 30 to 60 tiles away through a 28 degree lens, so a detail smaller than a third of a tile won't show.

**Textures: pixel art, not photo.** Texel density 32 px a tile on walls and roofs (the kit's swatches:
`mat-stone`, `mat-slate`, `mat-timber`, `mat-planks`, `mat-flags`, `mat-cobble` in `src/client/three/kit/`, 64 px
squares that tile mirrored). Paint or bake at 32 px a tile and snap to a small palette with no dither
(`scripts/kitprep.py`'s `crisp` does this to any picture). Nearest sampling, no mipmaps. One atlas per landmark,
1024 or 2048 square at most. The kit pictures can be projected onto the front and cut up for details (the rose
window, the clock, the tankard sign).

**Lit windows.** Window glass, a lit doorway, lanterns and the forge's fire in a second material named `glow`
(emissive, its own colours), so the game lights them by the hour as it does the kit's `-glow.png` masks.

**Budget.** Under 4,000 triangles each (most of the look is in the texture). Flat-shaded faces; no normal maps.

**Export.** glTF binary (`.glb`), textures embedded, to `src/client/three/kit/models/<name>.glb`. Name the roof
meshes `roof*` (the see-through hole may treat them apart later). The buildings and camera chat wires them in
behind `?street`: a model, where present, replaces that landmark's picture front.

**Check before handing over.** Seen from the south at the camera's angle (looking down 26 degrees) and swung 45
degrees either way, its silhouette still says what it is; the door is where the room's door is; nothing goes
through the neighbours' fronts.
