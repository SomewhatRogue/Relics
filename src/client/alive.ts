/**
 * LIVING WORLD, a player's choice to compare (docs/decisions/new-look-characters.md, Kyle 2026-11-16: "I wish
 * characters and NPCs looked more dynamic", "beautiful landscapes make a huge difference... things that look deep or
 * nuanced, like water"; "put it behind an option I can toggle in the UI to compare"). On: capes trail and swing,
 * goblins are knocked back the way a blow lands, townsfolk shift their weight and turn to look at you; in the 2.5D view
 * the wind runs through the trees in gusts, cloud shadows drift over the ground, and the water has foam at its edges and
 * light glinting on it. Off: as it was. A button in the options box flips it live; remembered on this device;
 * `?alive=1` or `?alive=0` in the address wins. Off until Kyle says.
 */
import './alive.css';

const KEY = 'relic.alive';

function start(): boolean {
  if (typeof location === 'undefined') return false;
  const u = new URLSearchParams(location.search).get('alive');
  if (u === '1' || u === '0') return u === '1';
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

/** Whether the living world is on (read each frame, so the button changes it live). */
export const ALIVE = { on: start() };

export function setAlive(on: boolean): void {
  ALIVE.on = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* this session only */
  }
}

/** The LIVING WORLD button, under CAMERA. */
export function aliveButton(): void {
  const box = document.getElementById('options');
  if (!box) return;
  const b = document.createElement('button');
  b.id = 'alivebtn';
  b.setAttribute('aria-label', 'Living world: characters and landscapes that move more');
  const label = () => {
    b.textContent = ALIVE.on ? 'LIVING WORLD: ON' : 'LIVING WORLD: OFF';
    b.classList.toggle('on', ALIVE.on);
  };
  b.addEventListener('click', () => (setAlive(!ALIVE.on), label()));
  label();
  const after = document.getElementById('camerabtn') ?? document.getElementById('brightrow') ?? document.getElementById('viewbtn');
  if (after) after.after(b);
  else box.prepend(b);
}

/**
 * The wind (one for everything: a cape's hem, the trees in 2.5D, three/wind3d.ts's shader writes the same sum):
 * gusts that travel across the map from the west-north-west, a band at a time, `0` calm to `1` a full gust at room
 * tile (x, y) at time `now` (seconds). Two waves at odd lengths, so gusts come unevenly, never in lockstep.
 */
export const WIND = { dir: [0.92, 0.38], speed: 2.6, len: [9.5, 23] };
export function gust(x: number, y: number, now: number): number {
  const along = x * WIND.dir[0] + y * WIND.dir[1];
  const a = Math.sin((along - now * WIND.speed) / WIND.len[0] * 6.283), b = Math.sin((along - now * WIND.speed * 0.6) / WIND.len[1] * 6.283);
  const g = Math.max(0, a * 0.6 + b * 0.55 - 0.15);
  return Math.min(1, g * g * 1.6);
}

/** Where the player is (room tiles), set by the scene before it draws the townsfolk, so they can turn to look. */
export const WATCHED = { on: false, x: 0, y: 0 };
export function watched(me: { x: number; y: number } | null | undefined): void {
  WATCHED.on = !!me;
  if (me) (WATCHED.x = me.x), (WATCHED.y = me.y);
}

/** A steady number in 0..1 for a name: each townsperson keeps their own rhythm. */
export function phaseOf(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return ((x >>> 0) % 1000) / 1000;
}

/** How a standing townsperson stands, with the living world on: `look`, which way they face (true: left), toward the
 *  player within `near` tiles, else glancing one way and the other on their own uneven rhythm; `shift`, a pixel of
 *  weight from foot to foot now and then. */
export const IDLE = { near: [5, 3.5] };
export function idleStance(name: string, x: number, y: number, now: number): { left: boolean; shift: number } {
  const ph = phaseOf(name) * 6.283;
  const near = WATCHED.on && Math.abs(WATCHED.x - x) < IDLE.near[0] && Math.abs(WATCHED.y - y) < IDLE.near[1];
  const left = near ? WATCHED.x < x : Math.sin(now * 0.31 + ph) + Math.sin(now * 0.17 + ph * 2.1) * 0.8 > 0;
  const w = Math.sin(now * 0.43 + ph * 1.7);
  return { left, shift: w > 0.45 ? 1 : w < -0.45 ? -1 : 0 };
}
