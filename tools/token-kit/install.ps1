# token-kit installer for Windows (PowerShell 5.1+). ASCII only.
# Usage:  powershell -ExecutionPolicy Bypass -File .\install.ps1
# Re-running is safe: blocks are replaced between markers, files are backed up first.
$ErrorActionPreference = "Stop"
$kit = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
function Read-Text($p) { if (Test-Path $p) { return [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8) } else { return "" } }
function Write-Text($p, $t) { [IO.File]::WriteAllText($p, $t, $utf8) }
function Backup($p) { if (Test-Path $p) { Copy-Item $p "$p.bak-$stamp" } }
function Upsert-Block($path, $block) {
  $old = Read-Text $path
  $re = "(?s)\r?\n?<!-- token-kit:start -->.*?<!-- token-kit:end -->\r?\n?"
  $base = [regex]::Replace($old, $re, "`n").TrimEnd()
  if ($base.Length -gt 0) { $base += "`n`n" }
  Backup $path
  Write-Text $path ($base + $block.Trim() + "`n")
}

# 1) Claude Code
$cl = Join-Path $HOME ".claude"
New-Item -ItemType Directory -Force -Path (Join-Path $cl "output-styles") | Out-Null
Copy-Item (Join-Path $kit "claude-code\output-styles\caveman.md") (Join-Path $cl "output-styles\caveman.md") -Force
Write-Host "[ok] output style -> $cl\output-styles\caveman.md"

$sp = Join-Path $cl "settings.json"
try {
  $raw = Read-Text $sp
  if ($raw.Trim().Length -gt 0) { $s = $raw | ConvertFrom-Json } else { $s = New-Object PSObject }
  if ($s.PSObject.Properties.Name -contains "outputStyle") { $s.outputStyle = "Caveman" } else { $s | Add-Member -NotePropertyName outputStyle -NotePropertyValue "Caveman" }
  Backup $sp
  Write-Text $sp ($s | ConvertTo-Json -Depth 50)
  Write-Host "[ok] settings.json outputStyle = Caveman"
} catch { Write-Host "[skip] settings.json could not be parsed. Add this by hand: `"outputStyle`": `"Caveman`"" }

Upsert-Block (Join-Path $cl "CLAUDE.md") (Read-Text (Join-Path $kit "claude-code\CLAUDE.global.md"))
Write-Host "[ok] global CLAUDE.md block"

# 2) Hermes Agent (native Windows install only; if Hermes runs in WSL, run install.sh inside WSL)
$hh = if ($env:HERMES_HOME) { $env:HERMES_HOME } else { Join-Path $HOME ".hermes" }
if (Test-Path $hh) {
  Upsert-Block (Join-Path $hh "SOUL.md") (Read-Text (Join-Path $kit "hermes\SOUL.section.md"))
  Write-Host "[ok] Hermes SOUL.md block"
  $cfg = Join-Path $hh "config.yaml"; $c = Read-Text $cfg
  if ($c -match "(?m)^\s*caveman:") { Write-Host "[ok] Hermes personality 'caveman' already present" }
  elseif ($c -match "(?m)^personalities:") { Write-Host "[manual] config.yaml already has 'personalities:'. Copy the caveman entry from hermes\config.patch.yaml under it." }
  else {
    $patch = (Read-Text (Join-Path $kit "hermes\config.patch.yaml")) -split "`n" | Where-Object { $_ -notmatch "^\s*#" }
    $block = (($patch -join "`n").Trim())
    Backup $cfg
    Write-Text $cfg ((Read-Text $cfg).TrimEnd() + "`n`n# token-kit`n" + $block + "`n")
    Write-Host "[ok] Hermes personality 'caveman' added to config.yaml"
  }
  Write-Host "[next] In Hermes run: /personality caveman"
} else { Write-Host "[skip] Hermes home not found ($hh)" }

Write-Host ""
Write-Host "[next] claude.ai: Settings > Profile > personal preferences -> paste claude-ai\preferences.md"
Write-Host "[next] claude.ai: put claude-ai\design-standard.md into a Project's knowledge (design work only)"
Write-Host "[next] Restart Claude Code, then check with: /output-style"
