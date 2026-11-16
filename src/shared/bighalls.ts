/**
 * Wickhold's insides at the new scale (docs/design/new-look-interiors.md), behind `?street` with the new town:
 * the church, the barracks, the town hall, the Drowned Rat, the forge and the infirmary, about twice as wide and
 * deep as townhalls.ts's, their walls three heroes tall in 2.5D (`wallH`). Everyone who stands in the old rooms
 * stands here, with the same words, looks and trades; a few more folk at prayer, in the hall and at the Rat's
 * tables are only there to be seen. The concepts are docs/design/ref/inside-*.jpg.
 */
import type { Block, GameMap, Mark, Npc, Round, Theme } from './arena.js';
import { ARM_TABLE, KNIFE_LINE } from './pastimes.js';
import { HOME, STONE, b, n, room } from './townhalls.js';

const mk = (kind: Mark['kind'], x: number, y: number, w: number, h: number): Mark => ({ kind, x, y, w, h });
const rd = (kind: Round['kind'], x: number, y: number, r: number): Round => ({ kind, x, y, r });
const hang = (kind: NonNullable<GameMap['hangs']>[number]['kind'], x: number, w: number) => ({ kind, x, w });
const torch = (...xs: number[]) => xs.map((x) => ({ x, y: -1.6 }));
/** Somebody only there to be seen: no mark, nothing to say. */
const folk = (x: number, y: number, look: string, arg?: number): Npc => ({ name: '', x, y, talk: '', look, arg, mute: true });
const big = (name: string, w: number, h: number, wallH: number, theme: Theme, blocks: Block[], npcs: Npc[], more: Partial<GameMap>): GameMap =>
  ({ ...room(name, w, h, theme, blocks, npcs, more), wallH });

/** How far each pastime's corner moved from the old room to the new (its table, its keeper and your seat move together). */
export const SHIFT = { arm: [3.3, 6.6], knives: [7.5, 0], anvil: [7, 0.9] } as const;
const at = (id: keyof typeof SHIFT, x: number, y: number): [number, number] => [x + SHIFT[id][0], y + SHIFT[id][1]];
/** Where a pastime's seat is in the new rooms (game.ts asks, inside, under `?street`). */
export const bigSeat = (id: string, seat: readonly [number, number]): [number, number] =>
  id in SHIFT ? at(id as keyof typeof SHIFT, seat[0], seat[1]) : [seat[0], seat[1]];

const church = (): GameMap => {
  const pillars = [3.5, 6.5, 9.5, 12.5, 15.5].flatMap((y) => [rd('pillar', 7, y, 0.45), rd('pillar', 17, y, 0.45)]);
  const pews = [7, 9, 11, 13].flatMap((y) => [b('pew', 7.8, y, 3.2, 0.6), b('pew', 13, y, 3.2, 0.6)]);
  return big('THE CHURCH', 24, 20, 7, STONE,
    [b('altar', 11, 1.4, 2, 1), b('bed', 1.2, 2.8, 1, 2.2), b('counter', 2.4, 16.4, 2, 0.6), b('font', 19.6, 16.2, 1.2, 1.2), ...pews],
    [n('FATHER ODRIC', 12, 2.9, 'church', 'priest'), n('MOTHER ISOLDE', 3.4, 4.2, 'trainer', 'healer', 4), n('MARTA', 9.4, 10.5, 'chat', 'villager', 2),
      n('VERGER OSWIN', 3.4, 15.6, 'vendor', 'priest', 4), folk(14.6, 12.5, 'villager', 5), folk(9, 8.5, 'elder', 3), folk(15.2, 6.5, 'villager', 7)],
    { rounds: [...pillars, rd('candles', 9.8, 1.2, 0.2), rd('candles', 14.2, 1.2, 0.2), rd('candles', 0.8, 2.2, 0.2), rd('candles', 5.2, 2.2, 0.2), rd('candles', 23.2, 2.4, 0.2)],
      marks: [mk('rug', 11.2, 2.6, 1.6, 16.8), mk('rushes', 0.6, 2, 5.4, 5)],
      hangs: [hang('herbs', 1, 3.6), hang('window', 7.4, 1.2), hang('window', 11.4, 1.2), hang('window', 15.4, 1.2), hang('window', 20, 1.2)],
      torches: torch(6, 18), braziers: [{ x: 20.8, y: 9, r: 0.35 }] });
};

const barracks = (): GameMap => big('THE BARRACKS', 24, 16, 5.5, STONE,
  [b('rack', 1, 0.2, 4, 0.5), b('rack', 15.6, 0.2, 7, 0.5), b('counter', 17.6, 2.8, 3.6, 0.6), b('maptable', 10.4, 6.4, 3.2, 1.2), b('dummy', 4.6, 7.2, 0.8, 0.6),
    b('stand', 16.2, 2.5, 0.7, 0.5), b('stand', 21.6, 2.5, 0.7, 0.5), b('bunk', 22.4, 5.6, 1.2, 2.4), b('bunk', 22.4, 8.8, 1.2, 2.4), b('bunk', 22.4, 12, 1.2, 2.4), b('sacks', 0.4, 13.6, 1.4, 1)],
  [n('MASTER COLE', 3.4, 9.6, 'trainer', 'trainer', 0), n('SQUIRE PELL', 6.4, 9.6, 'yard', 'squire'), { ...n('CORPORAL BRISK', 12, 8.4, 'map', 'guard', 13), reach: 1.6 },
    n('QUARTERMASTER NELL', 19.4, 2.1, 'vendor', 'squire', 0), folk(14.4, 7, 'guard'), folk(20.6, 10.4, 'guard')],
  { rounds: [rd('post', 2, 5, 0.12), rd('post', 8, 5, 0.12), rd('post', 2, 11.6, 0.12), rd('post', 8, 11.6, 0.12), rd('support', 21.2, 5, 0.3), rd('support', 21.2, 8.4, 0.3), rd('support', 21.2, 11.8, 0.3)],
    marks: [mk('rushes', 9, 1.6, 11.6, 13), mk('chalk', 2.2, 5.2, 5.6, 6.2)],
    hangs: [hang('shields', 6.4, 3), hang('banner', 11.4, 1.2), hang('shields', 13.6, 1.8)],
    torches: torch(3, 12, 21), braziers: [{ x: 9, y: 2.2, r: 0.4 }] });

const townhall = (): GameMap => big('THE TOWN HALL', 22, 16, 6.5, { ...STONE, floor: 'planks' },
  [b('desk', 6, 5, 10, 1.2), b('hearth', 20.8, 6, 1, 2.6), b('bench', 3, 10.4, 4.6, 0.6), b('bench', 14.4, 10.4, 4.6, 0.6), b('shelf', 0.6, 0.1, 2.4, 0.5)],
  [{ ...n('REEVE HOLLIS', 11, 4.2, 'council', 'reeve'), reach: 1.4 }, n('ALDER BRAM', 4.4, 3.6, 'advocate', 'elder', 3), n('GOODWIFE SELL', 17.6, 3.6, 'advocate', 'villager', 4),
    folk(4.6, 11.6, 'villager', 6), folk(16.8, 11.6, 'elder', 2)],
  { marks: [mk('rug', 4.4, 3.4, 13.2, 4.6)],
    hangs: [hang('vote', 2.4, 3.6), hang('map', 8.4, 5.2), hang('vote', 16, 3.6)],
    torches: torch(1.2, 7.2, 14.8, 20.8), braziers: [{ x: 20.4, y: 7.3, r: 0.45 }] });

const tavern = (): GameMap => {
  const arm = at('arm', ARM_TABLE.table.x, ARM_TABLE.table.y), armBy = at('arm', ARM_TABLE.npc[0], ARM_TABLE.npc[1]), sharp = at('knives', KNIFE_LINE.npc[0], KNIFE_LINE.npc[1]);
  return big('THE DROWNED RAT', 26, 16, 5, { ...HOME, ambient: [0.26, 0.19, 0.16] },
    [b('counter', 6, 2.6, 9, 0.8), b('shelf', 6, 0.1, 9, 0.5), b('casks', 15.6, 0.2, 1.2, 2), b('stair', 0.4, 2.4, 2, 4), b('hearth', 0.1, 9.4, 1, 2.6),
      b('dicetable', 11.6, 7.4, 2.2, 0.8), b('booth', 19.4, 0.2, 3, 1.4), b('table', 3.6, 8.6, 2.4, 0.9), b('bench', 3.6, 9.7, 2.4, 0.5), b('table', 16, 7.8, 2.4, 0.9),
      b('table', 4.8, 12.6, 2.4, 0.9), b('table', 14.6, 11.6, 2.4, 0.9), b('bench', 14.6, 10.8, 2.4, 0.5), b('table', 20.2, 9.4, 2.2, 0.9), b('armtable', arm[0], arm[1], ARM_TABLE.table.w, ARM_TABLE.table.h)],
    [n('BARKEEP GANNET', 10.5, 1.8, 'tavern', 'villager'), n('DICER MOLL', 12.7, 8.8, 'dice', 'rogue'), n('WHISPER', 20.9, 2.1, 'trainer', 'rogue', 2), n('NETTLE', 18.4, 2, 'vendor', 'rogue', 2),
      n('A DRUNK', 7, 11, 'chat', 'villager', 11), n('A CARD SHARP', sharp[0], sharp[1], 'knives', 'rogue', 12), n('A WATCHMAN OFF DUTY', armBy[0], armBy[1], 'arm', 'guard'),
      folk(4.4, 8.1, 'villager', 3), folk(17.4, 7.3, 'villager', 8), folk(6, 14, 'villager', 9), folk(15.6, 13, 'guard'), folk(8.2, 3.9, 'villager', 4), folk(21.2, 8.9, 'villager', 6)],
    { braziers: [{ x: 1.4, y: 10.7, r: 0.5 }], marks: [mk('sawdust', 0.4, 2.2, 25, 13.4)],
      hangs: [hang('notices', 3.2, 0.9), hang('sign', 9.7, 1.6), hang('knifeboard', KNIFE_LINE.board.x + SHIFT.knives[0], KNIFE_LINE.board.w)],
      torches: torch(3, 13, 23) });
};

const forge = (): GameMap => {
  const anvil = at('anvil', 3.4, 2.7), smith = at('anvil', 4.1, 1.9);
  return big('THE FORGE', 22, 15, 6, { ...STONE, ambient: [0.28, 0.2, 0.2] },
    [b('hearth', 9.5, 0.1, 3, 1.2), b('bellows', 13, 0.5, 1, 0.7), b('anvil', anvil[0], anvil[1], 1.2, 0.6), b('tub', 15.4, 4, 1.3, 0.8),
      b('shelf', 1, 0.1, 3.6, 0.5), b('bench', 1.2, 1.5, 3.6, 0.8), b('rack', 16.4, 0.2, 5, 0.5), b('sacks', 19.6, 6.4, 1.4, 1), b('sacks', 0.4, 9.6, 1.4, 1)],
    [n('HALVARD THE SMITH', smith[0], smith[1], 'smith', 'smith'), n('IVO THE RELIC-WRIGHT', 3, 3, 'wright', 'wright'), folk(17.4, 9, 'villager', 10)],
    { braziers: [{ x: 11, y: 1.1, r: 0.5 }], marks: [mk('soot', 6.6, 0.6, 9, 6)], hangs: [hang('tools', 5.4, 3), hang('tools', 14.4, 1.6)], torches: torch(4, 18) });
};

/** The infirmary, with however many of the rescued are still abed (as townhalls.ts's). */
export function bigInfirmary(patients: string[], home: number): GameMap {
  const beds = [1.2, 3.2, 5.2, 15.8, 17.8, 19.8].flatMap((x) => [b('bed', x, 2.6, 1, 2), b('bed', x, 8.2, 1, 2)]);
  const by = [[2.2, 5.2], [4.2, 5.2], [16.8, 5.2]];
  return big('THE INFIRMARY', 22, 14, 5.5, HOME,
    [b('hearth', 10, 0.1, 2, 1), b('desk', 13.4, 1.4, 2.4, 0.7), b('tub', 19.6, 11.8, 1, 0.7), ...beds],
    [n('SISTER AGNE', 12.6, 2.8, 'infirmary', 'healer'), ...patients.slice(0, home).map((p, i) => n(p, by[i][0], by[i][1], 'chat', 'survivor', 10 + i))],
    { braziers: [{ x: 11, y: 0.9, r: 0.4 }], rounds: [rd('candles', 14, 1.6, 0.2), rd('candles', 8.2, 1, 0.2)], marks: [mk('rug', 10.2, 2.2, 1.6, 11.4)],
      hangs: [hang('herbs', 0.6, 3.6), hang('window', 5.4, 1.2), hang('window', 15.4, 1.2), hang('herbs', 17.6, 3.6)], torches: torch(3, 8.4, 13.6, 19) });
}

/** A Wickhold hall's inside at the new scale, by its door, or null if this pass doesn't redo it. */
export function bigHall(door: string): GameMap | null {
  return ({ church, hall: barracks, townhall, tavern, forge } as Record<string, () => GameMap>)[door]?.() ?? null;
}
