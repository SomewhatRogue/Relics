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
import { POTION, WEAPONS } from '../../shared/tuning';
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
import { makeChest, makeCoal, makeDrop, makePickup, makeProp, poseChest, type ChestFig } from './props3d';
import { boltLook, makeBolt, makeExit, makeJavelin, makeRing, makeSmoke, placeBolt, placeJavelin } from './shots3d';
import { TIERS } from '../../shared/gear';
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

  update(room: ArenaRoom, meId: string, now: number, lerp: Lerp): void {
    const t = room.time, lift = (z?: number) => (z ?? 0) * LEDGE_H, me = room.heroes.find((h) => h.id === meId);
    for (const p of [this.heroes, this.foes, this.folk, this.hounds, this.teles, this.things, this.chests]) p.begin();
    // The figures are flat cards (cards3d.ts) unless ?figs=3d: then these, built from boxes.
    if (BOXFIGS) for (const h of room.heroes) this.hero(h, lerp, now, lift(h.z));
    for (const e of room.enemies) {
      if (BOXFIGS) this.foe(room, e, now, lerp);
      if (e.attack && e.act === 'attack') {
        const m = this.teles.get('t' + e.id, '', () => ({ root: makeTele() })).root;
        const pw = me ? WEAPONS[me.weapon].parryWindow + me.lenience : 0.3;
        m.visible = shapeTele(m, e.attack, pw, now, lift(e.z));
      }
    }
    if (BOXFIGS) for (const s of room.survivors ?? []) {
      if (s.gone) continue;
      const [x, y] = lerp('s:' + s.id, s.x, s.y), f = this.folk.get('s' + s.id, '', () => makeFolk(s.id));
      poseFolk(f, s, t, this.stride('s' + s.id, x, y));
      f.root.position.set(x, f.root.position.y + lift(s.z), y);
    }
    for (const p of room.props) {
      if (p.broken) continue;
      const carrier = p.lifted ? room.heroes.find((h) => h.lifting === p.id) : undefined, o = this.things.get('p' + p.id, p.kind, () => ({ root: makeProp(p.kind) })).root;
      const [x, y] = carrier ? lerp('h:' + carrier.id, carrier.x, carrier.y) : [p.x, p.y];
      o.position.set(x, carrier ? 1.3 : (p.air ?? 0) > 0 ? 0.3 : lift(p.z), y);
      o.rotation.set(0, p.spin, (p.air ?? 0) > 0 ? p.spin * 2 : 0);
    }
    for (const c of room.chests) {
      const f = this.chests.get('c' + c.id, '', makeChest);
      f.root.position.set(c.x, 0, c.y);
      poseChest(f, c);
    }
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      const o = this.things.get('d' + d.id, d.item.quality, () => ({ root: makeDrop(TIERS[d.item.quality].col) })).root;
      o.position.set(d.x, Math.sin(now * 3 + d.id) * 0.05, d.y);
      o.rotation.y = now * 0.8 + d.id;
    }
    for (const p of room.pickups) this.things.get('k' + p.id, '', () => ({ root: makePickup(!!p.gold, p.potion, p.relic && relicCol(p.relic)) })).root.position.set(p.x, 0, p.y);
    for (const c of room.coals) this.things.get('o' + c.id, '', () => ({ root: makeCoal() })).root.position.set(c.x, Math.sin(now * 6 + c.id) * 0.02, c.y);
    for (const b of room.bolts) placeBolt(this.things.get('b' + b.id, boltLook(b), () => ({ root: makeBolt(b) })).root, b, 0);
    for (const j of room.javelins) placeJavelin(this.things.get('j' + j.id, '', () => ({ root: makeJavelin() })).root, j, 0);
    // (A wind-up bow's reach is dotted on the overlay, as in the flat view: found3d.ts.)
    room.zones.forEach((z, i) => z.kind !== 'sentry' && this.things.get('z' + i, String(z.r), () => ({ root: makeRing(z.r, 0xffd27a, true, 0.12) })).root.position.set(z.x, 0.04, z.y));
    room.snares.forEach((s, i) => this.things.get('n' + i, '', () => ({ root: makeRing(0.35, 0x8a6a3a, false, 0.06) })).root.position.set(s.x, 0.03, s.y));
    room.smokes.forEach((s, i) => {
      const o = this.things.get('m' + i, '', () => ({ root: makeSmoke(POTION.smokeR) })).root;
      o.position.set(s.x, 0, s.y);
      o.rotation.y = now * 0.2;
    });
    (room.puddles ?? []).forEach((p) => this.things.get('u' + p.id, String(p.r), () => ({ root: makeRing(p.r, 0x5a8a20, true, p.r) })).root.position.set(p.x, 0.025, p.y));
    const ex = room.map.exit;
    if (ex && ex.y < 1) this.things.get('exit', String(room.exitOpen), () => ({ root: makeExit(ex.w, room.exitOpen) })).root.position.set(ex.x, 0, ex.y - 0.4);
    // The lit threshold with its arrow out, in front of every way out (../exitmark.ts).
    if (room.exitOpen) exitMats(room.map).forEach((t, i) => this.things.get('exitmat' + i, `${t.w}:${t.d}:${t.out}`, () => ({ root: makeExitMat(t) })).root.position.set(t.x, 0, t.y));
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
