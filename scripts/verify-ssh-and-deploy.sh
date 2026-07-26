#!/bin/bash
# LDS: 000.000 @ ∞ Hz | Meta/System - SSH Verification and Deployment
# Genesis Bond: GB-2025-0524-DRH-LCS-001
#
# This script verifies SSH access to d8rth and then runs the deployment

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

D8RTH_HOST="192.168.1.195"
D8RTH_USER="admin"
SSH_KEY="$HOME/.ssh/d8rth_mac_key"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  d8rth SSH Verification & Deployment"
echo "  LDS: 000.000 @ ∞ Hz | Genesis Bond: GB-2025-0524-DRH-LCS-001"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Verify SSH key file exists
echo -e "${BLUE}[1/4]${NC} Verifying SSH key file..."
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}✗${NC} SSH key not found: $SSH_KEY"
    exit 1
fi
echo -e "${GREEN}✓${NC} SSH key found: $SSH_KEY"
echo ""

# Step 2: Show public key (for manual verification)
echo -e "${BLUE}[2/4]${NC} SSH Public Key (should be in d8rth authorized_keys):"
echo ""
cat "$SSH_KEY.pub"
echo ""
echo -e "${YELLOW}⚠${NC} If this key is NOT in d8rth's admin user authorized_keys:"
echo "  1. Open: https://$D8RTH_HOST"
echo "  2. Go to: Accounts → Users → admin → Edit"
echo "  3. Add the key above to SSH Public Key field"
echo "  4. Click Save"
echo ""
read -p "Press Enter once the SSH key is added to d8rth..."
echo ""

# Step 3: Test SSH connection
echo -e "${BLUE}[3/4]${NC} Testing SSH connection to d8rth..."
if ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o ConnectTimeout=5 "$D8RTH_USER@$D8RTH_HOST" "echo 'SSH authentication successful!'" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful!"
    echo ""

    # Show d8rth system info
    echo -e "${BLUE}d8rth System Info:${NC}"
    ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$D8RTH_USER@$D8RTH_HOST" "uname -a"
    echo ""
else
    echo -e "${RED}✗${NC} SSH connection failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify the public key was added correctly in TrueNAS UI"
    echo "  2. Check: Accounts → Users → admin → SSH Public Key"
    echo "  3. Ensure the key matches:"
    echo ""
    cat "$SSH_KEY.pub"
    echo ""
    exit 1
fi

# Step 4: Run deployment
echo -e "${BLUE}[4/4]${NC} Running automated deployment..."
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠${NC} Deployment cancelled"
    exit 0
fi

echo ""
exec "$(dirname "$0")/deploy-to-d8rth.sh"
