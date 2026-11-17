"""Shared pieces for Relic's figure models (docs/design/new-figures.md): cel materials, simple shapes, cloth, plates.
Run inside Blender. A figure faces -Y, stands on z = 0 and is measured in metres (a hero about 1.9 tall)."""
import bpy, bmesh, math
from mathutils import Vector

# The light falls in three flat steps of a part's one colour: (from this much light, this share of the colour).
BANDS = ((0.0, 0.2), (0.28, 0.5), (0.6, 1.0))
# Where the light comes from (toward it): the viewer's upper left, in front.
LIGHT = Vector((-1.3, -2.2, 2.6)).normalized()
_mats = {}


def lin(h):
    """'#rrggbb' to linear RGBA (Blender's node colours are linear)."""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1.0]


def mat(hexcol, glow=False):
    """A cel material (or one that glows whole, unlit). Its name is its colour, a `*` after it if it glows."""
    key = hexcol + ('*' if glow else '')
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(key)
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
        while len(els) < len(BANDS):
            els.new(0.5)
        for e, (pos, val) in zip(els, BANDS):
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
    o.data.materials.append(mat(col, glow))
    for p in o.data.polygons:
        p.use_smooth = smooth
    return o


def box(name, size, loc, col, rot=(0, 0, 0), glow=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    bpy.context.active_object.scale = size
    return _done(name, col, False, glow)


def cone(name, r_low, r_high, depth, loc, col, rot=(0, 0, 0), sides=10, squash=(1, 1, 1), smooth=True):
    """A tapered tube standing on its axis: r_low at its foot, r_high at its head."""
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=r_low, radius2=r_high, depth=depth, location=loc, rotation=rot)
    bpy.context.active_object.scale = squash
    return _done(name, col, smooth)


def ball(name, r, loc, col, squash=(1, 1, 1), glow=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=7, radius=r, location=loc)
    bpy.context.active_object.scale = squash
    return _done(name, col, True, glow)


def along(o, d):
    """Turn an object so its own Z runs along `d`."""
    o.rotation_euler = Vector(d).normalized().to_track_quat('Z', 'Y').to_euler()
    return o


def _mesh(name, bm, col, smooth):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat(col))
    for p in o.data.polygons:
        p.use_smooth = smooth
    return o


def sheet(name, rows, col, n=7, rag=0.0):
    """A cloth: rows of (z, half width, y at the middle, y at the edges), joined into a sheet with soft folds.
    `rag` lifts every other point of its last row by that much: a torn hem."""
    bm = bmesh.new()
    grid = []
    for k, (z, hw, ym, ye) in enumerate(rows):
        line = []
        for i in range(n):
            t = i / (n - 1) * 2 - 1
            up = rag * (i % 2) if k == len(rows) - 1 else 0.0
            line.append(bm.verts.new((t * hw, ym + (ye - ym) * t * t + 0.02 * math.sin(i * 2.1), z + up)))
        grid.append(line)
    for a, b in zip(grid, grid[1:]):
        for i in range(n - 1):
            bm.faces.new((a[i], b[i], b[i + 1], a[i + 1]))
    return _mesh(name, bm, col, True)


def plate(name, pts, thick, loc, col, rot=(0, 0, 0)):
    """A flat plate cut to an outline: `pts` are (x, z) round its edge, counter-clockwise seen from the front (-Y)."""
    bm = bmesh.new()
    front = [bm.verts.new((x, -thick / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, thick / 2, z)) for x, z in pts]
    bm.faces.new(front[::-1])
    bm.faces.new(back)
    k = len(pts)
    for i in range(k):
        j = (i + 1) % k
        bm.faces.new((front[i], front[j], back[j], back[i]))
    o = _mesh(name, bm, col, False)
    o.location = loc
    o.rotation_euler = rot
    return o
