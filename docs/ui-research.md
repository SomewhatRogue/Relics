# Relic UI research: emulating Diablo and Path of Exile, mobile first

Written 2026-11-04 by Claude Opus 5.5. Research only, no code changed.

Screenshots cited are in the session scratchpad (`shots-*/`). Relic plays **portrait** on phones (1170x2532 shots), unlike Diablo Immortal and Torchlight: Infinite (landscape). Archero is the portrait reference. Everything below assumes portrait phone first, then laptop.

How sure each claim is: the claims with a source link were checked against that source this session. The claims marked *(play knowledge)* come from knowing these games, and the web pages I could reach didn't spell them out. Treat those as strong defaults, not quotes.

---

## 1. What's wrong with Relic's UI now

The art is pixel, torch-lit and integer-scaled. The UI is a dark-mode web dashboard laid over the top of it. These are the causes of the "AI slop" read, roughly in order of how much each one hurts.

1. **A terminal font everywhere.** `style.css:3` sets the whole UI to `ui-monospace, Menlo, Consolas, monospace` at weight 600 with 0.04em tracking, and headings add 0.15 to 0.4em more (`#pack h2` 0.2em, `#lesson.found-relic .found` 0.4em). System monospace is the strongest "made by a dev tool" signal there is. Shop flavour text is *italic* monospace (`shop.css` `.place`; `shots-shops/phone-pawn-card.png`), which reads as code comments. The floating combat text uses a second, unrelated type system, the 3x5 pixel font (`pixfont.ts`). Two type systems, and neither is designed for the UI.
2. **Every surface is the same generic component**: a flat `#1b1922` fill, a 1px `#4f4a5c` border and a 4 to 6px radius, with a gold `#ffd27a` border for "primary". The same button is redefined about 8 times (`#panel button`, `#title button`, `#pack .row button`, `#pack .detail button`, `.rbtns button`, `#partycard .pc-acts button`, `#options button`, `#chat button`). No material says stone, iron, wood or parchment. The radii and smooth borders don't sit on the game's pixel grid.
3. **Pastel accents on purple-black.** The neutrals are purple-tinted (`#14121a`, `#1b1922`, `#2a2733`, `#4f4a5c`), not the approved cool grey stone. About seven accents compete: light blue `#9fd0ff` (used for random info text such as `#pack .row em`, `#banner span` and `#title .slot span`), gold, mint `#b8f0a8`, lilac `#c9a8ff`, salmon `#ff9a8a`, cyan `#9fe8ff` and orange. Gold is supposed to mean "the way on", but here it means "any button".
4. **The HUD is a text dump** (`index.html` `#hud`, `main.ts hud()`). The top-left shows: the name, class and level; a **6px** HP bar (`.bar { height: 6px }`); a 6px stamina bar; the weapon name; an all-caps kit line ("TAP: SHORT SWORD HOLD 1.4S: PIERCING SHOT PARRY, NO BLOCK", `main.ts` `KIT`); the skill; the relic; and the belt. In `shots-lobby/phone-job-quick.png` it wraps across a third of the screen and under the chat strip. Health is the most important number in an ARPG, and here it's the thinnest thing on screen.
5. **Touch buttons are labelled CSS circles** (`style.css` `.tb`, `.attack`, `.block`, `.roll`, `.relic`, `.relic2`, `.potion`, `.grab`). They carry words, not icons: ATTACK, PARRY, JUMP, JAVELIN, BITTER (BITTER is the potion, and nobody would guess that). Each has an arbitrary colour: rust attack, blue block, grey roll, cyan skill, lilac relic. They're placed by hand-tuned px offsets, not an arc. The potion floats left above the stick (`bottom: 222px`), and the second skill sits high right (`bottom: 206px`). In `shots-mage/1-fire-spiders.png` and `shots-lobby/phone-job-quick.png` the JUMP and PARRY buttons sit **on the hero's sprite**. The cooldown is a conic gradient with the text label printed over it. The stick is a flat grey `#888780` ring.
6. **The top-right is a web toolbar**: text pills reading PACK, LEAVE, HEROES, TIPS, SND, the music glyph and ?. In `shots-pack/phone-job.png` "LEAVE" is clipped under "SND". CHAT hangs underneath as an extra pill. The banner box (`#banner`), with the job, the objective, gold and unicode hearts, floats separately below it. On a laptop (`shots-chat/laptop-town-log.png`) it's seven buttons in a row.
7. **One generic modal for everything** (`panels.ts`): the job board, council vote, NPC talk, church, results and level up are all a gold monospace `<h2>`, then paragraphs, then a row of buttons plus CLOSE. **NPC dialogue has no speaker presence.** It's `<b>Father Odric:</b> "line"` inside the modal (`townui.ts say()`), with no portrait and no name plate. The council (`shots-townhall/phone-3d-council.png`) is a wall of text with three buttons wrapping unevenly.
8. **The pack and compare** (`pack.ts`, `cells.css`, `shots-pack/phone-compare.png`, `phone-job.png`):
   - Dashed borders on every empty slot make it look like a wireframe.
   - Labels inside tiles are 7 to 8px ("SWORD A…").
   - The compare is two boxes of italic monospace prose, then a 14-row number table that runs off the bottom of the panel (the SWING row is cut off).
   - The panel covers two thirds of the screen mid-job while the fight keeps going.
9. **Shops stack a modal on a modal** (`shopui.ts pop()` puts `.spop` over `#panel`; see `shots-shops/phone-pawn-card.png`). The goods are a plain list of rows.
10. **The loot card is a spreadsheet** (`lootcard.png`): a tier chip, three trait lines, then 8 stat rows each spelling out "better" or "worse", at the moment of pickup, in the middle of a fight. On a phone it jumps to `top: 160px`.
11. **Damage numbers pile up.** In `shots-mage/1-fire-spiders.png` five "18"s and four "BURNING" labels overlap into an unreadable heap. Every hit is the same size and colour, so a crit or parry doesn't stand out.
12. **Rarity is only a 2px border colour** (`shared/gear.ts TIERS`): PLAIN `#e8e4ee`, FINE green `#7fd07a`, FORGED `#6aa8ff`, TOLMOUTH `#b57aff`, HUNGRY `#ff4a3a`. FINE green collides with the "better" green (`.cmp em.up #7fd07a`, the same hex) and with goblin green.
13. **The chat quick strip** is a 3x3 grid of identical buttons over the top-right of the play area (`chat.css` `.chat-quick`; `phone-job-quick.png`). It covers the banner and the room's exits.
14. **Small tells add up:**
   - Unicode hearts and the music glyph in a system font.
   - Pastel "kind" chips on the party card (`partyhud.css`).
   - `box-shadow` glows (`.grab` pulse, `.tb.hint`) that are soft and blurred, not pixel.
   - `transform: scale(0.94)` and `brightness(1.5)` on press: browser defaults, not designed states.

The fix isn't "add ornament". It's **one material system on the game's pixel grid, icons instead of words, far fewer colours, and a layout that leaves the screen to the fight.**

---

## 2. Per element: what the reference games do, and what Relic should do

### 2.1 Health and resource (orbs and bars)

**References**
- **Diablo IV**: a health orb and a class-resource orb flank the skill bar in the lower HUD, with a potion counter (default 4) beside them ([Gamepressure](https://www.gamepressure.com/diablo-iv/interface/z0109a5)). The HUD has a **Left Corner** or **Center** layout option ([Destructoid](https://destructoid.com/?p=386375)). Blizzard kept the corner layout for consoles, because players sit farther away ([Blizzard Q-update Feb 2020](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).
- **Path of Exile 2**: a Life/Energy Shield orb at the left and a Mana orb with a Spirit readout at the right. Numbers show on hover or with a setting ([Mobalytics](https://mobalytics.gg/poe-2/guides/user-interface)). A dedicated Rage meter was later moved off the buff bar to sit beside the mana globe ([PoE Vault](https://poe-vault.com/poe2/news/major-ui-qol-upgrades-added-with-poe2-last-of-the-druids-update)). The console UI condenses life, mana, ES, spirit, rage and buffs into one place ([PoE forum](https://www.pathofexile.com/forum/view-thread/3672881)).
- **Diablo Immortal (mobile)**: the level and a **red HP bar sit top-left with the portrait**, not an orb. The potion is a button above the skill hub ([Fextralife](https://diabloimmortal.wiki.fextralife.com/Combat)).
- **Hades**: health sits at the bottom-left in peripheral vision. At low health the bar **pulses and flashes** ([Rowley, Medium](https://medium.com/@Nat.Rowley/how-hades-creates-a-responsive-underworld-915715a7c2a)).

**Recommendation for Relic (phone)**
- **Make the potion button the health orb.** It's a round flask button in the touch cluster, filled with red liquid to the hero's HP fraction (a pixel liquid line with 2 to 3 stepped bands, like `light.ts`). It shows a count badge and a dark glass frame. Diablo's orb, Immortal's potion button and Hades' pulse in one object, right under the thumb. Below 30% HP the liquid pulses in 2-step frames and the screen edge gets a dark red dither vignette (draw it in the `glow` layer).
- **Stamina** becomes a **segmented arc of pips** hugging the top-left of the ATTACK button (5 to 10 pips, bone coloured, not gold). Your eye is already there when you dodge or block. Winded: the pips go dark red and flicker in steps (the current `.winded` logic stays).
- **Top-left unit frame**: a 32x32 pixel portrait (reuse `heroLook().down`, as `#title .face` does) in an iron socket, with a level badge on its corner. Beside it, an HP bar **at least 10 CSS px tall on a phone**, with a darker "recent damage" trail bar that drains after 0.4 s *(D4 and PoE2 both show the chunk you lost, play knowledge)*. Poison turns the fill sickly green (already done, keep it).
- **Laptop**: the D4 layout. A bottom-centre bar with the HP orb at its left, skills and potion in the middle, and a stamina orb or arc at its right. Offer "corner" or "centre" as one setting, as D4 does.
- Delete the weapon, kit, skill, relic and belt text lines from the HUD. That information belongs in the button icons and the tooltips.

### 2.2 Skill buttons, cooldowns and the attack cluster

**References**
- **Diablo Immortal**: a large attack button on the right that auto-targets the nearest enemy, with **smaller ability buttons fanned around it**. The ultimate appears beside the fan when it's charged ([TechRadar](https://www.techradar.com/news/ive-played-diablo-immortal-how-blizzards-dark-action-rpg-plays-on-smartphones); [Fextralife](https://diabloimmortal.wiki.fextralife.com/Combat)).
  - **Hold to attack continuously.**
  - Drag-and-hold on a skill shows its aim arrow, cone or lane, and releasing fires it.
  - A skill on cooldown is **greyed with the seconds remaining as a number on the icon**.
  - Settings offer **two skill-button layouts**.
- **Diablo IV**: the skill bar shows cooldown completion on each icon, and evade has its own icon ([Gamepressure](https://www.gamepressure.com/diablo-iv/interface/z0109a5)). Any skill can go in any slot, and slots can be rebound on controller ([Blizzard Q-update](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).
- **Path of Exile (controller)**: four skills on the face buttons, and holding a trigger swaps in four more ([Dexerto](https://www.dexerto.com/gaming/does-path-of-exile-have-controller-support-2195171)). PoE2 players say a held modifier is awkward mid-fight ([PoE forum](https://www.pathofexile.com/forum/view-thread/3589215)).

**Recommendation for Relic**

Use a fixed **arc around ATTACK**, anchored to the bottom-right safe area. Suggested geometry on a 390x844 CSS viewport:
- **ATTACK**: 84px circle, centre at (right 66, bottom 86). This is the hub.
- **Ring 1** (radius about 104px from the attack centre), anticlockwise from the bottom:
  - **DODGE** at 200 degrees (low left).
  - **BLOCK/PARRY** at 160 degrees.
  - **SKILL** at 120 degrees.
  - **RELIC** at 85 degrees (straight up).
- **POTION** (the HP orb, 2.1) at 235 degrees, low and nearest the screen edge. It's the panic button, so the thumb shouldn't have to hunt for it.
- **Context slot** at about 55 degrees (up and right, above RELIC). GRAB, THROW, HELP UP, BURN, OPEN, ENTER and TALK all appear in **this one slot** with a gold ring, because gold means "the way on" or "you can act here". The current `.use` replacing ATTACK in town is fine, but in a run it should use this slot.
- Ring buttons: 56 to 60px. The context slot: 58px.
- Keep the whole cluster below roughly `bottom: 260px`. Today's hero stands about 200px up from the bottom, so the camera should frame the hero **above** the cluster: offset the camera so the hero sits at about 45% screen height on touch.

Button anatomy (all buttons):
- An **icon, not a word.** Draw it in code at 16x16 or 20x20 and scale it 3x, as `itemicons.ts` and `skillIcon()` already do. Attack shows the held weapon's icon. The skill uses the skill's icon, tinted by element (`EL_COL`).
- Cooldown: a **dark sweep stepped in 8 or 16 wedges** (not a smooth conic gradient), plus the **seconds left in the pixel font** in the centre, as in Immortal. When it comes ready, one white ring flashes for 2 frames, plus a click sound.
- Pressed: the button drops 2px and its bevel inverts. No `brightness` filter.
- Unavailable (DARK relic, Mage without a guard): the icon desaturates and the button gets a stone frame. Don't use a dashed border.
- Aiming: keep hold-to-charge on ATTACK. If skills ever aim, use Immortal's drag-to-aim lane, drawn as a floor telegraph in the same red-family language but bone-white, so the player's own aim never reads as an enemy telegraph.
- On first launch, offer **two layouts** (left-handed mirror and compact), as Immortal does.

### 2.3 The virtual stick

**References**: Immortal uses a floating stick on the left ([TechRadar](https://www.techradar.com/news/ive-played-diablo-immortal-how-blizzards-dark-action-rpg-plays-on-smartphones)). In Archero, moving is the only input, and releasing the stick makes you stand and auto-fire ([Pocket Gamer](https://www.pocketgamer.com/archero/how-to-play-archero-the-latest-free-mobile-rogueli)). On small phones Immortal players often recommend a pad, because the touch layout gets cramped ([SegmentNext](https://segmentnext.com/diablo-immortal-best-settings)).

**Relic**
- Keep the floating stick, which spawns where the thumb lands (it already does this).
- Restyle it as a **stone ring** (the 2-tone bevel from the frames in section 3) with an **iron knob**, so it isn't a grey disc.
- Hide the idle ghost entirely once the player has moved 3 times. The ghost at 35% opacity (`body.touch .stick`) is clutter.
- Add a **creep notch**: a faint inner ring at the walk/creep threshold, which teaches the stealth mechanic visually (`tips` currently explains it in words).

### 2.4 Damage numbers and hit feedback

**References**
- **Diablo IV** codes its combat text by colour: white is a normal hit, yellow a crit, blue Overpower, orange crit plus Overpower ([AlcastHQ](https://alcasthq.com/diablo-4-why-does-combat-text-have-different-colours/)).
- D4 testers asked for a cleaner combat area, with fewer floating numbers and hit flashes, and for monster names inside health bars ([Blizzard forum](https://us.forums.blizzard.com/en/d3/t/diablo-iv-ui-ux-feedback-from-a-graphic-designer/9549)).
- Immortal shows damage numbers and per-enemy HP bars, and heavy hits shake the screen ([Fextralife](https://diabloimmortal.wiki.fextralife.com/Combat); [TechRadar](https://www.techradar.com/news/ive-played-diablo-immortal-how-blizzards-dark-action-rpg-plays-on-smartphones)).
- In Hades, every hit gives distinct feedback, with sound and visuals paired ([Rowley](https://medium.com/@Nat.Rowley/how-hades-creates-a-responsive-underworld-915715a7c2a)).

**Relic** (keep `pixfont.ts`, which is right for this)
- **Merge numbers per target.** Hits on the same enemy within 0.35 s add into one number that ticks up and grows one step. This fixes the pile in `shots-mage/1-fire-spiders.png`.
- **Three sizes**, all at integer scale:
  - Normal: 1x, bone white.
  - Heavy or crit: 2x, gold, with a 1px dark outline.
  - PARRY, BACKSTAB or a perfect release: 2x with a white ring burst and a one-word call.
  - Damage to you: red, and it drifts down rather than up.
- **Status words become icons.** BURNING, POISONED and STUNNED show once per target as a 7x7 icon over the head (flame, drop, stars), not repeated text. Show the word only the first time a player meets that status.
- **Spread pattern**: alternate the numbers left and right on an arc rather than stacking them in place *(D4, play knowledge)*. Cap it at about 6 live numbers on a phone.
- Feel: 40 to 60 ms hit-stop on heavies and parries, a 1-frame white flash on the struck sprite, and screen shake only for heavy, slam and parry. Respect `prefers-reduced-motion`.
- Enemy HP: a thin bar under elites and named foes only. The boss bar moves to the top centre under the tracker with a framed name plate. On a phone it currently sits at `top: 160px`, a floating line of text.

### 2.5 Inventory: grid or slots, tooltips, comparing, rarity

**References**
- **Diablo IV** dropped different-sized items to avoid "interrupting gameplay with pockets of inventory management". It moved icons to a look "based off the 3D models", reduced the brightness and saturation of icon backgrounds, and signals rarity with "secondary visual cues ... via the border decoration" ([Blizzard Q-update](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).
  - Inventory tabs: Equipment, Consumables, Quests, Aspects ([Gamepressure](https://www.gamepressure.com/diablo-iv/interface/z0109a5)).
  - Rarity: Normal white, Magic blue, Rare yellow, Legendary orange, Unique gold ([Charlie Intel](https://charlieintel.com/diablo/diablo-4-rarity-system-all-rarity-colors-explained-256002)).
  - Compare: by default the game shows whether a new item's Item Power is higher or lower than what's worn. Holding Shift (Y or Triangle on a pad) shows the full stat-by-stat compare, with gains glowing green ([Den of Geek](https://www.denofgeek.com/games/diablo-4-best-hidden-setting-compare-gear); [Gamepressure](https://www.gamepressure.com/diablo-iv/how-to-compare-items/z4109c7)).
- **PoE2 console**: players complain that the stats page isn't beside the inventory, and that good loot and currency are hard to spot ([PoE forum](https://pathofexile.com/forum/view-thread/3623046)).
- D4 testers said icons **shouldn't rely on colour alone**, and that colour belongs mainly in highlighted states ([Blizzard forum](https://us.forums.blizzard.com/en/d3/t/diablo-iv-ui-ux-feedback-from-a-graphic-designer/9549)).

**Relic**
- **Keep a 1x1 grid** (as D4 does) and keep the paper doll. That's right for 8 slots.
- Phone: tiles at least 56px, and the **icon fills the tile** (now it's 72% with a label under it).
- Remove the word labels from the doll slots. Empty slots become **recessed stone sockets with a faint glyph silhouette** (ring, chest, blade, flask) instead of dashed boxes reading RING and BODY.
- **Rarity on two channels**: the frame *grade* (plain stone, then iron, then bronze rivets, then gilt corners, then hungry's cracked red frame that pulses) plus a dim background tint. That follows D4's border-decoration idea, so it works for colour-blind players.
- **Upgrade badges on tiles**: a small pixel ▲ in the corner of any pack tile that beats what's worn, and ▼ for a downgrade, as D4's item power indicator does. Most of the time the player never needs the full compare.
- **The tooltip as a bottom sheet on a phone** (it slides up over the cluster, and the fight is paused or the hero still):
  1. A header plate tinted by rarity grade, with the name in the display font and the tier and type in small caps.
  2. One "how it fights" line.
  3. Mods as rows with diamond bullets.
  4. HUNGRY's gift and cost as a split block (bone and red).
  5. Buttons: EQUIP (gold), plus a COMPARE toggle.
- **Compare**: show **only the rows that change**, as `name  now ▸ new  ▲+12`, with green ▲ and red ▼ arrows **and** the sign. Put the full 14-row sheet behind "All numbers". This cuts the overflow in `shots-pack/phone-compare.png`.
- **Rethink the tier colours** (`shared/gear.ts TIERS`, display only):
  - FINE should move off green, because "better" and goblins use it.
  - A suggestion: PLAIN bone `#b8b2a4`, FINE steel `#8fb0cc`, FORGED bronze `#d08a3c`, TOLMOUTH violet `#a37ad6`, HUNGRY blood `#d8392b` with a pulse.
  - That's a ladder of grey, cool, warm, magic, cursed, and it never touches goblin green or "way-on" gold.

### 2.6 Vendor and shop screens

**References**: Diablo vendors put the vendor's goods and your inventory side by side, with sell-from-inventory and buyback *(play knowledge)*. Immortal's menus keep their mobile scale even on PC ([Blizzard, Immortal on PC](https://news.blizzard.com/en-us/article/23797159/pc)). A D4 inventory case study asks for item lock and bulk sell at vendors ([Anabel S.](https://anabelsa87.myportfolio.com/diablo-4-inventory-case-study)). A Torchlight: Infinite review counts "obscene amounts of menus" as a downfall ([GameGrin](https://www.gamegrin.com/reviews/torchlight-infinite-review)).

**Relic**: one **vendor screen** for every shop (`shopui.ts` already has one layout; reskin it rather than adding a new one).
- **Top**: the keeper's name plate and pixel bust, and **one** spoken line that types in. Tap it for more. The place description goes; the keeper's line does that job.
- **Tabs**: BUY, SELL and BUYBACK (and FORGE or VAULT where they apply), as stone tabs.
- **Body**: the goods as a **tile grid**, with each tile's price under it as a coin icon and a number. Unaffordable goods have a dimmed price, not a dimmed item.
- **Tap a tile**: the same tooltip bottom sheet as the pack (2.5) with BUY. This replaces `.spop`, the modal on a modal.
- **Footer**: your gold, pinned. On SELL, your pack grid takes over the body.
- Laptop: goods on the left, pack on the right, as in Diablo.

### 2.7 NPC dialogue

**References**: in Hades, dialogue is a large character portrait plus a name plate and a text box at the bottom, and NPCs respond to the player and reference past events ([Rowley](https://medium.com/@Nat.Rowley/how-hades-creates-a-responsive-underworld-915715a7c2a)). Immortal and D4 zoom the camera with a bottom text box and stacked options *(play knowledge)*.

**Relic**: a **bottom dialogue box**, never the centred modal.
- A parchment-on-stone frame across the bottom 35% (over the touch cluster, which hides while talking). The world stays visible above it.
- Left: a **pixel bust portrait** (48x48 drawn, shown at 3x) in a framed socket, breaking the top edge of the box by 8px, as Hades' portraits do. Above it, a name plate (`FATHER ODRIC`) in the display font.
- Text in the body font, sentence case, typed in by `speech.ts` (keep the emphasis styles: `.em`, `.good`, `.bad`). Tap to finish or advance, with a small blinking ▼ at the bottom right.
- **Choices**, the services the NPC offers (TRADE, TRAIN, GIVE 20, VOTE, LEAVE), as full-width stacked options with a ◆ bullet. TRADE and TRAIN open the vendor or trainer screen.
- The council vote: keep the question in the box. Each choice is a **card** with the choice's label, its one-line effect and a vote count shown as pips. Not paragraphs (`shots-townhall/phone-3d-council.png`).
- New lines here pass through `lore-keeper` and then `line-editor`, per CLAUDE.md, and stay short (Kyle prefers less copy).

### 2.8 Quest tracker and objectives

**References**: D4 shows the tracked quest's objectives in the HUD and the full journal on the map's Quests tab ([Gamepressure](https://www.gamepressure.com/diablo-iv/interface/z0109a5)). Immortal's quest log on the left "extends downward, sometimes covering the directional pad", which TechRadar calls its biggest control problem ([TechRadar](https://www.techradar.com/news/ive-played-diablo-immortal-how-blizzards-dark-action-rpg-plays-on-smartphones)). Hades pins a short mission at the top-left ([Rowley](https://medium.com/@Nat.Rowley/how-hades-creates-a-responsive-underworld-915715a7c2a)).

**Relic**: a **top-right tracker**, two lines and no box, text on a soft dark dither scrim.
- Line 1: the place name in small caps, plus a **room strip**: 3 diamonds for 3 rooms, the current one gilt (this replaces "1/3").
- Line 2: the objective with a counter, e.g. "Clear the goblins  6", where the 6 is a goblin-head icon and a number.
- Gold earned and get-ups move to a separate small row: coin and number, then pixel hearts (drawn, not unicode).
- It fades when the hero is under it (already done: `#banner.faint`). Tap it to collapse to line 1.
- It never sits over the bottom half, which is Immortal's mistake.
- The gold **way-on arrow** (`wayfind.ts`) stays. It's the best wayfinding Relic has. Give it a pixel chevron at the screen edge when the target is off-screen.

### 2.9 The minimap and map

**References**: PoE2 has a corner map and a Tab overlay map, with transparency and auto-centre settings ([Mobalytics](https://mobalytics.gg/poe-2/guides/user-interface)). D4's minimap shows enemies and climb spots ([Gamepressure](https://www.gamepressure.com/diablo-iv/interface/z0109a5)). Immortal shrank its minimap for PC because it was sized for mobile ([Blizzard](https://news.blizzard.com/en-us/article/23797159/pc)).

**Relic**: jobs are 5 to 10 minutes of 1 to 3 rooms, so **skip a corner minimap on a job.** The room strip (2.8) plus the gold arrow covers it, and a minimap would spend top-right space on information the screen already shows. In **town**, add a full-screen **town map** from the menu: a parchment sheet with building glyphs, your marker, the friends online, and the NPCs with something new marked by a gold ✦. Lower priority.

### 2.10 Party frames

**References**: Immortal and D4 stack small portrait frames with HP for party members under or beside the player's own frame *(play knowledge)*. PoE2's couch co-op lets each player open different interfaces at once ([PoE Vault](https://poe-vault.com/poe2/news/major-ui-qol-upgrades-added-with-poe2-last-of-the-druids-update); [Blizzard Q-update](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).

**Relic**
- Under the top-left unit frame, **stacked mini frames**: a 16px face, the name, and a 4px HP bar.
- A downed ally's frame turns grey with a skull glyph and a gold "help" pulse. Gold, because raising them is an action you can take, and the context slot shows HELP UP.
- In-world: the name tag over the ally (it exists) plus a tiny HP bar under their feet ring.
- The **gathering party card** (`partyhud.css`) gets the same unit-frame style. The pastel kind chips become small icon tags (sword for hunt, key for rescue, flame for burn).

### 2.11 Chat

**References**: Immortal on PC gained a full chat integrated with Battle.net ([Blizzard](https://news.blizzard.com/en-us/article/23797159/pc)). On mobile, ARPGs keep chat as a collapsed one-line ticker and use emote or quick-phrase wheels; D4 uses an emote wheel on controller ([GamesRadar](https://gamesradar.com/diablo-4-emotes-how-to-use)).

**Relic**
- Phone: replace the CHAT pill and the 3x3 quick grid (`phone-job-quick.png`) with a **speech-bubble icon** in the top bar, with an unread dot.
- **Hold that icon for a radial quick-line wheel** of the 8 lines (Help me up, Follow me, Wait, and so on). Release on one to say it. Tap the icon to open the full log as a **bottom sheet** with the input.
- In town, the 2-line peek stays (it's good) but moves into the **bubbles over heads**, which already exist and are the most "crafted" chat element Relic has.
- Laptop: keep the bottom-left log, framed like the tracker (a scrim, no box) with channel tags as small icons.

### 2.12 Notifications and loot pickup

**References**: Immortal's auto pickup filters by Normal, Magic or Rare ([SegmentNext](https://segmentnext.com/diablo-immortal-best-settings)). D4 shows ground labels in rarity colour and a light beam for top drops *(play knowledge)*. PoE2 console players say good loot is hard to see ([PoE forum](https://pathofexile.com/forum/view-thread/3623046)).

**Relic**
- **Gold and potions auto-pick up** with a small "+12" coin rise in the pixel font. No card.
- **Gear on the ground**: a pixel **label in its rarity grade** over the drop. TOLMOUTH and HUNGRY also get a **light pillar** in the `glow` layer (the lighting pass already exists, so this costs almost nothing and fits "lit only by torches, braziers, moonlight and spells").
- **Pickup** means walking over it, or the context slot's TAKE. Then a **toast** slides in at the left above the stick: icon, name in rarity colour and a ▲ or ▼ badge, for 2.5 s. Tapping the toast opens the tooltip sheet. **The full loot card no longer interrupts the fight.**
- **Big moments** (level up, relic found, job done, chapter decided) get a **centred ribbon banner**, e.g. "LEVEL 4" in the display font on a gilt pixel ribbon, for 2 s, plus a sound, *(D4 level-up, play knowledge)*. They don't get a modal. The relic's gold card (`#lesson.found-relic`) can stay as the one full-screen moment.
- The results screen ("JOB DONE"): a framed tally of icon and number rows (gold, xp, saved, treasure tiles), not paragraphs.

### 2.13 Menus and settings

**References**: Immortal opens skills and inventory from a top menu row, and on PC it shrank the portrait, minimap and top-level menu buttons for a bigger viewport ([Fextralife](https://diabloimmortal.wiki.fextralife.com/Combat); [Blizzard](https://news.blizzard.com/en-us/article/23797159/pc)). D4 with a controller uses grid-based layouts, so screens navigate cleanly ([Blizzard Q-update](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).

**Relic**
- The top-right row becomes **three icon buttons**: Pack (satchel), Chat (bubble), Menu (a pixel book or cog). Each is 40px, square with clipped corners, iron framed.
- LEAVE moves into the menu, with its confirm. A destructive action shouldn't sit beside the pack button (today it's clipped next to SND in `phone-job.png`).
- **The Menu is one full-screen "book"** with stone tabs down the side (bottom on a phone): Pack, Knacks, Map (town), Roll of the Brave, Heroes, Settings.
- Settings: pixel toggles (a lever that flips) and stepped sliders for sound, music, brightness and quality, plus HUD layout (corner or centre), damage numbers (on, merged, off), and button layout (right or left hand).
- Every screen shares the same header: the title in the display font on a stone lintel, and close as a pixel ✕ socket at the top right.

---

## 3. A proposed visual language for Relic's UI

**The idea:** *the UI is cut from the same stone and iron as Wickhold, lit by the same torches.* Everything sits on the scene's pixel grid, ornament is spent only where it carries meaning, and gold always means "the way on".

### 3.1 Frames (9-slice pixel art)
- Draw the frames in code at boot, the way `sprites.ts` draws placeholders: small canvases turned into data URLs. Use them with CSS `border-image: url(...) N fill / Npx stretch` (or `round`) and `image-rendering: pixelated`. Scale them by the **same integer factor** as `Scene.resize`, so a UI pixel equals a world pixel. No `border-radius` anywhere.
- **Four grades**, each a 12x12 or 16x16 source with 4 to 6px corners:
  1. **Stone** (most panels and sheets): a cool grey 2-tone bevel (light top-left, dark bottom-right), a 1px near-black outline, and a little ordered dither inside, matching the floor.
  2. **Iron** (HUD sockets, buttons, the stick): dark blued iron, a 1px cold highlight, and a rivet pixel in each corner.
  3. **Gilt** (primary actions, story jobs, relics, the context slot): the iron frame with gold corner caps and a gold top edge. **Use it sparingly.** If more than one gilt element is on screen, one of them is wrong.
  4. **Parchment** (job notices, NPC dialogue body, the town map): warm paper `#c9b48a` with darker stained edges and torn-pixel corners, and dark ink text.
- Hungry or cursed: the iron frame with a red crack line and a 2-frame red pulse.
- Ornament budget: corner caps and rivets only. No filigree runs along the edges (D4 testers called its heavy trim overdone; [Blizzard forum](https://us.forums.blizzard.com/en/d3/t/diablo-iv-ui-ux-feedback-from-a-graphic-designer/9549)).

### 3.2 Typography
- **Drop `ui-monospace` entirely.** Bundle the fonts locally (no external hosts at runtime).
- **Display** (titles, name plates, banners): a medieval pixel face. **Alagard** by Hewett Tsoi is the obvious candidate: a 16px-grid medieval pixel display face, listed as free with credit required ([Designbeep](https://designbeep.com/2026/04/19/alagard-font/)). Check the readme before shipping. Or draw a custom one by extending `pixfont.ts`. Use it at 1x or 2x of 16px only, in caps or title case, with no extra letter-spacing.
- **Body and UI labels**: a readable pixel font with lowercase, about 5x7 or 6x8, at integer sizes (about 14 to 16 CSS px on a phone). Candidates: a free pixel UI font such as m5x7 or similar, after checking its licence, or extend `pixfont.ts` to 5x7 with lowercase so the UI and the world share one hand.
- **Combat numbers**: keep the 3x5 `pixfont.ts`.
- Rules:
  - Sentence case for speech and descriptions.
  - Small caps or caps only for labels of three words or fewer.
  - No italics. Pixel italics read badly; use parchment colour for flavour instead.
  - At most 3 sizes on any screen.

### 3.3 Colour tokens (CSS custom properties on `:root`)

| Role | Token | Hex | Use |
|---|---|---|---|
| Stone, darkest | `--stone-900` | `#0e0f12` | screen scrims, outlines |
| Stone panel | `--stone-800` | `#1b1d22` | panel fill |
| Stone raised | `--stone-700` | `#2b2e35` | buttons, tiles |
| Stone edge | `--stone-500` | `#4b505a` | bevel light, dividers |
| Stone muted text | `--stone-300` | `#8d929c` | secondary text |
| Bone (main text) | `--bone` | `#ddd5c4` | body text, normal numbers |
| Parchment | `--parch` | `#c9b48a` | paper panels, flavour |
| Ink | `--ink` | `#2a2118` | text on parchment |
| **Way-on gold** | `--gold` | `#e0a640` | primary, interactable, the arrow |
| Gilt highlight | `--gilt` | `#ffd27a` | gold's 1px highlight only |
| Blood (HP) | `--blood` | `#b0281e` | health, damage taken |
| Telegraph red | `--warn` | `#d8402a` | danger only, matching the floor telegraphs |
| Goblin sickly | `--rot` | `#7d9a3a` / glow `#b8e46a` | poison, goblin, "enemy" |
| Better / worse | `--up` / `--down` | `#9cc95a` / `#d8503a` | only with ▲▼ glyphs |
| Element | existing `EL_COL` | | skills and relics only |

The rule: **colour only for meaning.** Neutral stone and bone carry about 90% of the UI. Light blue `#9fd0ff`, mint, salmon and lilac go as UI accents (lilac survives only as the TOLMOUTH grade and the no-element relic colour).

### 3.4 Icon style
- 16x16 or 20x20 sources, 1px dark outline, 3 to 4 colour ramps per icon pulled from the scene palette, top-left light. Shown at 3x on a phone. The same hand as `itemicons.ts`, `relicicons.ts` and `skillIcon()`, which already exist and look right in the pack shots. **Use them everywhere words are now.**
- A minimum set for the HUD: attack (from the held weapon), shield or parry, roll, step, jump, dash and blink (one per `dodgeName`), each class skill, relic, flask, grab hand, burn torch, help-up hand, open chest, door, talk (speech mark), satchel, bubble, book, coin, heart, skull, goblin head, flame, drop, stars, and up and down chevrons.
- Words survive only in tooltips and as optional 2-letter key hints on a laptop (`E`, `R`, `Q`).

### 3.5 Touch-cluster shapes (shape carries meaning, so colour doesn't have to)
- **ATTACK**: a large **round** iron-framed button, with a rim lit by stepped light from the top-left and a dark stone face behind the weapon icon. Hold-to-charge fills the rim with gold in 8 steps, and the flash frame is white.
- **Skills and relic**: **round**, smaller, iron frames. The element tint goes on the *icon and a 1px inner ring* only.
- **Guard (BLOCK/PARRY)**: a **heater-shield** silhouette, iron. The parry window flashes its edge white, mirroring the enemy telegraph's white flash.
- **Movement (DODGE)**: a **diamond** (a rotated square with clipped corners).
- **POTION**: a **round flask orb** with glass highlight pixels and red liquid at the HP level (2.1), plus a count badge.
- **Context slot**: round, with a **gilt** frame and a slow 2-step gold pulse. It's the only gilt button.
- The stick: a stone ring with an iron knob.
- All of them press down 2px, never scale.

### 3.6 What makes it feel crafted rather than generic
- **One grid.** UI pixels match world pixels, with no fractional borders and no radii.
- **One material story.** Stone, iron, gilt, parchment, each with one job.
- **Restraint.** Gold is rare, so it means something. Most of the screen is the game.
- **Icons over words.** Words appear where there's time to read: tooltips and dialogue.
- **Motion with steps.** `steps()` easing, 2 to 4 frame animations, 2-frame flashes, like the sprites. No eased glows or blurred `box-shadow`s.
- **Diegetic touches.** The job board as notices pinned to wood. Prices as coins. Hearts drawn, not typed. Portraits from the real sprites.
- **Sound on every UI action** (open, close, equip, coin, not-enough-gold thunk), from `sfx.ts`.
- **Consistent anatomy.** Every screen has the same header, the same close socket and the same sheet behaviour.

---

## 4. Build order (mobile first, prioritised)

Each step is one vertical slice Kyle can feel on his phone. The cost estimates are rough.

1. **Foundation (biggest win, touches everything).**
   - Colour tokens on `:root`.
   - The bundled display and body pixel fonts replace `ui-monospace`.
   - The 9-slice frame generator (stone, iron, gilt, parchment) in one new `src/client/frames.ts`.
   - One shared button style that replaces the 8 copies.
   - Remove the radii and the soft `box-shadow` glows.
   - *About 1 to 2 days.* Every screen improves at once.
2. **The touch cluster.**
   - Icons for every button.
   - The fixed arc geometry, with the hero framed above it.
   - Stepped cooldown sweep plus the pixel-font seconds.
   - Shape coding.
   - The context slot replacing GRAB, USE and the rest.
   - The potion as the HP orb, and the stamina pip arc.
   - Restyle the stick.
   - *This is where "AI slop" is most visible mid-fight.*
3. **Top HUD.**
   - The unit frame (portrait, chunky HP bar with damage trail).
   - Delete the kit and weapon text lines.
   - The top-right tracker with the room strip.
   - The corner row cut to 3 icons, with LEAVE moved into the menu.
4. **Hit feedback.**
   - Merged damage numbers and the 3 size tiers.
   - Status icons instead of repeated words.
   - Hit-stop and a white flash on heavies and parries.
   - The framed boss plate.
5. **Dialogue.** The bottom box with bust portraits (draw busts for the main NPCs first: Hollis, Odric, Halvard, Tobin, the trainers) and the choice list. Move the council vote to choice cards.
6. **Pack, tooltip and compare.**
   - Bigger icon tiles and glyph sockets in place of dashed slots.
   - ▲▼ upgrade badges.
   - The bottom-sheet tooltip.
   - The changed-rows-only compare.
   - The new tier ladder (display only).
7. **Loot and notifications.**
   - Auto-pickup for gold and potions.
   - Ground labels plus glow pillars.
   - Pickup toasts instead of the loot card.
   - The ribbon banner for level up and job done.
   - The framed results tally.
8. **Vendor screen.** The keeper plate, BUY/SELL/BUYBACK tabs, a tile grid, and the shared tooltip sheet (no more `.spop`). The forge and vault reuse it.
9. **Party and chat.** Mini party frames, the quick-line wheel on hold, the chat bottom sheet, and the party card restyle.
10. **Menu book and settings.** Tabs, HUD layout options, the left-hand mirror, and the damage-number setting. Then the town map.
11. **The laptop pass.** The D4 bottom-centre bar (HP orb, skills, stamina), key hints on the icons, and side-by-side vendor and pack.

Notes for whoever builds it:
- All of this is drawing only. Nothing here touches `src/sim/`, and the tier colours in `shared/gear.ts` are display data.
- Every new or changed player-facing line goes through `lore-keeper`, then `line-editor`, and stays short.
- Run `node scripts/look.cjs` phone and laptop after each step.

---

## Sources

- Blizzard, Diablo IV Quarterly Update, February 2020 (UI, inventory, rarity borders, controller, couch co-op): https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020
- Blizzard, Bringing Diablo Immortal to PC (mobile-first HUD scaling, chat, controls): https://news.blizzard.com/en-us/article/23797159/pc
- TechRadar, Diablo Immortal on smartphones (stick, attack hub, fanned skills, quest log problem): https://www.techradar.com/news/ive-played-diablo-immortal-how-blizzards-dark-action-rpg-plays-on-smartphones
- Fextralife, Diablo Immortal Combat (hold attack, drag to aim, cooldown numbers, potion above hub, HP top-left, two layouts): https://diabloimmortal.wiki.fextralife.com/Combat
- SegmentNext, Diablo Immortal best settings (auto pickup tiers, joystick on mobile): https://segmentnext.com/diablo-immortal-best-settings
- Gamepressure, Diablo IV interface (orbs, potions, skill bar, minimap, tracker, inventory tabs): https://www.gamepressure.com/diablo-iv/interface/z0109a5
- Gamepressure, Diablo IV how to compare items: https://www.gamepressure.com/diablo-iv/how-to-compare-items/z4109c7
- Den of Geek, Diablo IV Advanced Tooltip Compare: https://www.denofgeek.com/games/diablo-4-best-hidden-setting-compare-gear
- Destructoid, Diablo IV HUD layout (left corner or center): https://destructoid.com/?p=386375
- AlcastHQ, Diablo IV combat text colours: https://alcasthq.com/diablo-4-why-does-combat-text-have-different-colours/
- Charlie Intel, Diablo IV rarity colours: https://charlieintel.com/diablo/diablo-4-rarity-system-all-rarity-colors-explained-256002
- Blizzard forum, Diablo IV UI/UX feedback from a graphic designer (ornament, fonts, colour, clutter): https://us.forums.blizzard.com/en/d3/t/diablo-iv-ui-ux-feedback-from-a-graphic-designer/9549
- ArtStation Magazine, Diablo IV UI Art Blast (credits, constraints): https://magazine.artstation.com/2023/07/blizzard-entertainment-diablo-iv-concept-art-ui-art-blast/
- Interface In Game, interview with Fernando Forero (Diablo IV Senior UI Artist, type as imagery): https://interfaceingame.com/articles/interview-with-fernando-forero
- Anabel S., Diablo 4 inventory case study: https://anabelsa87.myportfolio.com/diablo-4-inventory-case-study
- Mobalytics, Path of Exile 2 user interface (orbs, spirit, corner and overlay map, buffs): https://mobalytics.gg/poe-2/guides/user-interface
- PoE Vault, PoE2 UI and QoL upgrades (rage meter, couch co-op panels): https://poe-vault.com/poe2/news/major-ui-qol-upgrades-added-with-poe2-last-of-the-druids-update
- PoE forum, option to choose console UI or PC UI (condensed console HUD): https://www.pathofexile.com/forum/view-thread/3672881
- PoE forum, console UI feedback (compare, pickup, loot visibility): https://pathofexile.com/forum/view-thread/3623046
- PoE forum, concerns about the PoE II action bar mapping: https://www.pathofexile.com/forum/view-thread/3589215
- Dexerto, Path of Exile controller support (face buttons and trigger modifiers): https://www.dexerto.com/gaming/does-path-of-exile-have-controller-support-2195171
- GameGrin, Torchlight: Infinite review (menu overload): https://www.gamegrin.com/reviews/torchlight-infinite-review
- Pocket Gamer, how to play Archero (one-thumb stick, stop to fire): https://www.pocketgamer.com/archero/how-to-play-archero-the-latest-free-mobile-rogueli
- Nat Rowley, How Hades creates a responsive underworld (peripheral HUD, low-HP pulse, pinned mission): https://medium.com/@Nat.Rowley/how-hades-creates-a-responsive-underworld-915715a7c2a
- Supergiant, UI Illustrator for Hades II (consistent icon sets, HUD mockups): https://www.supergiantgames.com/blog/job-opportunity-ui-illustrator-for-hades-ii
- GamesRadar, Diablo 4 emotes (emote wheel): https://gamesradar.com/diablo-4-emotes-how-to-use
- Fluid UI, the thumb zone: https://blog.fluidui.com/the-thumb-zone/
- Designbeep, Alagard font (Hewett Tsoi, free with credit): https://designbeep.com/2026/04/19/alagard-font/

Not reached: the Game UI Database page (https://www.gameuidatabase.com/gameData.php?id=1218) timed out on permission. It would be the best place to pull reference screenshots of each screen.
