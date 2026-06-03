import { Link } from 'react-router-dom'
import { SOCIAL_LINKS } from '../content/socialMedia'

export default function Footer() {
  return (
    <footer className="bg-[#0e0e10] w-full border-t border-white/5">

      {/* ── NM Health Warning Banner ── */}
      <div className="border-b border-white/5 bg-surface-container/40">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-4">
          <p className="text-[10px] font-body text-on-surface-variant/50 leading-relaxed max-w-4xl">
            <span className="text-on-surface-variant/70 font-bold uppercase tracking-wide">
              ⚠ New Mexico Health Warning:{' '}
            </span>
            This product contains cannabis. For use only by adults 21 years of age and older. Keep out of reach of children and pets. There are health risks associated with the consumption of this product. Do not consume if you are pregnant or breastfeeding. Do not drive or operate heavy machinery while under the influence of cannabis. Cannabis can be habit forming.{' '}
            <Link to="/responsible-use" className="text-primary/70 hover:text-primary underline transition-colors">
              Learn more about responsible use.
            </Link>
          </p>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <div className="mb-3">
            <span className="text-2xl font-black text-primary font-headline neon-glow-pink">Cake</span>
            <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest ml-2">Dispensary</span>
          </div>
          <p className="text-on-surface-variant text-xs leading-relaxed font-body mb-4">
            Where every day is your birthday. Gallup's premier cannabis dispensary — powered by KREME.
          </p>
          <div className="space-y-1.5 mb-4">
            <p className="text-on-surface-variant/60 text-xs font-label">1020 W Maloney Ave, Gallup, NM 87301</p>
            <p className="text-on-surface-variant/60 text-xs font-label">dispensarycake@gmail.com</p>
          </div>
          <p className="text-on-surface-variant/40 text-[10px] font-label mb-2">
            NM Cannabis Retailer License #: <span className="text-on-surface-variant/60">VIC-2025-0034-PRM-0002</span>
          </p>
          <p className="text-on-surface-variant/30 text-[10px] font-label">
            Must be 21+ to enter. Please consume responsibly.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 sm:gap-12 lg:gap-16">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-1">Shop</span>
            <Link to="/menu" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Menu</Link>
            <Link to="/deals" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Deals</Link>
            <Link to="/menu?category=flower" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Flower</Link>
            <Link to="/menu?category=edibles" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Edibles</Link>
            <Link to="/menu?category=concentrates" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Concentrates</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-1">Info</span>
            <Link to="/about" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">About</Link>
            <Link to="/faq" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">FAQ</Link>
            <Link to="/contact" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Contact</Link>
            <Link to="/responsible-use" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Responsible Use</Link>
            <Link to="/admin" className="text-sm text-on-surface-variant/30 hover:text-on-surface-variant transition-colors font-label">Admin</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-1">Legal</span>
            <Link to="/privacy" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Terms of Service</Link>
            <Link to="/accessibility" className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label">Accessibility</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-1">Social</span>
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-on-surface-variant hover:text-secondary transition-colors font-label"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-white/5 px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant/30">
          © 2026 Cake Dispensary. All Rights Reserved. For Adults 21+ Only. · Gallup, NM
        </span>
        <div className="flex gap-4 items-center">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all"
              title={`${social.platform} ${social.handle}`}
              aria-label={`Cake Dispensary on ${social.platform}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>{social.icon}</span>
            </a>
          ))}
          <a
            href="mailto:dispensarycake@gmail.com"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all"
            title="Email Cake Dispensary"
            aria-label="Email Cake Dispensary"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>alternate_email</span>
          </a>
          <a
            href="https://maps.google.com/?q=1020+W+Maloney+Ave,+Gallup,+NM+87301"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all"
            title="Get Directions"
            aria-label="Get directions to Cake Dispensary"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>location_on</span>
          </a>
        </div>
      </div>

    </footer>
  )
}
