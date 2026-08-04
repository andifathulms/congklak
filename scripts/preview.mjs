/**
 * Serve ./out under the production basePath, so Pages-only breakage
 * (basePath, trailingSlash, .nojekyll) shows up before pushing. PRD §14.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const BASE_PATH = process.env.BASE_PATH ?? '/congklak'
const PORT = Number(process.env.PORT ?? 4173)
const ROOT = new URL('../out/', import.meta.url).pathname

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidates = [join(ROOT, rel), join(ROOT, rel, 'index.html'), join(ROOT, `${rel}.html`)]
  for (const c of candidates) {
    try {
      const s = await stat(c)
      if (s.isFile()) return c
    } catch {
      /* next candidate */
    }
  }
  return null
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith(BASE_PATH)) {
    res.writeHead(302, { Location: `${BASE_PATH}/` }).end()
    return
  }
  const file = await resolve(url.pathname.slice(BASE_PATH.length) || '/')
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(PORT, () => {
  console.log(`preview  http://localhost:${PORT}${BASE_PATH}/`)
})
