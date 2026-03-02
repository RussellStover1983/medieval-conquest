# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server at localhost:3000 with HMR
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

No test runner, linter, or CI/CD is configured.

## Architecture

Medieval Conquest is a 2D medieval strategy game built with **Phaser 3** (Arcade Physics) and **Vite**. It uses vanilla ES modules (no TypeScript, no framework). All visual assets are generated procedurally at runtime — there are no external image files.

### Scene Flow

`PreloadScene → BootScene → MainMenuScene → CharSelectScene → GameScene ↔ VillageScene`

- **PreloadScene** generates all pixel art textures via `SpriteFactory.js` (player, enemies, terrain, particles — ~50+ textures)
- **GameScene** is the main gameplay loop; it sleeps (not destroyed) when entering `VillageScene`
- **HUDScene** runs as a parallel overlay scene on top of GameScene

### ECS-Lite Pattern

Game logic is separated into systems that operate on entities:

| Systems | Entities |
|---------|----------|
| `MovementSystem` — input handling (WASD/arrows/touch) | `Player` — 28 directional sprite textures, inventory, health |
| `CombatSystem` — attack, hit detection, damage, screen shake | `Enemy` — state machine (IDLE/CHASE/ATTACK/DEAD), AI |
| `ResourceSystem` — auto-collect nearby gems | `VillageNPC` — dialog, trading |
| `EnemySpawner` — terrain-appropriate enemy spawning | |
| `CameraController` — map view (0.15x) ↔ explore view (1.5x) | |
| `ParticleManager` — dust, blood, weather effects | |
| `TerritoryManager` — 4×4 region grid, discovery/capture tracking | |

### Map Generation

`MapGenerator` uses simplex noise with a fixed seed (42) to produce deterministic terrain. Elevation and moisture combine to determine terrain type (plains, forest, mountains, desert, swamp, snow, etc.). `MapRenderer` tiles the world and places detail sprites (~4000 trees/rocks via deterministic hash).

### Sprite System

`SpriteFactory` draws all art procedurally using Phaser Graphics API. Sprites are drawn in grayscale/white then tinted at runtime per character class or enemy type. Color palettes live in `ParchmentColors.js`.

### Key Files

- `src/constants.js` — all game constants: tile sizes, terrain configs, enemy stats, combat values, resource definitions, UI colors, character class data
- `src/MathHelpers.js` — utility functions including A* pathfinding, coordinate conversion (tile↔world), lerp, clamp
- `src/CharacterClasses.js` — 5 classes (Knight, Archer, Builder, Merchant, Scout) with stat definitions

## Current Limitations

- No save/load (no persistence)
- No audio
- No multiplayer (despite package description)
- No external asset loading pipeline
