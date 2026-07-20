# gix-jj-gerrit VCS Integration with TrueNAS Servers

**Date:** 2026-06-26
**LDS:** 000.528 | VCS/Infrastructure (Core Tier)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 528 Hz

---

## Overview

Integration of gix-jj-gerrit VCS system from `/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense` with d8rth and r210 TrueNAS servers, including DAGwood content-addressed storage and 1Password secret management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Git Remotes (3)                                                 │
│  • origin (GitHub) - https://github.com/luci-digital/...         │
│  • d8rth  (TrueNAS) - ssh://d8rth/~/git/lucia_tooling_omzsh.git │
│  • r210   (TrueNAS) - ssh://r210/~/git/lucia_tooling_omzsh.git │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  gix-jj-gerrit VCS System                                        │
│  Location: /Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-...   │
│  • gitoxide (pure Rust git)                                      │
│  • Jujutsu (version control substrate)                           │
│  • Gerrit integration (code review)                              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  DAGwood Content-Addressed Storage                               │
│  • 37,546 hashnodes                                              │
│  • Server configs hashed and indexed                             │
│  • Content-addressed via SHA256                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  1Password Secret Management                                     │
│  • op:// protocol for secret references                          │
│  • Environment templates (.env.d8rth.template, .env.r210...)    │
│  • SSH keys, API tokens, passwords                               │
└─────────────────────────────────────────────────────────────────┘
```

## gix-jj-gerrit Integration

### Workyard Location

```bash
export GIX_JJ_WORKYARD=/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense
export GIX_JJ_SOURCE_ROOT=/Users/darylharr/lucia/luciverse-monorepo
```

### Environment Variables (from .env templates)

**d8rth:**
```bash
# From ~/.lucia/vault/config/servers/.env.d8rth.template
GIX_JJ_WORKYARD=/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense
GIX_JJ_SOURCE_ROOT=/Users/darylharr/lucia/luciverse-monorepo
GIX_JJ_GERRIT_URL=http://d8rth:8080
GIX_JJ_GERRIT_USER=daryl
GIX_JJ_GERRIT_PASSWORD=op://LuciVerse/d8rth TrueNAS/gerrit_password
```

**r210:**
```bash
# From ~/.lucia/vault/config/servers/.env.r210.template
GIX_JJ_WORKYARD=/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense
GIX_JJ_SOURCE_ROOT=/Users/darylharr/lucia/luciverse-monorepo
GIX_JJ_GERRIT_URL=http://r210.local:8080
GIX_JJ_GERRIT_USER=truenas_admin
GIX_JJ_GERRIT_PASSWORD=op://LuciVerse/r210 TrueNAS/gerrit_password
```

### Usage with op inject

```bash
# Generate environment file for d8rth
op inject -i ~/.lucia/vault/config/servers/.env.d8rth.template -o ~/.lucia/vault/config/servers/.env.d8rth

# Generate environment file for r210
op inject -i ~/.lucia/vault/config/servers/.env.r210.template -o ~/.lucia/vault/config/servers/.env.r210

# Source the environment
source ~/.lucia/vault/config/servers/.env.d8rth

# Now use gix-jj commands with secrets injected
cd $GIX_JJ_WORKYARD
just build
just test
```

## DAGwood Integration

### Hashnode References

All server configuration files are tracked as DAGwood hashnodes:

| File | Hash | Type |
|:-----|:-----|:-----|
| `d8rth.yaml` | `44e24fcf83e97cc4...` | config |
| `r210.yaml` | `9a624c59ca9d0ea6...` | config |
| `.env.d8rth.template` | `66259f5069246024...` | env-template |
| `.env.r210.template` | `ea807c5f022072d4...` | env-template |

### DAGwood Resolver Usage

```bash
# Resolve server config by hash
python3 ~/.lucia/dagwood/resolver.py 44e24fcf83e97cc4...

# Get hashnode metadata
python3 -c "
from dagwood.resolver import DAGwoodResolver
resolver = DAGwoodResolver()
hashnode = resolver.get_hashnode('44e24fcf83e97cc4...')
print(hashnode['provenance'])
"
```

### Creating New Hashnodes

```bash
# Automatically create hashnodes for all server configs
python3 ~/.lucia/vault/scripts/create-dagwood-hashnodes.py

# Output:
# 🔨 Creating DAGwood hashnodes for server configurations...
# ✅ Created 4 new hashnodes
# 📊 Total hashnodes in index: 37,546
```

## Git Operations

### Push to All Remotes

```bash
# Push to GitHub
git push origin master

# Push to d8rth
git push d8rth master

# Push to r210
git push r210 master

# Or push to all remotes at once
git remote | xargs -L1 git push
```

### Clone from TrueNAS

```bash
# Clone from d8rth
git clone ssh://d8rth/~/git/lucia_tooling_omzsh.git

# Clone from r210
git clone ssh://r210/~/git/lucia_tooling_omzsh.git
```

## Gerrit Code Review (Optional)

If Gerrit is running on the TrueNAS servers:

```bash
# Configure Gerrit remote for d8rth
git remote add gerrit-d8rth http://d8rth:8080/lucia_tooling_omzsh

# Push for review
git push gerrit-d8rth HEAD:refs/for/master

# Authenticate with credentials from 1Password
# (automatically injected via .env file)
```

## File Structure

```
~/.lucia/vault/
├── config/
│   ├── vault.toml                    # Main LuciVault config (includes [servers])
│   └── servers/
│       ├── d8rth.yaml                # d8rth configuration
│       ├── r210.yaml                 # r210 configuration
│       ├── .env.d8rth.template       # d8rth env template (op:// protocol)
│       └── .env.r210.template        # r210 env template (op:// protocol)
├── scripts/
│   ├── upload-to-1password.sh        # Upload configs to 1Password
│   └── create-dagwood-hashnodes.py   # Create DAGwood hashnodes
├── README.md                          # LuciVault overview
├── SERVER_INTEGRATION_SUMMARY.md      # Server integration docs
└── GIX_JJ_GERRIT_INTEGRATION.md       # This file

/Volumes/tb4-d8a-space/lucitense/
├── gix-jj-gerrit-lucitense/          # VCS system
│   ├── crates/                       # Rust crates
│   ├── foundations/                  # Core infrastructure
│   ├── integrations/                 # External integrations
│   ├── justfile                      # Build commands
│   └── .env.example                  # Environment template
└── TRANSMUTED/
    └── dagwood/
        ├── hashnodes/                # 37,546 hashnode manifests
        ├── hashdag/
        │   └── INDEX.json            # Master hashdag index
        └── content/                   # Content-addressed storage
```

## SSH Configuration

From `~/.ssh/config`:

```ssh-config
Host d8rth
    HostName 192.168.1.195
    User daryl
    IdentitiesOnly yes
    IdentityFile ~/.ssh/d8rth_mac_key

Host r210
    HostName r210.local
    User truenas_admin
    IdentitiesOnly yes
    IdentityFile ~/.ssh/r210_key
```

## 1Password Secret References

All secrets use the `op://` protocol:

**Server Credentials:**
- `op://LuciVerse/d8rth TrueNAS/admin_password`
- `op://LuciVerse/d8rth TrueNAS/api_token`
- `op://LuciVerse/d8rth TrueNAS/gerrit_password`
- `op://LuciVerse/r210 TrueNAS/password`
- `op://LuciVerse/r210 TrueNAS/api_token`
- `op://LuciVerse/r210 TrueNAS/gerrit_password`

**SSH Keys:**
- `op://LuciVerse/d8rth SSH Private Key/private_key`
- `op://LuciVerse/r210 SSH Private Key/private_key`

**DAGwood:**
- `op://LuciVerse/DAGwood Signing Key/private_key`

**Global Secrets:**
- `op://LuciVerse/Genesis Bond Secret/secret`
- `op://LuciVerse/JWT Signing Key/key`
- `op://LuciVerse/Encryption Master Key/key`
- `op://LuciVerse/FoundationDB Cluster/cluster_file`

## Quick Reference

### Initialize Environment

```bash
# 1. Inject secrets from 1Password
op inject -i ~/.lucia/vault/config/servers/.env.d8rth.template \
          -o ~/.lucia/vault/config/servers/.env.d8rth

# 2. Source environment
source ~/.lucia/vault/config/servers/.env.d8rth

# 3. Verify environment variables
echo $GIX_JJ_WORKYARD
echo $DAGWOOD_ROOT
echo $SERVER_HOSTNAME
```

### Git Operations

```bash
# Check all remotes
git remote -v

# Push to specific remote
git push d8rth master

# Push to all remotes
git remote | xargs -L1 git push
```

### DAGwood Operations

```bash
# Create hashnodes for all configs
python3 ~/.lucia/vault/scripts/create-dagwood-hashnodes.py

# Resolve a hashnode
python3 ~/.lucia/dagwood/resolver.py 44e24fcf83e97cc4...
```

### 1Password Operations

```bash
# Upload all configs
~/.lucia/vault/scripts/upload-to-1password.sh

# Inject secrets into env file
op inject -i .env.template -o .env

# Read a secret directly
op read "op://LuciVerse/d8rth TrueNAS/api_token"
```

---

**Status:** ✅ Fully Integrated

gix-jj-gerrit VCS system is integrated with d8rth and r210 TrueNAS servers, DAGwood content-addressed storage, and 1Password secret management.

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 528 Hz · Coherence: 1.0
