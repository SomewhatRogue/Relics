/**
 * The relic wheel (phones): hold the RELIC button and your carried relics fan out above and to the
 * left of your thumb; slide onto one and let go to equip it. Let go anywhere else to cancel.
 */
export interface Slot {
  name: string;
  /** 0 just used .. 1 ready. */
  ready: number;
  active: boolean;
}

const ANGLES = [200, 238, 276].map((d) => (d * Math.PI) / 180);
const RADIUS = 92;

export class RelicWheel {
  private el = document.createElement('div');
  private slots: HTMLElement[] = [];
  private centers: [number, number][] = [];
  private hot = -1;

  constructor(private read: () => Slot[]) {
    this.el.id = 'wheel';
    this.el.hidden = true;
    for (let i = 0; i < ANGLES.length; i++) {
      const s = document.createElement('div');
      s.className = 'slot';
      this.el.appendChild(s);
      this.slots.push(s);
    }
    document.body.appendChild(this.el);
  }

  show(button: HTMLElement): void {
    const r = button.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const info = this.read();
    this.centers = ANGLES.map((a) => [cx + Math.cos(a) * RADIUS, cy + Math.sin(a) * RADIUS]);
    this.slots.forEach((s, i) => {
      const slot = info[i];
      s.style.left = this.centers[i][0] + 'px';
      s.style.top = this.centers[i][1] + 'px';
      s.textContent = slot ? slot.name : 'EMPTY';
      s.classList.toggle('empty', !slot);
      s.classList.toggle('active', !!slot?.active);
      s.classList.remove('hot');
      s.style.setProperty('--cd', 100 * (slot?.ready ?? 1) + '%');
    });
    this.hot = -1;
    this.el.hidden = false;
  }

  /** The slot under the finger (or -1), highlighted. */
  hover(x: number, y: number): number {
    const info = this.read();
    let best = -1, bd = 48;
    this.centers.forEach(([sx, sy], i) => {
      const d = Math.hypot(x - sx, y - sy);
      if (d < bd && info[i]) (bd = d), (best = i);
    });
    if (best !== this.hot) {
      this.slots.forEach((s, i) => s.classList.toggle('hot', i === best));
      this.hot = best;
      if (best >= 0) navigator.vibrate?.(8);
    }
    return best;
  }

  hide(): void {
    this.el.hidden = true;
  }
}
