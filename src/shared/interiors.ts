/**
 * Inside the buildings. Every door leads to a small room with its own floor and furniture: in
 * Wickhold, people to talk to (the smith and the relic-wright at the forge, the priest, the trainer
 * and his squire, the healer and those she mends, the reeve, a family in every lit house on Rescue
 * Row); out on a job, a cottage or a barn the goblins have turned over, maybe with someone caged.
 * Walk out at the bottom to come back out of the door.
 */
import type { Block, GameMap, Npc, Round, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { PropKind } from './props.js';
import { Rng } from './rng.js';
import type { WorldState } from './story.js';
import type { Foe, RoomPlan } from './terrain.js';

const HOME: Theme = { floor: 'planks', back: 'plaster', ambient: [0.24, 0.2, 0.22], moon: 0 };
const STONE: Theme = { floor: 'flagstone', back: 'stone', ambient: [0.22, 0.2, 0.28], moon: 0 };

function room(name: string, w: number, h: number, theme: Theme, blocks: Block[], npcs: Npc[], more: Partial<GameMap> = {}): GameMap {
  return {
    name, w, h, wallFace: 3, rounds: [], blocks, braziers: [], npcs,
    torches: [{ x: 2.5, y: -1.6 }, { x: w - 2.5, y: -1.6 }],
    hero: { x: w / 2, y: h - 1.3 }, exit: { x: w / 2 - 1, y: h - 0.7, w: 2, h: 0.7 }, theme, ...more,
  };
}
const b = (kind: Block['kind'], x: number, y: number, w: number, h: number): Block => ({ kind, x, y, w, h });
const n = (name: string, x: number, y: number, talk: string, look: string, arg?: number): Npc => ({ name, x, y, talk, look, arg });

/** The families who take the houses on Rescue Row, in the order the houses are lit. */
export const FAMILIES = [
  { name: 'THE ASHBYS', adult: 'MERRIT ASHBY', child: 'PIP' },
  { name: 'THE COOPERS', adult: 'JANNA COOPER', child: 'WILL' },
  { name: 'THE FENNS', adult: 'OLD FENN', child: 'ROSIE' },
  { name: 'THE TULLOCKS', adult: 'BRAN TULLOCK', child: 'NELL' },
  { name: 'THE MARLOWES', adult: 'EDA MARLOWE', child: 'KIT' },
  { name: 'THE HOBBS', adult: 'GARRET HOBB', child: 'MAY' },
  { name: 'THE WYLDES', adult: 'SORREL WYLDE', child: 'FINCH' },
  { name: 'THE CARTERS', adult: 'HUGH CARTER', child: 'BESS' },
];
export const PATIENTS = ['AMOS', 'LETTY', 'CORIN'];

/** A Wickhold building's inside, by its door. */
export function townInterior(door: string, w: WorldState): GameMap {
  if (door === 'church') return room('THE CHURCH', 14, 9, STONE,
    [b('altar', 6, 0.5, 2, 1), b('pew', 1.5, 3.4, 4, 0.6), b('pew', 8.5, 3.4, 4, 0.6), b('pew', 1.5, 5.4, 4, 0.6), b('pew', 8.5, 5.4, 4, 0.6)],
    [n('FATHER ODRIC', 7, 2.2, 'church', 'priest'), n('MOTHER ISOLDE', 11.6, 2.4, 'trainer', 'healer', 4), n('MARTA', 3.2, 4.6, 'chat', 'villager', 2)],
    { torches: [{ x: 3, y: -1.6 }, { x: 7, y: -1.8 }, { x: 11, y: -1.6 }] });
  if (door === 'forge') return room('THE FORGE', 13, 8, { ...STONE, ambient: [0.28, 0.2, 0.2] },
    [b('anvil', 3.4, 2.7, 1.2, 0.6), b('bench', 8.5, 0.6, 3.5, 0.8), b('shelf', 5.5, 0.1, 2, 0.5), b('sacks', 11.2, 4.6, 1.2, 1)],
    [n('HALVARD THE SMITH', 4.1, 1.9, 'smith', 'smith'), n('IVO THE RELIC-WRIGHT', 10.2, 2.2, 'wright', 'wright')],
    { braziers: [{ x: 1.8, y: 1.4, r: 0.45 }] });
  if (door === 'hall') return room('THE BARRACKS', 13, 8, STONE,
    [b('rack', 1, 0.2, 3, 0.5), b('rack', 9, 0.2, 3, 0.5), b('bed', 0.8, 3.4, 1, 2), b('bed', 11.2, 3.4, 1, 2)],
    [n('MASTER COLE', 4.5, 2.4, 'trainer', 'trainer', 0), n('SQUIRE PELL', 8.8, 3.2, 'yard', 'squire'), n('CORPORAL BRISK', 6.5, 5.4, 'chat', 'guard', 6)]);
  if (door === 'tower') return room('THE TOWER', 10, 9, { ...STONE, ambient: [0.2, 0.18, 0.3] },
    [b('shelf', 0.6, 0.2, 3, 0.5), b('shelf', 6.4, 0.2, 3, 0.5), b('bench', 3.6, 3.2, 2.8, 0.8)],
    [n('MAGISTER VELL', 5, 2.2, 'trainer', 'wright', 3)], { braziers: [{ x: 1.4, y: 3.6, r: 0.35 }] });
  if (door === 'lodge') return room("THE HUNTERS' LODGE", 11, 8, HOME,
    [b('rack', 0.8, 0.2, 4, 0.5), b('bench', 6.5, 2.8, 2.5, 0.8), b('sacks', 9.2, 4.6, 1.2, 1)],
    [n('HUNTRESS MAEVE', 4, 2.4, 'trainer', 'ranger', 1)], { braziers: [{ x: 9.6, y: 1.2, r: 0.35 }] });
  if (door === 'tavern') return room('THE DROWNED RAT', 15, 9, { ...HOME, ambient: [0.26, 0.19, 0.16] },
    [b('counter', 1, 1.4, 5, 0.8), b('shelf', 1, 0.1, 5, 0.5), b('bench', 8, 2.6, 2.4, 0.9), b('bench', 11.6, 5, 2.4, 0.9), b('bench', 6, 5.4, 2.4, 0.9)],
    [n('BARKEEP GANNET', 3.5, 1.1, 'tavern', 'villager'), n('DICER MOLL', 9.2, 3.9, 'dice', 'rogue'), n('WHISPER', 13.6, 2, 'trainer', 'rogue', 2),
      n('A DRUNK', 6.6, 6.7, 'chat', 'villager', 11), n('A CARD SHARP', 12.4, 6.3, 'chat', 'rogue', 12)],
    { braziers: [{ x: 13.8, y: 0.9, r: 0.4 }] });
  if (door === 'infirmary') {
    const home = Math.min(PATIENTS.length, w.rescued);
    return room('THE INFIRMARY', 12, 8, HOME,
      [b('bed', 0.8, 0.8, 1, 2), b('bed', 2.6, 0.8, 1, 2), b('bed', 8.4, 0.8, 1, 2), b('bed', 10.2, 0.8, 1, 2)],
      [n('SISTER AGNE', 6, 2.8, 'infirmary', 'healer'), ...PATIENTS.slice(0, home).map((p, i) => n(p, [1.3, 3.1, 8.9][i], 3.6, 'chat', 'survivor', 10 + i))],
      { braziers: [{ x: 6, y: 0.8, r: 0.35 }] });
  }
  if (door === 'townhall') return room('THE TOWN HALL', 12, 8, HOME,
    [b('bench', 3, 2.4, 6, 1), b('shelf', 1, 0.2, 2, 0.5), b('shelf', 9, 0.2, 2, 0.5)],
    [n('REEVE HOLLIS', 6, 1.7, 'council', 'reeve'), n('ALDER BRAM', 2.2, 3, 'chat', 'elder', 3), n('GOODWIFE SELL', 9.8, 3, 'chat', 'villager', 4)]);
  if (door === 'granary') return room('THE GRANARY', 10, 7, { ...HOME, floor: 'dirt' },
    [b('sacks', 0.8, 0.6, 2, 1), b('sacks', 7.2, 0.6, 2, 1), b('sacks', 0.8, 2.2, 1.4, 1)],
    [n('FARMER JOS', 5, 2.2, 'granary', 'farmer')]);
  // A house on Rescue Row: a family, a bed, a hearth.
  const i = Number(door.split(':')[1]) || 0, f = FAMILIES[i % FAMILIES.length];
  return room(f.name, 10, 7, HOME, [b('bed', 0.8, 0.6, 1.2, 2), b('bench', 4.6, 2.6, 2, 0.8)],
    [n(f.adult, 4.2, 1.6, 'home', 'villager', i), n(f.child, 7.4, 3.2, 'home', 'child', i)], { braziers: [{ x: 8.2, y: 1, r: 0.35 }] });
}

/** A cottage or barn on a job: turned over, goblins inside, maybe someone caged. Same seed, same room. */
export function runInterior(job: Job, roomIndex: number, blockIndex: number, door: string): RoomPlan {
  const rng = new Rng(job.seed * 53 + roomIndex * 17 + blockIndex * 5 + 3), ruin = job.place.ruin, barn = door === 'barn';
  const night: Theme = { ...HOME, floor: barn ? 'dirt' : 'planks', ambient: [0.17, 0.15, 0.19] };
  const W = barn ? 14 : 11, H = barn ? 9 : 8;
  const blocks = barn ? [b('sacks', 0.8, 0.6, 2, 1)] : [b('bed', 0.8, 0.6, 1.2, 2), b('shelf', 4, 0.2, 2.5, 0.5)];
  const rounds: Round[] = barn ? [{ x: 3, y: 4.5, r: 0.6, kind: 'hay' }, { x: 11, y: 5, r: 0.6, kind: 'hay' }, { x: 5, y: 2, r: 0.3, kind: 'support' }, { x: 9, y: 2, r: 0.3, kind: 'support' }] : [];
  const props: { kind: PropKind; x: number; y: number }[] = [{ kind: 'table', x: W / 2 + rng.range(-1, 1), y: 3.6 }, { kind: rng.next() < 0.5 ? 'barrel' : 'crate', x: W - 1.5, y: H - 2.5 }];
  if (job.objective === 'rescue' || rng.next() < (barn ? 0.5 : 0.35)) props.push({ kind: 'cage', x: W - 2.2, y: 1.6 });
  const spots = [[2.5, 3], [W - 3.5, 3.2], [W / 2, 1.8], [3, 5], [W - 3, 5.2]];
  const foes: Foe[] = rng.shuffle(spots).slice(0, Math.min(4, 1 + rng.int(2) + (ruin >= 2 ? 1 : 0) + (barn ? 1 : 0))).map(([x, y]) => ({ kind: 'scrapper', x, y }));
  if (barn && ruin >= 2 && rng.next() < 0.4) foes.push({ kind: 'butcher', x: W / 2, y: 2.4 });
  const map = room(barn ? 'THE BARN' : 'THE COTTAGE', W, H, night, blocks, [], { rounds, torches: [], braziers: [{ x: barn ? W / 2 : 9.5, y: barn ? 6.2 : 1.2, r: 0.35 }] });
  return { map, foes, props };
}
