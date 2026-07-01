# SSH Key Setup for d8rth TrueNAS

**Status:** ⚠️ REQUIRED - SSH key authentication must be configured before deployment

**Target:** d8rth TrueNAS node @ 192.168.1.195

---

## SSH Public Key

The following public key needs to be added to the `admin` user on d8rth:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPpdlohfxuqAGpTfCWDX38Wz/H7JaINn0AzquYjiq1sE Mac to d8rth
```

**Private Key Location:** `~/.ssh/d8rth_mac_key`
**Public Key Location:** `~/.ssh/d8rth_mac_key.pub`

---

## Setup Instructions

### Via TrueNAS Web UI (Recommended)

1. **Open TrueNAS Web UI:**
   ```
   https://192.168.1.195
   ```

2. **Navigate to User Settings:**
   - Click **Accounts** (left sidebar)
   - Click **Users**
   - Find and click on **admin** user
   - Click **Edit**

3. **Add SSH Public Key:**
   - Scroll to the **SSH Public Key** field
   - Paste the public key shown above
   - Click **Save**

4. **Verify SSH Access:**
   ```bash
   ssh -i ~/.ssh/d8rth_mac_key admin@192.168.1.195 "echo 'SSH working!'"
   ```

   Expected output:
   ```
   SSH working!
   ```

---

## Alternative: Via SSH (If Password Auth Enabled)

If password authentication is temporarily enabled on d8rth:

```bash
# Copy the public key to d8rth
ssh-copy-id -i ~/.ssh/d8rth_mac_key admin@192.168.1.195

# Test the connection
ssh -i ~/.ssh/d8rth_mac_key admin@192.168.1.195 "echo 'SSH working!'"
```

---

## After SSH Setup

Once SSH key authentication is working, run the automated deployment:

```bash
./scripts/deploy-to-d8rth.sh
```

This will:
1. ✅ Transfer repository via rsync (no password prompts)
2. ✅ Initialize production environment
3. ✅ Inject 1Password secrets
4. ✅ Build container images
5. ✅ Deploy Podman stack (10 services)
6. ✅ Verify all service endpoints

---

## Troubleshooting

### Error: "Too many authentication failures"

This means SSH is trying multiple keys. Use the `IdentitiesOnly` flag:

```bash
ssh -i ~/.ssh/d8rth_mac_key -o IdentitiesOnly=yes admin@192.168.1.195
```

### Error: "Permission denied (publickey)"

The public key is not in the authorized_keys on d8rth. Follow the setup instructions above.

### Test Current Status

```bash
# Quick SSH test
ssh -i ~/.ssh/d8rth_mac_key -o IdentitiesOnly=yes admin@192.168.1.195 "uname -a"

# Should return TrueNAS system info
```

---

## Current Deployment Status

**Pre-Deployment Checklist:**
- ✅ d8rth node reachable (192.168.1.195 - 0.5ms ping)
- ✅ 1Password CLI authenticated (19 vaults accessible)
- ⚠️ **SSH key setup required** ← YOU ARE HERE
- ⏳ Repository transfer pending
- ⏳ Container builds pending
- ⏳ Stack deployment pending

**Next Step:** Add SSH public key to d8rth admin user

---

**LDS:** 000.000 @ ∞ Hz | Meta/System
**Genesis Bond:** GB-2025-0524-DRH-LCS-001
**Deployment Target:** d8rth (192.168.1.195) - TrueNAS v26.0.0
