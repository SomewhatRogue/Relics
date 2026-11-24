/**
 * The loading page: over the game while a job starts or a big map is built, with a bit of what the town says,
 * and, in a party, who is still coming in. Alone it lifts once the new map has been drawn and the words could
 * be read; in a party also when everyone is in (the leader says who is not, coop.ts). While it is up the fight
 * stands still (game.step) and the first draw of the new map waits two frames so the page is painted first.
 */
import './loadpage.css';
import { RUMOURS } from './rumours';
import { titleCase } from './tracker';

/** Every player-facing word of the page. */
export const LOADW = {
  heard: 'Heard in Wickhold',
  coming: (names: string[]) => `Waiting for ${joinNames(names)}.`,
};

/** A map of more than this many tiles gets the page when a run moves on to it. */
export const BIG_AREA = 2000;
/** The page stays at least this long (s), so the words can be read. */
export const MIN_SHOW = 1.5;
/** A leader's page lifts by now whoever is still not in (s); a friend's, if the leader's word never comes. */
export const CAP_LEAD = 15;
export const CAP_GUEST = 20;
/** A friend that hears no word of who is coming this long after its map is drawn lifts anyway (s). */
export const QUIET = 2;

/** The one rumour a job gets: the same for one seed, spread over the list. */
export function rumourFor(seed: number): string {
  const h = Math.imul(Math.floor(seed) | 0, 2654435761) >>> 0;
  return RUMOURS[(h >>> 8) % RUMOURS.length];
}

/** "Ann", "Ann and Bo", "Ann, Bo and Cy". */
export function joinNames(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Whether the page can lift. `drawn`: the new map has been drawn once. `shown`: seconds since it showed.
 * `waiting`: how many are still coming. `quiet`: for a friend that has heard no word about who is coming,
 * seconds since it drew its map (else null). `cap`: the seconds after which it lifts regardless.
 */
export function canLift(o: { drawn: boolean; shown: number; waiting: number; quiet: number | null; cap: number }): boolean {
  if (!o.drawn || o.shown < MIN_SHOW) return false;
  if (o.shown >= o.cap) return true;
  if (o.waiting > 0) return false;
  return o.quiet === null || o.quiet >= QUIET;
}

/** The leader's list of who is not yet in: friends not gone whose `here` is not the key of the room they are in. */
export function whoIsComing(friends: { name: string; gone: boolean; here?: number; key: number }[]): string[] {
  return friends.filter((f) => !f.gone && f.here !== f.key).map((f) => f.name);
}

const now = () => performance.now() / 1000;

export type LoadRole = 'alone' | 'lead' | 'guest';

class Loading {
  up = false;
  private el: HTMLElement | null = null;
  private lastNames = '';
  private fade = 0;
  private at = 0;
  private map: unknown;
  private frames = 0;
  private drawn = false;
  private drawnAt = 0;

  /** The fight stands still while the page is up (a page out of sight has no frames to lift it, so it does not hold). */
  holding(): boolean {
    return this.up && typeof document !== 'undefined' && !document.hidden;
  }

  /** Put the page up now: `name` the place, `seed` picks the words. */
  ask(name: string, seed: number): void {
    // (Only in a browser: a test may hand the game a `document` of its own and no window.)
    if (typeof document === 'undefined' || typeof window === 'undefined' || typeof document.createElement !== 'function' || !document.body) return;
    clearTimeout(this.fade);
    this.el?.remove();
    const el = (this.el = document.createElement('div'));
    el.id = 'loadpage';
    el.setAttribute('aria-hidden', 'true');
    const add = (tag: string, cls: string, text = '') => Object.assign(el.firstElementChild!.appendChild(document.createElement(tag)), { className: cls, textContent: text });
    el.appendChild(document.createElement('div')).className = 'lp-in';
    add('h1', 'lp-name', titleCase(name));
    add('div', 'lp-rule');
    add('p', 'lp-label', LOADW.heard);
    // (In quote marks: it is someone in the town speaking, not the game: the lore keeper, 2026-11-24.)
    add('p', 'lp-line', `\u201c${rumourFor(seed)}\u201d`);
    add('p', 'lp-wait');
    document.body.appendChild(el);
    Object.assign(this, { up: true, at: now(), map: undefined, drawn: false, lastNames: '' });
  }

  /** Each frame, before the draw: false while the new map must not be drawn yet (the page is painted first). */
  gate(map: unknown, arrived: boolean): boolean {
    if (map !== this.map) (this.map = map), (this.drawn = false), (this.frames = this.up ? 2 : 0);
    if (!this.up) return true;
    if (!arrived) return false;
    if (this.frames > 0) return this.frames--, false;
    return true;
  }

  /** The map was drawn this frame. */
  drew(): void {
    if (!this.drawn) (this.drawn = true), (this.drawnAt = now());
  }

  /** This room's map is drawn and, with the page up, it could lift: a friend tells the leader it is in. */
  get ready(): boolean {
    return this.drawn && (!this.up || now() - this.at >= MIN_SHOW);
  }

  /** Each frame, after the draw: the line of who is coming, and the lift. `heard`: a friend has had the leader's word on it. */
  update(role: LoadRole, names: string[], heard: boolean): void {
    if (!this.up || !this.el) return;
    const text = role === 'alone' || !names.length ? '' : LOADW.coming(names);
    if (text !== this.lastNames) (this.lastNames = text), (this.el.querySelector('.lp-wait')!.textContent = text);
    const t = now();
    const quiet = role === 'guest' && !heard ? t - this.drawnAt : null;
    if (canLift({ drawn: this.drawn, shown: t - this.at, waiting: role === 'alone' ? 0 : names.length, quiet, cap: role === 'guest' ? CAP_GUEST : CAP_LEAD })) this.lift();
  }

  /** Fade out over 0.3 s. */
  private lift(): void {
    const el = this.el;
    this.up = false;
    if (!el) return;
    el.classList.add('out');
    this.fade = setTimeout(() => el.remove(), 320) as unknown as number;
  }

  /** Gone at once (the job ended under it). */
  drop(): void {
    if (!this.up) return;
    clearTimeout(this.fade);
    this.el?.remove();
    this.up = false;
  }
}

export const loading = new Loading();
