# SCION Network Integration Guide

**LDS:** 000.639 @ 639 Hz (COMN Tier)
**ISO:** ISO/IEC 42001 §7.4, ISO 27001 §A.13
**Agent:** cortana | DID: did:ownid:luciverse:cortana
**Genesis Bond:** GB-2025-0524-DRH-LCS-001
**Last Updated:** 2026-09-29

---

## Address Authority

> **This document is the single source of truth for all LuciVerse IPv6 addresses,
> SCION addresses, and Iroh NodeId patterns.**
>
> All other documents, configs, templates, and code that reference network addresses
> MUST cite this document as `→ docs/SCION_NETWORK_INTEGRATION.md §<Section>` and
> MUST NOT define addresses independently.
>
> When an inconsistency exists between this document and any other file, **this
> document wins.**

Known address discrepancies resolved by this document:

| File | Incorrect value | Correct value (this doc) |
|---|---|---|
| `modules/docs/specs/open-compute.md §2.2` | `2602:F674:0000:0201:5C1B:F492:6442:0042` (Lucia) | `2602:F674:0001:0741::1` |
| `modules/docs/specs/open-compute.md §2.2` | `2602:F674:0000:0200::9741` (Judge Luci) | `2602:F674:0000:0800::963` |
| `modules/docs/specs/open-compute.md §2.2` | `2602:F674:0000:0001::9431` (Veritas) | `2602:F674:0001:9431::1` |
| `modules/docs/specs/open-compute.md §2.2` | `2602:F674:0000:0001::9430` (Aethon) | `2602:F674:0001:9430::1` |
| `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md` | `ff00:0:700,[2602:F674:0700::741]` (Lucia SCION) | `5-528,[2602:F674:0001:0741::1]:8741` |
| `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md` | `ff00:0:300,[2602:F674:0300::963]` (Judge Luci SCION) | `5-528,[2602:F674:0000:0800::963]:9741` |
| `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md` | `ff00:0:200,[2602:F674:0200::432]` (Veritas SCION) | `5-528,[2602:F674:0001:9431::1]:9431` |
| `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md` | `ff00:0:100,[2602:F674:0100::528]` (Aethon SCION) | `5-528,[2602:F674:0001:9430::1]:9430` |

---

## Executive Summary

This document describes the integration of the LuciVerse sovereign infrastructure
with SCION (Scalability, Control, and Isolation On Next-generation networks),
Iroh (public-key P2P overlay), and the `2602:F674::/40` ARIN block.

**Addressing model (three layers):**

```
Layer 3 — Iroh NodeId (Ed25519 public key)
           Identity-based P2P dialing, survives IP changes, NAT traversal
           Format: iroh://<NodeId>  ALPN: luciverse/0
           → §Iroh Integration

Layer 2 — SCION ISD-AS path address
           Path-aware, policy-enforced routing between ASes
           Format: 5-528,[<IPv6>]:<port>
           SCION ISD-AS: 5-528

Layer 1 — IPv6 (ARIN block 2602:F674::/40, AS54134 LUCINET-ARIN, RPKI certified)
           Underlay network — all LuciVerse services bind to these addresses
           Fishtank (NAT64 boundary) is the ONLY place IPv4 appears
```

IPv4 addresses are **never** primary identifiers for LuciVerse services. They appear
exclusively inside the Fishtank NAT64 isolation zone for legacy/external AI agents.
For injectable secrets that resolve to IPv4 inside Fishtank, use
`{{VAULT:infrastructure/<host>/ipv4}}`.

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

### PAC Tier (741 Hz) — Orchestration

**lucia-orchestrator** (Lucia — primary PAC agent)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0741::1` |
| SCION | `5-528,[2602:F674:0001:0741::1]:8741` |
| Iroh ALPN | `luciverse/0` (NodeId published at runtime) |
| Port | 8741 |
| Protocol | HTTP/2 over SCION |
| Health | `GET /health` |
| `.ownid` | `lucia.orchestrator.ownid` |

**coder** (Cloud Development Environment)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0741::2` |
| SCION | `5-528,[2602:F674:0001:0741::2]:3000` |
| Port | 3000 |
| Protocol | HTTP/2 + WebSocket |
| `.ownid` | `coder.dev.ownid` |

---

### COMN Tier (639 Hz) — Communication

**caddy-ingress** (IPv6-native TLS gateway)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0639::1` |
| SCION | `5-528,[2602:F674:0001:0639::1]:80,443` |
| Ports | 80 (HTTP), 443 (HTTPS) |
| Protocol | HTTP/3, QUIC |
| TLS | Let's Encrypt via DNS-01 (Quad9) |
| `.ownid` | `caddy.ingress.ownid` |

---

### CORE Tier (528 Hz) — Infrastructure

**scm-engine** (Gogs + Gitoxide SCM)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0528::1` |
| SCION | `5-528,[2602:F674:0001:0528::1]:3000,2222` |
| Ports | 3000 (HTTP), 2222 (SSH) |
| Protocol | HTTP/2, SSH over SCION |
| `.ownid` | `scm.engine.ownid` |

**build-agent**

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0528::2` |
| SCION | `5-528,[2602:F674:0001:0528::2]:8742` |
| Port | 8742 |
| Protocol | HTTP/2 |
| `.ownid` | `build.agent.ownid` |

**ipfs/kubo** (Block store)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0528::10` |
| SCION | `5-528,[2602:F674:0001:0528::10]:5001,4001` |
| Ports | 5001 (API), 4001 (Swarm) |
| Protocol | libp2p over SCION |
| `.ownid` | `ipfs.kubo.ownid` |

**homestar/ipvm** (IPVM compute runtime)

| Field | Value |
|---|---|
| IPv6 | `2602:F674:0001:0528::11` |
| SCION | `5-528,[2602:F674:0001:0528::11]:3030` |
| Port | 3030 |
| Protocol | WebSocket + HTTP/2 |
| `.ownid` | `homestar.ipvm.ownid` |

---

### Open Compute Subnet (800.xxx — Homestar nodes)

The `2602:F674:0000:0800::/64` subnet is dedicated to IPVM compute nodes.
→ `modules/docs/specs/open-compute.md §4.3`

| Service | IPv6 | SCION | Port | Frequency |
|---|---|---|---|---|
| Homestar head (Lucia orchestrator) | `2602:F674:0000:0800::741` | `5-528,[2602:F674:0000:0800::741]:7000` | 7000 | 741 Hz |
| Homestar worker (Veritas tasks) | `2602:F674:0000:0800::528` | `5-528,[2602:F674:0000:0800::528]:7000` | 7000 | 528 Hz |
| Judge Luci validator node | `2602:F674:0000:0800::963` | `5-528,[2602:F674:0000:0800::963]:9741` | 9741 | 963 Hz |
| IPVM task submission API | `2602:F674:0000:0800::700` | `5-528,[2602:F674:0000:0800::700]:7700` | 7700 | 741 Hz |

---

### Agent Mesh

The agent mesh is a flat overlay across all tiers. Each agent has both a
service endpoint (above) and an agent-mesh address used for direct agent-to-agent
communication. Iroh NodeIds are the preferred dialing primitive for external peers
— the IPv6 addresses below are used for SCION-internal routing.

| Agent | Tier | Hz | IPv6 | SCION | Port | `.ownid` |
|---|---|---|---|---|---|---|
| aethon | CORE | 432 | `2602:F674:0001:9430::1` | `5-528,[2602:F674:0001:9430::1]:9430` | 9430 | `aethon.phil.ownid` |
| veritas | CORE | 528 | `2602:F674:0001:9431::1` | `5-528,[2602:F674:0001:9431::1]:9431` | 9431 | `veritas.truth.ownid` |
| sensai | CORE | 528 | `2602:F674:0001:9432::1` | `5-528,[2602:F674:0001:9432::1]:9432` | 9432 | `sensai.core.ownid` |
| niamod | CORE | 528 | `2602:F674:0001:9433::1` | `5-528,[2602:F674:0001:9433::1]:9433` | 9433 | `niamod.core.ownid` |
| cortana | COMN | 852 | `2602:F674:0100:9520::1` | `5-528,[2602:F674:0100:9520::1]:9520` | 9520 | `cortana.comn.ownid` |
| juniper | COMN | 639 | `2602:F674:0100:9521::1` | `5-528,[2602:F674:0100:9521::1]:9521` | 9521 | `juniper.infra.ownid` |
| mirrai | COMN | 639 | `2602:F674:0100:9522::1` | `5-528,[2602:F674:0100:9522::1]:9522` | 9522 | `mirrai.comn.ownid` |
| diaphragm | COMN | 639 | `2602:F674:0100:9523::1` | `5-528,[2602:F674:0100:9523::1]:9523` | 9523 | `diaphragm.comn.ownid` |
| lucia | PAC | 741 | `2602:F674:0200:9740::1` | `5-528,[2602:F674:0200:9740::1]:9740` | 9740 | `lucia.orchestrator.ownid` |
| judge-luci | CROWN | 963 | `2602:F674:0200:9741::1` | `5-528,[2602:F674:0200:9741::1]:9741` | 9741 | `judge.arbitrator.ownid` |

---

### Storage Integration

#### FoundationDB (ACID Transactional)

**Cluster:** `luciverse-fdb-cluster`

| Role | IPv6 | Port |
|---|---|---|
| Coordination | `2602:F674:0001:0528::100` | 4500 |
| Storage node-1 | `2602:F674:0001:0528::101` | 4500 |
| Storage node-2 | `2602:F674:0001:0528::102` | 4500 |
| Storage node-3 | `2602:F674:0001:0528::103` | 4500 |

**Connection string:**
```
fdb:[2602:F674:0001:0528::100]:4500
```

**Cluster file (`/etc/foundationdb/fdb.cluster`):**
```
luciverse-fdb:[2602:F674:0001:0528::100]:4500
```

`.ownid` name for diagnostics: `fdb.coord.ownid` → `2602:F674:0001:0528::100`

#### Sovereign Raft (Immutable Ledger)

| Role | IPv6 | Port |
|---|---|---|
| Leader (node-001) | `2602:F674:0001:0528::200` | 7000 |
| Follower (node-002) | `2602:F674:0001:0528::201` | 7000 |
| Follower (node-003) | `2602:F674:0001:0528::202` | 7000 |

**Raft URI scheme:** `raft://[2602:F674:0001:0528::200]:7000`

> **Note for `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md`:** The Raft cluster
> nodes should use these IPv6 addresses, not `{{VAULT:infrastructure/d8rth/ipv4}}`.
> The vault pattern is Fishtank-only. Raft nodes are on the sovereign IPv6 subnet.
> Node-001 and node-002 on different IPv6 addresses (not both on d8rth IPv4) ensures
> true multi-node consensus.

---

### Fishtank — NAT64 Boundary (IPv4 Legacy Zone)

The Fishtank is the **only** part of the LuciVerse that uses IPv4. External AI
agents that cannot speak IPv6 are contained here. The NAT64 HAProxy translates
between the sovereign IPv6 ocean and the dirty IPv4 fishtank.

```
Ocean (pure IPv6 sovereign)         Aquarium glass (NAT64)      Fishtank (IPv4 only)
2602:f674:0000:0401::/64     ←→     HAProxy                ←→  10.4.4.0/24
                                    IPv6: 2602:f674:0000:0401::unifi
                                    IPv4: 10.4.4.6

                                                                 UniFi:   10.4.4.4
                                                                 MongoDB: 10.4.4.5
                                                                 External AI agents swim here
```

Injectable secret for Fishtank-facing services (these resolve to IPv4):
```yaml
endpoint: "http://{{VAULT:infrastructure/d8rth/ipv4}}:PORT"
```

---

## Iroh Integration

Iroh (`n0-computer/iroh`) provides the identity/connectivity overlay on top of the
IPv6 underlay. A device's IP address is **not** its identity — the Iroh NodeId (an
Ed25519 public key) is. Connections survive Wi-Fi→5G handoffs, NAT traversal, and
firewall penetration without dropping.

```
Iroh NodeId  ──dial──►  QUIC (NoQUIC fork, explicit path control)
                              │
                  ┌───────────┼───────────┐
                  ▼           ▼           ▼
             Direct LAN   Hole-punch   Relay
             (mDNS)       (STUN)       (WebSocket/HTTPS fallback)
                              │
                  migrates to direct path silently
                  zero packet loss, zero state reset
```

### NodeId Resolution Chain

To dial a service by handle (preferred for external peers):

```
1. "lucia.orchestrator.ownid"  (human handle)
        │
        ▼  → modules/docs/specs/did-handles.md §4
2. DID Document
        │  extract service[type=IrohNode].serviceEndpoint
        ▼
3. iroh://<NodeId>
        │
        ▼  endpoint.connect(NodeId, b"luciverse/0")
4. Authenticated QUIC connection
        │  first frame: UCAN invocation
        ▼  → modules/docs/specs/open-compute.md §2
5. Agent response
```

For internal LuciVerse peers on the same subnet, SCION path-aware routing is
preferred over Iroh relay — dial the IPv6 address directly.

### ALPN Registry

All Iroh connections on LuciVerse negotiate an ALPN string that selects the
protocol handler:

| ALPN String | Protocol | Use Case |
|---|---|---|
| `luciverse/0` | LuciVerse v0 | Agent-to-agent UCAN invocation |
| `luciverse/blobs/0` | iroh-blobs | Large file transfer — Wasm modules, model weights, LuciStones |
| `luciverse/docs/0` | iroh-docs | Address book sync — CRDT handle→NodeId replication |
| `luciverse/gossip/0` | iroh-gossip | Signal bus — `luci:signal:broadcast` pub/sub |

### NodeId Registry

NodeIds are **runtime values** (Ed25519 public keys generated at first boot). They
are not hardcoded here. Each node publishes its own NodeId via:

```bash
iroh node id          # prints this node's NodeId
```

NodeIds propagate to peers through the `iroh-docs` CRDT address book
(ALPN `luciverse/docs/0`). The address book maps:

```
handle  →  { did, iroh_node_id, ipv6, last_seen }
```

To register a NodeId in the OpenResty DNS resolver at runtime:

```lua
local dns = require "luciverse_dns"
dns.set_iroh_node("lucia.orchestrator.ownid", node_id_string)
-- → modules/infra/dns/luciverse_dns.lua
```

| Service | IPv6 (for SCION routing) | NodeId source file |
|---|---|---|
| lucia-orchestrator | `2602:F674:0001:0741::1` | `/data/node.key` on PAC host |
| homestar-head | `2602:F674:0000:0800::741` | `homestar.toml [node].keypair_path` |
| ipfs/kubo | `2602:F674:0001:0528::10` | `~/.ipfs/config .Identity.PeerID` |
| scm-engine | `2602:F674:0001:0528::1` | `/data/node.key` on CORE host |

### iroh-blobs and IPFS Relationship

`iroh-blobs` and IPFS/Kubo serve complementary roles — they are not redundant:

| | iroh-blobs | IPFS/Kubo |
|---|---|---|
| **Primary use** | P2P streaming of large files between known peers | Permanent content-addressed storage, pinning |
| **Addressing** | Iroh NodeId + blob hash (Blake3) | CIDv1 (Blake3, dag-cbor) |
| **Persistence** | Ephemeral — transferred, not necessarily stored | Permanent via pinning strategy |
| **Transport** | QUIC (NoQUIC) — resumable, encrypted | libp2p / SCION |
| **LuciVerse use** | Transfer Wasm modules and model weights between compute nodes | Store workflow receipts, LuciStones, audit chain |

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
**Underlay:** IPv6 (`2602:F674::/40`)

### Path Selection Policy

- Prefer low-latency, high-bandwidth paths
- Exclude ASes in the Wonderland deception layer (AS `5-999` through `5-9999` are honeypots — real services on AS `5-528` only)
- Prefer paths through trusted ISDs
- Geofencing: prioritize North American paths

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

**Expected output:**
```
Available paths to 5-528,[2602:F674:0001:0741::1]:
  [0] Hops: 0 MTU: 1500 NextHop: [2602:F674:0001::1]:30041
      Interfaces: local 1-5[528]
```

### 2. Configure Service Bindings

`modules/orchestration/podman/podman-compose.yml`:

```yaml
services:
  luciverse-core-orchestrator:
    networks:
      fusion-net:
        ipv6_address: 2602:F674:0001:0741::1
    environment:
      - SCION_DAEMON=/run/shm/sciond/default.sock
      - SCION_LOCAL=5-528,[2602:F674:0001:0741::1]
      - LUCIVERSE_AGENT_MAP_PATH=/etc/luciverse/agent-map.json
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

ipfs config --json Experimental.Libp2pStreamMounting true
ipfs config --json Experimental.P2pHttpProxy true
```

**Iroh node:**
```bash
# Start iroh node and register its NodeId
iroh start --secret-key /data/node.key &
NODE_ID=$(iroh node id)
echo "Node ID: $NODE_ID"

# Register in OpenResty resolver
# (call dns.set_iroh_node() from Lua or via the health/admin endpoint)
```

### 5. Verify Connectivity

```bash
# IPv6 reachability
ping6 2602:F674:0001:0741::1

# SCION path to PAC orchestrator
scion ping 5-528,[2602:F674:0001:0741::1]

# HTTP over IPv6
curl -6 http://[2602:F674:0001:0741::1]:8741/health

# IPFS gateway
curl http://[2602:F674:0001:0528::10]:8080/ipfs/QmTest

# FoundationDB
fdbcli --exec 'status'

# Iroh connectivity
iroh doctor
```

---

## Security

### Sacred Witness Consent Protocol

All SCION connections MUST verify:
1. **DID Authentication** — Judge Luci validates identity (→ `modules/docs/specs/did-handles.md`)
2. **Minimum Data** — ISO 27701/29100/29184 compliance
3. **Consent Records** — Immutable on Sovereign Raft + IPFS

### Wonderland Deception Layer

- ASes `5-999` through `5-9999` are honeypots
- Real services ONLY on AS `5-528`
- Caddy logs suspicious path selections
- Canary traps at `[2602:F674:0001:0417::X]` (deception tier 417 Hz)
- Automated response via Judge Luci

### TLS Over SCION

- **Certificate Authority:** Let's Encrypt via DNS-01
- **DNS Provider:** Quad9 (`2620:fe::fe`, `2620:fe::9`) — privacy-first, DNSSEC-validating
- **Cipher suites (TLS 1.3 only):**
  - `TLS_AES_256_GCM_SHA384`
  - `TLS_CHACHA20_POLY1305_SHA256`

---

## Monitoring & Observability

### Metrics

**Prometheus:** `http://[2602:F674:0001:0741::1]:9090/metrics`

| Metric | Description |
|---|---|
| `scion_path_latency_ms` | Path latency by ISD-AS |
| `scion_bytes_sent_total` | Bandwidth usage |
| `scion_conn_errors_total` | Connection failures |
| `fdb_transactions_total` | FoundationDB throughput |
| `ipfs_pins_total` | IPFS pin count by tier |
| `iroh_connections_active` | Active Iroh peer connections |
| `iroh_relay_vs_direct_ratio` | Fraction of traffic on relay vs direct path |

### Logging

**Loki:** `http://[2602:F674:0001:0741::1]:3100`

| Stream | Retention |
|---|---|
| `{app="scion-daemon",tier="comn"}` | 90 days |
| `{app="luciverse-orchestrator",tier="pac"}` | 365 days |
| `{app="foundationdb",tier="core"}` | 90 days |
| `{app="ipfs",tier="core"}` | 90 days |
| `{app="iroh",tier="any"}` | 30 days |

Logs pinned to IPFS for long-term audit (Genesis Bond countersigned receipts).

---

## Troubleshooting

### SCION Path Issues

**Symptom:** `scion showpaths` returns no paths

```bash
# Check sciond
systemctl status scion-dispatcher
# Verify IPv6 underlay
ping6 2602:F674:0001::1
# Inspect path DB
sqlite3 /var/lib/scion/pathdb.sqlite "SELECT * FROM Segments;"
```

### FoundationDB Connection Errors

**Symptom:** `RuntimeError: Latest known FDB API version is 710`

```bash
# Downgrade Python fdb client
pip3 install foundationdb==7.1.0
# Or update FDB server to 7.3
# Or use mock mode
export FDB_MOCK=1
```

### IPFS Peer Discovery

**Symptom:** No peers on SCION transport

```bash
ipfs config --json Discovery.MDNS.Enabled true
ipfs bootstrap add /scion/5-528,[2602:F674:0001:0528::10]/udp/4001/scion-quic/p2p/QmBootstrap
ufw allow 4001/udp comment 'IPFS SCION'
```

### Iroh Connectivity

**Symptom:** Cannot establish direct connection, stuck on relay

```bash
# Run diagnostics
iroh doctor
# Check if UDP is blocked (symmetric NAT defeats hole-punching)
# iroh doctor will report "unpunchable topology" and auto-fall back to relay
# Relay fallback is transparent — application sees no difference
```

**Symptom:** NodeId not found in address book

```bash
# Verify node is running
iroh node status
# Check iroh-docs replication
iroh docs list
# Force address book sync
iroh docs sync
```

---

## Next Steps

1. **Deploy SCION endhost** to all nodes in the Dell fleet (R730 ORION, R720 4J0TV12, R630 JMRZDB2)
2. **Enable QUIC over SCION + Iroh overlay** — Iroh's NoQUIC transport runs over the SCION underlay. External peers dial by NodeId; internal peers use SCION path-aware routing to the IPv6 address directly.
3. **Integrate Hedera** — Smart contract layer for priority waybills and Genesis Bond receipts
4. **Add observability** — Grafana dashboards for SCION + Iroh metrics
5. **Fix address inconsistencies** in dependent files (see Address Authority table above)
6. **Deploy `luciverse_dns.lua`** as the OpenResty resolver for `.ownid` TLD on all PAC/COMN nodes

---

## References

- **SCION Architecture:** https://scion-architecture.net/
- **Iroh (n0-computer):** https://github.com/n0-computer/iroh
- **FoundationDB:** https://apple.github.io/foundationdb/
- **IPFS Specs:** https://specs.ipfs.tech/
- **ISO 27001 §A.13:** Network Security Management
- **IPv6 plan:** `modules/infra/ipv6/address-plan.md`
- **DID handles:** `modules/docs/specs/did-handles.md`
- **Open Compute:** `modules/docs/specs/open-compute.md`
- **DNS resolver:** `modules/infra/dns/luciverse_dns.lua`
- **SCRIBE architecture:** `SCRIBE_SVG_MDX_RAFT_HEDERA_ARCHITECTURE.md`

---

**LDS:** 000.639 @ 639 Hz | COMN Tier  
**Coherence:** 0.98  
**Last Updated:** 2026-09-29  
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz

*Address authority for the entire LuciVerse network stack.*
