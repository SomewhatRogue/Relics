/**
 * The prologue: the wood in Greyhollow the day after the column fell (docs and lines from the lore
 * keeper; the plan is the Claude Doc "Relic: The Prologue"). One hand-laid map of five areas joined by
 * paths, each path blocked (a fallen tree, briars, a log at the ford, the rise) until the lesson before
 * it is done; then the road out to Wickhold. Hew walks ahead and says one line per lesson.
 */
import type { Area, Block, GameMap, Round } from './arena.js';
import { THEMES, type Foe } from './terrain.js';

export const WOOD = { w: 64, h: 40 };
type Rect = { x: number; y: number; w: number; h: number };

/** The five areas and the road (in tiles). */
export const AREAS: Rect[] = [
  { x: 1, y: 25, w: 20, h: 14 }, // 1 the field
  { x: 23, y: 27, w: 18, h: 12 }, // 2 the path
  { x: 23, y: 11, w: 18, h: 14 }, // 3 Hew's clearing
  { x: 44, y: 14, w: 19, h: 15 }, // 4 the stream
  { x: 44, y: 1, w: 19, h: 11 }, // 5 Hew's hut
  { x: 1, y: 1, w: 41, h: 7 }, // the road out
];
/** The way between area i and i+1, and the gate across it while the lesson is on. */
export const GATES: { open: Rect; block: Block }[] = [
  { open: { x: 21, y: 31, w: 2, h: 4 }, block: { x: 21.2, y: 31.4, w: 1.6, h: 3.2, kind: 'fence' } },
  { open: { x: 30, y: 25, w: 4, h: 2 }, block: { x: 30.4, y: 25.2, w: 3.2, h: 1.6, kind: 'fence' } },
  { open: { x: 41, y: 17, w: 3, h: 4 }, block: { x: 41.3, y: 17.4, w: 2.4, h: 3.2, kind: 'fence' } },
  { open: { x: 50, y: 12, w: 4, h: 2 }, block: { x: 50.4, y: 12.2, w: 3.2, h: 1.6, kind: 'fence' } },
  { open: { x: 42, y: 3, w: 2, h: 4 }, block: { x: 42.2, y: 3.4, w: 1.6, h: 3.2, kind: 'fence' } },
];
/** Where Wickhold's road leaves the map (walk into it after the fight). */
export const ROAD_OUT: Area = { x: 1, y: 2, w: 1.5, h: 5 };

const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
export const areaAt = (x: number, y: number) => AREAS.findIndex((r) => inside(r, x, y));

/** Trees along every area's edge, leaving the ways between open (the gates close them). */
function treeLines(): Round[] {
  const out: Round[] = [], gap = (x: number, y: number) => GATES.some((g) => inside({ x: g.open.x - 0.4, y: g.open.y - 0.4, w: g.open.w + 0.8, h: g.open.h + 0.8 }, x, y));
  const add = (x: number, y: number, i: number) => {
    if (gap(x, y) || x < 0.5 || y < 0.5 || x > WOOD.w - 0.5 || y > WOOD.h - 0.5) return;
    if (out.some((t) => Math.hypot(t.x - x, t.y - y) < 0.8)) return;
    out.push({ x, y, r: 0.55, kind: i % 3 ? 'pine' : 'tree' });
  };
  AREAS.forEach((r, k) => {
    for (let x = r.x; x <= r.x + r.w; x += 1) add(x, r.y - 0.2, x + k), add(x, r.y + r.h + 0.2, x + k + 1);
    for (let y = r.y; y <= r.y + r.h; y += 1) add(r.x - 0.2, y, y + k), add(r.x + r.w + 0.2, y, y + k + 1);
  });
  // The ways between: trees along their sides.
  for (const g of GATES) {
    const along = g.open.w > g.open.h;
    for (let t = 0; t <= (along ? g.open.h : g.open.w); t += 1)
      along ? (add(g.open.x - 0.3, g.open.y + t, t), add(g.open.x + g.open.w + 0.3, g.open.y + t, t + 1)) : (add(g.open.x + t, g.open.y - 0.3, t), add(g.open.x + t, g.open.y + g.open.h + 0.3, t + 1));
  }
  // A few trees standing inside the areas (never on the paths in the middle).
  const loose: [number, number][] = [[5, 28], [14, 37], [27, 36], [37, 30], [26, 14], [38, 22], [47, 26], [60, 17], [46, 4], [60, 9], [8, 4], [20, 6], [33, 3]];
  for (const [x, y] of loose) out.push({ x, y, r: 0.5, kind: 'pine' });
  return out;
}

export function woodMap(): GameMap {
  const blocks: Block[] = [
    // The field: wagons burning where the column broke.
    { x: 4, y: 31, w: 2.4, h: 1.2, kind: 'cart' }, { x: 15, y: 27, w: 2.4, h: 1.2, kind: 'cart' }, { x: 11, y: 36, w: 2.4, h: 1.2, kind: 'cart' },
    // Hew's clearing: his kilns and his woodpile.
    { x: 26, y: 13, w: 2.4, h: 2, kind: 'hearth', label: 'KILN' }, { x: 36, y: 13, w: 2.4, h: 2, kind: 'hearth', label: 'KILN' }, { x: 31, y: 20, w: 3, h: 1, kind: 'sacks' },
    // The stream: stones in the water.
    { x: 48, y: 19, w: 1.2, h: 1, kind: 'rubble' }, { x: 56, y: 24, w: 1.2, h: 1, kind: 'rubble' },
    // Hew's hut on the rise, and the cordwood stack behind which it ends.
    { x: 50, y: 2, w: 6, h: 4, kind: 'house', label: "HEW'S HUT" }, { x: 58, y: 6, w: 2.6, h: 1.2, kind: 'rack', label: 'CORDWOOD' },
    ...GATES.map((g) => ({ ...g.block })),
  ];
  return {
    name: 'GREYHOLLOW', w: WOOD.w, h: WOOD.h, wallFace: 3, rounds: treeLines(), blocks,
    braziers: [{ x: 5.2, y: 30.6, r: 0.5 }, { x: 16.2, y: 26.6, r: 0.5 }, { x: 32.5, y: 17.5, r: 0.5 }, { x: 52.5, y: 8.5, r: 0.4 }],
    torches: [], hero: { x: 8, y: 34 }, exit: null, theme: { ...THEMES.forest, ambient: [0.86, 0.84, 0.74], moon: 0, day: true },
    npcs: [{ x: 16, y: 30.5, name: 'HEW', talk: 'hew', look: 'burner' }],
  };
}

/** Each lesson: what it teaches, what you're allowed to press, what it counts, how many, the goblins it brings. */
export interface Lesson { area: number; name: string; teach: string; moves: ('attack' | 'roll' | 'block' | 'relic' | 'potion' | 'grab')[]; count: 'kills' | 'dodge' | 'block' | 'parry' | 'none'; need: number; hew: [number, number]; foes: (Foe & { variant?: 'looter' | 'lunger' | 'heavy' | 'stoker' })[]; more?: Lesson['foes'] }
export const LESSONS: Lesson[] = [
  { area: 0, name: 'THE FIELD', teach: 'ATTACK', moves: ['attack'], count: 'kills', need: 0, hew: [5, 33],
    foes: [{ kind: 'scrapper', variant: 'looter', x: 8, y: 29 }, { kind: 'scrapper', variant: 'looter', x: 13, y: 31 }, { kind: 'scrapper', variant: 'looter', x: 16, y: 35 }],
    more: [{ kind: 'scrapper', variant: 'looter', x: 19, y: 27, awake: true }, { kind: 'scrapper', variant: 'looter', x: 18, y: 37, awake: true }] },
  { area: 1, name: 'THE PATH', teach: 'DODGE', moves: ['attack', 'roll'], count: 'dodge', need: 3, hew: [25, 37],
    foes: [{ kind: 'scrapper', variant: 'lunger', x: 31, y: 31, awake: true }, { kind: 'scrapper', variant: 'lunger', x: 36, y: 35, awake: true }, { kind: 'scrapper', bow: true, x: 39, y: 29, awake: true }] },
  { area: 2, name: "HEW'S CLEARING", teach: 'BLOCK', moves: ['attack', 'roll', 'block'], count: 'block', need: 5, hew: [25, 23],
    foes: [{ kind: 'scrapper', x: 29, y: 15, awake: true }, { kind: 'scrapper', x: 33, y: 14, awake: true }, { kind: 'scrapper', x: 35, y: 18, awake: true }] },
  { area: 3, name: 'THE STREAM', teach: 'PARRY', moves: ['attack', 'roll', 'block'], count: 'parry', need: 3, hew: [46, 21],
    foes: [{ kind: 'scrapper', variant: 'heavy', x: 55, y: 22, awake: true }] },
  { area: 4, name: "HEW'S HUT", teach: 'SKILL', moves: ['attack', 'roll', 'block', 'relic', 'potion', 'grab'], count: 'none', need: 0, hew: [52, 10],
    foes: [] },
];
/** The Stoker, and the two that come out of the trees at half its health. */
export const STOKER: Foe & { variant: 'stoker' } = { kind: 'butcher', variant: 'stoker', x: 59, y: 4.5, name: 'THE STOKER', awake: false };
export const STOKER_HELP: Foe[] = [{ kind: 'scrapper', x: 46, y: 9, awake: true }, { kind: 'scrapper', x: 61, y: 10, awake: true }];

/** Hew's lines (lore keeper), and the Stoker's. */
export const LINES = {
  attack: "There, see, they're at the boots again, it's *always* the boots first with them, I don't know why. And don't stop at one knock, mind. I watched a lad do that once, and _it got up_.",
  dodge: "See that one, how it's crouching? When they get down low like that they're coming *straight through you*, shield or no shield, and there's no stopping them. Best not be standing there when it arrives, is all.",
  block: "Well, there's three of them now, and that's too many to go rolling about between, so you stand your ground and let them knock. And that's *my* kiln they're pissing on, the little sods.",
  parry: "Now, this big one breaks a guard like kindling. I turned over a few on that field who'd held theirs up and waited, shields _split down the middle_. You want to *meet* it, I'd say, not wait for it.",
  hut: "That's ^home^, kettle's older than you are. Hang on, I *didn't* leave that door open.",
  round: "Wait here, stray, I'll go round the back.",
  last: "Get the count to Odric, stray, Father Odric, he'll be wanting it.",
  stoker: 'Eleven you burn. Eleven of mine. So, this one I _keep_.',
  north: "They all went north and left the field half-picked. I've *never* known them leave meat.",
  up: ['Up you get, and spit that dirt out.', "Not yet, stray, I've enough to burn as it is.", 'Have a breather, then go at it again, ~properly~ this time.'],
  relic: "There's something hard under its breastbone, grown in like a knot in oak, and it takes Hew's poker and most of what you've got left to lever it out. It's a javelin, haft and all, longer than the wound it came out of, and ~warm~.",
  road: "The wood thins and then gives out, and there's a road, and at the end of it walls, with a ~glow~ over them that isn't the moon. Your left foot is wet through at the heel, just as Hew said it would be.",
  skill: "Now. Don't save *any* of it.",
  /** Waking: he comes over slowly, checks you, hauls you up (one box at a time, each waits for a tap). */
  waking: [
    "Oh, you're ^breathing^. That's *one*, then, out of the whole field, and I've been round every one of them since first light. Give me a moment getting down, these knees pop like green wood in a kiln.",
    "Anything broken? Move your toes for me. Good, *all ten*, I counted. Soldier or thief or whatever you are, and that's none of my business, they've had your boots off you all the same.",
    "^Have mine^, go on. They've been resoled twice and they let the wet in at the left heel, I won't lie to you, but it's them or bare feet, and I've *seen* your feet.",
    "Up you come, then, ~slowly~, there you are. Lean on me as much as you like, I've carried cordwood heavier than you up that hill and it never once thanked me.",
  ],
  /** On the card that asks you to walk. */
  walk: "Have a little walk about first, stray, get the blood back in your legs, and mind the carts, they're still _burning_.",
  /** More looters on the field; you come round after falling to the Stoker; Hew in a panel before the hut. */
  more: "There's _more of them_ in the trees, stray, and they're coming this way.",
  cometo: "You come round on the rise with a mouthful of ash, and it's still down there by the cordwood, _waiting_ for you.",
  later: "Ask me later, stray, once you've got your breath back. I'll ~still be talking~, don't worry.",
  /** When you get it right (a short pause in the fight). */
  praise: ["That's it, that's the way.", "Oh, that's good, do it like that.", "Done this before, ~haven't you~?", "Hah, you'll ^keep^, stray, I think."],
  /** The game's own plain line under each lesson, with the control shown beside it. */
  how: {
    move: 'Make sure you can still move. Walk a few steps and get your legs back under you.',
    attack: 'Hit them. Tap for quick blows; hold for a heavy one.',
    roll: "A red mark with a striped edge can't be blocked. Roll out of it just before it lands.",
    block: 'Hold your guard while the red fills. Each block costs breath (the yellow bar).',
    parry: 'Tap your guard the moment the red flashes white. It staggers them, and your next blow lands hard.',
    skill: "Use your skill. Once it's spent, it takes a while to recharge.",
  },
  /** The freeze-frame prompts, the first times a lesson's blow comes. */
  now: { roll: 'NOW: ROLL OUT', block: 'NOW: GUARD UP', parry: 'NOW: TAP GUARD', attack: 'HIT IT' },
};
