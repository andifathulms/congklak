<div align="center">

<img src="public/icon-192.png" alt="Congklak" width="96" height="96">

# Congklak

**Congklak / dakon / congkak — dengan varian aturan tiap daerah dibuat terang, bersumber, dan bisa dipilih,**
**alih-alih satu aturan tanpa nama yang disodorkan sebagai "aturannya".**

[**▶ Main sekarang**](https://andifathulms.github.io/congklak/) · [PRD](PRD.md) · [Panduan repo](CLAUDE.md)

[![deploy](https://github.com/andifathulms/congklak/actions/workflows/deploy.yml/badge.svg)](https://github.com/andifathulms/congklak/actions/workflows/deploy.yml)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![tests](https://img.shields.io/badge/uji-120%20kasus-4c1)](tests)
[![biji](https://img.shields.io/badge/biji-98%20selalu-A8863C)](lib/engine/conserve.ts)
[![no backend](https://img.shields.io/badge/backend-tidak%20ada-555)](https://andifathulms.github.io/congklak/)

</div>

---

Congklak dimainkan di seluruh Nusantara dengan banyak nama — dakon di Jawa, congkak di
Sumatra dan Semenanjung, aggalacang di Sulawesi, dentuman lamban di Lampung — dan
**aturannya memang berbeda-beda.** Kapan permainan berhenti? Biji terakhir di lubang kosong
sisi sendiri menembak, atau justru mematikan giliran? Perlu satu pusingan penuh dulu sebelum
boleh menembak?

Sumber-sumber saling bertentangan soal ketiganya. Aplikasi congklak yang ada memilih satu
bacaan diam-diam lalu menyebutnya "aturan congklak". Proyek ini memperlakukan pertentangan
itu sebagai isinya: **aturan adalah data bersumber**, yang sedang dipakai selalu disebut
namanya, dan di mana dua bacaan berselisih, keduanya dicatat lengkap dengan bobot sumbernya.

## Isinya

| | |
|---|---|
| 🪵 **Papan terukir** | Satu bentuk kayu utuh dengan lubang sebagai cerukan — bukan empat belas lingkaran. Berdiri tegak di ponsel, tetap searah jarum jam. |
| 🌾 **Animasi penaburan** | Momen khas congklak: satu giliran bisa menyambung mengelilingi papan berkali-kali. Ada kontrol kecepatan; `prefers-reduced-motion` langsung memberi ringkasan tertulis. |
| 👁 **Pratinjau langkah** | Arahkan ke lubang: di mana rantainya berhenti, berapa biji masuk lumbung, apakah menembak atau memberi giliran lagi. |
| 🤖 **AI di worker** | Minimax alpha-beta, pendalaman bertahap, tiga tingkat kesulitan. Informasi terbuka penuh — tanpa keuntungan yang dikarang. |
| 📜 **Tiga ruleset bersumber** | Pemilih aturan, halaman sumber lengkap dengan tingkat keyakinan, dan daftar perbedaan antar-bacaan. |
| ⚖️ **Halaman banding** | Satu daftar langkah diputar di bawah dua ruleset sekaligus, dengan titik perbedaan pertama ditandai. |
| 🔗 **Main berdua lintas perangkat** | WebRTC: tempel-manual maupun kode pendek lewat broker. Jabat tangan id aturan saat sambung, hash tiap giliran. |
| 🎓 **Mode belajar & ulangan** | Tiga posisi papan sungguhan alih-alih tiga paragraf, dan penampil ulangan dari kode permainan. |

Semua milestone PRD (M0–M6) sudah ada. Statistik lokal di `localStorage`. Tanpa akun,
tanpa iklan, tanpa analitik.

<details>
<summary><b>Rincian per milestone</b></summary>

<br>

| | |
|---|---|
| **M0** Scaffold | Ekspor statis, skema ruleset, validator yang menggagalkan build |
| **M1** Mesin | Penaburan dengan sambung, menembak, giliran lagi, syarat akhir, aliran event |
| **M2** Hotseat | Papan, animasi penaburan, kontrol kecepatan, menang dan seri |
| **M3** AI + pratinjau | Minimax alpha-beta di worker, tiga tingkat kesulitan, pratinjau langkah |
| **M4** Ruleset | Tiga pack bersumber, pemilih aturan, halaman banding, halaman sumber |
| **M5** P2P | WebRTC tempel-manual dan kode pendek lewat broker, jabat tangan id aturan, hash tiap giliran |
| **M6** Poles | Penampil ulangan dari kode permainan, mode belajar, statistik lokal |

Yang sengaja ditunda dan tercatat sebagai perbedaan di pack masing-masing: langkah pertama
serentak, permainan beberapa babak dengan lubang terbakar, dan papan lima/sembilan/sebelas
lubang — ketiganya non-goal PRD §4 atau butuh topologi yang bisa berubah ukuran.

</details>

## Menjalankan

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build                # ekspor statis ke ./out; rulesets:validate jalan lebih dulu
pnpm preview              # sajikan ./out di bawah basePath produksi
```

Butuh Node 24 dan pnpm 9. Situs statis sepenuhnya — tidak ada server, tidak ada
pengambilan data saat jalan.

## Aturan adalah data

Setiap ruleset adalah satu pack JSON di [`data/rulesets/`](data/rulesets), divalidasi dengan
Zod dan digerbangi oleh build. Tidak ada satu pun cabang kode per daerah di dalam mesin —
kalau sebuah varian butuh perilaku yang belum bisa diungkapkan skema, skemanya yang
diperluas.

Tiga pack yang dikirim berbeda hanya di tempat yang ada sumbernya, dan uji pemisahan
menggagalkan build kalau daftar itu bertambah:

| Pack | Daerah | Berbeda dari `umum` pada | Sumber |
|---|---|---|---|
| [`umum`](data/rulesets/umum.json) | Nusantara, bacaan umum | — | Rujukan khusus mancala + media massa |
| [`jawa-sleman`](data/rulesets/jawa-sleman.json) | Sleman, DIY | Syarat berhenti (tiga lubang kosong) dan sapu akhir | Pemerintah Kalurahan se-Kab. Sleman, Dinas Kebudayaan Bantul |
| [`congkak-melayu`](data/rulesets/congkak-melayu.json) | Semenanjung Melayu | Menembak hanya sesudah satu pusingan penuh | JKKN, Kementerian Pelancongan Seni dan Budaya Malaysia |

Ruleset ketiga ditambahkan justru karena penelusurannya menemukan aturan yang skemanya belum
bisa ungkapkan — bukan sekadar untuk menggenapkan jumlah. Pack yang berbeda di tempat tanpa
sumber bukan ruleset, hanya selera.

Tiga hal yang dibawa tiap pack di luar aturan itu sendiri:

- **`confidence` pada tiap sumber** — `terverifikasi` atau `perlu-cek`. Ditampilkan apa
  adanya di halaman Aturan.
- **`divergences`** — di mana pack ini sengaja berbeda dari bacaan lain yang terdokumentasi,
  lengkap dengan sumber yang berbicara soal itu. Saat sumber bertentangan, keduanya dicatat,
  bukan dipilih diam-diam. Termasuk saat satu sumber bertentangan dengan dirinya sendiri.
- **Bobot sumber dinyatakan**, bukan diratakan. Sumber pemerintah, rujukan khusus, dan media
  massa dibedakan di catatan masing-masing. Satu keterangan media yang membalik aturan
  menembak dicatat sebagai perbedaan dan **tidak** diterapkan, karena berlawanan dengan
  sumber pemerintah maupun rujukan khusus.

> **Menambah pack:** tulis JSON-nya, sertakan sumber, jalankan `pnpm rulesets:validate`.
> Tanpa sumber, build gagal.

## Yang menopang semuanya

**`applyMove(state, move, ruleset) → { state, events }` murni dan deterministik.** Tanpa jam,
tanpa acak yang tak berbenih, tanpa bilangan pecahan, tanpa iterasi koleksi tak berurut.
Masukan sama memberi keluaran identik bita demi bita di perangkat mana pun — dan dari satu
sifat itulah putar ulang, undo, pencarian AI, dan sinkronisasi P2P semuanya mengalir.

**Satu permainan adalah daftar langkahnya ditambah id rulesetnya.** Keadaan papan tidak
pernah jadi sumber kebenaran; selalu bisa disusun ulang dengan memutar langkah. Karena itu
kode permainan yang bisa dibagikan, penampil ulangan, dan pemulihan desync nyaris gratis.

**Konservasi biji ditegaskan, bukan diandaikan.** Ada tepat 98 biji.
[`conserve.ts`](lib/engine/conserve.ts) menjumlahkan keenambelas posisi sesudah setiap event,
di setiap uji dan di build pengembangan — ditulis *sebelum* gelung penaburan, bukan sesudah.
Gelung sambung yang menjatuhkan atau menggandakan satu biji adalah bug klasik mancala, dan
ia sepenuhnya senyap: permainannya jalan terus, cuma salah.

**Perender tidak memutuskan apa pun.** Satu giliran memancarkan aliran event berurut —
`scoop`, `sow`, `relay`, `bank`, `capture`, `extraTurn`, `end` — dan animasinya hanya
memutarnya kembali.

**Lapisan jaringan tidak tahu aturan.** Hanya langkah dan hash yang melintas kabel, tidak
pernah keadaan papan. Kedua sisi mencocokkan id ruleset saat sambung; kalau hash tiap giliran
berselisih, permainan berhenti dan melapor ke keduanya, bukan diam-diam mempercayai satu sisi.

## Uji

```bash
pnpm test:run             # semua, sebelum tiap commit
pnpm test:determinism     # putar ulang + kesepakatan antar-instans
pnpm test:sim             # ribuan permainan acak per ruleset
pnpm typecheck && pnpm lint
```

120 kasus uji di 13 berkas: fixture aturan yang ditulis tangan per ruleset, konservasi,
rantai sambung panjang yang dibuat seadversarial mungkin, determinisme dan putar ulang,
pemisahan antar-ruleset, kewarasan AI, reducer sesi P2P, dan simulasi.

Konservasi biji diuji sesudah setiap event di setiap uji, termasuk uji AI dan simulasi. Ada
tepat 98 biji dan tidak pernah selain itu — kecuali satu jalan yang memang mengeluarkannya
dari hitungan, sapu akhir `dibuang`, yang menurunkan `seedsInPlay` sekali dan tetap mencatat
berapa yang keluar.

> Uji hijau tidak cukup. Setiap bug antarmuka di proyek ini tak terlihat oleh uji yang hijau
> dan ekspor statis yang bersih — huruf yang dideklarasikan tapi tak pernah dimuat, papan
> yang menciut jadi 160px di ponsel, AI yang tak pernah melangkah di kecepatan beranimasi.
> Jalankan aplikasinya, kemudikan kedua sisi sambungan, dan ukur halaman yang benar-benar
> tampil.

## Struktur

```
app/[locale]/   id (bawaan) dan en — main, tanding, banding, aturan, ulang, belajar
lib/engine/     mesin murni: papan, applyMove, penaburan, event, hash, putar ulang
lib/rulesets/   skema, pemuat
lib/ai/         minimax, evaluasi — murni, jam disuntikkan pemanggil
lib/net/        transport saja: protokol, sesi, tempel-manual, broker
workers/        pencarian AI, tempat jamnya berada
lib/learn/      posisi pelajaran, dengan klaim hasil yang diuji
components/     papan, pemutar aliran event, pratinjau, sambungan, belajar, primitif ui
data/rulesets/  pack JSON bersumber
tests/          fixture per aturan, konservasi, sambung, determinisme, simulasi
```

Mesin tidak mengimpor apa pun dari React, Next, `components/`, DOM, atau jaringan.

## Tumpukan

Next.js 14 (App Router, `output: 'export'`) · React 18 · TypeScript `strict` · Tailwind CSS ·
Zod · Vitest · pnpm · PeerJS (diimpor dinamis, hanya untuk isyarat lewat broker — tempel
manual tetap jalan tanpanya).

Lima kebergantungan saat jalan. Tanpa kerangka permainan, tanpa pustaka state, tanpa pustaka
pencarian, tanpa pustaka animasi.

## Sebar

`main` di-build dan disebar lewat GitHub Actions ke GitHub Pages; validasi ruleset
menggerbanginya, jadi pack tanpa sumber gagal di CI alih-alih ikut terkirim.

---

<div align="center">

Dibuat oleh **Andi Fathul Mukminin Salahuddin** · Sumber terbuka, proyek kebudayaan

*lumbung · biji · menembak · dakon* — kosakatanya dipertahankan, di kode maupun di layar.

</div>
