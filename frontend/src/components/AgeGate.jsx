import { useState, useEffect, useRef, useCallback } from 'react'

const SESSION_KEY = 'cake-age-verified'

// Build year range: current year down to 80 years ago
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - i)
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function isAtLeast21(month, day, year) {
  const dob = new Date(year, month - 1, day)
  const today = new Date()
  const cutoff = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate())
  return dob <= cutoff
}

export default function AgeGate({ children }) {
  const isServer = typeof window === 'undefined'
  if (isServer) return children

  // Initialize directly from sessionStorage so returning users never see a flash
  const [verified, setVerified] = useState(() => (
    sessionStorage.getItem(SESSION_KEY) === 'true'
  ))
  const [visible, setVisible] = useState(false)
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState(null)

  // Refs for focus trap
  const dialogRef = useRef(null)
  const firstFocusRef = useRef(null)
  const headingId = 'age-gate-heading'

  useEffect(() => {
    if (isServer) return
    // Only show the gate if not already verified
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
      setVisible(true)
    }
  }, [isServer])

  // Focus first element when modal opens
  useEffect(() => {
    if (visible && firstFocusRef.current) {
      setTimeout(() => firstFocusRef.current?.focus(), 50)
    }
  }, [visible])

  // Focus trap: keep keyboard focus inside the dialog
  const handleKeyDown = useCallback((e) => {
    if (!visible) return
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    // Prevent Escape from dismissing — age gate is mandatory
  }, [visible])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const confirm = () => {
    setError(null)

    if (!month || !day || !year) {
      setError('Please select your full date of birth.')
      return
    }

    if (!isAtLeast21(Number(month), Number(day), Number(year))) {
      setError('You must be 21 or older to enter this site.')
      return
    }

    sessionStorage.setItem(SESSION_KEY, 'true')
    setVisible(false)
    setTimeout(() => setVerified(true), 400)
  }

  const deny = () => {
    window.location.href = 'https://www.google.com'
  }

  return (
    <>
      {/* Age Gate Overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        ref={dialogRef}
        className={`fixed inset-0 z-[9999] bg-black/97 backdrop-blur-xl flex items-center justify-center transition-opacity duration-400 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center px-8 max-w-lg mx-auto animate-fade-in-up w-full">
          {/* Logo */}
          <div className="mb-6">
            <span className="text-6xl font-black tracking-tighter text-primary font-headline neon-glow-pink">
              Cake
            </span>
            <span className="block text-sm font-label text-on-surface-variant uppercase tracking-[0.3em] mt-2">
              Dispensary
            </span>
          </div>

          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mb-8" />

          <h2 id={headingId} className="text-3xl font-headline font-bold mb-3">
            Verify Your Age
          </h2>
          <p className="text-on-surface-variant text-sm mb-8 font-body leading-relaxed max-w-sm mx-auto">
            You must be 21 years of age or older to enter. Please enter your date of birth to continue.
          </p>

          {/* DOB Selects */}
          <div
            className="grid grid-cols-3 gap-3 mb-4 max-w-sm mx-auto"
            role="group"
            aria-label="Date of birth"
          >
            {/* Month */}
            <div>
              <label htmlFor="age-gate-month" className="label mb-1.5 text-center block">
                Month
              </label>
              <select
                id="age-gate-month"
                ref={firstFocusRef}
                value={month}
                onChange={(e) => { setMonth(e.target.value); setError(null) }}
                className="input-field text-center"
                aria-required="true"
              >
                <option value="">MM</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div>
              <label htmlFor="age-gate-day" className="label mb-1.5 text-center block">
                Day
              </label>
              <select
                id="age-gate-day"
                value={day}
                onChange={(e) => { setDay(e.target.value); setError(null) }}
                className="input-field text-center"
                aria-required="true"
              >
                <option value="">DD</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label htmlFor="age-gate-year" className="label mb-1.5 text-center block">
                Year
              </label>
              <select
                id="age-gate-year"
                value={year}
                onChange={(e) => { setYear(e.target.value); setError(null) }}
                className="input-field text-center"
                aria-required="true"
              >
                <option value="">YYYY</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="text-sm text-error font-body mb-4 bg-error-container/20 border border-error/30 rounded-lg px-4 py-2 max-w-sm mx-auto"
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
            <button
              onClick={confirm}
              className="btn-primary btn-pulse justify-center text-base px-10 py-4 flex-1"
            >
              Enter Site
            </button>
            <button
              onClick={deny}
              className="btn-outline px-10 py-4 justify-center flex-1"
            >
              I'm Under 21
            </button>
          </div>

          <p className="text-[10px] text-on-surface-variant/30 mt-8 font-label uppercase tracking-widest">
            For compliance with New Mexico cannabis laws · Must be 21+
          </p>
        </div>
      </div>

      {/* Site content — only mounted after verification so animations play fresh */}
      {verified && children}
    </>
  )
}
