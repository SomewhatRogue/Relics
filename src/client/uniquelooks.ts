/**
 * The unique weapons' own looks (shared/uniques.ts), each drawn as its `line` says it is, on its kit's shape:
 * its own stuff (exact colours swapped over today's art, not over its PRE-WAR tier, and no veins) and a few
 * strokes in the hand's frame (namedlooks.ts has the shape of the table). Floor and bag: uniqueart.ts.
 * What a unique looks like is the Deep chat's to say; these follow the lines until it does.
 */
import type { Named } from './namedlooks';

// Today's art's colours, by what they are on each kit (held.ts, heldkits.ts).
const BLADE = '#9aa4ae', EDGE = '#eef2f5', TIP = '#cfd6dc', GOLD = '#d4a537', GRIP = '#4a3420', SPEAR = '#8b6a3a', SPEARHEAD = '#dfe6ec';
const HAFT = '#5a3d22', MACEGRIP = '#3a2a1a', HEAD = '#6a727c', HEADLIT = '#aab2be', FLANGE = '#8a929c', STAFF = '#6b4a2b';
const RAG = '#6a5a48', RAG_LIT = '#857260', RAG_DARK = '#4a3e32';
const up = (h: { act: string }) => (h.act === 'charge' || h.act === 'attack' ? 1.5 : 0);

export const UNIQUE_LOOKS: Record<string, Named> = {
  // A quarry pick ground to an edge: the blade a haft, an iron pick head across its end.
  haulpick: {
    swap: { [BLADE]: '#5e4228', [EDGE]: '#7a5834', [TIP]: '#5e4228', [GOLD]: '#5a5e64' },
    held: (s) => {
      s.across(23.4, -5.5, 5.5, '#6e7278', 3);
      s.across(24.4, -5, 5, '#b0b4ba');
      for (const o of [-6.2, 6.2]) s.dot(23.4, o, '#e0e4ea');
    },
  },
  // An iron pin as long as your arm, ground to a point; a head at the butt.
  hingepin: {
    swap: { [SPEAR]: '#6e7074', [SPEARHEAD]: '#b8bcc2' },
    held: (s) => s.across(-9, -1.2, 1.2, '#55585e', 2),
  },
  // Cut from a plank of old oak, the nail hole still in the stave.
  doorbow: {
    paint: { wood: ['#5a4a38', '#7a6650', '#94806a', 0.5] },
    held: (s) => {
      s.dot(3.2, 3.6, '#141016');
      s.dot(3.2, -3.6, '#8a4a2a');
    },
  },
  // Two of its own teeth, filed to points and set in bone.
  mawlteeth: {
    swap: { '#e6ecf0': '#e8dcb8', '#2a2420': '#d8ccb0' },
    held: (s) => {
      s.along(2, 4, 0.5, '#d8c89c');
      s.dot(7, 0, '#fff4d8');
    },
  },
  // A meat hook on a chain, worn bright where hands held it (the flail's head and chain, bright).
  skarnhook: {
    swap: { '#5a5560': '#a8adb4', '#8a8490': '#c0c4c8', [TIP]: '#7a7e84', [HAFT]: '#4a3a2a' },
  },
  // A lump of iron on an ash haft, dented by what it hit.
  knucklemace: {
    swap: { [HEAD]: '#5e6268', [HEADLIT]: '#7e8288', [FLANGE]: '#5e6268', [TIP]: '#5e6268', [GOLD]: '#4a4c50', [HAFT]: '#a08a68', [MACEGRIP]: '#7a6648' },
    held: (s) => {
      s.across(11.6, -2.2, 2.2, '#5e6268', 3);
      s.dot(11.2, 0.9, '#3a3c40');
      s.dot(12.6, -0.9, '#3a3c40');
    },
  },
  // A long iron ladle, black from the pot; the spell's light gathers in the bowl.
  spoonladle: {
    swap: { [STAFF]: '#3e3c42' },
    held: (s) => {
      s.across(15.4, -1.8, 1.8, '#5a585e');
      s.across(16.5, -1.8, 1.8, '#26242a', 2);
      s.across(17.6, -1.2, 1.2, '#26242a', 2);
    },
  },
  // A crossbow wound with chain instead of cord: links across the prod, a few round the stock.
  gutbow: {
    held: (s, h) => {
      s.lift(up(h));
      for (let o = -4; o <= 4; o++) s.dot(4.2, o, o % 2 ? '#8a8e94' : '#c0c4ca');
      for (const r of [-1, 1]) s.dot(r, 0.9, '#a8acb2');
    },
  },
  // One blade of a pair of shears, very sharp: a wedge blade, its ring handle, the pivot screw.
  rustshears: {
    swap: { '#cfd6e8': '#8a7a72', '#7a5aa8': '#6a5e58', '#9aa3ad': '#5a504a' },
    held: (s) => {
      s.along(2, 8, 0.7, '#7a6a62');
      s.along(2, 12, -0.6, '#e8eef2');
      s.across(-0.4, -1.5, 1.5, '#6a5e58');
      s.across(-2.4, -1.5, 1.5, '#6a5e58');
      for (const o of [-1.5, 1.5]) s.along(-2.4, -0.4, o, '#6a5e58');
      s.dot(2.2, 0, '#d8c8a0');
    },
  },
  // Flat iron as wide as a shield, an edge ground on it, rags for a grip.
  brutecleaver: {
    swap: { [BLADE]: '#5a5c60', [EDGE]: '#6e7074', [TIP]: '#5a5c60', [GOLD]: RAG, [GRIP]: RAG_DARK },
    held: (s) => {
      for (const o of [-2.2, -1.2, 1.2, 2.2]) s.along(3.4, 17.2, o, '#5a5c60', 2);
      s.along(3.4, 17.4, 2.9, '#c8ccd2');
      s.across(17.4, -2.9, 2.9, '#4a4c50', 2);
      s.across(2.6, -0.8, 0.8, RAG_LIT);
    },
  },
  // A hammer head black with the wet, on a haft wrapped in rag (and it hardly rings).
  hushmaul: {
    swap: { [HEAD]: '#1e2024', [HEADLIT]: '#3a3e46', [FLANGE]: '#1e2024', [TIP]: '#1e2024', [GOLD]: '#2a2c30', [HAFT]: RAG, [MACEGRIP]: RAG_DARK },
    held: (s) => {
      s.across(11.6, -3, 3, '#1e2024', 4);
      s.dot(10.8, -2, '#5a6070');
      s.dot(12.2, 1.6, '#4a5060');
      for (const r of [2, 4, 6, 8]) s.across(r, -0.7, 0.7, RAG_LIT);
    },
  },
  // A long iron hook on a pole of black bog-oak, still tarred where the hands go.
  leechstrap: {
    swap: { [SPEAR]: '#3a3034', [SPEARHEAD]: '#8a8e94' },
    held: (s) => {
      s.along(-2, 4, 0, '#121012', 2);
      s.across(21, 0, 2.2, '#8a8e94');
      s.along(18.6, 21, 2.2, '#8a8e94');
      s.dot(18.4, 1.6, '#c0c4ca');
    },
  },
};
