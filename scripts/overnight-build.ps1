# ============================================================================
# MEDIEVAL CONQUEST — OVERNIGHT BUILD SCRIPT
# ============================================================================
# Reads approved submissions from server/build-queue.json and implements them
# using Claude Code in headless mode.
# ============================================================================

$ErrorActionPreference = "Stop"
$LogFile = "overnight-build-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $Message
}

# Pre-flight checks
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Log "ERROR: Claude Code not installed." "Red"
    exit 1
}
if (-not (Test-Path "package.json")) {
    Log "ERROR: Run this from the project root." "Red"
    exit 1
}

# Read build queue
$QueueFile = "server/build-queue.json"
if (-not (Test-Path $QueueFile)) {
    Log "No build queue found. Nothing to do." "Yellow"
    exit 0
}

$Queue = Get-Content $QueueFile -Raw | ConvertFrom-Json
$Submissions = $Queue.approved_submissions

if ($Submissions.Count -eq 0) {
    Log "No approved submissions. Nothing to build." "Yellow"
    exit 0
}

Log "============================================" "Cyan"
Log "  OVERNIGHT BUILD — $($Submissions.Count) submissions" "Cyan"
Log "============================================" "Cyan"

# Git checkpoint
Log "Creating pre-build checkpoint..." "Yellow"
git add -A
git commit -m "pre-overnight-build checkpoint" 2>$null

# Process top 2-3 submissions
$MaxBuilds = [Math]::Min($Submissions.Count, 3)
$Implemented = @()

for ($i = 0; $i -lt $MaxBuilds; $i++) {
    $Sub = $Submissions[$i]
    Log ""
    Log "Building feature $($i+1)/$MaxBuilds`: $($Sub.content)" "Cyan"

    $prompt = @"
You are implementing a player-requested feature for Medieval Conquest.

READ CLAUDE_CODE_BUILD_INSTRUCTIONS.md FIRST for all rules.
READ src/world/WorldDefinition.js for current world state.

FEATURE REQUEST: $($Sub.content)
CATEGORY: $($Sub.category)
REQUESTED BY: $($Sub.player_name)

Implement this feature following all build instructions. Keep it small and focused.
After implementation, increment WORLD_VERSION in WorldDefinition.js and VERSION in src/version.js.
Run npm run build to verify.
"@

    $tmp = "temp-overnight-$i.txt"
    Set-Content -Path $tmp -Value $prompt -Encoding UTF8

    try {
        & claude -p (Get-Content $tmp -Raw) `
            --permission-mode acceptEdits `
            --allowedTools "Read,Write,Edit,Bash(npm *),Bash(node *),Bash(cat *),Bash(ls *)" `
            --max-turns 50 2>&1 | ForEach-Object {
                Write-Host $_
                Add-Content -Path $LogFile -Value $_
            }
        Log "Feature $($i+1) complete" "Green"
        $Implemented += $Sub
    }
    catch {
        Log "Feature $($i+1) ERROR: $_" "Red"
    }
    finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }

    # Verify build
    $result = & npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log "Build failed after feature $($i+1). Stopping." "Red"
        break
    }
    Log "Build verified after feature $($i+1)" "Green"
}

# Update build queue — remove implemented submissions
$Remaining = $Submissions | Where-Object { $_ -notin $Implemented }
$Queue.approved_submissions = @($Remaining)
$Queue | ConvertTo-Json -Depth 10 | Set-Content $QueueFile

# Read new version
$VersionContent = Get-Content "src/version.js" -Raw
$VersionMatch = [regex]::Match($VersionContent, "'([^']+)'")
$NewVersion = if ($VersionMatch.Success) { $VersionMatch.Groups[1].Value } else { "unknown" }

# Git commit
git add -A
git commit -m "overnight build v$NewVersion"

Log ""
Log "============================================" "Green"
Log "  OVERNIGHT BUILD COMPLETE — v$NewVersion" "Green"
Log "  $($Implemented.Count) features implemented" "Green"
Log "============================================" "Green"
