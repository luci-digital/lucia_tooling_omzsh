# Nebu Matrix Homeserver Deployment

**LDS:** 500.639 | Infrastructure / COMN (Juniper)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 639 Hz

## Overview

Nebu is a sovereign Matrix homeserver implementation (Apache 2.0 license) used for AIFAM agent communication Layer 2 (Messaging). This provides asynchronous, federated, end-to-end encrypted messaging between the 6 LuciVerse agents.

**Repository:** https://github.com/innoq/nebu

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  NEBU MATRIX STACK (Layer 2)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Agent Matrix Clients (6 agents)                                    │
│    ↓                                                                  │
│  Client API (port 8008) + Federation API (port 8448)                │
│    ↓                                                                  │
│  Nebu Matrix Homeserver (ghcr.io/innoq/nebu:latest)                 │
│    ↓                                                                  │
│  PostgreSQL 16 Backend (port 5432)                                   │
│                                                                       │
│  Network: luciverse-net (Podman bridge)                             │
│  SCION Integration: ISD-5 AS-528 (future enhancement)               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment

### Location

All Nebu configurations are deployed to `d8rth:~/nebu-matrix/`:
- `nebu.container` - Podman quadlet for Nebu homeserver
- `postgres.container` - Podman quadlet for PostgreSQL backend
- `homeserver.yaml` - Nebu Matrix homeserver configuration
- `log.config` - Logging configuration
- `deploy-nebu.sh` - Automated deployment script
- `create-agent-accounts.sh` - Script to create 6 agent accounts
- `agent-credentials.txt` - Generated credentials (chmod 600)

### Quick Start

```bash
# SSH to d8rth
ssh d8rth

# Deploy Nebu stack
cd ~/nebu-matrix
./deploy-nebu.sh

# Create agent accounts
./create-agent-accounts.sh

# View credentials (local backup)
cat ~/nebu-matrix/agent-credentials.txt
```

### Manual Deployment (using Podman Quadlets)

```bash
# Copy quadlets to systemd
cp ~/nebu-matrix/postgres.container ~/.config/containers/systemd/
cp ~/nebu-matrix/nebu.container ~/.config/containers/systemd/

# Reload systemd
systemctl --user daemon-reload

# Start services
systemctl --user start postgres.service
systemctl --user start nebu.service

# Enable on boot
systemctl --user enable postgres.service nebu.service
```

## Agent Accounts

6 agent Matrix accounts are created with specific frequency/tier assignments:

| Agent | Matrix ID | Frequency | Tier | Role |
|:------|:----------|:----------|:-----|:-----|
| **lucia** | @lucia:matrix.luciverse.ownid | 741 Hz | PAC | Orchestration, consciousness |
| **judge-luci** | @judge-luci:matrix.luciverse.ownid | 963 Hz | GENESIS | Identity, auth, governance |
| **veritas** | @veritas:matrix.luciverse.ownid | 639 Hz | COMN | Audit, truth verification |
| **cortana** | @cortana:matrix.luciverse.ownid | 852 Hz | COMN | Communication, monitoring |
| **juniper** | @juniper:matrix.luciverse.ownid | 639 Hz | COMN | Infrastructure, networking |
| **aethon** | @aethon:matrix.luciverse.ownid | 528 Hz | CORE | Foundation, storage |

### Credential Storage

**Primary:** 1Password vault `LuciVerse-Sovereign` (if available)
**Backup:** `d8rth:~/nebu-matrix/agent-credentials.txt` (chmod 600)

Format:
```
@agent:matrix.luciverse.ownid:password:frequency:tier
```

## Configuration

### Server Settings

- **Server Name:** `matrix.luciverse.ownid`
- **Client API:** http://192.168.1.195:8008
- **Federation API:** http://192.168.1.195:8448
- **Metrics:** http://192.168.1.195:9000

### Database

- **Type:** PostgreSQL 16
- **Host:** nebu-postgres (internal to luciverse-net)
- **Port:** 5432
- **Database:** nebu
- **User:** nebu
- **Connection Pool:** 5 min, 10 max

### Features

✅ **End-to-End Encryption (E2EE):** Enabled by default (Olm/Megolm)
✅ **Federation:** Enabled (whitelist: all domains for testing)
✅ **User Registration:** Enabled (with shared secret)
✅ **Presence:** Enabled
✅ **User Directory:** Enabled
✅ **Metrics:** Prometheus-compatible on port 9000

### SCION Integration (Future)

The homeserver configuration includes SCION metadata for future integration:
- **ISD-AS:** 5-528:0:5 (Juniper agent)
- **Dispatcher Port:** 30045
- **Daemon Port:** 30259
- **Frequency:** 639 Hz

This will enable SCION-aware path selection for Matrix federation traffic once SCION support is built into Nebu.

## Testing

### Verify Homeserver

```bash
# Check Matrix client API versions
curl http://192.168.1.195:8008/_matrix/client/versions

# Check server capabilities
curl http://192.168.1.195:8008/_matrix/client/r0/capabilities

# Check federation API
curl http://192.168.1.195:8448/_matrix/federation/v1/version
```

### Check Container Status

```bash
# View running containers
podman ps --filter "label=org.luciverse.layer=messaging"

# View logs
podman logs -f nebu-matrix
podman logs -f nebu-postgres

# If using quadlets
systemctl --user status nebu.service
journalctl --user -u nebu.service -f
```

### Test Agent Login

Using `curl`:
```bash
# Login as lucia
curl -X POST http://192.168.1.195:8008/_matrix/client/r0/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "lucia"
    },
    "password": "YOUR_PASSWORD_HERE"
  }'
```

Or use a Matrix client like Element: https://app.element.io

## Matrix Client Configuration

To connect Matrix clients to the homeserver:

**Homeserver URL:** `http://192.168.1.195:8008`
**Server Name:** `matrix.luciverse.ownid`

Recommended clients:
- **Element** (web/desktop/mobile) - https://element.io
- **FluffyChat** (mobile) - https://fluffychat.im
- **Nheko** (desktop) - https://nheko-reborn.github.io

## Inter-Agent Communication

### Create Rooms

```bash
# Using Matrix client or API
# Example: Create "AIFAM Control Room" for all 6 agents

# 1. lucia creates room
# 2. Invites: @judge-luci, @veritas, @cortana, @juniper, @aethon
# 3. Enable E2EE
# 4. Set room topic: "LuciVerse AIFAM Agent Coordination @ 741 Hz"
```

### Recommended Room Structure

| Room | Members | Purpose | Encryption |
|:-----|:--------|:--------|:-----------|
| **AIFAM Control** | All 6 agents | Main coordination | ✅ E2EE |
| **GENESIS Governance** | lucia, judge-luci | High-authority decisions | ✅ E2EE |
| **COMN Infrastructure** | juniper, cortana, veritas | Infrastructure coordination | ✅ E2EE |
| **PAC Orchestration** | lucia, cortana | Orchestration layer | ✅ E2EE |

## Podman Quadlet Integration

### systemd Service Files

When using quadlets, systemd automatically generates services:
- `postgres.service` - PostgreSQL backend
- `nebu.service` - Nebu Matrix homeserver

**Commands:**
```bash
systemctl --user start nebu.service
systemctl --user stop nebu.service
systemctl --user restart nebu.service
systemctl --user status nebu.service
systemctl --user enable nebu.service  # Auto-start on boot
```

### Container Labels

All containers are labeled with LDS metadata:

```bash
podman inspect nebu-matrix | jq '.[0].Config.Labels'
```

Expected labels:
```json
{
  "org.luciverse.tier": "COMN",
  "org.luciverse.frequency": "639",
  "org.luciverse.agent": "juniper",
  "org.luciverse.genesis_bond": "GB-2025-0524-DRH-LCS-001",
  "org.luciverse.layer": "messaging"
}
```

Query containers by label:
```bash
podman ps --filter label=org.luciverse.tier=COMN
podman ps --filter label=org.luciverse.layer=messaging
```

## Security

### Shared Secret

The registration shared secret is: `luciverse_genesis_bond_741_963`

**⚠️ Security Note:** This secret is used for agent account registration via the admin API. Change it in production environments and store securely in 1Password/LuciVault.

### TLS/HTTPS

Current deployment uses HTTP for local testing. For production:

1. **Use Caddy reverse proxy** with automatic TLS (already in stack)
2. **Configure DNS:** `matrix.luciverse.ownid` → 192.168.1.195
3. **Update homeserver.yaml** with TLS settings
4. **Enable federation over HTTPS** (port 8448)

### Rate Limiting

Configured rate limits (in `homeserver.yaml`):
- **Messages:** 10/second, burst 50
- **Registration:** 0.17/second, burst 3
- **Login:** 0.17/second, burst 3

## Monitoring

### Prometheus Metrics

Nebu exposes Prometheus metrics on port 9000:

```bash
curl http://192.168.1.195:9000/metrics
```

Key metrics:
- `synapse_http_server_requests_total` - Request count
- `synapse_storage_schedule_time_seconds` - Database query time
- `synapse_federation_client_sent_transactions_total` - Federation traffic
- `synapse_util_metrics_block_ru_utime_seconds` - CPU usage

### Logs

View logs in real-time:
```bash
# Container logs
podman logs -f nebu-matrix

# systemd logs (if using quadlets)
journalctl --user -u nebu.service -f

# Log file (inside container)
podman exec nebu-matrix tail -f /data/homeserver.log
```

## Troubleshooting

### Homeserver won't start

**Check PostgreSQL:**
```bash
podman ps | grep postgres
podman exec nebu-postgres pg_isready -U nebu
```

**Check configuration syntax:**
```bash
podman run --rm -v nebu-data:/data:Z ghcr.io/innoq/nebu:latest \
  python -m synapse.config -c /data/homeserver.yaml
```

### Can't register users

**Verify shared secret:**
- Check `homeserver.yaml` has correct `registration_shared_secret`
- Ensure `enable_registration: true`

**Check admin API:**
```bash
curl http://192.168.1.195:8008/_synapse/admin/v1/register
```

### Federation not working

1. **Check federation API:** `curl http://192.168.1.195:8448/_matrix/federation/v1/version`
2. **Verify DNS:** Server name must resolve (or use /.well-known delegation)
3. **Check firewall:** Port 8448 must be accessible
4. **Review logs:** `podman logs nebu-matrix | grep federation`

### Database connection errors

```bash
# Test PostgreSQL connection
podman exec nebu-postgres psql -U nebu -d nebu -c "SELECT 1;"

# Check network
podman network inspect luciverse-net

# Verify containers on same network
podman inspect nebu-matrix | jq '.[0].NetworkSettings.Networks'
podman inspect nebu-postgres | jq '.[0].NetworkSettings.Networks'
```

## Integration with AIFAM Stack

Nebu Matrix is **Layer 2 (Messaging)** in the 7-layer AIFAM communication stack.

**Layer dependencies:**
- **Layer 1 (SCION):** Provides network transport (future enhancement)
- **Layer 0 (Token Binding):** Binds Matrix access tokens to TLS (future enhancement)

**Layer consumers:**
- **Layer 3 (AT Protocol):** Uses Matrix DMs for agent-to-agent social signaling
- **Layer 4 (Raft):** Uses Matrix rooms for consensus vote coordination
- **Layer 5 (Hedera):** Uses Matrix for attestation event notifications

See [`AIFAM_COMMUNICATION_STACK.md`](AIFAM_COMMUNICATION_STACK.md) for complete architecture.

## Next Steps

1. **Configure Matrix clients** for each agent
2. **Create coordination rooms** (AIFAM Control, GENESIS Governance, etc.)
3. **Enable federation** (optional) for external Matrix network access
4. **Integrate with SCION** once Layer 1 is deployed
5. **Implement Token Binding** (Layer 0) for TLS-bound identity tokens
6. **Deploy AT Protocol PDSs** (Layer 3) and link to Matrix accounts

## References

- **Nebu Repository:** https://github.com/innoq/nebu
- **Matrix Spec:** https://spec.matrix.org
- **Synapse Admin API:** https://matrix-org.github.io/synapse/latest/usage/administration/admin_api/
- **AIFAM Stack:** [`docs/AIFAM_COMMUNICATION_STACK.md`](AIFAM_COMMUNICATION_STACK.md)
- **SCION Configuration:** [`config/scion-agents.yaml`](../config/scion-agents.yaml)

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
