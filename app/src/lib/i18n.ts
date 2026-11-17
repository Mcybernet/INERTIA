export type Lang = "id" | "en";

type Vars = Record<string, string | number>;

/**
 * Kamus ID -> EN. Kunci adalah teks Indonesia yang tampil di UI, jadi
 * terjemahan bisa dicek berdampingan dengan sumbernya. Teks yang belum ada
 * di kamus otomatis tampil apa adanya (fallback ke bahasa Indonesia).
 */
const EN: Record<string, string> = {
  // Navigasi & umum
  "Navigasi utama": "Main navigation",
  "Navigasi utama mobile": "Main navigation (mobile)",
  "Muat ulang data on-chain": "Reload on-chain data",
  "Muat ulang data": "Reload data",
  "Memuat…": "Loading…",
  "Tutup navigasi": "Close navigation",
  "Buka navigasi": "Open navigation",
  "Ganti bahasa": "Switch language",
  "Pool di Solana Explorer": "Pool on Solana Explorer",
  "Solana Devnet · tanpa bonding curve": "Solana Devnet · no bonding curve",
  "fee 0,30% → massa": "0.30% fee → mass",
  Devnet: "Devnet",
  Pool: "Pool",
  Program: "Program",
  Mint: "Mint",
  Wallet: "Wallet",
  Owner: "Owner",
  Supply: "Supply",
  Harga: "Price",
  Waktu: "Time",
  Tipe: "Type",
  Aktivitas: "Activity",
  Semua: "All",
  Beli: "Buy",
  Jual: "Sell",
  Massa: "Mass",
  Seed: "Seed",
  Tier: "Tier",
  Slippage: "Slippage",
  "Price impact": "Price impact",
  "Mass Reserve": "Mass Reserve",
  "Fee vault": "Fee vault",
  "Token vault": "Token vault",
  "SOL vault": "SOL vault",
  "Mass reserve": "Mass reserve",
  "Launch slot": "Launch slot",
  "SOL reserve": "SOL reserve",
  "Token reserve": "Token reserve",
  "Invariant k": "Invariant k",
  "Total massa": "Total mass",
  "Mass terakhir": "Last mass",
  "belum pernah": "never",
  Salin: "Copy",
  Tersalin: "Copied",
  "Explorer ↗": "Explorer ↗",
  KAMU: "YOU",
  "Belum ada holder": "No holders yet",
  Holder: "Holders",
  "top token account · Devnet": "top token accounts · Devnet",
  "vault · massa · owner · wallet": "vault · mass · owner · wallet",

  // Header/footer
  "Devnet only · bukan mainnet": "Devnet only · not mainnet",
  Halaman: "Pages",
  Kontrak: "Contract",
  Sumber: "Sources",
  "Cara beli & risiko": "How to buy & risks",
  "data dibaca langsung dari RPC · tanpa server":
    "data read straight from RPC · no server",
  "Token Devnet tanpa bonding curve. Likuiditas terkunci di pool constant-product, fee 0,30% seluruhnya kembali ke massa.":
    "A Devnet token with no bonding curve. Liquidity is locked in a constant-product pool, and the full 0.30% fee returns to the mass.",

  // Timeframe
  "1M": "1m",
  "5M": "5m",
  "15M": "15m",
  "1J": "1h",
  "4J": "4h",
  "1H": "1D",
  "1Mgg": "1W",

  // Chart
  "{label} · butuh riwayat {need} hari (sekarang {have} hari)":
    "{label} · needs {need} days of history ({have} now)",
  "{label} · bucket WIB": "{label} · WIB bucket",
  "Harga INRT / SOL": "INRT / SOL price",
  "belum ada trade": "no trades",
  "Pindah ke candle pertama sejak pool dibuat":
    "Jump to the first candle since pool creation",
  "Sejak launch": "Since launch",
  "Menyiapkan candle {label}…": "Preparing {label} candles…",
  "Belum ada candle · swap pertama akan muncul di sini":
    "No candles yet · the first swap will appear here",
  "Memuat candle…": "Loading candles…",
  "Menyiapkan candle…": "Preparing candles…",
  "Bucket tanpa transaksi tetap digambar sebagai candle flat":
    "Buckets without trades are still drawn as flat candles",
  "Waktu WIB · {n} candle · {m} flat": "WIB time · {n} candles · {m} flat",
  "Memuat riwayat {done}/{total} tx": "Loading history {done}/{total} tx",
  "Fee 0,30% tidak masuk reserve · k naik tipis":
    "0.30% fee never enters the reserve · k rises slowly",
  "Perubahan candle (close vs open)": "Candle change (close vs open)",
  "{n} trade": "{n} trades",

  // Footer wording
  "{n} event on-chain": "{n} on-chain events",
  "SWAP · MASSA · SEED": "SWAP · MASS · SEED",
  "Menampilkan {shown} dari {total} event":
    "Showing {shown} of {total} events",
  "Menampilkan {from}-{to} dari {total} event":
    "Showing {from}-{to} of {total} events",
  "Halaman {page} dari {total}": "Page {page} of {total}",
  Sebelumnya: "Previous",
  Berikutnya: "Next",
  "Muat lebih": "Load more",
  "Semua event termuat": "All events loaded",
  "Belum ada aktivitas swap": "No swap activity yet",
  BELI: "BUY",
  JUAL: "SELL",
  MASSA: "MASS",

  // TradePanel
  "Transaksi dibatalkan di wallet.": "Transaction cancelled in your wallet.",
  "Saldo tidak cukup untuk nominal + fee + sewa ATA.":
    "Balance is not enough for the amount + fee + ATA rent.",
  "Harga bergerak melewati slippage. Coba lagi atau naikkan slippage.":
    "Price moved past your slippage. Try again or raise slippage.",
  "Blockhash kedaluwarsa. Coba lagi.": "Blockhash expired. Try again.",
  "gagal memuat state pool terbaru": "failed to load the latest pool state",
  "quote beli tidak tersedia pada state terbaru":
    "buy quote is not available on the latest state",
  "quote jual tidak tersedia pada state terbaru":
    "sell quote is not available on the latest state",
  "Bayar dengan SOL": "Pay with SOL",
  "Jual INRT": "Sell INRT",
  "Pakai saldo maksimum": "Use max balance",
  "Jumlah SOL": "SOL amount",
  "Jumlah token INRT": "INRT amount",
  "Kamu bayar": "You pay",
  "Kamu terima (estimasi)": "You receive (estimate)",
  "Fee {pct}": "Fee {pct}",
  "Min. diterima (slip {pct})": "Min. received (slip {pct})",
  "Tier wallet": "Wallet tier",
  "Saldo tidak cukup. Sisakan SOL untuk fee jaringan dan sewa ATA (sekitar 0,003 SOL).":
    "Balance is not enough. Leave some SOL for network fees and ATA rent (about 0.003 SOL).",
  "Memproses…": "Processing…",
  "Beli INRT": "Buy INRT",
  "Devnet only. Transaksi ditandatangani di wallet kamu; app tidak pernah meminta private key. Fee 0,30% masuk fee vault, bukan reserve.":
    "Devnet only. Transactions are signed in your wallet; the app never asks for a private key. The 0.30% fee goes to the fee vault, not the reserve.",
  "Beli {amount} SOL berhasil dikonfirmasi.":
    "Buy of {amount} SOL confirmed.",
  "Jual {amount} INRT berhasil dikonfirmasi.":
    "Sell of {amount} INRT confirmed.",
  "0,01": "0.01",
  "0,05": "0.05",
  "0,1": "0.1",
  "0,5": "0.5",

  // Overview
  "The Mass · likuiditas yang tidak bisa ditarik":
    "The Mass · liquidity you cannot pull",
  "Harga dibentuk constant-product di pool internal. Tidak ada bonding curve, tidak ada instruksi withdraw: satu-satunya jalan token keluar dari Mass Reserve adalah add_mass.":
    "Price forms through constant product inside the pool. No bonding curve, no withdraw instruction: the only way tokens leave the Mass Reserve is add_mass.",
  "Cara kerja": "How it works",
  "Cara mulai →": "Get started →",
  "Token ini tidak punya nilai. Jangan kirim SOL mainnet.":
    "This token has no value. Never send mainnet SOL.",
  "Devnet RPC publik bisa membatasi laju. Coba refresh beberapa saat lagi.":
    "The public Devnet RPC may rate-limit. Try refreshing in a moment.",
  "Riwayat tertunda · ": "History delayed · ",
  "RPC publik sedang membatasi permintaan. Chart dan aktivitas memakai data terakhir yang tersimpan; refresh otomatis akan mencoba lagi.":
    "The public RPC is rate-limiting requests. Chart and activity use the last cached data; auto-refresh will retry.",
  "01 · Mekanisme": "01 · Mechanism",
  "Tanpa bonding curve": "No bonding curve",
  "Harga dibentuk constant-product di pool internal. Tidak ada kurva yang naik sesuai jadwal, tidak ada harga yang dijanjikan.":
    "Price forms through constant product inside the pool. No curve that rises on a schedule, no promised price.",
  "Baca tokenomics": "Read tokenomics",
  "02 · Likuiditas": "02 · Liquidity",
  "Tidak bisa ditarik": "Cannot be withdrawn",
  "Tidak ada instruksi withdraw. Token hanya bisa keluar dari Mass Reserve lewat add_mass, dan itu menambah likuiditas permanen.":
    "There is no withdraw instruction. Tokens can only leave the Mass Reserve through add_mass, and that adds permanent liquidity.",
  "Lihat Mass Reserve": "View Mass Reserve",
  "03 · Fee": "03 · Fee",
  "Fee kembali ke massa": "Fees return to the mass",
  "Setiap swap menyisihkan 0,30% ke fee vault terpisah. Fee itu dibelanjakan lewat add_mass, bukan diambil owner.":
    "Every swap sets aside 0.30% into a separate fee vault. That fee is spent through add_mass, not taken by the owner.",
  "Cara kerja fee": "How fees work",
  "8 event terbaru": "Latest 8 events",
  "memuat {done}/{total} tx · 8 terbaru":
    "loading {done}/{total} tx · latest 8",
  "Semua aktivitas →": "All activity →",
  Prinsip: "Principles",
  "Tidak ada tombol withdraw. Itu bukan fitur yang belum dibuat. Itu desain.":
    "There is no withdraw button. It is not a missing feature. It is the design.",
  "Lihat mekanismenya →": "See the mechanism →",

  // Trade view
  "Beli atau jual INRT terhadap pool": "Buy or sell INRT against the pool",
  "Transaksi ditandatangani di wallet kamu. Fee 0,30% dipotong dari input dan masuk fee vault; reserve pool tidak pernah dipakai untuk fee.":
    "Transactions are signed in your wallet. The 0.30% fee is deducted from the input and goes to the fee vault; the pool reserve is never used for fees.",
  "Cara beli →": "How to buy →",
  "Beli: SOL masuk reserve, token keluar dari vault. Harga naik sedikit.":
    "Buy: SOL enters the reserve, tokens leave the vault. Price ticks up.",
  "Jual: token kembali ke vault, SOL keluar reserve. Harga turun sedikit.":
    "Sell: tokens return to the vault, SOL leaves the reserve. Price ticks down.",
  "Fee 0,30% selalu dipotong lebih dulu dan disimpan di fee vault terpisah.":
    "The 0.30% fee is always taken first and kept in a separate fee vault.",
  "Fee itu nanti dibelanjakan lewat add_mass untuk menambah likuiditas permanen.":
    "That fee is later spent through add_mass to add permanent liquidity.",
  "Wallet belum terhubung · ": "Wallet not connected · ",
  "Hubungkan Phantom atau Solflare (mode Devnet) untuk melihat saldo, tier, dan riwayat swap kamu.":
    "Connect Phantom or Solflare (Devnet mode) to see your balances, tier, and swap history.",
  "Posisi kamu": "Your position",
  "wallet terhubung": "wallet connected",
  "Saldo SOL": "SOL balance",
  "Saldo INRT": "INRT balance",
  "Nilai estimasi": "Estimated value",
  "berdasarkan supply": "based on supply",
  "butuh > 0,1% supply": "needs > 0.1% of supply",
  "{pct} supply": "{pct} of supply",
  "Riwayat wallet": "Wallet history",
  "{n} swap dari wallet ini": "{n} swaps from this wallet",
  "Belum ada swap dari wallet ini": "No swaps from this wallet yet",

  // Mass view
  "Mass Reserve · on-chain": "Mass Reserve · on-chain",
  "Liquidity yang tumbuh, bukan ditarik":
    "Liquidity that grows, never gets pulled",
  "Semua fee swap berakhir di sini. add_mass menukar fee vault menjadi token dari Mass Reserve dan menambahkannya ke pool permanen.":
    "Every swap fee ends up here. add_mass converts fee vault SOL into tokens from the Mass Reserve and adds them to the pool permanently.",
  "Mass siap": "Mass ready",
  "Mass menunggu": "Mass waiting",
  "{pct} dari {supply} sudah masuk pool":
    "{pct} of {supply} already in the pool",
  "{n} INRT ditambahkan": "{n} INRT added",
  "siap dipanggil add_mass": "ready for add_mass",
  "minimum 1 SOL + rent": "minimum 1 SOL + rent",
  "interval {n} detik": "{n}s interval",
  "Reserve terpakai": "Reserve used",
  "9.600.000 INRT awal": "9,600,000 INRT initial",
  "Masuk pool lewat add_mass": "Entered the pool through add_mass",
  "Mass Reserve tidak punya instruksi withdraw; hanya add_mass yang bisa memindahkannya.":
    "The Mass Reserve has no withdraw instruction; only add_mass can move it.",
  "Fee vault menuju ambang add_mass":
    "Fee vault toward the add_mass threshold",
  "Ambang = {amount} SOL (1 SOL + rent). Sudah terpenuhi.":
    "Threshold = {amount} SOL (1 SOL + rent). Reached.",
  "Ambang = {amount} SOL (1 SOL + rent). Belum terpenuhi.":
    "Threshold = {amount} SOL (1 SOL + rent). Not reached yet.",
  "Aturan add_mass": "add_mass rules",
  "dikunci di program": "enforced by the program",
  "Minimum SOL per panggilan": "Minimum SOL per call",
  "Maksimum token per panggilan": "Maximum tokens per call",
  "Cap dari sisa reserve": "Cap of remaining reserve",
  "Toleransi pergeseran harga": "Price shift tolerance",
  "Sumber dana": "Funding source",
  "Butuh volume ±333 SOL untuk mengumpulkan 1 SOL fee pada 0,30%. Di Devnet, fee vault bisa diisi langsung untuk menguji keeper.":
    "It takes about 333 SOL of volume to collect 1 SOL in fees at 0.30%. On Devnet the fee vault can be topped up directly to test the keeper.",
  "Detail kebijakan massa →": "Mass policy details →",
  "Riwayat add_mass": "add_mass history",
  "event MassEvent · {done}/{total} tx": "MassEvent · {done}/{total} tx",
  "event MassEvent": "MassEvent",
  "Belum ada add_mass · fee vault masih di bawah ambang":
    "No add_mass yet · the fee vault is below the threshold",

  // Activity view
  "Semua event pool, langsung dari log program":
    "Every pool event, straight from the program log",
  "Tidak ada indexer. Setiap baris berasal dari log SwapEvent, SeedEvent, atau AddMassEvent yang dibaca langsung dari RPC Devnet.":
    "No indexer. Every row comes from SwapEvent, SeedEvent, or AddMassEvent logs read straight from the Devnet RPC.",
  "{n} event · {done}/{total} tx": "{n} events · {done}/{total} tx",
  "{n} event tersimpan": "{n} events cached",
  "Memuat riwayat · ": "Loading history · ",
  "{done} dari {total} transaksi dibaca. Tabel terisi bertahap karena RPC publik hanya mengizinkan satu getTransaction per ±1,2 detik.":
    "{done} of {total} transactions read. The table fills in gradually because the public RPC allows one getTransaction every ~1.2 seconds.",
  "Total event": "Total events",
  "seed {time}": "seed {time}",
  "sejak launch": "since launch",
  "Beli / Jual": "Buys / Sells",
  "jumlah transaksi, bukan volume": "transaction count, not volume",
  "Volume swap": "Swap volume",
  "akumulasi solUser": "cumulative solUser",
  "penambahan likuiditas permanen": "permanent liquidity additions",
  "{err}. Tabel memakai cache terakhir; refresh otomatis mencoba lagi.":
    "{err}. The table uses the last cache; auto-refresh will retry.",
  "Cache riwayat disimpan 3 menit di browser lalu diperbarui secara inkremental. RPC publik Devnet membatasi getTransaction, jadi jumlah event bisa lebih sedikit dari total transaksi pool.":
    "History cache is kept for 3 minutes in the browser, then updated incrementally. The public Devnet RPC limits getTransaction, so the event count can be lower than the pool's total transactions.",

  // Holders view
  "Siapa yang memegang INRT": "Who holds INRT",
  "Peringkat token account berdasarkan saldo. Vault pool dan Mass Reserve selalu muncul karena keduanya memegang supply, bukan karena dimiliki wallet.":
    "Token accounts ranked by balance. The pool vault and Mass Reserve always appear because they hold supply, not because a wallet owns them.",
  "top {n} akun": "top {n} accounts",
  "Holder teratas": "Top holder",
  "memuat…": "loading…",
  "Top 10 gabungan": "Top 10 combined",
  "termasuk vault & reserve": "including vault & reserve",
  "Akun berlabel": "Labelled accounts",
  "pool vault · mass reserve · owner": "pool vault · mass reserve · owner",
  "Supply beredar": "Circulating supply",
  "INRT · decimals 6": "INRT · decimals 6",
  "Holder tertunda · ": "Holders delayed · ",
  "persentase supply": "percentage of supply",
  "Catatan data": "Data notes",
  "Devnet RPC": "Devnet RPC",
  "RPC publik sering menolak getTokenLargestAccounts (429). Saat itu terjadi, tabel memakai fallback: vault pool, Mass Reserve, owner, dan wallet yang pernah swap. Untuk daftar lengkap, set NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1 dengan RPC privat.":
    "The public RPC often rejects getTokenLargestAccounts (429). When that happens, the table falls back to the pool vault, Mass Reserve, owner, and wallets that have swapped. For the full list, set NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1 with a private RPC.",
  "> 4%": "> 4%",
  "1,5 – 4%": "1.5 – 4%",
  "0,5 – 1,5%": "0.5 – 1.5%",
  "0,1 – 0,5%": "0.1 – 0.5%",
  "< 0,1%": "< 0.1%",

  // Market panel
  Pasar: "Market",
  "Harga INRT": "INRT price",
  "belum ada event": "no events yet",
  "perubahan sejak event pertama · ": "change since the first event · ",
  "rasio reserve, bukan oracle": "reserve ratio, not an oracle",
  "Preview 0,1 SOL": "Preview 0.1 SOL",
  "fee 0,30% sudah dipotong · impact ±{pct}":
    "0.30% fee already deducted · impact ±{pct}",
  "Mass Reserve yang sudah masuk pool": "Mass Reserve already in the pool",
  "{n} INRT sisa": "{n} INRT left",
  "fee vault siap add_mass": "fee vault ready for add_mass",
  "fee vault {amount} SOL": "fee vault {amount} SOL",
  "Fee swap": "Swap fee",
  "0,30% → massa": "0.30% → mass",
  "Sebelum beli": "Before you buy",
  "Wallet di jaringan Devnet, bukan Mainnet":
    "Wallet on Devnet, not Mainnet",
  "Sisakan SOL untuk fee jaringan + sewa ATA":
    "Leave SOL for network fees + ATA rent",
  "Harga constant-product, tanpa bonding curve":
    "Constant-product pricing, no bonding curve",
  "ditandatangani wallet kamu · tanpa custodian":
    "signed by your wallet · no custodian",

  // Mass band
  "likuiditas permanen": "permanent liquidity",
  "siap add_mass": "ready for add_mass",
  "menunggu fee": "waiting for fees",
  "Ambang add_mass: 1 SOL + rent": "add_mass threshold: 1 SOL + rent",
  "Sisa reserve": "Reserve left",
  "Sudah masuk pool": "Already in the pool",
  "{n} INRT · {m} add_mass tercatat": "{n} INRT · {m} add_mass recorded",
  "cukup untuk add_mass": "enough for add_mass",
  "kurang {amount} SOL": "{amount} SOL short",
  "Reserve yang terpakai": "Reserve used",
  "Tidak ada instruksi withdraw. Token hanya keluar dari reserve lewat add_mass, yang justru menambah likuiditas pool.":
    "There is no withdraw instruction. Tokens leave the reserve only through add_mass, which adds liquidity to the pool.",
  "Mass terakhir: {value}": "Last mass: {value}",
  "Aturan & riwayat →": "Rules & history →",

  // On-chain panel
  "Mint authority revoked": "Mint authority revoked",
  "Tanpa instruksi withdraw": "No withdraw instruction",
  "Fee 30 bps tetap": "Fixed 30 bps fee",
  "Bukti on-chain": "On-chain proof",
  "Verifikasi sendiri di explorer →": "Verify it yourself in Explorer →",

  // Pool panel
  "Butuh fee vault ≥ 1 SOL + rent": "Requires fee vault ≥ 1 SOL + rent",
  "MASS SIAP": "MASS READY",
  "MASS MENUNGGU": "MASS WAITING",
  "{pct} → massa": "{pct} → mass",
  "Interval massa": "Mass interval",
  "{n} detik": "{n}s",

  // Stat strip
  "per INRT · constant product": "per INRT · constant product",
  "supply {n} INRT": "supply {n} INRT",
  "Likuiditas (2 sisi)": "Liquidity (both sides)",
  "{amount} SOL sudah ditambahkan": "{amount} SOL added",
  "Fee Vault": "Fee Vault",
  "fee {n} bps → massa": "fee {n} bps → mass",
  "mint authority revoked": "mint authority revoked",

  // Page map
  Transaksi: "Trading",
  "Beli atau jual terhadap pool, lengkap dengan quote dan slippage.":
    "Buy or sell against the pool, with quote and slippage.",
  Likuiditas: "Liquidity",
  "Reserve, aturan add_mass, dan riwayat massa.":
    "Reserve, add_mass rules, and mass history.",
  Distribusi: "Distribution",
  "Pemegang INRT, tier, dan wallet terbesar.":
    "INRT holders, tiers, and the largest wallets.",
  Kebijakan: "Policy",
  "Supply, alokasi, fee, dan kebijakan massa.":
    "Supply, allocation, fees, and mass policy.",
  Panduan: "Guide",
  "Cara mulai, wallet Devnet, dan verifikasi on-chain.":
    "Getting started, Devnet wallets, and on-chain verification.",
  Jelajahi: "Explore",
  "{n} halaman": "{n} pages",
  "Buka →": "Open →",

  // FAQ (overview)
  "Kenapa harga kadang tidak bergerak?": "Why does the price sometimes not move?",
  "Harga hanya berubah saat ada swap. Jam tanpa transaksi tetap digambar sebagai candle flat, jadi grafik tidak bolong. Itu bukan tanda chart rusak.":
    "Price only changes when a swap happens. Quiet hours are still drawn as flat candles, so the chart never has gaps. It is not a broken chart.",
  "Siapa yang bisa menarik likuiditas?": "Who can pull the liquidity?",
  "Tidak ada instruksi withdraw di program. Token hanya keluar dari Mass Reserve lewat add_mass, dan itu menambah likuiditas pool, bukan menguranginya.":
    "The program has no withdraw instruction. Tokens only leave the Mass Reserve through add_mass, and that adds liquidity to the pool instead of removing it.",
  "Ke mana fee 0,30% pergi?": "Where does the 0.30% fee go?",
  "Fee dipotong dari input, disimpan di fee vault terpisah, lalu dipakai keeper untuk add_mass setelah mencapai 1 SOL + rent. Owner tidak bisa mengambilnya langsung.":
    "The fee is deducted from the input, kept in a separate fee vault, then used by the keeper for add_mass once it reaches 1 SOL + rent. The owner cannot take it directly.",
  "Apakah ini mainnet?": "Is this mainnet?",
  "Bukan. Semua alamat di halaman ini ada di Solana Devnet. INRT tidak punya nilai dan tidak dijual.":
    "No. Every address on this page is on Solana Devnet. INRT has no value and is not for sale.",
  "Pertanyaan singkat": "Quick answers",
  "4 hal": "4 points",

  // Tokenomics
  "50 juta INRT, tanpa burn, tanpa curve":
    "50 million INRT, no burn, no curve",
  "Supply tetap dan seluruh fee kembali ke likuiditas. Alokasi di bawah adalah keputusan final; yang belum on-chain adalah diskon tier.":
    "Supply is fixed and every fee returns to liquidity. The allocation below is final; tier discounts are the only part not on-chain yet.",
  "Total supply": "Total supply",
  "fixed · mint authority null": "fixed · mint authority null",
  "Harga awal (P0)": "Initial price (P0)",
  "{n} INRT di pool": "{n} INRT in the pool",
  "FDV saat launch": "FDV at launch",
  "market cap pool {n} SOL": "pool market cap {n} SOL",
  "100% ke massa, 0% treasury": "100% to the mass, 0% treasury",
  Alokasi: "Allocation",
  "6 kategori, total 100%": "6 categories, 100% total",
  terkunci: "locked",
  "Ke mana fee pergi": "Where fees go",
  "per swap": "per swap",
  "Dipotong dari input": "Deducted from the input",
  "Masuk fee vault": "Into the fee vault",
  "Ke treasury": "To treasury",
  "Mengurangi reserve pool": "Reduces the pool reserve",
  tidak: "no",
  "Fee menambah konstanta k sedikit setiap swap. Likuiditas tumbuh tanpa mencetak token baru.":
    "Fees nudge the constant k up on every swap. Liquidity grows without minting new tokens.",
  "Tidak ada burn": "No burn",
  "keputusan v1": "v1 decision",
  "Tidak ada instruksi burn, tidak ada deflasi pura-pura. Nilai datang dari kedalaman likuiditas dan fee yang kembali ke pool, bukan dari supply yang menyusut.":
    "There is no burn instruction and no pretend deflation. Value comes from liquidity depth and fees returning to the pool, not from a shrinking supply.",
  "Tier holder": "Holder tiers",
  "rencana diskon fee": "fee discount plan",
  "belum aktif": "not active yet",
  "Diskon tier belum diimplementasikan: program v1 memakai fee tetap 30 bps dan tidak bisa diubah. Tier saat ini hanya label status.":
    "Tier discounts are not implemented yet: program v1 uses a fixed 30 bps fee that cannot change. Tiers are status labels for now.",
  "Vesting & peredaran": "Vesting & circulation",
  "batas maksimum": "upper bound",
  Beredar: "Circulating",
  "% supply": "% supply",
  "Gerbang Mass II: token treasury/tim tidak masuk peredaran sebelum pool mencapai 100 SOL. Cap unlock 1.500.000 token per bulan.":
    "Mass II gate: treasury/team tokens do not enter circulation before the pool reaches 100 SOL. Unlock cap is 1,500,000 tokens per month.",
  "Kebijakan Mass Reserve": "Mass Reserve policy",
  "20% supply": "20% of supply",
  "Status live →": "Live status →",
  "Alokasi awal": "Initial allocation",
  "hanya untuk add_mass": "only for add_mass",
  "Minimum per panggilan": "Minimum per call",
  "dari fee vault": "from the fee vault",
  "Maksimum per panggilan": "Maximum per call",
  "{pct}% sisa reserve": "{pct}% of remaining reserve",
  "500.000 INRT di awal": "500,000 INRT initially",
  "Toleransi rasio": "Ratio tolerance",
  "harga tidak bergeser > 0,5%": "price shift stays under 0.5%",
  "Pool · The Mass": "Pool · The Mass",
  "Terkunci permanen di pool, tanpa instruksi penarikan.":
    "Permanently locked in the pool, with no withdrawal instruction.",
  "Hanya bisa masuk pool lewat add_mass.":
    "Can only enter the pool through add_mass.",
  "Multisig, tunduk pada gerbang Mass II (pool 100 SOL).":
    "Multisig, subject to the Mass II gate (100 SOL pool).",
  Tim: "Team",
  "Vesting, cap 1.500.000 token per bulan.":
    "Vesting, capped at 1,500,000 tokens per month.",
  "Komunitas / airdrop": "Community / airdrop",
  "Bertahap, berbasis milestone.": "Staged, milestone-based.",
  "Ekosistem / partnership": "Ecosystem / partnership",
  Multisig: "Multisig",
  "19,2%": "19.2%",
  "20,0%": "20.0%",
  "18,8%": "18.8%",
  "16,0%": "16.0%",
  "10,0%": "10.0%",
  "0,30%": "0.30%",
  "0,28%": "0.28%",
  "0,25%": "0.25%",
  "0,20%": "0.20%",
  "0,30": "0.30",
  "Launch (M0)": "Launch (M0)",
  "±16.100.000": "±16,100,000",
  "±26.950.000": "±26,950,000",
  "±35.650.000": "±35,650,000",
  "40.000.000": "40,000,000",
  "32,2%": "32.2%",
  "53,9%": "53.9%",
  "71,3%": "71.3%",
  "80,0%": "80.0%",
  REST: "REST",
  PULL: "PULL",
  MASS: "MASS",
  MOMENTUM: "MOMENTUM",
  INERTIA: "INERTIA",

  // Docs
  "Docs · panduan singkat": "Docs · quick guide",
  "Cara memakai INERTIA di Devnet": "How to use INERTIA on Devnet",
  "Tidak ada akun, tidak ada email, tidak ada custodian. Semua transaksi ditandatangani wallet kamu sendiri.":
    "No account, no email, no custodian. Every transaction is signed by your own wallet.",
  "Siapkan wallet": "Set up a wallet",
  "Pakai Phantom atau Solflare. Buat wallet baru khusus Devnet. Jangan pakai seed wallet mainnet kamu.":
    "Use Phantom or Solflare. Create a fresh wallet just for Devnet. Never use your mainnet wallet seed.",
  "Ambil SOL Devnet": "Get Devnet SOL",
  "Buka faucet resmi Solana, login GitHub, minta SOL Devnet. SOL ini tidak punya nilai uang.":
    "Open the official Solana faucet, sign in with GitHub, and request Devnet SOL. This SOL has no money value.",
  "Hubungkan ke situs": "Connect to the site",
  "Klik Connect di kanan atas dan pastikan wallet berada di network Devnet, bukan Mainnet.":
    "Click Connect in the top right and make sure the wallet is on Devnet, not Mainnet.",
  "Buka Trade, masukkan jumlah SOL, cek price impact dan minimum diterima, lalu konfirmasi di wallet.":
    "Open Trade, enter the SOL amount, check price impact and minimum received, then confirm in your wallet.",
  "Faucet Devnet ↗": "Devnet Faucet ↗",
  "Buka Trade": "Open Trade",
  "Source ↗": "Source ↗",
  "Alamat on-chain": "On-chain addresses",
  "semua Devnet": "all Devnet",
  "klik untuk copy": "click to copy",
  "aturan singkat": "quick rules",
  "Minimum {amount} SOL dari fee vault per panggilan.":
    "Minimum {amount} SOL from the fee vault per call.",
  "Maksimum {pct}% dari sisa Mass Reserve per panggilan.":
    "Maximum {pct}% of the remaining Mass Reserve per call.",
  "Rasio mengikuti harga marginal, toleransi 0,5%.":
    "The ratio follows the marginal price, with 0.5% tolerance.",
  "Tidak ada withdraw: token hanya bisa masuk pool.":
    "No withdraw: tokens can only enter the pool.",
  "Lihat status Mass Reserve →": "View Mass Reserve status →",
  Peringatan: "Warning",
  "Token ini tidak memiliki nilai ekonomi, tidak dijual, dan tidak menjanjikan imbal hasil. Jangan pernah memberi seed phrase atau private key ke siapa pun, termasuk ke situs ini.":
    "This token has no economic value, is not for sale, and promises no returns. Never give your seed phrase or private key to anyone, including this site.",
  FAQ: "FAQ",
  "6 pertanyaan umum": "6 common questions",
  "Program inertia_mass": "Program inertia_mass",
  "upgrade authority terpisah": "separate upgrade authority",
  "Mint INRT": "INRT mint",
  "decimals 6 · mint & freeze authority null":
    "decimals 6 · mint & freeze authority null",
  "Pool state": "Pool state",
  "menyimpan reserve dan fee_bps": "stores reserves and fee_bps",
  "menahan token sisi pool": "holds the pool-side tokens",
  "menahan SOL sisi pool": "holds the pool-side SOL",
  "sumber dana add_mass": "funding source for add_mass",
  "hanya bisa keluar lewat add_mass": "can only leave through add_mass",
  "Kenapa transaksi gagal dengan pesan saldo tidak cukup?":
    "Why does a transaction fail with an insufficient balance message?",
  "Kamu butuh SOL Devnet untuk fee jaringan dan sewa ATA (sekitar 0,003 SOL). Sisakan minimal 0,01 SOL saat membeli.":
    "You need Devnet SOL for network fees and ATA rent (about 0.003 SOL). Leave at least 0.01 SOL when buying.",
  "Apakah ada bonding curve?": "Is there a bonding curve?",
  "Tidak. Harga dibentuk constant-product di pool internal. Tidak ada tahap presale, tidak ada migrasi curve ke pool.":
    "No. Price forms through constant product inside the pool. There is no presale and no curve-to-pool migration.",
  "Bisakah likuiditas ditarik?": "Can the liquidity be pulled?",
  "Tidak. Program tidak punya instruksi withdraw atau close untuk pool. Token di pool terkunci; Mass Reserve hanya bisa masuk lewat add_mass.":
    "No. The program has no withdraw or close instruction for the pool. Tokens in the pool are locked; the Mass Reserve can only enter through add_mass.",
  "Siapa yang menentukan harga?": "Who sets the price?",
  "Rasio reserve di pool. Setiap beli menaikkan harga sedikit, setiap jual menurunkannya. Tidak ada oracle dan tidak ada penetapan harga manual.":
    "The reserve ratio in the pool. Every buy nudges the price up, every sell nudges it down. No oracle, no manual price setting.",
  "Kenapa fee 0,30% tidak masuk LP?": "Why is the 0.30% fee not added to the LP?",
  "Fee disimpan di vault terpisah, bukan di reserve. Saat terkumpul cukup, keeper memanggil add_mass untuk menambah likuiditas permanen.":
    "The fee sits in a separate vault, not in the reserve. Once it is large enough, the keeper calls add_mass to add permanent liquidity.",

  // Halaman
  "Top 10 gabungan · termasuk vault & reserve":
    "Top 10 combined · including vault & reserve",

  // Format angka / label tambahan
  "{pct} terpakai": "{pct} used",
  "Buka {label} di explorer": "Open {label} in Explorer",
  "constant product": "constant product",
  "50.000.000": "50,000,000",
  "10.000.000 INRT": "10,000,000 INRT",
  "9.600.000 INRT": "9,600,000 INRT",
  "9.600.000": "9,600,000",
  "0,000005": "0.000005",
  "0,00000000288": "0.00000000288",
  "0,0288": "0.0288",
  "0,144": "0.144",
  "4,8": "4.8",
};

function applyVars(text: string, vars?: Vars): string {
  if (!vars) return text;
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(String(value));
  }
  return out;
}

/** Terjemahkan teks Indonesia ke bahasa aktif; fallback ke teks asli. */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  const template = lang === "en" ? EN[text] ?? text : text;
  return applyVars(template, vars);
}
