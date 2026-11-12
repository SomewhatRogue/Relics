/**
 * Drawing goblins and dummies, with wind-ups that match their telegraphs: the butcher hauls his
 * cleaver back and chops, or leaps and comes down on the slam; scrappers pull the knife back and stab.
 */
import type { GameMap } from '../shared/arena';
import { GUARD, HERO, HEMPEN_BOSS } from '../shared/tuning';
import type { Enemy, EnemyAttack } from '../sim/types';
import { isRound } from '../sim/types';
import { drawRoundSign } from './telegraph2';
import { drawKit } from './backline';
import { KITTED, drawFoeKit } from './foekits';
import { drawIronhide } from './ironhidedraw';
import { drawHaulier } from './hauldraw';
import { boardOut } from '../sim/board';
import { drawLessonMark } from './lessonfoes';
import { drawLogs, drawLogsDead } from './foedraw';
import { drawMound, drawWolf } from './beastdraw';
import { drawAsh, drawEaten, drawFed, drawMealing } from './remainsdraw';
import { blit, blitBody, ease, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { armOffset, drawFigure, layout } from './figure';
import { BUTCHER_CUT, SCRAPPER_CUT, jointed } from './joints';
import { butcherPose, foeHit, scrapperPose, tumble } from './foepose';
import { rest, newPose } from './motion';
import { drawText } from './pixfont';
import { SPRITES, grow, makeSprite, type Sprite } from './sprites';
import { butcherLook, butcherParts, type Arms } from './butcherparts';
import { drawPounce, drawSpiderKind, drawSpitSign } from './spiders';
import { SPIDER_SPRITES } from './spidersprites';
import { isSpiderKind } from '../shared/spiders';

const ARM: [number, number] = [0, 0];
/** Where scrapper() last put the body and the weapon hand (pixels from the feet), for its kit. */
const AT = { bx: 0, by: 0, hx: 0, hy: 0 };
import { OX, OY, PX } from './world';
import { HS, hline, hs } from './heroscale';
import { gobPen } from './gobpen';
import { drawWounds, hurtPose } from './wounds';

/** A butcher's weapon along `a` from the hand, its look (butcherparts.ts); lengths in the old pixels, drawn 1.5x. */
function cleaver(c: Ctx, x: number, y: number, a: number, arms: Arms = 'cleaver', now = 0): void {
  const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
  if (arms === 'hook') {
    // A meat hook on a short haft: the curve turned back at the end, a point.
    hline(c.lit, x, y, a, 0, 6, '#4a3a2a', 2);
    hline(c.lit, x, y, a, 6, 10, '#8a8690', 2);
    hline(c.lit, x + Math.cos(a) * 15, y + Math.sin(a) * 15, a + Math.PI * 0.75, 0, 4, '#8a8690', 2);
    return void hline(c.lit, x + Math.cos(a) * 15 + nx * 4, y + Math.sin(a) * 15 + ny * 4, a + Math.PI, 0, 2, '#c8c4bc');
  }
  if (arms === 'maul') {
    // A long haft and an iron-shod block of a head.
    hline(c.lit, x, y, a, -1, 9, '#5a3d22', 2);
    hline(c.lit, x + nx * -2, y + ny * -2, a, 8, 12, '#5a5660', 3);
    return void hline(c.lit, x + nx * 2, y + ny * 2, a, 8, 12, '#6a6470', 3);
  }
  if (arms === 'poker') {
    // The Stoker's iron, its end glowing from the furnace.
    hline(c.lit, x, y, a, -1, 9, '#3a3436', 2);
    c.glow.globalAlpha = 0.75 + 0.25 * Math.sin(now * 7);
    hline(c.glow, x, y, a, 9, 12, '#ff8a3a', 2);
    return void (c.glow.globalAlpha = 1);
  }
  hline(c.lit, x, y, a, 0, 4, '#4a3a2a', 2);
  hline(c.lit, x, y, a, 4, 11, '#9a968c', 4);
  hline(c.lit, x + nx * 2, y + ny * 2, a, 5, 11, '#e0dcd0');
}

/** A named butcher's own sprites, made the first time it's seen (butcherparts.ts). */
const BUTCHERS = new Map<string, { down: Sprite; up: Sprite; cut: typeof BUTCHER_CUT; k: number }>();
const hempenOf = (e: Enemy): 1 | 2 | undefined => (e.boss?.who === 'hempen' ? (e.hp < e.maxHp * HEMPEN_BOSS.phase2 ? 2 : 1) : undefined);
/** The Doorkeepers stand a size up: the butcher's shapes drawn again 1.15 as big (sprites.ts `grow`), never stretched. */
const KEEPER = 1.15;
const isKeeper = (e: Enemy) => e.boss?.who === 'latch' || e.boss?.who === 'hasp';
function butcherSprites(e: Enemy): { down: Sprite; up: Sprite; cut: typeof BUTCHER_CUT; k: number } {
  const l = butcherLook(e.name, e.variant, hempenOf(e)), k = isKeeper(e) ? KEEPER : 1, key = `${l.build}.${l.trophy}.${l.soot}.${l.hempen ?? 0}.${l.tone ?? 0}.${k}`;
  let s = BUTCHERS.get(key);
  if (!s) {
    const make = (up: boolean) => makeSprite(Math.round(27 * k), Math.round(33 * k), k === 1 ? butcherParts(l, up) : grow(butcherParts(l, up), k));
    const C = BUTCHER_CUT, r = (v: number) => Math.round(v * k);
    BUTCHERS.set(key, (s = { down: make(false), up: make(true), cut: { headTo: r(C.headTo), hip: r(C.hip), back: C.back.map(r) as typeof C.back, arm: C.arm.map(r) as typeof C.arm }, k }));
  }
  return s;
}

function butcher(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  const fa = Math.atan2(e.fy, e.fx), side = e.fx >= -0.2 ? 1 : -1, a = e.attack;
  // The body (foepose.ts); the cleaver's swing is drawn here, from the same clock.
  const pz = butcherPose(e, t, c.now);
  let arm = fa + side * 1.25;
  let trail: [number, number] | null = null;
  if (pz.phase === 'rest' && e.moving) pz.oy = Math.floor(c.now * 5) % 2 ? -1 : 0;
  hurtPose(pz, e, c.now);
  if (a && a.kind === 'cleave') {
    const half = ((a.arc / 2) * Math.PI) / 180, back = fa - side * (half + 1.5), end = fa + side * half;
    if (a.t < a.windup) arm = arm + (back - arm) * ease(a.t / (a.windup * 0.8));
    else if (a.t < a.windup + a.active + 0.06) {
      arm = back + (end - back) * Math.min(1, (a.t - a.windup) / a.active);
      trail = [back, arm];
    } else arm = end;
  } else if (a && a.kind === 'slam') {
    if (a.t < a.windup) arm = -Math.PI / 2 + Math.sin(c.now * 18) * 0.15 * (a.t / a.windup > 0.7 ? 1 : 0);
    else if (a.t < a.windup + a.active + 0.1) arm = fa + side * 0.4;
    else arm = fa + side * 0.6;
  } else if (a && a.kind === 'charge') arm = a.t < a.windup ? fa - side * 1.9 : fa + side * 0.3;
  if (e.act === 'stunned') (pz.ox += Math.round(Math.sin(c.now * 4) * 1.5)), (pz.oy += 2), (arm = Math.PI / 2 + side * 0.4);
  // At 1.5x (art pass): the pose's moves, the hand and the marks over its head half again as big.
  shadow(c, x, y, Math.max(hs(5), hs(10) - Math.round(pz.lift * HS / 2)));
  // The Hempen Man leans forward as if still on the gallows.
  if (hempenOf(e)) pz.lean += side;
  const bx = x + Math.round(pz.ox * HS), by = y + Math.round((pz.oy - pz.lift) * HS), up = e.fy < -0.55, look = butcherSprites(e), arms = butcherLook(e.name, e.variant, hempenOf(e)).arms;
  // In parts (figure.ts): the cleaver goes where the arm goes (over his head for the cleave and slam).
  const body = jointed(up ? look.up : look.down, look.cut);
  layout(body, bx, by, e.fx < -0.2, pz, HS);
  const [ax, ay] = armOffset(ARM), hx = bx + side * Math.round(hs(7) * look.k) + ax, hy = by - Math.round(hs(13) * look.k) + ay;
  if (up) cleaver(c, hx, hy, arm, arms, c.now);
  drawFigure(c, body, bx, by, pz);
  const build = butcherLook(e.name, e.variant, hempenOf(e)).build;
  drawWounds(c, e, body.s.w, false, build === 'hunch' ? 10 : build === 'lean' ? 5 : 7, look.k);
  if (!up) cleaver(c, hx, hy, arm, arms, c.now);
  if (trail) smear(c.glow, hx, hy, trail[0], trail[1], 8 * HS, 15 * HS, e.hitstop > 0 ? '#ffffff' : '#ffb0a0');
  if (e.act === 'stunned') stars(c, bx, by - hs(25), 5, hs(8));
  if (a && a.unblockable && a.t < a.windup) drawText(c.glow, '!', Math.round(bx - 1), Math.round(by - hs(33) - (Math.floor(c.now * 6) % 2)), '#ffd040');
}

/**
 * A small goblin at 1.5x (art pass): the body is its 17 by 20 sprite posed at full size; what it carries
 * (the knife, the bow, every kit) is drawn by the kit files in the old pixels through a pen round its feet
 * (gobpen.ts), so it lands on whole pixels where the bigger hands are. `bx`, `by` and the arm's offset are
 * handed to the kits in the old pixels; the pen puts them right.
 */
function scrapper(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  AT.bx = AT.by = AT.hx = AT.hy = 0;
  // Hit hard: head over heels once, with a hop. Thrown: tumbling end over end through the air.
  const tb = e.act === 'carried' || e.act === 'pinned' ? null : tumble(e, t);
  if (tb) return shadow(c, x, y, hs(4)), spin(c, SPRITES.scrapper, x, y - hs(7) - tb.hop, tb.a);
  if (Math.hypot(e.kvx, e.kvy) > 6 && e.act !== 'carried') return spin(c, SPRITES.scrapper, x, y - hs(9), c.now * 22);
  if (e.act === 'carried' || e.act === 'pinned') {
    const wig = e.act === 'pinned' ? Math.sin(c.now * 14) * 0.25 : c.now * 14;
    spin(c, SPRITES.scrapper, x, y - hs(7), Math.atan2(e.fy, e.fx) + wig);
    return;
  }
  const pz = scrapperPose(e, t, c.now);
  if (pz.phase === 'rest' && e.moving) pz.oy = Math.floor(c.now * 9) % 2 ? -1 : 0;
  hurtPose(pz, e, c.now);
  if (e.act === 'stunned') (pz.ox += Math.round(Math.sin(c.now * 5))), (pz.oy += 1);
  const reach = pz.phase === 'windup' ? 1 : pz.phase === 'release' || pz.phase === 'contact' ? 7 : 3;
  shadow(c, x, y, hs(5));
  // The body where it's thrown (1.5x the pose's shift); the kits' feet and hand in the old pixels.
  const bx = x + Math.round(pz.ox * HS), by = y + Math.round(pz.oy * HS), up = e.fy < -0.55, fa = Math.atan2(e.fy, e.fx);
  // In parts (figure.ts): the knife (or bow) is in the hand, wherever the arm has gone.
  const pale = e.variant === 'blind', body = jointed(up ? (pale ? SPRITES.paleUp : SPRITES.scrapperUp) : pale ? SPRITES.pale : SPRITES.scrapper, SCRAPPER_CUT);
  layout(body, bx, by, e.fx < -0.2, pz, HS);
  const [ax1, ay1] = armOffset(ARM), ax = ax1 / HS, ay = ay1 / HS, ox = x + pz.ox, oy = y + pz.oy, kx = ox + ax, ky = oy + ay;
  Object.assign(AT, { bx: pz.ox, by: pz.oy, hx: pz.ox + ax, hy: pz.oy + ay });
  const p = gobPen(c, x, y);
  // A lunger's weapon is its spear (kit()): no knife besides.
  const knife = () => (e.bow ? bow(p, e, kx, ky, fa) : e.variant === 'hexer' || e.variant === 'drummer' ? drawKit(p, e, ox, oy, ax, ay, t) : e.variant && KITTED.has(e.variant) ? drawFoeKit(p, e, ox, oy, ax, ay, t) : e.variant === 'lunger' ? undefined : line(p.lit, kx + Math.cos(fa) * reach, ky - 6 + Math.sin(fa) * reach, fa, 0, 4, '#cfd6dc'));
  if (up) knife();
  drawFigure(c, body, bx, by, pz);
  // Its wounds, if it's a tough one and hurt (wounds.ts).
  drawWounds(c, e, body.s.w, true);
  // The wood's element lesson: wet, aproned or kiln-hot (lessonfoes.ts).
  drawLessonMark(p, e, ox, oy);
  if (!up) knife();
  if (e.act === 'stunned') stars(c, bx, by - hs(15), 3, hs(5));
}

/** An archer's short bow, the string pulled back through the wind-up, an arrow nocked. */
function bow(c: Ctx, e: Enemy, x: number, y: number, fa: number): void {
  const a = e.attack, pull = a && a.kind === 'shot' && a.t < a.windup ? Math.min(1, a.t / a.windup) : 0;
  const px = Math.cos(fa), py = Math.sin(fa), cx = x + px * 4, cy = y - 6 + py * 4;
  c.lit.fillStyle = '#6b4a2b';
  for (let i = -3; i <= 3; i++) c.lit.fillRect(Math.round(cx - py * i + px * (1 - Math.abs(i) / 3) * 1.5), Math.round(cy + px * i + py * (1 - Math.abs(i) / 3) * 1.5), 1, 1);
  const sx = cx - px * (pull * 3), sy = cy - py * (pull * 3);
  c.lit.fillStyle = '#d8d0bc';
  c.lit.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  if (pull) line(c.lit, sx, sy, fa, 0, 6, '#a08a6a');
}

/** A body cut in two at the waist, lying in its two pieces. */
function halves(c: Ctx, s: Sprite, x: number, y: number, alpha: number): void {
  const g = c.lit, half = Math.round(s.h / 2);
  g.save();
  g.globalAlpha = alpha;
  g.translate(Math.round(x), Math.round(y - 4));
  g.rotate(-Math.PI / 2);
  g.drawImage(s.c, 0, half, s.w, s.h - half, -Math.round(s.w / 2), 0, s.w, s.h - half);
  g.restore();
  g.save();
  g.globalAlpha = alpha;
  g.translate(Math.round(x - half - 4), Math.round(y - 2));
  g.rotate(-Math.PI / 2 - 0.35);
  g.drawImage(s.c, 0, 0, s.w, half, -Math.round(s.w / 2), -half, s.w, half);
  g.restore();
  g.fillStyle = '#7a1010';
  g.fillRect(Math.round(x - 3), Math.round(y - 4), 3, 2);
}

/** A goblin lying asleep where the map says goblins sleep (it lies still till it wakes, like one at the dead). */
export const asleep = (m: GameMap, e: Enemy) => !!e.feeding && e.alert === false && !!m.sleepers?.some((s) => Math.hypot(s.x - e.x, s.y - e.y) < 0.6);

/** Curled on its side, breathing slow; now and then a breath of steam goes up off it in the cold. */
function sleeping(c: Ctx, e: Enemy, x: number, y: number, flash: number): void {
  const side = e.id % 2 ? 1 : -1, breathe = Math.floor(c.now * 0.8 + e.id) % 2;
  shadow(c, x, y, hs(7));
  spin(c, SPRITES.scrapper, x, y - hs(3) - breathe * 0.5, (side * Math.PI) / 2);
  if (flash) (c.lit.fillStyle = '#ffffff'), c.lit.fillRect(Math.round(x - 8), Math.round(y - 11), 17, 10);
  const p = (c.now * 0.35 + e.id * 0.31) % 1;
  if (p < 0.6) (c.lit.globalAlpha = 0.5 * (1 - p / 0.6)), (c.lit.fillStyle = '#8a8494'), c.lit.fillRect(Math.round(x + side * hs(5) + p * 3), Math.round(y - hs(8) - p * 8), 2, 1), (c.lit.globalAlpha = 1);
}

const DUMMY = newPose();

export function drawEnemy(c: Ctx, e: Enemy, x: number, y: number, dozing = false): void {
  if (isSpiderKind(e.kind)) return drawSpiderKind(c, e, x, y, c.t ?? c.now);
  // A sneak-thief or a wolf that got away: nothing left here.
  if (e.escaped) return;
  // The Haulier (the Deep's boss on every fifth floor): its own body and poses (hauldraw.ts).
  if (e.boss?.who === 'haulier') return drawHaulier(c, e, x, y, c.t ?? c.now);
  if (e.variant === 'wolf') return drawWolf(c, e, x, y);
  if (e.under) return drawMound(c, e, x, y);
  if (e.variant === 'log' && e.act === 'dead') return drawLogsDead(c, e, x, y);
  if (e.act === 'dead') {
    // Burst or shattered: nothing left but the stains. Otherwise the body, headless or burned.
    if (e.death === 'burst' || e.death === 'shatter') return;
    // Eaten by a butcher, or burned to ash first (sim/meal.ts, worldfire.ts).
    if (e.eaten) return drawEaten(c, x, y, e.kind === 'butcher');
    if (e.ashed) return drawAsh(c, x, y, c.t ?? c.now, e.id, e.kind === 'butcher');
    const big = e.kind === 'butcher';
    const s = e.death === 'behead' ? (big ? SPRITES.butcherHeadless : SPRITES.scrapperHeadless) : e.death === 'burn' ? (big ? SPRITES.butcherBurnt : SPRITES.scrapperBurnt) : big ? SPRITES.butcherDown : SPRITES.scrapper;
    // A corpse on a javelin hangs where it was pinned until it fades, just before the respawn.
    if (e.corpse) return spin(c, s, x, y - 7, Math.atan2(e.fy, e.fx) + 0.2, Math.min(1, (e.actDur - e.actT) / 0.8));
    const fade = Math.max(0, 1 - e.actT / e.actDur);
    // In two: the legs where it stood, the top half a little way off where it went over.
    if (e.death === 'halve') return halves(c, s, x, y, fade);
    spin(c, s, x, y - 4, -Math.PI / 2, fade);
    // Cut down: the slash across the chest.
    if (e.death === 'opened') (c.lit.globalAlpha = fade), line(c.lit, x - 2, y - 7, -0.5, 0, big ? 9 : 6, '#8a1010', 1), (c.lit.globalAlpha = 1);
    return;
  }
  // Hits are stamped in room time (`c.t`), not the wall clock.
  const t = c.t ?? c.now, flash = t - e.hitAt < 0.09 ? 0.9 : 0;
  const hurt = e.hp < e.maxHp && (t - e.hitAt < 3 || e.hp < e.maxHp * 0.5);
  if ((e.kind === 'butcher' || e.kind === 'scrapper') && hurt) ring(c, x, y, hs(e.kind === 'butcher' ? 11 : 6), '#e24b4a', e.hp / e.maxHp);
  // At a body, tearing at it; FED, eyes burning (remainsdraw.ts).
  if (e.kind === 'butcher') return butcher(c, e, x, y, t), drawMealing(c, e, x, y, t), drawFed(c, e, x, y, t);
  if (e.variant === 'log') return drawLogs(c, e, x, y);
  if (e.kind === 'scrapper' && dozing) return sleeping(c, e, x, y, flash);
  if (e.kind === 'scrapper' && e.feeding) {
    // Crouched at the dead: it leans in, worries at it, tears a piece back and chews; red flicks off.
    const cyc = (c.now * 1.3 + e.id * 0.37) % 1, f = e.fx >= 0 ? 1 : -1;
    const lean = cyc < 0.45 ? 2 + (Math.floor(c.now * 14) % 2) : cyc < 0.6 ? 0 : 1, shove = cyc < 0.45 ? f : cyc < 0.6 ? -f : 0;
    scrapper(c, e, x + shove, y + lean, t);
    if (cyc >= 0.45 && cyc < 0.75) {
      // (In the old pixels, through the pen: gobpen.ts.)
      const k = (cyc - 0.45) / 0.3, g = gobPen(c, x, y).lit;
      g.fillStyle = '#9a1414';
      for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + f * (3 + i * 2 * k)), Math.round(y - 7 - 6 * k + i * k * 3 + 8 * k * k), 1, 1);
      g.fillStyle = '#6a2a1a';
      g.fillRect(Math.round(x + f * 4), Math.round(y - 8), 2, 1);
    }
    return;
  }
  if (e.kind === 'scrapper') return scrapper(c, e, x, y, t), kit(gobPen(c, x, y), e, x, y);
  const a = e.attack;
  shadow(c, x, y, hs(5));
  // A dummy rocks and flattens a little under a blow; it doesn't go anywhere.
  const pz = foeHit(rest(DUMMY), e, t), wob = t - e.hitAt < 0.3 ? Math.round(Math.sin(c.now * 60)) : 0;
  pz.ox = pz.oy = 0;
  blitBody(c, e.kind === 'dummy' ? SPRITES.dummy : SPRITES.swingDummy, x + wob, y, false, pz);
  if (e.kind === 'swingDummy') {
    let ang = Math.atan2(e.fy, e.fx);
    if (a) ang += a.t < a.windup ? -1.4 * ease(a.t / a.windup) : -1.4 + 2.8 * Math.min(1, (a.t - a.windup) / a.active);
    // (The dummy is drawn 1.5x: its arm through the goblin pen, gobpen.ts.)
    const g = gobPen(c, x, y).lit;
    line(g, x + 5, y - 10, ang, 0, 11, '#6b4a2b', 2);
    line(g, x + 5, y - 10, ang, 9, 12, '#3a2a1a', 3);
  }
  if (e.act === 'stunned') stars(c, x, y - hs(18));
}

/** A boss's rope lane, each side of its line: as far as a hero's middle can be and still be caught (sim/combat.ts inArc). */
const BOSS_LANE = HERO.radius;

/**
 * The telegraph on the floor: a red shape that fills before the attack lands, with a striped edge for a
 * blow that can't be blocked. (It flashed white for a parry until parry went, 2026-11-05.)
 */
export function drawTelegraph(c: Ctx, a: EnemyAttack, cx: number, cy: number): void {
  if (a.t >= a.windup + a.active) return;
  // A boss's pose comes first, then its floor (sim/bosskit.ts BOSS.tell): nothing on the ground yet.
  const tell = a.tell ?? 0;
  if (a.t < tell) return;
  const prog = Math.min(1, (a.t - tell) / (a.windup - tell)), g = c.glow;
  const pulse = 0.85 + 0.15 * Math.sin(c.now * 20);
  const fill = a.kind === 'slam' ? '#e8501f' : '#e23a30';
  if (a.kind === 'pounce') return drawPounce(c, a, cx, cy, pulse);
  if (isRound(a.kind)) {
    const R = a.radius * PX, ox = Math.round(OX + a.cx * PX - cx), oy = Math.round(OY + a.cy * PX - cy), Ri = R - 1.2, Rp = R * prog;
    // Row by row: the filled middle and the faint rest as runs, the striped edge pixel by pixel.
    for (let y = -Math.floor(R); y <= R; y++) {
      const xo = Math.floor(Math.sqrt(R * R - y * y)), xi = Ri * Ri >= y * y ? Math.floor(Math.sqrt(Ri * Ri - y * y)) : -1;
      const xp = Math.min(xi, Rp * Rp > y * y ? Math.ceil(Math.sqrt(Rp * Rp - y * y)) - 1 : -1);
      g.fillStyle = fill;
      if (xp >= 0) (g.globalAlpha = 0.5 * pulse), g.fillRect(ox - xp, oy + y, xp * 2 + 1, 1);
      g.globalAlpha = 0.16;
      if (xi > xp) g.fillRect(ox - xi, oy + y, xi - xp, 1), g.fillRect(ox + xp + 1, oy + y, xi - xp, 1);
      g.globalAlpha = 0.95;
      for (let x = xi + 1; x <= xo; x++) for (let sx = -x; sx <= x; sx += 2 * x || 1) {
        g.fillStyle = Math.floor((Math.atan2(y, sx) + Math.PI) * 6) % 2 ? '#ffd040' : '#2a1408';
        g.fillRect(ox + sx, oy + y, 1, 1);
      }
    }
    if (a.kind === 'spit') drawSpitSign(c, a, cx, cy);
    // The net's mesh, the oil's drops, the ground cracking over a sapper, the torch's flame (telegraph2.ts).
    drawRoundSign(c, a, ox, oy, R, prog);
    // A hex: the hexer's sign turning slowly in the red, sickly green.
    if (a.kind === 'hex') {
      g.fillStyle = '#9be040';
      g.globalAlpha = 0.5 + 0.4 * prog;
      for (let i = 0; i < 18; i++) {
        const t = (i / 18) * Math.PI * 2 + c.now * 0.8, r = R * (i % 2 ? 0.55 : 0.4);
        g.fillRect(Math.round(ox + Math.cos(t) * r), Math.round(oy + Math.sin(t) * r), 1, 1);
      }
    }
  } else if (a.kind === 'shot') {
    // An arrow's line: a thin dotted sightline that fills in from the archer as it draws.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, wide = prog > 0.6 ? 1 : 0;
    for (let d = 6; d <= R; d += 1) {
      const on = d < R * prog, px = Math.round(ox + a.dx * d), py = Math.round(oy + a.dy * d);
      if (!on && d % 3) continue;
      g.fillStyle = fill;
      g.globalAlpha = on ? 0.85 * pulse : 0.35;
      g.fillRect(px, py, 1 + wide, 1 + wide);
    }
  } else if (a.kind === 'charge') {
    // The Stoker's charge: a broad striped lane the length of its run, filling as it winds up. Get out of it.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx, W = Math.round(a.radius * PX);
    for (let d = 4; d <= R; d += 1) for (let w = -W; w <= W; w++) {
      const edge = Math.abs(w) >= W - 1, on = d < R * prog;
      if (!edge && (d + w) % 2) continue;
      g.fillStyle = edge ? (Math.floor(d / 3) % 2 ? '#ffd040' : '#2a1408') : fill;
      g.globalAlpha = (on ? 0.85 : 0.25) * (edge ? 1 : 0.6) * pulse;
      g.fillRect(Math.round(ox + a.dx * d + nx * w), Math.round(oy + a.dy * d + ny * w), 1, 1);
    }
  } else if (a.kind === 'hook') {
    // The gaffer's hook: a thin red lane its length (block it, or get out of the lane).
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx;
    for (let d = 5; d <= R; d += 1) {
      const on = d < R * prog, px = Math.round(ox + a.dx * d), py = Math.round(oy + a.dy * d);
      g.fillStyle = fill;
      g.globalAlpha = on ? 0.9 * pulse : 0.35;
      g.fillRect(px, py, 1, 1);
      if (d % 4 === 0) g.fillRect(Math.round(px + nx), Math.round(py + ny), 1, 1), g.fillRect(Math.round(px - nx), Math.round(py - ny), 1, 1);
      // A boss's rope (Hempen's noose and haul): the lane as wide as it's judged, its edges dotted.
      if (a.boss) for (const s of [-1, 1]) for (let w = 2; w <= BOSS_LANE * PX; w++) {
        if (w < BOSS_LANE * PX - 0.5 && (d + w) % 3) continue;
        g.globalAlpha = (on ? 0.6 : 0.22) * pulse;
        g.fillRect(Math.round(px + nx * w * s), Math.round(py + ny * w * s), 1, 1);
      }
    }
    // The hook's iron at its far end.
    g.globalAlpha = 0.9;
    g.fillStyle = '#c8c8d0';
    g.fillRect(Math.round(ox + a.dx * R * prog), Math.round(oy + a.dy * R * prog) - 1, 2, 2);
  } else if (a.kind === 'draw') {
    // The Stoker's rake: a striped line (can't be blocked) that fills as it winds up. Get off it.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx;
    for (let d = 6; d <= R; d += 1) for (let w = -1; w <= 1; w++) {
      const on = d < R * prog, px = Math.round(ox + a.dx * d + nx * w), py = Math.round(oy + a.dy * d + ny * w);
      g.fillStyle = w ? (Math.floor(d / 3) % 2 ? '#ffd040' : '#2a1408') : fill;
      g.globalAlpha = on ? 0.9 * pulse : 0.3;
      g.fillRect(px, py, 1, 1);
    }
  } else {
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, cos = Math.cos(((a.arc / 2) * Math.PI) / 180);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R || d < 4) continue;
      const k = (x * a.dx + y * a.dy) / d;
      if (k < cos) continue;
      const edge = d > R - 1.2 || k < cos + 0.012;
      g.fillStyle = edge && a.unblockable ? (Math.floor(d / 2) % 2 ? '#ffd040' : '#2a1408') : edge ? '#e23a30' : fill;
      g.globalAlpha = edge ? 0.95 : d < R * prog ? 0.48 * pulse : 0.16;
      g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
    }
  }
  g.globalAlpha = 1;
}

/**
 * A goblin held overhead (x, y: the carrier's feet), kicking. While slamming, it goes up and comes
 * down in front over `k` (0..1) of the wind-up.
 */
export function drawHeld(c: Ctx, e: Enemy, x: number, y: number, fx: number, fy: number, slam: number): void {
  const s = e.kind === 'butcher' ? SPRITES.butcherDown : e.kind === 'spider' ? SPIDER_SPRITES.spiderA : SPRITES.scrapper;
  if (slam > 0) {
    // (Over the 1.5x hero's head, heroscale.ts.)
    const up = HS * (slam < 0.6 ? 24 + 8 * (slam / 0.6) : 32 * (1 - (slam - 0.6) / 0.4)), ahead = HS * (slam < 0.6 ? 0 : 12 * ((slam - 0.6) / 0.4));
    return spin(c, s, x + fx * ahead, y - up + fy * ahead * 0.5, Math.PI + (slam < 0.6 ? 0 : (slam - 0.6) * 4));
  }
  spin(c, s, x, y - hs(27), Math.PI / 2 + Math.sin(c.now * 18) * 0.3);
}

/**
 * What marks a run goblin's kind: a board on its arm, a long spear, a brute's club. Each goes with the
 * body as scrapper() posed it: the spear and the club in the weapon hand, so the stab drives the spear
 * out along the lunge and the club goes up with the arm.
 */
function kit(c: Ctx, e: Enemy, x0: number, y0: number): void {
  const f = e.fx >= 0 ? 1 : -1, g = c.lit, held = e.variant === 'lunger' || e.variant === 'heavy';
  const x = x0 + (held ? AT.hx : AT.bx), y = y0 + (held ? AT.hy : AT.by);
  if (e.variant === 'shield' && boardOut(e, c.t ?? c.now)) {
    // Lowered for its own blow (sim/board.ts): the big board dropped to hang off its arm, low at its side.
    const bx = Math.round(x - f * 3 - (f < 0 ? 0 : 6)), by = Math.round(y - 5);
    g.fillStyle = '#5a3f28';
    g.fillRect(bx, by, 6, 6);
    g.fillStyle = '#9a9aa4';
    g.fillRect(bx, by, 6, 1), g.fillRect(bx, by + 5, 6, 1);
  } else if (e.variant === 'shield') {
    // A big iron-bound board held up toward whatever it faces (Kyle, 2026-11-11: bigger, obviously a shield).
    const bx = Math.round(x + f * 3 - (f < 0 ? 5 : 0)), by = Math.round(y - 15);
    g.fillStyle = '#5a3f28';
    g.fillRect(bx, by, 5, 14);
    g.fillStyle = '#7a5a38';
    g.fillRect(bx + 1, by + 1, 3, 12);
    g.fillStyle = '#9a9aa4';
    g.fillRect(bx, by, 5, 1), g.fillRect(bx, by + 13, 5, 1), g.fillRect(bx, by + 6, 5, 1);
    g.fillStyle = '#c8c8d0';
    g.fillRect(bx + 2, by + 6, 1, 1);
  } else if (e.variant === 'lunger') line(g, x + f * 2, y - 8, Math.atan2(e.fy, e.fx), 0, 12, '#6b4a2b', 1), line(g, x + f * 2, y - 8, Math.atan2(e.fy, e.fx), 11, 14, '#cfd6dc', 1);
  else if (e.variant === 'heavy') (g.fillStyle = '#3a2a1a'), g.fillRect(Math.round(x + f * 5), Math.round(y - 14), 2, 10), (g.fillStyle = '#4a3a2a'), g.fillRect(Math.round(x + f * 4), Math.round(y - 16), 4, 3);
  else if (e.variant === 'ironhide') drawIronhide(c, e, x0 + AT.bx, y0 + AT.by, c.t ?? c.now);
}
