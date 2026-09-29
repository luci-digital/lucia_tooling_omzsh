# infra/dns — Sovereign .ownid DNS Resolver

`luciverse_dns.lua` is an OpenResty (`lua-resty-dns`) module that is the
authoritative resolver for the `.ownid` TLD and forwards everything else to
Quad9 over IPv6.

---

## Design Principles

| Principle | Implementation |
|---|---|
| **IPv6 primary** | All `.ownid` names resolve to `AAAA` records. IPv4 is never returned for sovereign names. |
| **Iroh NodeId via TXT** | `TXT iroh=<NodeId>` is returned alongside `AAAA` once a node registers its NodeId at runtime. External peers dial by NodeId without needing the IPv6 address. → `modules/docs/specs/did-handles.md §5` |
| **SCION hint via TXT** | `TXT scion=ISD-AS,[IPv6]:port` lets SCION-capable clients use path-aware routing. → `docs/SCION_NETWORK_INTEGRATION.md` |
| **No hardcoded IPv4** | `9.9.9.9` / `149.112.112.112` appear only as Quad9 upstream fallbacks for non-`.ownid` forwarding — last in the nameserver array so IPv6 is tried first. Never returned as answers. |
| **No upstream leak for .ownid** | Unknown `.ownid` names return NXDOMAIN locally and are never forwarded. |
| **Runtime override** | Set `LUCIVERSE_AGENT_MAP_PATH` to a JSON file to replace the compile-time registry without restarting OpenResty. |

---

## Address Authority

All IPv6 addresses in `AGENT_MAP_DEFAULTS` are sourced from:

- **`docs/SCION_NETWORK_INTEGRATION.md`** — the single source of truth for all LuciVerse IPv6 and SCION addresses

Do not edit addresses here without updating `docs/SCION_NETWORK_INTEGRATION.md` first.

---

## Iroh NodeId Registration

NodeIds are **runtime values** generated at first boot — not baked in at build time.
Register a NodeId after a node starts:

```lua
local dns = require "luciverse_dns"
dns.set_iroh_node("lucia.orchestrator.ownid", node_id_string)
```

A node prints its own NodeId with:

```bash
iroh node id
```

Propagation to other peers happens through the `iroh-docs` CRDT address book
(ALPN `luciverse/docs/0`). → `modules/docs/specs/did-handles.md §4.2`

---

## `.ownid` Name Registry

| Name | Tier | Hz | IPv6 | Role |
|---|---|---|---|---|
| `lucia.orchestrator.ownid` | PAC | 741 | `2602:f674:1:741::1` | Lucia orchestrator |
| `coder.dev.ownid` | PAC | 741 | `2602:f674:1:741::2` | Coder CDE |
| `judge.arbitrator.ownid` | CROWN | 963 | `2602:f674:0:800::963` | Judge Luci governance |
| `caddy.ingress.ownid` | COMN | 639 | `2602:f674:1:639::1` | Caddy TLS ingress |
| `juniper.infra.ownid` | COMN | 639 | `2602:f674:100:9521::1` | Juniper network agent |
| `cortana.comn.ownid` | COMN | 852 | `2602:f674:100:9520::1` | Cortana insight agent |
| `mirrai.comn.ownid` | COMN | 639 | `2602:f674:100:9522::1` | Mirrai agent |
| `diaphragm.comn.ownid` | COMN | 639 | `2602:f674:100:9523::1` | Diaphragm agent |
| `scm.engine.ownid` | CORE | 528 | `2602:f674:1:528::1` | Gogs + Gitoxide SCM |
| `build.agent.ownid` | CORE | 528 | `2602:f674:1:528::2` | Build agent |
| `ipfs.kubo.ownid` | CORE | 528 | `2602:f674:1:528::10` | IPFS Kubo node |
| `homestar.ipvm.ownid` | CORE | 528 | `2602:f674:1:528::11` | Homestar IPVM |
| `veritas.truth.ownid` | CORE | 528 | `2602:f674:1:9431::1` | Veritas agent |
| `aethon.phil.ownid` | CORE | 528 | `2602:f674:1:9430::1` | Aethon agent |
| `sensai.core.ownid` | CORE | 528 | `2602:f674:1:9432::1` | Sensai agent |
| `niamod.core.ownid` | CORE | 528 | `2602:f674:1:9433::1` | Niamod RISC-V agent |
| `fdb.coord.ownid` | CORE | 528 | `2602:f674:1:528::100` | FDB coordinator (diagnostics) |
| `homestar.head.ownid` | PAC | 741 | `2602:f674:0:800::741` | Homestar head node |

---

## Upstream Forwarding (non-`.ownid`)

Quad9 — privacy-first, malware-blocking, DNSSEC-validating:

| Role | Address | Notes |
|---|---|---|
| IPv6 primary | `2620:fe::fe` | Tried first |
| IPv6 secondary | `2620:fe::9` | Tried second |
| IPv4 primary | `9.9.9.9` | Fishtank/LAN fallback only |
| IPv4 secondary | `149.112.112.112` | Fishtank/LAN fallback only |

OpenWrt setup guide: https://docs.quad9.net/Setup_Guides/Open-Source_Routers/OpenWrt_LuCi/

---

## Dependencies

| Dependency | Source | Notes |
|---|---|---|
| `lua-resty-dns` | OpenResty bundle | DNS client |
| `cjson.safe` | OpenResty bundle | JSON parsing for runtime map |

The previous `lua-toml` require has been removed — it was unused.

---

*LDS: 000.639 @ 639 Hz · COMN Tier · Genesis Bond: ACTIVE @ 741 Hz*
*Address authority: `docs/SCION_NETWORK_INTEGRATION.md`*
