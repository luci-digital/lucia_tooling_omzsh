// Cross-repo threading index for .lucia/ directories.
// LDS: 700.528 | 528 Hz
//
// Thread links connect content across repos via DID + CID pairs.
// Each link is stored in a frequency-based shard directory under
// .lucia/threads/frequency-shards/<freq>/.
//
// Thread map (.lucia/threads/thread-map.json) provides a global
// index of thread_id → [(repo_did, block_cid, frequency)].

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tracing::debug;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ThreadLink {
    pub did: String,
    pub cid: String,
    pub frequency_hz: u32,
    #[serde(default)]
    pub timestamp_ns: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadEntry {
    pub thread_id: String,
    pub links: Vec<ThreadLink>,
}

pub struct ThreadIndex {
    threads_dir: PathBuf,
    map: HashMap<String, ThreadEntry>,
}

impl ThreadIndex {
    pub fn new(threads_dir: impl AsRef<Path>) -> std::io::Result<Self> {
        let threads_dir = threads_dir.as_ref().to_path_buf();
        std::fs::create_dir_all(&threads_dir)?;

        let map_path = threads_dir.join("thread-map.json");
        let map = if map_path.exists() {
            let content = std::fs::read_to_string(&map_path)?;
            serde_json::from_str(&content)
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?
        } else {
            HashMap::new()
        };

        Ok(Self { threads_dir, map })
    }

    pub fn link(
        &mut self,
        thread_id: impl Into<String>,
        repo_did: impl Into<String>,
        block_cid: impl Into<String>,
        frequency_hz: u32,
    ) -> std::io::Result<()> {
        let thread_id = thread_id.into();
        let did_str = repo_did.into();
        let cid_str = block_cid.into();
        debug!(thread_id = %thread_id, did = %did_str, "linking thread");
        let link = ThreadLink {
            did: did_str,
            cid: cid_str,
            frequency_hz,
            timestamp_ns: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos() as u64,
        };

        let entry = self
            .map
            .entry(thread_id.clone())
            .or_insert_with(|| ThreadEntry {
                thread_id: thread_id.clone(),
                links: Vec::new(),
            });

        // Avoid duplicate links (same DID + CID)
        if !entry
            .links
            .iter()
            .any(|l| l.did == link.did && l.cid == link.cid)
        {
            entry.links.push(link.clone());
        }

        // Write to frequency shard
        self.write_shard_entry(&thread_id, &link, frequency_hz)?;

        debug!(thread_id, "thread link added");
        Ok(())
    }

    pub fn resolve(&self, thread_id: &str) -> Vec<&ThreadLink> {
        self.map
            .get(thread_id)
            .map(|entry| entry.links.iter().collect())
            .unwrap_or_default()
    }

    pub fn resolve_by_did(&self, did: &str) -> Vec<(&str, &ThreadLink)> {
        self.map
            .iter()
            .flat_map(|(tid, entry)| {
                entry
                    .links
                    .iter()
                    .filter(|l| l.did == did)
                    .map(move |l| (tid.as_str(), l))
            })
            .collect()
    }

    pub fn resolve_by_frequency(&self, frequency_hz: u32) -> Vec<(&str, &ThreadLink)> {
        self.map
            .iter()
            .flat_map(|(tid, entry)| {
                entry
                    .links
                    .iter()
                    .filter(|l| l.frequency_hz == frequency_hz)
                    .map(move |l| (tid.as_str(), l))
            })
            .collect()
    }

    pub fn thread_count(&self) -> usize {
        self.map.len()
    }

    pub fn link_count(&self) -> usize {
        self.map.values().map(|e| e.links.len()).sum()
    }

    pub fn shard_dir(&self, frequency_hz: u32) -> PathBuf {
        self.threads_dir
            .join("frequency-shards")
            .join(frequency_hz.to_string())
    }

    pub fn flush(&self) -> std::io::Result<()> {
        let map_path = self.threads_dir.join("thread-map.json");
        let json = serde_json::to_string_pretty(&self.map)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        std::fs::write(map_path, json)
    }

    pub fn thread_id_from_parts(parts: &[&str]) -> String {
        let combined = parts.join(":");
        let hash = blake3::hash(combined.as_bytes());
        format!("thread-{}", hex::encode(hash.as_bytes()))
    }

    fn write_shard_entry(
        &self,
        thread_id: &str,
        link: &ThreadLink,
        frequency_hz: u32,
    ) -> std::io::Result<()> {
        let shard = self.shard_dir(frequency_hz);
        std::fs::create_dir_all(&shard)?;

        let shard_file = shard.join(format!("{thread_id}.json"));
        let entry = if shard_file.exists() {
            let content = std::fs::read_to_string(&shard_file)?;
            let mut existing: ThreadEntry = serde_json::from_str(&content)
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
            if !existing
                .links
                .iter()
                .any(|l| l.did == link.did && l.cid == link.cid)
            {
                existing.links.push(link.clone());
            }
            existing
        } else {
            ThreadEntry {
                thread_id: thread_id.to_string(),
                links: vec![link.clone()],
            }
        };

        let json = serde_json::to_string_pretty(&entry)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        std::fs::write(shard_file, json)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn link_and_resolve() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link(
            "thread-abc123",
            "did:luci:lucia-tooling-omzsh",
            "bafk-blake3-deadbeef",
            528,
        )
        .unwrap();
        idx.link(
            "thread-abc123",
            "did:lucidigital:luci-ai-thunderbolt",
            "bafk-blake3-cafebabe",
            741,
        )
        .unwrap();

        let links = idx.resolve("thread-abc123");
        assert_eq!(links.len(), 2);
        assert_eq!(links[0].did, "did:luci:lucia-tooling-omzsh");
        assert_eq!(links[1].did, "did:lucidigital:luci-ai-thunderbolt");
    }

    #[test]
    fn dedup_links() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link("t1", "did:a", "cid:1", 528).unwrap();
        idx.link("t1", "did:a", "cid:1", 528).unwrap(); // duplicate

        assert_eq!(idx.resolve("t1").len(), 1);
    }

    #[test]
    fn resolve_by_did() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link("t1", "did:a", "cid:1", 528).unwrap();
        idx.link("t2", "did:a", "cid:2", 741).unwrap();
        idx.link("t3", "did:b", "cid:3", 528).unwrap();

        let results = idx.resolve_by_did("did:a");
        assert_eq!(results.len(), 2);
    }

    #[test]
    fn resolve_by_frequency() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link("t1", "did:a", "cid:1", 528).unwrap();
        idx.link("t2", "did:b", "cid:2", 741).unwrap();
        idx.link("t3", "did:c", "cid:3", 528).unwrap();

        let results = idx.resolve_by_frequency(528);
        assert_eq!(results.len(), 2);
    }

    #[test]
    fn flush_and_reload() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");

        {
            let mut idx = ThreadIndex::new(&threads_dir).unwrap();
            idx.link("t1", "did:a", "cid:1", 528).unwrap();
            idx.link("t1", "did:b", "cid:2", 741).unwrap();
            idx.flush().unwrap();
        }

        let idx2 = ThreadIndex::new(&threads_dir).unwrap();
        let links = idx2.resolve("t1");
        assert_eq!(links.len(), 2);
    }

    #[test]
    fn thread_id_from_parts_is_deterministic() {
        let id1 = ThreadIndex::thread_id_from_parts(&["table_name", "record_id", "user_id"]);
        let id2 = ThreadIndex::thread_id_from_parts(&["table_name", "record_id", "user_id"]);
        assert_eq!(id1, id2);
        assert!(id1.starts_with("thread-"));
    }

    #[test]
    fn shard_directory_structure() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link("t1", "did:a", "cid:1", 528).unwrap();

        let shard_file = threads_dir
            .join("frequency-shards")
            .join("528")
            .join("t1.json");
        assert!(shard_file.exists());

        let content = std::fs::read_to_string(&shard_file).unwrap();
        let entry: ThreadEntry = serde_json::from_str(&content).unwrap();
        assert_eq!(entry.links.len(), 1);
        assert_eq!(entry.links[0].frequency_hz, 528);
    }

    #[test]
    fn counts() {
        let dir = tempdir().unwrap();
        let threads_dir = dir.path().join("threads");
        let mut idx = ThreadIndex::new(&threads_dir).unwrap();

        idx.link("t1", "did:a", "cid:1", 528).unwrap();
        idx.link("t1", "did:b", "cid:2", 741).unwrap();
        idx.link("t2", "did:a", "cid:3", 528).unwrap();

        assert_eq!(idx.thread_count(), 2);
        assert_eq!(idx.link_count(), 3);
    }
}
