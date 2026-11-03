/**
 * The 3D view: the same room the pixel scene draws (scene.ts), as low-res 3D that reads as pixel art.
 * Painted small (a quality knob sets how small), outlined and banded in one post pass, scaled up by a
 * whole number with nearest-pixel sampling; the flat layer of words and marks goes over it at the same
 * size. Only draws; the room decides everything. Built the first time it's wanted (main.ts).
 */
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import type { GameMap } from '../../shared/arena';
import type { Fx } from '../fx';
import { paintMap } from '../world';
import { Actors, type Lerp } from './actors3d';
import { Buildings } from './buildings3d';
import { Cam, FAR, NEAR, PITCH } from './camera3d';
import { Fires } from './fire3d';
import { buildGround, type Ground } from './ground';
import { Lights, type L3 } from './lights3d';
import { QUALITY, perfOn, quality } from './look';
import { Overlay, type Marks } from './overlay3d';
import { Perf } from './perf3d';
import { makeRT, postMaterial } from './post';
import { roomLights } from './roomlights';
import type { Spot } from './rounds3d';

export class View3D {
  readonly canvas: HTMLCanvasElement;
  private gl: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private view = new Cam();
  private rt: THREE.WebGLRenderTarget | null = null;
  private post = postMaterial(NEAR, FAR);
  private postScene = new THREE.Scene();
  private quad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private q = QUALITY[quality()];
  private lights = new Lights(this.q.lights, this.q.shadow);
  private fires = new Fires();
  private actors = new Actors();
  private buildings = new Buildings();
  private ground: Ground | null = null;
  private map: GameMap | null = null;
  private overlay = new Overlay();
  private perf = new Perf(perfOn());
  private dpr = 1;
  private S = 1;
  private heroAt: [number, number] | null = null;
  private calls = 0;

  constructor() {
    this.gl = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(1);
    this.gl.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.gl.setClearColor(0x05060a, 1);
    this.gl.shadowMap.enabled = this.q.shadow > 0;
    this.gl.shadowMap.type = THREE.BasicShadowMap;
    this.canvas = this.gl.domElement;
    Object.assign(this.canvas.style, { position: 'fixed', left: '0', top: '0', imageRendering: 'pixelated', display: 'none' });
    this.canvas.id = 'game3d';
    // Just over the pixel scene's canvas, under the bubbles, the HUD and the buttons.
    const game = document.getElementById('game');
    game?.after(this.canvas, this.overlay.canvas);
    this.overlay.canvas.style.display = 'none';
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
    this.scene.add(this.lights.group, this.fires.group, this.actors.group, this.buildings.group);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** Swap which canvas shows: this one, or the pixel scene's. */
  show(on: boolean): void {
    const d = on ? '' : 'none';
    this.canvas.style.display = this.overlay.canvas.style.display = d;
    const game = document.getElementById('game');
    if (game) game.style.visibility = on ? 'hidden' : '';
    this.perf.show(on);
  }

  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const Dw = innerWidth * this.dpr, Dh = innerHeight * this.dpr;
    const S = (this.S = Math.max(1, Math.round(Math.sqrt((Dw * Dh) / this.q.area))));
    const W = Math.ceil(Dw / S), H = Math.ceil(Dh / S);
    // As many tiles across as the pixel scene shows, a little closer in.
    const s2 = Math.max(1, Math.round(Math.sqrt((Dw * Dh) / 82000))), tiles = (Dw / s2 / 16) * 0.85;
    this.view.size(W, H, W / tiles);
    this.gl.setSize(W, H, false);
    const css: [string, string] = [(W * S) / this.dpr + 'px', (H * S) / this.dpr + 'px'];
    [this.canvas.style.width, this.canvas.style.height] = css;
    this.overlay.resize(W, H, css);
    this.rt?.depthTexture?.dispose();
    this.rt?.dispose();
    this.rt = makeRT(W, H, true);
    this.post.uniforms.uRes.value.set(W, H);
    const ext = Math.max(W, H) / this.view.ppu / Math.sin(PITCH) / 2 + 4, sc = this.lights.sky.shadow.camera;
    Object.assign(sc, { left: -ext, right: ext, top: ext, bottom: -ext });
    sc.updateProjectionMatrix();
  }

  /** My hero on screen (CSS pixels), and CSS pixels per tile across and down the floor (for aiming with the mouse). */
  heroScreen(): [number, number, number, number] | null {
    if (!this.heroAt) return null;
    const [x, y] = this.view.px(this.heroAt[0], 0, this.heroAt[1]), k = this.S / this.dpr, ppu = this.view.ppu;
    return [x * k, y * k, ppu * k, ppu * Math.sin(PITCH) * k];
  }

  /** A spot on the floor (tiles) in CSS pixels (speech bubbles over heads). */
  tileScreen(x: number, y: number): [number, number] {
    const [px, py] = this.view.px(x, 0, y), k = this.S / this.dpr;
    return [px * k, py * k];
  }

  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, marks: Marks): void {
    const t0 = performance.now(), map = room.map, a = room.alpha;
    if (this.map !== map) this.setMap(map);
    const lerp: Lerp = (key, x, y) => {
      const p = room.prev.get(key);
      return p ? [p[0] + (x - p[0]) * a, p[1] + (y - p[1]) * a] : [x, y];
    };
    const me = room.heroes.find((h) => h.id === meId);
    if (me) {
      const [hx, hy] = lerp('h:' + me.id, me.x, me.y), portrait = this.view.H > this.view.W * 1.2;
      this.heroAt = [hx, hy];
      this.view.follow(map, hx + me.fx * 0.6, hy + me.fy * 0.5 + (portrait ? (this.view.H / this.view.ppu) * 0.1 : 0), dt, fx.shake);
    }
    const at = this.view.at, fires: Spot[] = [...this.ground!.fires], ls: L3[] = [...this.ground!.lights];
    this.buildings.update(map, this.heroAt, fires);
    for (const e of room.enemies) if (e.act !== 'dead' && e.burnUntil > room.time) {
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      fires.push([x, 0.5, y, e.kind === 'butcher' ? 1.3 : 0.8]);
    }
    roomLights(room, fx, lerp, ls);
    this.lights.setSky(map.theme, at.x, at.z);
    this.lights.place(ls, at.x, at.z, now);
    this.fires.draw(fires, now);
    this.actors.update(room, meId, now, lerp);
    this.ground!.decals(fx);
    this.gl.setRenderTarget(this.rt);
    this.gl.render(this.scene, this.view.cam);
    const calls = (this.calls = this.gl.info.render.calls), tris = this.gl.info.render.triangles;
    this.post.uniforms.tCol.value = this.rt!.texture;
    this.post.uniforms.tDep.value = this.rt!.depthTexture;
    this.gl.setRenderTarget(null);
    this.gl.render(this.postScene, this.quad);
    this.overlay.draw(room, meId, fx, marks, (x, y, z) => this.view.px(x, y, z), lerp, now, this.view.ppu);
    this.perf.frame(performance.now() - t0, performance.now(), `${this.view.W}x${this.view.H} x${this.S}`, calls, tris);
  }

  get stats() {
    return { ...this.perf.stats, W: this.view.W, H: this.view.H, S: this.S, calls: this.calls };
  }

  private setMap(map: GameMap): void {
    if (this.ground) this.scene.remove(this.ground.group), this.ground.dispose();
    this.buildings.clear();
    this.ground = buildGround(map, paintMap(map));
    this.scene.add(this.ground.group);
    this.map = map;
    this.view.reset();
  }
}
