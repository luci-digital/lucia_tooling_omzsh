# Running Aifam Mesh MCP on OpenBSD

Iris targets OpenBSD as a hardened, no-Docker base. This is the full install on a
current OpenBSD release using packages from
[openbsd/ports](https://github.com/openbsd/ports/tree/master).

## 1. Ports / packages required

The only hard dependency is Node. Everything else is an npm package built from
this repo.

| Need | Port (`openbsd/ports`) | Why |
|---|---|---|
| `node` + `npm` | [`lang/node`](https://github.com/openbsd/ports/tree/master/lang/node) | runtime + build |
| `git` | [`devel/git`](https://github.com/openbsd/ports/tree/master/devel/git) | clone this repo (build-time) |

```sh
doas pkg_add node git
```

> exo and the Home Assistant Matter Server run on their own hosts (typically a
> Mac/Apple-Silicon mesh for exo, and an HA instance for Matter). Iris only needs
> network reach to `EXO_BASE_URL` and `MATTER_WS_URL` — it does not need them
> installed locally.

If you build ports from source instead of `pkg_add`:

```sh
cd /usr/ports/lang/node && doas make install
cd /usr/ports/devel/git && doas make install
```

## 2. Create the service user and tree

```sh
doas useradd -d /var/aifam-mcp -s /sbin/nologin _aifam
doas mkdir -p /var/aifam-mcp
doas chown _aifam:_aifam /var/aifam-mcp
```

## 3. Build

```sh
doas -u _aifam git clone https://github.com/luci-digital/lucia_tooling_omzsh /tmp/luci
doas cp -R /tmp/luci/aifam-mcp/. /var/aifam-mcp/
doas chown -R _aifam:_aifam /var/aifam-mcp
doas -u _aifam sh -c 'cd /var/aifam-mcp && npm install && npm run build'
```

## 4. Configure

```sh
doas cp /var/aifam-mcp/.env.example /etc/aifam_mcp.env
doas vi /etc/aifam_mcp.env
```

`/etc/aifam_mcp.env` is sourced by the rc script. Minimum useful settings:

```sh
AIFAM_TRANSPORT=http
AIFAM_HTTP_HOST=0.0.0.0
AIFAM_HTTP_PORT=8788
EXO_BASE_URL=http://exo-head.lan:52415
MATTER_WS_URL=ws://homeassistant.lan:5580/ws
```

## 5. Install and enable the rc.d service

```sh
doas install -m 0555 /var/aifam-mcp/deploy/openbsd/rc.d/aifam_mcp /etc/rc.d/aifam_mcp
doas rcctl enable aifam_mcp
doas rcctl start aifam_mcp
rcctl check aifam_mcp
```

Logs go to `/var/log/daemon` via syslog (`daemon.info`). Tail with:

```sh
tail -f /var/log/daemon
```

## 6. Firewall (pf)

If you expose the HTTP transport, scope it. Example `/etc/pf.conf` snippet:

```pf
# Aifam Mesh MCP — allow only the trusted agent subnet
pass in on egress proto tcp from <agent_net> to (egress) port 8788
```

## Security posture

- Runs as the unprivileged, no-login `_aifam` user.
- No Docker, no root daemon, no shell for the service account.
- The mesh/Matter clients are **lazy and outbound-only** — Iris opens no listening
  socket beyond the configured MCP HTTP port (and none at all under stdio).
- OpenBSD's `pledge(2)`/`unveil(2)` are not yet applied from inside the Node
  process (Node has no first-class pledge binding); the equivalent containment is
  achieved here with a dedicated user + `pf` + nologin shell. A future native port
  skeleton can add a `wrapper` that pledges `"stdio inet rpath"` before exec.

## Updating

```sh
doas -u _aifam sh -c 'cd /var/aifam-mcp && git pull && npm install && npm run build'
doas rcctl restart aifam_mcp
```
