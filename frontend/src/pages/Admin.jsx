import { useState, useEffect, useCallback, useMemo } from 'react'
import { SignIn, UserButton, useUser, useClerk } from '@clerk/react'
import {
  ADMIN_TOKEN_KEY,
  adminLogin,
  getAdminStats,
  getReservations,
  updateReservation,
  getContacts,
  markContactRead,
  getBiotrackStatus,
  getAdminMenu,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  previewMenuSpreadsheetImport,
  applyMenuSpreadsheetImport,
} from '../api'
import usePageTitle from '../hooks/usePageTitle'
import { formatCurrency, getCartPriceTotals, getLinePrices } from '../utils/pricing'

const STATUS_COLORS = {
  pending: 'bg-tertiary/20 text-tertiary',
  confirmed: 'bg-secondary/20 text-secondary',
  cancelled: 'bg-error/20 text-error',
  completed: 'bg-primary/20 text-primary',
}

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function ClerkAdminGate() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [verifying, setVerifying] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setVerifying(false)
      return
    }
    // Verify the signed-in user is on the admin allowlist by calling a protected endpoint
    getAdminStats()
      .then(() => setVerifying(false))
      .catch((err) => {
        if (err.message === 'Forbidden' || String(err.message).toLowerCase().includes('forbidden')) {
          setAccessDenied(true)
        }
        setVerifying(false)
      })
  }, [isLoaded, isSignedIn])

  if (!isLoaded || (isSignedIn && verifying)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-on-surface-variant text-sm">Verifying staff credentials...</p>
      </div>
    )
  }

  if (isSignedIn && accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <span className="material-symbols-outlined text-error block mb-4" style={{ fontSize: 56 }}>block</span>
          <h2 className="text-2xl font-headline font-black mb-2">Access Denied</h2>
          <p className="text-on-surface-variant font-body text-sm mb-2">
            <strong>{user?.primaryEmailAddress?.emailAddress}</strong> is not on the staff access list.
          </p>
          <p className="text-on-surface-variant/60 font-body text-xs mb-6">
            Contact the store owner to be added as an authorized staff member.
          </p>
          <button
            onClick={() => signOut()}
            className="btn-outline py-2 px-6 text-sm text-error border-error/30 hover:bg-error/10"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-3xl font-black text-primary font-headline neon-glow-pink">Cake</span>
            <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest mt-1">Staff Admin Sign-In</p>
          </div>
          <div className="card p-6">
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
    )
  }

  return <AdminDashboard authMode="clerk" />
}

export default function Admin() {
  if (CLERK_ENABLED) return <ClerkAdminGate />
  return <AdminDashboard authMode="legacy" />
}

function AdminDashboard({ authMode = 'legacy' }) {
  usePageTitle('Admin Dashboard')
  const isClerkMode = authMode === 'clerk'
  const [token, setToken] = useState(() => (isClerkMode ? 'clerk-session' : sessionStorage.getItem(ADMIN_TOKEN_KEY)))
  const [loginForm, setLoginForm] = useState({ password: '' })
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('reservations')
  const [stats, setStats] = useState(null)
  const [biotrackStatus, setBiotrackStatus] = useState(null)
  const [reservations, setReservations] = useState([])
  const [contacts, setContacts] = useState([])
  const [menuProducts, setMenuProducts] = useState([])
  const [menuSearch, setMenuSearch] = useState('')
  const [menuCategory, setMenuCategory] = useState('all')
  const [menuVisibility, setMenuVisibility] = useState('all')
  const [menuSort, setMenuSort] = useState('default')
  const [menuDrafts, setMenuDrafts] = useState({})
  const [unmatchedPricing, setUnmatchedPricing] = useState({ generatedAt: null, count: 0, items: [] })
  const [importPreview, setImportPreview] = useState(null)
  const [importCsv, setImportCsv] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuSaving, setMenuSaving] = useState({})
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'flower',
    type: '',
    medicalPrice: '',
    recreationalPrice: '',
    description: '',
    imageUrl: '',
    available: true,
  })
  const [resFilter, setResFilter] = useState('today')
  const [resSearch, setResSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Substitution form state ──────────────────────────────────────────────
  // openSubForms: Set of `${resId}_${itemIndex}` keys for open forms
  const [openSubForms, setOpenSubForms] = useState(new Set())
  // subForms: { [`${resId}_${itemIndex}`]: { substituteWith, reason } }
  const [subForms, setSubForms] = useState({})
  const [subLoading, setSubLoading] = useState({})

  const isLoggedIn = !!token

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [s, res, con] = await Promise.all([
        getAdminStats(),
        getReservations(resFilter !== 'all' ? resFilter : undefined),
        getContacts(),
      ])
      setStats(s)
      setReservations(res)
      setContacts(con)
    } catch {
      // token may be expired
    } finally {
      setLoading(false)
    }
  }, [token, resFilter])

  useEffect(() => {
    if (isLoggedIn) loadData()
  }, [isLoggedIn, loadData])

  useEffect(() => {
    if (!isLoggedIn) return undefined
    const interval = window.setInterval(() => {
      loadData()
    }, 30000)
    return () => window.clearInterval(interval)
  }, [isLoggedIn, loadData])

  useEffect(() => {
    if (token && activeTab === 'biotrack') {
      getBiotrackStatus()
        .then(setBiotrackStatus)
        .catch(() => setBiotrackStatus({ connected: false, error: 'Request failed' }))
    }
  }, [token, activeTab])

  const loadMenuData = useCallback(async () => {
    if (!token) return
    setMenuLoading(true)
    try {
      const data = await getAdminMenu()
      const products = data.products || []
      setMenuProducts(products)
      setUnmatchedPricing(data.unmatchedPricing || { generatedAt: null, count: 0, items: [] })
      setMenuDrafts(Object.fromEntries(products.map((product) => [
        product.id,
        {
          price: product.price ?? '',
          medicalPrice: product.medicalPrice ?? product.price ?? '',
          recreationalPrice: product.recreationalPrice ?? product.price ?? '',
          name: product.name || '',
          type: product.type || '',
          category: product.category || 'flower',
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          available: product.available !== false,
          variantPrices: Object.fromEntries((product.variants || []).map((variant) => [variant.size, variant.price ?? ''])),
          variantMedicalPrices: Object.fromEntries((product.variants || []).map((variant) => [variant.size, variant.medicalPrice ?? variant.price ?? ''])),
          variantRecreationalPrices: Object.fromEntries((product.variants || []).map((variant) => [variant.size, variant.recreationalPrice ?? variant.price ?? ''])),
        },
      ])))
    } catch (err) {
      alert(err.message || 'Failed to load menu')
    } finally {
      setMenuLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token && activeTab === 'menu') loadMenuData()
  }, [token, activeTab, loadMenuData])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    try {
      const data = await adminLogin(loginForm.password)
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      setToken(data.token)
    } catch (err) {
      setLoginError(err.message || 'Invalid password')
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = () => {
    if (isClerkMode) return
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
    setStats(null)
    setReservations([])
    setContacts([])
  }

  const updateStatus = async (id, status) => {
    try {
      await updateReservation(id, { status })
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch (err) {
      alert(err.message || 'Update failed')
    }
  }

  const readContact = async (id) => {
    try {
      await markContactRead(id)
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, read: true } : c)))
    } catch {}
  }

  const updateMenuDraft = (id, patch) => {
    setMenuDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
  }

  const updateVariantPrice = (id, size, price) => {
    setMenuDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        variantPrices: { ...((prev[id] || {}).variantPrices || {}), [size]: price },
        variantMedicalPrices: { ...((prev[id] || {}).variantMedicalPrices || {}), [size]: price },
        variantRecreationalPrices: { ...((prev[id] || {}).variantRecreationalPrices || {}), [size]: price },
      },
    }))
  }

  const updateVariantMedRecPrice = (id, size, field, price) => {
    const key = field === 'medical' ? 'variantMedicalPrices' : 'variantRecreationalPrices'
    setMenuDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: {
          ...((prev[id] || {})[key] || {}),
          [size]: price,
        },
      },
    }))
  }

  const saveMenuProduct = async (id) => {
    const draft = menuDrafts[id] || {}
    const variantOverrides = Object.fromEntries(
      [...new Set([
        ...Object.keys(draft.variantPrices || {}),
        ...Object.keys(draft.variantMedicalPrices || {}),
        ...Object.keys(draft.variantRecreationalPrices || {}),
      ])].map((size) => {
        const medicalPrice = (draft.variantMedicalPrices || {})[size]
        const recreationalPrice = (draft.variantRecreationalPrices || {})[size]
        const price = (draft.variantPrices || {})[size] || recreationalPrice || medicalPrice
        return [
          size,
          {
            price: price === '' ? '' : Number(price),
            medicalPrice: medicalPrice === '' ? '' : Number(medicalPrice),
            recreationalPrice: recreationalPrice === '' ? '' : Number(recreationalPrice),
          },
        ]
      })
    )
    setMenuSaving((prev) => ({ ...prev, [id]: true }))
    try {
      await updateAdminProduct(id, {
        ...draft,
        price: (draft.price || draft.recreationalPrice || draft.medicalPrice) === '' ? '' : Number(draft.price || draft.recreationalPrice || draft.medicalPrice),
        medicalPrice: draft.medicalPrice === '' ? '' : Number(draft.medicalPrice),
        recreationalPrice: draft.recreationalPrice === '' ? '' : Number(draft.recreationalPrice),
        variantOverrides,
      })
      await loadMenuData()
    } catch (err) {
      alert(err.message || 'Failed to save product')
    } finally {
      setMenuSaving((prev) => ({ ...prev, [id]: false }))
    }
  }

  const hideMenuProduct = async (id) => {
    if (!window.confirm('Hide this product from the website menu?')) return
    setMenuSaving((prev) => ({ ...prev, [id]: true }))
    try {
      await deleteAdminProduct(id)
      await loadMenuData()
    } catch (err) {
      alert(err.message || 'Failed to hide product')
    } finally {
      setMenuSaving((prev) => ({ ...prev, [id]: false }))
    }
  }

  const submitNewProduct = async (e) => {
    e.preventDefault()
    try {
      await createAdminProduct({
        ...newProduct,
        price: (newProduct.recreationalPrice || newProduct.medicalPrice) === '' ? '' : Number(newProduct.recreationalPrice || newProduct.medicalPrice),
        medicalPrice: newProduct.medicalPrice === '' ? '' : Number(newProduct.medicalPrice),
        recreationalPrice: newProduct.recreationalPrice === '' ? '' : Number(newProduct.recreationalPrice),
      })
      setNewProduct({
        name: '',
        category: 'flower',
        type: '',
        medicalPrice: '',
        recreationalPrice: '',
        description: '',
        imageUrl: '',
        available: true,
      })
      await loadMenuData()
    } catch (err) {
      alert(err.message || 'Failed to create product')
    }
  }

  const previewSpreadsheetImport = async (file) => {
    if (!file) return
    setImportLoading(true)
    setImportPreview(null)
    try {
      const csv = await file.text()
      setImportCsv(csv)
      setImportPreview(await previewMenuSpreadsheetImport(csv))
    } catch (err) {
      alert(err.message || 'Failed to preview spreadsheet import')
    } finally {
      setImportLoading(false)
    }
  }

  const applySpreadsheetImport = async () => {
    if (!importCsv || !importPreview) return
    if (!window.confirm(`Apply ${importPreview.changeCount || 0} spreadsheet price change(s) to the menu?`)) return
    setImportLoading(true)
    try {
      const result = await applyMenuSpreadsheetImport(importCsv, importPreview.changes || [])
      setImportPreview(result)
      await loadMenuData()
    } catch (err) {
      alert(err.message || 'Failed to apply spreadsheet import')
    } finally {
      setImportLoading(false)
    }
  }

  // ── Substitution helpers ─────────────────────────────────────────────────

  const toggleSubForm = (key, existingSub) => {
    setOpenSubForms((prev) => {
      const s = new Set(prev)
      if (s.has(key)) {
        s.delete(key)
      } else {
        s.add(key)
        // Pre-fill with existing substitution values if editing
        if (existingSub) {
          setSubForms((f) => ({
            ...f,
            [key]: { substituteWith: existingSub.substituteWith || '', reason: existingSub.reason || '' },
          }))
        }
      }
      return s
    })
  }

  const submitSubstitution = async (resId, itemIndex, originalName) => {
    const key = `${resId}_${itemIndex}`
    const form = subForms[key] || { substituteWith: '', reason: '' }
    if (!form.substituteWith.trim()) return

    setSubLoading((prev) => ({ ...prev, [key]: true }))
    try {
      await updateReservation(resId, {
        substitution: {
          itemIndex,
          originalName,
          substituteWith: form.substituteWith.trim(),
          reason: form.reason.trim(),
        },
      })
      // Update local reservation substitutions array
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id !== resId) return r
          const subs = [...(r.substitutions || [])]
          const existingIdx = subs.findIndex((s) => s.itemIndex === itemIndex)
          const newSub = {
            itemIndex,
            originalName,
            substituteWith: form.substituteWith.trim(),
            reason: form.reason.trim(),
          }
          if (existingIdx >= 0) subs[existingIdx] = newSub
          else subs.push(newSub)
          return { ...r, substitutions: subs }
        })
      )
      // Close form
      setOpenSubForms((prev) => {
        const s = new Set(prev)
        s.delete(key)
        return s
      })
    } catch (err) {
      alert(err.message || 'Substitution failed')
    } finally {
      setSubLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  // ── Login screen ─────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-3xl font-black text-primary font-headline neon-glow-pink">Cake</span>
            <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest mt-1">Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="card p-8 space-y-5">
            <div>
              <label className="label">Admin Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ password: e.target.value })}
                placeholder="Enter admin password"
                className="input-field"
              />
            </div>
            {loginError && (
              <div className="bg-error-container/30 border border-error/30 rounded-lg p-3 text-sm text-error font-body">{loginError}</div>
            )}
            <button type="submit" disabled={loginLoading} className="w-full btn-primary justify-center py-4 btn-pulse">
              {loginLoading ? 'Authenticating...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const unreadCount = contacts.filter((c) => !c.read).length
  const pendingReservations = reservations.filter((r) => r.status === 'pending')
  const latestPendingReservation = [...pendingReservations].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]

  // ── Derived reservation list (filter + search + sort) ─────────────────────
  const todayStr = new Date().toISOString().slice(0, 10)

  const parsePickupMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [time, ampm] = timeStr.split(' ')
    const [h, m] = time.split(':').map(Number)
    const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h
    return hour24 * 60 + (m || 0)
  }

  const displayReservations = useMemo(() => {
    let list = [...reservations]

    // Status / date filter
    if (resFilter === 'today') {
      list = list.filter((r) => r.pickupDate === todayStr)
    } else if (resFilter !== 'all') {
      list = list.filter((r) => r.status === resFilter)
    }

    // Name / phone / email search
    const q = resSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          r.email?.toLowerCase().includes(q)
      )
    }

    // Sort: today/pending/confirmed → chronological by pickup; otherwise newest first
    if (resFilter === 'today' || resFilter === 'pending' || resFilter === 'confirmed') {
      list.sort((a, b) => {
        const dateCompare = a.pickupDate.localeCompare(b.pickupDate)
        if (dateCompare !== 0) return dateCompare
        return parsePickupMinutes(a.pickupTime) - parsePickupMinutes(b.pickupTime)
      })
    }

    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, resFilter, resSearch, todayStr])

  const menuCategories = ['all', 'flower', 'edibles', 'drinks', 'concentrates', 'vapes', 'prerolls', 'topicals']
  const displayMenuProducts = useMemo(() => {
    const q = menuSearch.trim().toLowerCase()
    return menuProducts
      .filter((product) => menuCategory === 'all' || product.category === menuCategory)
      .filter((product) => {
        if (!q) return true
        return (
          product.name?.toLowerCase().includes(q) ||
          product.type?.toLowerCase().includes(q) ||
          product.id?.toLowerCase().includes(q)
        )
      })
      .filter((product) => {
        if (menuVisibility === 'public') return product.publicMenuVisible
        if (menuVisibility === 'hidden') return product.hidden
        if (menuVisibility === 'review') return product.needsPricingReview
        return true
      })
      .sort((a, b) => {
        if (menuSort === 'name') return a.name.localeCompare(b.name)
        if (menuSort === 'price-asc') return (a.price ?? -1) - (b.price ?? -1)
        if (menuSort === 'price-desc') return (b.price ?? -1) - (a.price ?? -1)
        if (menuSort === 'category') {
          if (a.category !== b.category) return a.category.localeCompare(b.category)
          return a.name.localeCompare(b.name)
        }
        // default: needs-review first, then missing price, then category+name
        if (a.needsPricingReview !== b.needsPricingReview) return a.needsPricingReview ? -1 : 1
        if (a.missingPrice !== b.missingPrice) return a.missingPrice ? -1 : 1
        if (a.category !== b.category) return a.category.localeCompare(b.category)
        return a.name.localeCompare(b.name)
      })
  }, [menuProducts, menuSearch, menuCategory, menuVisibility, menuSort])

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 py-10">
      {/* Admin header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-headline font-black">Admin Dashboard</h1>
          <p className="text-on-surface-variant text-xs font-label mt-1">Cake Dispensary — Internal Portal</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn-outline py-2 px-4 text-xs gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            Refresh
          </button>
          {isClerkMode ? (
            <div className="flex items-center gap-3 rounded-full border border-white/10 px-3 py-2">
              <span className="text-xs font-label text-on-surface-variant">Staff</span>
              <UserButton afterSignOutUrl="/admin" />
            </div>
          ) : (
            <button onClick={logout} className="btn-outline py-2 px-4 text-xs gap-2 text-error border-error/30 hover:bg-error/10">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Reservations', value: stats.reservations?.total ?? '—', icon: 'shopping_basket', color: 'text-primary' },
            { label: 'Pending', value: stats.reservations?.pending ?? '—', icon: 'pending', color: 'text-tertiary' },
            { label: 'Confirmed', value: stats.reservations?.confirmed ?? '—', icon: 'check_circle', color: 'text-secondary' },
            { label: 'Unread Messages', value: stats.contacts?.unread ?? '—', icon: 'mark_email_unread', color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <span className={`material-symbols-outlined text-2xl mb-2 block ${s.color}`}>{s.icon}</span>
              <p className="text-2xl font-headline font-black">{s.value}</p>
              <p className="text-xs font-label text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {pendingReservations.length > 0 && (
        <button
          onClick={() => { setActiveTab('reservations'); setResFilter('pending') }}
          className="w-full mb-8 card p-5 text-left border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-colors"
          role="alert"
        >
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: 32 }}>notifications_active</span>
            <div className="flex-1">
              <p className="font-headline font-black text-primary">
                {pendingReservations.length} pickup order{pendingReservations.length !== 1 ? 's' : ''} need staff review
              </p>
              {latestPendingReservation && (
                <p className="text-xs text-on-surface-variant font-body mt-1">
                  Latest: {latestPendingReservation.name} for {latestPendingReservation.pickupDate} at {latestPendingReservation.pickupTime}
                </p>
              )}
            </div>
            <span className="text-xs font-label uppercase tracking-widest text-primary">View Orders</span>
          </div>
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/5 pb-0 overflow-x-auto">
        {[
          { key: 'reservations', label: `Reservations${pendingReservations.length > 0 ? ` (${pendingReservations.length})` : ''}`, icon: 'shopping_basket' },
          { key: 'menu', label: 'Menu', icon: 'restaurant_menu' },
          { key: 'messages', label: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: 'mail' },
          { key: 'biotrack', label: 'Biotrack Status', icon: 'point_of_sale' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 font-headline font-bold text-xs uppercase tracking-wide transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── RESERVATIONS TAB ── */}
      {activeTab === 'reservations' && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Search by name, phone, or email…"
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
              className="input-field pl-9 text-sm"
            />
            {resSearch && (
              <button
                onClick={() => setResSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'today', label: 'Today', icon: 'today' },
              { key: 'all', label: 'All', icon: null },
              { key: 'pending', label: 'Pending', icon: null },
              { key: 'confirmed', label: 'Confirmed', icon: null },
              { key: 'cancelled', label: 'Cancelled', icon: null },
              { key: 'completed', label: 'Completed', icon: null },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setResFilter(f.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-headline font-bold uppercase transition-all ${
                  resFilter === f.key
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f.icon && <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{f.icon}</span>}
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayReservations.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-on-surface-variant/20 block mb-3" style={{ fontSize: 56 }}>receipt_long</span>
              <p className="font-headline font-bold">
                {resSearch ? 'No results for that search' : resFilter === 'today' ? 'No pickups scheduled today' : 'No reservations found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayReservations.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-headline font-bold">{r.name}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || 'bg-surface-container text-on-surface-variant'}`}>
                          {r.status}
                        </span>
                        {r.biotrackOrderId && (
                          <span className="text-[9px] font-label text-on-surface-variant/40 uppercase tracking-widest">
                            Biotrack: {r.biotrackOrderId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-body mb-2">{r.email} · {r.phone}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 15 }}>schedule</span>
                        <span className="font-headline font-bold text-sm text-primary">
                          {r.pickupTime}
                        </span>
                        <span className="text-xs text-on-surface-variant/50 font-label">
                          {r.pickupDate === todayStr ? 'Today' : r.pickupDate}
                        </span>
                      </div>

                      {/* Items with per-item substitution UI */}
                      <div className="mt-3 space-y-2">
                        {(r.items || []).map((item, i) => {
                          const key = `${r.id}_${i}`
                          const existingSub = (r.substitutions || []).find((s) => s.itemIndex === i)
                          const isFormOpen = openSubForms.has(key)
                          const formData = subForms[key] || { substituteWith: '', reason: '' }
                          const canSubstitute = r.status === 'pending' || r.status === 'confirmed'

                          return (
                            <div key={i}>
                              {/* Item row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-label bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                                  {item.qty}× {item.name}{item.variant ? ` (${item.variant})` : ''} — Rec {formatCurrency(getLinePrices(item).recreational)}
                                </span>

                                {/* Substitution badge */}
                                {existingSub && (
                                  <span className="text-[10px] font-label bg-tertiary/15 text-tertiary px-2 py-0.5 rounded flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>swap_horiz</span>
                                    {existingSub.substituteWith}
                                    {existingSub.reason && (
                                      <span className="text-tertiary/60 ml-1">· {existingSub.reason}</span>
                                    )}
                                  </span>
                                )}

                                {/* Toggle substitute form */}
                                {canSubstitute && !isFormOpen && (
                                  <button
                                    onClick={() => toggleSubForm(key, existingSub)}
                                    className="text-[10px] font-label text-on-surface-variant/40 hover:text-primary transition-colors underline underline-offset-2"
                                  >
                                    {existingSub ? 'Edit sub' : '+ Substitute'}
                                  </button>
                                )}
                              </div>

                              {/* Inline substitution form */}
                              {isFormOpen && (
                                <div className="mt-2 ml-2 pl-3 border-l-2 border-primary/20 space-y-2">
                                  <input
                                    placeholder="Substitute with (e.g. Blue Dream 3.5g)"
                                    value={formData.substituteWith}
                                    onChange={(e) =>
                                      setSubForms((f) => ({ ...f, [key]: { ...formData, substituteWith: e.target.value } }))
                                    }
                                    className="input-field text-xs py-1.5"
                                  />
                                  <input
                                    placeholder="Reason (optional)"
                                    value={formData.reason}
                                    onChange={(e) =>
                                      setSubForms((f) => ({ ...f, [key]: { ...formData, reason: e.target.value } }))
                                    }
                                    className="input-field text-xs py-1.5"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => submitSubstitution(r.id, i, item.name)}
                                      disabled={subLoading[key] || !formData.substituteWith.trim()}
                                      className="text-xs btn-primary py-1 px-3 disabled:opacity-40"
                                    >
                                      {subLoading[key] ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => toggleSubForm(key)}
                                      className="text-xs btn-outline py-1 px-3"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Note */}
                      {r.note && (
                        <p className="text-xs font-body text-on-surface-variant/60 mt-2 italic">Note: {r.note}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-secondary font-headline font-bold mb-3">
                        Rec {formatCurrency(getCartPriceTotals(r.items || []).recreational)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/40 font-label -mt-2 mb-3">
                        Med {formatCurrency(getCartPriceTotals(r.items || []).medical)}
                      </p>
                      <div className="flex gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, 'confirmed')}
                              className="text-xs btn-primary py-1.5 px-3"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'cancelled')}
                              className="text-xs btn-outline py-1.5 px-3 text-error border-error/30 hover:bg-error/10"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(r.id, 'completed')}
                            className="text-xs btn-primary py-1.5 px-3"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] font-label text-on-surface-variant/30 mt-3">
                    Submitted {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MENU TAB ── */}
      {activeTab === 'menu' && (
        <div className="space-y-8">
          <div className="card p-5 border border-tertiary/20">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-headline font-bold text-lg">BioTrack Items Needing Review</h2>
                <p className="text-xs text-on-surface-variant font-body mt-1">
                  Live BioTrack items that are not on the pricing spreadsheet stay hidden here until staff approves med/rec pricing, display details, and whether the item should be treated as bulk/weight-based.
                </p>
              </div>
              <span className="text-tertiary font-headline font-black text-2xl">{unmatchedPricing.count || 0}</span>
            </div>
            {(unmatchedPricing.items || []).length === 0 ? (
              <p className="text-xs text-on-surface-variant font-body">No BioTrack-only review items found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {(unmatchedPricing.items || []).slice(0, 80).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 bg-surface-container rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-headline font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-label uppercase">
                        {item.category} · {item.type || 'Product'} · {item.id}
                      </p>
                      {item.reviewReason && (
                        <p className="text-[10px] text-tertiary/80 font-label mt-0.5">
                          {item.reviewReason}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-label text-tertiary shrink-0">
                      {item.variants?.length ? `${item.variants.length} sizes` : item.currentPrice != null ? 'fallback price' : 'no price'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {unmatchedPricing.generatedAt && (
              <p className="text-[10px] text-on-surface-variant/30 font-label mt-3">
                Generated {new Date(unmatchedPricing.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="card p-5 border border-secondary/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-headline font-bold text-lg">Upload BioTrack Pricing Spreadsheet</h2>
                <p className="text-xs text-on-surface-variant font-body mt-1">
                  Upload a CSV export to preview medical and recreational price changes before staff applies them.
                </p>
              </div>
              <label className="btn-outline text-xs py-2 px-4 shrink-0 cursor-pointer">
                {importLoading ? 'Reading...' : 'Choose CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => previewSpreadsheetImport(e.target.files?.[0])}
                />
              </label>
            </div>

            {importPreview && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] font-label text-on-surface-variant/40 uppercase">Rows Read</p>
                    <p className="font-headline font-black text-xl">{importPreview.rowCount}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] font-label text-on-surface-variant/40 uppercase">Prices Parsed</p>
                    <p className="font-headline font-black text-xl">{importPreview.parsedPriceCount}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] font-label text-on-surface-variant/40 uppercase">Changes</p>
                    <p className="font-headline font-black text-xl text-secondary">{importPreview.changeCount}</p>
                  </div>
                </div>

                {(importPreview.changes || []).length > 0 && (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                    {importPreview.changes.slice(0, 120).map((change) => (
                      <div key={`${change.productId}-${change.size || 'base'}`} className="bg-surface-container rounded-lg px-3 py-2">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-headline font-bold truncate">
                              {change.productName}{change.size ? ` (${change.size})` : ''}
                            </p>
                            <p className="text-[10px] text-on-surface-variant/40 font-label truncate">{change.sourceProduct}</p>
                          </div>
                          <p className="text-xs font-label text-right shrink-0">
                            Med {formatCurrency(change.currentMedicalPrice)} → <span className="text-secondary">{formatCurrency(change.nextMedicalPrice)}</span>
                            <br />
                            Rec {formatCurrency(change.currentRecreationalPrice)} → <span className="text-secondary">{formatCurrency(change.nextRecreationalPrice)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={applySpreadsheetImport}
                  disabled={importLoading || !(importPreview.changes || []).length}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-40"
                >
                  {importPreview.appliedCount != null ? `Applied ${importPreview.appliedCount} Changes` : 'Approve & Apply Changes'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={submitNewProduct} className="card p-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-headline font-bold text-lg">Create Menu Item</h2>
                <p className="text-xs text-on-surface-variant font-body mt-1">
                  Adds a website-managed item for cases where NM Trace does not provide the menu record.
                </p>
              </div>
              <button type="submit" className="btn-primary text-xs py-2 px-4 shrink-0">
                Add Product
              </button>
            </div>
            <div className="grid md:grid-cols-5 gap-3">
              <input
                required
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                className="input-field text-sm"
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field text-sm"
              >
                {menuCategories.filter((cat) => cat !== 'all').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                placeholder="Type / format"
                value={newProduct.type}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, type: e.target.value }))}
                className="input-field text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Medical price"
                value={newProduct.medicalPrice}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, medicalPrice: e.target.value }))}
                className="input-field text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Recreational price"
                value={newProduct.recreationalPrice}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, recreationalPrice: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <input
                placeholder="Image URL"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, imageUrl: e.target.value }))}
                className="input-field text-sm"
              />
              <input
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </form>

          <div>
            <div className="flex flex-col gap-3 mb-5">
              {/* Row 1: search + sort + refresh */}
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" style={{ fontSize: 18 }}>search</span>
                  <input
                    type="text"
                    placeholder="Search menu items by name, type, or id..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="input-field pl-9 text-sm"
                  />
                  {menuSearch && (
                    <button onClick={() => setMenuSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container text-sm text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_vert</span>
                  <select
                    value={menuSort}
                    onChange={(e) => setMenuSort(e.target.value)}
                    className="bg-transparent border-none outline-none text-on-surface text-xs font-label"
                  >
                    <option value="default">Needs Review First</option>
                    <option value="name">Name A–Z</option>
                    <option value="category">Category + Name</option>
                    <option value="price-asc">Price Low–High</option>
                    <option value="price-desc">Price High–Low</option>
                  </select>
                </label>
                <button onClick={loadMenuData} className="btn-outline py-2 px-4 text-xs shrink-0">
                  Refresh Menu
                </button>
              </div>

              {/* Row 2: category chips */}
              <div className="flex gap-2 flex-wrap">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-headline font-bold uppercase transition-all ${
                      menuCategory === cat
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Row 3: visibility filter */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mr-1">Visibility:</span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'public', label: 'Public' },
                  { key: 'review', label: 'Needs Review' },
                  { key: 'hidden', label: 'Hidden' },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setMenuVisibility(v.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-headline font-bold uppercase transition-all ${
                      menuVisibility === v.key
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
                <span className="text-[10px] font-label text-on-surface-variant/40 ml-2">
                  {displayMenuProducts.length} item{displayMenuProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {menuLoading ? (
              <p className="text-on-surface-variant text-sm">Loading menu...</p>
            ) : displayMenuProducts.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-on-surface-variant/20 block mb-3" style={{ fontSize: 56 }}>restaurant_menu</span>
                <p className="font-headline font-bold">No menu items found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayMenuProducts.map((product) => {
                  const draft = menuDrafts[product.id] || {}
                  const isSaving = menuSaving[product.id]

                  return (
                    <div key={product.id} className={`card p-5 ${product.needsPricingReview ? 'border border-tertiary/25' : ''}`}>
                      <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                              {product.category}
                            </span>
                            {product.custom && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                                Website Item
                              </span>
                            )}
                            {product.missingPrice && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-tertiary/20 text-tertiary">
                                Missing Price
                              </span>
                            )}
                            {product.needsPricingReview && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-error/20 text-error">
                                Hidden Until Reviewed
                              </span>
                            )}
                            {product.needsPricingReview && product.missingSpreadsheetMatch && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-tertiary/20 text-tertiary">
                                Not In Spreadsheet
                              </span>
                            )}
                            {product.publicMenuVisible && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">
                                Public
                              </span>
                            )}
                          </div>
                          <input
                            value={draft.name ?? ''}
                            onChange={(e) => updateMenuDraft(product.id, { name: e.target.value })}
                            className="input-field text-sm font-headline font-bold mb-2"
                          />
                          <div className="grid md:grid-cols-3 gap-2">
                            <input
                              value={draft.type ?? ''}
                              onChange={(e) => updateMenuDraft(product.id, { type: e.target.value })}
                              placeholder="Type"
                              className="input-field text-xs"
                            />
                            <select
                              value={draft.category ?? product.category}
                              onChange={(e) => updateMenuDraft(product.id, { category: e.target.value })}
                              className="input-field text-xs"
                            >
                              {menuCategories.filter((cat) => cat !== 'all').map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <input
                              value={draft.imageUrl ?? ''}
                              onChange={(e) => updateMenuDraft(product.id, { imageUrl: e.target.value })}
                              placeholder="Image URL"
                              className="input-field text-xs"
                            />
                          </div>
                          <textarea
                            value={draft.description ?? ''}
                            onChange={(e) => updateMenuDraft(product.id, { description: e.target.value })}
                            placeholder="Description"
                            rows={2}
                            className="input-field text-xs mt-2 resize-none"
                          />
                          {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">
                                Size Prices
                              </p>
                              <div className="grid md:grid-cols-2 gap-2">
                                {product.variants.map((variant) => (
                                  <label key={variant.size} className="block">
                                    <span className="text-[10px] font-label text-on-surface-variant/50">{variant.size}</span>
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Medical"
                                        value={(draft.variantMedicalPrices || {})[variant.size] ?? ''}
                                        onChange={(e) => updateVariantMedRecPrice(product.id, variant.size, 'medical', e.target.value)}
                                        className="input-field text-xs"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Rec"
                                        value={(draft.variantRecreationalPrices || {})[variant.size] ?? ''}
                                        onChange={(e) => updateVariantMedRecPrice(product.id, variant.size, 'recreational', e.target.value)}
                                        className="input-field text-xs"
                                      />
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="xl:w-64 shrink-0 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="label">Medical Price</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.medicalPrice ?? ''}
                                onChange={(e) => updateMenuDraft(product.id, { medicalPrice: e.target.value })}
                                className="input-field"
                              />
                            </label>
                            <label className="block">
                              <span className="label">Rec Price</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.recreationalPrice ?? ''}
                                onChange={(e) => updateMenuDraft(product.id, { recreationalPrice: e.target.value })}
                                className="input-field"
                              />
                            </label>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-label text-on-surface-variant">
                            <input
                              type="checkbox"
                              checked={draft.available !== false}
                              onChange={(e) => updateMenuDraft(product.id, { available: e.target.checked })}
                              className="accent-[var(--color-primary)]"
                            />
                            Show as available
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveMenuProduct(product.id)}
                              disabled={isSaving}
                              className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => hideMenuProduct(product.id)}
                              disabled={isSaving}
                              className="btn-outline text-xs py-2 px-3 text-error border-error/30 hover:bg-error/10"
                            >
                              Hide
                            </button>
                          </div>
                          <p className="text-[10px] font-label text-on-surface-variant/30 break-all">
                            {product.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MESSAGES TAB ── */}
      {activeTab === 'messages' && (
        <div>
          {loading ? (
            <p className="text-on-surface-variant text-sm">Loading messages...</p>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-on-surface-variant/20 block mb-3" style={{ fontSize: 56 }}>mail</span>
              <p className="font-headline font-bold">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className={`card p-5 ${!c.read ? 'border border-primary/20' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-headline font-bold text-sm">{c.name}</h3>
                        {!c.read && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">New</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mb-1">{c.email} · {c.phone}</p>
                      <p className="text-xs font-label text-primary mb-3">Re: {c.subject}</p>
                      <p className="text-on-surface-variant font-body text-sm leading-relaxed">{c.message}</p>
                    </div>
                    {!c.read && (
                      <button onClick={() => readContact(c.id)} className="btn-outline text-xs py-1.5 px-3 shrink-0">
                        Mark Read
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-label text-on-surface-variant/30 mt-3">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BIOTRACK STATUS TAB ── */}
      {activeTab === 'biotrack' && (
        <div className="max-w-lg">
          {!biotrackStatus ? (
            <p className="text-on-surface-variant text-sm">Checking Biotrack connection...</p>
          ) : (
            <div className="card p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className={`material-symbols-outlined text-4xl ${biotrackStatus.connected ? 'text-secondary' : biotrackStatus.configured ? 'text-tertiary' : 'text-on-surface-variant/40'}`}>
                  {biotrackStatus.connected ? 'check_circle' : 'error'}
                </span>
                <div>
                  <h3 className="font-headline font-bold text-lg">
                    {biotrackStatus.connected
                      ? 'Connected to Biotrack'
                      : biotrackStatus.configured
                        ? 'Configured — Not Connected'
                        : 'Not Configured'}
                  </h3>
                  <p className="text-xs font-label text-on-surface-variant">
                    {biotrackStatus.connected
                      ? 'Live inventory sync active'
                      : 'Using local product data'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              {biotrackStatus.connected && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm py-2 border-b border-white/5">
                    <span className="text-on-surface-variant font-label">Products Synced</span>
                    <span className="font-headline font-bold text-secondary">{biotrackStatus.productCount ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-white/5">
                    <span className="text-on-surface-variant font-label">Data Source</span>
                    <span className="font-label text-on-surface-variant/60">Biotrack NM Seed-to-Sale</span>
                  </div>
                </div>
              )}

              {biotrackStatus.error && (
                <div className="bg-error-container/20 border border-error/20 rounded-lg p-4 text-sm text-error font-body mb-4">
                  {biotrackStatus.error}
                </div>
              )}

              {!biotrackStatus.connected && (
                <div className="bg-surface-container p-4 rounded-lg">
                  <p className="text-xs font-label text-on-surface-variant leading-relaxed mb-3">
                    To connect Biotrack, add the following variables to your backend <code className="text-primary">.env</code> file and restart the server:
                  </p>
                  <div className="space-y-1">
                    {[
                      'BIOTRACK_API_URL',
                      'BIOTRACK_LICENSE_NUMBER',
                      'BIOTRACK_USERNAME',
                      'BIOTRACK_PASSWORD',
                    ].map((v) => (
                      <p key={v} className="text-[11px] font-mono text-primary/80 bg-surface-container-high px-3 py-1.5 rounded">{v}=</p>
                    ))}
                  </div>
                  <p className="text-[11px] font-label text-on-surface-variant/80 leading-relaxed mt-3">
                    NM Trace uses the API-side <code className="text-primary">license_number</code> from your BioTrack account, which may be different from your public cannabis retail license.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
