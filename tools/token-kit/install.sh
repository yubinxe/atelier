#!/usr/bin/env bash
# token-kit installer for macOS / Linux / WSL. Re-running is safe (marker blocks replaced, backups made).
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"; STAMP="$(date +%Y%m%d-%H%M%S)"
backup() { [ -f "$1" ] && cp "$1" "$1.bak-$STAMP" || true; }
upsert() { # $1 target file, $2 block file
  local t="$1" b="$2"; mkdir -p "$(dirname "$t")"; touch "$t"; backup "$t"
  python3 - "$t" "$b" <<'PY'
import re, sys
t, b = sys.argv[1], sys.argv[2]
old = open(t, encoding="utf-8").read()
base = re.sub(r"\n?<!-- token-kit:start -->.*?<!-- token-kit:end -->\n?", "\n", old, flags=re.S).rstrip()
open(t, "w", encoding="utf-8").write((base + "\n\n" if base else "") + open(b, encoding="utf-8").read().strip() + "\n")
PY
}
command -v python3 >/dev/null || { echo "[error] python3 needed"; exit 1; }

# 1) Claude Code
CL="$HOME/.claude"; mkdir -p "$CL/output-styles"
cp "$KIT/claude-code/output-styles/caveman.md" "$CL/output-styles/caveman.md"; echo "[ok] output style"
backup "$CL/settings.json"
python3 - "$CL/settings.json" <<'PY' && echo "[ok] settings.json outputStyle = Caveman" || echo '[skip] settings.json unreadable; add "outputStyle": "Caveman" by hand'
import json, os, sys
p = sys.argv[1]; s = {}
if os.path.exists(p) and open(p, encoding="utf-8").read().strip(): s = json.load(open(p, encoding="utf-8"))
s["outputStyle"] = "Caveman"
json.dump(s, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
PY
upsert "$CL/CLAUDE.md" "$KIT/claude-code/CLAUDE.global.md"; echo "[ok] global CLAUDE.md block"

# 2) Hermes Agent
HH="${HERMES_HOME:-$HOME/.hermes}"
if [ -d "$HH" ]; then
  upsert "$HH/SOUL.md" "$KIT/hermes/SOUL.section.md"; echo "[ok] Hermes SOUL.md block"
  CFG="$HH/config.yaml"; touch "$CFG"
  if grep -qE '^\s*caveman:' "$CFG"; then echo "[ok] personality 'caveman' already present"
  elif grep -qE '^personalities:' "$CFG"; then echo "[manual] config.yaml has 'personalities:' — copy the caveman entry from hermes/config.patch.yaml under it"
  else backup "$CFG"; { printf '\n# token-kit\n'; grep -vE '^\s*#' "$KIT/hermes/config.patch.yaml" | sed '/^\s*$/d'; } >> "$CFG"; echo "[ok] personality 'caveman' added"; fi
  echo "[next] In Hermes run: /personality caveman"
else echo "[skip] Hermes home not found ($HH)"; fi

echo; echo "[next] claude.ai: Settings > Profile > personal preferences -> paste claude-ai/preferences.md"
echo "[next] claude.ai: put claude-ai/design-standard.md into a Project's knowledge (design work only)"
echo "[next] Restart Claude Code, then check: /output-style"
