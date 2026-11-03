/**
 * Every word the party card, its toasts and the setting-out beat say (the game's own plain voice:
 * docs/lore/voice.md). For the lore keeper and the line editor.
 */
export const PW = {
  // The card (partycard.ts) and the board's party list (partyboard.ts).
  yours: 'YOUR PARTY',
  theirs: (lead: string) => `${lead}'S PARTY`,
  leads: 'LEADS',
  setOut: 'SET OUT',
  needs: (n: number) => `NEEDS ${n} TO SET OUT`,
  cancel: 'CANCEL',
  leave: 'LEAVE',
  waiting: (lead: string) => `WAITING ON ${lead}`,
  asked: 'ASKED TO JOIN',
  neverMind: 'NEVER MIND',
  join: 'JOIN',
  full: 'FULL',
  /** The board's heading over the parties, and the panel a toast opens. */
  parties: 'PARTIES',
  gathering: 'PARTIES GATHERING',
  none: 'Nobody is gathering a party just now.',
  // Toasts (partytoast.ts).
  posted: (lead: string, job: string) => `${lead} is gathering for ${job}`,
  joined: (who: string) => `${who} joined your party`,
  left: (who: string) => `${who} left your party`,
  in: (lead: string) => `You're in ${lead}'s party`,
  off: (lead: string) => `${lead} called the party off`,
  quiet: (lead: string) => `${lead}'s party broke up`,
  isFull: (lead: string) => `${lead}'s party is full`,
  up: 'Your party is posted. Walk where you like and set out from your card.',
  // The beat before a party goes (setout.ts).
  beat: 'SETTING OUT',
  beatLead: (place: string) => `You lead the party out to ${place}.`,
  beatFollow: (lead: string, place: string) => `${lead} is leading the party out to ${place}.`,
};
