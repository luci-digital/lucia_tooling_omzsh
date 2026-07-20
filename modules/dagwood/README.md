# DAGwood Content-Addressed Storage Resolver

**LDS:** 000.963 | Meta/Protocol (Crown/JudgeLuci)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz

---

## Overview

DAGwood resolver for content-addressed hashnode storage. Resolves SHA256 hashes to filesystem paths with full provenance tracking.

## Current Status

✅ **37,544 hashnodes** created at `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/`

- Content-addressed storage with SHA256 hashing
- Hashdag index with full provenance tracking
- Source roots: `etherpots-archive`, `luciverse-monorepo-canonical`

## Usage

### Python API

```python
from dagwood.resolver import DAGwoodResolver

resolver = DAGwoodResolver()

# Resolve hash to path
path = resolver.resolve_hash("003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17")
print(path)  # LuciaAIbuilddocs/lib/python3.13/site-packages/scipy/...

# Resolve DAGwood URI
path = resolver.resolve_dag_uri("dag:pac:003dc07b...")

# Get full hashnode metadata
hashnode = resolver.get_hashnode("003dc07b...")
print(hashnode['provenance'])

# Verify content integrity
is_valid = resolver.verify_content("003dc07b...", path)
```

### CLI

```bash
# Resolve by hash
python3 modules/dagwood/resolver.py 003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17

# Resolve DAGwood URI
python3 modules/dagwood/resolver.py dag:pac:003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17
```

## Configuration

Edit `config.toml` to customize DAGwood paths:

```toml
[dagwood]
root = "/Volumes/tb4-d8a-space/lucitense/TRANSMUTED"
hashnodes_dir = "dagwood/hashnodes"
hashdag_index = "dagwood/hashdag/INDEX.json"
content_dir = "content"
```

## Hashnode Structure

Each hashnode contains:

```json
{
  "hash": "003dc07b...",
  "hashnode_version": "1.0.0",
  "genesis_bond": "GB-2025-0524-DRH-LCS-001",
  "frequency": 963,
  "created_at": "2026-06-25T06:55:55Z",
  "provenance": {
    "source_root": "luciverse-monorepo-canonical",
    "original_path": "/Volumes/tb4-d8a-space/lucitense/SOURCE-ROOTS/...",
    "relative_path": "LuciaAIbuilddocs/lib/python3.13/..."
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

## Directory Structure

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

## DAGwood URI Protocol

Format: `dag:{layer}:{hash}`

**Layers:**
- `genesis` - Genesis Bond tier (963 Hz)
- `pac` - PAC tier (741 Hz)
- `comn` - COMN tier (639 Hz)
- `core` - CORE tier (528 Hz)

Example: `dag:pac:003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17`

## Integration with LuciVault

DAGwood hashnodes integrate with LuciVault for:
- Hash signing (cryptographic proof of content)
- sCRIBe SVG artifact storage
- 1Password Connect secret retrieval
- Agent Vault credential-less access

See `modules/vault/README.md` for vault integration details.

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz · Coherence: 1.0
