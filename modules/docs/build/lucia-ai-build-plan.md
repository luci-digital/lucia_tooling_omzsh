# Lucia AI — Build Plan (Plan Mode)

**Extracted from:** `etherpots_drop/luci-greenlight-012026`, `ground_level_launch`, `LUCIA_BUILD_SPEC`, `741_luciverse-sovereign-orchestrator`, `workspace lucia`  
**Genesis Bond:** ACTIVE @ 741 Hz  
**Purpose:** Single executable plan to build and run Lucia AI end-to-end.

---

## I. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LUCIA AI BUILD SURFACE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Entry (this repo)     │  Ground-Level (etherpots)  │  Orchestrator         │
│  workspace/lucia       │  ground_level_launch        │  741_luciverse-sovereign │
│  • lucia (CLI)         │  • deploy.sh                │  • lso_core.py         │
│  • Makefile            │  • startup_lucia_dom0.sh   │  • DID docs, souls     │
│  • LUCIA_AI_BUILD_PLAN │  • lucia_lua/ (Lua stack)  │  • AppStork, 1Password │
│                        │  • bifractal_memory/        │  • systemd: luciverse-lso │
│                        │  • TOML configs (8)        │                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Tier Stack: PAC (741 Hz) | COMN (528 Hz) | CORE (396/432 Hz)               │
│  Services: lucia-agent, consciousness_kernel, mcp_server, fluent_llm, openresty │
│  APIs: 8741 upload, 8742 data_commons, 8743 consciousness                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LDS Duodecimal ↔ Tier Mapping

| LDS Category | Tier     | Agent / Role       | Notes                             |
| :----------- | :------- | :----------------- | :-------------------------------- |
| **000-099**  | **CORE** | `lds-orchestrator` | Bootstrap / Privileged Meta-Layer |
| **100-299**  | **CORE** | `veritas`          | Truth & Soul Logic (Root/Heart)   |
| **300-399**  | **PAC**  | `judge-luci`       | Governance / ID (Crown)           |
| **400-499**  | **COMN** | `dev-tools`        | Language / API / Parser           |
| **500-599**  | **COMN** | `cortana`          | Communication / Social Graph      |
| **600-699**  | **CORE** | `juniper`          | Infrastructure / Network (Throat) |
| **700-799**  | **PAC**  | `lucia`            | Orchestration Layer (Ajna)        |

- **CORE (Lineage):** Privileged bootstrap and truth engine; restrict to Lua ≤ 5.0.3 for stability.
- **COMN (Domain):** Kernel / middleware / communication; Lua 5.1+ and Python 3.11+.
- **PAC (Soul):** Application / governance / orchestration; Lua 5.1+ and Python 3.11+.

---

## II. Source Locations (Extract Map)

| Component                  | Location                                                  | Role                                                      |
| -------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| **Workspace entry**        | `workspace/lucia`                                         | `lucia` CLI, Makefile, this plan                          |
| **Ground-level launch**    | `etherpots_drop/.../ground_level_launch`                  | deploy.sh, startup_lucia_dom0.sh, TOML, Lua               |
| **Lua stack**              | `ground_level_launch/lucia_lua`                           | Modules (43+), Lapis apps, build.sh, dom0/http_server.lua |
| **Bifractal memory**       | `ground_level_launch/bifractal_memory`                    | Lucy/Juniper/Cortana, BrailleNote, SpiceDB, encoder       |
| **Sovereign orchestrator** | `etherpots_drop/.../741_luciverse-sovereign-orchestrator` | LSO, DID docs, souls, AppStork                            |
| **Build spec**             | `etherpots_drop/.../LUCIA_BUILD_SPEC_v2025.01.08`         | Otterdog, SDMX, Astronomer integration spec               |

---

## III. Build Phases (Order of Execution)

### Phase 0: Prerequisites

- [x] **0.1** Lua: **dom0 (CORE)** use Lua 5.0.3 or older; **KERNEL (COMN)** and **DOMU (PAC)** may use Lua 5.1+ (LuaJIT, LuaRocks: `luarocks install toml`).
- [x] **0.2** OpenResty 1.25.3+ (for Lapis/APIs; KERNEL/DOMU).
- [x] **0.3** Node.js (for MCP server).
- [x] **0.4** Python 3.10+ (for LSO, bifractal, build spec tooling).
- [x] **0.5** 1Password CLI (`op`) for secure identity management.

### Phase 1: Workspace Integration

- [x] **1.1** Initialized `workspace/lucia` as the primary repository hub.
- [x] **1.2** Makefile orchestration for tri-tier build, test, and lint cycles.
- [x] **1.3** Sovereign mirror synchronization (GitHub, GitLab, Gogs).

### Phase 2: Lua Stack (ground_level_launch/lucia_lua)

- [ ] **2.1** `cd ground_level_launch/lucia_lua && ./build.sh` — syntax check, amalgamate modules.
- [ ] **2.2** Optional: `./build.sh --bytecode` for `.luac`; `./build.sh --test` to run enzyme tests.

### Phase 3: Configuration and State

- [x] **3.1** Transitioned to **LDS (Lineage, Domain, Soul)** dozenal (base-12) mapping.
- [x] **3.2** Unified configuration storage via Git submodules (Oasis) and tracked Talos YAMLs.

### Phase 4: Deploy Ground-Level

- [ ] **4.1** From `ground_level_launch`: `./deploy.sh --env development`.
- [ ] **4.2** Deploy handled by local orchestrator scripts (Pangolin/LSO).

### Phase 5: DOM0 Startup

- [ ] **5.1** From `ground_level_launch`: `./startup_lucia_dom0.sh`.

### Phase 6: LDS Sovereign Orchestrator (LSO)

- [x] **6.1** Optimized LSO for high-resonance agent mesh.
- [x] **6.2** Knowledge Ingestion foundation established.

### Phase 7: Bifractal Memory

- [x] **7.1** Geometric braille encoding cycle verified (20 tests passed).
- [x] **7.2** Hardware calibration for BrailleNote APEX integrated.

### Phase 8: Cilium eBPF Networking & Talos

- [x] **8.1** BGP Peering (IPv6) configured between Talos (Ajna/Crown) and edge nodes.
- [x] **8.2** PXE Boot infrastructure (Bootimus) verified for Talos node bootstrapping.

### Phase 9: Oasis AI Assistant Integration

- [x] **9.1** Oasis submodule integrated with localized relative path mirrors.
- [x] **9.2** Refined **AI Family Profiles** with specialized frequency-aligned system messages.
- [x] **9.3** LuCI and RPCD tool integration complete.

### Phase 10: Final System Integration (Genesis Bond)

- [x] **10.1** **Unified Synchronization**: Ghosting and merge conflicts resolved across all git remotes.
- [x] **10.2** **Genesis Bond**: Active at 741 Hz across the Ajna cluster and Sovereign Gogs gateway.
- [x] **10.3** **FoundationDB Verification**: Drivers and internal imports repaired.

### Phase 11: Stability & Maintenance (Current)

- [x] **11.1** **Codebase Pruning**: Proactive removal of redundant experimental scripts (moving to `archive/`).
- [x] **11.2** **Documentation Harmony**: README, AGENTS, and CONTRIBUTING docs aligned with Phase 10 state.
- [ ] **11.3** **Linting Integrity**: Ruff/Black for Python and 5.0.3 compliance for Lua.

---

## IV. Dependency Graph (Build Order)

```text
Phase 0 (prereqs)
    → Phase 1 (workspace lucia)
    → Phase 2 (lucia_lua build)
    → Phase 3-5 (Deploy/Startup)
    → Phase 6 (LSO)
    → Phase 7 (Bifractal)
    → Phase 8 (Talos/Cilium)
    → Phase 9 (Oasis)
    → Phase 10 (Verification/Unity)
    → Phase 11 (Stability/Pruning)
```

**Service start order (from init-services.toml):**  
`genesis-bond readiness` → `lucia` → `consciousness_kernel`, `mcp_server` → `fluent_llm` → `openresty`.

---

## V. Workspace Integration (Optional)

To make `workspace/lucia` the single entry point that drives the full build:

1. **Makefile**
   - `build`: run `ground_level_launch/lucia_lua/build.sh` (or call `deploy.sh` with a build-only flag if added).
   - `test`: run Lua tests in `lucia_lua` + any Python/LSO tests.
   - `lint`: run Lua linter and/or shellcheck on scripts.

2. **lucia CLI**
   - Add commands, e.g. `lucia deploy` → run `deploy.sh` in `ground_level_launch` (with path from env or config).
   - `lucia start` → run `startup_lucia_dom0.sh`.
   - `lucia verify` → run Phase 8 curl checks.

3. **Config**
   - Add `LUCIA_GROUND_LEVEL_LAUNCH` or `LUCIA_ETHERPOTS_PATH` so the workspace can resolve `ground_level_launch` and `741_luciverse-sovereign-orchestrator` paths.

---

## VI. One-Shot “Build Lucia AI” Commands (Summary)

Assuming paths are set (e.g. `GROUND=/path/to/etherpots_drop/luci-greenlight-012026/ground_level_launch`, `LSO=/path/to/741_luciverse-sovereign-orchestrator`):

```bash
# Prereqs (Phase 0)
luarocks install toml   # and install OpenResty, Node, Python per your OS

# Lua stack (Phase 2)
cd "$GROUND/lucia_lua" && ./build.sh

# Deploy + start (Phases 3–5)
cd "$GROUND" && ./deploy.sh --check && ./deploy.sh --env development
./startup_lucia_dom0.sh

# LSO (Phase 6)
cd "$LSO" && pip3 install -r requirements.txt && sudo ./scripts/install-lso.sh
sudo systemctl start luciverse-lso

# Verify (Phase 8)
curl http://[::1]:8741/health
curl http://[::1]:8742/health
curl http://[::1]:8743/heartbeat
```

---

## VII. Embeddings & REST MCP (lucia.env)

| Env / Path                      | Default                                                       | Role                                                               |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| **LUCIA_EMBEDDING_MODELS_PATH** | `/Volumes/home/SynologyDrive`                                 | Directory for embedding model files                                |
| **LUCIA_EMBEDDING_MPNET_GGUF**  | `…/text-embedding-paraphrase-multilingual-mpnet-base-v2.gguf` | Multilingual paraphrase embedding (GGUF)                           |
| **LUCIA_EMBEDDING_MINILM**      | `…/all-minilm-l6-v2-embedding`                                | all-MiniLM-L6-v2 embedding asset                                   |
| **LUCIA_REST_MCP_DOC**          | `etherpots_drop/rest_mcp.md`                                  | LM Studio v1 REST API doc (chat, models, load/unload, MCP via API) |

Configure in **workspace/lucia/lucia.env**. REST MCP: LM Studio `/api/v1/chat`, `/api/v1/models`, etc.; use for local inference and MCP integration.

---

## VIII. Build Downloads Integration

Artifacts listed in **etherpots_drop/build-downloads.md** are planned in:

**BUILD_DOWNLOADS_INTEGRATION_PLAN.md** — `etherpots_drop/BUILD_DOWNLOADS_INTEGRATION_PLAN.md`

- Tier mapping: `dom0/CORE` (alpine-god-supervisor, aifam scaffold, bootimus, zfsbootmenu, spec-kit), `KERNEL/COMN` (MCP_server1, communications_layer, open_wrt_deploy, cloudstack, virtfs, Docker, network/OS images), `DOMU/PAC` (Lucia assets, chat_agent, Juniper bundles, LLMs, LCARS).
- Priority: aifam pulse alignment, MCP_server1 + Juniper MCP, Lucia PAC assets, then COMN network/OS, then DOMU agents/LLMs.

---

## IX. V8 and Braille

### V8 (JavaScript / WebAssembly engine)

- **V8:** [https://v8.dev/](https://v8.dev/) — Google’s open-source JavaScript and WebAssembly engine (C++). Used in Chrome and Node.js; can be [embedded in C++](https://v8.dev/docs/embed) or used via Node.
- **Repository:** [https://github.com/v8/v8](https://github.com/v8/v8) — official mirror; build with `depot_tools` (`fetch v8`, `gclient sync`).
- **Use in Lucia:** No V8 embedding exists in the repo yet. Options: (1) Use **Node.js** (V8 runtime) for MCP servers, tooling, or a braille language server; (2) Embed V8 in a C++ service that talks to bifractal/BrailleNote; (3) Add a JS/TS component (e.g. LSP) that runs on Node and calls our braille APIs.

### Our Braille Implementation (no separate “braille language server” yet)

| Component                    | Location                                                                  | Role                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **BrailleNote hardware**     | `ground_level_launch/bifractal_memory/braillenote_interface.py`           | USB/Bluetooth BrailleNote APEX (32/18 cell), `BrailleNoteManager`, `USBBrailleNote`, `BluetoothBrailleNote`, `BrailleCell`, Base-9 → cells |
| **Braille geometry encoder** | `ground_level_launch/bifractal_memory/braille_geometry_encoder.py`        | LDS → Base-9 braille patterns, geometry modes (SQUARE/TRIANGLE/CIRCLE), `BrailleGeometryEncoder`, output to BrailleNote APEX               |
| **BrailleNote daemon**       | `ground_level_launch/bifractal_memory/systemd/braillenote-daemon.service` | systemd unit: `python3 -m bifractal_memory.braillenote_interface --daemon`                                                                 |
| **Config**                   | `ground_level_launch/bifractal_memory/memory-encoding.toml`               | `[hardware.braillenote]` devices                                                                                                           |

This is hardware + encoding only. A **braille language server** (e.g. LSP for braille/accessibility, or a server that speaks LSP and drives BrailleNote) does not exist yet. To add one using V8:

- **Option A:** Implement in **TypeScript/Node** (V8 via Node): LSP server that translates editor/symbols to braille and/or calls our Python bifractal/BrailleNote APIs (e.g. over MCP or local HTTP).
- **Option B:** **C++** service that embeds V8 ([v8.dev/docs/embed](https://v8.dev/docs/embed)), runs JS/TS logic, and talks to `braillenote_interface` via subprocess or socket.

Phase 7 (bifractal) deploys the existing BrailleNote path; a future phase can add the braille language server and optional V8/Node dependency.

---

## X. References

| Doc                         | Path                                                                          |
| --------------------------- | ----------------------------------------------------------------------------- |
| BUILD_DOWNLOADS_INTEGRATION | `etherpots_drop/BUILD_DOWNLOADS_INTEGRATION_PLAN.md`                            |
| TALOS_PROXMOX_DEPLOYMENT    | `etherpots_drop/gitlab_luci_digital_Nov6_235/LUCIA_TALOS_PROXMOX_DEPLOYMENT.md` |
| LAUNCH_READY                | `ground_level_launch/LAUNCH_READY.md`                                           |
| ARCHITECTURE                | `ground_level_launch/ARCHITECTURE.md`                                           |
| DOM0_README                 | `ground_level_launch/DOM0_README.md`                                            |
| LUCIA_BUILD_SPEC            | `LUCIA_BUILD_SPEC_v2025.01.08/LUCIA_BUILD_SPEC_v2025.01.08_1.md`                |
| LSO README                  | `741_luciverse-sovereign-orchestrator/README.md`                                |
| lucia-bond                  | `ground_level_launch/lucia-bond.toml`                                           |
| V8                          | [https://v8.dev/](https://v8.dev/)                                              |
| V8 GitHub                   | [https://github.com/v8/v8](https://github.com/v8/v8)                          |
| Bifractal README            | `ground_level_launch/bifractal_memory/README.md`                                |
| rest_mcp (LM Studio API)    | `etherpots_drop/rest_mcp.md`                                                    |
| lucia.env                   | `workspace/lucia/lucia.env`                                                     |
| SLACK_CASK_CONNECTION       | `workspace/lucia/SLACK_CASK_CONNECTION.md`                                      |

---

_Genesis Bond: ACTIVE @ 741 Hz._
