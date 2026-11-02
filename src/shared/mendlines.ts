/**
 * What Wickhold says about itself as it's mended and raided: every new line for the town works, in
 * one place, for the lore keeper and the line editor. Picked by shared/townsays.ts.
 */
import type { WorkId } from './works.js';

export type Who = 'wenna' | 'tam' | 'gate' | 'dunn' | 'hob' | 'pike' | 'orla' | 'perrin' | 'rowan';

/** The town as it stands: still broken from the breach, mending, mended with the garden in flower. */
export const STATE: Partial<Record<Who, [string, string, string]>> = {
  wenna: [
    "Blood on the square again. I said after the siege I'd never see that twice, and here I am seeing it, with my knees the way they are. Somebody ought to put coin in the works and get the lye out, because it won't be me scrubbing.",
    'It\'s coming on. I walked the whole lane yesterday without climbing over anything, which at seventy-one is the most exercise I\'ll admit to.',
    "I sat in Perrin's garden last night with the marigolds and thought, this is what it was like before. Near enough. The well still tastes of copper, mind. Some things you don't get back.",
  ],
  tam: [
    "There's a dead crow by the gate and Mam says don't poke it. I didn't poke it. I poked near it.",
    'Mam says the town looks like a town again. I said it looked like a town before. She said not one you\'d want.',
    "Widow Perrin let me plant a whole row. If they come up crooked it's the seeds' fault, I told her that, and she said she'd write it down.",
  ],
  gate: [
    "Mind where you stand, the stones by the gate are still sticky. We've been throwing sand on it. The sand doesn't help, it just makes it gritty.",
    'Somebody scrubbed the gate. I came on watch this morning and thought for a moment I was at the wrong one.',
    "Gate's the same as ever, oak and iron. It's the wall either side of it I've stopped lying awake over. Mostly stopped.",
  ],
  dunn: [
    "See that stretch of the north wall, all hurdles and somebody's cart lashed up with rope? That's where they came over. I've two men and a rope holding it, and the rope's the best of us.",
    "Lanes clear enough to run down now, which matters more than you'd think, because the last time we had to run down them we went over a dresser.",
    "Clean square, lamps lit, a wall I'd put my back to. I don't trust it. Twenty years on the walls and you don't trust anything that looks finished. Still. They're nice lamps.",
  ],
  hob: [
    "I've walked past the same burnt cart every night for a week now. I've started saying good evening to it. It doesn't answer, which is more than you get out of the sergeant.",
    'Half the town has put coin in and the other half complains about the hammering. Mind you, it\'s the same half.',
    'Walls mended, lamps lit, flowers by the well. My mother says I\'ll go soft. I told her the hungry don\'t care how soft I am, which didn\'t help her sleep.',
  ],
  pike: [
    'New boots, and I walk them through this every night. Blood comes out of leather with salt and spit, if you were wondering. I wasn\'t either, the first time.',
    "It's quieter on my round now the lanes are clear. Not quiet. Quieter. I'll take quieter.",
    "Quiet nights and lit lanes. I caught myself whistling on the east stretch. Orla told me to stop, and she has her reasons, so I stopped.",
  ],
  orla: [
    "The east wall's old stone and it'll hold. It's the north I lie awake over, all hurdles and rope where it came down. I've seen sheep pens built with more conviction.",
    "It's better than it was, the north stretch, and I'll say so to anyone. Quietly, mind, because the last time I said a wall was good it heard me.",
    "I've stopped whistling on watch. Something out there still whistles back some nights, but further off now. A good deal further.",
  ],
  rowan: [
    "I've a song about the night they came over the wall, but nobody wants it yet, so it's the miller's daughter again. Name a tune.",
    "I've a new verse about the lanes being cleared. It isn't much of a verse, but it rhymes carts with hearts, which is more than most manage. Name a tune.",
    "Something cheerful, the town can stand it now. Perrin's garden has made me soft and I'll thank you not to tell anyone. Name a tune.",
  ],
};

/** A work just finished: who talks about it. */
export const NEWS: Partial<Record<WorkId, Partial<Record<Who, string>>>> = {
  wash: {
    wenna: 'Somebody scrubbed the square. I stood out here an hour this morning just looking at it, and Tam asked was I ill.',
    gate: "They've scrubbed the gate and buried the ones on Odric's cart. He said the words over every one of them, by name where he knew it. It took him till dark.",
  },
  lanes: {
    dunn: 'The lanes are clear. I ran the whole north round this morning without going over anything, and my knees thank you, even if my pride doesn\'t.',
    tam: 'They took the burnt cart out of our lane. I was going to keep it. I had it all worked out where the door would go.',
  },
  shutters: {
    hob: 'New shutters on the barracks. I slept the night through for the first time since spring, and woke up sure something was wrong.',
    wenna: "My shutters close. Both of them. I've been opening and shutting them all morning, and the neighbours think I've gone simple.",
  },
  lanterns: {
    hob: "You'd not credit the difference a lamp makes. Last night I saw a cat at forty paces. Only a cat, but I saw it.",
    pike: "Lamps along the lanes. I walked my round last night and could see my own feet. They're good boots. I'd forgotten.",
  },
  dig: {
    tam: "Widow Perrin's dug her garden and the dead tree's down. I helped. I carried a stick. A big stick, mind.",
    wenna: "Perrin has her garden dug. It was all herbs before the siege, that patch, and her mother's roses. She's been at it since dawn with a face on her like a sergeant.",
  },
  plant: {
    orla: 'You can smell the garden from the north wall when the wind sits right. It makes a change from what you could smell there before.',
    tam: 'Things are coming up in the garden. Perrin says the green ones are flowers and the other green ones are weeds and I\'m to learn the difference.',
  },
  arbour: {
    wenna: "There's benches in Perrin's garden. I sat on one an hour last night and nobody asked me for anything. First time in eleven years.",
    hob: "There's always somebody in the garden after dark now, on the benches under the lamp. I stop there on my round. I'm not meant to. Don't tell Dunn.",
  },
  stakes: {
    dunn: "Stakes across the breach, oak, and sharpened. It isn't a wall, but at least I've stopped counting the rope.",
    orla: "I leaned on the new stakes last night and they didn't move. That's the most a wall's done for me since I joined.",
  },
  timber: {
    orla: "There's a walk along the top of the new timber, and I can see over it now. I'm not sure I wanted to, but it beats guessing.",
    dunn: "I've walked the new timber end to end twice. It creaks in the middle, and the carpenter says it's meant to. I told him so does my back, and that isn't meant to either.",
  },
  stonewall: {
    wenna: "Stone across the breach. I watched them set the last course. I saw these walls go up the first time and now I've seen them mended, and I'd like that written down somewhere, if Hollis can spare the ink.",
    orla: "Stone where the breach was. I put my hand on it after my watch and it was still warm from the day, and I'm not ashamed to say I stood there a while.",
  },
};

/** The days after a raid. */
export const RAID: Partial<Record<Who, string>> = {
  wenna: "We'd only just got the place looking like somebody cared for it, and they came over in the night and undid half of it. Well. I'm too old to start again and too stubborn not to, so get your purse out.",
  tam: "They came in the night. Mam put me under the bed with the dog. The dog was more frightened than me. I'm not saying I wasn't frightened.",
  gate: "They never came near the gate. They don't need the gate, and that's the part that keeps me up.",
  dunn: "They came over where the wall's weakest, same as always. We held them at the square and we didn't hold the rest. Put coin in and we'll mend it again, and next time I'd like a good deal more wall.",
  hob: 'I was on the north stretch when they came over. I\'d tell you about it, only I don\'t want to, so I\'ll tell you about my boots instead. Ruined.',
  pike: 'Two lamps gone and a good deal of sleep. The lamps you can buy again.',
  orla: 'Did you hear them in the night? They whistle when they go over the wall. I\'ve heard it twice now, and I\'d know it anywhere.',
  perrin: "They went through my beds. Didn't take anything, didn't eat anything, just walked up and down them in rows, back and forth. That's the part I can't stop thinking about.",
};

/** Long after a raid, some still talk about it. */
export const REMEMBER: Partial<Record<Who, string>> = {
  wenna: "I kept a stone from the night they came over. Hollis asked me what for. I told him it's so I remember to stay angry, which at my age you have to write down.",
  dunn: "Since they came over that night I walk the north stretch twice. Hollis says it isn't in the roster. I've told him the hungry don't read the roster.",
};

/** Widow Perrin, in her garden: by how far it's come, and in the evening once there's a bench. */
export const PERRIN = {
  name: 'WIDOW PERRIN',
  stages: [
    "This was the physic garden before the siege, feverfew and sage and my mother's roses. The soldiers camped on it and the hungry trampled what the soldiers left. That tree's dead, and I won't be the one to cut it. Somebody else can, if the town will pay for a fence after.",
    "It's dug, it's fenced, the tree's down, and now it's the dearest bare earth in Wickhold. Seed costs. I asked Hollis to put it on his list and he looked at me like I'd asked for a horse.",
    "Look at that. Marigolds. My mother would have said they're common, and they are, and I don't care. Somebody ought to put a bench in, so the old ones have somewhere to sit and tell me I'm doing it wrong.",
    "Two benches, and I've not sat on either. Wenna's on one most of the day, telling the bees off.",
  ],
  evening: "Sit, if you like. Of an evening the lamp's lit and the marigolds close up and you can nearly forget what's over the wall. I come out here so I don't have to think about it, and then I think about it anyway, but at least I'm sitting down.",
};

/** The first time you come back to a raided town: Sergeant Dunn. */
export const RAID_NEWS = {
  who: 'SERGEANT DUNN',
  seen: (loss: string) => `While you were away the hungry came over the north wall in the night: ${loss}.`,
  line: "You missed it. They came over the north side in the middle watch, more of them than we had arrows for, and they didn't go for the gate or the Lantern or anybody's throat. They went for what we'd mended. Pulled it down, fouled it, and went. That isn't hunger. That's somebody telling us something.",
};

/** The game's own voice: the board and the works panel. */
export const MEND_UI = {
  board: (day: number, loss: string) => `Day ${day}: the hungry came over the north wall in the night. ${loss.charAt(0).toUpperCase() + loss.slice(1)}.`,
  hollis: "Everything this town builds, it builds out of what people give. I write down every coin, and every den you burn too. Somebody should.",
  done: 'Done',
  gear: 'Weapons and armour for the walls count for half again what Halvard would pay.',
};
