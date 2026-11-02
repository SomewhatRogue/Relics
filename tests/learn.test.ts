/** What a trainer teaches: the class skill, the dodge's leave-behind; and a calm hound in training. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { laySnare, stepHound } from '../src/sim/ranger';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

describe('taught at the trainer', () => {
  it("a skill you haven't been taught does nothing; taught, it fires", () => {
    const room = new ArenaRoom(3, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { learned: [], relic: h.relics[0] });
    room.setIntent('me', { ...NO_INTENT, relicSeq: 1 });
    for (let i = 0; i < 10; i++) room.step();
    expect(h.act).not.toBe('throw');
    expect(h.relicReady[h.relics[0]] ?? 0).toBeLessThanOrEqual(room.time);
    h.learned = ['skill'];
    room.setIntent('me', { ...NO_INTENT, relicSeq: 2 });
    let fired = false;
    for (let i = 0; i < 30; i++) (room.step(), (fired ||= (h.relicReady[h.relics[0]] ?? 0) > room.time));
    expect(fired).toBe(true);
  });
  it("a Ranger's jump leaves a snare only once it's taught", () => {
    const room = new ArenaRoom(3, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { weapon: 'longbow', learned: ['skill'], rollX: 5, rollY: 5 });
    const snares: never[] = [], ev: FightEvent[] = [];
    laySnare(h, snares, 10, ev);
    expect(snares).toHaveLength(0);
    h.learned = ['skill', 'leave'];
    laySnare(h, snares, 10, ev);
    expect(snares).toHaveLength(1);
  });
  it('training: the hound never knocks a goblin off a blow aimed at you', () => {
    const room = new ArenaRoom(3, { scrappers: true });
    const h = room.join('me');
    Object.assign(h, { weapon: 'longbow', calmHound: true });
    const e = room.enemies.find((x) => x.kind === 'scrapper')!;
    Object.assign(e, { x: h.x + 1.5, y: h.y, alert: true, attack: { kind: 'stab', t: 0, windup: 9, active: 0.1, recover: 0.1, dmg: 1, knock: 0, range: 1, arc: 60, cx: 0, cy: 0, done: false } });
    for (let t = 0; t < 20; t += 1 / 30) stepHound(h, room.enemies, t, 1 / 30, []);
    expect(e.act).not.toBe('flinch');
    expect(e.attack).not.toBeNull();
  });
});
