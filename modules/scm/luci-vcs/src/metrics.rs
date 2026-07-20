// Prometheus-compatible metrics for the .lucia/ directory.
// LDS: 700.528 | 528 Hz
//
// Tracks block cache size, WAL depth, thread count, and workflow duration.
// Writes to .lucia/metrics/counters.json on each checkpoint and optionally
// exposes an HTTP /metrics endpoint for Prometheus scraping.

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

#[derive(Debug, Default)]
pub struct MetricsCollector {
    pub block_cache_bytes: AtomicU64,
    pub block_cache_count: AtomicU64,
    pub wal_entries: AtomicU64,
    pub wal_bytes: AtomicU64,
    pub threads_total: AtomicU64,
    pub workflows_completed: AtomicU64,
    pub workflows_pending: AtomicU64,
    pub workflow_duration_seconds_sum: AtomicU64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSnapshot {
    pub block_cache_bytes: u64,
    pub block_cache_count: u64,
    pub wal_entries: u64,
    pub wal_bytes: u64,
    pub threads_total: u64,
    pub workflows_completed: u64,
    pub workflows_pending: u64,
    pub workflow_duration_seconds_sum: u64,
}

impl MetricsCollector {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    pub fn snapshot(&self) -> MetricsSnapshot {
        MetricsSnapshot {
            block_cache_bytes: self.block_cache_bytes.load(Ordering::Relaxed),
            block_cache_count: self.block_cache_count.load(Ordering::Relaxed),
            wal_entries: self.wal_entries.load(Ordering::Relaxed),
            wal_bytes: self.wal_bytes.load(Ordering::Relaxed),
            threads_total: self.threads_total.load(Ordering::Relaxed),
            workflows_completed: self.workflows_completed.load(Ordering::Relaxed),
            workflows_pending: self.workflows_pending.load(Ordering::Relaxed),
            workflow_duration_seconds_sum: self.workflow_duration_seconds_sum.load(Ordering::Relaxed),
        }
    }

    pub fn inc_block_cache(&self, bytes: u64) {
        self.block_cache_bytes.fetch_add(bytes, Ordering::Relaxed);
        self.block_cache_count.fetch_add(1, Ordering::Relaxed);
    }

    pub fn dec_block_cache(&self, bytes: u64) {
        self.block_cache_bytes.fetch_sub(bytes, Ordering::Relaxed);
        self.block_cache_count.fetch_sub(1, Ordering::Relaxed);
    }

    pub fn inc_wal(&self, bytes: u64) {
        self.wal_entries.fetch_add(1, Ordering::Relaxed);
        self.wal_bytes.fetch_add(bytes, Ordering::Relaxed);
    }

    pub fn reset_wal(&self) {
        self.wal_entries.store(0, Ordering::Relaxed);
        self.wal_bytes.store(0, Ordering::Relaxed);
    }

    pub fn inc_threads(&self) {
        self.threads_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn complete_workflow(&self, duration_secs: u64) {
        self.workflows_completed.fetch_add(1, Ordering::Relaxed);
        self.workflow_duration_seconds_sum
            .fetch_add(duration_secs, Ordering::Relaxed);
    }

    pub fn set_pending_workflows(&self, count: u64) {
        self.workflows_pending.store(count, Ordering::Relaxed);
    }

    pub fn write_json(&self, path: impl AsRef<Path>) -> std::io::Result<()> {
        let snapshot = self.snapshot();
        let json = serde_json::to_string_pretty(&snapshot)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        std::fs::write(path, json)
    }

    pub fn to_prometheus(&self) -> String {
        let s = self.snapshot();
        format!(
            "# HELP lucia_block_cache_bytes Total bytes in block cache\n\
             # TYPE lucia_block_cache_bytes gauge\n\
             lucia_block_cache_bytes {}\n\
             # HELP lucia_block_cache_count Number of blocks in cache\n\
             # TYPE lucia_block_cache_count gauge\n\
             lucia_block_cache_count {}\n\
             # HELP lucia_wal_entries Number of WAL entries since last checkpoint\n\
             # TYPE lucia_wal_entries gauge\n\
             lucia_wal_entries {}\n\
             # HELP lucia_wal_bytes Bytes written to WAL since last checkpoint\n\
             # TYPE lucia_wal_bytes gauge\n\
             lucia_wal_bytes {}\n\
             # HELP lucia_threads_total Total cross-repo thread links\n\
             # TYPE lucia_threads_total counter\n\
             lucia_threads_total {}\n\
             # HELP lucia_workflows_completed_total Completed workflows\n\
             # TYPE lucia_workflows_completed_total counter\n\
             lucia_workflows_completed_total {}\n\
             # HELP lucia_workflows_pending Number of pending workflows\n\
             # TYPE lucia_workflows_pending gauge\n\
             lucia_workflows_pending {}\n\
             # HELP lucia_workflow_duration_seconds_sum Sum of workflow durations\n\
             # TYPE lucia_workflow_duration_seconds_sum counter\n\
             lucia_workflow_duration_seconds_sum {}\n",
            s.block_cache_bytes,
            s.block_cache_count,
            s.wal_entries,
            s.wal_bytes,
            s.threads_total,
            s.workflows_completed,
            s.workflows_pending,
            s.workflow_duration_seconds_sum,
        )
    }
}

impl MetricsSnapshot {
    pub fn load(path: impl AsRef<Path>) -> std::io::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        serde_json::from_str(&content)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn metrics_snapshot_roundtrip() {
        let m = MetricsCollector::new();
        m.inc_block_cache(1024);
        m.inc_block_cache(2048);
        m.inc_wal(512);
        m.inc_threads();
        m.complete_workflow(10);

        let s = m.snapshot();
        assert_eq!(s.block_cache_bytes, 3072);
        assert_eq!(s.block_cache_count, 2);
        assert_eq!(s.wal_entries, 1);
        assert_eq!(s.wal_bytes, 512);
        assert_eq!(s.threads_total, 1);
        assert_eq!(s.workflows_completed, 1);
        assert_eq!(s.workflow_duration_seconds_sum, 10);
    }

    #[test]
    fn prometheus_output_format() {
        let m = MetricsCollector::new();
        m.inc_block_cache(100);
        let output = m.to_prometheus();
        assert!(output.contains("lucia_block_cache_bytes 100"));
        assert!(output.contains("lucia_block_cache_count 1"));
        assert!(output.contains("# TYPE lucia_block_cache_bytes gauge"));
    }

    #[test]
    fn json_roundtrip() {
        let m = MetricsCollector::new();
        m.inc_block_cache(4096);
        m.inc_threads();
        m.inc_threads();

        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("counters.json");
        m.write_json(&path).unwrap();

        let loaded = MetricsSnapshot::load(&path).unwrap();
        assert_eq!(loaded.block_cache_bytes, 4096);
        assert_eq!(loaded.threads_total, 2);
    }

    #[test]
    fn wal_reset() {
        let m = MetricsCollector::new();
        m.inc_wal(100);
        m.inc_wal(200);
        assert_eq!(m.snapshot().wal_entries, 2);
        m.reset_wal();
        assert_eq!(m.snapshot().wal_entries, 0);
        assert_eq!(m.snapshot().wal_bytes, 0);
    }
}
