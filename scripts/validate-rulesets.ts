/**
 * Gates the build. A ruleset pack that fails the schema, or that ships
 * without a citation, must not reach production — invariant 8.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RulesetSchema } from '../lib/rulesets/schema'

const DIR = join(process.cwd(), 'data', 'rulesets')

function main(): void {
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  if (files.length === 0) {
    console.error('validate-rulesets: tidak ada pack di data/rulesets/')
    process.exit(1)
  }

  const problems: string[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const raw: unknown = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
    const result = RulesetSchema.safeParse(raw)

    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${file}: ${issue.path.join('.') || '(root)'} — ${issue.message}`)
      }
      continue
    }

    const pack = result.data

    // Id is the filename, because ids appear in shared codes and handshakes.
    if (`${pack.id}.json` !== file) {
      problems.push(`${file}: id "${pack.id}" tidak cocok dengan nama berkas`)
    }
    if (seen.has(pack.id)) problems.push(`${file}: id "${pack.id}" ganda`)
    seen.add(pack.id)

    // Zod enforces min(1); this is the human-readable failure.
    if (pack.sources.length === 0) {
      problems.push(`${file}: tidak bersumber — pack tanpa sumber tidak boleh dirilis`)
    }

    const unverified = pack.sources.filter((s) => s.confidence === 'perlu-cek').length
    const flag = unverified > 0 ? `  (${unverified} sumber perlu dicek)` : ''

    /**
     * Berapa banyak perbedaan yang benar-benar sampai ke mesin, dicetak
     * tiap build. Skema mewajibkan `status`, tapi tidak ada yang bisa
     * memeriksa apakah nilainya jujur — jadi angkanya ditaruh di depan
     * mata orang yang menjalankan build, di mana pergeseran akan terlihat.
     */
    const banding = pack.divergences.filter((d) => d.status === 'dapat-dibandingkan').length
    const catat = pack.divergences.filter((d) => d.status === 'dicatat').length
    console.log(
      `  ok  ${file}  — ${pack.sources.length} sumber${flag}` +
        `  · ${pack.divergences.length} perbedaan (${banding} dapat dibandingkan, ${catat} dicatat saja)`,
    )
  }

  if (problems.length > 0) {
    console.error('\nvalidate-rulesets GAGAL:')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }

  console.log(`validate-rulesets: ${files.length} pack lolos`)
}

main()
