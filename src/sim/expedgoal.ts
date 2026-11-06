/**
 * An expedition's banner and marks (sim/goal.ts and targets.ts ask here when the room has one): the
 * job nearest done or the first not done, how many are left, and the way out once they're done. The
 * way out counts as the goal met (the room's exit opens) once the watch has come.
 */
import { EXTRACT_WORDS, goalWords } from '../shared/expedjob';
import { WOOD_EXIT } from '../shared/hangwords';
import { FEN_EXIT } from '../shared/fenwords';
import { EXPED } from '../shared/tuning';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { Target } from './targets';

const say = (s: string, run: Run) => s.split('{boss}').join(run.job.boss ?? '');

export function expedGoal(run: Run, room: ArenaRoom): { text: string; done: boolean } {
  const x = room.exped!;
  // Hangman's Wood: out by the north path once Hempen's dead; the fire to light while it's still cold and you're past the gibbet.
  if (x.phase === 'leave') return { text: room.map.hang ? WOOD_EXIT.leave : room.map.fen ? FEN_EXIT.leave : EXTRACT_WORDS.leave, done: true };
  if (x.phase === 'hold') return { text: EXTRACT_WORDS.hold(Math.max(0, Math.ceil(EXPED.extract - x.held))), done: false };
  if (x.phase === 'open') return { text: EXTRACT_WORDS.open, done: false };
  const left = x.goals.filter((g) => !g.done), busy = left.find((g) => g.p > 0) ?? left[0];
  const n = left.length > 1 ? ` (${left.length} jobs left)` : '';
  // Fenmere: the fire on the rise once you're over the ford and the captives are out.
  const fen = !!room.map.fen, due = x.goals.some((g) => (fen ? g.kind === 'prisoners' : g.kind === 'winch') && g.done);
  const words = goalWords(run.job), fire = x.wood && !x.wood.check.lit && due ? `. ${fen ? FEN_EXIT.check : WOOD_EXIT.check}` : '';
  return { text: busy ? say(words[busy.kind].todo, run) + n + fire : EXTRACT_WORDS.shut, done: false };
}

/** Where each job not yet done is, or the beacon once they are; a prisoner camp marks its cages. */
export function expedTargets(room: ArenaRoom): Target[] {
  const x = room.exped!;
  if (x.phase !== 'shut') return x.phase === 'leave' && room.map.exit ? [{ kind: 'out', x: room.map.exit.x + room.map.exit.w / 2, y: 1 }] : [{ kind: 'job', x: x.zone.x, y: x.zone.y }];
  const out: Target[] = [];
  for (const g of x.goals) if (!g.done) {
    if (g.kind === 'prisoners') for (const p of room.props) if (p.kind === 'cage' && !p.broken && Math.hypot(p.x - g.x, p.y - g.y) < 3) out.push({ kind: 'cage', x: p.x, y: p.y });
    if (g.kind === 'butcher') {
      const b = room.enemies.find((e) => e.id === g.foe);
      if (b) out.push({ kind: 'boss', x: b.x, y: b.y, id: b.id });
      else out.push({ kind: 'job', x: g.x, y: g.y });
    } else if (g.kind !== 'prisoners') out.push({ kind: 'job', x: g.x, y: g.y });
  }
  return out;
}
