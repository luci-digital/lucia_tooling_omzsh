# Local Deployment

Run the full sovereign stack on a workstation with Podman.

## Prerequisites

- Nix (flakes enabled) — or Podman + podman-compose directly.
- Podman with IPv6 enabled (rootless works; `fusion-net` is `fd26:02f6:7400::/48`).
- No Docker required. Do not substitute Docker unless absolutely necessary.

## 1. Enter the dev shell

```sh
nix develop .#orchestration   # podman + podman-compose + caddy
```

## 2. Scaffold local secrets

```sh
just init-env local
```

This copies `modules/orchestration/podman/.env.example` →
`modules/orchestration/podman/.env` (gitignored). Edit it and set at minimum:

```sh
CODER_DB_PASSWORD=$(openssl rand -hex 32)
CODER_PSK=$(openssl rand -hex 32)
```

Never commit `.env`.

## 3. Validate

```sh
just compose-config       # nix run .#compose-config — validates with .env.example
```

## 4. Start / stop

```sh
just compose-up           # detached
just compose-down
```

Or build images and start with status output:

```sh
just deploy-local
```

## 5. Reach the services

Add hostnames to `/etc/hosts` (or use the IPv6 tier addresses directly):

```
gogs.lucidigital.io coder.lucidigital.io gitweb.lucidigital.io
homestar.lucidigital.io ipfs.lucidigital.io lucia.lucidigital.io
```

Caddy serves them over the `fusion-net` bridge. Service list + ports:
[`../orchestration/services.md`](../orchestration/services.md).

## Troubleshooting

- **`CODER_DB_PASSWORD must be set`** — you skipped step 2; create `.env`.
- **IPv6 errors** — ensure `enable_ipv6: true` is honored by your Podman netavark
  config and the host has IPv6.
- **FoundationDB** — the `state-manager` service is disabled; the stack expects
  FoundationDB on the host (`host.containers.internal`).
