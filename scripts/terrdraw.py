# A territory plan (scripts/terrmap.ts JSON) drawn as a picture: python3 scripts/terrdraw.py plan.json out.png [pixels a tile]
import json, sys
from PIL import Image, ImageDraw
plan = json.load(open(sys.argv[1])); out = sys.argv[2]; S = int(sys.argv[3]) if len(sys.argv) > 3 else 10
m = plan['map']; W, H = m['w'], m['h']
im = Image.new('RGB', (W*S, H*S), (70, 96, 60)); d = ImageDraw.Draw(im, 'RGBA')
def box(x, y, w, h, fill=None, outline=None, width=1): d.rectangle([x*S, y*S, (x+w)*S, (y+h)*S], fill=fill, outline=outline, width=width)
SOIL = {'earth': (120, 96, 70), 'furrow': (132, 110, 70), 'crop': (196, 170, 70), 'grass': (80, 110, 64), 'mud': (84, 70, 56), 'straw': (190, 170, 100), 'cobble': (120, 120, 126), 'wet': (60, 80, 84), 'swept': (140, 120, 90), 'ash': (70, 70, 70), 'flags': (130, 130, 136), 'shade': (40, 60, 40)}
for s in m.get('soil', []):
    c = SOIL.get(s['mat'], (255, 0, 255))
    if 'line' in s and s['line'] is not None:
        d.line([s['x']*S, s['y']*S, (s['x']+s['w'])*S, (s['y']+s['h'])*S], fill=c, width=max(1, int(s['line']*2*S)))
    elif s.get('round'): d.ellipse([s['x']*S, s['y']*S, (s['x']+s['w'])*S, (s['y']+s['h'])*S], fill=c)
    else: box(s['x'], s['y'], s['w'], s['h'], fill=c)
# levels: lighten by level
for l in sorted(m.get('ledges', []), key=lambda l: l.get('lv', 1)):
    box(l['x'], l['y'], l['w'], l['h'], fill=(255, 255, 255, 34))
    box(l['x'], l['y'], l['w'], l['h'], outline=(40, 30, 20, 255), width=2)
for l in m.get('ledges', []):
    for r in l['ramps']:
        box(r['x'], r['y'], r['w'], r['h'], fill=(120, 200, 120, 150))
        for i in range(int(r['w'])): d.line([(r['x']+i+.5)*S, r['y']*S, (r['x']+i+.5)*S, (r['y']+r['h'])*S], fill=(30, 90, 30, 255))
for w in m.get('water', []): box(w['x'], w['y'], w['w'], w['h'], fill=(30, 50, 110) if w.get('deep') else (80, 130, 170))
for k in m.get('marks', []): box(k['x'], k['y'], k['w'], k['h'], outline=(200, 160, 90, 255))
RC = {'tree': (30, 70, 30), 'pine': (20, 60, 40), 'deadtree': (70, 60, 50), 'bush': (40, 90, 40), 'hay': (220, 190, 80), 'rock': (110, 110, 110), 'stump': (90, 70, 50), 'post': (60, 40, 30), 'scarecrow': (200, 60, 160)}
for r in m['rounds']:
    c = RC.get(r['kind'], (255, 0, 255)); d.ellipse([(r['x']-r['r'])*S, (r['y']-r['r'])*S, (r['x']+r['r'])*S, (r['y']+r['r'])*S], fill=c)
BC = {'gate': (230, 40, 40), 'cart': (150, 100, 50), 'barn': (120, 60, 40), 'fence': (90, 60, 30), 'rockwall': (60, 60, 60), 'pen': (90, 60, 30)}
for i, b in enumerate(m['blocks']):
    box(b['x'], b['y'], b['w'], b['h'], fill=BC.get(b['kind'], (255, 0, 255)), outline=(0, 0, 0, 255))
    if b['kind'] in ('barn', 'gate', 'cart'): d.text((b['x']*S+2, b['y']*S+1), b['kind'], fill=(255, 255, 255))
for b in m.get('braziers', []): d.ellipse([(b['x']-.3)*S, (b['y']-.3)*S, (b['x']+.3)*S, (b['y']+.3)*S], fill=(255, 150, 30))
for p in plan['props']:
    c = (255, 255, 255) if p['kind'] == 'cage' else (200, 200, 255)
    box(p['x']-.4, p['y']-.4, .8, .8, fill=c, outline=(0, 0, 0, 255)); d.text(((p['x']+.5)*S, (p['y']-.5)*S), p['kind'], fill=(255, 255, 255))
for c in plan['chests']: box(c['x']-.35, c['y']-.3, .7, .6, fill=(255, 215, 0), outline=(0, 0, 0, 255))
PK = {}
for f in plan['foes']:
    col = (255, 60, 60) if f.get('bow') else (160, 255, 60)
    d.ellipse([(f['x']-.35)*S, (f['y']-.35)*S, (f['x']+.35)*S, (f['y']+.35)*S], fill=col, outline=(0, 0, 0, 255))
    d.text(((f['x']+.4)*S, (f['y']-.4)*S), str(f.get('pack', '')) + (' ' + f['variant'] if f.get('variant') else ''), fill=(255, 255, 255))
for z in plan.get('zones', []):
    box(z['x'], z['y'], z['w'], z['h'], outline=(255, 255, 255, 200) if z['kind'] == 'zone' else (140, 200, 255, 200), width=2)
    d.text((z['x']*S+4, z['y']*S+3), f"{z['name']} ({z['kind']}, st {z['stretch']})", fill=(255, 255, 255))
for s in m.get('stretches', []):
    if s.get('at'): box(s['at']['x'], s['at']['y'], s['at']['w'], s['at']['h'], outline=(255, 255, 0, 255), width=2)
    if s.get('check'): d.ellipse([(s['check']['x']-.3)*S, (s['check']['y']-.3)*S, (s['check']['x']+.3)*S, (s['check']['y']+.3)*S], fill=(255, 255, 0))
h = m['hero']; d.ellipse([(h['x']-.4)*S, (h['y']-.4)*S, (h['x']+.4)*S, (h['y']+.4)*S], fill=(60, 160, 255), outline=(255, 255, 255))
e = m['exit']; box(e['x'], e['y'], e['w'], e['h'], fill=(60, 255, 255))
for y in range(0, H, 10): d.text((2, y*S), str(y), fill=(255, 255, 255))
im.save(out); print(out, im.size)
