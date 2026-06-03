import { useState } from 'react'
import { submitContact } from '../api'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const HOURS = [
  { day: 'Mon – Thu', hours: '10:00 AM – 10:00 PM' },
  { day: 'Fri – Sat', hours: '10:00 AM – 11:00 PM' },
  { day: 'Sun',       hours: '12:00 PM – 10:00 PM' },
]

const SUBJECTS = [
  'General Inquiry',
  'Reservation Help',
  'Product Question',
  'Deals & Promotions',
  'Feedback',
  'Employment',
  'Other',
]

export default function Contact() {
  usePageTitle('Contact')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await submitContact(form)
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,124,245,0.06)_0%,transparent_60%)]" />
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative">
          <p className="hero-item text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">Get in Touch</p>
          <h1 className="hero-item text-6xl font-headline font-black tracking-tighter mb-4">
            Contact<br />
            <span className="text-primary neon-glow-pink">Cake Dispensary</span>
          </h1>
          <p className="hero-item text-on-surface-variant font-body text-lg max-w-xl">
            Questions, feedback, or just want to chat about cannabis? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 pb-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Form */}
          <FadeIn>
            {status === 'success' ? (
              <div className="card p-10 text-center">
                <span className="material-symbols-outlined text-secondary text-6xl block mb-4 neon-glow-cyan">check_circle</span>
                <h2 className="text-2xl font-headline font-bold mb-3">Message Sent!</h2>
                <p className="text-on-surface-variant font-body mb-6 leading-relaxed">
                  Thanks for reaching out. We'll get back to you within 1 business day.
                </p>
                <button
                  onClick={() => { setStatus(null); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                  className="btn-outline"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full Name *</label>
                    <input required name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input required name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input required name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" className="input-field" />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <select required name="subject" value={form.subject} onChange={handleChange} className="input-field">
                    <option value="">Select a topic...</option>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea
                    required
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="input-field resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-error-container/30 border border-error/30 rounded-lg p-3 text-sm text-error font-body">{error}</div>
                )}

                <p className="text-[10px] font-label text-on-surface-variant/40 leading-relaxed">
                  Your information is used only to respond to your message and will never be sold.{' '}
                  <a href="/privacy" className="text-primary/60 hover:text-primary underline transition-colors">
                    Privacy Policy
                  </a>
                </p>

                <button type="submit" disabled={status === 'loading'} className="w-full btn-primary justify-center py-4 btn-pulse">
                  {status === 'loading' ? 'Sending...' : 'SEND MESSAGE'}
                </button>
              </form>
            )}
          </FadeIn>

          {/* Info sidebar */}
          <FadeIn variant="left" delay={100}>
          <div className="space-y-8">
            {/* Hours */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <h3 className="font-headline font-bold">Store Hours</h3>
              </div>
              <div className="space-y-3">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-on-surface-variant font-label text-xs">{h.day}</span>
                    <span className="font-headline font-bold text-xs">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h3 className="font-headline font-bold">Location</h3>
              </div>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-4">
                1020 W Maloney Ave<br />Gallup, NM 87301
              </p>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  title="Cake Dispensary Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3217.1!2d-108.7447!3d35.5281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x873a3e5e5e5e5e5e%3A0x0!2s1020+W+Maloney+Ave%2C+Gallup%2C+NM+87301!5e0!3m2!1sen!2sus!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://maps.google.com/?q=1020+W+Maloney+Ave,+Gallup,+NM+87301"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-3 text-xs font-label text-secondary hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                Open in Google Maps
              </a>
            </div>

            {/* Contact details */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">alternate_email</span>
                <div>
                  <p className="text-xs font-label text-on-surface-variant/40 uppercase tracking-widest">Email</p>
                  <p className="font-headline font-bold text-sm">dispensarycake@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
