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
  readonly hotseat: string
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
  readonly pelan: string
  readonly sedang: string
  readonly cepat: string
  readonly langsung: string
  readonly aturan: string
  readonly sumber: string
  readonly perbedaan: string
  readonly kembali: string
  readonly rulesetAktif: string
  readonly riwayat: string
  readonly kodePermainan: string
  readonly glosarium: string
  readonly lumbungGloss: string
  readonly bijiGloss: string
  readonly menembakGloss: string
  readonly bacaanLain: string
  readonly perluCek: string
  readonly terverifikasi: string
  readonly skor: string
  readonly belumAdaLangkah: string
  readonly perbedaanCount: string
  readonly gantiSaatJalan: string
  readonly banding: string
  readonly bandingIntro: string
  readonly simpangDi: string
  readonly takAdaSimpang: string
  readonly giliranKe: string
  readonly acakUlang: string
  readonly alasanPapan: string
  readonly alasanSelesai: string
  readonly alasanTakSah: string
  readonly ulang: string
  readonly muatKode: string
  readonly kodeTakValid: string
  readonly langkah: string
  readonly statistik: string
  readonly dimainkan: string
  readonly menangA: string
}

const id: Dict = {
  judul: 'Lumbung',
  tagline: 'Congklak dengan aturan kedaerahan yang eksplisit dan bersumber.',
  hotseat: 'Satu perangkat, dua pemain',
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
  pelan: 'Pelan',
  sedang: 'Sedang',
  cepat: 'Cepat',
  langsung: 'Langsung',
  aturan: 'Aturan',
  sumber: 'Sumber',
  perbedaan: 'Di mana sumber berbeda',
  kembali: 'Kembali ke papan',
  rulesetAktif: 'Aturan yang dipakai',
  riwayat: 'Jalannya giliran',
  kodePermainan: 'Kode permainan',
  glosarium: 'Glosarium',
  lumbungGloss: 'lumbung — lubang besar di ujung papan tempat biji ditabung; juga disebut gunung atau rumah.',
  bijiGloss: 'biji — buah congklak yang ditabur; bukan "batu".',
  menembakGloss: 'menembak — mengambil biji di lubang seberang saat biji terakhir jatuh di lubang kosong sisi sendiri.',
  bacaanLain: 'Bacaan lain',
  perluCek: 'perlu dicek',
  terverifikasi: 'terverifikasi',
  skor: 'Skor',
  belumAdaLangkah: 'Belum ada langkah.',
  perbedaanCount: 'perbedaan tercatat',
  gantiSaatJalan: 'Selesaikan atau mulai permainan baru untuk mengganti aturan.',
  banding: 'Bandingkan aturan',
  bandingIntro: 'Satu daftar langkah, dua ruleset. Di mana keduanya pertama kali berbeda?',
  simpangDi: 'Simpang pertama di giliran',
  takAdaSimpang: 'Tidak ada simpang pada daftar langkah ini.',
  giliranKe: 'Giliran',
  acakUlang: 'Acak permainan lain',
  alasanPapan: 'Papan kedua aturan mulai berbeda.',
  alasanSelesai: 'Satu aturan menyatakan permainan sudah selesai, satunya belum.',
  alasanTakSah: 'Langkah itu tidak sah lagi di salah satu aturan.',
  ulang: 'Putar ulang',
  muatKode: 'Muat kode',
  kodeTakValid: 'Kode permainan tidak bisa dibaca.',
  langkah: 'Langkah',
  statistik: 'Statistik',
  dimainkan: 'Permainan',
  menangA: 'Menang A',
}

const en: Dict = {
  judul: 'Lumbung',
  tagline: 'Congklak with its regional rulesets made explicit and cited.',
  hotseat: 'One device, two players',
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
  pelan: 'Slow',
  sedang: 'Medium',
  cepat: 'Fast',
  langsung: 'Instant',
  aturan: 'Rules',
  sumber: 'Sources',
  perbedaan: 'Where the sources disagree',
  kembali: 'Back to the board',
  rulesetAktif: 'Active ruleset',
  riwayat: 'What happened',
  kodePermainan: 'Game code',
  glosarium: 'Glossary',
  lumbungGloss: 'lumbung — the large end hole where biji are banked; also called gunung or rumah.',
  bijiGloss: 'biji — the seeds that are sown. Not "stones".',
  menembakGloss: 'menembak — literally "shooting": taking the opposite hole when your last biji lands in an empty hole on your own side.',
  bacaanLain: 'Other reading',
  perluCek: 'needs checking',
  terverifikasi: 'verified',
  skor: 'Score',
  belumAdaLangkah: 'No moves yet.',
  perbedaanCount: 'recorded divergences',
  gantiSaatJalan: 'Finish or start a new game to change the ruleset.',
  banding: 'Compare rulesets',
  bandingIntro: 'One move list, two rulesets. Where do they first disagree?',
  simpangDi: 'First divergence at turn',
  takAdaSimpang: 'No divergence on this move list.',
  giliranKe: 'Turn',
  acakUlang: 'Try another game',
  alasanPapan: 'The two rulesets\u2019 boards start to differ.',
  alasanSelesai: 'One ruleset says the game is already over, the other does not.',
  alasanTakSah: 'That move is no longer legal under one of the rulesets.',
  ulang: 'Replay',
  muatKode: 'Load code',
  kodeTakValid: 'That game code could not be read.',
  langkah: 'Move',
  statistik: 'Stats',
  dimainkan: 'Games',
  menangA: 'A wins',
}

const DICTS: Record<Locale, Dict> = { id, en }

export function t(locale: Locale): Dict {
  return DICTS[locale]
}
