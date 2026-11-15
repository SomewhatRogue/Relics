/** Mother Isolde's relic quests (shared/relicquests.ts, docs/design/relics.md section 1): rare, one at a time. */
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { makeRelic } from '../src/shared/relicitems';
import { RELIC_QUEST, endQuest, questKind, questOffered, takeQuest, type QuestHolder } from '../src/shared/relicquests';

const g = globalThis as unknown as Record<string, unknown>;
g.window ??= globalThis;
g.document ??= { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null, toDataURL: () => '' }) };
g.matchMedia ??= () => ({ matches: true, addEventListener: () => undefined });

const hero = (level: number): QuestHolder => ({ level, relics: [makeRelic(new Rng(1), 'javelin')] });

describe('rare, one at a time', () => {
  it('nothing before level 5; at 5 one, for a relic a built boss gives; never two open', () => {
    const p = hero(4);
    expect(questOffered(p, 1)).toBeUndefined();
    p.level = 5;
    const k = questOffered(p, 1)!;
    expect(['knuckle', 'lodestone']).toContain(k);
    expect(takeQuest(p, 1)).toBe(k);
    expect(p.rq?.open).toBe(k);
    p.level = 10;
    expect(questOffered(p, 99)).toBeUndefined();
  });

  it('won: it ends; the next comes at the next fifth level or a long while after, never sooner', () => {
    const p = hero(5), k = takeQuest(p, 3)!;
    expect(endQuest(p, 4)).toBe(false);
    p.relics.push(makeRelic(new Rng(2), k));
    expect(endQuest(p, 6)).toBe(true);
    expect(p.rq?.open).toBeUndefined();
    p.level = 9;
    expect(questOffered(p, 6 + RELIC_QUEST.days - 1)).toBeUndefined();
    expect(questOffered(p, 6 + RELIC_QUEST.days)).toBeDefined();
    p.level = 10;
    expect(questOffered(p, 7)).toBeDefined();
  });

  it('every findable relic held: she has nothing; an old hero high up is offered one at once', () => {
    const p = hero(30);
    expect(questOffered(p, 1)).toBeDefined();
    p.relics.push(makeRelic(new Rng(3), 'knuckle'), makeRelic(new Rng(4), 'lodestone'));
    expect(questKind(p)).toBeUndefined();
    expect(questOffered(p, 1)).toBeUndefined();
  });
});

describe('at the church', () => {
  it('the reliquary offers it through Odric, Isolde says where; taken, it shows open; the relic won ends it', async () => {
    const { Game } = await import('../src/client/game');
    const { openStep } = await import('../src/client/churchrelics');
    const game = new Game();
    game.create('WARRIOR', 'kyle');
    game.skipWood();
    game.profile.level = 5;
    let html = '';
    const panel = { show: (_t: string, h: string) => void (html = h) } as never;
    openStep(game, panel, () => undefined);
    expect(html).toContain('HEAR ISOLDE OUT');
    const kind = takeQuest(game.profile, game.world.day)!;
    openStep(game, panel, () => undefined);
    expect(html).toContain('MOTHER ISOLDE SENT YOU');
    expect(html).not.toContain('HEAR ISOLDE OUT');
    const h = game.hero;
    h.found = [...h.found, { ...makeRelic(new Rng(8), kind), from: kind === 'knuckle' ? 'hempen' : 'doorkeepers' }];
    (game as unknown as { keepGear: (h: unknown) => void }).keepGear(h);
    expect(game.profile.rq?.open).toBeUndefined();
  });
});
