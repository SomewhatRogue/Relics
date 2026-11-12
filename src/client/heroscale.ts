/**
 * Heroes at 1.5x (docs/design/art-pass.md). The bodies are redrawn 18 wide (herolooks.ts); what is
 * drawn round a body in code (the hand, a shield, a blade, cloth, a halo) is placed by these, always on
 * whole scene pixels, so nothing is stretched. Never for anything the room decides: a swing's reach and
 * its smear stay at the room's range, a telegraph stays its size.
 */
import { line } from './draw';

/** How much bigger a hero is than the old 12 by 16 body. */
export const HS = 1.5;
/** A body offset in old pixels, as whole new ones (the magnitude: put the sign on after). */
export const hs = (n: number) => Math.round(n * HS);
/** A hero sprite's width, before its outline. */
export const HERO_W = 18;
/** draw.ts's line, its lengths given in old pixels (a blade, a haft, a bow); not for a reach. */
export const hline = (g: CanvasRenderingContext2D, x: number, y: number, a: number, r0: number, r1: number, col: string, w = 1) => line(g, x, y, a, r0 * HS, r1 * HS, col, w);
