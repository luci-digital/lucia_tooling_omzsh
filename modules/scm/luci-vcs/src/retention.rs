// LDS-tier-aware retention policies for the .lucia/ block store.
// LDS: 700.528 | 528 Hz
//
// Each frequency tier has a configurable TTL. Crown (963 Hz) blocks are
// permanent; Root (432 Hz) blocks expire after 90 days. The compactor
// uses these policies during GC passes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RetentionError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("toml parse error: {0}")]
    TomlParse(#[from] toml::de::Error),
    #[error("unknown tier: {0}")]
    UnknownTier(u32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierPolicy {
    pub ttl_days: i64,
    #[serde(default)]
    pub label: String,
}

impl TierPolicy {
    pub fn is_permanent(&self) -> bool {
        self.ttl_days < 0
    }

    pub fn ttl(&self) -> Option<Duration> {
        if self.is_permanent() {
            None
        } else {
            Some(Duration::from_secs(self.ttl_days as u64 * 86400))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompactionConfig {
    pub interval_hours: u32,
    pub min_block_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    pub default: TierPolicy,
    #[serde(default)]
    pub tiers: HashMap<String, TierPolicy>,
    #[serde(default)]
    pub compaction: Option<CompactionConfig>,
}

impl RetentionPolicy {
    pub fn load(path: impl AsRef<Path>) -> Result<Self, RetentionError> {
        let content = std::fs::read_to_string(path)?;
        let policy: RetentionPolicy = toml::from_str(&content)?;
        Ok(policy)
    }

    pub fn tier_policy(&self, frequency_hz: u32) -> &TierPolicy {
        self.tiers
            .get(&frequency_hz.to_string())
            .unwrap_or(&self.default)
    }

    pub fn should_retain(&self, frequency_hz: u32, age: Duration) -> bool {
        let policy = self.tier_policy(frequency_hz);
        match policy.ttl() {
            None => true,
            Some(ttl) => age < ttl,
        }
    }

    pub fn compaction_interval(&self) -> Duration {
        let hours = self
            .compaction
            .as_ref()
            .map(|c| c.interval_hours)
            .unwrap_or(24);
        Duration::from_secs(hours as u64 * 3600)
    }

    pub fn min_block_size(&self) -> usize {
        self.compaction
            .as_ref()
            .map(|c| c.min_block_size)
            .unwrap_or(256 * 1024)
    }
}

impl Default for RetentionPolicy {
    fn default() -> Self {
        let mut tiers = HashMap::new();
        tiers.insert(
            "963".into(),
            TierPolicy {
                ttl_days: -1,
                label: "permanent".into(),
            },
        );
        tiers.insert(
            "852".into(),
            TierPolicy {
                ttl_days: 365,
                label: "annual".into(),
            },
        );
        tiers.insert(
            "741".into(),
            TierPolicy {
                ttl_days: 365,
                label: "annual".into(),
            },
        );
        tiers.insert(
            "639".into(),
            TierPolicy {
                ttl_days: 180,
                label: "semi-annual".into(),
            },
        );
        tiers.insert(
            "528".into(),
            TierPolicy {
                ttl_days: 180,
                label: "semi-annual".into(),
            },
        );
        tiers.insert(
            "432".into(),
            TierPolicy {
                ttl_days: 90,
                label: "quarterly".into(),
            },
        );

        Self {
            default: TierPolicy {
                ttl_days: 180,
                label: "default".into(),
            },
            tiers,
            compaction: Some(CompactionConfig {
                interval_hours: 24,
                min_block_size: 256 * 1024,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crown_tier_is_permanent() {
        let policy = RetentionPolicy::default();
        assert!(policy.should_retain(963, Duration::from_secs(86400 * 10000)));
    }

    #[test]
    fn root_tier_expires_at_90_days() {
        let policy = RetentionPolicy::default();
        assert!(policy.should_retain(432, Duration::from_secs(86400 * 89)));
        assert!(!policy.should_retain(432, Duration::from_secs(86400 * 91)));
    }

    #[test]
    fn pac_tier_expires_at_365_days() {
        let policy = RetentionPolicy::default();
        assert!(policy.should_retain(741, Duration::from_secs(86400 * 364)));
        assert!(!policy.should_retain(741, Duration::from_secs(86400 * 366)));
    }

    #[test]
    fn unknown_tier_uses_default() {
        let policy = RetentionPolicy::default();
        assert!(policy.should_retain(999, Duration::from_secs(86400 * 179)));
        assert!(!policy.should_retain(999, Duration::from_secs(86400 * 181)));
    }

    #[test]
    fn load_from_toml() {
        let toml_str = r#"
[default]
ttl_days = 180
label = "default"

[tiers.963]
ttl_days = -1
label = "permanent"

[tiers.432]
ttl_days = 90
label = "quarterly"

[compaction]
interval_hours = 24
min_block_size = 262144
"#;
        let policy: RetentionPolicy = toml::from_str(toml_str).unwrap();
        assert!(policy.should_retain(963, Duration::from_secs(86400 * 10000)));
        assert!(!policy.should_retain(432, Duration::from_secs(86400 * 91)));
    }
}
