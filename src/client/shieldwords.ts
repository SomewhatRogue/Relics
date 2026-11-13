/**
 * The words for choosing your shield with Master Cole (shieldui.ts). Cole is an old soldier who says little
 * and means it (docs/lore/voice.md). The panel's own words are the game's plain voice.
 * For the lore keeper, then the line editor.
 */
import type { DeviceId, ShapeId, TrimId } from '../shared/shieldlook';

export const SHIELDW = {
  /** On Cole's trainer panel, the way in. */
  button: 'YOUR SHIELD',
  title: 'YOUR SHIELD',
  /** Cole, when you bring it to him. */
  offer: 'Paint it how you like, it *still* has to stop a cleaver.',
  /** Cole, once it's done. */
  kept: 'Good. Bring it back with a dent or two in it.',
  shape: 'SHAPE',
  field: 'COLOUR',
  device: 'MARK',
  trim: 'TRIM',
  save: 'DONE',
  back: 'BACK',
  /** Under the choices, plain. */
  same: 'Looks only. Every shield blocks the same.',
} as const;

export const SHAPE_NAME: Record<ShapeId, string> = { heater: 'HEATER', round: 'ROUND', kite: 'KITE' };
export const FIELD_NAME = ['RED', 'BLUE', 'GREEN', 'BLACK', 'WHITE', 'OCHRE'];
export const DEVICE_NAME: Record<DeviceId, string> = { plain: 'PLAIN', chevron: 'CHEVRON', cross: 'CROSS', bend: 'SASH', quarters: 'QUARTERS', lantern: 'LANTERN' };
export const TRIM_NAME: Record<TrimId, string> = { gold: 'GOLD', silver: 'SILVER', iron: 'IRON' };
