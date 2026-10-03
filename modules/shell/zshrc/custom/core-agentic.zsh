# LDS: 000.741 | Meta / Protocol / DevEnv | Agent: lds-orchestrator
# ISO: ISO/IEC 42001 §7.1, ISO 27001 §A.12
# Genesis Bond: GB-2025-0524-DRH-LCS-001
#
# Wires the canonical core-agentic-automation template into the shell.
# Source of truth: ~/lucia/dot_luciverse-libraries/dot_luci-digital-library/core-agentic-automation
#
# Override CORE_AUTOMATION_HOME in ~/.lucia/shell/local.zsh if you want
# a different copy authoritative.

# ── Resolve template location (prefer dot-template, fall back to deployed copy) ──
__lucia_core_candidates=(
    "$HOME/lucia/dot_luciverse-libraries/dot_luci-digital-library/core-agentic-automation"
    "$HOME/.luci-digital-library/core-agentic-automation"
    "$HOME/.luci-digital-library 3/core-agentic-automation"
)

if [[ -z "${CORE_AUTOMATION_HOME:-}" ]]; then
    for __c in "${__lucia_core_candidates[@]}"; do
        if [[ -d "$__c" ]]; then
            export CORE_AUTOMATION_HOME="$__c"
            break
        fi
    done
fi
unset __lucia_core_candidates __c

# ── Aliases (only register if the dir resolved) ──────────────────────────────
if [[ -n "${CORE_AUTOMATION_HOME:-}" && -d "$CORE_AUTOMATION_HOME" ]]; then
    alias core-cd='cd "$CORE_AUTOMATION_HOME"'
    alias core-ls='ls -la "$CORE_AUTOMATION_HOME"'

    core-deploy() {
        local script="$CORE_AUTOMATION_HOME/deploy-core-automation.sh"
        if [[ ! -x "$script" ]]; then
            echo "core-deploy: $script missing or not executable" >&2
            return 1
        fi
        BASE_PATH="${BASE_PATH:-$CORE_AUTOMATION_HOME}" "$script" "$@"
    }

    core-deploy-complete() {
        local script="$CORE_AUTOMATION_HOME/deploy-complete-system.sh"
        [[ -x "$script" ]] || { echo "core-deploy-complete: missing $script" >&2; return 1; }
        BASE_PATH="${BASE_PATH:-$CORE_AUTOMATION_HOME}" "$script" "$@"
    }

    core-deploy-livekit() {
        local script="$CORE_AUTOMATION_HOME/deploy-livekit-system.sh"
        [[ -x "$script" ]] || { echo "core-deploy-livekit: missing $script" >&2; return 1; }
        BASE_PATH="${BASE_PATH:-$CORE_AUTOMATION_HOME}" "$script" "$@"
    }

    core-status() {
        echo "CORE_AUTOMATION_HOME = $CORE_AUTOMATION_HOME"
        if [[ -d "$CORE_AUTOMATION_HOME" ]]; then
            local n
            n=$(find "$CORE_AUTOMATION_HOME" -maxdepth 1 -type d | wc -l | tr -d ' ')
            echo "  components: $((n - 1))"
        fi
        for s in deploy-core-automation.sh deploy-complete-system.sh deploy-livekit-system.sh; do
            if [[ -x "$CORE_AUTOMATION_HOME/$s" ]]; then
                echo "  ready: $s"
            else
                echo "  missing or not executable: $s"
            fi
        done
    }
fi
