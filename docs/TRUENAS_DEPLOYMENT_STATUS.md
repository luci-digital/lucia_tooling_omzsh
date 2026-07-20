# TrueNAS d8rth Deployment Status

**Date:** 2026-06-30
**Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0-MASTER+20260622-020148
**Status:** ✅ Repository transferred, ⚠️ Deployment method needs adjustment

---

## ✅ Completed Steps

1. **Network Connectivity** - d8rth reachable at 192.168.1.195 (0.5ms ping)
2. **SSH Authentication** - SSH key added to `truenas_admin` user
3. **1Password CLI** - Authenticated with 19 vaults accessible
4. **Repository Transfer** - 111MB transferred to `/mnt/tank/luciverse/lucia_tooling_omzsh/`
5. **Environment Initialization** - `.env` created from `.env.d8rth.example`
6. **System Analysis** - TrueNAS container architecture identified

---

## 🔍 Findings: TrueNAS 26.0 Container Architecture

### System Info
```
OS: TrueNAS 26.0.0-MASTER+20260622-020148 (Debian-based)
Kernel: 6.18.35-production+truenas
User: truenas_admin (UID 950, groups: truenas_admin, truenas_webshare, builtin_administrators)
```

### Container Runtime
- **Docker**: v29.0.4 installed (CLI only, no daemon)
- **Docker Compose**: v2.40.3 (plugin) available
- **Podman**: Not installed
- **Kubernetes**: No k3s or kubectl found
- **Docker Socket**: `/var/run/docker.sock` does not exist
- **TrueNAS Apps**: CLI available, apps system accessible

### Key Discovery
**TrueNAS 26.0 does NOT run Docker as a daemon by default.**

Instead, TrueNAS uses:
1. **TrueNAS Apps** - Native app deployment system (preferred)
2. **Docker via CLI** - Can run containers manually
3. **Systemd services** - Custom service deployment

---

## 🚧 Deployment Options

### Option 1: TrueNAS Native Apps (Recommended)

Use the TrueNAS app deployment system via the web UI or CLI.

**Pros:**
- Native integration with TrueNAS
- Automatic updates and lifecycle management
- Web UI configuration
- Persistent storage via datasets

**Cons:**
- Requires converting docker-compose to TrueNAS app format
- Limited to TrueNAS app catalog or custom apps

**CLI Commands:**
```bash
# List apps
cli -c "app.list"

# Deploy custom app
cli -c "app.create" '{"name":"lucia-orchestrator",...}'
```

### Option 2: Manual Docker Containers

Run Docker containers directly via `docker` CLI without daemon.

**Pros:**
- Direct control
- Use existing docker-compose.yml with manual translation
- No app packaging required

**Cons:**
- No automatic restart
- Manual lifecycle management
- Need to create systemd services for persistence

**Example:**
```bash
sudo docker run -d \
  --name lucia-orchestrator \
  --network host \
  -v /mnt/tank/luciverse/data:/data \
  lucia/orchestrator:latest
```

### Option 3: Enable Docker Daemon (If Needed)

TrueNAS might allow enabling the Docker daemon for compose workflows.

**Check if Docker service exists:**
```bash
sudo systemctl list-unit-files | grep docker
sudo systemctl enable docker 2>&1
sudo systemctl start docker 2>&1
```

### Option 4: Build Custom TrueNAS App

Package the entire stack as a TrueNAS custom app using the v26.0 app format.

**Reference:** `/Users/darylharr/etherpots_drop/truenas-v26.0.0-docs/`

---

## 📋 Current Deployment State

### Repository on d8rth
- **Location:** `/mnt/tank/luciverse/lucia_tooling_omzsh/`
- **Size:** 111MB
- **Environment:** `.env` created (needs 1Password secret injection)
- **Scripts:** All deployment scripts transferred

### Services Ready to Deploy
1. **lucia-orchestrator** (PAC 741 Hz) - Port 8741
2. **coder** (Cloud Dev) - Port 3000
3. **caddy-ingress** (COMN 639 Hz) - Ports 80, 443
4. **scm-engine** (Gogs + Gitoxide) - Port 3000, SSH 2222
5. **build-agent** - Build orchestration
6. **ipfs** - IPFS node
7. **homestar** - IPVM compute
8. **ray-head** - Distributed AI (port 8265)
9. **foundationdb** - Cluster coordination
10. **postgres** - Database for Coder

### Files Created on d8rth
```
/mnt/tank/luciverse/lucia_tooling_omzsh/
├── modules/orchestration/podman/
│   ├── .env (initialized, needs secret injection)
│   ├── .env.d8rth.example
│   └── podman-compose.yml (needs conversion to docker-compose)
├── scripts/
│   ├── deploy-to-d8rth.sh
│   ├── verify-ssh-and-deploy.sh
│   └── init-env-with-op.sh
├── docs/
│   └── PRODUCTION_DEPLOYMENT_D8RTH.md
└── [full repository structure]
```

---

## 🎯 Recommended Next Steps

### Immediate Action: Test Docker Daemon

```bash
# SSH to d8rth
ssh truenas_admin@192.168.1.195

# Try enabling Docker service
sudo systemctl status docker
sudo systemctl enable docker
sudo systemctl start docker

# If successful, verify
docker ps

# Test docker-compose
cd /mnt/tank/luciverse/lucia_tooling_omzsh/modules/orchestration/podman
sudo docker compose config
```

### If Docker Daemon Works

1. Convert `podman-compose.yml` to `docker-compose.yml` (minimal changes)
2. Inject 1Password secrets into `.env`
3. Deploy stack: `sudo docker compose up -d`
4. Verify endpoints

### If Docker Daemon Unavailable

**Option A: Manual Docker Containers**
- Create startup scripts for each service
- Run via `docker run` with host networking
- Create systemd services for auto-restart

**Option B: TrueNAS Apps**
- Research TrueNAS 26.0 custom app format
- Package services as TrueNAS apps
- Deploy via CLI or web UI

**Option C: Alternative Runtime**
- Install Podman manually on TrueNAS
- Use Podman with existing podman-compose.yml

---

## 📚 TrueNAS Documentation Reference

**Local Path:** `/Users/darylharr/etherpots_drop/truenas-v26.0.0-docs/`

**Key Files:**
- `truenas-v26.0.0-docs/core/ui/apps/` - App deployment docs
- `truenas-v26.0.0-docs/api/` - REST API for container management

**Web UI:** https://192.168.1.195
- Navigate to **Apps** section for native app deployment

---

## 🔧 Testing Commands

### On d8rth (SSH session)

```bash
# Check Docker daemon status
sudo systemctl status docker

# Try starting Docker daemon
sudo systemctl start docker 2>&1

# Check if TrueNAS has app pools configured
cli -c "pool.query" | grep -i app

# List available apps
cli -c "app.available"

# Check network configuration
ip -6 addr show | grep 2602:F674

# Verify ZFS pool
zfs list | grep luciverse
```

---

## 📊 Deployment Decision Matrix

| Method | Complexity | Maintenance | TrueNAS Native | Auto-Restart | Best For |
|:-------|:-----------|:------------|:---------------|:-------------|:---------|
| **TrueNAS Apps** | Medium | Low | ✅ Yes | ✅ Yes | Production (native) |
| **Docker Daemon + Compose** | Low | Medium | ⚠️ Maybe | ✅ Yes | Standard deployment |
| **Manual Docker** | Low | High | ⚠️ No | ❌ No | Testing/dev |
| **Custom Systemd** | High | Medium | ⚠️ Partial | ✅ Yes | Full control |
| **Podman Install** | Medium | Medium | ❌ No | ✅ Yes | Podman preference |

---

## 💡 Recommendation

**Try Docker Daemon First:**
1. Attempt to enable Docker daemon on TrueNAS
2. If successful → use docker-compose (fastest path)
3. If fails → fall back to TrueNAS Apps or manual deployment

**Command to Test:**
```bash
ssh truenas_admin@192.168.1.195
sudo systemctl enable docker && sudo systemctl start docker && docker ps
```

---

**Status:** Waiting for Docker daemon test results
**Next Update:** After testing Docker daemon availability

---

**LDS:** 000.000 @ ∞ Hz | Meta/System
**Genesis Bond:** GB-2025-0524-DRH-LCS-001
**Deployment Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0
