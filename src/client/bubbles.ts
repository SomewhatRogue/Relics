/**
 * Speech bubbles over heads: a local line in town, or a party line on a job, floats over whoever
 * said it for a few seconds. Plain DOM (textContent only, never markup) under the HUD and the touch
 * buttons, placed each frame from the speaker's spot in the room. One bubble a speaker: a new line replaces the old.
 */
const LIFE = 5.5, FADE = 0.6;
/** From a hero's feet to just over their head, in tiles. */
const HEAD = 1.8, FEET = 0.7;
/** What a bubble keeps out from under. */
const KEEP_CLEAR = '#banner, #chatpeek, #boss, #hud, #corner, #touch .tb, #prompt, #loot';
/** Spots to try: how far aside (in bubble widths) and whether under the feet. */
const SPOTS: [number, boolean][] = [[0, false], [-0.6, false], [0.6, false], [-1.1, false], [1.1, false], [0, true], [-0.6, true], [0.6, true]];

interface Bubble { el: HTMLElement; until: number; spot: number; where: () => { x: number; y: number } | null }

export class Bubbles {
  private root = document.createElement('div');
  private all = new Map<string, Bubble>();

  constructor() {
    this.root.id = 'bubbles';
    // Just over the game and under everything else: the banner, the HUD and the buttons stay on top.
    const game = document.getElementById('game');
    document.body.insertBefore(this.root, game?.nextSibling ?? null);
  }

  /** `who` is the speaker's key; `where` finds them each frame (null: not here, so not shown). */
  say(who: string, text: string, now: number, where: Bubble['where']): void {
    let b = this.all.get(who);
    if (!b) {
      const el = document.createElement('div');
      el.className = 'bubble';
      this.root.appendChild(el);
      this.all.set(who, (b = { el, until: 0, spot: 0, where }));
    }
    b.el.textContent = text;
    b.el.style.opacity = '';
    b.el.classList.toggle('long', text.length > 48);
    Object.assign(b, { until: now + LIFE + Math.min(3, text.length / 30), where });
  }

  /** Each frame: follow the speakers, fade the old lines out. `toScreen` maps tiles to CSS pixels. */
  frame(now: number, toScreen: (x: number, y: number) => [number, number]): void {
    const walls = this.all.size ? [...document.querySelectorAll<HTMLElement>(KEEP_CLEAR)].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height) : [];
    for (const [who, b] of this.all) {
      const at = now < b.until ? b.where() : null;
      if (!at) {
        b.el.remove();
        this.all.delete(who);
        continue;
      }
      this.place(b, toScreen(at.x, at.y - HEAD), toScreen(at.x, at.y + FEET)[1], walls);
      if (b.until - now < FADE) b.el.style.opacity = String(Math.max(0, (b.until - now) / FADE));
    }
  }

  /**
   * Over the head if that's clear of the banner, the HUD and the buttons; else nudged aside; else
   * under the feet. A bubble keeps its spot while it stays clear, so it doesn't hop about.
   */
  private place(b: Bubble, [hx, hy]: [number, number], fy: number, walls: DOMRect[]): void {
    const w = b.el.offsetWidth, h = b.el.offsetHeight;
    const at = (i: number) => {
      const [d, below] = SPOTS[i];
      return { x: hx - w / 2 + d * w * 0.6, y: below ? fy + 6 : hy - h - 6 };
    };
    const clear = (i: number) => {
      const r = at(i);
      return !walls.some((o) => r.x < o.right && r.x + w > o.left && r.y < o.bottom && r.y + h > o.top);
    };
    if (!clear(b.spot)) b.spot = Math.max(0, SPOTS.findIndex((_, i) => clear(i)));
    const r = at(b.spot);
    b.el.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px)`;
    b.el.classList.toggle('below', SPOTS[b.spot][1]);
    b.el.style.setProperty('--tail', Math.round(Math.max(8, Math.min(w - 8, hx - r.x))) + 'px');
  }

  clear(): void {
    for (const b of this.all.values()) b.el.remove();
    this.all.clear();
  }

  /** Test hook: what's floating now. */
  get shown(): string[] {
    return [...this.all.values()].map((b) => b.el.textContent ?? '');
  }
}
