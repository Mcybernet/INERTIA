# Identity Brief — INERTIA

> **Status:** FINAL v1.0 — nama dan logo terkunci. Mekanik dan copy masih bisa berubah.
> **Tanggal:** 2026-11-14
> **Nama:** INERTIA
> **Ticker:** `INRT`
> **Logo:** Center of Mass
> **Terkait:** `NEXT_PROJECT_POOL_LAUNCH.md` (skema pool tanpa curve, budget 50 SOL)

---

## 1. Ringkasan

Inertia adalah hukum pertama Newton: benda yang diam tetap diam, benda yang bergerak tetap bergerak, sampai ada gaya luar yang mengubahnya.

Untuk token, ini punya dua sisi yang keduanya menguntungkan:

- **Sisi diam** — likuiditas terkunci tidak bisa dipindahkan. Tidak ada gaya luar, termasuk tim, yang bisa menariknya.
- **Sisi gerak** — begitu komunitas bergerak, tidak ada yang mudah menghentikannya.

Satu hukum menjelaskan dua hal sekaligus: kenapa pool tidak bisa di-drain, dan kenapa proyek bisa tumbuh.

---

## 2. Nama

| | Nilai |
|---|---|
| Nama | **INERTIA** |
| Ticker | **INRT** |
| Ejaan alternatif | ~~INERSIA~~ (ditolak — dipakai hanya jika `INRT` ternyata tidak tersedia) |

**Alasan:** "Inertia" langsung dimengerti secara global, dan maknanya sudah membawa cerita tanpa perlu dijelaskan panjang.

**Konsekuensi yang harus diterima:** nama ini bertabrakan pencarian dengan Inertia.js (framework web). Mitigasi ada di bagian 11.

---

## 3. Tagline

**Utama:** *Mass resists. Momentum remains.*

**Pendukung:** *Liquidity at rest. Community in motion.*

Aturan: tagline utama dipakai di hero dan profil. Tagline pendukung dipakai di meta description dan materi penjelasan.

---

## 4. Lore

Inertia tidak lahir dari kurva. Tidak ada harga yang naik perlahan, tidak ada tangga yang bisa dinaiki bertahap. Yang ada hanya satu keadaan: massa yang ditempatkan sekali, lalu tidak bergerak.

Di dalam fisika, massa adalah alasan sebuah benda sulit digeser. Di proyek ini, massa adalah likuiditas yang terkunci dan supply yang tidak bisa dicetak ulang. Setiap fee yang masuk tidak diambil — ia ditambahkan kembali ke pool, menambah berat. Pool yang berat tidak bisa digerakkan oleh satu pembeli, dan tidak bisa dikosongkan oleh satu penjual.

Tapi Inertia bukan tentang diam selamanya. Hukum yang sama mengatakan: begitu bergerak, benda tetap bergerak. Komunitas adalah gaya luarnya. Pool tetap di tempatnya; yang berubah adalah jumlah orang yang mendorongnya.

---

## 5. Tier holder

| Tier | Ambang (% supply) | Supply 50 jt | Arti |
|---|---|---|---|
| **REST** | < 0,1% | < 50.000 | Belum ada gaya yang bekerja |
| **PULL** | 0,1–0,5% | 50.000–250.000 | Gaya pertama diterapkan |
| **MASS** | 0,5–1,5% | 250.000–750.000 | Mulai punya berat |
| **MOMENTUM** | 1,5–4% | 750.000–2.000.000 | Bergerak bersama proyek |
| **INERTIA** | > 4% | > 2.000.000 | Keadaan itu sendiri — tidak mudah digeser |

Tier teratas dinamai sama dengan token. Itu disengaja: holder terbesar adalah perwujudan dari konsepnya.

Ambang ini sengaja dinaikkan dari draft awal (1%). Dengan pool 48 SOL, membeli 2.000.000 token butuh sekitar **12,6 SOL** karena slippage — cukup berat untuk benar-benar berarti, tapi masih mungkin.

Tier dipakai untuk dua hal: bobot governance (v1) dan diskon fee (v1.1). Detailnya di `TOKENOMICS_INERTIA.md` §10.

---

## 6. Visual identity

### Palet

| Nama | Hex | Pemakaian |
|---|---|---|
| Ink | `#0A0A0C` | Latar utama |
| Surface | `#121216` | Panel, kartu, modal |
| Rule | `#232329` | Garis pemisah 1px |
| Gold | `#E0A64B` | Satu-satunya aksen |
| Bone | `#E8E2D6` | Teks utama |
| Steel | `#8A8F98` | Teks sekunder, label |
| Up / Down | sesuai UI existing | Harga chart saja |

Aturan: emas hanya untuk penekanan dan logo. Tidak ada gradient, tidak ada glow, tidak ada bayangan berwarna.

### Tipografi

- **Angka & label:** IBM Plex Mono, uppercase, tracking lebar, 10–11px.
- **Judul:** Inter atau Archivo, berat 600–700, tracking rapat.
- Tidak ada italic. Tidak ada drop cap. Tidak ada ornamen.

### Logo — Center of Mass

**Ide:** massa itu bulat dan berat, tapi titik beratnya tidak pernah tepat di tengah. Itu yang membuat benda punya karakter.

**Konstruksi (kanvas 100 × 100):**

| Elemen | Ukuran | Posisi |
|---|---|---|
| Cakram | diameter 100 | pusat kanvas |
| Titik | diameter 12 | offset 22 dari pusat, arah 45° (kanan-bawah) |
| Clear space | 24 | di sekeliling cakram |

**Proporsi kecil (≤ 32px):** titik dibesarkan ke diameter 14, offset dikurangi ke 20. Ini supaya titik tidak hilang di favicon 16px.

**Warna:**

| Varian | Cakram | Titik | Latar |
|---|---|---|---|
| Primer | Gold `#E0A64B` | Ink `#0A0A0C` | Gelap |
| Monokrom | Bone `#E8E2D6` | Ink `#0A0A0C` | Gelap |
| Inverse | Ink `#0A0A0C` | Gold `#E0A64B` | Terang |

**Catatan penting:** titik harus **kecil dan jauh dari pusat**. Kalau titiknya besar atau dekat tengah, logo akan terbaca seperti mata. Proporsi 12/22 sudah diuji untuk menghindari itu.

**Ukuran minimum:** 16px. Di bawah itu pakai varian tanpa titik (cakram saja) atau wordmark.

**Gerak:** tidak ada. Logo ini statis — itu intinya.

### Aturan gerak UI

- Durasi 400–800ms, easing tanpa bounce.
- Tidak ada spring, parallax, partikel, atau blur gerak.
- Satu-satunya animasi yang diizinkan: perubahan opacity dan translasi kecil.

### Larangan

- Gradient, glow, glassmorphism.
- Sudut membulat (radius harus 0).
- Efek "speed line".
- Warna di luar palet, kecuali merah/hijau khusus candle.

---

## 7. Nama internal & copy

| Elemen | Nama |
|---|---|
| Pool | **The Mass** |
| Likuiditas terkunci | **At Rest** |
| Status pool aktif | **In Motion** |
| Penambahan likuiditas | **Gaining Mass** |
| Chart kosong | *"At rest. No force applied yet."* |
| Volume | *Velocity* |
| Likuiditas | *Mass* |

### Copy pendek

- *"The pool does not move. The chart does."*
- *"Every fee adds weight."*
- *"No key. By design."*
- *"Mass is earned, not promised."*

Catatan: kata-kata fisika hanya dipakai di permukaan brand. Di UI trading tetap pakai **Buy / Sell / Price / Volume** — kegunaan tidak boleh dikorbankan demi estetika.

---

## 8. Mekanik yang mendukung cerita

**Fee menjadi massa.**

Setiap swap menghasilkan fee 0,30% dalam SOL. Fee itu tidak ditarik, tapi dipasangkan dengan token dari treasury sesuai harga saat ini, lalu ditambahkan ke pool.

- Ditambahkan pada rasio saat ini → **harga tidak berubah**.
- Pool jadi lebih dalam → pergerakan harga makin berat.
- Tidak menimbulkan gap candle, karena harga di titik penambahan tetap sama.

Jadi "gaining mass" adalah mekanisme nyata, bukan slogan. Setiap penambahan bisa ditampilkan on-chain sebagai bukti.

---

## 9. Tokenomics ringkas

Mengikuti `NEXT_PROJECT_POOL_LAUNCH.md`:

| Item | Nilai |
|---|---|
| Total supply | 50.000.000 |
| Harga awal | 0,000005 SOL |
| Token di pool | 9.600.000 |
| SOL di pool | 48 |
| FDV saat launch | 250 SOL |
| Fee | 0,30% |

---

## 10. Landing page copy

### Header
- Eyebrow: `NO CURVE. NO DRIFT.`
- H1: **Mass resists. Momentum remains.**
- Sub: *Liquidity locked at rest. Community set in motion. Every fee adds weight.*
- CTA primer: **Add Mass**
- CTA sekunder: **Read the mechanics**

### Stats

| Label | Isi |
|---|---|
| MASS | likuiditas pool dalam SOL |
| VELOCITY | volume 24 jam |
| HOLDERS | jumlah holder |
| FDV | fully diluted value |

### Section 1 — At rest
**Judul:** *The pool does not move.*
**Isi:** Likuiditas masuk sekali dan terkunci. Tidak ada kunci, tidak ada admin, tidak ada jalur keluar — bahkan untuk tim. Bisa diverifikasi on-chain kapan saja.

### Section 2 — In motion
**Judul:** *The community does.*
**Isi:** Setiap holder menambah gaya. Tier dari REST sampai INERTIA menunjukkan seberapa besar massa yang kamu bawa.

### Section 3 — Gaining mass
**Judul:** *Every fee adds weight.*
**Isi:** Fee dari setiap swap dipasangkan dan dimasukkan kembali ke pool. Harga tidak berubah, tapi pool makin dalam. Mass I 48 SOL → Mass II 100 SOL → Mass III 250 SOL.

### Tier section
**Judul:** *How heavy are you?*

### Footer
*The pool does not move. The chart does.*

### Empty state
*At rest. No force applied yet.*

### Disclaimer
*INERTIA is an experimental token on Solana Devnet. Nothing here is financial advice.*

---

## 11. Risiko nama

| Risiko | Tingkat | Mitigasi |
|---|---|---|
| Tabrakan pencarian dengan **Inertia.js** | Tinggi | Selalu tampil bersama ticker `INRT`; wordmark khas; meta title `INERTIA (INRT) — liquidity at rest`; domain dan handle sendiri |
| Terdengar pasif / lambat | Sedang | Tagline selalu memasangkan "mass" dengan "momentum" |
| Kesan terlalu teknis | Rendah | Copy tetap pendek dan manusiawi |
| Logo terbaca seperti mata | Sedang | Titik kecil (12%) dan offset jauh (22%); uji di 16px |

---

## 12. Checklist sebelum launch

**Nama & kanal**
- [ ] Ticker `INRT` tersedia di CoinGecko/CoinMarketCap.
- [ ] Domain: `inrt.xyz`, `inertia.xyz`, `getinertia.xyz`.
- [ ] Handle X, GitHub, Telegram, Discord.
- [ ] Merek dagang di kelas relevan.
- [ ] Meta title dan description sudah membedakan dari Inertia.js.

**Aset desain**
- [ ] Logo SVG: primer (emas), monokrom (tulang), inverse (hitam).
- [ ] Favicon 32×32 dan 16×16.
- [ ] Avatar 400×400 untuk X/Discord/Telegram.
- [ ] Banner 1500×500.
- [ ] Uji logo di 16px, 32px, dan 128px.
- [ ] Uji logo versi gelap, terang, dan monokrom.

**Metadata token**
- [ ] Nama: `INERTIA`, simbol: `INRT`, decimals: 6.
- [ ] URI logo di-host permanen (Arweave atau IPFS), bukan URL lokal.
- [ ] Metadata dan logo bisa dibaca wallet (Phantom/Solflare).

**Dokumen**
- [ ] Palet dan tipografi terdokumentasi untuk developer.
- [ ] Copy landing page final.
- [ ] Disclaimer terpasang di landing dan docs.

---

## 13. Pertanyaan terbuka

Scope: **Devnet saja.** Keputusan mekanik sudah dikunci di `TOKENOMICS_INERTIA.md` §8.

- [ ] Tagline final: *Mass resists. Momentum remains.* atau *Liquidity at rest. Community in motion.*?
- [ ] Utility holder v1.1: governance saja, atau plus diskon fee berbasis tier?
- [ ] Nama program on-chain.
- [ ] Tanggal seed Devnet — TBD, bukan public launch.
