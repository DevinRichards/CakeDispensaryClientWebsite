import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'cake-cookie-consent'

/**
 * Cookie consent banner.
 * Stores preference in localStorage as 'accepted' | 'declined'.
 * Re-appears if preference is not yet set (e.g. new visitors).
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [animateOut, setAnimateOut] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Slight delay so it appears after page loads
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (choice) => {
    localStorage.setItem(STORAGE_KEY, choice)
    setAnimateOut(true)
    setTimeout(() => setVisible(false), 350)
  }

  const accept = () => dismiss('accepted')
  const decline = () => dismiss('declined')

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-[9990] transition-transform duration-350 ${
        animateOut ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="bg-surface-container-low border-t border-white/10 shadow-2xl backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">

          {/* Text */}
          <div className="flex items-start gap-3 flex-1">
            <span
              className="material-symbols-outlined text-primary shrink-0 mt-0.5"
              aria-hidden="true"
              style={{ fontSize: 18 }}
            >
              cookie
            </span>
            <p className="text-xs font-body text-on-surface-variant leading-relaxed">
              We use cookies and similar technologies to enhance your experience and analyze site traffic.
              By clicking "Accept," you consent to our use of cookies as described in our{' '}
              <Link to="/privacy" className="text-primary hover:underline" onClick={() => dismiss('accepted')}>
                Privacy Policy
              </Link>
              . You may decline non-essential cookies without affecting core site functionality.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 shrink-0 items-center">
            <button
              onClick={decline}
              className="text-xs font-label font-bold uppercase tracking-wide text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2"
              aria-label="Decline non-essential cookies"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="btn-primary py-2 px-5 text-xs justify-center"
              aria-label="Accept all cookies"
            >
              Accept
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
