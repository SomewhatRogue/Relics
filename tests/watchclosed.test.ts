/**
 * The Night Watch is closed for now (Kyle, 2026-11-06; shared/tuning.ts NIGHT_WATCH): Brisk offers no
 * shift, day or night, while the switch is off; with it on, his offer after dark is back as it was.
 */
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
vi.stubGlobal('innerWidth', 390);
vi.stubGlobal('innerHeight', 844);
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
// (The wall itself isn't wanted here, only Brisk's offer of it.)
vi.mock('../src/client/watchmode', () => ({ openWatch: () => null }));
// Midnight in Wickhold.
vi.mock('../src/client/townclock', async (orig) => ({ ...(await orig<typeof import('../src/client/townclock')>()), townPhase: () => 0 }));

const { NIGHT_WATCH } = await import('../src/shared/tuning');
const { openWatchPost } = await import('../src/client/watchpost');

/** What Brisk's panel shows: its buttons. */
function brisk(): { label: string }[] {
  let shown: { label: string }[] = [];
  const panel = { show: (_t: string, _h: string, b: { label: string }[] = []) => void (shown = b), hide: () => {} };
  openWatchPost({ profile: {} } as never, panel as never, 'usual');
  return shown;
}

describe('the Night Watch, closed', () => {
  it('is off by default: at midnight Brisk only grumbles, no shift to take', () => {
    expect(NIGHT_WATCH.on).toBe(false);
    expect(brisk()).toEqual([]);
  });

  it('with the switch on, the shift is offered after dark as before', () => {
    NIGHT_WATCH.on = true;
    try {
      expect(brisk()).toHaveLength(1);
    } finally {
      NIGHT_WATCH.on = false;
    }
  });
});
