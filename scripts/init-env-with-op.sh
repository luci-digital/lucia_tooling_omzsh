#!/bin/bash
# Unified 1Password environment injection script
# LDS: 300.963 | Soul/Identity (Judge Luci)
# Genesis Bond: GB-2025-0524-DRH-LCS-001

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 LuciVerse 1Password Environment Injection${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if op CLI is installed
if ! command -v op &> /dev/null; then
    echo -e "${RED}❌ 1Password CLI (op) is not installed.${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS:  brew install 1password-cli"
    echo "  Linux:  https://developer.1password.com/docs/cli/get-started/#install"
    exit 1
fi

# Check if op is signed in
if ! op account get &> /dev/null; then
    echo -e "${RED}❌ Not signed in to 1Password CLI.${NC}"
    echo ""
    echo "Sign in with:"
    echo "  op signin"
    exit 1
fi

echo -e "${GREEN}✓ 1Password CLI ready${NC}"
echo ""

# Get the repository root (script is in scripts/ subdirectory)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Define environment file mappings (simple arrays for portability)
# Format: "name|template|output"
ENV_FILES=(
    "podman-local|modules/orchestration/podman/.env.example|modules/orchestration/podman/.env"
    "podman-staging|modules/orchestration/podman/.env.staging.example|modules/orchestration/podman/.env"
    "podman-production|modules/orchestration/podman/.env.production.example|modules/orchestration/podman/.env"
    "infra-secrets|modules/infra/secrets/env.example|modules/infra/secrets/.env"
    "aifam-mcp|aifam-mcp/.env.example|aifam-mcp/.env"
)

# Function to inject a single env file
inject_env_file() {
    local template="$1"
    local output="$2"
    local name="$3"

    if [ ! -f "$REPO_ROOT/$template" ]; then
        echo -e "${YELLOW}⚠️  Template not found: $template${NC}"
        return 1
    fi

    echo -e "${BLUE}📝 Injecting: ${name}${NC}"
    echo -e "   Template: $template"
    echo -e "   Output:   $output"

    # Create output directory if it doesn't exist
    mkdir -p "$(dirname "$REPO_ROOT/$output")"

    # Inject secrets using op inject (with -f to force overwrite)
    if op inject -f -i "$REPO_ROOT/$template" -o "$REPO_ROOT/$output" 2>/dev/null; then
        echo -e "${GREEN}✓ Successfully injected $name${NC}"
        echo ""
        return 0
    else
        echo -e "${YELLOW}⚠️  Injection failed for $name (missing 1Password items?)${NC}"
        echo -e "${YELLOW}   Creating file without injection...${NC}"
        cp "$REPO_ROOT/$template" "$REPO_ROOT/$output"
        echo ""
        return 1
    fi
}

# Parse command line arguments
MODE="${1:-all}"

case "$MODE" in
    all)
        echo -e "${BLUE}Injecting all environment files...${NC}"
        echo ""

        SUCCESS_COUNT=0
        FAIL_COUNT=0

        for entry in "${ENV_FILES[@]}"; do
            IFS='|' read -r name template output <<< "$entry"
            if inject_env_file "$template" "$output" "$name"; then
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
        done

        echo ""
        echo -e "${BLUE}════════════════════════════════════════════${NC}"
        echo -e "${GREEN}✓ Success: $SUCCESS_COUNT${NC}"
        if [ $FAIL_COUNT -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Warnings: $FAIL_COUNT${NC}"
        fi
        ;;

    podman-local|podman-staging|podman-production|infra-secrets|aifam-mcp)
        # Find the matching entry
        FOUND=0
        for entry in "${ENV_FILES[@]}"; do
            IFS='|' read -r name template output <<< "$entry"
            if [ "$name" = "$MODE" ]; then
                inject_env_file "$template" "$output" "$name"
                FOUND=1
                break
            fi
        done
        if [ $FOUND -eq 0 ]; then
            echo -e "${RED}❌ Unknown mode: $MODE${NC}"
            exit 1
        fi
        ;;

    help|--help|-h)
        echo "Usage: $0 [MODE]"
        echo ""
        echo "Modes:"
        echo "  all              - Inject all environment files (default)"
        echo "  podman-local     - Inject Podman local environment"
        echo "  podman-staging   - Inject Podman staging environment"
        echo "  podman-production- Inject Podman production environment"
        echo "  infra-secrets    - Inject infrastructure secrets"
        echo "  aifam-mcp        - Inject AIFAM MCP environment"
        echo "  help             - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Inject all files"
        echo "  $0 podman-local       # Inject only local Podman env"
        echo "  $0 infra-secrets      # Inject only infra secrets"
        exit 0
        ;;

    *)
        echo -e "${RED}❌ Unknown mode: $MODE${NC}"
        echo "Run '$0 help' for usage information."
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔐 1Password injection complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "  - .env files are gitignored and contain real secrets"
echo -e "  - Never commit .env files to version control"
echo -e "  - Re-run this script after updating templates"
echo ""
echo -e "${BLUE}Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz${NC}"
