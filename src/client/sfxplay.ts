/**
 * The game's one sample player for recorded sound effects, on the effects bus from sfx.ts (so the
 * sound switch mutes it) and fed from our own site (sfxsrc.ts; the one-file build carries them inside).
 */
import { sfxOut } from './sfx';
import { createSfxPlayer, type PlayOpts } from './sfxplayer';
import { sfxBytes } from './sfxsrc';
import type { SfxName } from './sfxbank';

export const sfxPlayer = createSfxPlayer(() => sfxOut(), sfxBytes);

/** Play a recorded sound; false while it loads (or if it can't), so the caller falls back to its synth. */
export const playSfx = (name: SfxName, o?: PlayOpts): boolean => sfxPlayer.play(name, o);
