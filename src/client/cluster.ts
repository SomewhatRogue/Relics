/**
 * The touch buttons as one cluster round ATTACK (bottom right, upright phone): what each shows and how
 * it looks this frame. A laptop shows the same buttons in a row at the bottom, each with its key on its
 * corner, to show what you have and what to press (keybar.css; Kyle, 2026-11-06). The buttons and their presses are input.ts's; this only draws them (btnart.ts)
 * and says which are there: a Mage's ELEMENT (a small ring by ATTACK in the element's colour, its name
 * over it), a Rogue's SHADOW STEP, Ranger's MARK or Healer's MEND in the same spot (shared/signs.ts), the class skill and the relic carried with their cooldowns, the guard
 * (BLOCK for a Warrior or Healer, none for a Ranger, Rogue or Mage), the dodge (JUMP, DASH, BLINK, ROLL), the flask as the health orb,
 * stamina as pips round ATTACK (a Mage's magic round BLINK), one gilt context slot (GRAB, THROW, HELP UP, BURN, OPEN, TALK, PET), and a
 * crossbow's RELOAD. A Warrior or Healer has no dodge: the context slot takes the dodge's place, and a
 * Warrior's always shows GRAB (dimmed till there's something to take hold of). (The Warrior's roar, TAUNT,
 * sat in the dodge's place till it became TAUNT GUARD, held on the block: 2026-11-06.)
 */
import { resting } from '../sim/brake';
import { ropedNear } from '../sim/drover';
import { staitheGrabbable } from '../sim/staithebits';
import { STAITHE_WORDS } from '../shared/staithewords';
import { carriedItem } from '../sim/charge';
import { isDark, relicMax } from '../shared/relicitems';
import { fillCol } from './reliccard';
import { DODGE as DODGE_RULE, guardOf, dodgeName, dodgeOf, HERO, RAISE, RELICS, WEAPONS, type Item } from '../shared/tuning';
import { dodgeBreath } from '../sim/knacks';
import { blinkCost } from '../sim/laddermage';
import { knows } from '../sim/types';
import { grabbable } from '../sim/grab';
import { raisable } from '../sim/party';
import { risable, riseWait } from '../sim/raise';
import { RAISEW } from './raisewords';
import { cuttable } from '../sim/netter';
import { torchable } from '../sim/torch';
import { kindleable } from '../sim/kindle';
import { liftable } from '../sim/props';
import { relicLabel } from '../sim/hero';
import { castElement } from '../sim/channel';
import { CHANNEL, ELEMENT_NAME, GRAB } from '../shared/tuning';
import { SIGNS } from '../shared/signs';
import { signFor, signLeft } from '../sim/signature';
import { itemIcon, potionIcon } from './itemicons';
import { relicItemIcon } from './relicicons';
import { skillCanvas } from './skillicons';
import { icon, type IconId } from './icons';
import { paintButton, type Face } from './btnart';
import { stickVars } from './stickart';
import { BTN_SEL, KEYCAP, type BtnId } from './keycaps';
import type { Game } from './game';

const EL: Record<string, string> = { fire: '#ff9a3c', frost: '#bfe8ff', storm: '#fff27a' };
const DODGE: Record<string, IconId> = { JUMP: 'jump', DASH: 'dash', BLINK: 'blink', ROLL: 'roll' };
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
  /** Its laptop key, on its corner (keycaps.ts; hidden on a phone: keybar.css). */
  private cap = document.createElement('kbd');
  private key = '';
  constructor(id: BtnId, private extra = '') {
    this.el = document.querySelector(BTN_SEL[id]) as HTMLElement;
    this.cap.textContent = KEYCAP[id];
  }
  /** Draw `f` (only when it changed), with `secs` on the face and `label` under it. */
  show(f: Face | null, secs = '', label = '', aria = ''): void {
    this.el.hidden = !f;
    if (!f) return;
    // (Someone else set the button's words: put the picture back.)
    if (this.art.parentNode !== this.el) this.el.replaceChildren(this.art, this.cd, this.lbl, this.cap), this.el.classList.add('art');
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
    attack: new Btn('attack'), block: new Btn('block'), roll: new Btn('roll'), skill: new Btn('skill'),
    relic: new Btn('relic'), potion: new Btn('potion'), grab: new Btn('grab'), use: new Btn('use'),
    reload: new Btn('reload'), element: new Btn('element'), sign: new Btn('sign'),
  };
  private ready: Record<string, boolean> = {};
  private stick = document.querySelector('#touch .stick') as HTMLElement;
  private stickOn = false;
  private moves = 0;

  constructor() {
    stickVars();
  }

  /** `look`: a drop of yours at your feet, its card 'shut' or 'open' (lootcard.ts); '' for none. */
  update(game: Game, spot: Spot, busy: boolean, now: number, look: '' | 'shut' | 'open' = ''): void {
    const me = game.hero, room = game.room, mode = game.mode, b = this.b;
    if (!me) return;
    // The stick's resting ghost goes once you've moved a few times.
    const on = this.stick.classList.contains('on');
    if (on && !this.stickOn && ++this.moves === 3) document.body.classList.add('stick-known');
    this.stickOn = on;
    // Only a Warrior or Healer has a guard: the button is gone for a Ranger, Rogue or Mage (they dodge).
    const kit = WEAPONS[me.weapon], guard = guardOf(kit);
    if (document.body.dataset.guard !== guard) document.body.dataset.guard = guard;
    const carrying = me.act === 'carry';
    const atk = carrying ? icon('slam') : img(iconOf(me.arms[me.weapon], me.weapon));
    // Stamina pips round ATTACK; a Mage's are MAGIC, round BLINK instead (Kyle: "Those should just be around the blink").
    const mage = kit.cls === 'MAGE', st = me.stamina;
    if (document.body.dataset.mage !== String(mage)) document.body.dataset.mage = String(mage);
    const flick = me.winded && room.time - me.staminaAt < HERO.windedDelay ? Math.floor(now * 11) % 2 === 0 : false;
    // A Cleric's are FAITH, gold, round the shield of light (shared/cleric.ts FAITH).
    const cleric = kit.cls === 'HEALER';
    const pips = { lit: flick ? 0 : Math.ceil(st / 10), of: 10, col: me.winded ? '#d84a3a' : mage ? (st < 25 ? '#8f86a8' : '#cdbdf0') : cleric ? (st < 25 ? '#a89060' : '#ffd27a') : st < 25 ? '#a8a090' : '#ddd5c4' };
    b.attack.show({ shape: 'round', size: 42, grade: 'iron', icon: atk, iconScale: carrying ? 1 : 2, ...(mage || cleric ? {} : { pips }) }, '', '', carrying ? 'Slam' : 'Attack');
    b.block.show(guard === 'none' ? null : { shape: 'shield', size: 30, grade: 'iron', icon: icon('block'), ...(cleric ? { pips } : {}) }, '', '', 'Block');
    const dn = dodgeName(kit.cls), dodges = !!dodgeOf(kit);
    if (document.body.dataset.dodge !== String(dodges)) document.body.dataset.dodge = String(dodges);
    // A Mage's BLINK wears the magic pips, filling as it comes back. Winded it can't fire, so it goes dull;
    // with less magic than it costs it still fires but leaves you winded, so the cost shows in red.
    // (PERFECT BLINK halves it just after a PERFECT: sim/laddermage.ts.)
    const cost = mage ? Math.round(kit.dodge.stamina * DODGE_RULE.cost * dodgeBreath(me) * blinkCost(me, room.time)) : 0, dull = mage && (!!me.winded || st < 1);
    b.roll.show(dodges ? { shape: 'diamond', size: 34, grade: dull ? 'stone' : 'iron', icon: icon(DODGE[dn] ?? 'roll'), ...(mage ? { pips } : {}) } : null, mage && st < cost ? String(cost) : '', dn, dn);
    b.roll.el.classList.toggle('cost', mage);
    // The crossbow reloads itself now (sim/crossbow.ts): no RELOAD button.
    b.reload.show(null, '', 'RELOAD', 'Reload');
    // The class skill and the relic carried, each with its cooldown (a dark sweep and the seconds).
    const [skill, relic] = me.relics, left = (r: typeof skill) => Math.max(0, me.relicReady[r] - room.time);
    // A Mage's ELEMENT: the element it's in, its ring that colour, the switch's short cooldown as a sweep.
    const mel = mage ? castElement(me) : 'fire', ml = mage ? Math.max(0, (me.relicReady.channel ?? 0) - room.time) : 0;
    b.element.show(mage ? { shape: 'round', size: 22, grade: 'iron', icon: skillCanvas('channel', mel), ring: EL[mel], cd: ml / CHANNEL.cooldown, flash: this.flash('element', ml, room.time) } : null, '', ELEMENT_NAME[mel], 'Element: ' + ELEMENT_NAME[mel]);
    if (mage && b.element.el.dataset.el !== mel) b.element.el.dataset.el = mel;
    // A Rogue's, Ranger's or Healer's own button (shared/signs.ts), in the same spot, its wait as a sweep;
    // there once the wood has given it, and then the guard steps out to make room for it.
    const sg = signFor(me), sl = sg ? signLeft(me, room.time) : 0, given = !!sg && game.taught().includes('sign');
    b.sign.show(sg ? { shape: 'round', size: 22, grade: 'iron', icon: skillCanvas(sg, ''), cd: sl / SIGNS[sg].cooldown, flash: this.flash('sign', sl, room.time) } : null, sl > 0 ? String(Math.ceil(sl)) : '', sg ? SIGNS[sg].name : '', sg ? SIGNS[sg].name : '');
    if (document.body.dataset.sign !== String(given)) document.body.dataset.sign = String(given);
    const el = me.augments[skill];
    if (knows(me, 'skill')) {
      const l = left(skill);
      b.skill.show({ shape: 'round', size: 28, grade: 'iron', icon: skillCanvas(skill, el), ring: EL[el], cd: l / RELICS[skill].cooldown, flash: this.flash('skill', l, room.time) }, l > 0 ? String(Math.ceil(l)) : '', skillCanvas(skill, el) ? '' : RELICS[skill].short, relicLabel(me, skill));
    } else b.skill.show(null);
    const it = relic ? carriedItem(me) : undefined, dark = !!it && isDark(it);
    if (relic) {
      const l = left(relic);
      b.relic.show({ shape: 'round', size: 28, grade: dark ? 'stone' : 'iron', icon: img(relicItemIcon(it ?? ({ kind: relic, charge: 1 } as Parameters<typeof relicItemIcon>[0]))), ring: EL[me.augments[relic]], cd: dark ? 0 : l / RELICS[relic].cooldown, flash: this.flash('relic', l, room.time), uses: it ? { left: it.charge, of: relicMax(it), col: fillCol(it) } : undefined }, l > 0 && !dark ? String(Math.ceil(l)) : '', '', RELICS[relic].name);
    } else b.relic.show(null);
    // The flask is the health orb: red to your health (green when poisoned), pulsing when low, the next potion in front.
    const next = me.belt[0], hp = me.hp / me.maxHp, low = hp < 0.3 && me.hp > 0;
    b.potion.show({ shape: 'orb', size: 32, grade: next ? 'iron' : 'stone', fill: hp, liquid: me.poison ? '#5a8a2a' : '#a8261c', pulse: low && Math.floor(now * 4) % 2 === 0, icon: next ? img(potionIcon(next)) : null }, me.belt.length > 1 ? String(me.belt.length) : '', '', next ? 'Drink ' + next : 'Health');
    b.potion.el.classList.toggle('low', low);
    // The context slot: help a friend up, set a spider nest or a house's woodpile alight, grab, throw; or what's here to use.
    // (A cart standing on a rail counts: GRAB sends it rolling, sim/brake.ts and haulcarts.ts.)
    const cart = !!room.map.rail && room.props.some((p) => resting(p) && Math.hypot(p.x - me.x, p.y - me.y) <= GRAB.reach + 0.6);
    const can = carrying || (me.act === 'idle' && (room.enemies.some((e) => grabbable(me, e, room.time)) || room.props.some((p) => liftable(me, p)) || cart));
    // (At the Staithe GRAB cuts one of the netted free, or shoves the laid log in: sim/staithebits.ts.)
    const stg = mode === 'run' ? staitheGrabbable(me, room.survivors, room.map) : null, shove = stg === 'shove';
    const raise = me.act === 'idle' && raisable(me, room.heroes), cut = cuttable(me, room.heroes, room.time) || stg === 'cut' || (mode === 'run' && ropedNear(me, room.survivors));
    // A Cleric by a friend who is out: RAISE (sim/raise.ts), dim with the seconds left while its cooldown runs.
    // (Kneeling at it, the button stays lit: the raise is going on.)
    const rise = mode === 'run' && !raise && !cut ? (risable(me, room.heroes, room.time) ?? (room.heroes.some((o) => o.out && o.riseBy === me.id) ? 'ready' : null)) : null;
    const burn = !raise && (!!torchable(me, room.enemies) || (mode === 'run' && !!kindleable(me, room.map)));
    const lifter = kit.cls === 'WARRIOR', active = can || raise || rise === 'ready' || burn || cut || shove;
    // A drop at your feet with nothing else here: LOOK opens its card.
    const looking = !!look && !busy && !spot?.chest && !spot?.door;
    const use = (!!spot && !busy && (mode !== 'run' || !!spot.chest || !!spot.pet)) || looking;
    const what: IconId = raise || cut || rise ? 'help' : burn ? 'burn' : carrying ? 'throw' : 'grab';
    const word = cut ? 'CUT FREE' : shove ? STAITHE_WORDS.shove : raise ? 'HELP UP' : rise ? RAISEW.button : burn ? 'BURN' : carrying ? 'THROW' : 'GRAB';
    // (With no dodge the slot has its own place, so a USE or OPEN can show beside it.)
    const showGrab = (active || lifter || !!rise) && (!dodges || !(use && !active && mode !== 'town'));
    const wait = rise === 'wait' ? riseWait(me, room.time) : 0;
    b.grab.show(showGrab ? { shape: 'round', size: 29, grade: active ? 'gilt' : 'stone', icon: icon(what), cd: wait / RAISE.cooldown } : null, wait ? String(Math.ceil(wait)) : '', word, word);
    b.grab.el.classList.toggle('dim', !active);
    const uw = looking ? 'LOOK' : spot?.chest ? 'OPEN' : spot?.door ? 'ENTER' : spot?.pet ? 'PET' : spot?.trade ? 'TRADE' : spot?.talk && spot.talk !== 'board' && spot.talk !== 'best' && spot.talk !== 'market' && spot.talk !== 'gate' && spot.talk !== 'practice' ? 'TALK' : 'USE';
    const ui: IconId = uw === 'LOOK' ? 'use' : uw === 'OPEN' ? 'open' : uw === 'ENTER' ? 'enter' : uw === 'TALK' ? 'chat' : uw === 'PET' ? 'pet' : 'use';
    const big = mode === 'town';
    b.use.show(use && !(showGrab && active && dodges) ? { shape: 'round', size: big ? 42 : 29, grade: 'gilt', icon: icon(ui), iconScale: big ? 2 : 1 } : null, '', uw, uw);
    b.use.el.classList.toggle('chest', !!spot?.chest || looking);
    b.use.el.classList.toggle('pet', uw === 'PET');
    b.use.el.classList.toggle('on', looking && look === 'open');
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
