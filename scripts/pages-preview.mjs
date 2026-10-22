import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const repository = process.env.SYNTRAX_REPOSITORY || 'syntrax-check'
const basePath = `/${repository.replace(/^\/+|\/+$/g, '')}/`
const dist = resolve('dist')
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
  if (!pathname.startsWith(basePath)) {
    response.writeHead(404).end('Not found')
    return
  }

  const relativePath = pathname.slice(basePath.length) || 'index.html'
  const file = resolve(dist, relativePath)
  if (file !== dist && !file.startsWith(`${dist}${sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  const target = existsSync(file) && statSync(file).isFile() ? file : resolve(dist, 'index.html')
  response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' })
  if (request.method === 'HEAD') response.end()
  else createReadStream(target).pipe(response)
}).listen(Number(process.env.PORT || 4174), '127.0.0.1', () => {
  process.stdout.write(`SYNTRAX Pages preview: http://127.0.0.1:${process.env.PORT || 4174}${basePath}\n`)
})
