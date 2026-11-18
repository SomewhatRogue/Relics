/**
 * A wolf (the keepers' pack, sim/keeper.ts) at 1.5x (art pass slice 7): drawn by the hound's own body
 * (houndbody.ts) as a rough grey wolfhound, darkened a step so it reads feral, with eyes that catch the
 * light (gold, as the wolf's always were), so it never reads as a Ranger's hound. It trots, crouches through
 * the wind-up and stretches out in the dart, from the room's own attack clock. Dead, it lies as it did.
 */
import type { Enemy } from '../sim/types';
import { blit, shadow, stars, type Ctx } from './draw';
import { houndMap, type HoundMap, type Pose } from './houndbody';
import { poseOf } from './houndposes';
import { HOUND_BOX as BOX } from './houndshapes';
import { makeSprite, type Part, type Sprite } from './sprites';
import { gobPen } from './gobpen';

const LOOK = { breed: 'wolfhound', coat: 0, mark: 'none', name: '' } as const;
const EYE = '#ffd040', FUR2 = '#7a7880';

/** A colour a step darker (the wolf's coat over the hound's). */
const dark = (c: string) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.72).toString(16).padStart(2, '0')).join('');

/**
 * Sprites by the picture they draw: the body's parts and where its head is, so poses that come out the same
 * (a standing wolf's tail swings through a new number every frame) share one, and poses seen lately by
 * their own text so most frames build nothing. Both lists are capped, oldest out.
 */
type Made = { s: Sprite; m: HoundMap };
const CAP = 96, byPose = new Map<string, Made>(), byPicture = new Map<string, Made>();
const keep = (into: Map<string, Made>, key: string, v: Made) => {
  if (into.size >= CAP) into.delete(into.keys().next().value!);
  into.set(key, v);
};
function sprite(p: Pose): Made {
  const key = JSON.stringify(p);
  let got = byPose.get(key);
  if (!got) {
    const m = houndMap(LOOK, p), pic = JSON.stringify(m);
    got = byPicture.get(pic);
    if (!got) keep(byPicture, pic, (got = { s: makeSprite(BOX.w, BOX.h, m.parts.map((q) => [...q.slice(0, -1), dark(q[q.length - 1] as string)] as Part)), m }));
    keep(byPose, key, got);
  }
  return got;
}

export function drawWolf(c: Ctx, e: Enemy, x: number, y: number): void {
  const f = e.fx < -0.2 ? -1 : 1, a = e.attack, t = c.t ?? c.now;
  if (e.act === 'dead') {
    // Lying where it fell, fading (in the old pixels, through the pen).
    const p = gobPen(c, x, y), g = p.lit, fade = Math.max(0, 1 - e.actT / Math.max(1, e.actDur));
    g.globalAlpha = fade;
    (g.fillStyle = FUR2), g.fillRect(Math.round(x - 6), Math.round(y - 3), 12, 3);
    (g.fillStyle = '#7a1d1d'), g.fillRect(Math.round(x - 2), Math.round(y - 1), 4, 1);
    g.globalAlpha = 1;
    return;
  }
  const wind = a && a.t < a.windup, dart = a && a.t >= a.windup && a.t < a.windup + a.active;
  const p = wind ? poseOf('bow', 0) : dart ? poseOf('lunge', Math.floor(c.now * 10) % 2) : e.moving ? poseOf('run', Math.floor(c.now * 13 + e.id)) : poseOf('stand', 0, Math.sin(c.now * 2 + e.id) * 6);
  const { s, m } = sprite(p), X = Math.round(x), Y = Math.round(y) - (dart ? 3 : 0);
  shadow(c, x, y, 9);
  blit(c, s, X, Y + 1, f < 0, t - e.hitAt < 0.09 ? 0.9 : 0);
  // The eyes catching the light (unlit, on the glow layer), from where the body says its eye is.
  const [ex, ey] = m.at.eye, sx = f < 0 ? X - (ex - BOX.x) - 1 : X + (ex - BOX.x), sy = Y - 1 + (ey - BOX.ground);
  c.glow.fillStyle = EYE;
  c.glow.fillRect(sx, sy, 1, 1);
  if ((e.scatterUntil ?? -9) > t) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(sx + f, sy - 3, 1, 2);
  if (e.act === 'stunned') stars(c, x, y - 15, 3, 6);
}
