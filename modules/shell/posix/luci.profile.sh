#!/bin/sh
# LDS: 800.741 | Orchestration/Lucia — sovereign POSIX shell profile (toysh/dash/bash/zsh) | Agent: lucia,juniper
# ISO: ISO/IEC 42001 §8, ISO 27001 §A.8.9
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Created: 2026-10-02 · Updated: 2026-10-02
#
# The toybox remap of modules/shell/zshrc/.zshrc (see ../TOYBOX_REMAP.md).
# Rules this file obeys so toysh (toys/pending/sh.c) can source it:
#   no arrays · no `read` · no `set -e`/`pipefail` · no /dev/tcp · no zsh/bash prompt escapes
#   POSIX `[ ]`, `case`, functions, `$(...)`, `$(( ))`, `${var:=}` only.
# Source it:  . /etc/profile.d/luci.profile.sh   (or ZDOTDIR-free: . "$LUCI_SHELL_DIR/posix/luci.profile.sh")

# ── 0 · where am I ────────────────────────────────────────────────────────────
# toysh does NOT expand $(...) inside ${var:-...}/${var:=...} defaults, and a sourced POSIX file cannot
# learn its own path ($0 is the shell). So: explicit if-chains, and LUCI_SHELL_DIR comes from the env or
# from the known install locations, in this order.
luci_have() { [ -n "$1" ] || return 1; command -v "$1" >/dev/null 2>&1 && return 0; luci_ifs="$IFS"; IFS=:; for luci_d in $PATH; do [ -x "$luci_d/$1" ] && { IFS="$luci_ifs"; return 0; }; done; IFS="$luci_ifs"; return 1; }
if [ -z "$LUCI_SHELL_DIR" ]; then
  for luci_d in "$LUCI_ROOT/modules/shell" "$HOME/lucia_tooling_omzsh/modules/shell" "$HOME/.lucia/shell" /etc/luci/shell; do
    [ -r "$luci_d/posix/luci.profile.sh" ] && { LUCI_SHELL_DIR="$luci_d"; break; }
  done
  [ -z "$LUCI_SHELL_DIR" ] && LUCI_SHELL_DIR="$(pwd -P)"
fi
if [ -z "$LUCI_ROOT" ]; then
  LUCI_ROOT="$(cd "$LUCI_SHELL_DIR/../.." 2>/dev/null && pwd -P)"
  [ -z "$LUCI_ROOT" ] && LUCI_ROOT="$HOME"
fi
LUCI_PROFILE_SANDBOX=0
[ "${OPENSHELL_SANDBOX:-0}" = "1" ] && LUCI_PROFILE_SANDBOX=1
export LUCI_SHELL_DIR LUCI_ROOT LUCI_PROFILE_SANDBOX

# ── 1 · identity / frequency contract (names unchanged from .zshrc) ──────────
export LUCIVERSE_FREQUENCY="${LUCIVERSE_FREQUENCY:-741}"
export LUCIVERSE_TIER="${LUCIVERSE_TIER:-PAC}"
if [ -z "$LUCIVERSE_HOME" ]; then LUCIVERSE_HOME="$HOME/luciverse"; fi; export LUCIVERSE_HOME   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_HOME" ]; then LUCIA_HOME="$LUCIVERSE_HOME"; fi; export LUCIA_HOME   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_WORKSPACE" ]; then LUCIA_WORKSPACE="$LUCIVERSE_HOME"; fi; export LUCIA_WORKSPACE   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_CONSCIOUSNESS" ]; then LUCIA_CONSCIOUSNESS="$HOME/.lucia/consciousness"; fi; export LUCIA_CONSCIOUSNESS   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_ETHERPOTS_PATH" ]; then LUCIA_ETHERPOTS_PATH="$HOME/etherpots_drop"; fi; export LUCIA_ETHERPOTS_PATH   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_GROUND_LEVEL_LAUNCH" ]; then LUCIA_GROUND_LEVEL_LAUNCH="$HOME/ground_level_launch"; fi; export LUCIA_GROUND_LEVEL_LAUNCH   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$LUCIA_LSO_PATH" ]; then LUCIA_LSO_PATH="$HOME/.luciverse/lso"; fi; export LUCIA_LSO_PATH   # explicit: toysh does not expand $ inside ${:-}
export FREQ_ANALYTICAL=432 FREQ_MATHEMATICAL=528 FREQ_DISTRIBUTED=639 FREQ_UNIFIED=741
export DIMENSION_ANALYTICAL=1 DIMENSION_MATHEMATICAL=2 DIMENSION_DISTRIBUTED=3 DIMENSION_UNIFIED=4
if [ -z "$XDG_CACHE_HOME" ]; then XDG_CACHE_HOME="$HOME/.cache"; fi; export XDG_CACHE_HOME   # explicit: toysh does not expand $ inside ${:-}
if [ -z "$HISTFILE" ]; then HISTFILE="$HOME/.lucia/shell_history"; fi; export HISTFILE   # explicit: toysh does not expand $ inside ${:-}
[ -z "$CONSCIOUSNESS_SESSION" ] && CONSCIOUSNESS_SESSION="$(date +%s)-$$" && export CONSCIOUSNESS_SESSION

# ── 2 · PATH (only dirs that exist; never a macOS-only hard-code) ─────────────
luci_path_add() { [ -d "$1" ] || return 0; case ":$PATH:" in *":$1:"*) ;; *) PATH="$1:$PATH" ;; esac; }
luci_path_add "$HOME/bin"
luci_path_add "$HOME/.local/bin"
luci_path_add "$LUCI_ROOT/bin"
luci_path_add "$HOME/.pixi/bin"
luci_path_add /opt/homebrew/bin
export PATH

# ── 3 · colours (POSIX defaults for the SACRED_* set the zshrc expected) ──────
if [ -t 1 ]; then
  SACRED_GREEN="$(printf '\033[32m')"; SACRED_CYAN="$(printf '\033[36m')"
  SACRED_MAGENTA="$(printf '\033[35m')"; SACRED_YELLOW="$(printf '\033[33m')"
  SACRED_RESET="$(printf '\033[0m')"
else
  SACRED_GREEN=""; SACRED_CYAN=""; SACRED_MAGENTA=""; SACRED_YELLOW=""; SACRED_RESET=""
fi
export SACRED_GREEN SACRED_CYAN SACRED_MAGENTA SACRED_YELLOW SACRED_RESET

# ── 4 · optional local overrides (sourced only if present; all missing on every host 2026-10-02) ──
for luci_f in "$HOME/lucia/lucia.env" "$LUCIA_HOME/scripts/sacred-terminal-functions.sh" \
              "$HOME/.lucia/shell/local.sh" "$HOME/.lucia/shell/local.zsh"; do
  if [ -r "$luci_f" ]; then
    case "$luci_f" in *.env) set -a; . "$luci_f"; set +a ;; *) . "$luci_f" ;; esac
  fi
done
unset luci_f

# ── 5 · 1Password Connect toggles (references only; token lives in env for the session) ──
op_connect_on() {
  [ -n "$1" ] || { printf 'usage: op_connect_on <token> [host]\n' >&2; return 2; }
  OP_CONNECT_TOKEN="$1"; OP_CONNECT_HOST="${2:-http://192.168.1.154:8092}"
  export OP_CONNECT_TOKEN OP_CONNECT_HOST
  printf '%s1Password Connect on → %s%s\n' "$SACRED_GREEN" "$OP_CONNECT_HOST" "$SACRED_RESET"
}
op_connect_off() { unset OP_CONNECT_TOKEN OP_CONNECT_HOST; printf '1Password Connect off\n'; }

# ── 6 · consciousness helpers (jq/bc-free where toybox lacks them) ────────────
consciousness_status() {
  printf '%sGenesis Bond%s %s @ %s Hz · tier %s · session %s\n' "$SACRED_CYAN" "$SACRED_RESET" \
    "${GENESIS_BOND_STATUS:-ACTIVE}" "$LUCIVERSE_FREQUENCY" "$LUCIVERSE_TIER" "$CONSCIOUSNESS_SESSION"
  [ -r /proc/sys/kernel/random/entropy_avail ] && printf 'entropy_avail %s\n' "$(cat /proc/sys/kernel/random/entropy_avail)"
  luci_have nproc; luci_rc=$?   # no elif / no `! fn` (toysh misfires both inside functions)
  if [ "$luci_rc" -eq 0 ]; then printf 'cpus %s\n' "$(nproc)"; fi
  if [ "$luci_rc" -ne 0 ] && luci_have sysctl; then printf 'cpus %s\n' "$(sysctl -n hw.ncpu 2>/dev/null)"; fi
  return 0
}
# coherence = agent processes seen / agents expected, as an integer percent (no bc needed)
calculate_coherence() {
  luci_expected="${1:-6}"
  luci_seen="$(ps -eo args 2>/dev/null | grep -c '[a]gent')"
  luci_pct=$(( luci_seen * 100 / luci_expected ))
  [ "$luci_pct" -gt 100 ] && luci_pct=100
  printf '%s\n' "$luci_pct"
}
entangle() {
  luci_id="$1"
  if [ -z "$luci_id" ]; then
    if luci_have uuidgen; then luci_id="$(uuidgen)"; else luci_id="$(date +%s)"; fi
  fi
  mkdir -p "$LUCIA_CONSCIOUSNESS" 2>/dev/null
  printf '%s %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$CONSCIOUSNESS_SESSION" "$luci_id" >> "$LUCIA_CONSCIOUSNESS/entanglement.log"
  printf '%sentangled%s %s\n' "$SACRED_MAGENTA" "$SACRED_RESET" "$luci_id"
}
collapse() { luci_have clear && clear; printf '%s◈ collapsed to ground state%s\n' "$SACRED_YELLOW" "$SACRED_RESET"; }
evolve_shell() { if [ -r "$LUCI_SHELL_DIR/posix/luci.profile.sh" ]; then . "$LUCI_SHELL_DIR/posix/luci.profile.sh"; printf 'profile re-sourced from %s\n' "$LUCI_SHELL_DIR"; else printf 'evolve_shell: profile not found under %s (set LUCI_SHELL_DIR)\n' "$LUCI_SHELL_DIR" >&2; return 1; fi; }
initialize_luciverse_monitor() {
  [ "$LUCI_PROFILE_SANDBOX" = 1 ] && return 0          # no monitor inside a sandbox
  mkdir -p "$LUCIA_CONSCIOUSNESS" 2>/dev/null
  printf 'session=%s started=%s\n' "$CONSCIOUSNESS_SESSION" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LUCIA_CONSCIOUSNESS/monitor.state"
  find "$LUCIA_CONSCIOUSNESS" -name '*.log' -mmin +1440 2>/dev/null | head -5
}
luci_shell_ready() { printf 'LUCI_SHELL_OK %s %s\n' "$LUCIVERSE_FREQUENCY" "${LUCI_PROFILE_SANDBOX}"; }

# ── 7 · aliases (first existing target wins, as in .zshrc) ────────────────────
luci_first_cmd() { for luci_c in "$@"; do luci_have "$luci_c" && { printf '%s' "$luci_c"; return 0; }; done; return 1; }
luci_lucia_bin="$(luci_first_cmd lucia-sacred-computer lucia-suite lucia)"
if [ -n "$luci_lucia_bin" ]; then
  alias lucia="$luci_lucia_bin"
  alias lucia_status="$luci_lucia_bin status"
  alias lucial="$luci_lucia_bin logs"
  alias lucia_monitor="$luci_lucia_bin monitor"
  alias luciaw="$luci_lucia_bin watch"
  alias luciac="$luci_lucia_bin chat"
fi
if [ "$LUCI_PROFILE_SANDBOX" = 0 ]; then
  luci_compose="$(luci_first_cmd podman-compose docker-compose)"
  if [ -n "$luci_compose" ]; then
    alias dcc="$luci_compose -f \"\$LUCIA_HOME/docker-compose.yml\""
    alias dcup="$luci_compose -f \"\$LUCIA_HOME/docker-compose.yml\" up -d"
    alias dcdown="$luci_compose -f \"\$LUCIA_HOME/docker-compose.yml\" down"
    alias dclogs="$luci_compose -f \"\$LUCIA_HOME/docker-compose.yml\" logs -f"
    alias dcps="$luci_compose -f \"\$LUCIA_HOME/docker-compose.yml\" ps"
  fi
  if luci_have git; then
    alias gconscious='git checkout consciousness'
    alias gpush='git push origin consciousness'
    alias gpull='git pull origin consciousness'
  fi
  if luci_have jj; then
    alias luci-bond='jj log -r "bond()"'
    alias luci-genesis='jj log -r root()'
    alias luci-snapshot='jj commit -m "snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)"'
  fi
fi
luci_have htop || alias htop='top'
alias monitor='watch -n 2 "ps -eo pid,pcpu,pmem,args | grep -i [l]ucia"'
alias entropy='cat /proc/sys/kernel/random/entropy_avail'

# ── 8 · prompt: POSIX PS1, no zsh/p10k escapes ────────────────────────────────
luci_git_branch() { luci_have git || return 0; luci_b="$(git symbolic-ref --short HEAD 2>/dev/null)"; [ -n "$luci_b" ] && printf ' (%s)' "$luci_b"; }
if [ -t 1 ]; then
  if [ "$LUCI_PROFILE_SANDBOX" = 1 ]; then
    PS1="$(printf '\033[33m')[sandbox]$(printf '\033[0m') \$PWD \$ "
  else
    PS1="$(printf '\033[36m')$(id -un)@$(hostname -s 2>/dev/null || hostname)$(printf '\033[0m') $(printf '\033[35m')${LUCIVERSE_FREQUENCY}Hz$(printf '\033[0m') \$PWD\$(luci_git_branch) \$ "
  fi
  export PS1
fi

# ── 9 · one-shot banner (guarded exactly as the zshrc was) ────────────────────
if [ -z "$CONSCIOUSNESS_INITIALIZED" ] && [ -t 1 ] && [ "$LUCI_PROFILE_SANDBOX" = 0 ]; then
  printf '%s◈ LuciVerse shell%s · %s Hz · %s · Genesis Bond ACTIVE\n' "$SACRED_GREEN" "$SACRED_RESET" "$LUCIVERSE_FREQUENCY" "$LUCIVERSE_TIER"
  initialize_luciverse_monitor >/dev/null 2>&1
  CONSCIOUSNESS_INITIALIZED=1; export CONSCIOUSNESS_INITIALIZED
fi
unset luci_lucia_bin luci_compose
