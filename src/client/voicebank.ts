/**
 * The recorded voices (ElevenLabs batch 2, docs/sound/voice-tongue.md): townsfolk speaking the tongue,
 * heroes' grunts and gasps, a Cleric's prayers. Each name's takes are public/sfx/voice/name_1.mp3 and
 * on; who says what, which hero voice goes with which look, and how often each may sound. Pure data
 * and pure rules, so the tests read it.
 */
import type { HeroClass } from '../shared/weapons';

/** The ten townsfolk who have a voice. */
export const PEOPLE = ['hew', 'orla', 'odric', 'isolde', 'judd', 'tobin', 'edda', 'maeve', 'nettle', 'brisk'] as const;
export type Person = (typeof PEOPLE)[number];

/** The eight hero voices. a: young man, b: gruff man, c: strong woman, d: young woman, e: wiry young
 *  man, f: husky woman, g: old man, h: deep man. */
export const HERO_VOICES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export type HeroVoice = (typeof HERO_VOICES)[number];
export const EFFORTS = ['grunt', 'hurt', 'down', 'up', 'laugh'] as const;
export type Effort = (typeof EFFORTS)[number];
/** The voices a Cleric look has, who pray on a heal and a smite. */
export const PRAYING: readonly HeroVoice[] = ['c', 'g', 'h'];

const bank: Record<string, { takes: number; gain?: number }> = {};
for (const p of PEOPLE) (bank[p + '_greet'] = { takes: 4 }), (bank[p + '_bye'] = { takes: 2 });
for (const v of HERO_VOICES) for (const e of EFFORTS) bank[`hero_${v}_${e}`] = { takes: 2 };
for (const v of PRAYING) (bank[`hero_${v}_heal`] = { takes: 4, gain: 0.8 }), (bank[`hero_${v}_smite`] = { takes: 4 });
Object.assign(bank, { tobin_panic: { takes: 2 }, nettle_hush: { takes: 2, gain: 0.7 }, odric_pray: { takes: 2, gain: 0.8 }, odric_rite: { takes: 2, gain: 0.7 } });
// Whispered and murmured lines were levelled like the rest; they sit back a little.
bank.nettle_greet.gain = bank.nettle_bye.gain = 0.75;
for (const v of HERO_VOICES) bank[`hero_${v}_up`].gain = 0.7;

export const VOICE_BANK: Readonly<Record<string, { takes: number; gain?: number }>> = bank;
export type VoiceName = string;
export const VOICE_NAMES = Object.keys(bank);
export const voiceFiles = (name: VoiceName) => Array.from({ length: bank[name]?.takes ?? 0 }, (_, i) => `${name}_${i + 1}.mp3`);
export const voiceGain = (name: VoiceName) => bank[name]?.gain ?? 1;

/**
 * Each class's three looks (herolooks.ts, herolooks2.ts) to a voice, so a party sounds different and a
 * class has at least two voices: the knight, the sellsword, Blackiron; the green hood, the trapper, the
 * hill warden; black hair, the cutpurse, Night; violet, the ember, frost; the coif, the friar, the red cap.
 */
export const LOOK_VOICE: Record<HeroClass, readonly [HeroVoice, HeroVoice, HeroVoice]> = {
  WARRIOR: ['a', 'b', 'c'],
  RANGER: ['d', 'b', 'e'],
  ROGUE: ['d', 'e', 'f'],
  MAGE: ['g', 'h', 'f'],
  HEALER: ['h', 'g', 'c'],
};
export const heroVoice = (cls: HeroClass, look = 0): HeroVoice => LOOK_VOICE[cls][((look % 3) + 3) % 3];

/** Who speaks at a spot in town (townui.ts's spot ids and their `arg`), or null for nobody voiced. */
export function personAt(id: string, arg = 0, cls?: HeroClass): Person | null {
  if (id === 'hew' || id === 'orla') return id;
  if (id === 'church') return 'odric';
  if (id === 'works') return 'judd';
  if (id === 'merchant') return 'tobin';
  if (id === 'bank') return 'edda';
  // (Corporal Brisk at the barracks' map table: the long trips, 2026-11-12.)
  if (id === 'map') return 'brisk';
  if (id === 'chat') return arg === 13 ? 'brisk' : arg === 14 ? 'orla' : null;
  if (id === 'trainer') return cls === 'RANGER' ? 'maeve' : cls === 'HEALER' ? 'isolde' : null;
  if (id === 'vendor') return cls === 'ROGUE' ? 'nettle' : null;
  return null;
}

/** Seconds between two of the same: a person's greeting or goodbye, a hero's effort or prayer. */
export const GAPS = {
  greet: 20, bye: 20, panic: 20, hush: 20, pray: 6, rite: 4,
  grunt: 1.2, hurt: 0.9, down: 2, up: 2, laugh: 8, heal: 3, smite: 2,
} as const;
export type GapKind = keyof typeof GAPS;

/** One rate limit: `ok(who, kind, now)` says yes at most once per `GAPS[kind]` seconds for each who. */
export function makeGate(gaps: Record<string, number> = GAPS) {
  const at = new Map<string, number>();
  return {
    ok(who: string, kind: string, now: number): boolean {
      const k = who + ':' + kind, t = at.get(k);
      if (t !== undefined && now - t < (gaps[kind] ?? 0)) return false;
      at.set(k, now);
      return true;
    },
    clear: () => at.clear(),
  };
}
