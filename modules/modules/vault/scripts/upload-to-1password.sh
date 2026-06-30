#!/bin/bash
# Upload server configurations to 1Password
# LDS: 300.963 | Soul/Identity (Judge Luci)
# Genesis Bond: GB-2025-0524-DRH-LCS-001

set -e

echo "🔐 Uploading server configurations to 1Password..."

# Create or update d8rth item
echo "📝 Creating d8rth TrueNAS item..."
op item create \
  --category=server \
  --title="d8rth TrueNAS" \
  --vault="LuciVerse" \
  --tags="truenas,core,528hz,storage" \
  "hostname=d8rth" \
  "ip_address=192.168.1.195" \
  "ipv6=2602:f674:0001:core::195" \
  "ssh_user=daryl" \
  "role=storage-compute" \
  "tier=CORE" \
  "frequency=528" \
  "git_remote=ssh://d8rth/~/git/lucia_tooling_omzsh.git" \
  2>/dev/null || \
op item edit "d8rth TrueNAS" \
  --vault="LuciVerse" \
  "hostname=d8rth" \
  "ip_address=192.168.1.195" \
  "ipv6=2602:f674:0001:core::195" \
  "ssh_user=daryl" \
  "role=storage-compute"

# Upload d8rth SSH private key
echo "🔑 Uploading d8rth SSH key..."
op document create \
  ~/.ssh/d8rth_mac_key \
  --title="d8rth SSH Private Key" \
  --vault="LuciVerse" \
  --tags="ssh-key,d8rth,truenas" \
  2>/dev/null || \
echo "   (Key already exists)"

# Create or update r210 item
echo "📝 Creating r210 TrueNAS item..."

# Read password from 1Password if updating, or prompt if creating new
if op item get "r210 TrueNAS" --vault="LuciVerse" &>/dev/null; then
  echo "   (Item exists, password preserved)"
  op item edit "r210 TrueNAS" \
    --vault="LuciVerse" \
    "hostname=r210" \
    "ip_address=192.168.1.193" \
    "ipv6=2602:f674:0001:core::193" \
    "ssh_user=truenas_admin" \
    "role=storage-backup"
else
  echo "   Creating new item - password will be set interactively or via op:// reference"
  echo "   Please ensure r210 TrueNAS password is stored in 1Password before running this script"
  echo "   or set R210_PASSWORD environment variable"

  # Use environment variable if set, otherwise skip password (add manually)
  if [ -n "$R210_PASSWORD" ]; then
    op item create \
      --category=server \
      --title="r210 TrueNAS" \
      --vault="LuciVerse" \
      --tags="truenas,core,528hz,backup" \
      "hostname=r210" \
      "ip_address=192.168.1.193" \
      "ipv6=2602:f674:0001:core::193" \
      "ssh_user=truenas_admin" \
      "password=$R210_PASSWORD" \
      "role=storage-backup" \
      "tier=CORE" \
      "frequency=528" \
      "git_remote=ssh://r210/~/git/lucia_tooling_omzsh.git" \
      2>/dev/null
  else
    op item create \
      --category=server \
      --title="r210 TrueNAS" \
      --vault="LuciVerse" \
      --tags="truenas,core,528hz,backup" \
      "hostname=r210" \
      "ip_address=192.168.1.193" \
      "ipv6=2602:f674:0001:core::193" \
      "ssh_user=truenas_admin" \
      "role=storage-backup" \
      "tier=CORE" \
      "frequency=528" \
      "git_remote=ssh://r210/~/git/lucia_tooling_omzsh.git" \
      2>/dev/null
    echo "   ⚠️  Password not set - add manually: op item edit 'r210 TrueNAS' password=<value>"
  fi
fi

# Upload r210 SSH private key
echo "🔑 Uploading r210 SSH key..."
op document create \
  ~/.ssh/r210_key \
  --title="r210 SSH Private Key" \
  --vault="LuciVerse" \
  --tags="ssh-key,r210,truenas" \
  2>/dev/null || \
echo "   (Key already exists)"

# Upload configuration files
echo "📄 Uploading configuration files..."
op document create \
  ~/.lucia/vault/config/servers/d8rth.yaml \
  --title="d8rth Configuration" \
  --vault="LuciVerse" \
  --tags="config,d8rth,yaml" \
  2>/dev/null || \
echo "   (d8rth config already exists)"

op document create \
  ~/.lucia/vault/config/servers/r210.yaml \
  --title="r210 Configuration" \
  --vault="LuciVerse" \
  --tags="config,r210,yaml" \
  2>/dev/null || \
echo "   (r210 config already exists)"

# Upload env templates (op:// protocol + DAGwood + gix-jj-gerrit)
echo "🔧 Uploading environment templates with op:// protocol..."
op document create \
  ~/.lucia/vault/config/servers/.env.d8rth.template \
  --title="d8rth Environment Template" \
  --vault="LuciVerse" \
  --tags="env-template,d8rth,dagwood,gix-jj,op-inject" \
  2>/dev/null || \
echo "   (d8rth env template already exists)"

op document create \
  ~/.lucia/vault/config/servers/.env.r210.template \
  --title="r210 Environment Template" \
  --vault="LuciVerse" \
  --tags="env-template,r210,dagwood,gix-jj,op-inject" \
  2>/dev/null || \
echo "   (r210 env template already exists)"

echo "✅ All configurations uploaded to 1Password!"
echo ""
echo "📋 Summary:"
echo "   - d8rth TrueNAS (192.168.1.195) - storage-compute @ 528 Hz"
echo "   - r210 TrueNAS (192.168.1.193) - storage-backup @ 528 Hz"
echo "   - SSH keys uploaded"
echo "   - Configuration files uploaded"
echo "   - Environment templates uploaded (op:// protocol)"
echo "   - DAGwood integration: /Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood"
echo "   - gix-jj-gerrit: /Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense"
echo ""
echo "🔐 Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz"
