# Lumbung

Congklak / dakon, with the regional rule variants made explicit, cited, and
selectable — instead of one anonymous ruleset presented as "the" rules.

Static site. No backend, no accounts, no analytics. See [PRD.md](PRD.md) for scope
and [CLAUDE.md](CLAUDE.md) for how to work in the repo.

## Menjalankan

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build                # ekspor statis ke ./out; rulesets:validate jalan lebih dulu
pnpm preview              # sajikan ./out di bawah basePath produksi
```

## Yang sudah ada

| | |
|---|---|
| **M0** Scaffold | Ekspor statis, skema ruleset, validator yang menggagalkan build |
| **M1** Mesin | Penaburan dengan sambung, menembak, giliran lagi, syarat akhir, aliran event |
| **M2** Hotseat | Papan, animasi penaburan, kontrol kecepatan, menang dan seri |
| **M3** AI + pratinjau | Minimax alpha-beta di worker, tiga tingkat kesulitan, pratinjau langkah |
| **M4** Ruleset | Tiga pack bersumber, pemilih aturan, halaman banding, halaman sumber |
| **M5** P2P | WebRTC tempel-manual dan kode pendek lewat broker, jabat tangan id aturan, hash tiap giliran |
| **M6** | Penampil ulangan dari kode permainan, mode belajar, statistik lokal |

Semua milestone PRD sudah ada. Yang sengaja ditunda dan tercatat sebagai
perbedaan di pack masing-masing: langkah pertama serentak, permainan beberapa
babak dengan lubang terbakar, dan papan lima/sembilan/sebelas lubang — ketiganya
non-goal PRD §4 atau butuh topologi yang bisa berubah ukuran.

## Aturan adalah data

Setiap ruleset adalah satu pack JSON di `data/rulesets/`, divalidasi dengan Zod
dan digerbangi oleh build. Tidak ada satu pun cabang kode per daerah di dalam
mesin — kalau sebuah varian butuh perilaku yang belum bisa diungkapkan skema,
skemanya yang diperluas.

Tiga pack yang dikirim berbeda hanya di tempat yang ada sumbernya, dan uji
pemisahan menggagalkan build kalau daftar itu bertambah:

| Pack | Berbeda dari `umum` pada |
|---|---|
| `umum` | — bacaan yang paling luas dipakai |
| `jawa-sleman` | syarat berhenti (tiga lubang kosong) dan sapu akhir |
| `congkak-melayu` | menembak hanya sesudah satu pusingan penuh |

Ruleset ketiga ditambahkan justru karena penelusurannya menemukan aturan yang
skemanya belum bisa ungkapkan — bukan sekadar untuk menggenapkan jumlah. Pack
yang berbeda di tempat tanpa sumber bukan ruleset, hanya selera.

Tiga hal yang dibawa tiap pack di luar aturan itu sendiri:

- **`confidence` pada tiap sumber** — `terverifikasi` atau `perlu-cek`.
  Ditampilkan apa adanya di halaman Aturan.
- **`divergences`** — di mana pack ini sengaja berbeda dari bacaan lain yang
  terdokumentasi, lengkap dengan sumber yang berbicara soal itu. Saat sumber
  bertentangan, keduanya dicatat, bukan dipilih diam-diam. Termasuk saat satu
  sumber bertentangan dengan dirinya sendiri.
- **Bobot sumber dinyatakan**, bukan diratakan. Sumber pemerintah, rujukan
  khusus, dan media massa dibedakan di catatan masing-masing. Satu keterangan
  media yang membalik aturan menembak dicatat sebagai perbedaan dan **tidak**
  diterapkan, karena berlawanan dengan sumber pemerintah maupun rujukan khusus.

Menambah pack: tulis JSON-nya, sertakan sumber, jalankan `pnpm rulesets:validate`.
Tanpa sumber, build gagal.

## Uji

```bash
pnpm test:run             # semua, sebelum tiap commit
pnpm test:determinism     # putar ulang + kesepakatan antar-instans
pnpm test:sim             # ribuan permainan acak per ruleset
```

Konservasi biji diuji sesudah setiap event di setiap uji, termasuk uji AI dan
simulasi. Ada tepat 98 biji dan tidak pernah selain itu — kecuali satu jalan
yang memang mengeluarkannya dari hitungan, sapu akhir `dibuang`, yang
menurunkan `seedsInPlay` sekali dan tetap mencatat berapa yang keluar.

## Struktur

```
lib/engine/     mesin murni: papan, applyMove, penaburan, event, hash, putar ulang
lib/rulesets/   skema, pemuat
lib/ai/         minimax, evaluasi — murni, jam disuntikkan pemanggil
workers/        pencarian AI, tempat jamnya berada
lib/learn/      posisi pelajaran, dengan klaim hasil yang diuji
components/     papan, pemutar aliran event, pratinjau, sambungan, belajar
data/rulesets/  pack JSON bersumber
tests/          fixture per aturan, konservasi, sambung, determinisme, simulasi
```

Mesin tidak mengimpor apa pun dari React, Next, `components/`, DOM, atau jaringan.
