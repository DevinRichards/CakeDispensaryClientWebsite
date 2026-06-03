import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDeals } from '../api'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Deals() {
  usePageTitle('Deals & Promotions')
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDeals()
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

  const today = DAY_NAMES[new Date().getDay()]
  const activeDeals = deals.filter((d) => d.isActive)
  const allDeals = deals.filter((d) => !d.isActive || d.schedule === 'ongoing')

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,238,252,0.06)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Save More</p>
          <h1 className="hero-item text-6xl font-headline font-black tracking-tighter mb-4">
            Deals &<br /><span className="text-secondary neon-glow-cyan">Promotions</span>
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-lg max-w-xl">
            Daily discounts, weekly specials, and ongoing promotions for every kind of customer. Today is <span className="text-on-surface font-bold">{today}</span>.
          </p>
        </div>
      </section>

      {/* Today's Active Deals */}
      {!loading && activeDeals.length > 0 && (
        <section className="bg-surface-container-low py-16">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <FadeIn className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse block" />
              <h2 className="text-2xl font-headline font-bold">Active Right Now</h2>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {activeDeals.map((deal, i) => (
                <FadeIn key={deal.id} variant="scale" delay={i * 90}>
                  <DealCard deal={deal} highlight />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Deals */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16">
        <FadeIn><h2 className="text-2xl font-headline font-bold mb-8">All Promotions</h2></FadeIn>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse space-y-3">
                <div className="w-8 h-8 bg-surface-container-high rounded" />
                <div className="h-5 bg-surface-container-high rounded w-2/3" />
                <div className="h-3 bg-surface-container-high rounded w-1/3" />
                <div className="h-12 bg-surface-container-high rounded" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-on-surface-variant/20 block mb-4" style={{ fontSize: 64 }}>local_offer</span>
            <p className="font-headline font-bold text-xl">No deals available right now</p>
            <p className="text-on-surface-variant text-sm mt-2">Check back soon — new promotions drop weekly.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {deals.map((deal, i) => (
              <FadeIn key={deal.id} variant="scale" delay={Math.min(i, 5) * 80}>
                <DealCard deal={deal} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 text-center">
          <FadeIn variant="scale">
            <h2 className="text-3xl font-headline font-black mb-4">Ready to Save?</h2>
            <p className="text-on-surface-variant font-body mb-8">Browse the full menu and add items to your reservation cart to take advantage of current deals.</p>
            <Link to="/menu" className="btn-primary btn-pulse justify-center">SHOP THE MENU</Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

function DealCard({ deal, highlight }) {
  const isActive = deal.isActive
  const hasDefinedWindow = deal.hasDefinedWindow && deal.startDate && deal.endDate

  return (
    <div
      className={`card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-all border ${
        highlight
          ? 'border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent'
          : isActive
          ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'
          : 'border-white/5'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`material-symbols-outlined text-3xl ${highlight ? 'text-secondary neon-glow-cyan' : 'text-primary neon-glow-pink'}`}>
          {deal.icon || 'local_offer'}
        </span>
        {isActive && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Active
          </span>
        )}
      </div>

      <div>
        <h3 className="font-headline font-bold text-lg leading-tight mb-1">{deal.title}</h3>
        <p className={`text-xs font-label mb-3 ${highlight ? 'text-secondary' : 'text-primary'}`}>{deal.discount}</p>
        <p className="text-on-surface-variant font-body text-sm leading-relaxed">{deal.description}</p>
      </div>

      {deal.schedule && (
        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mt-auto pt-3 border-t border-white/5">
          {deal.schedule}
        </p>
      )}

      {hasDefinedWindow && (
        <p className="text-[10px] font-label text-on-surface-variant/40 -mt-2">
          Runs {new Date(deal.startDate).toLocaleDateString()} – {new Date(deal.endDate).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
