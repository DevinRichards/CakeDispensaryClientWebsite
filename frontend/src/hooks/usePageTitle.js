import { useEffect } from 'react'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  getAbsoluteUrl,
} from '../seo'

const HOME_KEY = '__home__'
const JSON_LD_ID = 'cake-seo-jsonld'

function upsertMeta(selector, attrs, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => tag.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

function upsertJsonLd(data) {
  const existing = document.getElementById(JSON_LD_ID)
  if (!data) {
    existing?.remove()
    return
  }

  if (!existing) return

  const script = existing
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
}

export default function usePageTitle(title, options = {}) {
  useEffect(() => {
    const defaults = PAGE_SEO[title ?? HOME_KEY] || {}
    const pathname = options.pathname || defaults.pathname || window.location.pathname || '/'
    const canonical = options.canonical || getAbsoluteUrl(pathname)
    const description = options.description || defaults.description || DEFAULT_DESCRIPTION
    const noIndex = options.noIndex ?? defaults.noIndex ?? false
    const image = options.image || DEFAULT_OG_IMAGE
    const pageTitle = options.fullTitle || (title ? `${title} | ${SITE_NAME}` : SITE_NAME)
    const structuredData = options.structuredData || null

    document.title = pageTitle
    document.documentElement.setAttribute('lang', 'en')

    upsertMeta('meta[name="description"]', { name: 'description' }, description)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('meta[name="author"]', { name: 'author' }, SITE_NAME)
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, pageTitle)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website')
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical)
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME)
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, 'en_US')
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image)
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, `${SITE_NAME} preview image`)
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, pageTitle)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image)
    upsertLink('canonical', canonical)
    upsertJsonLd(structuredData)
  }, [
    title,
    options.canonical,
    options.description,
    options.fullTitle,
    options.image,
    options.noIndex,
    options.pathname,
    JSON.stringify(options.structuredData || null),
  ])
}
