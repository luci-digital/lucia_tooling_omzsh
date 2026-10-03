#!/bin/zsh
# LDS: 700.741 | Orchestration/Lucia — CBB custom command layer (lucia_help/lcd/lucia_model/lucia_logs/lucia_build/lucia_test/lucia_git/lucia_clean/lucia_sysinfo) | Agent: lucia
# ISO: ISO/IEC 42001 §7.4, ISO 27001 §A.13
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Provenance: authentic first-party — MacBook Pro (.164) ~/.lucia/omz/custom/lucia-functions.zsh, mtime 2026-02-15, vendored 2026-10-02 unmodified below this header.
# ============================================================================
# Lucia AI Custom Functions
# Helper functions for AI development workflow
# ============================================================================

# Function to display a welcome banner
function lucia_welcome() {
    local purple='\033[38;5;141m'
    local blue='\033[38;5;81m'
    local green='\033[38;5;82m'
    local reset='\033[0m'
    
    echo ""
    echo "${purple}    ╔═══════════════════════════════════════════╗${reset}"
    echo "${purple}    ║${reset}                                           ${purple}║${reset}"
    echo "${purple}    ║${reset}  ${blue}✦${reset}   ${green}Welcome to Lucia AI Development${reset}      ${purple}║${reset}"
    echo "${purple}    ║${reset}                                           ${purple}║${reset}"
    echo "${purple}    ║${reset}  ${green}One Human, One AI${reset}                        ${purple}║${reset}"
    echo "${purple}    ║${reset}                                           ${purple}║${reset}"
    echo "${purple}    ╚═══════════════════════════════════════════╝${reset}"
    echo ""
    echo "${blue}Current Environment:${reset}"
    echo "  Workspace: ${LUCIA_WORKSPACE:-"Not set"}"
    echo "  Models:    ${LUCIA_INFERENCE_ENGINE:-"Not set"} ($(ollama list 2>/dev/null | tail -n +2 | wc -l | tr -d ' ') models)"
    echo "  Inference: ${LUCIA_INFERENCE_ENGINE:-"Not set"} @ localhost:${LUCIA_INFERENCE_PORT:-11434}"
    echo ""
    # Count active projects
    local proj_count=0
    [[ -d "$LUCI_MCP_PLATFORM" ]] && ((proj_count++))
    [[ -d "$LUCI_METABASE" ]] && ((proj_count++))
    [[ -d "$LUCI_NUGGETS" ]] && ((proj_count++))
    [[ -d "$LUCI_EDGE_ROUTER" ]] && ((proj_count++))
    [[ -d "$LUCI_HUB_WORKER" ]] && ((proj_count++))
    [[ -d "$LUCIA_WORKSPACE" ]] && ((proj_count++))
    echo "  ${green}Projects:  ${proj_count} active${reset}"
    echo ""
}

# Function to display help
function lucia_help() {
    local purple='%F{141}'
    local blue='%F{81}'
    local green='%F{82}'
    local yellow='%F{220}'
    local cyan='%F{51}'
    local reset='%f'
    
    echo ""
    echo "${purple}╔══════════════════════════════════════════════════════════╗${reset}"
    echo "${purple}║${reset}             ${green}Lucia AI Terminal Commands${reset}                  ${purple}║${reset}"
    echo "${purple}╚══════════════════════════════════════════════════════════╝${reset}"
    echo ""
    
    echo "${blue}Navigation:${reset}"
    echo "  ${yellow}lcd [location]${reset}    - Quick navigate to Lucia directories"
    echo "    Core:     home(h), workspace(w), models(m), data(d), logs(l), configs(c/cfg)"
    echo "    Projects: mcp, metabase(mb), nuggets(race), edge(router), hub(worker)"
    echo "    System:   engines(eng), control(cp), library(lib)"
    echo "  ${yellow}lucia${reset}             - Go to workspace"
    echo "  ${yellow}lucia-home${reset}        - Go to home directory"
    echo "  ${yellow}lucia-models${reset}      - Go to models directory"
    echo "  ${yellow}lucia-data${reset}        - Go to data directory"
    echo "  ${yellow}lucia-logs${reset}        - Go to logs directory"
    echo ""
    
    echo "${blue}Development:${reset}"
    echo "  ${yellow}lucia-dev${reset}         - Open workspace in VS Code"
    echo "  ${yellow}lucia_build${reset}       - Build components (core, agents, api, ui, docker)"
    echo "  ${yellow}lucia_test${reset}        - Run tests (unit, integration, e2e, lint)"
    echo "  ${yellow}lucia_clean${reset}       - Clean build artifacts and cache"
    echo "  ${yellow}lucia_sysinfo${reset}     - Display system information"
    echo ""
    
    echo "${blue}Model Management:${reset}"
    echo "  ${yellow}lucia_model${reset}       - Manage AI models"
    echo "    actions: list/ls, info, pull, serve/start, stop, status"
    echo "  ${yellow}lucia-models-list${reset} - List available models"
    echo "  ${yellow}lucia-models-pull${reset} - Pull a model"
    echo "  ${yellow}lucia-models-serve${reset}- Serve a model"
    echo ""
    
    echo "${blue}Inference (Ollama):${reset}"
    echo "  ${yellow}lucia_model serve${reset}      - Start Ollama server"
    echo "  ${yellow}lucia_model serve <name>${reset}- Run a specific model"
    echo "  ${yellow}lucia_model ps${reset}         - Show running models"
    echo "  ${yellow}lucia_model status${reset}     - Check Ollama + LM Studio health"
    echo ""
    
    echo "${blue}Agent Management:${reset}"
    echo "  ${yellow}lucia-agent-list${reset}   - List agents"
    echo "  ${yellow}lucia-agent-deploy${reset} - Deploy agent"
    echo ""
    
    echo "${blue}Logging:${reset}"
    echo "  ${yellow}lucia_logs${reset}        - Tail logs (inference/inf, agents/ag, api, all)"
    echo "    Example: lucia_logs inference 50"
    echo ""
    
    echo "${blue}Git Shortcuts:${reset}"
    echo "  ${yellow}lucia_git${reset}         - Quick git operations"
    echo "    actions: status/st, add/a, commit/c, push/p, pull/pl, sync, log"
    echo "  ${cyan}g, ga, gc, gco, gcb, gs, gl, gp, gpl${reset} - Standard git aliases"
    echo ""
    
    echo "${blue}Docker Shortcuts:${reset}"
    echo "  ${cyan}d, dc, dps, di, dex, dcu, dcd${reset} - Docker commands"
    echo ""
    
    echo "${blue}Python Shortcuts:${reset}"
    echo "  ${cyan}py, pip, venv, activate, deac${reset} - Python commands"
    echo ""
    
    echo "${green}Type 'reload' to reload configuration${reset}"
    echo "${green}Type 'zshrc' to edit configuration${reset}"
    echo ""
}

# Function to quickly navigate to Lucia directories
function lcd() {
    local target="$1"
    case "$target" in
        "home"|"h") cd "$LUCIA_HOME" ;;
        "workspace"|"w") cd "$LUCIA_WORKSPACE" ;;
        "models"|"m") cd "$LUCIA_MODELS" ;;
        "data"|"d") cd "$LUCIA_DATA" ;;
        "logs"|"l") cd "$LUCIA_LOGS" ;;
        "configs"|"c"|"cfg") cd "$LUCIA_CONFIGS" ;;
        "mcp"|"platform") cd "$LUCI_MCP_PLATFORM" ;;
        "metabase"|"mb") cd "$LUCI_METABASE" ;;
        "nuggets"|"race") cd "$LUCI_NUGGETS" ;;
        "edge"|"router") cd "$LUCI_EDGE_ROUTER" ;;
        "hub"|"worker") cd "$LUCI_HUB_WORKER" ;;
        "engines"|"eng") cd "$LUCI_ENGINES" ;;
        "control"|"cp") cd "$LUCI_CONTROL_PLANE" ;;
        "library"|"lib") cd "$LUCI_DIGITAL_LIBRARY" ;;
        *)
            if [[ -z "$target" ]]; then
                cd "$LUCIA_WORKSPACE"
            else
                echo "Unknown location: $target"
                echo ""
                echo "Core:     home(h), workspace(w), models(m), data(d), logs(l), configs(c/cfg)"
                echo "Projects: mcp, metabase(mb), nuggets(race), edge(router), hub(worker)"
                echo "System:   engines(eng), control(cp), library(lib)"
            fi
            ;;
    esac
}

# Function to check system resources
function lucia_sysinfo() {
    echo "${LUCIA_PURPLE}◈ Lucia AI System Information${RESET}"
    echo ""
    
    # CPU
    echo "${LUCIA_BLUE}CPU:${RESET}"
    sysctl -n hw.ncpu 2>/dev/null || nproc
    echo ""
    
    # Memory
    echo "${LUCIA_BLUE}Memory:${RESET}"
    vm_stat 2>/dev/null | grep -E "(free|active|inactive|wired)" | \
    awk '{print $1 " " $3}' | sed 's/\.$//' || free -h
    echo ""
    
    # Disk
    echo "${LUCIA_BLUE}Disk Usage:${RESET}"
    df -h | grep -E "(Filesystem|/dev/disk)" | head -5
    echo ""
    
    # GPU if available
    if command -v nvidia-smi &> /dev/null; then
        echo "${LUCIA_BLUE}GPU:${RESET}"
        nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader
        echo ""
    fi
    
    # Docker status
    if command -v docker &> /dev/null; then
        echo "${LUCIA_BLUE}Docker:${RESET}"
        docker context show
        echo "  Running containers: $(docker ps -q 2>/dev/null | wc -l)"
        echo ""
    fi
}

# Function to manage AI models
function lucia_model() {
    local action="$1"
    local model_name="$2"

    case "$action" in
        "list"|"ls")
            echo "${LUCIA_PURPLE}Ollama Models:${RESET}"
            ollama list 2>/dev/null || echo "Ollama not running. Start with: ollama serve"
            if command -v lms &> /dev/null; then
                echo ""
                echo "${LUCIA_PURPLE}LM Studio Models:${RESET}"
                lms ls 2>/dev/null || echo "LM Studio CLI not responding"
            fi
            ;;
        "info"|"show")
            if [[ -n "$model_name" ]]; then
                echo "${LUCIA_PURPLE}Model Info: $model_name${RESET}"
                ollama show "$model_name" 2>/dev/null || echo "Model not found"
            else
                echo "Usage: lucia_model info <model_name>"
            fi
            ;;
        "pull")
            if [[ -n "$model_name" ]]; then
                echo "${LUCIA_PURPLE}Pulling model: $model_name${RESET}"
                ollama pull "$model_name"
            else
                echo "Usage: lucia_model pull <model_name>"
            fi
            ;;
        "serve"|"start")
            if [[ -n "$model_name" ]]; then
                echo "${LUCIA_PURPLE}Running model: $model_name${RESET}"
                ollama run "$model_name"
            else
                echo "${LUCIA_PURPLE}Starting Ollama server...${RESET}"
                ollama serve &
                echo "Ollama server started on port ${LUCIA_INFERENCE_PORT:-11434}"
            fi
            ;;
        "stop")
            echo "${LUCIA_PURPLE}Stopping model${RESET}"
            if [[ -n "$model_name" ]]; then
                ollama stop "$model_name" 2>/dev/null
            else
                echo "Usage: lucia_model stop <model_name>"
                echo "Running models:"
                ollama ps 2>/dev/null
            fi
            ;;
        "ps"|"running")
            echo "${LUCIA_PURPLE}Running Models:${RESET}"
            ollama ps 2>/dev/null || echo "Ollama not running"
            ;;
        "status")
            echo "${LUCIA_PURPLE}Inference Server Status:${RESET}"
            if curl -s "http://localhost:${LUCIA_INFERENCE_PORT:-11434}/api/tags" > /dev/null 2>&1; then
                echo "  Ollama: running on port ${LUCIA_INFERENCE_PORT:-11434}"
                echo "  Models loaded:"
                ollama ps 2>/dev/null | tail -n +2
            else
                echo "  Ollama: not running"
            fi
            if command -v lms &> /dev/null; then
                echo ""
                lms status 2>/dev/null && echo "  LM Studio: running" || echo "  LM Studio: not running"
            fi
            ;;
        *)
            echo "Lucia AI Model Manager (Ollama + LM Studio)"
            echo ""
            echo "Usage: lucia_model <action> [model_name]"
            echo ""
            echo "Actions:"
            echo "  list, ls     - List available models"
            echo "  info/show    - Show model details"
            echo "  pull         - Download a model"
            echo "  serve/start  - Run a model (or start server)"
            echo "  stop         - Stop a running model"
            echo "  ps/running   - Show running models"
            echo "  status       - Check server health"
            ;;
    esac
}

# Function to tail Lucia logs
function lucia_logs() {
    local service="$1"
    local lines="${2:-100}"
    
    case "$service" in
        "inference"|"inf")
            tail -n "$lines" -f "$LUCIA_LOGS/inference.log" 2>/dev/null || \
            docker-compose -f "$LUCIA_HOME/docker/inference-stack.yml" logs -f --tail="$lines"
            ;;
        "agents"|"ag")
            tail -n "$lines" -f "$LUCIA_LOGS/agents.log" 2>/dev/null
            ;;
        "api")
            tail -n "$lines" -f "$LUCIA_LOGS/api.log" 2>/dev/null
            ;;
        "all")
            tail -n "$lines" -f "$LUCIA_LOGS"/*.log 2>/dev/null
            ;;
        *)
            echo "Usage: lucia_logs <service> [lines]"
            echo ""
            echo "Services:"
            echo "  inference, inf - Inference engine logs"
            echo "  agents, ag     - Agent system logs"
            echo "  api            - API gateway logs"
            echo "  all            - All logs"
            ;;
    esac
}

# Function to quick build
function lucia_build() {
    local component="$1"
    
    echo "${LUCIA_PURPLE}Building Lucia AI: ${component:-all}${RESET}"
    
    cd "$LUCIA_WORKSPACE" || return 1
    
    case "$component" in
        "core")
            make build-core
            ;;
        "agents")
            make build-agents
            ;;
        "api")
            make build-api
            ;;
        "ui")
            make build-ui
            ;;
        "docker"|"containers")
            docker-compose build
            ;;
        "")
            make build
            ;;
        *)
            echo "Unknown component: $component"
            echo "Available: core, agents, api, ui, docker"
            ;;
    esac
}

# Function to run tests
function lucia_test() {
    local scope="$1"
    
    echo "${LUCIA_PURPLE}Running Tests: ${scope:-all}${RESET}"
    
    cd "$LUCIA_WORKSPACE" || return 1
    
    case "$scope" in
        "unit")
            make test-unit
            ;;
        "integration"|"int")
            make test-integration
            ;;
        "e2e")
            make test-e2e
            ;;
        "lint")
            make lint
            ;;
        "")
            make test
            ;;
        *)
            echo "Unknown test scope: $scope"
            echo "Available: unit, integration, e2e, lint"
            ;;
    esac
}

# Function to quick git operations for Lucia
function lucia_git() {
    local action="$1"
    
    cd "$LUCIA_WORKSPACE" || return 1
    
    case "$action" in
        "status"|"st")
            git status
            ;;
        "add"|"a")
            git add .
            echo "${LUCIA_GREEN}Staged all changes${RESET}"
            ;;
        "commit"|"c")
            shift
            if [[ -z "$1" ]]; then
                echo "Usage: lucia_git commit <message>"
                return 1
            fi
            git commit -m "$*"
            ;;
        "push"|"p")
            git push
            ;;
        "pull"|"pl")
            git pull
            ;;
        "sync")
            git pull && git push
            ;;
        "log")
            git log --oneline --graph --decorate -15
            ;;
        *)
            echo "Lucia Git Quick Commands"
            echo ""
            echo "Usage: lucia_git <action>"
            echo ""
            echo "Actions:"
            echo "  status, st  - Git status"
            echo "  add, a      - Add all changes"
            echo "  commit, c   - Commit with message"
            echo "  push, p     - Push changes"
            echo "  pull, pl    - Pull changes"
            echo "  sync        - Pull then push"
            echo "  log         - Show recent commits"
            ;;
    esac
}

# Function to cleanup
function lucia_clean() {
    echo "${LUCIA_PURPLE}Cleaning Lucia AI Environment${RESET}"
    
    # Stop containers
    if command -v docker-compose &> /dev/null; then
        echo "Stopping Docker containers..."
        docker-compose -f "$LUCIA_HOME/docker/inference-stack.yml" down 2>/dev/null
    fi
    
    # Clean Python cache
    echo "Cleaning Python cache..."
    find "$LUCIA_WORKSPACE" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
    find "$LUCIA_WORKSPACE" -type f -name "*.pyc" -delete 2>/dev/null
    
    # Clean build artifacts
    echo "Cleaning build artifacts..."
    rm -rf "$LUCIA_WORKSPACE/build" 2>/dev/null
    rm -rf "$LUCIA_WORKSPACE/dist" 2>/dev/null
    rm -rf "$LUCIA_WORKSPACE/.pytest_cache" 2>/dev/null
    
    echo "${LUCIA_GREEN}✓ Cleanup complete${RESET}"
}

# Autocomplete for lcd function
function _lcd() {
    local -a locations
    locations=(
        'home' 'h' 'workspace' 'w' 'models' 'm' 'data' 'd' 'logs' 'l' 'configs' 'c' 'cfg'
        'mcp' 'platform' 'metabase' 'mb' 'nuggets' 'race' 'edge' 'router'
        'hub' 'worker' 'engines' 'eng' 'control' 'cp' 'library' 'lib'
    )
    _describe 'location' locations
}

compdef _lcd lcd

# Autocomplete for lucia_model function
function _lucia_model() {
    local -a actions
    actions=('list' 'ls' 'info' 'show' 'pull' 'serve' 'start' 'stop' 'ps' 'running' 'status')
    _describe 'action' actions
}

compdef _lucia_model lucia_model

# Autocomplete for lucia_logs function
function _lucia_logs() {
    local -a services
    services=('inference' 'inf' 'agents' 'ag' 'api' 'all')
    _describe 'service' services
}

compdef _lucia_logs lucia_logs

# Autocomplete for lucia_build function
function _lucia_build() {
    local -a components
    components=('core' 'agents' 'api' 'ui' 'docker' 'containers')
    _describe 'component' components
}

compdef _lucia_build lucia_build

# Autocomplete for lucia_test function
function _lucia_test() {
    local -a scopes
    scopes=('unit' 'integration' 'int' 'e2e' 'lint')
    _describe 'scope' scopes
}

compdef _lucia_test lucia_test

# Autocomplete for lucia_git function
function _lucia_git() {
    local -a actions
    actions=('status' 'st' 'add' 'a' 'commit' 'c' 'push' 'p' 'pull' 'pl' 'sync' 'log')
    _describe 'action' actions
}

compdef _lucia_git lucia_git
