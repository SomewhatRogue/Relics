/** What a hero look is made of (herolooks.ts, herolooks2.ts): a pixel map per facing, and what moves. */
import type { Part } from './sprites';
import { HERO_W } from './heroscale';

export type Cls = 'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER';

/**
 * What moves on a look (herolife.ts), colours as [cloth, its shadow]. `cape`: hangs from the shoulders
 * to the calves and trails; `ragged` notches its hem. `plume`: off the top of the helm. `hair`: long
 * hair that sways. `cloak`: a Ranger's cloak edges flutter. `mantle`: a Rogue's long cloak, swaying,
 * trailing and flaring (cloaklife.ts). `hem`: a robe's hem flares at its foot (row). `tabard`: its foot flicks. `tip`: a hat's
 * crooked tip that nods.
 */
export interface Life {
  cape?: [string, string];
  ragged?: boolean;
  plume?: string;
  hair?: string;
  cloak?: [string, string];
  mantle?: [string, string];
  hem?: [string, string];
  tabard?: string;
  tip?: string;
}

/**
 * A look: its pixels facing you and walking away, its height in rows (`tall` of them above the usual
 * 24), whether a robe hides the legs (only the feet move), where the eyes are (row, left x, right x),
 * and what moves.
 */
export interface LookDef { down: Part[]; up: Part[]; h: number; tall: number; robe?: boolean; eyes: [number, number, number]; life: Life }

/** A pixel map to parts: '.' is empty, `M` (mail) checkers between `M` and `m`. Rows are HERO_W (18) wide. */
export function art(rows: string[], pal: Record<string, string>): Part[] {
  const out: Part[] = [];
  rows.forEach((row, y) => {
    if (row.length !== HERO_W) throw new Error(`lookkit: row ${y} is ${row.length} wide: ${row}`);
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = ch === 'M' && (x + y) % 2 && pal.m ? pal.m : pal[ch];
      if (!col) throw new Error(`lookkit: no colour for '${ch}'`);
      out.push(['p', x, y, col]);
    }
  });
  return out;
}

/** Skin tones (and each one's shadow), plain dark eyes. */
export const SKIN = { fair: ['#ecc4a0', '#c49474'], light: ['#d8a07a', '#b07a58'], tan: ['#b8805a', '#8e603e'], brown: ['#8e5a3a', '#6e4228'], deep: ['#603a26', '#48291a'] } as const;
export const skin = (k: keyof typeof SKIN) => ({ S: SKIN[k][0], s: SKIN[k][1], E: '#16121a' });

/** A pale glint off a skin tone: the light an eye catches in a hood's shadow (lit, never glowing). */
export function glint(skinCol: string): string {
  const c = [1, 3, 5].map((i) => Math.round(parseInt(skinCol.slice(i, i + 2), 16) * 0.35 + 236 * 0.65));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
