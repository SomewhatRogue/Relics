"""A figure's skeleton: named joints in a tree, rigid parts hung on them, a pose as degrees a joint, and the export
of the model and its moves for the game (the parts in their joints' own space, each sample's joints as a turn and a place).
'L' is the viewer's left when the figure faces them (-X), 'R' the viewer's right (+X)."""
import bpy, math
from mathutils import Euler, Matrix, Vector


class Rig:
    def __init__(self):
        self.j, self.rest, self.parent, self.parts = {}, {}, {}, []
        self.joint('root', None, (0, 0, 0))

    def joint(self, name, parent, pos):
        e = bpy.data.objects.new('j_' + name, None)
        bpy.context.collection.objects.link(e)
        if parent:
            e.parent = self.j[parent]
        e.location = Vector(pos) - (Vector(self.rest[parent]) if parent else Vector())
        self.j[name], self.rest[name], self.parent[name] = e, tuple(pos), parent
        return e

    def hang(self, name, *objs):
        """Parts made where they sit at rest, now carried by a joint."""
        inv = Matrix.Translation(-Vector(self.rest[name]))
        for o in objs:
            o.parent = self.j[name]
            o.matrix_parent_inverse = inv
            self.parts.append((name, o))

    def pose(self, p, yaw=0.0):
        """`p`: joint name to (x, y, z) degrees, and `<joint>_at` to metres it is moved from where it rests; `_at`
        moves the whole figure; `yaw` turns it (0 faces the viewer)."""
        for n, e in self.j.items():
            r = p.get(n, (0, 0, 0))
            e.rotation_euler = Euler([math.radians(v) for v in r], 'XYZ')
            if n != 'root':
                e.location = Vector(self.rest[n]) - Vector(self.rest[self.parent[n]]) + Vector(p.get(n + '_at', (0, 0, 0)))
        root, r = self.j['root'], p.get('root', (0, 0, 0))
        root.rotation_euler = Euler((math.radians(r[0]), math.radians(r[1]), math.radians(r[2] + yaw)), 'XYZ')
        root.location = Vector(p.get('_at', (0, 0, 0)))
        bpy.context.view_layer.update()

    def model(self):
        """Every part as flat triangles in its joint's space: positions and normals in millimetres and thousandths."""
        deps, out = bpy.context.evaluated_depsgraph_get(), []
        self.pose({})
        for name, o in self.parts:
            m = o.matrix_parent_inverse @ o.matrix_basis
            nm = m.to_3x3().inverted().transposed()
            me = o.evaluated_get(deps).to_mesh()
            me.calc_loop_triangles()
            by = {}
            for t in me.loop_triangles:
                key = me.materials[t.material_index].name if me.materials else '#888888'
                pos, nor = by.setdefault(key, ([], []))
                for li, vi in zip(t.loops, t.vertices):
                    v = m @ me.vertices[vi].co
                    n = (nm @ (me.corner_normals[li].vector if t.use_smooth else t.normal)).normalized()
                    pos += [round(c * 1000) for c in v]
                    nor += [round(c * 1000) for c in n]
            for key, (pos, nor) in by.items():
                out.append({'joint': name, 'name': o.name.split('.')[0], 'col': key[:7], 'glow': key.endswith('*'), 'inner': o.get('inner'), 'pos': pos, 'nor': nor})
        return out

    def sample(self, p):
        """One pose as the game reads it: each joint's turn (w, x, y, z) and place, the figure facing the viewer."""
        self.pose(p)
        out = {}
        for n, e in self.j.items():
            loc, rot, _ = e.matrix_world.decompose()
            out[n] = [round(v, 4) for v in (rot.w, rot.x, rot.y, rot.z)] + [round(v, 4) for v in loc]
        return out
