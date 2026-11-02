/**
 * Recovery codes: two words and a number (KILN FERN 47) that bring a browser's heroes to another phone
 * or computer (the save is kept under the code by api/save.ts). The first word is something made or a
 * place in the valley, the second something that grows, lives or blows through it. Every word differs
 * from every other by at least two letters, so one slip is never someone else's code, and a word one
 * letter off is read as the word it's nearest (when only one is). Shown in capitals; typed any way.
 */

export const FIRST = [
  'kiln', 'ash', 'ford', 'lantern', 'anvil', 'barrow', 'beacon', 'bell', 'bridge', 'brook', 'cairn',
  'candle', 'cart', 'chapel', 'chimney', 'cinder', 'cloak', 'clay', 'coal', 'copper', 'cottage',
  'croft', 'ditch', 'ember', 'field', 'flint', 'forge', 'furrow', 'gate', 'glen', 'gravel', 'hamlet',
  'hearth', 'hedge', 'hollow', 'iron', 'keep', 'kettle', 'ladder', 'lane', 'latch', 'loft', 'mill',
  'oven', 'peat', 'pond', 'post', 'quarry', 'rafter', 'rope', 'saddle', 'salt', 'shield', 'shovel',
  'sickle', 'slate', 'sledge', 'smoke', 'spade', 'spring', 'stable', 'stone', 'straw', 'stream',
  'thatch', 'timber', 'torch', 'tower', 'wagon', 'wall', 'wheel', 'wick', 'yoke', 'barn', 'bucket',
  'loom', 'mallet', 'needle', 'plank', 'quill', 'thimble', 'tongs', 'barrel', 'basket', 'beam', 'bolt',
  'buckle', 'cask', 'chain', 'chalk', 'churn', 'coin', 'crock', 'drum', 'fleece', 'flask', 'goblet',
  'hammer', 'harp', 'hatchet', 'hook', 'hut', 'lock', 'lute', 'mead', 'pan', 'peg', 'rake', 'saw',
  'scroll', 'shawl', 'sling', 'spear', 'spoon', 'staff', 'stool', 'sword', 'tile', 'tin', 'tub', 'urn',
  'vat', 'wax', 'wool', 'bread', 'broth', 'cheese', 'honey',
];

export const SECOND = [
  'fern', 'oak', 'crow', 'alder', 'apple', 'badger', 'barley', 'beech', 'birch', 'bracken', 'bramble',
  'briar', 'clover', 'dove', 'eel', 'elm', 'falcon', 'fox', 'frog', 'frost', 'goose', 'hawk', 'hazel',
  'heather', 'heron', 'holly', 'hound', 'kestrel', 'lamb', 'lark', 'mole', 'moss', 'moth', 'newt',
  'otter', 'owl', 'pine', 'raven', 'robin', 'rowan', 'rush', 'sage', 'snail', 'sorrel', 'sparrow',
  'stag', 'stoat', 'swan', 'swift', 'thistle', 'thorn', 'thrush', 'toad', 'trout', 'wasp', 'weasel',
  'wheat', 'wolf', 'aspen', 'bee', 'beetle', 'crane', 'finch', 'flax', 'goat', 'grouse', 'gull', 'hen',
  'kite', 'linnet', 'magpie', 'mare', 'minnow', 'perch', 'ram', 'salmon', 'shrew', 'snipe', 'starling',
  'willow', 'acorn', 'blossom', 'cloud', 'dusk', 'dawn', 'hail', 'moon', 'sleet', 'snow', 'storm',
  'thaw', 'thunder', 'wind', 'mist', 'daisy', 'poppy', 'oats', 'hops', 'cress', 'turnip', 'onion',
  'garlic', 'quince', 'damson', 'midge', 'sheep', 'calf', 'mouse', 'jay', 'curlew', 'lapwing',
  'merlin', 'eagle', 'buzzard', 'jackdaw', 'quail', 'teal', 'worm', 'spider', 'ant', 'cricket',
  'hornet', 'rabbit', 'hedgehog', 'bluebell', 'foxglove', 'violet', 'comet',
];

/** The number is always two digits (no leading nought to lose). */
export const NUM_LOW = 10, NUM_HIGH = 99;

export interface Code { a: number; b: number; n: number }

/** How a code is kept and sent: lower case, dashed (kiln-fern-47). */
export const keyOf = (c: Code): string => `${FIRST[c.a]}-${SECOND[c.b]}-${c.n}`;

/** How a code is shown: KILN FERN 47. */
export const showCode = (c: Code): string => `${FIRST[c.a]} ${SECOND[c.b]} ${c.n}`.toUpperCase();

/** A fresh code; `pick(k)` gives a whole number from 0 to k - 1 (the server's crypto). */
export const codeFrom = (pick: (k: number) => number): Code =>
  ({ a: pick(FIRST.length), b: pick(SECOND.length), n: NUM_LOW + pick(NUM_HIGH - NUM_LOW + 1) });

/** Letters changed, added or dropped to turn one word into the other. */
export function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}

/** The word's place in the list: exact, or the only word one letter off; else -1. */
function find(list: string[], w: string): number {
  const at = list.indexOf(w);
  if (at >= 0) return at;
  const close = list.flatMap((x, i) => (distance(x, w) === 1 ? [i] : []));
  return close.length === 1 ? close[0] : -1;
}

/** Read a typed code: any case, spaces, dashes or dots, even run together (kilnfern47). */
export function parseCode(text: unknown): Code | null {
  if (typeof text !== 'string' || text.length > 64) return null;
  const parts = text.toLowerCase().replace(/([a-z])(\d)/g, '$1 $2').split(/[^a-z0-9]+/).filter(Boolean);
  const num = parts.pop();
  if (!num || !/^\d{2}$/.test(num) || Number(num) < NUM_LOW) return null;
  let words = parts;
  if (parts.length === 1) {
    const w = parts[0], cut = [...w].findIndex((_, i) => i > 0 && FIRST.includes(w.slice(0, i)) && SECOND.includes(w.slice(i)));
    words = cut > 0 ? [w.slice(0, cut), w.slice(cut)] : [];
  }
  if (words.length !== 2) return null;
  const a = find(FIRST, words[0]), b = find(SECOND, words[1]);
  return a < 0 || b < 0 ? null : { a, b, n: Number(num) };
}
