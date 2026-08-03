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
}

const id: Dict = {
  judul: 'Lumbung',
  tagline: 'Congklak dengan aturan kedaerahan yang eksplisit dan bersumber.',
  hotseat: 'Satu perangkat, dua pemain',
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
}

const en: Dict = {
  judul: 'Lumbung',
  tagline: 'Congklak with its regional rulesets made explicit and cited.',
  hotseat: 'One device, two players',
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
}

const DICTS: Record<Locale, Dict> = { id, en }

export function t(locale: Locale): Dict {
  return DICTS[locale]
}
