/** Unique pieces' names by id, for itemName (shared/loot.ts) without loot.ts importing uniques.ts (which imports loot.ts). */
import { UNIQUES } from './uniques.js';

export const UNIQUE_NAMES: Record<string, string> = Object.fromEntries(Object.entries(UNIQUES).map(([id, u]) => [id, u.name]));
