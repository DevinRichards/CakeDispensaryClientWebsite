import { useEffect, useState, useMemo } from 'react'
import { useCart, PURCHASE_LIMITS } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { createReservation } from '../api'
import { formatCurrency, getCartPriceTotals, getLinePrices } from '../utils/pricing'

// ─── Store hours by day of week ────────────────────────────────────────────────
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const STORE_HOURS = {
  0: { open: 12, close: 22 }, // Sunday  12pm – 10pm
  1: { open: 10, close: 22 }, // Monday  10am – 10pm
  2: { open: 10, close: 22 },
  3: { open: 10, close: 22 },
  4: { open: 10, close: 22 },
  5: { open: 10, close: 23 }, // Friday  10am – 11pm
  6: { open: 10, close: 23 }, // Saturday
}

/**
 * Generate 15-minute pickup time slots for the given date string (YYYY-MM-DD).
 * Same-day reservations are allowed — past slots are simply hidden.
 */
function getPickupSlots(dateStr) {
  if (!dateStr) return []

  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dow   = date.getDay()
  const hours = STORE_HOURS[dow] || { open: 10, close: 22 }

  const now     = new Date()
  const isToday = dateStr === now.toISOString().slice(0, 10)

  const slots = []
  for (let h = hours.open; h < hours.close; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (isToday) {
        // Skip slots that have already passed
        const slotTime = new Date(year, month - 1, day, h, m)
        if (slotTime <= now) continue
      }
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm   = h >= 12 ? 'PM' : 'AM'
      const minStr = m === 0 ? '00' : m.toString()
      slots.push(`${hour12}:${minStr} ${ampm}`)
    }
  }
  return slots
}

export default function CartSidebar() {
  const { items, total, count, isOpen, closeCart, removeItem, setQty, clearCart, purchaseTotals } = useCart()
  const { user, isSignedIn, addReservation } = useUser()
  const [step, setStep]     = useState('cart') // 'cart' | 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [form, setForm]     = useState({ name: '', phone: '', email: '', pickupDate: '', pickupTime: '' })

  const today = new Date().toISOString().slice(0, 10)
  const priceTotals = useMemo(() => getCartPriceTotals(items), [items])

  // Regenerate slots whenever the selected date changes
  const pickupSlots = useMemo(() => getPickupSlots(form.pickupDate), [form.pickupDate])

  useEffect(() => {
    if (!isSignedIn || !user) return
    setForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }))
  }, [isSignedIn, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => {
      const updated = { ...f, [name]: value }
      // Reset time if date changes and current time is no longer valid
      if (name === 'pickupDate') updated.pickupTime = ''
      return updated
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.pickupTime) {
      setError('Please select a pickup time.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await createReservation({ ...form, items: items.map((i) => ({ ...i })) })
      addReservation(result.reservation)
      clearCart()
      setStep('success')
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('cart')
    setForm({ name: '', phone: '', email: '', pickupDate: '', pickupTime: '' })
    closeCart()
  }

  // ── Purchase limit bar ──────────────────────────────────────────────────────
  const limitBars = [
    purchaseTotals.flowerGrams      > 0 && { label: 'Flower',      current: purchaseTotals.flowerGrams,      limit: PURCHASE_LIMITS.flowerGrams.limit,      unit: 'g'  },
    purchaseTotals.concentrateGrams > 0 && { label: 'Concentrate', current: purchaseTotals.concentrateGrams, limit: PURCHASE_LIMITS.concentrateGrams.limit, unit: 'g'  },
    purchaseTotals.edibleThcMg      > 0 && { label: 'Edible THC',  current: purchaseTotals.edibleThcMg,      limit: PURCHASE_LIMITS.edibleThcMg.limit,      unit: 'mg' },
  ].filter(Boolean)

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in" onClick={closeCart} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-low z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-headline font-bold">
              {step === 'cart'    && 'Reservation Cart'}
              {step === 'form'    && 'Complete Reservation'}
              {step === 'success' && 'Reservation Submitted!'}
            </h2>
            {step === 'cart' && count > 0 && (
              <p className="text-on-surface-variant text-xs font-label">{count} item{count !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── CART STEP ── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-on-surface-variant/20 block mb-3" style={{ fontSize: 56 }}>
                    shopping_basket
                  </span>
                  <p className="text-on-surface-variant font-body text-sm">
                    Your cart is empty. Browse the menu to add items.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-surface-container-high rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-bold text-sm truncate">{item.name}</p>
                      <p className="text-on-surface-variant text-xs font-label">
                        {item.variant ? item.variant : item.type}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => setQty(item.id, item.qty - 1)} className="w-6 h-6 bg-surface-container rounded text-center text-sm font-bold hover:bg-primary hover:text-on-primary transition-colors leading-6">−</button>
                        <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} className="w-6 h-6 bg-surface-container rounded text-center text-sm font-bold hover:bg-primary hover:text-on-primary transition-colors leading-6">+</button>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-secondary font-headline font-bold">{formatCurrency(getLinePrices(item).recreational)}</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-label">
                        Med {formatCurrency(getLinePrices(item).medical)}
                      </p>
                      <button onClick={() => removeItem(item.id)} className="text-on-surface-variant/40 hover:text-error transition-colors mt-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/5 shrink-0 space-y-4">
                {/* Purchase limit bars */}
                {limitBars.length > 0 && (
                  <div className="space-y-2">
                    {limitBars.map((bar) => {
                      const pct  = Math.min((bar.current / bar.limit) * 100, 100)
                      const near = pct >= 80
                      return (
                        <div key={bar.label}>
                          <div className="flex justify-between text-[10px] font-label text-on-surface-variant/50 mb-1">
                            <span>{bar.label} limit</span>
                            <span className={near ? 'text-error' : ''}>
                              {bar.current}{bar.unit} / {bar.limit}{bar.unit}
                            </span>
                          </div>
                          <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${near ? 'bg-error' : 'bg-primary'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-[9px] font-label text-on-surface-variant/30 leading-relaxed">
                      NM adult-use limits: 56g flower · 16g concentrate · 800mg THC edibles per transaction
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-headline font-bold text-lg">Medical Total</span>
                    <span className="font-headline font-black text-xl text-secondary">{formatCurrency(priceTotals.medical)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-headline font-bold text-lg">Recreational Total</span>
                    <span className="font-headline font-black text-xl text-secondary">{formatCurrency(priceTotals.recreational)}</span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant font-label">
                  No payment required now. Final medical or recreational pricing is confirmed in-store at pickup.
                </p>
                <button onClick={() => setStep('form')} className="w-full btn-primary justify-center py-4 text-sm btn-pulse">
                  PROCEED TO RESERVATION
                </button>
              </div>
            )}
          </>
        )}

        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Cart summary */}
              <div className="bg-surface-container-high rounded-xl p-4 mb-2">
                <p className="label mb-2">Your Items</p>
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs py-1 text-on-surface-variant font-body">
                    <span>{i.qty}× {i.name}{i.variant ? ` (${i.variant})` : ''}</span>
                    <span className="text-secondary">{formatCurrency(getLinePrices(i).recreational)}</span>
                  </div>
                ))}
                <div className="space-y-1 pt-2 border-t border-white/5 mt-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Medical Total</span>
                    <span className="text-secondary">{formatCurrency(priceTotals.medical)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Recreational Total</span>
                    <span className="text-secondary">{formatCurrency(priceTotals.recreational)}</span>
                  </div>
                </div>
              </div>

              {/* Contact fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="res-name">Full Name *</label>
                  <input id="res-name" required name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" className="input-field" />
                </div>
                <div>
                  <label className="label" htmlFor="res-phone">Phone *</label>
                  <input id="res-phone" required name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="res-email">Email Address *</label>
                <input id="res-email" required name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" className="input-field" />
              </div>

              {/* Pickup date — same-day allowed, no min restriction beyond today */}
              <div>
                <label className="label" htmlFor="res-date">Pickup Date *</label>
                <input
                  id="res-date"
                  required
                  name="pickupDate"
                  type="date"
                  min={today}
                  value={form.pickupDate}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* 15-minute time slots */}
              <div>
                <label className="label" htmlFor="res-time">
                  Pickup Time *
                  {form.pickupDate && (
                    <span className="ml-2 normal-case font-body text-on-surface-variant/40 text-[10px]">
                      {pickupSlots.length === 0 ? 'Store is closed — choose another date' : `${pickupSlots.length} slots available`}
                    </span>
                  )}
                </label>
                <select
                  id="res-time"
                  required
                  name="pickupTime"
                  value={form.pickupTime}
                  onChange={handleChange}
                  disabled={!form.pickupDate || pickupSlots.length === 0}
                  className="input-field disabled:opacity-40"
                >
                  <option value="">
                    {!form.pickupDate
                      ? 'Select a date first...'
                      : pickupSlots.length === 0
                        ? 'No slots available'
                        : 'Choose a time...'}
                  </option>
                  {pickupSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-xs font-body text-on-surface-variant leading-relaxed">
                <span className="material-symbols-outlined text-primary align-middle mr-1" style={{ fontSize: 14 }}>info</span>
                A confirmation email will be sent upon submission. No payment required — all transactions handled in-store at pickup. Valid ID required (21+).
              </div>

              <p className="text-[10px] font-label text-on-surface-variant/40 leading-relaxed">
                Your contact info is used only to confirm your reservation and will never be sold.{' '}
                <a href="/privacy" className="text-primary/60 hover:text-primary underline transition-colors">Privacy Policy</a>
              </p>

              {error && (
                <div className="bg-error-container/30 border border-error/30 rounded-lg p-3 text-sm text-error font-body">{error}</div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 shrink-0">
              <button type="button" onClick={() => setStep('cart')} className="btn-outline flex-1 justify-center">
                ← Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center btn-pulse">
                {loading ? 'Submitting...' : 'SUBMIT'}
              </button>
            </div>
          </form>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="material-symbols-outlined text-secondary mb-4 neon-glow-cyan animate-pop-in" style={{ fontSize: 64 }}>
              check_circle
            </span>
            <h3 className="text-2xl font-headline font-bold mb-3">Reservation Submitted!</h3>
            <p className="text-on-surface-variant font-body leading-relaxed mb-8 max-w-xs">
              Thank you! Check your email for confirmation. Our team will hold your items and have them ready at your selected time. Remember to bring a valid photo ID (21+).
            </p>
            <button onClick={reset} className="btn-primary justify-center btn-pulse">
              BACK TO MENU
            </button>
          </div>
        )}
      </div>
    </>
  )
}
