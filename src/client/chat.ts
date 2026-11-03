/**
 * In-game chat, online only. In Wickhold: WORLD (everyone in town, in the log) and NEAR (only those
 * within 8 tiles in the same place hear it; a bubble over the speaker's head, and the log). On a job
 * with friends: the party, in bubbles and the log. Off a job alone, in the wood or the yard: no chat.
 *
 * Who hears what is decided by each listener here (chatnet.ts carries the lines); nothing of it
 * touches the fight, which never hears a word. The hero stands still while the box is open
 * (main.ts treats `typing` like an open panel); the shared world goes on.
 */
import { ONLINE } from './relay';
import type { Game } from './game';
import type { Scene } from './scene';
import type { Townfolk } from './townfolk';
import type { Hero } from '../sim/types';
import { ChatNet, type Incoming } from './chatnet';
import { ChatLog, type Entry } from './chatlog';
import { ChatBox } from './chatbox';
import { Bubbles } from './bubbles';
import { Mutes } from './chatmute';
import { Pace, STRUCK_STUN, cleanText, type Channel } from '../shared/chatrules';
import './chat.css';

/** How near a NEAR line carries in town, in tiles. */
export const NEAR = 8;
type Where = 'off' | 'town' | 'party';
const clock = () => performance.now() / 1000;
const at = (h: Hero | undefined | null) => (h ? { x: h.x, y: h.y } : null);

export class Chat {
  private net = new ChatNet(() => this.game.profile.id);
  private log = new ChatLog();
  private box: ChatBox;
  private bubbles = new Bubbles();
  private mutes = new Mutes();
  private pace = new Pace();
  private town: Townfolk | null = null;
  private ch: Channel = 'world';
  private where: Where = 'off';

  constructor(private game: Game, private scene: Pick<Scene, 'tileScreen'>, touch: boolean, busy: () => boolean) {
    this.box = new ChatBox(this.log, touch);
    this.box.canOpen = () => this.where !== 'off' && !busy();
    this.box.onSay = (s) => this.say(s);
    this.box.onChannel = () => this.where === 'town' && this.box.setChannel((this.ch = this.ch === 'world' ? 'local' : 'world'));
    this.box.setChannel(this.ch);
    this.net.onLine = (l) => this.heard(l);
    this.log.onName = (id, name) => this.mute(id, name);
  }

  /** The town's room (made in main.ts once there's a hero): chat lines ride it too. */
  attach(town: Townfolk): void {
    this.town = town;
    this.net.attach(town);
  }

  /** The box is open: the hero stands still while you type. */
  get typing(): boolean {
    return this.box.state === 'open';
  }

  /** Each frame: where chat is (town, party, or nowhere), bubbles following heads, old lines fading. */
  frame(): void {
    const g = this.game, now = clock();
    const code = ONLINE && g.mode === 'run' ? (g.coop?.room ?? g.remote?.code ?? null) : null;
    this.net.setParty(code);
    const where: Where = ONLINE && this.town && g.mode === 'town' ? 'town' : code ? 'party' : 'off';
    if (where !== this.where) {
      this.where = where;
      this.bubbles.clear();
      this.box.job = where === 'party';
      this.box.setChannel(where === 'party' ? 'party' : this.ch);
      document.body.classList.toggle('chat-on', where !== 'off');
      document.body.classList.toggle('chat-job', where === 'party');
      this.box.set('shut');
    }
    this.bubbles.frame(now, (x, y, up) => this.scene.tileScreen(x, y, up));
    this.log.frame(now);
  }

  private say(said: string | number): void {
    if (this.where === 'off' || (typeof said === 'string' && !cleanText(said))) return;
    const now = clock(), ch: Channel = this.where === 'party' ? 'party' : this.ch;
    if (!this.pace.ok(now)) return this.note('', '', 'Slow down a moment.');
    const line = this.net.send(ch, this.game.profile.name, said);
    if (!line) return;
    this.add({ from: this.game.profile.id, name: line.name, ch, text: line.text, mine: true });
    if (ch !== 'world') this.bubbles.say('me', line.text, now, () => at(this.game.hero));
    if (line.struck) this.strike(this.game.profile.id, line.name);
  }

  private heard(l: Incoming): void {
    if (this.mutes.has(l.from)) return;
    const now = clock();
    if (l.ch === 'party') {
      if (this.where !== 'party') return;
      this.bubbles.say(l.from, l.text, now, () => at(this.partyHero(l.from, l.name)));
    } else if (this.where !== 'town') return;
    else if (l.ch === 'local') {
      if (!this.near(l.from)) return;
      this.bubbles.say(l.from, l.text, now, () => (this.near(l.from, NEAR * 2) ? at(this.town?.where(l.from)?.hero) : null));
    }
    this.add({ from: l.from, name: l.name, ch: l.ch, text: l.text });
    this.box.ping();
    if (l.struck) this.strike(l.from, l.name);
  }

  /** Where the lightning lands (world tiles): the effect is drawn there, wherever the speaker is. */
  onStrike: (x: number, y: number) => void = () => {};

  /**
   * Swore in chat: struck by lightning and stunned. In town your own hero is yours to stun; on a job
   * the leader's room stuns whoever it was (it decides), and everyone draws the bolt on them.
   */
  private strike(id: string, name: string): void {
    const g = this.game, mine = id === g.profile.id;
    const h = this.where === 'party' ? (mine ? g.hero : this.partyHero(id, name)) : mine ? g.hero : this.town?.where(id)?.hero;
    if (!h) return;
    this.onStrike(h.x, h.y);
    const stun = mine ? this.where === 'town' || !g.remote : !!g.coop && this.where === 'party';
    if (stun && 'act' in h) Object.assign(h, { act: 'stun', actT: 0, actDur: STRUCK_STUN, kvx: 0, kvy: 0 });
  }

  /** In the same place in town as me, and within `range` tiles. */
  private near(id: string, range = NEAR): boolean {
    const w = this.town?.where(id), me = this.game.hero;
    return !!w && !!me && w.at === this.game.room.map.name && Math.hypot(w.hero.x - me.x, w.hero.y - me.y) <= range;
  }

  /** A party member's hero in the room as this page has it (the leader is '@lead' on a friend's page). */
  private partyHero(id: string, name: string): Hero | undefined {
    const hs = this.game.room.heroes;
    return hs.find((h) => h.id === id) ?? (this.game.remote?.lead === id ? hs.find((h) => h.id === '@lead') : undefined) ?? hs.find((h) => h.id !== 'me' && h.tag === name);
  }

  private mute(id: string, name: string): void {
    if (this.mutes.toggle(id)) this.log.drop(id), this.note(id, name, 'is muted on this device. Tap or click the name to hear them again.');
    else this.note(id, name, 'can be heard again.');
  }

  private note(from: string, name: string, text: string): void {
    this.add({ from, name, ch: 'note', text });
  }

  private add(e: Entry): void {
    this.log.add(e, clock());
  }

  /** Test hooks. */
  hooks(): Record<string, unknown> {
    return {
      log: () => this.log.text,
      bubbles: () => this.bubbles.shown,
      say: (s: string | number, ch?: Channel) => ((ch && ch !== 'party' && (this.ch = ch)), this.box.setChannel(this.where === 'party' ? 'party' : this.ch), this.say(s)),
      where: () => this.where,
      open: (s: 'shut' | 'open' | 'quick') => this.box.set(s),
    };
  }
}
