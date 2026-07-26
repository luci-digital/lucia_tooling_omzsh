# d8rth Production Deployment - Ready to Execute

**Status:** ⚠️ Waiting for SSH key authorization
**Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0

---

## Current Status

### ✅ Complete
1. **Network Connectivity** - d8rth reachable at 192.168.1.195 (0.5ms ping)
2. **1Password CLI** - Authenticated (19 vaults accessible)
3. **SSH Key Generated** - `~/.ssh/d8rth_mac_key` exists
4. **Deployment Scripts** - Automated 6-step deployment ready
5. **Documentation** - Complete deployment guide created
6. **Repository** - All code committed and pushed (commit: `bc54fe1a`)

### ⚠️ ONE STEP REMAINING

**Add SSH public key to d8rth's `daryl` user:**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPpdlohfxuqAGpTfCWDX38Wz/H7JaINn0AzquYjiq1sE Mac to d8rth
```

---

## How to Add SSH Key to d8rth

### Via TrueNAS Web UI

1. **Open TrueNAS:**
   ```
   https://192.168.1.195
   ```

2. **Navigate to User:**
   - Click **Accounts** (left sidebar)
   - Click **Users**
   - Find and click on **daryl** user
   - Click **Edit**

3. **Add SSH Public Key:**
   - Scroll to **SSH Public Key** field
   - Paste the key shown above
   - Click **Save**

### Or Via TrueNAS Shell (if you have console access)

```bash
# On d8rth TrueNAS console
mkdir -p /home/daryl/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPpdlohfxuqAGpTfCWDX38Wz/H7JaINn0AzquYjiq1sE Mac to d8rth" >> /home/daryl/.ssh/authorized_keys
chmod 700 /home/daryl/.ssh
chmod 600 /home/daryl/.ssh/authorized_keys
chown -R daryl:daryl /home/daryl/.ssh
```

---

## After Adding SSH Key

### Test SSH Connection

```bash
ssh d8rth "echo 'SSH working!'"
```

Expected output:
```
SSH working!
```

### Run Automated Deployment

```bash
./scripts/verify-ssh-and-deploy.sh
```

This will:
1. ✅ Verify SSH key is working
2. ✅ Show d8rth system info
3. ✅ Prompt for deployment confirmation
4. ✅ Run full automated deployment:
   - Transfer repository via rsync
   - Initialize production environment (.env.d8rth)
   - Inject 1Password secrets
   - Build container images (orchestrator, build-agent)
   - Deploy 10-service Podman stack
   - Verify all endpoints (SCION, IPFS, FoundationDB)

---

## Manual Deployment (Alternative)

If you prefer manual control:

```bash
./scripts/deploy-to-d8rth.sh
```

Or follow the comprehensive guide:

```bash
cat docs/PRODUCTION_DEPLOYMENT_D8RTH.md
```

---

## Deployment Stack

Once deployed, d8rth will run:

### PAC Tier (741 Hz)
- **lucia-orchestrator** - Port 8741
- **coder** - Port 3000 (Cloud Development Environment)

### COMN Tier (639 Hz)
- **caddy-ingress** - Ports 80, 443 (IPv6-native TLS)

### CORE Tier (528 Hz)
- **scm-engine** (Gogs + Gitoxide) - Port 3000, SSH 2222
- **build-agent** - Build orchestration
- **ipfs** - IPFS node with SCION transport
- **homestar** - IPVM compute
- **ray-head** - Distributed agent compute (port 8265)
- **foundationdb** - Cluster coordination

---

## Service Endpoints (After Deployment)

### Local Testing
```bash
# PAC Orchestrator
curl http://[2602:F674:0001:0741::1]:8741/health

# Coder
curl http://[2602:F674:0001:0741::2]:3000

# IPFS
curl http://[2602:F674:0001:0528::10]:5001/api/v0/id

# SCM Engine
curl http://[2602:F674:0001:0528::1]:3000
```

### SCION Paths
```bash
scion ping 5-528,[2602:F674:0001:0741::1]
scion showpaths 5-528,[2602:F674:0001:0741::1]
```

---

## Next Steps After Deployment

1. **Configure Caddy TLS** - Let's Encrypt via Quad9 DNS-01 challenge
2. **Initialize Storage Systems:**
   - FoundationDB cluster setup (triple replication)
   - IPFS gateway configuration
   - Sovereign Raft consensus
3. **Set Up Monitoring:**
   - Prometheus (port 9090)
   - Grafana (port 3002)
   - Loki (port 3100)
4. **Configure Backups:**
   - ZFS snapshots (daily, 30-day retention)
   - FDB backup (hourly, 7-day retention)
   - IPFS → Arweave (permanent tier)

---

## Troubleshooting

### SSH Still Fails After Adding Key

1. **Check key was added to correct user** - Should be `daryl`, not `admin`
2. **Verify SSH service is running** - Check TrueNAS Services
3. **Check file permissions** - `~/.ssh/authorized_keys` should be 600
4. **Test from d8rth console:**
   ```bash
   cat /home/daryl/.ssh/authorized_keys
   ```

### 1Password Timeout

Re-authenticate with Touch ID:
```bash
op vault list
# Touch ID prompt should appear
```

---

## Files Created

- `docs/PRODUCTION_DEPLOYMENT_D8RTH.md` - Complete deployment guide (666 lines)
- `modules/orchestration/podman/.env.d8rth.example` - Production environment template
- `scripts/deploy-to-d8rth.sh` - Automated 6-step deployment
- `scripts/verify-ssh-and-deploy.sh` - SSH verification + deployment
- `SSH_SETUP_D8RTH.md` - Detailed SSH key setup instructions
- `DEPLOYMENT_READY.md` - **This file**

---

**LDS:** 000.000 @ ∞ Hz | Meta/System
**Genesis Bond:** GB-2025-0524-DRH-LCS-001
**Deployment Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0
**Status:** Ready for production deployment (pending SSH key authorization)
