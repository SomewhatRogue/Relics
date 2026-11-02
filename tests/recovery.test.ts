/**
 * Recovery codes: the words and how a typed code is read; the save keeper (api/save.ts) on its memory
 * store and, when `redis-server` is installed, its Lua scripts on a real Redis; and the browser side
 * (client/recovery.ts) with fetch routed straight to the handler.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FIRST, SECOND, codeFrom, distance, keyOf, parseCode, showCode } from '../src/shared/recovery';
import { memorySaveStore, redisSaveStore, type SaveStore } from '../api/_save';
import handler, { MAX_BODY } from '../api/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import type { Save } from '../src/client/save';

const kept = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = { getItem: (k: string) => kept.get(k) ?? null, setItem: (k: string, v: string) => void kept.set(k, v), removeItem: (k: string) => void kept.delete(k) };
g.window ??= globalThis;
g.addEventListener ??= () => undefined;
g.document ??= { addEventListener: () => undefined, visibilityState: 'visible' };
beforeEach(() => kept.clear());

/** Call the Vercel handler as Vercel would. */
async function api(method: string, url: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const raw = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  const req = Object.assign(Readable.from(raw ? [raw] : []), { method, url });
  let status = 0, out = '';
  const res = { writeHead: (s: number) => void (status = s), end: (s: string) => void (out = s) };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(out) };
}
const aSave = (names = ['WREN'], savedAt = Date.now() - 1000) =>
  ({ heroes: names.map((n) => newProfile('RANGER', n)), current: 0, world: newWorld(), savedAt });

describe('recovery codes', () => {
  it('two lists of 128 plain words, no repeats, every word two letters or more from every other', () => {
    expect(FIRST.length).toBe(128);
    expect(SECOND.length).toBe(128);
    const all = [...FIRST, ...SECOND];
    expect(new Set(all).size).toBe(256);
    for (const w of all) expect(w).toMatch(/^[a-z]{3,8}$/);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(distance(all[i], all[j]), `${all[i]} ${all[j]}`).toBeGreaterThan(1);
  });

  it('shows in capitals and reads back however it is typed', () => {
    const kiln = { a: FIRST.indexOf('kiln'), b: SECOND.indexOf('fern'), n: 47 };
    expect(showCode(kiln)).toBe('KILN FERN 47');
    expect(keyOf(kiln)).toBe('kiln-fern-47');
    for (const typed of ['KILN FERN 47', 'kiln-fern-47', '  Kiln.Fern  47 ', 'kilnfern47', 'kiln fern47', 'kilm fern 47'])
      expect(parseCode(typed), typed).toEqual(kiln);
    for (const typed of ['fern kiln 47', 'kiln fern 7', 'kiln fern 100', 'kiln fern 07', 'kiln 47', 'kiln fern', '', 'x'.repeat(80), 'kiln fern otter 47'])
      expect(parseCode(typed), typed).toBe(null);
    expect(parseCode(null)).toBe(null);
    let seed = 7;
    for (let i = 0; i < 200; i++) {
      const c = codeFrom((k) => (seed = (seed * 16807) % 2147483647) % k);
      expect(parseCode(showCode(c))).toEqual(c);
      expect(c.n).toBeGreaterThanOrEqual(10);
      expect(c.n).toBeLessThanOrEqual(99);
    }
  });
});

describe('the save keeper (api/save.ts)', () => {
  it('makes a code, gives the save back with its token, and writes only with that token', async () => {
    const made = await api('POST', '/api/save', { save: aSave(['WREN', 'ASHE']) });
    expect(made.status).toBe(200);
    const code = made.body.code as string, token = made.body.token as string;
    expect(parseCode(code)).not.toBe(null);
    expect(token.length).toBeGreaterThanOrEqual(16);

    const shown = showCode(parseCode(code)!);
    const pulled = await api('GET', `/api/save?code=${encodeURIComponent(shown)}`);
    expect(pulled.status).toBe(200);
    expect(pulled.body.token).toBe(token);
    expect((pulled.body.save as { heroes: { name: string }[] }).heroes.map((h) => h.name)).toEqual(['WREN', 'ASHE']);

    const base = pulled.body.savedAt as number, next = aSave(['WREN']);
    expect((await api('POST', '/api/save', { code, base, save: next })).status).toBe(400);
    expect((await api('POST', '/api/save', { code, token: 'x'.repeat(24), base, save: next })).status).toBe(403);
    const pushed = await api('POST', '/api/save', { code, token, base, save: next });
    expect(pushed.status).toBe(200);
    expect(pushed.body.savedAt as number).toBeGreaterThan(base);
    // Another device still on the old copy can't write over the newer one.
    expect((await api('POST', '/api/save', { code, token, base, save: aSave(['OLD']) })).status).toBe(409);
    expect(((await api('GET', `/api/save?code=${code}`)).body.save as { heroes: unknown[] }).heroes.length).toBe(1);
  });

  it('turns away unknown codes, bad saves and anything over 256 KB', async () => {
    expect((await api('GET', '/api/save?code=kiln-fern-11')).status).toBe(404);
    expect((await api('GET', '/api/save?code=nonsense')).status).toBe(404);
    expect((await api('POST', '/api/save', { save: { heroes: 'lots' } })).status).toBe(400);
    expect((await api('POST', '/api/save', { save: { ...aSave(), heroes: [{ id: 'h1', cls: 'PIRATE' }] } })).status).toBe(400);
    expect((await api('POST', '/api/save', '{not json')).status).toBe(400);
    const big = { save: { ...aSave(), world: { ...newWorld(), pad: 'x'.repeat(MAX_BODY) } } };
    expect((await api('POST', '/api/save', big)).status).toBe(413);
    expect((await api('PUT', '/api/save')).status).toBe(405);
  });

  it('a code that went missing is made again by the device that still has it', async () => {
    const save = aSave(['IVY']), token = 't'.repeat(20);
    const r = await api('POST', '/api/save', { code: 'hearth-owl-33', token, base: 0, save });
    expect(r.status).toBe(200);
    expect((await api('GET', '/api/save?code=HEARTH OWL 33')).body.token).toBe(token);
  });
});

// The same store on a real Redis (its Lua scripts), when redis-server is installed.
const haveRedis = spawnSync('which', ['redis-server']).status === 0;
let proc: ChildProcess | null = null;
const PORT = 7000 + Math.floor(Math.random() * 400);
beforeAll(async () => {
  if (!haveRedis) return;
  proc = spawn('redis-server', ['--port', String(PORT), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 300));
});
afterAll(() => void proc?.kill());

describe.each([
  { name: 'memory', make: async () => memorySaveStore(), skip: false },
  { name: 'redis', make: () => redisSaveStore(`redis://127.0.0.1:${PORT}`), skip: !haveRedis },
])('the $name store', ({ make, skip }) => {
  it.skipIf(skip)('makes once, pulls, pushes with the token and a fresh base only', async () => {
    const s: SaveStore = await make(), code = `kiln-fern-${10 + Math.floor(Math.random() * 90)}`, t = 'a'.repeat(20);
    expect(await s.make(code, { save: '{"a":1}', token: t, at: 1_800_000_000_000 })).toBe(true);
    expect(await s.make(code, { save: '{"b":1}', token: 'b'.repeat(20), at: 5 })).toBe(false);
    expect(await s.pull(code)).toEqual({ save: '{"a":1}', token: t, at: 1_800_000_000_000 });
    expect(await s.push(code, 'b'.repeat(20), 1_800_000_000_000, '{}', 1)).toBe('token');
    expect(await s.push(code, t, 1_700_000_000_000, '{}', 1)).toBe('stale');
    // A device whose clock runs slow still moves the time forward.
    expect(await s.push(code, t, 1_800_000_000_000, '{"c":1}', 1_700_000_000_000)).toBe(1_800_000_000_001);
    expect(await s.push(code, t, 1_800_000_000_001, '{"d":1}', 1_900_000_000_000)).toBe(1_900_000_000_000);
    expect((await s.pull(code))?.save).toBe('{"d":1}');
    expect(await s.push('ash-oak-99', t, 0, '{}', 1)).toBe('missing');
    expect(await s.pull('ash-oak-99')).toBe(null);
  });
});

describe('this browser and the keeper (client/recovery.ts)', () => {
  g.fetch = async (url: string, init?: RequestInit) => {
    const r = await api(init?.method ?? 'GET', url, init?.body === undefined ? undefined : String(init.body));
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };

  it('makes a code, sends changes, and another device takes the newer copy on start', async () => {
    const { Recovery } = await import('../src/client/recovery');
    const { store } = await import('../src/client/save');
    // The first device: two heroes and a code.
    const mineA = aSave(['WREN', 'ASHE']);
    const a = new Recovery(() => mineA);
    const shown = await a.make();
    expect(shown).toMatch(/^[A-Z]+ [A-Z]+ \d\d$/);
    const aKept = kept.get('relic.recovery')!;

    // The second device looks it up and brings them over.
    kept.clear();
    let onB: Save = aSave(['BRAN']);
    const b = new Recovery(() => onB);
    const found = await b.look(shown!.toLowerCase());
    expect(found && typeof found === 'object' && found.save.heroes.map((h) => h.name)).toEqual(['WREN', 'ASHE']);
    b.use(found as never, (s) => ((onB = s), true));
    expect(onB.heroes.length).toBe(2);
    expect(b.code).toBe(shown);

    // The first device plays on and sends it (pagehide: no waiting).
    kept.set('relic.recovery', aKept);
    const a2 = new Recovery(() => mineA);
    mineA.heroes[0].gold = 500;
    store(mineA);
    await (a2 as unknown as { push(going: boolean): Promise<void> }).push(true);

    // The second device starts again: the newer copy is taken.
    kept.set('relic.recovery', JSON.stringify({ ...JSON.parse(aKept), synced: found && typeof found === 'object' ? found.savedAt : 0 }));
    const b2 = new Recovery(() => onB);
    let took: Save | null = null;
    await b2.start((s) => ((took = s), true));
    expect(took!.heroes[0].gold).toBe(500);
  });
});
