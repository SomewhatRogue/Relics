/**
 * Drawing a hound (a Ranger's, Maeve's by the lodge fire, another player's at their Ranger's heel) and
 * the Ranger's snares. A hound is a sprite of its breed, coat and white in a pose (houndbody.ts, made
 * once and kept), shaded and outlined like the heroes (sprites.ts), facing the way it goes. Flat and
 * 2.5D both draw through here (scene.ts, three/cards3d.ts), so they always agree.
 *
 * The pose comes from the room's hound first (sim/ranger.ts, sim/sic.ts): the run and the lunge as it
 * goes in, the bite, the latch when it pins, bolting with its tail tucked. Then from how it plays
 * (idlehound.ts gives a Mood), then its own pace and idles (houndidle.ts). Drawing only.
 */
import type { Hound, Snare } from '../sim/types';
import { defaultHound, type HoundLook } from '../shared/houndlook';
import { blit, shadow, type Ctx } from './draw';
import { houndMap, type HoundMap, type Pose } from './houndbody';
import { palOf } from './houndcoats';
import { gaitFor, houndBusy, houndSelf, ownPose } from './houndidle';
import { GAIT_FPS, poseOf, type Gait, type PoseName } from './houndposes';
import { HOUND_BOX as BOX, SHAPES } from './houndshapes';
import { drawText, textWidth } from './pixfont';
import { makeSprite, type Sprite } from './sprites';

/**
 * How a hound looks while it plays or is petted (idlehound.ts): its tail going, sitting, a stick in its
 * mouth, its head down to the ground, its tongue out, leaning in a pixel, up off the ground (pixels),
 * running (and how), a play bow, rolled over on its back for a belly rub.
 */
export interface Mood { belly?: boolean; wag?: boolean; sit?: boolean; stick?: boolean; headDown?: boolean; happy?: boolean; lick?: boolean; lean?: number; lift?: number; moving?: boolean; gait?: Gait; bow?: boolean }

/** How to draw one: its mood, facing, lying, which hound it is, the name over it (or none), a fixed pose (look sheets). */
export interface HoundDraw { mood?: Mood; fx?: number; down?: boolean; look?: HoundLook; name?: string; pose?: [PoseName, number]; seed?: number }

const PLAIN = defaultHound('');
const sprites = new Map<string, { s: Sprite; m: HoundMap }>();

/** The sprite (and where its head is) for a hound in a pose, made the first time it's wanted. */
function spriteOf(look: HoundLook, p: Pose): { s: Sprite; m: HoundMap } {
  const key = `${look.breed}${look.coat}${look.mark}${JSON.stringify(p)}`;
  let got = sprites.get(key);
  if (!got) {
    const m = houndMap(look, p);
    sprites.set(key, (got = { s: makeSprite(BOX.w, BOX.h, m.parts), m }));
  }
  return got;
}

/** The pose this frame: the fight first, then play, then its own pace and idles. */
function choose(c: Ctx, d: Hound, o: HoundDraw, down: boolean): Pose {
  const m = o.mood, now = c.now, seed = o.seed ?? 7;
  const wag = m?.wag === undefined ? Math.round(Math.sin(now * 1.7 + seed) * 1.4) * 5 : m.wag ? 24 : -14;
  const gaitPose = (g: Gait, tuck = false) => poseOf(g, Math.floor(now * GAIT_FPS[g]), wag, tuck);
  if (m) houndBusy(d, now, seed);
  if (o.pose) return poseOf(o.pose[0], o.pose[1], wag);
  if (down) return poseOf('down', 0, m?.wag !== undefined ? wag : 0);
  if (m?.belly) return poseOf('belly', Math.floor(now * 3), wag);
  if (d.state === 'fled') return gaitPose('run', true);
  if (d.state === 'bite') {
    if (d.pin) return poseOf('latch', Math.floor(now * 8));
    return d.t < 0.08 ? poseOf('lunge', 1) : poseOf('bite', d.t < 0.22 ? 0 : 1);
  }
  if (d.state === 'run') return d.t < 0.15 ? poseOf('lunge', 0) : gaitPose('run');
  if (m?.sit) return poseOf('sit', 0, wag);
  if (m?.bow) return poseOf('bow', 0, wag);
  if (m?.headDown) return poseOf('sniff', Math.floor(now * 3), wag);
  if ((m?.lift ?? 0) >= 3) return poseOf('leap', 0);
  const self = houndSelf(d, now, seed);
  if (m?.moving ?? d.moving) return gaitPose(m?.gait ?? gaitFor(self.v));
  if (!m && self.idle) {
    const [n, f] = ownPose(self.idle.id, self.idle.t);
    return poseOf(n, f, n === 'down' || n === 'downUp' ? 0 : wag);
  }
  const p = poseOf('stand', 0, wag);
  return m?.happy || m?.wag !== undefined ? { ...p, tail: 'up' } : p;
}

/** The hound at (x, y) on screen, its feet there. */
export function drawHound(c: Ctx, d: Hound, x: number, y: number, o: HoundDraw = {}): void {
  if (d.state === 'fled' && d.t > 2) return;
  const m = o.mood ?? {}, look = o.look ?? PLAIN, f = (o.fx ?? d.fx) >= 0 ? 1 : -1, flip = f < 0;
  const p = choose(c, d, o, o.down ?? !!d.down), { s, m: map } = spriteOf(look, p);
  // (A mood's lean and lift in the old pixels, half as big again for the 1.5x hound.)
  const X = Math.round(x) + f * Math.round((m.lean ?? 0) * 1.5), Y = Math.round(y) - Math.round(1.5 * Math.max(0, (m.lift ?? 0) - (p.lift && (m.lift ?? 0) >= 3 ? 3 : 0)));
  shadow(c, x, y, SHAPES[look.breed].shadow);
  blit(c, s, X, Y + 1, flip);
  // Grid to screen (the sprite's middle column is BOX.x; its ground row is just above the feet line).
  const sx = (gx: number) => (flip ? X - (gx - BOX.x) - 1 : X + (gx - BOX.x)), sy = (gy: number) => Y - 1 + (gy - BOX.ground);
  const px = (gx: number, gy: number, w: number, h: number, col: string) => ((c.lit.fillStyle = col), c.lit.fillRect(flip ? sx(gx + w - 1) : sx(gx), sy(gy), w, h));
  const { jaw, tip, eye, top } = map.at;
  // Eyes shut a moment when it's happy.
  if (m.happy && Math.floor(c.now * 2) % 3 === 0) px(eye[0], eye[1], 1, 1, palOf(look.breed, look.coat).D);
  if (m.happy || m.lick) px(tip - 1, jaw[1], 1, m.lick ? 2 : 1, '#e87a8a');
  // A stick held crosswise in the jaws: out past the nose and back past the cheek.
  if (m.stick) px(jaw[0] - 2, jaw[1], tip - jaw[0] + 5, 1, '#8b6a3a'), px(tip + 2, jaw[1], 1, 1, '#6b4a2b');
  // Worrying something: a tooth.
  if (d.state === 'bite' && !d.pin) px(tip - 1, jaw[1] - 1, 1, 1, '#e8e4ee');
  // Shaking off: a few drops flung.
  if (p.fluff) for (let i = 0; i < 4; i++) px(BOX.x - 6 + i * 4 + p.fluff, top + 2 - ((i + p.fluff) % 2) * 3, 1, 1, '#9fb4c8');
  if (o.name) drawText(c.glow, o.name, Math.round(X - textWidth(o.name) / 2), sy(top) - 6, '#e8d4a0');
}

/** A snare: a loop of rope pegged at both ends, a glint on the peg. */
export function drawSnare(c: Ctx, s: Snare, x: number, y: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y);
  g.fillStyle = '#8a6a3a';
  for (let a = 0; a < Math.PI * 2; a += 0.35) g.fillRect(Math.round(X + Math.cos(a) * 5), Math.round(Y + Math.sin(a) * 2), 1, 1);
  g.fillStyle = '#5a3d22';
  g.fillRect(X - 6, Y - 2, 1, 3);
  g.fillRect(X + 5, Y - 2, 1, 3);
  c.glow.fillStyle = Math.floor(c.now * 2 + s.x) % 3 ? '#9aa3ad' : '#e8f0ff';
  c.glow.fillRect(X + 5, Y - 2, 1, 1);
}
