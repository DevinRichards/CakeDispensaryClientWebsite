import { FAQS } from './data/faqs.js'
import { SOCIAL_LINKS } from './content/socialMedia.js'

export const SITE_NAME = 'Cake Dispensary'
export const SITE_URL = 'https://cakedispensarynm.com'
export const DEFAULT_OG_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcto3Ai5iVhY9ORL31KaZUqmVNKIKX-3d2l0Eo7eQm0NmscWNTgKmoXATrPlmvGON5pG4LmRENymMP723eJ_kTJQnvWA8lglmcQnQ3r5lVMyxl4i9mpEMYAsnTyCSd1kO9mWpZ62NapZbqnSx9_h6tF7e9ht1iM89Q1-WPQSLE8l2Ffc3Iq481Uu2ebgHaZ5lPf6Xnpm-CMcpBAhBXah_OndCihK0Q_vDsRlzTjC5NLDT-LLMtIMlRAWYhPMj0X417Ipe4Pkl6-u4'
export const DEFAULT_DESCRIPTION = 'Cake Dispensary is an adult-use cannabis dispensary in Gallup, New Mexico offering flower, edibles, concentrates, vapes, pre-rolls, topicals, and pickup reservations online.'

export const PAGE_SEO = {
  __home__: {
    pathname: '/',
    description: 'Cake Dispensary is a cannabis dispensary in Gallup, New Mexico offering flower, edibles, concentrates, vapes, pre-rolls, topicals, and online pickup reservations.',
  },
  Menu: {
    pathname: '/menu',
    description: 'Browse the Cake Dispensary menu in Gallup, NM for flower, edibles, concentrates, vapes, pre-rolls, and topicals available for pickup reservation.',
  },
  'Deals & Promotions': {
    pathname: '/deals',
    description: 'See daily deals, weekly promotions, and current dispensary discounts at Cake Dispensary in Gallup, New Mexico.',
  },
  'About Us': {
    pathname: '/about',
    description: 'Learn about Cake Dispensary, our story, our values, and our mission to bring quality cannabis products to Gallup, New Mexico.',
  },
  FAQ: {
    pathname: '/faq',
    description: 'Get answers about reservations, pickup, product quality, store policies, IDs, discounts, and shopping at Cake Dispensary in Gallup, NM.',
  },
  Contact: {
    pathname: '/contact',
    description: 'Contact Cake Dispensary in Gallup, New Mexico for reservation help, product questions, store hours, directions, and general inquiries.',
  },
  'Responsible Use': {
    pathname: '/responsible-use',
    description: 'Read responsible cannabis use guidance, safety tips, and legal reminders from Cake Dispensary in Gallup, New Mexico.',
  },
  'Privacy Policy': {
    pathname: '/privacy',
    description: 'Read the Cake Dispensary privacy policy to understand how customer and reservation information is collected, used, and protected.',
  },
  'Terms of Service': {
    pathname: '/terms',
    description: 'Review the Cake Dispensary terms of service for website use, reservations, disclaimers, and customer responsibilities.',
  },
  Accessibility: {
    pathname: '/accessibility',
    description: 'Review the Cake Dispensary accessibility statement and our commitment to an inclusive website and in-store experience.',
  },
  'Page Not Found': {
    pathname: '/404',
    description: 'The page you were looking for could not be found on the Cake Dispensary website.',
    noIndex: true,
  },
  'Admin Dashboard': {
    pathname: '/admin',
    description: 'Internal admin dashboard for Cake Dispensary staff.',
    noIndex: true,
  },
}

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: SITE_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  email: 'dispensarycake@gmail.com',
  priceRange: '$$',
  description: DEFAULT_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1020 W Maloney Ave',
    addressLocality: 'Gallup',
    addressRegion: 'NM',
    postalCode: '87301',
    addressCountry: 'US',
  },
  sameAs: SOCIAL_LINKS.map((social) => social.href),
  hasMap: 'https://maps.google.com/?q=1020+W+Maloney+Ave,+Gallup,+NM+87301',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '10:00',
      closes: '22:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday'],
      opens: '10:00',
      closes: '23:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '12:00',
      closes: '22:00',
    },
  ],
}

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
}

export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  ),
}

export const PRERENDER_ROUTES = [
  '/',
  '/menu',
  '/deals',
  '/about',
  '/faq',
  '/contact',
  '/responsible-use',
  '/privacy',
  '/terms',
  '/accessibility',
]

export function getAbsoluteUrl(pathname = '/') {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${SITE_URL}${normalized}`
}

export function getSeoForPath(pathname = '/') {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '')
  const entry = Object.entries(PAGE_SEO).find(([, value]) => value.pathname === normalized)
  const titleKey = entry?.[0] || '__home__'
  const defaults = entry?.[1] || PAGE_SEO.__home__
  const title = titleKey === '__home__' ? SITE_NAME : `${titleKey} | ${SITE_NAME}`
  const description = defaults.description || DEFAULT_DESCRIPTION
  const canonical = getAbsoluteUrl(defaults.pathname || normalized || '/')
  const noIndex = defaults.noIndex ?? false

  let structuredData = null
  if (normalized === '/') structuredData = [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA]
  if (normalized === '/faq') structuredData = FAQ_SCHEMA

  return {
    title,
    description,
    canonical,
    noIndex,
    image: DEFAULT_OG_IMAGE,
    structuredData,
  }
}
