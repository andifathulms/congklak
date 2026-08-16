/**
 * Indonesian first, English secondary (PRD §11).
 *
 * The traditional vocabulary is not translated. lumbung, biji, menembak,
 * dakon and congklak stay as they are in both languages, glossed on first
 * use — flattening them to "store", "stones" and "capture" is precisely
 * what this project exists not to do.
 */
export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

interface Dict {
  readonly judul: string
  readonly tagline: string
  readonly papan: string
  readonly bukaPapan: string
  readonly contohJudul: string
  readonly contohIntro: string
  readonly contohTujuan: string
  readonly contohLewatiLumbung: string
  readonly contohLangkahKe: string
  readonly contohSebelum: string
  readonly contohBerikut: string
  readonly contohUlang: string
  readonly contohAwal: string
  readonly contohAmbil: string
  readonly contohJatuh: string
  readonly contohLumbung: string
  readonly contohSelesai: string
  readonly contohPapanIni: string
  readonly rujukanAturan: string
  readonly rujukanSumber: string
  readonly rujukanUniversal: string
  readonly aiJujur: string
  readonly buktiPapanIni: string
  readonly buktiPapanLain: string
  readonly buktiTakSah: string
  readonly papanLabel: string
  readonly lubangLabel: string
  readonly sisimu: string
  readonly sisiLawan: string
  readonly bisaDitabur: string
  readonly kosongLabel: string
  readonly lumbungLabel: string
  readonly barisLabel: string
  readonly beranda: string
  readonly berandaIntro: string
  readonly nilai1: string
  readonly nilai2: string
  readonly nilai3: string
  readonly caraMain: string
  readonly giliranmuAjakan: string
  readonly giliranLawanAjakan: string
  readonly mainPakai: string
  readonly salin: string
  readonly tersalin: string
  readonly permainan: string
  readonly animasi: string
  readonly unggul: string
  readonly imbang: string
  readonly bahasa: string
  readonly hotseat: string
  readonly duaPemain: string
  readonly lawanAi: string
  readonly ai: string
  readonly mudah: string
  readonly sulit: string
  readonly berpikir: string
  readonly diTangan: string
  readonly pratinjau: string
  readonly pratinjauPetunjuk: string
  readonly giliran: string
  readonly pemain: string
  readonly menang: string
  readonly seri: string
  readonly permainanBaru: string
  readonly urung: string
  readonly lewati: string
  readonly kecepatan: string
  readonly suara: string
  readonly suaraHidup: string
  readonly suaraMati: string
  readonly mode: string
  readonly kesulitan: string
  readonly pelan: string
  readonly sedang: string
  readonly cepat: string
  readonly langsung: string
  readonly aturan: string
  readonly aturanIntro: string
  readonly dipakaiDiSini: string
  readonly sumber: string
  readonly perbedaan: string
  readonly kembali: string
  readonly rulesetAktif: string
  readonly riwayat: string
  readonly kodePermainan: string
  readonly glosarium: string
  readonly kembaliKeDaftar: string
  readonly lumbungGloss: string
  readonly bijiGloss: string
  readonly menembakGloss: string
  readonly bacaanLain: string
  readonly perluCek: string
  readonly terverifikasi: string
  readonly skor: string
  readonly belumAdaLangkah: string
  readonly perbedaanCount: string
  readonly statusDapatDibandingkan: string
  readonly statusDiterapkan: string
  readonly statusDicatat: string
  readonly statusJelasDibandingkan: string
  readonly statusJelasDiterapkan: string
  readonly statusJelasDicatat: string
  readonly perbedaanRingkas: string
  readonly buktiJudul: string
  readonly buktiTeks: string
  readonly buktiTakAda: string
  readonly buktiCara: string
  readonly aturanLainJudul: string
  readonly aturanLainSama: string
  readonly aturanLainBeda: string
  readonly aturanLainCatatan: string
  readonly alasanRingkasPapan: string
  readonly alasanRingkasSelesai: string
  readonly alasanRingkasTakSah: string
  readonly gantiSaatJalan: string
  readonly banding: string
  readonly bandingIntro: string
  readonly simpangDi: string
  readonly berbeda: string
  readonly takAdaSimpang: string
  readonly giliranKe: string
  readonly acakUlang: string
  readonly alasanPapan: string
  readonly alasanSelesai: string
  readonly alasanTakSah: string
  readonly ulang: string
  readonly ulangIntro: string
  readonly muatKode: string
  readonly kodeTakValid: string
  readonly langkah: string
  readonly statistik: string
  readonly bankTerbesar: string
  readonly sambungTerpanjang: string
  readonly dimainkan: string
  readonly menangA: string
  readonly menangB: string
  readonly tanding: string
  readonly tandingIntro: string
  readonly jadiTuanRumah: string
  readonly jadiTamu: string
  readonly salinTawaran: string
  readonly salinJawaban: string
  readonly tempelTawaran: string
  readonly tempelJawaban: string
  readonly sambung: string
  readonly giliranmu: string
  readonly giliranLawan: string
  readonly tanpaTurn: string
  readonly koneksi_baru: string
  readonly koneksi_menunggu: string
  readonly koneksi_tersambung: string
  readonly koneksi_putus: string
  readonly koneksi_gagal: string
  readonly belajar: string
  readonly teka: string
  readonly tekaIntro: string
  readonly tekaSasaran: string
  readonly tekaBerhasil: string
  readonly tekaBelum: string
  readonly tekaCapai: string
  readonly tekaCapaiLagi: string
  readonly tekaPetunjuk: string
  readonly tekaLihatPetunjuk: string
  readonly tekaBerikutnya: string
  readonly tekaUlangi: string
  readonly tekaSelesai: string
  readonly tekaCatatan: string
  readonly belajarIntro: string
  readonly pilihLubang: string
  readonly tepat: string
  readonly belumTepat: string
  readonly ulangiPosisi: string
  readonly pelajaranBerikutnya: string
  readonly mainSekarang: string
  readonly belajarCatatan: string
  readonly caraSambung: string
  readonly jalurBroker: string
  readonly jalurManual: string
  readonly jalurBrokerCatatan: string
  readonly jalurManualCatatan: string
  readonly brokerGagal: string
  readonly kodeSambungan: string
  readonly masukkanKode: string
  readonly caraHarusSama: string
  readonly sambungGagal: string
  readonly iniKodePendek: string
  readonly tempelanTakTerbaca: string
}

const id: Dict = {
  judul: 'Congklak',
  tagline: 'Congklak dengan aturan kedaerahan yang eksplisit dan bersumber.',
  papan: 'Papan',
  bukaPapan: 'Buka papan',
  contohJudul: 'Satu giliran, langkah demi langkah',
  contohIntro: 'Papannya punya 14 lubang kecil dan dua lumbung — lubang besar di kedua ujung. Barisan bawah milikmu, lumbung kirimu juga. Di permainan penuh tiap lubang kecil mulai dengan 7 biji, 98 biji seluruhnya.',
  contohTujuan: 'Yang menang adalah yang paling banyak mengumpulkan biji di lumbungnya sendiri.',
  contohLewatiLumbung: 'Lumbung lawan selalu dilewati — kamu tidak pernah menabur ke sana. Giliran contoh ini berhenti sebelum sampai ke situ, jadi hal itu tidak terlihat di sini.',
  contohLangkahKe: 'Langkah {n} dari {total}',
  contohSebelum: 'Sebelumnya',
  contohBerikut: 'Berikutnya',
  contohUlang: 'Ulang dari awal',
  contohAwal: 'Posisi awal. Lubang 4 di barisanmu berisi 5 biji, dan giliranmu. Lubang lain sengaja dikosongkan supaya jalannya biji mudah diikuti.',
  contohAmbil: 'Ambil semua {n} biji dari lubang {i}. Lubang itu jadi kosong, dan {n} biji ada di tangan.',
  contohJatuh: 'Jatuhkan satu biji ke lubang {i}: {a} → {b}. Sisa di tangan: {s}.',
  contohLumbung: 'Lubang besar di ujung ini lumbungmu. Biji yang melewatinya masuk ke dalam: {a} → {b}. Sisa di tangan: {s}.',
  contohSelesai: 'Biji terakhir jatuh di lubang kosong milik lawan, jadi giliran ini habis. Satu biji sudah tersimpan di lumbung.',
  rujukanAturan: 'Aturan yang menentukan',
  rujukanSumber: 'Sumber',
  rujukanUniversal: 'Berlaku di semua bacaan — bukan pilihan pack ini.',
  buktiPapanIni: 'Papan di bacaan pak ini, sesudah giliran itu',
  buktiPapanLain: 'Papan di bacaan lain, sesudah giliran yang sama',
  buktiTakSah: 'Langkah itu sudah tidak sah di bacaan ini — permainannya berhenti lebih dulu.',
  aiJujur: 'AI-nya mencari beberapa langkah ke depan lalu menilai papannya dengan bobot yang ditulis tangan — selisih lumbung, peluang menembak, giliran tambahan. Bobot itu pendapat, bukan aturan bersumber seperti isi halaman Aturan, dan tidak ada sumber yang bisa dirujuk untuknya. AI tidak melihat apa pun yang tidak kamu lihat: congklak permainan informasi terbuka, dan tingkat kesulitan hanya mengubah sedalam apa ia mencari.',
  contohPapanIni: 'Papan contoh — sengaja diisi sedikit biji supaya terbaca. Papan yang bisa dimainkan ada di bawah.',
  papanLabel: 'Papan congklak',
  lubangLabel: 'Lubang {n}',
  sisimu: 'sisimu',
  sisiLawan: 'sisi lawan',
  bisaDitabur: 'bisa ditabur',
  kosongLabel: 'kosong',
  lumbungLabel: 'Lumbung {nama}',
  barisLabel: 'Baris {nama}',
  beranda: 'Congklak, dengan aturan daerahnya dibuka',
  berandaIntro: 'Aturannya berbeda-beda di tiap daerah, dan sumbernya saling bertentangan. Di sini tiap aturan disebut namanya, dicantumkan sumbernya, dan ditunjukkan di mana sumbernya tidak sepakat.',
  nilai1: 'Tiga aturan daerah, semuanya bersumber',
  nilai2: 'Lawan AI, atau berdua di satu perangkat',
  nilai3: 'Main lintas perangkat, tanpa akun',
  caraMain: 'Pilih satu lubang di sisimu untuk menabur.',
  giliranmuAjakan: 'Giliranmu — pilih satu lubang di sisimu.',
  giliranLawanAjakan: 'Menunggu lawan.',
  mainPakai: 'Aturan yang dipakai',
  salin: 'Salin',
  tersalin: 'Tersalin',
  permainan: 'Permainan',
  animasi: 'Animasi',
  unggul: 'unggul',
  imbang: 'Imbang',
  bahasa: 'Bahasa',
  hotseat: 'Satu perangkat, dua pemain',
  duaPemain: 'Dua pemain',
  lawanAi: 'Lawan AI',
  ai: 'AI',
  mudah: 'Mudah',
  sulit: 'Sulit',
  berpikir: 'AI sedang berpikir…',
  diTangan: 'biji di tangan',
  pratinjau: 'Lubang',
  pratinjauPetunjuk: 'Arahkan ke lubangmu untuk melihat ke mana rantainya berakhir.',
  giliran: 'Giliran',
  pemain: 'Pemain',
  menang: 'menang',
  seri: 'Seri',
  permainanBaru: 'Permainan baru',
  urung: 'Urungkan',
  lewati: 'Lewati animasi',
  kecepatan: 'Kecepatan',
  suara: 'Suara',
  suaraHidup: 'Suara hidup — matikan',
  suaraMati: 'Suara mati — hidupkan',
  mode: 'Mode',
  kesulitan: 'Kesulitan',
  pelan: 'Pelan',
  sedang: 'Sedang',
  cepat: 'Cepat',
  langsung: 'Langsung',
  aturan: 'Aturan',
  aturanIntro: 'Congklak dimainkan di banyak daerah dengan aturan yang memang berbeda, dan sumber-sumbernya saling bertentangan. Setiap pak di bawah ini menyebutkan daerahnya, sumbernya, dan — yang paling penting — di mana sumbernya tidak sepakat. Yang bertentangan dicatat, bukan dipilih diam-diam.',
  dipakaiDiSini: 'Dipakai di pak ini',
  sumber: 'Sumber',
  perbedaan: 'Di mana sumber berbeda',
  kembali: 'Kembali ke papan',
  rulesetAktif: 'Aturan yang dipakai',
  riwayat: 'Jalannya giliran',
  kodePermainan: 'Kode permainan',
  glosarium: 'Glosarium',
  kembaliKeDaftar: 'Daftar aturan ↑',
  lumbungGloss: 'lumbung — lubang besar di ujung papan tempat biji ditabung; juga disebut gunung atau rumah.',
  bijiGloss: 'biji — buah congklak yang ditabur; bukan "batu".',
  menembakGloss: 'menembak — mengambil biji di lubang seberang saat biji terakhir jatuh di lubang kosong sisi sendiri.',
  bacaanLain: 'Bacaan lain',
  perluCek: 'perlu dicek',
  terverifikasi: 'terverifikasi',
  skor: 'Skor',
  belumAdaLangkah: 'Belum ada langkah.',
  perbedaanCount: 'perbedaan tercatat',
  statusDapatDibandingkan: 'Dijalankan mesin',
  statusDiterapkan: 'Dijalankan, tanpa pembanding',
  statusDicatat: 'Dicatat saja',
  statusJelasDibandingkan: 'Kedua bacaan bisa dimainkan di sini, dan bisa ditunjukkan di papan.',
  statusJelasDiterapkan: 'Bacaan pack ini yang dijalankan mesin. Bacaan lawannya belum bisa dinyatakan, jadi tidak ada papan pembandingnya.',
  statusJelasDicatat: 'Tidak diterapkan. Dicatat karena sumbernya menyatakannya, dan ditunda dengan sadar.',
  perbedaanRingkas: 'Dari {n} perbedaan yang tercatat, {a} dijalankan mesin dan {b} baru catatan.',
  buktiJudul: 'Terbukti di papan',
  buktiTeks: 'Pada permainan contoh #{seed} ({panjang} langkah), kedua bacaan berpisah di giliran {giliran}: {alasan}',
  buktiTakAda: 'Tidak ada papan yang membedakannya dalam {n} permainan contoh. Aturannya nyata dan bersumber, tapi jarang menentukan.',
  buktiCara: 'Dicari dengan menjalankan pack ini melawan dirinya sendiri, satu klausa itu saja dibalik. Benihnya tetap, jadi permainannya bisa diputar ulang.',
  aturanLainJudul: 'Permainan ini di bawah aturan lain',
  aturanLainSama: 'berjalan sama persis sampai akhir.',
  aturanLainBeda: 'berpisah di giliran {n} — {alasan}',
  aturanLainCatatan: 'Daftar langkah yang sama diputar ulang di tiap aturan. Sesudah keduanya berpisah, permainannya bukan permainan yang sama lagi, jadi tidak ada skor akhir yang bisa dibandingkan.',
  alasanRingkasPapan: 'papan kedua bacaan mulai berbeda.',
  alasanRingkasSelesai: 'satu bacaan menyatakan permainan sudah selesai, satunya belum.',
  alasanRingkasTakSah: 'langkah itu tidak sah lagi di salah satu bacaan.',
  gantiSaatJalan: 'Selesaikan atau mulai permainan baru untuk mengganti aturan.',
  banding: 'Bandingkan aturan',
  bandingIntro: 'Satu daftar langkah, dua ruleset. Di mana keduanya pertama kali berbeda?',
  simpangDi: 'Simpang pertama di giliran',
  berbeda: 'berbeda',
  takAdaSimpang: 'Tidak ada simpang pada daftar langkah ini.',
  giliranKe: 'Giliran',
  acakUlang: 'Acak permainan lain',
  alasanPapan: 'Papan kedua aturan mulai berbeda.',
  alasanSelesai: 'Satu aturan menyatakan permainan sudah selesai, satunya belum.',
  alasanTakSah: 'Langkah itu tidak sah lagi di salah satu aturan.',
  ulang: 'Putar ulang',
  ulangIntro: 'Sebuah permainan adalah daftar langkahnya plus id aturannya — tidak ada papan yang disimpan. Tempelkan kode dari layar papan, lalu telusuri permainannya langkah demi langkah.',
  muatKode: 'Muat kode',
  kodeTakValid: 'Kode permainan tidak bisa dibaca.',
  langkah: 'Langkah',
  statistik: 'Statistik',
  bankTerbesar: 'Bank terbesar',
  sambungTerpanjang: 'Sambung terpanjang',
  dimainkan: 'Permainan',
  menangA: 'Menang A',
  menangB: 'Menang B',
  tanding: 'Tanding',
  tandingIntro: 'Dua perangkat, satu permainan. Yang melintas hanya langkah dan hash — papan tidak pernah dikirim. Kedua sisi harus memakai aturan yang sama; kalau tidak, sambungan ditolak.',
  jadiTuanRumah: 'Jadi tuan rumah',
  jadiTamu: 'Jadi tamu',
  salinTawaran: 'Salin kode ini, kirim ke lawan',
  salinJawaban: 'Salin jawaban ini, kirim balik ke tuan rumah',
  tempelTawaran: 'Tempel kode dari tuan rumah',
  tempelJawaban: 'Tempel jawaban dari tamu',
  sambung: 'Sambungkan',
  giliranmu: 'Giliranmu',
  giliranLawan: 'Giliran lawan',
  tanpaTurn: 'Tanpa relay TURN. Sebagian sambungan — terutama kalau kedua sisi di balik NAT ketat — memang akan gagal, dan itu tidak bisa diperbaiki dari sisi ini.',
  koneksi_baru: 'belum tersambung',
  koneksi_menunggu: 'menunggu lawan',
  koneksi_tersambung: 'tersambung',
  koneksi_putus: 'terputus',
  koneksi_gagal: 'gagal tersambung',
  belajar: 'Belajar',
  teka: 'Teka-teki',
  tekaIntro: 'Aturannya sudah kamu tahu; yang tersisa adalah membaca rantainya sebelum ditabur. Lima posisi, masing-masing punya tepat satu langkah yang berhasil.',
  tekaSasaran: 'Sasaran',
  tekaBerhasil: 'Kena.',
  tekaBelum: 'Belum sampai.',
  tekaCapai: 'Langkah itu menghasilkan {n}, sasarannya {target}.',
  tekaCapaiLagi: 'Biji terakhirmu tidak berhenti tepat di lumbung sendiri.',
  tekaPetunjuk: 'Petunjuk',
  tekaLihatPetunjuk: 'Lihat petunjuk',
  tekaBerikutnya: 'Teka-teki berikutnya',
  tekaUlangi: 'Ulangi posisi ini',
  tekaSelesai: 'Kelima-limanya selesai. Sekarang lawan AI-nya.',
  tekaCatatan: 'Semua posisi dimainkan di bawah aturan Congklak Umum. "Tabung tiga belas biji" belum jadi pertanyaan yang utuh sebelum disebut bacaan menembak siapa yang berlaku.',
  belajarIntro: 'Tiga posisi papan sungguhan, bukan tiga paragraf. Aturan congklak gampang disebut dan susah dirasakan — jadi di sini kamu dikasih papan dan diminta mencari langkahnya.',
  pilihLubang: 'Pilih salah satu lubang di barisan bawah.',
  tepat: 'Nah, itu dia.',
  belumTepat: 'Belum yang itu.',
  ulangiPosisi: 'Ulangi posisi ini',
  pelajaranBerikutnya: 'Pelajaran berikutnya',
  mainSekarang: 'Main sekarang',
  belajarCatatan: 'Posisi pelajaran memakai aturan Congklak Umum, dan sengaja berisi sedikit biji supaya papannya terbaca sebagai diagram.',
  caraSambung: 'Cara menyambung',
  jalurBroker: 'Kode pendek',
  jalurManual: 'Tempel manual',
  jalurBrokerCatatan: 'Tuan rumah dapat kode pendek, tamu mengetikkannya. Perkenalannya lewat server PeerJS umum — pihak ketiga. Sesudah tersambung, permainannya tetap langsung antar-perangkat: langkah dan hash tidak pernah lewat server itu.',
  jalurManualCatatan: 'Tanpa server sama sekali. Kalian bertukar dua potong teks lewat jalur apa pun yang sudah kalian pakai. Lebih repot, tapi tidak bergantung pada siapa pun.',
  brokerGagal: 'dialihkan ke tempel manual',
  kodeSambungan: 'Kode sambungan',
  masukkanKode: 'Masukkan kode tuan rumah',
  caraHarusSama: 'Kedua pemain harus memakai cara yang sama.',
  sambungGagal: 'Belum tersambung. Periksa lagi kodenya, dan pastikan tuan rumah masih membuka halaman ini — kodenya hilang begitu halamannya ditutup.',
  iniKodePendek: 'Itu kode pendek, bukan teks perkenalan. Pilih "Kode pendek" di atas, lalu masukkan kodenya di sana.',
  tempelanTakTerbaca: 'Teks itu tidak terbaca sebagai perkenalan. Salin lagi seluruhnya — biasanya ada bagian yang terpotong.',
}

const en: Dict = {
  judul: 'Congklak',
  tagline: 'Congklak with its regional rulesets made explicit and cited.',
  papan: 'Board',
  bukaPapan: 'Open the board',
  contohJudul: 'One turn, step by step',
  contohIntro: 'The board has 14 small holes and two lumbung — the large holes at either end. The bottom row is yours, and so is the lumbung on your left. In a full game every small hole starts with 7 biji, 98 in all.',
  contohTujuan: 'Whoever gathers the most biji in their own lumbung wins.',
  contohLewatiLumbung: 'Your opponent\u2019s lumbung is always skipped — you never sow into it. This example turn stops before reaching it, so that is not shown here.',
  contohLangkahKe: 'Step {n} of {total}',
  contohSebelum: 'Previous',
  contohBerikut: 'Next',
  contohUlang: 'Start again',
  contohAwal: 'The starting position. Hole 4 on your row holds 5 biji, and it is your turn. The other holes are left empty so the path is easy to follow.',
  contohAmbil: 'Scoop all {n} biji out of hole {i}. That hole is now empty, and {n} biji are in your hand.',
  contohJatuh: 'Drop one biji into hole {i}: {a} → {b}. Left in hand: {s}.',
  contohLumbung: 'The large hole at this end is your lumbung. Biji passing it fall in: {a} → {b}. Left in hand: {s}.',
  contohSelesai: 'The last biji landed in an empty hole on your opponent\u2019s side, so the turn ends here. One biji is banked.',
  rujukanAturan: 'The rule that decided this',
  rujukanSumber: 'Source',
  rujukanUniversal: 'Holds under every reading \u2014 not this pack\u2019s choice.',
  buktiPapanIni: 'The board under this pack\u2019s reading, after that turn',
  buktiPapanLain: 'The board under the other reading, after the same turn',
  buktiTakSah: 'That move is no longer legal under this reading \u2014 the game had already stopped.',
  aiJujur: 'The AI searches a few moves ahead and scores the board with hand-written weights \u2014 lumbung difference, capture chances, extra turns. Those weights are opinion, not sourced rules like the ones on the Rules page, and there is no citation to give for them. It sees nothing you cannot: congklak is a perfect-information game, and difficulty only changes how deep it looks.',
  contohPapanIni: 'An example board \u2014 deliberately sparse so it reads clearly. The board you can play is below.',
  papanLabel: 'Congklak board',
  lubangLabel: 'Lubang {n}',
  sisimu: 'your side',
  sisiLawan: 'opponent\u2019s side',
  bisaDitabur: 'can be sown',
  kosongLabel: 'empty',
  lumbungLabel: 'Lumbung {nama}',
  barisLabel: '{nama} row',
  beranda: 'Congklak, with its regional rules opened up',
  berandaIntro: 'The rules genuinely differ from region to region, and the published sources contradict each other. Here every ruleset is named, cited, and shown where its sources disagree.',
  nilai1: 'Three regional rulesets, every one cited',
  nilai2: 'Play the AI, or two of you on one device',
  nilai3: 'Play across devices, with no account',
  caraMain: 'Choose a hole on your side to sow.',
  giliranmuAjakan: 'Your turn \u2014 choose a hole on your side.',
  giliranLawanAjakan: 'Waiting for your opponent.',
  mainPakai: 'Playing by',
  salin: 'Copy',
  tersalin: 'Copied',
  permainan: 'Game',
  animasi: 'Animation',
  unggul: 'ahead by',
  imbang: 'Level',
  bahasa: 'Language',
  hotseat: 'One device, two players',
  duaPemain: 'Two players',
  lawanAi: 'Versus AI',
  ai: 'AI',
  mudah: 'Easy',
  sulit: 'Hard',
  berpikir: 'AI is thinking…',
  diTangan: 'biji in hand',
  pratinjau: 'Hole',
  pratinjauPetunjuk: 'Point at one of your holes to see where the chain ends.',
  giliran: 'Turn',
  pemain: 'Player',
  menang: 'wins',
  seri: 'Draw',
  permainanBaru: 'New game',
  urung: 'Undo',
  lewati: 'Skip animation',
  kecepatan: 'Speed',
  suara: 'Sound',
  suaraHidup: 'Sound on \u2014 turn off',
  suaraMati: 'Sound off \u2014 turn on',
  mode: 'Mode',
  kesulitan: 'Difficulty',
  pelan: 'Slow',
  sedang: 'Medium',
  cepat: 'Fast',
  langsung: 'Instant',
  aturan: 'Rules',
  aturanIntro: 'Congklak is played across many regions under rules that genuinely differ, and the sources contradict each other. Each pack below names its region, its sources, and — the part that matters — where those sources disagree. Contradictions are recorded, not quietly resolved.',
  dipakaiDiSini: 'This pack does',
  sumber: 'Sources',
  perbedaan: 'Where the sources disagree',
  kembali: 'Back to the board',
  rulesetAktif: 'Active ruleset',
  riwayat: 'What happened',
  kodePermainan: 'Game code',
  glosarium: 'Glossary',
  kembaliKeDaftar: 'All rulesets ↑',
  lumbungGloss: 'lumbung — the large end hole where biji are banked; also called gunung or rumah.',
  bijiGloss: 'biji — the seeds that are sown. Not "stones".',
  menembakGloss: 'menembak — literally "shooting": taking the opposite hole when your last biji lands in an empty hole on your own side.',
  bacaanLain: 'Other reading',
  perluCek: 'needs checking',
  terverifikasi: 'verified',
  skor: 'Score',
  belumAdaLangkah: 'No moves yet.',
  perbedaanCount: 'recorded divergences',
  statusDapatDibandingkan: 'The engine plays this',
  statusDiterapkan: 'Played, nothing to compare',
  statusDicatat: 'Recorded only',
  statusJelasDibandingkan: 'Both readings are playable here, and the difference can be shown on a board.',
  statusJelasDiterapkan: 'This pack\u2019s reading is what the engine plays. The other reading cannot be expressed yet, so there is no board to compare against.',
  statusJelasDicatat: 'Not implemented. Recorded because a source states it, and deferred deliberately.',
  perbedaanRingkas: 'Of {n} recorded divergences, {a} are played by the engine and {b} are notes.',
  buktiJudul: 'Shown on a board',
  buktiTeks: 'In sample game #{seed} ({panjang} moves), the two readings part at turn {giliran}: {alasan}',
  buktiTakAda: 'No board told them apart across {n} sample games. The rule is real and cited, but it rarely decides anything.',
  buktiCara: 'Found by running this pack against itself with that one clause flipped. The seed is fixed, so the game can be replayed.',
  aturanLainJudul: 'This game under the other rulesets',
  aturanLainSama: 'plays identically all the way through.',
  aturanLainBeda: 'parts at turn {n} — {alasan}',
  aturanLainCatatan: 'The same move list, replayed under each ruleset. Once two readings part the game is no longer the same game, so there is no final score to compare.',
  alasanRingkasPapan: 'the two boards start to differ.',
  alasanRingkasSelesai: 'one reading says the game is already over, the other does not.',
  alasanRingkasTakSah: 'that move is no longer legal under one reading.',
  gantiSaatJalan: 'Finish or start a new game to change the ruleset.',
  banding: 'Compare rulesets',
  bandingIntro: 'One move list, two rulesets. Where do they first disagree?',
  simpangDi: 'First divergence at turn',
  berbeda: 'differs',
  takAdaSimpang: 'No divergence on this move list.',
  giliranKe: 'Turn',
  acakUlang: 'Try another game',
  alasanPapan: 'The two rulesets\u2019 boards start to differ.',
  alasanSelesai: 'One ruleset says the game is already over, the other does not.',
  alasanTakSah: 'That move is no longer legal under one of the rulesets.',
  ulang: 'Replay',
  ulangIntro: 'A game is its move list plus its ruleset id — no board is ever stored. Paste a code from the board screen and step through the game move by move.',
  muatKode: 'Load code',
  kodeTakValid: 'That game code could not be read.',
  langkah: 'Move',
  statistik: 'Stats',
  bankTerbesar: 'Biggest bank',
  sambungTerpanjang: 'Longest relay',
  dimainkan: 'Games',
  menangA: 'A wins',
  menangB: 'B wins',
  tanding: 'Play online',
  tandingIntro: 'Two devices, one game. Only moves and hashes cross the wire — the board is never sent. Both sides must be on the same ruleset, or the connection is refused.',
  jadiTuanRumah: 'Host',
  jadiTamu: 'Join',
  salinTawaran: 'Copy this code and send it to your opponent',
  salinJawaban: 'Copy this answer and send it back to the host',
  tempelTawaran: 'Paste the code from the host',
  tempelJawaban: 'Paste the answer from the guest',
  sambung: 'Connect',
  giliranmu: 'Your turn',
  giliranLawan: 'Opponent\u2019s turn',
  tanpaTurn: 'No TURN relay. Some connections \u2014 particularly when both sides sit behind strict NAT \u2014 will simply fail, and that cannot be fixed from this end.',
  koneksi_baru: 'not connected',
  koneksi_menunggu: 'waiting for opponent',
  koneksi_tersambung: 'connected',
  koneksi_putus: 'disconnected',
  koneksi_gagal: 'connection failed',
  belajar: 'Learn',
  teka: 'Puzzles',
  tekaIntro: 'You know the rules; what is left is reading the chain before you sow it. Five positions, each with exactly one move that works.',
  tekaSasaran: 'Target',
  tekaBerhasil: 'Got it.',
  tekaBelum: 'Not quite.',
  tekaCapai: 'That move produced {n}; the target is {target}.',
  tekaCapaiLagi: 'Your last biji did not stop exactly in your own lumbung.',
  tekaPetunjuk: 'Hint',
  tekaLihatPetunjuk: 'Show a hint',
  tekaBerikutnya: 'Next puzzle',
  tekaUlangi: 'Reset this position',
  tekaSelesai: 'All five done. Now go and play the AI.',
  tekaCatatan: 'Every position is played under the Congklak Umum ruleset. \u201cBank thirteen seeds\u201d is not a well-formed question until you say whose reading of menembak is in force.',
  belajarIntro: 'Three real board positions, not three paragraphs. Congklak\u2019s rules are simple to state and hard to feel \u2014 so here you are given a board and asked to find the move.',
  pilihLubang: 'Pick one of the holes on the bottom row.',
  tepat: 'That\u2019s the one.',
  belumTepat: 'Not that one.',
  ulangiPosisi: 'Reset this position',
  pelajaranBerikutnya: 'Next lesson',
  mainSekarang: 'Play now',
  belajarCatatan: 'Lesson positions use the Congklak Umum ruleset, and deliberately hold few biji so the board reads as a diagram.',
  caraSambung: 'How to connect',
  jalurBroker: 'Short code',
  jalurManual: 'Manual paste',
  jalurBrokerCatatan: 'The host gets a short code and the guest types it. The introduction runs through the public PeerJS server \u2014 a third party. Once connected the game is still device to device: moves and hashes never pass through that server.',
  jalurManualCatatan: 'No server at all. You exchange two pieces of text over whatever channel you already use. More fiddly, but it depends on nobody.',
  brokerGagal: 'falling back to manual paste',
  kodeSambungan: 'Connection code',
  masukkanKode: 'Enter the host\u2019s code',
  caraHarusSama: 'Both players must use the same method.',
  sambungGagal: 'Not connected. Check the code, and make sure the host still has this page open \u2014 the code disappears when they close it.',
  iniKodePendek: 'That is a short code, not an introduction blob. Choose \u201cShort code\u201d above and enter it there instead.',
  tempelanTakTerbaca: 'That text could not be read as an introduction. Copy the whole thing again \u2014 usually a piece of it got cut off.',
}

const DICTS: Record<Locale, Dict> = { id, en }

export function t(locale: Locale): Dict {
  return DICTS[locale]
}
