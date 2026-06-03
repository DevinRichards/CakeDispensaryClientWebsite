import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const LAST_UPDATED = 'April 15, 2026'

export default function TermsOfService() {
  usePageTitle('Terms of Service')

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,124,245,0.05)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Legal</p>
          <h1 className="hero-item text-5xl md:text-6xl font-headline font-black tracking-tighter mb-4">
            Terms of Service
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
            <span className="material-symbols-outlined text-primary align-middle mr-2" style={{ fontSize: 16 }}>gavel</span>
            Please read these Terms of Service carefully before using <strong className="text-on-surface">cakedispensarynm.com</strong>. By accessing or using our website, you agree to be bound by these terms. If you do not agree, please do not use our website.
          </div>
        </FadeIn>

        <FadeIn>
          <Section title="1. Eligibility — You Must Be 21+">
            <p>This website is intended exclusively for adults who are <strong className="text-on-surface">21 years of age or older</strong>. By accessing this site, you represent and warrant that you are at least 21 years old and are legally permitted under applicable state and local laws to purchase adult-use cannabis products.</p>
            <p>Use of this site by anyone under the age of 21 is strictly prohibited. Cake Dispensary reserves the right to refuse service and cancel any reservation if we have reason to believe this requirement is not met.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="2. Geographic Restrictions">
            <p>Cannabis is legal for adult use in the State of New Mexico under the Lynn and Erin Compassionate Use Act and the Cannabis Regulation Act. However, cannabis remains a Schedule I controlled substance under federal law, and its possession, sale, and transport remain illegal under federal jurisdiction.</p>
            <p>By using this website, you acknowledge that you are accessing it in a jurisdiction where adult-use cannabis is legal and that you will comply with all applicable state, local, and federal laws. <strong className="text-on-surface">Cannabis purchased at Cake Dispensary may not be transported across state lines.</strong></p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="3. Online Reservation System">
            <p className="mb-3">Our website allows you to browse products and submit an online reservation for in-store pickup. By submitting a reservation, you agree to the following:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
              <li><strong className="text-on-surface">No online payment:</strong> No payment is collected through this website. All transactions are completed in-store at the time of pickup.</li>
              <li><strong className="text-on-surface">Valid ID required:</strong> You must present a valid government-issued photo ID proving you are 21 or older at the time of pickup. Accepted forms include: driver's license, state ID card, U.S. passport, or military ID. We check ID at the door — no exceptions.</li>
              <li><strong className="text-on-surface">Reservation hold window:</strong> Reservations are held for <strong className="text-on-surface">24 hours</strong> from your selected pickup time. After that window, reserved items may be returned to general inventory. If you are running late, please use the contact form.</li>
              <li><strong className="text-on-surface">Cancellations:</strong> You may cancel or modify a reservation at no charge by using the contact form. Please provide as much advance notice as possible.</li>
              <li><strong className="text-on-surface">Pricing:</strong> Prices displayed on the website are subject to change without notice. The price you pay is the in-store price at the time of pickup, which may differ from the online listing price. We will notify you of any material price changes before completing your transaction.</li>
              <li><strong className="text-on-surface">Availability:</strong> Product listings on the website are for informational purposes and do not constitute a guarantee of availability. Stock may change before your pickup time. We will make reasonable efforts to notify you if reserved items become unavailable.</li>
              <li><strong className="text-on-surface">Accurate information:</strong> You agree to provide accurate contact information when submitting a reservation. False or fraudulent reservations are prohibited.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="4. Product Information & Lab Results">
            <p>Product descriptions, THC/CBD percentages, and terpene profiles are provided by our suppliers and reflect lab results at the time of testing. Actual potency and characteristics may vary between batches. Nothing on this website constitutes medical advice, and our product information should not be used as a substitute for professional medical guidance.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="5. Responsible Use">
            <p>By using this website and purchasing products from Cake Dispensary, you acknowledge the following:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant mt-3">
              <li>Cannabis products are for personal, adult use only and must be kept out of reach of children and pets.</li>
              <li>Do not drive or operate heavy machinery while under the influence of cannabis.</li>
              <li>Do not use cannabis if you are pregnant, planning to become pregnant, or breastfeeding.</li>
              <li>Cannabis may be habit forming and may have health risks. See our <Link to="/responsible-use" className="text-primary hover:underline">Responsible Use page</Link> for more information.</li>
              <li>Cannabis purchased in New Mexico must be consumed in private. Public consumption is illegal.</li>
            </ul>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="6. Intellectual Property">
            <p>All content on this website — including text, graphics, logos, images, and software — is the property of Cake Dispensary or its content suppliers and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="7. Disclaimer of Warranties">
            <p>This website and its content are provided on an <strong className="text-on-surface">"as is" and "as available"</strong> basis without warranties of any kind, either express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components. We reserve the right to modify or discontinue the site or any feature at any time without notice.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="8. Limitation of Liability">
            <p>To the fullest extent permitted by law, Cake Dispensary and its owners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of this website or any products purchased, even if advised of the possibility of such damages. Our total liability for any claim shall not exceed the amount paid for the specific transaction at issue.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="9. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of the <strong className="text-on-surface">State of New Mexico</strong>, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in McKinley County, New Mexico.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="10. Changes to These Terms">
            <p>We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with a revised "Last Updated" date. Your continued use of the website after changes are posted constitutes your acceptance of the updated terms.</p>
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="11. Contact">
            <p className="mb-3">Questions about these Terms? Reach us at:</p>
            <div className="card p-5 text-sm space-y-2">
              <p className="font-headline font-bold">Cake Dispensary</p>
              <p className="text-on-surface-variant">1020 W Maloney Ave, Gallup, NM 87301</p>
              <p><a href="mailto:dispensarycake@gmail.com" className="text-primary hover:underline">dispensarycake@gmail.com</a></p>
            </div>
          </Section>
        </FadeIn>

        <FadeIn>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 text-xs font-label text-on-surface-variant/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
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
