# Medieval Conquest - 5 Gameplay Changes

## Context
Player feedback identified 5 areas for improvement: enemies are too hard, enemies wander aimlessly, shop only uses gold, no wood/stone resources, and no building system. These changes transform the game from a simple hack-and-slash into a more strategic build-and-battle experience.

## Implementation Order
1 → 4 → 3 → 2 → 5 (dependencies: Change 5 needs wood/stone from Change 4)

---

## Change 1: Reduce Enemy Difficulty by ~50%

**File:** `src/constants.js` (lines 54-120)

Halve HP and damage for all 5 enemy types:

| Enemy | HP (old→new) | Damage (old→new) |
|-------|-------------|-------------------|
| Wolf | 30→15 | 8→4 |
| Bandit | 50→25 | 12→6 |
| Troll | 100→50 | 20→10 |
| SeaSerpent | 40→20 | 10→5 |
| Skeleton | 35→18 | 10→5 |

No other files affected — Enemy.js reads these values dynamically.

---

## Change 2: Enemy Base Camps

### New Constants in `src/constants.js`

Add `CAMP_TYPES` defining 5 camp types (one per enemy), each with: `enemyType`, `maxEnemies` (2-4), `patrolRadius` (64-96px), `ventureRadius` (128-192px), `respawnTime` (15-30s), terrain list, and sprite size.

Add `CAMP_SETTINGS`: `totalCamps: 20`, `minDistFromVillage: 15` tiles, `minDistBetween: 10` tiles.

### Camp Placement — `src/map/MapGenerator.js`

Add `placeCamps()` method called in `generate()` after `placeVillages()`. Uses existing RNG + terrain matching to place 20 camps. Return `camps` array in `generate()` output alongside terrain/villages/resources.

### New File: `src/systems/CampManager.js`

Manages camp lifecycle:
- Stores array of camp objects: `{ tileX, tileY, config, enemies[], respawnTimers[] }`
- `update(dt, playerX, playerY)`: for camps within 400px of player, update enemies and handle respawning. Camps >600px: despawn their enemy sprites.
- `getActiveEnemies()`: returns all active enemies across all active camps
- `renderCamps(scene)`: creates tent + campfire sprites at each camp location on the map
- `destroyAll()`: cleanup method

### Enemy AI Changes — `src/entities/Enemy.js`

- Add `campX`/`campY` constructor params (default `null`)
- Add `STATE.RETURN = 4`: enemy walks back to camp at full speed
- **IDLE**: Patrol within `patrolRadius` of camp center instead of random wandering
- **CHASE**: If distance from camp > `ventureRadius`, transition to RETURN instead of continuing chase
- **RETURN**: Walk toward camp center, transition to IDLE when within `patrolRadius/2`
- Non-camp enemies (if any future use) behave as before when `campX === null`

### Spawner Rework — `src/systems/EnemySpawner.js`

Replace random-spawn logic. Instead, instantiate `CampManager` and delegate:
- `update()` → `campManager.update()`
- `getActiveEnemies()` → `campManager.getActiveEnemies()`
- `destroyAll()` → `campManager.destroyAll()`

### New Sprites — `src/utils/SpriteFactory.js`

Add `generateCampTextures(scene)`:
- `detail_camp_tent` (24x24): brown triangular tent with entrance flap
- `detail_camp_fire` (16x16): crossed logs with orange/yellow flames + red glow circle

### MiniMap Markers — `src/ui/MiniMap.js`

Draw small red dots for each camp location on the minimap after rendering terrain.

### GameScene Integration — `src/scenes/GameScene.js`

Pass `mapData.camps` to `EnemySpawner` constructor. EnemySpawner creates CampManager internally.

---

## Change 3: Shop Accepts Different Gem Types

### New Cost Structure — `src/constants.js`

Add `gemCost` field to each item in `ITEMS` (replace `cost`):

| Item | Gem Cost |
|------|----------|
| Sword | 3 ruby |
| Axe | 5 ruby |
| Spear | 4 emerald |
| Health Potion | 8 silver |
| Pickaxe | 20 gold |
| Torch | 10 gold |

Rationale: Weapons cost rare gems (ruby/emerald from tough enemies), consumables cost common gems (silver from wolves), tools cost gold (from bandits/skeletons + map).

### Shop UI Rework — `src/ui/ShopPanel.js`

- **`_build()`**: Replace `${item.cost} gold` text with colored gem circle + amount for each gem type in `item.gemCost`
- **`_buyItem()`**: Check all gem types in `gemCost`, deduct each on purchase
- **`_updateGold()`** → rename to **`_updateCurrency()`**: Show all 4 gem totals at bottom of panel

### Merchant NPC — `src/entities/VillageNPC.js`

Change `shopkeeper` interaction from gem→gold conversion to informational dialog: "Silver from wolves, gold from bandits, emerald from serpents, ruby from trolls." (Since gold is no longer universal currency, the conversion is obsolete.)

---

## Change 4: Wood and Stone Resources

### New Resource Types — `src/constants.js`

```js
RESOURCES: { ..., WOOD: 'wood', STONE: 'stone' }
```

### Player Currency — `src/entities/Player.js`

Add `wood: 0, stone: 0` to `this.currency`.

### Resource Scattering — `src/map/MapGenerator.js`

Add to `scatterResources()`:
- **Wood**: 60 nodes on FOREST/PLAINS terrain
- **Stone**: 40 nodes on HILLS/MOUNTAINS terrain

Same placement logic as gems (min distance 3 tiles, terrain check).

### New Sprites — `src/utils/SpriteFactory.js`

Add in `generateResourceTextures()`:
- `resource_wood` (12x12): brown log bundle (3 stacked horizontal cylinders)
- `resource_stone` (12x12): gray irregular polygon with highlight facet

### Resource Colors — `src/utils/ParchmentColors.js`

Add to `RESOURCE_COLORS`: `wood: 0x8b5e3c` (brown), `stone: 0x7a7068` (gray)

### Currency Display — `src/ui/CurrencyDisplay.js`

Add 'wood' and 'stone' to the `types` and `labels` arrays (lines 10-11). The existing loop handles the rest — adds 2 more rows (22px each).

### MapRenderer — No changes needed

`renderResources()` already uses `resource_${res.type}` as texture key and `RESOURCE_COLORS[res.type]` for glow — fully generic.

### ResourceSystem — No changes needed

Auto-collect proximity logic in `ResourceSystem.js` already handles all resource types. Pickaxe multiplier applies to all types.

---

## Change 5: Build Forts and Castles

### Building Definitions — `src/constants.js`

```
BUILDING_TYPES:
  wall:   { cost: {wood:5, stone:3},   size:1, territoryBonus:0.02 }
  tower:  { cost: {wood:10, stone:8},  size:1, territoryBonus:0.05, discoveryRadius:5 }
  fort:   { cost: {wood:25, stone:20}, size:2, territoryBonus:0.15 }
  castle: { cost: {wood:60, stone:50}, size:3, territoryBonus:0.30 }
```

Builder class discount: `costMult = max(0.5, 1 - (buildStat - 2) * 0.05)` → Builder (build=9) pays 65%.

### New File: `src/systems/BuildingSystem.js`

- `buildings[]` array storing placed buildings
- `startPlacement(typeKey)`: enter placement mode, show ghost sprite
- `confirmPlacement(tileX, tileY)`: validate terrain (no water/village/mountains/overlap), check+deduct resources, render building, apply territory bonus
- `cancelPlacement()`: exit placement mode
- `update(dt)`: position ghost sprite in front of player (snapped to tile grid), tint green/red based on validity
- `_canBuildAt(tileX, tileY, size)`: validate placement for NxN tiles
- `_renderBuilding(building)`: create sprite at world position
- Territory bonus: immediately discovers tiles in a radius around the building using `TerritoryManager.discoverTile()`

### New File: `src/ui/BuildMenu.js`

Panel similar to ShopPanel, toggled with B key:
- Title "BUILD"
- Row per building type: icon, name, description, cost (wood/stone icons + amounts, shows Builder discount), BUILD button
- Resource display at bottom: "Wood: X  Stone: Y"
- Clicking BUILD closes menu and starts placement mode

### Building Sprites — `src/utils/SpriteFactory.js`

Add `generateBuildingTextures(scene)`:
- `building_wall` (32x32): gray stone blocks with mortar lines, top crenellation
- `building_tower` (32x48): cylindrical stone base, pointed roof, window slit, flag
- `building_fort` (48x48): square stone walls, 4 corner turrets, gate
- `building_castle` (64x64): thick walls, 4 corner towers, central keep, banner

### Placement Flow

1. Press B → BuildMenu opens (input paused)
2. Click building type → menu closes, placement mode starts
3. Ghost sprite appears in front of player, snapped to tile grid
4. Green tint = valid placement, red = invalid
5. Press E to confirm → building placed, resources deducted
6. Press ESC to cancel

### GameScene Integration — `src/scenes/GameScene.js`

- Create `BuildingSystem` in `create()`, pass to HUDScene data
- In `update()`: call `buildingSystem.update(dt)`
- Guard E key: `buildingSystem.isPlacing` takes priority over village entry

### HUDScene Integration — `src/scenes/HUDScene.js`

- Create `BuildMenu` in `create()`
- Add B key handler to toggle build menu
- Emit `pauseInput` when build menu is open
- E key during placement: call `buildingSystem.confirmPlacement()`
- ESC during placement: call `buildingSystem.cancelPlacement()`

---

## Files Summary

### New Files (3)
| File | Purpose |
|------|---------|
| `src/systems/CampManager.js` | Camp lifecycle, per-camp enemy spawning/despawning |
| `src/systems/BuildingSystem.js` | Building placement, validation, territory integration |
| `src/ui/BuildMenu.js` | Build menu UI panel |

### Modified Files (13)
| File | Changes |
|------|---------|
| `src/constants.js` | Enemy stat reductions; CAMP_TYPES/CAMP_SETTINGS; gemCost on items; WOOD/STONE resources; BUILDING_TYPES |
| `src/entities/Enemy.js` | campX/campY params, STATE.RETURN, patrol/venture/return behavior |
| `src/entities/Player.js` | Add wood/stone to currency |
| `src/entities/VillageNPC.js` | Merchant → informational dialog |
| `src/map/MapGenerator.js` | placeCamps() method; wood/stone in scatterResources() |
| `src/systems/EnemySpawner.js` | Delegate to CampManager |
| `src/scenes/GameScene.js` | CampManager + BuildingSystem init; B key; guard E key for placement |
| `src/scenes/HUDScene.js` | BuildMenu; B key toggle; placement E/ESC keys |
| `src/ui/ShopPanel.js` | Multi-gem cost display + purchase logic |
| `src/ui/CurrencyDisplay.js` | Add wood/stone rows |
| `src/ui/MiniMap.js` | Camp markers (red dots) |
| `src/utils/SpriteFactory.js` | Camp textures (tent, fire); resource textures (wood, stone); building textures (wall, tower, fort, castle) |
| `src/utils/ParchmentColors.js` | Add wood/stone to RESOURCE_COLORS |

---

## Verification

1. `npm run dev` → open localhost:3000
2. Start game as any class → verify enemies are easier to kill (2-3 hits instead of 4-6)
3. Explore map → verify enemy camps visible (tents + campfires), enemies patrol near camps, chase player but return to camp if too far
4. Check minimap → red dots for camps
5. Enter village → talk to Blacksmith → verify shop shows gem costs (ruby/emerald/silver/gold icons)
6. Talk to Merchant → verify informational dialog (no gem conversion)
7. Walk in forests → pick up wood nodes; walk in hills → pick up stone nodes
8. Check currency display → wood and stone shown
9. Press B → build menu opens with wall/tower/fort/castle and costs
10. Select building → ghost sprite follows player → E to place, ESC to cancel
11. Place a tower → verify tiles discovered in radius
12. Test as Builder class → verify reduced building costs
