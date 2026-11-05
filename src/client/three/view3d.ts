/**
 * The 3D view: the same room the pixel scene draws (scene.ts), as low-res 3D that reads as pixel art.
 * Painted small (a quality knob sets how small), outlined and banded in one post pass, scaled up by a
 * whole number with nearest-pixel sampling; the flat layer of words and marks goes over it at the same
 * size. Only draws; the room decides everything. Built the first time it's wanted (main.ts).
 */
import { feetBand } from '../phoneband';
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import type { GameMap } from '../../shared/arena';
import type { Fx } from '../fx';
import { paintMap } from '../world';
import { Actors, XRAY_LAYER, type Lerp } from './actors3d';
import { XRAY } from './mats';
import { Buildings } from './buildings3d';
import { Cam, FAR, NEAR, PITCH } from './camera3d';
import { Fires } from './fire3d';
import { burningAt } from '../../shared/blaze';
import { buildGround, type Ground } from './ground';
import { lampsNow } from './lamps3d';
import { Lights, type L3 } from './lights3d';
import { BOXFIGS, QUALITY, brightGamma, perfOn, quality, type Quality } from './look';
import { Figs } from './figs3d';
import { putCards } from './cards3d';
import { Overlay, type Marks } from './overlay3d';
import { People } from './people3d';
import { Grim3D } from './grim3d';
import { drawExtras, drawMist3 } from './extras3d';
import { drawTags } from './tags3d';
import { drawSkills3 } from './skills3d';
import { drawSpellGround3 } from '../spellground';
import { drawHuntMarks } from '../signdraw';
import { skyFlash } from '../skystrikedraw';
import { drawFound3 } from './found3d';
import { Perf } from './perf3d';
import { makeRT, postMaterial } from './post';
import { roomLights } from './roomlights';
import type { Spot } from './rounds3d';
import { WitchFires } from './witch3d';
import { Beacon3D } from './beacon3d';
import { drawFlues } from './smoke3d';
import { drawBolts3, strikeLights3 } from './storm3d';
import { flashTheme, fogLook } from '../skyfx';
import { flashOf } from '../../sim/stormshape';

/** How much of the flat view's floor the 2.5D view shows: on a phone held upright a little closer in. */
const ZOOM = { tall: 0.8, wide: 1 };

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
  private figs = new Figs();
  private buildings = new Buildings();
  private people = new People();
  private grim = new Grim3D();
  private witch = new WitchFires();
  private beacon = new Beacon3D();
  private ground: Ground | null = null;
  private map: GameMap | null = null;
  private overlay = new Overlay();
  private perf = new Perf(perfOn());
  private dpr = 1;
  private S = 1;
  private heroAt: [number, number] | null = null;
  private calls = 0;
  private tris = 0;

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
    this.scene.add(this.lights.group, this.fires.group, this.actors.group, this.buildings.group, this.people.group, this.grim.group, this.witch.group, this.beacon.group, this.figs.group);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** LOW, MID or HIGH, live: the light pool and the moon's shadow are rebuilt, the scene repainted at its new size. */
  setQuality(name: Quality): void {
    this.q = QUALITY[name];
    this.scene.remove(this.lights.group);
    this.lights = new Lights(this.q.lights, this.q.shadow);
    this.scene.add(this.lights.group);
    this.gl.shadowMap.enabled = this.q.shadow > 0;
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      for (const x of Array.isArray(m) ? m : m ? [m] : []) x.needsUpdate = true;
    });
    this.resize();
  }

  /** BRIGHT's step: a gamma in the post pass. */
  setBright(n: number): void {
    this.post.uniforms.uGamma.value = 1 / brightGamma(n);
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
    // As much floor as the pixel scene shows (its tiles across times down, scene.ts), so a figure stands
    // about as big as there: tilted, the view takes in more rows and fewer columns than the flat one.
    // `__zoom3` (a share of that floor) is for screenshots.
    const s2 = Math.max(1, Math.round(Math.sqrt((Dw * Dh) / 82000))), floor = ((Dw / s2 / 16) * (Dh / s2 / 16)) * ((globalThis as { __zoom3?: number }).__zoom3 ?? (Dh > Dw ? ZOOM.tall : ZOOM.wide));
    this.view.size(W, H, Math.sqrt((W * H) / (Math.sin(PITCH) * floor)));
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

  /**
   * A spot on the floor (tiles) in CSS pixels, `up` flat-view tiles above it (speech bubbles over
   * heads): a 3D figure stands taller on screen than the flat sprite, so up is raised to match.
   */
  tileScreen(x: number, y: number, up = 0): [number, number] {
    const [px, py] = this.view.px(x, up * 0.95, y), k = this.S / this.dpr;
    return [px * k, py * k];
  }

  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, marks: Marks, others: Hero[] = [], _job = true): void {
    const t0 = performance.now(), map = room.map, a = room.alpha;
    if (this.map !== map) this.setMap(map);
    const lerp: Lerp = (key, x, y) => {
      const p = room.prev.get(key);
      return p ? [p[0] + (x - p[0]) * a, p[1] + (y - p[1]) * a] : [x, y];
    };
    const me = room.heroes.find((h) => h.id === meId), f = marks.focus;
    if (me) {
      const [hx, hy] = lerp('h:' + me.id, me.x, me.y), portrait = this.view.H > this.view.W * 1.2;
      this.heroAt = [hx, hy];
      // A cutscene's point of interest (the Stoker coming): the camera eases there instead.
      if (f) this.view.follow(map, f.x, f.y, dt * 0.36, fx.shake);
      else {
        // Upright: the hero's feet kept between the top HUD and the touch cluster (phoneband.ts).
        const band = portrait ? feetBand(this.view.H, this.S / this.dpr) : null;
        this.view.follow(map, hx + me.fx * 0.6, hy + me.fy * 0.5 + (portrait ? (this.view.H / this.view.ppu) * 0.1 : 0), dt, fx.shake, band ? { z: hy, top: band[0], bottom: band[1] } : undefined);
      }
    }
    const at = this.view.at, fires: Spot[] = [...this.ground!.fires], ls: L3[] = [...this.ground!.lights];
    lampsNow(map.theme, this.ground!.lamps, fires, ls);
    this.buildings.update(map, this.heroAt, fires);
    for (const e of room.enemies) if (e.act !== 'dead' && e.burnUntil > room.time) {
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      fires.push([x, 0.5, y, e.kind === 'butcher' || e.ashAt ? 1.3 : 0.8]);
    }
    // A house on fire inside: flames over every patch alight (shared/blaze.ts), as the flat view draws them.
    if (map.blaze) for (const a of burningAt(map.blaze, room.time)) for (let fx0 = a.x + 0.3; fx0 < a.x + a.w; fx0 += 0.55) fires.push([fx0, 0.05, a.y + a.h / 2, 0.9]);
    roomLights(room, fx, lerp, ls);
    strikeLights3(room, ls);
    this.witch.update(now, ls);
    this.grim.update(now, fires, ls);
    this.beacon.update(room, fires, ls);
    // A lightning flash lifts the sky's light a beat (../skyfx.ts).
    this.lights.setSky(flashTheme(map.theme, Math.max(flashOf(room.strikes, room.time), skyFlash(room))), at.x, at.z);
    this.lights.place(ls, at.x, at.z, now);
    this.fires.draw(fires, now);
    this.actors.update(room, meId, now, lerp);
    this.people.update(room, map, others, now);
    const P = (x: number, y: number, z: number) => this.view.px(x, y, z);
    if (!BOXFIGS) {
      this.figs.begin(this.view.ppu, P, this.view.W, this.view.H, now, room.time);
      putCards(this.figs, room, meId, others, lerp);
      this.figs.end();
    }
    this.ground!.decals(fx);
    this.ground!.wet(fx.wet, now);
    // Everything but the heroes; then the heroes as a silhouette where something nearer hides them;
    // then the heroes themselves over that, so only the hidden parts stay a silhouette.
    const cam = this.view.cam, gl = this.gl;
    gl.setRenderTarget(this.rt);
    cam.layers.set(0);
    gl.render(this.scene, cam);
    let calls = gl.info.render.calls, tris = gl.info.render.triangles;
    cam.layers.set(XRAY_LAYER);
    gl.autoClear = false;
    gl.shadowMap.autoUpdate = false;
    // Box figures take the silhouette as an override; cards swap to theirs (cut to the figure's shape).
    if (BOXFIGS) this.scene.overrideMaterial = XRAY;
    else this.figs.xray(true);
    gl.render(this.scene, cam);
    this.scene.overrideMaterial = null;
    this.figs.xray(false);
    gl.render(this.scene, cam);
    calls += gl.info.render.calls * 2;
    tris += gl.info.render.triangles * 2;
    this.calls = calls;
    this.tris = tris;
    gl.shadowMap.autoUpdate = true;
    gl.autoClear = true;
    cam.layers.set(0);
    this.post.uniforms.tCol.value = this.rt!.texture;
    // Fog thickening away from your hero, in the post pass (post.ts).
    const fl = fogLook(map.theme), u = this.post.uniforms;
    if (fl && this.heroAt) {
      const [hx, hy] = this.view.px(this.heroAt[0], 0, this.heroAt[1]);
      u.uFog.value.set(hx, this.view.H - hy, fl.k, this.view.ppu);
      u.uFogC.value.set(...fl.c);
      u.uFogY.value = Math.sin(PITCH);
    } else u.uFog.value.z = 0;
    this.post.uniforms.tDep.value = this.rt!.depthTexture;
    this.gl.setRenderTarget(null);
    this.gl.render(this.postScene, this.quad);
    const og = this.overlay.g;
    const ex = { room, meId, lerp, P, now, W: this.view.W, H: this.view.H, fanfare: !!marks.fanfare, stains: fx.decals, others, mist: [at.x * this.view.ppu, at.z * this.view.ppu * Math.sin(PITCH)] as [number, number] };
    this.overlay.draw(room, meId, fx, marks, P, lerp, now, this.view.ppu);
    drawSkills3(og, room, P, lerp, this.view.ppu, now);
    drawSpellGround3(og, room, P, this.view.ppu, lerp);
    drawHuntMarks(og, room, P, lerp, this.view.ppu);
    drawFound3(og, room, P, lerp, this.view.ppu, now);
    drawBolts3(og, room, P, this.view.ppu);
    drawExtras(og, ex);
    drawFlues(og, map, P, now, this.view.W, this.view.H);
    drawTags(og, map, room.time, this.heroAt ? { x: this.heroAt[0], y: this.heroAt[1] } : null, others, P, now);
    drawMist3(og, map.theme, ex);
    this.perf.frame(performance.now() - t0, performance.now(), `${this.view.W}x${this.view.H} x${this.S}` + (BOXFIGS ? '' : `, ${this.figs.count} figs ${this.figs.ms.toFixed(1)} ms`), calls, tris);
  }

  get stats() {
    return { ...this.perf.stats, W: this.view.W, H: this.view.H, S: this.S, calls: this.calls, tris: this.tris, figs: this.figs.ms, cards: this.figs.count };
  }

  private setMap(map: GameMap): void {
    if (this.ground) this.scene.remove(this.ground.group), this.ground.dispose();
    this.buildings.clear();
    this.people.clear();
    this.grim.build(map);
    this.witch.build(map);
    this.ground = buildGround(map, paintMap(map, false));
    this.scene.add(this.ground.group);
    this.map = map;
    this.view.reset();
  }
}
