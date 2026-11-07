import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CLASS_ORDER, WEAPONS, CLASS_KITS } from '../src/shared/tuning';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { EFFORTS, GAPS, HERO_VOICES, LOOK_VOICE, PEOPLE, PRAYING, VOICE_BANK, VOICE_NAMES, heroVoice, personAt, voiceFiles, voiceGain } from '../src/client/voicebank';
import { createTownVoice } from '../src/client/townvoice';
import { createHeroVoice } from '../src/client/herovoice';
import { createSamplePlayer, type SfxIO } from '../src/client/sfxplayer';

// The voices' bus sits on the effects bus; here a stand-in context stands for an unlocked one.
const fake = vi.hoisted(() => {
  const played: unknown[] = [];
  const node = () => ({ connect: (n: unknown) => n, gain: { value: 1 }, playbackRate: { value: 1 } });
  const ac = {
    currentTime: 0,
    decodeAudioData: async () => ({ duration: 1.5 }),
    createGain: node,
    createBufferSource: () => ({ ...node(), buffer: null as unknown, start(this: { buffer: unknown }) { played.push(this.buffer); } }),
  };
  return { ac, played, out: {} };
});
vi.mock('../src/client/sfx', () => ({ sfxOut: () => ({ ac: fake.ac, out: fake.out }) }));
const { setVoices, voiceOut, voicesOn } = await import('../src/client/voicebus');

const DIR = new URL('../public/sfx/voice/', import.meta.url);
const bank = { names: VOICE_NAMES, files: voiceFiles, gain: voiceGain };
const hero = (id: string, weapon: Hero['weapon'], look: number, x = 0, y = 0) =>
  ({ id, weapon, look, x, y, fx: 1, fy: 0, hp: 100, intent: NO_INTENT }) as unknown as Hero;
const kit = (cls: (typeof CLASS_ORDER)[number]) => CLASS_KITS[cls][0];

describe('recorded voices', () => {
  it('has every take of every mapped voice in public/sfx/voice, and nothing there it does not know', () => {
    const want = VOICE_NAMES.flatMap(voiceFiles);
    expect(want.length).toBe(172);
    for (const f of want) expect(existsSync(new URL(f, DIR)), f).toBe(true);
    expect(readdirSync(DIR).filter((f) => f.endsWith('.mp3')).sort()).toEqual([...want].sort());
  });

  it('gives every person a greeting and a goodbye, and every hero voice its efforts', () => {
    for (const p of PEOPLE) expect(VOICE_BANK[p + '_greet'].takes, p).toBeGreaterThanOrEqual(2), expect(VOICE_BANK[p + '_bye'], p).toBeTruthy();
    for (const v of HERO_VOICES) for (const e of EFFORTS) expect(VOICE_BANK[`hero_${v}_${e}`], v + e).toBeTruthy();
    for (const k of ['tobin_panic', 'nettle_hush', 'odric_pray', 'odric_rite']) expect(VOICE_BANK[k], k).toBeTruthy();
  });

  it('finds who speaks at a spot', () => {
    expect(personAt('church')).toBe('odric');
    expect(personAt('merchant')).toBe('tobin');
    expect(personAt('trainer', 1, 'RANGER')).toBe('maeve');
    expect(personAt('trainer', 0, 'WARRIOR')).toBeNull();
    expect(personAt('vendor', 2, 'ROGUE')).toBe('nettle');
    expect(personAt('chat', 13)).toBe('brisk');
    expect(personAt('board')).toBeNull();
  });
});

describe('townsfolk greetings', () => {
  it('greets when a panel opens, at most once every 20 s per person, and says goodbye on close', () => {
    const said: string[] = [], hushed: number[] = [];
    const t = createTownVoice((n) => (said.push(n), 2), (s) => hushed.push(s));
    expect(t.open('hew', 0)).toBe(2);
    t.close(1);
    expect(t.open('hew', 5)).toBe(0);
    t.close(6);
    expect(t.open('orla', 7)).toBe(2);
    t.close(8);
    expect(t.open('hew', 0 + GAPS.greet + 0.1)).toBe(2);
    expect(said).toEqual(['hew_greet', 'hew_bye', 'orla_greet', 'orla_bye', 'hew_greet']);
    expect(hushed.length).toBe(5);
  });

  it('has Tobin panic instead of greeting when you carry hungry gear', () => {
    const said: string[] = [];
    const t = createTownVoice((n) => (said.push(n), 3));
    t.open('tobin', 0, true);
    t.open('tobin', 1, false);
    expect(said).toEqual(['tobin_panic', 'tobin_greet']);
  });

  it('keeps the blip when nothing recorded plays', () => {
    const hushed: number[] = [];
    const t = createTownVoice(() => 0, (s) => hushed.push(s));
    expect(t.open('edda', 0)).toBe(0);
    expect(hushed).toEqual([]);
  });
});

describe('heroes in a fight', () => {
  const swing = (x: number): FightEvent => ({ k: 'swing', x, y: 0, src: 'sword', heavy: true });

  it('says nothing on a swing, heavy or light: weapons are heard by their own sounds (Kyle, 2026-11-06)', () => {
    const said: string[] = [];
    const v = createHeroVoice((n) => (said.push(n), 0.7));
    const a = hero('a', kit('WARRIOR'), 0, 0), b = hero('b', kit('WARRIOR'), 1, 5);
    for (const t of [0, 0.3, 0.6, 0.9]) v.event(swing(0), [a, b], t);
    v.event(swing(5), [a, b], 0.5);
    v.event(swing(0), [a, b], GAPS.grunt + 0.01);
    v.event({ k: 'swing', x: 0, y: 0, src: 'sword', heavy: false }, [a, b], 9);
    expect(said).toEqual([]);
  });

  it('gasps, cries and breathes by the hero the event belongs to; a Cleric no longer prays on a heal or a smite', () => {
    const said: string[] = [];
    const v = createHeroVoice((n) => (said.push(n), 1));
    const w = hero('w', kit('WARRIOR'), 2, 0), c = hero('c', kit('HEALER'), 1, 3);
    v.event({ k: 'hit', x: 0, y: 0, n: 10, heavy: false, on: 'hero' }, [w, c], 0);
    v.event({ k: 'hit', x: 0, y: 0, n: 2, heavy: false, on: 'hero', tick: true }, [w, c], 5);
    v.event({ k: 'down', x: 9, y: 9, id: 'w' }, [w, c], 1);
    v.event({ k: 'gotup', x: 9, y: 9, id: 'w' }, [w, c], 4);
    v.event({ k: 'heal', x: 0, y: 0, n: 12 }, [w, c], 5);
    v.event({ k: 'heal', x: 0, y: 0, n: 12 }, [w, c], 6);
    v.event({ k: 'smite', x: 4, y: 0 }, [w, c], 7);
    expect(said).toEqual(['hero_c_hurt', 'hero_c_down', 'hero_c_up']);
  });

  it("a heal is silent, a Warrior's or a Cleric's", () => {
    const said: string[] = [];
    const v = createHeroVoice((n) => (said.push(n), 1));
    v.event({ k: 'heal', x: 0, y: 0, n: 12 }, [hero('w', kit('WARRIOR'), 0)], 0);
    expect(said).toEqual([]);
  });

  it('laughs when the hound bowls a Ranger over, once', () => {
    const said: string[] = [];
    const v = createHeroVoice((n) => (said.push(n), 1));
    const r = hero('r', kit('RANGER'), 2);
    for (let t = 0; t < 6; t += 0.1) v.idle(r, 'r_tackle', t, 100 + t);
    v.idle(r, 'r_fetch', 1.5, 200);
    expect(said).toEqual(['hero_e_laugh']);
  });
});

describe('voices follow looks', () => {
  it('gives every class at least two voices across its three looks, and the Cleric looks voices that pray', () => {
    for (const cls of CLASS_ORDER) expect(new Set(LOOK_VOICE[cls]).size, cls).toBeGreaterThanOrEqual(2);
    for (const v of LOOK_VOICE.HEALER) expect(PRAYING).toContain(v);
    for (const v of PRAYING) expect(VOICE_BANK[`hero_${v}_heal`]).toBeTruthy(), expect(VOICE_BANK[`hero_${v}_smite`]).toBeTruthy();
  });

  it('a party of one class in three looks sounds like three people', () => {
    const v = createHeroVoice(() => 1);
    const party = [0, 1, 2].map((l) => hero('h' + l, kit('ROGUE'), l));
    expect(new Set(party.map((h) => v.voiceOf(h))).size).toBe(3);
    expect(v.voiceOf(party[0])).toBe(heroVoice(WEAPONS[party[0].weapon].cls, 0));
  });
});

describe('the VOICES switch and missing files', () => {
  it('mutes them: no bus, so nothing recorded plays', async () => {
    const p = createSamplePlayer(bank, voiceOut, async () => new ArrayBuffer(8));
    setVoices(true);
    await p.load('hew_greet');
    expect(p.start('hew_greet')).toBeGreaterThan(0);
    setVoices(false);
    expect(voicesOn()).toBe(false);
    expect(voiceOut()).toBeNull();
    const before = fake.played.length;
    expect(p.start('hew_greet')).toBe(0);
    expect(fake.played.length).toBe(before);
    setVoices(true);
    expect(p.start('hew_greet')).toBeGreaterThan(0);
  });

  it('falls back (says 0, so the blip types on) when a file is missing, and stops asking', async () => {
    let fetches = 0;
    const p = createSamplePlayer(bank, voiceOut, () => (fetches++, Promise.reject(new Error('404'))));
    expect(p.start('orla_greet')).toBe(0);
    await p.load('orla_greet');
    expect(p.state('orla_greet')).toBe('failed');
    const n = fetches;
    expect(p.start('orla_greet')).toBe(0);
    expect(fetches).toBe(n);
    // Loads only what is asked for: the rest of the bank stays untouched.
    expect(p.state('judd_greet')).toBe('unloaded');
  });
});
