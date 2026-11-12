/**
 * Who may go down (Kyle, 2026-11-12: "only unlocked for people at least lvl 9 ... a bypass passphrase you get
 * at lvl 9 so others can try it if they know the password"). The Deep opens at DEEP_GATE.level; from there
 * Cobb tells you this week's word, and whoever says it to him at the grate may go down whatever their level.
 * The word changes every week (the same for everyone in that week), so a word passed round goes stale. A party
 * goes down with its leader, so only the leader is asked. A gate, not an outcome: the clock here is the
 * player's own.
 */
export const DEEP_GATE = { level: 9, weekMs: 7 * 86400e3 };

/** Cobb's words, one a week (lore keeper 2026-11-12): his way of knowing a seasoned hero vouched for a green one. */
export const DEEP_WORDS_LIST = ['SPADE', 'TURF', 'ROPE', 'SLATE', 'CANDLE', 'CLAY', 'ASH', 'YEW', 'THRUSH', 'HOLLY', 'THORN', 'BRAMBLE'];

/** Which week it is (from the start of time, by the player's clock). */
export const deepWeek = (now: number) => Math.floor(now / DEEP_GATE.weekMs);

/** The word for week `week`. */
export const deepWord = (week: number) => DEEP_WORDS_LIST[((week * 7 + 3) % DEEP_WORDS_LIST.length + DEEP_WORDS_LIST.length) % DEEP_WORDS_LIST.length];

/** What a typed word comes to: trimmed, capitals, letters only. */
export const cleanWord = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');

/** Whether a hero may go down: old enough, or knows this week's word (`said`: the word they gave Cobb, if any). */
export const mayGoDown = (level: number, said: string | undefined, now: number) => level >= DEEP_GATE.level || (!!said && cleanWord(said) === deepWord(deepWeek(now)));
