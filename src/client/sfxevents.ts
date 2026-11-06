/**
 * Fight events whose recording isn't the one their synthesized sound borrowed (the list gives them
 * their own: a wolf's howl instead of the hound's bark, the Stoker's bellow instead of two roars and a
 * boom, the poisoner's blowpipe instead of a spider's hiss). True if the recording played; false and
 * the soundscape makes its usual sound. A goblin's own blow (silent until now) only has a recording.
 */
import type { FightEvent } from '../sim/types';
import { playPick } from './sfxroutes';
import type { SfxName } from './sfxbank';

const BY_KIND: Partial<Record<FightEvent['k'], SfxName>> = {
  puke: 'gob_retch',
  quake: 'ground_slam',
  loaded: 'crossbow_wind',
  blinkthrough: 'blink',
  halfblink: 'blink',
  spellthief: 'blink',
  smokebomb: 'smoke_puff',
  mended: 'heal',
  tetherzap: 'storm_cast',
  howl: 'wolf_howl',
  scatter: 'wolf_yelp',
  crows: 'crows_flock',
  bellow: 'butcher_bellow',
  snag: 'block_shield',
};

export function eventSample(ev: FightEvent): boolean {
  if (ev.k === 'shoot' && ev.kind === 'dart') return playPick('gob_blowpipe');
  if (ev.k === 'impact' && (ev.kind === 'stab' || ev.kind === 'swing')) return playPick('gob_grunt');
  const name = BY_KIND[ev.k];
  return name ? playPick(name) : false;
}
