#!/usr/bin/env bash
# SCION Endhost Stack Installation
# LDS: 500.639 | Infrastructure / COMN (Juniper)
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 639 Hz

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️${NC}  $*"; }
error() { echo -e "${RED}❌${NC} $*" >&2; }
info() { echo -e "${CYAN}ℹ️${NC}  $*"; }

echo "🌐 SCION Endhost Stack Installation"
echo "═══════════════════════════════════════════════════════════════"
echo "LDS: 500.639 | Infrastructure / COMN (Juniper)"
echo "Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 639 Hz"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="macos";;
    *)          error "Unsupported OS: $OS"; exit 1;;
esac

log "Detected platform: $PLATFORM"

# Configuration
SCION_VERSION="${SCION_VERSION:-v0.11.0}"
SCION_ISD_AS="${SCION_ISD_AS:-5-528:0:1}"  # ISD-5, AS-528, instance 1
SCION_LOCAL_IP="${SCION_LOCAL_IP:-192.168.1.125}"  # ZBook default
INSTALL_DIR="${SCION_INSTALL_DIR:-$HOME/.scion}"

log "SCION Version: $SCION_VERSION"
log "ISD-AS: $SCION_ISD_AS"
log "Local IP: $SCION_LOCAL_IP"
log "Install Directory: $INSTALL_DIR"

# Check prerequisites
check_prereqs() {
    info "Checking prerequisites..."

    local missing=0

    if ! command -v git &> /dev/null; then
        error "git not found"
        ((missing++))
    fi

    if ! command -v go &> /dev/null; then
        warn "Go not found, will install"
    fi

    if [ "$PLATFORM" = "linux" ]; then
        if ! command -v apt-get &> /dev/null && ! command -v yum &> /dev/null; then
            error "No package manager found (apt-get or yum)"
            ((missing++))
        fi
    elif [ "$PLATFORM" = "macos" ]; then
        if ! command -v brew &> /dev/null; then
            error "Homebrew not found, install from https://brew.sh"
            ((missing++))
        fi
    fi

    if [ $missing -gt 0 ]; then
        error "$missing required dependencies missing"
        exit 1
    fi

    log "Prerequisites check complete"
}

# Install Go if needed
install_go() {
    if command -v go &> /dev/null; then
        local go_version=$(go version | awk '{print $3}')
        log "Go already installed: $go_version"
        return 0
    fi

    info "Installing Go..."

    if [ "$PLATFORM" = "macos" ]; then
        brew install go
    elif [ "$PLATFORM" = "linux" ]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y golang-go
        elif command -v yum &> /dev/null; then
            sudo yum install -y golang
        fi
    fi

    log "Go installed: $(go version)"
}

# Install SCION
install_scion() {
    info "Installing SCION $SCION_VERSION..."

    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    # Clone SCION repository
    if [ ! -d "scion" ]; then
        log "Cloning SCION repository..."
        git clone https://github.com/scionproto/scion.git
    fi

    cd scion
    git fetch origin
    git checkout "$SCION_VERSION"

    # Build SCION tools
    log "Building SCION tools..."
    make build

    # Install binaries
    log "Installing binaries to $INSTALL_DIR/bin..."
    mkdir -p "$INSTALL_DIR/bin"
    cp -v bin/* "$INSTALL_DIR/bin/" || true

    log "SCION installed successfully"
}

# Configure SCION endhost
configure_scion() {
    info "Configuring SCION endhost..."

    local config_dir="$INSTALL_DIR/etc"
    mkdir -p "$config_dir"

    # Create topology configuration
    cat > "$config_dir/topology.json" <<EOF
{
  "isd_as": "$SCION_ISD_AS",
  "mtu": 1500,
  "dispatchers": {
    "dispatcher-1": {
      "public": {
        "addr": "$SCION_LOCAL_IP",
        "port": 30041
      }
    }
  },
  "border_routers": {
    "br-1": {
      "internal_addr": "192.168.1.1:30042"
    }
  }
}
EOF

    log "Created topology.json"

    # Create dispatcher configuration
    cat > "$config_dir/dispatcher.toml" <<EOF
# SCION Dispatcher Configuration
# LDS: 500.639 | COMN Layer (Juniper)

[dispatcher]
id = "dispatcher-1"
socket_file_mode = "0770"
delete_socket = true

[dispatcher.public]
addr = "$SCION_LOCAL_IP:30041"

[log.console]
level = "info"
EOF

    log "Created dispatcher.toml"

    # Create sciond (SCION daemon) configuration
    cat > "$config_dir/sciond.toml" <<EOF
# SCION Daemon Configuration

[sd]
address = "$SCION_LOCAL_IP:30255"

[sd.path_db]
connection = "$INSTALL_DIR/var/sciond.db"

[trust_db]
connection = "$INSTALL_DIR/var/trust.db"

[log.console]
level = "info"
EOF

    log "Created sciond.toml"

    # Create directories
    mkdir -p "$INSTALL_DIR/var"
    mkdir -p "$INSTALL_DIR/logs"

    log "SCION configuration complete"
}

# Create systemd service (Linux only)
create_systemd_service() {
    if [ "$PLATFORM" != "linux" ]; then
        warn "Systemd service creation skipped (not Linux)"
        return 0
    fi

    info "Creating systemd user service..."

    local service_dir="$HOME/.config/systemd/user"
    mkdir -p "$service_dir"

    # Dispatcher service
    cat > "$service_dir/scion-dispatcher.service" <<EOF
[Unit]
Description=SCION Dispatcher
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/bin/dispatcher --config $INSTALL_DIR/etc/dispatcher.toml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target
EOF

    # Daemon service
    cat > "$service_dir/scion-daemon.service" <<EOF
[Unit]
Description=SCION Daemon
After=scion-dispatcher.service
Requires=scion-dispatcher.service

[Service]
Type=simple
ExecStart=$INSTALL_DIR/bin/sciond --config $INSTALL_DIR/etc/sciond.toml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target
EOF

    # Reload systemd
    systemctl --user daemon-reload

    log "Systemd services created"
    log "Enable with: systemctl --user enable scion-dispatcher.service scion-daemon.service"
    log "Start with: systemctl --user start scion-dispatcher.service scion-daemon.service"
}

# Create launchd service (macOS only)
create_launchd_service() {
    if [ "$PLATFORM" != "macos" ]; then
        warn "Launchd service creation skipped (not macOS)"
        return 0
    fi

    info "Creating launchd user service..."

    local service_dir="$HOME/Library/LaunchAgents"
    mkdir -p "$service_dir"

    # Dispatcher service
    cat > "$service_dir/org.scionproto.dispatcher.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>org.scionproto.dispatcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/bin/dispatcher</string>
        <string>--config</string>
        <string>$INSTALL_DIR/etc/dispatcher.toml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/logs/dispatcher.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/logs/dispatcher.err</string>
</dict>
</plist>
EOF

    # Daemon service
    cat > "$service_dir/org.scionproto.daemon.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>org.scionproto.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/bin/sciond</string>
        <string>--config</string>
        <string>$INSTALL_DIR/etc/sciond.toml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/logs/sciond.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/logs/sciond.err</string>
</dict>
</plist>
EOF

    log "Launchd services created"
    log "Load with: launchctl load ~/Library/LaunchAgents/org.scionproto.dispatcher.plist"
    log "Load with: launchctl load ~/Library/LaunchAgents/org.scionproto.daemon.plist"
}

# Setup shell integration
setup_shell() {
    info "Setting up shell integration..."

    local shell_config=""
    if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ] || [ -f "$HOME/.bashrc" ]; then
        shell_config="$HOME/.bashrc"
    else
        warn "No shell configuration found, skipping"
        return 0
    fi

    # Add SCION to PATH
    if ! grep -q "/.scion/bin" "$shell_config" 2>/dev/null; then
        echo '' >> "$shell_config"
        echo '# SCION Endhost Stack' >> "$shell_config"
        echo "export PATH=\"$INSTALL_DIR/bin:\$PATH\"" >> "$shell_config"
        echo "export SCION_ISD_AS=\"$SCION_ISD_AS\"" >> "$shell_config"
        log "Added SCION to PATH in $shell_config"
    fi

    log "Shell integration complete"
}

# Verification
verify_installation() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Installation Verification"
    echo "═══════════════════════════════════════════════════════════════"

    export PATH="$INSTALL_DIR/bin:$PATH"

    log "SCION binaries:"
    for bin in dispatcher sciond scion scion-pki; do
        if [ -f "$INSTALL_DIR/bin/$bin" ]; then
            echo "  ✅ $bin"
        else
            echo "  ❌ $bin (not found)"
        fi
    done

    log "Configuration files:"
    for conf in topology.json dispatcher.toml sciond.toml; do
        if [ -f "$INSTALL_DIR/etc/$conf" ]; then
            echo "  ✅ $conf"
        else
            echo "  ❌ $conf (not found)"
        fi
    done

    echo ""
    log "Installation complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Reload shell: source $shell_config"
    echo "2. Start services:"
    if [ "$PLATFORM" = "linux" ]; then
        echo "   systemctl --user start scion-dispatcher.service"
        echo "   systemctl --user start scion-daemon.service"
    elif [ "$PLATFORM" = "macos" ]; then
        echo "   launchctl load ~/Library/LaunchAgents/org.scionproto.dispatcher.plist"
        echo "   launchctl load ~/Library/LaunchAgents/org.scionproto.daemon.plist"
    fi
    echo "3. Test connectivity: scion ping $SCION_ISD_AS"
    echo "4. View paths: scion showpaths $SCION_ISD_AS"
    echo ""
    echo "Configuration:"
    echo "  ISD-AS: $SCION_ISD_AS"
    echo "  Local IP: $SCION_LOCAL_IP"
    echo "  Install Dir: $INSTALL_DIR"
}

# Main execution
main() {
    check_prereqs
    install_go
    install_scion
    configure_scion

    if [ "$PLATFORM" = "linux" ]; then
        create_systemd_service
    elif [ "$PLATFORM" = "macos" ]; then
        create_launchd_service
    fi

    setup_shell
    verify_installation
}

main "$@"
