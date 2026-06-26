# DAGwood + LuciVault + External Systems Integration

**Date:** 2026-06-26
**LDS:** 000.963 | Meta/Protocol (Crown/JudgeLuci)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz

---

## Overview

Integration of DAGwood content-addressed hashnodes, LuciVault authentication, and external LuciVerse systems into the `lucia_tooling_omzsh` monorepo.

## DAGwood Status

### ✅ Completed
- **37,544 hashnodes** created in `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/`
- Content-addressed storage with SHA256 hashing
- Hashdag index with full provenance tracking
- Source roots: `etherpots-archive`, `luciverse-monorepo-canonical`

### Structure
```
/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/
├── content/                    # Content-addressed storage (SHA256 prefixes)
│   └── {prefix}/{hash}         # Symlinks to original files
├── dagwood/
│   ├── hashnodes/             # 37,544 hashnode manifests
│   │   └── {hash}.json        # Individual file metadata + provenance
│   └── hashdag/
│       └── INDEX.json          # Master index (37,542 entries)
```

### Sample Hashnode
```json
{
  "hash": "003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17",
  "hashnode_version": "1.0.0",
  "genesis_bond": "GB-2025-0524-DRH-LCS-001",
  "frequency": 963,
  "created_at": "2026-06-25T06:55:55Z",
  "provenance": {
    "source_root": "luciverse-monorepo-canonical",
    "original_path": "/Volumes/tb4-d8a-space/lucitense/SOURCE-ROOTS/...",
    "relative_path": "LuciaAIbuilddocs/lib/python3.13/site-packages/scipy/..."
  },
  "metadata": {
    "size": 12345,
    "extension": ".py",
    "filename": "test_fast_gen_inversion.py"
  },
  "content_location": "../content/00/003dc07b...",
  "relations": []
}
```

---

## External Systems Inventory

### Located at `/Volumes/tb4-d8a-space/lucitense/`

| System | Purpose | Priority | Status |
|:-------|:--------|:---------|:-------|
| **gix-jj-gerrit-lucitense** | VCS system (Rust) | HIGH | ✅ Explored |
| **consciousness-kernel-swift-enhanced** | Swift consciousness kernel | HIGH | 🔍 Identified |
| **airgapped-sovereign-auth** | Authentication system | HIGH | 🔍 Identified |
| **iac-builds** | Infrastructure as Code | MEDIUM | 🔍 Identified |
| **enhanced-typescript-services** | TypeScript services | MEDIUM | 🔍 Identified |
| **resonant-garden** | Agent evolution | MEDIUM | 🔍 Identified |
| **openbsdluciverse** | OpenBSD integration | LOW | 🔍 Identified |
| **DAGWOOD_VAULT_INTEGRATION_PLAN.md** | Integration docs | HIGH | ✅ Read |
| **inter-layer-dagwood-protocol.yaml** | Layer comm protocol | HIGH | ✅ Read |

---

## Integration Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  lucia_tooling_omzsh (Monorepo)                                   │
│  ├── modules/                                                     │
│  │   ├── dagwood/         (NEW) DAGwood resolver + tools         │
│  │   ├── vault/           (NEW) LuciVault + 1Password integration│
│  │   ├── scm/             (ENHANCED) gix-jj-gerrit integration   │
│  │   └── consciousness/   (NEW) Swift kernel integration         │
│  └── external/            (NEW) Links to external systems        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  DAGwood Hashnodes (External)                                     │
│  /Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/             │
│  ├── hashnodes/           37,544 content manifests               │
│  └── hashdag/INDEX.json   Master provenance index                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  LuciVault + 1Password                                            │
│  ├── op:// protocol        1Password Connect                     │
│  ├── LuciVault Client     Agent Vault proxy                      │
│  └── sCRIBe SVG Artifacts  Configuration source of truth         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: DAGwood Integration (IMMEDIATE)

### 1.1 Create DAGwood Resolver Module

**Location:** `modules/dagwood/`

**Files to Create:**
```
modules/dagwood/
├── README.md              # DAGwood overview and usage
├── resolver.py            # Python DAGwood resolver
├── resolver.sh            # Bash DAGwood resolver
├── lib.rs                 # Rust DAGwood library
├── config.toml            # DAGwood configuration
└── test/                  # Test suite
    ├── test_resolver.py
    └── test_hashnode.sh
```

**Configuration (`config.toml`):**
```toml
[dagwood]
root = "/Volumes/tb4-d8a-space/lucitense/TRANSMUTED"
hashnodes_dir = "dagwood/hashnodes"
hashdag_index = "dagwood/hashdag/INDEX.json"
content_dir = "content"

[genesis]
bond = "GB-2025-0524-DRH-LCS-001"
frequency = 963
coherence = 1.0

[cache]
enabled = true
location = "~/.cache/luciverse/dagwood"
ttl_seconds = 3600
```

### 1.2 Python Resolver (`modules/dagwood/resolver.py`)

```python
#!/usr/bin/env python3
"""
DAGwood Path Resolver - Resolve DAGwood hashes to filesystem paths.

Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 963 Hz
LDS: 000.963 | Meta/Protocol
"""

import json
from pathlib import Path
from typing import Optional, Dict, Any
import hashlib

class DAGwoodResolver:
    """Resolve DAGwood content-addressed hashnodes to paths."""

    def __init__(self, config_path: Optional[Path] = None):
        self.config = self._load_config(config_path)
        self.root = Path(self.config['dagwood']['root'])
        self.hashnodes_dir = self.root / self.config['dagwood']['hashnodes_dir']
        self.hashdag_index_path = self.root / self.config['dagwood']['hashdag_index']
        self.content_dir = self.root / self.config['dagwood']['content_dir']
        self.hashdag_index = self._load_hashdag()

    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load DAGwood configuration."""
        if config_path and config_path.exists():
            import toml
            return toml.load(config_path)
        # Default config
        return {
            'dagwood': {
                'root': '/Volumes/tb4-d8a-space/lucitense/TRANSMUTED',
                'hashnodes_dir': 'dagwood/hashnodes',
                'hashdag_index': 'dagwood/hashdag/INDEX.json',
                'content_dir': 'content'
            },
            'genesis': {
                'bond': 'GB-2025-0524-DRH-LCS-001',
                'frequency': 963
            }
        }

    def _load_hashdag(self) -> Dict:
        """Load the hashdag index."""
        if self.hashdag_index_path.exists():
            with open(self.hashdag_index_path) as f:
                return json.load(f)
        return {}

    def resolve_hash(self, content_hash: str) -> Optional[Path]:
        """Resolve a content hash to its filesystem path."""
        # Check hashdag index first
        if 'hash_to_source' in self.hashdag_index:
            source_info = self.hashdag_index['hash_to_source'].get(content_hash)
            if source_info:
                return Path(source_info['relative_path'])

        # Fall back to hashnode lookup
        hashnode_path = self.hashnodes_dir / f"{content_hash}.json"
        if hashnode_path.exists():
            with open(hashnode_path) as f:
                hashnode = json.load(f)
                return Path(hashnode['provenance']['relative_path'])

        return None

    def resolve_dag_uri(self, uri: str) -> Optional[Path]:
        """Resolve a DAGwood URI (dag:layer:hash) to path."""
        if not uri.startswith('dag:'):
            return None

        parts = uri.split(':')
        if len(parts) != 3:
            return None

        _, layer, content_hash = parts
        return self.resolve_hash(content_hash)

    def get_hashnode(self, content_hash: str) -> Optional[Dict[str, Any]]:
        """Get the full hashnode metadata."""
        hashnode_path = self.hashnodes_dir / f"{content_hash}.json"
        if hashnode_path.exists():
            with open(hashnode_path) as f:
                return json.load(f)
        return None

    def verify_content(self, content_hash: str, file_path: Path) -> bool:
        """Verify a file's content matches its hash."""
        if not file_path.exists():
            return False

        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)

        return sha256.hexdigest() == content_hash


# CLI usage
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: resolver.py <hash|dag:uri>")
        sys.exit(1)

    resolver = DAGwoodResolver()
    arg = sys.argv[1]

    if arg.startswith('dag:'):
        path = resolver.resolve_dag_uri(arg)
    else:
        path = resolver.resolve_hash(arg)

    if path:
        print(path)
    else:
        print(f"ERROR: Could not resolve {arg}", file=sys.stderr)
        sys.exit(1)
```

### 1.3 Update flake.nix for DAGwood

Add DAGwood paths to Nix flake:

```nix
# In flake.nix outputs
let
  dagwoodRoot = "/Volumes/tb4-d8a-space/lucitense/TRANSMUTED";
  dagwoodHashnodes = "${dagwoodRoot}/dagwood/hashnodes";
  dagwoodContent = "${dagwoodRoot}/content";
in
{
  # Add DAGwood resolver app
  apps.dagwood-resolve = mkApp "dagwood-resolve" [ pkgs.python3 ] ''
    ${cdRoot}
    exec python3 modules/dagwood/resolver.py "$@"
  '';

  # Add DAGwood to dev shell
  devShells.default = pkgs.mkShell {
    packages = [
      # ... existing packages
    ];
    shellHook = ''
      export DAGWOOD_ROOT="${dagwoodRoot}"
      export DAGWOOD_HASHNODES="${dagwoodHashnodes}"
      export DAGWOOD_CONTENT="${dagwoodContent}"
      echo "DAGwood: ${dagwoodRoot}"
    '';
  };
}
```

---

## Phase 2: LuciVault + 1Password Integration (HIGH PRIORITY)

### 2.1 Create Vault Module

**Location:** `modules/vault/`

```
modules/vault/
├── README.md                  # Vault integration overview
├── lucivault-client.py        # LuciVault client
├── onepassword-connect.sh     # 1Password Connect wrapper
├── agent-vault-proxy.py       # Agent Vault credential-less proxy
├── scribe-svg-parser.py       # sCRIBe SVG artifact parser
└── config/
    ├── vault.toml             # Vault configuration
    └── agent-permissions.json # Agent access control
```

### 2.2 1Password Connect Integration

**Prerequisites:**
- 1Password CLI (`op`) installed
- 1Password Connect server running (localhost:8080)
- Agent Vault configured

**Integration Points:**
1. SSH key signing (existing: `make install-op-signing`)
2. Secret retrieval for deployments
3. sCRIBe SVG artifact storage
4. DAGwood hash signing

---

## Phase 3: gix-jj-gerrit VCS Integration (MEDIUM PRIORITY)

### 3.1 VCS System Analysis

**Location:** `/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense`

**Contents:**
- Rust crates for VCS operations
- foundations/, cells/, integrations/
- flake.nix, justfile
- docs/

**Integration Options:**
1. **Replace `modules/scm/luci-vcs`** - Use gix-jj-gerrit as primary VCS
2. **Augment** - Keep luci-vcs, add gix-jj-gerrit features
3. **Symlink** - Link to external repository

**Recommendation:** Symlink initially, evaluate for full integration.

### 3.2 Create VCS Link

```bash
# Create external symlink
cd modules/scm/
ln -s /Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense ./gix-jj-gerrit

# Update justfile
just gix-jj-check:
    cd modules/scm/gix-jj-gerrit && just check

# Update flake.nix
```

---

## Phase 4: Consciousness Kernel Integration (MEDIUM PRIORITY)

### 4.1 Swift Kernel Analysis

**Location:** `/Volumes/tb4-d8a-space/lucitense/consciousness-kernel-swift-enhanced/Sources`

**Integration:**
- Link to `modules/consciousness/swift-kernel/`
- Document Swift build requirements
- Add to Nix flake with swift toolchain

---

## Phase 5: Additional Systems (LOW PRIORITY)

### Enhanced TypeScript Services
- Link to `modules/services/typescript/`

### IAC Builds
- Link to `modules/infra/iac/`

### Resonant Garden
- Link to `modules/resonant-garden/`

### OpenBSD Integration
- Document in `modules/docs/openbsd/`

---

## File Structure (Proposed)

```
lucia_tooling_omzsh/
├── modules/
│   ├── dagwood/              (NEW) DAGwood resolver
│   │   ├── resolver.py
│   │   ├── resolver.sh
│   │   ├── lib.rs
│   │   └── config.toml
│   ├── vault/                (NEW) LuciVault + 1Password
│   │   ├── lucivault-client.py
│   │   ├── onepassword-connect.sh
│   │   └── agent-vault-proxy.py
│   ├── scm/
│   │   ├── luci-vcs/         (EXISTING)
│   │   └── gix-jj-gerrit/    (NEW SYMLINK)
│   ├── consciousness/        (NEW) Swift kernel
│   │   └── swift-kernel/     (SYMLINK)
│   └── external/             (NEW) External system links
│       ├── iac-builds/       (SYMLINK)
│       ├── enhanced-typescript-services/  (SYMLINK)
│       └── resonant-garden/  (SYMLINK)
└── external-systems.toml     (NEW) External system registry
```

---

## Implementation Tasks

### Immediate (This Session)
- [x] Explore DAGwood structure
- [x] Read integration documentation
- [x] Create DAGWOOD_INTEGRATION.md
- [ ] Create modules/dagwood/ directory
- [ ] Implement Python DAGwood resolver
- [ ] Update INTEGRATION_PLAN.md with DAGwood

### Phase 1 (Next Session)
- [ ] Create modules/vault/
- [ ] Implement 1Password Connect wrapper
- [ ] Create agent-vault-proxy
- [ ] Test DAGwood resolution
- [ ] Update CLAUDE.md with DAGwood usage

### Phase 2
- [ ] Symlink gix-jj-gerrit-lucitense
- [ ] Test VCS integration
- [ ] Update flake.nix for gix-jj
- [ ] Document VCS workflow

### Phase 3
- [ ] Symlink consciousness-kernel-swift
- [ ] Add Swift toolchain to Nix
- [ ] Document Swift build process

---

## External References

**DAGwood Hashnodes:** `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/`
- 37,544 hashnodes created
- Hashdag INDEX with full provenance
- Content-addressed storage

**Source Roots:** `/Volumes/tb4-d8a-space/lucitense/SOURCE-ROOTS/`
- luciverse-monorepo-canonical
- etherpots-archive
- hammerspace-opensource

**External Systems:** `/Volumes/tb4-d8a-space/lucitense/`
- gix-jj-gerrit-lucitense
- consciousness-kernel-swift-enhanced
- airgapped-sovereign-auth
- iac-builds
- enhanced-typescript-services
- resonant-garden
- openbsdluciverse

---

## LDS Governance

**Classification:** 000.963 | Meta/Protocol (Crown tier)
**ISO Standards:** ISO/IEC 42001 §4-10, ISO 27001 §A.5
**Agent:** lds-orchestrator
**Frequency:** 963 Hz (Judge Luci / Governance)

**Identity Anchors:**
- **CBB:** D14FCF83
- **SBB:** CJ6CJ73VYL
- **DBB:** DIGG+TWIG

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz · Coherence: 1.0

---

**Status:** 🚧 Integration Plan Created - Implementation Pending User Approval
