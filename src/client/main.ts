/** Relic: Wickhold, the Training Yard and runs. The rooms run here in the browser (solo is a party of one). */
import { deepTestHero } from './deeptest';
import { store } from './save';
import { normName } from '../shared/names';
import { claimName } from './names';
import { Trial } from './trial';
import { forceIdle, pokeIdle } from './idles';
import { petFrame, petReact, startPet, stopPet } from './petting';
import { pointAt } from './houndname';
import { touchedIdle } from './idlepoke';
import { SIGNS, SIGN_KEY } from '../shared/signs';
import { signFor, signLeft } from '../sim/signature';
import { ExpedUi } from './expedui';
import { expedition, fenmere, goalWords, hangmansWood } from '../shared/expedjob';
import { openCut, stressJob } from '../shared/instances';
import { stretchOf } from '../sim/stretches';
import { barnHunt } from '../shared/bossjobs';
import { plateOf } from '../sim/bossplate';
import { showPlate } from './bossplate';
import { spellCost } from '../sim/spells';
import { carriedItem } from '../sim/charge';
import { isDark } from '../shared/relicitems';
import { chargePips } from './reliccard';
import { RELICW } from './relicwords';
import { hookLitBadge } from './litbadge';
import { setVotes } from './voteboards';
import { HERO, LAGCOMP, dodgeName, dodgeOf, POTIONS, CLASS_ORDER, RELICS, TRAITS, WEAPONS, itemName, type HeroClass } from '../shared/tuning';
import { CLASS_NAME } from '../shared/classes';
import { barWord } from '../shared/barword';
import { LOOKS, heroLook } from './sprites';
import { ONLINE, fullForTest, onFull } from './relay';
import { sayFull } from './netline';
import { Townfolk } from './townfolk';
import { Trades } from './tradeui';
import { presence } from './townpresence';
import { parkOf } from './parked';
import { openFishing } from './fishmode';
import { openRange } from './rangemode';
import { openArm } from './armmode';
import { openKnives } from './knifemode';
import { openAnvil } from './anvilmode';
import { openShift } from './shiftmode';
import { armFoe } from '../shared/armtune';
import { strawFx } from './strawman';
import { toPx } from './world';
import { Parties } from './parties';
import { Lobby } from './lobby';
import { session, touchSession } from './session';
import { MAX_DOWNS } from '../sim/run';
import { WayWatch, wayTarget } from './wayfind';
import { targets } from '../sim/targets';
import type { Npc } from '../shared/arena';
import { knows, type Hero, type Intent } from '../sim/types';
import { isCleric } from '../sim/mercy';
import { Game, ME } from './game';
import { Panel } from './panels';
import { openSpot } from './townui';
import { showResult } from './recap';
import { showCheckpoint, refreshVotes } from './deepui';
import { DEEP_WORDS } from './deepwords';
import { isDeep } from '../shared/deep';
import { RelicPop } from './relicmoment';
import { Title } from './title';
import { Recovery } from './recovery';
import { woodGoal } from '../sim/wood';
import { LINES, ROAD_OUT } from '../shared/wood';
import { spoken } from '../sim/woodguard';
const WOOD_ROAD = LINES.road;
let shownCap = '';
import { commission } from './statuebuy';
import { WorldLink } from './worldlink';
import { setLink } from './squareui';
import { raidNews } from './raidnews';
import { WORK_ORDER } from '../shared/works';
import { grabbable } from '../sim/grab';
import { raisable } from '../sim/party';
import { risable, riseWait } from '../sim/raise';
import { RAISEW } from './raisewords';
import { cuttable } from '../sim/netter';
import { torchable } from '../sim/torch';
import { kindleable } from '../sim/kindle';
import { staitheCalls } from './staithecalls';
import { staitheGrabbable } from '../sim/staithebits';
import { STAITHE_WORDS } from '../shared/staithewords';
import { burningCries, kindleCue } from './kindlecue';
import { kindling } from '../shared/kindling';
import { liftable } from '../sim/props';
import { relicLabel } from '../sim/hero';
import { castElement } from '../sim/channel';
import type { FightEvent } from '../sim/types';
import { Fx } from './fx';
import { rats } from './rats';
import { DreadView } from './dreadfx';
import { watchDust } from './dust';
import { watchWater } from './wetwatch';
import { Input } from './input';
import { HideWatch } from './hidehost';
import { noteFrame } from './netq';
import { LootCard } from './lootcard';
import { RollCard } from './rollcard';
import { PackView } from './pack';
import { openTree } from './treeui';
import { knackCues } from './knackcues';
import { LessonView } from './lesson';
import { Scene } from './scene';
import { Views } from './three/views';
import { options } from './options';
import { setMusic, setMuted } from './sfx';
import { Music } from './music';
import { heroVoices, primeSpot, townVoice, voiceClock } from './voiceplay';
import { setVoices, voicesOn } from './voicebus';
import { personAt } from './voicebank';
import { idleHook } from './idlepose';
import { carriesHungry } from '../shared/fence';
import { Soundscape } from './soundscape';
// The recorded sound effects in place of the synthesized ones as they load (sfxroutes.ts).
import './sfxroutes';
import { line, speak } from './speech';
import { Chat } from './chat';
import './style.css';
import './ui.css';
import './hud.css';
import './coins.css';
import './cluster.css';
import './keybar.css';
import './skins.css';
import './exped.css';
// The pair of faces the words wear (?font=a|b|c to try one), after the sheets it overrides.
import './fontchoice';
// The look, iron and ember, over the sheets above, and its MOTION switch (ironui.ts).
import { ironUi } from './ironui';
import { paintFrames } from './frames';
import { iconVars } from './icons';
import { Cluster } from './cluster';
import { UnderButtons } from './underbtn';
import { Uncover } from './uncover';
import { UnitFrame } from './unitframe';
import { expedRows, roomsHtml, smallLine, titleCase, TRACKW } from './tracker';
import { BannerFold, calm } from './bannerfold';
import { ObjFlash } from './objflash';
import { GoalPulse, goalHtml } from './goalpulse';
import { errandLine } from './errandline';
import { errandTargets } from './errandmarks';
import { runner } from './runner';
import { toast } from './partytoast';
import { QUESTW } from './questwords';
import { echoes } from './runnerecho';
import { townSpots } from '../shared/town';
import { GearHint } from './gearhint';
import './goal.css';
import { UnlockFlash } from './unlockflash';
import { kitLine } from './kitlines';
import { ownCue } from './owncues';
import { Purse } from './purse';
import { legend } from './legend';
import { weaponsAbout } from './weaponsabout';
import { mageTrails } from './fxmagetap';
import { iceTrails } from './fxice';

// The UI's frames and icons, drawn once before anything shows.
paintFrames();
iconVars();

const game = new Game();
/** On the wall for the Night Watch, or at a pastime (fishing, the butts): those paint themselves over the town. */
const away = () => game.mode === 'watch' || game.mode === 'pastime';
hookLitBadge(() => game.profile.lit ?? 0);
/** Online (the Vercel site): the others in town. Made once there's a hero, keyed by the hero's id. */
let townfolk: Townfolk | null = null;
function online(): Townfolk | null {
  if (!ONLINE || !game.profile.id) return null;
  // Another hero picked: the old one leaves town.
  if (townfolk && townfolk.id !== game.profile.id) townfolk.leave(), (townfolk = null);
  if (!townfolk) {
    townfolk = new Townfolk(game.profile.id);
    // Parties gathered in town: the HUD card, toasts, being pulled into a friend's job (lobby.ts).
    lobby.attach(townfolk, (game.parties = new Parties(townfolk, () => ({ id: game.profile.id, name: game.profile.name }))));
    chat.attach(townfolk);
    trades.attach(townfolk);
    const tf = townfolk;
    game.townmates = () => tf.here(game.room.map.name);
  }
  return townfolk;
}

// The month's online budget used up (relay.ts): out of the town's room, any job on goes on here alone, and a line says so.
onFull(() => {
  townfolk?.leave();
  townfolk = null;
  game.playAlone();
  sayFull();
});

const scene = new Scene(document.getElementById('game') as HTMLCanvasElement);
/** An expedition's MAP and its words (expedui.ts). */
const expedUi = new ExpedUi();
(window as unknown as { __expedUi: ExpedUi }).__expedUi = expedUi;
/** The pixel scene, or the 3D view on a job when the VIEW switch says so (three/views.ts). */
const views = new Views(scene);
const fx = new Fx();
const ways = new WayWatch();
const panel = new Panel();
/** Trading with another player in town (tradeui.ts). */
const trades = new Trades(game, panel);
// The townsfolk's goodbye as their panel closes (townvoice.ts).
panel.onHide = () => void townVoice.close(voiceClock());
const input = new Input(() => views.heroScreen());
const lobby = new Lobby(game, panel, input.touch, () => pack.toggle(false));
const $ = (s: string) => document.querySelector(s) as HTMLElement;
const card = new LootCard((id) => input.take(id));
// Boss loot: the NEED / GREED / PASS card for a unique piece up for the group's roll (rollcard.ts).
const rollCard = new RollCard(game.lootPicks, (id) => { const h = game.room.heroes.find((x) => x.id === id); return h?.tag ?? (id === ME ? game.profile.name : id); }, (s) => chat.system(s));
const lesson = new LessonView(game, input.touch);
const pack = new PackView((op, arg) => input.gear(op, arg), () => title.open, { open: () => openTree(game, panel), picks: () => game.profile.picks, town: () => game.mode === 'town', fresh: () => game.profile.relicNew ?? [], seen: (id) => game.seeRelic(id) });
const music = new Music();
const link = new WorldLink((w) => game.syncWorld(w));
game.link = link;
setLink(link);
void link.refresh(true);
const sounds = new Soundscape(music);
const recovery = new Recovery(() => game.save);
const unit = new UnitFrame();
const fold = new BannerFold($('#banner'));
const relicPop = new RelicPop();
const objFlash = new ObjFlash(), unlocks = new UnlockFlash(), purse = new Purse(), goalPulse = new GoalPulse(), gearHint = new GearHint();
// (A laptop has the same buttons, in a row at the bottom with their keys: they don't take clicks. keybar.css.)
if (!input.touch) document.getElementById('touch')!.hidden = false;
const cluster = new Cluster();
/** A phone's buttons go faint over the hero or a telegraph (underbtn.ts). */
const under = input.touch ? new UnderButtons() : null;
/** The top panels make room and go faint over danger, the same way (uncover.ts). */
const uncover = new Uncover();
const title = new Title(game, () => undefined, recovery);
// Heroes made before names were held (2026-11-13) take theirs now, where nobody has it (client/names.ts).
// One whose name another hero already holds is asked for a new one on the title (Kyle, 2026-11-13).
for (const h of game.save.heroes) void claimName(normName(h.name), h.id).then((r) => r === 'taken' && ((h.rename = true), store(game.save)));
// Trying a class from its page (trial.ts): DONE comes back to that page.
const trial = new Trial(game, (c, look) => title.showClass(c, look));
title.onTry = (c, look) => trial.start(c, look);
title.onShow = () => trial.end();
/** Chat (online): world and near in town, the party on a job. */
const chat = new Chat(game, views, input.touch, () => panel.open || title.open);
// Swore in chat: lightning out of the sky onto them (chat.ts stuns them).
// A friend petting their hound (or Maeve's), as they told it (petword.ts): drawn here too.
chat.onPet = (h, w) => void ((w.d === 'lodge' || WEAPONS[h.weapon].cls === 'RANGER') && startPet(h, w.d, performance.now() / 1000, w.r));
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
  // ?deepbest=20 (and &deepskill=1): the Deep skill open, or taught, for a quick look (deeptest.ts).
  deepTestHero(game);
}
else title.show();
// ?hero=WARRIOR&exped=1: straight onto today's expedition (THE BARROWFIELDS), alone.
// (?exped=4: the expedition posted on day 4, for a given map.)
const xday = Number(new URLSearchParams(location.search).get('exped') ?? 0);
if (quick && xday) game.startJob(expedition(xday > 1 ? xday : game.world.day));
// ?hero=WARRIOR&wood=1: straight into today's Hangman's Wood (?wood=4: the one posted on day 4).
const wday = Number(new URLSearchParams(location.search).get('wood') ?? 0);
if (quick && wday) game.startJob(hangmansWood(wday > 1 ? wday : game.world.day));
// ?hero=WARRIOR&fen=1: straight into today's Fenmere (?fen=70: the one posted on day 70).
const fday = Number(new URLSearchParams(location.search).get('fen') ?? 0);
if (quick && fday) game.startJob(fenmere(fday > 1 ? fday : game.world.day));
// ?hero=WARRIOR&cut=1: straight into today's Open Cut, the first instance (?cut=4: the one posted on day 4; ?area=2 starts at its third area).
// ?stress=1: the stress map (docs/design/open-cut-map.md step 0), a party of `stress`.
const stressN = Number(new URLSearchParams(location.search).get('stress') ?? 0);
if (quick && stressN) game.startJob(stressJob(), stressN);
const cday = Number(new URLSearchParams(location.search).get('cut') ?? 0);
if (quick && cday) {
  const q = new URLSearchParams(location.search), way = q.get('way');
  game.startJob(openCut(cday > 1 ? cday : game.world.day), 1, Number(q.get('area') ?? 0), way === null ? undefined : Number(way));
}
// ?hero=WARRIOR&barn=1: straight onto today's Doorkeepers hunt; ?barn=arena: straight into the great barn.
const barn = new URLSearchParams(location.search).get('barn');
if (quick && barn) game.startJob(barnHunt(game.world.day, barn === 'arena'));
// The big map's load test (?hero=WARRIOR&bigmap=1: bigmode.ts), loaded only when asked.
if (quick && new URLSearchParams(location.search).get('bigmap') === '1') void import('./bigmode').then((m) => m.startBig(game, new URLSearchParams(location.search)));
// The art pass's lineup (?lineup, ?lineup=heroes, ?lineup=goblins: lineup.ts), loaded only when asked.
const lineup = new URLSearchParams(location.search).get('lineup');
if (lineup !== null) void import('./lineup').then((m) => m.openLineup(lineup));
// A recovery code here: if another device sent these heroes on since, take that copy (only before play).
void recovery.start((s) => title.open && (game.adopt(s), title.show(), true));
/** Talk to whoever you stand by, use the spot, or go in at the door (E or F on a laptop, USE on a phone). */
const use = () => {
  const n = game.near();
  // A drop of yours at your feet (and nothing else here): LOOK opens its card (lootcard.ts).
  if (!n?.chest && !n?.door && game.mode === 'run' && card.near >= 0 && !panel.open && !title.open) return card.current >= 0 ? card.shut() : card.open(card.near);
  if (!n || panel.open || title.open) return;
  pack.toggle(false);
  if (n.chest) input.open(n.chest);
  else if (n.door) game.enter(n.door);
  // A hound to pet (petting.ts): kneel to it. The press that did it isn't "any input" to stop it, and
  // whoever can see it is told once (petword.ts).
  else if (n.trade) trades.open(n.trade.id, n.trade.name);
  else if (n.pet) {
    if (startPet(game.hero, n.pet, performance.now() / 1000)) touchedIdle(input.read()), chat.pet(n.pet, petReact(ME));
  }
  else if (n.talk) {
    if (n.npc?.path) (talking = n.npc), (n.npc.heldAt = game.room.time);
    // Their greeting in the tongue (Tobin's panic if you carry hungry gear): townvoice.ts.
    const who = personAt(n.talk, n.arg ?? 0, CLASS_ORDER[n.arg ?? 0]);
    townVoice.open(who, voiceClock(), who === 'tobin' && carriesHungry(game.profile));
    openSpot(n.talk, game, panel, n.arg, n.key);
  }
};
let talking: Npc | null = null;
/** Spots you use rather than talk to: the prompt names them without TALK (as the USE button does: cluster.ts). */
const NOT_PEOPLE = new Set(['practice', 'board', 'best', 'market', 'gate']);
// A phone's tap on a drop of yours in reach opens its card (lootcard.ts); the stick takes every other tap.
input.onTap = (x, y) => {
  const hs = views.heroScreen(), me = game.hero, d = me && LootCard.nearest(game.room, me);
  if (!hs || !d || game.mode !== 'run' || panel.open || title.open) return;
  const dx = hs[0] + (d.x - me.x) * hs[2], dy = hs[1] + (d.y - me.y) * (hs[3] ?? hs[2]);
  if (Math.hypot(x - dx, y - dy) < 36) card.open(d.id);
};
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest('input')) return;
  const k = e.key.toLowerCase();
  if (game.wood && game.wood.cut >= 0 && (k === 'escape' || k === ' ' || k === 'enter')) return game.skipCut();
  if (game.wood?.hold && k === 'enter') return lesson.go();
  // Enter skips a line of the wood's strip too (Hew, Orla on the road).
  if (game.mode === 'wood' && game.wood?.caption && k === 'enter') return game.skipCaption();
  // F at a drop: its card first, then F again takes it.
  if (k === 'f' && card.current >= 0) input.take(card.current);
  else if (k === 'f' && card.near >= 0 && game.mode === 'run' && !panel.open) card.open(card.near);
  else if (k === 'f' && (game.near()?.chest || (game.mode === 'run' && game.near()?.pet))) use();
  else if ((k === 'e' || k === 'f') && (game.mode === 'town' || game.mode === 'yard')) use();
  if (k === 'escape' && panel.open && !game.result) panel.hide();
});
$('#heroes').addEventListener('click', () => {
  if (game.mode !== 'run' && !panel.open) pack.toggle(false), title.show();
});
$('#packbtn').addEventListener('click', () => pack.toggle());
$('#caption').addEventListener('click', () => (game.skipCaption(), runner.skip(performance.now() / 1000)));
// A tap anywhere on the scene skips a line of the wood's strip as well (Kyle, 2026-11-12: Orla's lines
// after the Stoker went too slowly); the stick and buttons sit over it and keep their own taps.
document.addEventListener('pointerdown', (e) => {
  if ((e.target as HTMLElement | null)?.tagName === 'CANVAS' && game.mode === 'wood' && game.wood?.caption && !game.wood.hold) game.skipCaption();
});
// What each button means (legend.ts), from the gear's box.
$('#legendbtn').addEventListener('click', () => (pack.toggle(false), void legend(game, panel, input.touch)));
$('#kitbtn').addEventListener('click', () => (pack.toggle(false), weaponsAbout(game, panel)));
// Leave the job early, for town (game.leaveJob says what that means alone, following or leading).
$('#leave').addEventListener('click', () => {
  if (game.mode !== 'run' || panel.open) return;
  const party = !!(game.remote || game.coop?.company);
  panel.show('BACK TO WICKHOLD?', `<p>${isDeep(game.run?.job) ? DEEP_WORDS.leaveWarn : party ? LEAVE_PARTY : LEAVE_SOLO}</p>`, [
    { label: 'LEAVE', act: () => (panel.hide(), game.leaveJob()) },
    { label: 'STAY', primary: true, act: () => panel.hide() },
  ]);
});
$('#skipcut').addEventListener('click', () => game.skipCut());
$('#skipcut').addEventListener('touchstart', (e) => (e.preventDefault(), game.skipCut()), { passive: false });
$('.tb.use').addEventListener('touchstart', (e) => (e.preventDefault(), use()), { passive: false });
// The prompt over your head ("TALK: MOLL", "HELP UP") is a button too (Kyle, 2026-11-08: "it's not clear you
// can't click that ... maybe make both clickable"): what's here to use, else what G would do.
const promptTap = (e: Event) => {
  e.preventDefault();
  if ($('#prompt').hidden || $('#prompt').textContent?.startsWith('RELOAD')) return;
  if (game.near() || card.near >= 0) use();
  else input.intent.grabSeq++;
};
$('#prompt').addEventListener('touchstart', promptTap, { passive: false });
$('#prompt').addEventListener('click', promptTap);


let guards = 0;
const townTips = input.touch
  ? ['JOB BOARD: tap USE to take a job', 'Walk into a door to go in', 'FORGE: Halvard upgrades gear or melts it for steel', 'TRAINING HALL: knacks, and the practice yard', 'TOWN HALL: vote on what Wickhold does next']
  : ['JOB BOARD: press E to take a job', 'Walk into a door to go in. E by anyone to talk', 'FORGE: Halvard upgrades gear or melts it for steel', 'TRAINING HALL: knacks, and the practice yard', 'TOWN HALL: vote on what Wickhold does next'];
const tips = input.touch
  ? ['Stun or get behind a small goblin, then GRAB it', 'Warriors: GRAB any small goblin, or barrels and tables, and throw them', 'Break an oil barrel near goblins to set them on fire', 'Holding a goblin? SLAM it down, or THROW it at another', 'POTION drinks your front potion', 'Most item traits pay off on a counter, a dodge through a blow, or a PERFECT', 'Cottages and barns hold goblins, and sometimes someone in a cage', 'Oil and fire burn wooden buildings down. Burn out the dens', 'Two frost hits freeze a goblin. A heavy blow then shatters it', 'Fire on a chilled goblin: STEAM, which stuns. Storm on a burning one: FLARE, which knocks back', 'SKILL: your class skill, taught by your trainer from level 3', 'Red with a striped edge hurts even through a block: dodge or walk out of it', 'DEEP jobs end at a named butcher, who always carries a RELIC', 'TWIN DAGGERS: dash behind a goblin and BACKSTAB', 'Push the stick part way to creep. Hit a goblin that hasn\'t seen you for an AMBUSH']
  : ['G grabs a stunned goblin (or one you got behind). Click to slam, G to throw', 'Warriors: G lifts any small goblin, barrel or table. Throw it, or slam it down', 'Break an oil barrel near goblins to set them on fire', 'Q drinks your front potion. Hold Q to bring the next forward', 'Bows: let go on the white flash for a PERFECT. Hold too long and the shot weakens', 'Walk into a cottage door to go in. Fire burns buildings down', 'Two frost hits freeze a goblin. A heavy blow then shatters it', 'Fire on a chilled goblin: STEAM, which stuns. Storm on a burning one: FLARE, which knocks back', 'E: your class skill. R: a relic, once you have won one on a DEEP job', 'Red with a striped edge hurts even through a block: SPACE to dodge, or walk out of it', 'Ranger: longbow, shortbow or crossbow. Mage: wand, staff or spellblade', 'Daggers: dash behind a goblin and BACKSTAB', 'Hold Shift to creep. Hit a goblin that hasn\'t seen you for an AMBUSH'];
let tipAt = -99, tipI = 0;

function hud(now: number): void {
  const me = game.hero, room = game.room, pr = game.profile;
  document.body.dataset.mode = game.mode;
  // (Raised this job: the bar's far end is cut off, darkened, and the health fills what's left: unitframe.ts.)
  $('.hp i').style.width = (100 * me.hp * (1 - (me.hpCut ?? 0))) / me.maxHp + '%';
  $('.hp').classList.toggle('poisoned', !!me.poison);
  $('.st i').style.width = me.stamina + '%';
  // A Mage's bar is MAGIC: the word on its tooltip and a soft violet (shared/barword.ts).
  const bw = barWord(WEAPONS[me.weapon].cls);
  if ($('.st').title !== bw) ($('.st').title = bw), $('.st').classList.toggle('magic', bw === 'MAGIC'), $('.st').classList.toggle('faith', bw === 'FAITH');
  $('.st').classList.toggle('low', me.stamina < 25);
  // Winded: the bar flashes, fast while nothing's coming back, slower as it refills.
  $('.st').classList.toggle('winded', !!me.winded);
  $('.st').classList.toggle('empty', !!me.winded && room.time - me.staminaAt < HERO.windedDelay);
  $('.who').textContent = pr.name;
  $('.who').title = `${CLASS_NAME[pr.cls]}, level ${pr.level}`;
  const item = me.arms[me.weapon];
  $('.wpn').textContent = item ? itemName(item) : WEAPONS[me.weapon].name;
  // (The block button is the touch cluster's: cluster.ts.)
  // A Mage's big spell: a mark on the bar at what it costs, red while you're short of it (sim/spells.ts).
  const cost = spellCost(me);
  $('.st').classList.toggle('spell', cost > 0);
  $('.st').classList.toggle('short', cost > 0 && (me.stamina < cost || !!me.winded));
  $('.st').style.setProperty('--cost', Math.min(100, cost) + '%');
  // A Mage's element now (X switches it), TAP, HOLD and PERFECT in it (kitlines.ts), the crossbow's reload key.
  const mageEl = WEAPONS[me.weapon].cls === 'MAGE' ? castElement(me) : '';
  const kit = (mageEl ? (input.touch ? '' : 'X ') + mageEl.toUpperCase() + '  ' : '') + kitLine(me.weapon, mageEl) + (WEAPONS[me.weapon].reloads ? (input.touch ? '  HOLD RELOAD TO WIND' : '  HOLD C TO RELOAD') : '');
  $('.kit').textContent = item ? item.traits.map((t) => TRAITS[t].name).join(' + ') + '  ' + kit : kit;
  card.update(room, me, !input.touch);
  pack.update(me);
  lesson.update();
  $('#packbtn').classList.toggle('on', pack.open);
  knackCues(game, panel.open, $('#packbtn'), (x, y, s) => fx.say(toPx(x, y)[0], toPx(x, y)[1] + 14, s, '#ffd27a', 3.2));
  // A hero quest done (shared/heroquests.ts): said once, back in town, with what it opened.
  if (game.questPop && game.mode === 'town' && !game.result && !panel.open) {
    const q = game.questPop;
    game.questPop = null;
    toast(`${QUESTW.done}${q.opens ? ': ' + QUESTW.opened[q.opens] : ''}`, { kind: 'quest' });
  }
  // At a house's kindling with someone caged inside: a muffled cry, and the words over the pile (kindlecue.ts).
  if (game.mode === 'run') kindleCue(room.map, me, (x, y, s) => fx.say(toPx(x, y)[0], toPx(x, y)[1] - 18, s, '#e8dcc8', 2.6));
  // A house alight with someone still caged inside: shouts from it until the roof comes in.
  if (game.mode === 'run') burningCries(room.map, room.time, (x, y, s) => fx.say(toPx(x, y)[0], toPx(x, y)[1] - 24, s, '#ffb08a', 1.8));
  // The Staithe's folk calling out from the jetty and the nets (staithecalls.ts).
  if (game.mode === 'run') staitheCalls(room, (x, y, s) => fx.say(toPx(x, y)[0], toPx(x, y)[1] - 24, s, '#c8e0f0', 1.8));
  // The class skill (E, SKILL) and the relic carried, if any (R, RELIC), each with its cooldown.
  const [skill, relic] = me.relics, left = (r: typeof skill) => Math.max(0, me.relicReady[r] - room.time);
  const tag = (r: typeof skill) => relicLabel(me, r) + (left(r) > 0 ? ' ' + left(r).toFixed(1) : '');
  // (A skill your trainer hasn't taught you yet has no button.)
  const known = knows(me, 'skill');
  // A Rogue's, Ranger's or Healer's own button (V) and its wait, first (shared/signs.ts).
  const sg = signFor(me), sgl = sg ? signLeft(me, room.time) : 0;
  const own = sg && game.taught().includes('sign') ? (input.touch ? '' : SIGN_KEY + ' ') + SIGNS[sg].name + (sgl > 0 ? ' ' + sgl.toFixed(1) : '') + '   ' : '';
  $('.rlc').textContent = own + (known ? (input.touch ? '' : 'E ') + tag(skill) : '');
  $('.rlc').dataset.el = me.augments[skill];
  // The relic carried: its uses as pips (gold, amber, the last one red-brown, or DARK and greyed).
  const it = relic ? carriedItem(me) : undefined;
  $('.rcd').innerHTML = relic ? (input.touch ? '' : 'R ') + (it && isDark(it) ? RELICS[relic].short + ' ' + RELICW.dark : tag(relic)) + (it ? chargePips(it) : '') : '';
  $('.rcd').classList.toggle('wait', !!relic && (left(relic) > 0 || (!!it && isDark(it))));
  $('.litbadge').hidden = !me.lit;
  game.settleCouncil();
  setVotes(game.world);
  // The belt: the potion that's next (Q, POTION) and how many more.
  const next = me.belt[0];
  $('.belt').textContent = next ? (input.touch ? '' : 'Q ') + POTIONS[next].short + (me.belt.length > 1 ? `  +${me.belt.length - 1}` : '') : '';
  // The banner: where you are and what you're doing.
  const run = game.run;
  // The wood: the lesson and its control, how far along; Hew's words; the bars in the cutscene.
  document.body.dataset.taught = game.taught().join(' ');
  const wood = game.wood;
  document.body.classList.toggle('cutscene', (!!wood && wood.cut >= 0) || runner.scene());
  // Praise shows as a caption while the fight stops for it.
  const praise = wood?.hold?.kind === 'praise' ? { who: wood.hold.who, text: wood.hold.text } : null;
  // (In town, a new hero's runner says their piece on the same strip: runner.ts.)
  const cap = praise ?? (wood?.caption && wood.caption.until > room.time ? wood.caption : null) ?? (game.mode === 'town' ? runner.caption(now) : null);
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
    // (A lesson's count done flashes too, before its goblins are down: sim/woodsteps.ts.)
    objFlash.watchWood(wood.stage + (wood.passed ?? 0), now);
    // (The wood's lessons never fold: the control to learn is on it.)
    fold.render(objFlash.show(`<b>${g.title}</b> <div class="obj">${goalHtml(g.text)}</div><span>GREYHOLLOW, THE DAY AFTER</span>`, now), null, g.title + g.text, now);
    // Big, with its count as pips, and called out when it changes (goalpulse.ts, goal.css).
    goalPulse.frame($('#banner'), g.title + '|' + g.text, now, objFlash.holding(now));
    showPlate($('#boss'), wood.cut >= 0 ? null : plateOf(room.enemies, room.time));
  } else if (game.mode === 'run' && run) {
    goalPulse.clear($('#banner'));
    const g = { text: me.out ? outText(me, room.heroes) : game.goalText() };
    // (The hearts, the get-ups left, are under the health bar: unitframe.ts.)
    // Folded: the objective and the room diamonds; an expedition's, how many jobs are left. Open: the lot,
    // and on an expedition every pinned job and side job, done or what to do (bannerfold.ts, tracker.ts).
    const x = game.fightRoom.exped, rooms = x ? '' : roomsHtml(run.index, run.job.rooms), left = x ? x.goals.filter((q) => !q.done).length : 0;
    const full = objFlash.show(`<b>${titleCase(run.job.place.name)}${rooms}</b> ${x && !me.out && x.phase === 'shut' ? expedRows(x, goalWords(run.job), run.job.boss ?? '') : `<div class="obj">${g.text}</div>`}<span><i class="coin"></i>+${run.gold}${run.rescued ? `<em>SAVED ${run.rescued}</em>` : ''}</span>`, now);
    const small = smallLine(x && !me.out && x.phase === 'shut' ? TRACKW.jobsLeft(left, x.goals.length) : g.text, rooms);
    // (On an expedition the named butcher's bar shows only once you're near it.)
    // (A boss of the kit: its plate, sim/bossplate.ts. While it's up the tracker stays tucked to its line under it.)
    // (On an instance's one map, only this stretch's named ones: sim/stretches.ts.)
    const st = stretchOf(run, room.map);
    const plate = plateOf(room.enemies, room.time, (e) => (st ? st.keep.includes(e.name ?? '') : !room.exped || Math.hypot(e.x - me.x, e.y - me.y) < 14));
    fold.render(full, small, run.job.place.name + run.index + ':' + (x && !me.out && x.phase === 'shut' ? 'jobs' + left : calm(g.text)), now, objFlash.holding(now), !!plate);
    showPlate($('#boss'), plate);
    // (A boss's plate up and no expedition's jobs to count: the plate is the goal, the tracker steps aside.)
    document.body.classList.toggle('bossfight', !!plate && !x);
  } else {
    showPlate($('#boss'), null);
    document.body.classList.remove('bossfight');
    goalPulse.clear($('#banner'));
    objFlash.watchWood(-1, now);
    // A new hero's errands, and the trainer's word on a new skill, are the town's goal (errandline.ts).
    // (Not while the runner's still saying it: the strip first, then the rows.)
    const errands = game.mode === 'town' && !runner.caption(now) ? errandLine(pr) : null;
    const full = game.outside
      ? `<b>${titleCase(room.map.name)}</b> ${errands ? errands.rows : 'Walk out at the bottom'}<span><i class="coin"></i>${pr.gold}</span>`
      : game.mode === 'town'
      ? `<b>Wickhold</b> ${errands ? errands.rows : `DAY ${game.world.day}`}<span><i class="coin"></i>${pr.gold}${pr.picks ? '<em>(A KNACK TO PICK)</em>' : ''}<em>${game.world.rescued} HOME</em>${link.online ? '<em>WORLD ' + link.group.toUpperCase() + '</em>' : ''}</span>`
      : `<b>Training Yard</b> ${game.drill?.line ?? 'Walk out at the bottom for town'}`;
    // Folded: the place in one line (town: the day too).
    const where = errands ? errands.small : game.outside ? room.map.name.toUpperCase() : game.mode === 'town' ? TRACKW.town(game.world.day) : (game.drill?.line ?? 'TRAINING YARD');
    fold.render(full, smallLine(where), game.mode + where + (errands?.key ?? ''), now);
  }
  // (A drop of yours at your feet comes before petting the hound: LOOK.)
  const near = game.near(), spot = near?.pet && game.mode === 'run' && card.near >= 0 ? null : near, busy = panel.open || title.open;
  // Whoever you're near: their lines load before you talk to them (voiceplay.ts).
  if (spot?.talk) primeSpot(spot.talk, spot.arg ?? 0, CLASS_ORDER[spot.arg ?? 0]);
  // (While you're petting the hound, its prompt steps aside so you can see it. Your own hound, always at
  // heel, never puts up a prompt: it covered the view (Kyle's friend, 2026-11-12); USE still pets it.)
  $('#prompt').hidden = !spot || busy || (!!spot.pet && (spot.pet === 'own' || !!petFrame(game.hero, now)));
  if (spot) $('#prompt').textContent = (input.touch ? '' : spot?.chest || (spot?.pet && game.mode === 'run') ? 'F  ' : game.mode === 'run' ? '' : 'E  ') + (spot.door || spot.pet || !spot.talk || NOT_PEOPLE.has(spot.talk) ? spot.label : 'TALK: ' + spot.label);
  // A drop at your feet, its card shut: the key that opens it (a phone has LOOK in the context slot).
  else if (!busy && !input.touch && game.mode === 'run' && card.near >= 0 && card.current < 0) ($('#prompt').hidden = false), ($('#prompt').textContent = 'F  LOOK');
  // A friend down at your feet: the key that gets them up.
  const stg = game.mode === 'run' ? staitheGrabbable(game.hero, game.room.survivors, game.room.map) : null;
  if (!spot && !busy && !input.touch && game.mode === 'run' && (cuttable(game.hero, game.room.heroes, game.room.time) || stg === 'cut')) ($('#prompt').hidden = false), ($('#prompt').textContent = 'G  CUT FREE');
  else if (!spot && !busy && !input.touch && stg === 'shove') ($('#prompt').hidden = false), ($('#prompt').textContent = 'G  ' + STAITHE_WORDS.shove);
  else if (!spot && !busy && !input.touch && game.mode === 'run' && game.hero.act === 'idle' && raisable(game.hero, game.room.heroes)) ($('#prompt').hidden = false), ($('#prompt').textContent = 'G  HELP UP');
  // A Cleric by a friend who is out (sim/raise.ts): the key, or the seconds till it's ready.
  else if (!spot && !busy && !input.touch && game.mode === 'run' && risable(game.hero, game.room.heroes, game.room.time)) {
    const wait = riseWait(game.hero, game.room.time);
    ($('#prompt').hidden = false), ($('#prompt').textContent = wait > 0 ? `${RAISEW.button}  ${Math.ceil(wait)}` : `G  ${RAISEW.button}`);
  }
  else if (!spot && !busy && !input.touch && game.mode === 'run' && (torchable(game.hero, game.room.enemies) || kindleable(game.hero, game.room.map))) ($('#prompt').hidden = false), ($('#prompt').textContent = 'G  BURN');
  // The touch buttons round ATTACK, and the unit frame (cluster.ts, unitframe.ts).
  cluster.update(game, spot, busy, now, game.mode === 'run' && card.near >= 0 ? (card.current >= 0 ? 'open' : 'shut') : '');
  unit.update(game, now);
  // The wood's buttons, flashed gold as each is given (unlockflash.ts); coins and the anvil in town (purse.ts).
  const moving = game.mode === 'wood' && (game.wood?.hold?.move === 'move' || game.wood?.hold?.move === 'step');
  unlocks.update(game.mode === 'wood' ? game.taught() : null, me, input.touch, input.intent, game.mode, (s) => fx.say(toPx(me.x, me.y)[0], toPx(me.x, me.y)[1] - 40, s, '#ffd27a', 2.6), moving);
  // Once, in the wood, with a second button given: where BUTTONS is (gearhint.ts).
  gearHint.update(game.mode === 'wood' && !!game.wood && !game.wood.hold && game.wood.cut < 0 && game.taught().length >= 2, now);
  purse.update(game);
  // A laptop's empty crossbow: the key to wind it, on the prompt line.
  if (!input.touch && $('#prompt').hidden && !busy && game.mode !== 'town' && WEAPONS[me.weapon].reloads && me.xbowEmpty) ($('#prompt').hidden = false), ($('#prompt').textContent = 'RELOAD: C');
  const list = game.mode === 'town' ? townTips : tips;
  if (now - tipAt > 6) {
    tipAt = now;
    $('#tip').textContent = list[tipI++ % list.length];
  }
  $('#tip').classList.toggle('gone', game.mode === 'run' || (game.mode === 'yard' && guards >= 3));
}

/** The LEAVE button's question, alone and in a party. */
const LEAVE_SOLO = "The job fails. You keep half the coin you've picked up.";
const LEAVE_PARTY = "Your party carries on. You keep the coin you've picked up, not the job's pay.";

/** On the banner once you're out of a job (your party carries on without you). */
const OUT_TEXT = "You're out till the job's done. Your party carries on";
/** Out for the job: who's raising you, or that a Cleric in the party still could (sim/raise.ts), or the old line. */
function outText(me: Hero, heroes: Hero[]): string {
  const by = me.riseBy ? heroes.find((h) => h.id === me.riseBy) : undefined;
  if (by) return RAISEW.outRising(by.tag ?? by.id);
  const can = heroes.some((h) => h !== me && h.id !== 'squire' && isCleric(h) && !h.out && !me.risenBy?.includes(h.id));
  return can ? RAISEW.out : OUT_TEXT;
}

const dread = new DreadView();
let last = performance.now();
let still: Intent | null = null;
let resumed = '', touchedAt = 0;
// Following a friend's job: a press goes to the leader from the press itself, not the next frame (coop.ts).
input.onPress = () => {
  if (!game.remote || panel.open || title.open || chat.typing || pack.open || away()) return;
  game.remote.send(game.own(input.read()), performance.now() / 1000);
};
function tick(t: number): void {
  // (The first frame can stamp a hair before the page clock: never step backwards.)
  const dt = Math.max(0, Math.min(0.1, (t - last) / 1000));
  // (How healthy this page's frames are: who'd host a party's job best, netq.ts. Drawn frames only.)
  if (!document.hidden) noteFrame(t - last);
  last = t;
  // With a panel up, the hero stands still (and no press is spent).
  const live = input.read();
  // Any input stops your hero's idle at once (idles.ts): the stick, the aim, any press.
  if (touchedIdle(live)) pokeIdle(ME), stopPet(ME, performance.now() / 1000);
  // The mouse over a hound shows its name (houndname.ts).
  pointAt(!input.touch && (live.ax || live.ay) && game.hero ? [game.hero.x + live.ax, game.hero.y + live.ay] : null);
  if (panel.open || title.open || chat.typing || pack.open || away()) still ??= { ...live, mx: 0, my: 0, attack: false, block: false };
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
  // The yard is this browser's alone: it stands still while Pell's board or the title is up, so nothing
  // hits you while you choose (a job or the town, shared or not, runs on).
  const evs = game.mode === 'yard' && (panel.open || title.open) ? [] : game.step(dt, still ?? live);
  // Leading one: the room goes out to the party.
  game.coop?.frame(t / 1000);
  fx.heroes = game.room.heroes;
  for (const ev of evs) {
    // (In the yard they're straw men: a hit throws straw, not blood: strawman.ts.)
    if (!(game.mode === 'yard' && strawFx(fx, ev))) fx.on(ev);
    ownCue(ev, game.hero.id, fx, t / 1000);
    // My own get-ups in a party: how many are left, when I go down and when I get up.
    const party = game.room.heroes.filter((x) => x.id !== 'squire').length > 1;
    if (party && game.mode === 'run' && (ev.k === 'down' || ev.k === 'gotup' || ev.k === 'pickedup') && (ev as { id?: string }).id === game.hero.id) {
      const [sx, sy] = toPx(ev.x, ev.y);
      fx.say(sx, sy - 34, game.hero.selfUp ? 'NO GET-UPS LEFT' : '1 GET-UP LEFT', game.hero.selfUp ? '#ff6a7a' : '#ffd27a', 2.6);
    }
    // Raised by a Cleric (sim/raise.ts): the max health you have for the rest of the job.
    if (ev.k === 'risen' && ev.id === game.hero.id) {
      const [sx, sy] = toPx(ev.x, ev.y);
      fx.say(sx, sy - 36, RAISEW.mine(game.hero.maxHp), '#ffd27a', 3.2);
    }
    // Down alone on a job: how many more times you'll get up.
    if (ev.k === 'down' && game.mode === 'run' && game.run && game.room.heroes.filter((x) => x.id !== 'squire').length < 2 && Math.abs(ev.x - game.hero.x) < 0.01) {
      const left = MAX_DOWNS - game.run.downs;
      const [sx, sy] = toPx(ev.x, ev.y);
      fx.say(sx, sy - 34, left > 0 ? `${'\u2665'.repeat(left)} LEFT` : 'DRIVEN BACK', '#ff6a7a');
    }
    sounds.event(ev, game.room, t / 1000);
    if (ev.k === 'block' || ev.k === 'dodge') guards++;
  }
  sounds.frame(game, t / 1000);
  // Lost the job: fade out where you fell; back in town, fade up out of the dark.
  const fade = document.getElementById('fade') ?? Object.assign(document.body.appendChild(document.createElement('div')), { id: 'fade' });
  if (game.beatenAt !== null && !fade.classList.contains('dark')) fade.classList.remove('up'), fade.classList.add('dark');
  else if (game.beatenAt === null && fade.classList.contains('dark')) fade.classList.add('up'), fade.classList.remove('dark');
  watchDust(game.room, fx);
  watchWater(game.room, fx);
  // Back in the open in town: see what the world has been up to (at most every minute; not while idle).
  if (game.mode === 'town' && !game.outside && !townfolk?.dozing) void link.refresh();
  if (game.result && !panel.open) showResult(game, panel);
  // The Deep: a floor's end reached (deepui.ts).
  else if (game.deepAsk && !panel.open) showCheckpoint(game, panel);
  // The party's choices at a checkpoint, as they come in (deepui.ts).
  if (panel.open) refreshVotes(game, panel);
  // A relic just gained: its moment, once nothing's in the way (the recap first, at a job's end).
  relicPop.frame(game.relicNews, t / 1000, panel.open || title.open || !!game.result);
  // Out of the wood: the road to Wickhold (Orla walked you here; she met you in the wood).
  if (game.greeting === 'road' && !panel.open) (game.greeting = null), panel.show('WICKHOLD', `<p class="dim">${line(WOOD_ROAD)}</p>`, [{ label: 'INTO WICKHOLD', primary: true, act: () => panel.hide() }], true);
  // Back to a town the hungry raided while you were away: Dunn tells you, the first time you see it.
  else if (game.mode === 'town' && !game.outside && !panel.open && !title.open && !game.result) {
    const news = raidNews(game.world);
    if (news) panel.show(news.title, news.html, [{ label: 'CLOSE', primary: true, act: () => panel.hide() }], true);
  }
  fx.update(dt);
  mageTrails(fx, game.room, dt);
  iceTrails(fx, game.room, dt);
  // (A new hero's arrival in town has its own: runner.ts.)
  scene.focus = game.cutFocus() ?? runner.focus(game.hero ?? null);
  scene.fanfare = game.wood?.hold?.kind === 'relic';
  // In town, only someone with an errand or a quest for you is marked (errandmarks.ts).
  scene.markEach = game.mode === 'town';
  scene.marks = game.mode === 'run' ? targets(game.run, game.room, game.houses()) : game.mode === 'town' ? errandTargets(game.profile, game.room.map, game.room.time, game.outside ? [] : townSpots(game.world)) : [];
  scene.doors = game.mode === 'run' ? game.doorMarks() : [];
  scene.pointTo = game.wood && game.wood.stage === 5 && !game.wood.hold && spoken(game.wood) ? { x: ROAD_OUT.x + 1, y: ROAD_OUT.y + ROAD_OUT.h / 2 } : wayTarget(game);
  // An expedition: MAP, the map screen, and a word over you as things happen (expedui.ts).
  expedUi.frame(game.room, game.mode === 'run' && !!game.room.exped, evs, ME, t / 1000, (s, col) => {
    if (!game.hero) return;
    const [sx, sy] = toPx(game.hero.x, game.hero.y);
    fx.say(sx, sy - 52, s, col, 3);
  }, game.run?.job.boss);
  // The way on just opened: say which way, over you.
  const opened = ways.check(game);
  if (opened) objFlash.done(t / 1000);
  if (opened && game.hero) {
    const [sx, sy] = toPx(game.hero.x, game.hero.y);
    fx.say(sx, sy - 40, opened, '#ffd27a', 2.6);
  }
  // Online: everyone else in Wickhold, while you're there.
  const inTown = game.mode === 'town', h = game.hero;
  const town = online();
  lobby.frame(inTown, t / 1000, !title.open);
  // (Out of Wickhold, in the yard or the wood, nothing goes to the relay: townpresence.ts.)
  town?.step(h ? presence(game, game.profile.name) : null, t / 1000, dt);
  // A trade open with another player: the server's answer, or them gone (tradeui.ts).
  trades.tick(performance.now() / 1000);
  // (Off screen, leading a job in the background: nothing to draw.)
  // (On the wall for the Night Watch: it paints itself over all this, watchmode.ts.)
  if (document.hidden || away()) return;
  views.render(game.room, ME, fx, t / 1000, dt, inTown ? (townfolk?.here(game.room.map.name) ?? []) : [], game.mode === 'run');
  under?.frame(views, game.room, game.room.heroes.find((x) => x.id === ME), t / 1000);
  uncover.frame(views, game.room, game.room.heroes.find((x) => x.id === ME), t / 1000);
  // The job moved to another device (a host's page went out of sight): said once, over me.
  if (game.hostNote && game.hero) {
    const [sx, sy] = toPx(game.hero.x, game.hero.y);
    fx.say(sx, sy - 46, game.hostNote, '#ffd27a', 3);
    game.hostNote = null;
  }
  // Out of bounds: the dark closing in, what comes for you, and anyone taken (dreadfx.ts).
  dread.frame(game.room.heroes.find((x) => x.id === ME), game.room.heroes, evs, views, fx, t / 1000, dt);
  // A new hero's first minutes in the street: the runner (runner.ts).
  const gate = townSpots(game.world).find((s) => s.id === 'gate') ?? null;
  runner.frame({
    street: game.mode === 'town' && !game.outside ? game.room.map : null, hero: game.hero ?? null, profile: game.profile, busy: panel.open || title.open || !!game.greeting || !!game.result, keep: () => game.keep(),
    gate, place: game.remote ? null : (x, y) => Object.assign(game.hero, { x, y }),
  }, t / 1000, dt);
  game.walkOverride = runner.walk();
  // Others' runners, as they come and go in the street (runnerecho.ts).
  echoes.frame(game.mode === 'town' && !game.outside ? game.room.map : null, town?.runners(game.room.map.name) ?? [], t / 1000);
  hud(t / 1000);
  rollCard.frame(game.room, game.room.heroes.find((x) => x.id === ME), evs, t / 1000, game.room.time);
  chat.frame();
}

function frame(t: number): void {
  trial.frame();
  if (!document.hidden) tick(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Leading a job with this page out of sight (another tab, another app): the browser stops drawing
// frames, but your friends' room still has to run, so it runs here on a timer, catching up in
// tenth-of-a-second steps however late the browser lets the timer fire.
// The timer is a worker's when one can be made: a hidden tab's own timers are held to about once a second
// (once a minute after five), a worker's aren't. The page's own interval stays as the fallback.
// With friends, a hidden host hands the job on (hidehost.ts): a phone or touch device at once, a desktop
// after 15 s out of sight; back in sight it follows whoever took it. Alone, it runs here.
let hiddenAt = 0;
const hide = new HideWatch({
  touch: input.touch,
  now: () => performance.now() / 1000,
  hosting: () => game.mode === 'run' && !!game.coop,
  friends: () => (game.coop ? game.coop.still().length - 1 : 0),
  hand: () => game.handOn(),
  back: () => game.backAsGuest(),
  later: (fn, ms) => setTimeout(fn, ms),
  cancel: (t) => clearTimeout(t as number),
});
hide.attach(document, window);
function hiddenTick(): void {
  const now = performance.now();
  if (!document.hidden) return void (hiddenAt = 0);
  // (Two timers drive this, a worker's and the page's: one run a tenth at most.)
  if (hiddenAt && now - hiddenAt < 80) return;
  hiddenAt = now;
  hide.tick();
  if (!game.coop) return;
  for (let n = 0; now - last > 120 && n < 40; n++) tick(last + 100);
  tick(now);
}
setInterval(hiddenTick, 100);
try {
  const w = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 100)'], { type: 'text/javascript' })));
  w.onmessage = () => document.hidden && hiddenTick();
} catch {
  /* no workers here: the page's own timer does it */
}

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
// Voices have their own switch too, remembered on this device (voicebus.ts).
const voicesSwitch = (on: boolean) => (setVoices(on), $('#voices').classList.toggle('off', !on));
voicesSwitch(voicesOn());
$('#voices').addEventListener('click', () => voicesSwitch(!voicesOn()));
// A Ranger bowled over by the hound laughs on the floor, if they're close enough to hear (herovoice.ts).
idleHook.fn = (h, id, t, now) => {
  const me = game.hero;
  if (me && Math.hypot(h.x - me.x, h.y - me.y) < 12) heroVoices.idle(h, id, t, now);
};
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
ironUi();
if (input.touch) document.body.classList.add('touch');

// Test hooks: read the fight as data, never as pixels.
const w = window as unknown as Record<string, unknown>;
w.__fullForTest = fullForTest;
w.__town = () => ({ dozing: !!townfolk?.dozing, open: !!townfolk?.open, count: townfolk?.count ?? 0, rtt: townfolk?.rtt ?? 0, here: townfolk?.here(game.room.map.name).map((h) => ({ name: h.tag, x: h.x, y: h.y, park: parkOf(h), pet: petFrame(h, performance.now() / 1000)?.r ?? null })) ?? [], sends: townfolk?.sends ?? 0 });
w.__GAME_STATE__ = () => ({ mode: game.mode, wood: game.wood ? { wake: game.wood.wake, said: game.wood.said, stage: game.wood.stage, hold: game.wood.hold } : null, inside: game.outside ? game.room.map.name : null, title: title.open, time: game.room.time, hero: { ...game.hero }, enemies: game.room.enemies.map((e) => ({ ...e })), guards, run: game.run, profile: game.profile, world: game.world });
w.render_game_to_text = () => `${game.mode} t=${game.room.time.toFixed(1)} hero ${game.hero.act} hp ${game.hero.hp} st ${Math.round(game.hero.stamina)} | ` + game.room.enemies.map((e) => `${e.kind} ${e.act} hp ${e.hp}${e.attack ? ' ' + e.attack.kind + ' ' + e.attack.t.toFixed(2) : ''}`).join(' | ');
Object.defineProperty(w, '__room', { get: () => game.room });
w.__game = game;
w.__hide = hide;
// (The online scripts try the lag compensation's cap: party-online.cjs.)
w.__lagcomp = LAGCOMP;
w.__views = views;
w.__chat = chat.hooks();
w.__works = WORK_ORDER;
w.__music = music;
// The floor's stains and the rats at them (scripts: rats on the blood).
w.__fx = fx;
w.__rats = rats;
// Listening: a stretch of any piece rendered offline (scripts/listen.cjs). Loaded only when asked.
w.__renderMusic = (...a: Parameters<typeof import('./musicrender').renderMusic>) => import('./musicrender').then((m) => m.renderMusic(...a));
w.__title = title;
w.__panel = panel;
w.__pack = pack;
w.__relicPop = relicPop;
w.__loot = card;
w.__openTree = () => openTree(game, panel);
// Idles on demand for screenshots: window.__idles.force('r_fetch') on your own hero (idles.ts).
// The town's pastimes for the scripts: start one as if you'd talked to Pennock or Abel, and the overlays (fishmode.ts, rangemode.ts).
w.__pastime = { fish: () => openFishing(game, panel), range: () => openRange(game, panel),
  arm: (foe = 'drunk', bet = 0) => openArm(game, panel, armFoe(foe), bet), knives: (bet = 0) => openKnives(game, panel, bet),
  shift: () => openShift(game, panel),
  anvil: () => { const it = game.profile.arms[game.profile.weapon] ?? game.profile.armor; const up = it && game.levelUp(it); return up ? openAnvil(game, panel, up) : null; } };
w.__idles = { force: (id: string) => forceIdle(game.hero, id as never, performance.now() / 1000), pet: (dog: 'own' | 'lodge') => startPet(game.hero, dog, performance.now() / 1000) && (chat.pet(dog, petReact(ME)), true), petting: () => petFrame(game.hero, performance.now() / 1000) };
// Whoever's petting a hound on this screen now, and how it's taking it (petting.ts; the online scripts).
w.__pets = () => game.room.heroes.map((h) => ({ id: h.id, name: h.tag ?? h.id, pet: petFrame(h, performance.now() / 1000)?.r ?? null })).filter((x) => x.pet);
w.__openSpot = (id: string, arg = 0, key = '') => openSpot(id as never, game, panel, arg, key);
// Paying for the statue in the square as the works' panel does (statuebuy.ts; scripts/town-online.cjs).
w.__statue = { commission: (n: number) => commission(game, n) };
// A job on a village street (houses to go into), for the party tests to set out on.
// A job house's kindling spot (scripts/houseburn.cjs).
w.__kindling = (i: number) => kindling(game.room.map.blocks[i], game.room.map);
w.__villageJob = (seed = 7) => import('../shared/jobs').then((m) => ({ ...m.board(1)[0], place: m.PLACES.find((p) => p.kind === 'village')!, objective: 'hunt', boss: 'SKARN', rooms: 3, seed, deep: false }));
// Look sheets for screenshots: every hero, the Warrior's options, and a dark copy with only the glow lit.
// One hero drawn by the game's own code, for the hero look sheet (scripts/heroes-look.cjs).
w.__heroArt = (...a: Parameters<typeof import('./heroart').heroArt>) => import('./heroart').then((m) => m.heroArt(...a));
w.__houndArt = (...a: Parameters<typeof import('./houndart').houndArt>) => import('./houndart').then((m) => m.houndArt(...a));
w.__looks = () => Object.fromEntries(Object.keys(LOOKS).map((k) => [k, [0, 1, 2].map((i) => heroLook(k as HeroClass, i).down.c.toDataURL())]));
