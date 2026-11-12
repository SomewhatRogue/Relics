/** Which of the square's stalls are drawn as posting places (postdraw.ts, three/posts3d.ts): pure, so the 2.5D builder and its tests can ask. */
import type { Block } from '../shared/arena';

export const POST_LABELS = new Set(['JOBS', 'PUBLIC WORKS']);
export const isPost = (b: Block): boolean => b.kind === 'stall' && !!b.label && POST_LABELS.has(b.label) && !b.ruined;
