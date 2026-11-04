/**
 * The touch buttons as one cluster round ATTACK (bottom right, upright phone): what each shows and how
 * it looks this frame. The buttons and their presses are input.ts's; this only draws them (btnart.ts)
 * and says which are there: the class skill and the relic carried with their cooldowns, the guard
 * (BLOCK or PARRY, none for a Mage), the dodge (STEP, JUMP, DASH, BLINK), the flask as the health orb,
 * stamina as pips round ATTACK, and one gilt context slot (GRAB, THROW, HELP UP, BURN, OPEN, TALK).
 */
import { carriedItem } from '../sim/charge';
import { isDark, relicFill } from '../shared/relicitems';
import { fillCol } from './reliccard';
import { CLASS_GUARD, dodgeName, dodgeOf, HERO, RELICS, WEAPONS, type Item } from '../shared/tuning';
import { knows } from '../sim/types';
import { grabbable } from '../sim/grab';
import { raisable } from '../sim/party';
import { torchable } from '../sim/torch';
import { kindleable } from '../sim/kindle';
import { liftable } from '../sim/props';
import { relicLabel } from '../sim/hero';
import { castElement } from '../sim/channel';
import { itemIcon, potionIcon } from './itemicons';
import { relicItemIcon } from './relicicons';
import { skillCanvas } from './skillicons';
import { icon, type IconId } from './icons';
import { paintButton, type Face } from './btnart';
import { stickVars } from './stickart';
import type { Game } from './game';

const EL: Record<string, string> = { fire: '#ff9a3c', frost: '#bfe8ff', storm: '#fff27a' };
const DODGE: Record<string, IconId> = { STEP: 'step', JUMP: 'jump', DASH: 'dash', BLINK: 'blink', ROLL: 'roll' };
type Spot = ReturnType<Game['near']>;

/** An image source from a data URL, once it has loaded (null till then: the button repaints when it has). */
const imgs = new Map<string, HTMLImageElement>();
function img(url: string): HTMLImageElement | null {
  if (!url) return null;
  let i = imgs.get(url);
  if (!i) (i = new Image()), (i.src = url), imgs.set(url, i);
  return i.complete && i.naturalWidth ? i : null;
}
/** A number for each picture, so a changed icon repaints its button. */
const ids = new WeakMap<object, number>();
let nextId = 1;
const idOf = (o: object | null | undefined) => (o ? ids.get(o) ?? (ids.set(o, nextId++), nextId - 1) : 0);
const iconOf = (it: Item | undefined, weapon: string) => { try { return itemIcon(it ?? ({ kit: weapon, traits: [] } as unknown as Item)); } catch { return ''; } };

class Btn {
  readonly el: HTMLElement;
  private art = document.createElement('canvas');
  private cd = document.createElement('b');
  private lbl = document.createElement('i');
  private key = '';
  constructor(sel: string, private extra = '') {
    this.el = document.querySelector(sel) as HTMLElement;
  }
  /** Draw `f` (only when it changed), with `secs` on the face and `label` under it. */
  show(f: Face | null, secs = '', label = '', aria = ''): void {
    this.el.hidden = !f;
    if (!f) return;
    // (Someone else set the button's words: put the picture back.)
    if (this.art.parentNode !== this.el) this.el.replaceChildren(this.art, this.cd, this.lbl), this.el.classList.add('art');
    f.down = this.el.classList.contains('down');
    const key = JSON.stringify(f, (k, v) => (k === 'icon' ? idOf(v) : v)) + this.extra;
    if (key !== this.key) (this.key = key), paintButton(this.art, f), this.el.style.setProperty('--w', String(this.art.width));
    if (this.cd.textContent !== secs) this.cd.textContent = secs;
    if (this.lbl.textContent !== label) this.lbl.textContent = label;
    if (aria && this.el.getAttribute('aria-label') !== aria) this.el.setAttribute('aria-label', aria);
  }
}

export class Cluster {
  private b = {
    attack: new Btn('.tb.attack'), block: new Btn('.tb.block'), roll: new Btn('.tb.roll'), skill: new Btn('.tb.relic'),
    relic: new Btn('.tb.relic2'), potion: new Btn('.tb.potion'), grab: new Btn('.tb.grab'), use: new Btn('.tb.use'),
  };
  private ready: Record<string, boolean> = {};
  private stick = document.querySelector('#touch .stick') as HTMLElement;
  private stickOn = false;
  private moves = 0;

  constructor() {
    stickVars();
  }

  update(game: Game, spot: Spot, busy: boolean, now: number): void {
    const me = game.hero, room = game.room, mode = game.mode, b = this.b;
    if (!me) return;
    // The stick's resting ghost goes once you've moved a few times.
    const on = this.stick.classList.contains('on');
    if (on && !this.stickOn && ++this.moves === 3) document.body.classList.add('stick-known');
    this.stickOn = on;
    const kit = WEAPONS[me.weapon], guard = CLASS_GUARD[kit.cls];
    if (document.body.dataset.guard !== guard) document.body.dataset.guard = guard;
    const carrying = me.act === 'carry';
    const atk = carrying ? icon('slam') : img(iconOf(me.arms[me.weapon], me.weapon));
    const st = me.stamina, flick = me.winded && room.time - me.staminaAt < HERO.windedDelay ? Math.floor(now * 11) % 2 === 0 : false;
    b.attack.show({ shape: 'round', size: 42, grade: 'iron', icon: atk, iconScale: carrying ? 1 : 2, pips: { lit: flick ? 0 : Math.ceil(st / 10), of: 10, col: me.winded ? '#d84a3a' : st < 25 ? '#a8a090' : '#ddd5c4' } }, '', '', carrying ? 'Slam' : 'Attack');
    b.block.show(guard === 'none' ? null : { shape: 'shield', size: 30, grade: 'iron', icon: icon(guard === 'parry' ? 'parry' : 'block') }, '', '', guard === 'parry' ? 'Parry' : 'Block');
    const dn = dodgeName(kit.cls);
    b.roll.show(dodgeOf(kit) ? { shape: 'diamond', size: 34, grade: 'iron', icon: icon(DODGE[dn] ?? 'roll') } : null, '', dn, dn);
    // The class skill and the relic carried, each with its cooldown (a dark sweep and the seconds).
    const [skill, relic] = me.relics, left = (r: typeof skill) => Math.max(0, me.relicReady[r] - room.time);
    const el = skill === 'channel' ? castElement(me) : me.augments[skill];
    if (knows(me, 'skill')) {
      const l = left(skill);
      b.skill.show({ shape: 'round', size: 28, grade: 'iron', icon: skillCanvas(skill, el), ring: EL[el], cd: l / RELICS[skill].cooldown, flash: this.flash('skill', l, room.time) }, l > 0 ? String(Math.ceil(l)) : '', skillCanvas(skill, el) ? '' : RELICS[skill].short, relicLabel(me, skill));
    } else b.skill.show(null);
    const it = relic ? carriedItem(me) : undefined, dark = !!it && isDark(it);
    if (relic) {
      const l = left(relic);
      b.relic.show({ shape: 'round', size: 28, grade: dark ? 'stone' : 'iron', icon: img(it ? relicItemIcon(it) : ''), ring: EL[me.augments[relic]], cd: dark ? 0 : l / RELICS[relic].cooldown, flash: this.flash('relic', l, room.time), charge: it ? relicFill(it) : undefined, chargeCol: it ? fillCol(it) : undefined }, l > 0 && !dark ? String(Math.ceil(l)) : '', '', RELICS[relic].name);
    } else b.relic.show(null);
    // The flask is the health orb: red to your health (green when poisoned), pulsing when low, the next potion in front.
    const next = me.belt[0], hp = me.hp / me.maxHp, low = hp < 0.3 && me.hp > 0;
    b.potion.show({ shape: 'orb', size: 32, grade: next ? 'iron' : 'stone', fill: hp, liquid: me.poison ? '#5a8a2a' : '#a8261c', pulse: low && Math.floor(now * 4) % 2 === 0, icon: next ? img(potionIcon(next)) : null }, me.belt.length > 1 ? String(me.belt.length) : '', '', next ? 'Drink or throw ' + next : 'Health');
    b.potion.el.classList.toggle('low', low);
    // The context slot: help a friend up, set a nest or a house alight, grab, throw; or what's here to use.
    const can = carrying || (me.act === 'idle' && (room.enemies.some((e) => grabbable(me, e, room.time)) || room.props.some((p) => liftable(me, p))));
    const raise = me.act === 'idle' && raisable(me, room.heroes);
    const burn = !raise && (!!torchable(me, room.enemies) || (mode === 'run' && !!kindleable(me, room.map)));
    const lifter = kit.cls === 'WARRIOR', active = can || raise || burn;
    const use = !!spot && !busy && (mode !== 'run' || !!spot.chest);
    const what: IconId = raise ? 'help' : burn ? 'burn' : carrying ? 'throw' : 'grab';
    const word = raise ? 'HELP UP' : burn ? 'BURN' : carrying ? 'THROW' : 'GRAB';
    const showGrab = (active || lifter) && !(use && !active && mode !== 'town');
    b.grab.show(showGrab ? { shape: 'round', size: 29, grade: active ? 'gilt' : 'stone', icon: icon(what) } : null, '', word, word);
    b.grab.el.classList.toggle('dim', !active);
    const uw = spot?.chest ? 'OPEN' : spot?.door ? 'ENTER' : spot?.talk && spot.talk !== 'board' && spot.talk !== 'market' && spot.talk !== 'gate' ? 'TALK' : 'USE';
    const ui: IconId = uw === 'OPEN' ? 'open' : uw === 'ENTER' ? 'enter' : uw === 'TALK' ? 'chat' : 'use';
    const big = mode === 'town';
    b.use.show(use && !(showGrab && active) ? { shape: 'round', size: big ? 42 : 29, grade: 'gilt', icon: icon(ui), iconScale: big ? 2 : 1 } : null, '', uw, uw);
    b.use.el.classList.toggle('chest', !!spot?.chest);
    b.use.el.classList.toggle('big', big);
  }

  /** True for the frame or two after a cooldown runs out. */
  private flash(id: string, left: number, t: number): boolean {
    const was = this.ready[id];
    this.ready[id] = left <= 0;
    if (left <= 0 && was === false) this.flashAt[id] = t;
    return t - (this.flashAt[id] ?? -9) < 0.1;
  }
  private flashAt: Record<string, number> = {};
}
