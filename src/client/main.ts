/** Relic: slice 2, one room. The fight runs here in the browser (solo is a party of one). */
import { HERO, RELICS, RELIC_SLOTS, TRAITS, WEAPONS, itemName } from '../shared/tuning';
import { relicLabel } from '../sim/hero';
import { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { Fx } from './fx';
import { Input } from './input';
import { LootCard } from './lootcard';
import { Scene } from './scene';
import { setMuted, sfx } from './sfx';
import './style.css';

const params = new URLSearchParams(location.search);
const room = new ArenaRoom(Number(params.get('seed')) || 1, { squire: true });
const ME = 'me';
const me = room.join(ME);
const scene = new Scene(document.getElementById('game') as HTMLCanvasElement);
const fx = new Fx();
const input = new Input(
  () => scene.heroScreen(),
  () => me.relics.slice(0, RELIC_SLOTS).map((r) => ({ name: RELICS[r].short, el: me.augments[r], active: r === me.relic, ready: 1 - Math.max(0, me.relicReady[r] - room.time) / RELICS[r].cooldown })),
);
const $ = (s: string) => document.querySelector(s) as HTMLElement;
const card = new LootCard((id) => input.take(id));
addEventListener('keydown', (e) => e.key.toLowerCase() === 'f' && card.current >= 0 && input.take(card.current));

function sound(ev: FightEvent): void {
  if (ev.k === 'shoot') return (sfx as unknown as Record<string, (() => void) | undefined>)[ev.kind]?.();
  if (ev.k === 'hit' && ev.tick) return;
  if (ev.k === 'hit') return ev.on === 'enemy' ? (ev.backstab ? sfx.backstab() : sfx.hit(ev.heavy)) : sfx.hurt();
  if (ev.k === 'windup') return ev.kind === 'swing' || ev.kind === 'stab' ? undefined : sfx.growl(ev.kind === 'slam');
  if (ev.k === 'impact') return ev.kind === 'slam' ? sfx.boom() : undefined;
  const f = (sfx as unknown as Record<string, (() => void) | undefined>)[ev.k];
  f?.();
}

/** One line on how each kit guards and dodges. */
const KIT: Record<string, string> = {
  sword: 'EASY PARRY  WIDE GUARD  ROLL',
  greatsword: 'TIGHT PARRY  HEAVY ROLL',
  spear: 'BACKSTEP  KEEPS FACING',
  daggers: 'LONG DASH  BACKSTAB 2.5X',
  longbow: 'HOLD 1.4S: PIERCING SHOT',
  shortbow: 'QUICK DRAW  WALK WHILE DRAWING',
  crossbow: 'FIRES ON PRESS  LONG RELOAD',
  wand: 'QUICK SPARKS  0.6S CAST',
  staff: 'HOLD 1.6S: BURSTING ORB',
  rod: 'HOLD 1S: PIERCING LANCE',
  mace: '3RD BLOW HEALS  HOLD: SMITE',
};

let parries = 0;
const tips = input.touch
  ? ['Goblins drop weapons. Stand on one and TAKE it', 'Traits reward skill: parries, dodges, perfect releases', 'CLASS changes class. WEAPON swaps its kit', 'HEALER: hold RELIC for BLESS, it finds the most hurt ally', 'AUGMENT puts an element on your relic', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap BLOCK when the red flashes WHITE to PARRY', 'Hold ATTACK to charge a heavy blow', 'RELIC: pin a scrapper to the wall', 'Striped circles cannot be blocked: ROLL out', 'HOLD RELIC to pick another relic', 'TWIN DAGGERS: roll behind a goblin and BACKSTAB']
  : ['Goblins drop weapons. Stand on one and press F to take it', 'Bows: release on the white flash. Held too long, the shot weakens', 'C changes class. Q swaps its kit. T puts an element on your relic', 'Healer: point at an ally and press E to BLESS them', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap right click when the red flashes WHITE to PARRY', 'Hold left click to charge a heavy blow', 'E: pin a scrapper to the wall. 1 2 3 pick a relic', 'Striped circles cannot be blocked: SPACE to roll', 'Ranger: longbow, shortbow or crossbow. Mage: wand, staff or rod', 'Daggers: roll behind a goblin and BACKSTAB'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  $('.hp i').style.width = (100 * me.hp) / HERO.hp + '%';
  $('.st i').style.width = (100 * me.stamina) / HERO.stamina + '%';
  $('.st').classList.toggle('low', me.stamina < 25);
  $('.who').textContent = WEAPONS[me.weapon].cls;
  const item = me.arms[me.weapon];
  $('.wpn').textContent = (input.touch ? '' : 'Q ') + (item ? itemName(item) : WEAPONS[me.weapon].name);
  $('.kit').textContent = item ? item.traits.map((t) => TRAITS[t].name).join(' + ') + '  ' + KIT[me.weapon] : KIT[me.weapon];
  card.update(room, me, !input.touch);
  $('.rlc').textContent = (input.touch ? '' : 'E ') + relicLabel(me);
  $('.rlc').dataset.el = me.augments[me.relic];
  if (input.touch) ($('.tb.relic').textContent = RELICS[me.relic].short), ($('.tb.relic').dataset.el = me.augments[me.relic]);
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
