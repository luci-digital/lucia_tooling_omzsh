#!/bin/sh
# LDS: 600.432 | Infrastructure/AI — probes for the toybox sandbox (no /dev/tcp, no curl -w, no redis-cli) | Agent: juniper
# ISO: ISO/IEC 42001 §8, ISO 27001 §A.13
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Created: 2026-10-02 · Updated: 2026-10-02
#
# Replaces, inside a toybox image, the three shell idioms the Lua substrate and OpenShell scripts use:
#   (echo >/dev/tcp/H/P)            → port_up H P            (toybox nc -z)
#   curl -s -w '%{http_code}' URL   → http_get URL           (curl if present, else toybox wget; prints body, status on stderr)
#   curl -s -X POST -d @f URL       → http_post URL FILE [CT]
#   redis-cli -h H -p P PUBLISH c m → redis_publish H P c m  (RESP over toybox nc)
# toysh-clean: no arrays, no elif, no set -e/pipefail. Exit codes are the contract.
# Usage: . luci-probe.sh; port_up 127.0.0.1 47334   |   luci-probe.sh port_up 127.0.0.1 47334
# toysh notes (verified on toybox 0.8.14): `command -v` resolves applets; a PATH walk is the fallback. toysh lacks `set --`;
# toybox wget has no -q and takes `-O -` for stdout; $(...) inside ${var:-...} is NOT expanded.

luci_have() { [ -n "$1" ] || return 1; command -v "$1" >/dev/null 2>&1 && return 0; luci_ifs="$IFS"; IFS=:; for luci_d in $PATH; do [ -x "$luci_d/$1" ] && { IFS="$luci_ifs"; return 0; }; done; IFS="$luci_ifs"; return 1; }

port_up() {               # host port [timeout_s]
  [ $# -ge 2 ] || { printf 'usage: port_up host port [timeout]\n' >&2; return 2; }
  luci_t="$3"; [ -n "$luci_t" ] || luci_t=2
  # no elif here: toysh 0.8.14 runs the if-branch AND the else-branch of an if/elif/else inside a function
  if luci_have nc; then nc -z -w "$luci_t" "$1" "$2" >/dev/null 2>&1; return $?; fi
  if luci_have bash && [ ! -L "$(command -v bash)" ]; then
    bash -c "exec 3<>/dev/tcp/$1/$2" >/dev/null 2>&1; return $?      # real bash only (toysh's bash alias has no /dev/tcp)
  fi
  return 3
}

http_get() {              # url  → body on stdout, "status=NNN" on stderr
  [ -n "$1" ] || { printf 'usage: http_get url\n' >&2; return 2; }
  luci_to="$LUCI_HTTP_TIMEOUT"; [ -n "$luci_to" ] || luci_to=20
  if luci_have curl; then
    luci_code="$(curl -sS --max-time "$luci_to" -o /dev/stdout -w '\n__STATUS__%{http_code}' "$1" 2>/dev/null)" || return 1
    printf '%s' "${luci_code%__STATUS__*}"; printf 'status=%s\n' "${luci_code##*__STATUS__}" >&2
    return 0
  fi
  case "$1" in https://*) printf 'http_get: no curl and toybox wget is HTTP-only (build with TOYBOX_LIBCRYPTO)\n' >&2; return 4 ;; esac
  wget -O - "$1" 2>/dev/null && { printf 'status=200?\n' >&2; return 0; }
  printf 'status=fail\n' >&2; return 1
}

http_post() {             # url file [content-type]
  [ $# -ge 2 ] && [ -r "$2" ] || { printf 'usage: http_post url file [content-type]\n' >&2; return 2; }
  luci_to="$LUCI_HTTP_TIMEOUT"; [ -n "$luci_to" ] || luci_to=20
  if luci_have curl; then
    curl -sS --max-time "$luci_to" -X POST -H "Content-Type: ${3:-application/json}" --data-binary "@$2" "$1"
    return $?
  fi
  case "$1" in https://*) printf 'http_post: no curl; HTTPS needs TOYBOX_LIBCRYPTO wget\n' >&2; return 4 ;; esac
  wget -O - -p "$(cat "$2")" "$1" 2>/dev/null              # toybox wget: -p post-data (string, not file), no -q
}

redis_publish() {         # host port channel message  (RESP, one round trip, no redis-cli)
  [ $# -ge 4 ] || { printf 'usage: redis_publish host port channel message\n' >&2; return 2; }
  luci_have nc || return 3
  luci_c="$3"; luci_m="$4"; luci_rt="$LUCI_REDIS_TIMEOUT"; [ -n "$luci_rt" ] || luci_rt=2
  printf '*3\r\n$7\r\nPUBLISH\r\n$%s\r\n%s\r\n$%s\r\n%s\r\n' "${#luci_c}" "$luci_c" "${#luci_m}" "$luci_m" \
    | nc -w "$luci_rt" "$1" "$2" | head -1 | grep -q '^:'
}

# CLI form
case "${1:-}" in
  port_up|http_get|http_post|redis_publish) luci_fn="$1"; shift; "$luci_fn" "$@" ;;
  "") : ;;
  *) printf 'luci-probe.sh: unknown probe %s\n' "$1" >&2; exit 2 ;;
esac
