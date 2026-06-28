// .lucia/ directory manager — the on-disk metadata layer for LuciVerse VCS.
// LDS: 700.528 | 528 Hz
//
// Manages the .lucia/ directory structure within a repository:
//   - config.toml     — repo identity (DID, frequency, tier, peers)
//   - objects/         — BLAKE3 content-addressed block store
//   - wal/            — Write-Ahead Log (InfluxData pattern)
//   - workflows/      — IPVM workflow DAGs (CID-addressed)
//   - threads/        — Cross-repo threading index
//   - handles/        — DID handle bindings
//   - retention/      — LDS-tier-aware retention policies
//   - agents/         — Agent mesh integration slots
//   - metrics/        — Prometheus-compatible metrics

use crate::block_cache::{BlockCache, SharedCache};
use crate::compactor::Compactor;
use crate::metrics::MetricsCollector;
use crate::retention::RetentionPolicy;
use crate::thread_index::ThreadIndex;
use crate::wal::WalManager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use thiserror::Error;
use tracing::{info, instrument};

const LUCIA_DIR_NAME: &str = ".lucia";
const CONFIG_FILE: &str = "config.toml";

#[derive(Debug, Error)]
pub enum LuciaDirError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("toml parse error: {0}")]
    TomlParse(#[from] toml::de::Error),
    #[error("toml serialize error: {0}")]
    TomlSerialize(#[from] toml::ser::Error),
    #[error(".lucia/ directory not found at {0}")]
    NotFound(String),
    #[error("invalid config: {0}")]
    InvalidConfig(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LuciaConfig {
    pub lucia: LuciaVersion,
    pub identity: Identity,
    #[serde(default)]
    pub peers: HashMap<String, PeerRef>,
    pub storage: StorageConfig,
    #[serde(default)]
    pub wal: Option<WalConfig>,
    #[serde(default)]
    pub compaction: Option<CompactionSectionConfig>,
    #[serde(default)]
    pub network: Option<NetworkConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LuciaVersion {
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    #[serde(default)]
    pub repo_name: String,
    pub did: String,
    pub frequency_hz: u32,
    pub lds_tier: String,
    #[serde(default)]
    pub genesis_bond: String,
    #[serde(default)]
    pub ipv6_root: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerRef {
    pub did: String,
    #[serde(default)]
    pub frequency_hz: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    #[serde(default = "default_block_size")]
    pub block_size: usize,
    #[serde(default = "default_hash")]
    pub hash: String,
    #[serde(default = "default_compression")]
    pub compression: String,
    #[serde(default = "default_compression_level")]
    pub compression_level: i32,
}

fn default_block_size() -> usize {
    1048576
}
fn default_hash() -> String {
    "blake3".into()
}
fn default_compression() -> String {
    "zstd".into()
}
fn default_compression_level() -> i32 {
    3
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalConfig {
    #[serde(default = "default_segment_max")]
    pub segment_max_bytes: u64,
    #[serde(default = "default_rotation_count")]
    pub rotation_count: u32,
}

fn default_segment_max() -> u64 {
    64 * 1024 * 1024
}
fn default_rotation_count() -> u32 {
    8
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompactionSectionConfig {
    #[serde(default = "default_interval_hours")]
    pub interval_hours: u32,
    #[serde(default = "default_min_block_size")]
    pub min_block_size: usize,
}

fn default_interval_hours() -> u32 {
    24
}
fn default_min_block_size() -> usize {
    262144
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub ipv6_root: Option<String>,
    pub gitweb_port: Option<u16>,
}

pub struct LuciaDir {
    root: PathBuf,
    config: LuciaConfig,
    metrics: Arc<MetricsCollector>,
}

impl LuciaDir {
    #[instrument(fields(path = %path.as_ref().display()))]
    pub fn open(path: impl AsRef<Path>) -> Result<Self, LuciaDirError> {
        let root = path.as_ref().join(LUCIA_DIR_NAME);
        if !root.exists() {
            return Err(LuciaDirError::NotFound(
                path.as_ref().display().to_string(),
            ));
        }

        let config_path = root.join(CONFIG_FILE);
        let config_str = std::fs::read_to_string(&config_path)?;
        let config: LuciaConfig = toml::from_str(&config_str)?;

        let metrics = MetricsCollector::new();

        // Load existing metrics if available
        let metrics_path = root.join("metrics").join("counters.json");
        if metrics_path.exists() {
            if let Ok(snapshot) = crate::metrics::MetricsSnapshot::load(&metrics_path) {
                metrics.block_cache_bytes.store(
                    snapshot.block_cache_bytes,
                    std::sync::atomic::Ordering::Relaxed,
                );
                metrics.block_cache_count.store(
                    snapshot.block_cache_count,
                    std::sync::atomic::Ordering::Relaxed,
                );
                metrics.threads_total.store(
                    snapshot.threads_total,
                    std::sync::atomic::Ordering::Relaxed,
                );
            }
        }

        info!(did = %config.identity.did, freq = config.identity.frequency_hz, ".lucia/ directory opened");
        Ok(Self {
            root,
            config,
            metrics,
        })
    }

    #[instrument(fields(path = %path.as_ref().display(), did = %config.identity.did))]
    pub fn init(path: impl AsRef<Path>, config: LuciaConfig) -> Result<Self, LuciaDirError> {
        let root = path.as_ref().join(LUCIA_DIR_NAME);

        let dirs = [
            "",
            "objects",
            "wal",
            "wal/archive",
            "workflows",
            "workflows/pending",
            "workflows/complete",
            "threads",
            "threads/frequency-shards/432",
            "threads/frequency-shards/528",
            "threads/frequency-shards/639",
            "threads/frequency-shards/741",
            "threads/frequency-shards/852",
            "threads/frequency-shards/963",
            "handles",
            "handles/peers",
            "retention",
            "agents",
            "agents/slots",
            "metrics",
        ];

        for dir in &dirs {
            std::fs::create_dir_all(root.join(dir))?;
        }

        // Write config.toml
        let config_str = toml::to_string_pretty(&config)?;
        std::fs::write(root.join(CONFIG_FILE), config_str)?;

        // Write empty index files
        std::fs::write(root.join("threads/thread-map.json"), "{}")?;
        std::fs::write(root.join("workflows/index.json"), "{}")?;

        // Write default retention policy
        let retention = RetentionPolicy::default();
        let retention_str = toml::to_string_pretty(&retention)
            .map_err(|e| LuciaDirError::TomlSerialize(e))?;
        std::fs::write(root.join("retention/policy.toml"), retention_str)?;

        // Write initial metrics
        let metrics = MetricsCollector::new();
        metrics.write_json(root.join("metrics/counters.json"))?;

        // Write .gitkeep files
        let gitkeep_dirs = [
            "objects",
            "wal/archive",
            "workflows/pending",
            "workflows/complete",
            "handles/peers",
            "threads/frequency-shards/432",
            "threads/frequency-shards/528",
            "threads/frequency-shards/639",
            "threads/frequency-shards/741",
            "threads/frequency-shards/852",
            "threads/frequency-shards/963",
        ];
        for dir in &gitkeep_dirs {
            let gitkeep = root.join(dir).join(".gitkeep");
            if !gitkeep.exists() {
                std::fs::write(&gitkeep, "")?;
            }
        }

        // Write local handle
        let handle_toml = format!(
            "[handle]\ndid = \"{}\"\nfrequency_hz = {}\nlds_tier = \"{}\"\n",
            config.identity.did, config.identity.frequency_hz, config.identity.lds_tier
        );
        std::fs::write(root.join("handles/local.toml"), handle_toml)?;

        info!(did = %config.identity.did, ".lucia/ directory initialized");
        Ok(Self {
            root,
            config,
            metrics,
        })
    }

    pub fn config(&self) -> &LuciaConfig {
        &self.config
    }

    pub fn did(&self) -> &str {
        &self.config.identity.did
    }

    pub fn frequency_hz(&self) -> u32 {
        self.config.identity.frequency_hz
    }

    pub fn lds_tier(&self) -> &str {
        &self.config.identity.lds_tier
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn block_cache(&self) -> SharedCache {
        Arc::new(BlockCache::new(self.root.join("objects")))
    }

    pub fn wal(&self) -> Result<WalManager, std::io::Error> {
        let segment_max = self
            .config
            .wal
            .as_ref()
            .map(|w| w.segment_max_bytes)
            .unwrap_or(64 * 1024 * 1024);
        WalManager::with_max_segment(self.root.join("wal"), segment_max)
    }

    pub fn thread_index(&self) -> Result<ThreadIndex, std::io::Error> {
        ThreadIndex::new(self.root.join("threads"))
    }

    pub fn retention_policy(&self) -> Result<RetentionPolicy, LuciaDirError> {
        let policy_path = self.root.join("retention/policy.toml");
        if policy_path.exists() {
            let content = std::fs::read_to_string(&policy_path)?;
            let policy: RetentionPolicy = toml::from_str(&content)?;
            Ok(policy)
        } else {
            Ok(RetentionPolicy::default())
        }
    }

    pub fn compactor(&self) -> Result<Compactor, LuciaDirError> {
        let retention = self.retention_policy()?;
        Ok(Compactor::new(self.root.join("objects"), retention)
            .with_metrics(self.metrics.clone()))
    }

    pub fn metrics(&self) -> Arc<MetricsCollector> {
        self.metrics.clone()
    }

    pub fn flush_metrics(&self) -> std::io::Result<()> {
        self.metrics
            .write_json(self.root.join("metrics/counters.json"))
    }

    pub fn peers(&self) -> &HashMap<String, PeerRef> {
        &self.config.peers
    }

    pub fn is_peer(&self, did: &str) -> bool {
        self.config.peers.values().any(|p| p.did == did)
    }

    pub fn exists(path: impl AsRef<Path>) -> bool {
        path.as_ref().join(LUCIA_DIR_NAME).exists()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_config() -> LuciaConfig {
        LuciaConfig {
            lucia: LuciaVersion {
                version: "0.1.0".into(),
            },
            identity: Identity {
                repo_name: "test-repo".into(),
                did: "did:luci:test-repo".into(),
                frequency_hz: 528,
                lds_tier: "700.528".into(),
                genesis_bond: "ACTIVE".into(),
                ipv6_root: Some("2602:F674:0000:0700::/64".into()),
            },
            peers: HashMap::from([(
                "peer1".into(),
                PeerRef {
                    did: "did:luci:peer1".into(),
                    frequency_hz: Some(741),
                },
            )]),
            storage: StorageConfig {
                block_size: 1048576,
                hash: "blake3".into(),
                compression: "zstd".into(),
                compression_level: 3,
            },
            wal: Some(WalConfig {
                segment_max_bytes: 67108864,
                rotation_count: 8,
            }),
            compaction: Some(CompactionSectionConfig {
                interval_hours: 24,
                min_block_size: 262144,
            }),
            network: None,
        }
    }

    #[test]
    fn init_creates_directory_structure() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();

        assert!(dir.path().join(".lucia").exists());
        assert!(dir.path().join(".lucia/config.toml").exists());
        assert!(dir.path().join(".lucia/objects").exists());
        assert!(dir.path().join(".lucia/wal").exists());
        assert!(dir.path().join(".lucia/wal/archive").exists());
        assert!(dir.path().join(".lucia/workflows").exists());
        assert!(dir.path().join(".lucia/workflows/pending").exists());
        assert!(dir.path().join(".lucia/workflows/complete").exists());
        assert!(dir.path().join(".lucia/threads").exists());
        assert!(dir.path().join(".lucia/threads/frequency-shards/528").exists());
        assert!(dir.path().join(".lucia/threads/frequency-shards/741").exists());
        assert!(dir.path().join(".lucia/threads/frequency-shards/963").exists());
        assert!(dir.path().join(".lucia/handles").exists());
        assert!(dir.path().join(".lucia/handles/local.toml").exists());
        assert!(dir.path().join(".lucia/retention/policy.toml").exists());
        assert!(dir.path().join(".lucia/agents/slots").exists());
        assert!(dir.path().join(".lucia/metrics/counters.json").exists());
        assert!(dir.path().join(".lucia/threads/thread-map.json").exists());
        assert!(dir.path().join(".lucia/workflows/index.json").exists());

        assert_eq!(lucia.did(), "did:luci:test-repo");
        assert_eq!(lucia.frequency_hz(), 528);
    }

    #[test]
    fn open_reads_config() {
        let dir = tempdir().unwrap();
        let config = test_config();
        LuciaDir::init(dir.path(), config).unwrap();

        let lucia = LuciaDir::open(dir.path()).unwrap();
        assert_eq!(lucia.did(), "did:luci:test-repo");
        assert_eq!(lucia.frequency_hz(), 528);
        assert_eq!(lucia.lds_tier(), "700.528");
    }

    #[test]
    fn open_fails_without_lucia_dir() {
        let dir = tempdir().unwrap();
        assert!(LuciaDir::open(dir.path()).is_err());
    }

    #[test]
    fn block_cache_uses_objects_dir() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();
        let _cache = lucia.block_cache();
        // Cache is created pointing to .lucia/objects/
    }

    #[test]
    fn wal_manager_created() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();
        let wal = lucia.wal().unwrap();
        assert_eq!(wal.current_size(), 0);
    }

    #[test]
    fn thread_index_created() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();
        let idx = lucia.thread_index().unwrap();
        assert_eq!(idx.thread_count(), 0);
    }

    #[test]
    fn retention_policy_loaded() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();
        let policy = lucia.retention_policy().unwrap();
        assert!(policy.should_retain(963, std::time::Duration::from_secs(86400 * 10000)));
    }

    #[test]
    fn peers_lookup() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();

        assert!(lucia.is_peer("did:luci:peer1"));
        assert!(!lucia.is_peer("did:unknown"));
        assert_eq!(lucia.peers().len(), 1);
    }

    #[test]
    fn exists_check() {
        let dir = tempdir().unwrap();
        assert!(!LuciaDir::exists(dir.path()));

        LuciaDir::init(dir.path(), test_config()).unwrap();
        assert!(LuciaDir::exists(dir.path()));
    }

    #[test]
    fn metrics_flush_and_reload() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config.clone()).unwrap();

        lucia.metrics().inc_block_cache(4096);
        lucia.metrics().inc_threads();
        lucia.flush_metrics().unwrap();

        // Reopen and verify metrics were loaded
        let lucia2 = LuciaDir::open(dir.path()).unwrap();
        let snap = lucia2.metrics().snapshot();
        assert_eq!(snap.block_cache_bytes, 4096);
        assert_eq!(snap.threads_total, 1);
    }

    #[test]
    fn full_lifecycle() {
        let dir = tempdir().unwrap();
        let config = test_config();
        let lucia = LuciaDir::init(dir.path(), config).unwrap();

        // Write to WAL
        let mut wal = lucia.wal().unwrap();
        let hash = blake3::hash(b"lifecycle-test").as_bytes().to_owned();
        let entry = crate::wal::WalEntry::new(
            crate::wal::OpType::PutBlock,
            hash,
            b"lifecycle-test".to_vec(),
        );
        wal.append(&entry).unwrap();

        // Checkpoint WAL → objects
        let compactor = lucia.compactor().unwrap();
        let stats = compactor.checkpoint_wal(&mut wal).unwrap();
        assert_eq!(stats.blocks_written, 1);

        // Create thread link
        let mut idx = lucia.thread_index().unwrap();
        idx.link(
            "thread-lifecycle",
            lucia.did(),
            "bafk-blake3-test",
            lucia.frequency_hz(),
        )
        .unwrap();
        idx.flush().unwrap();

        // Update metrics
        lucia.metrics().inc_block_cache(1024);
        lucia.metrics().inc_threads();
        lucia.flush_metrics().unwrap();

        // Reopen and verify everything persisted
        let lucia2 = LuciaDir::open(dir.path()).unwrap();
        let idx2 = lucia2.thread_index().unwrap();
        assert_eq!(idx2.thread_count(), 1);
    }
}
