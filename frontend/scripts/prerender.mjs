import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getSeoForPath, PRERENDER_ROUTES } from '../src/seo.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const serverEntryUrl = pathToFileURL(path.join(distDir, 'server', 'entry-server.js')).href

const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8')
const { render } = await import(serverEntryUrl)

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildHeadTags(pathname) {
  const seo = getSeoForPath(pathname)
  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${seo.noIndex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`,
    `<meta property="og:site_name" content="Cake Dispensary" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image" content="${escapeHtml(seo.image)}" />`,
    `<meta property="og:image:alt" content="Cake Dispensary preview image" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(seo.image)}" />`,
  ]

  if (seo.structuredData) {
    tags.push(
      `<script id="cake-seo-jsonld" type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`
    )
  }

  return tags.join('\n    ')
}

for (const route of PRERENDER_ROUTES) {
  const appHtml = render(route)
  const html = template
    .replace(/<!-- SEO_HEAD_START -->([\s\S]*?)<!-- SEO_HEAD_END -->/, `<!-- SEO_HEAD_START -->\n    ${buildHeadTags(route)}\n    <!-- SEO_HEAD_END -->`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

  const outFile = route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.slice(1), 'index.html')

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, html, 'utf8')
}

const notFoundHtml = template
  .replace(/<!-- SEO_HEAD_START -->([\s\S]*?)<!-- SEO_HEAD_END -->/, `<!-- SEO_HEAD_START -->\n    ${buildHeadTags('/404')}\n    <!-- SEO_HEAD_END -->`)
  .replace('<div id="root"></div>', `<div id="root">${render('/404')}</div>`)

await fs.writeFile(path.join(distDir, '404.html'), notFoundHtml, 'utf8')
