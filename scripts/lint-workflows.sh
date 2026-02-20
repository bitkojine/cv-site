#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ROOT_DIR}/.cache/actionlint"
BIN_PATH="${CACHE_DIR}/actionlint"
VERSION="${ACTIONLINT_VERSION:-1.7.8}"

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "${uname_s}" in
  Linux) os="linux" ;;
  Darwin) os="darwin" ;;
  *)
    echo "Unsupported OS for actionlint: ${uname_s}" >&2
    exit 2
    ;;
esac

case "${uname_m}" in
  x86_64|amd64) arch="amd64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "Unsupported architecture for actionlint: ${uname_m}" >&2
    exit 2
    ;;
esac

mkdir -p "${CACHE_DIR}"

if [[ ! -x "${BIN_PATH}" ]]; then
  archive="actionlint_${VERSION}_${os}_${arch}.tar.gz"
  url="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/${archive}"
  tmp_archive="${CACHE_DIR}/${archive}"

  echo "Downloading actionlint v${VERSION} (${os}/${arch})..."
  curl -fsSL "${url}" -o "${tmp_archive}"
  tar -xzf "${tmp_archive}" -C "${CACHE_DIR}" actionlint
  chmod +x "${BIN_PATH}"
fi

cd "${ROOT_DIR}"

# Ensure actionlint gets a real shellcheck binary path (not npm wrapper output).
shellcheck_bin=""
npm_shellcheck_bin="${ROOT_DIR}/node_modules/shellcheck/bin/shellcheck"
npm_shellcheck_wrapper="${ROOT_DIR}/node_modules/.bin/shellcheck"

if [[ -x "${npm_shellcheck_bin}" ]]; then
  shellcheck_bin="${npm_shellcheck_bin}"
elif [[ -x "${npm_shellcheck_wrapper}" ]]; then
  # Pre-warm npm shellcheck wrapper so it downloads the binary quietly.
  "${npm_shellcheck_wrapper}" --version >/dev/null 2>&1 || true
  if [[ -x "${npm_shellcheck_bin}" ]]; then
    shellcheck_bin="${npm_shellcheck_bin}"
  fi
elif command -v shellcheck >/dev/null 2>&1; then
  candidate="$(command -v shellcheck)"
  # Ignore npm wrapper; it emits logs that break actionlint's JSON parsing.
  if [[ "${candidate}" != "${npm_shellcheck_wrapper}" ]]; then
    shellcheck_bin="${candidate}"
  fi
fi

if [[ -n "${shellcheck_bin}" ]]; then
  "${BIN_PATH}" -color -oneline -shellcheck "${shellcheck_bin}"
else
  "${BIN_PATH}" -color -oneline -shellcheck=
fi
