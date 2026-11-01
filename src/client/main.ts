/** Relic: Wickhold, the Training Yard and runs. The rooms run here in the browser (solo is a party of one). */
import { CLASS_GUARD, POTIONS, CLASS_ORDER, RELICS, TRAITS, WEAPONS, itemName, type HeroClass } from '../shared/tuning';
import { MAX_DOWNS, goal } from '../sim/run';
import type { Intent } from '../sim/types';
import { Game, ME } from './game';
import { Panel } from './panels';
import { openSpot, showResult } from './townui';
import { Title } from './title';
import { woodGoal } from '../sim/wood';
import { LINES } from '../shared/wood';
const WOOD_ROAD = LINES.road;
const ORLA = ["Those are *Hew's* boots.", "Ah. Well. Church is up past the Lantern, and you'll want to see Hollis after, he'll have you working before your feet are dry."];
let shownCap = '';
import { WorldLink } from './worldlink';
import { setLink } from './squareui';
import { grabbable } from '../sim/grab';
import { liftable } from '../sim/props';
import { relicLabel } from '../sim/hero';
import type { FightEvent } from '../sim/types';
import { Fx } from './fx';
import { Input } from './input';
import { LootCard } from './lootcard';
import { PackView } from './pack';
import { LessonView } from './lesson';
import { Scene } from './scene';
import { setMusic, setMuted } from './sfx';
import { Music } from './music';
import { Soundscape } from './soundscape';
import { line, speak } from './speech';
import './style.css';

const game = new Game();
const scene = new Scene(document.getElementById('game') as HTMLCanvasElement);
const fx = new Fx();
const panel = new Panel();
const input = new Input(() => scene.heroScreen());
const $ = (s: string) => document.querySelector(s) as HTMLElement;
const card = new LootCard((id) => input.take(id));
const lesson = new LessonView(game, input.touch);
const pack = new PackView((op, arg) => input.gear(op, arg), () => title.open);
const music = new Music();
const link = new WorldLink((w) => game.syncWorld(w));
game.link = link;
setLink(link);
void link.refresh(true);
const sounds = new Soundscape(music);
const title = new Title(game, () => undefined);
// Test hook: ?hero=MAGE skips the start screen with a hero of that class.
const quick = new URLSearchParams(location.search).get('hero') as HeroClass | null;
// ...and ?wood=1 starts it in the prologue wood instead of town.
if (quick && CLASS_ORDER.includes(quick)) {
  if (game.create(quick, quick) < 0) game.choose(0);
  if (new URLSearchParams(location.search).get('wood') !== '1' && game.mode === 'wood') game.skipWood();
}
else title.show();
/** Talk to whoever you stand by, use the spot, or go in at the door (E or F on a laptop, USE on a phone). */
const use = () => {
  const n = game.near();
  if (!n || panel.open || title.open) return;
  if (n.chest) input.open(n.chest);
  else if (n.door) game.enter(n.door);
  else if (n.talk) openSpot(n.talk, game, panel, n.arg, n.key);
};
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest('input')) return;
  const k = e.key.toLowerCase();
  if (game.wood && game.wood.cut >= 0 && (k === 'escape' || k === ' ' || k === 'enter')) return game.skipCut();
  if (game.wood?.hold && k === 'enter') return lesson.go();
  if (k === 'f' && card.current >= 0) input.take(card.current);
  else if (k === 'f' && game.near()?.chest) use();
  else if ((k === 'e' || k === 'f') && game.mode === 'town') use();
  if (k === 'escape' && panel.open && !game.result) panel.hide();
});
$('#heroes').addEventListener('click', () => {
  if (game.mode !== 'run' && !panel.open) pack.toggle(false), title.show();
});
$('#packbtn').addEventListener('click', () => pack.toggle());
$('#skipcut').addEventListener('click', () => game.skipCut());
$('#skipcut').addEventListener('touchstart', (e) => (e.preventDefault(), game.skipCut()), { passive: false });
$('.tb.use').addEventListener('touchstart', (e) => (e.preventDefault(), use()), { passive: false });

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
const townTips = input.touch
  ? ['Walk to the JOB BOARD and tap USE to take a job', 'Walk up into a door to go in. Everyone inside has something to say', 'The FORGE: Halvard sells weapons, Ivo fits elements', 'The TRAINING HALL: perks, and the squire takes you to the yard', 'The TOWN HALL: the reeve and the council decide the chapter']
  : ['Walk to the JOB BOARD and press E to take a job', 'Walk up into a door to go in. Press E by anyone to talk', 'The FORGE: Halvard sells weapons, Ivo fits elements', 'The TRAINING HALL: perks, and the squire takes you to the yard', 'The TOWN HALL: the reeve and the council decide the chapter'];
const tips = input.touch
  ? ['Stun or get behind a small goblin, then GRAB it', 'Warriors can GRAB barrels and tables and throw them', 'Break the oil barrel near goblins and they burn', 'Holding one: SLAM it, or THROW it at another', 'POTION drinks or throws the front of your belt', 'Traits reward skill: parries, dodges, perfect releases', 'Walk into a cottage or barn: goblins, and sometimes someone caged', 'HEALER: SANCTUARY blesses the ground and wards whoever is most hurt', 'Oil and fire burn wooden buildings down. Burn out the dens', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap BLOCK when the red flashes WHITE to PARRY', 'Hold ATTACK to charge a heavy blow', 'SKILL: every class has one. Each recharges', 'Striped circles cannot be blocked: ROLL out', 'DEEP jobs end at a named butcher. Win one for a RELIC', 'TWIN DAGGERS: roll behind a goblin and BACKSTAB']
  : ['G grabs a stunned goblin (or one you got behind). Click to slam, G to throw', 'Warriors: G lifts barrels and tables. Throw them, or slam them down', 'Break the oil barrel near goblins and they burn', 'Q drinks or throws the potion at the front of your belt', 'Bows: release on the white flash. Held too long, the shot weakens', 'Walk up into a cottage door to go in. Fire burns buildings down', 'Healer: E for SANCTUARY. Blessed ground, and a ward that throws arrows back', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap right click when the red flashes WHITE to PARRY', 'Hold left click to charge a heavy blow', 'E: your class skill. R: a relic, once you have won one on a DEEP job', 'Striped circles cannot be blocked: SPACE to roll', 'Ranger: longbow, shortbow or crossbow. Mage: wand, staff or rod', 'Daggers: roll behind a goblin and BACKSTAB'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  const me = game.hero, room = game.room, pr = game.profile;
  document.body.dataset.mode = game.mode;
  $('.hp i').style.width = (100 * me.hp) / me.maxHp + '%';
  $('.st i').style.width = me.stamina + '%';
  $('.st').classList.toggle('low', me.stamina < 25);
  $('.who').textContent = `${pr.name}  ${pr.cls}  LV ${pr.level}`;
  const item = me.arms[me.weapon];
  $('.wpn').textContent = item ? itemName(item) : WEAPONS[me.weapon].name;
  // The block button: a Mage has none; a Ranger or Rogue only taps it to parry.
  const guard = CLASS_GUARD[WEAPONS[me.weapon].cls];
  if (document.body.dataset.guard !== guard) (document.body.dataset.guard = guard), ($('.tb.block').textContent = guard === 'parry' ? 'PARRY' : 'BLOCK');
  $('.kit').textContent = item ? item.traits.map((t) => TRAITS[t].name).join(' + ') + '  ' + KIT[me.weapon] : KIT[me.weapon];
  card.update(room, me, !input.touch);
  pack.update(me);
  lesson.update();
  $('#packbtn').classList.toggle('on', pack.open);
  if (input.touch) {
    // GRAB shows only when there's something to grab (or to throw); ATTACK becomes SLAM.
    const carrying = me.act === 'carry';
    const can = carrying || (me.act === 'idle' && (room.enemies.some((e) => grabbable(me, e, room.time)) || room.props.some((p) => liftable(me, p))));
    $('.tb.grab').hidden = !can;
    $('.tb.grab').textContent = carrying ? 'THROW' : 'GRAB';
    $('.tb.attack').textContent = carrying ? 'SLAM' : 'ATTACK';
  }
  // The class skill (E, SKILL) and the relic carried, if any (R, RELIC), each with its cooldown.
  const [skill, relic] = me.relics, left = (r: typeof skill) => Math.max(0, me.relicReady[r] - room.time);
  const tag = (r: typeof skill) => relicLabel(me, r) + (left(r) > 0 ? ' ' + left(r).toFixed(1) : '');
  $('.rlc').textContent = (input.touch ? '' : 'E ') + tag(skill);
  $('.rlc').dataset.el = me.augments[skill];
  $('.rcd').textContent = relic ? (input.touch ? '' : 'R ') + tag(relic) : '';
  $('.rcd').classList.toggle('wait', !!relic && left(relic) > 0);
  if (input.touch) {
    const sb = $('.tb.relic'), rb = $('.tb.relic2');
    sb.textContent = RELICS[skill].short;
    sb.dataset.el = me.augments[skill];
    sb.style.setProperty('--cd', 100 * (1 - left(skill) / RELICS[skill].cooldown) + '%');
    rb.hidden = !relic;
    if (relic) (rb.textContent = RELICS[relic].short), (rb.dataset.el = me.augments[relic]), rb.style.setProperty('--cd', 100 * (1 - left(relic) / RELICS[relic].cooldown) + '%');
  }
  // The belt: the potion that's next (Q, POTION) and how many more.
  const next = me.belt[0];
  $('.belt').textContent = next ? (input.touch ? '' : 'Q ') + POTIONS[next].short + (me.belt.length > 1 ? `  +${me.belt.length - 1}` : '') : '';
  if (input.touch) {
    const pb = $('.tb.potion');
    pb.hidden = !next;
    if (next) (pb.textContent = POTIONS[next].short), (pb.style.borderColor = POTIONS[next].col);
  }
  // The banner: where you are and what you're doing.
  const run = game.run;
  // The wood: the lesson and its control, how far along; Hew's words; the bars in the cutscene.
  document.body.dataset.taught = game.taught().join(' ');
  const wood = game.wood;
  document.body.classList.toggle('cutscene', !!wood && wood.cut >= 0);
  // Praise shows as a caption while the fight stops for it.
  const praise = wood?.hold?.kind === 'praise' ? { who: wood.hold.who, text: wood.hold.text } : null;
  const cap = praise ?? (wood?.caption && wood.caption.until > room.time ? wood.caption : null);
  $('#caption').classList.toggle('praise', !!praise);
  // (A lesson card or a freeze-frame says it all; the caption waits.)
  $('#caption').hidden = !cap || (!!wood?.hold && wood.hold.kind !== 'praise');
  const capKey = cap ? cap.who + cap.text : '';
  if (cap && capKey !== shownCap) $('#caption').innerHTML = (cap.who ? `<b>${cap.who}</b>` : '') + '<span></span>', speak($('#caption').querySelector('span')!, cap.text, cap.who);
  shownCap = capKey;
  $('#skipcut').hidden = !wood || wood.cut < 0 || !pr.cutSeen;
  if (game.mode === 'wood' && wood) {
    const g = woodGoal(wood, input.touch);
    $('#banner').innerHTML = `<b>${g.title}</b> ${g.text}<span>GREYHOLLOW, THE DAY AFTER</span>`;
    const boss = room.enemies.find((e) => e.name && e.act !== 'dead');
    $('#boss').hidden = !boss || wood.cut >= 0;
    if (boss) ($('#boss b').textContent = boss.name!), ($('#boss i').style.width = (100 * boss.hp) / boss.maxHp + '%');
  } else if (game.mode === 'run' && run) {
    const g = goal(run, game.fightRoom);
    $('#banner').innerHTML = `<b>${run.job.place.name.toUpperCase()} ${run.index + 1}/${run.job.rooms}</b> ${g.text}<span>+${run.gold} GOLD  DOWNS ${run.downs}/${MAX_DOWNS}${run.rescued ? `  SAVED ${run.rescued}` : ''}</span>`;
    const boss = room.enemies.find((e) => e.name && e.act !== 'dead');
    $('#boss').hidden = !boss;
    if (boss) ($('#boss b').textContent = boss.name!), ($('#boss i').style.width = (100 * boss.hp) / boss.maxHp + '%');
  } else {
    $('#boss').hidden = true;
    $('#banner').innerHTML = game.outside
      ? `<b>${room.map.name}</b> Walk out at the bottom<span>${pr.gold} GOLD  LEVEL ${pr.level}</span>`
      : game.mode === 'town'
      ? `<b>WICKHOLD</b> DAY ${game.world.day}<span>${pr.gold} GOLD  LEVEL ${pr.level}${pr.picks ? '  (FIND YOUR TRAINER)' : ''}  ${game.world.rescued} HOME${link.online ? '  WORLD ' + link.group.toUpperCase() : ''}</span>`
      : `<b>TRAINING YARD</b> Walk out at the bottom to go back to town`;
  }
  const spot = game.near(), busy = panel.open || title.open;
  $('#prompt').hidden = !spot || busy;
  if (spot) $('#prompt').textContent = (input.touch ? '' : spot?.chest ? 'F  ' : game.mode === 'run' ? '' : 'E  ') + (spot.door || !spot.talk ? spot.label : 'TALK: ' + spot.label);
  $('.tb.use').hidden = !spot || busy;
  $('.tb.use').classList.toggle('chest', !!spot?.chest);
  if (spot) $('.tb.use').textContent = spot.chest ? 'OPEN' : spot.door ? 'ENTER' : spot.talk && spot.talk !== 'board' && spot.talk !== 'market' && spot.talk !== 'gate' ? 'TALK' : 'USE';
  const list = game.mode === 'town' ? townTips : tips;
  if (now - tipAt > 6) {
    tipAt = now;
    $('#tip').textContent = list[tipI++ % list.length];
  }
  $('#tip').classList.toggle('gone', game.mode === 'run' || (game.mode === 'yard' && parries >= 3));
}

let last = performance.now();
let still: Intent | null = null;
function frame(t: number): void {
  // (The first frame can stamp a hair before the page clock: never step backwards.)
  const dt = Math.max(0, Math.min(0.1, (t - last) / 1000));
  last = t;
  // With a panel up, the hero stands still (and no press is spent).
  const live = input.read();
  if (panel.open || title.open) still ??= { ...live, mx: 0, my: 0, attack: false, block: false };
  else still = null;
  for (const ev of game.step(dt, still ?? live)) {
    fx.on(ev);
    sounds.event(ev, game.room, t / 1000);
    if (ev.k === 'parry') parries++;
  }
  sounds.frame(game, t / 1000);
  // Back in the open in town: see what the world has been up to (at most every 30 s).
  if (game.mode === 'town' && !game.outside) void link.refresh();
  if (game.result && !panel.open) showResult(game, panel);
  // Out of the wood: Orla at the gate.
  if (game.greeting === 'orla' && !panel.open) (game.greeting = null), panel.show('ORLA OF THE WATCH', `<p class="dim">${line(WOOD_ROAD)}</p><p><b>Orla:</b> "${line(ORLA[0], 'ORLA')}"</p><p>She looks at your feet a long while.</p><p><b>Orla:</b> "${line(ORLA[1], 'ORLA')}"</p>`, [{ label: 'INTO WICKHOLD', primary: true, act: () => panel.hide() }], true);
  fx.update(dt);
  scene.focus = game.cutFocus();
  scene.render(game.room, ME, fx, t / 1000, dt);
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
// Music has its own switch, remembered on this device.
let musicOn = true;
try {
  musicOn = localStorage.getItem('relic.music') !== '0';
} catch {
  /* no storage */
}
const musicSwitch = (on: boolean) => {
  musicOn = on;
  setMusic(on);
  $('#music').classList.toggle('off', !on);
  try {
    localStorage.setItem('relic.music', on ? '1' : '0');
  } catch {
    /* this session only */
  }
};
musicSwitch(musicOn);
$('#music').addEventListener('click', () => musicSwitch(!musicOn));
// Tips are off unless switched on; the choice is remembered on this device.
const tipsOn = (on: boolean) => {
  document.body.classList.toggle('tips', on);
  $('#tips').classList.toggle('off', !on);
  try {
    localStorage.setItem('relic.tips', on ? '1' : '0');
  } catch {
    /* no storage: this session only */
  }
};
let tipsWanted = false;
try {
  tipsWanted = localStorage.getItem('relic.tips') === '1';
} catch {
  /* no storage */
}
tipsOn(tipsWanted);
$('#tips').addEventListener('click', () => tipsOn(!document.body.classList.contains('tips')));
$('#help').addEventListener('click', () => $('#how').toggleAttribute('hidden'));
$('#how').addEventListener('click', () => $('#how').setAttribute('hidden', ''));
if (input.touch) document.body.classList.add('touch');

// Test hooks: read the fight as data, never as pixels.
const w = window as unknown as Record<string, unknown>;
w.__GAME_STATE__ = () => ({ mode: game.mode, wood: game.wood ? { wake: game.wood.wake, said: game.wood.said, stage: game.wood.stage, hold: game.wood.hold } : null, inside: game.outside ? game.room.map.name : null, title: title.open, time: game.room.time, hero: { ...game.hero }, enemies: game.room.enemies.map((e) => ({ ...e })), parries, run: game.run, profile: game.profile, world: game.world });
w.render_game_to_text = () => `${game.mode} t=${game.room.time.toFixed(1)} hero ${game.hero.act} hp ${game.hero.hp} st ${Math.round(game.hero.stamina)} | ` + game.room.enemies.map((e) => `${e.kind} ${e.act} hp ${e.hp}${e.attack ? ' ' + e.attack.kind + ' ' + e.attack.t.toFixed(2) : ''}`).join(' | ');
Object.defineProperty(w, '__room', { get: () => game.room });
w.__game = game;
w.__music = music;
w.__title = title;
w.__panel = panel;
w.__openSpot = (id: string, arg = 0, key = '') => openSpot(id as never, game, panel, arg, key);
