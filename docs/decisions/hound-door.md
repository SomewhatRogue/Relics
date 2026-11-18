# The hound that swept across the screen: decisions

## 2026-11-18: a hound far then near, gone then back, on the host's screen only (Claude Fable 5.2)

Kyle: "for the dog when I did multiplayer on missions, at times on a screen the dog would vanish and reappear
multiple times a second or be VERY far away and then very close on my screen but not on theirs. might have to
do with host / joining."

- **The cause.** Every view draws a body blended from where it stood last tick (`room.prev`) to where it is,
  by how far through the tick the frame falls. The tick keeps that last place for heroes, goblins and survivors
  (`sim/room.ts`), never for hounds. One line did write a hound's: `carry` in `client/jobrooms.ts`, when a hero
  walks through a house door. Nothing ever moved or cleared it after. So from the first door on, the hound was
  drawn from that door to where it really was, thirty times a second: a streak across the screen, off it and
  back when the door was far. Only on the page that runs the fight (the leader's, or yours alone): a friend's
  copy of the room never had the entry, which is why it was "my screen but not theirs".
- **Shown first** in `tests/hounddoor.test.ts` on main's code: in at a door, out, two seconds' walk, and the
  draw was blending the hound from 7.2 tiles away.
- **Fix.** `carry` clears the hound's entry and writes none. The hound is drawn where it is, as it always was
  before anyone used a door.
- **Not done.** Hounds are the one body drawn without the blend between ticks (they step thirty times a second
  where heroes glide). The tick writing the hound's last place too, and a friend's page doing the same as each
  patch lands, would smooth them. It touches `sim/room.ts` where the performance sweep's branch has changes
  waiting, so it wants doing after that is in.
