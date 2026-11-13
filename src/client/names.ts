/**
 * Asking the server about hero names (api/names.ts). With no server (the solo build, offline) every name is
 * allowed and nothing is held: `null` / 'off' say so, and the caller lets it through.
 */
import { NAMES_ASK, drawNames } from '../shared/names';

async function post(b: unknown): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch('/api/names', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Free names from the pool, not in `not`: those the server says nobody has, or (no server) any. */
export async function freeNames(not: Iterable<string> = []): Promise<string[]> {
  const ask = drawNames(NAMES_ASK, not), r = await post({ free: ask });
  const free = Array.isArray(r?.free) ? (r!.free as boolean[]) : null;
  return free ? ask.filter((_, i) => free[i]) : ask;
}

/** Take `name` for the hero: 'ok', 'taken' by another, or 'off' (no server: allowed, held nowhere). */
export async function claimName(name: string, hero: string): Promise<'ok' | 'taken' | 'off'> {
  const r = await post({ claim: name, hero });
  return !r ? 'off' : r.ok ? 'ok' : 'taken';
}

/** A retired hero's name back in the pot (fire and forget). */
export function releaseName(name: string, hero: string): void {
  void post({ release: name, hero });
}
