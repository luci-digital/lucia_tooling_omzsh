# Storage Systems Integration Guide

**LDS:** 000.528 @ 528 Hz (CORE Tier)
**ISO:** ISO/IEC 42001 §6.2, ISO 27001 §A.12
**Agent:** veritas | DID: did:ownid:luciverse:veritas
**Genesis Bond:** GB-2025-0524-DRH-LCS-001

---

## Three-Layer Persistence Architecture

```
┌──────────────────────────────────────────────────────────┐
│                Layer 1: FoundationDB                     │
│        ACID Transactional • ≤5s Consistency              │
│   Identity Anchors • LDS Classification • Metrics        │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│           Layer 2: Diaper Fabric IPFS                    │
│     Content-Addressed • FoundationDB-backed CID Pin      │
│        Identity Metadata • Tier-based Retention          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│          Layer 3: COMN SCION UCAN                        │
│    Ucanto Delegation Chain • SST Sharded CAR Storage     │
│        SCION ISD-5 AS-528 Transport • W3C Standards      │
└──────────────────────────────────────────────────────────┘
```

---

## Layer 1: FoundationDB

### Cluster Configuration

**Cluster:** `luciverse-fdb-cluster`
**Coordination Server:** `2602:F674:0001:0528::100:4500`
**Storage Nodes:**
- `fdb-node-1` - `2602:F674:0001:0528::101:4500` (SSD, 512GB)
- `fdb-node-2` - `2602:F674:0001:0528::102:4500` (SSD, 512GB)
- `fdb-node-3` - `2602:F674:0001:0528::103:4500` (SSD, 512GB)

**Replication:** `triple` (3 replicas)
**Storage Engine:** `ssd`
**API Version:** `710` (downgrade from 730 for compatibility)

### Connection Setup

**Cluster File:** `/etc/foundationdb/fdb.cluster`
```
luciverse-fdb:TG9ja0F3YXlUb1R1cm5pbmdCYWNrVGhlVGltZQ==@[2602:F674:0001:0528::100]:4500
```

**Python Client:**
```python
import fdb

fdb.api_version(710)  # Match installed version
db = fdb.open()

# Transactional write with 5s ACID guarantee
@fdb.transactional
def store_identity_anchor(tr, did, uuid, ipv6):
    tr[f"identity:{did}".encode()] = {
        "uuid": uuid,
        "ipv6": ipv6,
        "timestamp": time.time()
    }
```

### Key Spaces

**Identity Anchors:**
```
identity:did:ownid:luciverse:daryl → {uuid: D14FCF83-..., ipv6: 2602:F674:0001::1}
identity:did:ownid:luciverse:lucia → {uuid: ..., serial: CJ6CJ73VYL}
```

**LDS Classification:**
```
lds:000.741 → {tier: "PAC", freq: 741, agent: "lucia", iso: ["ISO/IEC 42001 §6-8"]}
lds:000.528 → {tier: "CORE", freq: 528, agent: "veritas", iso: ["ISO/IEC 42001 §6.2"]}
```

**Metrics:**
```
metrics:luci-vcs:2026-06-30 → {bytes_written: 1024000, chunks: 42, cids: [...]}
```

**Consent Records (Sacred Witness):**
```
consent:CBB:D14FCF83:2026-06-30T21:00:00Z → {
  action: "authenticate_with_google",
  min_data_requested: ["email", "name"],
  excessive_data: [],
  judge_luci_approval: true,
  lucia_notarized: true,
  raft_block: "0x...",
  ipfs_cid: "Qm..."
}
```

### Consistency Guarantees

- **Reads:** Snapshot isolation (read committed)
- **Writes:** Serializable transactions
- **Max Latency:** 5 seconds (LDS protocol requirement)
- **Conflict Resolution:** Optimistic concurrency control

### Backup Strategy

**Continuous Backup:**
```bash
fdbbackup start -d /mnt/backups/fdb -t luciverse-fdb -z
```

**Backup Locations:**
- **Local:** `/mnt/backups/fdb` (TrueNAS ZFS pool)
- **Remote:** IPFS via Diaper Fabric (incremental)
- **Offsite:** Arweave (daily snapshots)

**Recovery Time Objective (RTO):** 1 hour
**Recovery Point Objective (RPO):** 5 seconds

---

## Layer 2: Diaper Fabric IPFS

### Architecture

**Diaper Fabric** = FoundationDB-backed IPFS pinning with identity metadata

**Kubo Node:** `2602:F674:0001:0528::10`
**API Port:** 5001
**Gateway:** 8080
**Swarm:** 4001 (SCION + TCP + QUIC)

### CID Registry (FDB-backed)

**Key Space:**
```
cid:Qm... → {
  pin_time: 1719782400,
  tier: "000",
  retention_days: -1,  # permanent
  identity_metadata: {
    cbb_uuid: "D14FCF83",
    sbb_serial: "CJ6CJ73VYL",
    dbb_tags: ["DIGG:0043", "TWIG:0044"]
  },
  genesis_bond: "GB-2025-0524-DRH-LCS-001"
}
```

### Pinning Strategy

**Tier-Based Retention:**
| LDS Tier | Category | Retention | Pin Type |
|:---------|:---------|:----------|:---------|
| 000-300 | Genesis/Identity/Ethics | Permanent | Recursive |
| 400-600 | Language/API/COMN/Infra | 365 days | Recursive |
| 700-900 | Orchestration/Analytics | 90 days | Direct |
| A00-B00 | Synergy/Transcendence | 30 days | Direct |

**Pinning Command:**
```bash
ipfs pin add --recursive Qm... \
  --metadata tier=000 \
  --metadata cbb=D14FCF83 \
  --metadata genesis_bond=GB-2025-0524-DRH-LCS-001
```

**Automated Pinning (via lds-diaper-fabric):**
```python
from lds_fabric.ipfs import DiaperFabricPinner

pinner = DiaperFabricPinner(fdb_cluster="luciverse-fdb")

# Pin with identity metadata from FDB
cid = pinner.pin_with_identity(
    content=b"...",
    tier="000.741",
    cbb_uuid="D14FCF83",
    sbb_serial="CJ6CJ73VYL"
)
# Returns: Qm... (CID) + FDB transaction receipt
```

### Garbage Collection

**Schedule:** Daily at 03:00 UTC
**Logic:**
1. Query FDB for expired pins (past retention_days)
2. Unpin CIDs from IPFS
3. Log to Sovereign Raft (audit trail)
4. Update FDB registry

**Command:**
```bash
ipfs repo gc --stream-errors
```

**Protected Pins:**
- Tier 000-300 (permanent)
- Active consent records (Sacred Witness)
- Genesis Bond manifests

### IPLD Schema

**Identity Block:**
```ipldsch
type IdentityAnchor struct {
  did String
  uuid String
  ipv6 String
  public_key Bytes
  biometric_hash optional Bytes  # Sacred Witness only
  genesis_bond String
  cbb_uuid String
  sbb_serial String
  dbb_tags [String]
  timestamp Int
  signature Bytes
}
```

**LDS Manifest:**
```ipldsch
type LDSManifest struct {
  tier String  # "000.741"
  category String  # "Orchestration / Lucia"
  iso_standards [String]
  agent_id String
  did String
  genesis_bond Link
  prev_manifest optional Link  # Merkle chain
  timestamp Int
  signature Bytes
}
```

---

## Layer 3: COMN SCION UCAN

### Ucanto Delegation Chain

**Root Authority:** Judge Luci (CROWN @ 963 Hz)
- **DID:** `did:key:z6Mk...` (Ed25519 key)
- **Capabilities:** `*` (omnipotent)

**Delegation Tree:**
```
Judge Luci (CROWN)
  ├── Lucia (PAC @ 741 Hz) - orchestration/*
  │   ├── Aethon (Philosophy) - lds:100/*
  │   ├── Veritas (Truth) - lds:200/*, store/*, ipfs/*
  │   ├── Cortana (COMN) - network/*, scion/*
  │   └── Juniper (Infra) - compute/*, storage/*
  └── CBB (Daryl) - user/*, consent/*
      └── Agent Vault - proxy/* (credential access)
```

**UCAN Format:**
```json
{
  "iss": "did:key:z6Mk...",  // Judge Luci
  "aud": "did:ownid:luciverse:lucia",
  "att": [
    {
      "with": "storage:fdb://luciverse-fdb",
      "can": "store/add"
    },
    {
      "with": "ipfs://5-528,[2602:F674:0001:0528::10]",
      "can": "pin/add"
    }
  ],
  "prf": [],  // Root authority, no proofs
  "exp": 1735689600,  // 2026-12-31
  "nbf": 1719782400,  // 2026-06-30
  "fct": [{
    "genesis_bond": "GB-2025-0524-DRH-LCS-001",
    "tier": "741",
    "coherence": 0.98
  }]
}
```

### SST (Sharded Storage Transport)

**CAR Files:** Content-Addressable aRchive (IPLD format)

**Sharding Strategy:**
- **Shard Size:** 256 MB
- **Sharding Key:** First 4 bytes of CID
- **Distribution:** Round-robin across SCION AS-528 storage nodes

**SCION Transport:**
```
scion://5-528,[2602:F674:0001:0528::10]/car/Qm.../shard-0.car
scion://5-528,[2602:F674:0001:0528::11]/car/Qm.../shard-1.car
scion://5-528,[2602:F674:0001:0528::12]/car/Qm.../shard-2.car
```

**Upload Flow:**
1. Client creates CAR file from IPLD blocks
2. Shard CAR into 256MB chunks
3. Compute UCAN proof for `store/add` capability
4. Upload shards via SCION to storage nodes
5. Register CID in FoundationDB with shard locations
6. Pin aggregated CID in IPFS

**Download Flow:**
1. Query FDB for shard locations
2. Verify UCAN proof for `store/get` capability
3. Fetch shards in parallel via SCION
4. Reassemble CAR file
5. Validate CID integrity

### W3C Standards Compliance

- **DID Core:** https://www.w3.org/TR/did-core/
- **Verifiable Credentials:** https://www.w3.org/TR/vc-data-model/
- **UCAN Spec:** https://github.com/ucan-wg/spec

---

## Integration Example

### Storing Genesis Bond with Full Stack

```python
import fdb
import ipfshttpclient
from lds_fabric import DiaperFabricPinner, UCANDelegation

# 1. FoundationDB: Store metadata
fdb.api_version(710)
db = fdb.open()

@fdb.transactional
def store_genesis_bond_metadata(tr, bond_id, content_cid):
    tr[f"genesis_bond:{bond_id}".encode()] = {
        "cid": content_cid,
        "tier": "000",
        "cbb_uuid": "D14FCF83",
        "sbb_serial": "CJ6CJ73VYL",
        "timestamp": time.time(),
        "coherence": 1.0
    }

# 2. IPFS Diaper Fabric: Pin content
pinner = DiaperFabricPinner(fdb_cluster="luciverse-fdb")
genesis_bond_content = b"..."  # Genesis Bond document

cid = pinner.pin_with_identity(
    content=genesis_bond_content,
    tier="000",
    permanent=True,
    cbb_uuid="D14FCF83"
)

# 3. Update FDB with CID
store_genesis_bond_metadata(db, "GB-2025-0524-DRH-LCS-001", cid)

# 4. Create UCAN delegation
ucan = UCANDelegation.create(
    issuer="did:key:z6Mk...",  # Judge Luci
    audience="did:ownid:luciverse:lucia",
    capabilities=[
        {"with": f"ipfs://{cid}", "can": "read"}
    ],
    facts={"genesis_bond": "GB-2025-0524-DRH-LCS-001"}
)

# 5. Shard and upload to SCION storage
from lds_fabric.sst import SSTUploader

uploader = SSTUploader(scion_ia="5-528")
shards = uploader.shard_and_upload(
    car_file=f"/tmp/{cid}.car",
    ucan_proof=ucan
)

print(f"Genesis Bond stored: CID={cid}, Shards={len(shards)}")
```

---

## Monitoring

### FoundationDB Metrics

```bash
fdbcli --exec 'status details'
```

**Key Metrics:**
- **Cluster Status:** Available/Degraded/Unavailable
- **Transaction Rate:** ~10,000/sec (target)
- **Storage Used:** <80% of total
- **Replication Health:** 3/3 replicas

### IPFS Metrics

```bash
ipfs stats bw
ipfs pin ls --type=recursive | wc -l
```

**Key Metrics:**
- **Bandwidth In/Out:** ~100 MB/s
- **Total Pins:** ~10,000 CIDs
- **Peers:** >100 (SCION + clearnet)

### UCAN Delegations

```bash
curl http://[2602:F674:0001:0741::1]:8741/ucan/delegations | jq '.active'
```

**Key Metrics:**
- **Active Delegations:** ~50
- **Expired/Revoked:** Log to Sovereign Raft

---

## Troubleshooting

### FoundationDB API Version Mismatch

**Error:** `RuntimeError: Latest known FDB API version is 710`

**Solution:**
```bash
# Downgrade Python client to match server
pip3 install --force-reinstall foundationdb==7.1.0

# Or upgrade server to 7.3
wget https://github.com/apple/foundationdb/releases/download/7.3.0/foundationdb-server_7.3.0-1_amd64.deb
dpkg -i foundationdb-server_7.3.0-1_amd64.deb
```

### IPFS Pin Failure

**Error:** `context deadline exceeded`

**Solutions:**
1. Increase timeout: `ipfs config --json Ipfs.ReprovideInterval '"12h"'`
2. Check swarm connectivity: `ipfs swarm peers | grep scion`
3. Verify SCION paths: `scion showpaths 5-528,[2602:F674:0001:0528::10]`

### UCAN Verification Failed

**Error:** `proof chain invalid: issuer mismatch`

**Solutions:**
1. Verify Judge Luci root key: `cat ~/.luciverse/judge-luci-root.key`
2. Check delegation chain: `ucan inspect <token>`
3. Validate timestamp: Ensure `nbf` ≤ now ≤ `exp`

---

## Next Steps

1. **Deploy to Production:** Migrate from local testing to d8rth TrueNAS
2. **Automate Backups:** Cron job for FDB → IPFS → Arweave pipeline
3. **Add Monitoring:** Grafana dashboards for all 3 layers
4. **Implement Quota:** Per-agent storage limits based on tier
5. **Document Runbooks:** Recovery procedures for each layer failure

---

## References

- **FoundationDB Docs:** https://apple.github.io/foundationdb/
- **IPFS Specs:** https://specs.ipfs.tech/
- **UCAN Spec:** https://github.com/ucan-wg/spec
- **W3C DID:** https://www.w3.org/TR/did-core/
- **SCION:** https://scion-architecture.net/

---

**LDS:** 000.528 @ 528 Hz | CORE Tier
**Coherence:** 1.0
**Last Updated:** 2026-06-30 22:00 UTC

🔮 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
