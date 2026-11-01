/** Relic: slice 2, one room. The fight runs here in the browser (solo is a party of one). */
import { HERO, RELICS, WEAPONS } from '../shared/tuning';
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
  if (ev.k === 'hit') return ev.on === 'enemy' ? (ev.backstab ? sfx.backstab() : sfx.hit(ev.heavy)) : sfx.hurt();
  if (ev.k === 'windup') return ev.kind === 'swing' || ev.kind === 'stab' ? undefined : sfx.growl(ev.kind === 'slam');
  if (ev.k === 'impact') return ev.kind === 'slam' ? sfx.boom() : undefined;
  const f = (sfx as unknown as Record<string, (() => void) | undefined>)[ev.k];
  f?.();
}

let parries = 0;
const tips = input.touch
  ? ['Tap BLOCK when the red flashes WHITE to PARRY', 'Hold ATTACK to charge a heavy blow', 'RELIC: pin a scrapper to the wall', 'Striped circles cannot be blocked: ROLL out', 'WEAPON and RELIC up top swap your kit', 'TWIN DAGGERS: roll behind a goblin and BACKSTAB']
  : ['Tap right click when the red flashes WHITE to PARRY', 'Hold left click to charge a heavy blow', 'E: pin a scrapper to the wall. R swaps relic', 'Striped circles cannot be blocked: SPACE to roll', 'Q swaps weapon: sword, greatsword, spear, daggers', 'Daggers: roll behind a goblin and BACKSTAB'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  $('.hp i').style.width = (100 * me.hp) / HERO.hp + '%';
  $('.st i').style.width = (100 * me.stamina) / HERO.stamina + '%';
  $('.st').classList.toggle('low', me.stamina < 25);
  $('.wpn').textContent = (input.touch ? '' : 'Q ') + WEAPONS[me.weapon].name;
  $('.rlc').textContent = (input.touch ? '' : 'E ') + RELICS[me.relic].name;
  const wait = Math.max(0, me.relicReady[me.relic] - room.time);
  $('.rcd').textContent = wait > 0 ? wait.toFixed(1) : 'READY';
  $('.rcd').classList.toggle('wait', wait > 0);
  if (input.touch) document.querySelector<HTMLElement>('.tb.relic')!.style.setProperty('--cd', 100 * (1 - wait / RELICS[me.relic].cooldown) + '%');
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
