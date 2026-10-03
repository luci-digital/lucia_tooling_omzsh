#!/bin/sh
# LDS: 700.741 | Orchestration/Lucia — toysh port of the CBB's lucia-* command set | Agent: lucia
# ISO: ISO/IEC 42001 §7.4, ISO 27001 §A.13
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Created: 2026-10-02 · Updated: 2026-10-02
#
# Source of the command set (read 2026-10-02 from the MacBook Pro .164, ~/.lucia + ~/.zshrc.bak-luciaAI):
#   omz/custom/lucia-functions.zsh  → lucia_help lcd lucia_sysinfo lucia_model lucia_logs lucia_build lucia_test lucia_git lucia_clean
#   .zshrc.bak-luciaAI              → lucia-health lucia-venv lucia-init lucia-help (+ the dashed aliases)
#   ~/.zshrc                        → luci_bond_status (FoundationDB mesh probe)
#   shell/luciverse.zshrc           → Podman machine socket resolution
#   ~/lucia/bin/lucia-sacred-computer → `lucia start|stop|status|monitor|vcs|agents` (stays bash: set -euo pipefail, arrays)
# The zsh originals are vendored unmodified in ../zshrc/custom/. This file is the toysh/POSIX twin:
#   no arrays, no elif and no `if ! fn` (toysh 0.8.14 misfires both inside a function), no `set -e`, no `${x:-$y}`
#   (toysh does not expand $ inside ${:-}), no `rm -rf "$VAR/…"` (CBB hard rule — lucia_clean lists, never deletes).
# Requires ./luci.profile.sh (LUCIA_* paths, luci_have) and ./luci-probe.sh (port_up, http_get) sourced first.

if [ -z "$LUCIA_INFERENCE_PORT" ]; then LUCIA_INFERENCE_PORT=11434; fi; export LUCIA_INFERENCE_PORT
if [ -z "$LUCIA_VECTOR_DB_PORT" ]; then LUCIA_VECTOR_DB_PORT=6333; fi; export LUCIA_VECTOR_DB_PORT
if [ -z "$LUCIA_MODELS" ]; then LUCIA_MODELS="$LUCIA_HOME/models"; fi; export LUCIA_MODELS
if [ -z "$LUCIA_DATA" ]; then LUCIA_DATA="$LUCIA_HOME/data"; fi; export LUCIA_DATA
if [ -z "$LUCIA_LOGS" ]; then LUCIA_LOGS="$LUCIA_HOME/logs"; fi; export LUCIA_LOGS
if [ -z "$LUCIA_CONFIGS" ]; then LUCIA_CONFIGS="$LUCIA_HOME/configs"; fi; export LUCIA_CONFIGS

# Podman machine socket (MacBook delta): the ssh:// port changes on every VM restart — resolve, never hardcode.
if [ -z "$DOCKER_HOST" ] && luci_have podman; then
  luci_sock="$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}' 2>/dev/null)"
  if [ -S "$luci_sock" ]; then DOCKER_HOST="unix://$luci_sock"; export DOCKER_HOST; fi
  unset luci_sock
fi

lucia_help() {
  cat <<'HELP'
Lucia commands (toysh port — same names as the zsh layer)
  lcd [h|w|m|d|l|c]        cd to home/workspace/models/data/logs/configs
  lucia_sysinfo            cpu / memory / disk / container runtime
  lucia_model <action>     list|info|pull|serve|stop|ps|status   (ollama)
  lucia_logs <svc> [n]     inference|agents|api|all
  lucia_build [component]  make build[-core|-agents|-api|-ui]  (docker → podman compose build)
  lucia_test [scope]       make test[-unit|-integration|-e2e] | lint
  lucia_git <action>       status|add|commit <msg>|push|pull|sync|log
  lucia_clean              LISTS build artifacts/caches to remove (never deletes — CBB rm rule)
  lucia_health             inference, vector db, consciousness, redis, GPU, disk   (luci-probe port_up)
  lucia_venv               activate (or create) $LUCIA_WORKSPACE/.venv
  lucia_init <name>        scaffold a project under $LUCIA_WORKSPACE
  luci_bond_status         FoundationDB mesh reachable? (Spirit Mode otherwise)
  lucia_sacred             delegate to ~/lucia/bin/lucia-sacred-computer when present (bash host only)
HELP
}

lcd() {
  case "$1" in
    home|h) cd "$LUCIA_HOME" ;;
    workspace|w|"") cd "$LUCIA_WORKSPACE" ;;
    models|m) cd "$LUCIA_MODELS" ;;
    data|d) cd "$LUCIA_DATA" ;;
    logs|l) cd "$LUCIA_LOGS" ;;
    configs|c|cfg) cd "$LUCIA_CONFIGS" ;;
    *) printf 'lcd: unknown location %s (home workspace models data logs configs)\n' "$1" >&2; return 1 ;;
  esac
}

lucia_sysinfo() {
  # toysh: `if ! fn` and if/elif/else misfire inside functions — capture rc explicitly
  printf 'cpus: '; luci_have nproc; luci_rc=$?; if [ "$luci_rc" -eq 0 ]; then nproc; fi
  if [ "$luci_rc" -ne 0 ]; then sysctl -n hw.ncpu 2>/dev/null || printf '?\n'; fi
  printf 'memory:\n'; luci_have free; luci_rc=$?; if [ "$luci_rc" -eq 0 ]; then free -h | sed 's/^/  /'; fi
  if [ "$luci_rc" -ne 0 ]; then vm_stat 2>/dev/null | sed -n '2,5p' | sed 's/^/  /'; fi
  printf 'disk:\n'; df -h "$LUCIA_HOME" 2>/dev/null | sed 's/^/  /'
  if luci_have nvidia-smi; then printf 'gpu:\n'; nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader | sed 's/^/  /'; fi
  if luci_have podman; then printf 'podman: %s running\n' "$(podman ps -q 2>/dev/null | wc -l | tr -d ' ')"; fi
  if luci_have isula; then printf 'isula: %s running\n' "$(isula ps -q 2>/dev/null | wc -l | tr -d ' ')"; fi
}

lucia_model() {
  luci_have ollama || { printf 'lucia_model: ollama not on PATH\n' >&2; return 127; }
  case "$1" in
    list|ls) ollama list ;;
    info|show) [ -n "$2" ] || { printf 'usage: lucia_model info <model>\n' >&2; return 2; }; ollama show "$2" ;;
    pull) [ -n "$2" ] || { printf 'usage: lucia_model pull <model>\n' >&2; return 2; }; ollama pull "$2" ;;
    serve|start) if [ -n "$2" ]; then ollama run "$2"; fi; if [ -z "$2" ]; then ollama serve & printf 'ollama serve started on :%s\n' "$LUCIA_INFERENCE_PORT"; fi ;;
    stop) [ -n "$2" ] || { ollama ps; return 2; }; ollama stop "$2" ;;
    ps|running) ollama ps ;;
    status) if port_up 127.0.0.1 "$LUCIA_INFERENCE_PORT"; then printf 'ollama: up on :%s\n' "$LUCIA_INFERENCE_PORT"; ollama ps 2>/dev/null | sed '1d'; return 0; fi
            printf 'ollama: down\n'; return 1 ;;
    *) printf 'usage: lucia_model list|info|pull|serve|stop|ps|status [model]\n' >&2; return 2 ;;
  esac
}

lucia_logs() {
  luci_n="$2"; [ -n "$luci_n" ] || luci_n=100
  case "$1" in
    inference|inf) tail -n "$luci_n" -f "$LUCIA_LOGS/inference.log" ;;
    agents|ag) tail -n "$luci_n" -f "$LUCIA_LOGS/agents.log" ;;
    api) tail -n "$luci_n" -f "$LUCIA_LOGS/api.log" ;;
    all) tail -n "$luci_n" -f "$LUCIA_LOGS"/*.log ;;
    *) printf 'usage: lucia_logs inference|agents|api|all [lines]\n' >&2; return 2 ;;
  esac
}

lucia_build() {
  cd "$LUCIA_WORKSPACE" || return 1
  case "$1" in
    "") make build ;;
    core|agents|api|ui) make "build-$1" ;;
    docker|containers) if luci_have podman; then podman compose build; return $?; fi; docker compose build ;;
    *) printf 'lucia_build: unknown component %s (core agents api ui docker)\n' "$1" >&2; return 2 ;;
  esac
}

lucia_test() {
  cd "$LUCIA_WORKSPACE" || return 1
  case "$1" in
    "") make test ;;
    unit) make test-unit ;;
    integration|int) make test-integration ;;
    e2e) make test-e2e ;;
    lint) make lint ;;
    *) printf 'lucia_test: unknown scope %s (unit integration e2e lint)\n' "$1" >&2; return 2 ;;
  esac
}

lucia_git() {
  cd "$LUCIA_WORKSPACE" || return 1
  case "$1" in
    status|st) git status ;;
    add|a) git add . ;;
    commit|c) shift; [ -n "$1" ] || { printf 'usage: lucia_git commit <message>\n' >&2; return 2; }; git commit -m "$*" ;;
    push|p) git push ;;
    pull|pl) git pull ;;
    sync) git pull && git push ;;
    log) git log --oneline --graph --decorate -15 ;;
    *) printf 'usage: lucia_git status|add|commit <msg>|push|pull|sync|log\n' >&2; return 2 ;;
  esac
}

# The zsh original runs `rm -rf "$LUCIA_WORKSPACE/build"` etc. — a variable-path recursive delete, the exact
# shape of the 2026-08-09 home wipe. The port only LISTS; the CBB deletes by hand with a literal path.
lucia_clean() {
  [ -n "$LUCIA_WORKSPACE" ] && [ -d "$LUCIA_WORKSPACE" ] || { printf 'lucia_clean: LUCIA_WORKSPACE unset or missing\n' >&2; return 1; }
  printf 'lucia_clean lists only (no delete). Candidates under %s:\n' "$LUCIA_WORKSPACE"
  find "$LUCIA_WORKSPACE" -type d \( -name __pycache__ -o -name .pytest_cache -o -name build -o -name dist \) 2>/dev/null | sed 's/^/  /'
  printf '  *.pyc: %s files\n' "$(find "$LUCIA_WORKSPACE" -type f -name '*.pyc' 2>/dev/null | wc -l | tr -d ' ')"
}

lucia_health() {
  printf 'Lucia health (%s)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  luci_hc() { if port_up 127.0.0.1 "$2"; then printf '  up    %-14s :%s\n' "$1" "$2"; return 0; fi; printf '  DOWN  %-14s :%s\n' "$1" "$2"; return 1; }
  luci_hc inference "$LUCIA_INFERENCE_PORT"; luci_hc vector-db "$LUCIA_VECTOR_DB_PORT"
  luci_hc consciousness 8743; luci_hc agents 8090; luci_hc redis 6379
  luci_have nvidia-smi; luci_rc=$?
  if [ "$luci_rc" -eq 0 ]; then nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader | sed 's/^/  gpu   /'; fi
  if [ "$luci_rc" -ne 0 ]; then printf '  gpu   none\n'; fi
  df -h "$LUCIA_HOME" 2>/dev/null | sed -n '2p' | awk '{print "  disk  " $4 " free (" $5 " used)"}'
}

lucia_venv() {
  if [ -d "$LUCIA_WORKSPACE/.venv" ]; then . "$LUCIA_WORKSPACE/.venv/bin/activate" && printf 'venv: %s\n' "$VIRTUAL_ENV"; return $?; fi
  luci_have python3 || { printf 'lucia_venv: no python3\n' >&2; return 127; }
  python3 -m venv "$LUCIA_WORKSPACE/.venv" && . "$LUCIA_WORKSPACE/.venv/bin/activate" && printf 'venv created: %s\n' "$VIRTUAL_ENV"
}

lucia_init() {
  luci_p="$1"; [ -n "$luci_p" ] || luci_p=new-lucia-project
  mkdir -p "$LUCIA_WORKSPACE/$luci_p/agents" "$LUCIA_WORKSPACE/$luci_p/models" "$LUCIA_WORKSPACE/$luci_p/tools" \
           "$LUCIA_WORKSPACE/$luci_p/configs" "$LUCIA_WORKSPACE/$luci_p/tests" "$LUCIA_WORKSPACE/$luci_p/docs" || return 1
  cd "$LUCIA_WORKSPACE/$luci_p" || return 1
  [ -d .git ] || git init -q
  [ -f README.md ] || printf '# %s\n' "$luci_p" > README.md
  printf 'project %s at %s\n' "$luci_p" "$PWD"
}

luci_bond_status() {
  if luci_have fdbcli && timeout 6 fdbcli --exec "status minimal" 2>/dev/null | grep -q "is available"; then
    printf 'bond TRUE — FoundationDB mesh available @ %s Hz\n' "$LUCIVERSE_FREQUENCY"; return 0
  fi
  printf 'bond SPIRIT MODE — FoundationDB mesh unavailable (mutations queue locally)\n'; return 1
}

lucia_sacred() {               # the sacred-computer command centre needs real bash (set -euo pipefail, arrays)
  if [ -x "$LUCIA_HOME/bin/lucia-sacred-computer" ] && luci_have bash && [ ! -L "$(command -v bash)" ]; then
    "$LUCIA_HOME/bin/lucia-sacred-computer" "$@"; return $?
  fi
  printf 'lucia_sacred: needs %s/bin/lucia-sacred-computer and a real bash (not the toysh alias)\n' "$LUCIA_HOME" >&2; return 3
}

alias lucia-health='lucia_health' lucia-help='lucia_help' lucia-venv='lucia_venv' lucia-init='lucia_init'
alias lucia-models-list='lucia_model list' lucia-models-pull='lucia_model pull' lucia-inference-status='lucia_model status'
alias lucia-logs-tail='lucia_logs all' lucia-build='lucia_build' lucia-test='lucia_test' lucia-lint='lucia_test lint'
