/**
 * Which view draws this frame: the pixel scene, or the 3D view when the VIEW switch says 2.5D (jobs,
 * Wickhold and its halls, the yard and the wood alike). The 3D view (and three.js with it) is loaded
 * the first time it's wanted, so the pixel game starts no slower. Swapping is live: both draw the
 * same room, so only the canvas changes.
 */
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import type { Fx } from '../fx';
import type { Scene } from '../scene';
import { ViewSwitch } from './switch';
import type { View3D } from './view3d';

export class Views {
  readonly switch = new ViewSwitch(() => undefined);
  private v3: View3D | null = null;
  private loading = false;
  private failed = false;
  private on3d = false;

  constructor(private scene: Scene) {
    this.switch.qualityChanged = (q) => this.v3?.setQuality(q);
    this.switch.brightChanged = (n) => this.v3?.setBright(n);
  }

  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, others: Hero[], job: boolean): void {
    const want = this.switch.look === '3d' && !this.failed;
    if (want && !this.v3 && !this.loading) {
      this.loading = true;
      import('./view3d')
        .then((m) => (this.v3 = new m.View3D()).setBright(this.switch.bright))
        .catch(() => (this.failed = true))
        .finally(() => (this.loading = false));
    }
    const use = want && !!this.v3;
    if (use !== this.on3d) (this.on3d = use), this.v3?.show(use);
    if (use) this.v3!.render(room, meId, fx, now, dt, this.scene, others, job);
    else this.scene.render(room, meId, fx, now, dt, others);
  }

  /** Whether the 3D view is the one showing. */
  get is3d(): boolean {
    return this.on3d;
  }

  heroScreen(): [number, number, number, number?] | null {
    return this.on3d ? this.v3!.heroScreen() : this.scene.heroScreen();
  }

  tileScreen(x: number, y: number, up = 0): [number, number] {
    return this.on3d ? this.v3!.tileScreen(x, y, up) : this.scene.tileScreen(x, y, up);
  }

  /** For tests and the perf script. */
  get stats() {
    return this.v3?.stats ?? null;
  }
}
