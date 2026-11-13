/**
 * The income measure (docs/design/economy.md slice 2): plays a real job from the board through the client's
 * own Game, headless, and counts what it pays in copper. The hero is kept on its feet and its blows made
 * lethal (only in this process: BLESSING.dmgMult), then walks onto every goblin, every coin pile and every
 * chest, room by room, and the job is finished through the game's own payout. So the coins are the sim's
 * own drops and the pay is the game's own sum; only the fighting is skipped. Not a test on its own:
 * scripts/income.ts prints the table, tests/income.test.ts holds the targets.
 */
import { TICK, BLESSING, newProfile, type HeroClass } from '../src/shared/tuning';
import { board, type Job } from '../src/shared/jobs';
import { sellValue } from '../src/shared/prices';
import { isDead } from '../src/sim/damage';
import { runRoom, isFinal } from '../src/sim/run';
import { NO_INTENT, type Intent } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage ??= { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

/** One job's take, in copper: the pay, the coins picked up (kills, chests), and what the gear found sells for. */
export interface Take { job: string; size: string; rooms: number; pay: number; coins: number; gear: number; total: number; secs: number; kills: Record<string, number> }

/** The most a room is given (seconds of the room's own clock) before the bot moves on. */
const ROOM_MOST = 150;

type Spot = { x: number; y: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

/** Play `job` at `level` as `cls`, alone, and return what it paid. */
export function playJob(job: Job, level: number, cls: HeroClass = 'WARRIOR'): Take {
  store.clear();
  const mult = BLESSING.dmgMult;
  (BLESSING as Loose).dmgMult = 1000;
  const g = new Game() as Loose;
  g.create(cls, 'income');
  Object.assign(g.profile, { level, prologue: true, wish: false });
  const before = g.profile.gold, bagBefore = new Set(g.profile.bag);
  g.startJob(job, 1);
  let seq = 1, secs = 0;
  const kills: Record<string, number> = {};
  const seen = new Set<number>();
  const it: Intent = { ...NO_INTENT };
  for (let r = 0; r < job.rooms; r++) {
    let quiet = 0, t = 0;
    while (t < ROOM_MOST && quiet < 2) {
      const room = g.room, h = g.hero;
      Object.assign(h, { hp: h.maxHp ?? h.hp, blessedUntil: room.time + 60, lying: false });
      if (g.run) g.run.downs = 0;
      Object.assign(it, { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false });
      const foe = room.enemies.find((e: Loose) => !isDead(e) && !e.respawns && !e.escaped && e.kind !== 'dummy');
      const coin = room.pickups.find((p: Loose) => p.gold);
      const chest = room.chests?.find((c: Loose) => c.state === 'shut' && !c.chained);
      const to: Spot | null = coin ?? foe ?? chest ?? null;
      if (to) {
        quiet = 0;
        const dx = to.x - h.x, dy = to.y - h.y, d = Math.hypot(dx, dy) || 1;
        if (d > 0.8) Object.assign(h, { x: to.x - (dx / d) * 0.6, y: to.y - (dy / d) * 0.6 });
        Object.assign(it, { ax: dx / d, ay: dy / d });
        if (to === foe && h.act === 'idle') it.attackSeq = seq++;
        if (to === chest) Object.assign(it, { open: chest.id, openSeq: seq++ });
        if (to === coin) Object.assign(h, { x: coin.x, y: coin.y });
      } else quiet += TICK;
      g.step(TICK, it);
      for (const e of g.room.enemies as Loose[]) if (isDead(e) && !seen.has(e.id) && !e.respawns) {
        seen.add(e.id);
        const k = e.name ? 'named' : e.kind === 'butcher' ? 'butcher' : e.kind === 'scrapper' ? (e.bow ? 'archer' : 'scrapper') : e.kind;
        kills[k] = (kills[k] ?? 0) + 1;
        if (e.big) kills.big = (kills.big ?? 0) + 1;
      }
      t += TICK;
    }
    secs += t;
    if (g.mode !== 'run') break;
    if (isFinal(g.run)) break;
    g.run.index++;
    g.place(runRoom(g.run), undefined, g.hero);
    seen.clear();
  }
  const coins = g.run?.gold ?? 0;
  if (g.mode === 'run') g.finish('won');
  (BLESSING as Loose).dmgMult = mult;
  const gear = g.profile.bag.filter((i: Loose) => !bagBefore.has(i)).reduce((s: number, i: Loose) => s + sellValue(i), 0);
  const total = g.profile.gold - before;
  return { job: job.title, size: job.size ?? 'medium', rooms: job.rooms, pay: total - coins, coins, gear, total, secs: Math.round(secs), kills };
}

/** The board's ordinary jobs over `days` days (no Deep, no instances, no expeditions: their pay is their chat's). */
export function plainJobs(days: number, from = 1): Job[] {
  const out: Job[] = [];
  for (let d = from; d < from + days; d++) for (const j of board(d)) if (!j.deep && !j.instance && !j.exped && !j.quest) out.push(j);
  return out;
}

export { newProfile };
