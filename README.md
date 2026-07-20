# luci-devops

The seed of a **LuciDigital self-hosted development, identity, and agent-compute
platform** — a sovereign substrate unifying shell, web, SCM, orchestration, and
infra under **Nix flakes** and **Podman** (no Docker). LDS 800.000 @ 741 Hz ·
Genesis Bond: ACTIVE.

This is **not** a generic web app. It is sovereign DevOps infrastructure: a
content-addressed VCS substrate, an IPv6-native service mesh, a DID identity
spec ("Dial by Being"), and an open compute protocol — with a frontend as one
module among many.

## What's in here

| Module | Purpose |
|---|---|
| `modules/shell/` | Nix-managed sovereign zsh environment (OMZ as an optional layer) |
| `modules/web/luci-frontend/` | TanStack Start + Vite + Tailwind frontend |
| `modules/scm/luci-vcs/` | Rust VCS substrate (gitoxide, DID handles, vanity miner) |
| `modules/scm/gogs/` | Gogs + Gitoxide SCM container image |
| `modules/orchestration/` | Podman compose stack + Caddy ingress + Coder + IPFS + Homestar + Ray |
| `modules/infra/` | Quad9 DNS, IPv6 schema, FoundationDB, Postgres, secrets |
| `modules/docs/` | specs, architecture, deployment, security, nix, orchestration |
| `modules/ci/` | GitHub Actions docs (canonical at `.github/`) + Nix checks |
| `modules/legacy/original-layout/` | Upstream Oh My Zsh, vendored verbatim |

Root keeps tooling-bound files where their tools expect them: `.github/`,
`.devcontainer/`, `.vscode/`, `flake.nix`, `justfile`, `.envrc`, governance docs,
`AGENTS.md`.

## Services (Podman stack)

Gogs+Gitoxide SCM · Lucia orchestrator · Caddy ingress (IPv6-native,
`2602:F674::/40`) · Coder CDE (+Postgres) · OpenDeepWiki · Ray · IPFS/Kubo ·
Homestar/IPVM. See [`modules/docs/orchestration/services.md`](modules/docs/orchestration/services.md).

## Enter the dev shell

```sh
nix develop              # full platform shell (rust + node + podman + caddy + zsh + …)
nix develop .#web        # frontend toolchain   → modules/web/luci-frontend
nix develop .#scm        # rust / luci-vcs      → modules/scm/luci-vcs
nix develop .#orchestration
nix develop .#shell      # Nix-managed zsh (run `zsh`)
```

With [direnv](https://direnv.net): `direnv allow` auto-loads the shell on `cd`.

## Run checks

```sh
nix flake check          # builds + tests luci-vcs
just check               # tests + lint + zsh + compose validation
just ci                  # broader gate (adds web build)
nix fmt                  # format Nix + shell + Rust
```

Individual gates are `nix run .#<app>`: `cargo-test`, `web-test`, `shellcheck`,
`shfmt`, `zsh-test`, `compose-config`. See
[`modules/docs/nix/flake-usage.md`](modules/docs/nix/flake-usage.md).

## Start the local stack

```sh
just init-env local      # scaffold modules/orchestration/podman/.env from template
# edit the .env, fill in CODER_DB_PASSWORD / CODER_PSK
just compose-up          # start (detached)
just compose-down        # stop
```

Full walkthrough: [`modules/docs/deployment/local.md`](modules/docs/deployment/local.md).

## Deploy

```sh
just init-env production # scaffold from production template
just deploy-local        # build images + start + status
```

Production guidance (secrets via sops-nix/agenix, profiles, ingress):
[`modules/docs/deployment/production.md`](modules/docs/deployment/production.md).

## Known limitations

- **Nix/Podman unvalidated here.** This work was authored in an environment with
  no `nix`/`podman`/`zsh`/`lua`. `flake.nix`, the compose path edits, and the zsh
  config are **not** yet run through `nix flake check` / `podman-compose` / `zsh`.
  Rust (`cargo test`, 16 pass) and the web build (`pnpm build`) **are** verified.
- **`flake.lock` not generated** — run `nix flake lock` on a Nix host first.
- **Pure Nix web build** uses Nix-provided node+pnpm via `nix run .#web-build`
  (impure). A fully sandboxed build needs a `pnpm.fetchDeps` hash (next step).
- **`curl|sh` installers** remain in three Dockerfiles (nodesource, code-server,
  xmake). Flagged in the [security audit](modules/docs/security/audit.md).
- **Optional tools** (`foundationdb`, `kubo`) load only if the nixpkgs attr
  resolves on the host.

## Next steps

1. Generate and commit `flake.lock`; run `nix flake check` on a Nix host.
2. Add a sandboxed `packages.luci-frontend` via `pnpm.fetchDeps`.
3. Adopt `sops-nix` or `agenix` for the required compose secrets.
4. Harden the `curl|sh` Dockerfile installers with checksum verification.
5. Wire `nix run .#zsh-test` and `compose-config` into CI (a fork-safe workflow).

## Docs

- Architecture: [`modules/docs/architecture/overview.md`](modules/docs/architecture/overview.md)
- Migration report: [`modules/docs/MIGRATION.md`](modules/docs/MIGRATION.md)
- Security audit: [`modules/docs/security/audit.md`](modules/docs/security/audit.md)
- Specs: [`modules/docs/specs/`](modules/docs/specs/) (DID handles, Open Compute)
