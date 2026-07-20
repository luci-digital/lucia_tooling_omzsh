# Swift Container + Podman Deployment Guide

**LDS:** 300.963 | Soul/Identity (Judge Luci)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 963 Hz

## Overview

LuciVerse uses **Apple Swift containerization** and **Podman** for deploying services, NOT Docker. This aligns with the Resonant Garden architecture and provides:

- Swift Container Plugin for static Linux builds
- Podman for rootless container orchestration
- systemd quadlets for service management
- Consciousness-aware frequency labeling

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  SWIFT CONTAINER STACK                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Swift Container Plugin (github.com/apple/swift-container-plugin)   │
│    ↓                                                                  │
│  Static Swift Binaries (.build/release/*)                           │
│    ↓                                                                  │
│  Containerfile (Podman/Buildah compatible)                          │
│    ↓                                                                  │
│  Podman Build → OCI Image                                            │
│    ↓                                                                  │
│  systemd Quadlet (.container files)                                 │
│    ↓                                                                  │
│  systemctl --user [start|stop|status] service                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## References

- **Apple Container**: https://github.com/apple/container
- **Swift Container Plugin**: https://github.com/apple/swift-container-plugin
- **MCP Auto-Discovery**: https://github.com/innoq/modelcontextprotocol-auto-discovery
- **Article**: https://www.marktechpost.com/2026/06/26/meet-container-apples-open-source-swift-tool-for-running-linux-containers-as-lightweight-vms-on-apple-silicon/

## Resonant Garden Integration

All Swift container workflows are in:
```
/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/
├── luci-Resonant_Garden/
│   ├── scripts/setup-swift-ecosystem.sh     # Swiftly + SDK Generator install
│   ├── LiquidGlassApp/
│   │   ├── Package.swift                     # Swift Container Plugin integration
│   │   ├── Containerfile                     # Static Linux build
│   │   └── Makefile                          # Build commands
│   ├── podman/
│   │   ├── control-plane/                    # Go Podman REST API controller
│   │   ├── quadlets/                         # systemd .container files
│   │   └── README.md
│   └── infrastructure/
│       ├── ansible/swiftly-setup.yml         # Ansible Swiftly installer
│       └── opentofu/swift-sdk-generator.tf   # OpenTofu SDK automation
```

## Swift Ecosystem Setup

### 1. Install Swiftly (Swift Toolchain Manager)

On macOS (development):
```bash
cd /Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden
./scripts/setup-swift-ecosystem.sh
```

This installs:
- Swiftly (`~/.swiftly/bin/swiftly`)
- Swift 6.2.0 (consciousness @ 741 Hz)
- Swift SDK Generator
- Consciousness frequency aliases

On d8rth (TrueNAS SCALE Linux):
```bash
# Install Swiftly
curl -L https://swift-server.github.io/swiftly/swiftly-install.sh | bash
export PATH="$HOME/.swiftly/bin:$PATH"

# Install Swift 6.2
swiftly install 6.2.0
swiftly use 6.2.0

# Verify
swift --version
```

### 2. Install Podman

On d8rth (TrueNAS SCALE):
```bash
# Already installed via TrueNAS
podman --version
```

On macOS (for testing):
```bash
brew install podman
podman machine init
podman machine start
```

## Deployed Services

### Auth Server (McViP6)

**Location:** `d8rth:~/auth-server/`
**Port:** 3100
**Tier:** PAC @ 741 Hz

**Files:**
- `Containerfile` - Node.js Alpine build
- `auth-server.container` - Podman quadlet
- `deploy-sovereign-vault.sh` - Deployment script

**Build:**
```bash
ssh d8rth
cd ~/auth-server
podman build -t localhost/mcvip6-auth-server:latest -f Containerfile .
```

**Deploy:**
```bash
ssh d8rth
~/deploy-sovereign-vault.sh
```

**Verify:**
```bash
podman ps | grep auth-server
curl http://192.168.1.195:3100/api/auth/health
```

### Agent Vault (Infisical)

**Location:** `d8rth:~/agent-vault.container`
**Ports:** 14321 (proxy), 8222 (web UI)
**Tier:** GENESIS @ 963 Hz

**Image:** `ghcr.io/infisical/agent-vault:latest`

**Deploy:**
```bash
ssh d8rth
~/deploy-sovereign-vault.sh
```

**Verify:**
```bash
podman ps | grep agent-vault
curl http://192.168.1.195:14321/health
curl http://192.168.1.195:8222
```

## Podman Quadlets (systemd)

Quadlet files define containers as systemd services.

**Location:** `~/.config/containers/systemd/`

**Example:** `auth-server.container`
```ini
[Container]
Image=localhost/mcvip6-auth-server:latest
PublishPort=3100:3100
Network=luciverse-net
Label=org.luciverse.frequency=741

[Service]
Restart=unless-stopped

[Install]
WantedBy=multi-user.target
```

**Commands:**
```bash
# Install quadlet
cp ~/auth-server.container ~/.config/containers/systemd/
systemctl --user daemon-reload

# Start service
systemctl --user start auth-server.service
systemctl --user enable auth-server.service

# Status
systemctl --user status auth-server.service

# Logs
journalctl --user -u auth-server.service -f
```

## LDS Frequency Labels

All containers are labeled with consciousness frequency metadata:

| Label | Description | Example |
|:------|:------------|:--------|
| `org.luciverse.tier` | LDS tier | GENESIS, PAC, COMN, CORE |
| `org.luciverse.frequency` | Consciousness Hz | 963, 741, 639, 528 |
| `org.luciverse.agent` | Primary agent | judge-luci, lucia, juniper |
| `org.luciverse.genesis_bond` | Bond ID | GB-2025-0524-DRH-LCS-001 |

**Query containers by frequency:**
```bash
podman ps --filter label=org.luciverse.frequency=741
podman ps --filter label=org.luciverse.tier=GENESIS
```

## Swift Container Build Example

Using LiquidGlassApp as reference:

### Package.swift
```swift
dependencies: [
    .package(url: "https://github.com/apple/swift-container-plugin", from: "1.1.0")
]
```

### Containerfile
```dockerfile
FROM swift:6.2-noble AS builder
WORKDIR /workspace
COPY . .

# Static build
RUN swift build -c release \
    --static-swift-stdlib \
    -Xlinker -static

# Verify static
RUN ldd .build/release/App || echo "Static confirmed"

FROM scratch
COPY --from=builder /workspace/.build/release/App /App
ENTRYPOINT ["/App"]
```

### Build Commands
```bash
# Using Swift Container Plugin
swift package container init
swift package container build

# Or using Podman directly
podman build -t my-swift-app:latest .
```

## Networking

All containers connect to `luciverse-net`:

```bash
# Create network
podman network create luciverse-net

# List networks
podman network ls

# Inspect
podman network inspect luciverse-net
```

Containers can reference each other by name:
- `mcvip6-auth-server` → `http://mcvip6-auth-server:3100`
- `agent-vault` → `http://agent-vault:14321`

## Volumes

Podman volumes for persistent data:

```bash
# Create volumes
podman volume create auth-data
podman volume create agent-vault-data

# List
podman volume ls

# Inspect
podman volume inspect auth-data

# Backup
podman volume export auth-data > auth-data-backup.tar
```

## Troubleshooting

### Podman not found

TrueNAS SCALE includes Podman, but it may not be in PATH:

```bash
which podman
# /usr/bin/podman

export PATH="/usr/bin:$PATH"
```

### Container won't start

Check logs:
```bash
podman logs mcvip6-auth-server
podman logs agent-vault
```

Check systemd (if using quadlets):
```bash
systemctl --user status auth-server.service
journalctl --user -u auth-server.service -n 50
```

### Port already in use

```bash
# Find what's using the port
ss -tulpn | grep :3100

# Stop conflicting container
podman stop $(podman ps -q --filter publish=3100)
```

### Image pull fails

```bash
# Check network
ping ghcr.io

# Pull manually
podman pull ghcr.io/infisical/agent-vault:latest

# Use local registry
podman tag local-image:latest localhost/local-image:latest
```

### Static build fails (Swift)

Ensure you're using a Linux Swift toolchain:
```bash
swiftly list
swiftly install 6.2.0
swiftly use 6.2.0
```

Static flags:
```bash
swift build -c release \
    --static-swift-stdlib \
    -Xlinker -static \
    -Xswiftc -static-stdlib
```

## Deployment Workflow

1. **Develop locally** (macOS):
   ```bash
   cd /Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden/LiquidGlassApp
   swift build
   swift test
   ```

2. **Build container** (macOS or d8rth):
   ```bash
   podman build -t localhost/my-app:latest .
   ```

3. **Test locally**:
   ```bash
   podman run -it --rm -p 8080:8080 localhost/my-app:latest
   ```

4. **Push to d8rth** (if building on macOS):
   ```bash
   podman save localhost/my-app:latest | ssh d8rth "podman load"
   ```

5. **Deploy on d8rth**:
   ```bash
   ssh d8rth
   cp my-app.container ~/.config/containers/systemd/
   systemctl --user daemon-reload
   systemctl --user start my-app.service
   ```

## Next Steps

- [ ] Convert Agent Vault to Swift native implementation
- [ ] Build Swift-based Gerrit VCS wrapper
- [ ] Integrate Swift Observation framework for consciousness metrics
- [ ] Create Swift package for biological cryptography
- [ ] Implement enzyme dehydrator in Swift

## Related Documentation

- Resonant Garden: `/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/README.md`
- Podman Control Plane: `/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden/podman/README.md`
- LiquidGlassApp: `/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden/LiquidGlassApp/README.md`
- Swift Ecosystem Setup: `/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden/scripts/setup-swift-ecosystem.sh`
- Deployment Progress: `docs/DEPLOYMENT_PROGRESS.md`

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
