# SCM Tools MCP Bundle

**gitoxide-based Rust VCS substrate (LDS 700.528, Veritas tier)**

## What This Bundle Provides

- **Rust-based VCS** — gitoxide (gix) version control system
- **Cargo Toolchain** — Build, test, lint, format
- **Git Operations** — Native git commands via gix
- **Crate Management** — Dependency resolution and vendoring
- **Performance Analysis** — Parallel compilation, incremental builds

## Available Tools

| Tool | Purpose | Command |
|------|---------|----------|
| `/cargo-check` | Syntax + type checking | `nix run .#cargo-check` |
| `/cargo-test` | Unit test suite | `nix run .#cargo-test` |
| `/cargo-fmt` | Format code | `nix run .#cargo-fmt` |
| `/cargo-clippy` | Lint analysis | `nix run .#cargo-clippy` |
| `/build-vcs` | Production binary | `nix build .#luci-vcs` |

## Quick Start

### Check Syntax
```bash
claude > /cargo-check
# Verifies all Rust code compiles
```

### Run Tests
```bash
claude > /cargo-test
# Full unit test suite
```

### Format Code
```bash
claude > /cargo-fmt
# Auto-format to Rust conventions
```

### Lint
```bash
claude > /cargo-clippy
# Find potential bugs and inefficiencies
```

### Build Binary
```bash
claude > /build-vcs
# Produces: result/bin/luci-vcs
```

## Repository Structure

```
modules/scm/luci-vcs/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── vcs/
│   │   ├── git.rs          # gitoxide integration
│   │   ├── commit.rs       # Commit operations
│   │   └── refs.rs         # Reference management
│   ├── substrate/
│   │   ├── identity.rs     # Agent identity
│   │   └── state.rs        # VCS state tracking
│   └── api/
│       ├── http.rs         # API server
│       └── rpc.rs          # RPC handlers
└── tests/
    ├── integration_tests.rs
    └── fixtures/
```

## Tier: Veritas (LDS 700.528)

- **Frequency**: 528 Hz (verification tier)
- **Role**: Source code truth, commit verification
- **Access**: Read-write to source tree
- **Coherence**: ≥ 0.7 (synchronized with PAC/CORE tiers)

## Git Operations via gitoxide

### Clone
```bash
luci-vcs clone <url> <dest>
```

### Commit with Verification
```bash
luci-vcs commit --message "[Tier] Feature" --verify
# Runs security scans + ISO compliance checks
```

### Push (pull forbidden by design)
```bash
luci-vcs push --ref main --remote origin
```

### Tag (cryptographically signed)
```bash
luci-vcs tag v1.0.0 --sign --tier=veritas
```

## Cargo Features

```toml
[features]
default = ["vcs", "http-api"]
vcs = ["gix"]          # Git operations
http-api = ["hyper"]   # HTTP server
xet = ["gix-xet"]      # External object support
ipfs = ["kubo"]        # IPFS integration
ipvm = ["ipvm"]        # IP-based VCS model
```

Enable features:
```bash
cargo build --features "vcs,http-api,xet"
```

## Testing

```bash
# Run all tests
cargo test

# Run specific test
cargo test --lib vcs::git

# Run with backtrace
RUST_BACKTRACE=1 cargo test

# Benchmark
cargo bench
```

## Nix Integration

Dev shell for Rust development:
```bash
nix develop .#scm
cd modules/scm/luci-vcs
```

Includes:
- rustc + cargo + rustfmt + clippy
- gitoxide (gix)
- jujutsu (alternative VCS for testing)
- pkg-config, openssl, zlib, zstd (native deps)

## Dependencies

Critical dependencies:
- **gix**: gitoxide core library
- **hyper**: HTTP server for API
- **tokio**: Async runtime
- **serde**: Serialization
- **tracing**: Observability

All pinned in Cargo.lock for reproducibility.

## Troubleshooting

### "Build fails with linker error"
```bash
claude > /cargo-check
# Verify pkg-config is in PATH
# Check openssl/zlib/zstd installed
```

### "Tests hang"
```bash
RUST_LOG=debug /cargo-test
# Trace where test is blocked
```

### "Clippy errors are warnings"
By default, clippy warnings don't fail builds. Use:
```bash
cargo clippy -- -D warnings
```

## Performance Tips

- Use `cargo check` instead of `build` for quick validation
- Enable incremental compilation: `CARGO_BUILD_INCREMENTAL=1`
- Use `sccache` for distributed builds: `RUSTC_WRAPPER=sccache`
- Run tests in parallel: `cargo test -- --test-threads=0`

## License

MIT License
