/**
 * Which recorded sound each of the kit's named sounds plays (docs/sound/elevenlabs-sounds.md, the
 * appendix). Installed once (main.ts imports this): each routed method tries its sample first and
 * plays its own synthesized sound only while the sample loads or if it failed. A route may give null
 * to keep the synth for that call. Sounds not listed here stay synthesized: the UI and tuned notes
 * (levelup, fanfare, relic, weapon, drop, loot, perfect, tempo, charged, stunned, well, rally, blip,
 * weak, resist, chime, dull) and everything section 3 covers (coins, anvil, chests, dice, drink, land,
 * wood, doors, fire, dread) until those are made.
 */
import { sfx } from './sfx';
import { sfxTown } from './sfxtown';
import { spiderSounds } from './spidersfx';
import { butcher, goblin, pitchOf } from './voices';
import { playSfx } from './sfxplay';
import type { PlayOpts } from './sfxplayer';
import type { SfxName } from './sfxbank';

type Pick = SfxName | [SfxName, PlayOpts] | null;
type Route = (...a: never[]) => Pick;
type Routes = Record<string, Route>;

/** A goblin's own pitch (voices.ts gives each one from its id), narrowed for a recording. */
const gob = (name: SfxName, id: number): Pick => [name, { rate: 0.92 + (pitchOf(id) - 1) * 0.35 }];

export const SFX_ROUTES: Routes = {
  swing: () => 'swing_sword',
  hit: (heavy: boolean) => (heavy ? 'hit_cleave' : 'hit_slice'),
  hurt: () => 'hero_hurt',
  block: () => 'block_shield',
  parry: () => 'parry_ring',
  guardbreak: () => 'guard_break',
  roll: () => 'roll',
  dodge: () => 'roll',
  growl: (slam: boolean) => (slam ? 'butcher_roar_slam' : 'butcher_roar'),
  backstab: () => 'backstab',
  bark: () => 'hound_bark',
  yelp: () => 'hound_yelp',
  snareset: () => 'gob_net',
  gnaw: (near = 1) => ['gob_gnaw', { vol: 0.3 + 0.7 * near }],
  channeled: () => 'spell_hum',
  rumble: () => 'ground_slam',
  bite: () => 'spider_bite',
  thud: () => 'bodyhit',
  boom: () => 'ground_slam',
  wallhit: () => 'block_shield',
  heavy: () => 'swing_heavy',
  throw: () => 'throw_whoosh',
  hurl: () => 'swing_heavy',
  pinned: () => 'javelin_pin',
  javwall: () => 'javelin_pin',
  javstick: () => 'hit_pierce',
  hookfire: () => 'hook_chain',
  yank: () => ['hook_chain', { vol: 0.7, rate: 1.1 }],
  latch: () => 'crossbow_wind',
  death: (how = 'fall') => (how === 'burst' ? 'death_burst' : how === 'behead' || how === 'halve' || how === 'opened' ? 'death_gore' : 'death_fall'),
  grab: () => 'gob_net',
  net: () => 'gob_net',
  slam: () => 'ground_slam',
  bodyhit: () => 'bodyhit',
  oilfire: () => 'fire_burst',
  arrow: () => 'bow_loose_short',
  spark: () => 'fire_cast',
  orb: () => 'spell_hum',
  bolt: () => 'crossbow_shot',
  lance: () => 'spell_hum',
  smite: () => 'smite',
  smoke: () => 'smoke_puff',
  shadow: () => 'smoke_puff',
  heal: () => 'heal',
  blessed: () => ['heal', { vol: 0.8 }],
  bless: () => 'heal',
  coal: () => 'heal',
  hallow: () => 'heal',
  ignite: () => 'fire_cast',
  flare: () => 'fire_burst',
  chill: () => 'frost_cast',
  freeze: () => 'frost_burst',
  shatter: () => 'ice_shatter',
  shock: () => 'storm_cast',
  ward: () => 'ward_ring',
  warded: () => 'ward_ring',
  reflect: () => 'ward_ring',
  wardbreak: () => 'ward_break',
  blink: () => 'blink',
};

export const GOBLIN_ROUTES: Routes = {
  chatter: (id: number) => gob('gob_jabber', id),
  cackle: (id: number) => gob('gob_cackle', id),
  yelp: (id: number) => gob('gob_hurt', id),
  shriek: (id: number) => gob('gob_death', id),
  hiss: () => 'gob_snarl',
  draw: () => 'bow_draw',
  chant: (id: number) => gob('gob_chant', id),
  hexBurst: () => 'gob_hex_burst',
  // _1 is the low beat, _2 the higher off-beat.
  drum: (v: number, off: boolean) => (v > 0 ? ['gob_drum', { take: off ? 1 : 0, vol: v }] : null),
  screech: () => 'gob_screech',
};

export const BUTCHER_ROUTES: Routes = {
  grunt: () => 'butcher_grunt',
  roar: (slam: boolean) => (slam ? 'butcher_roar_slam' : 'butcher_roar'),
  groan: () => 'butcher_death',
};

export const SPIDER_ROUTES: Routes = {
  skitter: (near = 1) => ['spider_skitter', { vol: 0.35 + 0.65 * near }],
  hiss: () => 'spider_hiss',
  wetbite: () => 'spider_bite',
  hatch: () => 'spider_hatch',
  spit: () => 'spider_spit',
  splat: () => 'spider_splat',
};

export const TOWN_ROUTES: Routes = {
  rats: (n: number, dist: number) => (dist > 10 ? null : ['rats_scatter', { vol: Math.max(0.25, 1 - dist / 10) * (n > 1 ? 1 : 0.7) }]),
  // An empty crossbow: the last click of the crank alone.
  empty: () => ['crossbow_wind', { tail: 0.12 }],
};

/** Play a route's pick; true if the recording played. */
export function playPick(p: Pick): boolean {
  if (!p) return false;
  return typeof p === 'string' ? playSfx(p) : playSfx(p[0], p[1]);
}

/** Wrap each routed method: the recording if it's ready, else the synth it always made. */
function install(target: object, routes: Routes): void {
  const t = target as Record<string, (...a: unknown[]) => void>;
  for (const [k, route] of Object.entries(routes)) {
    const synth = t[k];
    if (typeof synth !== 'function') continue;
    t[k] = (...a: unknown[]) => {
      if (!playPick((route as (...b: unknown[]) => Pick)(...a))) synth(...a);
    };
  }
}

install(sfx, SFX_ROUTES);
install(goblin, GOBLIN_ROUTES);
install(butcher, BUTCHER_ROUTES);
install(spiderSounds, SPIDER_ROUTES);
install(sfxTown, TOWN_ROUTES);
