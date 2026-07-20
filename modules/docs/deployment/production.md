# Production Deployment

Production keeps the same Podman + Caddy stack; the differences are **secrets
management**, **TLS/ingress**, and **profile configuration**.

## Profiles

| Profile | Template | Notes |
|---|---|---|
| local | `.env.example` | dev defaults, plaintext-ok secrets |
| staging | `.env.staging.example` | staging URLs, injected secrets |
| production | `.env.production.example` | prod URLs, secrets from a manager |

```sh
just init-env production   # → modules/orchestration/podman/.env
```

## Secrets (do NOT commit real secrets)

Use a Nix-compatible secrets manager rather than a plaintext `.env`:

- **sops-nix** — encrypt `secrets.yaml` with age/GPG; decrypt at activation.
- **agenix** — age-encrypted secrets as Nix store inputs.
- **1Password** — `lv://Lucia-AI-Secrets/...` injected at deploy time.

The required keys are `CODER_DB_PASSWORD`, `CODER_PSK`, and (for SSO)
`GOGS_OAUTH_CLIENT_ID` / `GOGS_OAUTH_CLIENT_SECRET`. The compose file uses
`${VAR:?}` so a missing secret aborts the deploy instead of using a default.

### Example: render .env from sops at deploy time

```sh
sops -d secrets/production.enc.env > modules/orchestration/podman/.env
just deploy   # podman-compose --env-file ... up -d
rm -f modules/orchestration/podman/.env   # if rendering ephemerally
```

## Ingress / TLS

Caddy is the ingress gateway (IPv6-native). For public TLS, set
`LUCIVERSE_ADMIN_EMAIL` and use real hostnames; Caddy provisions ACME certs.
Internal services (e.g. Veritas) use `tls internal`. Preserve the
`2602:F674::/40` IPv6 bindings.

## Bring-up

```sh
just deploy-local    # build + up + ps   (or: just deploy env-file=<path>)
```

## Hardening checklist

- [ ] Secrets from sops-nix/agenix/lv:// — never plaintext in git.
- [ ] Pin image tags (replace `:latest`) for reproducible rollouts.
- [ ] Harden the `curl|sh` Dockerfile installers (see security audit).
- [ ] Restrict the IPFS API (`5001`) to the internal network (already not
      host-exposed in compose).
- [ ] Back up Postgres (`coder-db`) and IPFS volumes.
- [ ] Confirm `flake.lock` is committed for reproducible builder images.
