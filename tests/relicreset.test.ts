/** Relics re-earned, once (shared/relicreset.ts, docs/design/relics.md section 4): an older hero keeps the javelin only. */
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { makeRelic } from '../src/shared/relicitems';
import { newProfile, type Profile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { RELICS_VERSION, fitEarned } from '../src/shared/relicreset';
import { fromJson } from '../src/client/save';

/** A hero saved before relics were earned: a javelin, a hook (carried) and a bomb. */
function old(carry: 'hook' | 'javelin' | '' = 'hook'): Profile {
  const p = newProfile('WARRIOR', 'Old') as Profile & { relicsV?: number };
  delete p.relicsV;
  const rng = new Rng(4), relics = (['javelin', 'hook', 'bomb'] as const).map((k) => makeRelic(rng, k));
  p.relics = relics;
  p.relic = carry ? relics.find((r) => r.kind === carry)!.id : '';
  p.relicNew = [relics[1].id, relics[2].id];
  return p;
}
const load = (p: Profile) => fromJson({ heroes: [p], current: 0, world: newWorld() })!.heroes[0];

describe('the save step', () => {
  it('keeps the javelin only, carried in place of what was, and notes how many went', () => {
    const was = old(), h = load(JSON.parse(JSON.stringify(was)));
    expect(h.relics.map((r) => r.kind)).toEqual(['javelin']);
    expect(h.relics[0]).toEqual(was.relics[0]);
    expect(h.relic).toBe(h.relics[0].id);
    expect(h.relicNew).toEqual([]);
    expect(h.relicsGone).toBe(2);
    expect(h.relicsV).toBe(RELICS_VERSION);
  });

  it('runs once: a hero loaded again keeps what they have, a relic won since included', () => {
    const h = load(old());
    const hook = makeRelic(new Rng(9), 'hook');
    h.relics.push(hook);
    const again = load(JSON.parse(JSON.stringify(h)));
    expect(again.relics.map((r) => r.id)).toEqual([h.relics[0].id, hook.id]);
  });

  it('nothing carried stays nothing carried; no javelin, nothing kept', () => {
    expect(load(old('')).relic).toBe('');
    const p = old();
    p.relics = p.relics.filter((r) => r.kind !== 'javelin');
    const h = load(p);
    expect(h.relics).toEqual([]);
    expect(h.relic).toBe('');
    expect(h.relicsGone).toBe(2);
  });

  it('of two javelins, the carried one stays; a new hero is never touched', () => {
    const p = { relics: [makeRelic(new Rng(1), 'javelin'), makeRelic(new Rng(2), 'javelin')], relic: '' };
    p.relic = p.relics[1].id;
    fitEarned(p, {});
    expect(p.relics.map((r) => r.id)).toEqual([p.relic]);
    const fresh = newProfile('MAGE', 'New');
    fresh.relics.push(makeRelic(new Rng(3), 'bomb'));
    expect(load(fresh).relics).toHaveLength(1);
    expect(load(fresh).relicsGone).toBeUndefined();
  });
});

describe('telling them', () => {
  it('a card once, saying the javelin stayed; then nothing', async () => {
    (globalThis as unknown as Record<string, unknown>).matchMedia ??= () => ({ matches: true, addEventListener: () => undefined });
    const { relicsGoneNews } = await import('../src/client/relicgone');
    const h = load(old());
    const card = relicsGoneNews(h)!;
    expect(card.html).toContain('Relic Javelin');
    expect(relicsGoneNews(h)).toBeNull();
    expect(load(JSON.parse(JSON.stringify(h))).relicsGone).toBeUndefined();
  });
});
