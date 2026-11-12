/**
 * Everyone and everything that moves, placed each frame from the room: heroes, goblins, the freed,
 * hounds, telegraphs, props, chests, drops, shots, javelins, rings on the floor and the way out.
 * Positions are eased between the room's ticks the way the 2D scene eases them (room.prev, alpha).
 */
import { exitMats } from '../exitmark';
import { makeExitMat } from './exitmat3d';
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import { asleep } from '../foes';
import { LEDGE_H } from './ground';
import { clsOf, heroKey, makeHero, type HeroFig } from './heroes3d';
import { poseHero } from './heropose3d';
import { foeLook, makeGoblin, type FoeFig } from './goblins3d';
import { makeDummy, makeSpider } from './spiders3d';
import { poseFoe } from './foepose3d';
import { makeFolk, makeHound, poseFolk, poseHound } from './folk3d';
import { Pool, type Held } from './pool3d';
import { makeTele, shapeTele } from './teleg3d';
import { strikeShape } from '../../sim/stormshape';
import { sparkShapes } from '../../sim/sparkshape';
import { quakeShapes } from '../../sim/quakeshape';
import { columnShapes } from '../../sim/columnshape';
import { LISTENER } from '../../shared/listentune';
import { caveLook } from '../cavedraw';
import { cartPath } from '../../sim/cartpath';
import { blastShape } from '../../sim/blastshape';
import { shakeProp } from './prophit3d';
import { makeChest, makeCoal, makeHole, makePickup, makeProp, poseChest, type ChestFig } from './props3d';
import { makeBottle, makeCoins, makeLoot } from './loot3d';
import { itemCol } from '../uniquelook';
import { boltLook, makeBolt, makeExit, makeJavelin, makeRing, placeBolt, placeJavelin } from './shots3d';
import { surfAt } from './hazards3d';
import { isRound } from '../../sim/types';
import { relicCol } from '../relicicons';
import type { Figure } from './rig';
import { BOXFIGS } from './look';

/** Heroes are drawn on their own layer, after the rest: as a silhouette wherever a wall or a roof hides them, then over it as themselves. */
export const XRAY_LAYER = 1;
function xray<T extends Figure>(f: T): T {
  f.root.traverse((o) => !o.userData.keep && o.layers.set(XRAY_LAYER));
  return f;
}

export type Lerp = (key: string, x: number, y: number) => [number, number];

export class Actors {
  readonly group = new THREE.Group();
  private heroes = new Pool<HeroFig>(this.group);
  private foes = new Pool<FoeFig>(this.group);
  private folk = new Pool<Figure>(this.group);
  private hounds = new Pool<Figure>(this.group);
  private teles = new Pool<Held & { root: THREE.Mesh }>(this.group);
  private things = new Pool<Held>(this.group);
  private chests = new Pool<ChestFig>(this.group);
  private walked = new Map<string, [number, number, number]>();

  /** How far (tiles) this thing has walked, for its stride. */
  private stride(key: string, x: number, y: number): number {
    const w = this.walked.get(key);
    if (!w) return this.walked.set(key, [x, y, 0]), 0;
    w[2] += Math.min(1, Math.hypot(x - w[0], y - w[1]));
    w[0] = x;
    w[1] = y;
    return w[2];
  }

  /** One of THE LISTENER's dripstone columns: leaning its way, toppling about its foot along the lean, or broken (as client/columndraw.ts). */
  private column(p: ArenaRoom['props'][number], t: number): void {
    const l = p.lean ?? { x: 0, y: 1 }, n = Math.hypot(l.x, l.y) || 1, lx = l.x / n, lz = l.y / n;
    const o = this.things.get('p' + p.id, p.fallen ? 'colrubble' : 'column', () => ({ root: makeProp(p.fallen ? 'colrubble' : 'column') })).root;
    o.position.set(p.x, 0, p.y);
    o.rotation.set(0, 0, 0);
    if (p.fallen) return void o.rotation.set(0, Math.atan2(lx, lz), 0);
    const k = p.fallAt === undefined ? 0 : Math.min(1, Math.max(0, 1 - (p.fallAt - t) / LISTENER.column.fall)), th = 0.1 + (Math.PI / 2 - 0.1) * k ** 2.6;
    o.quaternion.setFromAxisAngle(new THREE.Vector3(lz, 0, -lx), th);
  }

  update(room: ArenaRoom, meId: string, now: number, lerp: Lerp): void {
    const t = room.time, lift = (z?: number) => (z ?? 0) * LEDGE_H;
    for (const p of [this.heroes, this.foes, this.folk, this.hounds, this.teles, this.things, this.chests]) p.begin();
    // The figures are flat cards (cards3d.ts) unless ?figs=3d: then these, built from boxes.
    if (BOXFIGS) for (const h of room.heroes) this.hero(h, lerp, now, lift(h.z));
    for (const e of room.enemies) {
      if (BOXFIGS) this.foe(room, e, now, lerp);
      if (e.attack && (e.act === 'attack' || (e.boss?.who === 'listener' && e.boss.lmove === 'rise'))) {
        // A round one on water lies on its surface, with the oil it's about (hazards3d.ts).
        const m = this.teles.get('t' + e.id, '', () => ({ root: makeTele() })).root, a = e.attack;
        m.visible = shapeTele(m, a, now, e.z ? lift(e.z) : isRound(a.kind) ? surfAt(room.map, a.cx, a.cy) : 0);
      }
    }
    // A storm's lightning coming: its circle, the striped edge (sim/stormshape.ts, the shape the room judges).
    for (const s of room.strikes ?? []) {
      const a = strikeShape(s, t);
      if (!a) continue;
      const m = this.teles.get('k' + s.id, '', () => ({ root: makeTele() })).root;
      m.visible = shapeTele(m, a, now, 0);
    }
    // The Haulier's sparks coming down (sim/sparkshape.ts, the circles the room judges).
    for (const e of room.enemies) [...sparkShapes(e), ...quakeShapes(e)].forEach((a, i) => {
      const m = this.teles.get('s' + e.id + ':' + i, '', () => ({ root: makeTele() })).root;
      m.visible = shapeTele(m, a, now, 0);
    });
    // THE LISTENER's cave: the torches going out in the dark (cavedraw.ts); each falling column's lane (sim/columnshape.ts).
    caveLook(room, now);
    columnShapes(room.props, t).forEach((a, i) => {
      const m = this.teles.get('col' + i, '', () => ({ root: makeTele() })).root;
      m.visible = shapeTele(m, a, now, 0);
    });
    // A held cart's aim (sim/cartpath.ts, the spot the room stops it): a flat gold strip out to there.
    for (const p of room.props) {
      const h = p.kind === 'cart' && p.heldBy ? room.heroes.find((x) => x.id === p.heldBy) : undefined;
      if (!h) continue;
      const end = cartPath(p.x, p.y, h.fx, h.fy, p.radius), len = Math.max(0.1, Math.hypot(end.x - p.x, end.y - p.y));
      const m = this.teles.get('aim' + p.id, '', () => ({ root: new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8 })) })).root;
      m.scale.x = len;
      m.position.set((p.x + end.x) / 2, 0.04, (p.y + end.y) / 2);
      m.rotation.y = -Math.atan2(end.y - p.y, end.x - p.x);
    }
    // A keg, oil or embers about to go up (sim/blastshape.ts, the circle the room judges).
    for (const e of room.enemies) {
      const a = blastShape(e, t);
      if (!a) continue;
      const m = this.teles.get('b' + e.id, '', () => ({ root: makeTele() })).root;
      m.visible = shapeTele(m, a, now, 0);
    }
    if (BOXFIGS) for (const s of room.survivors ?? []) {
      if (s.gone) continue;
      const [x, y] = lerp('s:' + s.id, s.x, s.y), f = this.folk.get('s' + s.id, '', () => makeFolk(s.id));
      poseFolk(f, s, t, this.stride('s' + s.id, x, y));
      f.root.position.set(x, f.root.position.y + lift(s.z), y);
    }
    // THE LEECHMAN's old windlass on the west bank: a drum on two timbers, a crank, a chain (as client/windlassdraw.ts).
    if (room.map.windlass) {
      const w = room.map.windlass, o = this.things.get('windlass', 'windlass', () => ({ root: makeProp('windlass') })).root;
      o.position.set(w.x, 0, w.y);
    }
    for (const p of room.props) {
      if (p.broken) continue;
      if (p.kind === 'column') { this.column(p, t); continue; }
      // THE LEECHMAN's log is the gangway block's trunk (client/staithebox.ts): nothing more to stand here.
      if (p.kind === 'log') continue;
      const carrier = p.lifted ? room.heroes.find((h) => h.lifting === p.id) : undefined, o = this.things.get('p' + p.id, p.kind, () => ({ root: makeProp(p.kind) })).root;
      const [x, y] = carrier ? lerp('h:' + carrier.id, carrier.x, carrier.y) : [p.x, p.y];
      o.position.set(x, carrier ? 1.3 : (p.air ?? 0) > 0 ? 0.3 : lift(p.z), y);
      o.rotation.set(0, p.spin, (p.air ?? 0) > 0 ? p.spin * 2 : 0);
      if (!carrier) shakeProp(o, p, t);
    }
    (room.map.holes ?? []).forEach((h, i) => this.things.get('hole' + i, '', () => ({ root: makeHole() })).root.position.set(h.x, 0, h.y));
    for (const c of room.chests) {
      const f = this.chests.get('c' + c.id, '', makeChest);
      f.root.position.set(c.x, 0, c.y);
      poseChest(f, c);
    }
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      // Lying on the floor as itself, a glint down its blade now and then (loot3d.ts).
      const o = this.things.get('d' + d.id, d.item.quality, () => ({ root: makeLoot(d.item, itemCol(d.item), d.id) })).root;
      o.position.set(d.x, 0, d.y);
      o.userData.tick?.(now);
    }
    for (const p of room.pickups) this.things.get('k' + p.id, '', () => ({ root: p.gold ? makeCoins(p.gold) : p.potion ? makeBottle(p.potion) : makePickup(false, undefined, p.relic && relicCol(p.relic)) })).root.position.set(p.x, 0, p.y);
    for (const c of room.coals) this.things.get('o' + c.id, '', () => ({ root: makeCoal() })).root.position.set(c.x, Math.sin(now * 6 + c.id) * 0.02, c.y);
    for (const b of room.bolts) placeBolt(this.things.get('b' + b.id, boltLook(b), () => ({ root: makeBolt(b) })).root, b, 0);
    for (const j of room.javelins) placeJavelin(this.things.get('j' + j.id, '', () => ({ root: makeJavelin() })).root, j, 0);
    // (A wind-up bow's reach is dotted on the overlay, as in the flat view: found3d.ts.)
    room.zones.forEach((z, i) => z.kind !== 'sentry' && z.kind !== 'firewall' && z.kind !== 'stormring' && z.kind !== 'caltrops' && z.kind !== 'blinkburst' && z.kind !== 'taunt' && z.kind !== 'skystrike' && this.things.get('z' + i, String(z.r), () => ({ root: makeRing(z.r, 0xffd27a, true, 0.12) })).root.position.set(z.x, 0.04, z.y));
    // (Snares, smoke and steam, poison and oil: hazards3d.ts.)
    const ex = room.map.exit;
    if (ex && ex.y < 1) this.things.get('exit', String(room.exitOpen), () => ({ root: makeExit(ex.w, room.exitOpen) })).root.position.set(ex.x, 0, ex.y - 0.4);
    // A way out through a side wall: the same stakes (or chevrons), turned to face along it.
    else if (ex && (ex.x < 1 || ex.x + ex.w > room.map.w - 1) && ex.w < 1.5) {
      const e = this.things.get('exit', `side${ex.x < 1 ? 'W' : 'E'}${room.exitOpen}`, () => ({ root: makeExit(ex.h, room.exitOpen) })).root, west = ex.x < 1;
      e.rotation.y = west ? Math.PI / 2 : -Math.PI / 2;
      e.position.set(west ? ex.x - 0.4 : ex.x + ex.w + 0.4, 0, west ? ex.y + ex.h : ex.y);
    }
    // The lit threshold with its arrow out, in front of every way out (../exitmark.ts).
    if (room.exitOpen) exitMats(room.map).forEach((t, i) => this.things.get('exitmat' + i, `${t.w}:${t.d}:${t.out}:${t.dir}`, () => ({ root: makeExitMat(t) })).root.position.set(t.x, 0, t.y));
    for (const p of [this.heroes, this.foes, this.folk, this.hounds, this.teles, this.things, this.chests]) p.end();
  }

  private foe(room: ArenaRoom, e: ArenaRoom['enemies'][number], now: number, lerp: Lerp): void {
    const lift = (z?: number) => (z ?? 0) * LEDGE_H;
    const f = this.foes.get('e' + e.id, foeLook(e), () => (e.kind === 'spider' || e.kind === 'brood' || e.kind === 'nest' ? makeSpider(e) : e.kind === 'dummy' || e.kind === 'swingDummy' ? makeDummy(e) : makeGoblin(e)));
    const carrier = room.heroes.find((h) => h.carrying === e.id);
    const [x, y] = carrier ? lerp('h:' + carrier.id, carrier.x, carrier.y) : lerp('e:' + e.id, e.x, e.y);
    if (!poseFoe(f, e, room.time, now, this.stride('e' + e.id, x, y))) f.root.visible = false;
    f.root.position.x = x;
    f.root.position.z = y;
    f.root.position.y += carrier ? 1.25 + lift(carrier.z) : lift(e.z);
    if (carrier) (f.mid.rotation.z = Math.PI / 2), (f.legs[0].rotation.x = Math.sin(now * 14) * 0.6);
    if (asleep(room.map, e)) (f.mid.rotation.z = Math.PI / 2), (f.mid.position.y = 0.15);
  }

  private hero(h: Hero, lerp: Lerp, now: number, up: number): void {
    const [x, y] = lerp('h:' + h.id, h.x, h.y), f = this.heroes.get('h' + h.id, heroKey(h), () => xray(makeHero(clsOf(h.weapon), h.look ?? 0, h.weapon)));
    poseHero(f, h, now, this.stride('h' + h.id, x, y));
    f.root.position.set(x, f.root.position.y + up, y);
    if (h.hound) {
      const d = h.hound, [dx, dy] = lerp('d:' + h.id, d.x, d.y), g = this.hounds.get('d' + h.id, '', makeHound);
      poseHound(g, d, this.stride('d' + h.id, dx, dy));
      g.root.position.set(dx, 0, dy);
    }
  }
}
