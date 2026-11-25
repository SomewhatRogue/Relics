/**
 * What a party has seen of a wilds map this trip (the roaming lands have no expedition state to keep it, so the map screen keeps
 * its own, per room: drawing only, from the heroes' places in the room you see). A bit a cell of CELL tiles.
 */
export const CELL = 3, LOOK = 11;

export class SeenGrid {
  private bits: Uint8Array;
  private cols: number;
  private rows: number;

  constructor(readonly w: number, readonly h: number) {
    (this.cols = Math.ceil(w / CELL)), (this.rows = Math.ceil(h / CELL));
    this.bits = new Uint8Array(this.cols * this.rows);
  }

  /** The ground round each of these, up to LOOK tiles, seen. */
  look(at: { x: number; y: number }[]): void {
    for (const p of at) {
      const j0 = Math.max(0, Math.floor((p.y - LOOK) / CELL)), j1 = Math.min(this.rows - 1, Math.floor((p.y + LOOK) / CELL));
      const i0 = Math.max(0, Math.floor((p.x - LOOK) / CELL)), i1 = Math.min(this.cols - 1, Math.floor((p.x + LOOK) / CELL));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot((i + 0.5) * CELL - p.x, (j + 0.5) * CELL - p.y) <= LOOK + CELL / 2) this.bits[j * this.cols + i] = 1;
    }
  }

  /** Whether the ground at (x, y) has been seen. */
  at(x: number, y: number): boolean {
    const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
    return i >= 0 && j >= 0 && i < this.cols && j < this.rows && this.bits[j * this.cols + i] === 1;
  }
}
