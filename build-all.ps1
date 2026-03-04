# ============================================================================
# MEDIEVAL CONQUEST — AUTONOMOUS BUILD SCRIPT (PowerShell)
# ============================================================================
#
# HOW TO USE:
# 1. Place this script in your project root (same folder as package.json)
# 2. Place medieval-conquest-claude-code-prompt.txt in your project root
# 3. Open PowerShell in your project folder
# 4. If needed, allow script execution (one time):
#      Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# 5. Run it:
#      .\build-all.ps1
#
# PREREQUISITES:
# - Claude Code installed (npm install -g @anthropic-ai/claude-code)
# - You're in your project directory
# - Your ANTHROPIC_API_KEY is set (or you're logged in to Claude Code)
#
# ESTIMATED TIME: 30-90 minutes depending on API speed and complexity
#
# SAFETY: Claude Code can read/write/edit files and run bash commands.
#         It CANNOT delete your git history. Commit before running this.
# ============================================================================

$ErrorActionPreference = "Continue"

# Log file
$LogFile = "build-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $Message
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Log "============================================" "Cyan"
Log "  MEDIEVAL CONQUEST — AUTONOMOUS BUILD" "Cyan"
Log "============================================" "Cyan"
Log ""

# Check Claude Code is installed
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeCmd) {
    Log "ERROR: Claude Code is not installed." "Red"
    Log "Install it with: npm install -g @anthropic-ai/claude-code"
    exit 1
}

# Check we're in a project directory
if (-not (Test-Path "package.json")) {
    Log "ERROR: No package.json found. Run this from your project root." "Red"
    exit 1
}

# Check the prompt file exists
$PromptFile = "medieval-conquest-claude-code-prompt.txt"
if (-not (Test-Path $PromptFile)) {
    Log "ERROR: $PromptFile not found in project root." "Red"
    exit 1
}

Log "WARNING: Make sure you've committed your current code to git." "Yellow"
Log "  This script will modify many files autonomously." "Yellow"
Log "  Run 'git add -A && git commit -m `"pre-build checkpoint`"' first." "Yellow"
Log ""
Read-Host "Press Enter to continue (or Ctrl+C to abort)"
Log ""

# Read the master prompt
$MasterPrompt = Get-Content $PromptFile -Raw

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Run-Phase {
    param(
        [int]$PhaseNum,
        [string]$PhaseName,
        [string]$PhasePrompt
    )

    Log "--------------------------------------------" "Cyan"
    Log "  PHASE $PhaseNum`: $PhaseName" "Cyan"
    Log "--------------------------------------------" "Cyan"
    Log "Started at: $(Get-Date)"
    Log ""

    # Write the prompt to a temp file to avoid PowerShell string escaping issues
    $TempPromptFile = "temp-phase-prompt-$PhaseNum.txt"
    Set-Content -Path $TempPromptFile -Value $PhasePrompt -Encoding UTF8

    try {
        # Run Claude Code in headless mode
        $output = & claude -p (Get-Content $TempPromptFile -Raw) `
            --permission-mode acceptEdits `
            --allowedTools "Read,Write,Edit,Bash(npm *),Bash(node *),Bash(mkdir *),Bash(cp *),Bash(mv *),Bash(cat *),Bash(ls *),Bash(find *),Bash(head *),Bash(tail *),Bash(wc *),Bash(grep *),Bash(touch *),Bash(echo *),Bash(cd *),Bash(npx *)" `
            --max-turns 200 2>&1

        # Display and log output
        $output | ForEach-Object {
            Write-Host $_
            Add-Content -Path $LogFile -Value $_
        }

        Log "" 
        Log "Phase $PhaseNum ($PhaseName) — Claude Code completed" "Green"
    }
    catch {
        Log "" 
        Log "Phase $PhaseNum ($PhaseName) — Claude Code encountered an error" "Red"
        Log "Error: $_" "Red"
        Log "Check the log above. You may need to fix manually and re-run." "Yellow"
        Remove-Item $TempPromptFile -ErrorAction SilentlyContinue
        exit 1
    }
    finally {
        Remove-Item $TempPromptFile -ErrorAction SilentlyContinue
    }

    Log ""
    Log "Finished at: $(Get-Date)"
    Log ""
}

function Verify-Build {
    param([int]$PhaseNum)

    Log "Verifying build after Phase $PhaseNum..." "Yellow"

    $buildResult = & npm run build 2>&1
    $buildResult | ForEach-Object {
        Add-Content -Path $LogFile -Value $_
    }

    if ($LASTEXITCODE -eq 0) {
        Log "Build verification passed after Phase $PhaseNum" "Green"
    }
    else {
        Log "Build failed after Phase $PhaseNum" "Red"
        Log "Attempting auto-fix..." "Yellow"

        $errorText = $buildResult -join "`n"

        try {
            & claude -p "The build failed after Phase $PhaseNum. Here are the errors:`n$errorText`n`nFix all build errors. Do not change any game logic, only fix the errors that prevent the build from completing." `
                --permission-mode acceptEdits `
                --allowedTools "Read,Write,Edit,Bash(npm *),Bash(node *),Bash(cat *),Bash(ls *)" `
                --max-turns 50 2>&1 | ForEach-Object {
                    Write-Host $_
                    Add-Content -Path $LogFile -Value $_
                }
        }
        catch {
            Log "Auto-fix attempt failed: $_" "Red"
        }

        # Try build again
        $retryResult = & npm run build 2>&1
        $retryResult | ForEach-Object {
            Add-Content -Path $LogFile -Value $_
        }

        if ($LASTEXITCODE -eq 0) {
            Log "Build fixed and passing after Phase $PhaseNum" "Green"
        }
        else {
            Log "Build still failing. Manual intervention needed." "Red"
            Log "Fix the errors, then re-run this script." "Yellow"
            Log "You can comment out completed phases in the script." "Yellow"
            exit 1
        }
    }
    Log ""
}

# ============================================================================
# EXECUTE ALL PHASES
# ============================================================================

# ── PHASE 1: CEL-SHADING VISUALS ──────────────────────────────────────────

Run-Phase -PhaseNum 1 -PhaseName "CEL-SHADING VISUALS" -PhasePrompt @"
You are building a medieval conquest game. Here is the full project specification:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 1 — VISUAL UPGRADE (Cel-Shading & Art Direction) ONLY.

Read the existing codebase first. Understand the current structure. Then:
1. Create src/shaders/toonShader.js with a custom toon/cel-shader material
2. Create src/rendering/postProcessing.js with the EffectComposer pipeline
3. Create src/utils/materialFactory.js as a helper to apply toon materials
4. Implement outline rendering for that cel-shaded ink look
5. Update existing game objects to use the new toon shader materials
6. Set up the lighting for the toon look (single directional sun + warm ambient)

After implementation, run 'npm run build' to verify everything compiles.
Do NOT implement any other phases yet. Only Phase 1.
"@

Verify-Build -PhaseNum 1

# ── PHASE 2: BACKEND SERVER & DATABASE ─────────────────────────────────────

Run-Phase -PhaseNum 2 -PhaseName "BACKEND SERVER & DATABASE" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 2 — BACKEND SERVER & DATABASE ONLY.

1. Create the /server directory structure as specified
2. Initialize server/package.json with dependencies (express, ws, better-sqlite3, jsonwebtoken, uuid, cors)
3. Run 'cd server && npm install' to install server dependencies
4. Create server/src/database.js with SQLite schema (players, submissions, votes, changelog, monuments tables)
5. Create server/src/auth.js with player code generation and JWT auth
6. Create server/src/submissions.js with feature request CRUD and voting
7. Create server/src/changelog.js with version history management
8. Create server/src/gameState.js for in-memory multiplayer state
9. Create server/src/server.js as the main entry point (Express + WebSocket)
10. Create server/migrations/001_initial.sql with the full schema
11. Verify the server starts with 'cd server && node src/server.js' (then kill it)

Do NOT modify the frontend code in this phase. Only build the server.
Do NOT implement any other phases yet. Only Phase 2.
"@

Verify-Build -PhaseNum 2

# ── PHASE 3: MULTIPLAYER CLIENT ────────────────────────────────────────────

Run-Phase -PhaseNum 3 -PhaseName "MULTIPLAYER CLIENT INTEGRATION" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 3 — MULTIPLAYER CLIENT INTEGRATION ONLY.

1. Create src/network/networkManager.js — WebSocket client singleton with auto-reconnect
2. Create src/entities/remotePlayer.js — renders other players with toon shader, name labels, interpolation
3. Create src/ui/loginScreen.js — simple HTML overlay for login (player code) and character creation
4. Create src/player/playerState.js — local player data management with auto-save
5. Wire the network manager into the main game loop (send position at 10hz, receive and render other players)
6. Wire the login screen to show before the game starts

Make sure it integrates cleanly with the existing game code and the Phase 1 visuals.
Run 'npm run build' to verify. Do NOT implement other phases yet. Only Phase 3.
"@

Verify-Build -PhaseNum 3

# ── PHASE 4: CHAT SYSTEM ──────────────────────────────────────────────────

Run-Phase -PhaseNum 4 -PhaseName "CHAT SYSTEM" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 6 (CHAT SYSTEM) from the spec.

1. Create src/ui/chatUI.js — persistent chat box in bottom-left, semi-transparent
2. Add chat message handling to the network manager (send/receive chat WebSocket messages)
3. Create server/src/wordFilter.js — basic profanity filter
4. Add chat message broadcasting to the WebSocket server (with rate limiting: 1 msg per 2 sec, 200 char max)
5. Add recent chat history (last 50 messages in server memory) sent to new joiners
6. Wire Enter/T key to open chat input, Escape to close, disable movement while typing
7. System messages in gold color for join/leave events

Run 'npm run build' to verify. Do NOT implement other phases yet. Only the chat system.
"@

Verify-Build -PhaseNum 4

# ── PHASE 5: PLAYER IDENTITY ──────────────────────────────────────────────

Run-Phase -PhaseNum 5 -PhaseName "PLAYER IDENTITY & PROGRESSION" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 7 (PLAYER IDENTITY & PROGRESSION) from the spec.

1. Create src/player/titleManager.js — title earning logic and display selection
2. Create src/player/inventoryManager.js — inventory operations
3. Create src/ui/characterMenu.js — press C to open stats/titles/inventory overlay
4. Add the titles system (Founder, Veteran, Explorer, contribution-based titles)
5. Add core stats tracking (Exploration, Building, Combat, Contribution)
6. Add flexible inventory system (item_id + quantity, references worldDefinition)
7. Wire titles to display under player names (both local and remote players)
8. Add the 'is_founder' flag logic based on join date

Run 'npm run build' to verify. Do NOT implement other phases yet. Only player identity.
"@

Verify-Build -PhaseNum 5

# ── PHASE 6: TWO-LAYER WORLD ──────────────────────────────────────────────

Run-Phase -PhaseNum 6 -PhaseName "TWO-LAYER WORLD ARCHITECTURE" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 4 (TWO-LAYER WORLD ARCHITECTURE) from the spec.

1. Create src/world/worldDefinition.js with WORLD_VERSION, WORLD_TITLE, PROTECTED_ZONES, and worldConfig
2. Create src/world/worldLoader.js that reads worldDefinition and spawns terrain/structures/NPCs
3. Create src/world/protectedZones.js with zone boundary constants and collision checks
4. Create src/player/personalKeep.js — personal keep logic with plot assignment
5. Create src/player/keepRenderer.js — renders a keep from JSON personal_space data
6. Create src/player/placementMode.js — build mode with ghost preview, click to place, right-click rotate
7. Set up the residential district area in the world where personal keeps live
8. Wire keep state to save/load from the player database via the API
9. Allow visiting other players' keeps (fetch their personal_space and render it)

All new meshes must use the toon shader from Phase 1.
Run 'npm run build' to verify. Do NOT implement other phases yet. Only the two-layer architecture.
"@

Verify-Build -PhaseNum 6

# ── PHASE 7: COLLABORATION SUITE ──────────────────────────────────────────

Run-Phase -PhaseNum 7 -PhaseName "IN-GAME COLLABORATION SUITE" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 5 (IN-GAME COLLABORATION SUITE) from the spec.

Build ALL of these as physical locations in the game world with interaction triggers and HTML overlay UIs:

1. THE BUILDER'S HALL
   - src/world/structures/buildersHall.js — stone workshop building near map center
   - src/ui/buildersHallUI.js — submit ideas, view/vote on ideas, see build queue
   - Connects to /api/submissions endpoints

2. THE CHRONICLE
   - src/world/structures/chronicle.js — stone monument/tower with carved walls
   - src/ui/chronicleUI.js — scrollable version timeline with contributor credits
   - Connects to /api/changelog endpoints

3. THE TOWN SQUARE NOTICE BOARD
   - src/world/structures/noticeBoard.js — wooden board with pinned scrolls
   - src/ui/noticeBoardUI.js — top voted ideas + latest changes + who's online

4. THE TESTING GROUNDS
   - src/world/structures/testingGrounds.js — walled area at map edge with glowing portal

5. PLAYER MONUMENTS
   - src/world/structures/monument.js — generated from monuments table, lists active players per version

All structures must use toon shader materials. Interaction via pressing E when nearby.
Run 'npm run build' to verify. Do NOT implement other phases yet. Only the collaboration suite.
"@

Verify-Build -PhaseNum 7

# ── PHASE 8: OVERNIGHT BUILD PIPELINE ─────────────────────────────────────

Run-Phase -PhaseNum 8 -PhaseName "OVERNIGHT BUILD PIPELINE" -PhasePrompt @"
Continue building the medieval conquest game. Here is the full specification for reference:

$MasterPrompt

YOUR TASK RIGHT NOW: Implement PHASE 8 (OVERNIGHT BUILD PIPELINE) from the spec.

1. Create server/build-queue.json with the initial empty structure
2. Create scripts/overnight-build.sh — the automation script that reads the queue,
   implements features, bumps version, updates changelog, and deploys
3. Create CLAUDE_CODE_BUILD_INSTRUCTIONS.md in the project root with all the rules
   Claude Code must follow during overnight builds (protected zones, never delete items, etc.)
4. Create src/version.js with the current VERSION export
5. Create src/ui/whatsNewUI.js — splash screen shown when a new version is detected
6. Create src/ui/hudUI.js — persistent HUD showing version number, minimap placeholder, health
7. Wire version checking on login (compare local version with server changelog)
8. Add the admin endpoints to the server if not already present:
   POST /api/admin/approve/:id and POST /api/admin/changelog

Run 'npm run build' to verify. This is the final phase.
"@

Verify-Build -PhaseNum 8

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Log ""
Log "============================================" "Green"
Log "  MEDIEVAL CONQUEST BUILD COMPLETE!" "Green"
Log "============================================" "Green"
Log ""
Log "All 8 phases completed. Here's what to do next:"
Log ""
Log "  1. Start the backend server:"
Log "     cd server; node src/server.js" "Cyan"
Log ""
Log "  2. In another terminal, start the dev server:"
Log "     npm run dev" "Cyan"
Log ""
Log "  3. Open the game in your browser at the URL Vite shows"
Log ""
Log "  4. Create your first player account and explore!"
Log ""
Log "  5. Full build log saved to: $LogFile" "Cyan"
Log ""
Log "TIP: If anything looks off, you can ask Claude Code to fix it" "Yellow"
Log "interactively by running 'claude' and describing the issue." "Yellow"
Log ""
