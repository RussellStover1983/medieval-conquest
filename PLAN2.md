# Bugfix Plan — Post-Unit-System Testing

Two bugs found during playtesting on 3/10.

---

## Bug 1: "STATS" and "TITLES" yellow text permanently visible on map

**Root cause:** `CharacterMenu.js` — the "STATS" and "TITLES" header texts are created in `_build()` but never added to `this.elements`, so `_hideAll()` never hides them.

- **Line 72–75:** The `STATS` text is created via `this.scene.add.text(...)` but line 75 has a broken push: `this.elements.push(this.elements[this.elements.length])` — `this.elements.length` is past the end, so it pushes `undefined` instead of the text object.
- **Line 110–112:** The `TITLES` text is created but never pushed to `this.elements` at all.

Both texts are created at depth 512 with `setScrollFactor(0)` and gold color `#ffd700`. Since they're never tracked, `_hideAll()` can't reach them, so they stay visible permanently.

### Fix

1. Store the "STATS" text in a local variable and push it into `this.elements`:
   ```js
   const statsHeader = this.scene.add.text(left + 20, top + 154, 'STATS', { ... });
   statsHeader.setScrollFactor(0).setDepth(512);
   this.elements.push(statsHeader);
   ```

2. Store the "TITLES" text the same way:
   ```js
   const titlesHeader = this.scene.add.text(left + 20, titlesY, 'TITLES', { ... });
   titlesHeader.setScrollFactor(0).setDepth(512);
   this.elements.push(titlesHeader);
   ```

**Files:** `src/ui/CharacterMenu.js` (lines 72–75 and 110–112)

---

## Bug 2: Game freezes (input locked) after spawning a pawn

**Root cause:** `CastleSpawnUI.close()` does not emit `pauseInput(false)` back to GameScene. The open flow pauses input, but closing never unpauses it.

**Flow that causes the freeze:**
1. Player presses E near castle → HUDScene emits `pauseInput(true)` → GameScene sets `this.inputPaused = true`
2. Player clicks "Spawn" → `CastleSpawnUI` calls `this.close()` then `this.open()` to re-render with updated counts
3. Player clicks X to close → `this.close()` runs, destroys UI elements
4. **`pauseInput(false)` is never emitted** → GameScene stays in `inputPaused = true`
5. Player cannot move, attack, build, or interact — game appears frozen

**Secondary issue:** Even if the player doesn't close the UI, just spawning re-renders the panel via close/open without going through HUDScene's event flow, so the pauseInput state is fragile.

### Fix

1. In `CastleSpawnUI.close()`, emit the unpause event so GameScene regains input:
   ```js
   close() {
     this.isOpen = false;
     this.building = null;
     this.buildingType = null;
     for (const el of this.elements) {
       el.destroy();
     }
     this.elements = [];
     this.scene.events.emit('pauseInput', false);
   }
   ```

2. In the spawn button's `pointerdown` handler (lines 151–164), suppress the unpause during re-render. Save building refs, close (which now unpauses), then re-open (which should re-pause). Or better: add a flag to skip the emit during re-render:
   ```js
   btn.on('pointerdown', () => {
     const bld = this.building;
     const bldType = this.buildingType;
     let spawned;
     if (unitType === 'soldier') {
       spawned = this.unitManager.spawnSoldier(key, bld);
     } else {
       spawned = this.unitManager.spawnVillager(key, bld);
     }
     if (spawned) {
       this._rerender(bld, bldType);  // re-render without close/open cycle
     }
   });
   ```
   Add a `_rerender(bld, bldType)` method that destroys elements and rebuilds without touching `isOpen` or emitting events:
   ```js
   _rerender(bld, bldType) {
     for (const el of this.elements) el.destroy();
     this.elements = [];
     this.building = bld;
     this.buildingType = bldType;
     this._render();
   }
   ```

**Files:** `src/ui/CastleSpawnUI.js` (lines 22–30 and 151–164)

---

## Implementation Order

1. Fix CharacterMenu.js — "STATS" and "TITLES" text tracking (Bug 1)
2. Fix CastleSpawnUI.js — add pauseInput(false) to close() and add _rerender() method (Bug 2)
3. `npm run build` — verify no build errors
4. Manual test: open/close character menu (C key) — confirm no stray text
5. Manual test: build castle → E → spawn pawn → close UI → verify player can move

---

## Summary of changes

| File | Change |
|------|--------|
| `src/ui/CharacterMenu.js` | Fix "STATS" and "TITLES" text objects not being tracked in `this.elements` |
| `src/ui/CastleSpawnUI.js` | Emit `pauseInput(false)` on close; add `_rerender()` to avoid close/open cycle on spawn |
