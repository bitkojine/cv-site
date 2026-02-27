#!/usr/bin/env bash
set -euo pipefail

: "${GH_OWNER:?Set GH_OWNER (for example: bitkojine)}"
: "${GH_REPO:?Set GH_REPO (for example: cv-site)}"
: "${RUNNER_TOKEN:?Set RUNNER_TOKEN from GitHub -> Settings -> Actions -> Runners -> New self-hosted runner}"
: "${RUNNER_SHA256:?Set RUNNER_SHA256 from the GitHub runner download page}"

RUNNER_VERSION="${RUNNER_VERSION:-2.331.0}"
LABELS="${RUNNER_LABELS:-cv-site,ephemeral}"
RUNNER_NAME="${RUNNER_NAME:-ephemeral-$(hostname)-$(date +%s)}"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64) PACKAGE_OS_ARCH="linux-x64" ;;
      aarch64|arm64) PACKAGE_OS_ARCH="linux-arm64" ;;
      *) echo "Unsupported Linux architecture: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64) PACKAGE_OS_ARCH="osx-x64" ;;
      arm64) PACKAGE_OS_ARCH="osx-arm64" ;;
      *) echo "Unsupported macOS architecture: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

RUNNER_DIR="$(mktemp -d -t gha-ephemeral-runner.XXXXXX)"

cleanup() {
  if [ -d "$RUNNER_DIR" ]; then
    rm -rf "$RUNNER_DIR"
  fi
}
trap cleanup EXIT

cd "$RUNNER_DIR"

RUNNER_TGZ="actions-runner-${PACKAGE_OS_ARCH}-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TGZ}"

echo "Downloading runner: $RUNNER_URL"
curl -fsSL -o "$RUNNER_TGZ" "$RUNNER_URL"
echo "${RUNNER_SHA256}  ${RUNNER_TGZ}" | shasum -a 256 -c -

tar xzf "$RUNNER_TGZ"

REPO_URL="https://github.com/${GH_OWNER}/${GH_REPO}"

echo "Configuring ephemeral runner: $RUNNER_NAME"
./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$LABELS" \
  --ephemeral \
  --disableupdate \
  --unattended

echo "Runner ready. Waiting for one job..."
./run.sh

echo "Runner completed one job and exited."
