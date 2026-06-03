import { useState } from 'react'
import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'
import { FAQ_SCHEMA } from '../seo'
import { FAQS } from '../data/faqs'

export default function FAQ() {
  usePageTitle('FAQ', {
    structuredData: FAQ_SCHEMA,
  })
  const [openItem, setOpenItem] = useState(null)

  const toggle = (key) => setOpenItem(openItem === key ? null : key)

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(204,122,255,0.06)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Got Questions?</p>
          <h1 className="hero-item text-6xl font-headline font-black tracking-tighter mb-4">
            Frequently<br />
            <span className="text-tertiary">Asked Questions</span>
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-lg max-w-xl">
            Everything you need to know about shopping, reserving, and visiting Cake Dispensary.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-24">
        {FAQS.map((section, si) => (
          <FadeIn key={section.category} delay={si * 60}>
          <div className="mb-12">
            <h2 className="text-xs font-label uppercase tracking-widest text-on-surface-variant/40 mb-4 pb-2 border-b border-white/5">
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((item, idx) => {
                const key = `${section.category}-${idx}`
                const isOpen = openItem === key
                return (
                  <div
                    key={key}
                    className={`card overflow-hidden transition-all ${isOpen ? 'border border-primary/20' : 'border border-transparent'}`}
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-5 text-left gap-4"
                    >
                      <span className="font-headline font-bold text-sm leading-snug">{item.q}</span>
                      <span className={`material-symbols-outlined shrink-0 text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} style={{ fontSize: 20 }}>
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5">
                        <p className="text-on-surface-variant font-body text-sm leading-relaxed border-t border-white/5 pt-4">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          </FadeIn>
        ))}

        {/* Still have questions */}
        <FadeIn variant="scale">
        <div className="card p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border border-white/5">
          <span className="material-symbols-outlined text-primary text-3xl mb-3 block neon-glow-pink">chat</span>
          <h3 className="font-headline font-bold text-lg mb-2">Still Have Questions?</h3>
          <p className="text-on-surface-variant font-body text-sm mb-6">
            Our team is always happy to help. Reach out via the contact form or just stop by the store.
          </p>
          <Link to="/contact" className="btn-primary btn-pulse justify-center">CONTACT US</Link>
        </div>
        </FadeIn>
      </section>
    </div>
  )
}
