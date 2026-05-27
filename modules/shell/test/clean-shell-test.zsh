#!/usr/bin/env zsh
# Validate the LuciVerse zsh configuration loads cleanly in a pristine shell.
# Runs zsh with no user/global rc files (-d -f), sources luci .zshrc, and
# asserts the readiness marker is produced without errors.
set -eu

here="${0:A:h}"
zshrc="${here}/../zshrc/.zshrc"

if [[ ! -r "${zshrc}" ]]; then
  print -r -- "FAIL: cannot read ${zshrc}" >&2
  exit 1
fi

# -d: no global rcs, -f: no user rcs → a clean shell.
out="$(zsh -df -c "source '${zshrc}'; luci_shell_ready")"

if [[ "${out}" == LUCI_ZSHRC_OK* ]]; then
  print -r -- "PASS: clean-shell zsh config loaded (${out})"
  exit 0
else
  print -r -- "FAIL: unexpected output: ${out}" >&2
  exit 1
fi
