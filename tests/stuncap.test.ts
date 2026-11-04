/** The stun cap (shared/stuncap.ts, sim/stuns.ts): one hero takes the same goblin's turn once every STUN_CAP.every s. */
import { describe, expect, it } from 'vitest';
import { STUN_CAP, TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { stun } from '../src/sim/stuns';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

describe('the stun cap', () => {
  it('the same hero is shrugged off inside the window and stuns again after it; another hero can at once', () => {
    const e = newEnemy(1, 'scrapper', 5, 5), ev: FightEvent[] = [];
    expect(stun(e, 'a', 0, 1, ev)).toBe(true);
    Object.assign(e, { act: 'chase' });
    expect(stun(e, 'a', STUN_CAP.every - 0.1, 1, ev)).toBe(false);
    expect(e.act).toBe('chase');
    expect(ev.some((x) => x.k === 'shrug')).toBe(true);
    // Someone else in the party can chain it.
    expect(stun(e, 'b', STUN_CAP.every - 0.1, 1, ev)).toBe(true);
    expect(e.act).toBe('stunned');
    expect(stun(e, 'a', STUN_CAP.every + 0.1, 1, ev)).toBe(true);
    // Nobody in particular (a fall): never capped.
    expect(stun(e, '', STUN_CAP.every + 0.2, 1, ev)).toBe(true);
  });

  it('in the room: a second flash bash from the same Warrior lands its damage but does not stun; a friend can', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    const me = room.join('me'), you = room.join('you');
    Object.assign(me, { weapon: 'sword', x: 9, y: 9, fx: 0, fy: -1 });
    Object.assign(you, { weapon: 'sword', x: 9, y: 6.8, fx: 0, fy: 1 });
    const e = Object.assign(newEnemy(10, 'scrapper', 9, 7.9), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false });
    room.enemies = [e];
    const seq: Record<string, number> = { me: 0, you: 0 };
    const run = (who: string, s: number, attack: boolean, ay: number) => {
      room.setIntent(who, { ...NO_INTENT, ay, attack, attackSeq: seq[who] });
      for (let k = 0; k < Math.round(s / TICK); k++) room.step(), Object.assign(e, { x: 9, y: 7.9, kvx: 0, kvy: 0, cooldown: 99 });
    };
    const bash = (who: string, ay: number) => (seq[who]++, run(who, 1, true, ay), run(who, 0.15, false, ay));
    bash('me', -1);
    expect(e.act).toBe('stunned');
    run('me', 1.2, false, -1);
    expect(e.act).not.toBe('stunned');
    const hp = e.hp;
    bash('me', -1);
    expect(e.hp).toBeLessThan(hp);
    expect(e.act).not.toBe('stunned');
    bash('you', 1);
    expect(e.act).toBe('stunned');
  });
});
