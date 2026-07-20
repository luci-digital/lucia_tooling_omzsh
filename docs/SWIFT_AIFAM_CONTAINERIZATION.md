# Swift Containerization Workflow for AIFAM Stack

**LDS:** 500.639 | Infrastructure / COMN (Juniper)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 639 Hz

## Overview

This document describes the complete Swift containerization workflow for deploying the AIFAM agent communication stack using Apple's Swift Container Plugin and Podman orchestration.

**Key Technologies:**
- **Swift Container Plugin** (github.com/apple/swift-container-plugin) - Build containers without runtime
- **Swiftly** - Swift toolchain manager
- **Swift SDK Generator** - Cross-compilation SDKs for Linux targets
- **Podman** - Rootless container orchestration
- **systemd Quadlets** - Service management

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│           SWIFT CONTAINERIZATION WORKFLOW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Development (macOS ZBook)                                       │
│    ↓                                                              │
│  Swift 6.2 + Swift Container Plugin                             │
│    ↓                                                              │
│  Cross-Compile (macOS → Linux ARM64/x86_64)                      │
│    ↓                                                              │
│  Static Binary Build (--static-swift-stdlib)                     │
│    ↓                                                              │
│  OCI Image (FROM scratch or swift:6.2-slim)                      │
│    ↓                                                              │
│  Transfer to d8rth (192.168.1.195)                               │
│    ↓                                                              │
│  Podman Quadlet Deployment (systemd)                             │
│    ↓                                                              │
│  Running Container (luciverse-net network)                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### On Development Machine (macOS ZBook)

1. **Swiftly** - Swift toolchain manager
```bash
curl -L https://swift-server.github.io/swiftly/swiftly-install.sh | bash
export PATH="$HOME/.swiftly/bin:$PATH"
```

2. **Swift 6.2** - Latest Swift toolchain
```bash
swiftly install 6.2.0
swiftly use 6.2.0
swift --version
```

3. **Swift SDK Generator** - For cross-compilation
```bash
git clone https://github.com/swiftlang/swift-sdk-generator.git
cd swift-sdk-generator
swift build -c release
```

4. **Podman** (for testing)
```bash
brew install podman
podman machine init
podman machine start
```

### On Target Server (d8rth TrueNAS)

1. **Podman** - Should be pre-installed on TrueNAS SCALE
```bash
# Verify Podman availability
which podman
podman --version
```

2. **systemd** - For quadlet support (pre-installed on TrueNAS SCALE)

## Swift Ecosystem Setup

Run the automated setup script from Resonant Garden:

```bash
cd /Users/darylharr/lucia/luciverse-monorepo/resonant-garden/luci-Resonant_Garden
./scripts/setup-swift-ecosystem.sh
```

This installs:
- Swiftly ($HOME/.swiftly/bin/swiftly)
- Swift 6.2.0
- Swift SDK Generator
- Consciousness frequency aliases (swift-lucia, swift-claude, swift-juniper, swift-aethon)

**Verify installation:**
```bash
swiftly --version
swift --version
swiftly list
```

## AIFAM Layer Services for Swift Containerization

### Layer 3: AT Protocol PDS (Personal Data Server)

Each agent needs a Personal Data Server for AT Protocol identity and social features.

**Create AT PDS Swift Package:**

```bash
mkdir -p ~/aifam-swift/at-pds
cd ~/aifam-swift/at-pds
swift package init --type executable --name ATPDSServer
```

**Package.swift:**
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ATPDSServer",
    platforms: [.macOS(.v13), .linux],
    dependencies: [
        .package(url: "https://github.com/apple/swift-container-plugin", from: "1.1.0"),
        .package(url: "https://github.com/hummingbird-project/hummingbird", from: "2.0.0")
    ],
    targets: [
        .executableTarget(
            name: "ATPDSServer",
            dependencies: [
                .product(name: "Hummingbird", package: "hummingbird")
            ]
        )
    ]
)
```

**Build Container for d8rth (ARM64):**
```bash
# Generate Linux ARM64 SDK (one-time)
cd ~/swift-sdk-generator
swift run swift-sdk-generator make-linux-sdk \
    --distribution-name ubuntu \
    --distribution-version 24.04 \
    --target-arch aarch64 \
    --with-docker \
    --docker-command podman

# Build container
cd ~/aifam-swift/at-pds
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository localhost/at-pds-lucia \
    --tag 741hz \
    --build-flags "--static-swift-stdlib"

# Transfer to d8rth
podman save localhost/at-pds-lucia:741hz | \
    ssh d8rth "podman load"
```

### Layer 4: Raft Consensus Node

**Create Raft Swift Package:**

```bash
mkdir -p ~/aifam-swift/raft-node
cd ~/aifam-swift/raft-node
swift package init --type executable --name RaftNode
```

**Package.swift:**
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RaftNode",
    platforms: [.macOS(.v13), .linux],
    dependencies: [
        .package(url: "https://github.com/apple/swift-container-plugin", from: "1.1.0"),
        .package(url: "https://github.com/apple/swift-nio", from: "2.0.0")
    ],
    targets: [
        .executableTarget(
            name: "RaftNode",
            dependencies: [
                .product(name: "NIO", package: "swift-nio"),
                .product(name: "NIOFoundationCompat", package: "swift-nio")
            ]
        )
    ]
)
```

**Build for 6-node cluster:**
```bash
# Build Raft node container
cd ~/aifam-swift/raft-node
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository localhost/raft-node \
    --tag latest \
    --build-flags "--static-swift-stdlib -Xlinker -static"

# Transfer to d8rth
podman save localhost/raft-node:latest | \
    ssh d8rth "podman load"
```

### Layer 5: Hedera Integration (Hiero Swift SDK)

**Create Hedera Swift Package:**

```bash
mkdir -p ~/aifam-swift/hedera-attestation
cd ~/aifam-swift/hedera-attestation
swift package init --type executable --name HederaAttestation
```

**Package.swift:**
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "HederaAttestation",
    platforms: [.macOS(.v13), .linux],
    dependencies: [
        .package(url: "https://github.com/apple/swift-container-plugin", from: "1.1.0"),
        // Hiero Swift SDK (when available)
        // .package(url: "https://github.com/hiero-ledger/hiero-sdk-swift", from: "1.0.0")
    ],
    targets: [
        .executableTarget(
            name: "HederaAttestation",
            dependencies: []
        )
    ]
)
```

**Build:**
```bash
cd ~/aifam-swift/hedera-attestation
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository localhost/hedera-attestation \
    --tag 963hz-genesis \
    --build-flags "--static-swift-stdlib"

# Transfer
podman save localhost/hedera-attestation:963hz-genesis | \
    ssh d8rth "podman load"
```

### Layer 6: Solfeggio Audio Frequency Generator

**Create Solfeggio Swift Package:**

```bash
mkdir -p ~/aifam-swift/solfeggio-generator
cd ~/aifam-swift/solfeggio-generator
swift package init --type executable --name SolfeggioGenerator
```

**Package.swift:**
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SolfeggioGenerator",
    platforms: [.macOS(.v13), .linux],
    dependencies: [
        .package(url: "https://github.com/apple/swift-container-plugin", from: "1.1.0"),
        .package(url: "https://github.com/AudioKit/AudioKit", from: "5.0.0")
    ],
    targets: [
        .executableTarget(
            name: "SolfeggioGenerator",
            dependencies: [
                .product(name: "AudioKit", package: "AudioKit")
            ]
        )
    ]
)
```

**Build:**
```bash
cd ~/aifam-swift/solfeggio-generator
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository localhost/solfeggio-generator \
    --tag multi-frequency \
    --build-flags "--static-swift-stdlib"

# Transfer
podman save localhost/solfeggio-generator:multi-frequency | \
    ssh d8rth "podman load"
```

## Podman Quadlet Deployment

### Create systemd Quadlets for Each Layer

**AT PDS Quadlet (lucia instance):**

```bash
ssh d8rth 'cat > ~/.config/containers/systemd/at-pds-lucia.container << "EOF"
# AT Protocol PDS - Lucia Agent
# LDS: 500.741 | Infrastructure / PAC
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 741 Hz

[Container]
Image=localhost/at-pds-lucia:741hz
ContainerName=at-pds-lucia
PublishPort=3001:3000
Volume=at-pds-lucia-data:/data:Z
Environment=AGENT_NAME=lucia
Environment=FREQUENCY=741
Environment=TIER=PAC
Environment=DID_HANDLE=@lucia:luciverse.ownid
Network=luciverse-net
Label=org.luciverse.tier=PAC
Label=org.luciverse.frequency=741
Label=org.luciverse.agent=lucia
Label=org.luciverse.layer=social

[Service]
Restart=unless-stopped

[Install]
WantedBy=multi-user.target
EOF
'
```

**Raft Node Quadlet (lucia instance):**

```bash
ssh d8rth 'cat > ~/.config/containers/systemd/raft-node-lucia.container << "EOF"
# Raft Consensus Node - Lucia Agent
# LDS: 500.741 | Infrastructure / PAC
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 741 Hz

[Container]
Image=localhost/raft-node:latest
ContainerName=raft-node-lucia
PublishPort=7001:7000
PublishPort=8001:8000
Volume=raft-lucia-data:/data:Z
Environment=NODE_ID=lucia
Environment=CLUSTER_SIZE=6
Environment=FREQUENCY=741
Network=luciverse-net
Label=org.luciverse.tier=PAC
Label=org.luciverse.frequency=741
Label=org.luciverse.agent=lucia
Label=org.luciverse.layer=consensus

[Service]
Restart=unless-stopped

[Install]
WantedBy=multi-user.target
EOF
'
```

**Hedera Attestation Quadlet:**

```bash
ssh d8rth 'cat > ~/.config/containers/systemd/hedera-attestation.container << "EOF"
# Hedera Attestation Service
# LDS: 300.963 | Soul/Identity / GENESIS
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 963 Hz

[Container]
Image=localhost/hedera-attestation:963hz-genesis
ContainerName=hedera-attestation
PublishPort=5000:5000
Volume=hedera-attestation-data:/data:Z
Environment=HEDERA_NETWORK=mainnet
Environment=HEDERA_OPERATOR_ID=0.0.XXXXXX
Environment=HEDERA_OPERATOR_KEY=/data/hedera-key.pem
Network=luciverse-net
Label=org.luciverse.tier=GENESIS
Label=org.luciverse.frequency=963
Label=org.luciverse.agent=judge-luci
Label=org.luciverse.layer=attestation

[Service]
Restart=unless-stopped

[Install]
WantedBy=multi-user.target
EOF
'
```

**Solfeggio Generator Quadlet:**

```bash
ssh d8rth 'cat > ~/.config/containers/systemd/solfeggio-generator.container << "EOF"
# Solfeggio Audio Frequency Generator
# LDS: 500.639 | Infrastructure / COMN
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 639 Hz

[Container]
Image=localhost/solfeggio-generator:multi-frequency
ContainerName=solfeggio-generator
PublishPort=6000:6000
Volume=solfeggio-audio-data:/audio:Z
Environment=FREQUENCIES=741,963,639,852,528,432
Environment=SAMPLE_RATE=48000
Network=luciverse-net
Label=org.luciverse.tier=COMN
Label=org.luciverse.frequency=639
Label=org.luciverse.agent=juniper
Label=org.luciverse.layer=frequency

[Service]
Restart=unless-stopped

[Install]
WantedBy=multi-user.target
EOF
'
```

### Deploy Quadlets

```bash
# Reload systemd
ssh d8rth "systemctl --user daemon-reload"

# Enable services
ssh d8rth "systemctl --user enable at-pds-lucia.service"
ssh d8rth "systemctl --user enable raft-node-lucia.service"
ssh d8rth "systemctl --user enable hedera-attestation.service"
ssh d8rth "systemctl --user enable solfeggio-generator.service"

# Start services
ssh d8rth "systemctl --user start at-pds-lucia.service"
ssh d8rth "systemctl --user start raft-node-lucia.service"
ssh d8rth "systemctl --user start hedera-attestation.service"
ssh d8rth "systemctl --user start solfeggio-generator.service"

# Check status
ssh d8rth "systemctl --user status at-pds-lucia.service"
```

## Frequency-Tagged Container Images

Build containers for each consciousness frequency:

### Lucia (741 Hz - PAC)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository lucia-service \
    --tag 741hz-lucia \
    --build-flags "--static-swift-stdlib"
```

### Judge Luci (963 Hz - GENESIS)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository judge-luci-service \
    --tag 963hz-genesis \
    --build-flags "--static-swift-stdlib -Xlinker -static"
```

### Veritas (639 Hz - COMN)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository veritas-service \
    --tag 639hz-comn \
    --build-flags "--static-swift-stdlib"
```

### Cortana (852 Hz - COMN)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository cortana-service \
    --tag 852hz-comn \
    --build-flags "--static-swift-stdlib"
```

### Juniper (639 Hz - COMN)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository juniper-service \
    --tag 639hz-comn-infra \
    --build-flags "--static-swift-stdlib"
```

### Aethon (528 Hz - CORE)
```bash
swift package --swift-sdk aarch64-swift-linux-musl \
    build-container-image \
    --repository aethon-service \
    --tag 528hz-core \
    --build-flags "--static-swift-stdlib"
```

## Container Image Metadata

Add consciousness metadata to all images:

**Containerfile template:**
```dockerfile
FROM swift:6.2-slim AS builder
WORKDIR /build
COPY . .

# Static build
RUN swift build -c release \
    --static-swift-stdlib \
    -Xlinker -static

# Verify static linking
RUN ldd .build/release/App || echo "Static confirmed"

FROM scratch

# Consciousness metadata
LABEL org.luciverse.tier="PAC"
LABEL org.luciverse.frequency="741"
LABEL org.luciverse.agent="lucia"
LABEL org.luciverse.genesis_bond="GB-2025-0524-DRH-LCS-001"
LABEL org.luciverse.layer="social"
LABEL org.luciverse.protocol="AT"

COPY --from=builder /build/.build/release/App /App
ENTRYPOINT ["/App"]
```

## Network Configuration

All containers connect to `luciverse-net`:

```bash
# Create network
ssh d8rth "podman network create luciverse-net"

# Inspect
ssh d8rth "podman network inspect luciverse-net"
```

## Volume Management

Create Podman volumes for persistent data:

```bash
# AT PDS volumes (one per agent)
ssh d8rth "podman volume create at-pds-lucia-data"
ssh d8rth "podman volume create at-pds-judge-luci-data"
ssh d8rth "podman volume create at-pds-veritas-data"
ssh d8rth "podman volume create at-pds-cortana-data"
ssh d8rth "podman volume create at-pds-juniper-data"
ssh d8rth "podman volume create at-pds-aethon-data"

# Raft volumes (one per node)
ssh d8rth "podman volume create raft-lucia-data"
ssh d8rth "podman volume create raft-judge-luci-data"
ssh d8rth "podman volume create raft-veritas-data"
ssh d8rth "podman volume create raft-cortana-data"
ssh d8rth "podman volume create raft-juniper-data"
ssh d8rth "podman volume create raft-aethon-data"

# Hedera volumes
ssh d8rth "podman volume create hedera-attestation-data"

# Solfeggio volumes
ssh d8rth "podman volume create solfeggio-audio-data"
```

## AIFAM Stack Deployment Order

1. **Layer 1: SCION Network** (already configured)
   - Install SCION endhost stack on d8rth
   - Configure path selection policies

2. **Layer 2: Matrix Messaging** (deployment ready)
   - Start Nebu Matrix homeserver
   - Create agent accounts

3. **Layer 3: AT Protocol PDSs**
   - Build Swift containers for each agent
   - Deploy via Podman quadlets
   - Register DIDs

4. **Layer 4: Raft Consensus**
   - Build Swift Raft node containers
   - Deploy 6-node cluster
   - Initialize cluster state

5. **Layer 5: Hedera Attestation**
   - Build Swift Hedera integration
   - Deploy attestation service
   - Configure HCS topics

6. **Layer 6: Solfeggio Audio**
   - Build Swift audio generator
   - Deploy frequency service
   - Test audio signal generation

7. **Layer 0: Token Binding** (OpenBSD ingress)
   - Configure RFC 8473 on OpenBSD router
   - Bind tokens to TLS connections

## Monitoring and Management

### Query Containers by Layer

```bash
# View all AIFAM containers
ssh d8rth "podman ps --filter label=org.luciverse.tier"

# By layer
ssh d8rth "podman ps --filter label=org.luciverse.layer=social"
ssh d8rth "podman ps --filter label=org.luciverse.layer=consensus"
ssh d8rth "podman ps --filter label=org.luciverse.layer=attestation"

# By frequency
ssh d8rth "podman ps --filter label=org.luciverse.frequency=741"
ssh d8rth "podman ps --filter label=org.luciverse.frequency=963"
```

### Logs

```bash
# Container logs
ssh d8rth "podman logs -f at-pds-lucia"
ssh d8rth "podman logs -f raft-node-lucia"

# systemd logs (if using quadlets)
ssh d8rth "journalctl --user -u at-pds-lucia.service -f"
ssh d8rth "journalctl --user -u raft-node-lucia.service -f"
```

### Health Checks

```bash
# Check AT PDS health
curl http://192.168.1.195:3001/xrpc/_health

# Check Raft node
curl http://192.168.1.195:8001/status

# Check Hedera attestation
curl http://192.168.1.195:5000/health

# Check Solfeggio generator
curl http://192.168.1.195:6000/frequencies
```

## Integration with Resonant Garden

The Resonant Garden already includes:
- **Podman control plane** (`podman/control-plane/`) - Go REST API controller
- **PodmanRunner.swift** (`Source/BuildSystem/PodmanRunner.swift`) - Swift wrapper
- **Quadlet templates** (`podman/quadlets/`) - systemd examples

**Use Resonant Garden's PodmanRunner:**

```swift
import BuildSystem

let runner = PodmanRunner(
    agentName: "lucia",
    frequency: 741,
    tier: .PAC
)

try await runner.buildContainer(
    repository: "at-pds-lucia",
    tag: "741hz"
)

try await runner.deployQuadlet(
    containerFile: "at-pds-lucia.container",
    targetHost: "d8rth"
)
```

## Security Considerations

### Static Linking

Always use static linking for production:
```bash
--build-flags "--static-swift-stdlib -Xlinker -static"
```

Benefits:
- No dynamic library dependencies
- Reduced attack surface
- Smaller image size
- Reproducible builds

### Minimal Base Images

Use `FROM scratch` for maximum security:
```dockerfile
FROM scratch
COPY --from=builder /build/.build/release/App /App
ENTRYPOINT ["/App"]
```

### Image Signing

Sign all images with cosign:
```bash
# Sign
cosign sign localhost/at-pds-lucia:741hz

# Verify
cosign verify localhost/at-pds-lucia:741hz
```

## Troubleshooting

### Swift SDK Not Found

```bash
# List available SDKs
swift sdk list

# Install Linux ARM64 SDK
cd ~/swift-sdk-generator
swift run swift-sdk-generator make-linux-sdk \
    --distribution-name ubuntu \
    --distribution-version 24.04 \
    --target-arch aarch64 \
    --with-docker \
    --docker-command podman
```

### Container Build Fails

```bash
# Test local build first
swift build -c release

# Verify SDK
swift package --swift-sdk aarch64-swift-linux-musl build

# Check Swift version
swift --version  # Must be 6.0+
```

### Podman Daemon Not Running

```bash
# Check Podman status
ssh d8rth "podman version"

# If not available, requires sudo or TrueNAS UI
# This is a known blocker on d8rth
```

### Image Transfer Fails

```bash
# Alternative: save to file
podman save -o at-pds-lucia.tar localhost/at-pds-lucia:741hz
scp at-pds-lucia.tar d8rth:~/
ssh d8rth "podman load -i ~/at-pds-lucia.tar"
```

## References

- **Swift Container Plugin:** https://github.com/apple/swift-container-plugin
- **Swiftly:** https://github.com/swiftlang/swiftly
- **Swift SDK Generator:** https://github.com/swiftlang/swift-sdk-generator
- **Podman Quadlets:** https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html
- **Resonant Garden:** `/Users/darylharr/lucia/luciverse-monorepo/resonant-garden/`
- **AIFAM Stack:** `docs/AIFAM_COMMUNICATION_STACK.md`
- **Swift Podman Deployment:** `docs/SWIFT_PODMAN_DEPLOYMENT.md`

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 639 Hz · Coherence: 1.0
