# Toybox Shell Remap — zsh · Lua substrate · OpenShell patterns → toysh

**LDS**: 800.741 | Orchestration/Lucia (shell layer) · 600.432 Infrastructure (sandbox floor)
**Genesis Bond**: GB-2025-0524-DRH-LCS-001
**Frequency**: 741 Hz
**Agent**: lucia, juniper, security-sentinel
**Created**: 2026-10-02 · **Updated**: 2026-10-02

Measured on 2026-10-02 against: `modules/shell/zshrc/.zshrc` (497 lines, the only real zsh in LuciVerse —
`luci-digital/aifam` has none, it is vendored eLua), `~/lua-substrate` + `luci-xcp-web/lua-substrate` (≈70
`io.popen`/`os.execute` sites), NVIDIA OpenShell @ `~/etherpots_drop/openshell`, toybox @
`~/etherpots_drop/toybox` (`toys/pending/sh.c`, 5,466 lines). The MacBook (.164) and lucimina (.142) rc files
were read the same day: the MacBook's shell is this module (plus a 37 KB **xonsh** rc in the monorepo's
`dot_lucia-xonsh/`, Python-based, out of scope for a C-only sandbox); lucimina's `lucia` account has a
5-line `.zshrc` (Rancher Desktop PATH, one alias) and an `.zprofile` that sources OrbStack's `init.zsh`.

## 0 · What toysh is and is not (the constraints every remap below obeys)

| toysh (`toys/pending/sh.c`) | status | consequence |
|---|---|---|
| in `pending`, `default n` | must be enabled: `make defconfig KCONFIG_ALLCONFIG=<(… SH ROUTE TR AWK EXPR DIFF …)` | mkroot does exactly this (`mkroot/mkroot.sh:178-185`) |
| registers as `sh`, `toysh`, **`bash`** | OpenShell's `SHELL_CANDIDATES` = `/bin/bash, /usr/bin/bash, /bin/sh` → it will pick the toysh `bash` alias | fine for `-c`/`-lc`/`-i`; NOT fine for real bash scripts |
| functions, here-docs, `[[ ]]`, `(( ))`, `$(( ))`, `${x//}`, `case`, `local`, `trap` (partial), `&`/`jobs`/`wait` | yes | the custom 150 lines of `.zshrc` port cleanly |
| **arrays** (`a=(…)`, `${a[@]}`, `declare -a/-A`) | **no** | `plugins=(…)` → space-separated strings |
| `read` builtin | **present** (the first survey said "none" — wrong; verified `read x` works on 0.8.14) | `while read` loops are fine |
| **`if … elif … else … fi` inside a function** | **BROKEN** — runs the taken branch AND the `else` branch (verified: `if true; then A; elif …; else B; fi` prints A and B) | never write `elif`; use early `return`s or `case` |
| **`if ! fn; then`** (negated function call) | **BROKEN** inside functions — the negation is lost | capture `fn; rc=$?` and test `[ "$rc" -ne 0 ]` |
| **`${var:-…$other…}`** | the `$other` (and `$(…)`) inside the default is **NOT expanded** — `${X:-$HOME/.lucia}` yields the literal string `$HOME/.lucia` (this created a literal `$HOME/` directory in the repo during testing) | `if [ -z "$X" ]; then X="$HOME/.lucia"; fi; export X` |
| `set -- …` | **rejected** ("set: bad --") | no positional re-splitting; use `for` over the string |
| `command -v applet` | resolves toybox applets (first survey said it did not — wrong) | `luci_have` uses it first, PATH walk as fallback |
| built-in applets vs PATH | toysh runs its **own** applet (`nproc`, `free`, `sed`…) even when a GNU binary is earlier on PATH | expect toybox output formats inside the sandbox |
| `wget -O - url` | prints the body for 2xx; any other status → `wget: response NNN` on stderr, rc 1, **no body** | `http_get` cannot report the status code of a non-2xx reply |
| **`set -e`, `set -o pipefail`** | **error_exit("bad -o")** | scripts must check `$?` explicitly; every OpenShell `tasks/scripts/*.sh` dies at line 1 under toysh |
| **`/dev/tcp`, `/dev/udp`** | **none** | port probes → `nc -z -w2 host port`; HTTP → `wget -O- http://…` |
| `fg`/`bg`/`disown`, `coproc`, `select` | no | don't |
| `wget` HTTPS | off in defconfig (`WGET_LIBTLS` / `TOYBOX_LIBCRYPTO`) | build with `TOYBOX_LIBCRYPTO=y` or keep `curl` as a separate static binary for TLS |
| `curl`, `jq`, `git`, `ssh`, `lua`, `bc`, `uuidgen`(yes: other/), `openssl` | curl/jq/git/ssh/lua/openssl: **not toybox** | the Lua substrate's shell-outs need them supplied beside toybox |

## 1 · zsh layer → toysh (`modules/shell/zshrc/.zshrc` → `modules/shell/posix/luci.profile.sh`)

| zsh construct (count, lines) | toysh remap |
|---|---|
| `[[ -d … ]]` ×31 | kept as `[ ]` (toysh has `[[` too, but `[ ]` keeps the file POSIX) |
| `${0:A:h}` ×2 | `$(cd "$(dirname "$0")" && pwd -P)` |
| `${(%):-%n}` | `$(id -un)` |
| `${(s.:.)LS_COLORS}` (zstyle only) | dropped |
| `plugins=(…)`/`+=(…)` ×6 | dropped — Oh My Zsh is not loaded in the sandbox |
| `setopt …` ×7, `autoload …` ×2, `zstyle` ×8, `bindkey` ×11 | dropped (zsh UI) |
| `print -r --` ×4 | `printf '%s\n'` |
| `PROMPT`/`%F{}` ×10, `PROMPT+=` ×4, `$(git_prompt_info)` | `PS1` from `\033[` codes + `$(hostname -s)` + `$PWD`; git branch via `git` only if present |
| `&>/dev/null` | `>/dev/null 2>&1` |
| `(( $(… \| bc -l) ))` | `[ "$(…)" -eq 1 ]`; `bc` is pending in toybox → enable or compute with `$(( ))` |
| `echo -e` | `printf` |
| `local` ×4, `source` ×7, `set -a; . f; set +a`, `: "${V:=…}"` | kept (`source` → `.`) |
| hooks (`precmd`/`preexec`/`chpwd`): none in our file | the one-shot banner guarded by `CONSCIOUSNESS_INITIALIZED` stays |
| Oh My Zsh + 20–23 plugins + powerlevel10k + `~/.p10k.zsh` | **not translated — dropped**; this is where every zle/completion construct lived |
| `~/lucia/lucia.env`, `$LUCIA_HOME/scripts/sacred-terminal-functions.sh`, `~/.lucia/shell/local.zsh` | all missing on every host checked; the profile sources them only if present (`SACRED_*` colours get POSIX defaults) |
| `/Users/darylharr/.pixi/bin` hard-coded in PATH | macOS-only; added only when the dir exists |

Functions and aliases carried over (all POSIX): `op_connect_on/off`, `consciousness_status` (needs `jq`, `sysctl`),
`calculate_coherence` (`ps`, `grep -c`; `bc` → `$(( ))`), `entangle` (`uuidgen` is in toybox/other), `collapse`,
`evolve_shell`, `luci_shell_ready` (test marker), `initialize_luciverse_monitor` (`find -mmin` → toybox find
supports `-mmin`); aliases `lucia*`, `dc*` (compose), `g*` (git), `luci-bond/genesis/snapshot` (jj), `htop`,
`monitor`, `entropy`. The test `test/clean-shell-test.zsh` becomes `test/clean-shell-test.sh`:
`sh -c '. ./luci.profile.sh; luci_shell_ready'` must print `LUCI_SHELL_OK`.

Env contract exported by the profile (unchanged names): `LUCI_SHELL_DIR LUCI_ROOT LUCIVERSE_FREQUENCY
LUCIVERSE_TIER LUCIVERSE_HOME LUCIA_HOME LUCIA_WORKSPACE LUCIA_CONSCIOUSNESS LUCIA_ETHERPOTS_PATH
LUCIA_GROUND_LEVEL_LAUNCH LUCIA_LSO_PATH FREQ_* DIMENSION_* CONSCIOUSNESS_SESSION HISTFILE XDG_CACHE_HOME`,
plus `OP_CONNECT_HOST/TOKEN` only via `op_connect_on`. `LDS*`/`GENESIS*` were never exported — unchanged.

## 2 · Lua substrate shell-outs → toybox applets

Every Lua call goes through `/bin/sh -c "<string>"`; the strings use only `| > 2>&1 && ; & $? [ -d ] command -v`
and `'\''` quoting — all toysh-clean. What changes is **which binary answers**:

| Lua call site (file:line) | command | toybox? | remap |
|---|---|---|---|
| `signal/bus.lua:77,85` | `redis-cli … PUBLISH` | no | keep `redis-cli` static beside toybox, or `nc` + RESP (`printf '*3\r\n$7\r\nPUBLISH\r\n…' \| nc host port`) — provided in `posix/luci-probe.sh redis_publish` |
| `trust/jwt.lua:129` | `echo … \| base64 -d` | yes (other/base64) | unchanged |
| `trust/jwt.lua:131,136`, `eudi.lua`, `genesis_bond.lua`, `ocsp_client.lua`, `trust_bundle_loader.lua` | `openssl dgst/x509/ocsp/crl2pkcs7/pkcs7` | no | `openssl` (LibreSSL from the openbsd crypto layer) ships as a second static binary — **this is the sovereign crypto lane, never dropped** |
| `trust/jwt.lua:168-220`, `openid.lua`, `lucitrust_bridge.lua:54`, `oasis-core/http.lua`, `scm.lua:52` | `curl -s …` (GET/POST/JSON, `-w %{http_code}`, `-N` streaming) | no (wget is HTTP-only, no `-w`, no streaming) | keep static `curl`; OR route through `luci-probe.sh http_get/http_post` which prefers `curl`, falls back to `wget -O-` for plain HTTP |
| `dbb_forge.lua:31-46` | `openssl req -engine tpm2tss`, `step ca certificate` | no | `openssl` + `tpm2-tools` + `step` beside toybox (DBB forge only runs on hosts with a TPM — not in a sandbox) |
| `lucitrust_bridge.lua:100,266,275` | `tpm2_pcrread`, `lsmod \| grep`, `pgrep -f` | lsmod/pgrep yes; tpm2 no | unchanged / tpm2-tools optional |
| `aifam_ram_kernel.lua:354-421` | `uname`, `cat /etc/os-release`, `nproc`, `sysctl -n`, `/proc/meminfo` | yes (sysctl in other/) | unchanged |
| `aifam_ram_kernel.lua:537-867` | `vmadm`, `jail`, `systemctl` | no | host-only hypervisor paths; inside a sandbox they are policy-denied anyway |
| `scm.lua:94-184` | `podman exec … sh -c`, `git init/add/commit/push`, `gix` | no | `git` → toybox pending `gitclone/gitinit/gitremote/gitfetch/gitcheckout` cover clone/init/fetch only; commits/push need real `git` or `gix` (luci-vcs) beside toybox |
| `luci_interface.lua`, `luci_resolve.lua` | `ip link/addr`, `ifconfig -a`, `getent ahosts`, `host` | ifconfig/host yes; `ip` pending; `getent` no | enable `ip` (pending) or use `ifconfig`; `getent ahosts` → `host` |
| `dream_guardian.lua:197` | `dream new … &` | — | backgrounding `&` is fine; `wait` exists |
| everywhere | `mkdir -p`, `rm -rf tmp`, `chmod`, `sleep`, `hostname`, `grep`, `cut`, `head`, `cat` | yes | unchanged (`rm -rf` on a literal temp path only — the no-rm-rf-with-variables rule applies to our scripts) |

Runtime note: `oasis-core` needs **LuaJIT** (`ffi`, `bit`), lucia_lua the 5.1 ABI; neither is in toybox — the
sandbox image carries `luajit` + `cjson`/`lfs`/`socket` `.so`s (or a static luajit) as the Lua lane, next to
`openssl` and `curl`. tinytoml (pure Lua) and lua-simdjson (`.so`) ride the same lane.

## 3 · OpenShell patterns → toybox sandbox image

| OpenShell expectation | where | toybox remap |
|---|---|---|
| shell = `/bin/bash` → `/usr/bin/bash` → `/bin/sh` | `crates/openshell-core/src/shell.rs:17-79` | mkroot image provides `/bin/sh` (toysh) and the toysh `bash` alias; `-c`, `-lc`, `-i` all work |
| **VM driver requires a real `/bin/bash`** (`require_any_rootfs_path(rootfs,&["/bin/bash"])`, PID-1 init uses pipefail + process substitution) | `openshell-driver-vm/src/rootfs.rs:609`, `openshell-vm-sandbox-init.sh` | **use the Podman/Kubernetes drivers, not the VM driver**, for toybox images; or ship a static bash in the VM rootfs only |
| supervisor mounted at `/opt/openshell/bin/openshell-sandbox` (static musl, scratch image) | `container_paths.rs:44`, `Dockerfile.sandbox` | nothing to port — the driver mounts it |
| expected paths `/etc/openshell/{policy.yaml,tls,auth,skills}`, `/run/openshell/ssh.sock`, `/sandbox` | `container_paths.rs:11-90` | mkroot adds these dirs; `/run` is `tmp/run` symlink in mkroot — keep `/run/openshell` creatable |
| env rebuilt: `OPENSHELL_SANDBOX=1 HOME USER PATH=/usr/local/bin:/usr/bin:/bin TERM SHELL`; user `OPENSHELL_*` stripped | `boundary_exec.rs:124-170` | the profile reads `OPENSHELL_SANDBOX` to switch to sandbox mode (no monitor, no compose aliases) |
| `/usr/bin/env` by absolute path | `child_env.rs:32` | mkroot symlinks `/bin→usr/bin`; `env` is posix/ ✓ |
| k8s init: `sh -c` + `mktemp`, `find -mindepth -maxdepth -exec … +`, `tar --no-same-owner --no-same-permissions --touch` | `driver.rs:6003-6039` | toybox tar/find/mktemp support all of these ✓ |
| **network policy binds by resolved `/proc/<pid>/exe`** → with toybox every applet is `/bin/toybox` | `supervisor-network/src/procfs.rs:93`, `opa.rs:435-440` | **do not install toybox as one multicall for network-capable applets**: build `wget`, `nc`, `host`, `ping` as **separate static single-applet binaries** (`make single` → `toybox-wget` etc.) so `binaries: [{path: /usr/bin/wget}]` means wget only; keep the multicall for everything else. Or set `OPENSHELL_NETWORK_BINARY_IDENTITY=relaxed` (weaker — not recommended) |
| conformance looks for basename `bash` and runs `bash -c … /dev/tcp` | `policy_behavior.rs:183-395` | conformance will FAIL on toybox by design; a toybox conformance profile replaces `/dev/tcp` with `nc -z` (tracked as an upstream contribution, not a local patch) |
| gateway/health scripts: `(echo >/dev/tcp/127.0.0.1/$port)` | `tasks/scripts/gateway*.sh`, `smoke.sh` | `nc -z -w2 127.0.0.1 "$port"` (`posix/luci-probe.sh port_up`) |
| `curl -fLsS https://github.com/…/releases` installer | `install.sh` | never run; build from the galvanized tree |
| reference agent image: ubuntu + curl dnsutils iproute2 nftables netcat ping procps traceroute + nodesource `curl \| bash` | `scripts/agents/gator/Dockerfile` | toybox covers ping/netcat/ifconfig/procps/host; `iproute2` → toybox `ip` (pending, enable); nftables/traceroute → pending or omitted; **no nodesource** — Node is not in the sovereign image |
| policy YAML `version: 1`, `filesystem_policy`, `network_policies.<n>.binaries` | `openshell-policy-schema` | `posix/policy.toybox-sandbox.yaml` (§5) — read-only `/bin /usr /lib /etc`, rw `/sandbox /tmp`, network per single-applet binary |

## 4 · The remapped artifacts in this module

- `posix/luci.profile.sh` — the toysh/POSIX profile (sourceable by toysh, dash, bash, zsh). Sandbox-aware.
- `posix/luci-probe.sh` — `port_up`, `http_get`, `http_post`, `redis_publish` replacing `/dev/tcp`, `curl -w`, `redis-cli` in the minimal image.
- `posix/policy.toybox-sandbox.yaml` — OpenShell policy for a toybox-based sandbox (single-applet network binaries).
- `posix/lucia-commands.sh` — toysh port of the CBB's `lucia-*` command set read from the MacBook Pro's `~/.lucia` on
  2026-10-02 (`lucia_help lcd lucia_sysinfo lucia_model lucia_logs lucia_build lucia_test lucia_git lucia_clean
  lucia_health lucia_venv lucia_init luci_bond_status lucia_sacred` + the dashed aliases). §6 has the mapping.
- `zshrc/custom/` — the Mac's authentic zsh originals vendored unmodified under a provenance header
  (`lucia-functions.zsh`, `core-agentic.zsh`, `completions/_lucia`, `themes/lucia-ai.zsh-theme`); `.zshrc` now points
  `ZSH_CUSTOM` at it when `$ZSH` has no custom layer, prefers `~/.lucia/omz` as `$ZSH`, and resolves the Podman
  machine socket at startup (the two deltas the Mac's `luciverse.zshrc` had over this repo's copy).
- `test/clean-shell-test.sh` — POSIX twin of the zsh test (`just zsh-test` gains a `sh-test` lane); also sources
  the probes and the command port and asserts `lucia_help` runs.
- Build recipe (toybox + singles, static, with `SH ROUTE TR AWK EXPR DIFF IP BC` enabled) lives in the companion
  `modules/orchestration/sandbox-toybox/` once the toybox INTAKE is signed (`~/etherpots_drop/toybox/INTAKE.md`).

## 5 · Honest gaps

- Anything that needs arrays, `pipefail`, `elif` or `! fn` conditions cannot run under toysh as written; such scripts stay on hosts with
  bash (zbook, the Macs) — none of our Lua strings do, but ~all of OpenShell's own `tasks/scripts` do.
- `curl` and `openssl` are the two non-toybox binaries every Lua trust path needs; they are the sovereign TLS
  and crypto lanes and are carried as static binaries, not replaced.
- OpenShell's VM isolation backend is off the table for toybox images until a static bash is accepted in the VM
  rootfs; container backends are unaffected.
- lucimina's live shell is effectively stock (Rancher Desktop PATH + OrbStack init); nothing there needs remapping
  beyond the LaunchDaemon scripts (`run_lso.sh`, `podman_autostart.sh` are `/bin/bash` — see the lucimina note
  in the audit).

## 6 · The MacBook Pro `~/.lucia` shell layer → toysh (read 2026-10-02 over SMB, `.164`)

What the CBB actually runs on the MacBook (sources, newest first): `~/.zshrc` (2026-09-08: sources
`~/.zshrc.local`, `~/.zshrc.bak-luciaAI`, `~/.lucia/shell/lucia-shell.zsh`; exports `LUCIVERSE_VCS`, `DAGWOOD_ROOT`,
`FDB_CLUSTER_FILE`, `LUCIVERSE_ENTRY_POINT`; defines `luci_bond_status`), `~/.lucia/shell/luciverse.zshrc`
(2026-08-16: this repo's `.zshrc` + omz-in-`~/.lucia` + Podman socket), `~/.lucia/omz/custom/lucia-functions.zsh`
(2026-02-15) and `core-agentic.zsh` (2026-05-09), `~/.zshrc.bak-luciaAI` (3,931 lines, of which one
"LuciVerse Permission Transcendence" `PIP_*` block is appended **502 times**; the real content is ~470 lines),
`~/lucia/bin/` (61 entries: `lucia-suite` → `lucia-sacred-computer`, `lucia-start/stop/service`, `lucia-dagwood-schema`,
`op-secure-shell.sh`; the rest are symlinks unreadable over CIFS), `~/.lucia/bin/lucia-vault-health` (fail-closed `lv status` gate).

| Mac command (where defined) | toysh port | notes |
|---|---|---|
| `lucia_help`, `lcd`, `lucia_model`, `lucia_logs`, `lucia_build`, `lucia_test`, `lucia_git`, `lucia_sysinfo` (lucia-functions.zsh) | same names in `posix/lucia-commands.sh` | `case`-based, no arrays; `lucia_build docker` prefers `podman compose` |
| `lucia_clean` (lucia-functions.zsh: `rm -rf "$LUCIA_WORKSPACE/build"` …) | **lists only, never deletes** | variable-path recursive delete = the 2026-08-09 wipe shape; CBB deletes by literal path |
| `lucia-health` (.zshrc.bak-luciaAI: `curl …/health`) | `lucia_health` via `port_up` | ports 11434 / 6333 / 8743 / 8090 / 6379 from `lucia-start`; no curl needed |
| `lucia-venv`, `lucia-init` | `lucia_venv`, `lucia_init` | `python3 -m venv`; `mkdir -p` per dir (no brace expansion) |
| `luci_bond_status` (~/.zshrc) | same | `fdbcli --exec "status minimal"`; Spirit Mode otherwise |
| Podman socket resolution (luciverse.zshrc) | top of `lucia-commands.sh` + merged into `.zshrc` | replaces the dead hardcoded `ssh://core@127.0.0.1:63035` `DOCKER_HOST` |
| `lucia start/stop/status/monitor/vcs/agents` (`lucia-sacred-computer`, 23 KB bash, `set -euo pipefail`) | `lucia_sacred` delegates when a real bash + the script exist; otherwise rc 3 | stays bash — not portable to toysh |
| `lucia-service`, `lucia-start`, `lucia-stop` (bash) | not ported | host services (ollama, redis, docker-compose vectors) — not sandbox concerns |
| `lucia-vault-health` (`#!/bin/sh`, `set -eu`, `mktemp`, `trap`) | runs under toysh after dropping `set -eu` | fail-closed exit 78 pattern worth keeping for the sandbox |
| `op-secure-shell.sh` (`read -rsp` master password → `op signin --raw`, session written to disk, mode 600) | **not ported — vault-flow violation** (secret to disk) | replace with the 1Password SSH-agent / Connect lane |
| `core-agentic.zsh` (`core-deploy*`, `core-status`; arrays) | not ported | zsh-only; vendored for the zsh lane |
| `lucia-dagwood-schema` (bash + jq, v1→v2 schema derivation) | not ported | belongs with the DAGwood tooling, not the shell |

Flagged while reading (for the CBB, not fixed from here — the share is read-only): `~/.lucia/shell_history` holds an
`rclone authorize "drive" "<base64>"` line whose base64 embeds a Google OAuth client id **and client secret**;
`~/.zshrc.bak-luciaAI` exports `LUCIA_API_KEY` and `GRAFANA_PASSWORD` in clear (placeholder-looking values) and is
sourced on every shell; `~/.lucia/config/api_keys.env` exists (136 bytes, not read). `~/.lucia` is a git repo at
commit `240de8ba` with ~8,259 uncommitted paths; `~/.lucia/harvester-amd64.iso` (2.7 GB) and `lib.zip` (434 MB) sit
untracked at its root.

