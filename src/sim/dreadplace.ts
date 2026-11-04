/**
 * What comes for a hero out of bounds on a job, by the place (shared/sites.ts). Where people lived (a
 * village green, a farmstead, its fields, a street, a manor, a burned village) and the hungry's own
 * camps: the hungry, out of the dark, more than anyone could fight. The wild (woods, the mine, the
 * sheepwash, the peat cuts, the carr): something far bigger that nobody names.
 */
import type { Job } from '../shared/jobs';
import { siteOf, type SiteKind } from '../shared/sites';
import type { DreadBy } from './dread';

const WILD: SiteKind[] = ['wood', 'mine', 'sheepwash', 'peat', 'carr'];

export const dreadFor = (job: Job): DreadBy => (WILD.includes(siteOf(job.place)) ? 'shadow' : 'swarm');
