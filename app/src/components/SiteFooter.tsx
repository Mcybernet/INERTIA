import Link from "next/link";
import { MINT, PROGRAM_ID } from "@/lib/constants";
import { FAUCET, NAV, REPO, explorerAddress } from "@/lib/nav";

export function SiteFooter() {
  const program = PROGRAM_ID.toBase58();
  const mint = MINT.toBase58();

  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="text-[11px] tracking-[0.26em] text-fg">INERTIA</div>
          <p className="mt-2 max-w-[28ch] text-[10px] leading-relaxed text-dim">
            Token Devnet tanpa bonding curve. Likuiditas terkunci di pool
            constant-product, fee 0,30% seluruhnya kembali ke massa.
          </p>
          <p className="mt-3 border border-line px-2 py-1 text-[9px] uppercase tracking-label text-muted">
            Devnet only · bukan mainnet
          </p>
        </div>

        <div>
          <div className="label">Halaman</div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[10px] tracking-label text-muted hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="label">Kontrak</div>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a
                href={explorerAddress(program)}
                target="_blank"
                rel="noreferrer"
                className="mono text-[10px] text-muted hover:text-gold"
              >
                program {program.slice(0, 6)}…{program.slice(-6)} ↗
              </a>
            </li>
            <li>
              <a
                href={explorerAddress(mint)}
                target="_blank"
                rel="noreferrer"
                className="mono text-[10px] text-muted hover:text-gold"
              >
                mint {mint.slice(0, 6)}…{mint.slice(-6)} ↗
              </a>
            </li>
            <li className="text-[10px] text-dim">decimals 6 · authority null</li>
          </ul>
        </div>

        <div>
          <div className="label">Sumber</div>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-label text-muted hover:text-gold"
              >
                GitHub ↗
              </a>
            </li>
            <li>
              <a
                href={FAUCET}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-label text-muted hover:text-gold"
              >
                Faucet Devnet ↗
              </a>
            </li>
            <li>
              <Link
                href="/docs"
                className="text-[10px] tracking-label text-muted hover:text-gold"
              >
                Cara beli & risiko
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-lineSoft">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-1 px-4 py-3 text-[9px] uppercase tracking-label text-dim sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <span>INERTIA · INRT · Solana Devnet</span>
          <span className="mono normal-case tracking-normal">
            data dibaca langsung dari RPC · tanpa server
          </span>
        </div>
      </div>
    </footer>
  );
}
