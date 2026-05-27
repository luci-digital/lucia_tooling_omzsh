# Security Audit Report

Scope: all git-tracked files **excluding** the vendored upstream Oh My Zsh tree
(`modules/legacy/original-layout/`), which is unmodified third-party code.
Date: 2026-05-27.

## Summary

| Pattern | Found | Severity | Status |
|---|---|---|---|
| Hardcoded default passwords/PSK | 2 | High | **Fixed** |
| `curl \| sh` / `curl \| bash` installers | 3 | Medium | Flagged + 1 pinned |
| `rm -rf` | 8 | Low | Reviewed — safe/scoped |
| `sudo` | 2 | Low | CI-only, repo-guarded |
| `chmod 777` | 0 | — | None |
| `eval` | 0 | — | None |
| `source <remote>` | 0 | — | None |
| Hardcoded tokens/API keys | 0 | — | None (all via env) |
| Unpinned GitHub Actions | 0 | — | Already SHA-pinned |

## Findings

### 1. Hardcoded default credentials — FIXED (High)

`modules/orchestration/podman/podman-compose.yml` shipped fallback defaults:

```yaml
POSTGRES_PASSWORD: ${CODER_DB_PASSWORD:-coder_sovereign_741}
CODER_PROVISIONER_DAEMON_PSK: "${CODER_PSK:-luciverse_741_psk}"
```

A deploy with no env set would silently boot with these public values.

**Fix:** switched to `${VAR:?...}` so the stack fails fast if the secret is
unset. Values now come from a gitignored `.env` (see `.env*.example`), and
production guidance points at sops-nix / agenix / `op://`.

### 2. `curl | sh` installers — FLAGGED (Medium)

| File | Line | Command |
|---|---|---|
| `modules/orchestration/coder/Dockerfile.workspace` | 27 | `curl … nodesource setup_22.x \| bash -` |
| `modules/orchestration/coder/Dockerfile.workspace` | 32 | `curl … code-server install.sh \| sh` |
| `modules/orchestration/podman/Dockerfile.builder` | 28 | `curl … xmake … \| bash -s v2.9.8` |

These run at **image build time** (not on hosts) and fetch over HTTPS. The xmake
installer is **version-pinned** (`v2.9.8`). nodesource and code-server use
upstream install scripts without checksum verification.

**Recommendation (next step, not yet applied to avoid breaking builds):** pin to
specific released artifacts + verify a SHA-256 checksum, or install from nixpkgs
in the builder image. Tracked in README "Next steps".

### 3. `rm -rf` — REVIEWED, safe (Low)

All occurrences are scoped and safe:
- `… rm -rf /var/lib/apt/lists/*` — standard image cleanup (4×).
- `Dockerfile.gogs:41` — removes a specific temp extract dir.
- `.devcontainer/devcontainer.json` — `rm -rf $HOME/.oh-my-zsh` before symlink
  (scoped to a known path in an ephemeral devcontainer).
- `.github/dependencies.yml` — upstream OMZ tooling, repo-guarded.

No unbounded/`$VAR`-rooted deletions found.

### 4. `sudo` — acceptable (Low)

`.github/workflows/{main,installer}.yml` use `sudo apt-get install zsh` on the CI
runner. Both jobs are guarded by `if: github.repository == 'ohmyzsh/ohmyzsh'` and
**do not run on this fork**. Standard, safe CI usage.

### 5. No tokens/keys hardcoded

`.github/workflows/dependencies/updater.py` reads `GH_TOKEN` from the environment
(`os.environ.get`). No literal secrets in tracked files. `id-token: write` in
`scorecard.yml` is a permissions grant, not a secret.

### 6. GitHub Actions pinning — COMPLIANT

All `uses:` are pinned to a full commit SHA with a version comment, e.g.
`actions/checkout@de0fac2…2 # v6.0.2`. No action required.

## Security docs reorganization

- `SECURITY.md` — kept at repo root (GitHub surfaces the security policy there).
- `INCIDENT_RESPONSE_PLAN.md` — moved from `.github/` to
  `modules/docs/security/`.
- `iso_compliance.lua` — under `modules/docs/security/`.

## Residual risk / manual attention

- Harden the three `curl|sh` Dockerfile installers (checksum/pinning).
- Replace `:latest` image tags with pinned digests for production.
- Adopt sops-nix/agenix so secrets never touch a plaintext `.env`.
