# Your cloth: a cloak you choose, for every class

Kyle, 2026-11-17, on the knight's new cloak: "Or we make it like the shield - you can customize it (and we let all
classes customize theirs)."

**Status: a spec, not built. It waits on Kyle's calls at the foot.**

The model is the Warrior's shield (shared/shieldlook.ts, client/shieldui.ts): a few rows of choices at your trainer,
free, changed whenever you like, saved on the hero, seen by everyone in town and in your party. Looks only: the room
never reads it.

## What you choose

At your class trainer, on a page like the shield's (the same rows, hound.css), the hero drawn large beside it facing
you and walking away:

| Row | Choices | Who gets it |
| --- | --- | --- |
| Colour | The look's own (as drawn today, the default), then six cloths: the shield's six fields, so a cloak can match a shield | Every class |
| Edge | None, gold, silver, iron (the shield's trims) | Every class |
| Cut | Plain cape, lined cloak (the knight's, capelined.ts), ragged | Warrior only, to begin with |

What "the cloth" is, class by class:

| Class | The cloth | Where the edge shows |
| --- | --- | --- |
| Warrior | The cape or cloak behind him (herolife.ts) | Down its open sides and along the hem |
| Ranger | The hood and cloak | The hem, and the clasp |
| Rogue | The hood and the long cloak | The hem |
| Mage | The robe and the hat | The hem's band and the hat's band |
| Healer | The tabard over the robe (the robe stays pale: see the calls) | The tabard's edge |

Honest limits at this size (18 pixels wide): an edge is one pixel, so on the four classes whose cloth is part of the
body it is a hem line and little more. Colour is what will read, in town and in a fight. The outline of each class
does not change, so a class is still known by its shape (Kyle, 2026-11-05); two Warriors in one party can now be told
apart, which they cannot today.

## How it is kept and sent (as the shield is)

- `src/shared/clothlook.ts` (new): `ClothLook { colour, edge, cut }`, `defaultCloth` (the look's own, no edge, the
  look's own cut), `fitCloth` for anything heard from outside, and a pack of three small numbers.
- `Profile.cloth`, fitted on load (save.ts): a hero from before the choice gets the default, so nobody changes
  until they choose to.
- `Hero.clothLook` (sim/types.ts, drawing only), set where `shieldLook` is (game.ts, two places).
- Town presence carries it beside the shield and the hound (townpresence.ts packs, townfolk.ts unpacks).

## How it is drawn

- Each look names the colours its cloth is drawn in (a pair: cloth and its shadow). A chosen colour swaps that pair
  through the look's pixels and through what moves (cape, cloak, mantle, hem, tabard), before the sharp painting, so
  the shading and folds come out as they do now.
- `heroLook(cls, look, cloth)` builds a look in a chosen cloth the first time it is asked for and keeps it, as
  `shieldSprite` does. Seven places ask for a hero's sprites today.
- The six cloths are dark-and-gold colours: deep, none brighter than today's red, the white a bone white. Each is
  checked under torchlight and at night before it ships, since a pale cloak can glare.
- The 2.5D view draws heroes with the same code, so it follows with no work of its own.

## Slices

1. **The rules, the save, the sending, and the Warrior's page** (colour, edge, cut). Kyle plays it.
2. **Ranger and Rogue** (colour, edge).
3. **Mage and Healer** (colour, edge).

Each is main-chat work with no builder agent: slice 1 a medium change (one system, about ten files, most of them two
or three lines), slices 2 and 3 small. New player-facing words (the button, three row names, the colour names not
already on the shield's page) go to one lore-keeper call and one line-editor call per slice.

Not in this spec: cloths you earn (a boss's colours, a deed's device). The choice is built so they could be added
as more entries in a row.

## Whose files

The Art chat owns sprites.ts, herolooks*.ts, lookkit.ts, herolife.ts and actors.ts; the shield's page and the
trainer's panel are other chats' too; types.ts, game.ts and save.ts are shared. So this is either built here with
Kyle's go-ahead for small edits in those files (as the knight's cloak was), or handed to the Art chat with this spec.

## Kyle's calls

1. **Free, like the shield?** Suggested: yes.
2. **Keep "the look's own" as the default?** Suggested: yes, so every hero looks as they do today until they choose.
3. **The shield's six colours, so cloak and shield can match?** Suggested: yes.
4. **A cut for the Warrior (plain, lined, ragged)?** Suggested: yes; the knight keeps the lined cloak by default.
5. **The Healer's robe stays pale, and only the tabard and its edge change?** Suggested: yes. The pale robe is how
   a party finds its healer in a fight. The Mage's robe and hat change freely.
6. **Who builds it?** Suggested: this chat, slice 1 only, then you play it and say whether the other four classes
   are worth doing.
