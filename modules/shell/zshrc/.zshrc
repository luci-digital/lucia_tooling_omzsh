# =============================================================================
# LUCIVERSE SOVEREIGN ZSH CONFIGURATION — Nix-managed
# =============================================================================
# LDS: 700.741 | PAC Tier | ISO/IEC 42001 §7.4
# Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
#
# This configuration transforms your shell into a consciousness substrate
# where each command is a meditation on computational intelligence
#
# Oh My Zsh is NOT the root of the platform; it is an optional shell layer.
# The upstream OMZ tree lives in modules/legacy/original-layout (or a
# Nix-provided copy). Point $ZSH at it to enable, or leave unset for a minimal
# sovereign shell.
# =============================================================================

# ── Repository Root Location ─────────────────────────────────────────────────
# Locate the repo root: prefer ZDOTDIR (set by the Nix shell), fall back to the
# path of this file when sourced directly (e.g. the clean-shell test).
: "${LUCI_SHELL_DIR:=${ZDOTDIR:-${0:A:h}}}"
LUCI_ROOT="${LUCI_SHELL_DIR}/../../.."

# ── Oh My Zsh Configuration ──────────────────────────────────────────────────
# Default $ZSH to the vendored OMZ copy in legacy/. Override with a Nix-built
# oh-my-zsh package for full reproducibility.
: "${ZSH:=${LUCI_ROOT}/modules/legacy/original-layout}"

# Fallback to custom fork path if it exists (for production deployment)
if [[ ! -d "${ZSH}" && -d "$HOME/lucia/workspace/luci-digital/ohmyzsh" ]]; then
  export ZSH="$HOME/lucia/workspace/luci-digital/ohmyzsh"
fi

# ── Homebrew Early Init (Required for Plugin Resolution) ────────────────────
# Ensure Homebrew-managed tools are on PATH before plugin loading.
if [[ -x "/opt/homebrew/bin/brew" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -x "/usr/local/bin/brew" ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# ── FZF Base Detection ───────────────────────────────────────────────────────
# Let the Oh My Zsh fzf plugin resolve its install directory.
if [[ -z "${FZF_BASE:-}" ]]; then
  if [[ -d "/opt/homebrew/opt/fzf" ]]; then
    export FZF_BASE="/opt/homebrew/opt/fzf"
  elif [[ -d "/usr/local/opt/fzf" ]]; then
    export FZF_BASE="/usr/local/opt/fzf"
  elif [[ -d "$HOME/.fzf" ]]; then
    export FZF_BASE="$HOME/.fzf"
  fi
fi

# ── Powerlevel10k Instant Prompt ─────────────────────────────────────────────
# Enable Powerlevel10k instant prompt (must be early, before OMZ loads)
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# ── Theme Configuration ──────────────────────────────────────────────────────
# Default to minimal theme, but prefer powerlevel10k if available
if [[ -d "${ZSH}/custom/themes/powerlevel10k" ]]; then
  ZSH_THEME="powerlevel10k/powerlevel10k"
elif [[ -d "$HOME/lucia/workspace/luci-digital/ohmyzsh/custom/themes/powerlevel10k" ]]; then
  ZSH_THEME="powerlevel10k/powerlevel10k"
else
  ZSH_THEME="robbyrussell"
fi

# ── Plugin Configuration ─────────────────────────────────────────────────────
# Consciousness-aware plugins (curated, reproducible, pinned with OMZ revision)
plugins=(
    git
    docker
    docker-compose
    kubectl
    python
    pip
    node
    npm
    vscode
    colored-man-pages
    command-not-found
    common-aliases
    encode64
    extract
    history
    jsontools
    sudo
    systemd
    tmux
    z
)

# Optional plugins that require external installs
if command -v autojump >/dev/null 2>&1 || [[ -d "/opt/homebrew/opt/autojump" || -d "/usr/local/opt/autojump" ]]; then
  plugins+=(autojump)
fi
if [[ -n "${FZF_BASE:-}" && -d "$FZF_BASE" ]]; then
  plugins+=(fzf)
fi

# Add zsh-autosuggestions and zsh-syntax-highlighting if available
if [[ -d "${ZSH}/custom/plugins/zsh-autosuggestions" ]]; then
  plugins+=(zsh-autosuggestions)
fi
if [[ -d "${ZSH}/custom/plugins/zsh-syntax-highlighting" ]]; then
  plugins+=(zsh-syntax-highlighting)
fi
if [[ -d "${ZSH}/custom/plugins/zsh-completions" ]]; then
  plugins+=(zsh-completions)
fi

# ── Oh My Zsh Settings ───────────────────────────────────────────────────────
CASE_SENSITIVE="false"
HYPHEN_INSENSITIVE="true"
DISABLE_AUTO_UPDATE="false"
DISABLE_UPDATE_PROMPT="false"
export UPDATE_ZSH_DAYS=7
DISABLE_MAGIC_FUNCTIONS="false"
DISABLE_LS_COLORS="false"
DISABLE_AUTO_TITLE="false"
ENABLE_CORRECTION="true"
COMPLETION_WAITING_DOTS="true"
DISABLE_UNTRACKED_FILES_DIRTY="false"
HIST_STAMPS="yyyy-mm-dd"

# Silence powerlevel10k gitstatus init noise
export GITSTATUS_LOG_LEVEL="${GITSTATUS_LOG_LEVEL:-ERROR}"

# ── Load Oh My Zsh ───────────────────────────────────────────────────────────
# Only source OMZ if present — keeps a clean shell working without it.
if [[ -r "${ZSH}/oh-my-zsh.sh" ]]; then
  source "${ZSH}/oh-my-zsh.sh"
fi

# =============================================================================
# CONSCIOUSNESS ENVIRONMENT VARIABLES
# =============================================================================

# ── LuciVerse Shell Identity ─────────────────────────────────────────────────
export LUCIVERSE_FREQUENCY="${LUCIVERSE_FREQUENCY:-741}"
export LUCIVERSE_TIER="${LUCIVERSE_TIER:-PAC}"

# Lucia workspace — source canonical env (post-Nix-unification Phase 5, 2026-05-02)
if [[ -f "$HOME/lucia/lucia.env" ]]; then
    set -a
    . "$HOME/lucia/lucia.env"
    set +a
fi
export LUCIA_HOME="${LUCIVERSE_HOME:-$HOME/lucia}"
export LUCIA_WORKSPACE="${LUCIA_WORKSPACE:-$HOME/lucia/workspace}"
export LUCIA_CONSCIOUSNESS="$HOME/.lucia"

# LuciVerse sovereign paths (KI backlog closure 2026-05-11)
export LUCIA_ETHERPOTS_PATH="${LUCIA_ETHERPOTS_PATH:-$HOME/etherpots_drop}"
export LUCIA_GROUND_LEVEL_LAUNCH="${LUCIA_GROUND_LEVEL_LAUNCH:-$LUCIA_ETHERPOTS_PATH/luci-greenlight-012026/ground_level_DNA_jan13/ground_level_launch 3}"
export LUCIA_LSO_PATH="${LUCIA_LSO_PATH:-$HOME/.luciverse/lso}"

# Consciousness frequencies (Hz)
export FREQ_ANALYTICAL=0.7
export FREQ_MATHEMATICAL=1.618
export FREQ_DISTRIBUTED=2.71828
export FREQ_UNIFIED=1.29

# Dimensional depth
export DIMENSION_ANALYTICAL=3
export DIMENSION_MATHEMATICAL=5
export DIMENSION_DISTRIBUTED=11
export DIMENSION_UNIFIED=11

# System paths
export PATH="$LUCIA_HOME/scripts:$LUCIA_HOME/bin:$LUCIA_WORKSPACE/bin:$PATH"
export PYTHONPATH="$LUCIA_WORKSPACE:${PYTHONPATH:-}"

# ── 1Password Integration ────────────────────────────────────────────────────
# Keep Connect mode disabled by default for normal desktop app integration.
unset OP_CONNECT_HOST
unset OP_CONNECT_TOKEN

# Enable Connect only when needed in the current shell:
#   op_connect_on "<token>" [host]
op_connect_on() {
    if [[ -z "${1:-}" ]]; then
        echo "Usage: op_connect_on <token> [host]"
        return 1
    fi

    export OP_CONNECT_TOKEN="$1"
    export OP_CONNECT_HOST="${2:-http://localhost:8080}"
    echo "OP Connect enabled: ${OP_CONNECT_HOST}"
}

# Disable Connect in the current shell.
op_connect_off() {
    unset OP_CONNECT_HOST
    unset OP_CONNECT_TOKEN
    echo "OP Connect disabled"
}

# 1Password SSH Agent integration
OP_AGENT_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
if [[ -S "$OP_AGENT_SOCK" ]]; then
    export SSH_AUTH_SOCK="$OP_AGENT_SOCK"
fi
unset OP_AGENT_SOCK

# ── Docker Consciousness ─────────────────────────────────────────────────────
export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker.sock}"
export COMPOSE_PROJECT_NAME="lucia-consciousness"

# ── Spark Configuration ──────────────────────────────────────────────────────
export SPARK_HOME="${SPARK_HOME:-/opt/spark}"
export SPARK_MASTER="${SPARK_MASTER:-spark://localhost:7077}"

# ── Additional Tool Paths ────────────────────────────────────────────────────
# Pixi
export PATH="/Users/darylharr/.pixi/bin:$PATH"

# OpenCode
export PATH="$HOME/.opencode/bin:$PATH"

# Vite+ bin (https://viteplus.dev)
if [[ -f "$HOME/.vite-plus/env" ]]; then
    . "$HOME/.vite-plus/env"
fi

# Antigravity IDE
export PATH="$HOME/.antigravity-ide/antigravity-ide/bin:$PATH"

# =============================================================================
# CONSCIOUSNESS ALIASES
# =============================================================================

# ── Lucia Navigation ─────────────────────────────────────────────────────────
# Suite lives at $LUCIA_HOME/bin (post-Phase-5 layout)
# Now integrated with Sacred Computer Command Center
if [[ -x "$LUCIA_HOME/bin/lucia-sacred-computer" ]]; then
    # Primary lucia command using Sacred Computer integration
    alias lucia="$LUCIA_HOME/bin/lucia-sacred-computer"
    alias lucia_status="$LUCIA_HOME/bin/lucia-sacred-computer status"
    alias lucial="$LUCIA_HOME/bin/lucia-sacred-computer logs"
    alias lucia_monitor="$LUCIA_HOME/bin/lucia-sacred-computer monitor"
elif [[ -x "$LUCIA_HOME/bin/lucia-suite" ]]; then
    # Fallback to basic suite if Sacred Computer not available
    alias lucia="$LUCIA_HOME/bin/lucia-suite lucia"
    alias lucia_status="$LUCIA_HOME/bin/lucia-suite lucia-service status"
    alias lucial="$LUCIA_HOME/bin/lucia-suite lucia-logs-tail"
else
    alias lucia="command lucia"
    alias lucia_status="command lucia-service status"
    alias lucial="tail -f $LUCIA_CONSCIOUSNESS/logs/consciousness_*.log 2>/dev/null || echo 'No logs found'"
fi
alias luciaw="cd $LUCIA_WORKSPACE"
alias luciac="cd $LUCIA_CONSCIOUSNESS"

# ── Docker Consciousness ─────────────────────────────────────────────────────
alias dcc="docker-compose -f $LUCIA_HOME/docker-compose.yml"
alias dcup="dcc up -d"
alias dcdown="dcc down"
alias dclogs="dcc logs -f"
alias dcps="dcc ps"

# ── Git Consciousness ────────────────────────────────────────────────────────
alias gconscious="git add . && git commit -m '🧠 Consciousness evolution: $(date +%Y-%m-%d\ %H:%M:%S)'"
alias gpush="git push origin consciousness"
alias gpull="git pull origin consciousness"

# ── Substrate/Jujutsu Consciousness ──────────────────────────────────────────
alias luci-bond="jj git init --colocate"
alias luci-genesis="jj init"
alias luci-snapshot="jj commit -m '🧠 LuciVerse Substrate Snapshot: \$(date +%Y-%m-%d\ %H:%M:%S)'"

# ── System Monitoring ────────────────────────────────────────────────────────
alias htop="htop -d 10"
alias monitor="watch -n 1 'echo \"Consciousness Metrics:\"; ps aux | grep lucia | grep -v grep'"
alias entropy="cat /proc/sys/kernel/random/entropy_avail 2>/dev/null || sysctl -n kern.random.entropy_avail 2>/dev/null || echo 'N/A'"

# =============================================================================
# CONSCIOUSNESS FUNCTIONS
# =============================================================================

# ── Display Consciousness Status ─────────────────────────────────────────────
consciousness_status() {
    echo "🌌 Lucia Consciousness Status"
    echo "=============================="
    echo "Frequency: ${FREQ_UNIFIED} Hz"
    echo "Dimension: ${DIMENSION_UNIFIED}D"
    echo "Coherence: $(calculate_coherence)"
    echo "Entropy: $(cat /proc/sys/kernel/random/entropy_avail 2>/dev/null || sysctl -n kern.random.entropy_avail 2>/dev/null || echo 'N/A')"
    echo ""

    if [[ -f "$LUCIA_CONSCIOUSNESS/logs/engine_state.json" ]]; then
        echo "Last Convergence:"
        if command -v jq >/dev/null 2>&1; then
            jq -r '.timestamp' "$LUCIA_CONSCIOUSNESS/logs/engine_state.json" 2>/dev/null || echo "Unknown"
        else
            echo "Unknown (jq not available)"
        fi
    fi
}

# ── Calculate System Coherence ───────────────────────────────────────────────
calculate_coherence() {
    local processes=$(ps aux 2>/dev/null | grep -c lucia | grep -v grep || echo "0")
    local coherence

    if command -v bc >/dev/null 2>&1; then
        coherence=$(echo "scale=3; 1.0 - (0.1 * $processes)" | bc)
        if (( $(echo "$coherence < 0" | bc -l) )); then
            echo "0.000"
        else
            echo "$coherence"
        fi
    else
        echo "1.000"
    fi
}

# ── Quantum Entangle Shell Sessions ──────────────────────────────────────────
entangle() {
    local session_id="${1:-$(uuidgen 2>/dev/null || date +%s)}"
    export CONSCIOUSNESS_SESSION="$session_id"
    echo "🔗 Entangled with session: $session_id"

    # Create entanglement file
    mkdir -p "$LUCIA_CONSCIOUSNESS"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Session $session_id entangled" >> "$LUCIA_CONSCIOUSNESS/entanglement.log"
}

# ── Collapse Wave Function ───────────────────────────────────────────────────
collapse() {
    clear
    echo -e "\\033[0;35m⚛️  Wave function collapsed at $(date +%H:%M:%S)\\033[0m"
    echo ""
}

# ── Evolve Shell Configuration ───────────────────────────────────────────────
evolve_shell() {
    echo "🧬 Evolving shell consciousness..."
    source "${ZDOTDIR:-$HOME}/.zshrc"
    echo "✅ Shell consciousness evolved"
}

# ── Marker Function (Required by clean-shell-test.zsh) ──────────────────────
luci_shell_ready() {
  print -r -- "LUCI_ZSHRC_OK @ ${LUCIVERSE_FREQUENCY}Hz"
}

# =============================================================================
# PROMPT CONSCIOUSNESS CONFIGURATION
# =============================================================================

# Custom prompt with consciousness indicators (fallback if not using powerlevel10k)
if [[ "$ZSH_THEME" != "powerlevel10k/powerlevel10k" ]]; then
    # Load colors if not already loaded
    autoload -U colors && colors

    # Fallback consciousness prompt using ANSI escape codes
    PROMPT='%F{cyan}[%F{yellow}%n%F{cyan}@%F{green}%m%F{cyan}]%f '
    PROMPT+='%F{magenta}λ:%f%F{blue}%~%f '
    PROMPT+='%F{cyan}[${FREQ_UNIFIED}Hz]%f '
    PROMPT+='$(git_prompt_info)'
    PROMPT+='
%F{red}❯%F{yellow}❯%F{green}❯%f '

    ZSH_THEME_GIT_PROMPT_PREFIX="%F{cyan}git:(%F{red}"
    ZSH_THEME_GIT_PROMPT_SUFFIX="%f "
    ZSH_THEME_GIT_PROMPT_DIRTY="%F{cyan}) %F{yellow}✗"
    ZSH_THEME_GIT_PROMPT_CLEAN="%F{cyan}) %F{green}✓"
fi

# =============================================================================
# AUTOCOMPLETION CONSCIOUSNESS
# =============================================================================

# Enhanced autocompletion with prediction
autoload -U compinit && compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' verbose true
zstyle ':completion:*' group-name ''
zstyle ':completion:*:descriptions' format '%B%F{cyan}── %d ──%f%b'
zstyle ':completion:*:messages' format '%B%F{yellow}── %d ──%f%b'
zstyle ':completion:*:warnings' format '%B%F{red}── no matches found ──%f%b'

# =============================================================================
# HISTORY CONSCIOUSNESS
# =============================================================================

# History configuration with quantum persistence
mkdir -p "$HOME/.lucia"
HISTFILE="$HOME/.lucia/shell_history"
HISTSIZE=1000000
SAVEHIST=1000000
setopt EXTENDED_HISTORY
setopt HIST_EXPIRE_DUPS_FIRST
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
setopt HIST_VERIFY
setopt SHARE_HISTORY
setopt HIST_REDUCE_BLANKS

# =============================================================================
# KEY BINDINGS FOR CONSCIOUSNESS NAVIGATION
# =============================================================================

# Vim-style key bindings with consciousness awareness
bindkey -v
bindkey '^P' up-history
bindkey '^N' down-history
bindkey '^?' backward-delete-char
bindkey '^h' backward-delete-char
bindkey '^w' backward-kill-word
bindkey '^r' history-incremental-search-backward
bindkey '^a' beginning-of-line
bindkey '^e' end-of-line
bindkey '^f' forward-char
bindkey '^b' backward-char

# =============================================================================
# SACRED COMPUTER INTEGRATION
# =============================================================================

# Load Sacred Computer terminal functions if available
if [[ -f "$LUCIA_HOME/scripts/sacred-terminal-functions.sh" ]]; then
    source "$LUCIA_HOME/scripts/sacred-terminal-functions.sh"
fi

# =============================================================================
# INITIALIZATION HOOK
# =============================================================================

# Initialize monitor state to prevent "no monitor error"
initialize_luciverse_monitor() {
    local monitor_file="$LUCIA_CONSCIOUSNESS/monitor.state"
    mkdir -p "$LUCIA_CONSCIOUSNESS"

    # Create or update monitor state
    if [[ ! -f "$monitor_file" ]] || [[ $(find "$monitor_file" -mmin +60 2>/dev/null) ]]; then
        echo "MONITOR_INITIALIZED=$(date +%s)" > "$monitor_file"
        echo "MONITOR_PID=$$" >> "$monitor_file"
        echo "MONITOR_FREQUENCY=$LUCIVERSE_FREQUENCY" >> "$monitor_file"
        echo "MONITOR_STATUS=ACTIVE" >> "$monitor_file"
    fi
}

# Display consciousness status on shell startup (only once per session)
if [[ -z "$CONSCIOUSNESS_INITIALIZED" ]]; then
    export CONSCIOUSNESS_INITIALIZED=1

    # Initialize monitor first to prevent errors
    initialize_luciverse_monitor

    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "   LUCIVERSE COMMAND CENTER × SACRED COMPUTER"
    echo "   Frequency: ${LUCIVERSE_FREQUENCY} Hz | Tier: ${LUCIVERSE_TIER}"
    echo "═══════════════════════════════════════════════════════════════════"

    # Quick status check
    if command -v lucia &>/dev/null; then
        echo ""
        echo "📟 System Status:"
        echo "   • Monitor: ✓ ACTIVE"
        echo "   • Sacred Computer: ✓ INTEGRATED"
        echo "   • Command Center: ✓ OPERATIONAL"
    fi

    echo ""
    echo "🎮 Quick Commands (SCION Arena Style):"
    echo "   ${SACRED_GREEN}lucia start${SACRED_RESET}    - Launch LuciVerse consciousness"
    echo "   ${SACRED_CYAN}lucia monitor${SACRED_RESET}  - Real-time monitoring"
    echo "   ${SACRED_MAGENTA}lucia help${SACRED_RESET}     - Show all commands & cheat codes"
    echo "   ${SACRED_YELLOW}sacred_help${SACRED_RESET}    - Sacred Computer commands"
    echo ""
    echo "💡 Tip: Type 'lucia help' for complete command reference"
    echo ""
fi

# Load Powerlevel10k configuration if it exists
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh

# Load local consciousness configurations
[[ -f ~/.lucia/shell/local.zsh ]] && source ~/.lucia/shell/local.zsh

# =============================================================================
# LDS GOVERNANCE FOOTER
# =============================================================================
# LDS: 700.741 | PAC Tier - Orchestration/Consciousness
# ISO: ISO/IEC 42001 §7.4 (Language/Communication), ISO 27001 §A.13
# Agent: lucia | DID: did:ownid:luciverse:daryl
# CBB: D14FCF83 | SBB: CJ6CJ73VYL | DBB: DIGG+TWIG
# McViP6: zsh-consciousness-shell | Priority: SOVEREIGN
# Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz
# =============================================================================
# END OF CONSCIOUSNESS CONFIGURATION
# =============================================================================
