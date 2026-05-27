# Nix Flake Usage

The root `flake.nix` is the single entry point for toolchains, builds, checks,
and runnable operations. Requires Nix with flakes enabled
(`experimental-features = nix-command flakes`).

> First run: generate the lockfile with `nix flake lock`.

## Dev shells

```sh
nix develop              # full platform: rust, node22, pnpm, podman, podman-compose,
                         # buildah, caddy, just, gnumake, xmake, lua5_4, luajit,
                         # postgresql, zsh (+ foundationdb/kubo if available)
nix develop .#web        # node22 + pnpm
nix develop .#scm        # rust toolchain + gitoxide + jj + build deps
nix develop .#orchestration  # podman + podman-compose + caddy
nix develop .#shell      # zsh with ZDOTDIR set to the sovereign .zshrc
```

`rustToolchain` (rust-overlay) bundles `rustc`, `cargo`, `rustfmt`, `clippy`.

## Packages

```sh
nix build .#luci-vcs     # the Rust VCS substrate (default package)
```

## Checks

```sh
nix flake check          # builds + tests luci-vcs (checks.luci-vcs-tests)
```

## Format

```sh
nix fmt                  # nixpkgs-fmt (*.nix) + shfmt -w (*.sh) + cargo fmt
```

## Apps (`nix run .#<app>`)

| App | Action |
|---|---|
| `dev` | frontend dev server (installs deps if needed) |
| `web` | frontend dev server |
| `web-install` / `web-build` / `web-test` | pnpm lifecycle (frozen lockfile) |
| `cargo-check` / `cargo-test` | luci-vcs |
| `shellcheck` / `shfmt` | lint/format-check our `*.sh` (legacy excluded) |
| `zsh-syntax` | `zsh -n` over OMZ + shell module |
| `zsh-test` | syntax + clean-shell config load test |
| `compose-config` | validate compose (uses `.env.example`) |
| `compose-up` / `compose-down` | start/stop the stack (up needs `.env`) |
| `deploy-local` | build images + start + status |
| `check` | tests + lint + zsh + compose validation |
| `ci` | `check` plus the web build |

## Notes on reproducibility

- Apps use `writeShellScriptBin` with `set -euo pipefail` and a PATH composed
  from declared `runtimeInputs` — no reliance on the host PATH.
- Optional tools (`foundationdb`, `kubo`) are filtered via `builtins.tryEval`
  so the shell still evaluates where they are unavailable.
- The luci-vcs build uses `cargoLock.lockFile` (the committed `Cargo.lock`) and
  default features only (xet/ipfs/ipvm pull unstable upstream deps — see the
  crate's `Cargo.toml`).
