#!/usr/bin/env bash
# Deploy web INERTIA (static export) ke branch `gh-pages`.
#
# Kenapa branch, bukan Actions: token git yang dipakai untuk push mungkin tidak
# punya scope `workflow`. Skrip ini hanya butuh akses push biasa ke repo.
#
# Pakai dari root repo:  bash scripts/deploy-pages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="$(git -C "$ROOT" remote get-url origin)"
NAME="$(git -C "$ROOT" config user.name || echo INERTIA)"
EMAIL="$(git -C "$ROOT" config user.email || echo inertia@local)"

cd "$ROOT/app"
GITHUB_PAGES=true NEXT_TELEMETRY_DISABLED=1 npm run build

cd out
touch .nojekyll
rm -rf .git
git init -q
git add -A
git -c user.name="$NAME" -c user.email="$EMAIL" commit -qm "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "$REMOTE" HEAD:gh-pages

echo "deployed -> https://mcybernet.github.io/INERTIA/"
