/**
 * The game's voices, wired to sound: one player for the voice bank on the voices' bus (voicebus.ts),
 * the townsfolk (townvoice.ts) and the heroes (herovoice.ts). Voices load when first wanted, not all
 * at once: a person's lines as you come up to them, a hero's when they're first seen. A greeting not
 * loaded yet plays as soon as it is, if their panel is still open; an effort not loaded is dropped.
 * Missing files, or VOICES off, and the typed lines blip as they always did.
 */
import { createSamplePlayer } from './sfxplayer';
import { VOICE_NAMES, voiceFiles, voiceGain, personAt, type Person } from './voicebank';
import { voiceBytes } from './voicesrc';
import { voiceOut } from './voicebus';
import { hushBlips } from './speech';
import { createTownVoice } from './townvoice';
import { createHeroVoice } from './herovoice';
import type { Hero } from '../sim/types';
import type { HeroClass } from '../shared/weapons';

export const voicePlayer = createSamplePlayer({ names: VOICE_NAMES, files: voiceFiles, gain: voiceGain }, voiceOut, voiceBytes);
const clock = () => performance.now() / 1000;

export const townVoice = createTownVoice((name, who) => {
  const d = voicePlayer.start(name, { vary: false });
  if (d > 0 || voicePlayer.state(name) !== 'unloaded' && voicePlayer.state(name) !== 'loading') return d;
  // Not loaded yet: say it the moment it is, if they're still the one you're talking to.
  const asked = clock();
  void voicePlayer.load(name).then(() => {
    if (clock() - asked > 1 || (townVoice.current !== who && !name.endsWith('_bye'))) return;
    const late = voicePlayer.start(name, { vary: false });
    if (late > 0) hushBlips(late);
  });
  return 0;
}, hushBlips);

/** Load a person's lines ahead of talking to them (as you come within reach). */
const primed = new Set<string>();
export function primePerson(who: Person | null): void {
  if (!who || primed.has(who) || !voiceOut()) return;
  primed.add(who);
  const extra = who === 'tobin' ? ['tobin_panic'] : who === 'nettle' ? ['nettle_hush'] : who === 'odric' ? ['odric_pray', 'odric_rite'] : [];
  for (const n of [who + '_greet', who + '_bye', ...extra]) void voicePlayer.load(n);
}
export const primeSpot = (id: string, arg: number, cls?: HeroClass) => primePerson(personAt(id, arg, cls));

export const heroVoices = createHeroVoice((name, vol) => voicePlayer.start(name, { vol }));
/** Load each hero's voice set the first time they're seen. */
const seen = new Set<string>();
export function primeHeroes(heroes: readonly Hero[]): void {
  if (!voiceOut()) return;
  for (const h of heroes) {
    const v = heroVoices.voiceOf(h);
    if (seen.has(v)) continue;
    seen.add(v);
    for (const k of ['grunt', 'hurt', 'down', 'up', 'laugh', 'heal', 'smite']) if (VOICE_NAMES.includes(`hero_${v}_${k}`)) void voicePlayer.load(`hero_${v}_${k}`);
  }
}
export const voiceClock = clock;
