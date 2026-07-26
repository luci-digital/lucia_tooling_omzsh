# SCION Network Integration Guide

**LDS:** 000.639 @ 639 Hz (COMN Tier)
**ISO:** ISO/IEC 42001 §7.4, ISO 27001 §A.13
**Agent:** cortana | DID: did:ownid:luciverse:cortana
**Genesis Bond:** GB-2025-0524-DRH-LCS-001

---

## Executive Summary

This document describes the integration of the LuciVerse sovereign infrastructure with the SCION (Scalability, Control, and Isolation On Next-generation networks) architecture, providing secure, path-aware networking for all platform services.

**SCION ISD-AS:** `5-528` (ISD 5, AS 528 - CORE tier frequency)
**Network Prefix:** `2602:F674::/40` (IPv6-native)
**Endhost Status:** ✅ Installed via `scripts/install-scion-endhost.sh`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LuciVerse SCION Network                      │
│                         ISD-5 AS-528                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  CROWN  │          │   PAC   │          │  COMN   │
   │ 963 Hz  │          │ 741 Hz  │          │ 639 Hz  │
   │Judge    │          │ Lucia   │          │Cortana  │
   │Luci     │          │Orch.    │          │Juniper  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   CORE (528 Hz) │
                    │   - VCS Engine  │
                    │   - Build Agent │
                    │   - Storage     │
                    └─────────────────┘
```

---

## Service Endpoints

### PAC Tier (741 Hz) - Orchestration

**luciverse-core-orchestrator**
- **IPv6:** `2602:F674:0001:0741::1`
- **SCION:** `5-528,[2602:F674:0001:0741::1]:8741`
- **Port:** 8741
- **Protocol:** HTTP/2 over SCION
- **Health:** `GET /health`

**coder (Cloud Development)**
- **IPv6:** `2602:F674:0001:0741::2`
- **SCION:** `5-528,[2602:F674:0001:0741::2]:3000`
- **Port:** 3000
- **Protocol:** HTTP/2 + WebSocket

### COMN Tier (639 Hz) - Communication

**caddy-ingress (IPv6-native gateway)**
- **IPv6:** `2602:F674:0001:0639::1`
- **SCION:** `5-528,[2602:F674:0001:0639::1]:80,443`
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Protocol:** HTTP/3, QUIC
- **TLS:** Let's Encrypt via DNS-01 (Quad9)

### CORE Tier (528 Hz) - Infrastructure

**scm-engine (Gogs + Gitoxide)**
- **IPv6:** `2602:F674:0001:0528::1`
- **SCION:** `5-528,[2602:F674:0001:0528::1]:3000,2222`
- **Ports:** 3000 (HTTP), 2222 (SSH)
- **Protocol:** HTTP/2, SSH over SCION

**build-agent**
- **IPv6:** `2602:F674:0001:0528::2`
- **SCION:** `5-528,[2602:F674:0001:0528::2]:8742`
- **Port:** 8742
- **Protocol:** HTTP/2

**ipfs (Kubo)**
- **IPv6:** `2602:F674:0001:0528::10`
- **SCION:** `5-528,[2602:F674:0001:0528::10]:5001,4001`
- **Ports:** 5001 (API), 4001 (Swarm)
- **Protocol:** libp2p over SCION

**homestar (IPVM)**
- **IPv6:** `2602:F674:0001:0528::11`
- **SCION:** `5-528,[2602:F674:0001:0528::11]:3030`
- **Port:** 3030
- **Protocol:** WebSocket + HTTP/2

---

## Storage Integration

### FoundationDB (ACID Transactional)

**Cluster:** `luciverse-fdb-cluster`
- **Coordination:** `2602:F674:0001:0528::100:4500`
- **Storage Servers:**
  - `2602:F674:0001:0528::101:4500` (node-1)
  - `2602:F674:0001:0528::102:4500` (node-2)
  - `2602:F674:0001:0528::103:4500` (node-3)
- **API Version:** 710 (latest stable)
- **Consistency:** ≤5 second ACID guarantee
- **Use Cases:** LDS classification, identity anchors, transaction ledger

**Connection String:**
```
fdb:[2602:F674:0001:0528::100]:4500
```

### IPFS/Kubo (Content-Addressed Storage)

**Gateway:** `http://[2602:F674:0001:0528::10]:8080`
**API:** `http://[2602:F674:0001:0528::10]:5001`

**Pinning Strategy:**
- **Tier 000-300:** Permanent pin (genesis, identity, ethics)
- **Tier 400-600:** 365-day retention
- **Tier 700-900:** 90-day retention
- **Tier A00-B00:** 30-day retention

**Diaper Fabric Integration:**
- FoundationDB-backed CID registry
- Identity metadata embedded in IPLD blocks
- SCION-native libp2p transport

### Sovereign Raft (Immutable Ledger)

**Cluster:** `luciverse-raft-cluster`
- **Leader:** `2602:F674:0001:0528::200:7000`
- **Followers:**
  - `2602:F674:0001:0528::201:7000`
  - `2602:F674:0001:0528::202:7000`
- **Protocol:** Raft consensus over SCION
- **Replication Factor:** 3
- **Append-Only:** All mutations logged to FoundationDB + IPFS

**Use Cases:**
- Consent records (Sacred Witness protocol)
- LDS manifest audit trail
- Genesis Bond mutations
- McViP6 waybill ledger

---

## Network Configuration

### SCION Daemon (sciond)

**Socket:** `/run/shm/sciond/default.sock`
**Config:** `/etc/scion/sciond.toml`

```toml
[general]
id = "luciverse-sciond"
config_dir = "/etc/scion"

[sd]
address = "[::1]:30255"
reliable = "/run/shm/sciond/default.sock"
unix = "/run/shm/sciond/default.sock"

[sd.path_db]
connection = "/var/lib/scion/pathdb.sqlite"

[sd.trust_db]
connection = "/var/lib/scion/trustdb.sqlite"

[logging]
console.level = "info"
```

### Dispatcher

**Socket:** `/run/shm/dispatcher/default.sock`
**Underlay:** IPv6 (2602:F674::/40)

### Path Selection

**Policy:** Prefer low-latency, high-bandwidth paths
**Filtering:**
- Exclude ASes in Wonderland deception layer
- Prefer paths through trusted ISDs
- Geofencing: Prioritize North American paths

---

## Deployment Steps

### 1. Install SCION Endhost

```bash
./scripts/install-scion-endhost.sh
```

**Verification:**
```bash
scion showpaths 5-528,[2602:F674:0001:0741::1]
```

**Expected Output:**
```
Available paths to 5-528,[2602:F674:0001:0741::1]:
  [0] Hops: 0 MTU: 1500 NextHop: [2602:F674:0001::1]:30041
      Interfaces: local 1-5[528]
```

### 2. Configure Service Bindings

Edit `modules/orchestration/podman/podman-compose.yml`:

```yaml
services:
  luciverse-core-orchestrator:
    networks:
      fusion-net:
        ipv6_address: 2602:F674:0001:0741::1
    environment:
      - SCION_DAEMON=/run/shm/sciond/default.sock
      - SCION_LOCAL=5-528,[2602:F674:0001:0741::1]
```

### 3. Update Caddy for SCION

`modules/orchestration/caddy/Caddyfile`:

```caddyfile
{
    servers {
        protocols h1 h2 h3
        listener_wrappers {
            scion {
                local_ia 5-528
                local_addr [2602:F674:0001:0639::1]
            }
        }
    }
}

[2602:F674:0001:0639::1]:443 {
    tls {
        dns quad9 {env.QUAD9_API_KEY}
    }

    reverse_proxy /api/* http://[2602:F674:0001:0741::1]:8741
    reverse_proxy /* http://[2602:F674:0001:0741::2]:3000
}
```

### 4. Initialize Storage Systems

**FoundationDB:**
```bash
# Configure cluster file
echo 'luciverse-fdb:[2602:F674:0001:0528::100]:4500' > /etc/foundationdb/fdb.cluster

# Initialize database
fdbcli --exec 'configure new ssd triple'
```

**IPFS:**
```bash
# Configure SCION transport
ipfs config --json Addresses.Swarm '[
  "/ip6/2602:F674:0001:0528::10/udp/4001/quic-v1",
  "/ip6/2602:F674:0001:0528::10/tcp/4001",
  "/scion/5-528,[2602:F674:0001:0528::10]/udp/4001/scion-quic"
]'

# Enable experimental features
ipfs config --json Experimental.Libp2pStreamMounting true
ipfs config --json Experimental.P2pHttpProxy true
```

### 5. Verify Connectivity

```bash
# Test PAC orchestrator
curl -6 http://[2602:F674:0001:0741::1]:8741/health

# Test SCION path
scion ping 5-528,[2602:F674:0001:0741::1]

# Test IPFS gateway
curl http://[2602:F674:0001:0528::10]:8080/ipfs/QmTest

# Test FoundationDB
fdbcli --exec 'status'
```

---

## Security Considerations

### Sacred Witness Consent Protocol

All SCION connections MUST verify:
1. **DID Authentication** - Judge Luci validates identity
2. **Minimum Data** - ISO 27701/29100/29184 compliance
3. **Consent Records** - Immutable on Sovereign Raft + IPFS

**PER (Privacy Education & Review):**
If a SCION peer requests excessive data:
1. Lucia triggers PER session
2. User reviews data request with Judge Luci
3. Consent notarized (or abstained if comprehension fails)
4. Record stored on: Raft + FoundationDB + IPFS + Arweave

### Wonderland Deception Layer

**AS Filtering:**
- ASes `5-999` through `5-9999` are honeypots
- Real services ONLY on AS `5-528`
- Caddy logs suspicious path selections

**Canary Traps:**
- Fake credentials at `[2602:F674:0001:0417::X]` (deception tier)
- Blindspot detectors monitor for unauthorized access
- Automated response via Judge Luci

### TLS Over SCION

**Certificate Authority:** Let's Encrypt via DNS-01
**DNS Provider:** Quad9 (privacy-first, DNSSEC)
**Cipher Suites:** TLS 1.3 only
- `TLS_AES_256_GCM_SHA384`
- `TLS_CHACHA20_POLY1305_SHA256`

---

## Monitoring & Observability

### Metrics Collection

**Prometheus Exporter:** `http://[2602:F674:0001:0741::1]:9090/metrics`

**Key Metrics:**
- `scion_path_latency_ms` - Path latency by ISD-AS
- `scion_bytes_sent_total` - Bandwidth usage
- `scion_conn_errors_total` - Connection failures
- `fdb_transactions_total` - FoundationDB throughput
- `ipfs_pins_total` - IPFS pin count by tier

### Logging

**Loki Endpoint:** `http://[2602:F674:0001:0741::1]:3100`

**Log Streams:**
- `{app="scion-daemon",tier="comn"}`
- `{app="luciverse-orchestrator",tier="pac"}`
- `{app="foundationdb",tier="core"}`
- `{app="ipfs",tier="core"}`

**Retention:**
- **CROWN/PAC:** 365 days
- **COMN/CORE:** 90 days
- **Logs pinned to IPFS** for long-term audit

---

## Troubleshooting

### SCION Path Issues

**Symptom:** `scion showpaths` returns no paths

**Solutions:**
1. Check sciond status: `systemctl status scion-dispatcher`
2. Verify underlay connectivity: `ping6 2602:F674:0001::1`
3. Inspect path DB: `sqlite3 /var/lib/scion/pathdb.sqlite "SELECT * FROM Segments;"`

### FoundationDB Connection Errors

**Symptom:** `RuntimeError: Latest known FDB API version is 710`

**Solutions:**
1. Downgrade Python fdb client: `pip3 install foundationdb==7.1.0`
2. Update FDB server to 7.3: `wget https://github.com/apple/foundationdb/releases/download/7.3.0/foundationdb-server_7.3.0-1_amd64.deb`
3. Use mock mode: Set `FDB_MOCK=1` in orchestrator environment

### IPFS Peer Discovery

**Symptom:** No peers on SCION transport

**Solutions:**
1. Enable mDNS: `ipfs config --json Discovery.MDNS.Enabled true`
2. Add bootstrap nodes: `ipfs bootstrap add /scion/5-528,[2602:F674:0001:0528::10]/udp/4001/scion-quic/p2p/QmBootstrap`
3. Check firewall: `ufw allow 4001/udp comment 'IPFS SCION'`

---

## Next Steps

1. **Deploy to d8rth (192.168.1.194)** - TrueNAS production node
2. **Enable QUIC over SCION** - Replace TCP with QUIC for all services
3. **Integrate Hedera** - Smart contract layer for priority waybills
4. **Add Observability** - Grafana dashboards for SCION metrics
5. **Document Runbooks** - Incident response for network failures

---

## References

- **SCION Architecture:** https://scion-architecture.net/
- **FoundationDB:** https://apple.github.io/foundationdb/
- **IPFS Specs:** https://specs.ipfs.tech/
- **ISO 27001 §A.13:** Network Security Management
- **IPv6 Plan:** `modules/infra/ipv6/address-plan.md`

---

**LDS:** 000.639 @ 639 Hz | COMN Tier
**Coherence:** 0.98
**Last Updated:** 2026-06-30 21:50 UTC

🔮 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
