/**
 * Fewer doors, bigger insides (docs/plans/atlas.md section 6, approved by Kyle 2026-11-05: "bigger insides
 * and houses, but less of them"). On a job's street, one house you can go into (`limit`; the Barrowfields'
 * hamlet keeps two), plus the house the torch-bearers are burning with someone in it (layout 4's SMOKE: the
 * room's objective). The rest are shut for good, boarded up or burnt out: no door, no light at it, no
 * woodpile, so nobody goes checking doors. Nothing is lost: the shut houses' captives and chests move into
 * the one that's kept, which is made one of the big ones (a longhouse, manor or tithe barn), so the job's
 * captives and pay stay the same. Its door says which houses it took in (`cottage:big:3c.5b`: the houses at
 * blocks 3 and 5, a cottage and a barn), and its inside (shared/inside.ts) lays their cages and chests out.
 * Pure: the same street on every screen.
 */
import type { Block } from './arena.js';
import { Rng } from './rng.js';

/** A house's door kind, whatever's been added to it (`cottage:held`, `barn:big:2c`). */
export const baseDoor = (door: string) => door.split(':')[0];

/** What the door of a house that took others in says: [block index, door kind] of each. */
export function mergedOf(door: string): [number, string][] {
  const p = door.split(':');
  if (p[1] !== 'big' || !p[2]) return [];
  return p[2].split('.').map((m) => [Number(m.slice(0, -1)), m.endsWith('b') ? 'barn' : 'cottage']);
}
export const promoted = (door: string) => door.split(':')[1] === 'big';

const FATE_RANK: Record<string, number> = { standing: 0, wrecked: 1, burning: 2 };

/** Apply the rule to a street's houses (after shared/houses.ts settle has given each its seed and fate). */
export function doorsRule(blocks: Block[], limit = 1): void {
  const doors = blocks.map((b, i) => ({ b, i })).filter(({ b }) => !!b.door && (b.kind === 'house' || b.kind === 'barn') && b.look !== undefined && !b.door.startsWith('side:'));
  // The house being burned with someone in it is the scene's (always kept); the rest share `limit`.
  const rest = doors.filter(({ b }) => !b.door!.endsWith(':held'));
  if (rest.length <= limit) return;
  // Kept: standing before half fallen in before smouldering, a cottage (rooms to its big house) before a barn, the bigger first.
  const keep = [...rest].sort((p, q) => (FATE_RANK[p.b.fate ?? 'standing'] ?? 3) - (FATE_RANK[q.b.fate ?? 'standing'] ?? 3) ||
    (p.b.kind === 'house' ? 0 : 1) - (q.b.kind === 'house' ? 0 : 1) || q.b.w * q.b.h - p.b.w * p.b.h || p.i - q.i).slice(0, limit);
  const shut = rest.filter((d) => !keep.includes(d));
  // Each shut house's things go to the nearest kept one.
  const into = new Map<number, string[]>(keep.map((k) => [k.i, []]));
  for (const s of shut) {
    const to = keep.reduce((a, k) => (Math.hypot(k.b.x - s.b.x, k.b.y - s.b.y) < Math.hypot(a.b.x - s.b.x, a.b.y - s.b.y) ? k : a));
    into.get(to.i)!.push(`${s.i}${baseDoor(s.b.door!) === 'barn' ? 'b' : 'c'}`);
    const r = new Rng(s.b.look! * 17 + 5).next();
    s.b.shut = s.b.fate === 'burning' || r < 0.4 ? 'burnt' : 'boarded';
    delete s.b.door;
  }
  for (const k of keep) {
    const m = into.get(k.i)!;
    if (!m.length) continue;
    k.b.door = `${baseDoor(k.b.door!)}:big:${m.join('.')}`;
    k.b.big = true;
  }
}
