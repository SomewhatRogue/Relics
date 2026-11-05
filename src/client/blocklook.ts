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
  stall: { tall: 12, roof: '#7a2a2a', ridge: '#d8c48a', wall: '#5a3d22', windows: false },
  tent: { tall: 14, roof: '#8a7a5a', ridge: '#a8986a', wall: '#6a5a40', windows: false },
  rockwall: { tall: 14, roof: '#45414c', ridge: '#55505e', wall: '#34313a', windows: false },
  fence: { tall: 8, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#4a3420', windows: false },
  granary: { tall: 30, roof: '#6b5a3a', ridge: '#8a7448', wall: '#7a6a50', windows: false },
  wall: { tall: 20, roof: '#3b3746', ridge: '#4f4a5c', wall: '#2a2733', windows: false },
  den: { tall: 13, roof: '#4a3a24', ridge: '#5e4a2e', wall: '#3a2a1a', windows: false },
  counter: { tall: 10, roof: '#6b4a2b', ridge: '#7a5a34', wall: '#4a3420', windows: false, furniture: true },
  bed: { tall: 6, roof: '#7a6a8a', ridge: '#d8d0bc', wall: '#4a3420', windows: false, furniture: true },
  shelf: { tall: 20, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
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
  hurdle: { tall: 12, roof: '#3a2818', ridge: '#3a2818', wall: '#5a4a30', windows: false, furniture: true },
  books: { tall: 26, roof: '#3a2818', ridge: '#3a2818', wall: '#2a1d12', windows: false, furniture: true },
  stair: { tall: 30, roof: '#2e2a34', ridge: '#2e2a34', wall: '#2e2a34', windows: false, furniture: true },
  dummy: { tall: 18, roof: '#5a3d22', ridge: '#5a3d22', wall: '#4a3420', windows: false, furniture: true },
  maptable: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  dicetable: { tall: 8, roof: '#4a3420', ridge: '#5a3d22', wall: '#3a2818', windows: false, furniture: true },
  skinbench: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  desk: { tall: 9, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2818', windows: false, furniture: true },
  tub: { tall: 7, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  bellows: { tall: 6, roof: '#4a3424', ridge: '#4a3424', wall: '#5e4230', windows: false, furniture: true },
  booth: { tall: 26, roof: '#2a1d12', ridge: '#2a1d12', wall: '#14100c', windows: false, furniture: true },
  bunk: { tall: 14, roof: '#3a2a1a', ridge: '#3a2a1a', wall: '#3a2a1a', windows: false, furniture: true },
  casks: { tall: 14, roof: '#3a2818', ridge: '#3a2818', wall: '#2a1d12', windows: false, furniture: true },
  pen: { tall: 9, roof: '#8a7448', ridge: '#6b4a2b', wall: '#5a3d22', windows: false, furniture: true },
  shack: { tall: 12, roof: '#8a7a5a', ridge: '#6a5a48', wall: '#4a3420', windows: false },
  // A side way is a gap, painted with the room's ways out (wayout.ts), never drawn as a block.
  sideway: { tall: 0, roof: '#000', ridge: '#000', wall: '#000', windows: false },
};
