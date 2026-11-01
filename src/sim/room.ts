/**
 * The fight room. Owns every hero and enemy and advances them in fixed ticks; it never knows about
 * sockets or screens. Solo, it runs in this browser; online, it runs in the party leader's browser
 * (the Come Bye host model) and friends send it Intents.
 */
import { ARENA } from '../shared/arena';
import { Rng } from '../shared/rng';
import { BLESSING, GUARD, HEAL_RADIUS, HERO, LODESTONE, TICK, TRAIT, WEAPONS, type Swing } from '../shared/tuning';
import { separate } from './bodies';
import { lobLodestone, shoot, smite, stepBolt, throwNet } from './bolts';
import { afflict, stepElements, type World } from './elements';
import { newEnemy, stepEnemy } from './enemies';
import { newHero, stepHero, type HeroActs } from './hero';
import { isDead } from './damage';
import { impacts } from './impacts';
import { release, stepCarry, tryGrab } from './grab';
import { dropProp, propImpacts, roomProps, stepLift, stepProps, sweepProps, tryLift } from './props';
import { dropFrom, stepDrops, takeLoot } from './loot';
import { bless, rally, shadowstep } from './relics';
import { forgedElement, has, traitsOf } from './traits';
import { fireHook, stepHook } from './hook';
import { stepJavelin, throwJavelin } from './javelin';
import { NO_INTENT, type Bolt, type Drop, type Enemy, type Prop, type FightEvent, type Hero, type Hook, type Intent, type Javelin } from './types';

export class ArenaRoom {
  time = 0;
  tick = 0;
  heroes: Hero[] = [];
  enemies: Enemy[] = [];
  javelins: Javelin[] = [];
  hooks: Hook[] = [];
  bolts: Bolt[] = [];
  drops: Drop[] = [];
  props: Prop[] = roomProps();
  intents = new Map<string, Intent>();
  /** Events from the latest tick (drawn as hits, sparks and sounds). */
  events: FightEvent[] = [];
  /** Positions before the latest tick, keyed 'h:<id>' or 'e:<id>', for drawing between ticks. */
  prev = new Map<string, [number, number]>();
  private rng: Rng;
  /** Loot rolls on their own stream, so a drop never shifts what the goblins do. */
  private lootRng: Rng;
  private acc = 0;

  /** `squire`: a training partner who stands by the swing dummy taking hits (someone to heal and bless). */
  constructor(seed = 1, opts: { scrappers?: boolean; squire?: boolean; props?: boolean } = {}) {
    this.rng = new Rng(seed);
    this.lootRng = new Rng(seed * 7919 + 13);
    const s = ARENA.spawn;
    this.enemies.push(newEnemy(1, 'butcher', s.butcher.x, s.butcher.y));
    this.enemies.push(newEnemy(2, 'dummy', s.dummy.x, s.dummy.y));
    this.enemies.push(newEnemy(3, 'swingDummy', s.swingDummy.x, s.swingDummy.y));
    if (opts.scrappers !== false) s.scrappers.forEach((p, i) => this.enemies.push(newEnemy(4 + i, 'scrapper', p.x, p.y)));
    this.squire = !!opts.squire;
    if (opts.props === false) this.props = [];
  }

  private squire: boolean;

  join(id: string): Hero {
    let h = this.heroes.find((x) => x.id === id);
    if (!h) {
      const s = ARENA.spawn.hero;
      h = newHero(id, s.x + this.heroes.length * 0.9, s.y);
      this.heroes.push(h);
      // The squire turns up with the first player (after them, so the room's first hero is a player).
      if (this.squire && !this.heroes.some((x) => x.id === 'squire')) {
        const w = ARENA.spawn.swingDummy, q = newHero('squire', w.x - 1.5, w.y + 1.5);
        Object.assign(q, { fx: 0.7, fy: -0.7 });
        this.heroes.push(q);
      }
    }
    return h;
  }

  setIntent(id: string, i: Intent): void {
    this.intents.set(id, i);
  }

  /** Advance by real time; runs whole ticks and returns the events they produced. */
  advance(dt: number): FightEvent[] {
    const out: FightEvent[] = [];
    this.acc = Math.min(this.acc + dt, TICK * 8);
    while (this.acc >= TICK) {
      this.acc -= TICK;
      this.step();
      out.push(...this.events);
    }
    return out;
  }

  /** Fraction of the way to the next tick, for smooth drawing. */
  get alpha(): number {
    return this.acc / TICK;
  }

  step(): void {
    for (const h of this.heroes) this.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of this.enemies) this.prev.set('e:' + e.id, [e.x, e.y]);
    this.events = [];
    this.time += TICK;
    this.tick++;
    const w: World = { heroes: this.heroes, enemies: this.enemies, javelins: this.javelins, props: this.props, now: this.time, ev: this.events };
    const hit = (e: Enemy, el: Hero['augments']['javelin'], n: number) => afflict(w, e, el, n);
    const acts: HeroActs = {
      fire: (h) => this.fire(h, w),
      loose: (h, s) => this.loose(h, s, w),
      struck: (h, e, n) => this.struck(h, e, n, w),
      sweep: (h, s) => sweepProps(h, s, w),
      grab: (h) => tryGrab(h, this.enemies, this.time, this.events) || tryLift(h, this.props, this.events),
      carry: (h, inp, walk) => (h.lifting ? stepLift(h, inp, w, TICK, walk) : stepCarry(h, inp, this.enemies, this.time, TICK, this.events, walk)),
      drop: (h) => (release(h, this.enemies, this.events), dropProp(h, this.props)),
    };
    const alive = new Set(this.enemies.filter((e) => !isDead(e)).map((e) => e.id));
    for (const h of this.heroes) takeLoot(h, this.intents.get(h.id) ?? NO_INTENT, this.drops, this.events);
    for (const h of this.heroes) stepHero(h, this.intents.get(h.id) ?? NO_INTENT, this.enemies, this.time, TICK, this.events, acts);
    this.javelins = this.javelins.filter((j) => stepJavelin(j, this.enemies, this.time, TICK, this.events, hit));
    this.hooks = this.hooks.filter((k) => stepHook(k, this.heroes, this.enemies, this.time, TICK, this.events, hit));
    this.bolts = this.bolts.filter((b) => stepBolt(b, w, TICK));
    for (const e of this.enemies) stepEnemy(e, this.heroes, this.rng, this.time, TICK, this.events);
    impacts(this.enemies, this.time, this.events);
    propImpacts(w);
    this.props = w.props = stepProps(w, TICK);
    stepElements(w);
    separate(this.heroes, this.enemies, this.props);
    for (const e of this.enemies) if (alive.has(e.id) && isDead(e)) dropFrom(e, this.heroes, this.drops, this.lootRng, this.events);
    this.drops = stepDrops(this.drops, TICK);
  }

  /** A melee blow landed: a forged weapon's element on a charged hit or counter; REAPER on a backstab or counter kill. */
  private struck(h: Hero, e: Enemy, n: number, w: World): void {
    const charged = (h.heavy && h.power >= 0.7) || h.counter;
    if (isDead(e)) {
      const tx = h.x - e.x, ty = h.y - e.y, rear = (e.fx * tx + e.fy * ty) / (Math.hypot(tx, ty) || 1) < GUARD.rearCos;
      if (has(h, 'reaper') && (h.counter || rear)) {
        const heal = Math.min(HERO.hp - h.hp, TRAIT.reaper);
        if (heal > 0) (h.hp += heal), w.ev.push({ k: 'heal', x: h.x, y: h.y, n: heal });
      }
      return;
    }
    if (charged) afflict(w, e, forgedElement(h), n);
  }

  private fire(h: Hero, w: World): void {
    const el = h.augments[h.relic];
    if (h.relic === 'hook') this.hooks.push(fireHook(h));
    else if (h.relic === 'javelin') this.javelins.push(throwJavelin(h));
    else if (h.relic === 'net') this.bolts.push(throwNet(h, el));
    else if (h.relic === 'lodestone') this.bolts.push(lobLodestone(h, this.aimDistance(h, LODESTONE.range, LODESTONE.fallback), el));
    else if (h.relic === 'shadow') shadowstep(h, this.enemies, w.ev);
    else if (h.relic === 'horn') rally(h, this.heroes, this.enemies, w.now, w.ev);
    else bless(h, this.heroes, this.intents.get(h.id), w.now, w.ev);
  }

  /** How far to throw or smite: to the mouse on a laptop, else to the goblin the hero faces, else a set distance. */
  private aimDistance(h: Hero, range: number, fallback: number): number {
    const i = this.intents.get(h.id);
    if (i && (i.ax || i.ay)) return Math.max(1.5, Math.min(range, Math.hypot(i.ax, i.ay)));
    let best = fallback, bd = -1;
    for (const e of this.enemies) {
      if (e.act === 'dead') continue;
      const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy), dot = (dx * h.fx + dy * h.fy) / (d || 1);
      if (d <= range && dot > 0.95 && dot > bd) (bd = dot), (best = d);
    }
    return best;
  }

  /** A swing's moment of release: loose its shot (spells cast with the equipped relic's augment), smite, heal. */
  private loose(h: Hero, s: Swing, w: World): void {
    // Blessed, a DEADEYE perfect release, a TEMPO hit after a dodge through a blow.
    let mult = (h.blessedUntil > w.now ? BLESSING.dmgMult : 1) * (h.heavy && h.perfect && has(h, 'deadeye') ? TRAIT.deadeye : 1);
    if (s.shot && h.tempoUntil > w.now) (mult *= TRAIT.tempo), (h.tempoUntil = -9);
    // A forged weapon's element rides a full draw (and every crossbow bolt); spells otherwise take the relic's.
    const full = (h.heavy && h.power >= 1) || !!WEAPONS[h.weapon].noCharge, forged = full ? forgedElement(h) : '';
    if (s.shot === 'smite') this.bolts.push(smite(h, s, this.aimDistance(h, s.range, 3.5), mult, traitsOf(h)));
    else if (s.shot) {
      const el = s.shot === 'arrow' || s.shot === 'bolt' ? forged : forged || h.augments[h.relic];
      this.bolts.push(shoot(h, s, el, mult, traitsOf(h)));
      w.ev.push({ k: 'shoot', x: h.x, y: h.y, dx: h.fx, dy: h.fy, kind: s.shot, el });
    }
    if (!s.heal) return;
    w.ev.push({ k: 'bless', x: h.x, y: h.y });
    for (const o of this.heroes) {
      if (o.act === 'down' || Math.hypot(o.x - h.x, o.y - h.y) > HEAL_RADIUS) continue;
      const n = Math.min(HERO.hp - o.hp, s.heal);
      if (n <= 0) continue;
      o.hp += n;
      w.ev.push({ k: 'heal', x: o.x, y: o.y, n });
    }
  }
}
