/**
 * How each kind of block looks in the flat view: wall height (pixels), roof, ridge and wall colours,
 * windows, and whether it's furniture. blocks.ts paints from it; the 2.5D view builds from it too
 * (three/furnish3d.ts, hallfurn3d.ts, houses3d.ts, walls3d.ts), so the two can't drift apart.
 */
import type { Block } from '../shared/arena';
import type { Look } from './furnish';

/** Wall height (pixels), roof and wall colours, by kind. */
export const LOOK: Record<Block['kind'], Look> = {
  house: { tall: 20, roof: '#5a2e22', ridge: '#7a3e2a', wall: '#6a5a48', windows: true },
  barn: { tall: 28, roof: '#6a2a1a', ridge: '#8a3a22', wall: '#5a3d22', windows: false },
  hall: { tall: 24, roof: '#4a3a2a', ridge: '#5e4a34', wall: '#5e5248', windows: true },
  church: { tall: 40, roof: '#3a3a4a', ridge: '#4e4e60', wall: '#6a6470', windows: true },
  forge: { tall: 28, roof: '#3a3036', ridge: '#4a3e44', wall: '#4f4a5c', windows: true },
  // (Dark and gold: the awning's stripes bone, not cream; the grade turns its red to rust.)
  stall: { tall: 12, roof: '#7a2a2a', ridge: '#9a8c6a', wall: '#5a3d22', windows: false },
  clamp: { tall: 7, roof: '#3a4426', ridge: '#4a5630', wall: '#2a2118', windows: false },
  plough: { tall: 6, roof: '#4a3320', ridge: '#6a4a2e', wall: '#2b1e12', windows: false },
  struckpine: { tall: 30, roof: '#1f3020', ridge: '#2a4328', wall: '#3a2a1c', windows: false },
  // The Fen's drowned chapel and its echoes (shared/fenroamland.ts; drawn the tile way in the 2.5D view: tilechapel.ts, tileawash.ts).
  chapel: { tall: 44, roof: '#3e4048', ridge: '#55585e', wall: '#5a5c62', windows: false },
  awash: { tall: 6, roof: '#4a4c52', ridge: '#5e6066', wall: '#3a3c42', windows: false },
  tent: { tall: 14, roof: '#8a7a5a', ridge: '#a8986a', wall: '#6a5a40', windows: false },
  rockwall: { tall: 14, roof: '#45414c', ridge: '#55505e', wall: '#34313a', windows: false },
  fence: { tall: 8, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#4a3420', windows: false },
  granary: { tall: 30, roof: '#6b5a3a', ridge: '#8a7448', wall: '#7a6a50', windows: false },
  wall: { tall: 20, roof: '#3b3746', ridge: '#4f4a5c', wall: '#2a2733', windows: false },
  den: { tall: 13, roof: '#4a3a24', ridge: '#5e4a2e', wall: '#3a2a1a', windows: false },
  counter: { tall: 10, roof: '#6b4a2b', ridge: '#7a5a34', wall: '#4a3420', windows: false, furniture: true },
  bed: { tall: 6, roof: '#7a6a8a', ridge: '#d8d0bc', wall: '#4a3420', windows: false, furniture: true },
  shelf: { tall: 20, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  // The Keeping Room's own (client/tilefurnkeep.ts draws them in 2.5D): a stone trough, a cradle, the hoard's shelves.
  trough: { tall: 8, roof: '#3c3c3c', ridge: '#16282a', wall: '#2c2c2c', windows: false, furniture: true },
  cradle: { tall: 8, roof: '#3a2a1e', ridge: '#4e3826', wall: '#24180f', windows: false, furniture: true },
  lip: { tall: 5, roof: '#4f4f4f', ridge: '#070c0c', wall: '#2c2c2c', windows: false, furniture: true },
  irondoor: { tall: 26, roof: '#3c3c3c', ridge: '#414852', wall: '#2c3138', windows: false, furniture: true },
  kettle: { tall: 10, roof: '#1c1f24', ridge: '#414852', wall: '#101215', windows: false, furniture: true },
  hoard: { tall: 20, roof: '#3a2a1e', ridge: '#5e6872', wall: '#24180f', windows: false, furniture: true },
  anvil: { tall: 8, roof: '#6a6470', ridge: '#8a8494', wall: '#34313a', windows: false, furniture: true },
  altar: { tall: 11, roof: '#d8d0bc', ridge: '#e8e0c8', wall: '#6a6470', windows: false, furniture: true },
  pew: { tall: 7, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#3a2a1a', windows: false, furniture: true },
  bench: { tall: 8, roof: '#7a5a34', ridge: '#8b6a3a', wall: '#4a3420', windows: false, furniture: true },
  hearth: { tall: 12, roof: '#4a4652', ridge: '#57525e', wall: '#34313a', windows: false, furniture: true },
  sacks: { tall: 9, roof: '#9a8a5a', ridge: '#b0a06a', wall: '#7a6a48', windows: false, furniture: true },
  tower: { tall: 64, roof: '#3a3050', ridge: '#4a3e66', wall: '#57525e', windows: true },
  tavern: { tall: 26, roof: '#4a2a1e', ridge: '#6a3a26', wall: '#5e4a36', windows: true },
  monument: { tall: 22, roof: '#6a6470', ridge: '#8a8494', wall: '#57525e', windows: false, furniture: true },
  rubble: { tall: 10, roof: '#45414c', ridge: '#55505e', wall: '#34313a', windows: false },
  cart: { tall: 9, roof: '#7a5a34', ridge: '#8b6a3a', wall: '#4a3420', windows: false, furniture: true },
  rack: { tall: 16, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  partition: { tall: 22, roof: '#3e2a1a', ridge: '#5a3d22', wall: '#6a5e52', windows: false, furniture: true },
  loom: { tall: 18, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2a1a', windows: false, furniture: true },
  gallows: { tall: 34, roof: '#5a3d22', ridge: '#5a3d22', wall: '#2e2016', windows: false, furniture: true },
  gate: { tall: 18, roof: '#2a2420', ridge: '#3a3028', wall: '#4a3a28', windows: false },
  hurdle: { tall: 12, roof: '#3a2818', ridge: '#3a2818', wall: '#5a4a30', windows: false, furniture: true },
  books: { tall: 26, roof: '#3a2818', ridge: '#3a2818', wall: '#2a1d12', windows: false, furniture: true },
  stair: { tall: 30, roof: '#2e2a34', ridge: '#2e2a34', wall: '#2e2a34', windows: false, furniture: true },
  dummy: { tall: 18, roof: '#5a3d22', ridge: '#5a3d22', wall: '#4a3420', windows: false, furniture: true },
  maptable: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  dicetable: { tall: 8, roof: '#4a3420', ridge: '#5a3d22', wall: '#3a2818', windows: false, furniture: true },
  armtable: { tall: 8, roof: '#5a3d22', ridge: '#6a4a2a', wall: '#3a2818', windows: false, furniture: true },
  skinbench: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  desk: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  tub: { tall: 7, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  bellows: { tall: 6, roof: '#4a3424', ridge: '#4a3424', wall: '#5e4230', windows: false, furniture: true },
  booth: { tall: 26, roof: '#2a1d12', ridge: '#2a1d12', wall: '#14100c', windows: false, furniture: true },
  bunk: { tall: 14, roof: '#3a2a1a', ridge: '#3a2a1a', wall: '#3a2a1a', windows: false, furniture: true },
  casks: { tall: 14, roof: '#3a2818', ridge: '#3a2818', wall: '#2a1d12', windows: false, furniture: true },
  pen: { tall: 9, roof: '#8a7448', ridge: '#6b4a2b', wall: '#5a3d22', windows: false, furniture: true },
  shack: { tall: 12, roof: '#8a7a5a', ridge: '#6a5a48', wall: '#4a3420', windows: false },
  font: { tall: 10, roof: '#57525e', ridge: '#6a6470', wall: '#3a3640', windows: false, furniture: true },
  stand: { tall: 18, roof: '#6a6470', ridge: '#8a8494', wall: '#3a2818', windows: false, furniture: true },
  table: { tall: 8, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#3a2818', windows: false, furniture: true },
  // Layout 4's pieces: painted from their boxes in both views (pieces.ts); `tall` covers the highest.
  headframe: { tall: 56, roof: '#4a3420', ridge: '#2e2016', wall: '#4a3420', windows: false },
  log: { tall: 12, roof: '#4a3a2a', ridge: '#3e3022', wall: '#4a3a2a', windows: false },
  mill: { tall: 44, roof: '#3a3036', ridge: '#4a3e44', wall: '#6a6470', windows: false },
  stakes: { tall: 18, roof: '#5a4a30', ridge: '#9a8a62', wall: '#4a3c26', windows: false },
  // The Staithe (client/pieces.ts draws them; these are for fire and rubble).
  jetty: { tall: 4, roof: '#5a4028', ridge: '#3a2a1a', wall: '#4a3420', windows: false },
  gangway: { tall: 8, roof: '#4a3a2a', ridge: '#3e3022', wall: '#4a3a2a', windows: false },
  smokehouse: { tall: 34, roof: '#3a3036', ridge: '#2a2026', wall: '#4a3a2a', windows: false },
  dryrack: { tall: 22, roof: '#5a4a30', ridge: '#3a2a1a', wall: '#4a3c26', windows: false },
  hungnet: { tall: 22, roof: '#a89a72', ridge: '#3a2a1a', wall: '#3a2a1a', windows: false },
  // Hangman's Wood's Gospel Oak (pieces.ts draws it; this is for fire and its burnt stump).
  oak: { tall: 70, roof: '#3a2e24', ridge: '#24391f', wall: '#3a2e24', windows: false },
  // The great barn's hay stacks (pieces.ts draws them; this is for fire and the ash heap).
  haystack: { tall: 22, roof: '#b8a060', ridge: '#d8c47a', wall: '#8a7440', windows: false },
  // Fenmere: boards over the water (a deck), reeds standing in the shallows.
  boards: { tall: 4, roof: '#5a4028', ridge: '#3a2a1a', wall: '#4a3420', windows: false },
  reeds: { tall: 20, roof: '#8a8a52', ridge: '#5a6a3a', wall: '#4a5a32', windows: false },
  // A side way is a gap, painted with the room's ways out (wayout.ts), never drawn as a block.
  sideway: { tall: 0, roof: '#000', ridge: '#000', wall: '#000', windows: false },
};

/**
 * The art pass (docs/design/art-pass.md, 1.5x): what's painted from this table stands half again as tall
 * on the same footprint, now twice (walls up, furniture at the bigger hands; blocks.ts sizes doors and windows to
 * match). Pieces drawn from their own boxes (pieces.ts) keep theirs: their `tall` only bounds fire and rubble.
 */
const BOXED = new Set<string>(['headframe', 'log', 'mill', 'stakes', 'jetty', 'gangway', 'smokehouse', 'dryrack', 'hungnet', 'oak', 'haystack', 'boards', 'reeds', 'sideway']);
// (Twice, since the heroic proportions, 2026-11-12: a house's wall a head over the 31-tall heroes, Kyle: "houses now look
// way too tiny".)
for (const [k, l] of Object.entries(LOOK)) if (!BOXED.has(k)) l.tall = Math.round(l.tall * 2);
