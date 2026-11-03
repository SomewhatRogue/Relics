/** Relic: Wickhold, the Training Yard and runs. The rooms run here in the browser (solo is a party of one). */
import { HERO, CLASS_GUARD, CLASS_DODGES, POTIONS, CLASS_ORDER, RELICS, TRAITS, WEAPONS, itemName, type HeroClass } from '../shared/tuning';
import { CLASS_NAME } from '../shared/classes';
import { LOOKS, heroLook } from './sprites';
import { ONLINE } from './relay';
import { Townfolk } from './townfolk';
import { toPx } from './world';
import { Parties } from './parties';
import { CoopGuest } from './coop';
import { session, touchSession } from './session';
import { MAX_DOWNS } from '../sim/run';
import { WayWatch, wayTarget } from './wayfind';
import { targets } from '../sim/targets';
import type { Npc } from '../shared/arena';
import { knows, type Intent } from '../sim/types';
import { Game, ME } from './game';
import { Panel } from './panels';
import { openSpot, showResult } from './townui';
import { Title } from './title';
import { Recovery } from './recovery';
import { woodGoal } from '../sim/wood';
import { LINES, ROAD_OUT } from '../shared/wood';
const WOOD_ROAD = LINES.road;
const ORLA = ["Those are *Hew's* boots.", "Ah. Well. Church is up past the Lantern, and you'll want to see Hollis after, he'll have you working before your feet are dry."];
let shownCap = '';
import { WorldLink } from './worldlink';
import { setLink } from './squareui';
import { raidNews } from './raidnews';
import { WORK_ORDER } from '../shared/works';
import { grabbable } from '../sim/grab';
import { raisable } from '../sim/party';
import { liftable } from '../sim/props';
import { relicLabel } from '../sim/hero';
import { castElement } from '../sim/channel';
import type { FightEvent } from '../sim/types';
import { Fx } from './fx';
import { watchDust } from './dust';
import { Input } from './input';
import { LootCard } from './lootcard';
import { PackView } from './pack';
import { openTree } from './treeui';
import { knackCues } from './knackcues';
import { LessonView } from './lesson';
import { Scene } from './scene';
import { Views } from './three/views';
import { options } from './options';
import { setMusic, setMuted } from './sfx';
import { Music } from './music';
import { Soundscape } from './soundscape';
import { line, speak } from './speech';
import { Chat } from './chat';
import './style.css';

const game = new Game();
/** Online (the Vercel site): the others in town. Made once there's a hero, keyed by the hero's id. */
let townfolk: Townfolk | null = null;
function online(): Townfolk | null {
  if (!ONLINE || !game.profile.id) return null;
  // Another hero picked: the old one leaves town.
  if (townfolk && townfolk.id !== game.profile.id) townfolk.leave(), (townfolk = null);
  if (!townfolk) {
    townfolk = new Townfolk(game.profile.id);
    const parties = (game.parties = new Parties(townfolk, () => ({ id: game.profile.id, name: game.profile.name })));
    // Called to a friend's job: off you go with them.
    parties.onGo = (room, job, lead) => {
      panel.hide();
      game.startRemote(new CoopGuest(room, game.profile.id, lead, () => game.profile, job));
    };
    chat.attach(townfolk);
  }
  return townfolk;
}

const scene = new Scene(document.getElementById('game') as HTMLCanvasElement);
/** The pixel scene, or the 3D view on a job when the VIEW switch says so (three/views.ts). */
const views = new Views(scene);
const fx = new Fx();
const ways = new WayWatch();
const panel = new Panel();
const input = new Input(() => views.heroScreen());
const $ = (s: string) => document.querySelector(s) as HTMLElement;
const card = new LootCard((id) => input.take(id));
const lesson = new LessonView(game, input.touch);
const pack = new PackView((op, arg) => input.gear(op, arg), () => title.open, { open: () => openTree(game, panel), picks: () => game.profile.picks, town: () => game.mode === 'town' });
const music = new Music();
const link = new WorldLink((w) => game.syncWorld(w));
game.link = link;
setLink(link);
void link.refresh(true);
const sounds = new Soundscape(music);
const recovery = new Recovery(() => game.save);
const title = new Title(game, () => undefined, recovery);
/** Chat (online): world and near in town, the party on a job. */
const chat = new Chat(game, views, input.touch, () => panel.open || title.open);
// Swore in chat: lightning out of the sky onto them (chat.ts stuns them).
chat.onStrike = (x, y) => {
  for (const dx of [-0.15, 0.1]) {
    const ev = { k: 'shock' as const, x: x + dx, y: y - 7, x2: x, y2: y };
    fx.on(ev);
    sounds.event(ev, game.room, performance.now() / 1000);
  }
  fx.shake = Math.max(fx.shake, 4);
};
// Test hook: ?hero=MAGE skips the start screen with a hero of that class.
const quick = new URLSearchParams(location.search).get('hero') as HeroClass | null;
// ...and ?wood=1 starts it in the prologue wood instead of town.
if (quick && CLASS_ORDER.includes(quick)) {
  if (game.create(quick, quick) < 0) game.choose(0);
  if (new URLSearchParams(location.search).get('wood') !== '1' && game.mode === 'wood') game.skipWood();
}
else title.show();
// A recovery code here: if another device sent these heroes on since, take that copy (only before play).
void recovery.start((s) => title.open && (game.adopt(s), title.show(), true));
/** Talk to whoever you stand by, use the spot, or go in at the door (E or F on a laptop, USE on a phone). */
const use = () => {
  const n = game.near();
  if (!n || panel.open || title.open) return;
  pack.toggle(false);
  if (n.chest) input.open(n.chest);
  else if (n.door) game.enter(n.door);
  else if (n.talk) {
    if (n.npc?.path) (talking = n.npc), (n.npc.heldAt = game.room.time);
    openSpot(n.talk, game, panel, n.arg, n.key);
  }
};
let talking: Npc | null = null;
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
// Leave the job early, for town (game.leaveJob says what that means alone, following or leading).
$('#leave').addEventListener('click', () => {
  if (game.mode !== 'run' || panel.open) return;
  const party = !!(game.remote || game.coop?.company);
  panel.show('BACK TO WICKHOLD?', `<p>${party ? LEAVE_PARTY : LEAVE_SOLO}</p>`, [
    { label: 'LEAVE', act: () => (panel.hide(), game.leaveJob()) },
    { label: 'STAY', primary: true, act: () => panel.hide() },
  ]);
});
$('#skipcut').addEventListener('click', () => game.skipCut());
$('#skipcut').addEventListener('touchstart', (e) => (e.preventDefault(), game.skipCut()), { passive: false });
$('.tb.use').addEventListener('touchstart', (e) => (e.preventDefault(), use()), { passive: false });

/** One line on how each kit guards and dodges. */
const KIT: Record<string, string> = {
  sword: 'EASY PARRY  WIDE GUARD  ROLL',
  greatsword: 'TIGHT PARRY  HEAVY ROLL',
  spear: 'BACKSTEP  KEEPS FACING',
  daggers: 'LONG DASH  ONE AT A TIME  BACKSTAB 2.5X',
  longbow: 'TAP: SHORT SWORD  HOLD 1.4S: PIERCING SHOT',
  shortbow: 'TAP: SHORT SWORD  HOLD: QUICK SHOT ON THE MOVE',
  crossbow: 'TAP: SHORT SWORD  HOLD: BOLT, LONG RELOAD',
  wand: 'QUICK SPARKS  0.6S CAST',
  staff: 'HOLD 1.6S: BURSTING ORB',
  rod: 'HOLD 1S: PIERCING LANCE',
  mace: '3RD BLOW HEALS  HOLD: SMITE',
  rapier: 'LONG REACH  DASH  HOLD: LUNGE THROUGH TWO',
  handbow: 'KNIFE  DASH  HOLD: BOLT THAT DAZES',
  censer: 'BEST GUARD  3RD BLOW BURNS AND HEALS  HOLD: WHIRL',
  flail: 'OVER SHIELDS  2ND BLOW HEALS  HOLD: SMITE CLOSE IN',
};

let parries = 0;
const townTips = input.touch
  ? ['Walk to the JOB BOARD and tap USE to take a job', 'Walk up into a door to go in. Everyone inside has something to say', 'The FORGE: Halvard upgrades your gear or melts it down for steel, and Ivo sees to your relics', 'The TRAINING HALL: perks, and the squire takes you to the yard', 'The TOWN HALL: the reeve and the council decide the chapter']
  : ['Walk to the JOB BOARD and press E to take a job', 'Walk up into a door to go in. Press E by anyone to talk', 'The FORGE: Halvard upgrades your gear or melts it down for steel, and Ivo sees to your relics', 'The TRAINING HALL: perks, and the squire takes you to the yard', 'The TOWN HALL: the reeve and the council decide the chapter'];
const tips = input.touch
  ? ['Stun or get behind a small goblin, then GRAB it', 'Warriors can GRAB barrels and tables and throw them', 'Break the oil barrel near goblins and they burn', 'Holding one: SLAM it, or THROW it at another', 'POTION drinks or throws the front of your belt', 'Traits reward skill: parries, dodges, perfect releases', 'Walk into a cottage or barn: goblins, and sometimes someone caged', 'HEALER: SANCTUARY blesses the ground and wards whoever is most hurt', 'Oil and fire burn wooden buildings down. Burn out the dens', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap BLOCK when the red flashes WHITE to PARRY', 'Hold ATTACK to charge a heavy blow', 'SKILL: every class has one. Each recharges', 'Striped circles cannot be blocked: dodge out, or walk out', 'DEEP jobs end at a named butcher. Win one for a RELIC', 'TWIN DAGGERS: dash behind a goblin and BACKSTAB', 'Push the stick part way to creep. Resting goblins see you late: hit first for an AMBUSH']
  : ['G grabs a stunned goblin (or one you got behind). Click to slam, G to throw', 'Warriors: G lifts barrels and tables. Throw them, or slam them down', 'Break the oil barrel near goblins and they burn', 'Q drinks or throws the potion at the front of your belt. Hold Q to bring the next one to the front', 'Bows: release on the white flash. Held too long, the shot weakens', 'Walk up into a cottage door to go in. Fire burns buildings down', 'Cleric: E for SANCTUARY. Blessed ground, and a ward that throws arrows back', 'Frost twice freezes. A heavy blow shatters the ice', 'Fire meets frost: STEAM. Storm on the burning: FLARE', 'Tap right click when the red flashes WHITE to PARRY', 'Hold left click to charge a heavy blow', 'E: your class skill. R: a relic, once you have won one on a DEEP job', 'Striped circles cannot be blocked: SPACE to dodge, or walk out', 'Ranger: longbow, shortbow or crossbow. Mage: wand, staff or rod', 'Daggers: dash behind a goblin and BACKSTAB', 'Hold Shift to creep. Resting goblins see you late: hit first for an AMBUSH'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  const me = game.hero, room = game.room, pr = game.profile;
  document.body.dataset.mode = game.mode;
  $('.hp i').style.width = (100 * me.hp) / me.maxHp + '%';
  $('.hp').classList.toggle('poisoned', !!me.poison);
  $('.st i').style.width = me.stamina + '%';
  $('.st').classList.toggle('low', me.stamina < 25);
  // Winded: the bar flashes, fast while nothing's coming back, slower as it refills.
  $('.st').classList.toggle('winded', !!me.winded);
  $('.st').classList.toggle('empty', !!me.winded && room.time - me.staminaAt < HERO.windedDelay);
  $('.who').textContent = `${pr.name}  ${CLASS_NAME[pr.cls]}  LV ${pr.level}`;
  const item = me.arms[me.weapon];
  $('.wpn').textContent = item ? itemName(item) : WEAPONS[me.weapon].name;
  // The block button: a Mage has none; a Ranger or Rogue only taps it to parry.
  const guard = CLASS_GUARD[WEAPONS[me.weapon].cls];
  if (document.body.dataset.guard !== guard) (document.body.dataset.guard = guard), ($('.tb.block').textContent = guard === 'parry' ? 'PARRY' : 'BLOCK');
  const kit = KIT[me.weapon] + (guard === 'none' ? '  NO GUARD' : guard === 'parry' ? '  PARRY, NO BLOCK' : '') + (WEAPONS[me.weapon].cls === 'MAGE' ? '  ' + (me.augments.channel || 'fire').toUpperCase() : '');
  $('.kit').textContent = item ? item.traits.map((t) => TRAITS[t].name).join(' + ') + '  ' + kit : kit;
  card.update(room, me, !input.touch);
  pack.update(me);
  lesson.update();
  $('#packbtn').classList.toggle('on', pack.open);
  knackCues(game, panel.open, $('#packbtn'), (x, y, s) => fx.say(toPx(x, y)[0], toPx(x, y)[1] + 14, s, '#ffd27a', 3.2));
  if (input.touch) {
    // GRAB shows only when there's something to grab (or to throw); ATTACK becomes SLAM.
    const carrying = me.act === 'carry';
    const can = carrying || (me.act === 'idle' && (room.enemies.some((e) => grabbable(me, e, room.time)) || room.props.some((p) => liftable(me, p))));
    // A Warrior always has GRAB (dimmed till there's something to take hold of); others only when there is.
    const lifter = WEAPONS[me.weapon].cls === 'WARRIOR';
    // The dodge button says what your dodge is.
    $('.tb.roll').textContent = ({ roll: 'ROLL', backstep: 'JUMP', dash: 'DASH', blink: 'BLINK' } as Record<string, string>)[WEAPONS[me.weapon].dodge.kind] ?? 'ROLL';
    // A Warrior or Healer has no dodge, so no button for one.
    $('.tb.roll').hidden = !CLASS_DODGES[WEAPONS[me.weapon].cls];
    // By a friend who's down, GRAB helps them up.
    const raise = me.act === 'idle' && raisable(me, room.heroes);
    $('.tb.grab').hidden = !can && !lifter && !raise;
    $('.tb.grab').classList.toggle('dim', !can && !raise);
    $('.tb.grab').classList.toggle('raise', raise);
    $('.tb.grab').textContent = raise ? 'HELP UP' : carrying ? 'THROW' : 'GRAB';
    $('.tb.attack').textContent = carrying ? 'SLAM' : 'ATTACK';
  }
  // The class skill (E, SKILL) and the relic carried, if any (R, RELIC), each with its cooldown.
  const [skill, relic] = me.relics, left = (r: typeof skill) => Math.max(0, me.relicReady[r] - room.time);
  const tag = (r: typeof skill) => relicLabel(me, r) + (left(r) > 0 ? ' ' + left(r).toFixed(1) : '');
  // (A skill your trainer hasn't taught you yet has no button.)
  const known = knows(me, 'skill');
  $('.rlc').textContent = known ? (input.touch ? '' : 'E ') + tag(skill) : '';
  // (The Mage's channel shows the element its spells are in now, in that colour.)
  const skillEl = skill === 'channel' ? castElement(me) : me.augments[skill];
  $('.rlc').dataset.el = skillEl;
  $('.rcd').textContent = relic ? (input.touch ? '' : 'R ') + tag(relic) : '';
  $('.rcd').classList.toggle('wait', !!relic && left(relic) > 0);
  if (input.touch) {
    const sb = $('.tb.relic'), rb = $('.tb.relic2');
    sb.hidden = !known;
    sb.textContent = skill === 'channel' ? relicLabel(me, skill) : RELICS[skill].short;
    sb.dataset.el = skillEl;
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
  // On a job, near the top of a room (where the way on is), the banner fades so it doesn't hide the exit.
  $('#banner').classList.toggle('faint', game.mode === 'run' && game.hero.y < 7);
  if (game.mode === 'wood' && wood) {
    const g = woodGoal(wood, input.touch);
    $('#banner').innerHTML = `<b>${g.title}</b> ${g.text}<span>GREYHOLLOW, THE DAY AFTER</span>`;
    const boss = room.enemies.find((e) => e.name && e.act !== 'dead');
    $('#boss').hidden = !boss || wood.cut >= 0;
    if (boss) ($('#boss b').textContent = boss.name!), ($('#boss i').style.width = (100 * boss.hp) / boss.maxHp + '%');
  } else if (game.mode === 'run' && run) {
    const g = { text: me.out ? OUT_TEXT : game.goalText() };
    // Alone, the times you can still get up (a heart each); in a party, your one get-up of the job.
    const solo = room.heroes.filter((x) => x.id !== 'squire').length < 2, ups = MAX_DOWNS - run.downs;
    const hearts = `  <i class="ups">${solo ? '\u2665'.repeat(Math.max(0, ups)) + '\u2661'.repeat(Math.min(MAX_DOWNS, run.downs)) : me.selfUp ? '\u2661' : '\u2665'}</i>`;
    $('#banner').innerHTML = `<b>${run.job.place.name.toUpperCase()} ${run.index + 1}/${run.job.rooms}</b> ${g.text}<span>+${run.gold} GOLD${hearts}${run.rescued ? `  SAVED ${run.rescued}` : ''}</span>`;
    const boss = room.enemies.find((e) => e.name && e.act !== 'dead');
    $('#boss').hidden = !boss;
    if (boss) ($('#boss b').textContent = boss.name!), ($('#boss i').style.width = (100 * boss.hp) / boss.maxHp + '%');
  } else {
    $('#boss').hidden = true;
    $('#banner').innerHTML = game.outside
      ? `<b>${room.map.name}</b> Walk out at the bottom<span>${pr.gold} GOLD  LEVEL ${pr.level}</span>`
      : game.mode === 'town'
      ? `<b>WICKHOLD</b> DAY ${game.world.day}<span>${pr.gold} GOLD  LEVEL ${pr.level}${pr.picks ? '  (A KNACK TO PICK)' : ''}  ${game.world.rescued} HOME${link.online ? '  WORLD ' + link.group.toUpperCase() : ''}</span>`
      : `<b>TRAINING YARD</b> Walk out at the bottom to go back to town`;
  }
  const spot = game.near(), busy = panel.open || title.open;
  $('#prompt').hidden = !spot || busy;
  if (spot) $('#prompt').textContent = (input.touch ? '' : spot?.chest ? 'F  ' : game.mode === 'run' ? '' : 'E  ') + (spot.door || !spot.talk ? spot.label : 'TALK: ' + spot.label);
  // A friend down at your feet: the key that gets them up.
  if (!spot && !busy && !input.touch && game.mode === 'run' && game.hero.act === 'idle' && raisable(game.hero, game.room.heroes)) ($('#prompt').hidden = false), ($('#prompt').textContent = 'G  HELP UP');
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

/** The LEAVE button's question, alone and in a party. */
const LEAVE_SOLO = "The job's lost if you go, and you keep half the gold you've picked up.";
const LEAVE_PARTY = "Your party carries on without you, and you keep the gold you've picked up.";

/** On the banner once you're out of a job (your party carries on without you). */
const OUT_TEXT = "You're out till the job's done. Your party carries on";

let last = performance.now();
let still: Intent | null = null;
let resumed = '', touchedAt = 0;
function tick(t: number): void {
  // (The first frame can stamp a hair before the page clock: never step backwards.)
  const dt = Math.max(0, Math.min(0.1, (t - last) / 1000));
  last = t;
  // With a panel up, the hero stands still (and no press is spent).
  const live = input.read();
  if (panel.open || title.open || chat.typing || pack.open) still ??= { ...live, mx: 0, my: 0, attack: false, block: false };
  else still = null;
  // With the pack open the hero stands still too, but what you change in it still goes to the room.
  if (still && pack.open && !panel.open) still = { ...still, gearOp: live.gearOp, gearArg: live.gearArg, gearSeq: live.gearSeq };
  // Whoever you're talking to stops their round till you're done (the world doesn't: it's shared).
  if (talking && !panel.open) (talking.lag = (talking.lag ?? 0) + game.room.time - (talking.heldAt ?? game.room.time)), (talking.heldAt = undefined), (talking = null);
  // Back after a reload in the middle of a job with friends: straight back in (once, once a hero's chosen).
  // Or a job that ended while this hero was away (or fell apart): whatever it still owes them, paid once.
  if (resumed !== game.profile.id && game.profile.id && !title.open && game.mode === 'town') {
    resumed = game.profile.id;
    const s = ONLINE ? session(game.profile.id) : null;
    if (s) game.resume(s);
    else void game.settle();
  }
  if ((game.coop || game.remote) && t - touchedAt > 20000) (touchedAt = t), touchSession();
  // Following a friend's job: my input goes to them.
  game.remote?.frame(t / 1000, game.own(still ?? live));
  const evs = game.step(dt, still ?? live);
  // Leading one: the room goes out to the party.
  game.coop?.frame(t / 1000);
  for (const ev of evs) {
    fx.on(ev);
    // Down alone on a job: how many more times you'll get up.
    if (ev.k === 'down' && game.mode === 'run' && game.run && game.room.heroes.filter((x) => x.id !== 'squire').length < 2 && Math.abs(ev.x - game.hero.x) < 0.01) {
      const left = MAX_DOWNS - game.run.downs;
      const [sx, sy] = toPx(ev.x, ev.y);
      fx.say(sx, sy - 34, left > 0 ? `${'\u2665'.repeat(left)} LEFT` : 'DRIVEN BACK', '#ff6a7a');
    }
    sounds.event(ev, game.room, t / 1000);
    if (ev.k === 'parry') parries++;
  }
  sounds.frame(game, t / 1000);
  watchDust(game.room, fx);
  // Back in the open in town: see what the world has been up to (at most every 30 s).
  if (game.mode === 'town' && !game.outside) void link.refresh();
  if (game.result && !panel.open) showResult(game, panel);
  // Out of the wood: Orla at the gate.
  if (game.greeting === 'orla' && !panel.open) (game.greeting = null), panel.show('ORLA OF THE WATCH', `<p class="dim">${line(WOOD_ROAD)}</p><p><b>Orla:</b> ${line(`"${ORLA[0]}"`, 'ORLA')}</p><p>She looks at your feet a long while.</p><p><b>Orla:</b> ${line(`"${ORLA[1]}"`, 'ORLA')}</p>`, [{ label: 'INTO WICKHOLD', primary: true, act: () => panel.hide() }], true);
  // Back to a town the hungry raided while you were away: Dunn tells you, the first time you see it.
  else if (game.mode === 'town' && !game.outside && !panel.open && !title.open && !game.result) {
    const news = raidNews(game.world);
    if (news) panel.show(news.title, news.html, [{ label: 'CLOSE', primary: true, act: () => panel.hide() }], true);
  }
  fx.update(dt);
  scene.focus = game.cutFocus();
  scene.fanfare = game.wood?.hold?.kind === 'relic';
  scene.marks = game.mode === 'run' ? targets(game.run, game.room, game.houses()) : [];
  scene.doors = game.mode === 'run' ? game.doorMarks() : [];
  scene.pointTo = game.wood && game.wood.stage === 5 && !game.wood.hold ? { x: ROAD_OUT.x + 1, y: ROAD_OUT.y + ROAD_OUT.h / 2 } : wayTarget(game);
  // The way on just opened: say which way, over you.
  const opened = ways.check(game);
  if (opened && game.hero) {
    const [sx, sy] = toPx(game.hero.x, game.hero.y);
    fx.say(sx, sy - 40, opened, '#ffd27a', 2.6);
  }
  // Online: everyone else in Wickhold, while you're there.
  const inTown = game.mode === 'town', h = game.hero;
  online()?.step(inTown && h ? { n: game.profile.name, w: h.weapon, l: h.look ?? 0, at: game.room.map.name, p: [h.x, h.y, h.fx, h.fy, h.moving ? 1 : 0] } : null, t / 1000, dt);
  // (Off screen, leading a job in the background: nothing to draw.)
  if (document.hidden) return;
  views.render(game.room, ME, fx, t / 1000, dt, inTown ? (townfolk?.here(game.room.map.name) ?? []) : [], game.mode === 'run');
  hud(t / 1000);
  chat.frame();
}

function frame(t: number): void {
  if (!document.hidden) tick(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Leading a job with this page out of sight (another tab, another app): the browser stops drawing
// frames, but your friends' room still has to run, so it runs here on a timer, catching up in
// tenth-of-a-second steps however late the browser lets the timer fire.
setInterval(() => {
  if (!document.hidden || !game.coop) return;
  const now = performance.now();
  for (let n = 0; now - last > 120 && n < 40; n++) tick(last + 100);
  tick(now);
}, 100);

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
options();
if (input.touch) document.body.classList.add('touch');

// Test hooks: read the fight as data, never as pixels.
const w = window as unknown as Record<string, unknown>;
w.__town = () => ({ count: townfolk?.count ?? 0, here: townfolk?.here(game.room.map.name).map((h) => ({ name: h.tag, x: h.x, y: h.y })) ?? [] });
w.__GAME_STATE__ = () => ({ mode: game.mode, wood: game.wood ? { wake: game.wood.wake, said: game.wood.said, stage: game.wood.stage, hold: game.wood.hold } : null, inside: game.outside ? game.room.map.name : null, title: title.open, time: game.room.time, hero: { ...game.hero }, enemies: game.room.enemies.map((e) => ({ ...e })), parries, run: game.run, profile: game.profile, world: game.world });
w.render_game_to_text = () => `${game.mode} t=${game.room.time.toFixed(1)} hero ${game.hero.act} hp ${game.hero.hp} st ${Math.round(game.hero.stamina)} | ` + game.room.enemies.map((e) => `${e.kind} ${e.act} hp ${e.hp}${e.attack ? ' ' + e.attack.kind + ' ' + e.attack.t.toFixed(2) : ''}`).join(' | ');
Object.defineProperty(w, '__room', { get: () => game.room });
w.__game = game;
w.__views = views;
w.__chat = chat.hooks();
w.__works = WORK_ORDER;
w.__music = music;
// Listening: a stretch of any piece rendered offline (scripts/listen.cjs). Loaded only when asked.
w.__renderMusic = (...a: Parameters<typeof import('./musicrender').renderMusic>) => import('./musicrender').then((m) => m.renderMusic(...a));
w.__title = title;
w.__panel = panel;
w.__pack = pack;
w.__openTree = () => openTree(game, panel);
w.__openSpot = (id: string, arg = 0, key = '') => openSpot(id as never, game, panel, arg, key);
// A job on a village street (houses to go into), for the party tests to set out on.
w.__villageJob = (seed = 7) => import('../shared/jobs').then((m) => ({ ...m.board(1)[0], place: m.PLACES.find((p) => p.kind === 'village')!, objective: 'hunt', boss: 'SKARN', rooms: 3, seed, deep: false }));
// Look sheets for screenshots: every hero, the Warrior's options, and a dark copy with only the glow lit.
w.__looks = () => Object.fromEntries(Object.keys(LOOKS).map((k) => [k, [0, 1, 2].map((i) => heroLook(k as HeroClass, i).down.c.toDataURL())]));
