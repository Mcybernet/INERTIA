# Aset metadata INRT

File di folder ini dipakai sebagai metadata off-chain token (Metaplex):

| File | Fungsi |
|---|---|
| `inertia.json` | JSON metadata (name, symbol, description, image) |
| `inertia-logo.png` | Logo 512×512, emas `#E0A64B` di ink `#0A0A0C` |

Keduanya disajikan lewat jsDelivr dari repo publik:

- `https://cdn.jsdelivr.net/gh/Mcybernet/INERTIA@main/assets/inertia.json`
- `https://cdn.jsdelivr.net/gh/Mcybernet/INERTIA@main/assets/inertia-logo.png`

Kalau isi diubah, URI metadata on-chain tidak perlu diganti selama path-nya
sama (`@main` mengikuti commit terbaru).

Logo dibuat dari SVG flat (tanpa gradient/glow), radius 0, aksen emas.
