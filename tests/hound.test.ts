/**
 * The Ranger's hound, chosen with Maeve (docs/DECISIONS.md 2026-11-05, shared/houndlook.ts,
 * client/hound*.ts): every breed and coat draws in every pose inside the one box; the choice saves and
 * loads and old heroes get the wolfhound; names go through the chat filter; a friend sees the same
 * hound, told once; and the fight is the same whatever the hound looks like.
 */
import { describe, expect, it, vi } from 'vitest';
import { BREEDS, COATS, MARKS, autoName, defaultHound, fitHound, nameTrouble, packHound, tidyName, type HoundLook } from '../src/shared/houndlook';
import { houndMap } from '../src/client/houndbody';
import { ALL_POSES, poseOf } from '../src/client/houndposes';
import { HOUND_BOX } from '../src/client/houndshapes';
import { COAT_PALS } from '../src/client/houndcoats';
import { BREED_NAME, COAT_NAME, HOUNDW, MARK_NAME } from '../src/client/houndwords';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Hero } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';

/** Every socket the page opens, and what it sends (as tests/idles.test.ts). */
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: { to: string; d: Record<string, unknown> }[] = [];
  open_ = true;
  closed = false;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  send(to: string, d: Record<string, unknown>) {
    if (!this.closed) this.sent.push({ to, d: JSON.parse(JSON.stringify(d)) });
  }
  close() {
    this.closed = true;
  }
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

const { fromJson, load } = await import('../src/client/save');
const { Game } = await import('../src/client/game');
const { Townfolk } = await import('../src/client/townfolk');
const { houndTag } = await import('../src/client/houndname');

const LOOKS: HoundLook[] = BREEDS.flatMap((breed) => Array.from({ length: COATS[breed] }, (_, coat) => MARKS.map((mark) => ({ breed, coat, mark, name: 'FLY' }))).flat());
const GLOW = ['#ff4a3a', '#7dff8a', '#ffd27a', '#c9a8ff', '#ffe9a8', '#bfe0ff', '#ff8a3a'];
const outline = (l: HoundLook, pose = poseOf('stand', 0)) => houndMap(l, pose).parts.map((p) => p[1] + ',' + p[2]).sort().join(' ');

describe('hound looks', () => {
  it('every breed, coat and white draws in every gait, idle and fight move, inside the one box', () => {
    expect(LOOKS.length).toBe(4 * 3 * 4);
    for (const l of LOOKS) for (const [n, f] of ALL_POSES) for (const wag of [-24, 0, 24]) for (const tuck of [false, true]) {
      const m = houndMap(l, poseOf(n, f, wag, tuck));
      expect(m.clipped, `${l.breed} ${l.coat} ${l.mark} ${n} ${f}`).toBe(0);
      expect(m.parts.length).toBeGreaterThan(40);
      for (const p of m.parts) {
        expect(p[1]).toBeGreaterThanOrEqual(0), expect(p[1]).toBeLessThan(HOUND_BOX.w), expect(p[2]).toBeLessThan(HOUND_BOX.h);
        expect(GLOW).not.toContain(p[p.length - 1]);
      }
      // Standing on its feet (not flying in or leaping): on the ground row, like every other breed.
      if (!['lunge', 'leap', 'run'].includes(n) && !(n === 'trot' && f % 2)) expect(m.parts.some((p) => p[2] === HOUND_BOX.ground)).toBe(true);
    }
  });

  it('the breeds have their own outlines, and the coats their own colours, the white its own pixels', () => {
    expect(new Set(BREEDS.map((b) => outline({ breed: b, coat: 0, mark: 'none', name: '' }))).size).toBe(4);
    for (const b of BREEDS) {
      const cols = COAT_PALS[b].map((_, coat) => houndMap({ breed: b, coat, mark: 'none', name: '' }, poseOf('trot', 1)).parts.map((p) => p[3]).join());
      expect(new Set(cols).size).toBe(COATS[b]);
      const white = (mark: HoundLook['mark']) => houndMap({ breed: b, coat: 0, mark, name: '' }, poseOf('stand', 0)).parts.filter((p) => p[3] === '#e8e4da').length;
      expect(white('blaze')).toBeGreaterThan(white('none'));
      expect(white('socks')).toBeGreaterThan(white('none'));
      expect(white('both')).toBeGreaterThan(Math.max(white('blaze'), white('socks')) - 1);
    }
    // Words for every choice the panel offers.
    for (const b of BREEDS) expect(BREED_NAME[b]).toBeTruthy(), expect(COAT_NAME[b]).toHaveLength(COATS[b]);
    for (const m of MARKS) expect(MARK_NAME[m]).toBeTruthy();
    for (const s of [...Object.values(HOUNDW), ...Object.values(BREED_NAME), ...Object.values(COAT_NAME).flat()]) expect(s).not.toMatch(/\u2014|\u2013/);
  });
});

describe('names', () => {
  it('a name is tidied to the font and ten letters, and the chat filter keeps swearing and slurs off it', () => {
    expect(tidyName('  sloe  ')).toBe('SLOE');
    expect(tidyName("o'brien-the-great dog")).toBe("O'BRIEN-TH");
    expect(tidyName('b@r#k 42')).toBe('BRK');
    expect(nameTrouble('Bracken')).toBe('');
    expect(nameTrouble('Bass')).toBe('');
    expect(nameTrouble('')).toBe('empty');
    expect(nameTrouble(" '- ")).toBe('empty');
    for (const bad of ['fuck', 'Shithead', 'BIG ARSE', 'c-u-n-t', 'twat', 'bollocks']) expect(nameTrouble(bad), bad).toBe('rude');
    // And the slurs on travellers that chat lets by, never on a hound (but Watchman Pike's name is a name).
    for (const bad of ['gyp', 'Gyppo', 'gippos', 'g-y-p-s-y', 'GIPSY', 'pikey', 'old gyp']) expect(nameTrouble(bad), bad).toBe('rude');
    for (const ok of ['Pike', 'Pip', 'Gus', 'Meg', 'Tess']) expect(nameTrouble(ok), ok).toBe('');
    // A rude name heard from outside comes back as the hound's own auto name.
    expect(fitHound({ breed: 'lurcher', coat: 1, mark: 'socks', name: 'piss' }, 'h1').name).toBe(autoName('h1'));
  });
});

describe('saved and loaded', () => {
  it('old heroes get the wolfhound and a name of their own; a chosen hound keeps; nobody else has one', () => {
    const s = fromJson({ heroes: [{ id: 'hold1', name: 'ASH', cls: 'RANGER' } as never, { id: 'hold2', name: 'BEA', cls: 'WARRIOR' } as never, { id: 'hold3', name: 'COL', cls: 'RANGER', hound: { breed: 'collie', coat: 2, mark: 'socks', name: 'pip' } } as never], current: 0, world: {} as never })!;
    const odd = fromJson({ heroes: [{ id: 'hold4', name: 'DOT', cls: 'RANGER', hound: { breed: 'poodle', coat: 9, mark: 'spots', name: 7 } } as never], current: 0, world: {} as never })!;
    expect(s.heroes[0].hound).toEqual(defaultHound('hold1'));
    expect(s.heroes[0].hound).toEqual({ breed: 'wolfhound', coat: 0, mark: 'none', name: autoName('hold1') });
    expect(s.heroes[1].hound).toBeUndefined();
    expect(s.heroes[2].hound).toEqual({ breed: 'collie', coat: 2, mark: 'socks', name: 'PIP' });
    expect(odd.heroes[0].hound).toEqual(defaultHound('hold4'));
    // Given GYP or FENN as an auto name before the lore keeper's pass: MEG or TESS now. Typed: kept (if allowed).
    const idFor = (n: string) => Array.from({ length: 999 }, (_, i) => 'h' + i).find((id) => autoName(id) === n)!;
    const [m, t] = [idFor('MEG'), idFor('TESS')], hound = (name: string) => ({ breed: 'lurcher', coat: 1, mark: 'none', name });
    const old = fromJson({ heroes: [{ id: m, name: 'A', cls: 'RANGER', hound: hound('GYP') }, { id: t, name: 'B', cls: 'RANGER', hound: hound('FENN') }, { id: m, name: 'C', cls: 'RANGER', hound: hound('FENN') }] as never, current: 0, world: {} as never })!;
    expect(old.heroes.map((h) => h.hound!.name)).toEqual(['MEG', 'TESS', 'FENN']);
    expect(old.heroes[0].hound).toEqual({ ...hound('MEG'), breed: 'lurcher' });
  });

  it('a new Ranger has a hound and a name; chosen with Maeve, it saves, loads, and the hero shows it', () => {
    store.clear();
    const g = new Game();
    g.create('RANGER', 'ROWAN');
    expect(g.profile.hound).toEqual(defaultHound(g.profile.id));
    const pick: HoundLook = { breed: 'hillhound', coat: 1, mark: 'blaze', name: 'Bracken' };
    expect(g.chooseHound(pick)).toBe(true);
    expect(g.hero.houndLook).toEqual({ ...pick, name: 'BRACKEN' });
    const back = load();
    expect(back.heroes[back.current].hound).toEqual({ ...pick, name: 'BRACKEN' });
    // A rude name: refused, nothing changed.
    expect(g.chooseHound({ ...pick, coat: 2, name: 'shite' })).toBe(false);
    expect(load().heroes[back.current].hound?.coat).toBe(1);
    // A Warrior has no hound to choose.
    g.create('WARRIOR', 'BRAM');
    expect(g.chooseHound(pick)).toBe(false);
    expect(g.profile.hound).toBeUndefined();
  });
});

describe('friends see it', () => {
  it("in town: another player hears your hound's breed, coat and name, told once, not with every step", () => {
    socks.length = 0;
    const a = new Townfolk('a'), b = new Townfolk('b');
    const dog: HoundLook = { breed: 'collie', coat: 2, mark: 'blaze', name: 'SLOE' };
    const me = (x: number, d = dog, fy = 0) => ({ n: 'ROWAN', w: 'longbow', l: 0, d: packHound(d), at: 'WICKHOLD', p: [x, 10 + fy * 3, Math.sqrt(1 - fy * fy), fy, 1] as [number, number, number, number, number] });
    const deliver = (from: Fake, fromId: string, to: Fake, start = 0) => from.sent.slice(start).forEach(({ d }) => to.onMessage({ t: 'msg', from: fromId, d }));
    b.step({ n: 'BEA', w: 'sword', l: 0, at: 'WICKHOLD', p: [12, 10, 1, 0, 0] }, 0, 0.05);
    a.step(me(10), 0, 0.05);
    const [sb, sa] = [socks[0], socks[1]];
    sb.onMessage({ t: 'role', role: 'peer' });
    sa.onMessage({ t: 'role', role: 'peer' });
    deliver(sa, 'a', sb);
    deliver(sb, 'b', sa);
    expect(b.where('a')!.hero.houndLook).toEqual(dog);
    // Walking about with company for ten seconds: many words, the hound in none of them.
    const n0 = sa.sent.length;
    // (Zigzagging, so the others need telling where it's going.)
    for (let t = 0.05; t < 10; t += 0.05) a.step(me(10 + t * 2, dog, Math.floor(t) % 2 ? 0.6 : -0.6), t, 0.05);
    const words = sa.sent.slice(n0);
    expect(words.length).toBeGreaterThan(5);
    expect(words.filter((w) => 'd' in w.d)).toHaveLength(0);
    deliver(sa, 'a', sb, n0);
    expect(b.where('a')!.hero.houndLook).toEqual(dog);
    // A new choice goes once.
    const n1 = sa.sent.length, red: HoundLook = { ...dog, coat: 1, name: 'RUSS' };
    for (let t = 10; t < 13; t += 0.05) a.step(me(30 + t, red), t, 0.05);
    expect(sa.sent.slice(n1).filter((w) => 'd' in w.d)).toHaveLength(1);
    deliver(sa, 'a', sb, n1);
    expect(b.where('a')!.hero.houndLook).toEqual(red);
  });

  it("in a party: the friend's copy of the room has the same hound, sent with the hero once and not again each tick", () => {
    const room = new ArenaRoom(5);
    const h = room.join('me');
    Object.assign(h, { weapon: 'longbow', houndLook: { breed: 'lurcher', coat: 2, mark: 'socks', name: 'MOSS' } });
    const enc = new Encoder(), dec = new Decoder();
    let got = dec.apply(enc.encode(stateOf(room), true), true);
    for (let i = 0; i < 60; i++) {
      room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 7), my: 0.3 });
      room.step();
      const p = enc.encode(stateOf(room));
      expect((p.heroes?.u ?? []).some(([, e]) => 'houndLook' in e)).toBe(false);
      got = dec.apply(p);
    }
    expect((got.heroes[0] as unknown as Hero).houndLook).toEqual(h.houndLook);
  });
});

describe('the fight', () => {
  it('is the same fight whatever the hound looks like', () => {
    const play = (look: HoundLook) => {
      const room = new ArenaRoom(42), h = room.join('me');
      Object.assign(h, { weapon: 'longbow', houndLook: look });
      let bit = 0;
      for (let i = 0; i < 900; i++) {
        room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 20), my: -0.5, attackSeq: Math.floor(i / 9), attack: i % 40 > 20, ax: 1, ay: -0.3 });
        room.step();
        bit += room.events.filter((e) => e.k === 'bark').length;
      }
      // (hitIds carries a shot's id from a counter shared across rooms in one process: a label, not the fight.)
      const heroes = room.heroes.map(({ houndLook: _l, hitIds: _h, ...rest }) => rest);
      return { bit, fight: JSON.stringify([heroes, room.enemies, room.snares, room.time]) };
    };
    const a = play({ breed: 'wolfhound', coat: 0, mark: 'none', name: 'BRAN' }), b = play({ breed: 'collie', coat: 2, mark: 'both', name: 'SLOE' });
    expect(a.bit).toBeGreaterThan(0);
    expect(b.fight).toBe(a.fight);
  });
});

describe('its name', () => {
  it('shows near it, while it plays or is petted, and never for a hound with no name', () => {
    const owner = { id: 'me', x: 10, y: 10, moving: false, houndLook: { breed: 'wolfhound', coat: 0, mark: 'none', name: 'BRAN' } } as unknown as Hero;
    const d = { x: 11, y: 10.2, state: 'heel', t: 0 } as never;
    expect(houndTag(owner, d, 11, 10.2, owner, false)).toBe('BRAN');
    expect(houndTag(owner, d, 11, 10.2, { ...owner, moving: true } as Hero, false)).toBe('');
    expect(houndTag(owner, d, 15, 10.2, { ...owner, moving: true } as Hero, true)).toBe('BRAN');
    expect(houndTag(owner, d, 18, 10.2, owner, false)).toBe('');
    expect(houndTag({ ...owner, houndLook: undefined } as Hero, d, 11, 10.2, owner, true)).toBe('');
  });
});
