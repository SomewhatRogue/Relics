# The town says again where you stand: decisions

## 2026-11-17: two players in Wickhold in different spots on each other's screens (Claude Fable 5.2)

Kyle: "one person comes into the game ... and the other person is in a different spot on their screen. Like,
they're not both sending their same location to each other."

- **Found, and shown in a test on main's code** (`tests/townresay.test.ts`): the town's words are sent once
  and trusted to arrive. The others carry a walker on along the last walk they heard, for up to three
  seconds (reckon.ts). So one lost "stopped" leaves you drawn 9 tiles from where you stand on everyone else's
  screen, and nothing puts it right until you move again or the two-minute word. A lost `hi` leaves a newcomer
  and the town unseen by each other as long. Words do get lost: a relay's subscriber resetting, a socket
  between two connections (docs/ONLINE.md, 2026-11-05).
- **Fix** (`client/townfolk.ts`), only with someone in the place you're in: where you stand is said again
  once, 1.5 s after your last word if you've stood still since (`SETTLE`), then every 20 s (`NEAR`) in place of
  every 120. On arriving, `hi` is said once more after 3 s if nobody answered (`HI_AGAIN`), and a word from
  someone you hadn't heard of is answered as a `hi` is.
- **Cost**: two players standing in one place: 3 words a minute each where it was one every 2 minutes; when the
  town is split over two relay instances that is about 180 Redis commands an hour each (it was 30). Alone in
  your place, or alone in town: one more word per arrival, nothing else. `tests/townbudget.test.ts` still
  passes its limits. Kyle to say if 20 s is too chatty; 30 or 45 would still mend it.
- **Two tests of other chats' changed, by a line or two each**, because they counted every word in town and
  the count is now one more: `tests/runnerecho.test.ts` (Town quests) counts words by what they say of the
  runner; `tests/petting.test.ts` counts words that aren't about where you stand. What each proves is the same.
- **Not fixed, for Kyle to decide**: two pages on different builds draw Wickhold from different layouts
  (`at` is only the place's name, and the town was laid out afresh on 2026-11-16), so a tab left open across
  a deploy shows everyone somewhere else, and nothing tells that page to reload. A build stamp in the `hi`
  and one line asking the older page to reload would close it; that is new player-facing words.
