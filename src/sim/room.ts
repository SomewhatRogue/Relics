/**
 * The fight room. Owns every hero and enemy and advances them in fixed ticks; it never knows about
 * sockets or screens. Solo, it runs in this browser; online, it runs in the party leader's browser
 * (the Come Bye host model) and friends send it Intents.
 */
import { ARENA } from '../shared/arena';
import { Rng } from '../shared/rng';
import { FLASK, HEAL_RADIUS, HERO, TICK, type Swing } from '../shared/tuning';
import { separate } from './bodies';
import { lob, shoot, stepBolt } from './bolts';
import { afflict, stepElements, type World } from './elements';
import { newEnemy, stepEnemy } from './enemies';
import { blowHorn } from './gale';
import { newHero, stepHero, type HeroActs } from './hero';
import { fireHook, stepHook } from './hook';
import { stepJavelin, throwJavelin } from './javelin';
import { NO_INTENT, type Bolt, type Enemy, type FightEvent, type Hero, type Hook, type Intent, type Javelin } from './types';

export class ArenaRoom {
  time = 0;
  tick = 0;
  heroes: Hero[] = [];
  enemies: Enemy[] = [];
  javelins: Javelin[] = [];
  hooks: Hook[] = [];
  bolts: Bolt[] = [];
  intents = new Map<string, Intent>();
  /** Events from the latest tick (drawn as hits, sparks and sounds). */
  events: FightEvent[] = [];
  /** Positions before the latest tick, keyed 'h:<id>' or 'e:<id>', for drawing between ticks. */
  prev = new Map<string, [number, number]>();
  private rng: Rng;
  private acc = 0;

  constructor(seed = 1, opts: { scrappers?: boolean } = {}) {
    this.rng = new Rng(seed);
    const s = ARENA.spawn;
    this.enemies.push(newEnemy(1, 'butcher', s.butcher.x, s.butcher.y));
    this.enemies.push(newEnemy(2, 'dummy', s.dummy.x, s.dummy.y));
    this.enemies.push(newEnemy(3, 'swingDummy', s.swingDummy.x, s.swingDummy.y));
    if (opts.scrappers !== false) s.scrappers.forEach((p, i) => this.enemies.push(newEnemy(4 + i, 'scrapper', p.x, p.y)));
  }

  join(id: string): Hero {
    let h = this.heroes.find((x) => x.id === id);
    if (!h) {
      const s = ARENA.spawn.hero;
      h = newHero(id, s.x + this.heroes.length * 0.9, s.y);
      this.heroes.push(h);
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
    const w: World = { heroes: this.heroes, enemies: this.enemies, javelins: this.javelins, now: this.time, ev: this.events };
    const hit = (e: Enemy, el: Hero['augments']['javelin'], n: number) => afflict(w, e, el, n);
    const acts: HeroActs = { fire: (h) => this.fire(h, w), loose: (h, s) => this.loose(h, s, w) };
    for (const h of this.heroes) stepHero(h, this.intents.get(h.id) ?? NO_INTENT, this.enemies, this.time, TICK, this.events, acts);
    this.javelins = this.javelins.filter((j) => stepJavelin(j, this.enemies, this.time, TICK, this.events, hit));
    this.hooks = this.hooks.filter((k) => stepHook(k, this.heroes, this.enemies, this.time, TICK, this.events, hit));
    this.bolts = this.bolts.filter((b) => stepBolt(b, w, TICK));
    for (const e of this.enemies) stepEnemy(e, this.heroes, this.rng, this.time, TICK, this.events);
    stepElements(w);
    separate(this.heroes, this.enemies);
  }

  private fire(h: Hero, w: World): void {
    const el = h.augments[h.relic];
    if (h.relic === 'hook') this.hooks.push(fireHook(h));
    else if (h.relic === 'javelin') this.javelins.push(throwJavelin(h));
    else if (h.relic === 'horn') blowHorn(h, w, el);
    else this.bolts.push(lob(h, this.lobDistance(h), el));
  }

  /** How far to lob: to the mouse on a laptop, else to the goblin the hero faces, else a set distance. */
  private lobDistance(h: Hero): number {
    const i = this.intents.get(h.id);
    if (i && (i.ax || i.ay)) return Math.max(1.5, Math.min(FLASK.range, Math.hypot(i.ax, i.ay)));
    let best = FLASK.fallback, bd = -1;
    for (const e of this.enemies) {
      if (e.act === 'dead') continue;
      const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy), dot = (dx * h.fx + dy * h.fy) / (d || 1);
      if (d <= FLASK.range && dot > 0.95 && dot > bd) (bd = dot), (best = d);
    }
    return best;
  }

  /** A swing's moment of release: loose its shot (a staff casts with the equipped relic's augment), heal with it. */
  private loose(h: Hero, s: Swing, w: World): void {
    if (s.shot) {
      const el = s.shot === 'arrow' ? '' : h.augments[h.relic];
      this.bolts.push(shoot(h, s, el));
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
