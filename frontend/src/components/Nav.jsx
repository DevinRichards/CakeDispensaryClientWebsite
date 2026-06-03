import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

/** Avatar/dropdown shown when a customer is signed in */
function AccountMenu({ user, signOut, mobile = false }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const initial = (user?.name || 'C').charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={menuRef} className={`relative ${mobile ? 'py-2' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border border-white/10 bg-surface-container transition-all hover:border-primary/40 ${
          mobile ? 'w-full justify-between px-4 py-3' : 'px-3 py-1.5'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-on-primary">
          {initial}
        </span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">
          {mobile ? 'Profile' : (user?.name?.split(' ')[0] || 'Account')}
        </span>
        <span
          className={`material-symbols-outlined text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ fontSize: 16 }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className={`${
            mobile ? 'mt-2 w-full' : 'absolute right-0 mt-2 w-64'
          } z-50 overflow-hidden rounded-2xl border border-white/10 bg-surface-container shadow-2xl`}
        >
          <div className="border-b border-white/5 bg-surface-container-low px-5 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">
              Signed In
            </p>
            <p className="mt-0.5 truncate font-headline text-lg font-black">
              {user?.name || 'Cake Member'}
            </p>
            <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
          </div>

          <div className="p-2">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>person</span>
              My Profile & Orders
            </Link>
          </div>

          <div className="border-t border-white/5 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); void signOut() }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Nav() {
  const { count, toggleCart } = useCart()
  const { user, isSignedIn, signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navClass = ({ isActive }) =>
    `font-headline tracking-tight text-sm transition-colors ${
      isActive ? 'text-primary border-b border-primary pb-0.5' : 'text-on-surface-variant hover:text-secondary'
    }`

  const mobileNavClass = ({ isActive }) =>
    `block font-headline tracking-tight text-sm transition-colors ${
      isActive ? 'text-primary' : 'text-on-surface-variant hover:text-secondary'
    }`

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0e0e10]/95 backdrop-blur-xl shadow-lg' : 'bg-[#0e0e10]/80 backdrop-blur-xl'
      }`}
    >
      <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl font-black tracking-tighter text-primary font-headline neon-glow-pink">
              Cake
            </span>
            <span className="text-xs font-label text-on-surface-variant uppercase tracking-[0.2em] mt-1">
              Dispensary
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-6 items-center">
            <NavLink to="/" end className={navClass}>Home</NavLink>
            <NavLink to="/menu" className={navClass}>Menu</NavLink>
            <NavLink to="/deals" className={navClass}>Deals</NavLink>
            <NavLink to="/about" className={navClass}>About</NavLink>
            <NavLink to="/faq" className={navClass}>FAQ</NavLink>
            <NavLink to="/contact" className={navClass}>Contact</NavLink>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative p-2 text-on-surface-variant hover:bg-white/5 hover:text-primary transition-all rounded-full"
            aria-label="Open cart"
          >
            <span className="material-symbols-outlined">shopping_basket</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[9px] font-black rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <AccountMenu user={user} signOut={signOut} />
            ) : CLERK_ENABLED ? (
              <>
                <Link
                  to="/signin"
                  className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signin?mode=sign-up"
                  className="btn-primary text-xs py-2 px-4"
                >
                  Sign Up
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:bg-white/5 hover:text-primary transition-all rounded-full"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-container-low border-t border-white/5 px-6 py-5 space-y-4 animate-fade-in-up">
          <NavLink to="/" end className={mobileNavClass}>Home</NavLink>
          <NavLink to="/menu" className={mobileNavClass}>Menu</NavLink>
          <NavLink to="/deals" className={mobileNavClass}>Deals</NavLink>
          <NavLink to="/about" className={mobileNavClass}>About</NavLink>
          <NavLink to="/faq" className={mobileNavClass}>FAQ</NavLink>
          <NavLink to="/contact" className={mobileNavClass}>Contact</NavLink>

          <div className="pt-2 border-t border-white/5 space-y-3">
            {isSignedIn ? (
              <AccountMenu user={user} signOut={signOut} mobile />
            ) : CLERK_ENABLED ? (
              <>
                <Link to="/signin" className={mobileNavClass({ isActive: false })}>Sign In</Link>
                <Link to="/signin?mode=sign-up" className={mobileNavClass({ isActive: false })}>Sign Up</Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </nav>
  )
}
