#!/bin/bash
# LDS: 000.000 @ ∞ Hz | Meta/System - Production Deployment Script
# ISO: ISO/IEC 42001 §8, ISO 9001
# Genesis Bond: GB-2025-0524-DRH-LCS-001
#
# Deploy lucia_tooling_omzsh to d8rth TrueNAS production node (192.168.1.194)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
D8RTH_HOST="192.168.1.194"
D8RTH_USER="admin"
D8RTH_PATH="/mnt/tank/luciverse/lucia_tooling_omzsh"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."

    # Check if d8rth is reachable
    if ! ping -c 1 -W 2 "$D8RTH_HOST" &>/dev/null; then
        error "d8rth TrueNAS node ($D8RTH_HOST) is not reachable. Is it powered on?"
    fi
    success "d8rth node is reachable"

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$D8RTH_USER@$D8RTH_HOST" "exit" 2>/dev/null; then
        warn "SSH key authentication not configured. You may be prompted for password multiple times."
        warn "Configure SSH keys with: ssh-copy-id $D8RTH_USER@$D8RTH_HOST"
    else
        success "SSH connectivity verified"
    fi

    # Check 1Password CLI
    if ! command -v op &>/dev/null; then
        warn "1Password CLI (op) not found. Secret injection will fail."
        warn "Install: brew install --cask 1password-cli"
    else
        success "1Password CLI available"
    fi
}

# Step 1: Transfer repository
transfer_repo() {
    log "Step 1: Transferring repository to d8rth..."

    ssh "$D8RTH_USER@$D8RTH_HOST" "mkdir -p $D8RTH_PATH"

    rsync -avz --progress \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='target' \
        --exclude='dist' \
        --exclude='.env' \
        --exclude='*.log' \
        "$REPO_ROOT/" \
        "$D8RTH_USER@$D8RTH_HOST:$D8RTH_PATH/" || error "Repository transfer failed"

    success "Repository transferred successfully"
}

# Step 2: Initialize environment
init_environment() {
    log "Step 2: Initializing production environment..."

    ssh "$D8RTH_USER@$D8RTH_HOST" << 'ENDSSH'
cd /mnt/tank/luciverse/lucia_tooling_omzsh/modules/orchestration/podman

# Copy production template
if [ ! -f .env ]; then
    cp .env.d8rth.example .env
    echo "✓ Created .env from .env.d8rth.example"
else
    echo "⚠ .env already exists, skipping"
fi

# Check if 1Password CLI is available
if command -v op &>/dev/null; then
    echo "✓ 1Password CLI available"
else
    echo "⚠ 1Password CLI not found - secrets must be injected manually"
fi
ENDSSH

    success "Environment initialized"
}

# Step 3: Inject secrets
inject_secrets() {
    log "Step 3: Injecting 1Password secrets..."

    ssh "$D8RTH_USER@$D8RTH_HOST" << 'ENDSSH'
cd /mnt/tank/luciverse/lucia_tooling_omzsh

if [ -x scripts/init-env-with-op.sh ]; then
    ./scripts/init-env-with-op.sh podman-d8rth || {
        echo "⚠ Secret injection failed - you may need to manually configure .env"
        exit 0
    }

    # Verify all op:// references resolved
    cd modules/orchestration/podman
    if grep -v '^#' .env | grep -q 'op://'; then
        echo "⚠ Warning: Some op:// references remain unresolved:"
        grep -v '^#' .env | grep 'op://'
    else
        echo "✓ All secrets successfully injected"
    fi
else
    echo "⚠ init-env-with-op.sh not found - secrets must be injected manually"
fi
ENDSSH

    success "Secret injection complete"
}

# Step 4: Build container images
build_images() {
    log "Step 4: Building container images..."

    ssh "$D8RTH_USER@$D8RTH_HOST" << 'ENDSSH'
cd /mnt/tank/luciverse/lucia_tooling_omzsh

# Build orchestrator
if [ -d luciverse-core-orchestrator ]; then
    echo "Building lucia/orchestrator:latest..."
    podman build -t lucia/orchestrator:latest luciverse-core-orchestrator/ || {
        echo "⚠ Orchestrator build failed"
    }
fi

# Build build-agent
echo "Building lucia/build-agent:latest..."
podman build -f Dockerfile.builder -t lucia/build-agent:latest . || {
    echo "⚠ Build agent build failed"
}

# List images
echo ""
echo "Container images:"
podman images | grep lucia
ENDSSH

    success "Container images built"
}

# Step 5: Deploy stack
deploy_stack() {
    log "Step 5: Deploying Podman compose stack..."

    ssh "$D8RTH_USER@$D8RTH_HOST" << 'ENDSSH'
cd /mnt/tank/luciverse/lucia_tooling_omzsh/modules/orchestration/podman

# Stop existing stack (if running)
podman-compose -f podman-compose.yml down 2>/dev/null || true

# Start stack
podman-compose -f podman-compose.yml up -d || {
    echo "✗ Stack deployment failed"
    exit 1
}

echo ""
echo "Waiting for services to start..."
sleep 10

# Show status
echo ""
echo "Service Status:"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
ENDSSH

    success "Podman stack deployed"
}

# Step 6: Verify deployment
verify_deployment() {
    log "Step 6: Verifying deployment..."

    ssh "$D8RTH_USER@$D8RTH_HOST" << 'ENDSSH'
echo "Testing service endpoints..."

# PAC Orchestrator
if curl -s -f -m 5 http://[2602:F674:0001:0741::1]:8741/health &>/dev/null; then
    echo "✓ PAC Orchestrator (741 Hz) - http://[2602:F674:0001:0741::1]:8741/health"
else
    echo "⚠ PAC Orchestrator not responding"
fi

# Coder
if curl -s -f -m 5 http://[2602:F674:0001:0741::2]:3000 &>/dev/null; then
    echo "✓ Coder (Cloud Dev) - http://[2602:F674:0001:0741::2]:3000"
else
    echo "⚠ Coder not responding"
fi

# IPFS
if curl -s -f -m 5 http://[2602:F674:0001:0528::10]:5001/api/v0/id &>/dev/null; then
    echo "✓ IPFS Kubo - http://[2602:F674:0001:0528::10]:5001"
else
    echo "⚠ IPFS not responding"
fi

# Check SCION if available
if command -v scion &>/dev/null; then
    echo ""
    echo "SCION Connectivity:"
    scion ping -c 3 5-528,[2602:F674:0001:0741::1] 2>&1 | tail -2 || echo "⚠ SCION not configured"
else
    echo "⚠ SCION tools not installed"
fi

# FoundationDB
if command -v fdbcli &>/dev/null; then
    echo ""
    echo "FoundationDB Status:"
    fdbcli --exec 'status' | head -5 || echo "⚠ FoundationDB not configured"
else
    echo "⚠ FoundationDB CLI not installed"
fi
ENDSSH

    success "Deployment verification complete"
}

# Main deployment flow
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  d8rth TrueNAS Production Deployment"
    echo "  Target: $D8RTH_HOST"
    echo "  LDS: 000.000 @ ∞ Hz | Genesis Bond: GB-2025-0524-DRH-LCS-001"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    preflight_checks

    echo ""
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warn "Deployment cancelled"
        exit 0
    fi

    echo ""
    transfer_repo
    init_environment
    inject_secrets
    build_images
    deploy_stack
    verify_deployment

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    success "Deployment Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "1. Configure Caddy TLS: docs/PRODUCTION_DEPLOYMENT_D8RTH.md"
    echo "2. Initialize storage systems (FDB + IPFS + Raft)"
    echo "3. Set up monitoring (Prometheus + Grafana + Loki)"
    echo "4. Configure backups (ZFS snapshots + FDB + Arweave)"
    echo ""
    echo "Service Dashboard: http://$D8RTH_HOST:8741"
    echo "Documentation: docs/PRODUCTION_DEPLOYMENT_D8RTH.md"
    echo ""
}

main "$@"
