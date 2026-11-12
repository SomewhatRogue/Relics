/**
 * The item ledger on this device (docs/design/trading.md, shared/ledger.ts, api/ledger.ts). On load, and when
 * a save comes from another device, every hero's ledgered pieces are checked in one read: one the ledger gives
 * to another hero (an old copy of a save, restored after the piece was traded away) shows as GONE and leaves
 * the save, as does a second copy of one id. Offline, or in the solo build, nothing is checked and nothing goes.
 */
import { CLASS_ARMOR, itemName, type Item } from '../shared/tuning';
import { ledgered, prune, LEDGER_MAX } from '../shared/ledger';
import type { Profile } from '../shared/progress';
import { store, type Save } from './save';
import { toast } from './partytoast';
import { resolveTrade } from './tradesave';

/** The ledger needs the server: none in the solo build. */
export const LEDGER = !import.meta.env?.VITE_SOLO;
const API = '/api/ledger', TIMEOUT = 8000;

export async function ledgerCall(body: unknown): Promise<Record<string, unknown> | null> {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    clearTimeout(t);
    if (r.status !== 200 || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const plainArmor = (p: Profile) => (): Item => ({ slot: 'armor', armor: CLASS_ARMOR[p.cls], quality: 'plain', traits: [], mods: [], level: 0 });

/** Take the pieces in `gone` (and any twin) out of each hero; what came out, to tell the player. */
export function pruneSave(s: Save, gone: Record<string, string[]>): Item[] {
  const out: Item[] = [];
  for (const h of s.heroes) out.push(...prune(h, new Set(gone[h.id] ?? []), plainArmor(h)));
  return out;
}

/** Check this save against the ledger (`get` reads it as it is when the answer comes back) and keep the result. */
export async function checkLedger(get: () => Save, keep: (s: Save) => void = (s) => store(s), tell: (t: string) => void = (t) => toast(t)): Promise<Item[]> {
  if (!LEDGER) return [];
  // A trade cut off by a closed page settles first, so what it gave away isn't shown as GONE.
  await resolveTrade(get, keep);
  // Twins first, here: a replayed drop can leave one id twice in a kit.
  const twins = pruneSave(get(), {});
  const held: Record<string, string[]> = {};
  let n = 0;
  for (const h of get().heroes) {
    const ids = ledgered(h).map((it) => it.ledger!).slice(0, LEDGER_MAX - n);
    if (ids.length) (held[h.id] = ids), (n += ids.length);
  }
  const r = n ? await ledgerCall({ check: held }) : null;
  const gone = r?.gone && typeof r.gone === 'object' ? (r.gone as Record<string, string[]>) : {};
  const out = [...twins, ...pruneSave(get(), gone)];
  if (out.length) {
    keep(get());
    for (const it of out) tell(`GONE: ${itemName(it)}`);
  }
  return out;
}
