# Community Units Plan — Soldiers & Villagers

Spawn autonomous NPCs that fight, farm, mine, and chop for your team. Soldiers are spawned from castles. Villagers are spawned from forts. Units are selected via drag-box (desktop) or tap-and-hold selection wheel (iPad).

---

## Unit Definitions

### Soldiers (spawned from Castle buildings)

Each level costs progressively more resources. Soldiers patrol near the castle, auto-attack nearby enemies, and can be sent to locations by the player.

| Level | Name | HP | Damage | Speed | Attack Range | Cooldown | Cost | Color | Special |
|-------|------|-----|--------|-------|-------------|----------|------|-------|---------|
| 1 | Pawn | 30 | 3 | 60 | 20 | 1200ms | 10 wood, 5 stone | 0xc0c0c0 | Cheap, disposable |
| 2 | Archer | 25 | 5 | 50 | 80 | 1500ms | 15 wood, 10 stone, 5 gold | 0x4a7a2e | Ranged attack (arrow projectile), weak up close |
| 3 | White Knight | 60 | 7 | 70 | 24 | 1000ms | 30 wood, 25 stone, 15 gold | 0xe8e8f0 | High armor (takes 30% less damage), charges enemies |
| 4 | Barbarian | 80 | 12 | 90 | 28 | 800ms | 40 wood, 30 stone, 30 gold | 0x8b4513 | Berserker rage: +50% damage when below 40% HP, AoE cleave |
| 5 | Black Knight | 120 | 15 | 75 | 26 | 900ms | 60 wood, 50 stone, 50 gold, 10 ruby | 0x2a2a3a | Lifesteal (heals 20% of damage dealt), fear aura (enemies flee briefly on spawn) |

### Villagers (spawned from Fort buildings)

Villagers auto-gather resources and return them to the nearest fort/castle. They have low HP and flee from enemies.

| Type | HP | Speed | Gather Rate | Gather Amount | Target Terrain | Cost | Color |
|------|-----|-------|-------------|---------------|----------------|------|-------|
| Farmer | 20 | 55 | 5s per cycle | 2-3 gold | PLAINS, VILLAGE | 8 wood, 4 stone | 0xc8a870 |
| Builder | 25 | 50 | 8s per cycle | Repairs buildings +5 HP/cycle | Near buildings | 10 wood, 8 stone | 0xcd853f |
| Miner | 25 | 45 | 6s per cycle | 2-4 stone | MOUNTAINS, HILLS | 12 wood, 6 stone | 0x7a7068 |
| Lumberjack | 25 | 50 | 5s per cycle | 2-4 wood | FOREST | 10 wood, 4 stone | 0x5e8e3a |

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/entities/Unit.js` | Base class for all player-owned NPCs. Extends from similar pattern as Enemy.js. Contains: sprite, health bar, state machine, pathfinding, owner reference |
| `src/entities/Soldier.js` | Extends Unit. Soldier-specific combat AI: patrol, chase enemies, attack, return. Special abilities per type |
| `src/entities/Villager.js` | Extends Unit. Villager-specific gather AI: move to resource area, gather, return to base, deposit |
| `src/systems/UnitManager.js` | Central manager. Tracks all units, handles spawning, update loop, unit cap, selection state |
| `src/ui/UnitSelectionUI.js` | Drag-box selection (desktop) + tap-hold selection (iPad). Draws selection box, highlights selected units, shows command panel |
| `src/ui/CastleSpawnUI.js` | Panel shown when player presses E near a castle. Lists available soldiers/villagers with costs, spawn buttons |

### Modified Files

| File | Change |
|------|--------|
| `src/constants.js` | Add `SOLDIER_TYPES`, `VILLAGER_TYPES`, `UNIT_CAP = 20` |
| `src/utils/SpriteFactory.js` | Add `generateUnitTextures(scene)` — generate sprites for all 9 unit types (grayscale + tint) |
| `src/scenes/PreloadScene.js` | Call `SpriteFactory.generateUnitTextures(scene)` |
| `src/scenes/GameScene.js` | Create `UnitManager`, pass to HUD. Wire castle interaction to open spawn UI |
| `src/scenes/HUDScene.js` | Add `UnitSelectionUI`, `CastleSpawnUI`. Show unit count. Wire selection commands |
| `src/systems/CombatSystem.js` | Make soldiers targetable by enemies and able to deal damage to enemies |
| `src/systems/BuildingSystem.js` | Track which buildings are castles/forts for spawn eligibility |

---

## Step 1: Add unit type constants to `constants.js`

Add `SOLDIER_TYPES` object with the 5 soldier definitions (stats from table above).
Add `VILLAGER_TYPES` object with the 4 villager definitions.
Add `UNIT_CAP = 20` — max total units a player can have.

---

## Step 2: Generate unit sprites in `SpriteFactory.js`

Add a `generateUnitTextures(scene)` static method. For each soldier and villager type, generate:
- An idle sprite (16x16 or 20x20 depending on unit size)
- Drawn in grayscale/white, tinted at runtime with the unit's color
- Soldiers get weapon silhouettes (pawn: short sword, archer: bow, knight: longsword+shield, barbarian: two-handed axe, black knight: dark sword+cape)
- Villagers get tool silhouettes (farmer: hoe, builder: hammer, miner: pickaxe, lumberjack: axe)
- Each type gets a small colored banner/pennant on their back to distinguish from enemies

Call this from `generateAll()` in SpriteFactory.

---

## Step 3: Create `Unit.js` base entity

Pattern: similar to `Enemy.js` but serving the player.

**State machine:** `IDLE → MOVE_TO → WORKING → RETURNING → FLEEING → DEAD`

**Properties:**
- `sprite`, `healthBar` (same pattern as Enemy)
- `owner` — reference to player
- `homeBuilding` — the castle/fort that spawned this unit
- `targetX`, `targetY` — where they're going
- `state` — current FSM state
- `type` — soldier or villager type key
- `config` — stats from SOLDIER_TYPES or VILLAGER_TYPES
- `selected` — boolean, for selection highlighting

**Methods:**
- `update(dt)` — state machine tick
- `moveTo(x, y)` — set target and switch to MOVE_TO state
- `select()` / `deselect()` — toggle selection highlight (green circle under sprite)
- `takeDamage(amount)` — with armor reduction for knights
- `die()` — death animation, remove from manager
- `destroy()` — cleanup

**Pathfinding:**
- Simple direct movement (same as Enemy chase). Walk toward target, stop when close.
- Avoid water tiles using the same `isPassable` check the player uses.

---

## Step 4: Create `Soldier.js`

Extends Unit behavior with combat AI.

**States:** `IDLE → PATROL → CHASE_ENEMY → ATTACK_ENEMY → RETURN_HOME`

**IDLE/PATROL:** Wander near home castle (same patrol pattern as Enemy).

**CHASE_ENEMY:** When an enemy enters aggro range (96px), chase it. Soldiers prioritize enemies closest to their home building.

**ATTACK_ENEMY:** When in attack range, deal damage on cooldown. Play attack animation.

**RETURN_HOME:** If enemy dies or moves too far (200px from home), return to patrol.

**Special abilities (checked in attack logic):**
- **Archer:** Creates a small projectile sprite that travels to the enemy. Damage applied on arrival. Can attack from further away but deals 50% less damage if enemy is within melee range.
- **White Knight:** `damageReduction = 0.3` applied in `takeDamage()`. On first chase, brief speed boost (1.5x for 1 second).
- **Barbarian:** In `attack()`, if `health < maxHealth * 0.4`, multiply damage by 1.5. Attack hits all enemies within a small AoE radius (24px).
- **Black Knight:** In `attack()`, heal self by `Math.round(damage * 0.2)`. On spawn, all enemies within 128px get a 2-second flee state.

---

## Step 5: Create `Villager.js`

Extends Unit behavior with gathering AI.

**States:** `IDLE → MOVE_TO_RESOURCE → GATHERING → RETURNING → DEPOSITING`

**IDLE:** Wait near home building.

**MOVE_TO_RESOURCE:** Walk toward the nearest valid terrain tile for this villager type.
- Farmer → PLAINS or VILLAGE tiles
- Miner → MOUNTAINS or HILLS tiles
- Lumberjack → FOREST tiles
- Builder → nearest damaged building (skip if none damaged)

**GATHERING:** Stand on the resource tile. Increment a `gatherTimer`. When timer reaches `gatherRate` (from config), produce resources into a `carried` amount. Max carry = 3 cycles worth.

**RETURNING:** Walk back to home building.

**DEPOSITING:** At home building, add `carried` resources to player's currency. Reset `carried` to 0. Go back to MOVE_TO_RESOURCE.

**Flee behavior:** If an enemy comes within 64px, switch to FLEEING state. Run directly away from the enemy. Return to IDLE when enemy is >128px away or after 5 seconds.

---

## Step 6: Create `UnitManager.js`

Central system that GameScene owns.

**Properties:**
- `units: []` — all active units (soldiers + villagers)
- `selectedUnits: []` — currently selected units
- `unitCap: UNIT_CAP` (20)

**Methods:**
- `spawnSoldier(type, building)` — create Soldier at building location, add to units array. Check unit cap. Deduct costs from player.
- `spawnVillager(type, building)` — same for Villager.
- `update(dt)` — loop all units, call `unit.update(dt)`. Pass nearby enemies to soldiers for targeting.
- `getUnitsNear(x, y, radius)` — spatial query.
- `selectInRect(x1, y1, x2, y2)` — select all player units within a screen-space rectangle.
- `selectAll()` — select all units (for iPad shortcut).
- `commandMoveTo(x, y)` — tell all selected units to move to world position.
- `clearSelection()` — deselect all.
- `getUnitCount()` — current count vs cap.

---

## Step 7: Create `UnitSelectionUI.js`

Handles two selection modes:

### Desktop: Drag-box selection
- On `pointerdown` (right-click or left-click on empty ground), record start position.
- On `pointermove` while held, draw a green translucent rectangle from start to current position.
- On `pointerup`, call `unitManager.selectInRect()` with the box bounds (convert screen coords to world coords using camera).
- Right-click on ground with selected units → `commandMoveTo()` at that world position.

### iPad/Touch: Tap-and-hold selection
- Double-tap on a unit to select it individually.
- Triple-tap anywhere to select all units (`selectAll()`).
- Long-press (500ms) and drag to create a selection box (same as desktop drag).
- After selecting, tap a location on the map to send units there.
- Show a small "Select All" button in the HUD when any units exist.

### Selection visuals
- Selected units get a pulsing green circle drawn under their sprite.
- A small panel appears at the bottom-center showing: count of selected units, icons of unit types in selection, and a "Move" / "Stop" command row.

---

## Step 8: Create `CastleSpawnUI.js`

Panel that appears when player presses E near a placed castle or fort building.

**Layout:** Parchment-themed panel (same style as ShopPanel/BuildMenu). Shows:
- Building name at top ("Castle" or "Fort")
- Current unit count: `3 / 20`
- Two sections: "Soldiers" (if castle) and "Villagers" (if castle or fort)
- Each unit type shows: icon, name, cost, "Spawn" button
- Spawn button is grayed out if: insufficient resources OR unit cap reached
- Spawned unit appears at the building entrance with a brief fade-in

**Castle:** Can spawn all 5 soldier types + all 4 villager types
**Fort:** Can only spawn villager types

---

## Step 9: Wire into `GameScene.js`

1. Create `UnitManager` in `create()`, store as `this.unitManager`.
2. In the structure/building proximity check (where E key opens UI), detect if the building is a castle/fort.
3. On E press near castle/fort, open `CastleSpawnUI` via HUD scene.
4. Pass `unitManager` to HUD scene data for selection UI.
5. In `update()`, call `this.unitManager.update(dt)` and pass enemies from `enemySpawner.getActiveEnemies()`.

---

## Step 10: Wire into `CombatSystem.js`

1. In the enemy attack loop, also check if enemies are near any soldiers. Enemies should target the nearest threat (player or soldier).
2. When a soldier attacks an enemy, use the same `enemy.takeDamage()` and knockback.
3. When an enemy attacks a soldier, use `soldier.takeDamage()`.
4. Drop resources to player when soldier kills an enemy.

---

## Step 11: Wire into `HUDScene.js`

1. Create `UnitSelectionUI` in `create()`.
2. Create `CastleSpawnUI` (hidden by default).
3. Add a unit count display near the minimap: "Units: 3/20".
4. Listen for `openCastleUI` event from GameScene to show the spawn panel.
5. Handle selection inputs (drag, double-tap, etc.) via UnitSelectionUI.

---

## Step 12: Verify

1. `npm run build` — must pass with no errors.
2. Build a castle → press E → spawn panel appears with soldier/villager options.
3. Spawn a Pawn → it patrols near the castle.
4. Enemies approach → Pawn engages and fights.
5. Spawn a Lumberjack → it walks to nearest forest, chops, returns to castle, deposits wood.
6. Drag-select multiple units → right-click to send them somewhere.
7. On iPad: double-tap unit → selected. Tap ground → unit moves there.
8. Spawn 20 units → cap reached, spawn buttons grayed out.
9. Unit dies → count decreases, new unit can be spawned.

---

## Summary of all new/modified files

| New Files | Modified Files |
|-----------|----------------|
| `src/entities/Unit.js` | `src/constants.js` |
| `src/entities/Soldier.js` | `src/utils/SpriteFactory.js` |
| `src/entities/Villager.js` | `src/scenes/PreloadScene.js` |
| `src/systems/UnitManager.js` | `src/scenes/GameScene.js` |
| `src/ui/UnitSelectionUI.js` | `src/scenes/HUDScene.js` |
| `src/ui/CastleSpawnUI.js` | `src/systems/CombatSystem.js` |
| | `src/systems/BuildingSystem.js` |
