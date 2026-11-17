"""Bake a figure out of Blender for the game (docs/design/new-figures.md), three things into <outdir>:
  <name>-sheet.png  its moves as pixel frames with no smoothing: a row a facing (8, from facing you, turning toward
                    the viewer's right), a column a frame, each cell CELL wide and tall, the feet at FEET;
  <name>.json       the model (rig.py) and every move's samples, for drawing it live, with the sheet's layout;
  <name>-look.png   a few poses big and smooth, to check the model by eye.
blender --background --factory-startup --python scripts/figures/bake.py -- <outdir> [look] [sheet]
(look: only the big picture; sheet: the pixel frames too, plain cel: the game's own drawer has the final shading)"""
import bpy, json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector
import kit, knight, moves

# The camera looks down on the figure from this many degrees above level (a little: figures are drawn nearly from
# the front even on a floor seen from above, as the game's own sprites are); PPM pixels a metre makes him 70 tall.
EL, PPM, CELL, FEET = 6.0, 37, (144, 152), (72, 136)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = args[0] if args else 'out'
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
rig = knight.build()
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w')
w.use_nodes = True
w.node_tree.nodes['Background'].inputs[1].default_value = 0.0
sc.world = w
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
sun.data.energy = math.pi
sun.data.use_shadow = False
sun.rotation_euler = (-kit.LIGHT).to_track_quat('-Z', 'Y').to_euler()
sc.collection.objects.link(sun)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
cam.data.type = 'ORTHO'
sc.collection.objects.link(cam)
sc.camera = cam
el = math.radians(EL)
fwd, up = Vector((0, math.cos(el), -math.sin(el))), Vector((0, math.sin(el), math.cos(el)))


def frame(w_px, h_px, ppm, feet, smooth):
    """The camera for a w by h picture at `ppm` pixels a metre with the figure's feet at pixel `feet`."""
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w_px, h_px, 100
    cam.data.ortho_scale = max(w_px, h_px) / ppm
    target = up * ((feet[1] - h_px / 2) / ppm) + Vector((1, 0, 0)) * ((w_px / 2 - feet[0]) / ppm)
    cam.location = target - fwd * 12
    cam.rotation_euler = fwd.to_track_quat('-Z', 'Y').to_euler()
    # One sample and the narrowest filter: every pixel wholly a part's colour or wholly empty.
    sc.eevee.taa_render_samples = 16 if smooth else 1
    sc.render.filter_size = 1.5 if smooth else 0.01


def shot(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
    bpy.data.images.remove(img)
    return px


def save(px, path):
    img = bpy.data.images.new('out', px.shape[1], px.shape[0], alpha=True)
    img.pixels.foreach_set(px.astype(np.float32).ravel())
    img.filepath_raw, img.file_format = path, 'PNG'
    img.save()
    bpy.data.images.remove(img)


tmp = os.path.join(out, '_frame.png')
# The big look, three across and two down: guard from the front, the side and behind; a walking step, the blow
# raised and through.
k = 3
frame(CELL[0] * k, CELL[1] * k, PPM * k, (FEET[0] * k, FEET[1] * k), True)
looks = [(moves.idle(0), 0), (moves.idle(0), 90), (moves.idle(0), 180), (moves.walk(0.25), 45), (moves.strike(moves.WINDUP), 90), (moves.strike(moves.WINDUP + 0.12), 90)]
cw, ch = CELL[0] * k, CELL[1] * k
big = np.zeros((ch * 2, cw * 3, 4), dtype=np.float32)
for i, (p, yaw) in enumerate(looks):
    rig.pose(p, yaw)
    big[(1 - i // 3) * ch:(2 - i // 3) * ch, (i % 3) * cw:(i % 3 + 1) * cw] = shot(tmp)
back = np.array(kit.lin('#4a4e5a')[:3]) ** (1 / 2.2)
big[..., :3] = big[..., :3] * big[..., 3:4] + back * (1 - big[..., 3:4])
big[..., 3] = 1
save(big, os.path.join(out, 'knight-look.png'))
print('BAKED look')

sheet = np.zeros((1, 1, 4), dtype=np.float32)
if 'sheet' in args:
    frame(CELL[0], CELL[1], PPM, FEET, False)
    cols, layout, x = sum(n // 2 for _, _, n in moves.CLIPS), {}, 0
    sheet = np.zeros((CELL[1] * 8, CELL[0] * cols, 4), dtype=np.float32)
    for name, fn, n in moves.CLIPS:
        layout[name] = [x, n // 2]
        for i in range(n // 2):
            for d in range(8):
                rig.pose(fn(i * 2 / n), d * 45)
                px = shot(tmp)
                px[..., 3] = (px[..., 3] >= 0.5)
                # (Row 0 of the sheet is its top; Blender's pictures run bottom up.)
                sheet[(7 - d) * CELL[1]:(8 - d) * CELL[1], (x + i) * CELL[0]:(x + i + 1) * CELL[0]] = px
        x += n // 2
    save(sheet, os.path.join(out, 'knight-sheet.png'))
if 'look' not in args:
    layout, x = {}, 0
    for name, fn, n in moves.CLIPS:
        layout[name], x = [x, n // 2], x + n // 2
    data = {
        'cell': CELL, 'feet': FEET, 'ppm': PPM, 'el': EL, 'light': [round(v, 4) for v in kit.LIGHT], 'bands': kit.BANDS, 'stride': moves.STRIDE, 'windup': moves.WINDUP,
        'sheet': layout, 'parent': rig.parent, 'parts': rig.model(),
        'clips': {name: [rig.sample(fn(i / n)) for i in range(n)] for name, fn, n in moves.CLIPS},
    }
    json.dump(data, open(os.path.join(out, 'knight.json'), 'w'), separators=(',', ':'))
    print('BAKED sheet', sheet.shape, 'parts', len(data['parts']), 'tris', sum(len(p['pos']) for p in data['parts']) // 9)
os.remove(tmp)
