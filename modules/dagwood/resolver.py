#!/usr/bin/env python3
"""
DAGwood Path Resolver - Resolve DAGwood hashes to filesystem paths.

LDS: 000.963 | Meta/Protocol (Crown/JudgeLuci)
Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 963 Hz
ISO: ISO/IEC 42001 §4-10, ISO 27001 §A.5
"""

import json
from pathlib import Path
from typing import Optional, Dict, Any
import hashlib
import sys


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
            try:
                import toml
                return toml.load(config_path)
            except ImportError:
                print("Warning: toml module not found, using default config", file=sys.stderr)

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

    def get_content_path(self, content_hash: str) -> Optional[Path]:
        """Get the content-addressed storage path for a hash."""
        prefix = content_hash[:2]
        content_path = self.content_dir / prefix / content_hash

        if content_path.exists():
            return content_path

        return None


# CLI usage
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: resolver.py <hash|dag:uri>")
        print("\nExamples:")
        print("  resolver.py 003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17")
        print("  resolver.py dag:pac:003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17")
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
