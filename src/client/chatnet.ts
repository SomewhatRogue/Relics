/**
 * Chat over the relay, riding rooms that are already open where it can. In town, lines go to
 * everyone in Wickhold over the town's peer room (townfolk.ts): world lines, and local ones that
 * each listener keeps only if the speaker stands near (chat.ts decides). On a job with friends, the
 * party talks in a peer room of its own named from the job's room (code + CH), so the job's socket
 * (coop.ts) is never touched. Every line heard is checked again and paced per sender here.
 */
import { RelaySocket } from './relay';
import type { Townfolk } from './townfolk';
import { heard, listenerPace, wire, type Channel, type ChatLine, type Pace } from '../shared/chatrules';

/** A line heard, and who said it (their player id). */
export interface Incoming extends ChatLine { from: string }

/** The party's chat room for a job's room: a peer room of its own (room names are 3 to 12 of A-Z0-9). */
export const partyRoom = (code: string): string => code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) + 'CH';

export class ChatNet {
  onLine: (l: Incoming) => void = () => {};
  private town: Townfolk | null = null;
  private party: RelaySocket | null = null;
  private partyCode = '';
  private paces = new Map<string, Pace>();

  constructor(private myId: () => string) {}

  /** Listen on the town's room too: chat lines come here, everything else goes on to the parties. */
  attach(town: Townfolk): void {
    if (this.town === town) return;
    this.town = town;
    const rest = town.onWord;
    town.onWord = (from, d) => (d.k === 'chat' ? this.take(from, d, false) : rest(from, d));
  }

  /** On a job with friends, the party's room is open; anything else (null) closes it. */
  setParty(code: string | null): void {
    if ((code ?? '') === this.partyCode) return;
    this.party?.close();
    this.party = null;
    this.partyCode = code ?? '';
    if (!code) return;
    this.party = new RelaySocket(partyRoom(code), this.myId(), 'peer');
    this.party.onMessage = (m) => void (m.t === 'msg' && this.take(m.from, m.d, true));
  }

  get inParty(): boolean {
    return !!this.party;
  }

  /** Say a line (typed text, or a quick line's number). Returns the line as others will hear it. */
  send(ch: Channel, name: string, said: string | number): ChatLine | null {
    const w = wire(ch, name, said);
    if (!w) return null;
    if (ch === 'party') this.party?.send('*', w);
    else this.town?.say('*', w as unknown as Record<string, unknown>);
    return heard(w);
  }

  private take(from: string, d: unknown, party: boolean): void {
    const line = heard(d);
    // Party lines only from the party's room, town lines only from the town's.
    if (!line || (line.ch === 'party') !== party) return;
    const key = (party ? 'p:' : 't:') + from;
    let pace = this.paces.get(key);
    if (!pace) this.paces.set(key, (pace = listenerPace()));
    if (!pace.ok(performance.now() / 1000)) return;
    this.onLine({ ...line, from });
  }
}
