# Migration Report

Restructure of the mixed `ohmyzsh` fork into the LuciDigital DevOps platform.
Branch: `claude/nix-devops-restructure` (off `master`). Nothing was permanently
deleted — relocations only.

## What was moved

| From | To |
|---|---|
| `core/vcs/` | `modules/scm/luci-vcs/` |
| `src/`, `public/`, `package.json`, `vite.config.ts`, `tsconfig.json`, `.prettierrc`, `.cta.json` | `modules/web/luci-frontend/` |
| `node_modules/`, `dist/`, `.tanstack/` (gitignored) | `modules/web/luci-frontend/` (moved on disk) |
| `orchestration/lds_lineage/scm/Dockerfile.gogs`, `gitweb.conf` | `modules/scm/gogs/` |
| `orchestration/lds_lineage/scm/podman-compose.yml`, `Dockerfile.builder`, `README.md` | `modules/orchestration/podman/` |
| `orchestration/lds_lineage/scm/Caddyfile` | `modules/orchestration/caddy/` |
| `orchestration/lds_lineage/scm/coder-template/` | `modules/orchestration/coder/` |
| `orchestration/lds_lineage/networking/luciverse_dns.lua` | `modules/infra/dns/` |
| `.env.example` (root) | `modules/infra/secrets/env.example` |
| `docs/specs/`, `docs/FOUNDATIONS.md`, `docs/lua/iso_compliance.lua` | `modules/docs/{specs,architecture,security}/` |
| `.github/INCIDENT_RESPONSE_PLAN.md` | `modules/docs/security/` |

## What was preserved (unchanged, in place)

- `.github/` workflows (SHA-pinned), `dependabot.yml`, `CODEOWNERS`.
- `.devcontainer/` (+ `oasis-core`, `quad9-dns` features).
- `.vscode/`, `.editorconfig`, `LICENSE.txt`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md` (GitHub-magic location), `AGENTS.md`.
- All LuciDigital naming, IPv6 plan (`2602:F674::/40`), frequencies, LDS tiers,
  and the sovereign DevOps intent.

## What was archived (legacy/)

Upstream Oh My Zsh, vendored verbatim into `modules/legacy/original-layout/`:
`oh-my-zsh.sh`, `lib/`, `plugins/` (358), `themes/`, `tools/`, `templates/`,
`custom/`, `cache/`, `log/`, and the original OMZ `README.md`. Previously
force-tracked `custom/`, `cache/`, `log/` files were re-added under legacy so
nothing was lost.

## What was removed

- **Nothing permanently.** No files were deleted; all were relocated or archived.
- Hardcoded default credentials (`coder_sovereign_741`, `luciverse_741_psk`) were
  removed from compose and replaced with required env vars — the only intentional
  content removal, for security.

## What was added

- `flake.nix` (dev shells, `luci-vcs` package, checks, format/check/op apps),
  `.envrc` (direnv), `justfile`.
- `modules/orchestration/podman/.env.example` + staging/production templates.
- `modules/shell/zshrc/.zshrc` (Nix-managed) + `test/clean-shell-test.zsh`.
- Documentation under `modules/docs/` (this report, architecture, deployment,
  security audit, nix usage, orchestration services).
- Per-module README files.

## What still needs manual attention

1. **Generate `flake.lock`** (`nix flake lock`) and run `nix flake check` on a
   Nix host — none of the Nix/Podman/zsh work was validated in this environment.
2. **Sandboxed web build** — add `packages.luci-frontend` via `pnpm.fetchDeps`
   (current Nix web build is impure via `nix run .#web-build`).
3. **Secrets manager** — adopt sops-nix/agenix for compose secrets.
4. **Dockerfile installers** — harden `curl|sh` (nodesource, code-server) with
   checksum verification.
5. **Image pinning** — replace `:latest` tags with digests for production.
6. **CI** — add a fork-safe workflow that runs `nix flake check`, `zsh-test`,
   and `compose-config` (current OMZ CI is guarded off on the fork).
7. **Scaffold leftovers** — `public/logo192.png` / `logo512.png` are CRA-style
   defaults; replace with LuciDigital branding when design intent is decided
   (`luci_nuggets_portrait.png` is already in place).

## Verification status

- ✅ `cargo test` (luci-vcs) — 16 handle tests pass after the move.
- ✅ `pnpm build` (luci-frontend) — succeeds after move + rename.
- ⚠️ Nix, Podman, zsh, lua — not installed here; authored but unvalidated.
