/** The fanfare and the Roll's relics (client/relicfanfare.ts, shared/relicroll.ts; docs/design/relics.md section 2). */
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { makeRelic } from '../src/shared/relicitems';
import { newWorld } from '../src/shared/story';
import { contribute } from '../src/shared/worldsync';
import { cleanRelicClaim, ROLL_RELICS } from '../src/shared/relicroll';
import { clean } from '../api/_world';

const g = globalThis as unknown as Record<string, unknown>;
g.window ??= globalThis;
g.document ??= { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null, toDataURL: () => '' }) };
g.matchMedia ??= () => ({ matches: true, addEventListener: () => undefined });
const hero = (name: string) => ({ id: 'h' + name.toLowerCase().padEnd(6, 'x'), name, cls: 'WARRIOR' as const });

describe('the Roll names the first to win each relic', () => {
  it('first claim stands for good; the javelin and nonsense never count', () => {
    const w = newWorld();
    contribute(w, { hero: hero('KYLE'), relics: ['lodestone'] });
    contribute(w, { hero: hero('BRYN'), relics: ['lodestone', 'knuckle'] });
    expect(w.firstRelics).toEqual({ lodestone: 'KYLE', knuckle: 'BRYN' });
    expect(ROLL_RELICS).not.toContain('javelin');
    expect(cleanRelicClaim(['javelin', 'hook', 'hook', 'nope', 3])).toEqual(['hook']);
    expect(cleanRelicClaim(['javelin'])).toBeUndefined();
    expect(clean({ hero: hero('KYLE'), relics: ['javelin', 'knuckle'] })?.relics).toEqual(['knuckle']);
  });
});

describe('the moment', () => {
  it('a won relic: its name, where from, what it does, the Roll and the pack button', async () => {
    const { fanfareHtml } = await import('../src/client/relicfanfare');
    const r = { ...makeRelic(new Rng(3), 'knuckle'), from: 'hempen' };
    const mine = fanfareHtml({ item: r, carried: true, tip: false, sound: false, first: 'KYLE', mine: true });
    expect(mine).toContain("BUTCHER'S KNUCKLE");
    expect(mine).toContain("Hangman's Wood");
    expect(mine).toContain('data-pack');
    expect(mine).toContain('first in Wickhold');
    const theirs = fanfareHtml({ item: r, carried: false, tip: false, sound: false, first: 'BRYN<', mine: false });
    expect(theirs).toContain('BRYN&#60;');
  });

  it('the game marks a won relic with the Roll, claims it, and queues the moment', async () => {
    const { Game } = await import('../src/client/game');
    const game = new Game();
    game.create('WARRIOR', 'kyle');
    game.skipWood();
    const h = game.hero, won = { ...makeRelic(new Rng(5), 'lodestone'), from: 'doorkeepers' };
    h.found = [...h.found, won];
    (game as unknown as { keepGear: (h: unknown) => void }).keepGear(h);
    const m = game.relicNews.find((n) => n.item.id === won.id)!;
    expect(m).toMatchObject({ first: game.profile.name, mine: true });
    expect(game.world.firstRelics?.lodestone).toBe(game.profile.name);
  });

  it("the Roll's list: each won relic, its first winner or nobody yet", async () => {
    const { relicRollHtml } = await import('../src/client/relicrollui');
    const html = relicRollHtml({ firstRelics: { hook: 'KYLE' } });
    expect(html).toContain('GRAPPLING HOOK');
    expect(html).toContain('KYLE');
    expect(html).toContain('Nobody yet');
  });
});
