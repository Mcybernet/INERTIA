#!/usr/bin/env bash
# INERTIA (INRT) — Devnet helper.
# Guard: skrip ini menolak cluster non-Devnet kecuali INERTIA_ALLOW_NON_DEVNET=1.
#
# Pemakaian:
#   scripts/devnet.sh build
#   scripts/devnet.sh deploy
#   scripts/devnet.sh balance
#   scripts/devnet.sh mint [SUPPLY_TOKENS] [MINT_KEYPAIR]
#   scripts/devnet.sh init <MINT>
#   scripts/devnet.sh seed <MINT> <SOL> <TOKEN>
#   scripts/devnet.sh status <MINT>
#   scripts/devnet.sh buy <MINT> <SOL>
#   scripts/devnet.sh sell <MINT> <TOKEN>
#   scripts/devnet.sh reserve <MINT> <TOKEN>   # isi Mass Reserve dari ATA payer
#   scripts/devnet.sh add-mass <MINT> <SOL>
#   scripts/devnet.sh set-authority   # upgrade authority program -> INERTIA_OWNER
#   scripts/devnet.sh wallets         # tampilkan payer + owner + saldo
#
# Env: INERTIA_RPC (default https://api.devnet.solana.com),
#      INERTIA_KEYPAIR (default ~/.config/solana/keys/inrt-devnet-payer.json),
#      INERTIA_OWNER (default wallet pemilik proyek, penerima alokasi token).

set -euo pipefail

export PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RPC="${INERTIA_RPC:-https://api.devnet.solana.com}"
KEYPAIR="${INERTIA_KEYPAIR:-$HOME/.config/solana/keys/inrt-devnet-payer.json}"
# Wallet pemilik proyek: penerima alokasi token + upgrade authority program.
# Tidak pernah dipakai sebagai penandatangan (private key tidak dipegang CLI).
OWNER="${INERTIA_OWNER:-86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C}"
PROGRAM_ID="${INERTIA_PROGRAM_ID:-8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o}"
TOOL=(cargo run --manifest-path tools/devnet/Cargo.toml --)

if [[ "${INERTIA_ALLOW_NON_DEVNET:-0}" != "1" && "$RPC" != *devnet* && "$RPC" != *localhost* && "$RPC" != *127.0.0.1* ]]; then
  echo "RPC '$RPC' bukan Devnet. Set INERTIA_ALLOW_NON_DEVNET=1 kalau ini disengaja." >&2
  exit 1
fi

solana_cli() {
  solana --url "$RPC" --keypair "$KEYPAIR" "$@"
}

case "${1:-}" in
  build)
    anchor build
    ls -l target/deploy/inertia_mass.so
    ;;
  deploy)
    solana_cli balance
    # `anchor deploy` mencetak error "No such file or directory" setelah upload
    # sukses (bug jalur buffer/IDL), jadi pakai CLI Solana langsung agar status
    # deploy unambiguous. Keypair program eksplisit; upgrade memakai authority
    # yang sama dengan `set-authority`.
    solana program deploy target/deploy/inertia_mass.so \
      --url "$RPC" --keypair "$KEYPAIR" \
      --program-id "${INERTIA_PROGRAM_KEYPAIR:-$HOME/.config/solana/keys/inertia_mass_devnet.json}"
    solana program show "$PROGRAM_ID" --url "$RPC" | head -8
    ;;
  balance)
    solana_cli balance
    ;;
  mint)
    SUPPLY="${2:-50000000}"
    MINT_KEYPAIR="${3:-$HOME/.config/solana/keys/inrt-mint.json}"
    mkdir -p "$(dirname "$MINT_KEYPAIR")"
    if [[ -f "$MINT_KEYPAIR" ]]; then
      echo "keypair mint sudah ada: $MINT_KEYPAIR" >&2
      exit 1
    fi
    # spl-token hanya menerima keypair yang sudah ada sebagai argumen posisional,
    # jadi keypair mint dibuat dulu di path yang kita kontrol.
    solana-keygen new --no-bip39-passphrase --silent --outfile "$MINT_KEYPAIR" >/dev/null
    MINT_AUTH="$(solana address --keypair "$KEYPAIR")"
    spl-token create-token --url "$RPC" --fee-payer "$KEYPAIR" \
      --mint-authority "$MINT_AUTH" --decimals 6 "$MINT_KEYPAIR"
    MINT="$(solana-keygen pubkey "$MINT_KEYPAIR")"
    spl-token create-account --url "$RPC" --fee-payer "$KEYPAIR" --owner "$MINT_AUTH" "$MINT"
    spl-token mint --url "$RPC" --fee-payer "$KEYPAIR" --mint-authority "$KEYPAIR" \
      --recipient-owner "$MINT_AUTH" "$MINT" "$SUPPLY"
    spl-token authorize --url "$RPC" --fee-payer "$KEYPAIR" --authority "$KEYPAIR" \
      "$MINT" mint --disable
    echo
    echo "saldo ATA payer:"
    spl-token balance --url "$RPC" --owner "$MINT_AUTH" "$MINT"
    echo
    echo "MINT=$MINT"
    echo "Simpan pubkey di atas untuk init/seed. Supply: $SUPPLY token."
    ;;
  init)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" init --mint "${2:?mint}" --fee-bps "${FEE_BPS:-30}" --interval "${MASS_INTERVAL:-60}"
    ;;
  seed)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" seed --mint "${2:?mint}" --sol "${3:?sol}" --token "${4:?token}"
    ;;
  status)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" "${TOOL[@]}" status --mint "${2:?mint}"
    ;;
  buy)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" buy --mint "${2:?mint}" --sol "${3:?sol}"
    ;;
  sell)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" sell --mint "${2:?mint}" --token "${3:?token}"
    ;;
  reserve)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" reserve --mint "${2:?mint}" --token "${3:?token}"
    ;;
  add-mass)
    INERTIA_RPC="$RPC" INERTIA_KEYPAIR="$KEYPAIR" \
      "${TOOL[@]}" add-mass --mint "${2:?mint}" --sol "${3:?sol}"
    ;;
  set-authority)
    echo "upgrade authority $PROGRAM_ID -> $OWNER" >&2
    solana program set-upgrade-authority "$PROGRAM_ID" \
      --new-upgrade-authority "$OWNER" \
      --url "$RPC" --keypair "$KEYPAIR" --skip-new-upgrade-authority-signer-check
    ;;
  wallets)
    PAYER="$(solana-keygen pubkey "$KEYPAIR")"
    echo "rpc    : $RPC"
    echo "payer  : $PAYER (penandatangan: deploy/init/seed/swap)"
    timeout 60 solana balance "$PAYER" --url "$RPC" || true
    echo "owner  : $OWNER (penerima alokasi token, upgrade authority)"
    timeout 60 solana balance "$OWNER" --url "$RPC" || true
    echo "program: $PROGRAM_ID"
    ;;
  *)
    sed -n '2,20p' "$0"
    exit 1
    ;;
esac
