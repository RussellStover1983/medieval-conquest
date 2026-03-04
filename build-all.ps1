# ============================================================================
# MEDIEVAL CONQUEST — AUTONOMOUS BUILD SCRIPT (PowerShell)
# ============================================================================
# USAGE:
#   1. Place this file + medieval-conquest-claude-code-prompt.txt in project root
#   2. git add -A; git commit -m "pre-build checkpoint"
#   3. Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned  (one time)
#   4. .\build-all.ps1
# ESTIMATED TIME: 30-90 minutes
# ============================================================================

$ErrorActionPreference = "Continue"
$LogFile = "build-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $Message
}

# ── Pre-flight checks ──────────────────────────────────────────────────────

Log "============================================" "Cyan"
Log "  MEDIEVAL CONQUEST — AUTONOMOUS BUILD" "Cyan"
Log "============================================" "Cyan"
Log ""

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Log "ERROR: Claude Code not installed. Run: npm install -g @anthropic-ai/claude-code" "Red"
    exit 1
}
if (-not (Test-Path "package.json")) {
    Log "ERROR: No package.json. Run this from your project root." "Red"
    exit 1
}
$PromptFile = "medieval-conquest-claude-code-prompt.txt"
if (-not (Test-Path $PromptFile)) {
    Log "ERROR: $PromptFile not found in project root." "Red"
    exit 1
}

Log "Make sure you've committed: git add -A; git commit -m `"pre-build`"" "Yellow"
Read-Host "Press Enter to continue (Ctrl+C to abort)"
Log ""

$MasterPrompt = Get-Content $PromptFile -Raw

# ── Helpers ─────────────────────────────────────────────────────────────────

function Run-Phase {
    param([int]$Num, [string]$Name, [string]$Prompt)

    Log "──────────────────────────────────────────" "Cyan"
    Log "  PHASE $Num`: $Name" "Cyan"
    Log "  Started: $(Get-Date)" "Cyan"
    Log "──────────────────────────────────────────" "Cyan"

    $tmp = "temp-phase-$Num.txt"
    Set-Content -Path $tmp -Value $Prompt -Encoding UTF8

    try {
        & claude -p (Get-Content $tmp -Raw) `
            --permission-mode acceptEdits `
            --allowedTools "Read,Write,Edit,Bash(npm *),Bash(node *),Bash(mkdir *),Bash(cp *),Bash(mv *),Bash(cat *),Bash(ls *),Bash(find *),Bash(head *),Bash(tail *),Bash(wc *),Bash(grep *),Bash(touch *),Bash(echo *),Bash(cd *),Bash(npx *)" `
            --max-turns 200 2>&1 | ForEach-Object {
                Write-Host $_
                Add-Content -Path $LogFile -Value $_
            }
        Log "Phase $Num complete" "Green"
    }
    catch {
        Log "Phase $Num ERROR: $_" "Red"
        Remove-Item $tmp -ErrorAction SilentlyContinue
        exit 1
    }
    finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
    Log "  Finished: $(Get-Date)" "Cyan"
    Log ""
}

function Verify-Build {
    param([int]$Num)
    Log "Verifying build after Phase $Num..." "Yellow"

    $result = & npm run build 2>&1
    $result | ForEach-Object { Add-Content -Path $LogFile -Value $_ }

    if ($LASTEXITCODE -eq 0) {
        Log "Build PASSED after Phase $Num" "Green"
        return
    }

    Log "Build FAILED — auto-fixing..." "Red"
    $errors = $result -join "`n"

    try {
        & claude -p "The Vite build failed after Phase $Num. Errors:`n$errors`n`nFix all build errors. Only fix errors, do not change logic." `
            --permission-mode acceptEdits `
            --allowedTools "Read,Write,Edit,Bash(npm *),Bash(node *),Bash(cat *),Bash(ls *)" `
            --max-turns 50 2>&1 | ForEach-Object {
                Write-Host $_; Add-Content -Path $LogFile -Value $_
            }
    } catch { Log "Auto-fix error: $_" "Red" }

    $retry = & npm run build 2>&1
    $retry | ForEach-Object { Add-Content -Path $LogFile -Value $_ }

    if ($LASTEXITCODE -eq 0) {
        Log "Build FIXED after Phase $Num" "Green"
    } else {
        Log "Build still failing. Manual fix needed." "Red"
        exit 1
    }
    Log ""
}

# ============================================================================
# PHASE 1: BACKEND SERVER & DATABASE
# ============================================================================

Run-Phase -Num 1 -Name "BACKEND SERVER & DATABASE" -Prompt @"
You are building a medieval conquest game. Here is the full specification:

$MasterPrompt

YOUR TASK: Implement PHASE 1 — BACKEND SERVER & DATABASE only.

Read the existing codebase first, especially package.json and vite.config.js.

Do exactly these steps:
1. mkdir -p server/src server/migrations
2. Create server/package.json with type:module and deps: express, ws, better-sqlite3, jsonwebtoken, uuid, cors
3. cd server && npm install
4. Create server/src/database.js — SQLite schema exactly as specified (players, submissions, votes, changelog, monuments tables). Export all helper functions listed.
5. Create server/src/auth.js — generatePlayerCode(), createToken(), verifyToken() exactly as specified
6. Create server/src/gameState.js — connectedPlayers Map, chatHistory array, broadcast(), addPlayer(), removePlayer(), updatePosition(), addChatMessage()
7. Create server/src/wordFilter.js — filterMessage(text) with basic word list
8. Create server/src/server.js — Express on port 3001, CORS, all REST endpoints, WebSocket server, all message handling exactly as specified
9. Add "server": "node server/src/server.js" to ROOT package.json scripts
10. Update vite.config.js with proxy config for /api and /ws
11. Verify: cd server && node src/server.js starts without errors, then kill it
12. Verify: cd .. && npm run build passes

Do NOT modify any src/ game files in this phase. Only create server/ and update package.json + vite.config.js.
"@

Verify-Build -Num 1

# ============================================================================
# PHASE 2: MULTIPLAYER CLIENT
# ============================================================================

Run-Phase -Num 2 -Name "MULTIPLAYER CLIENT" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 2 — MULTIPLAYER CLIENT INTEGRATION only.

The server from Phase 1 is complete. Now connect the Phaser game to it.

Read these existing files carefully before making changes:
- src/main.js (scene array order, Phaser config)
- src/scenes/GameScene.js (create() and update() structure)
- src/scenes/CharSelectScene.js (selectClass method)
- src/scenes/MainMenuScene.js (how it transitions to next scene)
- src/entities/Player.js (sprite creation, classData, facing, isMoving)
- src/entities/CharacterClasses.js (CHARACTER_CLASSES object)
- src/utils/ParchmentColors.js (UI_COLORS for styling)

Do exactly:
1. Create src/network/NetworkManager.js exactly as specified — singleton, WebSocket, position throttling at 10hz, remote player management, lerp interpolation
2. Create src/entities/RemotePlayer.js exactly as specified — sprite with tint from CHARACTER_CLASSES[selectedClass].color, name label at y-20, lerp interpolation in update()
3. Create src/scenes/LoginScene.js — new Phaser.Scene('LoginScene'), parchment background using UI_COLORS.PARCHMENT_BG, HTML overlay for text input, New Player and Returning Player flows, store playerData and authToken in registry
4. In src/main.js: import LoginScene, add it to scene array after MainMenuScene and before CharSelectScene
5. In src/scenes/MainMenuScene.js: change transition from CharSelectScene to LoginScene
6. In src/scenes/CharSelectScene.js: in selectClass(), add fetch PATCH to save selected class to server using registry playerData and authToken
7. In src/scenes/GameScene.js create(): after combatSystem creation (line ~74), add NetworkManager initialization using registry playerData/authToken
8. In src/scenes/GameScene.js update(): after combatSystem.update (line ~139), add networkManager.update call
9. Create src/player/PlayerState.js — auto-save every 30s, save on beforeunload

Verify: npm run build passes. Do NOT create chat, character menu, or any other phase's features.
"@

Verify-Build -Num 2

# ============================================================================
# PHASE 3: CHAT SYSTEM
# ============================================================================

Run-Phase -Num 3 -Name "CHAT SYSTEM" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 3 — CHAT SYSTEM only.

Read these existing files:
- src/scenes/GameScene.js (lines 100-106: inputPaused flag and pauseInput event system — USE THIS)
- src/scenes/HUDScene.js (how UI elements are created and positioned)

Create src/ui/ChatUI.js exactly as specified:
- HTML div overlay, bottom-left corner, 350x200px
- Background rgba(44,24,16,0.7), border rgba(139,107,74,0.5)
- Georgia serif 12px, color #f4e4c1
- Message list (last 20), scrollable
- Press Enter or T to open input, Enter sends, Escape closes
- While input focused: emit pauseInput(true) AND set scene.input.keyboard.enabled = false
- On blur: emit pauseInput(false) AND re-enable keyboard
- System messages in gold (#ffd700) for join/leave events
- Wire to NetworkManager: sendChat() for outgoing, listen for chatMessage events for incoming
- Instantiate in GameScene.create() after network setup

Verify: npm run build passes.
"@

Verify-Build -Num 3

# ============================================================================
# PHASE 4: PLAYER IDENTITY
# ============================================================================

Run-Phase -Num 4 -Name "PLAYER IDENTITY & PROGRESSION" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 4 — PLAYER IDENTITY & PROGRESSION only.

Read these existing files:
- src/scenes/HUDScene.js (TAB key handling pattern at lines 114-126 — copy this EXACT pattern for C key)
- src/ui/InventoryPanel.js (toggle/open/close pattern — copy for CharacterMenu)
- src/scenes/CharSelectScene.js (stat bar rendering pattern)

Do exactly:
1. Add TITLE_DEFINITIONS to src/constants.js
2. Create src/player/TitleManager.js
3. Create src/ui/CharacterMenu.js — toggle with C key, parchment styled, shows name/title/class/stats/join date/code
4. In src/scenes/HUDScene.js:
   a. Import CharacterMenu
   b. In create(): instantiate this.characterMenu = new CharacterMenu(this, this.player)
   c. Add C key: this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
   d. In update(): add C key toggle following the EXACT same pattern as TAB (lines 317-326)
   e. Add titleLabel below classLabel (line 77) showing player's active title
5. In src/systems/CombatSystem.js: in performPlayerAttack() where enemy.health <= 0 (around line 135), emit 'enemyKilled' event on scene
6. In PlayerState: listen for 'enemyKilled' and 'territoryCaptured' to increment stats

Verify: npm run build passes.
"@

Verify-Build -Num 4

# ============================================================================
# PHASE 5: TWO-LAYER WORLD
# ============================================================================

Run-Phase -Num 5 -Name "TWO-LAYER WORLD & KEEPS" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 5 — TWO-LAYER WORLD & PERSONAL KEEPS only.

Read these existing files:
- src/utils/SpriteFactory.js (generateVillageTextures at ~line 831 for the EXACT pattern to follow when generating keep item textures)
- src/scenes/PreloadScene.js (SpriteFactory.generateAll is called here)
- src/scenes/GameScene.js (full create() flow)
- src/map/MapRenderer.js (_placeDetailSprites for how detail sprites are placed)

Do exactly:
1. Create src/world/WorldDefinition.js with WORLD_VERSION, WORLD_TITLE, PROTECTED_ZONES, KEEP_PLOTS, KEEP_ITEMS, WORLD_STRUCTURES (empty for now), TESTING_GROUNDS_FEATURES
2. In SpriteFactory: add static generateKeepItemTextures(scene) method following the SAME pattern as generateVillageTextures — use scene.add.graphics(), draw pixel art, g.generateTexture(key, w, h), g.destroy()
3. In SpriteFactory.generateAll(): add call to generateKeepItemTextures
4. Create src/player/PersonalKeep.js, src/player/KeepRenderer.js, src/player/PlacementMode.js as specified
5. In GameScene.create(): render PROTECTED_ZONES boundaries subtly, render any occupied keeps
6. Add B key for placement mode in HUDScene (same pattern as TAB/C keys) — only active when inside own keep

Verify: npm run build passes.
"@

Verify-Build -Num 5

# ============================================================================
# PHASE 6: COLLABORATION SUITE
# ============================================================================

Run-Phase -Num 6 -Name "COLLABORATION SUITE" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 6 — IN-GAME COLLABORATION SUITE only.

Read these existing files:
- src/utils/SpriteFactory.js (generateVillageTextures for drawing pattern)
- src/scenes/GameScene.js (_checkVillageProximity at line 222 for E-key interaction pattern)
- src/world/WorldDefinition.js (WORLD_STRUCTURES array you need to populate)

Do exactly:
1. In SpriteFactory: add generateStructureTextures(scene) — create textures for builders_hall (64x64), chronicle (48x48), notice_board (32x32), portal (48x48), monument (48x48). Follow the EXACT same drawing pattern as village textures.
2. In SpriteFactory.generateAll(): add call to generateStructureTextures
3. Populate WORLD_STRUCTURES in WorldDefinition.js with positions near map center (tiles ~60-68)
4. In GameScene.create(): iterate WORLD_STRUCTURES, place sprites + labels
5. In GameScene.update(): add proximity check for structures following _checkVillageProximity pattern. When E pressed near a structure, open its UI.
6. Create src/ui/BuildersHallUI.js — HTML overlay, submit/vote/view ideas, connects to /api/submissions
7. Create src/ui/ChronicleUI.js — HTML overlay, scrollable version timeline, connects to /api/changelog
8. Create src/ui/NoticeBoardUI.js — HTML overlay, quick glance summary

All overlays: pause game input when open, close with Escape, parchment styling.

Verify: npm run build passes.
"@

Verify-Build -Num 6

# ============================================================================
# PHASE 7: OVERNIGHT BUILD PIPELINE
# ============================================================================

Run-Phase -Num 7 -Name "BUILD PIPELINE" -Prompt @"
Continue building the medieval conquest game. Full spec:

$MasterPrompt

YOUR TASK: Implement PHASE 8 — OVERNIGHT BUILD PIPELINE only.

Do exactly:
1. Create server/build-queue.json with empty approved_submissions array
2. Create src/version.js: export const VERSION = '0.1.0'
3. In HUDScene.create(): import VERSION, add version label at bottom-right corner (GAME_WIDTH-10, GAME_HEIGHT-10, origin 1,1, depth 100, color '#8b6b4a', 10px Georgia)
4. Create src/ui/WhatsNewUI.js — on GameScene start, compare VERSION with /api/changelog/latest, show parchment popup if newer
5. Create CLAUDE_CODE_BUILD_INSTRUCTIONS.md in project root with all rules as specified
6. Create scripts/overnight-build.ps1 with the build automation logic

Verify: npm run build passes.
"@

Verify-Build -Num 7

# ============================================================================
# DONE
# ============================================================================

Log ""
Log "============================================" "Green"
Log "  BUILD COMPLETE!" "Green"
Log "============================================" "Green"
Log ""
Log "To run:" "Cyan"
Log "  Terminal 1: cd server && node src/server.js"
Log "  Terminal 2: npm run dev"
Log ""
Log "  Open the URL Vite shows in your browser."
Log "  Create a player and explore!"
Log ""
Log "Build log: $LogFile" "Cyan"
