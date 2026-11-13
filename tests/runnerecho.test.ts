/**
 * A new hero's runner as the others in the street see it (client/runnerecho.ts; Kyle, 2026-11-13):
 * nothing freezes for them, they see the runner come out of the hall, run up, stand while it's said,
 * and go home, and can't talk to them. The runner goes out as one short word at its start and at each
 * change of phase (townfolk.ts), never with each step.
 */
import { describe, expect, it, vi } from 'vitest';

const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: { to: string; d: Record<string, unknown> }[] = [];
  open_ = true;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  send(to: string, d: Record<string, unknown>) {
    this.sent.push({ to, d: JSON.parse(JSON.stringify(d)) });
  }
  close() {}
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });

const { Townfolk } = await import('../src/client/townfolk');
const { RunnerEchoes } = await import('../src/client/runnerecho');
const { runnerWay } = await import('../src/client/runnerpath');
import type { GameMap } from '../src/shared/arena';
import type { RunnerWord } from '../src/client/runner';

const street = (): GameMap => ({
  name: 'WICKHOLD', w: 40, h: 30, wallFace: 3, rounds: [], braziers: [], hero: { x: 10, y: 10 },
  blocks: [{ x: 2, y: 12, w: 6, h: 4, kind: 'house', door: 'hall' }, { x: 6, y: 6, w: 10, h: 3, kind: 'house' }],
  npcs: [{ name: 'RECRUIT WAT', x: 20, y: 20, talk: 'chat', look: 'soldier' }],
} as unknown as GameMap);

describe("others' runners", () => {
  it('heard as a word, played along the same way: out of the hall, up to the hero, standing, home', () => {
    const map = street(), e = new RunnerEchoes(), stand = { x: 10.5, y: 4 }, way = runnerWay(map, 'hall', stand);
    const word = (phase: number, age: number): RunnerWord => [0, stand.x, stand.y, phase, age];
    e.frame(map, [{ id: 'a', w: word(0, 0), heard: 10 }], 10);
    const wat = () => map.npcs!.find((n) => n.name === 'WAT');
    // In the doorway, the one at the whetstone away while he's out; no TALK (mute).
    expect(wat()).toMatchObject({ x: way[0].x, y: way[0].y, mute: true });
    expect(map.npcs!.some((n) => n.name === 'RECRUIT WAT')).toBe(false);
    e.frame(map, [{ id: 'a', w: word(0, 0), heard: 10 }], 11);
    expect(Math.hypot(wat()!.x - way[0].x, wat()!.y - way[0].y)).toBeGreaterThan(3);
    e.frame(map, [{ id: 'a', w: word(1, 0.5), heard: 20 }], 20);
    expect(wat()).toMatchObject({ x: stand.x, y: stand.y, walking: false });
    // Home: gone from the street, and the one at the whetstone back.
    e.frame(map, [{ id: 'a', w: word(2, 30), heard: 30 }], 30);
    expect(wat()).toBeUndefined();
    e.frame(map, [], 31);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
  });

  it('not in the street: none shown; a Ranger\'s is a hound, no person', () => {
    const map = street(), e = new RunnerEchoes();
    e.frame(null, [{ id: 'a', w: [0, 10, 4, 0, 0], heard: 0 }], 0);
    expect(map.npcs!.length).toBe(1);
    e.frame(map, [{ id: 'b', w: [1, 10, 4, 0, 0], heard: 0 }], 0.5);
    expect(e.hounds()).toHaveLength(1);
    expect(map.npcs!.length).toBe(1);
  });

  it('goes over the relay as one word a phase, and the other screen hears it', () => {
    socks.length = 0;
    const a = new Townfolk('aaa'), b = new Townfolk('bbb');
    const me = (x: number, r?: RunnerWord) => ({ n: 'A', w: 'sword', at: 'WICKHOLD', p: [x, 3, 0, 1, 0] as [number, number, number, number, number], ...(r ? { r } : {}) });
    a.step(me(10), 0, 0.05), b.step({ ...me(20), n: 'B' }, 0, 0.05);
    const [sa, sb] = socks;
    const pass = (from: Fake, to: Fake, fromId: string) => {
      for (const m of from.sent.splice(0)) to.onMessage({ t: 'msg', from: fromId, d: m.d });
    };
    // B arrives: says hi; A answers.
    sb.onMessage({ t: 'role', role: 'peer' });
    pass(sb, sa, 'bbb'), pass(sa, sb, 'aaa');
    expect(b.runners('WICKHOLD')).toEqual([]);
    // A's runner out: one word, then nothing more while it runs (the age isn't news).
    let sent = 0;
    for (let t = 1; t < 4; t += 0.05) {
      a.step(me(10, [0, 10.5, 4, 0, Math.round((t - 1) * 100) / 100]), t, 0.05);
      sent += sa.sent.length;
      pass(sa, sb, 'aaa');
    }
    expect(sent).toBe(1);
    expect(b.runners('WICKHOLD')).toMatchObject([{ id: 'aaa', w: [0, 10.5, 4, 0, 0] }]);
    // The line: a second word.
    a.step(me(10, [0, 10.5, 4, 1, 0]), 5, 0.05);
    expect(sa.sent.length).toBe(1);
    pass(sa, sb, 'aaa');
    expect(b.runners('WICKHOLD')[0].w[3]).toBe(1);
    // Over: the next word has none, and B forgets it.
    a.step(me(10), 7, 0.05);
    pass(sa, sb, 'aaa');
    expect(b.runners('WICKHOLD')).toEqual([]);
    // A broken word is dropped whole.
    sb.onMessage({ t: 'msg', from: 'ccc', d: { k: 'me', n: 'C', w: 'sword', at: 'WICKHOLD', p: [1, 1, 0, 1, 0], r: [9, 1, 1, 0, 0] } });
    expect(b.runners('WICKHOLD').map((x) => x.id)).toEqual([]);
  });
});
