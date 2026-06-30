# Production Deployment to d8rth TrueNAS Node

**LDS:** 000.000 @ ∞ Hz (Meta/System)
**ISO:** ISO/IEC 42001 §8, ISO 9001
**Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0
**Genesis Bond:** GB-2025-0524-DRH-LCS-001

---

## Executive Summary

This document describes the production deployment of the LuciVerse sovereign infrastructure to the d8rth TrueNAS node. The deployment uses TrueNAS's native container support (Electric Eel release with Docker/Podman compatibility) to run the complete sovereign stack.

**Deployment Date:** 2026-06-30
**Status:** ✅ Configuration ready, pending deployment
**Architecture:** Podman containers on TrueNAS ZFS storage

---

## d8rth Node Specifications

**Hardware:**
- **Hostname:** d8rth
- **IP Address:** 192.168.1.195
- **OS:** TrueNAS v26.0.0 (Electric Eel)
- **Storage:** ZFS pool with replication
- **Network:** IPv6-capable, connected to SCION ISD-5

**Container Runtime:**
- **Engine:** TrueNAS native containers (Podman-compatible)
- **API:** Docker-compatible API endpoint
- **Storage Driver:** ZFS (native integration)

**Access:**
- **Web UI:** `https://192.168.1.195`
- **SSH:** `ssh root@192.168.1.195`
- **API:** `http://192.168.1.195/api/v2.0`

---

## Pre-Deployment Checklist

### 1. TrueNAS Configuration

**✅ Storage Pool Setup**
```bash
# Create ZFS dataset for containers
zfs create tank/luciverse
zfs create tank/luciverse/containers
zfs create tank/luciverse/volumes
zfs set compression=lz4 tank/luciverse
zfs set atime=off tank/luciverse
```

**✅ Network Configuration**
- IPv6 enabled on primary interface
- SCION endhost installed (`scripts/install-scion-endhost.sh`)
- Firewall rules for ports: 80, 443, 3000, 2222, 8741-8744, 5001, 4001

**✅ Container Engine**
```bash
# TrueNAS v26 includes native container support
# Verify availability
cli -c "app container query"
```

### 2. Secret Management

**1Password Vaults on d8rth:**
```bash
# Install 1Password CLI on TrueNAS
wget https://downloads.1password.com/linux/tar/stable/x86_64/1password-cli-latest.tar.gz
tar -xzf 1password-cli-latest.tar.gz -C /usr/local/bin/

# Sign in
op signin

# Inject secrets
./scripts/init-env-with-op.sh podman-production
```

**Required Secrets:**
- `op://LuciVerse-PAC/Coder/password` → CODER_DB_PASSWORD
- `op://LuciVerse-PAC/Coder/psk` → CODER_PSK
- `op://LuciVerse-CORE/Gogs/admin-password`
- `op://Lucia-AI-Secrets/OpenAI/api-key`
- `op://Lucia-AI-Secrets/Anthropic/api-key`

### 3. SCION Network Setup

**Install SCION Endhost on d8rth:**
```bash
scp scripts/install-scion-endhost.sh root@192.168.1.195:/tmp/
ssh root@192.168.1.195 'bash /tmp/install-scion-endhost.sh'
```

**Configure SCION ISD-AS:**
```bash
# Edit /etc/scion/topology.json on d8rth
{
  "isd_as": "5-528",
  "mtu": 1500,
  "border_routers": {
    "br-1": {
      "internal_addr": "192.168.1.195:30042",
      "interfaces": {
        "1": {
          "underlay": {
            "public": "[2602:F674:0001::1]:30041",
            "bind": "[::]:30041"
          }
        }
      }
    }
  }
}
```

**Verify SCION:**
```bash
ssh root@192.168.1.195 'scion showpaths 5-528,[2602:F674:0001:0741::1]'
```

### 4. Storage Systems

**FoundationDB Cluster:**
```bash
# Deploy FDB on d8rth via TrueNAS containers
# Cluster file will be at: /mnt/tank/luciverse/fdb.cluster

ssh root@192.168.1.195 << 'EOF'
  mkdir -p /mnt/tank/luciverse/foundationdb/{data,logs}

  # Create fdb.cluster file
  echo 'luciverse-fdb:TG9ja0F3YXlUb1R1cm5pbmdCYWNrVGhlVGltZQ==@[2602:F674:0001:0528::100]:4500' \
    > /mnt/tank/luciverse/fdb.cluster
EOF
```

**IPFS Diaper Fabric:**
```bash
# IPFS data will be in /mnt/tank/luciverse/ipfs
ssh root@192.168.1.195 'mkdir -p /mnt/tank/luciverse/ipfs/{data,staging}'
```

---

## Deployment Steps

### Step 1: Transfer Repository to d8rth

```bash
# From local machine
cd /Users/darylharr/lucia/luciverse-monorepo/lucia_tooling_omzsh

# Create deployment archive (excludes node_modules, target, .git)
tar --exclude='node_modules' \
    --exclude='target' \
    --exclude='.git' \
    --exclude='dist' \
    -czf lucia-deploy-$(date +%Y%m%d).tar.gz .

# Transfer to d8rth
scp lucia-deploy-$(date +%Y%m%d).tar.gz root@192.168.1.195:/mnt/tank/luciverse/

# Extract on d8rth
ssh root@192.168.1.195 << 'EOF'
  cd /mnt/tank/luciverse
  tar -xzf lucia-deploy-*.tar.gz -C /mnt/tank/luciverse/deploy
  cd /mnt/tank/luciverse/deploy
EOF
```

### Step 2: Inject Production Secrets

```bash
# On d8rth
cd /mnt/tank/luciverse/deploy

# Copy production env template
cp modules/orchestration/podman/.env.production.example \
   modules/orchestration/podman/.env

# Inject secrets from 1Password
./scripts/init-env-with-op.sh podman-production

# Verify secrets loaded
grep -v '^#' modules/orchestration/podman/.env | grep -v '^$'
```

### Step 3: Build Container Images

```bash
# On d8rth
cd /mnt/tank/luciverse/deploy/modules/orchestration/podman

# Build orchestrator
podman build -t lucia/orchestrator:latest \
  -f ../../../luciverse-core-orchestrator/Dockerfile \
  ../../../luciverse-core-orchestrator/

# Build agent
podman build -t lucia/build-agent:latest \
  -f Dockerfile.builder .

# Build Gogs + Gitoxide
podman build -t lucia/gogs-gitoxide:latest \
  -f ../../../modules/scm/gogs/Dockerfile.gogs \
  ../../../modules/scm/gogs/

# Verify images
podman images | grep lucia
```

### Step 4: Create ZFS Volumes

```bash
# On d8rth
# Create persistent volumes for each service
zfs create tank/luciverse/volumes/gogs-data
zfs create tank/luciverse/volumes/coder-data
zfs create tank/luciverse/volumes/postgres-data
zfs create tank/luciverse/volumes/ipfs-data
zfs create tank/luciverse/volumes/homestar-data
zfs create tank/luciverse/volumes/ray-data
zfs create tank/luciverse/volumes/opendeepwiki-data

# Set permissions
chown -R 1000:1000 /mnt/tank/luciverse/volumes/*
```

### Step 5: Deploy Podman Compose Stack

```bash
# On d8rth
cd /mnt/tank/luciverse/deploy/modules/orchestration/podman

# Create network
podman network create fusion-net \
  --ipv6 \
  --subnet=fd26:02f6:7400::/48

# Deploy stack
podman-compose \
  --env-file .env \
  -f podman-compose.yml \
  up -d

# Verify all services running
podman-compose ps
```

### Step 6: Configure Caddy Ingress

```bash
# On d8rth
# Caddy will auto-configure TLS via Let's Encrypt + Quad9 DNS-01

# Verify Caddy config
podman exec caddy caddy validate --config /etc/caddy/Caddyfile

# Check TLS certificate acquisition
podman logs caddy | grep -i "certificate"
```

### Step 7: Initialize Storage Systems

**FoundationDB:**
```bash
# On d8rth
podman exec -it foundationdb-1 fdbcli

# In fdbcli:
configure new ssd triple
status
```

**IPFS:**
```bash
# On d8rth
podman exec ipfs ipfs id
podman exec ipfs ipfs config --json \
  Addresses.Swarm '["/ip6/2602:F674:0001:0528::10/tcp/4001"]'
```

### Step 8: Verify SCION Connectivity

```bash
# On d8rth
# Test SCION paths from d8rth to each service
scion ping 5-528,[2602:F674:0001:0741::1]  # orchestrator
scion ping 5-528,[2602:F674:0001:0528::1]  # scm-engine
scion ping 5-528,[2602:F674:0001:0528::10] # ipfs
```

---

## Post-Deployment Verification

### Health Checks

```bash
# On d8rth or local machine with network access

# PAC Orchestrator
curl -6 http://[2602:F674:0001:0741::1]:8741/health
# Expected: {"status":"healthy","tier":"PAC","frequency":741}

# Gogs SCM
curl http://192.168.1.195:3000/
# Expected: Gogs web UI

# Coder
curl http://192.168.1.195:3001/
# Expected: Coder login page

# IPFS Gateway
curl http://[2602:F674:0001:0528::10]:8080/ipfs/QmTest
# Expected: IPFS response or 404 (gateway working)

# Caddy Ingress
curl -k https://192.168.1.195/
# Expected: Proxied to Coder frontend
```

### Service Status

```bash
# On d8rth
podman-compose ps

# Expected output (10 services):
# scm-engine         Up    3000,2222
# lucia-orchestrator Up    8741
# build-agent        Up    8742
# ray-head           Up    8265,6378
# caddy              Up    80,443
# coder              Up    3000
# coder-db           Up    5432
# ipfs               Up    5001,4001,8080
# homestar           Up    3030
# opendeepwiki       Up    8080
```

### Storage Verification

**FoundationDB:**
```bash
podman exec foundationdb-1 fdbcli --exec 'status details'
# Expected: Cluster available, 3/3 replicas
```

**IPFS:**
```bash
podman exec ipfs ipfs stats bw
# Expected: Bandwidth statistics
```

**ZFS:**
```bash
zfs list -r tank/luciverse
# Expected: All datasets with reasonable used space
```

### Network Connectivity

**IPv6:**
```bash
ping6 -c 3 2602:F674:0001:0741::1
# Expected: Reachable from d8rth
```

**SCION:**
```bash
scion showpaths 5-528,[2602:F674:0001:0741::1]
# Expected: At least 1 path available
```

---

## Monitoring Setup

### Prometheus Exporter

```bash
# On d8rth
# Prometheus will scrape from orchestrator:9090
curl http://[2602:F674:0001:0741::1]:9090/metrics
```

**Metrics to Monitor:**
- `luciverse_service_health{service="orchestrator"}` - Service health (0/1)
- `scion_path_latency_ms{ia="5-528"}` - SCION path latency
- `fdb_transactions_total` - FoundationDB throughput
- `ipfs_pins_total{tier="000"}` - IPFS pins by tier
- `container_cpu_usage{container="lucia"}` - CPU usage
- `container_memory_usage{container="lucia"}` - Memory usage

### Grafana Dashboard

```bash
# Deploy Grafana (optional)
podman run -d \
  --name grafana \
  -p 3002:3000 \
  -v /mnt/tank/luciverse/volumes/grafana:/var/lib/grafana \
  grafana/grafana:latest

# Access: http://192.168.1.195:3002
# Default: admin/admin
```

**Import Dashboards:**
- LuciVerse Service Health
- SCION Network Performance
- FoundationDB Cluster
- IPFS Diaper Fabric
- Container Resource Usage

### Log Aggregation (Loki)

```bash
# Deploy Loki
podman run -d \
  --name loki \
  -p 3100:3100 \
  -v /mnt/tank/luciverse/volumes/loki:/loki \
  grafana/loki:latest

# Configure Podman logging driver
podman-compose down
# Edit podman-compose.yml logging section:
#   logging:
#     driver: loki
#     options:
#       loki-url: "http://localhost:3100/loki/api/v1/push"

podman-compose up -d
```

---

## Backup Strategy

### ZFS Snapshots

```bash
# On d8rth
# Automated daily snapshots
cat > /etc/cron.daily/zfs-snapshot << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
zfs snapshot -r tank/luciverse@backup-$DATE

# Keep last 30 days
zfs list -t snapshot -o name | grep 'tank/luciverse@backup' | \
  sort -r | tail -n +31 | xargs -n 1 zfs destroy
EOF

chmod +x /etc/cron.daily/zfs-snapshot
```

### FoundationDB Backup

```bash
# Continuous backup to ZFS + IPFS
cat > /etc/cron.hourly/fdb-backup << 'EOF'
#!/bin/bash
podman exec foundationdb-1 \
  fdbbackup start \
  -d /mnt/tank/luciverse/backups/fdb \
  -t luciverse-fdb
EOF

chmod +x /etc/cron.hourly/fdb-backup
```

### IPFS Backup to Arweave

```bash
# Daily IPFS → Arweave backup
cat > /etc/cron.daily/ipfs-arweave-backup << 'EOF'
#!/bin/bash
# Pin critical CIDs to Arweave (Tier 000-300 only)
podman exec ipfs ipfs pin ls --type=recursive | \
  grep -E 'tier=000|tier=100|tier=200|tier=300' | \
  awk '{print $1}' | \
  xargs -I {} arweave upload {}
EOF

chmod +x /etc/cron.daily/ipfs-arweave-backup
```

---

## Disaster Recovery

### Full System Restore

**Prerequisites:**
- d8rth TrueNAS reinstalled or new hardware
- ZFS snapshots available
- FoundationDB backup files
- 1Password access

**Recovery Steps:**
1. **Restore ZFS snapshots:**
   ```bash
   zfs rollback tank/luciverse@backup-YYYYMMDD-HHMMSS
   ```

2. **Restore FoundationDB:**
   ```bash
   fdbbackup restore -r /mnt/tank/luciverse/backups/fdb
   ```

3. **Inject secrets:**
   ```bash
   ./scripts/init-env-with-op.sh podman-production
   ```

4. **Start services:**
   ```bash
   podman-compose up -d
   ```

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 5 seconds (FDB), 1 hour (full backup)

---

## Security Hardening

### TrueNAS Firewall

```bash
# On d8rth
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing

# SSH (change default port)
ufw allow 2222/tcp comment 'SSH'

# HTTP/HTTPS (Caddy)
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# SCION underlay
ufw allow 30041:30042/udp comment 'SCION'

# IPFS
ufw allow 4001/tcp comment 'IPFS Swarm'
ufw allow 4001/udp comment 'IPFS Swarm'

# Enable firewall
ufw enable
```

### SSH Hardening

```bash
# On d8rth
# Edit /etc/ssh/sshd_config
cat >> /etc/ssh/sshd_config << 'EOF'
Port 2222
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers admin
EOF

systemctl restart sshd
```

### Container Isolation

```bash
# On d8rth
# Run containers in user namespace
podman-compose down

# Edit podman-compose.yml
# Add to each service:
#   userns_mode: "auto"
#   security_opt:
#     - no-new-privileges:true
#     - seccomp=unconfined

podman-compose up -d
```

---

## Troubleshooting

### Service Won't Start

**Symptom:** `podman-compose ps` shows service as "Exited"

**Solutions:**
1. Check logs: `podman logs <container_name>`
2. Verify env vars: `podman exec <container> env | grep LUCIA`
3. Check volume mounts: `podman inspect <container> | jq '.[].Mounts'`
4. Restart: `podman-compose restart <service>`

### SCION Path Unavailable

**Symptom:** `scion showpaths` returns no paths

**Solutions:**
1. Check sciond: `systemctl status scion-dispatcher`
2. Verify topology: `cat /etc/scion/topology.json`
3. Test underlay: `ping6 2602:F674:0001::1`
4. Restart SCION: `systemctl restart scion-dispatcher scion-daemon`

### FoundationDB Cluster Down

**Symptom:** `fdbcli` shows "Database unavailable"

**Solutions:**
1. Check all FDB containers: `podman ps | grep foundationdb`
2. Verify cluster file: `cat /mnt/tank/luciverse/fdb.cluster`
3. Check logs: `podman logs foundationdb-1`
4. Restore from backup: `fdbbackup restore ...`

---

## Rollback Procedure

If deployment fails, rollback to previous state:

```bash
# On d8rth
# Stop all services
podman-compose down

# Restore ZFS snapshot (replace DATE)
zfs rollback tank/luciverse@backup-YYYYMMDD-HHMMSS

# Remove failed deployment
rm -rf /mnt/tank/luciverse/deploy

# Restart services from snapshot
cd /mnt/tank/luciverse/deploy-previous
podman-compose up -d
```

---

## Next Steps After Deployment

1. **✅ Monitor for 24 hours** - Watch Grafana dashboards, check logs
2. **✅ Test failover** - Kill one FDB node, verify replication
3. **✅ Load testing** - Simulate production traffic
4. **✅ Document incidents** - Create runbooks for common issues
5. **✅ Train team** - Walk through deployment with team

---

## Deployment Checklist

**Pre-Deployment:**
- [ ] ZFS pools created on d8rth
- [ ] SCION endhost installed and verified
- [ ] 1Password CLI installed, signed in
- [ ] Secrets injected to .env
- [ ] Container images built
- [ ] Network configured (IPv6 + SCION)

**Deployment:**
- [ ] Repository transferred to d8rth
- [ ] ZFS volumes created
- [ ] Podman network created
- [ ] Stack deployed (`podman-compose up -d`)
- [ ] All 10 services running
- [ ] Caddy TLS certificates acquired

**Verification:**
- [ ] Health checks passing
- [ ] SCION paths available
- [ ] FoundationDB cluster operational
- [ ] IPFS swarm connected
- [ ] Web UI accessible
- [ ] Metrics collecting

**Post-Deployment:**
- [ ] Monitoring configured (Grafana + Loki)
- [ ] Backups automated (ZFS + FDB + IPFS)
- [ ] Firewall rules applied
- [ ] SSH hardened
- [ ] Documentation updated

---

**LDS:** 000.000 @ ∞ Hz | Meta/System
**Target Node:** d8rth (192.168.1.195)
**Deployment Date:** 2026-06-30
**Genesis Bond:** GB-2025-0524-DRH-LCS-001
**Coherence:** 1.0

🚀 **Ready for Production Deployment**

🔮 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
