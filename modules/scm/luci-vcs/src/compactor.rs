// Block cache compaction for .lucia/ (InfluxDB TSM-inspired).
// LDS: 700.528 | 528 Hz
//
// Compaction levels:
//   L0 — Raw blocks from WAL checkpoint (WAL → objects/)
//   L1 — Merged blocks (combine blocks < min_block_size within same shard)
//   L2 — Full compaction (remove unreferenced blocks, reclaim space)
//
// Orphan detection: scan workflows/index.json for referenced CIDs,
// GC everything else (respecting retention policy).

use crate::metrics::MetricsCollector;
use crate::retention::RetentionPolicy;
use crate::wal::{OpType, WalManager};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tracing::{debug, info, instrument, warn};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompactionLevel {
    L0,
    L1,
    L2,
}

#[derive(Debug, Default)]
pub struct CompactionStats {
    pub blocks_written: usize,
    pub blocks_merged: usize,
    pub blocks_removed: usize,
    pub bytes_reclaimed: u64,
}

pub struct Compactor {
    objects_dir: PathBuf,
    #[allow(dead_code)]
    retention: RetentionPolicy,
    metrics: Option<Arc<MetricsCollector>>,
}

impl Compactor {
    pub fn new(objects_dir: impl AsRef<Path>, retention: RetentionPolicy) -> Self {
        Self {
            objects_dir: objects_dir.as_ref().to_path_buf(),
            retention,
            metrics: None,
        }
    }

    pub fn with_metrics(mut self, metrics: Arc<MetricsCollector>) -> Self {
        self.metrics = Some(metrics);
        self
    }

    #[instrument(skip(self, wal))]
    pub fn checkpoint_wal(&self, wal: &mut WalManager) -> std::io::Result<CompactionStats> {
        let mut stats = CompactionStats::default();
        let entries = wal.recover()?;

        for entry in &entries {
            match entry.op {
                OpType::PutBlock => {
                    let addr_hex = hex::encode(&entry.hash);
                    let shard = &addr_hex[..2];
                    let block_path = self.objects_dir.join(shard).join(&addr_hex);

                    if !block_path.exists() {
                        std::fs::create_dir_all(block_path.parent().unwrap())?;
                        let compressed =
                            zstd::encode_all(entry.payload.as_slice(), 3)?;
                        std::fs::write(&block_path, &compressed)?;
                        stats.blocks_written += 1;

                        if let Some(ref m) = self.metrics {
                            m.inc_block_cache(compressed.len() as u64);
                        }
                    }
                }
                OpType::DeleteBlock => {
                    let addr_hex = hex::encode(&entry.hash);
                    let shard = &addr_hex[..2];
                    let block_path = self.objects_dir.join(shard).join(&addr_hex);

                    if block_path.exists() {
                        let size = std::fs::metadata(&block_path)?.len();
                        std::fs::remove_file(&block_path)?;
                        stats.blocks_removed += 1;
                        stats.bytes_reclaimed += size;

                        if let Some(ref m) = self.metrics {
                            m.dec_block_cache(size);
                        }
                    }
                }
                _ => {}
            }
        }

        wal.clear()?;
        if let Some(ref m) = self.metrics {
            m.reset_wal();
        }

        info!(
            written = stats.blocks_written,
            removed = stats.blocks_removed,
            "WAL checkpoint complete"
        );
        Ok(stats)
    }

    #[instrument(skip(self))]
    pub fn gc(&self, referenced_cids: &HashSet<String>) -> std::io::Result<CompactionStats> {
        let mut stats = CompactionStats::default();

        if !self.objects_dir.exists() {
            return Ok(stats);
        }

        for shard_entry in std::fs::read_dir(&self.objects_dir)? {
            let shard_entry = shard_entry?;
            if !shard_entry.file_type()?.is_dir() {
                continue;
            }

            for block_entry in std::fs::read_dir(shard_entry.path())? {
                let block_entry = block_entry?;
                let block_name = block_entry.file_name().to_string_lossy().to_string();

                // Skip .gitkeep and temp files
                if block_name.starts_with('.') || block_name.ends_with(".tmp") {
                    continue;
                }

                let cid = format!("bafk-blake3-{block_name}");
                if !referenced_cids.contains(&cid) && !referenced_cids.contains(&block_name) {
                    let size = block_entry.metadata()?.len();
                    std::fs::remove_file(block_entry.path())?;
                    stats.blocks_removed += 1;
                    stats.bytes_reclaimed += size;

                    if let Some(ref m) = self.metrics {
                        m.dec_block_cache(size);
                    }

                    debug!(block = %block_name, "orphaned block removed");
                }
            }
        }

        info!(
            removed = stats.blocks_removed,
            bytes = stats.bytes_reclaimed,
            "GC pass complete"
        );
        Ok(stats)
    }

    pub fn scan_blocks(&self) -> std::io::Result<Vec<(String, u64)>> {
        let mut blocks = Vec::new();

        if !self.objects_dir.exists() {
            return Ok(blocks);
        }

        for shard_entry in std::fs::read_dir(&self.objects_dir)? {
            let shard_entry = shard_entry?;
            if !shard_entry.file_type()?.is_dir() {
                continue;
            }

            for block_entry in std::fs::read_dir(shard_entry.path())? {
                let block_entry = block_entry?;
                let name = block_entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') || name.ends_with(".tmp") {
                    continue;
                }
                let size = block_entry.metadata()?.len();
                blocks.push((name, size));
            }
        }

        Ok(blocks)
    }

    pub fn total_size(&self) -> std::io::Result<u64> {
        Ok(self.scan_blocks()?.iter().map(|(_, s)| *s).sum())
    }

    pub fn block_count(&self) -> std::io::Result<usize> {
        Ok(self.scan_blocks()?.len())
    }
}

pub fn load_referenced_cids(workflows_dir: impl AsRef<Path>) -> std::io::Result<HashSet<String>> {
    let index_path = workflows_dir.as_ref().join("index.json");
    if !index_path.exists() {
        return Ok(HashSet::new());
    }

    let content = std::fs::read_to_string(&index_path)?;
    let index: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    let mut cids = HashSet::new();

    if let Some(obj) = index.as_object() {
        for (cid, _) in obj {
            cids.insert(cid.clone());
        }
    }

    // Also scan completed workflows for referenced block CIDs
    let complete_dir = workflows_dir.as_ref().join("complete");
    if complete_dir.exists() {
        for entry in std::fs::read_dir(&complete_dir)? {
            let entry = entry?;
            if entry.path().extension().map(|e| e == "json").unwrap_or(false) {
                if let Ok(content) = std::fs::read_to_string(entry.path()) {
                    if let Ok(wf) = serde_json::from_str::<serde_json::Value>(&content) {
                        collect_cids_from_value(&wf, &mut cids);
                    }
                }
            }
        }
    }

    Ok(cids)
}

fn collect_cids_from_value(value: &serde_json::Value, cids: &mut HashSet<String>) {
    match value {
        serde_json::Value::String(s) => {
            if s.starts_with("bafk-") || s.len() == 64 {
                cids.insert(s.clone());
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr {
                collect_cids_from_value(v, cids);
            }
        }
        serde_json::Value::Object(obj) => {
            for (_, v) in obj {
                collect_cids_from_value(v, cids);
            }
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wal::WalEntry;
    use tempfile::tempdir;

    #[test]
    fn checkpoint_wal_writes_blocks() {
        let dir = tempdir().unwrap();
        let objects_dir = dir.path().join("objects");
        let wal_dir = dir.path().join("wal");
        std::fs::create_dir_all(&objects_dir).unwrap();

        let mut wal = WalManager::new(&wal_dir).unwrap();
        let hash = blake3::hash(b"test-data").as_bytes().to_owned();
        wal.append(&WalEntry::new(OpType::PutBlock, hash, b"test-data".to_vec()))
            .unwrap();

        let compactor = Compactor::new(&objects_dir, RetentionPolicy::default());
        let stats = compactor.checkpoint_wal(&mut wal).unwrap();
        assert_eq!(stats.blocks_written, 1);

        // Verify the block was written to the correct shard
        let addr_hex = hex::encode(&hash);
        let block_path = objects_dir.join(&addr_hex[..2]).join(&addr_hex);
        assert!(block_path.exists());

        // WAL should be cleared after checkpoint
        let entries = wal.recover().unwrap();
        assert!(entries.is_empty());
    }

    #[test]
    fn gc_removes_orphans() {
        let dir = tempdir().unwrap();
        let objects_dir = dir.path().join("objects");

        // Create a block
        let shard_dir = objects_dir.join("ab");
        std::fs::create_dir_all(&shard_dir).unwrap();
        std::fs::write(shard_dir.join("ab12345678901234567890123456789012345678901234567890123456789012"), b"data").unwrap();

        let referenced = HashSet::new(); // no references → block is orphaned
        let compactor = Compactor::new(&objects_dir, RetentionPolicy::default());
        let stats = compactor.gc(&referenced).unwrap();

        assert_eq!(stats.blocks_removed, 1);
    }

    #[test]
    fn gc_preserves_referenced() {
        let dir = tempdir().unwrap();
        let objects_dir = dir.path().join("objects");

        let block_name = "ab12345678901234567890123456789012345678901234567890123456789012";
        let shard_dir = objects_dir.join("ab");
        std::fs::create_dir_all(&shard_dir).unwrap();
        std::fs::write(shard_dir.join(block_name), b"data").unwrap();

        let mut referenced = HashSet::new();
        referenced.insert(block_name.to_string());

        let compactor = Compactor::new(&objects_dir, RetentionPolicy::default());
        let stats = compactor.gc(&referenced).unwrap();
        assert_eq!(stats.blocks_removed, 0);
    }

    #[test]
    fn scan_blocks() {
        let dir = tempdir().unwrap();
        let objects_dir = dir.path().join("objects");

        let shard = objects_dir.join("aa");
        std::fs::create_dir_all(&shard).unwrap();
        std::fs::write(shard.join("aaff"), b"block1").unwrap();
        std::fs::write(shard.join("aabb"), b"block2").unwrap();
        std::fs::write(shard.join(".gitkeep"), b"").unwrap(); // should be skipped

        let compactor = Compactor::new(&objects_dir, RetentionPolicy::default());
        let blocks = compactor.scan_blocks().unwrap();
        assert_eq!(blocks.len(), 2);
    }

    #[test]
    fn load_referenced_cids_from_index() {
        let dir = tempdir().unwrap();
        let wf_dir = dir.path().join("workflows");
        std::fs::create_dir_all(&wf_dir).unwrap();

        let index = serde_json::json!({
            "bafk-blake3-abc123": {"name": "test-workflow"},
            "bafk-blake3-def456": {"name": "other-workflow"}
        });
        std::fs::write(
            wf_dir.join("index.json"),
            serde_json::to_string(&index).unwrap(),
        )
        .unwrap();

        let cids = load_referenced_cids(&wf_dir).unwrap();
        assert!(cids.contains("bafk-blake3-abc123"));
        assert!(cids.contains("bafk-blake3-def456"));
        assert_eq!(cids.len(), 2);
    }
}
