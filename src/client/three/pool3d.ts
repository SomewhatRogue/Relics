/**
 * Things that come and go (goblins, heroes, arrows, drops) kept by key: made the first frame they're
 * seen, rebuilt when their look changes, removed the first frame they're not. One pool per kind.
 */
import type * as THREE from 'three';

export class Pool<T extends { root: THREE.Object3D }> {
  private live = new Map<string, { v: T; look: string; seen: number }>();
  private frame = 0;

  constructor(private parent: THREE.Object3D) {}

  begin(): void {
    this.frame++;
  }

  get(key: string, look: string, make: () => T): T {
    let e = this.live.get(key);
    if (e && e.look !== look) this.parent.remove(e.v.root), (e = undefined);
    if (!e) {
      e = { v: make(), look, seen: 0 };
      this.parent.add(e.v.root);
      this.live.set(key, e);
    }
    e.seen = this.frame;
    e.v.root.visible = true;
    return e.v;
  }

  /** Drop everything not asked for this frame. */
  end(): void {
    for (const [k, e] of this.live) if (e.seen !== this.frame) this.parent.remove(e.v.root), this.live.delete(k);
  }

  clear(): void {
    for (const e of this.live.values()) this.parent.remove(e.v.root);
    this.live.clear();
  }
}

/** Just a mesh or group to keep in a pool. */
export interface Held { root: THREE.Object3D }
