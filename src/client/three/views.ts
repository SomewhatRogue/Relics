/**
 * Which view draws this frame: the pixel scene, or the 3D view when the VIEW switch says 2.5D (jobs,
 * Wickhold and its halls, the yard and the wood alike). The 3D view (and three.js with it) is loaded
 * the first time it's wanted, so the pixel game starts no slower. Swapping is live: both draw the
 * same room, so only the canvas changes.
 *
 * When 2.5D won't come up it must never fail quietly (Kyle, 2026-11-05: "flipping does nothing"):
 * - its file missing (a tab opened before a push asks for the old build's file): the page reloads
 *   itself once, to pick up the new build;
 * - it won't start (no WebGL on this phone) or breaks while drawing: the flat view carries on, the
 *   switch says 2.5D FAILED, and flipping it again tries afresh.
 */
import { idleSweep, idleWorld } from '../idles';
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import type { Fx } from '../fx';
import type { Scene } from '../scene';
import { LIFT, PX } from '../world';
import { ViewSwitch } from './switch';
import type { View3D } from './view3d';
import { reportAny } from '../relay';

const RELOADED = 'relic.reload3d';

/** A file the page asked for that isn't there any more (Vite, Safari and Chrome word it differently). */
const missingFile = (e: unknown) => /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch|preload/i.test(String((e as Error)?.message ?? e));

/** Reload once to pick up the new build (not again within a minute, so a real outage can't loop). */
function reloadOnce(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RELOADED) || 0);
    if (Date.now() - at < 60_000) return false;
    sessionStorage.setItem(RELOADED, String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}

/** This device's WebGL as a few words for a failure report: whether WebGL2 comes up, and the renderer. */
function glInfo(): string {
  const c = document.createElement('canvas'), g2 = c.getContext('webgl2'), g = g2 ?? c.getContext('webgl');
  if (!g) return 'no webgl';
  const d = g.getExtension('WEBGL_debug_renderer_info'), r = d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER);
  return `${g2 ? 'webgl2' : 'webgl1'} ${String(r)}`.slice(0, 120);
}

export class Views {
  readonly switch = new ViewSwitch(() => this.retry());
  private v3: View3D | null = null;
  private loading = false;
  private failed = false;
  private on3d = false;

  constructor(private scene: Scene) {
    this.switch.qualityChanged = (q) => this.v3?.setQuality(q);
    this.switch.brightChanged = (n) => this.v3?.setBright(n);
  }

  /** Flipped: a failed 2.5D gets another go. */
  private retry(): void {
    if (this.switch.look === '3d' && this.failed) (this.failed = false), this.switch.setFailed(false);
  }

  private fail(why: unknown): void {
    console.error('2.5D view failed:', why);
    // Into the relay's logs, with the device and its WebGL, so a phone's failure can be read (2026-11-27).
    try {
      reportAny({ as: '3dfail', why: String((why as Error)?.stack ?? why).slice(0, 200), ua: navigator.userAgent.slice(0, 160), gl: glInfo() });
    } catch {
      /* drawing on regardless */
    }
    this.failed = true;
    this.switch.setFailed(true);
    if (this.on3d) (this.on3d = false), this.v3?.show(false);
  }

  private load(): void {
    this.loading = true;
    import('./view3d')
      .then((m) => {
        try {
          (this.v3 = new m.View3D()).setBright(this.switch.bright);
        } catch (e) {
          this.fail(e);
        }
      })
      .catch((e) => {
        if (!(missingFile(e) && reloadOnce())) this.fail(e);
      })
      .finally(() => (this.loading = false));
  }

  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, others: Hero[], job: boolean): void {
    // What the heroes' idles see this frame: who's awake near them, the ground for the hound's stick (idles.ts).
    idleWorld(room.enemies, room.map);
    if (Math.floor(now) % 30 === 0) idleSweep(now);
    const want = this.switch.look === '3d' && !this.failed;
    if (want && !this.v3 && !this.loading) this.load();
    const use = want && !!this.v3;
    if (use !== this.on3d) (this.on3d = use), this.v3?.show(use);
    if (use) {
      try {
        this.v3!.render(room, meId, fx, now, dt, this.scene, others, job);
        return;
      } catch (e) {
        this.fail(e);
      }
    }
    this.scene.render(room, meId, fx, now, dt, others);
  }

  /** Whether the 3D view is the one showing. */
  get is3d(): boolean {
    return this.on3d;
  }

  heroScreen(): [number, number, number, number?] | null {
    return this.on3d ? this.v3!.heroScreen() : this.scene.heroScreen();
  }

  /** How many tiles further up the screen a spot is drawn for each level it stands above another (for the mouse's aim: shared/heights.ts aimOnGround). */
  get levelShift(): number {
    return this.on3d ? this.v3!.levelShift : LIFT / PX;
  }

  tileScreen(x: number, y: number, up = 0): [number, number] {
    return this.on3d ? this.v3!.tileScreen(x, y, up) : this.scene.tileScreen(x, y, up);
  }

  /** For tests and the perf script. */
  get stats() {
    return this.v3?.stats ?? null;
  }
}
