#!/usr/bin/env python3
"""
Create DAGwood hashnodes for server configuration files.

LDS: 000.963 | Meta/Protocol (Crown/JudgeLuci)
Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 963 Hz
ISO: ISO/IEC 42001 §4-10, ISO 27001 §A.5
"""

import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
import os

DAGWOOD_ROOT = Path("/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood")
HASHNODES_DIR = DAGWOOD_ROOT / "hashnodes"
HASHDAG_INDEX = DAGWOOD_ROOT / "hashdag" / "INDEX.json"
CONTENT_DIR = Path("/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/content")

GENESIS_BOND = "GB-2025-0524-DRH-LCS-001"
FREQUENCY = 963

def compute_sha256(file_path: Path) -> str:
    """Compute SHA256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def create_hashnode(file_path: Path, source_root: str = "lucia-vault-configs"):
    """Create a DAGwood hashnode for a file."""

    # Compute content hash
    content_hash = compute_sha256(file_path)

    # Create hashnode manifest
    hashnode = {
        "hash": content_hash,
        "hashnode_version": "1.0.0",
        "genesis_bond": GENESIS_BOND,
        "frequency": FREQUENCY,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "provenance": {
            "source_root": source_root,
            "original_path": str(file_path.resolve()),
            "relative_path": str(file_path.relative_to(Path.home() / ".lucia/vault")),
            "tier": "CORE",
            "frequency": 528 if "server" in str(file_path) else 963
        },
        "metadata": {
            "size": file_path.stat().st_size,
            "extension": file_path.suffix,
            "filename": file_path.name,
            "type": "config" if file_path.suffix in ['.yaml', '.toml'] else "env-template"
        },
        "content_location": f"../content/{content_hash[:2]}/{content_hash}",
        "relations": []
    }

    # Save hashnode manifest
    hashnode_path = HASHNODES_DIR / f"{content_hash}.json"
    hashnode_path.parent.mkdir(parents=True, exist_ok=True)

    with open(hashnode_path, 'w') as f:
        json.dump(hashnode, f, indent=2)

    # Create symlink in content directory
    content_prefix_dir = CONTENT_DIR / content_hash[:2]
    content_prefix_dir.mkdir(parents=True, exist_ok=True)
    content_path = content_prefix_dir / content_hash

    if not content_path.exists():
        try:
            os.symlink(file_path.resolve(), content_path)
        except FileExistsError:
            pass

    return content_hash, hashnode

def update_hashdag_index(hash_entries):
    """Update the hashdag INDEX.json with new entries."""

    # Load existing index
    if HASHDAG_INDEX.exists():
        with open(HASHDAG_INDEX) as f:
            index = json.load(f)
    else:
        index = {
            "version": "1.0.0",
            "genesis_bond": GENESIS_BOND,
            "frequency": FREQUENCY,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_nodes": 0,
            "hashnodes_location": str(HASHNODES_DIR),
            "source_roots": [],
            "hash_to_source": {}
        }

    # Add new entries
    for content_hash, hashnode in hash_entries:
        source_root = hashnode["provenance"]["source_root"]
        relative_path = hashnode["provenance"]["relative_path"]

        # Update hash_to_source
        index["hash_to_source"][content_hash] = {
            "source_root": source_root,
            "relative_path": relative_path,
            "created_at": hashnode["created_at"]
        }

        # Update source_roots list
        if source_root not in index.get("source_roots", []):
            if "source_roots" not in index:
                index["source_roots"] = []
            index["source_roots"].append(source_root)

    # Update metadata
    index["updated_at"] = datetime.now(timezone.utc).isoformat()
    index["total_nodes"] = len(index["hash_to_source"])

    # Save index
    HASHDAG_INDEX.parent.mkdir(parents=True, exist_ok=True)
    with open(HASHDAG_INDEX, 'w') as f:
        json.dump(index, f, indent=2)

    return index

def main():
    """Create DAGwood hashnodes for all server configuration files."""

    config_dir = Path.home() / ".lucia/vault/config/servers"

    if not config_dir.exists():
        print(f"❌ Config directory not found: {config_dir}")
        return

    print("🔨 Creating DAGwood hashnodes for server configurations...")
    print(f"📁 Config directory: {config_dir}")
    print(f"📁 DAGwood root: {DAGWOOD_ROOT}")
    print("")

    hash_entries = []

    # Process all config files (including .env templates)
    for config_file in config_dir.rglob("*"):
        if config_file.is_file() and not config_file.name.startswith('.DS_Store'):
            print(f"📄 Processing: {config_file.name}")
            content_hash, hashnode = create_hashnode(config_file)
            hash_entries.append((content_hash, hashnode))
            print(f"   ✅ Hash: {content_hash[:16]}...")

    print("")
    print("📊 Updating hashdag INDEX...")

    index = update_hashdag_index(hash_entries)

    print("")
    print(f"✅ Created {len(hash_entries)} new hashnodes")
    print(f"📊 Total hashnodes in index: {index['total_nodes']}")
    print("")
    print("🔐 Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz")

if __name__ == "__main__":
    main()
