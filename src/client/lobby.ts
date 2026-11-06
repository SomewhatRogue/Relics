/**
 * Parties in town, wired up: the HUD card, the toasts, being pulled into a friend's job with the
 * setting-out beat, and each frame's look at who's quiet. main.ts makes one and calls `frame`.
 */
import { WEAPONS, type HeroClass } from '../shared/tuning';
import { CoopGuest } from './coop';
import type { Game } from './game';
import type { Panel } from './panels';
import type { Parties } from './parties';
import { openParties } from './partyboard';
import { PartyCard } from './partycard';
import { newsToast } from './partytoast';
import { followOut, onBeat } from './setout';
import type { Townfolk } from './townfolk';

export class Lobby {
  private card: PartyCard;
  private town: Townfolk | null = null;

  constructor(private game: Game, private panel: Panel, touch: boolean, closeAll: () => void) {
    this.card = new PartyCard(game, panel, touch, (id) => this.cls(id));
    onBeat(closeAll);
  }

  /** A new town connection (a hero chosen): its parties tell us what happens. */
  attach(town: Townfolk, parties: Parties): void {
    const { game, panel } = this;
    this.town = town;
    // Called to a friend's job, wherever you are in town: the beat, then off you go with them.
    // (The room runs on whoever has the best link, the leader unless someone beats them: shared/hostpick.ts.
    // Hosting it myself, I start it, as a leader would; else I follow whoever does.)
    parties.onGo = (room, job, _lead, m, host) => {
      const me = game.profile.id;
      followOut(panel, job, m[0]?.[1] ?? '', () => (host === me ? game.setOut({ room, job, members: m, host }) : game.startRemote(new CoopGuest(room, me, host, () => game.profile, job))), { id: host, members: m, me });
    };
    parties.onNews = (n) => newsToast(n, parties.leading || parties.joined ? null : (lead) => parties.join(lead), () => openParties(game, panel));
  }

  /** Each frame: the party's own checks (in town or not), then the card. */
  frame(inTown: boolean, now: number, show: boolean): void {
    this.game.parties?.step(inTown, now);
    this.card.frame(show);
    document.body.classList.toggle('in-party', !!this.game.parties?.current() && this.game.mode === 'town');
  }

  /** A player's class, from the weapon they carry in town. */
  private cls(id: string): HeroClass | null {
    const w = this.town?.where(id)?.hero.weapon;
    return w ? WEAPONS[w].cls : null;
  }
}
