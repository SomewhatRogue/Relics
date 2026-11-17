"""Shared helpers for Relic's figure models: cel materials, simple shapes, the camera and light, a render.
Run inside Blender (blender --background --factory-startup --python <figure>.py -- <out.png> [yaw]).
A figure faces -Y, stands on z = 0, and is measured in metres (a hero about 1.9 tall)."""
import bpy, bmesh, math
from mathutils import Vector

_mats = {}


def lin(h):
    """'#rrggbb' to linear RGBA (Blender's node colours are linear)."""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1.0]


def mat(hexcol, bands=((0.0, 0.42), (0.3, 0.7), (0.62, 1.0)), glow=False):
    """A cel material: the light falls in three flat steps of the one colour (or none: it glows whole)."""
    key = (hexcol, glow)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(hexcol)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(em.outputs[0], out.inputs[0])
    if glow:
        em.inputs[0].default_value = lin(hexcol)
    else:
        dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
        dif.inputs[0].default_value = (1, 1, 1, 1)
        s2 = nt.nodes.new('ShaderNodeShaderToRGB')
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.interpolation = 'CONSTANT'
        els = ramp.color_ramp.elements
        while len(els) < len(bands):
            els.new(0.5)
        for e, (pos, val) in zip(els, bands):
            e.position = pos
            e.color = (val, val, val, 1)
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1.0
        mix.inputs[7].default_value = lin(hexcol)
        nt.links.new(dif.outputs[0], s2.inputs[0])
        nt.links.new(s2.outputs[0], ramp.inputs[0])
        nt.links.new(ramp.outputs[0], mix.inputs[6])
        nt.links.new(mix.outputs[2], em.inputs[0])
    _mats[key] = m
    return m


def _done(name, col, smooth, glow=False):
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat(col, glow=glow))
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    return o


def box(name, size, loc, col, rot=(0, 0, 0), glow=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    bpy.context.active_object.scale = size
    return _done(name, col, False, glow)


def cone(name, r_low, r_high, depth, loc, col, rot=(0, 0, 0), sides=12, squash=(1, 1, 1), smooth=True):
    """A tapered tube standing on its axis: r_low at its foot, r_high at its head."""
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=r_low, radius2=r_high, depth=depth, location=loc, rotation=rot)
    bpy.context.active_object.scale = squash
    return _done(name, col, smooth)


def ball(name, r, loc, col, squash=(1, 1, 1), glow=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=r, location=loc)
    bpy.context.active_object.scale = squash
    return _done(name, col, True, glow)


def along(o, d):
    """Turn an object so its own Z runs along `d`."""
    o.rotation_euler = Vector(d).normalized().to_track_quat('Z', 'Y').to_euler()
    return o


def sheet(name, rows, col):
    """A cloth: rows of (z, half width, y at the middle, y at the edges), joined into a two-sided sheet with folds."""
    bm = bmesh.new()
    n = 9
    grid = []
    for z, hw, ym, ye in rows:
        line = []
        for i in range(n):
            t = i / (n - 1) * 2 - 1
            fold = 0.018 * math.sin(i * 2.4 + z * 5.0) * (1.6 - z / 1.6)
            line.append(bm.verts.new((t * hw, ym + (ye - ym) * t * t + fold, z)))
        grid.append(line)
    for a, b in zip(grid, grid[1:]):
        for i in range(n - 1):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat(col))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def taper(o, z_below, k):
    """Pull in everything below a height (object space, -0.5 to 0.5): a shield's point, a blade's tip."""
    for v in o.data.vertices:
        if v.co.z < z_below:
            v.co.x *= k
    return o


def stage(height=2.7, px=960, yaw=22, lift=10, look=1.05, bg=None):
    """Camera (orthographic, a little above and to one side), one sun from the upper left, a flat backdrop."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = int(px * 0.66)
    sc.render.resolution_y = px
    # (No backdrop unless one is asked for: the figure alone, for cutting into the game's pictures.)
    sc.render.film_transparent = bg is None
    sc.render.image_settings.color_mode = 'RGBA'
    bg = bg or '#4a4e5a'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = lin(bg)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    sc.world = w
    az, el = math.radians(yaw), math.radians(lift)
    target = Vector((0, 0, look))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = height
    cam.location = target + 8 * Vector((-math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(cam)
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3.2
    sun.rotation_euler = Vector((1.3, 2.2, -2.6)).to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(sun)
    return sc


def render(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    print('RENDERED', path)
