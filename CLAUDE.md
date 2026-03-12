# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm install          # Install dependencies (client)
npm run dev          # Start Vite dev server at localhost:3000 with HMR
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run server       # Start backend server on port 3001
```

The dev server proxies `/api` and `/ws` to the backend at `localhost:3001` (configured in `vite.config.js`).

**Verification commands:**
```bash
npm run build                                          # Verify no client build errors
cd server && node -e "import('./src/database.js')"     # Verify server module loads
```

No test runner, linter, or CI/CD is configured.

## Architecture

Medieval Conquest is a 2D medieval strategy game built with **Phaser 3** (Arcade Physics) and **Vite**. It uses vanilla ES modules (no TypeScript, no framework). All visual assets are generated procedurally at runtime — there are no external image files.

### Client-Server Structure

- **Client** (`src/`): Phaser 3 game, vanilla ES modules, bundled by Vite
- **Server** (`server/src/`): Express + WebSocket server (port 3001) with SQLite persistence
  - `server.js` — Express routes, WebSocket upgrade, REST API for auth/players/submissions
  - `database.js` — SQLite via better-sqlite3, player data, changelog, submissions
  - `auth.js` — JWT-based auth with player codes
  - `gameState.js` — connected players, position broadcasting, chat history
  - `wordFilter.js` — chat message filtering

### Scene Flow

`PreloadScene -> BootScene -> MainMenuScene -> LoginScene -> CharSelectScene -> GameScene <-> VillageScene`

- **PreloadScene** generates all pixel art textures via `SpriteFactory.js` (~50+ textures)
- **LoginScene** handles player authentication via player codes
- **GameScene** is the main gameplay loop; it sleeps (not destroyed) when entering `VillageScene`
- **HUDScene** runs as a parallel overlay scene on top of GameScene

### ECS-Lite Pattern

Game logic is separated into systems that operate on entities:

| Systems | Entities |
|---------|----------|
| `MovementSystem` — input handling (WASD/arrows/touch) | `Player` — 28 directional sprite textures, inventory, health |
| `CombatSystem` — attack, hit detection, damage, screen shake | `Enemy` — state machine (IDLE/CHASE/ATTACK/DEAD), AI |
| `ResourceSystem` — auto-collect nearby gems | `RemotePlayer` — other connected players |
| `EnemySpawner` — terrain-appropriate enemy spawning | `VillageNPC` — dialog, trading |
| `CameraController` — map view (0.15x) <-> explore view (1.5x) | |
| `ParticleManager` — dust, blood, weather effects | |
| `TerritoryManager` — 4x4 region grid, discovery/capture tracking | |
| `BuildingSystem` / `CampManager` — structures and camps | |

### Map Generation

`MapGenerator` uses simplex noise with a fixed seed (42) to produce deterministic terrain. Elevation and moisture combine to determine terrain type (plains, forest, mountains, desert, swamp, snow, etc.). `MapRenderer` tiles the world and places detail sprites (~4000 trees/rocks via deterministic hash).

### Sprite System

`SpriteFactory` draws all art procedurally using Phaser Graphics API. Sprites are drawn in grayscale/white then tinted at runtime per character class or enemy type. Color palettes live in `ParchmentColors.js`.

### Multiplayer / Networking

`NetworkManager` (singleton) connects to the server via WebSocket. Handles player position sync at 10hz, chat messages, and remote player rendering. `PlayerState` manages persistent player data synced with the server.

### Player Keep System

`PersonalKeep` / `KeepRenderer` / `PlacementMode` handle player housing. Keep plots are defined in `WorldDefinition.js`. Players can furnish keeps with items from `KEEP_ITEMS`.

### Key Files

- `src/constants.js` — all game constants: tile sizes, terrain configs, enemy stats, combat values, resource definitions, UI colors, character class data
- `src/utils/MathHelpers.js` — utility functions including A* pathfinding, coordinate conversion (tile<->world), lerp, clamp
- `src/entities/CharacterClasses.js` — 5 classes (Knight, Archer, Builder, Merchant, Scout) with stat definitions
- `src/world/WorldDefinition.js` — world version, protected zones, keep plots, keep items, world structures
- `src/version.js` — client version string (must match `WORLD_VERSION` in WorldDefinition.js)

## Data Dependencies

None — self-contained. All game data is procedurally generated or stored in SQLite.

## Protected Data (DO NOT MODIFY)

- **NEVER** modify `PROTECTED_ZONES` coordinates in `WorldDefinition.js` — player keeps exist in these areas
- **NEVER** delete items from `KEEP_ITEMS` — only add new ones or mark `legacy: true`
- **NEVER** directly modify the SQLite database or player data

## Conventions for Adding Content

- **Versioning:** Increment `WORLD_VERSION` in `WorldDefinition.js` and `VERSION` in `src/version.js` together
- **Sprites:** Add methods to `SpriteFactory`, using grayscale/white + tint pattern. Generate in `PreloadScene` via `SpriteFactory.generateAll()`. Register animations in `SpriteFactory.registerAnimations()`
- **Structures:** Add to `WORLD_STRUCTURES` in `WorldDefinition.js`
- **Items:** Add to `KEEP_ITEMS` in `WorldDefinition.js`
- **Constants:** Add to `src/constants.js`
- **UI:** Follow parchment theme — Georgia serif font, `UI_COLORS` from constants
