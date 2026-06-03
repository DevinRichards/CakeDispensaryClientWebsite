import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'
import { INSTAGRAM_URL } from '../content/socialMedia'

const VALUES = [
  { icon: 'cake', title: 'The Kreme of the Crop', body: 'We founded Cake with a single goal: offer the very best cannabis in Gallup at unbeatable value. Every product on our shelves earns its spot.' },
  { icon: 'handshake', title: 'Quality Partners Only', body: 'We partner exclusively with companies that use the finest ingredients and share our commitment to craft. If we wouldn\'t consume it ourselves, it doesn\'t make it to the shelf.' },
  { icon: 'groups', title: 'Gallup\'s Dispensary', body: 'We\'re proud to be rooted in the Gallup community. We offer daily deals, first-timer discounts, and special promotions because we believe everyone deserves access to quality cannabis.' },
  { icon: 'school', title: 'Here to Help', body: 'Whether it\'s your first time or your hundredth, our team is here to guide you. No question is too basic — we want every customer to leave feeling confident and cared for.' },
]

export default function About() {
  usePageTitle('About Us')
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,124,245,0.07)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Who We Are</p>
          <h1 className="hero-item text-6xl md:text-7xl font-headline font-black leading-none tracking-tighter mb-6">
            About<br />
            <span className="text-primary neon-glow-pink">Cake Dispensary</span>
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-xl leading-relaxed max-w-2xl mb-4">
            Gallup's premier cannabis dispensary — where every day is your birthday.
          </p>
          <p className="hero-item text-on-surface-variant/50 font-label text-sm tracking-widest uppercase">
            Powered by KREME · 1020 W Maloney Ave, Gallup, NM
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-4xl font-headline font-black mb-6">Our Story</h2>
              <p className="text-on-surface-variant font-body leading-relaxed mb-5">
                Cake Dispensary was born from a simple idea: Gallup deserved the kreme of all flower at a price that made sense. We set out to build the kind of dispensary where quality is never a question and every visit feels like a celebration.
              </p>
              <p className="text-on-surface-variant font-body leading-relaxed mb-5">
                Just like baking the perfect cake, we pour love and care into everything we do — and we hope you experience that passion with every puff, sip, or bite. Life is sweeter when you can have your Cake and smoke it too.
              </p>
              <p className="text-on-surface-variant font-body leading-relaxed">
                We carry a wide selection of flower, concentrates, edibles, vapes, pre-rolls, and topicals — all personally vetted and sourced from brands we trust. If you don't find what you're looking for, just ask. We're always listening.
              </p>
            </FadeIn>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '4.2★', label: 'Google Rating', color: 'text-primary neon-glow-pink', bg: 'from-primary/10' },
                { val: '100+', label: 'Happy Reviews', color: 'text-secondary neon-glow-cyan', bg: 'from-secondary/10' },
                { val: '6', label: 'Product Categories', color: 'text-tertiary', bg: 'from-tertiary/10' },
                { val: '21+', label: 'Adults Only', color: 'text-primary neon-glow-pink', bg: 'from-primary/10' },
              ].map((stat, i) => (
                <FadeIn key={stat.label} variant="scale" delay={i * 80}>
                  <div className={`card p-8 text-center aspect-square flex flex-col items-center justify-center bg-gradient-to-br ${stat.bg} to-transparent`}>
                    <span className={`text-4xl font-headline font-black ${stat.color} mb-1`}>{stat.val}</span>
                    <span className="text-xs font-label text-on-surface-variant">{stat.label}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
        <FadeIn className="mb-12">
          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">What We Stand For</p>
          <h2 className="text-4xl font-headline font-black">Our Values</h2>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} variant="scale" delay={i * 80}>
              <div className="card p-6 hover:-translate-y-1 transition-all h-full">
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block">{v.icon}</span>
                <h3 className="font-headline font-bold text-base mb-3">{v.title}</h3>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">{v.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Location highlight */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Find Us</p>
              <h2 className="text-4xl font-headline font-black mb-6">Come Visit Us in Gallup</h2>
              <p className="text-on-surface-variant font-body leading-relaxed mb-8">
                We're located right on W Maloney Ave in Gallup, New Mexico. Stop in any day of the week — our doors are open and our team is ready to help you find exactly what you need.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                  <div>
                    <p className="font-headline font-bold">1020 W Maloney Ave</p>
                    <p className="text-on-surface-variant font-body text-sm">Gallup, NM 87301</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">alternate_email</span>
                  <a href="mailto:dispensarycake@gmail.com" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">dispensarycake@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div className="text-on-surface-variant font-body text-sm">
                    <p>Mon–Thu: 10:00 AM – 10:00 PM</p>
                    <p>Fri–Sat: 10:00 AM – 11:00 PM</p>
                    <p>Sunday: 12:00 PM – 10:00 PM</p>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn variant="left" delay={120}>
            <div className="card p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border border-white/5">
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-6">Follow Along</p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-pulse justify-center mb-4 w-full"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
                @CAKEDISPENSARY
              </a>
              <p className="text-on-surface-variant font-body text-sm">
                Follow us on Instagram for daily deals, new arrivals, and Gallup's biggest birthday party announcements.
              </p>
            </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24 text-center">
        <FadeIn variant="scale">
        <h2 className="text-4xl font-headline font-black mb-4">Where Every Day Is Your Birthday</h2>
        <p className="text-on-surface-variant font-body mb-8 max-w-md mx-auto">
          Browse our menu, reserve your favorites, or just come on in — the party starts the moment you walk through our doors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/menu" className="btn-primary btn-pulse justify-center">SHOP THE MENU</Link>
          <Link to="/contact" className="btn-outline justify-center">CONTACT US</Link>
        </div>
        </FadeIn>
      </section>
    </div>
  )
}
