# Medieval Conquest - Project Summary

## What Is This?

A browser-based medieval strategy/exploration game built with **Phaser 3** and **Vite**. Everything is procedurally generated at runtime -- no external image assets. The player picks a character class, explores a 128x128 tile world, fights enemies, collects resources, discovers territory, and visits villages.

---

## How to Run

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

**Dependencies**: `phaser` (v3.80.1), `simplex-noise` (v4.0.3), `vite` (v5.4.0 dev)

---

## Project Structure

```
medieval-conquest/
  src/
    main.js                    # Entry point, Phaser game config
    constants.js               # All game constants (tile size, terrain types, combat stats, enemy configs)

    scenes/                    # Game scenes (flow: Preload -> Boot -> MainMenu -> CharSelect -> Game)
      PreloadScene.js          # Generates all procedural textures via SpriteFactory
      BootScene.js             # 1.5s splash screen with title
      MainMenuScene.js         # "Begin Adventure" menu
      CharSelectScene.js       # Pick from 5 classes (Knight, Archer, Builder, Merchant, Scout)
      GameScene.js             # Main gameplay: overworld exploration, combat, territory
      HUDScene.js              # UI overlay: health bar, currency, mini-map, buttons, notifications
      VillageScene.js          # Interior village: NPCs, buildings, dialog, trading

    entities/                  # Game objects with state and behavior
      Player.js                # Player sprite, health, inventory, movement, animations
      Enemy.js                 # Enemy AI (idle/chase/attack/dead), health bar, combat feedback
      VillageNPC.js            # NPCs inside villages (Innkeeper, Shopkeeper, Blacksmith)
      CharacterClasses.js      # 5 class definitions with stats (STR/SPD/DEF/BLD/TRD)

    systems/                   # Game logic systems
      MovementSystem.js        # Keyboard + touch joystick input -> player movement
      CombatSystem.js          # Attack handling, hit detection, damage, screen shake, weapon trails
      ResourceSystem.js        # Auto-collects resources near player
      EnemySpawner.js          # Spawns terrain-appropriate enemies around player
      CameraController.js      # Map view (0.15x zoom) <-> Explore view (1.5x zoom) with smooth transitions
      ParticleManager.js       # Dust, blood, sparkles, sparks, weather (rain/snow), ambient effects

    map/                       # World generation and rendering
      MapGenerator.js          # Simplex noise terrain, villages, rivers, roads, resource placement
      MapRenderer.js           # Draws terrain tiles, detail sprites, water overlays, resource gems
      TerrainTypes.js          # Terrain config: speed modifiers, passability
      TerritoryManager.js      # 16 named regions, discovery tracking, capture at 60% explored

    ui/                        # HUD components
      HealthBar.js             # Player health display (top-left)
      CurrencyDisplay.js       # Gold/Silver/Emerald/Ruby counts
      MiniMap.js               # Small overview map (bottom-right in explore)
      TouchControls.js         # Virtual joystick for mobile
      ViewToggleButton.js      # Map <-> Explore toggle button
      AttackButton.js          # Touch attack button

    utils/                     # Shared utilities
      ParchmentColors.js       # Color palettes: terrain (with light/dark/detail variants), UI, classes, resources
      SpriteFactory.js         # Generates ALL pixel art: player, enemies, resources, terrain details, particles, villages
      MathHelpers.js           # clamp, lerp, distance, tile<->world coords, A* pathfinding
```

---

## What Has Been Built

### Core Gameplay Loop
- **Movement**: WASD/arrows + touch joystick. Terrain affects speed (roads fast, mountains slow, water impassable).
- **Combat**: SPACE to attack. Enemies have AI states (wander, chase, attack). Weapon trail effects, screen shake, blood/spark particles on hit. Two-phase hit flash + squash-stretch on enemies. Death expand+fade effect.
- **Resources**: 4 types (gold, silver, emerald, ruby) scattered on the map. Auto-collected when nearby. Sparkle particles on pickup.
- **Territory**: 16 named regions. Tiles discovered as player explores (3-tile radius, 5 for Scout). Regions captured at 60% discovery. Visual overlay on map view.
- **Villages**: Enter with E key. Interior scene with Inn (heal), Shop, Blacksmith NPCs. Dialog system.

### 5 Character Classes
Knight (tank), Archer (balanced), Builder (construction focus), Merchant (trade focus), Scout (fastest, widest vision). Stats affect attack speed, damage, defense, and movement.

### 5 Enemy Types
Wolf (forest), Bandit (roads/plains), Troll (mountains, tanky), Sea Serpent (water), Skeleton (snow/sand). Each drops specific resources.

### Visual System
All art is procedural pixel-art generated in `SpriteFactory`:
- Player: 28 textures (4 dirs x 7 animation states), white silhouettes tinted per class
- Enemies: 20 textures (5 types x 2 states x 2 frames), each with shadow outlines and per-type detail
- Terrain details: trees, pines, bushes, grass, rocks, flowers, cattails, mountains, houses
- Particles: dust, blood (3 variants), sparkles, sparks, rain, snow, leaves, mist, rain splashes
- Village buildings: inn, shop, blacksmith, gate, floor tiles, walls

### Terrain Rendering
- Graphics-based terrain with palette color variation (4 shades per terrain type via `TERRAIN_PALETTE`)
- Detail sprites placed by deterministic hash (~30-40% coverage forests, ~25-30% mountains/hills/plains)
- Water tiles have animated ripple overlays
- Weather system: snow in snow biome, rain chance in mountains/forests

### Combat Feedback
- 3-part weapon trail (white -> light blue, staggered fade)
- Impact sparks on hit
- Screen shake on hitting enemy and taking damage
- Camera red flash on player damage
- Enemy health bars with border, highlight, green->yellow->red color transitions
- Enemy hit: white flash -> red flash -> restore + squash-stretch
- Enemy death: blood + sparks burst, expand + fade

### UI/HUD
- Health bar, currency display, class label
- Mini-map in explore view
- Territory capture notifications
- Village entry prompts
- Touch controls (joystick + attack button) for mobile
- Map/Explore view toggle with smooth zoom

---

## Key Architecture Decisions

- **No external assets**: Everything generated procedurally in `PreloadScene` via `SpriteFactory`. Makes deployment simple but limits visual fidelity.
- **Scene-based architecture**: Phaser scenes for game states. `GameScene` sleeps (not destroyed) when entering villages, preserving state.
- **ECS-lite**: Not a full ECS, but systems are separated from entities. `MovementSystem`, `CombatSystem`, `ResourceSystem`, `ParticleManager` each own their logic.
- **Deterministic terrain**: `MapGenerator` uses a fixed seed (42) with simplex noise for reproducible worlds.
- **Sprite tinting**: Player and enemy sprites are drawn in grayscale/white, then tinted at runtime for class/type colors.

---

## Potential Next Steps

### Gameplay
- **Building system**: Builder class has stats but no building mechanics yet. Could place structures that generate resources or defend territory.
- **Trading system**: Merchant class has trade stat but no trade routes or economy. Village shops could buy/sell resources.
- **Quest system**: NPCs currently have basic dialog. Could assign fetch/kill/explore quests with rewards.
- **Crafting**: Combine resources into equipment (weapons, armor) that modify stats.
- **Equipment/inventory screen**: Visual inventory with equippable items.
- **Boss enemies**: Unique enemies at specific map locations with special drops.
- **Day/night cycle**: Affect visibility, enemy spawns, and gameplay.

### World
- **Larger/varied maps**: Multiple map seeds, biome-specific features, dungeons.
- **Fog of war**: Only show previously-explored areas on map view.
- **Destructible/interactive terrain**: Cut trees, mine rocks, build bridges.
- **More village interiors**: Different layouts, more NPC types, mini-games.

### Visual Polish
- **Terrain noise textures**: Per-pixel noise on terrain tiles (was attempted but removed for performance -- could revisit with Canvas textures instead of per-pixel Graphics calls).
- **Terrain transitions**: Smooth blending between biomes (was attempted with RenderTexture but too memory-heavy -- could try smaller transition sprites).
- **More animation frames**: Currently 2-4 frames per animation. More frames = smoother movement.
- **Lighting/shadows**: Dynamic lighting near torches, time-of-day shadows.
- **UI polish**: Parchment-themed menus, better fonts, item tooltips.

### Technical
- **Performance**: Detail sprite count (~4,000) could be reduced by baking them into a RenderTexture during scene creation rather than individual scene objects.
- **Multiplayer**: Package.json describes "multiplayer" but nothing is implemented. Would need WebSocket server, state sync, and conflict resolution.
- **Save/load**: Persist player progress, inventory, discovered territory to localStorage or a backend.
- **Sound**: No audio at all currently. Could add ambient music, combat sounds, UI feedback.
- **Mobile optimization**: Touch controls exist but haven't been tuned. Virtual joystick dead zones, button sizes, and screen layout need testing.
- **Code splitting**: Vite warns about 1.5MB bundle. Could lazy-load scenes or split Phaser out.

### Known Issues
- `simplex-noise` is imported but only used by `MapGenerator`. The terrain tile texture generation that was planned to use it was removed due to performance issues.
- Map seed is hardcoded to 42. Could be made configurable for replayability.
- Enemy spawning can sometimes place enemies in walls/water if terrain check is approximate.
- Village NPCs have placeholder dialog and interactions.
