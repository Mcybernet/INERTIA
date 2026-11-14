#!/usr/bin/env bash
# Rehearsal lokal: deploy program + siklus penuh di solana-test-validator.
# Tidak menyentuh Devnet maupun dompet sungguhan.
#
#   scripts/rehearsal_local.sh
#
# Env: INERTIA_REHEARSAL_SEED_SOL (default 4.8), INERTIA_REHEARSAL_SEED_TOKEN (default 960000)

set -euo pipefail

export PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RPC="http://127.0.0.1:8899"
KEYPAIR="$HOME/.config/solana/keys/inrt-devnet-payer.json"
PROGRAM_KEYPAIR="$HOME/.config/solana/keys/inertia_mass_devnet.json"
PROGRAM_ID="8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o"
SEED_SOL="${INERTIA_REHEARSAL_SEED_SOL:-4.8}"
SEED_TOKEN="${INERTIA_REHEARSAL_SEED_TOKEN:-960000}"

so=target/deploy/inertia_mass.so
if [[ ! -s "$so" ]]; then
  echo "belum ada $so — jalankan scripts/devnet.sh build dulu" >&2
  exit 1
fi
if [[ ! -f "$KEYPAIR" ]]; then
  echo "payer tidak ada: $KEYPAIR" >&2
  exit 1
fi

PAYER="$(solana-keygen pubkey "$KEYPAIR")"
echo "payer  : $PAYER"
echo "program: $PROGRAM_ID"
echo "so     : $(stat -c %s "$so") byte"

cleanup() {
  if [[ -n "${VALIDATOR_PID:-}" ]] && kill -0 "$VALIDATOR_PID" 2>/dev/null; then
    kill "$VALIDATOR_PID" 2>/dev/null || true
    wait "$VALIDATOR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "== validator =="
rm -rf test-ledger
solana-test-validator --reset --ledger test-ledger --quiet &
VALIDATOR_PID=$!

for _ in $(seq 1 90); do
  if curl -s -X POST -H 'content-type: application/json' \
      -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC" | grep -q '"ok"'; then
    break
  fi
  sleep 1
done
solana -u "$RPC" cluster-version

echo "== airdrop payer =="
solana airdrop 100 "$PAYER" -u "$RPC" --keypair "$KEYPAIR" || true
solana balance "$PAYER" -u "$RPC"

echo "== deploy program =="
solana program deploy "$so" \
  --url "$RPC" --keypair "$KEYPAIR" \
  --program-id "$PROGRAM_KEYPAIR"
solana program show "$PROGRAM_ID" -u "$RPC" | head -6

echo "== mint =="
MINT_KEYPAIR="$HOME/.config/solana/keys/inrt-mint-local.json"
rm -f "$MINT_KEYPAIR"
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh mint 50000000 "$MINT_KEYPAIR" | tee /tmp/rehearsal_mint.log
MINT="$(solana-keygen pubkey "$MINT_KEYPAIR")"
echo "MINT=$MINT"

echo "== init =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh init "$MINT"

echo "== seed =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh seed "$MINT" "$SEED_SOL" "$SEED_TOKEN"

echo "== status =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh status "$MINT"

echo "== buy 0.1 SOL =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh buy "$MINT" 0.1

echo "== status =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh status "$MINT"

echo "== sell 1000 INRT =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh sell "$MINT" 1000

echo "== add-mass 0.05 SOL (harus gagal: interval) =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh add-mass "$MINT" 0.05 || echo "gagal seperti diharapkan (interval belum lewat)"

echo "== selesai =="
INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" scripts/devnet.sh status "$MINT"
