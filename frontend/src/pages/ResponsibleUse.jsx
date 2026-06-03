import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const WARNINGS = [
  {
    icon: 'no_crash',
    title: "Don't Drive High",
    body: 'Driving under the influence of cannabis is illegal and dangerous. Cannabis impairs reaction time, coordination, and judgment. Do not drive or operate heavy machinery after consuming cannabis. If you consume, plan ahead — use a rideshare, designate a driver, or stay put.',
    color: 'from-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: 'pregnant_woman',
    title: 'Pregnancy & Breastfeeding',
    body: 'Cannabis use during pregnancy or while breastfeeding may harm fetal and infant development. The New Mexico Department of Health advises against any cannabis use if you are pregnant, trying to become pregnant, or breastfeeding. Consult your doctor before use.',
    color: 'from-secondary/10',
    textColor: 'text-secondary',
  },
  {
    icon: 'child_care',
    title: 'Keep Away From Minors',
    body: 'Cannabis products must be kept out of the reach of children and pets at all times. Store products in child-resistant, clearly labeled packaging in a locked location. Cannabis can be particularly harmful to developing brains. Accidental ingestion by a minor is a medical emergency — call Poison Control at 1-800-222-1222.',
    color: 'from-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: 'psychology',
    title: 'Mental Health',
    body: 'Cannabis may affect mental health differently in each person. High-potency products, frequent use, or use at a young age may increase risk of anxiety, paranoia, or psychosis, particularly in individuals with a personal or family history of mental illness. Use with caution and consult a healthcare provider if you have concerns.',
    color: 'from-secondary/10',
    textColor: 'text-secondary',
  },
  {
    icon: 'medication',
    title: 'Drug Interactions',
    body: 'Cannabis can interact with prescription and over-the-counter medications, including blood thinners, antidepressants, and sedatives. If you take medications, consult your physician or pharmacist before using cannabis products.',
    color: 'from-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: 'trending_up',
    title: 'Habit Forming',
    body: "Cannabis can be habit forming. Regular, heavy use may lead to cannabis use disorder in some people. Signs include difficulty controlling use, cravings, and continued use despite negative consequences. If you are concerned about your use, SAMHSA's National Helpline is free and confidential: 1-800-662-4357.",
    color: 'from-secondary/10',
    textColor: 'text-secondary',
  },
]

export default function ResponsibleUse() {
  usePageTitle('Responsible Use')

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,124,245,0.06)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Health & Safety</p>
          <h1 className="hero-item text-5xl md:text-6xl font-headline font-black tracking-tighter mb-4">
            Responsible Use
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-lg max-w-2xl leading-relaxed">
            Cannabis can be a wonderful part of adult life when used responsibly. Here's what we want every customer to know before they consume.
          </p>
        </div>
      </section>

      {/* State Warning Banner */}
      <section className="bg-surface-container-low border-y border-white/5 py-6">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
          <div className="flex items-start gap-4 max-w-3xl">
            <span className="material-symbols-outlined text-primary shrink-0 mt-0.5 neon-glow-pink" style={{ fontSize: 22 }}>warning</span>
            <p className="text-xs font-body text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">New Mexico Health Warning:</strong> This product contains cannabis. For use only by adults 21 years of age and older. Keep out of reach of children. There are health risks associated with the consumption of this product. Do not consume this product if you are pregnant or breastfeeding. Do not drive a motor vehicle or operate heavy machinery while under the influence of cannabis. Cannabis can impair concentration, coordination, and judgment.
            </p>
          </div>
        </div>
      </section>

      {/* Warning Cards */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24">
        <FadeIn className="mb-12">
          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Know Before You Consume</p>
          <h2 className="text-4xl font-headline font-black">Health & Safety Guidelines</h2>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WARNINGS.map((w, i) => (
            <FadeIn key={w.title} variant="scale" delay={i * 70}>
              <div className={`card p-6 bg-gradient-to-br ${w.color} to-transparent h-full`}>
                <span className={`material-symbols-outlined text-3xl mb-4 block ${w.textColor}`}>{w.icon}</span>
                <h3 className="font-headline font-bold text-base mb-3">{w.title}</h3>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">{w.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Start Low, Go Slow */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Dosing Guidance</p>
              <h2 className="text-4xl font-headline font-black mb-6">Start Low, Go Slow</h2>
              <p className="text-on-surface-variant font-body leading-relaxed mb-4">
                Especially if you're new to cannabis or trying a new product type, start with the lowest effective dose and wait to feel the full effects before consuming more. Onset times vary significantly by consumption method:
              </p>
              <div className="space-y-3">
                {[
                  { method: 'Inhaled (flower, vape)', onset: '2–10 minutes', duration: '1–3 hours' },
                  { method: 'Edibles & drinks', onset: '30 min – 2 hours', duration: '4–8 hours' },
                  { method: 'Concentrates', onset: '2–10 minutes', duration: '1–4 hours' },
                  { method: 'Topicals (non-transdermal)', onset: '15–45 minutes', duration: '2–4 hours' },
                ].map((row) => (
                  <div key={row.method} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                    <span className="text-xs font-label text-on-surface-variant">{row.method}</span>
                    <div className="text-right">
                      <span className="text-xs font-headline font-bold text-primary block">{row.onset}</span>
                      <span className="text-[10px] font-label text-on-surface-variant/50">{row.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant/60 font-body mt-4 leading-relaxed">
                *Individual onset and duration vary based on body weight, metabolism, tolerance, and product type. These are general estimates only.
              </p>
            </FadeIn>

            <FadeIn variant="scale" delay={100}>
              <div className="space-y-4">
                <div className="card p-5 bg-gradient-to-br from-primary/5 to-transparent">
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">New Mexico Law</p>
                  <ul className="text-sm text-on-surface-variant font-body space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 16 }}>check_circle</span>
                      Adults 21+ may possess up to <strong className="text-on-surface">2 ounces</strong> of cannabis in public.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 16 }}>check_circle</span>
                      Cannabis consumption is <strong className="text-on-surface">prohibited in public places</strong>, in vehicles, and on federal land.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 16 }}>check_circle</span>
                      <strong className="text-on-surface">Do not cross state lines</strong> with cannabis — it remains federally illegal.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 16 }}>check_circle</span>
                      Property owners and employers may still restrict or prohibit cannabis use.
                    </li>
                  </ul>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-3">Crisis Resources</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-headline font-bold text-sm">SAMHSA National Helpline</p>
                      <a href="tel:18006624357" className="text-primary hover:underline font-label text-xs">1-800-662-4357</a>
                      <p className="text-on-surface-variant/60 text-[10px] font-label mt-0.5">Free, confidential, 24/7 substance use treatment referral</p>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-sm">Poison Control Center</p>
                      <a href="tel:18002221222" className="text-primary hover:underline font-label text-xs">1-800-222-1222</a>
                      <p className="text-on-surface-variant/60 text-[10px] font-label mt-0.5">24/7 emergency for accidental ingestion</p>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-sm">NM Crisis & Access Line</p>
                      <a href="tel:18552667100" className="text-primary hover:underline font-label text-xs">1-855-266-7100</a>
                      <p className="text-on-surface-variant/60 text-[10px] font-label mt-0.5">24/7 behavioral health crisis support</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Ask Our Staff */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-24 text-center">
        <FadeIn variant="scale">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block neon-glow-pink">groups</span>
          <h2 className="text-4xl font-headline font-black mb-4">Our Staff Is Here to Help</h2>
          <p className="text-on-surface-variant font-body max-w-lg mx-auto mb-8 leading-relaxed">
            Whether it's your first time or you're an experienced consumer, our knowledgeable team can help you find the right product, dose, and consumption method for your needs. No judgment, ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary btn-pulse justify-center">ASK A QUESTION</Link>
            <Link to="/faq" className="btn-outline justify-center">READ OUR FAQ</Link>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}
