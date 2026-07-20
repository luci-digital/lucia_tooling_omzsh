# Shell Config MCP Bundle

**LuciVerse zsh configuration (sovereign, non-standard oh-my-zsh)**

## What This Bundle Provides

- **Nix-Managed zsh** — Reproducible shell environment
- **Module System** — Composable zsh plugins and functions
- **Clean Shell Test** — Validates config in pristine environment
- **Syntax Validation** — Comprehensive zsh linting
- **Shell Integration** — Dev shell with ZDOTDIR override

## Available Tools

| Tool | Purpose | Command |
|------|---------|----------|
| `/zsh-test` | Syntax + clean-shell config | `nix run .#zsh-test` |
| `/shellcheck` | Lint shell scripts | `nix run .#shellcheck` |
| `/shfmt` | Format checking | `nix run .#shfmt` |
| `/zsh-enter` | Enter sovereign zsh | `nix develop .#shell && zsh` |

## Quick Start

### Validate Configuration
```bash
claude > /zsh-test
# Checks syntax + clean-shell compliance
```

### Enter Sovereign Shell
```bash
claude > nix develop .#shell
# Sets ZDOTDIR={git_root}/modules/shell/zshrc
# Run 'zsh' to enter shell
```

### Test Shell Scripts
```bash
claude > /shellcheck
# Validates all .sh files (excluding legacy/)
```

### Format Check
```bash
claude > /shfmt
# Verifies shell formatting
```

## Configuration Structure

```
modules/shell/
├── zshrc/                         # Sovereign .zshrc
│   ├── .zshrc                     # Main entry point
│   ├── .zprofile                  # Login shell init
│   ├── .zlogout                   # Logout cleanup
│   ├── init.d/                    # Initialization modules
│   │   ├── 00-env.zsh            # Environment variables
│   │   ├── 10-paths.zsh          # PATH construction
│   │   ├── 20-aliases.zsh        # Command aliases
│   │   ├── 30-functions.zsh      # Shell functions
│   │   └── 99-final.zsh          # Final setup
│   ├── plugins/                   # Custom plugins
│   │   ├── luci-signal.plugin.zsh
│   │   ├── luci-vcs.plugin.zsh
│   │   └── luci-devops.plugin.zsh
│   └── completions/               # zsh completions
│       ├── _just
│       ├── _nix
│       └── _luci
├── scripts/                       # Shell utilities
│   ├── activate-env.sh           # Activate Nix env
│   ├── load-secrets.sh           # Load from vault
│   └── init-project.sh           # Project setup
└── test/
    └── clean-shell-test.zsh      # Validation script
```

## Legacy OMZ

Original oh-my-zsh remains in `modules/legacy/original-layout/` for reference. Our sovereign config replaces it.

Exclusions from linting/formatting:
- `modules/legacy/**`
- Standard OMZ structure (preserved as-is)

## ZDOTDIR Override

In Nix dev shell:
```bash
export ZDOTDIR="$(git rev-parse --show-toplevel)/modules/shell/zshrc"
zsh  # Enter shell with sovereign config
```

At session start, `.zshrc` loads:
1. Environment (00-env.zsh)
2. Paths (10-paths.zsh)
3. Aliases (20-aliases.zsh)
4. Functions (30-functions.zsh)
5. Plugins (init.d/plugins/*.zsh)
6. Final setup (99-final.zsh)

## Plugin System

### LuciSignal Plugin
Integration with signal/bus.lua:
```bash
luci-signal-watch      # Watch live signals
luci-signal-emit KEY   # Emit custom signal
luci-signal-clear      # Clear signal queue
```

### LuciVCS Plugin
Gitoxide-based version control:
```bash
luci-vcs-status        # Show VCS status
luci-vcs-commit MSG    # Commit with verification
luci-vcs-push          # Push changes
```

### LuciDevOps Plugin
Dev operations shortcuts:
```bash
just dev               # Start dev server
just check             # Run CI gate
just up                # Start sovereign stack
just deploy-local      # Deploy locally
```

## Environment Variables

Set in 00-env.zsh:
```bash
export LUCIVERSE_TIER=PAC
export LUCIVERSE_FREQUENCY=741
export LUCIVERSE_COHERENCE=0.94
export MODULAR_CACHE="${HOME}/.cache/modular"
export PYTHONUNBUFFERED=1
export BAZEL_STARTUP_OPTS="--noincompatible_changes_are_incompatible=false"
```

## Clean Shell Test

Validation in pristine zsh (no inherited environment):
```zsh
# Runs in clean-shell-test.zsh
zsh -i -c 'source ~/.zshrc && <validation checks>'
```

Checks:
- No undefined variables
- No unbound functions
- Proper completion loading
- Plugin initialization
- Path construction correctness

## Troubleshooting

### "zsh: command not found"
```bash
claude > /zsh-enter
# Ensure ZDOTDIR and PATH are set
```

### "Completion not working"
```bash
claude > /zsh-test
# Validate completions/ directory
```

### "Plugin fails to load"
```bash
# Debug plugin loading
zsh -x -c 'source modules/shell/zshrc/.zshrc'
```

### "shellcheck fails on plugin"
```bash
# shellcheck can't parse zsh-specific syntax
# Use # shellcheck disable=... for known issues
```

## Performance Tips

- Lazy-load plugins (only when needed)
- Pre-compile completions: `zcompile`
- Use `zsh-lazy` for expensive initializations
- Profile startup: `zsh -X -i -c 'exit' 2>&1 | head -20`

## License

MIT License
