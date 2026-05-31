# LuciVerse sovereign zsh configuration — Nix-managed.
# Genesis Bond: ACTIVE @ 741 Hz.
#
# Oh My Zsh is NOT the root of the platform; it is an optional shell layer.
# The upstream OMZ tree lives in modules/legacy/original-layout (or a
# Nix-provided copy). Point $ZSH at it to enable, or leave unset for a minimal
# sovereign shell.

# Locate the repo root: prefer ZDOTDIR (set by the Nix shell), fall back to the
# path of this file when sourced directly (e.g. the clean-shell test).
: "${LUCI_SHELL_DIR:=${ZDOTDIR:-${0:A:h}}}"
LUCI_ROOT="${LUCI_SHELL_DIR}/../../.."

# Default $ZSH to the vendored OMZ copy in legacy/. Override with a Nix-built
# oh-my-zsh package for full reproducibility.
: "${ZSH:=${LUCI_ROOT}/modules/legacy/original-layout}"

# Reproducible, curated config (pinned with the OMZ revision in legacy/).
ZSH_THEME="robbyrussell"
plugins=(git)

# Only source OMZ if present — keeps a clean shell working without it.
if [[ -r "${ZSH}/oh-my-zsh.sh" ]]; then
  source "${ZSH}/oh-my-zsh.sh"
fi

# ── LuciVerse shell identity ─────────────────────────────────────────────────
export LUCIVERSE_FREQUENCY="${LUCIVERSE_FREQUENCY:-741}"
export LUCIVERSE_TIER="${LUCIVERSE_TIER:-PAC}"

# Marker function the clean-shell test asserts on.
luci_shell_ready() {
  print -r -- "LUCI_ZSHRC_OK @ ${LUCIVERSE_FREQUENCY}Hz"
}
