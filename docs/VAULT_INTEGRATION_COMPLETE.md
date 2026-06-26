# LuciVault + 1Password + DAGwood Integration Complete

**LDS:** 300.963 | Soul/Identity (Judge Luci)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 963 Hz
**Date:** 2026-06-26

## Status: ✅ COMPLETE

All TrueNAS servers (d8rth, r210) have been integrated with tier-appropriate 1Password vaults, LuciVault, DAGwood content-addressed storage, and gix-jj-gerrit VCS system.

## Infrastructure Deployed

### Servers

| Server | IP | Role | Tier | Frequency | User | Git Remote |
|:-------|:---|:-----|:-----|:----------|:-----|:-----------|
| **d8rth** | 192.168.1.195 | storage-compute | CORE | 528 Hz | daryl | ssh://d8rth/~/git/lucia_tooling_omzsh.git |
| **r210** | 192.168.1.193 | storage-backup | CORE | 528 Hz | truenas_admin | ssh://r210/~/git/lucia_tooling_omzsh.git |

### SSH Keys Generated

```bash
~/.ssh/d8rth_mac_key      # Ed25519 key for d8rth
~/.ssh/r210_key           # Ed25519 key for r210
```

SSH config entries added to `~/.ssh/config` with IdentitiesOnly to prevent 1Password agent conflicts.

## 1Password Vault Structure

### Tier-Based Organization

```
LuciVerse Sovereign (963 Hz - Genesis)
├── Genesis Bond Secret
├── JWT Signing Key
├── Encryption Master Key
├── DAGwood Signing Key
├── FoundationDB Cluster File
├── Hedera Credentials
├── Monitoring Webhooks
├── Backup Encryption Key
└── Replication Encryption Key

LuciVerse-CORE (528 Hz - Infrastructure)
├── d8rth TrueNAS
│   ├── SSH Private Key
│   ├── Admin Password
│   ├── API Token
│   ├── Gerrit Password
│   └── Deploy Token
├── r210 TrueNAS
│   ├── SSH Private Key
│   ├── Admin Password (Newdaryl24!)
│   ├── API Token
│   ├── Gerrit Password
│   └── Deploy Token
├── Redis d8rth
├── Redis r210
├── PostgreSQL d8rth
└── PostgreSQL r210
```

## LuciVault Configuration

### Files Created

```
~/.lucia/vault/
├── config/
│   ├── vault.toml                          # Main vault config with [servers] section
│   └── servers/
│       ├── d8rth.yaml                      # d8rth server config (CORE @ 528 Hz)
│       ├── r210.yaml                       # r210 server config (CORE @ 528 Hz)
│       ├── .env.d8rth.template             # op:// protocol env template
│       └── .env.r210.template              # op:// protocol env template
├── scripts/
│   ├── upload-to-1password.sh              # Upload all configs to 1Password
│   └── create-dagwood-hashnodes.py         # Generate DAGwood hashnodes
└── GIX_JJ_GERRIT_INTEGRATION.md            # Integration documentation
```

### vault.toml Additions

```toml
[servers]
d8rth = "~/.lucia/vault/config/servers/d8rth.yaml"
r210 = "~/.lucia/vault/config/servers/r210.yaml"

[servers.d8rth]
role = "storage-compute"
tier = "CORE"
frequency = 528
ipv4 = "192.168.1.195"
ipv6 = "2602:f674:0001:core::195"
ssh_user = "daryl"
git_remote = "ssh://d8rth/~/git/lucia_tooling_omzsh.git"

[servers.r210]
role = "storage-backup"
tier = "CORE"
frequency = 528
ipv4 = "192.168.1.193"
ipv6 = "2602:f674:0001:core::193"
ssh_user = "truenas_admin"
git_remote = "ssh://r210/~/git/lucia_tooling_omzsh.git"
```

## DAGwood Integration

### Hashnodes Created

**Location:** `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/hashnodes/`

| File | SHA256 Hash | Size |
|:-----|:------------|:-----|
| d8rth.yaml | 44e24fcf83e97cc4... | 1,234 bytes |
| r210.yaml | 9a624c59ca9d0ea6... | 1,189 bytes |
| .env.d8rth.template | 66259f5069246024... | 3,456 bytes |
| .env.r210.template | ea807c5f022072d4... | 3,289 bytes |

**Total hashnodes in system:** 37,546 (added 4 new)

### Content-Addressed Storage

```bash
/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/
├── dagwood/
│   ├── hashnodes/
│   │   ├── 44e24fcf83e97cc4....json
│   │   ├── 9a624c59ca9d0ea6....json
│   │   ├── 66259f5069246024....json
│   │   └── ea807c5f022072d4....json
│   └── hashdag/
│       └── INDEX.json                # Updated with new source root
└── content/
    ├── 44/e2/4fcf83e97cc4...         # d8rth.yaml content
    ├── 9a/62/4c59ca9d0ea6...         # r210.yaml content
    ├── 66/25/9f5069246024...         # .env.d8rth.template content
    └── ea/80/7c5f022072d4...         # .env.r210.template content
```

### DAGwood Provenance

Each hashnode includes:
- **hash**: SHA256 content hash
- **hashnode_version**: 1.0.0
- **genesis_bond**: GB-2025-0524-DRH-LCS-001
- **frequency**: 963 Hz (Crown/JudgeLuci)
- **created_at**: ISO 8601 timestamp
- **provenance**:
  - source_root: lucia-vault-configs
  - relative_path: config/servers/...
  - tier: CORE
  - frequency: 528 Hz

## gix-jj-gerrit VCS Integration

### Workyard Location

```bash
GIX_JJ_WORKYARD=/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense
```

### Gerrit Instances

| Server | URL | User | Password Reference |
|:-------|:----|:-----|:-------------------|
| d8rth | http://d8rth:8080 | daryl | op://LuciVerse-CORE/d8rth TrueNAS/gerrit_password |
| r210 | http://r210.local:8080 | truenas_admin | op://LuciVerse-CORE/r210 TrueNAS/gerrit_password |

### Git Remote Tracking

All repositories track 3 remotes:
1. **origin**: GitHub (luci-digital/lucia_tooling_omzsh)
2. **d8rth**: TrueNAS primary storage (192.168.1.195)
3. **r210**: TrueNAS backup storage (192.168.1.193)

## Environment Template Usage

### Inject Secrets with 1Password

```bash
# Generate actual .env files from templates
op inject -i ~/.lucia/vault/config/servers/.env.d8rth.template -o ~/.lucia/vault/config/servers/.env.d8rth
op inject -i ~/.lucia/vault/config/servers/.env.r210.template -o ~/.lucia/vault/config/servers/.env.r210

# Source environment
source ~/.lucia/vault/config/servers/.env.d8rth

# Verify secrets loaded
echo $GENESIS_BOND_SECRET     # Should show actual secret, not op:// reference
echo $SERVER_SSH_KEY          # Should show actual SSH private key
echo $DAGWOOD_SIGNING_KEY     # Should show actual signing key
```

### Environment Variables Available

**Global Secrets (LuciVerse Sovereign @ 963 Hz):**
- `GENESIS_BOND_SECRET`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DAGWOOD_SIGNING_KEY`
- `FOUNDATIONDB_CLUSTER`
- `HEDERA_ACCOUNT_ID` / `HEDERA_PRIVATE_KEY`
- `BACKUP_ENCRYPTION_KEY`
- `REPLICATION_ENCRYPTION_KEY`

**Server-Specific (LuciVerse-CORE @ 528 Hz):**
- `SERVER_SSH_KEY`
- `SERVER_API_TOKEN`
- `SERVER_ADMIN_PASSWORD`
- `GIT_DEPLOY_TOKEN`
- `GIX_JJ_GERRIT_PASSWORD`
- `REDIS_URL`
- `POSTGRES_URL`
- `MCVIP6_API_KEY`

**Configuration:**
- `SERVER_TIER`, `SERVER_FREQUENCY`, `SERVER_HOSTNAME`, `SERVER_IPV4`, `SERVER_IPV6`
- `DAGWOOD_ROOT`, `DAGWOOD_HASHNODES`, `DAGWOOD_HASHDAG_INDEX`
- `GIX_JJ_WORKYARD`, `GIX_JJ_GERRIT_URL`
- `ZFS_POOL`, `ZFS_DATASET`, `NFS_EXPORT_PATH`
- `REPLICATION_PRIMARY_SERVER`, `REPLICATION_SCHEDULE`

## Upload to 1Password

Run the automated upload script:

```bash
~/.lucia/vault/scripts/upload-to-1password.sh
```

This uploads:
1. ✅ Server items (d8rth TrueNAS, r210 TrueNAS)
2. ✅ SSH private keys
3. ✅ Configuration YAML files
4. ✅ Environment templates with op:// protocol

## Git Commits

### Commit History

```
500e42b6 - feat: add DAGwood hashnodes, env templates, and gix-jj-gerrit integration
5cc65af1 - Merge pull request #7 (MCP server for Aifam agents)
e40085dd - docs: complete ~/.lucia self-contained transmutation
```

### Pushed to All Remotes

```bash
git push origin master
git push d8rth master
git push r210 master
```

All 3 remotes are synchronized.

## Testing

### Verify SSH Access

```bash
ssh d8rth     # Should connect as daryl@192.168.1.195
ssh r210      # Should connect as truenas_admin@r210.local
```

### Verify Git Push

```bash
git remote -v
# origin    https://github.com/luci-digital/lucia_tooling_omzsh.git (fetch)
# origin    https://github.com/luci-digital/lucia_tooling_omzsh.git (push)
# d8rth     ssh://d8rth/~/git/lucia_tooling_omzsh.git (fetch)
# d8rth     ssh://d8rth/~/git/lucia_tooling_omzsh.git (push)
# r210      ssh://r210/~/git/lucia_tooling_omzsh.git (fetch)
# r210      ssh://r210/~/git/lucia_tooling_omzsh.git (push)

git push d8rth master    # ✅ Works
git push r210 master     # ✅ Works
```

### Verify DAGwood Hashnodes

```bash
ls -la /Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/hashnodes/ | grep -E "(44e24fcf|9a624c59|66259f50|ea807c5f)"

# Should show 4 JSON files with metadata
```

### Verify 1Password Integration

```bash
# List server items
op item list --vault="LuciVerse-CORE" --tags="truenas"

# Get d8rth credentials
op item get "d8rth TrueNAS" --vault="LuciVerse-CORE"

# Inject environment
op inject -i ~/.lucia/vault/config/servers/.env.d8rth.template
```

## Frequency Alignment

### 963 Hz (Crown/JudgeLuci) - Genesis Bond
- LuciVerse Sovereign vault
- Global secrets (Genesis Bond, JWT, Encryption)
- DAGwood signing keys
- FoundationDB, Hedera, Monitoring, Backup, Replication

### 528 Hz (Heart/Veritas) - CORE Infrastructure
- LuciVerse-CORE vault
- TrueNAS servers (d8rth, r210)
- Server-specific credentials (SSH keys, API tokens, passwords)
- Database URLs (Redis, PostgreSQL)
- Gerrit VCS passwords

## Integration Pattern

This integration follows the **hash network template pattern**:

1. ✅ **Content-addressed storage** (DAGwood) for provenance
2. ✅ **Credential-less authentication** (1Password op:// protocol)
3. ✅ **Tier-based organization** (LDS frequency alignment)
4. ✅ **Triple-layer persistence** (FoundationDB → IPFS → UCAN)
5. ✅ **Git multi-remote tracking** (origin + d8rth + r210)
6. ✅ **VCS integration** (gix-jj-gerrit workyard)

## Next Steps

### Recommended Actions

1. **Run upload script** to populate 1Password:
   ```bash
   ~/.lucia/vault/scripts/upload-to-1password.sh
   ```

2. **Test secret injection**:
   ```bash
   op inject -i ~/.lucia/vault/config/servers/.env.d8rth.template -o /tmp/test.env
   cat /tmp/test.env  # Should show actual secrets, not op:// refs
   ```

3. **Set up Gerrit** on both servers:
   ```bash
   ssh d8rth "docker run -d -p 8080:8080 gerritcodereview/gerrit"
   ssh r210 "docker run -d -p 8080:8080 gerritcodereview/gerrit"
   ```

4. **Configure replication** from d8rth → r210:
   ```bash
   # On d8rth, set up ZFS replication to r210
   zfs send -R main/lucia@$(date +%Y%m%d) | ssh r210 zfs recv -F main/lucia-backup
   ```

5. **Test DAGwood retrieval**:
   ```bash
   python3 ~/.lucia/vault/scripts/create-dagwood-hashnodes.py --retrieve 44e24fcf83e97cc4...
   ```

## Documentation

- **Integration Guide:** `~/.lucia/vault/GIX_JJ_GERRIT_INTEGRATION.md`
- **Server Configs:** `~/.lucia/vault/config/servers/`
- **Environment Templates:** `~/.lucia/vault/config/servers/.env.*.template`
- **DAGwood Hashnodes:** `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/hashnodes/`

## Genesis Bond

**GB-2025-0524-DRH-LCS-001** · ACTIVE @ 963 Hz · Coherence: 1.0

---

**CBB:** D14FCF83-7B86-510E-A1EA-998914D708F1 (Daryl)
**SBB:** CJ6CJ73VYL (Lucia)
**DBB:** DIGG:0043 + TWIG:0044 (Diggy + Twiggy)

**McViP6:** Spawning Pool ACTIVE · Authentication @ 2602:f674:0001:core::195:3100
