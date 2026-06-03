import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const LAST_UPDATED = 'April 15, 2026'

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy')

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,124,245,0.05)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Legal</p>
          <h1 className="hero-item text-5xl md:text-6xl font-headline font-black tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-sm">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-24 space-y-10">

        <FadeIn>
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 text-sm font-body text-on-surface-variant leading-relaxed">
            <span className="material-symbols-outlined text-primary align-middle mr-2" style={{ fontSize: 16 }}>info</span>
            This Privacy Policy applies to <strong className="text-on-surface">cakedispensarynm.com</strong> and all online services operated by Cake Dispensary (a licensed New Mexico cannabis retailer). We are required to comply with New Mexico state data practices and applicable federal privacy law. If you have questions, contact us at{' '}
            <a href="mailto:dispensarycake@gmail.com" className="text-primary hover:underline">
              dispensarycake@gmail.com
            </a>.
          </div>
        </FadeIn>

        <FadeIn>
          <Section title="1. Who We Are">
            <p>Cake Dispensary is a licensed adult-use cannabis retailer located at 1020 W Maloney Ave, Gallup, NM 87301. We operate under a New Mexico Cannabis Retailer License issued by the New Mexico Cannabis Control Division (CCD). References to "we," "us," or "our" mean Cake Dispensary.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="2. Information We Collect">
            <p className="mb-3">We collect information in two ways:</p>
            <h4 className="font-headline font-bold text-sm mb-2">Information You Provide Directly</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-on-surface-variant mb-4">
              <li><strong className="text-on-surface">Reservation requests:</strong> Name, phone number, email address, preferred pickup date and time, and the items in your cart.</li>
              <li><strong className="text-on-surface">Contact form submissions:</strong> Name, phone number, email address, subject, and message content.</li>
            </ul>
            <h4 className="font-headline font-bold text-sm mb-2">Information Collected Automatically</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-on-surface-variant">
              <li><strong className="text-on-surface">Session data:</strong> We use <code className="text-primary text-xs">sessionStorage</code> to remember your age verification within a single browser session. This data never leaves your device.</li>
              <li><strong className="text-on-surface">Cart data:</strong> Your reservation cart is stored in <code className="text-primary text-xs">sessionStorage</code> for the duration of your browser session only.</li>
              <li><strong className="text-on-surface">Server logs:</strong> Our hosting provider may automatically log your IP address, browser type, pages visited, and timestamps for security and diagnostics purposes.</li>
              <li><strong className="text-on-surface">Cookies:</strong> If you consent, we may use first-party cookies for analytics and site performance. See our <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="3. How We Use Your Information">
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li>To process and confirm your in-store pickup reservation.</li>
              <li>To send you a reservation confirmation email.</li>
              <li>To respond to your contact form messages.</li>
              <li>To detect and prevent fraud, abuse, or security incidents.</li>
              <li>To comply with New Mexico cannabis regulations and applicable law.</li>
              <li>To improve our website and customer experience (with your consent, via analytics).</li>
            </ul>
            <p className="mt-4 text-sm text-on-surface-variant">We do <strong className="text-on-surface">not</strong> sell your personal information to third parties. We do not use your data for targeted advertising.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="4. Data Sharing">
            <p className="mb-3">We may share your information only in the following limited circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li><strong className="text-on-surface">Service providers:</strong> We use third-party services for email delivery (e.g., reservation confirmation emails). These providers process data solely on our behalf and are bound by data protection agreements.</li>
              <li><strong className="text-on-surface">Legal compliance:</strong> We may disclose information when required by law, court order, or lawful request from a government authority, including the New Mexico Cannabis Control Division.</li>
              <li><strong className="text-on-surface">Business transfers:</strong> If Cake Dispensary is sold or merged, your information may be transferred as part of that transaction, subject to the same privacy protections.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="5. Data Retention">
            <p>Reservation and contact form records are retained for a minimum of <strong className="text-on-surface">3 years</strong> to comply with New Mexico business recordkeeping requirements and cannabis regulatory obligations. After the retention period, records are securely deleted. Session and cart data stored in your browser clears automatically when you close your browser tab.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="6. Your Rights (Including California Residents / CCPA)">
            <p className="mb-3">Depending on where you live, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li><strong className="text-on-surface">Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong className="text-on-surface">Correction:</strong> Ask us to correct inaccurate or incomplete information.</li>
              <li><strong className="text-on-surface">Deletion:</strong> Request deletion of your personal information, subject to our legal retention obligations.</li>
              <li><strong className="text-on-surface">Opt-out of sale:</strong> We do not sell personal information — this right is not applicable, but we honor it regardless.</li>
            </ul>
            <p className="mt-4 text-sm text-on-surface-variant">To exercise any of these rights, contact us at <a href="mailto:dispensarycake@gmail.com" className="text-primary hover:underline">dispensarycake@gmail.com</a>. We will respond within 45 days.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="7. Security">
            <p>We implement reasonable technical and organizational measures to protect your personal information, including HTTPS encryption, rate limiting on all form submissions, and JWT authentication for administrative access. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="8. Children's Privacy">
            <p>Our website is intended solely for adults aged 21 and older. We do not knowingly collect personal information from anyone under the age of 21. If you believe a minor has submitted information to us, please contact us immediately and we will delete it.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="9. Third-Party Links">
            <p>Our website may contain links to third-party sites (e.g., Google Maps, Instagram). We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies independently.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. Continued use of the website after changes constitutes your acceptance of the updated policy. For material changes, we will provide a more prominent notice.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="11. Contact Us">
            <p className="mb-3">For questions, requests, or concerns about this Privacy Policy or our data practices:</p>
            <div className="card p-5 text-sm space-y-2">
              <p className="font-headline font-bold">Cake Dispensary</p>
              <p className="text-on-surface-variant">1020 W Maloney Ave, Gallup, NM 87301</p>
              <p><a href="mailto:dispensarycake@gmail.com" className="text-primary hover:underline">dispensarycake@gmail.com</a></p>
            </div>
          </Section>
        </FadeIn>

        <FadeIn>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 text-xs font-label text-on-surface-variant/50">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
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
