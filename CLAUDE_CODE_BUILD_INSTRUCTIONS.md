# Claude Code Build Instructions

Rules for overnight builds:

- **NEVER** modify PROTECTED_ZONES coordinates in WorldDefinition.js
- **NEVER** delete items from KEEP_ITEMS (only add new ones or mark `legacy: true`)
- **NEVER** directly modify the SQLite database or player data
- **ALWAYS** increment WORLD_VERSION in WorldDefinition.js
- **ALWAYS** update VERSION in src/version.js to match
- **ALWAYS** credit the suggesting player in changelog entries
- **ALWAYS** run `npm run build` after changes to verify no errors
- **ALWAYS** run `cd server && node -e "import('./src/database.js')"` to verify server
- Preserve existing Phaser scene structure
- All new sprites: add methods to SpriteFactory, grayscale/white + tint pattern
- All new textures: generate in PreloadScene via SpriteFactory.generateAll()
- All new animations: register in SpriteFactory.registerAnimations()
- New structures: add to WORLD_STRUCTURES in WorldDefinition.js
- New items: add to KEEP_ITEMS in WorldDefinition.js
- New constants: add to src/constants.js
- New UI: follow existing patterns (parchment theme, Georgia serif, UI_COLORS)
- Keep features small and testable
- Test that WebSocket server still starts
