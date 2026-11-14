import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "./constants";
import type { PoolSnapshot } from "./types";

const SWAP_DISCRIMINATOR = Uint8Array.from([
  248, 198, 158, 145, 225, 117, 135, 200,
]);

export type SwapParams = {
  trader: PublicKey;
  direction: "buy" | "sell";
  amountIn: bigint;
  minAmountOut: bigint;
  deadline: number;
  pool: PoolSnapshot;
};

/** Builder instruksi `swap` (disc + direction u8 + u64 + u64 + i64). */
export function buildSwapTransaction({
  trader,
  direction,
  amountIn,
  minAmountOut,
  deadline,
  pool,
}: SwapParams): Transaction {
  const mint = new PublicKey(pool.mint);
  const poolKey = new PublicKey(pool.pool);
  const tokenVault = new PublicKey(pool.tokenVault);
  const vaultAuthority = new PublicKey(pool.vaultAuthority);
  const solVault = new PublicKey(pool.solVault);
  const feeVault = new PublicKey(pool.feeVault);
  const traderAta = getAssociatedTokenAddressSync(mint, trader);

  const data = new Uint8Array(8 + 1 + 8 + 8 + 8);
  data.set(SWAP_DISCRIMINATOR, 0);
  const view = new DataView(data.buffer);
  view.setUint8(8, direction === "buy" ? 0 : 1);
  view.setBigUint64(9, amountIn, true);
  view.setBigUint64(17, minAmountOut, true);
  view.setBigInt64(25, BigInt(deadline), true);

  const swapIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: trader, isSigner: true, isWritable: true },
      { pubkey: poolKey, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: traderAta, isSigner: false, isWritable: true },
      { pubkey: tokenVault, isSigner: false, isWritable: true },
      { pubkey: vaultAuthority, isSigner: false, isWritable: false },
      { pubkey: solVault, isSigner: false, isWritable: true },
      { pubkey: feeVault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });

  const createAta = createAssociatedTokenAccountIdempotentInstruction(
    trader,
    traderAta,
    trader,
    mint,
  );

  return new Transaction().add(createAta).add(swapIx);
}

export function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function explorerAddress(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}
