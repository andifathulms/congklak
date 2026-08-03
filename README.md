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

Belum ada: P2P (M5), penampil ulangan, mode belajar, statistik lokal (M6), dan
ruleset kedua (M4).

## Aturan adalah data

Setiap ruleset adalah satu pack JSON di `data/rulesets/`, divalidasi dengan Zod
dan digerbangi oleh build. Tidak ada satu pun cabang kode per daerah di dalam
mesin — kalau sebuah varian butuh perilaku yang belum bisa diungkapkan skema,
skemanya yang diperluas.

Dua hal yang dibawa tiap pack di luar aturan itu sendiri:

- **`confidence` pada tiap sumber** — `terverifikasi` atau `perlu-cek`. Dua sumber
  pack `umum` saat ini bertanda **perlu-cek**: rumusannya belum diadu langsung
  dengan terbitan aslinya. Ditampilkan apa adanya di halaman Aturan.
- **`divergences`** — di mana pack ini sengaja berbeda dari bacaan lain yang
  terdokumentasi. Saat sumber bertentangan, keduanya dicatat, bukan dipilih diam-diam.

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
components/     papan, pemutar aliran event, pratinjau
data/rulesets/  pack JSON bersumber
tests/          fixture per aturan, konservasi, sambung, determinisme, simulasi
```

Mesin tidak mengimpor apa pun dari React, Next, `components/`, DOM, atau jaringan.
