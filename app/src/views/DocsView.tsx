import Link from "next/link";
import { AddressList, type AddressItem } from "@/components/AddressList";
import { PageIntro } from "@/components/PageIntro";
import { Panel, PanelHeader } from "@/components/ui";
import { MASS_CAP_BPS, MINT, MIN_MASS_SOL, PROGRAM_ID } from "@/lib/constants";
import { fmtSolLamports } from "@/lib/format";
import { derivePdas } from "@/lib/pool";
import { FAUCET, REPO } from "@/lib/nav";

const STEPS = [
  {
    title: "Siapkan wallet",
    body: "Pakai Phantom atau Solflare. Buat wallet baru khusus Devnet — jangan pakai seed wallet mainnet kamu.",
  },
  {
    title: "Ambil SOL Devnet",
    body: "Buka faucet resmi Solana, login GitHub, minta SOL Devnet. SOL ini tidak punya nilai uang.",
  },
  {
    title: "Hubungkan ke situs",
    body: "Klik Connect di kanan atas dan pastikan wallet berada di network Devnet, bukan Mainnet.",
  },
  {
    title: "Beli INRT",
    body: "Buka Trade, masukkan jumlah SOL, cek price impact dan minimum diterima, lalu konfirmasi di wallet.",
  },
];

const FAQ = [
  {
    q: "Apakah ini mainnet?",
    a: "Bukan. Program, mint, dan pool hanya ada di Solana Devnet. Tidak ada jembatan, tidak ada janji harga, dan token ini tidak dijual.",
  },
  {
    q: "Kenapa transaksi gagal dengan pesan saldo tidak cukup?",
    a: "Kamu butuh SOL Devnet untuk fee jaringan dan sewa ATA (sekitar 0,003 SOL). Sisakan minimal 0,01 SOL saat membeli.",
  },
  {
    q: "Apakah ada bonding curve?",
    a: "Tidak. Harga dibentuk constant-product di pool internal. Tidak ada tahap presale, tidak ada migrasi curve ke pool.",
  },
  {
    q: "Bisakah likuiditas ditarik?",
    a: "Tidak. Program tidak punya instruksi withdraw atau close untuk pool. Token di pool terkunci; Mass Reserve hanya bisa masuk lewat add_mass.",
  },
  {
    q: "Siapa yang menentukan harga?",
    a: "Rasio reserve di pool. Setiap beli menaikkan harga sedikit, setiap jual menurunkannya. Tidak ada oracle dan tidak ada penetapan harga manual.",
  },
  {
    q: "Kenapa fee 0,30% tidak masuk LP?",
    a: "Fee disimpan di vault terpisah, bukan di reserve. Saat terkumpul cukup, keeper memanggil add_mass untuk menambah likuiditas permanen.",
  },
];

export function DocsView() {
  const pdas = derivePdas();
  const addresses: AddressItem[] = [
    { label: "Program inertia_mass", address: PROGRAM_ID.toBase58(), note: "upgrade authority terpisah" },
    { label: "Mint INRT", address: MINT.toBase58(), note: "decimals 6 · mint & freeze authority null" },
    { label: "Pool state", address: pdas.pool.toBase58(), note: "menyimpan reserve dan fee_bps" },
    { label: "Token vault", address: pdas.tokenVault.toBase58(), note: "menahan token sisi pool" },
    { label: "SOL vault", address: pdas.solVault.toBase58(), note: "menahan SOL sisi pool" },
    { label: "Fee vault", address: pdas.feeVault.toBase58(), note: "sumber dana add_mass" },
    { label: "Mass Reserve", address: pdas.massReserveVault.toBase58(), note: "hanya bisa keluar lewat add_mass" },
  ];

  return (
    <>
      <PageIntro
        kicker="Docs · panduan singkat"
        title="Cara memakai INERTIA di Devnet"
        description="Tidak ada akun, tidak ada email, tidak ada custodian. Semua transaksi ditandatangani wallet kamu sendiri."
      />

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <div key={step.title} className="bg-ink-1 p-4">
            <div className="mono text-[10px] text-gold">0{index + 1}</div>
            <div className="mt-2 text-[11px] uppercase tracking-label text-fg">
              {step.title}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={FAUCET} target="_blank" rel="noreferrer" className="btn btn-gold">
          Faucet Devnet ↗
        </a>
        <Link href="/trade" className="btn btn-ghost">
          Buka Trade
        </Link>
        <a href={REPO} target="_blank" rel="noreferrer" className="btn btn-ghost">
          Source ↗
        </a>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader
            title="Alamat on-chain"
            subtitle="semua Devnet"
            right={
              <span className="text-[9px] uppercase tracking-label text-dim">
                klik untuk copy
              </span>
            }
          />
          <AddressList items={addresses} />
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="Mass Reserve" subtitle="aturan singkat" />
            <ul className="divide-y divide-lineSoft text-[10px] leading-relaxed text-muted">
              <li className="px-4 py-2.5">
                Minimum {fmtSolLamports(MIN_MASS_SOL)} SOL dari fee vault per
                panggilan.
              </li>
              <li className="px-4 py-2.5">
                Maksimum {MASS_CAP_BPS / 100}% dari sisa Mass Reserve per
                panggilan.
              </li>
              <li className="px-4 py-2.5">
                Rasio mengikuti harga marginal, toleransi 0,5%.
              </li>
              <li className="px-4 py-2.5">
                Tidak ada withdraw: token hanya bisa masuk pool.
              </li>
            </ul>
            <div className="border-t border-line px-4 py-3">
              <Link href="/mass" className="text-[10px] text-gold hover:underline">
                Lihat status Mass Reserve →
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Peringatan" subtitle="Devnet only" />
            <p className="px-4 py-3 text-[10px] leading-relaxed text-muted">
              Token ini tidak memiliki nilai ekonomi, tidak dijual, dan tidak
              menjanjikan imbal hasil. Jangan pernah memberi seed phrase atau
              private key ke siapa pun, termasuk ke situs ini.
            </p>
          </Panel>
        </div>
      </div>

      <section className="mt-3">
        <Panel>
          <PanelHeader title="FAQ" subtitle="6 pertanyaan umum" />
          <div className="divide-y divide-lineSoft">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] text-fg">
                  {item.q}
                  <span className="mono text-[10px] text-gold group-open:hidden">
                    +
                  </span>
                  <span className="mono hidden text-[10px] text-gold group-open:inline">
                    −
                  </span>
                </summary>
                <p className="mt-2 max-w-[80ch] text-[10px] leading-relaxed text-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
