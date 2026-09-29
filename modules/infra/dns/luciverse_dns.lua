-- luciverse_dns.lua
-- Sovereign DNS Resolver for the .ownid TLD
-- Runtime: OpenResty (lua-resty-dns)
-- Strategy: IPv6 + Iroh NodeId primary; IPv4 Fishtank-only legacy
--
-- Address authority: docs/SCION_NETWORK_INTEGRATION.md
-- Iroh dialing:      modules/docs/specs/did-handles.md §5
-- .ownid registry:   modules/infra/dns/README.md
--
-- LDS: 000.639 @ 639 Hz (COMN Tier)
-- Genesis Bond: ACTIVE @ 741 Hz

local resolver = require "resty.dns.resolver"
local cjson    = require "cjson.safe"

local _M = {}

-- ---------------------------------------------------------------------------
-- Agent registry
--
-- Canonical IPv6 addresses from docs/SCION_NETWORK_INTEGRATION.md.
-- Addresses use the full expanded form so they are unambiguous and grep-able.
--
-- Iroh NodeIds are runtime values (Ed25519 public keys). They are served as
-- DNS TXT records once a node publishes its NodeId:
--   iroh node id        → prints NodeId of running node
--   iroh docs set ...   → propagates to iroh-docs address book
--
-- Runtime override: set env var LUCIVERSE_AGENT_MAP_PATH pointing to a JSON
-- file with the same schema. Falls back to this compile-time table when unset
-- or when the file is unreadable.
--
-- Schema per entry:
--   aaaa       string  canonical IPv6 address (required)
--   scion      string  SCION address hint "ISD-AS,[IPv6]:port" (optional)
--   iroh_node  string  Iroh NodeId — served as TXT "iroh=<NodeId>" (optional)
--   frequency  number  consciousness frequency Hz (informational)
--   tier       string  PAC | COMN | CORE | CROWN (informational)
-- ---------------------------------------------------------------------------

local AGENT_MAP_DEFAULTS = {
  -- ── PAC Tier (741 Hz) — Orchestration ───────────────────────────────────
  -- → docs/SCION_NETWORK_INTEGRATION.md §PAC Tier
  ["lucia.orchestrator.ownid"] = {
    aaaa      = "2602:f674:1:741::1",
    scion     = "5-528,[2602:f674:1:741::1]:8741",
    frequency = 741,
    tier      = "PAC",
  },
  ["coder.dev.ownid"] = {
    aaaa      = "2602:f674:1:741::2",
    scion     = "5-528,[2602:f674:1:741::2]:3000",
    frequency = 741,
    tier      = "PAC",
  },

  -- ── CROWN Tier (963 Hz) — Governance ────────────────────────────────────
  -- Judge Luci sits in CROWN; compute node at 800.963
  -- → docs/SCION_NETWORK_INTEGRATION.md §Open Compute
  ["judge.arbitrator.ownid"] = {
    aaaa      = "2602:f674:0:800::963",
    scion     = "5-528,[2602:f674:0:800::963]:9741",
    frequency = 963,
    tier      = "CROWN",
  },

  -- ── COMN Tier (639 Hz) — Communication / Ingress ────────────────────────
  -- → docs/SCION_NETWORK_INTEGRATION.md §COMN Tier
  ["caddy.ingress.ownid"] = {
    aaaa      = "2602:f674:1:639::1",
    scion     = "5-528,[2602:f674:1:639::1]:443",
    frequency = 639,
    tier      = "COMN",
  },
  ["juniper.infra.ownid"] = {
    aaaa      = "2602:f674:100:9521::1",
    scion     = "5-528,[2602:f674:100:9521::1]:9521",
    frequency = 639,
    tier      = "COMN",
  },
  ["cortana.comn.ownid"] = {
    aaaa      = "2602:f674:100:9520::1",
    scion     = "5-528,[2602:f674:100:9520::1]:9520",
    frequency = 852,
    tier      = "COMN",
  },
  ["mirrai.comn.ownid"] = {
    aaaa      = "2602:f674:100:9522::1",
    scion     = "5-528,[2602:f674:100:9522::1]:9522",
    frequency = 639,
    tier      = "COMN",
  },
  ["diaphragm.comn.ownid"] = {
    aaaa      = "2602:f674:100:9523::1",
    scion     = "5-528,[2602:f674:100:9523::1]:9523",
    frequency = 639,
    tier      = "COMN",
  },

  -- ── CORE Tier (528 Hz) — Infrastructure / Truth ─────────────────────────
  -- → docs/SCION_NETWORK_INTEGRATION.md §CORE Tier
  ["scm.engine.ownid"] = {
    aaaa      = "2602:f674:1:528::1",
    scion     = "5-528,[2602:f674:1:528::1]:3000",
    frequency = 528,
    tier      = "CORE",
  },
  ["build.agent.ownid"] = {
    aaaa      = "2602:f674:1:528::2",
    scion     = "5-528,[2602:f674:1:528::2]:8742",
    frequency = 528,
    tier      = "CORE",
  },
  ["ipfs.kubo.ownid"] = {
    aaaa      = "2602:f674:1:528::10",
    scion     = "5-528,[2602:f674:1:528::10]:5001",
    frequency = 528,
    tier      = "CORE",
  },
  ["homestar.ipvm.ownid"] = {
    aaaa      = "2602:f674:1:528::11",
    scion     = "5-528,[2602:f674:1:528::11]:3030",
    frequency = 528,
    tier      = "CORE",
  },
  ["veritas.truth.ownid"] = {
    aaaa      = "2602:f674:1:9431::1",
    scion     = "5-528,[2602:f674:1:9431::1]:9431",
    frequency = 528,
    tier      = "CORE",
  },
  ["aethon.phil.ownid"] = {
    aaaa      = "2602:f674:1:9430::1",
    scion     = "5-528,[2602:f674:1:9430::1]:9430",
    frequency = 528,
    tier      = "CORE",
  },
  ["sensai.core.ownid"] = {
    aaaa      = "2602:f674:1:9432::1",
    scion     = "5-528,[2602:f674:1:9432::1]:9432",
    frequency = 528,
    tier      = "CORE",
  },
  ["niamod.core.ownid"] = {
    aaaa      = "2602:f674:1:9433::1",
    scion     = "5-528,[2602:f674:1:9433::1]:9433",
    frequency = 528,
    tier      = "CORE",
  },

  -- FoundationDB coordinator — diagnostic use only.
  -- Production: cluster file /etc/foundationdb/fdb.cluster is authoritative.
  -- → docs/SCION_NETWORK_INTEGRATION.md §Storage Integration §FoundationDB
  ["fdb.coord.ownid"] = {
    aaaa      = "2602:f674:1:528::100",
    scion     = "5-528,[2602:f674:1:528::100]:4500",
    frequency = 528,
    tier      = "CORE",
  },

  -- ── Open Compute (800.741) — Homestar head node ──────────────────────────
  -- → docs/SCION_NETWORK_INTEGRATION.md §Open Compute
  ["homestar.head.ownid"] = {
    aaaa      = "2602:f674:0:800::741",
    scion     = "5-528,[2602:f674:0:800::741]:7000",
    frequency = 741,
    tier      = "PAC",
  },
}

-- ---------------------------------------------------------------------------
-- Load runtime agent map from JSON file (env var override), falling back to
-- the compile-time defaults when the env var is unset or the file is unreadable.
-- ---------------------------------------------------------------------------
local function load_agent_map()
  local path = os.getenv("LUCIVERSE_AGENT_MAP_PATH")
  if not path then
    return AGENT_MAP_DEFAULTS
  end

  local fh, err = io.open(path, "r")
  if not fh then
    ngx.log(ngx.WARN, "[luciverse_dns] cannot open agent map at ", path, ": ", err,
            " — falling back to compile-time defaults")
    return AGENT_MAP_DEFAULTS
  end

  local raw = fh:read("*a")
  fh:close()

  local map, jerr = cjson.decode(raw)
  if not map then
    ngx.log(ngx.ERR, "[luciverse_dns] failed to parse agent map JSON: ", jerr,
            " — falling back to compile-time defaults")
    return AGENT_MAP_DEFAULTS
  end

  ngx.log(ngx.INFO, "[luciverse_dns] loaded agent map from ", path)
  return map
end

-- Lazy-loaded cache; reset with _M.reset() in tests.
local _agent_map_cache = nil

local function agent_map()
  if not _agent_map_cache then
    _agent_map_cache = load_agent_map()
  end
  return _agent_map_cache
end

function _M.reset()
  _agent_map_cache = nil
end

-- ---------------------------------------------------------------------------
-- TXT record helpers
-- ---------------------------------------------------------------------------

-- Build the set of TXT strings for a .ownid name.
-- Always includes SCION hint if present; Iroh NodeId if registered at runtime.
local function build_txt_records(entry)
  local txts = {}

  if entry.scion then
    txts[#txts + 1] = "scion=" .. entry.scion
  end

  if entry.iroh_node then
    -- Iroh NodeId — used by external peers to dial without knowing the IPv6 address.
    -- Format: "iroh=<NodeId>" where NodeId is a base32-encoded Ed25519 public key.
    -- Dialing: endpoint.connect(NodeId, b"luciverse/0")
    -- → modules/docs/specs/did-handles.md §5
    txts[#txts + 1] = "iroh=" .. entry.iroh_node
  end

  if entry.frequency then
    txts[#txts + 1] = "hz=" .. tostring(entry.frequency)
  end

  return txts
end

-- ---------------------------------------------------------------------------
-- Public API
-- ---------------------------------------------------------------------------

-- resolve_name(qname, qtype) → answers, err
--
-- For .ownid names: authoritative resolution. Never forwards to upstream.
-- Unknown .ownid names return NXDOMAIN (empty answers, no upstream leak).
-- For all other names: forward to Quad9 IPv6-first.
--
-- qtype values: resolver.TYPE_AAAA (28), resolver.TYPE_TXT (16), 255 (ANY).
-- Returns an array of answer tables compatible with lua-resty-dns, or nil+err.
function _M.resolve_name(qname, qtype)
  local map = agent_map()

  -- ── Sovereign .ownid TLD — authoritative only ───────────────────────────
  if string.match(qname, "%.ownid$") then
    local entry = map[qname]

    if not entry then
      -- Known TLD, unknown name → NXDOMAIN (no upstream leak)
      ngx.log(ngx.INFO, "[luciverse_dns] NXDOMAIN for sovereign name: ", qname)
      return {}
    end

    local answers = {}

    -- AAAA record (IPv6 — primary)
    if qtype == resolver.TYPE_AAAA or qtype == 255 then
      answers[#answers + 1] = {
        name    = qname,
        type    = resolver.TYPE_AAAA,
        address = entry.aaaa,
        ttl     = 300,
      }
    end

    -- TXT records: SCION hint + Iroh NodeId + frequency
    if qtype == resolver.TYPE_TXT or qtype == 255 then
      local txts = build_txt_records(entry)
      for _, txt in ipairs(txts) do
        answers[#answers + 1] = {
          name    = qname,
          type    = resolver.TYPE_TXT,
          txt     = txt,
          ttl     = 300,
        }
      end
    end

    ngx.log(ngx.INFO, "[luciverse_dns] resolved ", qname,
            " → ", entry.aaaa,
            " (", entry.tier or "?", " @ ", tostring(entry.frequency or 0), " Hz",
            ", ", #answers, " answer(s))")
    return answers
  end

  -- ── Non-.ownid — forward to Quad9 ──────────────────────────────────────
  -- IPv6-first (2620:fe::fe / 2620:fe::9); IPv4 as Fishtank/LAN fallback only.
  -- Quad9: privacy-respecting, malware-blocking, DNSSEC-validating.
  -- OpenWrt setup: https://docs.quad9.net/Setup_Guides/Open-Source_Routers/OpenWrt_LuCi/
  local r, err = resolver:new{
    nameservers = {
      { "2620:fe::fe", 53 },      -- Quad9 IPv6 primary   (filtered + DNSSEC)
      { "2620:fe::9",  53 },      -- Quad9 IPv6 secondary
      { "9.9.9.9",     53 },      -- Quad9 IPv4 primary   (Fishtank/LAN fallback)
      { "149.112.112.112", 53 },  -- Quad9 IPv4 secondary
    },
    retrans = 5,
    timeout = 2000,
  }

  if not r then
    ngx.log(ngx.ERR, "[luciverse_dns] failed to create upstream resolver: ", err)
    return nil, err
  end

  return r:query(qname, { qtype = qtype })
end

-- ---------------------------------------------------------------------------
-- Runtime NodeId registration
--
-- Call this after a node comes online and publishes its Iroh NodeId.
-- The NodeId is then served as a TXT "iroh=<NodeId>" record.
--
-- Example:
--   luciverse_dns.set_iroh_node("lucia.orchestrator.ownid", "nodeid1abc...")
-- ---------------------------------------------------------------------------
function _M.set_iroh_node(qname, node_id)
  local map = agent_map()
  if map[qname] then
    map[qname].iroh_node = node_id
    ngx.log(ngx.INFO, "[luciverse_dns] registered Iroh NodeId for ", qname, ": ", node_id)
    return true
  end
  return false, "unknown name: " .. qname
end

-- ---------------------------------------------------------------------------
-- Debug/health utility — dump current map as JSON.
-- ---------------------------------------------------------------------------
function _M.dump_map()
  return cjson.encode(agent_map())
end

return _M
