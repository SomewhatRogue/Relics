# Relic: voice and style

How Relic sounds: every line a townsperson says, every job posting, every rumour, every bark, every
panel. Loosely in the spirit of Christopher Buehlman's The Blacktongue Thief and The Daughters' War
(see `research-notes.md`): gallows humour over real horror, people who talk like people, goblins
that frighten. In spirit only. Nothing of theirs is ours to take: no names, places, gods, terms or
scenes (the list is in `research-notes.md`, section 6). Read `story-bible.md` for what's true.

## The one rule

**Funny people in a frightening world.** The jokes are how Wickhold survives, not what it's about.
Banter in the town, dread in the dens, a joke after the scare, never a joke over a grave.

## What Wickhold is like (what everyone in town lived through)

- **The war was lost.** Not won at great cost. Lost. Everyone over twenty remembers the walls. Most
  of the people who ran things died on them; Wickhold is run now by whoever came back, which means
  a lot of people under thirty doing jobs their parents did, badly and stubbornly.
- **The town melted its bells.** In the siege they melted every bell in Wickhold for arrowheads and
  pot-shot. They didn't know then what bells do to goblins. Everyone knows now. Nobody talks about
  it, and everyone thinks about it when Barrowby's bell is mentioned. (Old people still flinch at
  the hour, because the hour used to ring.)
- **What they call goblins.** Almost never "goblins". *The hungry. Teeth. Greenies* (children and
  the rude). Soldiers say *tallymen* for the ones that keep count of captives. The church says *the
  Wanting*. Calling them goblins to their face, as it were, is for outsiders and heroes.
- **Oaths are about the Lantern and the walls.** *Lantern's wick. Coal and ash. By the wall.
  Burn me.* Rude ones are earthy and physical (*arse, piss, bollocks, shite*), never modern and never
  slurs. Swearing is seasoning: the guards and the tavern swear; Father Odric never does, which is
  why it's frightening when he does.
- **Money talk.** Everyone counts. Gold is food, arrows, a roof. People ask the price before they
  ask your name. Giving gold to the Lantern is the one place nobody haggles.

## Sentences

How it moves on the page is in `prose-notes.md` (read it; it's from the books themselves). In short:

- **People talk, they don't deliver lines.** A Wickhold voice is someone at a table telling you
  something, not a character saying something quotable. It can wander a little, hedge, correct
  itself, lose the thread and come back with *anyway*. That's allowed, and it's wanted.
- **Long, then short.** Most sentences run on with commas and *and*, carrying the detail. A short
  line comes at the end, only when something should land. Never three short punchy sentences in a
  row; that's the tell of writing lines instead of talk.
- **Concrete.** Things, not feelings. "The well tastes of copper since the siege" beats "the town
  has suffered much".
- **A detail first, then the name.** "The big one with the burnt ear, that's Dunn."
- **Mention, don't explain.** People don't explain their own world to each other. When something
  must be explained, it's a story about someone who got it wrong, not a rule.
- **The joke goes last**, and it's about a body or a person. Homely comparisons, ours not theirs:
  *drunk as a bishop's goat; cold as a smith's wife's feet*. One per speech at most.
- **Fewer sayings.** A neat aphorism in a whole scene is character; one a line is a fortune cookie.
  Same for fragments: fine for a terse speaker, a tic for everyone.
- **People talk past each other.** A trainer answers the question you should have asked. A drunk
  answers a different one.
- **Sad things are said plainly and then left alone.** "My boy went out the north gate in spring."
  No adjectives. The next line can be about the weather.
- **Speakers differ in length.** Hew and Gannet run on; Halvard and Cole barely speak. If everyone
  is clipped, nobody is.
- **The game's own voice stays plain.** What to press, what an item does, a cost: short, clear,
  second person, and kept apart from what a character says. Characters never do the tutorial's job.
- **No modern idiom** (*okay, guys, awesome, literally, vibe*), no fantasy throat-clearing (*verily,
  thou, mayhap*), no epic voice. People in Wickhold talk like tired, clever farmers and soldiers.
- **No em dashes.** Commas, full stops, colons. (Kyle's standing rule, for every line.)

## Emphasis (spoken lines)

Spoken lines type in with a voice blip per speaker (`src/client/speech.ts`), and a few words can be marked:
`*word*` bold, for the word a speaker leans on; `~word~` sways, for a lilt, wonder, mockery or a
drawn-out word; `^word^` warm green-gold, for good things (alive, home, a kindness); `_word_` dull red
and trembling, for bad things (the dead, burning, goblins' work). One or two marks in a line at most,
and many lines none. Never mark the plain game voice. Sad lines stay plain. The line editor places them.

## Goblins

- **Never comic grunts.** They're clever, practical, patient and cruel, and they work together. A
  den is a working thing: pens, tally marks, a cookfire that isn't for cooking animals.
- **Show, don't gore.** The horror is in props and absences: cut ropes, a child's shoe in a larder,
  hash marks on a wall in fives, an empty pen with the gate tied shut from outside. Leave the rest to
  the player.
- **How they talk** (barks, notes left behind, the odd line in a mission): a flat trade-tongue picked
  up from captives. Prices, counts and orders. They copy human phrases they've heard, in the wrong
  places, and that's the scariest thing about them.
  - Good: *"Four. Four in the pen. Good meat, the young one."* / *"Help me. Help me."* (in a dead
    woman's voice, from the dark) / *"You pay. Everybody pays."*
  - Bad: *"Puny human! We will crush you!"* (cartoon) / *"Gob smash!"* (comic grunt)
- **Bells.** A bell rung near a den makes them go quiet and wrong. Use it rarely; it's the
  town's one hope and it should feel like one.

## The people (registers)

Each voice is distinct. Put two of them in a room and they should rub.

- **Reeve Hollis** (town hall): twenty-six, the reeve because everyone older is dead. Counts
  everything, apologises for nothing, too tired for speeches. *"Four voices and the council decides.
  I'd rather it was forty. We have what we have."*
- **Father Odric** (church): kind, worn thin, keeping a secret he hates. Speaks softly, quotes nothing,
  changes the subject when the Lantern comes up. *"Give what you can spare. Then a little of what you
  can't. That's the part it eats."*
- **Mother Isolde** (church, Healer trainer): field surgeon, swears like a sergeant, prays like one too.
  *"Hold still, you great calf. There. Now go and get somebody else's blood on you."*
- **Master Cole** (barracks, Warrior trainer): old soldier, three fingers on his left hand, says
  little and means it. *"Again."* is a whole lesson.
- **Huntress Maeve** (lodge, Ranger trainer): dry, impatient, likes animals more than people and says so.
  *"You breathe like a bull in a barley field. Out on the draw, not in."*
- **Whisper** (the Drowned Rat, Rogue trainer): charming, a liar, kind once a year by accident.
  *"I don't teach. I let you watch me, and you pay for the seat."*
- **Magister Vell** (tower, Mage trainer): brilliant, frightened of nearly everything, talks too fast,
  lectures when nervous. *"Don't touch that. Or that. That one you may touch. Gently. No."*
- **Halvard the smith**: four words where forty would do. *"Good steel. Bad arm."*
- **Ivo the relic-wright**: nervous, curious, a little in love with the relics. *"Hear that hum? That's
  the frost. It likes you. Don't let it like you too much."*
- **Sister Agne** (infirmary): gentle, unshockable, notices everything.
- **The watch** (Dunn, Hob, Pike, Orla): underpaid, superstitious, funny in the way of people who might
  die tonight. They complain about boots.
- **Dicer Moll**: cheerful cheat, honest about it. **Barkeep Gannet**: gossip with a soft heart and a
  hard cudgel. **Rowan the bard**: news in rhyme, half of it wrong.
- **Old Wenna, Tam, Marta, the families**: ordinary people. Wenna is salty, Tam is fearless because he
  doesn't know better, the families are grateful and frightened and making bread anyway.

## Heroes

Heroes are the company: hired, brave, not saints. Text addressed to the player is plain and second
person ("You have 40 gold.") with no cheerleading ("Great job, hero!"). Victory text is quiet and
specific: what you saved, what it cost. Defeat text doesn't scold: "Driven back. Half the gold, nobody
home."

## Job postings (the board)

Written by the town, nailed up by Hollis: short, practical, a little desperate, a detail that sticks.
- Good: *"Barrowby. Six alive in the church cages at last count. Last count was four days ago."*
- Good: *"Tollan's Farm: the goblins have taken the barn for a larder. Burn it. Bring Tollan's dog if
  it's alive; he won't stop asking."*
- Bad: *"Rescue survivors from the goblin menace in the dangerous village of Barrowby."*

## Checklist (the lore keeper asks these of every line)

1. Would a tired, clever person in a walled town actually say this, out loud, in this many words?
2. Is there one concrete thing in it (a smell, a price, a name, an object)?
3. Is the joke earned, and is it off the grave?
4. Is anything explained that should only be mentioned?
5. Are goblins frightening, not silly?
6. Is anything taken from the Blacktongue books (names, terms, scenes)? Any modern idiom? Any em dash?
7. Does it read like talk, not lines (`prose-notes.md` section 2)? Any run of short punchy sentences,
   stacked sayings, tidy threes?
8. Does it agree with `story-bible.md` (and not give away what players shouldn't know yet)?
