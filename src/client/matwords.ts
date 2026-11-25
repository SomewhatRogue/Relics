/** What materials are called on screen (shared/materials.ts; docs/design/materials.md). Drafts for the lore keeper. */
import type { MatId, Mats } from '../shared/materials';
import { MAT_IDS } from '../shared/materials';

export const MAT_NAME: Record<MatId, string> = {
  hide: 'HIDE', silk: 'SILK', brood: 'BROOD SILK',
  charcoal: 'CHARCOAL', fatwood: 'FATWOOD', saltpetre: 'SALTPETRE',
  clay: 'COLD CLAY', mint: 'WATER MINT', peat: 'BLACK PEAT',
  struck: 'STRUCK PINE', amber: 'AMBER', thunder: 'THUNDERSTONE',
};

/** A list of materials as words, e.g. "3 HIDE, 1 BROOD SILK"; '' for none. */
export const matsText = (m: Mats): string =>
  MAT_IDS.filter((k) => (m[k] ?? 0) > 0).map((k) => `${m[k]} ${MAT_NAME[k]}`).join(', ');
