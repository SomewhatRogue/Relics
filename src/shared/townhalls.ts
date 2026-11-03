/**
 * Inside Wickhold's halls, each its own place: the mage's tower (bookcases, a star chart, a curling
 * stair, a chalked circle, coloured fire), the barracks (racks, shields, bunks, a map table, a
 * dummy), the hunters' lodge (bows, antlers, pelts, a skinning bench, the hounds' bowls), the church
 * (candles, a runner up the aisle, a surgeon's cot), the Drowned Rat (the bar, casks, the dice table,
 * Whisper's curtained booth), the forge (bellows, quench tub, soot), the town hall (the council table,
 * the valley map, notices), the counting house (open to the sky at one end, a counter, the vault
 * stair behind it) and the infirmary (herbs drying, a basin). Paint-only touches are marks on
 * the floor and hangs on the back wall; furniture is solid. Same layout every time.
 */
import type { Block, GameMap, Mark, Npc, Round, Theme } from './arena.js';

export const HOME: Theme = { floor: 'planks', back: 'plaster', ambient: [0.24, 0.2, 0.22], moon: 0 };
export const STONE: Theme = { floor: 'flagstone', back: 'stone', ambient: [0.22, 0.2, 0.28], moon: 0 };

export function room(name: string, w: number, h: number, theme: Theme, blocks: Block[], npcs: Npc[], more: Partial<GameMap> = {}): GameMap {
  return {
    name, w, h, wallFace: 3, rounds: [], blocks, braziers: [], npcs,
    torches: [{ x: 2.5, y: -1.6 }, { x: w - 2.5, y: -1.6 }],
    hero: { x: w / 2, y: h - 1.3 }, exit: { x: w / 2 - 1, y: h - 0.7, w: 2, h: 0.7 }, theme, ...more,
  };
}
export const b = (kind: Block['kind'], x: number, y: number, w: number, h: number): Block => ({ kind, x, y, w, h });
export const n = (name: string, x: number, y: number, talk: string, look: string, arg?: number): Npc => ({ name, x, y, talk, look, arg });
const mk = (kind: Mark['kind'], x: number, y: number, w: number, h: number): Mark => ({ kind, x, y, w, h });
const rd = (kind: Round['kind'], x: number, y: number, r: number): Round => ({ kind, x, y, r });
const hang = (kind: NonNullable<GameMap['hangs']>[number]['kind'], x: number, w: number) => ({ kind, x, w });

/** A Wickhold hall's inside, by its door, or null if it isn't one of the halls. */
export function hall(door: string): GameMap | null {
  if (door === 'tower') return room('THE TOWER', 11, 10, { ...STONE, ambient: [0.16, 0.14, 0.27] },
    [b('books', 0.4, 0.2, 3, 0.7), b('books', 4.4, 0.2, 2.2, 0.7), b('stair', 8.8, 0.3, 2, 3.4), b('desk', 6.3, 3.6, 2.2, 0.8)],
    [n('MAGISTER VELL', 5.5, 2.5, 'trainer', 'mage', 3)],
    { rounds: [rd('witchfire', 2.2, 4.6, 0.4), rd('candles', 7.6, 1.3, 0.2)], marks: [mk('chalk', 3, 4.8, 5, 3.2)], hangs: [hang('stars', 6.8, 1.9)], torches: [{ x: 5.5, y: -1.6 }] });
  if (door === 'hall') return room('THE BARRACKS', 13, 8, STONE,
    [b('rack', 1, 0.2, 3, 0.5), b('rack', 9, 0.2, 3, 0.5), b('bunk', 0.4, 3, 1.2, 2.4), b('bunk', 11.4, 3, 1.2, 2.4), b('maptable', 4.6, 3.7, 3.2, 1), b('dummy', 10, 5.4, 0.8, 0.6)],
    [n('MASTER COLE', 4.5, 2.4, 'trainer', 'trainer', 0), n('SQUIRE PELL', 8.8, 3.2, 'yard', 'squire'), n('CORPORAL BRISK', 6.5, 5.4, 'chat', 'guard', 13)],
    { marks: [mk('rushes', 1.6, 1, 9.8, 6)], hangs: [hang('shields', 4.2, 1.7), hang('banner', 6.1, 0.8), hang('shields', 7.1, 1.7)] });
  if (door === 'lodge') return room("THE HUNTERS' LODGE", 11, 8, HOME,
    [b('rack', 0.8, 0.2, 4, 0.5), b('skinbench', 6.4, 2.8, 2.6, 0.8), b('sacks', 9.2, 4.6, 1.2, 1)],
    [n('HUNTRESS MAEVE', 4, 2.4, 'trainer', 'ranger', 1)],
    { braziers: [{ x: 9.6, y: 1.2, r: 0.35 }], marks: [mk('pelt', 3, 4.4, 3.2, 1.6), mk('bowls', 1, 5.8, 1.4, 0.5)], hangs: [hang('antlers', 4.9, 1.6), hang('pelts', 6.6, 2.4), hang('bows', 0.8, 3.8)] });
  if (door === 'church') return room('THE CHURCH', 14, 9, STONE,
    [b('altar', 6, 0.5, 2, 1), b('pew', 1.5, 3.4, 4, 0.6), b('pew', 8.5, 3.4, 4, 0.6), b('pew', 1.5, 5.4, 4, 0.6), b('pew', 8.5, 5.4, 4, 0.6), b('bed', 12.7, 5.6, 1, 2.2)],
    [n('FATHER ODRIC', 7, 2.2, 'church', 'priest'), n('MOTHER ISOLDE', 11.6, 2.4, 'trainer', 'healer', 4), n('MARTA', 3.2, 4.6, 'chat', 'villager', 2)],
    { rounds: [rd('candles', 5.3, 1, 0.2), rd('candles', 8.7, 1, 0.2), rd('candles', 0.8, 2.6, 0.2), rd('candles', 13.2, 2.6, 0.2)],
      marks: [mk('rug', 6.2, 1.6, 1.6, 7)], hangs: [hang('window', 2.4, 1.2), hang('window', 6.4, 1.2), hang('window', 10.4, 1.2)], torches: [{ x: 4.6, y: -1.6 }, { x: 9.4, y: -1.6 }] });
  if (door === 'tavern') return room('THE DROWNED RAT', 15, 9, { ...HOME, ambient: [0.26, 0.19, 0.16] },
    [b('counter', 1, 1.4, 5, 0.8), b('shelf', 1, 0.1, 5, 0.5), b('casks', 0.2, 3, 0.9, 1.8), b('dicetable', 8.1, 2.7, 2.2, 0.8), b('booth', 12.2, 0.2, 2.6, 1.3),
      b('bench', 11.6, 5, 2.4, 0.9), b('bench', 6, 5.4, 2.4, 0.9)],
    [n('BARKEEP GANNET', 3.5, 1.1, 'tavern', 'villager'), n('DICER MOLL', 9.2, 3.9, 'dice', 'rogue'), n('WHISPER', 13.6, 2, 'trainer', 'rogue', 2),
      n('A DRUNK', 6.6, 6.7, 'chat', 'villager', 11), n('A CARD SHARP', 12.4, 6.3, 'chat', 'rogue', 12)],
    { braziers: [{ x: 7.4, y: 1.1, r: 0.4 }], marks: [mk('sawdust', 0.4, 2.6, 14, 6)], hangs: [hang('sign', 9.2, 1.6), hang('notices', 6.1, 0.9)] });
  if (door === 'forge') return room('THE FORGE', 13, 8, { ...STONE, ambient: [0.28, 0.2, 0.2] },
    [b('anvil', 3.4, 2.7, 1.2, 0.6), b('bench', 8.5, 0.6, 3.5, 0.8), b('sacks', 11.2, 4.6, 1.2, 1), b('bellows', 0.2, 1.1, 0.9, 0.6), b('tub', 1, 4.6, 1.3, 0.8)],
    [n('HALVARD THE SMITH', 4.1, 1.9, 'smith', 'smith'), n('IVO THE RELIC-WRIGHT', 10.2, 2.2, 'wright', 'wright')],
    { braziers: [{ x: 1.8, y: 1.4, r: 0.45 }], marks: [mk('soot', 0.3, 0.6, 5, 4.4)], hangs: [hang('tools', 4.6, 3)] });
  if (door === 'bank') return room('THE COUNTING HOUSE', 11, 8, { ...STONE, ambient: [0.26, 0.25, 0.32], moon: 0.4 },
    [b('counter', 3, 1.4, 5, 0.8), b('shelf', 0.6, 0.1, 2.2, 0.5), b('rubble', 8.2, 0.4, 2.4, 1.4), b('rubble', 0.4, 5.6, 1.4, 0.9), b('sacks', 9.4, 5, 1.2, 1)],
    [n('KEEPER EDDA', 5.5, 1.1, 'bank', 'villager')],
    { marks: [mk('rushes', 2.6, 3, 6, 3)], hangs: [hang('notices', 4.8, 1.4)], braziers: [{ x: 2, y: 3.2, r: 0.35 }] });
  // The council's two choices on boards either side of the valley map, someone under each to argue it
  // (client/voteboards.ts, councilui.ts); the reeve heard from across his table.
  if (door === 'townhall') return room('THE TOWN HALL', 12, 8, HOME,
    [b('desk', 3, 2.4, 6, 1)],
    [{ ...n('REEVE HOLLIS', 6, 1.7, 'council', 'reeve'), reach: 1.4 }, n('ALDER BRAM', 2.2, 1.3, 'advocate', 'elder', 3), n('GOODWIFE SELL', 9.8, 1.3, 'advocate', 'villager', 4)],
    { marks: [mk('rug', 2.4, 1.8, 7.2, 2.6)], hangs: [hang('vote', 0.4, 3.6), hang('map', 4.4, 3.2), hang('vote', 8, 3.6)], torches: [{ x: 4.2, y: -1.6 }, { x: 7.8, y: -1.6 }] });
  return null;
}

/** The infirmary, with however many of the rescued are still abed. */
export function infirmary(patients: string[], home: number): GameMap {
  return room('THE INFIRMARY', 12, 8, HOME,
    [b('bed', 0.8, 0.8, 1, 2), b('bed', 2.6, 0.8, 1, 2), b('bed', 8.4, 0.8, 1, 2), b('bed', 10.2, 0.8, 1, 2), b('desk', 5, 0.3, 2, 0.6), b('tub', 10.4, 5.4, 1, 0.7)],
    [n('SISTER AGNE', 6, 2.8, 'infirmary', 'healer'), ...patients.slice(0, home).map((p, i) => n(p, [1.3, 3.1, 8.9][i], 3.6, 'chat', 'survivor', 10 + i))],
    { braziers: [{ x: 11.4, y: 3.6, r: 0.35 }], rounds: [rd('candles', 4.2, 1.2, 0.2)], hangs: [hang('herbs', 4, 4)] });
}
