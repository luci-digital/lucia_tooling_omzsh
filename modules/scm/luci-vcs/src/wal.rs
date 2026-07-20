// Write-Ahead Log for the .lucia/ block store (InfluxDB-inspired).
// LDS: 700.528 | 528 Hz
//
// Binary format per entry:
//   [8 bytes] timestamp_ns   — nanosecond Unix timestamp
//   [1 byte]  op_type        — PUT_BLOCK=0x01, LINK_THREAD=0x02,
//                              COMPLETE_WORKFLOW=0x03, DELETE_BLOCK=0x04
//   [32 bytes] blake3_hash   — content address of the affected block
//   [4 bytes] payload_len    — little-endian u32
//   [N bytes] payload        — operation-specific data
//   [4 bytes] crc32          — IEEE CRC32 of the entire entry (excl. this field)
//
// Segment rotation: when the active segment exceeds 64 MiB (configurable),
// it is moved to wal/archive/ and a new segment is opened.
// Recovery: on LuciaDir::open(), replay unarchived WAL segments.

use crate::block_cache::BlockAddr;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use tracing::{debug, instrument, warn};

const WAL_ENTRY_HEADER_SIZE: usize = 8 + 1 + 32 + 4; // 45 bytes
const CRC_SIZE: usize = 4;
const DEFAULT_SEGMENT_MAX: u64 = 64 * 1024 * 1024; // 64 MiB

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum OpType {
    PutBlock = 0x01,
    LinkThread = 0x02,
    CompleteWorkflow = 0x03,
    DeleteBlock = 0x04,
}

impl OpType {
    pub fn from_byte(b: u8) -> Option<Self> {
        match b {
            0x01 => Some(OpType::PutBlock),
            0x02 => Some(OpType::LinkThread),
            0x03 => Some(OpType::CompleteWorkflow),
            0x04 => Some(OpType::DeleteBlock),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct WalEntry {
    pub timestamp_ns: u64,
    pub op: OpType,
    pub hash: [u8; 32],
    pub payload: Vec<u8>,
}

impl WalEntry {
    pub fn new(op: OpType, hash: [u8; 32], payload: Vec<u8>) -> Self {
        Self {
            timestamp_ns: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos() as u64,
            op,
            hash,
            payload,
        }
    }

    pub fn put_block(addr: &BlockAddr, data: &[u8]) -> Self {
        let mut hash = [0u8; 32];
        let decoded = hex::decode(addr.to_hex()).unwrap();
        hash.copy_from_slice(&decoded);
        Self::new(OpType::PutBlock, hash, data.to_vec())
    }

    pub fn link_thread(thread_id: &[u8; 32], link_data: &[u8]) -> Self {
        Self::new(OpType::LinkThread, *thread_id, link_data.to_vec())
    }

    pub fn complete_workflow(workflow_cid_hash: &[u8; 32], metadata: &[u8]) -> Self {
        Self::new(OpType::CompleteWorkflow, *workflow_cid_hash, metadata.to_vec())
    }

    pub fn delete_block(hash: [u8; 32]) -> Self {
        Self::new(OpType::DeleteBlock, hash, Vec::new())
    }

    pub fn encode(&self) -> Vec<u8> {
        let payload_len = self.payload.len() as u32;
        let total = WAL_ENTRY_HEADER_SIZE + self.payload.len() + CRC_SIZE;
        let mut buf = Vec::with_capacity(total);

        buf.extend_from_slice(&self.timestamp_ns.to_le_bytes());
        buf.push(self.op as u8);
        buf.extend_from_slice(&self.hash);
        buf.extend_from_slice(&payload_len.to_le_bytes());
        buf.extend_from_slice(&self.payload);

        let crc = crc32fast::hash(&buf);
        buf.extend_from_slice(&crc.to_le_bytes());

        buf
    }

    pub fn decode(data: &[u8]) -> io::Result<(Self, usize)> {
        if data.len() < WAL_ENTRY_HEADER_SIZE + CRC_SIZE {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                "WAL entry too short",
            ));
        }

        let timestamp_ns = u64::from_le_bytes(data[0..8].try_into().unwrap());
        let op = OpType::from_byte(data[8]).ok_or_else(|| {
            io::Error::new(io::ErrorKind::InvalidData, format!("unknown op type: {:#x}", data[8]))
        })?;
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&data[9..41]);
        let payload_len = u32::from_le_bytes(data[41..45].try_into().unwrap()) as usize;

        let entry_len = WAL_ENTRY_HEADER_SIZE + payload_len + CRC_SIZE;
        if data.len() < entry_len {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                "WAL entry payload truncated",
            ));
        }

        let payload = data[45..45 + payload_len].to_vec();

        let stored_crc = u32::from_le_bytes(
            data[45 + payload_len..entry_len].try_into().unwrap(),
        );
        let computed_crc = crc32fast::hash(&data[..45 + payload_len]);
        if stored_crc != computed_crc {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("CRC mismatch: stored={stored_crc:#x}, computed={computed_crc:#x}"),
            ));
        }

        Ok((
            Self {
                timestamp_ns,
                op,
                hash,
                payload,
            },
            entry_len,
        ))
    }
}

pub struct WalManager {
    wal_dir: PathBuf,
    current_path: PathBuf,
    segment_max_bytes: u64,
    current_size: u64,
}

impl WalManager {
    pub fn new(wal_dir: impl AsRef<Path>) -> io::Result<Self> {
        Self::with_max_segment(wal_dir, DEFAULT_SEGMENT_MAX)
    }

    pub fn with_max_segment(wal_dir: impl AsRef<Path>, segment_max_bytes: u64) -> io::Result<Self> {
        let wal_dir = wal_dir.as_ref().to_path_buf();
        std::fs::create_dir_all(&wal_dir)?;
        std::fs::create_dir_all(wal_dir.join("archive"))?;

        let current_path = wal_dir.join("current.wal");
        let current_size = if current_path.exists() {
            std::fs::metadata(&current_path)?.len()
        } else {
            0
        };

        Ok(Self {
            wal_dir,
            current_path,
            segment_max_bytes,
            current_size,
        })
    }

    #[instrument(skip(self, entry), fields(op = ?entry.op))]
    pub fn append(&mut self, entry: &WalEntry) -> io::Result<()> {
        let encoded = entry.encode();
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.current_path)?;
        file.write_all(&encoded)?;
        file.flush()?;
        self.current_size += encoded.len() as u64;

        if self.current_size >= self.segment_max_bytes {
            self.rotate()?;
        }

        debug!(bytes = encoded.len(), "WAL entry appended");
        Ok(())
    }

    #[instrument(skip(self))]
    pub fn rotate(&mut self) -> io::Result<()> {
        if !self.current_path.exists() || self.current_size == 0 {
            return Ok(());
        }

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        let archive_name = format!("segment-{timestamp}.wal");
        let archive_path = self.wal_dir.join("archive").join(archive_name);

        std::fs::rename(&self.current_path, &archive_path)?;
        self.current_size = 0;

        debug!(archive = %archive_path.display(), "WAL segment rotated");
        Ok(())
    }

    pub fn recover(&self) -> io::Result<Vec<WalEntry>> {
        let mut entries = Vec::new();

        // Replay archived segments first (by name, which sorts chronologically)
        let archive_dir = self.wal_dir.join("archive");
        if archive_dir.exists() {
            let mut segments: Vec<_> = std::fs::read_dir(&archive_dir)?
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.path()
                        .extension()
                        .map(|ext| ext == "wal")
                        .unwrap_or(false)
                })
                .collect();
            segments.sort_by_key(|e| e.file_name());

            for segment in segments {
                let data = std::fs::read(segment.path())?;
                Self::decode_entries(&data, &mut entries)?;
            }
        }

        // Then replay current segment
        if self.current_path.exists() {
            let data = std::fs::read(&self.current_path)?;
            Self::decode_entries(&data, &mut entries)?;
        }

        debug!(count = entries.len(), "WAL recovery complete");
        Ok(entries)
    }

    fn decode_entries(data: &[u8], entries: &mut Vec<WalEntry>) -> io::Result<()> {
        let mut offset = 0;
        while offset < data.len() {
            match WalEntry::decode(&data[offset..]) {
                Ok((entry, consumed)) => {
                    entries.push(entry);
                    offset += consumed;
                }
                Err(e) => {
                    warn!(offset, error = %e, "WAL decode error — stopping replay at this point");
                    break;
                }
            }
        }
        Ok(())
    }

    pub fn clear(&mut self) -> io::Result<()> {
        if self.current_path.exists() {
            std::fs::remove_file(&self.current_path)?;
        }
        self.current_size = 0;

        let archive_dir = self.wal_dir.join("archive");
        if archive_dir.exists() {
            for entry in std::fs::read_dir(&archive_dir)? {
                let entry = entry?;
                if entry.path().extension().map(|e| e == "wal").unwrap_or(false) {
                    std::fs::remove_file(entry.path())?;
                }
            }
        }

        Ok(())
    }

    pub fn current_size(&self) -> u64 {
        self.current_size
    }

    pub fn segment_count(&self) -> io::Result<usize> {
        let archive_dir = self.wal_dir.join("archive");
        let archived = if archive_dir.exists() {
            std::fs::read_dir(&archive_dir)?
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.path()
                        .extension()
                        .map(|ext| ext == "wal")
                        .unwrap_or(false)
                })
                .count()
        } else {
            0
        };
        let current = if self.current_path.exists() && self.current_size > 0 {
            1
        } else {
            0
        };
        Ok(archived + current)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn entry_encode_decode_roundtrip() {
        let hash = blake3::hash(b"test block").as_bytes().to_owned();
        let entry = WalEntry::new(OpType::PutBlock, hash, b"hello world".to_vec());
        let encoded = entry.encode();
        let (decoded, consumed) = WalEntry::decode(&encoded).unwrap();

        assert_eq!(consumed, encoded.len());
        assert_eq!(decoded.op, OpType::PutBlock);
        assert_eq!(decoded.hash, hash);
        assert_eq!(decoded.payload, b"hello world");
    }

    #[test]
    fn wal_append_and_recover() {
        let dir = tempdir().unwrap();
        let wal_path = dir.path().join("wal");
        let mut wal = WalManager::new(&wal_path).unwrap();

        let hash1 = blake3::hash(b"block-1").as_bytes().to_owned();
        let hash2 = blake3::hash(b"block-2").as_bytes().to_owned();

        wal.append(&WalEntry::new(OpType::PutBlock, hash1, b"data-1".to_vec()))
            .unwrap();
        wal.append(&WalEntry::new(OpType::LinkThread, hash2, b"link-data".to_vec()))
            .unwrap();

        let entries = wal.recover().unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].op, OpType::PutBlock);
        assert_eq!(entries[1].op, OpType::LinkThread);
    }

    #[test]
    fn wal_rotation() {
        let dir = tempdir().unwrap();
        let wal_path = dir.path().join("wal");
        // Small segment max to trigger rotation
        let mut wal = WalManager::with_max_segment(&wal_path, 100).unwrap();

        let hash = blake3::hash(b"block").as_bytes().to_owned();
        let large_payload = vec![0u8; 80];

        wal.append(&WalEntry::new(OpType::PutBlock, hash, large_payload.clone()))
            .unwrap();

        // After append of a large entry, it should have rotated
        let archive_dir = wal_path.join("archive");
        let archived: Vec<_> = std::fs::read_dir(&archive_dir)
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map(|ext| ext == "wal").unwrap_or(false))
            .collect();
        assert!(!archived.is_empty(), "should have archived segments after rotation");

        // Append another entry
        std::thread::sleep(std::time::Duration::from_millis(2));
        wal.append(&WalEntry::new(OpType::PutBlock, hash, large_payload))
            .unwrap();

        // Recovery should find both entries across segments
        let entries = wal.recover().unwrap();
        assert_eq!(entries.len(), 2);
    }

    #[test]
    fn wal_clear() {
        let dir = tempdir().unwrap();
        let wal_path = dir.path().join("wal");
        let mut wal = WalManager::new(&wal_path).unwrap();

        let hash = blake3::hash(b"block").as_bytes().to_owned();
        wal.append(&WalEntry::new(OpType::PutBlock, hash, vec![]))
            .unwrap();
        assert!(!wal.recover().unwrap().is_empty());

        wal.clear().unwrap();
        assert!(wal.recover().unwrap().is_empty());
    }

    #[test]
    fn crc_detects_corruption() {
        let hash = blake3::hash(b"test").as_bytes().to_owned();
        let entry = WalEntry::new(OpType::PutBlock, hash, b"data".to_vec());
        let mut encoded = entry.encode();

        // Corrupt one byte
        encoded[10] ^= 0xFF;

        assert!(WalEntry::decode(&encoded).is_err());
    }

    #[test]
    fn op_type_roundtrip() {
        for op in [
            OpType::PutBlock,
            OpType::LinkThread,
            OpType::CompleteWorkflow,
            OpType::DeleteBlock,
        ] {
            assert_eq!(OpType::from_byte(op as u8), Some(op));
        }
        assert_eq!(OpType::from_byte(0xFF), None);
    }
}
