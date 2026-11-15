/** The reliquary at the church (client/churchrelics.ts, docs/design/relics.md section 3). */
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { makeRelic } from '../src/shared/relicitems';

const g = globalThis as unknown as Record<string, unknown>;
g.window ??= globalThis;
g.document ??= { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null, toDataURL: () => '' }) };
g.matchMedia ??= () => ({ matches: true, addEventListener: () => undefined });

describe('the reliquary', () => {
  it('every relic held with where it was won and CARRY, the carried one tagged; the rest dark with where they are said to be', async () => {
    const { Game } = await import('../src/client/game');
    const { openStep } = await import('../src/client/churchrelics');
    const game = new Game();
    game.create('WARRIOR', 'kyle');
    game.skipWood();
    const knuckle = { ...makeRelic(new Rng(4), 'knuckle'), from: 'hempen' };
    game.profile.relics.push(knuckle);
    let title = '', html = '';
    openStep(game, { show: (t: string, h: string) => ((title = t), (html = h)) } as never, () => undefined);
    expect(title).toBe('THE RELIQUARY');
    expect(html).toContain("From Hempen, in Hangman's Wood");
    expect(html.match(/CARRY THIS ONE/g)).toHaveLength(1);
    expect(html).toContain('CARRYING');
    expect(html).toContain('STILL TO WIN');
    // A relic won stays yours: nothing to give one up (Kyle, 2026-11-15).
    expect(html).not.toContain('GIVE IT UP');
    expect(html).not.toContain('data-rop="ask"');
    expect(html).toContain('down the Open Cut');
    expect(html).not.toContain("Said to be in Hempen's fist");
    game.carry(knuckle.id);
    expect(game.profile.relic).toBe(knuckle.id);
  });
});
