/** Relic: slice 2, one room. The fight runs here in the browser (solo is a party of one). */
import { HERO } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { Fx } from './fx';
import { Input } from './input';
import { Scene } from './scene';
import { setMuted, sfx } from './sfx';
import './style.css';

const params = new URLSearchParams(location.search);
const room = new ArenaRoom(Number(params.get('seed')) || 1);
const ME = 'me';
const me = room.join(ME);
const scene = new Scene(document.getElementById('game') as HTMLCanvasElement);
const fx = new Fx();
const input = new Input(() => scene.heroScreen());
const $ = (s: string) => document.querySelector(s) as HTMLElement;

function sound(ev: FightEvent): void {
  if (ev.k === 'hit') return ev.on === 'enemy' ? sfx.hit(ev.heavy) : sfx.hurt();
  if (ev.k === 'windup') return ev.kind === 'swing' ? undefined : sfx.growl(ev.kind === 'slam');
  const f = (sfx as unknown as Record<string, (() => void) | undefined>)[ev.k];
  f?.();
}

let parries = 0;
const tips = input.touch
  ? ['Tap BLOCK just as the red fills to PARRY', 'Hold BLOCK to guard; it costs stamina', 'Striped circles cannot be blocked: ROLL out', 'After a parry, hit back for a COUNTER']
  : ['Tap right click just as the red fills to PARRY', 'Hold right click to guard; it costs stamina', 'Striped circles cannot be blocked: SPACE to roll', 'After a parry, hit back for a COUNTER'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  $('.hp i').style.width = (100 * me.hp) / HERO.hp + '%';
  $('.st i').style.width = (100 * me.stamina) / HERO.stamina + '%';
  $('.st').classList.toggle('low', me.stamina < 25);
  if (now - tipAt > 6) {
    tipAt = now;
    $('#tip').textContent = tips[tipI++ % tips.length];
  }
  $('#tip').classList.toggle('gone', parries >= 3);
}

let last = performance.now();
function frame(t: number): void {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  room.setIntent(ME, input.read());
  for (const ev of room.advance(dt)) {
    fx.on(ev);
    sound(ev);
    if (ev.k === 'parry') parries++;
  }
  fx.update(dt);
  scene.render(room, ME, fx, t / 1000, dt);
  hud(t / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let muted = false;
$('#mute').addEventListener('click', () => {
  muted = !muted;
  setMuted(muted);
  $('#mute').classList.toggle('off', muted);
});
$('#help').addEventListener('click', () => $('#how').toggleAttribute('hidden'));
$('#how').addEventListener('click', () => $('#how').setAttribute('hidden', ''));
if (input.touch) document.body.classList.add('touch');

// Test hooks: read the fight as data, never as pixels.
const w = window as unknown as Record<string, unknown>;
w.__GAME_STATE__ = () => ({ time: room.time, hero: { ...me }, enemies: room.enemies.map((e) => ({ ...e })), parries });
w.render_game_to_text = () => `t=${room.time.toFixed(1)} hero ${me.act} hp ${me.hp} st ${Math.round(me.stamina)} | ` + room.enemies.map((e) => `${e.kind} ${e.act} hp ${e.hp}${e.attack ? ' ' + e.attack.kind + ' ' + e.attack.t.toFixed(2) : ''}`).join(' | ');
w.__room = room;
