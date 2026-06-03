import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProducts, getDeals } from '../api'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '../seo'
import { getPriceDisplay } from '../utils/pricing'
import { SOCIAL_LINKS, SOCIAL_SPOTLIGHTS } from '../content/socialMedia'

const CATEGORIES = [
  { key: 'flower',       label: 'Flower',        icon: 'local_florist',  desc: 'Indoor, sun-grown & premium cultivars', color: 'from-primary/20 to-transparent',   glow: 'neon-glow-pink' },
  { key: 'edibles',      label: 'Edibles',        icon: 'cake',           desc: 'Gummies, chocolates, drinks & more',    color: 'from-secondary/20 to-transparent', glow: 'neon-glow-cyan' },
  { key: 'concentrates', label: 'Concentrates',   icon: 'science',        desc: 'Live resin, rosin, shatter & wax',      color: 'from-tertiary/20 to-transparent',  glow: '' },
  { key: 'vapes',        label: 'Vapes',          icon: 'air',            desc: 'Cartridges, disposables & batteries',   color: 'from-secondary/20 to-transparent', glow: 'neon-glow-cyan' },
  { key: 'prerolls',     label: 'Pre-Rolls',      icon: 'smoking_rooms',  desc: 'Infused pre-rolls, singles & packs',    color: 'from-primary/20 to-transparent',   glow: 'neon-glow-pink' },
]

const HOURS = [
  { day: 'Mon – Thu', hours: '10:00 AM – 10:00 PM' },
  { day: 'Fri – Sat', hours: '10:00 AM – 11:00 PM' },
  { day: 'Sun',       hours: '12:00 PM – 10:00 PM' },
]


export default function Home() {
  usePageTitle(null, {
    pathname: '/',
    structuredData: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  })
  const [topProducts, setTopProducts] = useState([])
  const [featuredDeals, setFeaturedDeals] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getProducts().then((all) => setTopProducts(all.slice(0, 4))).catch(() => {})
    getDeals().then((deals) => setFeaturedDeals(deals.filter((d) => d.isActive).slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div className="page-enter">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image — fades in at full size */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-[fadeIn_1.8s_ease_forwards]"
          style={{
            backgroundImage: `url('/hero-bg.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/65 to-transparent" />

        {/* Hero content — staggered entrance */}
        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-2xl">
            <p className="hero-item text-[10px] font-label uppercase tracking-[0.4em] text-primary mb-6 animate-neon-flicker">
              Gallup, New Mexico · Powered by KREME
            </p>
            <h1 className="hero-item text-6xl md:text-8xl font-headline font-black leading-none tracking-tighter mb-6">
              <span className="text-primary neon-glow-pink animate-neon-flicker">Cake</span>
              <br />
              <span className="text-on-surface">Dispensary</span>
            </h1>
            <p className="hero-item text-on-surface-variant font-body text-lg leading-relaxed mb-10 max-w-lg">
              Where every day is your birthday. Gallup's premier cannabis destination — flower, concentrates, edibles, vapes, and more.
            </p>
            <div className="hero-item flex flex-col sm:flex-row gap-4">
              <Link to="/menu" className="btn-primary justify-center btn-pulse text-base px-10 py-4">
                EXPLORE MENU
              </Link>
              <Link to="/deals" className="btn-outline px-10 py-4 justify-center text-base">
                TODAY'S DEALS
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="hero-item absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-on-surface-variant/40">
          <span className="material-symbols-outlined animate-bounce" style={{ fontSize: 20 }}>keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── CATEGORY BENTO GRID ── */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
        <FadeIn className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">Browse by Category</p>
            <h2 className="text-4xl font-headline font-black">Shop the Menu</h2>
          </div>
          <Link to="/menu" className="text-sm font-label text-secondary hover:underline hidden md:block">
            View All →
          </Link>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <FadeIn key={cat.key} delay={i * 70}>
              <button
                onClick={() => navigate(`/menu?category=${cat.key}`)}
                className={`group relative card p-6 w-full flex flex-col items-center text-center gap-3 bg-gradient-to-b ${cat.color} border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-neon-pink`}
              >
                <span className={`material-symbols-outlined text-4xl text-primary transition-transform duration-300 group-hover:scale-125 ${cat.glow}`}>
                  {cat.icon}
                </span>
                <span className="font-headline font-bold text-sm">{cat.label}</span>
                <span className="text-xs text-on-surface-variant font-body leading-tight">{cat.desc}</span>
              </button>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TOP SHELF PICKS ── */}
      {topProducts.length > 0 && (
        <section className="bg-surface-container-low py-24">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <FadeIn className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">Staff Favorites</p>
                <h2 className="text-4xl font-headline font-black">Top Shelf Picks</h2>
              </div>
              <Link to="/menu" className="text-sm font-label text-secondary hover:underline hidden md:block">
                Full Menu →
              </Link>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topProducts.map((product, i) => (
                <FadeIn key={product.id} delay={i * 80} variant="scale">
                  <div className="group card overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 h-full">
                    <div className="aspect-square bg-surface-container flex items-center justify-center relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:scale-110 transition-transform duration-300" style={{ fontSize: 64 }}>local_florist</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-primary text-on-primary">
                        {product.type}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-headline font-bold text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-on-surface-variant font-label mb-3 flex-1">{product.thc && `THC ${product.thc}`}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary font-headline font-bold text-xs text-right">{getPriceDisplay(product)}</span>
                        <Link to="/menu" className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors">
                          Reserve →
                        </Link>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DEALS BANNER ── */}
      {featuredDeals.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
          <FadeIn className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">Save Big</p>
              <h2 className="text-4xl font-headline font-black">Current Deals</h2>
            </div>
            <Link to="/deals" className="text-sm font-label text-secondary hover:underline hidden md:block">
              All Deals →
            </Link>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredDeals.map((deal, i) => (
              <FadeIn key={deal.id} delay={i * 100}>
                <div className="card p-6 border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent hover:-translate-y-2 transition-all duration-300 h-full">
                  <span className="material-symbols-outlined text-primary text-3xl mb-3 block neon-glow-pink transition-transform duration-300 hover:scale-110">
                    {deal.icon || 'local_offer'}
                  </span>
                  <h3 className="font-headline font-bold text-lg mb-1">{deal.title}</h3>
                  <p className="text-xs font-label text-secondary mb-3">{deal.discount}</p>
                  <p className="text-on-surface-variant font-body text-sm leading-relaxed">{deal.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* ── ABOUT TEASER ── */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn variant="left">
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Our Story</p>
              <h2 className="text-5xl font-headline font-black mb-6 leading-tight">
                Gallup's Biggest<br />
                <span className="text-primary neon-glow-pink animate-neon-flicker">Birthday Party</span>
              </h2>
              <p className="text-on-surface-variant font-body leading-relaxed mb-4">
                Cake Dispensary was built to bring the kreme of all cannabis to Gallup at unbeatable value. We pour love and care into every product we carry — and we hope you experience that passion with every puff, sip, or bite.
              </p>
              <p className="text-on-surface-variant font-body leading-relaxed mb-8">
                Life is sweeter when you can have your Cake and smoke it too. Come find out why Gallup's been celebrating with us.
              </p>
              <Link to="/about" className="btn-outline">Learn Our Story →</Link>
            </FadeIn>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '4.2★', label: 'Google Rating',      icon: 'star' },
                { value: '100+', label: 'Happy Reviews',       icon: 'reviews' },
                { value: '6',    label: 'Product Categories',  icon: 'inventory_2' },
                { value: '21+',  label: 'Adults Only',         icon: 'verified_user' },
              ].map((stat, i) => (
                <FadeIn key={stat.label} variant="scale" delay={i * 90}>
                  <div className="card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block">{stat.icon}</span>
                    <p className="text-3xl font-headline font-black text-secondary neon-glow-cyan">{stat.value}</p>
                    <p className="text-xs text-on-surface-variant font-label mt-1">{stat.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL FEED ── */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-stretch">
          <FadeIn variant="left" className="card p-8 md:p-10 bg-gradient-to-br from-primary/10 via-surface-container to-secondary/5 border border-primary/10 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Social Feed</p>
              <h2 className="text-4xl md:text-5xl font-headline font-black mb-5 leading-tight">
                Follow the<br />
                <span className="text-primary neon-glow-pink">Cake Drop</span>
              </h2>
              <p className="text-on-surface-variant font-body leading-relaxed mb-8">
                Catch daily drops, deals, new menu arrivals, and Gallup store updates straight from Cake Dispensary.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-pulse justify-center"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{social.icon}</span>
                    {social.handle}
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-4">
            {SOCIAL_SPOTLIGHTS.map((item, i) => (
              <FadeIn key={item.id} delay={i * 80} variant="scale">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card p-6 h-full flex flex-col bg-surface-container-low border border-white/5 hover:border-primary/30 hover:-translate-y-2 transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-primary text-3xl mb-5 transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </span>
                  <h3 className="font-headline font-bold text-lg mb-3">{item.title}</h3>
                  <p className="text-on-surface-variant font-body text-sm leading-relaxed flex-1">{item.description}</p>
                  <span className="mt-6 text-xs font-label uppercase tracking-widest text-secondary">View on Instagram →</span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOURS & LOCATION ── */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <FadeIn variant="left">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">We're Open</p>
            <h2 className="text-4xl font-headline font-black mb-8">Hours & Location</h2>
            <div className="space-y-4">
              {HOURS.map((h) => (
                <div key={h.day} className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="font-label text-sm text-on-surface-variant">{h.day}</span>
                  <span className="font-headline font-bold text-sm">{h.hours}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
              <div>
                <p className="font-headline font-bold">Cake Dispensary</p>
                <p className="text-on-surface-variant font-body text-sm">1020 W Maloney Ave<br />Gallup, NM 87301</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">alternate_email</span>
              <a href="mailto:dispensarycake@gmail.com" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">dispensarycake@gmail.com</a>
            </div>
          </FadeIn>

          <FadeIn variant="scale">
            <div className="rounded-2xl overflow-hidden shadow-2xl h-[420px]">
              <iframe
                title="Cake Dispensary location map"
                src="https://maps.google.com/maps?q=1020+W+Maloney+Ave,+Gallup,+NM+87301&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.google.com/maps/search/?api=1&query=1020+W+Maloney+Ave+Gallup+NM+87301"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-pulse flex-1 justify-center py-3 text-sm"
              >
                <span className="material-symbols-outlined mr-2" style={{ fontSize: 16 }}>directions</span>
                GET DIRECTIONS
              </a>
              <Link
                to="/contact"
                className="btn-outline flex-1 justify-center py-3 text-sm"
              >
                <span className="material-symbols-outlined mr-2" style={{ fontSize: 16 }}>mail</span>
                CONTACT US
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,124,245,0.06)_0%,transparent_70%)]" />
        <FadeIn variant="scale" className="relative max-w-screen-2xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-5xl md:text-6xl font-headline font-black mb-6">Ready to Reserve?</h2>
          <p className="text-on-surface-variant font-body text-lg mb-10 max-w-md mx-auto">
            Browse our full selection and reserve your order for in-store pickup. No payment required until you arrive.
          </p>
          <Link to="/menu" className="btn-primary btn-pulse text-base px-12 py-5 justify-center inline-flex">
            SHOP THE MENU
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
