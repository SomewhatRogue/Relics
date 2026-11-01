/**
 * The fight room. Owns every hero and enemy and advances them in fixed ticks; it never knows about
 * sockets or screens. Solo, it runs in this browser; online, it runs in the party leader's browser
 * (the Come Bye host model) and friends send it Intents.
 */
import { ARENA } from '../shared/arena';
import { Rng } from '../shared/rng';
import { TICK } from '../shared/tuning';
import { separate } from './bodies';
import { newEnemy, stepEnemy } from './enemies';
import { newHero, stepHero } from './hero';
import { fireHook, stepHook } from './hook';
import { stepJavelin, throwJavelin } from './javelin';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Hook, type Intent, type Javelin } from './types';

export class ArenaRoom {
  time = 0;
  tick = 0;
  heroes: Hero[] = [];
  enemies: Enemy[] = [];
  javelins: Javelin[] = [];
  hooks: Hook[] = [];
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
    const fire = (h: Hero) => (h.relic === 'hook' ? this.hooks.push(fireHook(h)) : this.javelins.push(throwJavelin(h)));
    for (const h of this.heroes) stepHero(h, this.intents.get(h.id) ?? NO_INTENT, this.enemies, this.time, TICK, this.events, fire);
    this.javelins = this.javelins.filter((j) => stepJavelin(j, this.enemies, this.time, TICK, this.events));
    this.hooks = this.hooks.filter((k) => stepHook(k, this.heroes, this.enemies, this.time, TICK, this.events));
    for (const e of this.enemies) stepEnemy(e, this.heroes, this.rng, this.time, TICK, this.events);
    separate(this.heroes, this.enemies);
  }
}
