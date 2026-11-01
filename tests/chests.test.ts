import { describe, expect, it } from 'vitest';
import { TICK } from '../src/shared/tuning';
import { board, deepDive } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { ArenaRoom } from '../src/sim/room';
import { CHEST } from '../src/sim/chests';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};
const withChest = (chained = false) => {
  const room = new ArenaRoom(1, { scrappers: false, chests: [{ x: 9, y: 6, chained }] });
  const a = room.join('me'), b = room.join('you');
  Object.assign(a, { x: 9, y: 7 });
  Object.assign(b, { x: 4, y: 12, weapon: 'longbow' });
  return { room, a, b, c: room.chests[0] };
};

describe('chests', () => {
  it('every job ends with a chest; a deep job adds a chained one', () => {
    const job = board(2, false)[0];
    expect(planRoom(job, job.rooms - 1).chests.length).toBeGreaterThanOrEqual(1);
    const deep = deepDive(2);
    expect(planRoom(deep, deep.rooms - 1).chests.some((c) => c.chained)).toBe(true);
  });

  it('opens after the pause, in the colour of the best thing inside, a roll for each player that only they see', () => {
    const { room, c } = withChest();
    room.setIntent('me', intent({ openSeq: 1, open: c.id }));
    const ev = run(room, 0.4);
    expect(c.state).toBe('opening');
    expect(ev.some((e) => e.k === 'chest' && e.state === 'opening')).toBe(true);
    run(room, CHEST.open);
    expect(c.state).toBe('open');
    const mine = room.drops.filter((d) => d.owner === 'me'), theirs = room.drops.filter((d) => d.owner === 'you');
    expect(mine.length).toBeGreaterThanOrEqual(1);
    expect(theirs.length).toBeGreaterThanOrEqual(1);
    // The ranger's roll is for a ranger.
    for (const d of theirs) if (d.item.kit) expect(['longbow', 'shortbow', 'crossbow']).toContain(d.item.kit);
  });

  it("walk off and it shuts again; nobody else can take your roll", () => {
    const { room, a, b, c } = withChest();
    room.setIntent('me', intent({ openSeq: 1, open: c.id }));
    run(room, 0.3);
    a.x = 2;
    run(room, 0.1);
    expect(c.state).toBe('shut');
    a.x = 9;
    room.setIntent('me', intent({ openSeq: 2, open: c.id }));
    run(room, CHEST.open + 0.2);
    const d = room.drops.find((x) => x.owner === 'me')!;
    Object.assign(b, { x: d.x, y: d.y });
    room.setIntent('you', intent({ takeSeq: 1, take: d.id }));
    run(room, 0.1);
    expect(room.drops.includes(d)).toBe(true);
  });

  it('a chained chest stays shut while the named butcher lives', () => {
    const { room, c } = withChest(true);
    const boss = room.enemies.find((e) => e.kind === 'butcher')!;
    Object.assign(boss, { name: 'MAWL', act: 'stunned', actDur: 99, x: 2, y: 2 });
    room.setIntent('me', intent({ openSeq: 1, open: c.id }));
    expect(run(room, 0.2).some((e) => e.k === 'chained')).toBe(true);
    expect(c.state).toBe('shut');
  });
});
