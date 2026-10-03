#!/bin/sh
# LDS: 800.741 | Orchestration/Lucia — POSIX twin of clean-shell-test.zsh | Agent: lucia
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Created: 2026-10-02 · Updated: 2026-10-02
# Runs the toybox profile in a clean POSIX shell (toysh, dash, bash --posix, zsh in sh mode) and asserts the marker.
# Usage: sh modules/shell/test/clean-shell-test.sh [shell-binary]
dir="$(cd "$(dirname "$0")" && pwd -P)"
profile="$dir/../posix/luci.profile.sh"
shell="${1:-sh}"
probe="$dir/../posix/luci-probe.sh"
cmds="$dir/../posix/lucia-commands.sh"
out="$(env -i HOME="${HOME:-/tmp}" PATH="/usr/local/bin:/usr/bin:/bin" "$shell" -c ". '$profile'; . '$probe'; . '$cmds'; luci_shell_ready; lucia_help >/dev/null && echo LUCIA_CMDS_OK" 2>&1)"
case "$out" in
  *LUCI_SHELL_OK*LUCIA_CMDS_OK*) printf 'PASS %s: %s\n' "$shell" "$(printf '%s' "$out" | grep LUCI_SHELL_OK)"; exit 0 ;;
  *) printf 'FAIL %s:\n%s\n' "$shell" "$out"; exit 1 ;;
esac
