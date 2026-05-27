# shell — LuciVerse zsh environment (Nix-managed)

A sovereign, reproducible zsh layer. **Oh My Zsh is an optional layer here, not
the root of the platform** — the upstream OMZ tree is vendored verbatim in
`../legacy/original-layout/` and this module wraps it.

```
zshrc/.zshrc              Sovereign zsh config (guarded OMZ bootstrap)
test/clean-shell-test.zsh Validates the config loads in a pristine shell
ohmyzsh/  zshrc/  plugins/  themes/   LuciDigital shell customizations
```

## Use it

```sh
nix develop .#shell    # sets ZDOTDIR to zshrc/, then run `zsh`
```

The `.zshrc` locates the repo via `ZDOTDIR` (Nix shell) or its own path (when
sourced directly), points `$ZSH` at the legacy OMZ copy, and only sources OMZ
if present — so a clean shell still works without it.

## Reproducibility

- Theme + plugin list are pinned in `zshrc/.zshrc` alongside the OMZ revision
  committed in `../legacy/original-layout/`.
- For full reproducibility, override `$ZSH` with a Nix-built `oh-my-zsh`
  package instead of the vendored copy.

## Test

```sh
nix run .#zsh-test     # zsh -n syntax checks + clean-shell config load test
```

The clean-shell test runs `zsh -df` (no user/global rc), sources `.zshrc`, and
asserts the `luci_shell_ready` marker — proving the config loads in isolation.
