/**
 * Paying for the statue in Lantern Square (shared/statue.ts has the rules). The gold comes out of the hero's
 * save first and the bid is noted there; then the bid goes to the world, which takes it only over the price
 * as it stands. Whatever world comes back settles it (game.ts syncWorld): won, or the gold back with a word
 * that someone got there first. A bid lost on the way goes again with the next world seen (the world takes a
 * bid once: a second copy is over a price that's gone). Off the server (a solo build) the town is this
 * browser's and the bid is settled here at once.
 */
import { contribute, type Contribution } from '../shared/worldsync';
import { bidOf, refundBid, settleBid, startBid, type BidNote } from '../shared/statue';
import type { WorldState } from '../shared/story';
import type { Game } from './game';
import { ONLINE } from './relay';
import { store } from './save';
import { STATUE_WORDS } from './statuewords';
import { toast } from './partytoast';

/** A bid on its way to the world (one at a time). */
let out = false;

/** Said to the player (a note on the toast shelf; nothing in the tests). */
let tell = (s: string) => {
  if (typeof document !== 'undefined') toast(s);
};
export const onStatueNews = (f: (s: string) => void) => void (tell = f);

/** Whether a bid goes to the world (an online build, or a world that answered) rather than staying here. */
const viaWorld = (g: Game) => ONLINE || !!g.link?.online;
/** An online build with the world out of reach: no bid (no gold taken) till it's back. */
export const bidBlocked = (g: Game) => viaWorld(g) && !g.link?.online;
/** A bid of this hero's still out with the world. */
export const bidOut = (g: Game) => !!g.profile.statueBid;

const contribution = (g: Game, n: BidNote): Contribution => ({ hero: { id: g.profile.id, name: g.profile.name, cls: g.profile.cls }, statue: bidOf(n) });

/** Pay `pay` gold for the statue; false (nothing taken) if the bid doesn't fit or can't go now. */
export function commission(g: Game, pay: number): boolean {
  if (bidBlocked(g)) return false;
  const note = startBid(g.profile, g.world, pay, { w: g.profile.weapon, l: g.profile.look ?? 0 });
  if (!note) return false;
  store(g.save);
  const c = contribution(g, note);
  if (!viaWorld(g)) {
    // A solo town: the plinth is this browser's, and kept in the save with the rest of its world.
    g.changeWorld(() => (contribute(g.world, c, Date.now(), false), settle(g, g.world)));
    return true;
  }
  void send(g, c);
  return true;
}

async function send(g: Game, c: Contribution): Promise<void> {
  out = true;
  const r = await Promise.resolve(g.link!.send(c)).finally(() => (out = false));
  if (r === 'off') return;
  // Turned away as no bid at all ('bad'), or answered with the world just written and the bid still not in it
  // (so the world didn't take it, and nobody else took the plinth either): the gold back.
  const h = g.save.heroes.find((p) => p.id === c.hero.id);
  if (h?.statueBid) refundBid(h), store(g.save), tell(STATUE_WORDS.refused);
}

/** Every hero's bid, by this world; true if any changed. */
function settle(g: Game, w: WorldState): boolean {
  let changed = false;
  for (const h of g.save.heroes) {
    const r = settleBid(h, w);
    if (r === 'lost') tell(STATUE_WORDS.lost(h.name));
    if (r === 'won') tell(STATUE_WORDS.won);
    changed ||= r === 'won' || r === 'lost';
  }
  return changed;
}

/** The world as the server has it: settle what it answers, and send again a bid of this hero's it hasn't seen. */
export function settleBids(g: Game, w: WorldState): void {
  settle(g, w);
  const n = g.profile?.statueBid;
  if (n && !out && g.link?.online) void send(g, contribution(g, n));
}
