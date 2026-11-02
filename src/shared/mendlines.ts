/**
 * What Wickhold says about itself as it's mended and raided: every new line for the town works, in
 * one place, for the lore keeper and the line editor. Picked by shared/townsays.ts.
 */
import type { WorkId } from './works.js';

export type Who = 'wenna' | 'tam' | 'gate' | 'dunn' | 'hob' | 'pike' | 'orla' | 'perrin' | 'rowan';

/** The town as it stands: still broken from the breach, mending, mended with the garden in flower. */
export const STATE: Partial<Record<Who, [string, string, string]>> = {
  wenna: [
    "Blood on the square again. I said after the siege I'd never see that twice, and here I am.",
    "I walked the whole lane yesterday without climbing over anything, which at seventy-one is the most exercise I'll admit to.",
    "It's near enough how it was before the siege. The well still tastes of copper, mind.",
  ],
  tam: [
    "There's a dead crow by the gate and Mam says don't poke it, so I didn't. I poked near it.",
    "Mam says the town looks like a town again. I said it looked like a town before, and she said not one you'd want.",
    "Widow Perrin let me plant a whole row. If they come up crooked it's the seeds' fault.",
  ],
  gate: [
    "Mind where you stand, the stones by the gate are still sticky. The sand we threw down just makes it gritty.",
    "Somebody scrubbed the gate. I came on watch this morning and thought I was at the wrong one.",
    "Gate's oak and iron, same as ever. It's the wall either side I worried about, and I've mostly stopped.",
  ],
  dunn: [
    "See the hurdles and rope on the north wall? I've two men and that rope holding it, and the rope's the best of us.",
    "Lanes are clear enough to run down now, which matters more than you'd think.",
    "Twenty years on the walls and I don't trust anything that looks this finished. Nice lamps, mind.",
  ],
  hob: [
    "I say good evening to the burnt cart on my round now. It doesn't answer, which is more than you get from the sergeant.",
    "Half the town's put coin in and the other half complains about the hammering. Same half, mind.",
    "There's flowers by the well and lamps on the lanes, and my mother's worried I'll go soft.",
  ],
  pike: [
    "New boots, and I walk them through this every night. Salt and spit gets blood out of leather, if you were wondering.",
    "It's quieter on my round now the lanes are clear. Not quiet, mind, but I'll take quieter.",
    "I caught myself whistling on the east stretch last night. Orla told me to stop, and she has her reasons.",
  ],
  orla: [
    "It's the north stretch I worry about, all hurdles and rope. I've seen sheep pens built with more conviction.",
    "The north stretch is better, but I say it quietly, because the last time I praised a wall it heard me.",
    "Something out past the wall still whistles back some nights, but it's a good deal further off now.",
  ],
  rowan: [
    "I've a song about the night they came over the wall, but nobody wants it yet. Name a tune.",
    "I've a new verse about the lanes being cleared, and it rhymes carts with hearts. Name a tune.",
    "Something cheerful, the town can stand it now. Name a tune.",
  ],
};

/** A work just finished: who talks about it. */
export const NEWS: Partial<Record<WorkId, Partial<Record<Who, string>>>> = {
  wash: {
    wenna: "Somebody scrubbed the square. I stood out here an hour just looking at it, and Tam asked was I ill.",
    gate: "Odric said the words over every one they buried, by name where he knew it. It took him till dark.",
  },
  lanes: {
    tam: "They took the burnt cart out of our lane. I was going to keep it, I'd worked out where the door would go.",
  },
  shutters: {
    hob: "New shutters on the barracks. I slept the whole night through and woke up sure something was wrong.",
    wenna: "My shutters close, both of them. I've been opening and shutting them all morning and the neighbours think I've gone simple.",
  },
  lanterns: {
    hob: "You'd not credit what a lamp does. I saw a cat at forty paces last night.",
    pike: "I saw my own feet on my round last night. I'd forgotten what good boots they are.",
  },
  dig: {
    tam: "The dead tree's down and I helped. I carried a stick, a big one.",
  },
  plant: {
    orla: "You can smell Perrin's garden from the north wall when the wind's right. It's a change from what you smelled there before.",
    tam: "Perrin says the green ones are flowers and the other green ones are weeds, and I'm to learn the difference.",
  },
  arbour: {
    wenna: "I sat on Perrin's bench an hour last night and nobody asked me for anything. First time in eleven years.",
    hob: "I stop at the garden benches on my round. I'm not meant to, so don't tell Dunn.",
  },
  stakes: {
    orla: "I leaned on the new stakes last night and they didn't move, which is the most a wall's done for me since I joined.",
  },
  timber: {
    orla: "I can see over the north wall now from the new walk. I'm not sure I wanted to.",
    dunn: "The new timber creaks in the middle and the carpenter says it's meant to. I told him so does my back.",
  },
  stonewall: {
    wenna: "I saw these walls go up and now I've seen them mended. Somebody tell Hollis to write that down.",
    orla: "I put my hand on the new stone after my watch and it was still warm from the day. I stood there a while.",
  },
};

/** The days after a raid. */
export const RAID: Partial<Record<Who, string>> = {
  wenna: "We'd only just got the place looking cared for, and they came over in the night and undid half of it. Get your purse out.",
  tam: "Mam put me under the bed with the dog when they came. The dog was more frightened than me, nearly.",
  gate: "They never came near the gate. They don't need it, and that's what worries me.",
  dunn: "They came over where the wall's weakest, same as always, and we only held the square. Put coin in and we'll mend it again.",
  hob: "I was on the north stretch when they came over. I'll not talk about it, but my boots are ruined.",
  pike: "They smashed two lamps and I've not slept since. Lamps you can buy.",
  orla: "Did you hear them in the night? They whistle going over the wall, and I'd know it anywhere now.",
  perrin: "They went through my beds and didn't take anything. Just walked up and down them in rows, and I can't stop thinking about it.",
};

/** Long after a raid, some still talk about it. */
export const REMEMBER: Partial<Record<Who, string>> = {
  wenna: "I kept a stone from the night they came over, to remind me to stay angry. At my age you forget.",
  dunn: "Since that night I walk the north stretch twice. Hollis says it isn't in the roster, and I've told him the hungry don't read it.",
};

/** Widow Perrin, in her garden: by how far it's come, and in the evening once there's a bench. */
export const PERRIN = {
  name: 'WIDOW PERRIN',
  stages: [
    "This was the physic garden before the siege, sage and feverfew and my mother's roses. I won't be the one to cut that tree.",
    "Dug and fenced, and nothing in it. I asked Hollis for seed money and he looked at me like I'd asked for a horse.",
    "Marigolds. My mother would have called them common, and they are, and I don't care.",
    "Two benches, and I've not sat on either. Wenna's on one most of the day, telling the bees off.",
  ],
  evening: "Sit, if you like. Of an evening, with the lamp lit, you can nearly forget what's over the wall.",
};

/** The first time you come back to a raided town: Sergeant Dunn. */
export const RAID_NEWS = {
  who: 'SERGEANT DUNN',
  seen: (loss: string) => `While you were away the hungry came over the north wall in the night: ${loss}.`,
  line: "You missed it. They came over the north side in the middle watch and didn't take anybody, just pulled down what we'd mended and went.",
};

/** The game's own voice: the board and the works panel. */
export const MEND_UI = {
  board: (day: number, loss: string) => `Day ${day}: the hungry came over the north wall in the night. ${loss.charAt(0).toUpperCase() + loss.slice(1)}.`,
  hollis: "Every coin you give goes in my book, and every den you burn.",
  done: 'Done',
  gear: 'Weapons and armour for the walls count for half again what Halvard would pay.',
};
