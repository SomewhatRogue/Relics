/**
 * The recorded sound effects (ElevenLabs batch 1, docs/sound/elevenlabs-sounds.md sections 1 and 2):
 * each name, how many takes it has in public/sfx (name_1.mp3, name_2.mp3, ...), and a level to sit it
 * against the rest. One that loops is a single file under its own name. Pure data, so the tests read it.
 */
export const SFX_BANK = {
  // Melee swings
  swing_sword: { takes: 3 }, swing_heavy: { takes: 2 }, swing_light: { takes: 3 }, swing_blunt: { takes: 2 }, thrust_spear: { takes: 2 },
  // Hits on goblins
  hit_slice: { takes: 3 }, hit_cleave: { takes: 2 }, hit_crunch: { takes: 3 }, hit_pierce: { takes: 3 }, hit_bigbody: { takes: 2, gain: 0.8 },
  backstab: { takes: 2 }, bodyhit: { takes: 3 },
  // Guarding, getting hurt, dying
  block_shield: { takes: 3 }, block_blade: { takes: 2 }, parry_ring: { takes: 3 }, guard_break: { takes: 2 }, hero_hurt: { takes: 3 },
  roll: { takes: 2, gain: 0.8 }, death_fall: { takes: 2 }, death_gore: { takes: 2 }, death_burst: { takes: 1 },
  // Bows, crossbows, throws, relics
  bow_draw: { takes: 2, gain: 0.6 }, bow_loose_long: { takes: 2 }, bow_loose_short: { takes: 2 }, crossbow_shot: { takes: 2 },
  crossbow_wind: { takes: 1, gain: 0.8 }, throw_whoosh: { takes: 2 }, javelin_pin: { takes: 2 }, hook_chain: { takes: 1 }, ground_slam: { takes: 2 },
  // Mage
  spell_hum: { takes: 1, gain: 0.8 }, fire_cast: { takes: 3 }, fire_burst: { takes: 2 }, frost_cast: { takes: 3 }, frost_burst: { takes: 2 },
  ice_shatter: { takes: 2 }, storm_cast: { takes: 3 }, thunder_strike: { takes: 2, gain: 1.1 }, storm_stream_loop: { takes: 1, loop: true }, blink: { takes: 2 },
  // Cleric and Rogue
  smite: { takes: 2 }, heal: { takes: 2, gain: 0.8 }, ward_ring: { takes: 2 }, ward_break: { takes: 1 }, smoke_puff: { takes: 2 },
  // Goblins
  gob_jabber: { takes: 4, gain: 0.4 }, gob_cackle: { takes: 3, gain: 0.55 }, gob_snarl: { takes: 3, gain: 0.8 }, gob_grunt: { takes: 3, gain: 0.7 },
  gob_hurt: { takes: 3, gain: 0.8 }, gob_death: { takes: 3, gain: 0.8 }, gob_screech: { takes: 2, gain: 0.8 }, gob_chant: { takes: 2, gain: 0.8 },
  gob_hex_burst: { takes: 1 }, gob_retch: { takes: 2 }, gob_gnaw: { takes: 3 }, gob_drum: { takes: 2, gain: 0.9 }, gob_whistle: { takes: 2, gain: 0.6 },
  gob_blowpipe: { takes: 1 }, gob_net: { takes: 1 },
  // The butcher (and the Stoker)
  butcher_grunt: { takes: 3 }, butcher_roar: { takes: 2 }, butcher_roar_slam: { takes: 2 }, butcher_bellow: { takes: 1 }, butcher_death: { takes: 2 },
  // Spiders
  spider_skitter: { takes: 3, gain: 0.7 }, spider_hiss: { takes: 2, gain: 0.8 }, spider_bite: { takes: 2 }, spider_hatch: { takes: 1 },
  spider_spit: { takes: 1 }, spider_splat: { takes: 2 },
  // Rats, crows, wolves, the hound
  rats_scatter: { takes: 2, gain: 0.6 }, crow_caw: { takes: 3, gain: 0.7 }, crows_flock: { takes: 1, gain: 0.8 }, wolf_howl: { takes: 2, gain: 0.7 },
  wolf_yelp: { takes: 1 }, hound_bark: { takes: 2 }, hound_yelp: { takes: 1 },
} satisfies Record<string, { takes: number; gain?: number; loop?: boolean }>;

export type SfxName = keyof typeof SFX_BANK;

/** The files of one sound, in take order. */
export function sfxFiles(name: SfxName): string[] {
  const e: { takes: number; loop?: boolean } = SFX_BANK[name];
  if (e.loop) return [name + '.mp3'];
  return Array.from({ length: e.takes }, (_, i) => `${name}_${i + 1}.mp3`);
}

export const sfxGain = (name: SfxName) => (SFX_BANK[name] as { gain?: number }).gain ?? 1;
