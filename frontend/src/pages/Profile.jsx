import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import usePageTitle from '../hooks/usePageTitle'
import { formatCurrency } from '../utils/pricing'

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMemberSince(value) {
  if (!value) return 'Just joined'
  return new Date(value).toLocaleDateString([], { month: 'long', year: 'numeric' })
}

const STATUS_STYLES = {
  pending:   { bg: 'bg-tertiary/20 text-tertiary',   icon: 'pending',       label: 'Pending'   },
  confirmed: { bg: 'bg-secondary/20 text-secondary', icon: 'check_circle',  label: 'Confirmed' },
  cancelled: { bg: 'bg-error/20 text-error',         icon: 'cancel',        label: 'Cancelled' },
  completed: { bg: 'bg-primary/20 text-primary',     icon: 'task_alt',      label: 'Completed' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded ${s.bg}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{s.icon}</span>
      {s.label}
    </span>
  )
}

function LiveStatusBanner({ reservation }) {
  if (!reservation || !['pending', 'confirmed'].includes(reservation.status)) return null

  const isPending = reservation.status === 'pending'
  return (
    <div className={`card p-5 border ${isPending ? 'border-tertiary/30' : 'border-secondary/30'} mb-8`}>
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-2xl ${isPending ? 'text-tertiary' : 'text-secondary'}`}>
          {isPending ? 'schedule' : 'check_circle'}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-headline font-bold text-sm ${isPending ? 'text-tertiary' : 'text-secondary'}`}>
            {isPending ? 'Order pending staff confirmation' : 'Order confirmed — see you soon!'}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            Pickup {reservation.pickupTime} on {reservation.pickupDate} · {reservation.items?.length ?? 0} item{reservation.items?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>
    </div>
  )
}

export default function Profile() {
  usePageTitle('My Account')
  const { user, reservations, syncError, isSignedIn, loading, signOut } = useUser()
  const { addItem, setQty, clearCart, openCart } = useCart()
  const navigate = useNavigate()

  const orderAgain = (reservation) => {
    clearCart()
    reservation.items?.forEach((item) => {
      const id = item.id || item.productId || `${item.name}__${item.variant || ''}`
      addItem({
        id,
        name: item.name,
        price: item.price ?? item.recreationalPrice ?? 0,
        medicalPrice: item.medicalPrice ?? item.price ?? 0,
        recreationalPrice: item.recreationalPrice ?? item.price ?? 0,
        variant: item.variant || null,
        category: item.category || 'flower',
        gramsPerUnit: item.gramsPerUnit || null,
        thcMg: item.thcMg || null,
      })
      const qty = Number(item.qty) || 1
      if (qty > 1) setQty(id, qty)
    })
    openCart()
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card p-10 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-5xl text-primary mb-4 block">person</span>
          <h1 className="font-headline text-3xl font-black mb-3">Your Profile</h1>
          <p className="text-on-surface-variant mb-8 text-sm">
            Sign in to view your pickup history and reorder your favourites.
          </p>
          <Link
            to="/signin"
            className="btn-primary inline-flex justify-center px-8 py-4"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16">
        <div className="h-8 bg-surface-container rounded w-48 mb-4 animate-pulse" />
        <div className="h-4 bg-surface-container rounded w-64 animate-pulse" />
      </div>
    )
  }

  // Find the most recent active order for the live status banner
  const activeOrder = reservations.find((r) => r.status === 'pending' || r.status === 'confirmed')

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
        <div>
          <span className="font-label uppercase tracking-widest text-xs font-bold text-primary block mb-3">
            Member Profile
          </span>
          <h1 className="font-headline text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9]">
            {user.name}
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-xl">
            Your account details and pickup history are linked to your Cake login.
          </p>
        </div>
        <div className="flex gap-3 self-start lg:self-auto">
          <Link
            to="/menu"
            className="btn-outline py-3 px-5 text-xs"
          >
            New Order
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn-outline py-3 px-5 text-xs text-error border-error/30 hover:bg-error/10"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Live status banner for most recent active order */}
      <LiveStatusBanner reservation={activeOrder} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar — account info */}
        <div className="lg:col-span-4">
          <div className="card p-8 space-y-6">
            <div>
              <p className="font-label uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-2">
                Contact
              </p>
              <p className="font-bold">{user.email}</p>
              {user.phone && (
                <p className="text-on-surface-variant text-sm mt-1">{user.phone}</p>
              )}
            </div>

            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-label uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">
                Member Since
              </p>
              <p className="font-headline font-black text-lg tracking-tight">
                {formatMemberSince(user.createdAt)}
              </p>
            </div>

            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-label uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">
                Total Orders
              </p>
              <p className="font-headline font-black text-2xl text-primary">
                {reservations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Main — order history */}
        <div className="lg:col-span-8">
          <div className="card p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <p className="font-label uppercase tracking-widest text-[10px] font-bold text-primary mb-2">
                  Past Orders
                </p>
                <h2 className="font-headline text-2xl font-black tracking-tight">
                  Recent Pickup History
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant">
                Orders linked to your account
              </p>
            </div>

            {syncError && (
              <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl px-4 py-3 text-sm text-tertiary mb-5">
                {syncError}
              </div>
            )}

            {reservations.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl block mb-3 text-on-surface-variant/20">
                  receipt_long
                </span>
                <p className="font-headline font-bold">No orders yet</p>
                <p className="text-sm mt-1">Place your first pickup reservation to see it here.</p>
                <Link to="/menu" className="btn-primary inline-flex mt-5 px-6 py-3 text-sm">
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((r) => {
                  const totalRec = (r.items || []).reduce(
                    (sum, item) => sum + (item.recreationalPrice ?? item.price ?? 0) * (item.qty || 1),
                    0
                  )
                  const totalMed = (r.items || []).reduce(
                    (sum, item) => sum + (item.medicalPrice ?? item.price ?? 0) * (item.qty || 1),
                    0
                  )

                  return (
                    <div key={r.id} className="border border-white/5 rounded-2xl p-6 bg-surface-container">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        {/* Left — items */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-widest">
                              {formatDate(r.createdAt)}
                            </p>
                            <StatusBadge status={r.status} />
                            {r.pickupDate && (
                              <span className="text-[10px] font-label text-on-surface-variant/40">
                                {r.pickupTime} · {r.pickupDate}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 mt-3">
                            {(r.items || []).map((item, i) => (
                              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-on-surface-variant">
                                  {item.name}
                                  {item.variant ? ` (${item.variant})` : ''}
                                  <span className="text-on-surface-variant/40 ml-1">× {item.qty}</span>
                                </span>
                                <span className="font-bold shrink-0">
                                  {formatCurrency((item.recreationalPrice ?? item.price ?? 0) * (item.qty || 1))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right — total + CTA */}
                        <div className="shrink-0 min-w-[160px] rounded-xl bg-surface-container-high p-4">
                          <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-1">
                            Total (Rec)
                          </p>
                          <p className="font-headline font-black text-xl text-secondary mb-0.5">
                            {formatCurrency(totalRec)}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/40 font-label mb-4">
                            Med {formatCurrency(totalMed)}
                          </p>
                          <button
                            type="button"
                            onClick={() => orderAgain(r)}
                            disabled={!r.items?.length}
                            className="w-full btn-primary text-xs py-2.5 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>replay</span>
                            Order Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
