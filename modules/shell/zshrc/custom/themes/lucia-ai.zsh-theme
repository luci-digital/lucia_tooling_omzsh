# LDS: 500.528 | Communication/COMN — lucia-ai prompt theme | Agent: mirrai
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Provenance: MacBook Pro ~/.lucia/omz/custom/themes/lucia-ai.zsh-theme (2026-01-30), vendored 2026-10-02.
#!/bin/zsh
# ============================================================================
# Lucia AI Terminal Theme
# A custom Oh My Zsh theme for Lucia AI development environment
# Features: Git status, Python virtualenv, Docker context, AI model status
# ============================================================================

# Color definitions
local LUCIA_PURPLE='%F{141}'
local LUCIA_BLUE='%F{81}'
local LUCIA_GREEN='%F{82}'
local LUCIA_YELLOW='%F{220}'
local LUCIA_RED='%F{196}'
local LUCIA_CYAN='%F{51}'
local LUCIA_ORANGE='%F{208}'
local LUCIA_WHITE='%F{255}'
local LUCIA_GRAY='%F{245}'
local RESET='%f'

# Git branch icon
local GIT_BRANCH_ICON='⎇'

# Function to get git branch with status
function git_prompt_info_custom() {
    local ref
    ref=$(git symbolic-ref HEAD 2> /dev/null) || \
    ref=$(git rev-parse --short HEAD 2> /dev/null) || return 0
    
    local git_status=""
    if [[ -n $(git status -s 2>/dev/null) ]]; then
        git_status="${LUCIA_YELLOW}✗${RESET}"
    else
        git_status="${LUCIA_GREEN}✓${RESET}"
    fi
    
    echo "${LUCIA_PURPLE}${GIT_BRANCH_ICON} ${ref#refs/heads/}${RESET} ${git_status}"
}

# Function to get Python virtual environment
function python_env_info() {
    if [[ -n "$VIRTUAL_ENV" ]]; then
        local env_name=$(basename "$VIRTUAL_ENV")
        echo "${LUCIA_CYAN}🐍 ${env_name}${RESET} "
    elif [[ -n "$CONDA_DEFAULT_ENV" && "$CONDA_DEFAULT_ENV" != "base" ]]; then
        echo "${LUCIA_CYAN}🐍 ${CONDA_DEFAULT_ENV}${RESET} "
    fi
}

# Function to get Docker context
function docker_context_info() {
    if command -v docker &> /dev/null; then
        local context=$(docker context show 2>/dev/null)
        if [[ "$context" != "default" && -n "$context" ]]; then
            echo "${LUCIA_BLUE}🐳 ${context}${RESET} "
        fi
    fi
}

# Function to check if in Lucia workspace
function lucia_workspace_indicator() {
    local current_dir=$(pwd)
    if [[ "$current_dir" == *"lucia"* || "$current_dir" == *"LUCIA"* ]]; then
        echo "${LUCIA_PURPLE}◈${RESET} "
    fi
}

# Function to get current time
function time_info() {
    echo "${LUCIA_GRAY}[%D{%H:%M:%S}]${RESET} "
}

# Function to get exit status
function exit_status_indicator() {
    echo "%(?..${LUCIA_RED}✘ %?${RESET} )"
}

# Build the prompt
function build_prompt() {
    local prompt_parts=""
    
    # Add time
    prompt_parts+=$(time_info)
    
    # Add exit status if error
    prompt_parts+=$(exit_status_indicator)
    
    # Add workspace indicator
    prompt_parts+=$(lucia_workspace_indicator)
    
    # Add Python environment
    prompt_parts+=$(python_env_info)
    
    # Add Docker context
    prompt_parts+=$(docker_context_info)
    
    # Add current directory
    prompt_parts+="${LUCIA_GREEN}%2~${RESET} "
    
    # Add git info
    local git_info=$(git_prompt_info_custom)
    if [[ -n "$git_info" ]]; then
        prompt_parts+="${git_info} "
    fi
    
    echo $prompt_parts
}

# Main prompt
PROMPT='$(build_prompt)
${LUCIA_PURPLE}❯${RESET} '

# Right prompt - shows additional info
RPROMPT='${LUCIA_GRAY}%D{%Y-%m-%d}${RESET}'

# Continuation prompt
PROMPT2='${LUCIA_PURPLE}⋯${RESET} '

# Spell correction prompt
SPROMPT='${LUCIA_YELLOW}Did you mean: %r? [nyae]${RESET} '

# ============================================================================
# Theme-specific aliases
# ============================================================================

# Git shortcuts
alias g='git'
alias ga='git add'
alias gaa='git add --all'
alias gc='git commit'
alias gca='git commit --amend'
alias gcm='git commit -m'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gbr='git branch'
alias gbd='git branch -d'
alias gs='git status'
alias gss='git status -s'
alias gl='git log --oneline --graph --decorate'
alias gll='git log --oneline --graph --decorate --all'
alias gp='git push'
alias gpf='git push --force-with-lease'
alias gpl='git pull'
alias gf='git fetch'
alias gm='git merge'
alias grb='git rebase'
alias grbc='git rebase --continue'
alias grba='git rebase --abort'
alias gst='git stash'
alias gstp='git stash pop'
alias gsta='git stash apply'

# Docker shortcuts
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dimg='docker images'
alias dex='docker exec -it'
alias dlog='docker logs -f'
alias dcp='docker-compose ps'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcb='docker-compose build'
alias dcr='docker-compose restart'
alias dcl='docker-compose logs -f'

# Python shortcuts
alias py='python3'
alias py2='python2'
alias py3='python3'
alias pip='pip3'
alias venv='python3 -m venv'
alias activate='source venv/bin/activate'
alias deac='deactivate'
alias ipy='ipython'
alias jn='jupyter notebook'
alias jl='jupyter lab'

# Navigation shortcuts
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias .....='cd ../../../..'
alias -- -='cd -'
alias ~='cd ~'

# File operations
alias ls='ls -GFh'
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias cp='cp -iv'
alias mv='mv -iv'
alias rm='rm -iv'
alias mkdir='mkdir -pv'

# Quick edit
alias zshrc='${EDITOR:-nano} ~/.zshrc'
alias ohmyzsh='${EDITOR:-nano} ~/.oh-my-zsh'

# System
alias reload='source ~/.zshrc'
alias path='echo $PATH | tr ":" "\n"'
alias ports='netstat -tulan'
alias myip='curl -s http://ipecho.net/plain; echo'
