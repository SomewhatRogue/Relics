# New look: characters, decisions

This chat's log (docs/design/new-look.md, "The chats"). Heroes, goblins and townsfolk in the concepts' style: the
sprite sheet in Kyle's ElevenLabs flow "Relic: HD-2D look tests" (five heroes; the knife, torch and spear goblins and
the butcher). Everything here is behind `?look=3d&hd&street`; without it nothing changes.

## 2026-11-15: started

- Row moved to Active. First a test: the knight (Warrior) and the knife goblin (a scrapper) walking and attacking in
  the 2.5D view, made two ways from the same generated art, to choose how all characters get made:
  `&chars=sheet` (generated frames, cleaned up and played by the act) and `&chars=parts` (the idle frame cut into
  parts that the pose code, heropose.ts and foepose.ts, moves).
  (Claude Opus 5.5)
