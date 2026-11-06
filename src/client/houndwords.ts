/**
 * The words for choosing your hound with Maeve (houndui.ts). Maeve is dry and impatient and likes
 * animals more than people (docs/lore/voice.md); she bred the Ranger's hound, or its dam, and knows her
 * own breeding on sight (docs/lore/story-bible.md). The panel's own words are the game's plain voice.
 * For the lore keeper, then the line editor.
 */
import type { BreedId, MarkId } from '../shared/houndlook';

export const HOUNDW = {
  /** On Maeve's trainer panel, the way in. */
  button: 'YOUR HOUND',
  title: 'YOUR HOUND',
  /** Maeve, when you bring it to her. */
  offer: "Let me see the dog. Not you, I've seen you. One of mine, that, or out of one of mine, I'd know those feet anywhere, and somebody's been feeding it off their own plate. Go on, what is it, and what do you call it?",
  /** Maeve, once it's kept. */
  kept: "There. It'll come to that name if you say it like you mean it, which you won't, not at first.",
  breed: 'BREED',
  coat: 'COAT',
  white: 'MARKINGS',
  name: 'NAME',
  /** (Not KEEP: "keep" is a loaded word in this world, the lore keeper, 2026-11-05.) */
  save: 'DONE',
  back: 'BACK',
  /** Under the name field. */
  nameHint: 'Up to 10 letters.',
  /** A name the chat filter stars out, or none at all. */
  rude: 'Not that name. Choose another.',
  empty: 'Give it a name.',
  /** Under the choices, plain. */
  same: 'Looks only. Every hound fights the same.',
} as const;

export const BREED_NAME: Record<BreedId, string> = { wolfhound: 'WOLFHOUND', lurcher: 'LURCHER', hillhound: 'HILL HOUND', collie: 'COLLIE' };

export const COAT_NAME: Record<BreedId, string[]> = {
  wolfhound: ['GREY', 'WHEATEN', 'BRINDLE'],
  lurcher: ['BLUE', 'FAWN', 'BRINDLE'],
  hillhound: ['BLACK AND TAN', 'LIVER AND TAN', 'RED'],
  collie: ['BLACK AND WHITE', 'RED AND WHITE', 'MERLE'],
};

export const MARK_NAME: Record<MarkId, string> = { none: 'NONE', blaze: 'BLAZE', socks: 'SOCKS', both: 'BLAZE AND SOCKS' };
