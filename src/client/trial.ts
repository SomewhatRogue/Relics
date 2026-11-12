/**
 * Trying a class before you pick it (Kyle's friend, 2026-11-12: "experiment with them and their first
 * ability ... almost like a sandbox"; Kyle: "only starting skills for now. And a ui where you can spawn
 * goblins or butchers. One butcher max at a time, three gobbos max"). From the class page, TRY puts a
 * hero of that class in the Training Yard with every button, its starting skill and a javelin that never
 * runs dry. Nothing is kept: the hero is a scratch save that's never written (client/save.ts store), and
 * DONE puts your own heroes back and returns to the class page.
 */
import './trial.css';
import { CLASS_NAME } from '../shared/classes';
import type { HeroClass } from '../shared/weapons';
import { SKILL_CHOICES } from '../shared/magic';
import { newProfile } from '../shared/progress';
import { makeRelic, relicMax } from '../shared/relicitems';
import { Rng } from '../shared/rng';
import { isDead } from '../sim/damage';
import type { Game } from './game';
import type { Save } from './save';

/** How many of each may be up at once, and how far from you they come in (tiles). */
export const TRIAL = { goblins: 3, butchers: 1, away: 5 };
type Kind = 'scrapper' | 'butcher';

export class Trial {
  private real: Save | null = null;
  private ids = new Map<number, Kind>();
  private cls: HeroClass = 'WARRIOR';
  private look = 0;
  private el = document.createElement('div');

  constructor(private g: Game, private done: (cls: HeroClass, look: number) => void) {
    this.el.id = 'trialbar';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const d = (e.target as HTMLElement).closest('button')?.dataset;
      if (d?.spawn) this.spawn(d.spawn as Kind);
      else if (d?.clear !== undefined) this.clear();
      else if (d?.done !== undefined) this.finish();
    });
  }

  get on(): boolean {
    return !!this.real;
  }

  /** A hero of `cls` in the yard, kept nowhere. */
  start(cls: HeroClass, look: number): void {
    if (this.real) return;
    const g = this.g, skill = SKILL_CHOICES[cls][0], jav = makeRelic(new Rng(7), 'javelin');
    const p = { ...newProfile(cls, 'TRIAL'), look, prologue: true, tally: true, skill, learned: ['skill'], belt: ['bitter', 'bitter', 'bitter'], relics: [jav], relic: jav.id };
    Object.assign(this, { real: g.save, cls, look });
    this.ids.clear();
    g.save = { heroes: [p as never], current: 0, world: g.save.world, trial: true };
    g.enterYard();
    this.el.hidden = false;
    this.draw();
  }

  /** Your own heroes back; nothing from the yard comes with them. */
  end(): void {
    if (!this.real) return;
    this.g.save = this.real;
    this.real = null;
    this.ids.clear();
    this.el.hidden = true;
    this.g.enterTown();
  }

  private finish(): void {
    this.end();
    this.done(this.cls, this.look);
  }

  /** Each frame: the javelin full, the bar's counts; never out of the yard. */
  frame(): void {
    if (!this.real) return;
    const g = this.g;
    if (g.mode !== 'yard') g.enterYard();
    for (const r of g.hero?.found ?? []) r.charge = relicMax(r);
    this.draw();
  }

  private up(kind: Kind): number {
    return this.g.room.enemies.filter((e) => this.ids.get(e.id) === kind && !isDead(e)).length;
  }

  private spawn(kind: Kind): void {
    const g = this.g, h = g.hero, most = kind === 'butcher' ? TRIAL.butchers : TRIAL.goblins;
    if (!h || this.up(kind) >= most) return;
    const a = (this.ids.size * 2.4) % (Math.PI * 2), m = g.room.map;
    const x = Math.max(2, Math.min(m.w - 2, h.x + Math.cos(a) * TRIAL.away)), y = Math.max(2, Math.min(m.h - 2, h.y + Math.sin(a) * TRIAL.away));
    const e = g.room.addFoe(kind, x, y);
    e.alert = true;
    this.ids.set(e.id, kind);
    this.draw();
  }

  private clear(): void {
    this.g.room.enemies = this.g.room.enemies.filter((e) => !this.ids.has(e.id));
    this.ids.clear();
    this.draw();
  }

  private said = '';
  private draw(): void {
    const gob = this.up('scrapper'), bu = this.up('butcher');
    const html = `<b>TRYING THE ${CLASS_NAME[this.cls]}</b>` +
      `<button data-spawn="scrapper"${gob >= TRIAL.goblins ? ' disabled' : ''}>GOBLIN ${gob}/${TRIAL.goblins}</button>` +
      `<button data-spawn="butcher"${bu >= TRIAL.butchers ? ' disabled' : ''}>BUTCHER ${bu}/${TRIAL.butchers}</button>` +
      `<button data-clear>CLEAR</button><button data-done class="primary">DONE</button>`;
    if (html !== this.said) this.el.innerHTML = this.said = html;
  }
}
