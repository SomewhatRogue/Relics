# Lantern Square, built round the Lantern

Kyle, 2026-11-13: "Theres almost too much going on in town ... the roll of the brave the statue the jobs the
town works etc. seems disorganized. I'd like it to seem more defined and maybe around a central thing."

His calls (asked the same day):
- **The centre:** the Last Lantern on a round stepped dais in the middle of the square. The statue stands on the
  dais in front of it; the Roll of the Brave's names are cut round the dais. One monument to walk up to.
- **The boards:** Best in Wickhold moves into the town hall. The vote goes; "if you're one of the best you get
  a weekly stipend you can collect."
- **The council, with no vote:** the reeve decides by deeds. Each choice has its own jobs on the board; whichever
  side the town did more of by the week's end wins. The hall shows the tally instead of ballots.
- **The stipend:** the top three on each Best in Wickhold board, more for a higher place (about 60, 40 and 20
  gold a week a board, tuned against the gold economy).

## Slice 1: the square (art chat)

- The dais at the Lantern's old spot, moved a little south to sit in the square's middle: two round stone steps,
  a stone column on them, the Last Lantern on top, tall enough that its flame shows over the statue's head.
  One list of boxes for both views (pieces.ts), a new round kind `dais`; its light where the flame is.
- The statue's plinth on the dais's lower step, in front of the column (PLINTH moves).
- The Roll of the Brave: gilt name plates cut into the front of the lower step; its spot at the dais's front.
  The old Roll stone goes.
- The north edge keeps the job board and the works sign, either side of the road in from the gate, the
  braziers between them. The brazier in front of the old Roll stone goes. Benches, the well, the stalls and
  the bard stay round the edge; Old Wenna and the hero's arrival point move off the dais.
- Cobbles in a ring round the dais.
- Best in Wickhold keeps its spot on the north edge until slice 2 gives it a place in the hall.

## Slice 2: the town hall (a systems chat)

- The vote boards come out of the hall (client/voteboards.ts, the `vote` hangs in shared/townhalls.ts, the vote
  buttons in townui.ts, the ballots in worldsync). Best in Wickhold's boards hang there instead; its spot moves
  in from the square.
- The council's open decision is settled by deeds: each choice has jobs on the board tagged to it; the room
  counts the jobs done for each side over the week (shared, synced like the ballots were); at the week's close
  (councilweek.ts) the side with more wins, a tie going to whichever was ahead first. The reeve and the two
  advocates say where the tally stands; the hall shows it where the vote boards were, or on the Best boards'
  frame.

## Slice 3: the stipend (a systems chat)

- At each week's close the world keeps the top three of every Best in Wickhold board (who, which board, which
  place). Through the next week each of them can collect at the town hall (the clerk at the map table): 60, 40
  or 20 gold for each board they placed on. Once a week a player; what's not collected lapses at the next close.
- Shown: a line on the Best panel ("Your stipend this week: 80 gold. Collect it from Tamsin."), and Tamsin's
  button. New player-facing lines go through the lore keeper and the line editor once.

## Not changing

The fight; the jobs and works themselves; the statue's bidding (through Judd); the Roll's records.
