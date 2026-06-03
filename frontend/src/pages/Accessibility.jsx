import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const LAST_UPDATED = 'April 15, 2026'

export default function Accessibility() {
  usePageTitle('Accessibility')

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,238,252,0.05)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Legal</p>
          <h1 className="hero-item text-5xl md:text-6xl font-headline font-black tracking-tighter mb-4">
            Accessibility Statement
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-sm">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-24 space-y-10">

        <FadeIn>
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5 text-sm font-body text-on-surface-variant leading-relaxed">
            <span className="material-symbols-outlined text-secondary align-middle mr-2" style={{ fontSize: 16 }}>accessibility_new</span>
            Cake Dispensary is committed to ensuring our website is accessible to all users, including those with disabilities. We strive to meet <strong className="text-on-surface">WCAG 2.1 Level AA</strong> conformance across our site.
          </div>
        </FadeIn>

        <FadeIn>
          <Section title="Our Commitment">
            <p>We believe everyone deserves equal access to cannabis information and services. Cake Dispensary is actively working to improve the accessibility of <strong className="text-on-surface">cakedispensarynm.com</strong> in accordance with the <strong className="text-on-surface">Americans with Disabilities Act (ADA)</strong>, <strong className="text-on-surface">Section 508 of the Rehabilitation Act</strong>, and the <strong className="text-on-surface">Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Measures We Take">
            <p className="mb-3">We have taken the following steps to improve accessibility on our website:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li>All page sections use semantic HTML5 elements (<code className="text-secondary text-xs">header</code>, <code className="text-secondary text-xs">main</code>, <code className="text-secondary text-xs">footer</code>, <code className="text-secondary text-xs">nav</code>) for proper structure.</li>
              <li>The <code className="text-secondary text-xs">lang="en"</code> attribute is set on the <code className="text-secondary text-xs">&lt;html&gt;</code> element for screen reader language detection.</li>
              <li>All interactive elements (buttons, links) are keyboard-navigable and have visible focus indicators.</li>
              <li>Product images include descriptive <code className="text-secondary text-xs">alt</code> text based on product names.</li>
              <li>The age verification dialog uses ARIA roles (<code className="text-secondary text-xs">role="dialog"</code>, <code className="text-secondary text-xs">aria-modal</code>, <code className="text-secondary text-xs">aria-labelledby</code>) and traps keyboard focus correctly.</li>
              <li>Form fields use associated <code className="text-secondary text-xs">&lt;label&gt;</code> elements and include ARIA descriptions where applicable.</li>
              <li>Color is not used as the only means of conveying information.</li>
              <li>Text is resizable up to 200% without loss of functionality or content.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Known Limitations">
            <p className="mb-3">While we strive for full WCAG 2.1 AA compliance, some areas are still being improved:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li>Some decorative images may not yet have empty <code className="text-secondary text-xs">alt=""</code> attributes to suppress screen reader announcements.</li>
              <li>Embedded Google Maps in the Contact page are provided by a third party and may not be fully accessible. Directions are also available as a plain-text address on the same page.</li>
              <li>Some low-opacity text used for decorative labels may not meet 4.5:1 contrast ratios. These are being reviewed and updated.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Feedback & Contact">
            <p className="mb-4">We welcome your feedback on the accessibility of our website. If you encounter an accessibility barrier or need assistance with any content, please contact us through any of the following methods:</p>
            <div className="card p-5 text-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontSize: 18 }}>alternate_email</span>
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-0.5">Email</p>
                  <a href="mailto:dispensarycake@gmail.com" className="text-primary hover:underline font-headline font-bold text-sm">dispensarycake@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontSize: 18 }}>mail</span>
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-0.5">Mail</p>
                  <p className="font-body text-sm text-on-surface-variant">1020 W Maloney Ave, Gallup, NM 87301</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">We aim to respond to accessibility feedback within <strong className="text-on-surface">5 business days</strong>. If you need an accommodation to access a specific product or service, please contact us and we will be happy to assist you.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Technical Approach">
            <p>This website is built using React with semantic HTML and Tailwind CSS. We conduct periodic accessibility audits using automated tools (axe, Lighthouse) and manual keyboard and screen reader testing. We use VoiceOver (macOS/iOS) and NVDA (Windows) as our primary screen reader references.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Formal Complaints">
            <p>If you are not satisfied with our response to your accessibility concern, you may contact the <strong className="text-on-surface">U.S. Department of Justice</strong> Civil Rights Division or file a complaint with the appropriate federal or state agency. More information is available at <a href="https://www.ada.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ada.gov</a>.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 text-xs font-label text-on-surface-variant/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/responsible-use" className="hover:text-primary transition-colors">Responsible Use</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </FadeIn>

      </section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-headline font-bold mb-4 text-on-surface">{title}</h2>
      <div className="text-sm text-on-surface-variant font-body leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  )
}
