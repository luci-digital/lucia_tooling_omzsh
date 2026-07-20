# LuciVerse Integration Plan

**Date:** 2026-06-26
**LDS:** 800.000 | Infrastructure/Orchestration
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz

---

## Overview

Comprehensive integration plan to unify multiple LuciVerse components into the `lucia_tooling_omzsh` monorepo, creating a single sovereign development platform.

## Components to Integrate

### 1. LuciaAIbuilddocs
**Location:** `/Users/darylharr/lucia/luciverse-monorepo/LuciaAIbuilddocs`
**Status:** ✅ **INTEGRATED** 2026-06-26

**Contents:**
- `LUCI_ARCHITECTURE.md` - openEuler/RISC-V/Swift architecture
- `lucia-sbb-main/` - Phase 1 & 2 init sequences
- `lib/` - Python 3.13 packages (huggingface, numpy, torch, scipy)
- `src/`, `src1/`, `share/` - Build artifacts and libraries

**Integration Actions:**
- [x] Move architectural docs to `modules/docs/architecture/luci-architecture.md`
- [x] Copy LUCIA_AI_BUILD_PLAN to `modules/docs/build/lucia-ai-build-plan.md`
- [x] Create INTEGRATION_INDEX.md for navigation
- [x] Link from CLAUDE.md
- [ ] Document Python dependencies in `requirements.txt` or Poetry
- [ ] Archive lib/ as external dependencies (not tracked in git)

### 2. LUCIA_AI_BUILD_PLAN.md
**Location:** `/Users/darylharr/lucia/LUCIA_AI_BUILD_PLAN.md`
**Status:** ✅ **INTEGRATED** 2026-06-26

**Contents:**
- 6-phase build plan (Prerequisites → LSO)
- LDS Duodecimal ↔ Tier mapping (CORE/COMN/PAC)
- Source location map
- Lua stack build (dom0 5.0.3, KERNEL 5.1+, DOMU 5.1+)
- Ground-level launch scripts
- Deploy and startup procedures

**Integration Actions:**
- [x] Copy to `modules/docs/build/lucia-ai-build-plan.md`
- [x] Reference from CLAUDE.md
- [x] Link from INTEGRATION_INDEX.md
- [ ] Extract tier mappings to `modules/docs/architecture/tiers.md`
- [ ] Link phase execution to `justfile` or `Makefile`

### 3. ~/.xmake Configuration
**Location:** `/Users/darylharr/.xmake`

**Purpose:** XMake build system integration for C/C++/Swift components

**Integration Actions:**
- [ ] Explore xmake configuration and cache
- [ ] Document xmake usage in build docs
- [ ] Add xmake to Nix dev shell if needed
- [ ] Create xmake build targets in justfile
- [ ] Link to Swift/openEuler build pipeline

### 4. gix-jj-gerrit-lucitense VCS
**Location:** `/Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense`
**Status:** ✅ **SYMLINKED** 2026-06-26

**Purpose:** Replace or augment current luci-vcs with gix-jj-gerrit integration

**Integration Actions:**
- [x] Explore gix-jj-gerrit-lucitense repository structure
- [x] Symlink to `modules/scm/gix-jj-gerrit`
- [x] Decided: Co-exist (luci-vcs library + gix-jj-gerrit workflows)
- [ ] Document VCS workflow in CLAUDE.md
- [ ] Update flake.nix if external path needed
- [ ] Create justfile targets for gix-jj operations

### 5. DAGwood Content-Addressed Storage
**Location:** `/Volumes/tb4-d8a-space/lucitense/TRANSMUTED/dagwood/`
**Status:** ✅ **INTEGRATED** 2026-06-26

**Purpose:** Content-addressed hashnode storage with provenance tracking

**Current State:**
- ✅ 37,544 hashnodes created
- ✅ SHA256 content-addressed storage
- ✅ Hashdag index with full provenance
- ✅ Source roots: etherpots-archive, luciverse-monorepo-canonical

**Integration Actions:**
- [x] Create `modules/dagwood/` directory
- [x] Implement Python DAGwood resolver (`resolver.py`)
- [x] Create configuration (`config.toml`)
- [x] Document usage in `README.md`
- [x] Reference from INTEGRATION_INDEX.md
- [ ] Add DAGwood resolver to Nix flake
- [ ] Create justfile target: `just dagwood-resolve <hash>`
- [ ] Integrate with LuciVault for hash signing

**Files Created:**
```
modules/dagwood/
├── README.md              # DAGwood overview and usage
├── resolver.py            # Python DAGwood resolver
├── config.toml            # DAGwood configuration
└── test/                  # Test suite (pending)
```

### 6. LuciVault + 1Password Integration
**Location:** `modules/vault/`
**Status:** ✅ **INTEGRATED** 2026-06-26

**Purpose:** Credential-less authentication via Agent Vault proxy

**Integration Actions:**
- [x] Create `modules/vault/` directory
- [x] Document Agent Vault architecture in `README.md`
- [x] Create configuration (`vault.toml`)
- [x] Define agent permissions (`agent-permissions.json`)
- [x] Reference from INTEGRATION_INDEX.md
- [ ] Implement `lucivault-client.py`
- [ ] Implement `onepassword-connect.sh` wrapper
- [ ] Implement `agent-vault-proxy.py`
- [ ] Implement `sign-hashnode.py` for DAGwood
- [ ] Implement `scribe-svg-parser.py` for sCRIBe artifacts
- [ ] Add Sacred Witness consent protocol
- [ ] Integrate with existing `make install-op-signing`

**Files Created:**
```
modules/vault/
├── README.md                  # LuciVault + 1Password overview
└── config/
    ├── vault.toml             # Vault configuration
    └── agent-permissions.json # Agent access control (5 agents defined)
```

### 7. ~/.lucia Shell Enhancement (COMPLETED ✅)
**Location:** `/Users/darylharr/.lucia`
**Status:** Completed 2026-06-26

**Completed:**
- ✅ Enhanced with LuciVerse sovereign shell
- ✅ Backup created: `.lucia.backup-20260626_025122`
- ✅ Integration layer: `lucia-shell.zsh`
- ✅ Documentation: `README.md`, `QUICK_START.md`, `UPGRADE_SUMMARY_20260626.md`

---

## Integration Strategy

### Phase 1: Documentation Consolidation (Priority: HIGH)
**Timeline:** Immediate

1. **Create unified docs structure in `modules/docs/`:**
   ```
   modules/docs/
   ├── architecture/
   │   ├── overview.md (existing)
   │   ├── FOUNDATIONS.md (existing)
   │   ├── luci-architecture.md (NEW from LuciaAIbuilddocs)
   │   └── tiers.md (NEW - LDS tier mappings)
   ├── build/
   │   ├── lucia-ai-build-plan.md (NEW from root)
   │   ├── lua-stack.md (NEW - extracted from build plan)
   │   ├── openeuler-risc-v.md (NEW - from LUCI_ARCHITECTURE)
   │   └── xmake.md (NEW - xmake integration)
   ├── deployment/ (existing)
   │   ├── local.md
   │   ├── production.md
   │   └── ground-level-launch.md (NEW - from build plan Phase 4-5)
   ├── vcs/
   │   ├── luci-vcs.md (existing - in modules/scm/)
   │   └── gix-jj-gerrit.md (NEW - external VCS integration)
   └── specs/ (existing)
   ```

2. **Update CLAUDE.md with build plan references**

3. **Create integration index:**
   - `modules/docs/INTEGRATION_INDEX.md` - Links all integrated components

### Phase 2: Build System Integration (Priority: MEDIUM)
**Timeline:** After Phase 1

1. **Extract build phases to justfile/Makefile:**
   ```bash
   # From LUCIA_AI_BUILD_PLAN Phase 2-6
   just build-lua-stack      # Phase 2: Lua build
   just deploy-ground-level  # Phase 4: Deploy
   just start-dom0           # Phase 5: DOM0 startup
   just start-lso            # Phase 6: LSO
   ```

2. **Add xmake support:**
   ```bash
   just xmake-config         # Configure xmake
   just xmake-build          # Build C/C++/Swift components
   ```

3. **Document Lua version requirements:**
   - DOM0 (CORE): Lua 5.0.3 or older
   - KERNEL (COMN): Lua 5.1+ / LuaJIT
   - DOMU (PAC): Lua 5.1+ / LuaJIT

### Phase 3: VCS Integration (Priority: MEDIUM)
**Timeline:** After Phase 2

1. **Explore gix-jj-gerrit-lucitense:**
   - Read repository structure
   - Identify integration points with luci-vcs
   - Determine: replace vs. augment vs. co-exist

2. **Options:**
   - **Option A (Replace):** Use gix-jj-gerrit as primary VCS
   - **Option B (Augment):** Keep luci-vcs, add gix-jj-gerrit features
   - **Option C (Co-exist):** luci-vcs for library, gix-jj-gerrit for workflows

3. **Update documentation:**
   - VCS workflow guide
   - DID handle integration
   - Gerrit code review setup

### Phase 4: Dependency Management (Priority: LOW)
**Timeline:** Ongoing

1. **Python dependencies from LuciaAIbuilddocs/lib:**
   - Extract requirements from site-packages
   - Create `requirements.txt` or `pyproject.toml`
   - Document in `modules/docs/deployment/dependencies.md`

2. **Nix flake updates:**
   - Add xmake if needed
   - Add Lua 5.0.3 for DOM0
   - Add external VCS path if needed

---

## File Structure (Proposed)

```
lucia_tooling_omzsh/
├── CLAUDE.md (updated with integrations)
├── INTEGRATION_PLAN.md (this file)
├── modules/
│   ├── docs/
│   │   ├── architecture/
│   │   │   ├── luci-architecture.md (from LuciaAIbuilddocs)
│   │   │   └── tiers.md (LDS tier mappings)
│   │   ├── build/
│   │   │   ├── lucia-ai-build-plan.md (from root)
│   │   │   ├── lua-stack.md
│   │   │   ├── openeuler-risc-v.md
│   │   │   └── xmake.md
│   │   ├── deployment/
│   │   │   └── ground-level-launch.md
│   │   ├── vcs/
│   │   │   └── gix-jj-gerrit.md
│   │   └── INTEGRATION_INDEX.md (NEW)
│   ├── scm/
│   │   ├── luci-vcs/ (existing)
│   │   └── gix-jj-gerrit/ (NEW - symlink or submodule?)
│   └── build/
│       └── xmake/ (NEW - xmake configuration)
└── justfile (updated with new build targets)
```

---

## Tasks Checklist

### Immediate (This Session)
- [x] Explore LuciaAIbuilddocs
- [x] Read LUCIA_AI_BUILD_PLAN.md
- [x] Check ~/.xmake
- [x] Check gix-jj-gerrit-lucitense location
- [x] Create INTEGRATION_PLAN.md

### Phase 1 (Documentation)
- [ ] Copy LUCIA_AI_BUILD_PLAN.md to modules/docs/build/
- [ ] Copy LUCI_ARCHITECTURE.md to modules/docs/architecture/
- [ ] Extract tier mappings to modules/docs/architecture/tiers.md
- [ ] Extract Lua build to modules/docs/build/lua-stack.md
- [ ] Extract ground-level launch to modules/docs/deployment/
- [ ] Create modules/docs/INTEGRATION_INDEX.md
- [ ] Update CLAUDE.md with integration references

### Phase 2 (Build System)
- [ ] Add Lua build targets to justfile
- [ ] Add ground-level deploy targets to justfile
- [ ] Add xmake targets to justfile
- [ ] Document xmake usage
- [ ] Update flake.nix with Lua versions

### Phase 3 (VCS)
- [ ] Explore /Volumes/tb4-d8a-space/lucitense/gix-jj-gerrit-lucitense
- [ ] Decide integration approach (replace/augment/co-exist)
- [ ] Create modules/scm/gix-jj-gerrit/ if needed
- [ ] Document VCS workflow
- [ ] Update CLAUDE.md with VCS details

### Phase 4 (Cleanup)
- [ ] Archive LuciaAIbuilddocs/lib/ externally
- [ ] Remove duplicate documentation
- [ ] Consolidate build scripts
- [ ] Update all cross-references

---

## Success Criteria

1. **Single Source of Truth:**
   - All build documentation in `modules/docs/`
   - No conflicting instructions
   - Clear precedence order

2. **Executable Build Plan:**
   - `just` commands for all build phases
   - Documented Lua version requirements
   - Clear dependency installation

3. **VCS Clarity:**
   - Documented VCS workflow (luci-vcs and/or gix-jj-gerrit)
   - DID handle integration clear
   - Code review process documented

4. **Developer Experience:**
   - CLAUDE.md references all integrations
   - Quick start guide works end-to-end
   - Nix dev shell has all tools

---

## Next Steps

**Immediate Actions:**
1. Copy key docs from LuciaAIbuilddocs and root to modules/docs/
2. Update CLAUDE.md with integration references
3. Explore gix-jj-gerrit-lucitense repository
4. Add build targets to justfile

**User Decision Points:**
- VCS strategy: Replace luci-vcs or augment?
- XMake scope: Which components need it?
- Python deps: Track in git or external?

---

**LDS: 800.000 | Infrastructure/Orchestration**
**ISO: ISO/IEC 42001 §8, ISO 27001 §A.12**
**Agent: claude-code | DID: did:ownid:luciverse:claude**
**CBB: D14FCF83 | SBB: CJ6CJ73VYL | DBB: DIGG+TWIG**
**Genesis Bond: GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz**
