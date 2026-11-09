import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SFX_BANK, sfxFiles, type SfxName } from '../src/client/sfxbank';
import { createSfxPlayer, type SfxIO } from '../src/client/sfxplayer';
import { BUTCHER_ROUTES, GOBLIN_ROUTES, SFX_ROUTES, SPIDER_ROUTES, TOWN_ROUTES } from '../src/client/sfxroutes';
import { sfx } from '../src/client/sfx';
import { goblin, butcher } from '../src/client/voices';
import { spiderSounds } from '../src/client/spidersfx';
import { sfxTown } from '../src/client/sfxtown';

const DIR = new URL('../public/sfx/', import.meta.url);
const names = Object.keys(SFX_BANK) as SfxName[];

/** A stand-in audio context: decodes anything to a fake buffer and counts what it plays. */
function fakeIO(decode: (b: ArrayBuffer) => Promise<AudioBuffer>) {
  const played: AudioBuffer[] = [];
  const node = () => ({ connect: (n: unknown) => n, gain: { value: 1 }, playbackRate: { value: 1 } });
  const ac = {
    currentTime: 0,
    decodeAudioData: decode,
    createGain: node,
    createBufferSource: () => ({ ...node(), buffer: null as AudioBuffer | null, start(this: { buffer: AudioBuffer }) { played.push(this.buffer); } }),
  };
  return { io: { ac: ac as unknown as BaseAudioContext, out: {} as AudioNode } as SfxIO, played };
}

describe('recorded sound effects', () => {
  it('has every take of every sound in public/sfx, and nothing there it does not know', () => {
    const want = names.flatMap(sfxFiles);
    for (const f of want) expect(existsSync(new URL(f, DIR)), f).toBe(true);
    expect(readdirSync(DIR).filter((f) => f.endsWith('.mp3')).sort()).toEqual([...want].sort());
  });

  it('routes only sounds the kit makes, to sounds the bank has', () => {
    const pairs: [object, Record<string, unknown>][] = [[sfx, SFX_ROUTES], [goblin, GOBLIN_ROUTES], [butcher, BUTCHER_ROUTES], [spiderSounds, SPIDER_ROUTES], [sfxTown, TOWN_ROUTES]];
    for (const [target, routes] of pairs) for (const k of Object.keys(routes)) expect(typeof (target as Record<string, unknown>)[k], k).toBe('function');
    const call = (r: unknown, ...a: unknown[]) => (r as (...b: unknown[]) => unknown)(...a);
    for (const r of [call(SFX_ROUTES.death, 'burst'), call(SFX_ROUTES.death, 'behead'), call(SFX_ROUTES.hit, true), call(GOBLIN_ROUTES.drum, 1, true), call(GOBLIN_ROUTES.chant, 7)]) {
      const name = Array.isArray(r) ? r[0] : r;
      expect(names).toContain(name as SfxName);
    }
    // The UI and tuned notes stay synthesized.
    for (const k of ['levelup', 'fanfare', 'relic', 'weapon', 'drop', 'loot', 'perfect', 'tempo', 'charged', 'stunned', 'well', 'rally']) expect(SFX_ROUTES[k], k).toBeUndefined();
  });

  it('says no (so the synth plays) until a sound has loaded, then plays a take', async () => {
    const { io, played } = fakeIO(async () => ({ duration: 0.5 }) as AudioBuffer);
    const p = createSfxPlayer(() => io, async () => new ArrayBuffer(8));
    expect(p.play('parry_ring')).toBe(false);
    await p.load('parry_ring');
    expect(p.state('parry_ring')).toBe('ready');
    expect(p.play('parry_ring')).toBe(true);
    expect(played.length).toBe(1);
  });

  it('falls back cleanly when files fail to load or decode, and stops asking for them', async () => {
    let fetches = 0;
    const { io } = fakeIO(() => Promise.reject(new Error('bad mp3')));
    const p = createSfxPlayer(() => io, (f) => (f.startsWith('hit_slice') && fetches++, Promise.reject(new Error('404'))));
    expect(p.play('hit_slice')).toBe(false);
    await p.load('hit_slice');
    expect(p.state('hit_slice')).toBe('failed');
    const after = fetches;
    expect(p.play('hit_slice')).toBe(false);
    expect(fetches).toBe(after);
    const q = createSfxPlayer(() => io, async () => new ArrayBuffer(8));
    await q.load('swing_sword');
    expect(q.play('swing_sword')).toBe(false);
  });

  it('plays nothing (and fetches nothing) before sound is unlocked', () => {
    let fetches = 0;
    const p = createSfxPlayer(() => null, () => (fetches++, Promise.resolve(new ArrayBuffer(8))));
    expect(p.play('blink')).toBe(false);
    expect(fetches).toBe(0);
  });
});
