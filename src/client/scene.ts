/**
 * One frame: camera, the flat (lit) layer in depth order, the glowing layer, then the lighting pass.
 * The scene is painted at a low resolution and scaled up by a whole number so pixels stay crisp.
 */
import { drawPairLift } from './pairdraw';
import { drawBrakeLane } from './brakedraw';
import { sized } from './bodysize';
import { mistFrame } from './fenmistdraw';
import { lurkFrame } from './fenlurk';
import { drawBlasts } from './blastdraw';
import { pulledAt } from './wave2ground';
import { drawWet } from './wetdraw';
import { feetBand, topPush, upright } from './phoneband';
import { ARENA, doorAt, npcAt, type GameMap } from '../shared/arena';
import { rats } from './rats';
import { drawRat } from './ratdraw';
import { GRAB, GUARD, POTION, TIERS, WEAPONS } from '../shared/tuning';
import { lightsHolder } from './heldkits';
import { tapEl, tapGlow } from './magetap';
import type { ArenaRoom } from '../sim/room';
import { drawHero } from './actors';
import { drawHound, drawSnare } from './hound';
import { companion, houndAt, lodgeHoundAt } from './idlehound';
import { LODGE_HOUND, MAEVE_HOUND, isLodgeMap } from './petting';
import { houndTag } from './houndname';
import { seedOf } from './houndidle';
import type { Hound } from '../sim/types';
import type { Hero } from '../sim/types';
import { blit, type Ctx } from './draw';
import { asleep, drawEnemy, drawHeld, drawTelegraph } from './foes';
import { drawRushLinks } from './rushdraw';
import type { Enemy } from '../sim/types';
import { drawDrums } from './backline';
import { drawBanners } from './foedraw';
import { drawCrows, drawSlicks } from './beastdraw';
import { ROOF_UP } from './foedraw';
import { camKick } from './heropose';
import { houseOf } from './cottage';
import { EL_LIGHT, heldEl } from './palette';
import { drawChest, drawFlask, drawPickup, drawSmoke } from './relicsdraw';
/** A '#rrggbb' as light colour 0..1. */
const tint = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
import { drawBolt, drawDrop, drawCoal, drawHook, drawJavelin } from './relicsdraw';
import { drawStatus } from './status';
import { nestEmber } from './nestfire';
import { drawLifted, drawProp } from './propsdraw';
import type { Fx } from './fx';
import { haulLights } from './fxhaul';
import { Lighting, type Light } from './light';
import { SPRITES } from './sprites';
import { drawPost, drawRack, drawWatch } from './rackdraw';
import { drawFoe } from './strawman';
import { RACK } from '../shared/practice';
import { waiting } from '../sim/practice';
import { LIFT, OX, OY, PX, paintMap, worldH, worldW } from './world';
import { drawText, textWidth } from './pixfont';
import { blockAt, blockFoot, drawBlock, drawRound } from './blocks';
import { DECKS } from './pieces';
import { drawPunt, drawStaitheGround, puntAt, staitheLights } from './staithedraw';
import { doorLights } from './shutdraw';
import { drawWoodGround, woodFigs, zoneLights } from './wooddraw';
import { blazeLights, drawBlaze, drawBlazeAbove } from './blazedraw';
import { kindling } from '../shared/kindling';
import { drawGlint, drawKindling, drawWoodpile } from './kindledraw';
import { drawHung, drawPot } from './grimdraw';
import { drawNpc } from './npcs';
import { vignetteFigs } from './vignettes';
import { cueAt, drawCue, drawWayWord } from './waycues';
import { drawHauled, drawRope, drawSceneRings, ropeOf } from './scenedraw';
import { drawCaged, drawSurvivor } from './captives';
import { propShake } from './propshake';
import { behindMarks, drawWays, edgeMark } from './wayout';
import { drawBoards } from './voteboards';
import { drawQuestMarks, onScreen } from './questmarks';
import { CHASE, chaseLabel, chasers } from './chasers';
import { drawBeacon, drawExpedGround, friendMarks } from './expeddraw';
import { drawDoorMarks } from './doormarks';
import type { DoorMark } from './jobrooms';
import type { Target } from '../sim/targets';
import { SPOT_REACH } from '../shared/town';
import { dusk } from './streetlife';
import { drawMist, setSun, torchIn } from './daytime';
import { drawBolts, drawStrikeMarks, strikeLights } from './stormdraw';
import { flashAmb, fogLook } from './skyfx';
import { flashOf } from '../sim/stormshape';
import { drawPuddles } from './spiders';
import { drawSkills, skillLights } from './skillsdraw';
import { drawSpellGround, drawSpellSky, spellLightsFlat } from './spellground';
import { drawHuntMarks } from './signdraw';
import { drawMendMark } from './mendmark';
import { skyFlash } from './skystrikedraw';
import { drawFound } from './foundsdraw';
import { witchColour } from './hallsdraw';
import { brazierOn, drawBrazier, drawLamps } from './lampsdraw';
import { sumpScene } from './sumpdraw';
import { sealScene } from './sealdraw';
import { lampAt } from '../shared/lamps';
import { drawChalkMarks, drawTally } from './chalkdraw';
import { noteKneels } from './kneel';


/** The view's jolt this frame (heropose.ts), reused. */
const KICK: [number, number] = [0, 0];

export class Scene {
  vw = 0;
  vh = 0;
  scale = 1;
  private dpr = 1;
  private base = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private lit = this.base.getContext('2d')!;
  private glow = this.glowC.getContext('2d')!;
  private lighting: Lighting;
  private bg: HTMLCanvasElement | null = null;
  private painted: GameMap | null = null;
  private cam = { x: 0, y: 0, ready: false };
  /** A cutscene's point of interest (tiles): the camera eases there instead of following the hero. */
  focus: { x: number; y: number } | null = null;
  /** The relic held up over your head (the wood's find), and where the arrow by your feet points. */
  fanfare = false;
  pointTo: { x: number; y: number } | null = null;
  /** On a job, what the room's goal is about (sim/targets.ts): a gold mark over each (questmarks.ts). */
  marks: Target[] = [];
  /** Out in the street on a job: who's gone into which house (doormarks.ts). */
  doors: DoorMark[] = [];
  private heroAt: [number, number] | null = null;

  constructor(private out: HTMLCanvasElement) {
    this.lighting = new Lighting(out);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** The relic (the javelin) held over your head in a turning ring of light. */
  /** A hero's hound (tiles: the hound at `ax, ay`, its hero at `hx, hy`), where it plays if it's playing (idlehound.ts). */
  private hound(items: { y: number; draw: () => void }[], c: Ctx, h: Hero, d: Hound, ax: number, ay: number, hx: number, hy: number, cx: number, cy: number, now: number, me?: Hero): void {
    const a = houndAt(h, ax, ay, hx, hy, now), tx = a ? a.x : ax, ty = a ? a.y : ay, x = OX + tx * PX, y = OY + ty * PX;
    const o = { ...(a ? { mood: a.mood, fx: a.fx, down: a.down } : {}), look: h.houndLook, name: houndTag(h, d, tx, ty, me, !!a), seed: seedOf(h.id) };
    items.push({ y, draw: () => drawHound(c, d, x - cx, y - cy, o) });
  }

  private heldUp(c: Ctx, x: number, y: number, t: number): void {
    const top = Math.round(y - 34), g = c.glow;
    g.globalAlpha = 0.55;
    g.fillStyle = '#ffe9a8';
    for (let i = 0; i < 10; i++) {
      const a = t * 0.8 + (i / 10) * Math.PI * 2, r0 = 8, r1 = 18 + (i % 2) * 6;
      for (let r = r0; r < r1; r++) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(top + Math.sin(a) * r * 0.8), 1, 1);
    }
    g.globalAlpha = 1;
    // The javelin across the top, its point bright.
    c.lit.fillStyle = '#7a5230';
    c.lit.fillRect(Math.round(x - 9), top, 16, 2);
    g.fillStyle = '#e8f0ff';
    g.fillRect(Math.round(x + 7), top - 1, 3, 4);
    g.fillRect(Math.round(x + 10), top, 2, 2);
  }

  /** A gold arrow at your feet, pointing the way on, pulsing out and back. */
  private arrow(c: Ctx, h: Hero, x: number, y: number, t: number): void {
    const p = this.pointTo!, dx = p.x - h.x, dy = p.y - h.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const d = 14 + Math.sin(t * 5) * 3, bx = x + ux * d, by = y - 6 + uy * d * 0.8, g = c.glow;
    g.fillStyle = '#ffd27a';
    for (let k = 0; k < 6; k++) for (let s = -k; s <= k; s++) g.fillRect(Math.round(bx + ux * (6 - k) - uy * s * 0.9), Math.round(by + uy * (6 - k) * 0.8 + ux * s * 0.9), 1, 1);
  }

  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr;
    // A whole-room view for screenshots and checking a layout (set window.__zoom, then resize).
    const zoom = (globalThis as { __zoom?: number }).__zoom;
    this.scale = zoom ?? Math.max(1, Math.round(Math.sqrt((W * H) / 82000)));
    this.vw = Math.ceil(W / this.scale);
    this.vh = Math.ceil(H / this.scale);
    for (const c of [this.out, this.base, this.glowC]) (c.width = this.vw), (c.height = this.vh);
    this.out.style.width = (this.vw * this.scale) / this.dpr + 'px';
    this.out.style.height = (this.vh * this.scale) / this.dpr + 'px';
    for (const g of [this.lit, this.glow]) g.imageSmoothingEnabled = false;
  }

  /** My hero's position on screen in CSS pixels, and CSS pixels per tile (for aiming with the mouse). */
  heroScreen(): [number, number, number] | null {
    if (!this.heroAt) return null;
    const k = this.scale / this.dpr;
    return [(this.heroAt[0] - this.cam.x) * k, (this.heroAt[1] - 8 - this.cam.y) * k, PX * k];
  }

  /** A spot in the room (tiles) on screen, `up` tiles above it, in CSS pixels (speech bubbles over heads: bubbles.ts). */
  tileScreen(x: number, y: number, up = 0): [number, number] {
    const k = this.scale / this.dpr;
    y -= up;
    return [(OX + x * PX - this.cam.x) * k, (OY + y * PX - this.cam.y) * k];
  }

  /** `others`: other players' heroes in this place (the shared town); drawn only, never in the room. */
  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, others: Hero[] = []): void {
    const a = room.alpha;
    const lerp = (key: string, x: number, y: number): [number, number] => {
      const p = room.prev.get(key);
      const ix = p ? p[0] + (x - p[0]) * a : x, iy = p ? p[1] + (y - p[1]) * a : y;
      return [OX + ix * PX, OY + iy * PX];
    };
    const me = room.heroes.find((h) => h.id === meId);
    if (me) {
      const [hx, hy0] = lerp('h:' + me.id, me.x, me.y), hy = hy0 - (me.z ?? 0) * LIFT;
      this.heroAt = [hx, hy];
      const portrait = this.vh > this.vw * 1.2;
      const f = this.focus;
      // (A boss's plate up: the view looks that much higher, so the room's top comes down under it.)
      const tx = f ? OX + f.x * PX - this.vw / 2 : hx + me.fx * 10 - this.vw / 2, ty = f ? OY + f.y * PX - 8 - this.vh / 2 : hy - 8 + me.fy * 8 - this.vh / 2 + (portrait ? this.vh * 0.12 : 0) - topPush() / (this.scale / this.dpr);
      const k = this.cam.ready ? Math.min(1, dt * (f ? 2.5 : 7)) : 1;
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
      this.cam.ready = true;
    }
    const map = room.map;
    if (this.painted !== map) (this.bg = paintMap(map)), (this.painted = map), (this.cam.ready = false);
    const clamp = (v: number, size: number, world: number) => (size >= world ? (world - size) / 2 : Math.max(0, Math.min(world - size, v)));
    this.cam.x = clamp(this.cam.x, this.vw, worldW(map));
    // On an upright phone the camera may run past the room's foot (a short room needn't sit centred), so
    // the hero is never under the touch buttons.
    // (A boss's plate up: the room's top may come down under it: phoneband.ts topPush.)
    const ins = topPush() / (this.scale / this.dpr), foot = upright(this.vw, this.vh) ? Math.round(this.vh * 0.22) : 0, lo = Math.min(clamp(-1e9, this.vh, worldH(map)), -ins);
    this.cam.y = foot ? Math.max(lo, Math.min(Math.max(lo, worldH(map) - this.vh) + foot, this.cam.y)) : Math.max(lo, Math.min(Math.max(lo, clamp(1e9, this.vh, worldH(map))), this.cam.y));
    // ...and wherever the room's edge is, the hero's feet stay between the top HUD and the cluster (phoneband.ts).
    if (foot && me && this.heroAt && !this.focus) {
      const [top, bottom] = feetBand(this.vh, this.scale / this.dpr), hy = this.heroAt[1];
      this.cam.y = Math.max(hy - bottom, Math.min(hy - top, this.cam.y));
    }
    const sh = fx.shake;
    const [kx, ky] = camKick(me, room.time, KICK);
    const cx = Math.round(this.cam.x + (Math.random() - 0.5) * sh) + kx, cy = Math.round(this.cam.y + (Math.random() - 0.5) * sh) + ky;
    // A big map draws only what's near the screen (a margin for tall things and the lights' reach).
    const big = map.w * map.h > 3000, off = (sx: number, sy: number) => sx < -48 || sy < -64 || sx > this.vw + 48 || sy > this.vh + 48;

    const lit = this.lit, glow = this.glow, c: Ctx = { lit, glow, now, t: room.time };
    lurkFrame(room.heroes);
    lit.fillStyle = '#0d0b10';
    lit.fillRect(0, 0, this.vw, this.vh);
    lit.drawImage(this.bg!, -cx, -cy);
    fx.drawDecals(lit, cx, cy);
    // The water moving, blood clouding in it, rings at feet (wetdraw.ts).
    drawWet(lit, fx.wet, map, cx, cy, now);
    glow.clearRect(0, 0, this.vw, this.vh);
    // The job's hour: the low sun's shadows; the brood mother's poison on the floor.
    setSun(map.theme);
    const tk = torchIn(map.theme);
    if (room.puddles?.length) drawPuddles(c, room.puddles, cx, cy, room.time, now);
    // Lamp oil on the floor, and crows on the dead (beastdraw.ts).
    const floor = (x: number, y: number): [number, number] => [OX + x * PX - cx, OY + y * PX - cy];
    if (room.slicks?.length) drawSlicks(c, room.slicks, floor, room.time);
    for (const e of room.enemies) if (e.attack && e.act === 'attack') drawTelegraph(c, e.attack, cx, cy);
    // A house on fire: where it burns, where it's about to, where a beam is coming down (blazedraw.ts).
    drawBlaze(c, room, cx, cy);
    // A storm's lightning: its circle while it's coming (stormdraw.ts).
    drawStrikeMarks(c, room, cx, cy);
    // A keg, oil or embers about to go up: its circle, the keg, the embers (blastdraw.ts).
    drawBlasts(c, room, cx, cy);
    // A drummer's reach and its beat on the floor, and the goblins it has roused (client/backline.ts).
    const at = (e: Enemy): [number, number] => {
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      return [x - cx, y - (e.z ?? 0) * LIFT - cy];
    };
    drawDrums(c, room.enemies, at, room.time);
    // A banner's reach and the goblins that have taken heart in it; a rout (foedraw.ts).
    drawBanners(c, room.enemies, at);
    // A pack rush winding up: the red line linking its goblins, flashing white with their telegraphs (rushdraw.ts).
    drawRushLinks(glow, room.enemies, at, now);
    // A Rogue's kit in hand: show each goblin's back, the place a backstab lands.
    if (me && WEAPONS[me.weapon].cls === 'ROGUE') for (const e of room.enemies) {
      if (e.act === 'dead' || e.kind === 'dummy' || e.kind === 'swingDummy') continue;
      const [ex, ey] = lerp('e:' + e.id, e.x, e.y), tx = me.x - e.x, ty = me.y - e.y, tl = Math.hypot(tx, ty) || 1;
      if (tl > 6) continue;
      const behind = (e.fx * tx + e.fy * ty) / tl < GUARD.rearCos, back = Math.atan2(-e.fy, -e.fx), r = e.radius * PX + 5;
      glow.fillStyle = '#b080ff';
      glow.globalAlpha = behind ? 0.95 : 0.35;
      for (let a = -1.1; a <= 1.1; a += 0.08) glow.fillRect(Math.round(ex - cx + Math.cos(back + a) * r), Math.round(ey - cy + Math.sin(back + a) * r * 0.5), 1, 1);
      glow.globalAlpha = 1;
    }

    const items: { y: number; draw: () => void }[] = [];
    // A Cleric raising a friend kneels by them (kneel.ts).
    noteKneels(room.heroes, room.time);
    for (const h of others) {
      const x = OX + h.x * PX, y = OY + h.y * PX;
      items.push({ y, draw: () => drawHero(c, h, x - cx, y - cy, false, room.time) });
      // Another player's Ranger: their hound at heel, as this screen walks it (idlehound.ts).
      const d = companion(h, now);
      if (d) this.hound(items, c, h, d, d.x, d.y, h.x, h.y, cx, cy, now, me);
    }
    // Maeve's hound by the lodge's fire.
    if (isLodgeMap(map)) {
      const a = lodgeHoundAt(others.length ? [...room.heroes, ...others] : room.heroes, now);
      items.push({ y: OY + a.y * PX, draw: () => drawHound(c, LODGE_HOUND, OX + a.x * PX - cx, OY + a.y * PX - cy, { mood: a.mood, fx: a.fx, down: a.down, look: MAEVE_HOUND }) });
    }
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y), up = (h.z ?? 0) * LIFT;
      items.push({ y, draw: () => sized(c, x - cx, y - up - cy, () => drawHero(c, h, x - cx, y - up - cy, h.id === meId, room.time)) });
      // A Ranger's hound, wherever it is.
      if (h.hound) {
        const d = h.hound, [dx, dy] = lerp('d:' + h.id, d.x, d.y);
        this.hound(items, c, h, d, (dx - OX) / PX, (dy - OY) / PX, (x - OX) / PX, (y - OY) / PX, cx, cy, now, me);
      }
      if (h.id === meId && this.fanfare) items.push({ y: y + 0.5, draw: () => this.heldUp(c, x - cx, y - up - cy, room.time) });
      if (h.id === meId && this.pointTo) items.push({ y: y + 0.5, draw: () => this.arrow(c, h, x - cx, y - up - cy, room.time) });
      // A Mage's blink image, flickering where they stood until it goes.
      if (h.decoyUntil > room.time) {
        const dx = OX + h.decoyX * PX, dy = OY + h.decoyY * PX, left = h.decoyUntil - room.time;
        items.push({ y: dy, draw: () => {
          const a = (0.35 + Math.sin(room.time * 18) * 0.12) * Math.min(1, left / 0.5);
          c.lit.globalAlpha = c.glow.globalAlpha = a;
          drawHero(c, { ...h, act: 'idle', actT: 0 }, dx - cx, dy - cy, false, room.time);
          c.lit.globalAlpha = c.glow.globalAlpha = 1;
        } });
      }
    }
    // Crows on the dead, over the bodies they're at (beastdraw.ts).
    for (const f of room.crows ?? []) items.push({ y: OY + (f.y + 0.4) * PX, draw: () => drawCrows(c, [f], (x, y) => [OX + x * PX - cx, OY + y * PX - cy], room.time) });
    // Rats at the blood and in the alleys, scattering from anyone who comes near (rats.ts, this screen's own).
    rats.frame(room, fx.decals, others.length ? [...room.heroes, ...others] : room.heroes, meId, now);
    for (const r of rats.rats) if (r.state !== 'gone') items.push({ y: OY + r.y * PX - 0.5, draw: () => drawRat(c, r, OX + r.x * PX - cx, OY + r.y * PX - cy) });
    for (const e of room.enemies) {
      const carrier = room.heroes.find((h) => h.carrying === e.id);
      if (carrier) {
        // Held overhead by a hero: drawn with them, just in front.
        const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
        items.push({ y: hy + 0.5, draw: () => (drawHeld(c, e, hx - cx, hy - cy, carrier.fx, carrier.fy, slam), drawStatus(c, e, hx - cx, hy - cy - 20, room.time)) });
        continue;
      }
      // Up on a roof: stood on its ridge, drawn after the house it's on.
      // (A body a Gorger is pulling in: dragged along to it: wave2ground.ts.)
      const pz = pulledAt(room, e), roof = (e.z ?? 0) >= 2, [x, y] = pz ? [OX + pz[0] * PX, OY + pz[1] * PX] : lerp('e:' + e.id, e.x, e.y), up = roof ? ROOF_UP : Math.max(0, e.z ?? 0) * LIFT;
      // A big map: only what's on screen is drawn (DECISIONS 2026-11-03).
      if (big && off(x - cx, y - cy)) continue;
      items.push({ y: roof ? y + 3 * PX : y, draw: () => (sized(c, x - cx, y - up - cy, () => drawFoe(c, e, x - cx, y - up - cy, asleep(map, e), map === ARENA), e.kind !== 'butcher' && !e.boss), drawStatus(c, e, x - cx, y - up - cy, room.time)) });
    }
    for (const p of room.props) {
      if (p.broken) continue;
      const carrier = p.lifted ? room.heroes.find((h) => h.lifting === p.id) : undefined;
      if (carrier) {
        const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
        items.push({ y: hy + 0.5, draw: () => drawLifted(c, p, hx - cx, hy - cy, carrier.fx, carrier.fy, slam) });
        continue;
      }
      const x = OX + p.x * PX - cx, y = OY + p.y * PX - cy;
      items.push({ y: OY + p.y * PX, draw: () => drawProp(c, p, x, y, room.time) });
      // Someone caged: a mark over them, and their call when you're close.
      if (p.kind === 'cage' && !p.broken) {
        const near = !!me && Math.hypot(me.x - p.x, me.y - p.y) < 7;
        const jx = Math.round(propShake(p, room.time)[0] * PX);
        items.push({ y: OY + p.y * PX + 0.2, draw: () => drawCaged(c, x + jx, y, room.time, near, p.id) });
      }
    }
    // The freed, where the room has them (the dead lie under everyone; the gone are gone).
    for (const s of room.survivors ?? []) {
      if (s.gone) continue;
      const [x, y] = lerp('s:' + s.id, s.x, s.y);
      items.push({ y: s.dead ? y - 20 : y, draw: () => drawSurvivor(c, s, x - cx, y - cy, room.time) });
    }
    for (const ch of room.chests) {
      const x = OX + ch.x * PX - cx, y = OY + ch.y * PX - cy;
      items.push({ y: OY + ch.y * PX, draw: () => drawChest(c, ch, x, y) });
    }
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      const x = OX + d.x * PX - cx, y = OY + d.y * PX - cy;
      items.push({ y: OY + d.y * PX - 20, draw: () => drawDrop(c, d, x, y) });
    }
    for (const p of room.pickups) {
      const x = OX + p.x * PX - cx, y = OY + p.y * PX - cy;
      items.push({ y: OY + p.y * PX - 20, draw: () => drawPickup(c, p, x, y) });
    }
    for (const s of room.smokes) {
      const x = OX + s.x * PX - cx, y = OY + s.y * PX - cy;
      items.push({ y: OY + s.y * PX + 30, draw: () => drawSmoke(c, s, x, y, (s.r ?? POTION.smokeR) * PX, room.time) });
    }
    for (const m of room.coals) {
      const x = OX + m.x * PX - cx, y = OY + m.y * PX - cy;
      items.push({ y: OY + m.y * PX - 20, draw: () => drawCoal(c, m, x, y) });
    }
    for (const b of room.bolts) {
      // (A gall bomb is drawn with the found relics, foundsdraw.ts.)
      if (b.kind === 'bomb') continue;
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy;
      // Things on the floor draw under the bodies; things in the air over them.
      const floor = b.kind === 'smite' || b.state === 'well';
      items.push({ y: OY + b.y * PX + (floor ? -40 : b.kind === 'lodestone' ? 30 : 0), draw: () => (b.kind === 'flask' ? drawFlask(c, b, x, y) : drawBolt(c, b, x, y)) });
    }
    for (const j of room.javelins) {
      const x = OX + j.x * PX - cx, y = OY + j.y * PX - cy;
      items.push({ y: OY + j.y * PX + (j.state === 'wall' && j.dy < 0 ? -40 : 0), draw: () => drawJavelin(c, j, x, y) });
    }
    for (const k of room.hooks) {
      const o = room.heroes.find((h) => h.id === k.owner);
      if (!o) continue;
      const [ox, oy] = lerp('h:' + o.id, o.x, o.y);
      items.push({ y: OY + k.y * PX + 1, draw: () => drawHook(c, k, ox - cx, oy - cy, OX + k.x * PX - cx, OY + k.y * PX - cy) });
    }
    for (const r of map.rounds) if (!big || !off(OX + r.x * PX - cx, OY + r.y * PX - cy)) items.push({ y: OY + r.y * PX, draw: () => drawRound(c, r, OX + r.x * PX - cx, OY + r.y * PX - cy) });
    for (const b of map.blocks) {
      if (b.kind === 'sideway') continue;
      const [bx, by] = blockAt(b);
      // Boards you walk on (the Staithe's jetty, a log laid across): under everyone standing on them.
      if (DECKS.has(b.kind)) {
        items.push({ y: -1e6 + b.y, draw: () => drawBlock(c, b, bx - cx, by - cy, false) });
        continue;
      }
      items.push({ y: blockFoot(b), draw: () => drawBlock(c, b, bx - cx, by - cy, lampAt(map.theme, b.x, b.y) > 0.5) });
      // A house's kindling: its woodpile, glinting while you're near, the ring while someone lights it (kindledraw.ts).
      // The Staithe's smokehouse: how far it's caught, at its wall; the pull at its door once it's alight.
      if (b.kind === 'smokehouse') {
        const door = doorAt(b), sx = OX + (b.x - 0.3) * PX - cx, sy = OY + (b.y + b.h * 0.55) * PX - cy;
        items.push({ y: blockFoot(b) + 0.1, draw: () => drawSceneRings(c, b, sx, sy, OX + door.x * PX - cx, OY + door.y * PX - cy) });
        continue;
      }
      const k = kindling(b, map);
      if (!k) continue;
      const kx = OX + k.x * PX - cx, ky = OY + k.y * PX - cy, d = me && !b.ruined && (b.burning ?? -1) < 0 ? Math.hypot(me.x - k.x, me.y - k.y) : 99;
      items.push({ y: OY + k.y * PX, draw: () => drawWoodpile(c, k, kx, ky, b) });
      // (The glint and the ring after the house, so its sprite never wipes them.)
      const door = doorAt(b), dx = OX + door.x * PX - cx, dy = OY + door.y * PX - cy;
      items.push({ y: blockFoot(b) + 0.1, draw: () => (drawGlint(c, kx, ky, d, b.look ?? 0), drawKindling(c, b, kx, ky), drawSceneRings(c, b, kx, ky, dx, dy)) });
    }
    for (const n of map.npcs ?? []) {
      const at = npcAt(n, room.time), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
      items.push({ y: OY + at.y * PX, draw: () => drawNpc(c, n, OX + at.x * PX - cx, OY + at.y * PX - cy, near && !n.mute, at.fx, !!n.path && !at.still, at.x) });
    }
    // Layout 4's scenes: a body being hauled, the prisoners' rope (scenedraw.ts).
    for (const e of room.enemies) if (e.task?.k === 'tally') { const k = e.task; items.push({ y: OY + k.y * PX, draw: () => drawTally(c, k.n, OX + k.x * PX - cx, OY + k.y * PX - cy) }); }
    for (const e of room.enemies) if (e.haul) items.push({ y: OY + e.haul.y * PX - 6, draw: () => drawHauled(c, e, OX + e.haul!.x * PX - cx, OY + e.haul!.y * PX - cy) });
    for (const [x1, y1, x2, y2] of ropeOf(room)) items.push({ y: OY + Math.max(y1, y2) * PX + 0.5, draw: () => drawRope(c, OX + x1 * PX - cx, OY + y1 * PX - cy - 6, OX + x2 * PX - cx, OY + y2 * PX - cy - 6) });
    // The scenes past the wood's trees (vignettes.ts): drawn like anyone, never in the room.
    // Hangman's Wood: the cage on its chain, Hew's marks, the mid-point's fire (wooddraw.ts).
    for (const f of woodFigs(room, room.time)) items.push({ y: OY + f.y * PX, draw: () => f.draw(c, OX + f.x * PX - cx, OY + f.y * PX - cy) });
    for (const f of vignetteFigs(map, room.time, me)) items.push({ y: OY + f.y * PX - (f.floor ? 20 : 0), draw: () => f.draw(c, OX + f.x * PX - cx, OY + f.y * PX - cy) });
    // The Haulier's old working: the rail, the winding gear and shaft, the adit (sumpdraw.ts).
    if (map.sealed) sealScene(map, c, cx, cy, items);
    if (map.rail || map.gear || map.adits) sumpScene(map, c, cx, cy, items, room.enemies.some((e) => e.boss?.who === 'haulier' && e.boss.phase === 2));
    // THE SLUICER in the water, THE RAKER's lift as a ring at its feet (pairdraw.ts).
    if (room.enemies.some((e) => e.fallen !== undefined)) items.push({ y: -1e6 + 4, draw: () => drawPairLift(c, room.enemies, cx, cy) });
    // THE BRAKESMAN's cart waiting at the top: its lane striped (brakedraw.ts).
    if (map.rail) for (const p of room.props) if (p.goAt !== undefined) items.push({ y: -1e6 + 3, draw: () => drawBrakeLane(c, map, p, cx, cy, now) });
    for (const b of map.braziers) items.push({ y: OY + b.y * PX, draw: () => drawBrazier(c, OX + b.x * PX - cx, OY + b.y * PX + 2 - cy, now, brazierOn(map, b)) });
    // What the goblins left that moves: one hung from a hook, the pot on their fire (grimdraw.ts).
    for (const q of map.grim ?? []) {
      const x = OX + q.x * PX - cx, y = OY + q.y * PX - cy;
      if (q.kind === 'hung') items.push({ y: OY + q.y * PX, draw: () => drawHung(c, q, x, y) });
      if (q.kind === 'pot') items.push({ y: OY + q.y * PX + 0.5, draw: () => drawPot(c, q, x, y + 2) });
    }
    if (map === ARENA) items.push({ y: OY + ARENA.cage.y * PX, draw: () => this.cage(c, OX + ARENA.cage.x * PX - cx, OY + ARENA.cage.y * PX - cy, now) });
    // The yard's straw men on their rack, the watch on the ropes, Pell's board (rackdraw.ts): fewer wait while some are out.
    if (map === ARENA) {
      const rx = OX + RACK.x * PX - cx, ry = OY + RACK.y * PX - cy, barY = ry + RACK.h * PX - 30;
      items.push({ y: OY + (RACK.y + RACK.h) * PX, draw: () => drawRack(c, rx, ry, now, waiting(room)) });
      items.push({ y: OY + RACK.post.y * PX, draw: () => drawPost(c, OX + RACK.post.x * PX - cx, OY + RACK.post.y * PX - cy) });
      RACK.watch.forEach((w, i) => items.push({ y: OY + w.y * PX, draw: () => drawWatch(c, OX + w.x * PX - cx, OY + w.y * PX - cy, i, i ? rx + RACK.w * PX - 2 : rx + 1, barY + 1, now) }));
    }
    // The way out: stakes across the gap while it's shut; lit, torches and chevrons once it's open (wayout.ts).
    const wayLights = drawWays(c, map, room.exitOpen, cx, cy, now);
    // The town hall's vote boards: who voted for what, and when it closes (voteboards.ts).
    drawBoards(glow, map, cx, cy);
    // Blessed ground: a ring of gold on the floor, light rising off it.
    for (const s of room.snares) drawSnare(c, s, OX + s.x * PX - cx, OY + s.y * PX - cy);
    for (const z of room.zones) {
      if (z.kind) continue;
      const zx = OX + z.x * PX - cx, zy = OY + z.y * PX - cy, R = z.r * PX, left = z.until - room.time, k = Math.min(1, left / 1.2);
      glow.globalAlpha = 0.75 * k;
      glow.fillStyle = '#ffd27a';
      for (let a = 0; a < Math.PI * 2; a += 0.06) glow.fillRect(Math.round(zx + Math.cos(a + now * 0.3) * R), Math.round(zy + Math.sin(a + now * 0.3) * R * 0.55), 1, 1);
      glow.fillStyle = '#fff1b0';
      for (let i = 0; i < 14; i++) {
        const p = (now * 0.6 + i / 14) % 1, a = i * 2.4;
        glow.globalAlpha = (1 - p) * 0.8 * k;
        glow.fillRect(Math.round(zx + Math.cos(a) * R * 0.8 * ((i % 5) / 5)), Math.round(zy + Math.sin(a) * R * 0.45 * ((i % 5) / 5) - p * 22), 1, 1);
      }
      glow.globalAlpha = 1;
    }
    // The skills taught after the first: rings wound up, a volley, a fire ring, a tether, a chain (skillsdraw.ts).
    drawSkills(c, room, cx, cy);
    // A staff's ring of fire or charged ring, a wand's storm stream (spellground.ts).
    drawSpellGround(c.glow, room, cx, cy);
    drawFound(c, room, cx, cy);
    // At a fork, both ways out glow, each with its name.
    for (const r of map.roads ?? []) {
      // Layout 4's ways say what's past them from the start (waycues.ts); the old roads once the way's open.
      if (!room.exitOpen && !r.way) continue;
      const e = r.area, ex = OX + e.x * PX - cx, ey = OY + e.y * PX - cy;
      // Under a gap in the back wall; beside one in a side wall, inside the room.
      const [tx, ty] = r.side === 'W' ? [ex + e.w * PX + 26, ey + (e.h * PX) / 2 - 3] : r.side === 'E' ? [ex - 26, ey + (e.h * PX) / 2 - 3] : [ex + (e.w * PX) / 2, ey + e.h * PX + 34];
      drawWayWord(glow, r, tx, ty, room.exitOpen);
    }
    // An expedition: the rings where a job is done by standing there, and the beacon (expeddraw.ts).
    const ground = (x: number, y: number): [number, number] => [OX + x * PX - cx, OY + y * PX - cy];
    drawExpedGround(glow, room, ground, now);
    // The Staithe: its log's clock and the jetty's ring on the ground, the punt on the water (staithedraw.ts).
    drawStaitheGround(glow, room, ground, now);
    // Hangman's Wood: snares, a dropper's shadow, the oak's burning wood, the fire's ring (wooddraw.ts).
    drawWoodGround(glow, room, ground, now);
    const punt = puntAt(room);
    if (punt) items.push({ y: OY + punt.y * PX - 4, draw: () => drawPunt(c.lit, OX + punt.x * PX - cx, OY + punt.y * PX - cy, PX, punt.full, now) });
    items.sort((p, q) => p.y - q.y);
    for (const it of items) it.draw();
    // What you can tell of each way at a fork (waycues.ts), over everything near its gap.
    for (const r of map.roads ?? []) if (r.way) {
      const q = cueAt(r, map);
      drawCue(c, r.way, OX + q.x * PX - cx, OY + q.y * PX - cy - q.z * PX, r.area.x + r.area.y);
    }
    const beacons = drawBeacon(glow, room, ground, now);
    // Anyone you've freed who's fallen behind out of sight: a mark at the edge, toward them (clear of the HUD).
    const tall = this.vh > this.vw * 1.2, view = { vw: this.vw, vh: this.vh, top: tall ? this.vh * 0.2 : 20, bottom: tall ? this.vh * 0.3 : 20 };
    behindMarks(c, room.survivors ?? [], cx, cy, view, now);
    // What the goal is about: a gold mark over each, or a point at the edge toward the nearest.
    const markLights = drawQuestMarks(c, this.marks, (t) => (t.id !== undefined ? lerp('e:' + t.id, t.x, t.y) : onScreen(t)), cx, cy, view, me ?? null, now);
    if (!room.indoors) markLights.push(...drawDoorMarks(c, this.doors, cx, cy));
    if (me) {
      // Goblins on your trail off screen: a red point at the edge toward each, and a count.
      let off = 0;
      for (const e of chasers(room, me)) {
        const [ex, ey] = lerp('e:' + e.id, e.x, e.y);
        if (edgeMark(c.glow, ex - cx, ey - cy - 8, view, Math.sin(now * 8) * 1.5, CHASE.red)) off++;
      }
      if (off) drawText(c.glow, chaseLabel(off), Math.round(this.vw / 2 - textWidth(chaseLabel(off)) / 2), Math.round(view.top + 2), CHASE.red);
      // Friends off screen on an expedition: a pale point toward each, with their name.
      friendMarks(c.glow, room, meId, (x, y) => ground(x, y - 1), this.vw, this.vh, view.top, view.bottom);
    }
    drawBlazeAbove(c, room, cx, cy);
    drawBolts(c, room, cx, cy);
    // A wand's lightning strike coming down (skystrikedraw.ts).
    drawSpellSky(c.glow, room, cx, cy);
    // A Ranger's MARK over its goblin (signdraw.ts).
    drawHuntMarks(c.glow, room, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX], (k, x, y) => { const [px, py] = lerp(k, x, y); return [(px - OX) / PX, (py - OY) / PX]; }, PX);
    // Who a Cleric's MEND would reach (mendmark.ts).
    drawMendMark(c.glow, room, meId, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX], (k, x, y) => { const [px, py] = lerp(k, x, y); return [(px - OX) / PX, (py - OY) / PX]; }, PX);
    // A chalker's strokes over the hero it's chalking (chalkdraw.ts).
    drawChalkMarks(c.glow, room, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX], (k, x, y) => { const [px, py] = lerp(k, x, y); return [(px - OX) / PX, (py - OY) / PX]; }, PX);

    const lights: Light[] = [...wayLights, ...markLights];
    blazeLights(room, cx, cy, now, lights);
    strikeLights(room, cx, cy, lights);
    for (const b of beacons) lights.push({ x: OX + b.x * PX - cx, y: OY + b.y * PX - cy - 14, r: 150 + Math.sin(now * 9) * 8, i: 1.3, c: [1, 0.62, 0.3] });
    for (const l of staitheLights(room)) lights.push({ x: OX + l.x * PX - cx, y: OY + l.y * PX - cy - 10, r: l.r * PX + Math.sin(now * 9 + l.x) * 3, i: l.i, c: l.c });
    for (const l of [...doorLights(room), ...zoneLights(room, now)]) lights.push({ x: OX + l.x * PX - cx, y: OY + l.y * PX - cy - 10, r: l.r * PX + Math.sin(now * 9 + l.x) * 3, i: l.i, c: l.c });
    for (const m of room.coals) lights.push({ x: OX + m.x * PX - cx, y: OY + m.y * PX - cy - 4, r: 26 + Math.sin(now * 7 + m.id) * 3, i: 0.6 * Math.min(1, m.life / 4), c: [1, 0.6, 0.28] });
    for (const ch of room.chests) if (ch.state !== 'shut') lights.push({ x: OX + ch.x * PX - cx, y: OY + ch.y * PX - cy - 6, r: ch.state === 'opening' ? 16 + 30 * (ch.t / 1.2) : 26, i: ch.state === 'opening' ? 0.4 + 0.5 * (ch.t / 1.2) : 0.35, c: tint(TIERS[ch.tier].col) });
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      if (!d.item.traits.some((t) => t === 'ember' || t === 'rime' || t === 'storm')) continue;
      lights.push({ x: OX + d.x * PX - cx, y: OY + d.y * PX - cy - 6, r: 22, i: 0.5, c: [1, 0.9, 0.6] });
    }
    // The tended lamps, lit or put out by the hour (lampsdraw.ts, shared/lamps.ts).
    drawLamps(c, map, cx, cy, now, tk, lights);
    // Moonlight through a ceiling grate over the middle of the room.
    if (map.theme.moon && !map.theme.day) lights.push({ x: OX + (map.w / 2) * PX - cx, y: OY + (map.h / 2) * PX - cy, r: 125 * Math.max(1, map.w / 22), i: map.theme.moon, c: [0.55, 0.62, 0.9] });
    // Perrin's garden after dark: a soft pool of lamplight over the benches and the beds.
    // Inside the halls: candlelight, and the tower's coloured fire.
    for (const r of map.rounds) {
      if (r.kind === 'candles') lights.push({ x: OX + r.x * PX - cx, y: OY + r.y * PX - cy - 18, r: 46 + Math.sin(now * 11 + r.x) * 2, i: 0.7, c: [1, 0.78, 0.48] });
      if (r.kind === 'witchfire') lights.push({ x: OX + r.x * PX - cx, y: OY + r.y * PX - cy - 10, r: 90 + Math.sin(now * 5) * 4, i: 1.1, c: witchColour(now) });
    }
    for (const r of map.rounds) if (r.kind === 'moths' && !map.theme.day) lights.push({ x: OX + r.x * PX - cx - 36, y: OY + r.y * PX - cy - 34, r: 84, i: 0.4 * dusk(), c: [1, 0.84, 0.58] });
    for (const r of map.rounds) if (r.kind === 'lantern') lights.push({ x: OX + r.x * PX - cx, y: OY + r.y * PX - cy - 28, r: 150 + Math.sin(now * 3) * 4, i: 1.25 * tk, c: [1, 0.78, 0.45] });
    for (const b of map.blocks) {
      const [bx, by] = blockAt(b), mx = bx + (b.w * PX) / 2 - cx;
      // A building on fire lights the whole street; its ashes smoulder.
      if (((b.burning ?? -1) >= 0 || b.smoulder) && !b.ruined) lights.push({ x: mx, y: by + (b.h * PX) / 2 - cy - 10, r: 70 + b.w * 10 + Math.sin(now * 13 + bx) * 6, i: 1.2, c: [1, 0.55, 0.25] });
      if (b.ruined) lights.push({ x: mx, y: by + (b.h * PX) / 2 - cy, r: 22 + b.w * 3, i: 0.35, c: [1, 0.35, 0.15] });
      // Someone lighting its kindling: a small warm glow growing at the pile.
      const kk = b.lighter && b.lightT ? kindling(b, map) : null;
      if (kk) lights.push({ x: OX + kk.x * PX - cx, y: OY + kk.y * PX - cy - 4, r: 30 + (b.lightT ?? 0) * 14, i: 0.5 + (b.lightT ?? 0) * 0.25, c: [1, 0.6, 0.3] });
      // A job's cottage with its fire going shows a little light at the windows.
      const home = houseOf(b), fire = !!home?.lit && b.kind === 'house' && !b.ruined && (b.burning ?? -1) < 0;
      if (!fire && (b.maxHp || (b.kind !== 'house' && b.kind !== 'church' && b.kind !== 'hall' && b.kind !== 'forge'))) continue;
      // Lamplight at the windows only while the lamps are lit; the forge's fire is worked all day.
      const on = b.kind === 'forge' ? 1 : lampAt(map.theme, b.x, b.y);
      if (on > 0) lights.push({ x: bx + (b.w * PX) / 2 - cx, y: by + b.h * PX - cy, r: 34, i: 0.45 * on, c: b.kind === 'forge' ? [1, 0.5, 0.25] : [1, 0.8, 0.5] });
    }
    lights.push(...skillLights(room, cx, cy, now), ...spellLightsFlat(room, cx, cy));
    for (const z of room.zones) if (!z.kind) lights.push({ x: OX + z.x * PX - cx, y: OY + z.y * PX - cy - 6, r: z.r * PX * 1.4, i: 0.8 * Math.min(1, (z.until - room.time) / 1.2), c: [1, 0.85, 0.5] });
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      // Underground (no moon), each hero carries a lantern.
      if (!map.theme.day) lights.push({ x: x - cx, y: y - 10 - cy, r: map.theme.moon ? 44 : 90, i: (map.theme.moon ? 0.35 : 0.7) * tk, c: [0.95, 0.8, 0.6] });
      // A Healer's censer burns brighter the more coals it has taken.
      if (h.glow > 0 && WEAPONS[h.weapon].cls === 'HEALER') lights.push({ x: x - cx, y: y - 4 - cy, r: 20 + h.glow * 3 + Math.sin(now * 9) * 2, i: 0.25 + h.glow * 0.04, c: [1, 0.62, 0.3] });
    }
    for (const e of room.enemies) {
      const at = e.attack;
      if (!at || at.t >= at.windup) continue;
      const k = at.t / at.windup, round = at.kind === 'slam' || at.kind === 'hex', ax = round ? at.cx : at.ox + at.dx * at.range * 0.5, ay = round ? at.cy : at.oy + at.dy * at.range * 0.5;
      lights.push({ x: OX + ax * PX - cx, y: OY + ay * PX - cy, r: 40, i: 0.35 * k, c: [1, 0.25, 0.15] });
      // A hexer's fetish lights it up green as the spell comes.
      if (at.kind === 'hex') lights.push({ x: OX + e.x * PX - cx, y: OY + e.y * PX - cy - 16, r: 18 + 22 * k, i: 0.3 + 0.5 * k, c: [0.55, 1, 0.3] });
    }
    for (const j of room.javelins) {
      const x = OX + j.x * PX - cx, y = OY + j.y * PX - cy - 8;
      lights.push({ x, y, r: j.state === 'fly' ? 34 : 14, i: j.state === 'fly' ? 0.6 : 0.3 * Math.min(1, j.life), c: [0.55, 0.85, 1] });
    }
    for (const b of room.bolts) {
      if (b.kind === 'arrow' || b.kind === 'knife' || b.kind === 'dart') continue;
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy - 8;
      if (b.kind === 'net' || b.kind === 'bolt') continue;
      if (b.kind === 'smite') lights.push({ x, y: y + 4, r: 40, i: 0.9 * Math.min(1, b.t / b.flight), c: [1, 0.9, 0.6] });
      else if (b.kind === 'lodestone') lights.push({ x, y, r: b.state === 'well' ? 50 : 12, i: 0.5, c: b.el ? EL_LIGHT[b.el] : [1, 0.85, 0.55] });
      else lights.push({ x, y, r: b.kind === 'orb' ? 50 : 30, i: 0.7, c: EL_LIGHT[b.el] });
    }
    for (const e of room.enemies) {
      // A nest being lit, or its ash still smouldering (nestfire.ts): a small warm glow.
      const ember = nestEmber(e);
      if (ember) lights.push({ x: OX + e.x * PX - cx, y: OY + e.y * PX - cy - 4, r: 24, i: ember, c: [1, 0.55, 0.25] });
      // Poisoned by a dart (sim/venom.ts): a sickly green about it.
      if (e.act !== 'dead' && (e.venom ?? 0) > 0 && (e.venomUntil ?? 0) > room.time) lights.push({ x: OX + e.x * PX - cx, y: OY + e.y * PX - cy - 8, r: 22 + 6 * e.venom!, i: 0.45, c: [0.55, 1, 0.3] });
      if (e.act === 'dead') continue;
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      if (e.boss?.who === 'haulier') lights.push(...haulLights(e, x - cx, y - cy, room.time, now));
      // A nest burned out up close throws a bigger, warmer light (sim/torch.ts).
      if (e.burnUntil > room.time) lights.push({ x: x - cx, y: y - cy - 10, r: (e.ashAt ? 70 : 44) + Math.sin(now * 17 + e.id) * 4, i: e.ashAt ? 0.95 : 0.75, c: [1, 0.55, 0.25] });
      else if (e.frozenUntil > room.time) lights.push({ x: x - cx, y: y - cy - 8, r: 26, i: 0.4, c: [0.6, 0.85, 1] });
    }
    for (const h of room.heroes) {
      // A Mage's quick cast: the hand lights up in its element as it gathers and flashes as it goes (magetap.ts).
      const tg = tapGlow(h);
      if (tg > 0) {
        const [x, y] = lerp('h:' + h.id, h.x, h.y);
        lights.push({ x: x + h.fx * 8 - cx, y: y - cy - 12 + h.fy * 5, r: 22 + 18 * tg, i: 0.9 * tg, c: EL_LIGHT[tapEl(h)] });
      }
      if (!lightsHolder(h.weapon)) continue;
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      // A primed Mage (just channelled) burns brighter till the spell goes.
      lights.push({ x: x - cx, y: y - cy - 14, r: h.primed ? 30 : 22, i: h.primed ? 0.55 : 0.4, c: WEAPONS[h.weapon].cls === 'HEALER' ? [1, 0.75, 0.4] : EL_LIGHT[heldEl(h)] });
    }
    // (Fenmere's mist is its banks, below: no dawn bands over the glowing layer there.)
    drawMist(glow, map.fen ? { ...map.theme, mist: 0 } : map.theme, this.vw, this.vh, cx, cy, now);
    fx.drawGlow(glow, lit, cx, cy);
    lights.push(...fx.lights(cx, cy));
    // Only lights that reach the screen (a town has more than the pass can take at once).
    const seen = lights.filter((l) => l.x + l.r > 0 && l.x - l.r < this.vw && l.y + l.r > 0 && l.y - l.r < this.vh);
    // A lightning flash lifts the whole scene's light a beat; fog thickens away from your hero (skyfx.ts).
    const fl = fogLook(map.theme), fog = fl && this.heroAt ? { x: this.heroAt[0] - cx, y: this.heroAt[1] - cy - 6, k: fl.k, px: PX, c: fl.c } : null;
    // Fenmere's mist banks, over the lit layer only (fenmistdraw.ts).
    const mist = map.fen ? mistFrame(map, room.time, (x, y) => [OX + x * PX - cx, OY + y * PX - cy], PX, 1, this.heroAt ? [this.heroAt[0] - cx, this.heroAt[1] - cy - 6] : null, [this.vw, this.vh]) : null;
    this.lighting.render(this.base, this.glowC, seen, flashAmb(map.theme.ambient, Math.max(flashOf(room.strikes, room.time), skyFlash(room))), fog, mist);
  }

  private cage(c: Ctx, x: number, y: number, now: number): void {
    const sway = Math.floor(now * 0.7) % 4 === 0 ? 1 : 0;
    blit(c, SPRITES.survivor, x + sway, y + 9);
    c.lit.fillStyle = '#6a6470';
    for (let bx = -12; bx <= 12; bx += 3) c.lit.fillRect(Math.round(x + bx), Math.round(y - 14), 1, 24);
    c.lit.fillStyle = '#57525e';
    for (const by of [-14, -3, 9]) c.lit.fillRect(Math.round(x - 12), Math.round(y + by), 25, 1);
  }
}
