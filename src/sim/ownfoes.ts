/**
 * Where the hungry's newer sorts plug into the fight: each sort's turn (stepEnemy hands it over once the
 * goblin faces its way), what each does when its blow lands on a hero, how a new one is shaped, and the
 * room's once-a-tick work for them (who takes heart, nets, thieves, rams, roofs). One sort a file.
 */
import type { Rng } from '../shared/rng';
import { stepBanner, stepRouted, hearten } from './banner';
import { catchIn, stepNetter, stepNets } from './netter';
import { rob, stepThief, stepThieves } from './thief';
import { knockDown, shapeLogs, stepLogs, stepRams } from './logs';
import { onRoof, shapeRoofer, stepRoofer, stepRoofs } from './roofer';
import { stepKeeper, stepPacks, stepWolf, shapeWolf } from './wolves';
import { markSlick, stepOiler, stepSlicks, stepTorch, type Slick } from './oil';
import { maybeDig, stepSappers } from './sapper';
import { stepCrows, type Flock } from './crows';
import { stepBlind } from './blind';
import { crackWatch, stepIronhide } from './ironhide';
import { stepChalk, stepChalker } from './chalker';
import { walk } from './enemies';
import type { World } from './elements';
import type { Pickup } from './pickups';
import type { Enemy, EnemyAttack, FightEvent, Hero, Intent } from './types';

const OWN = new Set(['banner', 'netter', 'thief', 'log', 'wolf', 'keeper', 'oiler', 'torch', 'blind', 'ironhide', 'chalker']);

/** A new goblin of one of these sorts: its body (a small goblin's unless it says). */
export function shapeFoe(e: Enemy): void {
  if (e.variant === 'log') shapeLogs(e);
  if (e.variant === 'roofer') shapeRoofer(e);
  if (e.variant === 'wolf') shapeWolf(e);
}

/** `slow`: its chill, net and drum as a multiple; `speed` a small goblin's pace with it. */
export interface Turn { t: Hero; d: number; level: boolean; via: boolean; ux: number; uy: number; facing: number; speed: number; slow: number }

/** The room's things the newer sorts use. */
export interface Kit { slicks: Slick[] }

/** Its own turn, if it has one (true: done). Runs once it's awake and has turned toward its way. */
export function stepOwn(e: Enemy, q: Turn, heroes: Hero[], others: Enemy[], rng: Rng, now: number, dt: number, ev: FightEvent[], kit: Kit): boolean {
  if (onRoof(e)) return stepRoofer(e, q.t, q.d, q.facing, ev), true;
  if (stepRouted(e, heroes, now, dt)) return true;
  // A sapper above ground fights as a small goblin with a pick, till it digs in.
  if (e.variant === 'sapper') return q.level && !q.via && maybeDig(e, q.t, q.d, now, ev);
  if (!e.variant || !OWN.has(e.variant)) return false;
  // Making for a ramp to another level: just go.
  if (q.via) return walk(e, q.ux, q.uy, q.speed * Math.max(0.2, q.facing), dt), true;
  const { t, d, ux, uy, facing, speed } = q;
  if (e.variant === 'banner') stepBanner(e, t, d, ux, uy, facing, speed, others, now, dt, ev);
  else if (e.variant === 'netter') stepNetter(e, t, d, ux, uy, facing, speed, heroes, now, dt, ev);
  else if (e.variant === 'thief') stepThief(e, t, d, ux, uy, facing, speed, now, dt, ev);
  else if (e.variant === 'log') stepLogs(e, t, d, q.level, ux, uy, facing, rng, dt, ev);
  else if (e.variant === 'wolf') stepWolf(e, t, d, ux, uy, facing, q.slow, heroes, others, now, dt, ev);
  else if (e.variant === 'keeper') stepKeeper(e, t, d, ux, uy, facing, speed, others, now, dt, ev);
  else if (e.variant === 'oiler') stepOiler(e, t, d, ux, uy, facing, speed, now, dt, ev);
  else if (e.variant === 'torch') stepTorch(e, t, d, ux, uy, facing, speed, kit.slicks, heroes, now, dt, ev);
  else if (e.variant === 'blind') stepBlind(e, heroes, others, now, dt, ev);
  else if (e.variant === 'ironhide') stepIronhide(e, t, d, q.level, ux, uy, facing, speed, dt, ev);
  else if (e.variant === 'chalker') stepChalker(e, t, d, ux, uy, facing, speed, heroes, others, now, dt, ev);
  return true;
}

/** Its blow landed on `h` (after the damage): a net holds, a thief takes, the log knocks down. */
export function landed(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  if (a.kind === 'net') catchIn(h, now, ev);
  else if (a.kind === 'grab' && e.variant === 'thief') rob(e, h, ev);
  else if (a.kind === 'charge' && e.variant === 'log' && h.act !== 'down') knockDown(h);
}

/** Before the heroes move: the netted struggle and are cut loose. */
export function beforeHeroes(heroes: Hero[], intents: Map<string, Intent>, none: Intent, now: number, ev: FightEvent[]): void {
  stepNets(heroes, intents, none, now, ev);
}

/** Before the goblins move: who takes heart from a banner, and a fallen banner's rout; an ironhide's guard closing again. */
export function beforeFoes(enemies: Enemy[], now: number, ev: FightEvent[]): void {
  hearten(enemies, now, ev);
  crackWatch(enemies, now);
}

/** After they've moved: logs smash, roofs throw their archers, thieves get away or drop it, keepers' wolves scatter, sappers dig on, crows go up, oil spreads and burns. */
export function afterFoes(w: World, pickups: Pickup[], slicks: Slick[], flocks: Flock[], dt: number): Slick[] {
  stepRams(w);
  stepRoofs(w);
  stepThieves(w.enemies, w.heroes, pickups, w.ev);
  stepPacks(w.enemies, w.heroes, w.now, w.ev);
  stepSappers(w, dt);
  stepCrows(flocks, w.heroes, w.enemies, w.now, w.ev);
  stepChalk(w.heroes, w.enemies, w.now, w.ev);
  const left = stepSlicks(slicks, w, dt);
  markSlick(left, w.heroes);
  return left;
}

