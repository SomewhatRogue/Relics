# Copy pass: text that explains the game (November 2026)

Every player-facing line changed in this pass, for the lore keeper and then the line editor. The rules are in
`docs/lore/prose-notes.md`, section 4 ("Text that explains the game"). The full inventory of the game's copy, changed
or not, is `docs/copy-inventory.csv`.

Numbers in new lines come from the tuning (`shared/perks.ts` fx, `shared/loot.ts` TRAIT, `shared/magic.ts`, `shared/potions.ts`).

Not touched here (other passes own them): `src/client/card.ts` (weapon HOW lines, armor lines, item card labels; its
heavy armor line still says "breath" where the rest of the game now says "stamina") and the KIT lines in `src/client/main.ts`.

| File | Key | Old | New |
|---|---|---|---|
| shared/perks.ts | w_parry.text | Your parry window is a little wider | Your parry window is 0.04 s longer |
| shared/perks.ts | w_block.name | IRONHIDE | EASY BLOCK |
| shared/perks.ts | w_block.text | Blocking costs a quarter less breath | Blocking costs 25% less stamina |
| shared/perks.ts | w_counter.name | COUNTERSTROKE | HARD COUNTER |
| shared/perks.ts | w_counter.text | Your counter after a parry hits a quarter harder | Your counter after a parry does 25% more damage |
| shared/perks.ts | w_health.name | TOUGH | EXTRA HEALTH |
| shared/perks.ts | w_tough.name | SCARRED | THICK SKIN |
| shared/perks.ts | w_tough.text | Every blow lands a little lighter on you | You take 8% less damage |
| shared/perks.ts | w_foot.name | SURE FEET | QUICK FEET |
| shared/perks.ts | w_foot.text | You're a little quicker on your feet, plate and all | You move 6% faster, plate and all |
| shared/perks.ts | w_full.name | HEAVY HANDS | FULL FORCE |
| shared/perks.ts | w_full.text | A fully charged blow lands 15% harder | A fully charged blow does 15% more damage |
| shared/perks.ts | w_knock.name | HEFT | KNOCKBACK |
| shared/perks.ts | w_knock.text | Your hits throw goblins a quarter further | Your hits knock goblins back 25% further |
| shared/perks.ts | w_focus.name | BATTLE-WISE | QUICK RECHARGE |
| shared/perks.ts | w_focus.text | Your skill and your relic come back a fifth sooner | Your skill and your relic are ready again 20% sooner |
| shared/perks.ts | w_focus.gain | skill 20% sooner | recharge 20% sooner |
| shared/perks.ts | w_far.text | Your shield charge and your war cry both reach a fifth further | Your shield charge and your war cry reach 20% further |
| shared/perks.ts | w_hold.name | HARD KNOCKS | LONG HOLD |
| shared/perks.ts | w_hold.text | Your shield charge keeps goblins down longer, and your war cry holds them longer | Goblins hit by your shield charge stay down 40% longer, and your war cry holds them 40% longer |
| shared/perks.ts | r_draw.name | STEADY HAND | FAST DRAW |
| shared/perks.ts | r_true.name | TRUE RELEASE | PERFECT SHOT |
| shared/perks.ts | r_true.text | Loose on the white flash at full draw and the shot lands a fifth harder | A shot let go on the white flash at full draw (a PERFECT) does 20% more damage |
| shared/perks.ts | r_true.gain | flash shot +20% | PERFECT +20% |
| shared/perks.ts | r_flash.text | The white flash at full draw lasts a little longer | The white flash at full draw lasts 0.15 s longer, so a PERFECT is easier to hit |
| shared/perks.ts | r_jump.name | SPRING | QUICK JUMP |
| shared/perks.ts | r_jump.text | You can jump again a fifth sooner | You can jump again 20% sooner |
| shared/perks.ts | r_leap.text | Your jump carries a fifth further | Your jump goes 20% further |
| shared/perks.ts | r_foot.name | FLEET | QUICK FEET |
| shared/perks.ts | r_foot.text | You're a little faster on your feet | You move 6% faster |
| shared/perks.ts | r_snare.text | A fresh snare is ready a quarter sooner | Your next snare is ready 25% sooner |
| shared/perks.ts | r_hold.text | Your snares hold a goblin a quarter longer | Your snares hold a goblin 25% longer |
| shared/perks.ts | r_hound.text | Your hound goes in a quarter sooner | Your hound waits 25% less between attacks |
| shared/perks.ts | r_bite.text | Your hound bites harder | Your hound bites for 9 damage instead of 7 |
| shared/perks.ts | r_bites.name | WORRIER | EXTRA BITE |
| shared/perks.ts | r_bites.text | Your hound bites once more before it comes back | Your hound bites one more time before it comes back to you |
| shared/perks.ts | g_light.name | LIGHT STEP | LIGHT DASH |
| shared/perks.ts | g_light.text | Your dash costs a fifth less breath | Your dash costs 20% less stamina |
| shared/perks.ts | g_slip.name | LAST SECOND | WIDE LAST SECOND |
| shared/perks.ts | g_slip.text | You get a little longer to make a last-moment dash, the one that leaves a goblin reeling | A dash just as a blow lands (a LAST SECOND) leaves the goblin reeling. You get 0.08 s longer to make one |
| shared/perks.ts | g_angle.name | FLANKER | WIDE BACKSTAB |
| shared/perks.ts | g_angle.text | You count as behind a goblin from further round its side | Backstabs count from further round a goblin's side, so they're easier to land |
| shared/perks.ts | g_rear.name | SHADOWED | HARD BACKSTAB |
| shared/perks.ts | g_rear.text | Backstabs hit 15% harder | Backstabs do 15% more damage |
| shared/perks.ts | g_ambush.name | FIRST CUT | HARD AMBUSH |
| shared/perks.ts | g_ambush.text | An ambush hits a quarter harder | An ambush does 25% more damage |
| shared/perks.ts | g_quick.text | Your blows come a little faster | You attack 6% faster |
| shared/perks.ts | g_throw.text | A fully held throw, lunge or bolt lands a fifth harder | A fully held throw, lunge or bolt does 20% more damage |
| shared/perks.ts | g_foot.name | FLEET | QUICK FEET |
| shared/perks.ts | g_foot.text | You're a little faster on your feet | You move 6% faster |
| shared/perks.ts | g_focus.name | DEEP SHADOW | QUICK RECHARGE |
| shared/perks.ts | g_focus.text | Your shadowstep and your relic come back a fifth sooner | Your skill and your relic are ready again 20% sooner |
| shared/perks.ts | g_focus.gain | skill 20% sooner | recharge 20% sooner |
| shared/perks.ts | g_quiet.text | While you creep, goblins spot you a fifth later | While you creep, goblins have to be 20% closer to see you |
| shared/perks.ts | g_quiet.gain | seen 20% later | seen 20% closer |
| shared/perks.ts | m_blink.text | You can blink again a fifth sooner | You can blink again 20% sooner |
| shared/perks.ts | m_leap.text | Your blink goes a fifth further | Your blink goes 20% further |
| shared/perks.ts | m_image.text | The image your blink leaves lasts a second and a half longer | The image your blink leaves lasts 1.5 s longer |
| shared/perks.ts | m_primed.name | PRIMED | PRIMED POWER |
| shared/perks.ts | m_primed.text | The first spell after you turn your spells hits harder still | Your primed spell (the first after you change element) does 25% more damage |
| shared/perks.ts | m_primed.gain | primed +0.25x | primed +25% |
| shared/perks.ts | m_clear.name | CLEAR HEAD | STAMINA ON CHANGE |
| shared/perks.ts | m_clear.text | Turning your spells gives you back 15 breath | Changing element gives you back 15 stamina |
| shared/perks.ts | m_clear.gain | +15 stamina a turn | +15 stamina a change |
| shared/perks.ts | m_twice.text | The first two spells after a turn are both primed | The first two spells after you change element are both primed |
| shared/perks.ts | m_draw.name | DEEP CHARGE | QUICK CHARGE |
| shared/perks.ts | m_draw.text | Charged spells fill 12% faster | Held spells charge 12% faster |
| shared/perks.ts | m_burst.text | Your spells burst a fifth wider | Your spell bursts are 20% wider |
| shared/perks.ts | m_dmg.name | POTENT | SPELL DAMAGE |
| shared/perks.ts | m_dmg.text | Your spells land a little harder | Your spells do 6% more damage |
| shared/perks.ts | m_breath.name | DEEP BREATH | QUICK RECOVERY |
| shared/perks.ts | m_breath.text | Your breath comes back a quarter faster | Your stamina comes back 25% faster |
| shared/perks.ts | m_light.text | Your blink costs a fifth less breath | Your blink costs 20% less stamina |
| shared/perks.ts | m_quick.text | Your casts come a little faster | You cast 6% faster |
| shared/perks.ts | h_parry.text | Your parry window is a little wider | Your parry window is 0.04 s longer |
| shared/perks.ts | h_block.name | IRONHIDE | EASY BLOCK |
| shared/perks.ts | h_block.text | Blocking costs a quarter less breath | Blocking costs 25% less stamina |
| shared/perks.ts | h_counter.text | After a parry you have longer to make your counter | After a parry you have 0.6 s longer to land your counter |
| shared/perks.ts | h_mend.name | MENDER | STRONG HEALS |
| shared/perks.ts | h_mend.text | Every heal you give mends 12% more | Every heal you give is 12% bigger |
| shared/perks.ts | h_reach.name | WIDE MERCY | WIDE HEAL |
| shared/perks.ts | h_reach.text | Your healing blow reaches friends a fifth further off | Your healing blow reaches friends 20% further away |
| shared/perks.ts | h_mercy.name | EARLY MERCY | EARLY HEAL |
| shared/perks.ts | h_mercy.text | The blow before your healing blow heals too, half as much | The blow before your healing blow heals too, for half as much |
| shared/perks.ts | h_draw.text | Your held blow charges 12% faster | Your smite charges 12% faster |
| shared/perks.ts | h_stun.name | DAZING LIGHT | LONG STUN |
| shared/perks.ts | h_full.text | A fully charged blow lands 15% harder | A fully charged smite does 15% more damage |
| shared/perks.ts | h_focus.name | DEVOUT | QUICK RECHARGE |
| shared/perks.ts | h_focus.text | Your sanctuary and your relic come back a fifth sooner | Your skill and your relic are ready again 20% sooner |
| shared/perks.ts | h_focus.gain | skill 20% sooner | recharge 20% sooner |
| shared/perks.ts | h_bless.name | DEVOTION | STRONG BLESSING |
| shared/perks.ts | h_bless.text | Blessed ground spreads a quarter wider and the ward is a quarter stronger | Blessed ground is 25% wider and your ward is 25% stronger |
| shared/perks.ts | h_long.text | Blessed ground and the ward last a second and a half longer | Blessed ground and your ward last 1.5 s longer |
| shared/chains.ts | chain h_mercy.name | MERCY | HEALING |
| shared/gear.ts | breath.name | BREATH | STAMINA |
| shared/gear.ts | foot.name | FOOTWORK | SPEED |
| shared/gear.ts | focus.name | FOCUS | RECHARGE |
| shared/gear.ts | mending.name | MENDING | HEALING |
| shared/gear.ts | MOD_TEXT.damage | every hit and shot | on every hit, shot and spell |
| shared/gear.ts | MOD_TEXT.reach | blade reach, shot range | longer reach and shot range |
| shared/gear.ts | MOD_TEXT.draw | faster to a full charge or draw | faster to charge or draw |
| shared/gear.ts | MOD_TEXT.guard | less through a block, less breath to block | less damage through a block, and blocking costs less stamina |
| shared/gear.ts | MOD_TEXT.knock | hits throw further | hits knock goblins further |
| shared/gear.ts | MOD_TEXT.breath | breath comes back faster | comes back faster |
| shared/gear.ts | MOD_TEXT.foot | faster on your feet | you move faster |
| shared/gear.ts | MOD_TEXT.focus | skill and relic recharge sooner | skill and relic ready again sooner |
| shared/gear.ts | MOD_TEXT.mending | every heal you give | on every heal you give |
| shared/loot.ts | riposte.text | Counters after a parry hit far harder | Your counter after a parry does 40% more damage |
| shared/loot.ts | tempo.text | Dodge through a blow: your next hit lands double | Dodge through a blow and your next hit within 1.5 s does double damage |
| shared/loot.ts | bulwark.name | BULWARK | STAMINA ON PARRY |
| shared/loot.ts | bulwark.text | A parry fills your breath | A parry refills your stamina |
| shared/loot.ts | deadeye.name | TRUE RELEASE | DEADEYE |
| shared/loot.ts | deadeye.text | Release on the white flash for a far bigger shot | A shot let go on the white flash does 60% more damage |
| shared/loot.ts | crushing.text | Goblins you throw into walls take triple | Goblins you knock into a wall take triple damage from it |
| shared/loot.ts | brutal.text | Hits on stunned, pinned, netted or frozen goblins hurt far more | Your hits on stunned, pinned, netted or frozen goblins do 50% more damage |
| shared/loot.ts | reaper.text | A backstab or counter that kills heals you | Killing with a backstab or a counter heals you for 10 |
| shared/loot.ts | traitText (REAPER, no parry) | A backstab that kills heals you | Killing with a backstab heals you for 10 |
| shared/loot.ts | ember.name | EMBERFORGED | FIREFORGED |
| shared/loot.ts | ember.text | Charged hits and full draws set goblins burning | Your charged hits and full draws set goblins on fire |
| shared/loot.ts | rime.name | RIMEFORGED | FROSTFORGED |
| shared/loot.ts | rime.text | Charged hits and full draws chill (twice freezes) | Your charged hits and full draws chill goblins. Chill one twice to freeze it |
| shared/loot.ts | storm.text | Charged hits and full draws arc to nearby goblins | Your charged hits and full draws also shock goblins near the one you hit |
| shared/drills.ts | power.text | Every blow and spell lands harder | Your attacks and spells do more damage |
| shared/drills.ts | speed.text | Faster on your feet | You move faster |
| shared/drills.ts | crit.text | A chance for any hit to land half again as hard | Gives every hit a chance to do 50% more damage |
| shared/drills.ts | wind.name | BREATH | STAMINA |
| shared/drills.ts | wind.text | Your breath comes back faster | Your stamina comes back faster |
| shared/drills.ts | skill.text | Your class skill comes back sooner | Your class skill is ready again sooner |
| shared/drills.ts | WARRIOR.technique text | Your slams hit a quarter harder each rank | Your slams do 25% more damage per rank |
| shared/drills.ts | HEALER.technique text | Your heals mend a sixth more each rank | Your heals are 16% bigger per rank |
| shared/drills.ts | ROGUE.technique text | Your backstabs cut a quarter deeper each rank | Your backstabs do 25% more damage per rank |
| shared/hungry.ts | cleaver.gift | Every hit heals you a fifth of what it deals. | Every hit heals you for 20% of the damage it deals. |
| shared/hungry.ts | cleaver.cost | Nobody else's healing takes on you: blessed ground, the mace and the ward pass you by. | Heals from anyone else don't work on you, including blessed ground, the mace and the ward. |
| shared/hungry.ts | pike.cost | Eight seconds without a kill and it bites you every second until you feed it. | If you go 8 seconds without a kill, it hurts you every second until you kill again. |
| shared/hungry.ts | spendthrift.gift | Every full draw pierces and lands for double. | Every full draw goes through goblins and does double damage. |
| shared/hungry.ts | needles.cost | Your breath comes back at half speed | Your stamina comes back at half speed |
| shared/hungry.ts | jealous.gift | Bursts jump to every goblin near what they hit. | Your spell bursts also hit every goblin near the one they hit. |
| shared/hungry.ts | jealous.cost | Your relic won't answer while it's in your hand, and your skill takes twice as long. | You can't use your relic while you hold it, and your skill takes twice as long to recharge. |
| shared/hungry.ts | keeping.gift | Every kill feeds a coal to your censer. | Every kill feeds your censer a coal, so your heals grow stronger for good. |
| shared/hungry.ts | keeping.cost | Your heals land at half on others and double on you. | Your heals do half as much for others and twice as much for you. |
| shared/hungry.ts | apron.gift | Every blow against you lands at half. | You take half damage from every blow. |
| shared/hungry.ts | apron.cost | The hungry smell their own on you: every goblin comes for you first, and a named butcher looks at no one else. | Every goblin goes for you first, and a named butcher attacks no one else. |
| shared/hungry.ts | ransom.gift | Once a room, a killing blow takes 50 gold instead of your life. | Once per room, a blow that would put you down takes 50 gold instead. |
| shared/hungry.ts | ransom.cost | You can't give at the Lantern while you wear it; driven back, you lose all your gold, not half. | You can't give gold at the Lantern while you wear it, and if you're driven back you lose all your gold, not half. |
| shared/hungry.ts | wedding.cost | It won't come off your finger; only the church can take it. And it gets into you faster than anything. | You can't take it off; only the church can. It also changes you faster than any other hungry gear. |
| shared/hungry.ts | tooth.gift | Every kill recharges your skill and relic at once. | Every kill recharges your skill and relic straight away. |
| shared/hungry.ts | tooth.cost | The party's gold from kills near you goes into your purse, and they see it go. | Gold from kills near you goes to you instead of being shared, and the party sees it happen. |
| shared/potions.ts | brandy.text | Doubles your damage, halves your speed and stamina. | Doubles your damage, but halves your speed and the size of your stamina bar. |
| shared/potions.ts | oil.text | Bursts into flame when thrown. | Bursts into flames where it lands and sets goblins on fire. |
| shared/potions.ts | frost.text | Chills what it splashes. A second splash freezes. | Chills every goblin it splashes. A second splash freezes them. |
| shared/potions.ts | smoke.text | Goblins can't see anyone in it unless they get close. | Goblins can't see anyone inside the smoke unless they're close. |
| shared/drills.ts | RANGER.technique text | Your snares hold a fifth longer each rank | Your snares hold 20% longer per rank |
| shared/drills.ts | MAGE.technique text | The first spell after you change element lands a fifth harder each rank | Your primed spell, the first after you change element, does 20% more damage per rank |
| shared/drills.ts | MAGE.technique gain | +#% first spell | +#% primed spell |
| shared/drills.ts | MAGE.technique name | FIRST SPELL | PRIMED SPELLS |
| shared/skillwords.ts | bash | Run in shield first, and small goblins go over while big ones stagger. | You charge shield first: small goblins in your way are knocked flat, and big ones stagger. |
| shared/skillwords.ts | horn | Every goblin in earshot comes for you, and nobody else. | Every goblin near you comes after you, and leaves everyone else alone, for 5 seconds. |
| shared/skillwords.ts | stamp | Bring the shield rim down hard, and every goblin close is thrown back, the small ones off their feet. | You slam your shield down. Every goblin close to you is knocked back, and small ones are knocked off their feet. |
| shared/skillwords.ts | shadow | Step out of the dark behind the goblin you face. | You appear behind the goblin you face. |
| shared/skillwords.ts | vanish | Smoke at your feet, and the goblins lose you until you strike. | You drop smoke at your feet, and goblins lose track of you until you attack. |
| shared/skillwords.ts | channel | Turn your spells to the next of fire, frost and storm, and the first spell after each turn lands harder. | Changes your spells to the next element (fire, frost, storm). Your first spell after each change is primed and does 50% more damage. |
| shared/skillwords.ts | firering | While you carry it, your spells are fire. | While this is your skill, your spells are always fire. |
| shared/skillwords.ts | tether | While you carry it, your spells are fire. | While this is your skill, your spells are always fire. |
| shared/skillwords.ts | sanctuary | Blessed ground at your feet, and a ward on whoever needs it most. | Blesses the ground at your feet, which heals friends and burns goblins, and puts a ward on whoever is most hurt. |
| shared/skillwords.ts | light | Open the censer. Goblins close by are scorched and thrown back, the small ones blinded, and friends close by mend. | You open the censer. Goblins close by are burned and knocked back, small ones are blinded, and friends close by are healed. |
| shared/classes.ts | HEALER.note | Feed the censer what butchers leave. It heals hotter, and draws teeth. | Walk over the coal a dead butcher leaves to feed your censer. Your heals get stronger for good, but goblins notice you sooner and go for you first. |
| shared/classes.ts | HEALER.perk | Nothing of yours hurts a friend, or anyone freed from a cage: your blows, smites, coals and fire all pass them by. | Nothing you do hurts a friend or anyone freed from a cage: your blows, smites, coals and fire pass through them. |
| client/copy.ts | COPY.stillGoing | Nothing waits while you rummage. | The fight goes on while your pack is open. |
| client/copy.ts | COAL.line | Heals burn hotter. The hungry find you first, from further off. | Your heals are stronger. Goblins notice you from further off and go for you first. |
| client/relicwords.ts | RELIC_LINES.javelin | Thrown hard. Small goblins ride it to the wall and stay pinned there; big ones take it in the body. | A hard throw. It carries small goblins to the nearest wall and pins them there, and sticks in big ones. |
| client/relicwords.ts | RELIC_LINES.lodestone | Lobbed. Where it lands it drags goblins in, the light ones fastest, then bursts. | Throw it and it pulls goblins in to where it lands, light ones fastest, then bursts. |
| client/relicwords.ts | RELIC_LINES.bomb | Lobbed. It bursts, throws goblins and barrels about and knocks the small ones silly. | Throw it and it bursts where it lands, knocking goblins and barrels away and stunning the small ones. |
| client/relicwords.ts | RELIC_LINES.bell | Blow it. Goblins near you stop to listen and lose their swing, and friends near you are quicker on their feet for a bit. | Blow it. Goblins near you stop to listen and drop their attacks, and friends near you move 25% faster for 4 seconds. |
| client/relicwords.ts | RELIC_LINES.knuckle | A punch that carries. Everything in a line in front of you is knocked flying, and the next blow anyone lands on them hits harder. | A punch that reaches. Everything in a line in front of you is knocked flying, and the next hit anyone lands on them does extra damage. |
| client/relicwords.ts | RELICW.darkLine | Gone dark. It does nothing now until the church sees to it. | Out of charge (dark). It does nothing until the church recharges it. |
| client/relicwords.ts | RELICW.darkElLine | Gone dark, and the church won't bring this kind back. You can still give it up on the step, on its own, or with another for one in return. | Out of charge (dark), and the church won't recharge a relic with an element. You can still give it up on the step, alone, or with another relic to get one back. |
| client/relicwords.ts | RELICW.fades | Every use spends a little of it. | Every use spends one charge. |
| client/relicwords.ts | RELICW.noRecharge | Born with an element. It holds more charge, but the church won't recharge it. | It has an element, so it holds more charge, but the church won't recharge it. |
| shared/wood.ts | LINES.how.block | Hold your guard while the red fills. Each block costs breath (the yellow bar). | Hold block while the red fills. Each block costs stamina (the yellow bar). |
| shared/wood.ts | LINES.how.parry | Tap your guard the moment the red flashes white. It staggers them, and your next blow lands hard. | Tap block the moment the red flashes white. That parry staggers the goblin, and your next blow does extra damage. |
| shared/wood.ts | LINES.now.block | NOW: GUARD UP | NOW: HOLD BLOCK |
| shared/wood.ts | LINES.now.parry | NOW: TAP GUARD | NOW: TAP BLOCK |
| client/fxrelics.ts | callout bell | BELL | WHISTLE |
| client/fxmagic.ts | callout tooth | THE TOOTH TAKES IT | GOLD TAKEN |
| client/main.ts | tips (touch) | Break the oil barrel near goblins and they burn | Break an oil barrel near goblins to set them on fire |
| client/main.ts | tips (touch) | Holding one: SLAM it, or THROW it at another | Holding a goblin? SLAM it down, or THROW it at another |
| client/main.ts | tips (touch) | POTION drinks or throws the front of your belt | POTION drinks or throws the potion at the front of your belt |
| client/main.ts | tips (touch) | Traits reward skill: parries, dodges, perfect releases | Most item traits pay off when you parry, dodge or hit a PERFECT |
| client/main.ts | tips (touch) | Walk into a cottage or barn: goblins, and sometimes someone caged | Cottages and barns hold goblins, and sometimes someone in a cage |
| client/main.ts | tips (touch) | HEALER: SANCTUARY blesses the ground and wards whoever is most hurt | CLERIC: SANCTUARY blesses the ground and wards whoever is most hurt |
| client/main.ts | tips (touch) | Frost twice freezes. A heavy blow shatters the ice | Two frost hits freeze a goblin. A heavy blow then shatters it |
| client/main.ts | tips (touch) | Fire meets frost: STEAM. Storm on the burning: FLARE | Fire on a chilled goblin makes STEAM, which stuns. Storm on a burning one makes a FLARE, which knocks goblins back |
| client/main.ts | tips (touch) | SKILL: every class has one. Each recharges | SKILL uses your class skill, which your trainer teaches from level 3 |
| client/main.ts | tips (touch) | Striped circles cannot be blocked: dodge out, or walk out | Red with a striped edge can't be blocked: dodge or walk out of it |
| client/main.ts | tips (touch) | DEEP jobs end at a named butcher. Win one for a RELIC | DEEP jobs end at a named butcher, who always carries a RELIC |
| client/main.ts | tips (touch) | Push the stick part way to creep. Resting goblins see you late: hit first for an AMBUSH | Push the stick part way to creep. Hit a goblin that hasn't seen you for an AMBUSH |
| client/main.ts | tips (desktop) | Break the oil barrel near goblins and they burn | Break an oil barrel near goblins to set them on fire |
| client/main.ts | tips (desktop) | Bows: release on the white flash. Held too long, the shot weakens | Bows: let go on the white flash for a PERFECT. Hold too long and the shot weakens |
| client/main.ts | tips (desktop) | Cleric: E for SANCTUARY. Blessed ground, and a ward that throws arrows back | Cleric: E uses SANCTUARY, which blesses the ground and wards whoever is most hurt |
| client/main.ts | tips (desktop) | Frost twice freezes. A heavy blow shatters the ice | Two frost hits freeze a goblin. A heavy blow then shatters it |
| client/main.ts | tips (desktop) | Fire meets frost: STEAM. Storm on the burning: FLARE | Fire on a chilled goblin makes STEAM, which stuns. Storm on a burning one makes a FLARE, which knocks goblins back |
| client/main.ts | tips (desktop) | Striped circles cannot be blocked: SPACE to dodge, or walk out | Red with a striped edge can't be blocked: SPACE to dodge, or walk out of it |
| client/main.ts | tips (desktop) | Hold Shift to creep. Resting goblins see you late: hit first for an AMBUSH | Hold Shift to creep. Hit a goblin that hasn't seen you for an AMBUSH |
| client/main.ts | townTips (touch) | The TRAINING HALL: perks, and the squire takes you to the yard | The TRAINING HALL: knacks, and the squire takes you to the yard |
| client/main.ts | townTips (desktop) | The TRAINING HALL: perks, and the squire takes you to the yard | The TRAINING HALL: knacks, and the squire takes you to the yard |
| client/main.ts | townTips (touch) | The TOWN HALL: the reeve and the council decide the chapter | The TOWN HALL: vote on what Wickhold does next |
| client/main.ts | townTips (desktop) | The TOWN HALL: the reeve and the council decide the chapter | The TOWN HALL: vote on what Wickhold does next |
| client/fx.ts | callout when you press block with no block | NO BLOCK: {ROLL/JUMP/DASH/BLINK} (Ranger) or NO GUARD: {...} (others) | CAN'T BLOCK: {ROLL/JUMP/DASH/BLINK} |
| client/squareui.ts | well (offer) | A coin ({wish} gold): your next job starts lucky. | A coin ({wish} gold) for luck: you start your next job with +30% damage and 25% less damage taken for 20 seconds. |
| client/townui.ts | ENDED.half | Driven back: half the gold, nobody saved. | Driven back. You keep half the gold, and nobody you freed comes home. |
| client/townui.ts | ENDED.lostCut | You were cut off, and your party was driven back. Half the gold, nobody home. | You were cut off, and your party was driven back. You keep half the gold, and nobody you freed comes home. |
| shared/story.ts | chapter 1 choice farm.text | every job pays a quarter more | every job pays 25% more |
| shared/jobs.ts | notice rescue | Folk alive in cages at {name}, at last count. Last count was three days ago. Break the cages, bring them home, don't stop to count. | There were folk alive in cages at {name} three days ago, and some may be yet. Break the cages open and bring them home. |
| shared/jobs.ts | notice hunt | Bring back something to prove it; we've been lied to before. | Bring back something to prove it, because we've been lied to before. |
| shared/jobs.ts | notice burn | The hungry have dug in at {name}. Every hole you leave, they come back to. Burn every den. They hoard lamp oil; use theirs. | The hungry have put up dens at {name}, and any den you leave, they come back to. Burn every one. They hoard lamp oil, so use theirs. |
| shared/jobs.ts | notice larder | They keep a larder at {name}. Some of it is grain. Smash every rack, | They keep a larder at {name}, and some of it is grain. Smash every rack, |
| client/scores-boss.ts | boss tune name (bard list) | No Mercy at the Bell | No Quarter at the Bell |
| client/worksui.ts | give gear line | Hollis writes it down at what Halvard would give for it, and half again. | Hollis writes it down as worth 50% more than Tobin would pay for it. |
| shared/mendlines.ts | MEND_UI.gear | Weapons and armour for the walls count for half again what Halvard would pay. | Weapons and armour given to the walls count for 50% more than Tobin would pay. |
